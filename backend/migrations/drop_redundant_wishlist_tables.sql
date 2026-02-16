-- ============================================================================
-- SAFE REMOVAL OF REDUNDANT WISHLIST TABLES
-- ============================================================================
-- Date: 2026-02-14
-- Purpose: Remove empty, unused wishlist tables that were created during
--          migration but are not part of the active schema
--
-- TABLES TO REMOVE:
--   1. wishlist_items_new - Empty (0 rows), NOT in Prisma schema, NOT used by backend
--   2. wishlists_new      - Empty (0 rows), NOT in Prisma schema, NOT used by backend
--
-- TABLES TO KEEP (DO NOT REMOVE):
--   1. wishlists            - In Prisma schema, used by backend code
--   2. wishlist_items       - In Prisma schema, used by backend code
--   3. wishlist_analytics   - In Prisma schema, used by backend code
--
-- SAFETY NOTES:
--   - Uses IF EXISTS to prevent errors if tables don't exist
--   - Drops wishlist_items_new first (due to foreign key dependency)
--   - Uses CASCADE to ensure clean removal of any dependencies
--   - Only targets tables with "_new" suffix to avoid accidental removal
-- ============================================================================

-- Step 1: Drop wishlist_items_new first (has foreign key to wishlists_new)
DROP TABLE IF EXISTS wishlist_items_new CASCADE;

-- Step 2: Drop wishlists_new (after its dependent table is removed)
DROP TABLE IF EXISTS wishlists_new CASCADE;

-- ============================================================================
-- VERIFICATION QUERIES (for manual verification)
-- ============================================================================

-- Verify the redundant tables are removed:
-- SELECT tablename FROM pg_tables WHERE tablename IN ('wishlists_new', 'wishlist_items_new');
-- Expected result: No rows (empty result set)

-- Verify the active tables still exist:
-- SELECT tablename FROM pg_tables WHERE tablename IN ('wishlists', 'wishlist_items', 'wishlist_analytics');
-- Expected result: 3 rows (wishlists, wishlist_items, wishlist_analytics)

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
-- The redundant wishlist tables have been safely removed.
-- Active wishlist tables remain intact and functional.
-- ============================================================================
