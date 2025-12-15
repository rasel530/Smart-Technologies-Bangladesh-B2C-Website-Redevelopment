@echo off
REM Smart Technologies Bangladesh - Automatic Services Startup Script
REM This script starts Docker Desktop, Ollama, and Docker Compose services

echo ========================================
echo Smart Technologies Services Startup
echo ========================================
echo Starting services at %date% %time%
echo.

REM Set working directory to project root
cd /d "%~dp0..\.."

REM 1. Start Docker Desktop
echo [1/4] Starting Docker Desktop...
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
echo Waiting for Docker Desktop to initialize...
ping 127.0.0.1 -n 30 > nul

REM 2. Check if Docker is running
echo [2/4] Checking Docker status...
docker version > nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not ready yet, waiting longer...
    ping 127.0.0.1 -n 30 > nul
    docker version > nul 2>&1
    if %errorlevel% neq 0 (
        echo ERROR: Docker Desktop failed to start properly
        echo Please start Docker Desktop manually and try again
        pause
        exit /b 1
    )
)
echo Docker is running successfully!

REM 3. Start Ollama service
echo [3/4] Starting Ollama service...
ollama serve > nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Ollama might already be running or not installed
    echo Continuing with Docker services...
) else (
    echo Ollama service started successfully!
)

REM 4. Start Docker Compose services
echo [4/4] Starting Docker Compose services...
docker-compose up -d

echo.
echo ========================================
echo All services started successfully!
echo ========================================
echo.
echo Services running:
echo - Docker Desktop
echo - Ollama (if installed)
echo - PostgreSQL (port 5432)
echo - Redis (port 6379)
echo - Elasticsearch (port 9200)
echo - Qdrant (port 6333)
echo - PgAdmin (port 5050)
echo - Backend API (port 3001)
echo - Frontend (port 3000)
echo.
echo You can access:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:3001
echo - PgAdmin: http://localhost:5050
echo - Elasticsearch: http://localhost:9200
echo - Qdrant: http://localhost:6333
echo.

REM Optional: Minimize to system tray after startup
echo This window will close in 10 seconds...
ping 127.0.0.1 -n 10 > nul