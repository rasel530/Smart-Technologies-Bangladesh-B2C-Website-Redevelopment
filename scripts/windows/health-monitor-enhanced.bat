@echo off
REM Smart Technologies Bangladesh - Enhanced Health Monitor Script
REM This script provides comprehensive monitoring and health checks for all services

setlocal enabledelayedexpansion

echo ========================================
echo Smart Technologies Enhanced Health Monitor
echo ========================================
echo Comprehensive health check at %date% %time%
echo.

REM Set working directory to project root
cd /d "%~dp0..\.."

REM Configuration
set LOG_FILE=logs\health-monitor-%date:~-4,4%%date:~-10,2%%date:~-7,2%.log
set REPORT_FILE=logs\health-report-%date:~-4,4%%date:~-10,2%%date:~-7,2%.html

REM Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

REM Initialize counters
set healthy_services=0
set total_services=0
set critical_issues=0
set warnings=0

REM Start logging
echo [%time%] Starting comprehensive health monitoring... > "%LOG_FILE%"

REM Function to check service health
:check_service
set service_name=%1
set check_command=%2
set expected_result=%3

set /a total_services+=1
echo Checking %service_name%...

%check_command% > nul 2>&1
if %errorlevel% equ %expected_result% (
    echo   ✓ %service_name% is healthy
    echo [%time%] ✓ %service_name% is healthy >> "%LOG_FILE%"
    set /a healthy_services+=1
) else (
    echo   ✗ %service_name% has issues
    echo [%time%] ✗ %service_name% has issues >> "%LOG_FILE%"
    set /a critical_issues+=1
)
goto :eof

REM Function to check port availability
:check_port
set service_name=%1
set port=%2

netstat -an | find ":%port% " > nul
if %errorlevel% equ 0 (
    echo   ✓ %service_name% (port %port%) is listening
    echo [%time%] ✓ %service_name% (port %port%) is listening >> "%LOG_FILE%"
) else (
    echo   ✗ %service_name% (port %port%) is not listening
    echo [%time%] ✗ %service_name% (port %port%) is not listening >> "%LOG_FILE%"
    set /a critical_issues+=1
)
goto :eof

:eof

REM 1. System Health Overview
echo [1/8] System Health Overview
echo [%time%] System Health Overview >> "%LOG_FILE%"
echo.

REM Check Docker Desktop
echo Docker Desktop Status:
docker version > nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Docker Desktop is running
    docker --version
    echo [%time%] Docker Desktop running: >> "%LOG_FILE%"
    docker --version >> "%LOG_FILE%"
) else (
    echo ✗ Docker Desktop is not running
    echo [%time%] Docker Desktop not running >> "%LOG_FILE%"
    set /a critical_issues+=1
)
echo.

REM Check Docker system resources
echo Docker System Resources:
docker system df
echo [%time%] Docker system resources: >> "%LOG_FILE%"
docker system df >> "%LOG_FILE%"
echo.

REM 2. Container Health Status
echo [2/8] Container Health Status
echo [%time%] Container Health Status >> "%LOG_FILE%"
echo.

docker-compose ps
echo [%time%] Docker Compose status: >> "%LOG_FILE%"
docker-compose ps >> "%LOG_FILE%"
echo.

REM 3. Individual Service Health Checks
echo [3/8] Individual Service Health Checks
echo [%time%] Individual Service Health Checks >> "%LOG_FILE%"
echo.

REM PostgreSQL Health
echo PostgreSQL Health:
call :check_service "PostgreSQL" "docker exec smarttech_postgres pg_isready -U smart_dev -d smart_ecommerce_dev" "0"
call :check_port "PostgreSQL" "5432"

REM Redis Health
echo Redis Health:
call :check_service "Redis" "docker exec smarttech_redis redis-cli -a redis_smarttech_2024 ping" "0"
call :check_port "Redis" "6379"

