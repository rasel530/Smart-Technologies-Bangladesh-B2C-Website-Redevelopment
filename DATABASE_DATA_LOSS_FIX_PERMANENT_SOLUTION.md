# Database Data Loss - Permanent Fix

## Problem Identified

The `smart_ecommerce_dev` database was losing all data every time containers restarted. The root cause was a **conflict between two database initialization systems**:

### Root Cause

1. **PostgreSQL init scripts** ([`postgresql/init/02-create-ecommerce-database.sql`](postgresql/init/02-create-ecommerce-database.sql)) were creating tables using `CREATE TABLE` statements
2. **Prisma migrations** ([`backend/scripts/run-migrations.js`](backend/scripts/run-migrations.js)) were running `prisma migrate deploy` on backend startup
3. These two systems conflicted, causing Prisma to potentially drop/recreate tables when containers restarted

### Specific Issues

- PostgreSQL init scripts created tables without proper `IF NOT EXISTS` checks
- Prisma migrations were re-running on every container restart
- When both systems tried to manage the same tables, data was lost
- The PostgreSQL volume mount (`postgres_data:/var/lib/postgresql/data`) was correctly configured, but the schema conflicts were causing data to be dropped

## Solution Implemented

### 1. Updated PostgreSQL Init Scripts

**File: [`postgresql/init/02-create-ecommerce-database.sql`](postgresql/init/02-create-ecommerce-database.sql)**

**Changes:**
- Removed all `CREATE TABLE` statements
- Removed all schema creation statements (users, products, orders, etc.)
- Kept only database and user creation with proper `IF NOT EXISTS` checks
- Kept only extension creation and permission grants
- Added comments explaining that Prisma migrations handle schema/table creation

**Why this fixes it:**
- PostgreSQL init scripts now only create the database and user, not tables
- Prisma becomes the single source of truth for schema management
- No more conflicts between two systems trying to manage tables

### 2. Updated Security Setup Script

**File: [`postgresql/init/03-security-setup.sql`](postgresql/init/03-security-setup.sql)**

**Changes:**
- Removed references to non-existent users (`smarttech_user`, `smarttech_db`)
- Added `IF NOT EXISTS` checks for audit log table
- Added `IF NOT EXISTS` checks for indexes
- Kept only essential security setup that doesn't conflict with Prisma

**Why this fixes it:**
- Prevents errors from trying to grant permissions to non-existent users
- Ensures audit log and indexes are only created if they don't exist
- Maintains security without conflicting with Prisma

### 3. Enhanced Migration Runner

**File: [`backend/scripts/run-migrations.js`](backend/scripts/run-migrations.js)**

**Changes:**
- Added detailed comments explaining that `migrate deploy` is safe for production
- Added logic to check if database is empty before seeding
- Added automatic seeding only when database is empty
- Added better error handling and logging

**Why this fixes it:**
- `migrate deploy` only runs pending migrations, never drops data
- Automatic seeding only happens on first run, not on every restart
- Clear logging helps diagnose any issues

### 4. Seed Script Already Safe

**File: [`backend/prisma/seed.js`](backend/prisma/seed.js)**

**Status:** Already using `upsert` operations, which are safe and won't overwrite existing data

## How It Works Now

### Container Startup Flow

1. **PostgreSQL container starts**
   - Creates database `smart_ecommerce_dev` (if not exists)
   - Creates user `smart_dev` (if not exists)
   - Creates extensions (`uuid-ossp`, `pg_trgm`)
   - Grants permissions to `smart_dev` user
   - **Does NOT create any tables**

2. **Backend container starts**
   - Runs `prisma migrate deploy` (only pending migrations)
   - Generates Prisma client
   - Checks if database is empty
   - Runs seed script only if database is empty (first time only)
   - Starts the application

3. **Subsequent container restarts**
   - PostgreSQL: Database and user already exist, nothing changes
   - Backend: No pending migrations, nothing changes
   - **Data is preserved**

