@echo off
setlocal
cd /d "%~dp0"

echo ====================================================
echo  Menjalankan Django Backend POS (Tugas 9 Cloud)
echo  Meneruskan ke backend_django...
echo ====================================================

cd ..\backend_django
python manage.py runserver 0.0.0.0:8000
pause
