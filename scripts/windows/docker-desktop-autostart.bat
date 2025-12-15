@echo off
REM Smart Technologies Bangladesh - Docker Desktop Auto-Start Configuration
REM This script configures Docker Desktop to start automatically with Windows

setlocal enabledelayedexpansion

echo ========================================
echo Docker Desktop Auto-Start Configuration
echo ========================================
echo Configuring Docker Desktop auto-start at %date% %time%
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: This script must be run as Administrator!
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

REM Check if Docker Desktop is installed
if not exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
    echo ERROR: Docker Desktop is not installed!
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo [1/4] Checking Docker Desktop installation...
echo ✓ Docker Desktop found at: C:\Program Files\Docker\Docker\Docker Desktop.exe

REM Method 1: Registry-based auto-start (most reliable)
echo.
echo [2/4] Configuring registry auto-start...

REM Check if registry key already exists
reg query "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run" /v "Docker Desktop" > nul 2>&1
if %errorlevel% equ 0 (
    echo Docker Desktop auto-start already configured in registry
) else (
    reg add "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run" /v "Docker Desktop" /t REG_SZ /d "\"C:\Program Files\Docker\Docker\Docker Desktop.exe\"" /f
    if %errorlevel% equ 0 (
        echo ✓ Registry auto-start configured successfully
    ) else (
        echo ✗ Failed to configure registry auto-start
    )
)

REM Method 2: Task Scheduler entry (backup method)
echo.
echo [3/4] Creating Task Scheduler entry...

schtasks /query /tn "DockerDesktop-AutoStart" > nul 2>&1
if %errorlevel% equ 0 (
    echo Task Scheduler entry already exists
) else (
    schtasks /create /tn "DockerDesktop-AutoStart" /tr "\"C:\Program Files\Docker\Docker\Docker Desktop.exe\"" /sc onlogon /ru "%USERNAME%" /rl highest /f
    if %errorlevel% equ 0 (
        echo ✓ Task Scheduler entry created successfully
    ) else (
        echo ✗ Failed to create Task Scheduler entry
    )
)

REM Method 3: Startup folder shortcut (alternative method)
echo.
echo [4/4] Creating startup folder shortcut...

set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SHORTCUT_PATH=%STARTUP_FOLDER%\Docker-Desktop.lnk

if exist "%SHORTCUT_PATH%" (
    echo Startup folder shortcut already exists
) else (
    REM Create VBScript to generate shortcut
    echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateDockerShortcut.vbs"
    echo sLinkFile = "%SHORTCUT_PATH%" >> "%TEMP%\CreateDockerShortcut.vbs"
    echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\CreateDockerShortcut.vbs"
    echo oLink.TargetPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe" >> "%TEMP%\CreateDockerShortcut.vbs"
    echo oLink.WorkingDirectory = "C:\Program Files\Docker\Docker" >> "%TEMP%\CreateDockerShortcut.vbs"
    echo oLink.Description = "Docker Desktop Auto-Start" >> "%TEMP%\CreateDockerShortcut.vbs"
    echo oLink.Save >> "%TEMP%\CreateDockerShortcut.vbs"

    cscript //nologo "%TEMP%\CreateDockerShortcut.vbs"
    del "%TEMP%\CreateDockerShortcut.vbs"

    if exist "%SHORTCUT_PATH%" (
        echo ✓ Startup folder shortcut created successfully
    ) else (
        echo ✗ Failed to create startup folder shortcut
    )
)

REM Configure Docker Desktop settings for auto-start
echo.
echo Configuring Docker Desktop settings...

REM Check if Docker Desktop settings file exists
set DOCKER_SETTINGS=%APPDATA%\Docker\settings.json
if exist "%DOCKER_SETTINGS%" (
    echo Updating Docker Desktop settings...
    
    REM Create backup of current settings
    copy "%DOCKER_SETTINGS%" "%DOCKER_SETTINGS%.backup" > nul 2>&1
    
    REM Use PowerShell to update JSON settings (more reliable than manual editing)
    powershell -Command "& {
        try {
            $settings = Get-Content '%DOCKER_SETTINGS%' | ConvertFrom-Json;
            if (-not $settings.autoStart) { $settings | Add-Member -Type NoteProperty -Name 'autoStart' -Value $true };
            if (-not $settings.startInBackground) { $settings | Add-Member -Type NoteProperty -Name 'startInBackground' -Value $true };
            $settings | ConvertTo-Json -Depth 10 | Set-Content '%DOCKER_SETTINGS%';
            Write-Host '✓ Docker Desktop settings updated';
        } catch {
            Write-Host '⚠ Could not update Docker Desktop settings automatically';
        }
    }"
) else (
    echo Docker Desktop settings file not found, will be created on first run
)

REM Summary
echo.
echo ========================================
echo Auto-Start Configuration Complete!
echo ========================================
echo.
echo The following methods have been configured:
echo 1. ✓ Registry auto-start (HKEY_CURRENT_USER\...\Run)
echo 2. ✓ Task Scheduler entry (DockerDesktop-AutoStart)
echo 3. ✓ Startup folder shortcut
echo 4. ✓ Docker Desktop settings (if applicable)
echo.
echo Docker Desktop will now start automatically when you log into Windows.
echo.
echo To test the configuration:
echo 1. Log out and log back in, or
echo 2. Restart your computer
echo.
echo To remove auto-start:
echo 1. Run: reg delete "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run" /v "Docker Desktop" /f
echo 2. Run: schtasks /delete /tn "DockerDesktop-AutoStart" /f
echo 3. Delete: %SHORTCUT_PATH%
echo.
pause