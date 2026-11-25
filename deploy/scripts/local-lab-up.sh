#!/usr/bin/env bash
# Lab lokal tanpa AWS: Nginx (:8080) -> Gunicorn (:8010) -> Django API.
# Nginx juga menyajikan hasil build React, mensimulasikan S3 + CloudFront.
#
# Pemakaian:
#   bash deploy/scripts/local-lab-up.sh
#   bash deploy/scripts/local-lab-down.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STATE_DIR="${TMPDIR:-/tmp}/opencode/toko-maju-local"
DIST_DIR="${ROOT}/dist"
VENV="${ROOT}/backend_django/.venv"
GUNICORN_BIND="127.0.0.1:8010"
NGINX_PORT="${NGINX_PORT:-8080}"

mkdir -p "${STATE_DIR}"/{client_body,proxy,fastcgi,uwsgi,scgi}

echo "==> Hentikan proses lab sebelumnya (jika ada)"
if [[ -f "${STATE_DIR}/nginx.pid" ]]; then
  nginx -s quit -c "${STATE_DIR}/nginx.conf" -p "${STATE_DIR}" 2>/dev/null || true
fi
if [[ -f "${STATE_DIR}/gunicorn.pid" ]]; then
  kill "$(cat "${STATE_DIR}/gunicorn.pid")" 2>/dev/null || true
fi
sleep 1

# Jangan diam-diam memakai proses lain yang kebetulan menempati port yang sama.
port_busy() {
  ss -ltnH "sport = :$1" 2>/dev/null | grep -q .
}

for port in "${GUNICORN_BIND##*:}" "${NGINX_PORT}"; do
  if port_busy "${port}"; then
    echo "Port ${port} masih dipakai proses lain. Hentikan dulu:"
    echo "  ss -ltnp 'sport = :${port}'"
    exit 1
  fi
done

if [[ ! -x "${VENV}/bin/gunicorn" ]]; then
  echo "Gunicorn belum ada di venv. Jalankan:"
  echo "  ${VENV}/bin/pip install -r backend_django/requirements.txt"
  exit 1
fi

echo "==> Build frontend (API base relatif /api)"
cd "${ROOT}"
VITE_API_BASE_URL=/api npm run build

echo "==> Jalankan Gunicorn di ${GUNICORN_BIND}"
cd "${ROOT}/backend_django"
GUNICORN_BIND="${GUNICORN_BIND}" \
GUNICORN_WORKERS=2 \
GUNICORN_ACCESS_LOG="${STATE_DIR}/gunicorn-access.log" \
GUNICORN_ERROR_LOG="${STATE_DIR}/gunicorn-error.log" \
"${VENV}/bin/gunicorn" \
  --config "${ROOT}/deploy/gunicorn.conf.py" \
  --pid "${STATE_DIR}/gunicorn.pid" \
  --daemon \
  pos_backend.wsgi:application

for _ in $(seq 1 20); do
  if curl -fsS --max-time 1 "http://${GUNICORN_BIND}/api/health/" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

if ! curl -fsS --max-time 2 "http://${GUNICORN_BIND}/api/health/" >/dev/null 2>&1; then
  echo "Gunicorn gagal start. Cek ${STATE_DIR}/gunicorn-error.log"
  exit 1
fi

echo "==> Tulis konfigurasi Nginx lokal"
cat > "${STATE_DIR}/nginx.conf" <<EOF
worker_processes 1;
pid ${STATE_DIR}/nginx.pid;
error_log ${STATE_DIR}/error.log warn;

events {
    worker_connections 256;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    access_log ${STATE_DIR}/access.log;
    sendfile on;
    types_hash_max_size 2048;
    types_hash_bucket_size 64;
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;

    client_body_temp_path ${STATE_DIR}/client_body;
    proxy_temp_path ${STATE_DIR}/proxy;
    fastcgi_temp_path ${STATE_DIR}/fastcgi;
    uwsgi_temp_path ${STATE_DIR}/uwsgi;
    scgi_temp_path ${STATE_DIR}/scgi;

    server {
        listen ${NGINX_PORT};
        server_name localhost;
        root ${DIST_DIR};
        index index.html;

        location /api/ {
            proxy_pass http://${GUNICORN_BIND};
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_set_header Connection "";
        }

        location /assets/ {
            try_files \$uri =404;
            add_header Cache-Control "public, max-age=31536000, immutable";
        }

        location = /index.html {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }

        location / {
            try_files \$uri \$uri/ /index.html;
        }
    }
}
EOF

nginx -t -c "${STATE_DIR}/nginx.conf" -p "${STATE_DIR}"
nginx -c "${STATE_DIR}/nginx.conf" -p "${STATE_DIR}"
sleep 1

echo
echo "Lab lokal aktif:"
echo "  Frontend (simulasi CloudFront) : http://localhost:${NGINX_PORT}/"
echo "  API via Nginx                  : http://localhost:${NGINX_PORT}/api/"
echo "  Health                         : http://localhost:${NGINX_PORT}/api/health/"
echo "  Log Nginx                      : ${STATE_DIR}/access.log"
echo "  Log Gunicorn                   : ${STATE_DIR}/gunicorn-access.log"
echo
echo "Hentikan dengan: bash deploy/scripts/local-lab-down.sh"
