@echo off
REM Smart Technologies Bangladesh - Uninstall Startup Script
REM This script removes the automatic startup configuration

echo ========================================
echo Removing Automatic Startup Configuration
echo ========================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: This script must be run as Administrator!
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

REM 1. Remove startup folder shortcut
echo [1/3] Removing startup folder shortcut...
set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SHORTCUT_PATH=%STARTUP_FOLDER%\SmartTech-Services.lnk

if exist "%SHORTCUT_PATH%" (
    del "%SHORTCUT_PATH%"
    echo ✓ Startup shortcut removed successfully!
) else (
    echo ✗ Startup shortcut not found
)

REM 2. Remove Task Scheduler entry
echo [2/3] Removing Task Scheduler entry...
schtasks /query /tn "SmartTech-Services" > nul 2>&1
if %errorlevel% equ 0 (
    schtasks /delete /tn "SmartTech-Services" /f
    echo ✓ Task Scheduler entry removed successfully!
) else (
    echo ✗ Task Scheduler entry not found
)

REM 3. Remove desktop shortcut
echo [3/3] Removing desktop shortcut...
set DESKTOP_SHORTCUT=%USERPROFILE%\Desktop\SmartTech-Services.lnk

if exist "%DESKTOP_SHORTCUT%" (
    del "%DESKTOP_SHORTCUT%"
    echo ✓ Desktop shortcut removed successfully!
) else (
    echo ✗ Desktop shortcut not found
)

echo.
echo ========================================
echo Uninstallation Complete!
echo ========================================
echo.
echo The following has been removed:
echo 1. Startup folder shortcut
echo 2. Task Scheduler entry
echo 3. Desktop shortcut
echo.
echo Note: This only removes the auto-startup configuration.
echo Running services will continue to run until manually stopped.
echo.
echo To stop running services, run: stop-services.bat
echo.
pause