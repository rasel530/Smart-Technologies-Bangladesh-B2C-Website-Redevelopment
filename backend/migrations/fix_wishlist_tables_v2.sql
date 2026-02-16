-- ============================================================================
-- WISHLIST DATABASE TABLES FIX MIGRATION V2
-- ============================================================================
-- Purpose: Fix all 10 identified database table issues for Wishlist feature
-- Date: 2026-02-14
-- Issues Fixed: #31-#40
-- Note: This version handles existing mixed-case constraints
-- ============================================================================

-- Start transaction for atomicity
BEGIN;

-- ============================================================================
-- ISSUE #31: CRITICAL - Database tables have TEXT instead of UUID for ID columns
-- ============================================================================
-- Description: wishlists.id, wishlists.userId, wishlist_items.wishlistId, 
--              wishlist_items.productId are TEXT instead of UUID
-- Impact: Complete schema incompatibility with Prisma. Foreign key constraints 
--         cannot work properly.
-- Fix: Convert TEXT IDs to UUID across all tables
-- ============================================================================

-- Step 1: Drop ALL existing foreign key constraints (both camelCase and snake_case)
ALTER TABLE wishlist_items DROP CONSTRAINT IF EXISTS wishlist_items_wishlistId_fkey;
ALTER TABLE wishlist_items DROP CONSTRAINT IF EXISTS wishlist_items_wishlistid_fkey;
ALTER TABLE wishlist_items DROP CONSTRAINT IF EXISTS wishlist_items_productId_fkey;
ALTER TABLE wishlist_items DROP CONSTRAINT IF EXISTS wishlist_items_productid_fkey;
ALTER TABLE wishlists DROP CONSTRAINT IF EXISTS wishlists_userId_fkey;
ALTER TABLE wishlists DROP CONSTRAINT IF EXISTS wishlists_userid_fkey;
ALTER TABLE wishlist_analytics DROP CONSTRAINT IF EXISTS wishlist_analytics_wishlistId_fkey;
ALTER TABLE wishlist_analytics DROP CONSTRAINT IF EXISTS wishlist_analytics_wishlistid_fkey;

-- Step 2: Convert ID columns to UUID
-- Convert wishlists.id from TEXT to UUID (if still TEXT)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'wishlists' AND column_name = 'id' AND data_type = 'text') THEN
    ALTER TABLE wishlists ALTER COLUMN id TYPE UUID USING id::uuid;
  END IF;
END $$;

-- Convert wishlists.userId from TEXT to UUID (if still TEXT)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'wishlists' AND column_name = 'userId' AND data_type = 'text') THEN
    ALTER TABLE wishlists ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid;
  END IF;
END $$;

-- Convert wishlist_items.wishlistId from TEXT to UUID (if still TEXT)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'wishlist_items' AND column_name = 'wishlistId' AND data_type = 'text') THEN
    ALTER TABLE wishlist_items ALTER COLUMN "wishlistId" TYPE UUID USING "wishlistId"::uuid;
  END IF;
END $$;

-- Convert wishlist_items.productId from TEXT to UUID (if still TEXT)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'wishlist_items' AND column_name = 'productId' AND data_type = 'text') THEN
    ALTER TABLE wishlist_items ALTER COLUMN "productId" TYPE UUID USING "productId"::uuid;
  END IF;
END $$;

-- Convert wishlist_analytics.id from TEXT to UUID (if still TEXT)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'wishlist_analytics' AND column_name = 'id' AND data_type = 'text') THEN
    ALTER TABLE wishlist_analytics ALTER COLUMN id TYPE UUID USING id::uuid;
  END IF;
END $$;

-- Convert wishlist_analytics.wishlistId from TEXT to UUID (if still TEXT)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'wishlist_analytics' AND column_name = 'wishlistId' AND data_type = 'text') THEN
    ALTER TABLE wishlist_analytics ALTER COLUMN "wishlistId" TYPE UUID USING "wishlistId"::uuid;
  END IF;
END $$;

-- Convert wishlist_analytics.userId from TEXT to UUID (if still TEXT)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'wishlist_analytics' AND column_name = 'userId' AND data_type = 'text') THEN
    ALTER TABLE wishlist_analytics ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid;
  END IF;
END $$;

-- Step 3: Recreate foreign key constraints with proper UUID types
ALTER TABLE wishlists 
  ADD CONSTRAINT wishlists_userId_fkey 
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE wishlist_items 
  ADD CONSTRAINT wishlist_items_wishlistId_fkey 
  FOREIGN KEY ("wishlistId") REFERENCES wishlists(id) ON DELETE CASCADE;

ALTER TABLE wishlist_items 
  ADD CONSTRAINT wishlist_items_productId_fkey 
  FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE wishlist_analytics 
  ADD CONSTRAINT wishlist_analytics_wishlistId_fkey 
  FOREIGN KEY ("wishlistId") REFERENCES wishlists(id) ON DELETE CASCADE;

