@echo off
REM Smart Technologies Bangladesh - Stop Services Script
REM This script stops all running services gracefully

echo ========================================
echo Smart Technologies Services Stop
echo ========================================
echo Stopping services at %date% %time%
echo.

REM Set working directory to project root
cd /d "%~dp0..\.."

REM 1. Stop Docker Compose services
echo [1/3] Stopping Docker Compose services...
docker-compose down

REM 2. Stop Ollama service
echo [2/3] Stopping Ollama service...
taskkill /f /im ollama.exe > nul 2>&1
if %errorlevel% equ 0 (
    echo Ollama service stopped successfully!
) else (
    echo Ollama service was not running or already stopped
)

REM 3. Optional: Stop Docker Desktop (commented out by default)
echo [3/3] Docker Desktop can be stopped manually if needed
echo To stop Docker Desktop, right-click the system tray icon and select "Quit Docker Desktop"

echo.
echo ========================================
echo All services stopped successfully!
echo ========================================
echo.
echo Services stopped:
echo - Docker Compose services (PostgreSQL, Redis, Elasticsearch, Qdrant, etc.)
echo - Ollama service
echo - Docker Desktop (manual stop required)
echo.

pause