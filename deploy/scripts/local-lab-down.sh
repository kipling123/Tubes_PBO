#!/usr/bin/env bash
# Hentikan lab lokal (Nginx :8080 dan Gunicorn :8010).
set -euo pipefail

STATE_DIR="${TMPDIR:-/tmp}/opencode/toko-maju-local"

if [[ -f "${STATE_DIR}/nginx.pid" ]]; then
  nginx -s quit -c "${STATE_DIR}/nginx.conf" -p "${STATE_DIR}" 2>/dev/null || true
  echo "Nginx lokal dihentikan."
else
  echo "Nginx lokal tidak berjalan."
fi

if [[ -f "${STATE_DIR}/gunicorn.pid" ]]; then
  kill "$(cat "${STATE_DIR}/gunicorn.pid")" 2>/dev/null || true
  echo "Gunicorn lokal dihentikan."
else
  echo "Gunicorn lokal tidak berjalan."
fi

rm -f "${STATE_DIR}/nginx.pid" "${STATE_DIR}/gunicorn.pid"