-- ============================================================================
-- ISSUE #32: CRITICAL - Database tables have wrong column names (snake_case instead of camelCase)
-- ============================================================================
-- Description: wishlist_analytics table uses snake_case (wishlist_id, event_type, 
--              user_id, created_at) instead of camelCase
-- Impact: Prisma queries will fail due to column name mismatches
-- Fix: Rename columns to camelCase to match Prisma schema
-- ============================================================================

-- Rename columns in wishlist_analytics table from snake_case to camelCase (if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'wishlist_analytics' AND column_name = 'wishlist_id') THEN
    ALTER TABLE wishlist_analytics RENAME COLUMN wishlist_id TO "wishlistId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'wishlist_analytics' AND column_name = 'event_type') THEN
    ALTER TABLE wishlist_analytics RENAME COLUMN event_type TO "eventType";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'wishlist_analytics' AND column_name = 'user_id') THEN
    ALTER TABLE wishlist_analytics RENAME COLUMN user_id TO "userId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'wishlist_analytics' AND column_name = 'created_at') THEN
    ALTER TABLE wishlist_analytics RENAME COLUMN created_at TO "createdAt";
  END IF;
END $$;

-- ============================================================================
-- ISSUE #33: HIGH - Database tables missing expiresAt column
-- ============================================================================
-- Description: wishlists table is missing expiresAt column
-- Impact: Wishlist expiration feature cannot be implemented
-- Fix: Add expiresAt TIMESTAMP column to wishlists table
-- ============================================================================

ALTER TABLE wishlists ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP;

-- ============================================================================
-- ISSUE #34: HIGH - Database tables missing isDefault and isPublic columns
-- ============================================================================
-- Description: wishlists table is missing isDefault and isPublic columns
-- Impact: Default wishlist and public/private wishlist features cannot be implemented
-- Fix: Add isDefault BOOLEAN and isPublic BOOLEAN columns to wishlists table
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'wishlists' AND column_name = 'isDefault') THEN
    ALTER TABLE wishlists ADD COLUMN "isDefault" BOOLEAN DEFAULT false NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'wishlists' AND column_name = 'isPublic') THEN
    ALTER TABLE wishlists ADD COLUMN "isPublic" BOOLEAN DEFAULT false NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- ISSUE #35: HIGH - Database tables missing shareToken column
-- ============================================================================
-- Description: wishlists table is missing shareToken column
-- Impact: Wishlist sharing feature cannot be implemented
-- Fix: Add shareToken VARCHAR(64) UNIQUE column to wishlists table
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'wishlists' AND column_name = 'shareToken') THEN
    ALTER TABLE wishlists ADD COLUMN "shareToken" VARCHAR(64) UNIQUE;
  END IF;
END $$;

-- ============================================================================
-- ISSUE #36: MEDIUM - Database tables missing unique constraint on (user_id, is_default)
-- ============================================================================
-- Description: wishlists table is missing unique constraint on (user_id, is_default) 
--              WHERE is_default = true
-- Impact: Data integrity violation - users could have multiple default wishlists
-- Fix: Add unique constraint to ensure only one default wishlist per user
-- ============================================================================

-- Drop existing index if it exists
DROP INDEX IF EXISTS unique_user_default;

-- Create unique index with partial index (only for default wishlists)
CREATE UNIQUE INDEX unique_user_default 
  ON wishlists ("userId", "isDefault") 
  WHERE "isDefault" = true;

-- ============================================================================
-- ISSUE #37: MEDIUM - Database tables missing unique constraint on (wishlist_id, product_id)
-- ============================================================================
-- Description: wishlist_items table is missing unique constraint on (wishlist_id, product_id)
-- Impact: Data integrity violation - duplicate products in wishlist
-- Fix: Add unique constraint to prevent duplicate products in same wishlist
-- ============================================================================

-- Drop existing constraint if it exists
ALTER TABLE wishlist_items DROP CONSTRAINT IF EXISTS unique_wishlist_product;
ALTER TABLE wishlist_items DROP CONSTRAINT IF EXISTS wishlist_items_wishlistid_productid_key;

-- Add unique constraint
ALTER TABLE wishlist_items 
  ADD CONSTRAINT unique_wishlist_product 
  UNIQUE ("wishlistId", "productId");

-- ============================================================================
-- ISSUE #38: MEDIUM - Database tables missing check constraint on event_type
-- ============================================================================
-- Description: wishlist_analytics table is missing check constraint on event_type
-- Impact: Data integrity violation - invalid analytics events
-- Fix: Add check constraint to validate event_type values
-- ============================================================================

-- Drop existing constraint if it exists
ALTER TABLE wishlist_analytics DROP CONSTRAINT IF EXISTS valid_event_type;

