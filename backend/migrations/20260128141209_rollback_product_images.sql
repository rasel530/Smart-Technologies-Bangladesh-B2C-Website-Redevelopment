-- ============================================
-- ROLLBACK: Remove product_images table
-- ============================================
-- Phase 4, Milestone 4: Product Image Management
-- This rollback safely removes the product_images table
-- and all associated objects (indexes, triggers, functions)
-- ============================================

-- ============================================
-- 1. DROP HELPER FUNCTIONS
-- ============================================
-- Remove functions created by the migration
DROP FUNCTION IF EXISTS get_product_primary_image(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_product_images(UUID) CASCADE;
DROP FUNCTION IF EXISTS count_images_by_status(VARCHAR) CASCADE;

-- ============================================
-- 2. DROP TRIGGER FUNCTION
-- ============================================
-- Remove the trigger function for updated_at
DROP FUNCTION IF EXISTS update_product_images_updated_at() CASCADE;

-- ============================================
-- 3. DROP product_images TABLE
-- ============================================
-- Drop the table and all associated indexes
-- CASCADE will also drop the trigger
DROP TABLE IF EXISTS product_images CASCADE;

-- ============================================
-- ROLLBACK COMPLETE
-- ============================================
-- Summary:
-- - Removed 3 helper functions
-- - Removed trigger function
-- - Removed product_images table and all indexes
-- - No existing data or tables were affected
-- - Migration is fully reversible
-- ============================================

-- ============================================
-- VERIFICATION QUERIES AFTER ROLLBACK
-- ============================================
-- Run these queries to verify successful rollback:

-- 1. Verify table is removed
-- SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'product_images';
-- Expected: 0

-- 2. Verify functions are removed
-- SELECT COUNT(*) FROM information_schema.routines 
-- WHERE routine_name IN ('get_product_primary_image', 'get_product_images', 'count_images_by_status', 'update_product_images_updated_at');
-- Expected: 0

-- 3. Verify indexes are removed
-- SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'product_images';
-- Expected: 0

-- 4. Verify products table still exists and is intact
-- SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'products';
-- Expected: 1
