@echo off
setlocal
cd /d "%~dp0"

echo ====================================================
echo  Menjalankan Django Backend POS (Tugas 9 Cloud)
echo  Port: 8000 (http://127.0.0.1:8000/api/)
echo ====================================================

python manage.py runserver 0.0.0.0:8000
pause