-- Add check constraint for valid event types
ALTER TABLE wishlist_analytics 
  ADD CONSTRAINT valid_event_type 
  CHECK ("eventType" IN ('view', 'add_item', 'remove_item', 'share', 'export'));

-- ============================================================================
-- ISSUE #39: MEDIUM - Database tables missing indexes
-- ============================================================================
-- Description: Multiple indexes are missing from the database tables
-- Impact: Performance degradation for common queries
-- Fix: Create all required indexes for performance optimization
-- ============================================================================

-- Drop existing indexes if they exist (for idempotency)
DROP INDEX IF EXISTS idx_wishlists_user_id;
DROP INDEX IF EXISTS idx_wishlists_share_token;
DROP INDEX IF EXISTS idx_wishlists_is_public;
DROP INDEX IF EXISTS idx_wishlist_items_wishlist_id;
DROP INDEX IF EXISTS idx_wishlist_items_product_id;
DROP INDEX IF EXISTS idx_wishlist_items_added_at;
DROP INDEX IF EXISTS idx_wishlist_analytics_wishlist_id;
DROP INDEX IF EXISTS idx_wishlist_analytics_event_type;
DROP INDEX IF EXISTS idx_wishlist_analytics_created_at;

-- Create indexes for wishlists table
CREATE INDEX idx_wishlists_user_id ON wishlists ("userId");
CREATE INDEX idx_wishlists_share_token ON wishlists ("shareToken") WHERE "shareToken" IS NOT NULL;
CREATE INDEX idx_wishlists_is_public ON wishlists ("isPublic") WHERE "isPublic" = true;

-- Create indexes for wishlist_items table
CREATE INDEX idx_wishlist_items_wishlist_id ON wishlist_items ("wishlistId");
CREATE INDEX idx_wishlist_items_product_id ON wishlist_items ("productId");
CREATE INDEX idx_wishlist_items_added_at ON wishlist_items ("addedAt" DESC);

-- Create indexes for wishlist_analytics table
CREATE INDEX idx_wishlist_analytics_wishlist_id ON wishlist_analytics ("wishlistId");
CREATE INDEX idx_wishlist_analytics_event_type ON wishlist_analytics ("eventType");
CREATE INDEX idx_wishlist_analytics_created_at ON wishlist_analytics ("createdAt" DESC);

-- ============================================================================
-- ISSUE #40: MEDIUM - Database tables missing trigger for updated_at
-- ============================================================================
-- Description: wishlists table is missing trigger for updating updated_at timestamp
-- Impact: Updated timestamps won't be accurate
-- Fix: Create trigger function and apply to wishlists table
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_wishlists_updated_at ON wishlists;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create trigger function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on wishlists table
CREATE TRIGGER update_wishlists_updated_at
  BEFORE UPDATE ON wishlists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary of changes:
-- 1. Converted all ID columns from TEXT to UUID (Issue #31)
-- 2. Renamed snake_case columns to camelCase (Issue #32)
-- 3. Added expiresAt column to wishlists table (Issue #33)
-- 4. Added isDefault and isPublic columns to wishlists table (Issue #34)
-- 5. Added shareToken column to wishlists table (Issue #35)
-- 6. Added unique constraint for default wishlists per user (Issue #36)
-- 7. Added unique constraint for wishlist-product combinations (Issue #37)
-- 8. Added check constraint for valid event types (Issue #38)
-- 9. Created all required performance indexes (Issue #39)
-- 10. Created trigger for automatic updated_at updates (Issue #40)
-- ============================================================================

-- Commit transaction
COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Optional - run to verify migration success)
-- ============================================================================
-- Uncomment the following queries to verify the migration:

-- -- Verify UUID columns
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name IN ('wishlists', 'wishlist_items', 'wishlist_analytics')
--   AND column_name IN ('id', 'userId', 'wishlistId', 'productId')
-- ORDER BY table_name, column_name;

-- -- Verify camelCase column names
-- SELECT column_name 
-- FROM information_schema.columns 
-- WHERE table_name = 'wishlist_analytics'
-- ORDER BY column_name;

-- -- Verify new columns in wishlists table
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'wishlists'
--   AND column_name IN ('expiresAt', 'isDefault', 'isPublic', 'shareToken')
-- ORDER BY column_name;

-- -- Verify constraints
-- SELECT conname, contype 
-- FROM pg_constraint 
-- WHERE conrelid::regclass::text IN ('wishlists', 'wishlist_items', 'wishlist_analytics')
-- ORDER BY conrelid::regclass::text, conname;

-- -- Verify indexes
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename IN ('wishlists', 'wishlist_items', 'wishlist_analytics')
-- ORDER BY tablename, indexname;

-- -- Verify trigger
-- SELECT trigger_name, event_manipulation, event_object_table 
-- FROM information_schema.triggers 
-- WHERE event_object_table = 'wishlists';
-- ============================================================================