REM Elasticsearch Health
echo Elasticsearch Health:
curl -f http://localhost:9200/_cluster/health > nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Elasticsearch is responding
    echo [%time%] ✓ Elasticsearch is responding >> "%LOG_FILE%"
    set /a healthy_services+=1
) else (
    echo   ✗ Elasticsearch is not responding
    echo [%time%] ✗ Elasticsearch is not responding >> "%LOG_FILE%"
    set /a critical_issues+=1
)
call :check_port "Elasticsearch" "9200"

REM Qdrant Health
echo Qdrant Health:
curl -f http://localhost:6333/ > nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Qdrant is responding
    echo [%time%] ✓ Qdrant is responding >> "%LOG_FILE%"
    set /a healthy_services+=1
) else (
    echo   ✗ Qdrant is not responding
    echo [%time%] ✗ Qdrant is not responding >> "%LOG_FILE%"
    set /a critical_issues+=1
)
call :check_port "Qdrant" "6333"

REM Backend API Health
echo Backend API Health:
curl -f http://localhost:3001/health > nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Backend API is responding
    echo [%time%] ✓ Backend API is responding >> "%LOG_FILE%"
    set /a healthy_services+=1
) else (
    echo   ✗ Backend API is not responding
    echo [%time%] ✗ Backend API is not responding >> "%LOG_FILE%"
    set /a critical_issues+=1
)
call :check_port "Backend API" "3001"

REM Frontend Health
echo Frontend Health:
curl -f http://localhost:3000/ > nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Frontend is responding
    echo [%time%] ✓ Frontend is responding >> "%LOG_FILE%"
    set /a healthy_services+=1
) else (
    echo   ✗ Frontend is not responding
    echo [%time%] ✗ Frontend is not responding >> "%LOG_FILE%"
    set /a critical_issues+=1
)
call :check_port "Frontend" "3000"

REM PgAdmin Health
echo PgAdmin Health:
call :check_port "PgAdmin" "5050"

REM Ollama Health (if installed)
echo Ollama Health:
where ollama > nul 2>&1
if %errorlevel% equ 0 (
    tasklist | find "ollama.exe" > nul
    if %errorlevel% equ 0 (
        echo   ✓ Ollama service is running
        echo [%time%] ✓ Ollama service is running >> "%LOG_FILE%"
        set /a healthy_services+=1
        
        REM Check if Ollama is responding to commands
        ollama list > nul 2>&1
        if %errorlevel% equ 0 (
            echo   ✓ Ollama is responding to commands
            echo [%time%] ✓ Ollama is responding to commands >> "%LOG_FILE%"
        ) else (
            echo   ⚠ Ollama is running but not responding to commands
            echo [%time%] ⚠ Ollama is running but not responding to commands >> "%LOG_FILE%"
            set /a warnings+=1
        )
    ) else (
        echo   ✗ Ollama service is not running
        echo [%time%] ✗ Ollama service is not running >> "%LOG_FILE%"
        set /a warnings+=1
    )
) else (
    echo   ℹ Ollama is not installed
    echo [%time%] ℹ Ollama is not installed >> "%LOG_FILE%"
)
echo.

REM 4. Resource Usage Analysis
echo [4/8] Resource Usage Analysis
echo [%time%] Resource Usage Analysis >> "%LOG_FILE%"
echo.

REM Memory usage
echo Memory Usage:
for /f "tokens=1-2 delims==" %%I in ('wmic computersystem get TotalPhysicalMemorySize,FreePhysicalMemory /value') do (
    if "%%I"=="TotalPhysicalMemorySize" set total_memory=%%J
    if "%%I"=="FreePhysicalMemory" set free_memory=%%J
)

set /a used_memory=%total_memory% - %free_memory%
set /a memory_usage_percent=(%used_memory% * 100) / %total_memory%

echo   Total Memory: %total_memory% bytes
echo   Used Memory: %used_memory% bytes (%memory_usage_percent%%%)
echo   Free Memory: %free_memory% bytes

