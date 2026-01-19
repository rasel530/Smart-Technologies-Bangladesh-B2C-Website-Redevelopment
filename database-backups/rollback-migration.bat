@echo off
REM ============================================================
REM Migration Rollback Script
REM Purpose: Restores database from a pre-migration backup
REM Usage: rollback-migration.bat [backup_file.sql.gz]
REM WARNING: This will COMPLETELY REPLACE current database state
REM ============================================================

SETLOCAL EnableDelayedExpansion

REM Configuration
SET CONTAINER_NAME=smarttech_postgres
SET DB_NAME=smart_ecommerce_dev
SET DB_USER=smart_dev
SET BACKUP_DIR=%~dp0migration-backups
SET LOG_FILE=%~dp0logs\rollback-migration.log

REM Get backup file from command line
SET BACKUP_FILE=%1
IF "%BACKUP_FILE%"=="" (
    echo ERROR: No backup file specified
    echo Usage: rollback-migration.bat [backup_file.sql.gz]
    echo.
    echo Available backups:
    dir /b "%BACKUP_DIR%\*.sql.gz"
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
call :LOG "=========================================="
call :LOG "Starting Migration Rollback"
call :LOG "=========================================="
call :LOG "WARNING: This will COMPLETELY REPLACE the current database!"
call :LOG "Backup file: %BACKUP_FILE%"

echo.
echo ============================================================
echo WARNING: MIGRATION ROLLBACK
echo ============================================================
echo This will COMPLETELY REPLACE the current database state
echo with the backup: %BACKUP_FILE%
echo.
echo ALL DATA CHANGES AFTER THE BACKUP WILL BE LOST!
echo.
echo Press Ctrl+C to cancel, or
pause
echo.
echo Are you sure you want to proceed? (yes/no)
set /p CONFIRM=
if /i not "%CONFIRM%"=="yes" (
    echo Rollback cancelled by user
    exit /b 0
)

REM ============================================================
REM PRE-ROLLBACK BACKUP
REM ============================================================
call :LOG ""
call :LOG "Creating emergency pre-rollback backup..."
set TIMESTAMP=%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set EMERGENCY_BACKUP=%~dp0emergency\smart_ecommerce_dev_emergency_%TIMESTAMP%.sql.gz

if not exist "%~dp0emergency" mkdir "%~dp0emergency"

docker exec %CONTAINER_NAME% pg_dump -U %DB_USER% -d %DB_NAME% --no-owner --no-acl --format=plain 2>&1 | gzip > "%EMERGENCY_BACKUP%"

if %errorlevel% neq 0 (
    call :LOG "ERROR: Emergency backup failed"
    call :LOG "Rollback aborted for safety"
    exit /b 1
)

call :LOG "Emergency backup created: %EMERGENCY_BACKUP%"

REM ============================================================
REM STOP APPLICATION
REM ============================================================
call :LOG ""
call :LOG "Stopping application containers..."
docker-compose stop backend frontend 2>nul
if %errorlevel% neq 0 (
    call :LOG "WARNING: Failed to stop application containers"
    call :LOG "Continuing with rollback anyway..."
)

REM ============================================================
REM DROP CURRENT DATABASE
REM ============================================================
call :LOG ""
call :LOG "Dropping current database..."
docker exec %CONTAINER_NAME% psql -U %DB_USER% -d postgres -c "DROP DATABASE IF EXISTS %DB_NAME%;"

if %errorlevel% neq 0 (
    call :LOG "ERROR: Failed to drop database"
    call :LOG "Attempting to restore anyway..."
)

REM ============================================================
REM RECREATE DATABASE
REM ============================================================
call :LOG "Recreating database..."
docker exec %CONTAINER_NAME% psql -U %DB_USER% -d postgres -c "CREATE DATABASE %DB_NAME% OWNER %DB_USER%;"

if %errorlevel% neq 0 (
    call :LOG "ERROR: Failed to recreate database"
    exit /b 1
)

REM ============================================================
REM RESTORE FROM BACKUP
REM ============================================================
call :LOG "Restoring from backup: %BACKUP_FILE%"
call :LOG "This may take several minutes..."

docker exec -i %CONTAINER_NAME% bash -c "gunzip -c < /dev/stdin | psql -U %DB_USER% -d %DB_NAME%" < "%BACKUP_FILE%"

if %errorlevel% neq 0 (
    call :LOG "ERROR: Restore failed"
    call :LOG ""
    call :LOG "CRITICAL: Database is now in an inconsistent state!"
    call :LOG "Emergency backup: %EMERGENCY_BACKUP%"
    call :LOG "Please restore from emergency backup manually"
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
set CRITICAL_TABLES=users products orders
for %%T in (%CRITICAL_TABLES%) do (
    docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '%%T';" -t | findstr /C:"1" >nul
    if %errorlevel% neq 0 (
        call :LOG "ERROR: Critical table '%%T' not found after restore"
        call :LOG "Restore may be incomplete!"
    )
)

REM ============================================================
REM RESTART APPLICATION
REM ============================================================
call :LOG ""
call :LOG "Restarting application containers..."
docker-compose start backend frontend 2>nul

if %errorlevel% neq 0 (
    call :LOG "WARNING: Failed to restart application containers"
    call :LOG "Please start manually: docker-compose up -d"
)

REM ============================================================
REM CLEANUP MIGRATION RECORDS
REM ============================================================
call :LOG ""
call :LOG "Cleaning up migration records..."

REM Get migration count before cleanup
for /f %%i in ('docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "SELECT COUNT(*) FROM _prisma_migrations;" -t') do set MIGRATION_COUNT_BEFORE=%%i
call :LOG "Migrations before cleanup: %MIGRATION_COUNT_BEFORE%"

REM Option to remove last migration record
echo.
echo Do you want to remove the last migration record? (yes/no)
set /p REMOVE_MIGRATION=
if /i "%REMOVE_MIGRATION%"=="yes" (
    call :LOG "Removing last migration record..."
    docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "DELETE FROM _prisma_migrations WHERE migration_name = (SELECT migration_name FROM _prisma_migrations ORDER BY started_at DESC LIMIT 1);"
    call :LOG "Last migration record removed"
)

REM ============================================================
REM FINAL VERIFICATION
REM ============================================================
call :LOG ""
call :LOG "=========================================="
call :LOG "ROLLBACK SUMMARY"
call :LOG "=========================================="
call :LOG "Backup used: %BACKUP_FILE%"
call :LOG "Emergency backup: %EMERGENCY_BACKUP%"
call :LOG "Table count: %TABLE_COUNT%"
call :LOG "Database: %DB_NAME%"
call :LOG "=========================================="

REM Cleanup log file (keep last 200 lines)
powershell -Command "Get-Content '%LOG_FILE%' | Select-Object -Last 200 | Set-Content '%LOG_FILE%'"

call :LOG ""
call :LOG "=========================================="
call :LOG "Rollback Completed Successfully"
call :LOG "=========================================="
call :LOG ""
call :LOG "NEXT STEPS:"
call :LOG "1. Verify application is working correctly"
call :LOG "2. Test critical functionality (login, orders, products)"
call :LOG "3. Monitor logs for any errors"
call :LOG "4. Keep emergency backup for at least 7 days"
call :LOG "=========================================="

ENDLOCAL
exit /b 0
