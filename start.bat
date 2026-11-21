@echo off
setlocal
cd /d "%~dp0"
if errorlevel 1 (
    echo Unable to switch to the project folder.
    pause
    exit /b 1
)

type "%~dp0start.ps1" | powershell.exe -NoLogo -NoProfile -Command -
set "EXITCODE=%ERRORLEVEL%"
if not "%EXITCODE%"=="0" (
    echo.
    echo The Law Study Platform could not be started. See the message above.
    pause
)
exit /b %EXITCODE%
