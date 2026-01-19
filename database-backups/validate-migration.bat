@echo off
REM ============================================================
REM Migration Validation Script
REM Purpose: Validates database state after migration
REM Usage: Run this script AFTER executing any migration
REM Checks: Table count, data integrity, foreign keys, indexes
REM ============================================================

SETLOCAL EnableDelayedExpansion

REM Configuration
SET CONTAINER_NAME=smarttech_postgres
SET DB_NAME=smart_ecommerce_dev
SET DB_USER=smart_dev
SET LOG_FILE=%~dp0logs\validate-migration.log
SET EXPECTED_TABLE_COUNT=40

REM Create log directory if not exists
if not exist "%~dp0logs" mkdir "%~dp0logs"

REM Log function
:LOG
echo [%date% %time%] %* >> "%LOG_FILE%"
goto :EOF

REM Start logging
call :LOG "=========================================="
call :LOG "Starting Migration Validation"
call :LOG "=========================================="

REM Check if Docker container is running
docker ps | findstr /C:"%CONTAINER_NAME%" >nul
if %errorlevel% neq 0 (
    call :LOG "ERROR: Docker container %CONTAINER_NAME% is not running"
    exit /b 1
)

call :LOG "Docker container is running"

REM ============================================================
REM Check 1: Table Count
REM ============================================================
call :LOG ""
call :LOG "CHECK 1: Verifying Table Count"
call :LOG "----------------------------------------"

for /f %%i in ('docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" -t') do set TABLE_COUNT=%%i
call :LOG "Expected tables: %EXPECTED_TABLE_COUNT%"
call :LOG "Actual tables: %TABLE_COUNT%"

if %TABLE_COUNT% equ %EXPECTED_TABLE_COUNT% (
    call :LOG "PASS: Table count matches expected value"
    set VALIDATION_PASSED=1
) else (
    call :LOG "FAIL: Table count mismatch! Expected %EXPECTED_TABLE_COUNT%, found %TABLE_COUNT%"
    set VALIDATION_PASSED=0
)

REM List all tables
call :LOG "Current tables:"
docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" >> "%LOG_FILE%"

REM ============================================================
REM Check 2: Critical Tables Exist
REM ============================================================
call :LOG ""
call :LOG "CHECK 2: Verifying Critical Tables"
call :LOG "----------------------------------------"

set CRITICAL_TABLES=users products orders categories brands addresses carts wishlists reviews coupons transactions
set MISSING_TABLES=

for %%T in (%CRITICAL_TABLES%) do (
    docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '%%T';" -t | findstr /C:"1" >nul
    if %errorlevel% neq 0 (
        call :LOG "FAIL: Critical table '%%T' is missing"
        set MISSING_TABLES=!MISSING_TABLES! %%T
        set VALIDATION_PASSED=0
    ) else (
        call :LOG "PASS: Critical table '%%T' exists"
    )
)

if "%MISSING_TABLES%"=="" (
    call :LOG "PASS: All critical tables present"
)

REM ============================================================
REM Check 3: Data Integrity - Row Counts
REM ============================================================
call :LOG ""
call :LOG "CHECK 3: Verifying Data Integrity"
call :LOG "----------------------------------------"

docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "
SELECT 
    schemaname,
    tablename,
    n_live_tup as row_count,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables 
WHERE schemaname = 'public' 
ORDER BY n_live_tup DESC
LIMIT 15;" >> "%LOG_FILE%"

REM Check for tables with zero rows
set ZERO_ROW_TABLES=
for /f "tokens=1,2" %%a in ('docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "SELECT tablename, n_live_tup FROM pg_stat_user_tables WHERE schemaname = 'public' AND n_live_tup = 0;" -t') do (
    if not "%%a"=="tablename" (
        call :LOG "WARNING: Table '%%a' has zero rows"
        set ZERO_ROW_TABLES=!ZERO_ROW_TABLES! %%a
    )
)

if "%ZERO_ROW_TABLES%"=="" (
    call :LOG "PASS: No tables with zero unexpected rows"
)

REM ============================================================
REM Check 4: Foreign Key Integrity
REM ============================================================
call :LOG ""
call :LOG "CHECK 4: Verifying Foreign Key Integrity"
call :LOG "----------------------------------------"

docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
LIMIT 10;" >> "%LOG_FILE%"

REM Check for broken foreign keys
docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "
SELECT COUNT(*) as broken_fks
FROM pg_constraint
WHERE contype = 'f'
AND NOT EXISTS (
    SELECT 1 FROM pg_class 
    WHERE pg_class.oid = pg_constraint.conrelid
);" -t >nul

