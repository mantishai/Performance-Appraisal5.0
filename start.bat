@echo off
title HRMS

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js not found
    pause
    exit /b 1
)

if not exist "server\node_modules" (
    cd server
    npm install
    cd ..
)

if not exist "node_modules" (
    npm install
)

start "Backend" cmd /k "cd server && node index.js"
start "Frontend" cmd /k "npm run dev"

echo Starting services...
echo Frontend: http://localhost:5173
echo Backend: http://localhost:8080
pause