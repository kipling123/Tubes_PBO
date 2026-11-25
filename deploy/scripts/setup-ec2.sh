#!/usr/bin/env bash
# Provision backend Django + Gunicorn + Nginx di Ubuntu 24.04 (EC2).
#
# Pemakaian di EC2:
#   sudo bash deploy/scripts/setup-ec2.sh
#
# Variabel opsional:
#   REPO_URL, BRANCH, APP_DIR, APP_USER, VENV_DIR, ENV_FILE
set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo "Jalankan dengan sudo: sudo bash $0"
  exit 1
fi

APP_USER="${APP_USER:-posapp}"
APP_DIR="${APP_DIR:-/opt/pos}"
VENV_DIR="${VENV_DIR:-/opt/pos/venv}"
ENV_DIR="${ENV_DIR:-/etc/pos}"
ENV_FILE="${ENV_FILE:-/etc/pos/backend.env}"
REPO_URL="${REPO_URL:-https://github.com/kipling123/Tubes_PBO.git}"
BRANCH="${BRANCH:-main}"
NGINX_SITE="${NGINX_SITE:-/etc/nginx/sites-available/pos.conf}"

export DEBIAN_FRONTEND=noninteractive

echo "==> Install paket sistem"
apt-get update
apt-get install -y python3 python3-venv python3-pip nginx git curl ca-certificates

echo "==> Pastikan user aplikasi ada: ${APP_USER}"
if ! id -u "${APP_USER}" >/dev/null 2>&1; then
  useradd --system --create-home --home-dir "/home/${APP_USER}" \
    --shell /usr/sbin/nologin "${APP_USER}"
fi

echo "==> Siapkan kode aplikasi di ${APP_DIR}"
if [[ ! -d "${APP_DIR}/.git" ]]; then
  mkdir -p "$(dirname "${APP_DIR}")"
  git clone --branch "${BRANCH}" "${REPO_URL}" "${APP_DIR}"
else
  git config --global --add safe.directory "${APP_DIR}" || true
  git -C "${APP_DIR}" fetch --all --prune
  git -C "${APP_DIR}" checkout "${BRANCH}"
  git -C "${APP_DIR}" pull --ff-only || true
fi

echo "==> Buat virtualenv dan install dependency"
python3 -m venv "${VENV_DIR}"
"${VENV_DIR}/bin/pip" install --upgrade pip
"${VENV_DIR}/bin/pip" install -r "${APP_DIR}/backend_django/requirements.txt"

echo "==> Siapkan environment file"
install -d -m 0750 -o "${APP_USER}" -g "${APP_USER}" "${ENV_DIR}"

# Ambil metadata EC2 dengan IMDSv2 (aman untuk http_tokens=required).
imds() {
  local path="$1" token
  token="$(curl -fsS --max-time 2 -X PUT \
    -H 'X-aws-ec2-metadata-token-ttl-seconds: 60' \
    http://169.254.169.254/latest/api/token || true)"
  if [[ -n "${token}" ]]; then
    curl -fsS --max-time 2 -H "X-aws-ec2-metadata-token: ${token}" \
      "http://169.254.169.254/latest/meta-data/${path}" || true
  else
    curl -fsS --max-time 2 \
      "http://169.254.169.254/latest/meta-data/${path}" || true
  fi
}

if [[ ! -f "${ENV_FILE}" ]]; then
  SECRET_KEY="$(python3 -c 'import secrets; print(secrets.token_urlsafe(50))')"
  PUBLIC_IP="$(imds public-ipv4)"

  # Launch Template infra/aws mengirim DNS ALB lewat DJANGO_ALLOWED_HOSTS.
  ALLOWED_HOSTS="${DJANGO_ALLOWED_HOSTS:-}"
  if [[ -z "${ALLOWED_HOSTS}" ]]; then
    ALLOWED_HOSTS="localhost,127.0.0.1"
    if [[ -n "${PUBLIC_IP}" ]]; then
      ALLOWED_HOSTS="${ALLOWED_HOSTS},${PUBLIC_IP}"
    else
      # Fallback untuk lab lokal / tanpa metadata EC2.
      ALLOWED_HOSTS="${ALLOWED_HOSTS},*"
    fi
  fi

  CORS_ORIGINS="${CORS_ALLOWED_ORIGINS:-http://localhost:8080,http://127.0.0.1:8080}"
  POS_DATA_FILE_ENV=""
  if [[ -n "${POS_DATA_FILE:-}" ]]; then
    POS_DATA_FILE_ENV="POS_DATA_FILE=${POS_DATA_FILE}"
  fi

  cat > "${ENV_FILE}" <<EOF
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=${SECRET_KEY}
DJANGO_ALLOWED_HOSTS=${ALLOWED_HOSTS}
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=${CORS_ORIGINS}
GUNICORN_WORKERS=3
GUNICORN_BIND=127.0.0.1:8000
GUNICORN_TIMEOUT=60
GUNICORN_ACCESS_LOG=-
GUNICORN_ERROR_LOG=-
GUNICORN_LOG_LEVEL=info
${POS_DATA_FILE_ENV}
EOF
  chown root:"${APP_USER}" "${ENV_FILE}"
  chmod 0640 "${ENV_FILE}"
  echo "    Dibuat: ${ENV_FILE}"
else
  echo "    Sudah ada, tidak ditimpa: ${ENV_FILE}"
fi

echo "==> Atur permission aplikasi"
chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}/backend_django"

echo "==> Pasang systemd unit dan Nginx site"
install -m 0644 "${APP_DIR}/deploy/systemd/pos-backend.service" \
  /etc/systemd/system/pos-backend.service
install -m 0644 "${APP_DIR}/deploy/nginx/pos.conf" "${NGINX_SITE}"
ln -sf "${NGINX_SITE}" /etc/nginx/sites-enabled/pos.conf
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl daemon-reload
systemctl enable --now nginx
systemctl enable --now pos-backend
systemctl reload nginx

echo
echo "==> Selesai"
echo "Status : systemctl status pos-backend --no-pager"
echo "Health : curl -s http://127.0.0.1:8000/api/health/"
echo "Log    : journalctl -u pos-backend -f"
echo
echo "PENTING: edit ${ENV_FILE} untuk menambahkan domain CloudFront ke"
echo "CORS_ALLOWED_ORIGINS, lalu jalankan: systemctl restart pos-backend"
