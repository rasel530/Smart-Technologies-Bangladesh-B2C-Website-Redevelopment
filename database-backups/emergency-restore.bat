@echo off
REM ============================================================
REM Emergency Restore Script
REM Purpose: Restores database from any backup file
REM Usage: emergency-restore.bat [backup_file.sql.gz]
REM WARNING: This will COMPLETELY REPLACE current database state
REM ============================================================

SETLOCAL EnableDelayedExpansion

REM Configuration
SET CONTAINER_NAME=smarttech_postgres
SET DB_NAME=smart_ecommerce_dev
SET DB_USER=smart_dev
SET BACKUP_DIR=%~dp0
SET LOG_FILE=%~dp0logs\emergency-restore.log

REM Get backup file from command line
SET BACKUP_FILE=%1
IF "%BACKUP_FILE%"=="" (
    echo ERROR: No backup file specified
    echo.
    echo Usage: emergency-restore.bat [backup_file.sql.gz]
    echo.
    echo Available backups:
    echo.
    echo Daily backups:
    dir /b "%BACKUP_DIR%daily\*.sql.gz" 2>nul
    echo.
    echo Weekly backups:
    dir /b "%BACKUP_DIR%weekly\*.sql.gz" 2>nul
    echo.
    echo Monthly backups:
    dir /b "%BACKUP_DIR%monthly\*.sql.gz" 2>nul
    echo.
    echo Migration backups:
    dir /b "%BACKUP_DIR%migration-backups\*.sql.gz" 2>nul
    echo.
    echo Emergency backups:
    dir /b "%BACKUP_DIR%emergency\*.sql.gz" 2>nul
    exit /b 1
)

REM Check if backup file exists
IF NOT EXIST "%BACKUP_FILE%" (
    echo ERROR: Backup file not found: %BACKUP_FILE%
    exit /b 1
)

REM Create log directory if not exists
if not exist "%~dp0logs" mkdir "%~dp0logs"

REM Log function
:LOG
echo [%date% %time%] %* >> "%LOG_FILE%"
goto :EOF

REM ============================================================
REM WARNING AND CONFIRMATION
REM ============================================================
cls
echo ============================================================
echo EMERGENCY DATABASE RESTORE
echo ============================================================
echo.
echo This will COMPLETELY REPLACE the current database!
echo.
echo Backup file: %BACKUP_FILE%
echo.
echo ALL CURRENT DATA WILL BE LOST!
echo.
echo Press Ctrl+C to cancel, or
pause
echo.
echo Type 'I UNDERSTAND' to confirm:
set /p CONFIRM=
if not "%CONFIRM%"=="I UNDERSTAND" (
    echo Restore cancelled by user
    exit /b 0
)

REM ============================================================
REM START LOGGING
REM ============================================================
call :LOG "=========================================="
call :LOG "Starting Emergency Restore"
call :LOG "=========================================="
call :LOG "Backup file: %BACKUP_FILE%"

REM ============================================================
REM VERIFY BACKUP FILE
REM ============================================================
call :LOG ""
call :LOG "Verifying backup file..."

for %%F in ("%BACKUP_FILE%") do set BACKUP_SIZE=%%~zF
set /a BACKUP_SIZE_MB=%BACKUP_SIZE%/1048576
call :LOG "Backup file size: %BACKUP_SIZE_MB% MB"

REM Test backup integrity
call :LOG "Testing backup integrity..."
docker exec %CONTAINER_NAME% bash -c "gunzip -t < /dev/stdin" < "%BACKUP_FILE%" 2>&1
if %errorlevel% neq 0 (
    call :LOG "ERROR: Backup file is corrupted!"
    call :LOG "Restore aborted for safety"
    exit /b 1
)

call :LOG "Backup integrity check passed"

REM ============================================================
REM STOP ALL SERVICES
REM ============================================================
call :LOG ""
call :LOG "Stopping all services..."
docker-compose down 2>nul

if %errorlevel% neq 0 (
    call :LOG "WARNING: Failed to stop services gracefully"
    call :LOG "Attempting force stop..."
    docker-compose down --remove-orphans 2>nul
)

