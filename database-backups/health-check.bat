@echo off
REM ============================================================
REM Database Health Check Script
REM Purpose: Monitors database health and reports issues
REM Usage: Run periodically or schedule as cron job
REM Checks: Connection, Table count, Data integrity, Performance
REM ============================================================

SETLOCAL EnableDelayedExpansion

REM Configuration
SET CONTAINER_NAME=smarttech_postgres
SET DB_NAME=smart_ecommerce_dev
SET DB_USER=smart_dev
SET BACKUP_DIR=%~dp0
SET LOG_FILE=%~dp0logs\health-check.log
SET STATUS_FILE=%~dp0logs\health-status.json
SET EXPECTED_TABLE_COUNT=40

REM Create log directory if not exists
if not exist "%~dp0logs" mkdir "%~dp0logs"

REM Log function
:LOG
echo [%date% %time%] %* >> "%LOG_FILE%"
goto :EOF

REM Initialize health status
set HEALTH_STATUS=healthy
set ISSUES_FOUND=0

REM Start logging
call :LOG "=========================================="
call :LOG "Starting Database Health Check"
call :LOG "=========================================="

REM ============================================================
REM CHECK 1: Docker Container Status
REM ============================================================
call :LOG ""
call :LOG "CHECK 1: Docker Container Status"
call :LOG "----------------------------------------"

docker ps | findstr /C:"%CONTAINER_NAME%" >nul
if %errorlevel% equ 0 (
    call :LOG "PASS: Docker container is running"
    set CONTAINER_STATUS=running
) else (
    call :LOG "FAIL: Docker container is not running!"
    set CONTAINER_STATUS=stopped
    set HEALTH_STATUS=unhealthy
    set /a ISSUES_FOUND+=1
)

REM Get container uptime
for /f "tokens=1,2,3,4,5" %%a in ('docker inspect --format="{{.State.Status}},{{.State.StartedAt}},{{.State.Health.Status}}" %CONTAINER_NAME%') do (
    set CONTAINER_STATUS_DETAIL=%%a
    set STARTED_AT=%%b
    set HEALTH_STATUS_DETAIL=%%c
)

call :LOG "Container status: %CONTAINER_STATUS_DETAIL%"
if "%HEALTH_STATUS_DETAIL%"=="healthy" (
    call :LOG "Container health: healthy"
) else (
    call :LOG "WARN: Container health: %HEALTH_STATUS_DETAIL%"
    set /a ISSUES_FOUND+=1
)

REM ============================================================
REM CHECK 2: Database Connection
REM ============================================================
call :LOG ""
call :LOG "CHECK 2: Database Connection"
call :LOG "----------------------------------------"

if "%CONTAINER_STATUS%"=="running" (
    docker exec %CONTAINER_NAME% pg_isready -U %DB_USER% -d %DB_NAME% >nul
    if %errorlevel% equ 0 (
        call :LOG "PASS: Database is accepting connections"
        set DB_STATUS=ready
    ) else (
        call :LOG "FAIL: Database is not accepting connections!"
        set DB_STATUS=not_ready
        set HEALTH_STATUS=unhealthy
        set /a ISSUES_FOUND+=1
    )
) else (
    call :LOG "SKIP: Database connection check (container not running)"
    set DB_STATUS=unknown
)

REM ============================================================
REM CHECK 3: Table Count
REM ============================================================
call :LOG ""
call :LOG "CHECK 3: Table Count"
call :LOG "----------------------------------------"

if "%CONTAINER_STATUS%"=="running" (
    for /f %%i in ('docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" -t') do set TABLE_COUNT=%%i
    
    call :LOG "Expected tables: %EXPECTED_TABLE_COUNT%"
    call :LOG "Actual tables: %TABLE_COUNT%"
    
    if %TABLE_COUNT% equ %EXPECTED_TABLE_COUNT% (
        call :LOG "PASS: Table count matches expected value"
    ) else (
        call :LOG "FAIL: Table count mismatch! Expected %EXPECTED_TABLE_COUNT%, found %TABLE_COUNT%"
        set HEALTH_STATUS=unhealthy
        set /a ISSUES_FOUND+=1
    )
) else (
    call :LOG "SKIP: Table count check (container not running)"
    set TABLE_COUNT=0
)

