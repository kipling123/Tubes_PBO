#!/usr/bin/env bash
# Instalasi prasyarat lokal untuk lab komputasi awan (Tugas 9).
# Mendukung Arch Linux (mesin ini) dan Debian/Ubuntu.
#
# Pemakaian:
#   sudo bash deploy/scripts/install-local-prereqs.sh
#
# Setelah selesai, jalankan `newgrp docker` atau logout/login agar
# user bisa memakai docker tanpa sudo.

set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo "Skrip ini harus dijalankan dengan sudo:"
  echo "  sudo bash $0"
  exit 1
fi

TARGET_USER="${SUDO_USER:-}"
if [[ -z "${TARGET_USER}" || "${TARGET_USER}" == "root" ]]; then
  # pkexec menyetel PKEXEC_UID ke UID pemanggil.
  if [[ -n "${PKEXEC_UID:-}" ]]; then
    TARGET_USER="$(getent passwd "${PKEXEC_UID}" | cut -d: -f1)"
  fi
fi
if [[ -z "${TARGET_USER}" || "${TARGET_USER}" == "root" ]]; then
  TARGET_USER="$(logname 2>/dev/null || true)"
fi
if [[ -z "${TARGET_USER}" || "${TARGET_USER}" == "root" ]]; then
  echo "Tidak bisa menentukan user non-root. Jalankan dengan: sudo -u <user> ... atau set SUDO_USER."
  exit 1
fi

echo "==> Target user untuk grup docker: ${TARGET_USER}"

install_arch() {
  echo "==> Distro: Arch Linux"
  # Catatan: jika database paket sudah lama, jalankan `sudo pacman -Syu` lebih dulu.
  pacman -S --needed --noconfirm nginx docker docker-compose

  echo "==> Mengaktifkan service docker"
  systemctl enable --now docker

  echo "==> Mengaktifkan service nginx (halaman default di port 80)"
  systemctl enable --now nginx
}

install_debian() {
  echo "==> Distro: Debian/Ubuntu"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update
  apt-get install -y nginx docker.io docker-compose-v2

  echo "==> Mengaktifkan service docker"
  systemctl enable --now docker

  echo "==> Mengaktifkan service nginx"
  systemctl enable --now nginx
}

if [[ -f /etc/arch-release ]]; then
  install_arch
elif [[ -f /etc/debian_version ]]; then
  install_debian
else
  echo "Distro tidak didukung oleh skrip ini. Install manual: nginx, docker, docker compose."
  exit 2
fi

echo "==> Menambahkan ${TARGET_USER} ke grup docker"
if ! getent group docker >/dev/null 2>&1; then
  groupadd docker
fi
usermod -aG docker "${TARGET_USER}"

echo
echo "==> Selesai. Verifikasi:"
echo "    docker --version"
echo "    docker compose version"
echo "    nginx -v"
echo "    systemctl is-active docker nginx"
echo
echo "PENTING: agar ${TARGET_USER} bisa memakai docker tanpa sudo,"
echo "logout lalu login kembali (atau reboot). Di Arch, 'newgrp docker'"
echo "bisa gagal dengan 'crypt failed' sehingga tidak disarankan."
