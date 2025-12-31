@echo off
echo ========================================
echo   Smart Tech Redis Startup Script
echo ========================================
echo.

REM Check if Docker is running
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not running
    echo Please install Docker Desktop and start it first
    pause
    exit /b 1
)

echo [INFO] Docker is available

REM Check if Docker daemon is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker daemon is not running
    echo Please start Docker Desktop first
    pause
    exit /b 1
)

echo [INFO] Docker daemon is running

REM Navigate to project directory
cd /d "%~dp0"

echo [INFO] Current directory: %CD%

REM Check if docker-compose.yml exists
if not exist "docker-compose.yml" (
    echo [ERROR] docker-compose.yml not found in current directory
    echo Please make sure you're in the project root directory
    pause
    exit /b 1
)

echo [INFO] Found docker-compose.yml

REM Start Redis container
echo [INFO] Starting Redis container...
docker-compose up -d redis

if %errorlevel% neq 0 (
    echo [ERROR] Failed to start Redis container
    pause
    exit /b 1
)

echo [SUCCESS] Redis container started successfully

REM Wait a moment for Redis to be ready
echo [INFO] Waiting for Redis to be ready...
timeout /t 10

REM Check Redis container status
echo [INFO] Checking Redis container status...
docker-compose ps redis

echo.
echo [INFO] Redis startup completed!
echo [INFO] Redis is now available at redis://localhost:6379
echo [INFO] You can check logs with: docker-compose logs redis
echo.
pause