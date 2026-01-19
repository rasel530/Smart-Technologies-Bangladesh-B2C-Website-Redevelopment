@echo off
REM ============================================================
REM Pre-Migration Backup Script
REM Purpose: Creates a backup before running any database migration
REM Usage: Run this script BEFORE executing any migration
REM Rotation: Keeps last 30 migration backups
REM ============================================================

SETLOCAL EnableDelayedExpansion

REM Configuration
SET CONTAINER_NAME=smarttech_postgres
SET DB_NAME=smart_ecommerce_dev
SET DB_USER=smart_dev
SET BACKUP_DIR=%~dp0migration-backups
SET LOG_FILE=%~dp0logs\backup-pre-migration.log
SET TIMESTAMP=%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
SET TIMESTAMP=%TIMESTAMP: =0,8%%TIMESTAMP:~9,2%
SET MIGRATION_NAME=%1
IF "%MIGRATION_NAME%"=="" SET MIGRATION_NAME=pre_migration

SET BACKUP_FILE=%BACKUP_DIR%\%MIGRATION_NAME%_%TIMESTAMP%.sql
SET BACKUP_FILE_COMPRESSED=%BACKUP_DIR%\%MIGRATION_NAME%_%TIMESTAMP%.sql.gz

REM Create log directory if not exists
if not exist "%~dp0logs" mkdir "%~dp0logs"

REM Log function
:LOG
echo [%date% %time%] %* >> "%LOG_FILE%"
goto :EOF

REM Start logging
call :LOG "=========================================="
call :LOG "Starting Pre-Migration Backup"
call :LOG "=========================================="
call :LOG "Migration name: %MIGRATION_NAME%"

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

REM Get migration status
for /f %%i in ('docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "SELECT COUNT(*) FROM _prisma_migrations;" -t') do set MIGRATION_COUNT=%%i
call :LOG "Current migration count: %MIGRATION_COUNT%"

REM List current migrations
call :LOG "Current migrations:"
docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "SELECT migration_name, started_at FROM _prisma_migrations ORDER BY started_at;" >> "%LOG_FILE%"

REM Get row counts for important tables
call :LOG "Getting row counts for important tables..."
docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "
SELECT 
    schemaname,
    tablename,
    n_tup_ins as rows_inserted,
    n_tup_upd as rows_updated,
    n_tup_del as rows_deleted
FROM pg_stat_user_tables 
WHERE schemaname = 'public' 
ORDER BY n_tup_ins DESC
LIMIT 10;" >> "%LOG_FILE%"

REM Create backup
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

REM Create checksum for verification
call :LOG "Creating checksum for backup verification..."
certutil -hashfile "%BACKUP_FILE_COMPRESSED%" SHA256 >> "%LOG_FILE%"

REM Rotate old migration backups (keep last 30)
call :LOG "Rotating old migration backups (keeping last 30)..."
for /f "skip=30 delims=" %%F in ('dir /b /o-d "%BACKUP_DIR%\*.sql.gz"') do (
    call :LOG "Deleting old migration backup: %%F"
    del "%BACKUP_DIR%\%%F"
)

REM Count remaining backups
for /f %%i in ('dir /b "%BACKUP_DIR%\*.sql.gz" ^| find /c /v ""') do set BACKUP_COUNT=%%i
call :LOG "Current migration backup count: %BACKUP_COUNT%"

REM List all migration backups
call :LOG "Current migration backups:"
dir /b "%BACKUP_DIR%\*.sql.gz" >> "%LOG_FILE%"

REM Calculate total disk usage
for /f "tokens=3" %%a in ('dir "%BACK_DIR%" /-c ^| find "File(s)"') do set TOTAL_SIZE=%%a
set /a TOTAL_SIZE_MB=%TOTAL_SIZE%/1048576
call :LOG "Total disk usage: %TOTAL_SIZE_MB% MB"

REM Create backup summary file
set SUMMARY_FILE=%BACKUP_DIR%\%MIGRATION_NAME%_%TIMESTAMP%_summary.txt
call :LOG "Creating backup summary: %SUMMARY_FILE%"
(
echo ============================================================
echo PRE-MIGRATION BACKUP SUMMARY
echo ============================================================
echo Migration Name: %MIGRATION_NAME%
echo Backup Date: %date% %time%
echo Backup File: %BACKUP_FILE_COMPRESSED%
echo Backup Size: %BACKUP_SIZE_MB% MB
echo Table Count: %TABLE_COUNT%
echo Migration Count: %MIGRATION_COUNT%
echo ============================================================
echo IMPORTANT: Keep this backup until migration is verified
echo ============================================================
) > "%SUMMARY_FILE%"

REM Cleanup log file (keep last 200 lines)
powershell -Command "Get-Content '%LOG_FILE%' | Select-Object -Last 200 | Set-Content '%LOG_FILE%'"

call :LOG "=========================================="
call :LOG "Pre-Migration Backup Completed Successfully"
call :LOG "=========================================="
call :LOG "Backup file: %BACKUP_FILE_COMPRESSED%"
call :LOG "Summary file: %SUMMARY_FILE%"
call :LOG ""
call :LOG "NEXT STEPS:"
call :LOG "1. Verify backup file exists and is not corrupted"
call :LOG "2. Run your migration"
call :LOG "3. Test the application"
call :LOG "4. If successful, backup can be kept for 30 days"
call :LOG "5. If migration fails, use restore script to recover"
call :LOG "=========================================="

ENDLOCAL
exit /b 0
