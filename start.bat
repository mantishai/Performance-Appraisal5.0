@echo off
title HRMS - Human Resource Management System

echo ================================================
echo          HRMS - Human Resource Management System
echo              Quick Start Script
echo ================================================
echo.

:CHECK_NODE
echo [1/4] Checking Node.js environment...
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

:CHECK_NPM
echo [2/4] Checking npm dependencies...
if not exist "node_modules" (
    echo INFO: Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo OK: Dependencies installed
) else (
    echo OK: Dependencies exist
)
echo.

:BUILD_PROJECT
echo [3/4] Building project...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
echo OK: Build completed
echo.

:START_SERVER
echo [4/4] Starting development server...
echo.
echo Starting server...
echo Access URL: http://localhost:3000
echo.
npx vite --host

pause