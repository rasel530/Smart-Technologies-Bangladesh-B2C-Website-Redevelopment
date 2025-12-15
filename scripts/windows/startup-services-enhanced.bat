@echo off
REM Smart Technologies Bangladesh - Enhanced Automatic Services Startup Script
REM This script starts Docker Desktop and Docker Compose services with improved error handling

setlocal enabledelayedexpansion

echo ========================================
echo Smart Technologies Enhanced Services Startup
echo ========================================
echo Starting services at %date% %time%
echo.

REM Set working directory to project root
cd /d "%~dp0..\.."

REM Configuration
set MAX_DOCKER_WAIT=180
set MAX_SERVICE_WAIT=60
set LOG_FILE=logs\startup-%date:~-4,4%%date:~-10,2%%date:~-7,2%.log

REM Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

REM Function to log messages
echo [%time%] Starting enhanced startup process... > "%LOG_FILE%"

REM 1. Check prerequisites
echo [1/7] Checking prerequisites...
echo [%time%] Checking prerequisites... >> "%LOG_FILE%"

REM Check if Docker Desktop is installed
if not exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
    echo ERROR: Docker Desktop is not installed!
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    echo [%time%] ERROR: Docker Desktop not found >> "%LOG_FILE%"
    pause
    exit /b 1
)

REM Check if docker-compose.yml exists
if not exist "docker-compose.yml" (
    echo ERROR: docker-compose.yml not found in project root!
    echo [%time%] ERROR: docker-compose.yml not found >> "%LOG_FILE%"
    pause
    exit /b 1
)

echo ✓ Prerequisites check passed
echo [%time%] Prerequisites check passed >> "%LOG_FILE%"

REM 2. Start Docker Desktop with enhanced monitoring
echo.
echo [2/7] Starting Docker Desktop...
echo [%time%] Starting Docker Desktop... >> "%LOG_FILE%"

REM Check if Docker Desktop is already running
tasklist | find "Docker Desktop.exe" > nul
if %errorlevel% equ 0 (
    echo Docker Desktop is already running
    echo [%time%] Docker Desktop already running >> "%LOG_FILE%"
) else (
    echo Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    
    REM Wait for Docker Desktop to initialize with progress indicator
    set wait_time=0
    echo Waiting for Docker Desktop to initialize...
    :docker_wait_loop
    docker version > nul 2>&1
    if %errorlevel% equ 0 (
        echo ✓ Docker Desktop is ready!
        echo [%time%] Docker Desktop ready >> "%LOG_FILE%"
        goto docker_ready
    )
    
    set /a wait_time+=5
    if !wait_time! geq %MAX_DOCKER_WAIT% (
        echo ERROR: Docker Desktop failed to start within %MAX_DOCKER_WAIT% seconds
        echo [%time%] ERROR: Docker Desktop timeout >> "%LOG_FILE%"
        goto docker_error
    )
    
    echo   Waiting... (!wait_time!/%MAX_DOCKER_WAIT% seconds)
    ping 127.0.0.1 -n 5 > nul
    goto docker_wait_loop
)

:docker_ready
goto start_services

:docker_error
echo.
echo Troubleshooting steps:
echo 1. Make sure Docker Desktop is properly installed
echo 2. Check if Windows Subsystem for Linux (WSL2) is enabled
echo 3. Try starting Docker Desktop manually first
echo 4. Check Windows Event Viewer for Docker errors
echo [%time%] Docker Desktop startup failed >> "%LOG_FILE%"
pause
exit /b 1

:start_services

REM 3. Check Docker system health
echo.
echo [3/7] Checking Docker system health...
echo [%time%] Checking Docker system health >> "%LOG_FILE%"

docker system info > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker system is not healthy
    echo [%time%] ERROR: Docker system unhealthy >> "%LOG_FILE%"
    pause
    exit /b 1
)

echo ✓ Docker system is healthy
echo [%time%] Docker system healthy >> "%LOG_FILE%"

REM 4. Clean up old containers and networks (optional)
echo.
echo [4/7] Cleaning up old containers...
echo [%time%] Cleaning up old containers >> "%LOG_FILE%"

docker-compose down --remove-orphans > nul 2>&1
echo ✓ Old containers cleaned up
echo [%time%] Old containers cleaned up >> "%LOG_FILE%"

