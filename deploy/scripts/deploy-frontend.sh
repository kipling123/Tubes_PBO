#!/usr/bin/env bash
# Build frontend lalu upload ke S3 dan invalidasi CloudFront.
#
# Prasyarat: AWS CLI v2 sudah terkonfigurasi (aws configure / SSO).
# Pemakaian:
#   S3_BUCKET=... CLOUDFRONT_DISTRIBUTION_ID=... \
#   VITE_API_BASE_URL=https://alb-dns/api \
#   bash deploy/scripts/deploy-frontend.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT}"

: "${S3_BUCKET:?Set S3_BUCKET ke nama bucket frontend}"
: "${CLOUDFRONT_DISTRIBUTION_ID:?Set CLOUDFRONT_DISTRIBUTION_ID}"

API_BASE="${VITE_API_BASE_URL:-/api}"

if ! command -v aws >/dev/null 2>&1; then
  echo "AWS CLI tidak ditemukan. Install dulu: https://docs.aws.amazon.com/cli/"
  exit 1
fi

if [[ ! -d node_modules ]]; then
  npm ci
fi

echo "==> Build frontend dengan VITE_API_BASE_URL=${API_BASE}"
VITE_API_BASE_URL="${API_BASE}" npm run build

echo "==> Upload aset (cache immutable)"
aws s3 sync dist/ "s3://${S3_BUCKET}/" \
  --delete \
  --exclude "index.html" \
  --cache-control "public,max-age=31536000,immutable"

echo "==> Upload index.html (no-cache)"
aws s3 cp dist/index.html "s3://${S3_BUCKET}/index.html" \
  --cache-control "no-cache,no-store,must-revalidate"

echo "==> Invalidasi CloudFront"
aws cloudfront create-invalidation \
  --distribution-id "${CLOUDFRONT_DISTRIBUTION_ID}" \
  --paths "/*" >/dev/null

echo
echo "Selesai. Buka domain CloudFront untuk verifikasi."
