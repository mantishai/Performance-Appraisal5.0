@echo off
cd /d "%~dp0"
chcp 65001 >nul
title HRMS System

echo ========================================
echo    HRMS Launch Script
echo ========================================
echo.

set NODE_PATH=C:\Program Files\nodejs
if not exist "%NODE_PATH%\node.exe" (
    echo [ERROR] Node.js v20 not found at: %NODE_PATH%
    echo Please install Node.js v20 first.
    pause
    exit /b 1
)

"%NODE_PATH%\node.exe" --version
echo.

set PATH=%NODE_PATH%;%PATH%

echo [1/4] Checking dependencies...
if not exist "server\node_modules" (
    echo Installing server dependencies...
    cd server
    call npm install
    cd ..
)
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)
echo.

echo [2/4] Starting backend server...
cd /d "%~dp0"
start "HRMS Backend" "%NODE_PATH%\node.exe" server\index.js

timeout /t 4 /nobreak >nul

echo [3/4] Starting frontend server...
start "HRMS Frontend" cmd /c "npm run dev"

timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo    Services starting...
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8080
echo.
echo Admin Account:
echo   Username: admin
echo   Password: 1
echo.
echo Opening browser...
start "" http://localhost:3000
echo.
echo Done!
pause
