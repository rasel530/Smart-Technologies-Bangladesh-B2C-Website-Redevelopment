# Admin User Setup Guide

## Problem
When logging in with `admin@smarttech.com / admin123`, the user is redirected to `/account` instead of `/admin` page. This is because:
1. The database stores roles in uppercase (`ADMIN`)
2. The frontend checks for lowercase (`admin`)
3. No admin user exists in the database

## Solution
Convert all enum values to lowercase throughout the system (database, backend, and frontend) for consistency.

## Step-by-Step Instructions

### Step 1: Update Prisma Schema
The schema has already been updated to use lowercase enum values:
- `ADMIN` → `admin`
- `CUSTOMER` → `customer`
- `ACTIVE` → `active`
- `PENDING` → `pending`
- And all other enums

### Step 2: Migrate Database to Lowercase

Run the migration script to convert existing data:

```bash
cd backend
node migrate-to-lowercase-roles.js
```

This will update all existing enum values in the database to lowercase.

### Step 3: Apply Prisma Migration

After the data migration, apply the schema changes:

```bash
cd backend
npx prisma migrate dev --name update_enums_to_lowercase
```

This will update the database schema to use lowercase enum definitions.

### Step 4: Create Admin User

Run the admin user creation script:

```bash
cd backend
node create-admin-user.js
```

This will:
- Check if admin user exists
- Create admin user if not exists (or update if exists)
- Set credentials to: `admin@smarttech.com / admin123`
- Set role to `admin` (lowercase)
- Set status to `active` (lowercase)

### Step 5: Verify Admin User

Run the check script to verify:

```bash
cd backend
node check-admin-users.js
```

This will display all admin users in the database.

### Step 6: Restart Backend

Restart the backend server to apply all changes:

```bash
cd backend
npm run dev
# or
npm start
```

### Step 7: Test Admin Login

1. Open browser: `http://localhost:3000/login`
2. Enter credentials:
   - Email: `admin@smarttech.com`
   - Password: `admin123`
3. Click Login
4. You should be redirected to: `http://localhost:3000/admin`

## Troubleshooting

### Issue: Login redirects to `/account` instead of `/admin`

**Cause:** User role is not `admin` (lowercase)

**Solution:**
```bash
cd backend
node create-admin-user.js
```

### Issue: Migration fails

**Cause:** Database connection issues or existing data conflicts

**Solution:**
1. Check `.env` file has correct `DATABASE_URL`
2. Ensure PostgreSQL is running
3. Check database connection: `node healthcheck.js`

### Issue: Prisma migration fails

**Cause:** Schema conflicts or pending migrations

**Solution:**
```bash
cd backend
npx prisma migrate reset
# This will reset the database (WARNING: deletes all data)
npx prisma migrate dev --name update_enums_to_lowercase
```

### Issue: Admin user already exists with wrong role

**Solution:**
```bash
cd backend
node fix-admin-user.js
```

## Files Modified

### Backend
- `backend/prisma/schema.prisma` - Updated all enums to lowercase
- `backend/routes/auth.js` - Updated role/status references to lowercase
- `backend/create-admin-user.js` - New script to create admin user
- `backend/migrate-to-lowercase-roles.js` - New migration script
- `backend/check-admin-users.js` - Updated to use lowercase
- `backend/fix-admin-user.js` - Updated to use lowercase

### Frontend
- `frontend/src/app/admin/page.tsx` - Already checks for lowercase 'admin'
- `frontend/src/contexts/AuthContext.tsx` - No changes needed

## Admin User Credentials

After setup, use these credentials to login:

- **Email:** `admin@smarttech.com`
- **Password:** `admin123`
- **Role:** `admin`
- **Status:** `active`

## Security Notes

1. **Change Default Password:** After first login, change the default password
2. **Use Strong Password:** The default `admin123` is weak - change it immediately
3. **Enable 2FA:** Enable two-factor authentication for admin accounts
4. **Limit Admin Access:** Only grant admin role to trusted personnel

## Next Steps

After successful admin login, you can:
1. Access admin dashboard at `/admin`
2. Manage user roles at `/admin/roles`
3. Configure system settings
4. View analytics and reports

## Additional Commands

### Check all users
```bash
cd backend
node -e "const {PrismaClient} = require('@prisma/client'); const prisma = new PrismaClient(); (async () => { const users = await prisma.user.findMany({select: {email: true, role: true, status: true}}); console.table(users); await prisma.\$disconnect(); })();"
```

### Update admin password
```bash
cd backend
node -e "const {PrismaClient} = require('@prisma/client'); const bcrypt = require('bcryptjs'); const prisma = new PrismaClient(); (async () => { const hash = await bcrypt.hash('newpassword', 12); await prisma.user.update({where: {email: 'admin@smarttech.com'}, data: {password: hash}}); console.log('Password updated'); await prisma.\$disconnect(); })();"
```

### Reset admin user
```bash
cd backend
node create-admin-user.js
```

## Support

If you encounter any issues:
1. Check backend logs for errors
2. Verify database connection
3. Ensure all migrations are applied
4. Check that admin user exists with correct role

## Summary

This guide provides a complete solution to:
1. Convert all enum values to lowercase for consistency
2. Create an admin user with proper credentials
3. Ensure admin login redirects correctly to `/admin` page
4. Provide troubleshooting steps for common issues

Follow all steps in order for successful admin user setup.