REM ============================================================
REM CHECK 4: Database Size
REM ============================================================
call :LOG ""
call :LOG "CHECK 4: Database Size"
call :LOG "----------------------------------------"

if "%CONTAINER_STATUS%"=="running" (
    for /f %%i in ('docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "SELECT pg_size_pretty(pg_database_size('%DB_NAME%));" -t') do set DB_SIZE=%%i
    call :LOG "Database size: %DB_SIZE%"
    
    REM Check if database size is growing abnormally
    REM (This would require historical data - simplified check)
    call :LOG "INFO: Monitor database size for abnormal growth"
) else (
    call :LOG "SKIP: Database size check (container not running)"
    set DB_SIZE=unknown
)

REM ============================================================
REM CHECK 5: Active Connections
REM ============================================================
call :LOG ""
call :LOG "CHECK 5: Active Connections"
call :LOG "----------------------------------------"

if "%CONTAINER_STATUS%"=="running" (
    for /f %%i in ('docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active';" -t') do set ACTIVE_CONNECTIONS=%%i
    call :LOG "Active connections: %ACTIVE_CONNECTIONS%"
    
    if %ACTIVE_CONNECTIONS% gtr 100 (
        call :LOG "WARN: High number of active connections!"
        set /a ISSUES_FOUND+=1
    ) else (
        call :LOG "PASS: Connection count is normal"
    )
) else (
    call :LOG "SKIP: Connection check (container not running)"
    set ACTIVE_CONNECTIONS=0
)

REM ============================================================
REM CHECK 6: Long-Running Queries
REM ============================================================
call :LOG ""
call :LOG "CHECK 6: Long-Running Queries"
call :LOG "----------------------------------------"

if "%CONTAINER_STATUS%"=="running" (
    docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "
    SELECT 
        pid,
        now() - query_start as duration,
        state,
        query
    FROM pg_stat_activity 
    WHERE state != 'idle' 
    AND now() - query_start > interval '5 minutes'
    ORDER BY duration DESC
    LIMIT 5;" >> "%LOG_FILE%"
    
    REM Count long-running queries
    for /f %%i in ('docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "SELECT COUNT(*) FROM pg_stat_activity WHERE state != 'idle' AND now() - query_start > interval '5 minutes';" -t') do set LONG_QUERIES=%%i
    
    if %LONG_QUERIES% gtr 0 (
        call :LOG "WARN: Found %LONG_QUERIES% long-running queries (over 5 minutes)"
        set /a ISSUES_FOUND+=1
    ) else (
        call :LOG "PASS: No long-running queries"
    )
) else (
    call :LOG "SKIP: Long-running query check (container not running)"
    set LONG_QUERIES=0
)

REM ============================================================
REM CHECK 7: Database Locks
REM ============================================================
call :LOG ""
call :LOG "CHECK 7: Database Locks"
call :LOG "----------------------------------------"

if "%CONTAINER_STATUS%"=="running" (
    for /f %%i in ('docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "SELECT COUNT(*) FROM pg_locks WHERE NOT granted;" -t') do set LOCK_COUNT=%%i
    call :LOG "Waiting locks: %LOCK_COUNT%"
    
    if %LOCK_COUNT% gtr 10 (
        call :LOG "WARN: High number of database locks!"
        set /a ISSUES_FOUND+=1
    ) else (
        call :LOG "PASS: Lock count is normal"
    )
) else (
    call :LOG "SKIP: Lock check (container not running)"
    set LOCK_COUNT=0
)

REM ============================================================
REM CHECK 8: Disk Usage
REM ============================================================
call :LOG ""
call :LOG "CHECK 8: Disk Usage"
call :LOG "----------------------------------------"

for /f "tokens=2" %%a in ('docker exec %CONTAINER_NAME% df -h /var/lib/postgresql/data ^| findstr "/"') do set DISK_USED=%%a
for /f "tokens=3" %%a in ('docker exec %CONTAINER_NAME% df -h /var/lib/postgresql/data ^| findstr "/"') do set DISK_AVAILABLE=%%a

call :LOG "Disk used: %DISK_USED%"
call :LOG "Disk available: %DISK_AVAILABLE%"

REM Extract percentage (simplified)
for /f "tokens=1 delims=%" %%a in ("%DISK_USED%") do set DISK_PERCENT=%%a

if "%DISK_PERCENT:~0,1%" gtr "80" (
    call :LOG "WARN: Disk usage is above 80%%!"
    set /a ISSUES_FOUND+=1
) else (
    call :LOG "PASS: Disk usage is acceptable"
)

REM ============================================================
REM CHECK 9: Critical Tables Row Count
REM ============================================================
call :LOG ""
call :LOG "CHECK 9: Critical Tables Data"
call :LOG "----------------------------------------"

if "%CONTAINER_STATUS%"=="running" (
    docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "
    SELECT 
        tablename,
        n_live_tup as row_count
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('users', 'products', 'orders', 'categories')
    ORDER BY n_live_tup DESC;" >> "%LOG_FILE%"
    
    REM Check for zero-row critical tables
    set ZERO_ROW_TABLES=
    for /f "tokens=1,2" %%a in ('docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "SELECT tablename, n_live_tup FROM pg_stat_user_tables WHERE schemaname = 'public' AND tablename IN ('users', 'products', 'orders') AND n_live_tup = 0;" -t') do (
        if not "%%a"=="tablename" (
            call :LOG "WARN: Critical table '%%a' has zero rows!"
            set ZERO_ROW_TABLES=!ZERO_ROW_TABLES! %%a
            set /a ISSUES_FOUND+=1
        )
    )
    
    if "%ZERO_ROW_TABLES%"=="" (
        call :LOG "PASS: All critical tables have data"
    )
) else (
    call :LOG "SKIP: Critical tables check (container not running)"
)

REM ============================================================
REM CHECK 10: Migration Status
REM ============================================================
call :LOG ""
call :LOG "CHECK 10: Migration Status"
call :LOG "----------------------------------------"

if "%CONTAINER_STATUS%"=="running" (
    for /f %%i in ('docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "SELECT COUNT(*) FROM _prisma_migrations;" -t') do set MIGRATION_COUNT=%%i
    call :LOG "Total migrations applied: %MIGRATION_COUNT%"
    
    docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "SELECT migration_name, started_at FROM _prisma_migrations ORDER BY started_at DESC LIMIT 3;" >> "%LOG_FILE%"
    
    call :LOG "PASS: Migration status retrieved"
) else (
    call :LOG "SKIP: Migration status check (container not running)"
    set MIGRATION_COUNT=0
)

REM ============================================================
REM CHECK 11: Replication Status (if applicable)
REM ============================================================
call :LOG ""
call :LOG "CHECK 11: Replication Status"
call :LOG "----------------------------------------"

if "%CONTAINER_STATUS%"=="running" (
    docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "SELECT pg_is_in_recovery();" -t >nul
    if %errorlevel% equ 0 (
        for /f %%i in ('docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "SELECT pg_is_in_recovery();" -t') do set RECOVERY_STATUS=%%i
        call :LOG "Recovery status: %RECOVERY_STATUS%"
        
        if "%RECOVERY_STATUS%"=="f" (
            call :LOG "PASS: Database is in normal mode"
        ) else (
            call :LOG "WARN: Database is in recovery mode!"
            set /a ISSUES_FOUND+=1
        )
    ) else (
        call :LOG "PASS: Replication check not applicable (standalone database)"
    )
) else (
    call :LOG "SKIP: Replication check (container not running)"
)

REM ============================================================
REM GENERATE STATUS FILE
REM ============================================================
call :LOG ""
call :LOG "Generating health status file..."

(
echo {
  "timestamp": "%date% %time%",
  "health_status": "%HEALTH_STATUS%",
  "container_status": "%CONTAINER_STATUS%",
  "container_health": "%HEALTH_STATUS_DETAIL%",
  "database_status": "%DB_STATUS%",
  "table_count": %TABLE_COUNT%,
  "expected_tables": %EXPECTED_TABLE_COUNT%,
  "database_size": "%DB_SIZE%",
  "active_connections": %ACTIVE_CONNECTIONS%,
  "long_queries": %LONG_QUERIES%,
  "locks": %LOCK_COUNT%,
  "disk_used": "%DISK_USED%",
  "disk_available": "%DISK_AVAILABLE%",
  "migration_count": %MIGRATION_COUNT%",
  "issues_found": %ISSUES_FOUND%,
  "issues": [
) > "%STATUS_FILE%"

REM Add issues to JSON
if %ISSUES_FOUND% gtr 0 (
    echo    "Container not running",
) >> "%STATUS_FILE%"
    if "%CONTAINER_STATUS%"=="stopped" echo    "Database not accepting connections", >> "%STATUS_FILE%"
    if not %TABLE_COUNT%==%EXPECTED_TABLE_COUNT% echo    "Table count mismatch", >> "%STATUS_FILE%"
    if %LONG_QUERIES% gtr 0 echo    "Long-running queries detected", >> "%STATUS_FILE%"
    if %LOCK_COUNT% gtr 10 echo    "High lock count", >> "%STATUS_FILE%"
    if "%DISK_PERCENT:~0,1%" gtr "80" echo    "Disk usage above 80%%", >> "%STATUS_FILE%"
    if not "%ZERO_ROW_TABLES%"=="" echo    "Critical tables with zero rows", >> "%STATUS_FILE%"
) else (
    echo    "No issues detected" >> "%STATUS_FILE%"
)

echo  ]
) >> "%STATUS_FILE%"

