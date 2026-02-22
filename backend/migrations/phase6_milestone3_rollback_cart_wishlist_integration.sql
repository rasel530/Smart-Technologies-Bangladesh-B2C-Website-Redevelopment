-- ============================================
-- ROLLBACK: CART-WISHLIST INTEGRATION
-- ============================================
-- Phase 6, Milestone 3: Cart-Wishlist Integration
-- Purpose: Rollback cart-wishlist integration tables
-- Created: 2026-02-17
-- ============================================

-- ============================================
-- 1. START TRANSACTION
-- ============================================
BEGIN;

-- ============================================
-- 2. DROP TRIGGER
-- ============================================
-- Drop the trigger for cart_wishlist_sync table
DROP TRIGGER IF EXISTS update_cart_wishlist_sync_updated_at ON cart_wishlist_sync;

-- ============================================
-- 3. DROP INDEXES
-- ============================================
-- Drop indexes for cart_wishlist_sync table
DROP INDEX IF EXISTS idx_cart_wishlist_sync_user_id;
DROP INDEX IF EXISTS idx_cart_wishlist_sync_status;
DROP INDEX IF EXISTS idx_cart_wishlist_sync_last_sync;
DROP INDEX IF EXISTS idx_cart_wishlist_sync_cart_id;
DROP INDEX IF EXISTS idx_cart_wishlist_sync_wishlist_id;

-- Drop indexes for cart_wishlist_move_history table
DROP INDEX IF EXISTS idx_move_history_user_id;
DROP INDEX IF EXISTS idx_move_history_product_id;
DROP INDEX IF EXISTS idx_move_history_created_at;
DROP INDEX IF EXISTS idx_move_history_move_type;
DROP INDEX IF EXISTS idx_move_history_source_id;
DROP INDEX IF EXISTS idx_move_history_destination_id;

-- ============================================
-- 4. DROP TABLES
-- ============================================
-- Drop tables with CASCADE to remove dependent objects
-- Note: CASCADE will also remove any dependent constraints
DROP TABLE IF EXISTS cart_wishlist_move_history CASCADE;
DROP TABLE IF EXISTS cart_wishlist_sync CASCADE;

-- ============================================
-- 5. COMMIT TRANSACTION
-- ============================================
COMMIT;

-- ============================================
-- ROLLBACK COMPLETE
-- ============================================
-- Summary:
-- - Dropped trigger: update_cart_wishlist_sync_updated_at
-- - Dropped 11 indexes
-- - Dropped 2 tables: cart_wishlist_move_history, cart_wishlist_sync
-- - All existing tables and data remain intact
-- - No modifications to existing tables (carts, cart_items, wishlists, wishlist_items, etc.)
-- - No data loss from existing tables
-- ============================================

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these queries after rollback to verify:
--
-- -- Check tables are removed
-- SELECT COUNT(*) FROM information_schema.tables 
-- WHERE table_name IN ('cart_wishlist_sync', 'cart_wishlist_move_history');
-- -- Should return 0 rows
--
-- -- Check indexes are removed
-- SELECT COUNT(*) FROM pg_indexes 
-- WHERE indexname LIKE 'idx_cart_wishlist_sync%' OR indexname LIKE 'idx_move_history%';
-- -- Should return 0 rows
--
-- -- Check existing tables still exist
-- SELECT COUNT(*) FROM information_schema.tables 
-- WHERE table_name IN ('carts', 'cart_items', 'wishlists', 'wishlist_items');
-- -- Should return 4 rows
--
-- -- Check existing data is intact
-- SELECT COUNT(*) FROM carts;
-- SELECT COUNT(*) FROM cart_items;
-- SELECT COUNT(*) FROM wishlists;
-- SELECT COUNT(*) FROM wishlist_items;
-- -- Should return the same counts as before rollback
-- ============================================

-- ============================================
-- NOTE
-- ============================================
-- The update_updated_at_column() function is shared by multiple tables
-- and should only be dropped if no other tables are using it.
-- To check if other tables use this function:
--
-- SELECT tgname, relname 
-- FROM pg_trigger t
-- JOIN pg_class c ON t.tgrelid = c.oid
-- WHERE t.tgfoid = (SELECT oid FROM pg_proc WHERE proname = 'update_updated_at_column');
-- ============================================
