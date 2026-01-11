# Single Default Address Constraint Fix - Summary

## Overview
Successfully implemented a database-level constraint to enforce that each user can have only one default address. This provides data integrity at the database level, complementing the existing API-layer enforcement.

## Problem Statement
The Address model in [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma) did not have a database-level constraint to ensure only one default address per user. While the API layer correctly enforced this, having database-level enforcement provides better data integrity and prevents potential data inconsistencies.

## Solution Implemented

### 1. Updated Prisma Schema
Modified [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma) to add documentation about the partial unique index constraint:

```prisma
// Address Management with Bangladesh-specific structure
model Address {
  id            String      @id @default(uuid())
  userId        String
  type          AddressType  @default(SHIPPING)
  firstName     String
  lastName      String
  phone         String?
  address       String
  addressLine2   String?
  city           String
  district       String
  division       Division
  upazila       String?
  postalCode     String?
  isDefault      Boolean     @default(false)
  
  user          User         @relation(fields: [userId], references: [id])
  orders        Order[]
  
  // Partial unique index to ensure only one default address per user
  // Enforced at database level via migration: unique_default_address_per_user
  @@map("addresses")
}
```

### 2. Created Migration File
Created [`backend/prisma/migrations/20260109_add_single_default_address_constraint/migration.sql`](backend/prisma/migrations/20260109_add_single_default_address_constraint/migration.sql):

```sql
-- Add partial unique index to ensure only one default address per user
-- This is a PostgreSQL-specific feature that enforces the constraint at the database level
CREATE UNIQUE INDEX "unique_default_address_per_user" 
ON "addresses" ("userId") 
WHERE "isDefault" = true;
```

### 3. Applied Migration to Database
Successfully applied the migration to the PostgreSQL database using Docker:
```bash
docker cp backend/prisma/migrations/20260109_add_single_default_address_constraint/migration.sql smarttech_postgres:/tmp/migration.sql
docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -f /tmp/migration.sql
```

## Technical Details

### PostgreSQL Partial Unique Index
This implementation uses PostgreSQL's partial unique index feature, which allows creating a unique constraint that only applies to rows matching a specific condition. In this case:

- **Index Name**: `unique_default_address_per_user`
- **Indexed Field**: `userId`
- **Condition**: `WHERE "isDefault" = true`
- **Effect**: Ensures that for each user, only one row can have `isDefault = true`

### Benefits
1. **Database-Level Enforcement**: Data integrity is enforced at the database level, not just in application code
2. **Performance**: Partial indexes are smaller and faster than full indexes
3. **Flexibility**: Users can have multiple non-default addresses without restriction
4. **Double Safeguard**: Works in conjunction with existing API-layer validation

## Verification

### Database Schema Verification
Verified the constraint was successfully applied to the database:

```sql
\d addresses
```

Output shows:
```
Indexes:
    "addresses_pkey" PRIMARY KEY, btree (id)
    "unique_default_address_per_user" UNIQUE, btree ("userId") WHERE "isDefault" = true
```

### Functional Testing
Created comprehensive test script [`backend/test-single-default-address-constraint.js`](backend/test-single-default-address-constraint.js) that validates:

1. ✅ User can create one default address (succeeds)
2. ✅ User cannot create multiple default addresses (fails with P2002 error)
3. ✅ User can create multiple non-default addresses (succeeds)
4. ✅ Only one default address exists per user (verified)

### Test Results
```
============================================================
Testing Single Default Address Constraint
============================================================

[Step 1] Creating test user...
✓ Test user created: 1ab7e473-5bbd-4c3f-bfef-5ac09b8b8ab5

[Step 2] Creating first default address...
✓ First default address created: 3682f2dc-5842-48d6-9667-fd201b63cda3
  isDefault: true

[Step 3] Attempting to create second default address (should fail)...
✓ Expected error occurred: P2002
  Error message: Unique constraint failed on fields: (`userId`)
  ✓ Correct: Unique constraint violation (P2002)

[Step 4] Creating non-default address (should succeed)...
✓ Non-default address created: 893cc115-2eb2-4ccc-98df-a56e61d2bc65
  isDefault: false

[Step 5] Verifying current addresses for user...
Total addresses: 2
  Address 1: 3682f2dc-5842-48d6-9667-fd201b63cda3
    Type: SHIPPING, isDefault: true
    Address: 123 Main Street
  Address 2: 893cc115-2eb2-4ccc-98df-a56e61d2bc65
    Type: BILLING, isDefault: false
    Address: 789 Pine Road

Default address count: 1
✓ Correct: Only one default address exists

[Cleanup] Removing test data...
✓ Test addresses deleted
✓ Test user deleted

============================================================
Test completed
============================================================
```

## Files Modified/Created

### Modified Files
1. [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma) - Added documentation comment about the constraint

### Created Files
1. [`backend/prisma/migrations/20260109_add_single_default_address_constraint/migration.sql`](backend/prisma/migrations/20260109_add_single_default_address_constraint/migration.sql) - Migration SQL script
2. [`backend/test-single-default-address-constraint.js`](backend/test-single-default-address-constraint.js) - Comprehensive test script

## Impact Assessment

### Positive Impact
- ✅ Enhanced data integrity at database level
- ✅ Prevents duplicate default addresses even if API validation is bypassed
- ✅ Provides clear error messages (P2002) when constraint is violated
- ✅ Maintains backward compatibility with existing data
- ✅ No impact on existing API functionality

### No Breaking Changes
- Existing data remains valid
- API layer validation continues to work as before
- No changes required to frontend or API code
- Migration is non-destructive

## Recommendations

1. **Keep Both Validations**: Continue maintaining API-layer validation as the first line of defense, with the database constraint as a safety net
2. **Monitor Error Logs**: Watch for P2002 errors in production logs to identify any attempts to violate the constraint
3. **Update Documentation**: Update API documentation to mention the database-level constraint
4. **Future Considerations**: Consider similar constraints for other models where single-instance relationships are required

## Conclusion
The single default address constraint has been successfully implemented at the database level using PostgreSQL's partial unique index feature. This provides robust data integrity while maintaining flexibility for multiple non-default addresses. The constraint has been verified through comprehensive testing and is ready for production use.

---

**Implementation Date**: 2026-01-09  
**Database**: PostgreSQL 15 (Alpine)  
**Prisma Version**: 5.22.0  
**Status**: ✅ Complete and Verified
