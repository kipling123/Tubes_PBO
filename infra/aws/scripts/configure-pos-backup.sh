#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "$#" -lt 2 || "$#" -gt 3 ]]; then
  printf 'Usage: sudo %s <backup-bucket> <data-file> [s3-prefix]\n' "$0" >&2
  exit 2
fi

bucket="$1"
data_file="$2"
prefix="${3:-pos-json}"

if [[ ! "$bucket" =~ ^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$ ]]; then
  printf 'Invalid S3 bucket name: %s\n' "$bucket" >&2
  exit 2
fi
if [[ ! "$data_file" =~ ^/[A-Za-z0-9_./-]+$ ]]; then
  printf 'Data file path must be absolute and contain no spaces: %s\n' "$data_file" >&2
  exit 2
fi
if [[ ! "$prefix" =~ ^[A-Za-z0-9_./=-]*$ ]]; then
  printf 'Invalid S3 prefix: %s\n' "$prefix" >&2
  exit 2
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
install -o root -g root -m 0750 "$script_dir/backup-json-state.sh" /usr/local/sbin/pos-json-backup

printf 'POS_BACKUP_S3_BUCKET=%s\nPOS_DATA_FILE=%s\nPOS_BACKUP_PREFIX=%s\n' \
  "$bucket" "$data_file" "$prefix" > /etc/pos-json-backup.env
chown root:root /etc/pos-json-backup.env
chmod 0600 /etc/pos-json-backup.env

printf '%s\n' \
  'CRON_TZ=UTC' \
  '15 19 * * * root /usr/local/sbin/pos-json-backup >> /var/log/pos-json-backup.log 2>&1' \
  > /etc/cron.d/pos-json-backup
chown root:root /etc/cron.d/pos-json-backup
chmod 0644 /etc/cron.d/pos-json-backup

printf 'Daily JSON backup configured for 02:15 Asia/Jakarta (19:15 UTC).\n'
