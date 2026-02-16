# Migration: Add Cart Status Field

## Overview

This migration adds a `status` field to the `carts` table with an enum type containing the following values:

- `active` - Cart is currently active and being used
- `abandoned` - Cart has been abandoned by the user
- `converted` - Cart has been converted to an order
- `expired` - Cart has expired (typically for guest carts)

## Date

2026-02-07 13:00:00 UTC

## Changes Made

### 1. Add CartStatus Enum Type

```sql
CREATE TYPE "CartStatus" AS ENUM ('active', 'abandoned', 'converted', 'expired');
```

### 2. Add Status Column to Carts Table

```sql
ALTER TABLE "carts"
ADD COLUMN "status" "CartStatus" NOT NULL DEFAULT 'active';
```

### 3. Add Index on Status Column

```sql
CREATE INDEX "idx_carts_status" ON "carts"("status");
```

### 4. Update Existing Records

```sql
UPDATE "carts"
SET "status" = 'active'
WHERE "status" IS NULL;
```

### 5. Add Column Comment

```sql
COMMENT ON COLUMN "carts"."status" IS 'Cart status: active, abandoned, converted, or expired';
```

## Impact

- **Schema Changes**: New enum type `CartStatus` and new column `status` on `carts` table
- **Default Value**: All existing carts will be set to 'active' status
- **Index**: Added index on status column for better query performance
- **Backward Compatibility**: Existing carts will have their status set to 'active' by default

## Related Changes

- Updated `CartService` to handle cart status changes
- Added methods: `updateCartStatus`, `markCartAsAbandoned`, `markCartAsConverted`
- Updated `createCart` to set initial status to 'active'

## Rollback

If needed, rollback with:

```sql
-- Remove index
DROP INDEX IF EXISTS "idx_carts_status";

-- Remove column
ALTER TABLE "carts" DROP COLUMN IF EXISTS "status";

-- Remove enum type
DROP TYPE IF EXISTS "CartStatus";
```

## Verification

After migration, verify:

1. `CartStatus` enum type exists
2. `status` column exists in `carts` table
3. Index `idx_carts_status` exists
4. All existing carts have `status = 'active'`
5. New carts are created with `status = 'active'`

## Notes

- This migration is part of Phase 6, Milestone 1 critical fixes
- The status field enables better tracking of cart lifecycle
- Status changes are logged in cart analytics
- No data loss occurs as existing carts are updated to 'active' status