REM ============================================================
REM START POSTGRES ONLY
REM ============================================================
call :LOG "Starting PostgreSQL container only..."
docker-compose up -d postgres 2>nul

if %errorlevel% neq 0 (
    call :LOG "ERROR: Failed to start PostgreSQL"
    exit /b 1
)

REM Wait for PostgreSQL to be ready
call :LOG "Waiting for PostgreSQL to be ready..."
timeout /t 10 /nobreak >nul

REM Check if PostgreSQL is ready
docker exec %CONTAINER_NAME% pg_isready -U %DB_USER% -d %DB_NAME% >nul
if %errorlevel% neq 0 (
    call :LOG "ERROR: PostgreSQL is not ready"
    exit /b 1
)

call :LOG "PostgreSQL is ready"

REM ============================================================
REM CREATE EMERGENCY BACKUP OF CURRENT STATE
REM ============================================================
call :LOG ""
call :LOG "Creating emergency backup of current state..."
set TIMESTAMP=%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set CURRENT_STATE_BACKUP=%BACKUP_DIR%emergency\smart_ecommerce_dev_before_restore_%TIMESTAMP%.sql.gz

if not exist "%BACKUP_DIR%emergency" mkdir "%BACKUP_DIR%emergency"

docker exec %CONTAINER_NAME% pg_dump -U %DB_USER% -d %DB_NAME% --no-owner --no-acl --format=plain 2>&1 | gzip > "%CURRENT_STATE_BACKUP%"

if %errorlevel% neq 0 (
    call :LOG "WARNING: Emergency backup of current state failed"
    call :LOG "Continuing with restore anyway..."
) else (
    call :LOG "Emergency backup created: %CURRENT_STATE_BACKUP%"
)

REM ============================================================
REM DROP CURRENT DATABASE
REM ============================================================
call :LOG ""
call :LOG "Dropping current database..."
docker exec %CONTAINER_NAME% psql -U %DB_USER% -d postgres -c "DROP DATABASE IF EXISTS %DB_NAME%;"

if %errorlevel% neq 0 (
    call :LOG "ERROR: Failed to drop database"
    exit /b 1
)

call :LOG "Database dropped successfully"

REM ============================================================
REM RECREATE DATABASE
REM ============================================================
call :LOG "Recreating database..."
docker exec %CONTAINER_NAME% psql -U %DB_USER% -d postgres -c "CREATE DATABASE %DB_NAME% OWNER %DB_USER%;"

if %errorlevel% neq 0 (
    call :LOG "ERROR: Failed to recreate database"
    exit /b 1
)

call :LOG "Database recreated successfully"

REM ============================================================
REM RESTORE FROM BACKUP
REM ============================================================
call :LOG ""
call :LOG "Restoring database from backup..."
call :LOG "This may take several minutes depending on data size..."
call :LOG "Please wait..."

docker exec -i %CONTAINER_NAME% bash -c "gunzip -c < /dev/stdin | psql -U %DB_USER% -d %DB_NAME%" < "%BACKUP_FILE%"

if %errorlevel% neq 0 (
    call :LOG ""
    call :LOG "ERROR: Restore failed!"
    call :LOG ""
    call :LOG "CRITICAL SITUATION:"
    call :LOG "  - Current database has been dropped"
    call :LOG "  - Restore from backup failed"
    call :LOG "  - Database is in unusable state"
    call :LOG ""
    call :LOG "EMERGENCY BACKUP OF CURRENT STATE: %CURRENT_STATE_BACKUP%"
    call :LOG ""
    call :LOG "MANUAL RECOVERY REQUIRED:"
    call :LOG "  1. Check restore error above"
    call :LOG "  2. Try manual restore using:"
    call :LOG "     docker exec -i %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% ^< backup.sql"
    call :LOG "  3. If that fails, recreate database from scratch"
    exit /b 1
)

call :LOG "Restore completed successfully"

REM ============================================================
REM VERIFY RESTORE
REM ============================================================
call :LOG ""
call :LOG "Verifying restore..."

for /f %%i in ('docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" -t') do set TABLE_COUNT=%%i
call :LOG "Table count after restore: %TABLE_COUNT%"

