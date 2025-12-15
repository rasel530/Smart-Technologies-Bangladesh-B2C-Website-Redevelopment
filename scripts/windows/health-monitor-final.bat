@echo off
REM Smart Technologies Bangladesh - Final Working Health Monitor Script
REM This script provides health checks for all running services

echo ========================================
echo Smart Technologies Health Monitor
echo ========================================
echo Health check at %date% %time%
echo.

REM Set working directory to project root
cd /d "%~dp0..\.."

REM Initialize counters
set healthy_count=0
set total_count=0

REM Check Docker Desktop
echo [1/5] Docker Desktop Status:
docker version >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Docker Desktop is running
    docker --version
    set /a healthy_count+=1
) else (
    echo   ✗ Docker Desktop is not running
)
set /a total_count+=1

REM Check running services
echo [2/5] Running Services Status:
echo   Checking services...
for /f %%i in ('docker-compose ps') do (
    echo %%i | findstr /C "Up" >nul
    if !errorlevel! equ 0 (
        echo   ✗ Service is not running
    ) else (
        echo   ✓ Service is running
        set /a healthy_count+=1
    )
    set /a total_count+=1
)
echo.

REM Check service ports
echo [3/5] Port Availability Check:
echo Checking service ports...

REM Check each service port
netstat -an | find ":5432" >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ PostgreSQL (port 5432) - Listening
    set /a total_count+=1
    set /a healthy_count+=1
) else (
    echo   ✗ PostgreSQL (port 5432) - Not listening
)

netstat -an | find ":6379" >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Redis (port 6379) - Listening
    set /a total_count+=1
    set /a healthy_count+=1
) else (
    echo   ✗ Redis (port 6379) - Not listening
)

netstat -an | find ":9200" >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Elasticsearch (port 9200) - Listening
    set /a total_count+=1
    set /a healthy_count+=1
) else (
    echo   ✗ Elasticsearch (port 9200) - Not listening
)

netstat -an | find ":6333" >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Qdrant (port 6333) - Listening
    set /a total_count+=1
    set /a healthy_count+=1
) else (
    echo   ✗ Qdrant (port 6333) - Not listening
)

netstat -an | find ":3001" >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Backend API (port 3001) - Listening
    set /a total_count+=1
    set /a healthy_count+=1
) else (
    echo   ✗ Backend API (port 3001) - Not listening
)

netstat -an | find ":3000" >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Frontend (port 3000) - Listening
    set /a total_count+=1
    set /a healthy_count+=1
) else (
    echo   ✗ Frontend (port 3000) - Not listening
)

netstat -an | find ":5050" >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ PgAdmin (port 5050) - Listening
    set /a total_count+=1
    set /a healthy_count+=1
) else (
    echo   ✗ PgAdmin (port 5050) - Not listening
)
echo.

REM Service URLs
echo [4/5] Service Access URLs:
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:3001
echo   PgAdmin: http://localhost:5050 (admin@smarttech.com / admin123)
echo   Elasticsearch: http://localhost:9200
echo   Qdrant: http://localhost:6333
echo   Redis CLI: redis-cli -h localhost -p 6379
echo   PostgreSQL: psql -h localhost -p 5432 -U smart_dev -d smart_ecommerce_dev
echo.

REM Health Summary
echo [5/5] Health Summary:
set /a health_score=0
if %total_count% gtr 0 (
    set /a health_score=0
) else (
    set /a health_score=(%healthy_count% * 100) / %total_count%
)

echo   Total Services: %total_count%
echo   Healthy Services: %healthy_count%
echo   Health Score: %health_score%%%
echo.

REM Overall Status
if %health_score% geq 80 (
    echo OVERALL STATUS: EXCELLENT
    echo All systems are operating normally.
) else if %health_score% geq 60 (
    echo OVERALL STATUS: GOOD
    echo Most systems are operating normally with minor issues.
) else if %health_score% geq 40 (
    echo OVERALL STATUS: FAIR
    echo Some systems have issues that need attention.
) else (
    echo OVERALL STATUS: POOR
    echo Multiple systems have critical issues requiring immediate attention.
)
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