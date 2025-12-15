@echo off
REM Smart Technologies Bangladesh - Minimal Service Status Checker
REM This script checks basic status of services

echo ========================================
echo Smart Technologies Services Status
echo ========================================
echo Checking service status at %date% %time%
echo.

REM Set working directory to project root
cd /d "%~dp0..\.."

REM 1. Check Docker Desktop
echo [1/3] Docker Desktop Status:
docker version > nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Docker Desktop is running
    docker --version
) else (
    echo ✗ Docker Desktop is not running
)
echo.

REM 2. Check Docker Compose services
echo [2/3] Docker Compose Services Status:
docker-compose ps
echo.

REM 3. Check Ollama service
echo [3/3] Ollama Service Status:
tasklist | find "ollama.exe" > nul
if %errorlevel% equ 0 (
    echo ✓ Ollama service is running
) else (
    echo ✗ Ollama service is not running
)
echo.

REM Service URLs
echo Service Access URLs:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:3001
echo - PgAdmin: http://localhost:5050
echo - Elasticsearch: http://localhost:9200
echo - Qdrant: http://localhost:6333
echo - Redis CLI: redis-cli -h localhost -p 6379
echo - PostgreSQL: psql -h localhost -p 5432 -U smart_dev -d smart_ecommerce_dev
echo.

echo ========================================
echo Status Check Complete!
echo ========================================
echo.
pause