@echo off
title HRMS - Human Resource Management System

echo ================================================
echo          HRMS - Human Resource Management System
echo              Quick Start Script
echo ================================================
echo.

:CHECK_NODE
echo [1/5] Checking Node.js environment...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found
    echo        Please install Node.js 16.0+
    echo        Download: https://nodejs.org/
    pause
    exit /b 1
)
echo OK: Node.js environment detected
echo.

:CHECK_FRONTEND_DEPS
echo [2/5] Checking frontend dependencies...
if not exist "node_modules" (
    echo INFO: Installing frontend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
    echo OK: Frontend dependencies installed
) else (
    echo OK: Frontend dependencies exist
)
echo.

:CHECK_BACKEND_DEPS
echo [3/5] Checking backend dependencies...
if not exist "server\node_modules" (
    echo INFO: Installing backend dependencies...
    cd server
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
    cd ..
    echo OK: Backend dependencies installed
) else (
    echo OK: Backend dependencies exist
)
echo.

:START_BACKEND
echo [4/5] Starting backend server...
start "HRMS Backend" cmd /k "cd server && node index.js"
echo OK: Backend server started in new window
echo.

:START_FRONTEND
echo [5/5] Starting frontend development server...
echo.
echo Frontend URL: http://localhost:5173
echo Backend URL: http://localhost:8080
echo.
npx vite --host

pause