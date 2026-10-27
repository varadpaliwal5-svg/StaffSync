@echo off
TITLE StaffSync HRMS Launcher
COLOR 0A

echo ===================================================================
echo               STAFFSYNC - HUMAN RESOURCE MANAGEMENT SYSTEM
echo ===================================================================
echo.
echo Starting StaffSync Backend Server and Frontend Client...
echo.

:: Launch Backend Server
start "StaffSync Backend Server (Port 5000)" cmd /k "cd /d %~dp0server && node server.js"

:: Launch Frontend Client
start "StaffSync Frontend Client (Port 3000)" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo ===================================================================
echo [SUCCESS] Both servers are launching!
echo Backend API : http://localhost:5000/api/health
echo Frontend UI : http://localhost:3000
echo.
echo Demo Credentials:
echo   HR Director:        hr@staffsync.com       / Password123!
echo   Team Manager:       manager@staffsync.com  / Password123!
echo   Staff Employee:     employee@staffsync.com / Password123!
echo ===================================================================
echo.
echo Press any key to open the StaffSync application in your web browser...
pause > nul

start http://localhost:3000
