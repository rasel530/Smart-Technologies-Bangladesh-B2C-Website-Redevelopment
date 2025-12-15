@echo off
REM Smart Technologies Bangladesh - Simple Service Status Checker
REM This script checks status of all running services (simplified version)

echo ========================================
echo Smart Technologies Services Status
echo ========================================
echo Checking service status at %date% %time%
echo.

REM Set working directory to project root
cd /d "%~dp0..\.."

REM 1. Check Docker Desktop
echo [1/5] Docker Desktop Status:
docker version > nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Docker Desktop is running
    docker --version
) else (
    echo ✗ Docker Desktop is not running
)
echo.

REM 2. Check Docker Compose services
echo [2/5] Docker Compose Services Status:
docker-compose ps
echo.

REM 3. Check Ollama service
echo [3/5] Ollama Service Status:
tasklist | find "ollama.exe" > nul
if %errorlevel% equ 0 (
    echo ✓ Ollama service is running
) else (
    echo ✗ Ollama service is not running
)
echo.

REM 4. Check service availability via curl (alternative to netstat)
echo [4/5] Service Connectivity Check:
echo Testing service endpoints...

REM PostgreSQL
curl -s http://localhost:5432 > nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ PostgreSQL (port 5432) - Responding
) else (
    echo ✗ PostgreSQL (port 5432) - Not responding
)

REM Redis
curl -s http://localhost:6379 > nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Redis (port 6379) - Responding
) else (
    echo ✗ Redis (port 6379) - Not responding
)

REM Elasticsearch
curl -s http://localhost:9200 > nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Elasticsearch (port 9200) - Responding
) else (
    echo ✗ Elasticsearch (port 9200) - Not responding
)

REM Qdrant
curl -s http://localhost:6333 > nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Qdrant (port 6333) - Responding
) else (
    echo ✗ Qdrant (port 6333) - Not responding
)

REM Backend API
curl -s http://localhost:3001 > nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Backend API (port 3001) - Responding
) else (
    echo ✗ Backend API (port 3001) - Not responding
)

REM Frontend
curl -s http://localhost:3000 > nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Frontend (port 3000) - Responding
) else (
    echo ✗ Frontend (port 3000) - Not responding
)

REM PgAdmin
curl -s http://localhost:5050 > nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ PgAdmin (port 5050) - Responding
) else (
    echo ✗ PgAdmin (port 5050) - Not responding
)
echo.

REM 5. Service URLs
echo [5/5] Service Access URLs:
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