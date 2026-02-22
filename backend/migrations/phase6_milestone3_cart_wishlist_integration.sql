-- ============================================
-- CART-WISHLIST INTEGRATION DATABASE MIGRATION
-- ============================================
-- Phase 6, Milestone 3: Cart-Wishlist Integration
-- This migration creates the cart-wishlist integration system including
-- cart_wishlist_sync and cart_wishlist_move_history tables with
-- optimized indexes and proper referential integrity.
-- ============================================
-- Version: 1.0.0
-- Date: 2026-02-17
-- ============================================

-- ============================================
-- 1. START TRANSACTION
-- ============================================
BEGIN;

-- ============================================
-- 2. CREATE OR REPLACE TRIGGER FUNCTION
-- ============================================
-- This function automatically updates the updated_at timestamp
-- It can be reused by multiple tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. CREATE cart_wishlist_sync TABLE
-- ============================================
-- Tracks synchronization status between carts and wishlists
CREATE TABLE IF NOT EXISTS cart_wishlist_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cart_id TEXT REFERENCES carts(id) ON DELETE CASCADE,
  wishlist_id TEXT REFERENCES wishlists(id) ON DELETE CASCADE,
  sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'completed', 'failed')),
  last_sync_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. CREATE cart_wishlist_move_history TABLE
-- ============================================
-- Tracks the history of moving items between cart and wishlist
CREATE TABLE IF NOT EXISTS cart_wishlist_move_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  move_type VARCHAR(20) NOT NULL CHECK (move_type IN ('cart_to_wishlist', 'wishlist_to_cart')),
  quantity INTEGER DEFAULT 1,
  source_id TEXT,
  destination_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. CREATE INDEXES FOR cart_wishlist_sync TABLE
-- ============================================
-- Index for fast lookups by user_id
CREATE INDEX IF NOT EXISTS idx_cart_wishlist_sync_user_id ON cart_wishlist_sync(user_id);

-- Index for filtering by sync status
CREATE INDEX IF NOT EXISTS idx_cart_wishlist_sync_status ON cart_wishlist_sync(sync_status);

-- Index for sorting by last sync time (DESC for recent first)
CREATE INDEX IF NOT EXISTS idx_cart_wishlist_sync_last_sync ON cart_wishlist_sync(last_sync_at DESC);

-- Index for cart_id lookups
CREATE INDEX IF NOT EXISTS idx_cart_wishlist_sync_cart_id ON cart_wishlist_sync(cart_id);

-- Index for wishlist_id lookups
CREATE INDEX IF NOT EXISTS idx_cart_wishlist_sync_wishlist_id ON cart_wishlist_sync(wishlist_id);

-- ============================================
-- 6. CREATE INDEXES FOR cart_wishlist_move_history TABLE
-- ============================================
-- Index for fast lookups by user_id
CREATE INDEX IF NOT EXISTS idx_move_history_user_id ON cart_wishlist_move_history(user_id);

-- Index for filtering by product_id
CREATE INDEX IF NOT EXISTS idx_move_history_product_id ON cart_wishlist_move_history(product_id);

-- Index for sorting by creation time (DESC for recent first)
CREATE INDEX IF NOT EXISTS idx_move_history_created_at ON cart_wishlist_move_history(created_at DESC);

-- Index for filtering by move_type
CREATE INDEX IF NOT EXISTS idx_move_history_move_type ON cart_wishlist_move_history(move_type);

-- Index for source_id lookups
CREATE INDEX IF NOT EXISTS idx_move_history_source_id ON cart_wishlist_move_history(source_id);

-- Index for destination_id lookups
CREATE INDEX IF NOT EXISTS idx_move_history_destination_id ON cart_wishlist_move_history(destination_id);

-- ============================================
-- 7. CREATE TRIGGER FOR cart_wishlist_sync TABLE
-- ============================================
-- Trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS update_cart_wishlist_sync_updated_at ON cart_wishlist_sync;
CREATE TRIGGER update_cart_wishlist_sync_updated_at
  BEFORE UPDATE ON cart_wishlist_sync
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. ADD COMMENTS FOR DOCUMENTATION
-- ============================================
-- Table comments
COMMENT ON TABLE cart_wishlist_sync IS 
  'Tracks synchronization status between user carts and wishlists';

