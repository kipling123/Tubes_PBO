#!/usr/bin/env bash
# Verifikasi lab lokal (Nginx :8080 -> Gunicorn :8010 -> Django).
# Jalankan setelah `bash deploy/scripts/local-lab-up.sh`.
#
# Output script ini bisa di-screenshot sebagai bukti implementasi.
set -uo pipefail

HOST="${HOST:-http://localhost:8080}"
PASS=0
FAIL=0

check() {
  local name="$1"
  local expected="$2"
  local actual="$3"

  if [[ "${actual}" == *"${expected}"* ]]; then
    printf '  [PASS] %-42s %s\n' "${name}" "${expected}"
    PASS=$((PASS + 1))
  else
    printf '  [FAIL] %-42s expected "%s", got "%s"\n' "${name}" "${expected}" "${actual:0:60}"
    FAIL=$((FAIL + 1))
  fi
}

echo "== Verifikasi Toko Maju POS local lab =="
echo "Target: ${HOST}"
echo

echo "-- 1. Proses --"
check "Gunicorn listen 8010" "1" "$(ss -ltn | grep -c ':8010' || true)"
check "Nginx listen 8080" "1" "$(ss -ltn | grep -c ':8080' || true)"

echo
echo "-- 2. Frontend statis (simulasi S3 + CloudFront) --"
check "GET / -> 200" "200" "$(curl -s -o /dev/null -w '%{http_code}' "${HOST}/")"
check "GET / berisi root div" '<div id="root">' "$(curl -s "${HOST}/" | tr -d '\n')"
check "SPA fallback /cashier" '<div id="root">' "$(curl -s "${HOST}/cashier" | tr -d '\n')"

echo
echo "-- 3. Cache header --"
check "index.html no-cache" "no-cache" "$(curl -sI "${HOST}/index.html" | tr -d '\r' | grep -i '^cache-control' || true)"
ASSET="$(curl -s "${HOST}/index.html" | grep -oE '/assets/[^"]+\.js' | head -1)"
if [[ -n "${ASSET}" ]]; then
  check "asset immutable" "immutable" "$(curl -sI "${HOST}${ASSET}" | tr -d '\r' | grep -i '^cache-control' || true)"
else
  printf '  [FAIL] %-42s asset JS tidak ditemukan di index.html\n' "asset immutable"
  FAIL=$((FAIL + 1))
fi

echo
echo "-- 4. Reverse proxy ke Gunicorn --"
check "GET /api/health/ status ok" '"status": "ok"' "$(curl -s "${HOST}/api/health/")"
check "GET /api/health/ punya timestamp" '"timestamp"' "$(curl -s "${HOST}/api/health/")"
check "GET /api/products/ sukses" '"status": "success"' "$(curl -s "${HOST}/api/products/")"
check "GET /api/ root sukses" '"status": "success"' "$(curl -s "${HOST}/api/")"

echo
echo "-- 5. CORS --"
check "Origin dev diizinkan" "http://localhost:5173" \
  "$(curl -sI -H 'Origin: http://localhost:5173' "${HOST}/api/health/" | tr -d '\r' | grep -i '^access-control-allow-origin' || true)"

echo
printf '== Hasil: %d PASS, %d FAIL ==\n' "${PASS}" "${FAIL}"
echo
echo "Catatan: ini bukti lab lokal, bukan AWS Console."
echo "Untuk AWS: lihat DEPLOYMENT.md bagian 4 dan 5."

[[ ${FAIL} -eq 0 ]]