### Key Benefits

✅ **Single source of truth**: Prisma manages all schema and tables
✅ **No data loss**: `migrate deploy` never drops data
✅ **Idempotent**: Scripts can run multiple times safely
✅ **Automatic seeding**: Only seeds on first run
✅ **Clear separation**: PostgreSQL init handles DB/user, Prisma handles schema/data
✅ **Persistent data**: Docker volume correctly preserves all data

## Verification Steps

### 1. Stop all containers
```bash
docker-compose down
```

### 2. Remove PostgreSQL volume (to start fresh)
```bash
docker volume rm smarttech_postgres_data
```

### 3. Start containers
```bash
docker-compose up -d
```

### 4. Check database has data
```bash
# Connect to PostgreSQL
docker exec -it smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev

# Check tables exist
\dt

# Check users exist
SELECT COUNT(*) FROM users;

# Check products exist
SELECT COUNT(*) FROM products;

# Exit
\q
```

### 5. Stop and restart containers
```bash
docker-compose restart
```

### 6. Verify data is preserved
```bash
# Connect again and check data still exists
docker exec -it smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev

SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM products;
```

**Expected result:** Data should still be present after restart

## Testing the Fix

### Manual Testing

1. Create a test user via API:
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

2. Verify user exists in database:
```bash
docker exec -it smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev \
  -c "SELECT email, firstName, lastName FROM users WHERE email = 'test@example.com';"
```

3. Restart containers:
```bash
docker-compose restart
```

4. Verify user still exists:
```bash
docker exec -it smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev \
  -c "SELECT email, firstName, lastName FROM users WHERE email = 'test@example.com';"
```

**Expected result:** User should still exist after restart

## Important Notes

### Docker Volume Configuration

The [`docker-compose.yml`](docker-compose.yml:223-224) already has correct volume configuration:

```yaml
volumes:
  postgres_data:
    driver: local
```

This volume is mounted to PostgreSQL at `/var/lib/postgresql/data` and will persist all data correctly now that the schema conflicts are resolved.

### Prisma Migration Commands

- **`prisma migrate deploy`**: Safe for production, only runs pending migrations, never drops data
- **`prisma migrate dev`**: For development, creates new migrations
- **`prisma db push`**: Pushes schema changes directly (use with caution)
- **`prisma migrate reset`**: DANGEROUS - drops and recreates database

We use `migrate deploy` in the startup script for safety.

### When to Create New Migrations

When you modify [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma):

1. Create a new migration:
```bash
cd backend
npx prisma migrate dev --name describe_your_changes
```

2. This will create a new migration in `prisma/migrations/`
3. On next container restart, `migrate deploy` will apply it automatically
4. Data will be preserved

## Troubleshooting

### If data is still lost

1. Check PostgreSQL logs:
```bash
docker logs smarttech_postgres
```

2. Check backend logs:
```bash
docker logs smarttech_backend
```

3. Verify volume exists:
```bash
docker volume ls | grep postgres
```

4. Check volume contents:
```bash
docker run --rm -v smarttech_postgres_data:/data alpine ls -la /data
```

### If migrations fail

1. Check migration status:
```bash
docker exec -it smarttech_backend npx prisma migrate status
```

2. Reset database (WARNING: This deletes all data):
```bash
docker exec -it smarttech_backend npx prisma migrate reset
```

3. Re-run migrations:
```bash
docker exec -it smarttech_backend npx prisma migrate deploy
```

## Summary

This fix ensures that:

✅ Database data persists across container restarts
✅ Prisma is the single source of truth for schema management
✅ No conflicts between PostgreSQL init scripts and Prisma migrations
✅ Automatic seeding only happens on first run
✅ All existing data is preserved
✅ New migrations can be added safely

The root cause was two systems trying to manage the same tables. By making Prisma the single source of truth and ensuring PostgreSQL init scripts only handle database/user creation, we've eliminated the conflict and prevented data loss.