echo [%time%] Memory usage: %memory_usage_percent%%% >> "%LOG_FILE%"

if %memory_usage_percent% gtr 85 (
    echo   ⚠ High memory usage detected
    echo [%time%] ⚠ High memory usage detected >> "%LOG_FILE%"
    set /a warnings+=1
)

REM Disk usage
echo.
echo Disk usage:
docker system df
echo [%time%] Disk usage details in log file >> "%LOG_FILE%"
docker system df >> "%LOG_FILE%"

REM CPU usage (simplified)
echo.
echo CPU usage:
wmic cpu get loadpercentage /value | find "LoadPercentage"
echo [%time%] CPU usage details in log file >> "%LOG_FILE%"
wmic cpu get loadpercentage /value >> "%LOG_FILE%"
echo.

REM 5. Network Connectivity Tests
echo [5/8] Network Connectivity Tests
echo [%time%] Network Connectivity Tests >> "%LOG_FILE%"
echo.

REM Test localhost connectivity
ping -n 1 127.0.0.1 > nul
if %errorlevel% equ 0 (
    echo   ✓ Localhost is reachable
    echo [%time%] ✓ Localhost is reachable >> "%LOG_FILE%"
) else (
    echo   ✗ Localhost is not reachable
    echo [%time%] ✗ Localhost is not reachable >> "%LOG_FILE%"
    set /a critical_issues+=1
)

REM Test internet connectivity
ping -n 1 8.8.8.8 > nul
if %errorlevel% equ 0 (
    echo   ✓ Internet is reachable
    echo [%time%] ✓ Internet is reachable >> "%LOG_FILE%"
) else (
    echo   ⚠ Internet is not reachable
    echo [%time%] ⚠ Internet is not reachable >> "%LOG_FILE%"
    set /a warnings+=1
)
echo.

REM 6. Log Analysis
echo [6/8] Recent Log Analysis
echo [%time%] Recent Log Analysis >> "%LOG_FILE%"
echo.

REM Check recent Docker logs
echo Recent Docker Compose logs:
docker-compose logs --tail=5
echo [%time%] Recent Docker logs captured >> "%LOG_FILE%"
docker-compose logs --tail=5 >> "%LOG_FILE%"
echo.

REM 7. Performance Metrics
echo [7/8] Performance Metrics
echo [%time%] Performance Metrics >> "%LOG_FILE%"
echo.

REM Container resource usage
echo Container Resource Usage:
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
echo [%time%] Container resource usage captured >> "%LOG_FILE%"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" >> "%LOG_FILE%"
echo.

REM 8. Health Summary and Recommendations
echo [8/8] Health Summary and Recommendations
echo [%time%] Health Summary and Recommendations >> "%LOG_FILE%"
echo.

set /a health_score=(%healthy_services% * 100) / %total_services%

echo ========================================
echo HEALTH MONITORING SUMMARY
echo ========================================
echo.
echo Service Health:
echo   Healthy Services: %healthy_services%/%total_services%
echo   Health Score: %health_score%%%
echo   Critical Issues: %critical_issues%
echo   Warnings: %warnings%
echo.

REM Generate recommendations
if %critical_issues% gtr 0 (
    echo CRITICAL ISSUES DETECTED:
    echo   - Some services are not running or responding
    echo   - Check individual service logs for details
    echo   - Consider running startup-services-enhanced.bat
    echo.
)

if %warnings% gtr 0 (
    echo WARNINGS:
    echo   - Some services may have performance issues
    echo   - Monitor resource usage closely
    echo.
)

if %health_score% geq 90 (
    echo OVERALL STATUS: EXCELLENT
    echo All systems are operating normally.
) else if %health_score% geq 75 (
    echo OVERALL STATUS: GOOD
    echo Most systems are operating normally with minor issues.
) else if %health_score% geq 50 (
    echo OVERALL STATUS: FAIR
    echo Some systems have issues that need attention.
) else (
    echo OVERALL STATUS: POOR
    echo Multiple systems have critical issues requiring immediate attention.
)
echo.

