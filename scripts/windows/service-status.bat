@echo off
REM Smart Technologies Bangladesh - Service Status Checker
REM This script checks the status of all running services

echo ========================================
echo Smart Technologies Services Status
echo ========================================
echo Checking service status at %date% %time%
echo.

REM Set working directory to project root
cd /d "%~dp0..\.."

REM 1. Check Docker Desktop
echo [1/6] Docker Desktop Status:
docker version > nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Docker Desktop is running
    docker --version
) else (
    echo ✗ Docker Desktop is not running
)
echo.

REM 2. Check Docker Compose services
echo [2/6] Docker Compose Services Status:
docker-compose ps
echo.

REM 3. Check Ollama service
echo [3/6] Ollama Service Status:
tasklist | find "ollama.exe" > nul
if %errorlevel% equ 0 (
    echo ✓ Ollama service is running
    ollama list > nul 2>&1
    if %errorlevel% equ 0 (
        echo   Available models:
        ollama list
    )
) else (
    echo ✗ Ollama service is not running
)
echo.

REM 4. Check individual service ports
echo [4/6] Port Availability Check:
echo Checking if services are listening on their ports...

REM PostgreSQL
netstat -an | find ":5432" > nul
if %errorlevel% equ 0 (
    echo ✓ PostgreSQL (port 5432) - Listening
) else (
    echo ✗ PostgreSQL (port 5432) - Not listening
)

REM Redis
netstat -an | find ":6379" > nul
if %errorlevel% equ 0 (
    echo ✓ Redis (port 6379) - Listening
) else (
    echo ✗ Redis (port 6379) - Not listening
)

REM Elasticsearch
netstat -an | find ":9200" > nul
if %errorlevel% equ 0 (
    echo ✓ Elasticsearch (port 9200) - Listening
) else (
    echo ✗ Elasticsearch (port 9200) - Not listening
)

REM Qdrant
netstat -an | find ":6333" > nul
if %errorlevel% equ 0 (
    echo ✓ Qdrant (port 6333) - Listening
) else (
    echo ✗ Qdrant (port 6333) - Not listening
)

REM Backend API
netstat -an | find ":3001" > nul
if %errorlevel% equ 0 (
    echo ✓ Backend API (port 3001) - Listening
) else (
    echo ✗ Backend API (port 3001) - Not listening
)

REM Frontend
netstat -an | find ":3000" > nul
if %errorlevel% equ 0 (
    echo ✓ Frontend (port 3000) - Listening
) else (
    echo ✗ Frontend (port 3000) - Not listening
)

REM PgAdmin
netstat -an | find ":5050" > nul
if %errorlevel% equ 0 (
    echo ✓ PgAdmin (port 5050) - Listening
) else (
    echo ✗ PgAdmin (port 5050) - Not listening
)
echo.

REM 5. Check system resources
echo [5/6] System Resource Usage:
echo Memory usage:
wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /format:table | findstr /v "TotalVisibleMemorySize"
echo.
echo Disk usage for Docker:
docker system df
echo.

REM 6. Service URLs
echo [6/6] Service Access URLs:
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