call :LOG "Health status file created: %STATUS_FILE%"

REM ============================================================
REM HEALTH SUMMARY
REM ============================================================
call :LOG ""
call :LOG "=========================================="
call :LOG "HEALTH CHECK SUMMARY"
call :LOG "=========================================="
call :LOG "Overall Health Status: %HEALTH_STATUS%"
call :LOG "Issues Found: %ISSUES_FOUND%"
call :LOG ""
call :LOG "Detailed Status:"
call :LOG "  Container: %CONTAINER_STATUS% (%HEALTH_STATUS_DETAIL%)"
call :LOG "  Database: %DB_STATUS%"
call :LOG "  Tables: %TABLE_COUNT%/%EXPECTED_TABLE_COUNT%"
call :LOG "  Size: %DB_SIZE%"
call :LOG "  Connections: %ACTIVE_CONNECTIONS%"
call :LOG "  Long Queries: %LONG_QUERIES%"
call :LOG "  Locks: %LOCK_COUNT%"
call :LOG "  Disk: %DISK_USED% used, %DISK_AVAILABLE% available"
call :LOG "  Migrations: %MIGRATION_COUNT%"
call :LOG "=========================================="

REM Cleanup log file (keep last 200 lines)
powershell -Command "Get-Content '%LOG_FILE%' | Select-Object -Last 200 | Set-Content '%LOG_FILE%'"

REM ============================================================
REM EXIT CODE BASED ON HEALTH
REM ============================================================
if "%HEALTH_STATUS%"=="healthy" (
    call :LOG ""
    call :LOG "RESULT: All checks passed - Database is healthy"
    set EXIT_CODE=0
) else (
    call :LOG ""
    call :LOG "RESULT: Issues detected - Review log above"
    set EXIT_CODE=1
)

ENDLOCAL
exit /b %EXIT_CODE%
