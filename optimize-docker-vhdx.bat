@echo off
REM Docker VHDX Optimization Script
REM This script requires Administrator privileges to run
REM Please run this script as Administrator

echo ========================================
echo Docker VHDX Optimization Script
echo ========================================
echo.

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator
    echo Please right-click this script and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo Running as Administrator - OK
echo.

REM Check if Docker processes are running
echo Checking for running Docker processes...
tasklist /FI "IMAGENAME eq Docker Desktop.exe" 2>NUL | find /I /N "Docker Desktop.exe">NUL
if %errorLevel% equ 0 (
    echo WARNING: Docker Desktop is currently running
    echo Stopping Docker Desktop...
    taskkill /F /IM "Docker Desktop.exe" >NUL 2>&1
    timeout /t 3 /nobreak >NUL
)

tasklist /FI "IMAGENAME eq com.docker.backend.exe" 2>NUL | find /I /N "com.docker.backend.exe">NUL
if %errorLevel% equ 0 (
    echo Stopping Docker backend processes...
    taskkill /F /IM "com.docker.backend.exe" >NUL 2>&1
)

tasklist /FI "IMAGENAME eq docker.exe" 2>NUL | find /I /N "docker.exe">NUL
if %errorLevel% equ 0 (
    echo Stopping Docker processes...
    taskkill /F /IM "docker.exe" >NUL 2>&1
)

echo Waiting for processes to stop...
timeout /t 5 /nobreak >NUL
echo.

REM Shutdown WSL
echo Shutting down WSL...
wsl --shutdown
timeout /t 3 /nobreak >NUL
echo.

REM Get VHDX file path
set VHDX_PATH=%LOCALAPPDATA%\Docker\wsl\disk\docker_data.vhdx

REM Check if VHDX file exists
if not exist "%VHDX_PATH%" (
    echo ERROR: Docker VHDX file not found at:
    echo %VHDX_PATH%
    echo.
    pause
    exit /b 1
)

echo Docker VHDX file found
echo.

REM Get VHDX size before optimization
echo Getting VHDX size before optimization...
for %%F in ("%VHDX_PATH%") do set SIZE_BEFORE=%%~zF
set /a SIZE_BEFORE_MB=%SIZE_BEFORE% / 1048576
set /a SIZE_BEFORE_GB=%SIZE_BEFORE_MB% / 1024
echo VHDX size before: %SIZE_BEFORE_GB% GB
echo.

REM Optimize VHDX
echo ========================================
echo Optimizing Docker VHDX file...
echo ========================================
echo This may take several minutes...
echo.

powershell -Command "Optimize-VHD -Path '%VHDX_PATH%' -Mode Full"

if %errorLevel% equ 0 (
    echo.
    echo ========================================
    echo VHDX Optimization Complete!
    echo ========================================
    echo.
    
    REM Get VHDX size after optimization
    echo Getting VHDX size after optimization...
    for %%F in ("%VHDX_PATH%") do set SIZE_AFTER=%%~zF
    set /a SIZE_AFTER_MB=%SIZE_AFTER% / 1048576
    set /a SIZE_AFTER_GB=%SIZE_AFTER_MB% / 1024
    echo VHDX size after: %SIZE_AFTER_GB% GB
    echo.
    
    REM Calculate space reclaimed
    set /a SIZE_SAVED_MB=%SIZE_BEFORE_MB% - %SIZE_AFTER_MB%
    set /a SIZE_SAVED_GB=%SIZE_SAVED_MB% / 1024
    echo Space reclaimed: %SIZE_SAVED_GB% GB
    echo.
    
    REM Get disk space after optimization
    echo Getting C: drive disk space...
    for /f "tokens=3" %%A in ('dir C:\ ^| find "bytes free"') do set FREE_SPACE=%%A
    echo C: drive free space: %FREE_SPACE% bytes
    echo.
    
    echo ========================================
    echo Optimization Summary
    echo ========================================
    echo VHDX size before: %SIZE_BEFORE_GB% GB
    echo VHDX size after:  %SIZE_AFTER_GB% GB
    echo Space reclaimed:  %SIZE_SAVED_GB% GB
    echo ========================================
) else (
    echo.
    echo ERROR: VHDX optimization failed
    echo Please check the error message above
    echo.
)

echo.
echo ========================================
echo Next Steps
echo ========================================
echo 1. Start Docker Desktop
echo 2. Wait for Docker to fully initialize
echo 3. Verify all containers are running with: docker ps
echo ========================================
echo.

pause
