@echo off
setlocal
cd /d "%~dp0"

where javac >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\Apache NetBeans\jdk\bin\javac.exe" (
        set "PATH=C:\Program Files\Apache NetBeans\jdk\bin;%PATH%"
    )
)

if not exist build\classes mkdir build\classes
if not exist lib mkdir lib
powershell -NoProfile -Command "$conns = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue; if ($conns) { Stop-Process -Id $conns.OwningProcess -Force }"
javac -cp lib\mysql-connector-j-8.3.0.jar -d build\classes src\main\java\JavaBackendServer.java src\main\java\models\*.java src\main\java\services\*.java
if errorlevel 1 exit /b %errorlevel%
java -cp build\classes;lib\mysql-connector-j-8.3.0.jar JavaBackendServer