for /f %%i in ('docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "SELECT COUNT(*) as broken_fks FROM pg_constraint WHERE contype = 'f' AND NOT EXISTS (SELECT 1 FROM pg_class WHERE pg_class.oid = pg_constraint.conrelid);" -t') do set BROKEN_FKS=%%i
call :LOG "Foreign key constraints found: %BROKEN_FKS%"

REM ============================================================
REM Check 5: Index Status
REM ============================================================
call :LOG ""
call :LOG "CHECK 5: Verifying Index Status"
call :LOG "----------------------------------------"

docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
LIMIT 10;" >> "%LOG_FILE%"

REM Check for missing indexes on foreign keys
docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "
SELECT COUNT(*) as missing_indexes
FROM pg_constraint
WHERE contype = 'f'
AND NOT EXISTS (
    SELECT 1 FROM pg_index 
    WHERE pg_index.indrelid = pg_constraint.conrelid
);" -t >nul

for /f %%i in ('docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "SELECT COUNT(*) as missing_indexes FROM pg_constraint WHERE contype = 'f' AND NOT EXISTS (SELECT 1 FROM pg_index WHERE pg_index.indrelid = pg_constraint.conrelid);" -t') do set MISSING_INDEXES=%%i
call :LOG "Foreign keys without indexes: %MISSING_INDEXES%"

REM ============================================================
REM Check 6: Migration Status
REM ============================================================
call :LOG ""
call :LOG "CHECK 6: Verifying Migration Status"
call :LOG "----------------------------------------"

for /f %%i in ('docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "SELECT COUNT(*) FROM _prisma_migrations;" -t') do set MIGRATION_COUNT=%%i
call :LOG "Total migrations applied: %MIGRATION_COUNT%"

docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "SELECT migration_name, started_at, finished_at, applied_steps_count FROM _prisma_migrations ORDER BY started_at DESC LIMIT 5;" >> "%LOG_FILE%"

REM ============================================================
REM Check 7: Database Size
REM ============================================================
call :LOG ""
call :LOG "CHECK 7: Verifying Database Size"
call :LOG "----------------------------------------"

for /f %%i in ('docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "SELECT pg_size_pretty(pg_database_size('%DB_NAME%));" -t') do set DB_SIZE=%%i
call :LOG "Database size: %DB_SIZE%"

REM Get table sizes
docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;" >> "%LOG_FILE%"

REM ============================================================
REM Check 8: Enum Types
REM ============================================================
call :LOG ""
call :LOG "CHECK 8: Verifying Enum Types"
call :LOG "----------------------------------------"

docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname;" >> "%LOG_FILE%"

REM ============================================================
REM Validation Summary
REM ============================================================
call :LOG ""
call :LOG "=========================================="
call :LOG "VALIDATION SUMMARY"
call :LOG "=========================================="

if %VALIDATION_PASSED% equ 1 (
    call :LOG "OVERALL RESULT: PASSED"
    call :LOG "All critical checks passed successfully"
    set EXIT_CODE=0
) else (
    call :LOG "OVERALL RESULT: FAILED"
    call :LOG "Some checks failed - review log above"
    set EXIT_CODE=1
)

call :LOG ""
call :LOG "Validation Details:"
call :LOG "  Table Count: %TABLE_COUNT% / %EXPECTED_TABLE_COUNT%"
call :LOG "  Critical Tables: %CRITICAL_TABLES%"
if not "%MISSING_TABLES%"=="" (
    call :LOG "  Missing Tables: %MISSING_TABLES%"
)
if not "%ZERO_ROW_TABLES%"=="" (
    call :LOG "  Zero-Row Tables: %ZERO_ROW_TABLES%"
)
call :LOG "  Foreign Keys: %BROKEN_FKS%"
call :LOG "  Missing Indexes: %MISSING_INDEXES%"
call :LOG "  Migrations Applied: %MIGRATION_COUNT%"
call :LOG "  Database Size: %DB_SIZE%"
call :LOG "=========================================="

REM Cleanup log file (keep last 300 lines)
powershell -Command "Get-Content '%LOG_FILE%' | Select-Object -Last 300 | Set-Content '%LOG_FILE%'"

call :LOG ""
call :LOG "NEXT STEPS:"
if %VALIDATION_PASSED% equ 1 (
    call :LOG "1. Migration validation passed"
    call :LOG "2. Test application functionality"
    call :LOG "3. Monitor for any issues"
) else (
    call :LOG "1. Review validation failures above"
    call :LOG "2. Check migration SQL for errors"
    call :LOG "3. Consider rollback if critical issues found"
    call :LOG "4. Use restore script if needed"
)
call :LOG "=========================================="

ENDLOCAL
exit /b %EXIT_CODE%