REM 5. Start Docker Compose services with health monitoring
echo.
echo [5/7] Starting Docker Compose services...
echo [%time%] Starting Docker Compose services >> "%LOG_FILE%"

docker-compose up -d

if %errorlevel% neq 0 (
    echo ERROR: Failed to start Docker Compose services
    echo [%time%] ERROR: Docker Compose startup failed >> "%LOG_FILE%"
    pause
    exit /b 1
)

echo ✓ Docker Compose services started
echo [%time%] Docker Compose services started >> "%LOG_FILE%"

REM 6. Wait for services to be healthy
echo.
echo [6/7] Waiting for services to be healthy...
echo [%time%] Waiting for service health checks >> "%LOG_FILE%"

set service_wait=0
:health_check_loop
set all_healthy=true

REM Check PostgreSQL
docker exec smarttech_postgres pg_isready -U smart_dev -d smart_ecommerce_dev > nul 2>&1
if %errorlevel% neq 0 (
    set all_healthy=false
    echo   PostgreSQL not ready yet...
) else (
    echo   ✓ PostgreSQL is healthy
)

REM Check Redis
docker exec smarttech_redis redis-cli -a redis_smarttech_2024 ping > nul 2>&1
if %errorlevel% neq 0 (
    set all_healthy=false
    echo   Redis not ready yet...
) else (
    echo   ✓ Redis is healthy
)

REM Check Elasticsearch
curl -f http://localhost:9200/_cluster/health > nul 2>&1
if %errorlevel% neq 0 (
    set all_healthy=false
    echo   Elasticsearch not ready yet...
) else (
    echo   ✓ Elasticsearch is healthy
)

if "!all_healthy!"=="true" (
    echo ✓ All core services are healthy!
    echo [%time%] All services healthy >> "%LOG_FILE%"
    goto services_ready
)

set /a service_wait+=10
if !service_wait! geq %MAX_SERVICE_WAIT% (
    echo WARNING: Some services may not be fully ready, but continuing...
    echo [%time%] WARNING: Service health check timeout >> "%LOG_FILE%"
    goto services_ready
)

echo   Waiting for services... (!service_wait!/%MAX_SERVICE_WAIT% seconds)
ping 127.0.0.1 -n 10 > nul
goto health_check_loop

:services_ready

REM 7. Start Ollama service (optional)
echo.
echo [7/7] Starting Ollama service (optional)...
echo [%time%] Starting Ollama service >> "%LOG_FILE%"

where ollama > nul 2>&1
if %errorlevel% equ 0 (
    tasklist | find "ollama.exe" > nul
    if %errorlevel% neq 0 (
        ollama serve > nul 2>&1
        if %errorlevel% equ 0 (
            echo ✓ Ollama service started successfully!
            echo [%time%] Ollama service started >> "%LOG_FILE%"
        ) else (
            echo WARNING: Ollama service failed to start
            echo [%time%] WARNING: Ollama service failed >> "%LOG_FILE%"
        )
    ) else (
        echo Ollama service is already running
        echo [%time%] Ollama service already running >> "%LOG_FILE%"
    )
) else (
    echo Ollama is not installed or not in PATH
    echo [%time%] Ollama not found >> "%LOG_FILE%"
)

REM Final status report
echo.
echo ========================================
echo Enhanced Startup Complete!
echo ========================================
echo [%time%] Startup process completed >> "%LOG_FILE%"
echo.
echo Services running:
echo - Docker Desktop
echo - PostgreSQL (port 5432)
echo - Redis (port 6379)
echo - Elasticsearch (port 9200)
echo - Qdrant (port 6333)
echo - PgAdmin (port 5050)
echo - Backend API (port 3001)
echo - Frontend (port 3000)
if exist "C:\Program Files\Ollama\ollama.exe" (
    echo - Ollama (if installed)
)
echo.
echo Service Access URLs:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:3001
echo - PgAdmin: http://localhost:5050 (admin@smarttech.com / admin123)
echo - Elasticsearch: http://localhost:9200
echo - Qdrant: http://localhost:6333
echo.
echo Log file: %LOG_FILE%
echo.
echo To check service status: run scripts\windows\service-status.bat
echo To stop services: run scripts\windows\stop-services.bat
echo.

REM Optional: Auto-minimize after successful startup
echo This window will close in 15 seconds...
ping 127.0.0.1 -n 15 > nul

exit /b 0