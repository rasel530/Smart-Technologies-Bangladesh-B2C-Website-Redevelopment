@echo off
REM Smart Technologies Bangladesh - Install Startup Script
REM This script installs the automatic startup configuration

echo ========================================
echo Installing Automatic Startup Configuration
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

REM Set working directory to project root
cd /d "%~dp0..\.."

REM Create startup shortcut in Windows startup folder
echo Creating startup shortcut...
set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SCRIPT_PATH=%~dp0startup-services.bat
set SHORTCUT_PATH=%STARTUP_FOLDER%\SmartTech-Services.lnk

REM Create VBScript to generate shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateShortcut.vbs"
echo sLinkFile = "%SHORTCUT_PATH%" >> "%TEMP%\CreateShortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\CreateShortcut.vbs"
echo oLink.TargetPath = "%SCRIPT_PATH%" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.WorkingDirectory = "%~dp0\..\.." >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Description = "Smart Technologies Services Auto-Startup" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Save >> "%TEMP%\CreateShortcut.vbs"

cscript //nologo "%TEMP%\CreateShortcut.vbs"
del "%TEMP%\CreateShortcut.vbs"

if exist "%SHORTCUT_PATH%" (
    echo ✓ Startup shortcut created successfully!
    echo   Location: %SHORTCUT_PATH%
) else (
    echo ✗ Failed to create startup shortcut
    pause
    exit /b 1
)

REM Create Windows Task Scheduler alternative (more reliable)
echo.
echo Creating Task Scheduler entry...
schtasks /create /tn "SmartTech-Services" /tr "\"%SCRIPT_PATH%\"" /sc onlog /ru "%USERNAME%" /rl highest /f

if %errorlevel% equ 0 (
    echo ✓ Task Scheduler entry created successfully!
    echo   Task Name: SmartTech-Services
    echo   Trigger: Runs at user logon
) else (
    echo ✗ Failed to create Task Scheduler entry
)

REM Optional: Create desktop shortcut for manual startup
echo.
echo Creating desktop shortcut for manual control...
set DESKTOP_SHORTCUT=%USERPROFILE%\Desktop\SmartTech-Services.lnk
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateDesktopShortcut.vbs"
echo sLinkFile = "%DESKTOP_SHORTCUT%" >> "%TEMP%\CreateDesktopShortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\CreateDesktopShortcut.vbs"
echo oLink.TargetPath = "%SCRIPT_PATH%" >> "%TEMP%\CreateDesktopShortcut.vbs"
echo oLink.WorkingDirectory = "%~dp0\..\.." >> "%TEMP%\CreateDesktopShortcut.vbs"
echo oLink.Description = "Start Smart Technologies Services Manually" >> "%TEMP%\CreateDesktopShortcut.vbs"
echo oLink.Save >> "%TEMP%\CreateDesktopShortcut.vbs"

cscript //nologo "%TEMP%\CreateDesktopShortcut.vbs"
del "%TEMP%\CreateDesktopShortcut.vbs"

if exist "%DESKTOP_SHORTCUT%" (
    echo ✓ Desktop shortcut created successfully!
    echo   Location: %DESKTOP_SHORTCUT%
) else (
    echo ✗ Failed to create desktop shortcut
)

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo The following has been configured:
echo 1. Startup folder shortcut (runs at user login)
echo 2. Task Scheduler entry (alternative method)
echo 3. Desktop shortcut (for manual control)
echo.
echo Services will automatically start when you log in to Windows.
echo You can also double-click the desktop shortcut to start services manually.
echo.
echo To remove auto-startup:
echo - Delete: %SHORTCUT_PATH%
echo - Run: schtasks /delete /tn "SmartTech-Services" /f
echo.
pause