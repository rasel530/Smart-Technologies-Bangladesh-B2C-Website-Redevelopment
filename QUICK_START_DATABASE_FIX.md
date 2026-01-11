# Quick Start Guide - Database Data Loss Fix

## What Was Fixed

The database was losing all data on every container restart due to conflicts between:
- PostgreSQL init scripts creating tables
- Prisma migrations also creating tables

**Solution:** Made Prisma the single source of truth for schema management.

## How to Apply the Fix

### Option 1: Fresh Start (Recommended)

1. **Stop all containers:**
   ```bash
   docker-compose down
   ```

2. **Remove the PostgreSQL volume to start fresh:**
   ```bash
   docker volume rm smarttech_postgres_data
   ```

3. **Start containers with the fix:**
   ```bash
   docker-compose up -d
   ```

4. **Verify the fix:**
   ```bash
   # On Linux/Mac
   chmod +x verify-database-fix.sh
   ./verify-database-fix.sh

   # On Windows
   verify-database-fix.bat
   ```

### Option 2: Apply to Existing Setup

If you want to keep existing data (not recommended if data is already corrupted):

1. **Stop containers:**
   ```bash
   docker-compose down
   ```

2. **Backup existing data (optional):**
   ```bash
   docker run --rm -v smarttech_postgres_data:/data -v %cd%:/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .
   ```

3. **Start containers:**
   ```bash
   docker-compose up -d
   ```

4. **Verify the fix:**
   ```bash
   ./verify-database-fix.sh
   ```

## What Happens Now

### First Container Start

1. PostgreSQL creates database and user (no tables)
2. Backend runs Prisma migrations (creates all tables)
3. Backend seeds initial data (admin user, test data)
4. All data is stored in Docker volume

### Subsequent Container Restarts

1. PostgreSQL: Database and user already exist, nothing changes
2. Backend: No pending migrations, nothing changes
3. **All data is preserved!**

## Testing Data Persistence

### Test 1: Create a user via API

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

### Test 2: Verify user exists

```bash
docker exec -it smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev \
  -c "SELECT email, firstName, lastName FROM users WHERE email = 'test@example.com';"
```

### Test 3: Restart containers

```bash
docker-compose restart
```

### Test 4: Verify user still exists

```bash
docker exec -it smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev \
  -c "SELECT email, firstName, lastName FROM users WHERE email = 'test@example.com';"
```

**Expected result:** User should still exist after restart!

## Default Login Credentials

After the fix, these default accounts will be created:

### Admin Account
- **Email:** admin@smarttech.com
- **Password:** admin123
- **Role:** ADMIN

### Test Customer Account
- **Email:** customer@example.com
- **Password:** customer123
- **Role:** CUSTOMER

## Files Modified

1. [`postgresql/init/02-create-ecommerce-database.sql`](postgresql/init/02-create-ecommerce-database.sql)
   - Removed all table creation statements
   - Now only creates database, user, and permissions

2. [`postgresql/init/03-security-setup.sql`](postgresql/init/03-security-setup.sql)
   - Added `IF NOT EXISTS` checks
   - Removed references to non-existent users

3. [`backend/scripts/run-migrations.js`](backend/scripts/run-migrations.js)
   - Enhanced with automatic seeding logic
   - Only seeds on first run (when database is empty)

## Verification Scripts

Two verification scripts are provided:

### Linux/Mac: [`verify-database-fix.sh`](verify-database-fix.sh)
```bash
chmod +x verify-database-fix.sh
./verify-database-fix.sh
```

### Windows: [`verify-database-fix.bat`](verify-database-fix.bat)
```cmd
verify-database-fix.bat
```

These scripts check:
- ✅ Containers are running
- ✅ Database exists
- ✅ Tables are created
- ✅ Data is present
- ✅ Volume is configured
- ✅ Migration status

## Troubleshooting

### Data still lost after restart?

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

### Migrations failing?

1. Check migration status:
   ```bash
   docker exec -it smarttech_backend npx prisma migrate status
   ```

2. Reset database (WARNING: Deletes all data):
   ```bash
   docker exec -it smarttech_backend npx prisma migrate reset
   ```

### Can't connect to database?

1. Check database exists:
   ```bash
   docker exec -it smarttech_postgres psql -U smart_dev -d postgres -c "\l"
   ```

2. Check user exists:
   ```bash
   docker exec -it smarttech_postgres psql -U smart_dev -d postgres -c "\du"
   ```

3. Test connection:
   ```bash
   docker exec -it smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "SELECT 1;"
   ```

## Next Steps

1. **Apply the fix** using Option 1 (fresh start) or Option 2 (existing setup)
2. **Run verification script** to confirm everything works
3. **Test data persistence** by creating data and restarting containers
4. **Monitor logs** for any issues
5. **Review documentation** in [`DATABASE_DATA_LOSS_FIX_PERMANENT_SOLUTION.md`](DATABASE_DATA_LOSS_FIX_PERMANENT_SOLUTION.md) for detailed information

## Important Notes

- ✅ The fix makes Prisma the single source of truth for schema
- ✅ PostgreSQL init scripts only handle database/user creation
- ✅ `prisma migrate deploy` is safe and never drops data
- ✅ Automatic seeding only happens on first run
- ✅ Docker volume correctly persists all data
- ✅ No more conflicts between initialization systems

## Support

For detailed information about the fix, see:
- [`DATABASE_DATA_LOSS_FIX_PERMANENT_SOLUTION.md`](DATABASE_DATA_LOSS_FIX_PERMANENT_SOLUTION.md) - Complete technical documentation

For verification and testing:
- [`verify-database-fix.sh`](verify-database-fix.sh) - Linux/Mac verification script
- [`verify-database-fix.bat`](verify-database-fix.bat) - Windows verification script
