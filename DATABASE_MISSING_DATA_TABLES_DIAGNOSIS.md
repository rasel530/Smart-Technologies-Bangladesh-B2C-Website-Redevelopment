# Database Missing Data and Tables - Diagnosis Report

**Date:** 2026-01-11  
**Database:** smart_ecommerce_dev  
**Status:** DIAGNOSIS COMPLETE

---

## Executive Summary

The `smart_ecommerce_dev` database has two main issues:
1. **Missing Tables:** 5 out of 28 expected tables are missing
2. **Missing Data:** All existing tables are empty (0 rows)

---

## Diagnostic Findings

### 1. Missing Tables (5 tables)

The following tables defined in [`schema.prisma`](backend/prisma/schema.prisma) are missing from the database:

| Table Name | Purpose | Status |
|------------|---------|--------|
| `user_notification_preferences` | User notification settings | ❌ MISSING |
| `user_communication_preferences` | User communication settings | ❌ MISSING |
| `user_privacy_settings` | User privacy controls | ❌ MISSING |
| `account_deletion_requests` | Account deletion requests | ❌ MISSING |
| `user_data_exports` | User data export requests | ❌ MISSING |

**Total Tables Found:** 24  
**Expected Tables:** 28  
**Missing Tables:** 5

### 2. Data Status

All key tables are completely empty:

| Table | Row Count |
|-------|-----------|
| users | 0 |
| products | 0 |
| categories | 0 |
| brands | 0 |
| orders | 0 |
| carts | 0 |

### 3. Migration History

The following migrations have been applied:

1. `add_account_deletion_columns` - Added account deletion columns to users table
2. `20260109_add_single_default_address_constraint` - Added address constraint
3. `20260108_add_preferred_language` - Added preferred language to users
4. `20260105062541_init` - Initial schema (created 23 tables)

**Problem:** The initial migration (`20260105062541_init`) created only 23 tables, but the current [`schema.prisma`](backend/prisma/schema.prisma) defines 28 tables.

### 4. Container Status

All containers are running:
- ✅ PostgreSQL: Running (healthy)
- ✅ Backend: Running
- ✅ Redis: Running (healthy)
- ✅ Elasticsearch: Running (healthy)
- ✅ Frontend: Running

### 5. PostgreSQL Logs Analysis

Key findings from logs:
- Database was not properly shut down at 12:09:29 UTC
- Automatic recovery occurred at 12:13:02 UTC
- "PostgreSQL Database directory appears to contain a database; Skipping initialization"
- Error: `relation "_prisma_migrations_lock" does not exist`

### 6. Backend Logs Analysis

Key findings from logs:
- ✅ Prisma Client generated successfully
- ✅ Database connected successfully
- ⚠️ Seed script check ran but no indication it executed
- No errors during startup

---

## Root Causes

### Primary Root Cause #1: Schema Drift

**Issue:** The [`schema.prisma`](backend/prisma/schema.prisma) file has been updated to include 5 new tables (user_notification_preferences, user_communication_preferences, user_privacy_settings, account_deletion_requests, user_data_exports), but no migration has been created for these tables.

**Evidence:**
- The initial migration `20260105062541_init` creates only 23 tables
- The current [`schema.prisma`](backend/prisma/schema.prisma) defines 28 tables
- No migration file exists for the 5 missing tables
- The migration history shows only 4 migrations applied

**Impact:** The 5 missing tables are not created in the database, which will cause errors when the application tries to access them.

### Primary Root Cause #2: Missing Seed Data

**Issue:** The database has no data in any table. The seed script check ran during backend startup but did not populate the database.

**Evidence:**
- Backend logs show: "🔄 Checking if database needs seeding..."
- User count is 0, which should trigger seeding according to [`run-migrations.js`](backend/scripts/run-migrations.js)
- No logs indicating seed script execution
- All tables are empty

**Possible Causes:**
1. The seed script ([`seed.js`](backend/prisma/seed.js)) may not exist or is not executable
2. The seed script may have failed silently
3. The condition to run the seed script may not have been met

### Secondary Root Cause #3: Database Recovery

**Issue:** PostgreSQL performed automatic recovery after an improper shutdown, which may have caused data loss or corruption.

**Evidence:**
- Logs show: "database system was interrupted; last known up at 2026-01-11 12:09:29 UTC"
- Logs show: "database system was not properly shut down; automatic recovery in progress"

**Impact:** This may have contributed to the data loss, though the schema should have remained intact.

---

## Recommended Solutions

### Solution 1: Create Missing Migration

Create a new migration to add the 5 missing tables:

```bash
cd backend
npx prisma migrate dev --name add_user_preferences_and_account_management
```

This will:
1. Compare the current [`schema.prisma`](backend/prisma/schema.prisma) with the database schema
2. Generate a migration to create the missing tables
3. Apply the migration to the database

### Solution 2: Run Seed Script

Manually run the seed script to populate the database with initial data:

```bash
cd backend
node prisma/seed.js
```

Or verify the seed script exists and is properly configured.

### Solution 3: Verify Migration History

Check if the migration history is correct and all migrations are applied:

```bash
cd backend
npx prisma migrate status
```

### Solution 4: Reset and Rebuild (Last Resort)

If the above solutions don't work, consider resetting the database:

```bash
cd backend
npx prisma migrate reset --force
```

**WARNING:** This will delete all data and reapply all migrations.

---

## Next Steps

1. **Immediate:** Create a new migration to add the 5 missing tables
2. **Immediate:** Run the seed script to populate the database with initial data
3. **Verify:** Run the diagnostic script again to confirm all issues are resolved
4. **Preventative:** Ensure that schema changes always include corresponding migrations
5. **Preventative:** Implement proper database backup procedures to prevent future data loss

---

## Additional Notes

- The database size is 8501 kB, which is small for an e-commerce database
- The migration lock table (`_prisma_migrations_lock`) does not exist, which is unusual
- The PostgreSQL container has been running for 22 minutes and was restarted at 12:13:02 UTC
- All database connections are working properly
- Redis and other services are functioning normally

---

## Files Referenced

- [`docker-compose.yml`](docker-compose.yml) - Container configuration
- [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma) - Database schema definition
- [`backend/scripts/run-migrations.js`](backend/scripts/run-migrations.js) - Migration runner script
- [`backend/prisma/migrations/20260105062541_init/migration.sql`](backend/prisma/migrations/20260105062541_init/migration.sql) - Initial migration
- [`backend/diagnose-database.js`](backend/diagnose-database.js) - Diagnostic script (created for this analysis)

---

**Report Generated:** 2026-01-11T12:22:00Z  
**Diagnostic Tool:** [`backend/diagnose-database.js`](backend/diagnose-database.js)
