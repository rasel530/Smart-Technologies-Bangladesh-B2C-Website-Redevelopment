@echo off
REM Smart Technologies Bangladesh - Simple Working Health Monitor Script
REM This script provides basic health checks for all services

echo ========================================
echo Smart Technologies Health Monitor
echo ========================================
echo Health check at %date% %time%
echo.

REM Set working directory to project root
cd /d "%~dp0..\.."

REM Check Docker Desktop
echo [1/4] Docker Desktop Status:
docker version >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Docker Desktop is running
    docker --version
) else (
    echo   ✗ Docker Desktop is not running
)
echo.

REM Check Docker Compose services
echo [2/4] Docker Compose Services Status:
docker-compose ps
echo.

REM Check service ports
echo [3/4] Port Availability Check:
echo Checking if services are listening on their ports...

netstat -an | find ":5432" >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ PostgreSQL (port 5432) - Listening
) else (
    echo   ✗ PostgreSQL (port 5432) - Not listening
)

netstat -an | find ":6379" >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Redis (port 6379) - Listening
) else (
    echo   ✗ Redis (port 6379) - Not listening
)

netstat -an | find ":9200" >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Elasticsearch (port 9200) - Listening
) else (
    echo   ✗ Elasticsearch (port 9200) - Not listening
)

netstat -an | find ":6333" >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Qdrant (port 6333) - Listening
) else (
    echo   ✗ Qdrant (port 6333) - Not listening
)

netstat -an | find ":3001" >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Backend API (port 3001) - Listening
) else (
    echo   ✗ Backend API (port 3001) - Not listening
)

netstat -an | find ":3000" >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Frontend (port 3000) - Listening
) else (
    echo   ✗ Frontend (port 3000) - Not listening
)

netstat -an | find ":5050" >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ PgAdmin (port 5050) - Listening
) else (
    echo   ✗ PgAdmin (port 5050) - Not listening
)
echo.

REM Service URLs
echo [4/4] Service Access URLs:
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