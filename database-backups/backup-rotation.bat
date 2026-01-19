@echo off
REM ============================================================
REM Backup Rotation Script
REM Purpose: Manages rotation of backup files based on retention policy
REM Schedule: Run daily after backup scripts
REM Rotation Policy:
REM   - Daily: Keep last 7 days
REM   - Weekly: Keep last 4 weeks
REM   - Monthly: Keep last 12 months
REM ============================================================

SETLOCAL EnableDelayedExpansion

REM Configuration
SET BACKUP_DIR=%~dp0
SET LOG_FILE=%~dp0logs\backup-rotation.log

REM Create log directory if not exists
if not exist "%~dp0logs" mkdir "%~dp0logs"

REM Log function
:LOG
echo [%date% %time%] %* >> "%LOG_FILE%"
goto :EOF

REM Start logging
call :LOG "=========================================="
call :LOG "Starting Backup Rotation"
call :LOG "=========================================="

REM ============================================================
REM Daily Backup Rotation (Keep last 7 days)
REM ============================================================
call :LOG "Processing daily backups..."
set DAILY_COUNT=0
for /f "skip=7 delims=" %%F in ('dir /b /o-d "%BACKUP_DIR%daily\smart_ecommerce_dev_daily_*.sql.gz" 2^>nul') do (
    call :LOG "Deleting old daily backup: %%F"
    del "%BACKUP_DIR%daily\%%F"
)

REM Count remaining daily backups
for /f %%i in ('dir /b "%BACKUP_DIR%daily\smart_ecommerce_dev_daily_*.sql.gz" 2^>nul ^| find /c /v ""') do set DAILY_COUNT=%%i
call :LOG "Daily backups remaining: %DAILY_COUNT%"

REM ============================================================
REM Weekly Backup Rotation (Keep last 4 weeks)
REM ============================================================
call :LOG "Processing weekly backups..."
set WEEKLY_COUNT=0
for /f "skip=4 delims=" %%F in ('dir /b /o-d "%BACKUP_DIR%weekly\smart_ecommerce_dev_weekly_*.sql.gz" 2^>nul') do (
    call :LOG "Deleting old weekly backup: %%F"
    del "%BACKUP_DIR%weekly\%%F"
)

REM Count remaining weekly backups
for /f %%i in ('dir /b "%BACKUP_DIR%weekly\smart_ecommerce_dev_weekly_*.sql.gz" 2^>nul ^| find /c /v ""') do set WEEKLY_COUNT=%%i
call :LOG "Weekly backups remaining: %WEEKLY_COUNT%"

REM ============================================================
REM Monthly Backup Rotation (Keep last 12 months)
REM ============================================================
call :LOG "Processing monthly backups..."
set MONTHLY_COUNT=0
for /f "skip=12 delims=" %%F in ('dir /b /o-d "%BACKUP_DIR%monthly\smart_ecommerce_dev_monthly_*.sql.gz" 2^>nul') do (
    call :LOG "Deleting old monthly backup: %%F"
    del "%BACKUP_DIR%monthly\%%F"
)

REM Count remaining monthly backups
for /f %%i in ('dir /b "%BACKUP_DIR%monthly\smart_ecommerce_dev_monthly_*.sql.gz" 2^>nul ^| find /c /v ""') do set MONTHLY_COUNT=%%i
call :LOG "Monthly backups remaining: %MONTHLY_COUNT%"

REM ============================================================
REM Migration Backup Rotation (Keep last 30 days)
REM ============================================================
call :LOG "Processing migration backups..."
set MIGRATION_COUNT=0
for /f "skip=30 delims=" %%F in ('dir /b /o-d "%BACKUP_DIR%migration-backups\smart_ecommerce_dev_migration_*.sql.gz" 2^>nul') do (
    call :LOG "Deleting old migration backup: %%F"
    del "%BACKUP_DIR%migration-backups\%%F"
)

REM Count remaining migration backups
for /f %%i in ('dir /b "%BACKUP_DIR%migration-backups\smart_ecommerce_dev_migration_*.sql.gz" 2^>nul ^| find /c /v ""') do set MIGRATION_COUNT=%%i
call :LOG "Migration backups remaining: %MIGRATION_COUNT%"

REM ============================================================
REM Emergency Backup Rotation (Keep last 5 backups)
REM ============================================================
call :LOG "Processing emergency backups..."
set EMERGENCY_COUNT=0
for /f "skip=5 delims=" %%F in ('dir /b /o-d "%BACKUP_DIR%emergency\smart_ecommerce_dev_emergency_*.sql.gz" 2^>nul') do (
    call :LOG "Deleting old emergency backup: %%F"
    del "%BACKUP_DIR%emergency\%%F"
)

REM Count remaining emergency backups
for /f %%i in ('dir /b "%BACKUP_DIR%emergency\smart_ecommerce_dev_emergency_*.sql.gz" 2^>nul ^| find /c /v ""') do set EMERGENCY_COUNT=%%i
call :LOG "Emergency backups remaining: %EMERGENCY_COUNT%"

REM ============================================================
REM Calculate Total Disk Usage
REM ============================================================
set TOTAL_SIZE=0
for /f "tokens=3" %%a in ('dir "%BACKUP_DIR%daily" /-c /s 2^>nul ^| find "File(s)"') do set /a TOTAL_SIZE+=%%a
for /f "tokens=3" %%a in ('dir "%BACKUP_DIR%weekly" /-c /s 2^>nul ^| find "File(s)"') do set /a TOTAL_SIZE+=%%a
for /f "tokens=3" %%a in ('dir "%BACKUP_DIR%monthly" /-c /s 2^>nul ^| find "File(s)"') do set /a TOTAL_SIZE+=%%a
for /f "tokens=3" %%a in ('dir "%BACKUP_DIR%migration-backups" /-c /s 2^>nul ^| find "File(s)"') do set /a TOTAL_SIZE+=%%a
for /f "tokens=3" %%a in ('dir "%BACKUP_DIR%emergency" /-c /s 2^>nul ^| find "File(s)"') do set /a TOTAL_SIZE+=%%a

set /a TOTAL_SIZE_MB=%TOTAL_SIZE%/1048576
call :LOG "Total disk usage for all backups: %TOTAL_SIZE_MB% MB"

REM ============================================================
REM Summary
REM ============================================================
call :LOG "=========================================="
call :LOG "Rotation Summary:"
call :LOG "  Daily backups: %DAILY_COUNT% (max 7)"
call :LOG "  Weekly backups: %WEEKLY_COUNT% (max 4)"
call :LOG "  Monthly backups: %MONTHLY_COUNT% (max 12)"
call :LOG "  Migration backups: %MIGRATION_COUNT% (max 30)"
call :LOG "  Emergency backups: %EMERGENCY_COUNT% (max 5)"
call :LOG "  Total disk usage: %TOTAL_SIZE_MB% MB"
call :LOG "=========================================="

REM Cleanup log file (keep last 100 lines)
powershell -Command "Get-Content '%LOG_FILE%' | Select-Object -Last 100 | Set-Content '%LOG_FILE%'"

call :LOG "=========================================="
call :LOG "Backup Rotation Completed Successfully"
call :LOG "=========================================="

ENDLOCAL
exit /b 0