COMMENT ON TABLE cart_wishlist_move_history IS 
  'Tracks the history of moving items between cart and wishlist';

-- cart_wishlist_sync column comments
COMMENT ON COLUMN cart_wishlist_sync.id IS 'Unique identifier for sync record';
COMMENT ON COLUMN cart_wishlist_sync.user_id IS 'Reference to users table (CASCADE DELETE)';
COMMENT ON COLUMN cart_wishlist_sync.cart_id IS 'Reference to carts table (CASCADE DELETE)';
COMMENT ON COLUMN cart_wishlist_sync.wishlist_id IS 'Reference to wishlists table (CASCADE DELETE)';
COMMENT ON COLUMN cart_wishlist_sync.sync_status IS 'Status of sync: pending, syncing, completed, failed';
COMMENT ON COLUMN cart_wishlist_sync.last_sync_at IS 'Timestamp of last successful sync';
COMMENT ON COLUMN cart_wishlist_sync.error_message IS 'Error message if sync failed';
COMMENT ON COLUMN cart_wishlist_sync.created_at IS 'Timestamp when sync record was created';
COMMENT ON COLUMN cart_wishlist_sync.updated_at IS 'Timestamp when sync record was last updated';

-- cart_wishlist_move_history column comments
COMMENT ON COLUMN cart_wishlist_move_history.id IS 'Unique identifier for move history record';
COMMENT ON COLUMN cart_wishlist_move_history.user_id IS 'Reference to users table (CASCADE DELETE)';
COMMENT ON COLUMN cart_wishlist_move_history.product_id IS 'Reference to products table (CASCADE DELETE)';
COMMENT ON COLUMN cart_wishlist_move_history.move_type IS 'Type of move: cart_to_wishlist or wishlist_to_cart';
COMMENT ON COLUMN cart_wishlist_move_history.quantity IS 'Quantity of items moved';
COMMENT ON COLUMN cart_wishlist_move_history.source_id IS 'ID of source (cart_id or wishlist_id)';
COMMENT ON COLUMN cart_wishlist_move_history.destination_id IS 'ID of destination (wishlist_id or cart_id)';
COMMENT ON COLUMN cart_wishlist_move_history.created_at IS 'Timestamp when the move occurred';

-- ============================================
-- 9. COMMIT TRANSACTION
-- ============================================
COMMIT;

-- ============================================
-- ROLLBACK INSTRUCTIONS
-- ============================================
-- If you need to rollback this migration, execute:
--
-- DROP TRIGGER IF EXISTS update_cart_wishlist_sync_updated_at ON cart_wishlist_sync;
-- DROP TABLE IF EXISTS cart_wishlist_move_history CASCADE;
-- DROP TABLE IF EXISTS cart_wishlist_sync CASCADE;
-- DROP INDEX IF EXISTS idx_cart_wishlist_sync_user_id;
-- DROP INDEX IF EXISTS idx_cart_wishlist_sync_status;
-- DROP INDEX IF EXISTS idx_cart_wishlist_sync_last_sync;
-- DROP INDEX IF EXISTS idx_cart_wishlist_sync_cart_id;
-- DROP INDEX IF EXISTS idx_cart_wishlist_sync_wishlist_id;
-- DROP INDEX IF EXISTS idx_move_history_user_id;
-- DROP INDEX IF EXISTS idx_move_history_product_id;
-- DROP INDEX IF EXISTS idx_move_history_created_at;
-- DROP INDEX IF EXISTS idx_move_history_move_type;
-- DROP INDEX IF EXISTS idx_move_history_source_id;
-- DROP INDEX IF EXISTS idx_move_history_destination_id;
--
-- Note: The update_updated_at_column() function is shared and should
-- only be dropped if no other tables are using it.

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Summary:
-- - Created cart_wishlist_sync table with 9 columns
-- - Created cart_wishlist_move_history table with 8 columns
-- - Added 11 indexes for performance optimization
-- - Created trigger for automatic updated_at updates on cart_wishlist_sync
-- - Added comprehensive table and column comments
-- - All constraints ensure data integrity
-- - Foreign keys with CASCADE DELETE ensure proper cleanup
-- - Migration is idempotent (can run multiple times safely)
-- - No existing tables or data were modified
-- ============================================