REM Check for critical tables
set CRITICAL_TABLES=users products orders categories
set ALL_CRITICAL_PRESENT=1

for %%T in (%CRITICAL_TABLES%) do (
    docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '%%T';" -t | findstr /C:"1" >nul
    if %errorlevel% neq 0 (
        call :LOG "ERROR: Critical table '%%T' not found after restore"
        set ALL_CRITICAL_PRESENT=0
    ) else (
        call :LOG "Critical table '%%T' present"
    )
)

if %ALL_CRITICAL_PRESENT% equ 0 (
    call :LOG "ERROR: Not all critical tables present after restore"
    call :LOG "Restore may be incomplete!"
)

REM Check data in critical tables
for %%T in (users products orders) do (
    for /f %%i in ('docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "SELECT COUNT(*) FROM %%T;" -t') do set ROW_COUNT=%%i
    call :LOG "%%T row count: %ROW_COUNT%"
)

REM ============================================================
REM RESTART ALL SERVICES
REM ============================================================
call :LOG ""
call :LOG "Restarting all services..."
docker-compose up -d 2>nul

if %errorlevel% neq 0 (
    call :LOG "WARNING: Failed to start all services"
    call :LOG "Please start manually: docker-compose up -d"
) else (
    call :LOG "All services started successfully"
)

REM ============================================================
REM WAIT FOR SERVICES TO BE READY
REM ============================================================
call :LOG "Waiting for services to be ready..."
timeout /t 30 /nobreak >nul

REM ============================================================
REM FINAL VERIFICATION
REM ============================================================
call :LOG ""
call :LOG "Performing final verification..."

REM Check PostgreSQL
docker exec %CONTAINER_NAME% pg_isready -U %DB_USER% -d %DB_NAME% >nul
if %errorlevel% equ 0 (
    call :LOG "PASS: PostgreSQL is ready"
) else (
    call :LOG "FAIL: PostgreSQL is not ready"
)

REM Check Redis
docker exec smarttech_redis redis-cli -a redis_smarttech_2024 ping >nul
if %errorlevel% equ 0 (
    call :LOG "PASS: Redis is ready"
) else (
    call :LOG "FAIL: Redis is not ready"
)

REM Check Elasticsearch
docker exec smarttech_elasticsearch curl -f http://localhost:9200/_cluster/health >nul
if %errorlevel% equ 0 (
    call :LOG "PASS: Elasticsearch is ready"
) else (
    call :LOG "FAIL: Elasticsearch is not ready"
)

REM ============================================================
RESTORE SUMMARY
REM ============================================================
call :LOG ""
call :LOG "=========================================="
call :LOG "EMERGENCY RESTORE SUMMARY"
call :LOG "=========================================="
call :LOG "Backup file used: %BACKUP_FILE%"
call :LOG "Backup size: %BACKUP_SIZE_MB% MB"
call :LOG "Current state backup: %CURRENT_STATE_BACKUP%"
call :LOG "Table count: %TABLE_COUNT%"
call :LOG "All critical tables present: %ALL_CRITICAL_PRESENT%"
call :LOG "Database: %DB_NAME%"
call :LOG "=========================================="

REM Cleanup log file (keep last 300 lines)
powershell -Command "Get-Content '%LOG_FILE%' | Select-Object -Last 300 | Set-Content '%LOG_FILE%'"

call :LOG ""
call :LOG "=========================================="
call :LOG "Emergency Restore Completed"
call :LOG "=========================================="
call :LOG ""
call :LOG "NEXT STEPS:"
call :LOG "1. Verify all services are running: docker-compose ps"
call :LOG "2. Test application in browser"
call :LOG "3. Test critical functionality (login, orders, products)"
call :LOG "4. Monitor logs for any errors: docker-compose logs -f"
call :LOG "5. Keep current state backup for at least 7 days"
call :LOG "=========================================="

echo.
echo ============================================================
echo EMERGENCY RESTORE COMPLETED
echo ============================================================
echo.
echo Backup file: %BACKUP_FILE%
echo Current state backup: %CURRENT_STATE_BACKUP%
echo.
echo Please verify application is working correctly.
echo Monitor logs: docker-compose logs -f
echo.

ENDLOCAL
exit /b 0
