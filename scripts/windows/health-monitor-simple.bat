@echo off
REM Smart Technologies Bangladesh - Simple Health Monitor Script
REM This script provides basic health checks for all services

echo ========================================
echo Smart Technologies Health Monitor
echo ========================================
echo Health check at %date% %time%
echo.

REM Set working directory to project root
cd /d "%~dp0..\.."

REM Check Docker Desktop
echo [1/6] Docker Desktop Status:
docker version > nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Docker Desktop is running
    docker --version
) else (
    echo   ✗ Docker Desktop is not running
)
echo.

REM Check Docker Compose services
echo [2/6] Docker Compose Services Status:
docker-compose ps
echo.

REM Check individual service ports
echo [3/6] Port Availability Check:
echo Checking if services are listening on their ports...

REM PostgreSQL
netstat -an | find ":5432" > nul
if %errorlevel% equ 0 (
    echo   ✓ PostgreSQL (port 5432) - Listening
) else (
    echo   ✗ PostgreSQL (port 5432) - Not listening
)

REM Redis
netstat -an | find ":6379" > nul
if %errorlevel% equ 0 (
    echo   ✓ Redis (port 6379) - Listening
) else (
    echo   ✗ Redis (port 6379) - Not listening
)

REM Elasticsearch
netstat -an | find ":9200" > nul
if %errorlevel% equ 0 (
    echo   ✓ Elasticsearch (port 9200) - Listening
) else (
    echo   ✗ Elasticsearch (port 9200) - Not listening
)

REM Qdrant
netstat -an | find ":6333" > nul
if %errorlevel% equ 0 (
    echo   ✓ Qdrant (port 6333) - Listening
) else (
    echo   ✗ Qdrant (port 6333) - Not listening
)

REM Backend API
netstat -an | find ":3001" > nul
if %errorlevel% equ 0 (
    echo   ✓ Backend API (port 3001) - Listening
) else (
    echo   ✗ Backend API (port 3001) - Not listening
)

REM Frontend
netstat -an | find ":3000" > nul
if %errorlevel% equ 0 (
    echo   ✓ Frontend (port 3000) - Listening
) else (
    echo   ✗ Frontend (port 3000) - Not listening
)

REM PgAdmin
netstat -an | find ":5050" > nul
if %errorlevel% equ 0 (
    echo   ✓ PgAdmin (port 5050) - Listening
) else (
    echo   ✗ PgAdmin (port 5050) - Not listening
)
echo.

REM Check system resources
echo [4/6] System Resource Usage:
echo Memory usage:
for /f "tokens=1-2 delims==" %%I in ('wmic computersystem get TotalVisibleMemorySize,FreePhysicalMemory /value') do (
    if "%%I"=="TotalVisibleMemorySize" set total_memory=%%J
    if "%%I"=="FreePhysicalMemory" set free_memory=%%J
)

set /a used_memory=%total_memory% - %free_memory%
set /a memory_usage_percent=(%used_memory% * 100) / %total_memory%

echo   Total Memory: %total_memory% bytes
echo   Used Memory: %used_memory% bytes (%memory_usage_percent%%%)
echo   Free Memory: %free_memory% bytes

if %memory_usage_percent% gtr 85 (
    echo   ⚠ High memory usage detected
)

echo.
echo Disk usage for Docker:
docker system df
echo.

REM Service URLs
echo [5/6] Service Access URLs:
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:3001
echo   PgAdmin: http://localhost:5050 (admin@smarttech.com / admin123)
echo   Elasticsearch: http://localhost:9200
echo   Qdrant: http://localhost:6333
echo   Redis CLI: redis-cli -h localhost -p 6379
echo   PostgreSQL: psql -h localhost -p 5432 -U smart_dev -d smart_ecommerce_dev
echo.

echo ========================================
echo Health Check Complete!
echo ========================================
echo.
echo To troubleshoot:
echo   Start all services: scripts\windows\startup-services-enhanced.bat
echo   Stop all services: scripts\windows\stop-services.bat
echo   View logs: docker-compose logs -f [service-name]
echo   Restart specific service: docker-compose restart [service-name]
echo.
pause