REM Service Access Information
echo SERVICE ACCESS URLS:
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:3001
echo   PgAdmin: http://localhost:5050 (admin@smarttech.com / admin123)
echo   Elasticsearch: http://localhost:9200
echo   Qdrant: http://localhost:6333
echo.

REM Troubleshooting Commands
echo TROUBLESHOOTING COMMANDS:
echo   Start all services: scripts\windows\startup-services-enhanced.bat
echo   Stop all services: scripts\windows\stop-services.bat
echo   View logs: docker-compose logs -f [service-name]
echo   Restart specific service: docker-compose restart [service-name]
echo.

REM Generate HTML report
echo Generating HTML report...
(
echo ^<!DOCTYPE html^>
echo ^<html^>
echo ^<head^>
echo ^<title^>Smart Technologies Health Report^</title^>
echo ^<style^>
echo body { font-family: Arial, sans-serif; margin: 20px; }
echo .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
echo .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
echo .healthy { color: #27ae60; }
echo .warning { color: #f39c12; }
echo .critical { color: #e74c3c; }
echo table { border-collapse: collapse; width: 100%%; }
echo th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
echo th { background-color: #f2f2f2; }
echo ^</style^>
echo ^</head^>
echo ^<body^>
echo ^<div class="header"^>
echo ^<h1^>Smart Technologies Health Report^</h1^>
echo ^<p^>Generated on %date% at %time%^</p^>
echo ^</div^>
echo ^<div class="section"^>
echo ^<h2^>Health Summary^</h2^>
echo ^<p^>Healthy Services: %healthy_services%/%total_services% (%health_score%%%)^</p^>
echo ^<p^>Critical Issues: %critical_issues%^</p^>
echo ^<p^>Warnings: %warnings%^</p^>
echo ^</div^>
echo ^<div class="section"^>
echo ^<h2^>Service Status^</h2^>
echo ^<table^>
echo ^<tr^><th^>Service^</th^><th^>Status^</th^><th^>Port^</th^><th^>URL^</th^></tr^>
echo ^<tr^><td^>Frontend^</td^><td class="healthy"^>Running^</td^><td^>3000^</td^><td^>http://localhost:3000^</td^></tr^>
echo ^<tr^><td^>Backend API^</td^><td class="healthy"^>Running^</td^><td^>3001^</td^><td^>http://localhost:3001^</td^></tr^>
echo ^<tr^><td^>PostgreSQL^</td^><td class="healthy"^>Running^</td^><td^>5432^</td^><td^>localhost:5432^</td^></tr^>
echo ^<tr^><td^>Redis^</td^><td class="healthy"^>Running^</td^><td^>6379^</td^><td^>localhost:6379^</td^></tr^>
echo ^<tr^><td^>Elasticsearch^</td^><td class="healthy"^>Running^</td^><td^>9200^</td^><td^>http://localhost:9200^</td^></tr^>
echo ^<tr^><td^>Qdrant^</td^><td class="healthy"^>Running^</td^><td^>6333^</td^><td^>http://localhost:6333^</td^></tr^>
echo ^<tr^><td^>PgAdmin^</td^><td class="healthy"^>Running^</td^><td^>5050^</td^><td^>http://localhost:5050^</td^></tr^>
echo ^</table^>
echo ^</div^>
echo ^</body^>
echo ^</html^>
) > "%REPORT_FILE%"

echo HTML report generated: %REPORT_FILE%
echo [%time%] HTML report generated: %REPORT_FILE% >> "%LOG_FILE%"

echo ========================================
echo Health Monitoring Complete!
echo ========================================
echo.
echo Log file: %LOG_FILE%
echo HTML report: %REPORT_FILE%
echo.
echo For continuous monitoring, consider running this script periodically.
echo.
pause