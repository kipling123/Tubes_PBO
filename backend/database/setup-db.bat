@echo off
setlocal
cd /d "%~dp0.."

where mysql >nul 2>nul
if %errorlevel% neq 0 (
    echo MySQL CLI tidak ditemukan di PATH.
    echo Pastikan XAMPP/WAMP/MySQL sudah terinstall dan folder bin MySQL ada di PATH.
    exit /b 1
)

echo Membuat database tubes_pbo...
mysql -u root -e "CREATE DATABASE IF NOT EXISTS tubes_pbo;"

echo Mengimpor schema dan data dari database\DB_PBO.sql...
mysql -u root tubes_pbo < database\DB_PBO.sql

if %errorlevel% neq 0 (
    echo Gagal mengimpor database.
    exit /b %errorlevel%
)

echo Database tubes_pbo berhasil diimpor.
