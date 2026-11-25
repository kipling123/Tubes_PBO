#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "$#" -lt 3 || "$#" -gt 4 ]]; then
  printf 'Usage: sudo %s <efs-id> <aws-region> <access-point-id> [mount-path]\n' "$0" >&2
  exit 2
fi

file_system_id="$1"
aws_region="$2"
access_point_id="$3"
mount_path="${4:-/mnt/pos-efs}"

if [[ ! "$file_system_id" =~ ^fs-[a-f0-9]+$ ]]; then
  printf 'Invalid EFS file system ID: %s\n' "$file_system_id" >&2
  exit 2
fi
if [[ ! "$aws_region" =~ ^[a-z]{2}(-gov)?-[a-z]+-[0-9]+$ ]]; then
  printf 'Invalid AWS region: %s\n' "$aws_region" >&2
  exit 2
fi
if [[ ! "$access_point_id" =~ ^fsap-[a-f0-9]+$ ]]; then
  printf 'Invalid EFS access point ID: %s\n' "$access_point_id" >&2
  exit 2
fi
if [[ ! "$mount_path" =~ ^/[A-Za-z0-9_./-]+$ ]]; then
  printf 'Mount path must be absolute and contain no spaces: %s\n' "$mount_path" >&2
  exit 2
fi
if ! command -v mount.efs >/dev/null 2>&1; then
  printf 'Amazon EFS mount helper (mount.efs) is required. Install amazon-efs-utils first.\n' >&2
  exit 1
fi

mkdir -p "$mount_path"
fstab_entry="${file_system_id}:/ ${mount_path} efs _netdev,tls,iam,region=${aws_region},accesspoint=${access_point_id} 0 0"

if grep -Fq " ${mount_path} " /etc/fstab; then
  if ! grep -Fq "$fstab_entry" /etc/fstab; then
    printf 'A different /etc/fstab entry already uses %s; resolve it before continuing.\n' "$mount_path" >&2
    exit 1
  fi
else
  printf '%s\n' "$fstab_entry" >> /etc/fstab
fi

if ! mountpoint -q "$mount_path"; then
  mount "$mount_path"
fi

printf 'EFS %s access point %s mounted at %s with TLS and IAM authorization.\n' \
  "$file_system_id" "$access_point_id" "$mount_path"
