#!/usr/bin/env bash
set -Eeuo pipefail

ENV_FILE="${POS_BACKUP_ENV_FILE:-/etc/pos-json-backup.env}"
if [[ -r "$ENV_FILE" ]]; then
  set -a
  # This file is created by configure-pos-backup.sh and should remain root-owned.
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

DATA_FILE="${POS_DATA_FILE:-/mnt/pos-efs/data_store.json}"
BACKUP_BUCKET="${POS_BACKUP_S3_BUCKET:?POS_BACKUP_S3_BUCKET must be set}"
BACKUP_PREFIX="${POS_BACKUP_PREFIX:-pos-json}"
LOCK_FILE="${POS_BACKUP_LOCK_FILE:-${DATA_FILE}.backup.lock}"
MARKER_FILE="${POS_BACKUP_MARKER_FILE:-${DATA_FILE}.last-backup-date}"

if [[ ! -r "$DATA_FILE" ]]; then
  printf 'Backup source is missing or unreadable: %s\n' "$DATA_FILE" >&2
  exit 1
fi

mkdir -p "$(dirname "$LOCK_FILE")" "$(dirname "$MARKER_FILE")"
exec 9>"$LOCK_FILE"
flock -x 9

backup_date="$(date -u +%F)"
if [[ -r "$MARKER_FILE" ]] && [[ "$(<"$MARKER_FILE")" == "$backup_date" ]]; then
  exit 0
fi

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
snapshot_file="$(mktemp)"
compressed_file="$(mktemp)"
marker_file="$(mktemp "$(dirname "$MARKER_FILE")/.pos-backup-date.XXXXXX")"
cleanup() {
  rm -f -- "$snapshot_file" "$compressed_file" "$marker_file"
}
trap cleanup EXIT

cp -- "$DATA_FILE" "$snapshot_file"
gzip -n -c "$snapshot_file" > "$compressed_file"

backup_key="${BACKUP_PREFIX%/}/pos-json-${timestamp}.json.gz"
aws s3 cp "$compressed_file" "s3://${BACKUP_BUCKET}/${backup_key}" --only-show-errors

printf '%s\n' "$backup_date" > "$marker_file"
mv -f -- "$marker_file" "$MARKER_FILE"
printf 'JSON backup uploaded: s3://%s/%s\n' "$BACKUP_BUCKET" "$backup_key"
