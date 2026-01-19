@echo off
REM ============================================================
REM Monthly Database Backup Script
REM Purpose: Creates monthly backups of PostgreSQL database
REM Schedule: Run on the 1st of every month at 4:00 AM
REM Rotation: Keeps last 12 months of backups
REM ============================================================

SETLOCAL EnableDelayedExpansion

REM Configuration
SET CONTAINER_NAME=smarttech_postgres
SET DB_NAME=smart_ecommerce_dev
SET DB_USER=smart_dev
SET BACKUP_DIR=%~dp0monthly
SET LOG_FILE=%~dp0logs\backup-monthly.log
SET TIMESTAMP=%date:~10,4%%date:~4,2%
SET BACKUP_FILE=%BACKUP_DIR%\smart_ecommerce_dev_monthly_%TIMESTAMP%.sql
SET BACKUP_FILE_COMPRESSED=%BACKUP_DIR%\smart_ecommerce_dev_monthly_%TIMESTAMP%.sql.gz

REM Create log directory if not exists
if not exist "%~dp0logs" mkdir "%~dp0logs"

REM Log function
:LOG
echo [%date% %time%] %* >> "%LOG_FILE%"
goto :EOF

REM Start logging
call :LOG "=========================================="
call :LOG "Starting Monthly Backup"
call :LOG "=========================================="

REM Check if Docker container is running
docker ps | findstr /C:"%CONTAINER_NAME%" >nul
if %errorlevel% neq 0 (
    call :LOG "ERROR: Docker container %CONTAINER_NAME% is not running"
    exit /b 1
)

call :LOG "Docker container is running"

REM Check if backup directory exists
if not exist "%BACKUP_DIR%" (
    call :LOG "Creating backup directory: %BACKUP_DIR%"
    mkdir "%BACKUP_DIR%"
)

REM Get table count before backup
for /f %%i in ('docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" -t') do set TABLE_COUNT=%%i
call :LOG "Current table count: %TABLE_COUNT%"

REM Create backup with verbose output
call :LOG "Creating backup: %BACKUP_FILE_COMPRESSED%"
docker exec %CONTAINER_NAME% pg_dump -U %DB_USER% -d %DB_NAME% --no-owner --no-acl --format=plain --verbose 2>&1 | gzip > "%BACKUP_FILE_COMPRESSED%"

if %errorlevel% neq 0 (
    call :LOG "ERROR: Backup creation failed"
    exit /b 1
)

REM Get backup file size
for %%F in ("%BACKUP_FILE_COMPRESSED%") do set BACKUP_SIZE=%%~zF
set /a BACKUP_SIZE_MB=%BACKUP_SIZE%/1048576
call :LOG "Backup created successfully. Size: %BACKUP_SIZE_MB% MB"

REM Verify backup file exists
if not exist "%BACKUP_FILE_COMPRESSED%" (
    call :LOG "ERROR: Backup file not created"
    exit /b 1
)

REM Test backup integrity
call :LOG "Testing backup integrity..."
docker exec %CONTAINER_NAME% bash -c "gunzip -t < /dev/stdin" < "%BACKUP_FILE_COMPRESSED%" 2>&1
if %errorlevel% neq 0 (
    call :LOG "WARNING: Backup integrity check failed, but file was created"
) else (
    call :LOG "Backup integrity check passed"
)

REM Rotate old backups (keep last 12 months)
call :LOG "Rotating old backups (keeping last 12 months)..."
for /f "skip=12 delims=" %%F in ('dir /b /o-d "%BACKUP_DIR%\smart_ecommerce_dev_monthly_*.sql.gz"') do (
    call :LOG "Deleting old backup: %%F"
    del "%BACKUP_DIR%\%%F"
)

REM Count remaining backups
for /f %%i in ('dir /b "%BACKUP_DIR%\smart_ecommerce_dev_monthly_*.sql.gz" ^| find /c /v ""') do set BACKUP_COUNT=%%i
call :LOG "Current backup count: %BACKUP_COUNT%"

REM List all backups
call :LOG "Current backups in directory:"
dir /b "%BACKUP_DIR%\smart_ecommerce_dev_monthly_*.sql.gz" >> "%LOG_FILE%"

REM Calculate total disk usage
for /f "tokens=3" %%a in ('dir "%BACK_DIR%" /-c ^| find "File(s)"') do set TOTAL_SIZE=%%a
set /a TOTAL_SIZE_MB=%TOTAL_SIZE%/1048576
call :LOG "Total disk usage: %TOTAL_SIZE_MB% MB"

REM Cleanup log file (keep last 100 lines)
powershell -Command "Get-Content '%LOG_FILE%' | Select-Object -Last 100 | Set-Content '%LOG_FILE%'"

call :LOG "=========================================="
call :LOG "Monthly Backup Completed Successfully"
call :LOG "=========================================="

ENDLOCAL
exit /b 0
