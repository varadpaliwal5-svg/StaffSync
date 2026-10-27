@echo off
TITLE StaffSync Automated Test Runner
COLOR 0B

echo ===================================================================
echo               STAFFSYNC AUTOMATED TEST VERIFICATION
echo ===================================================================
echo.
echo Starting temporary backend process and running API tests...
echo.

cd /d "%~dp0server"
start "StaffSync Test Server" /min cmd /c "node server.js"
timeout /t 3 /nobreak > nul

node test_api.js
set TEST_RESULT=%ERRORLEVEL%

taskkill /f /im node.exe > nul 2>&1

echo.
if %TEST_RESULT% equ 0 (
    echo [PASSED] All StaffSync test suites executed successfully!
) else (
    echo [FAILED] Some tests reported issues. Please check output above.
)
echo.
pause
