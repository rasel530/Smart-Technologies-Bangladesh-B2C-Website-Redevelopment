-- ============================================
-- WISHLIST DATABASE MIGRATION (NEW TABLES)
-- ============================================
-- Phase 6, Milestone 2: Wishlist Management
-- This migration creates new wishlist management tables with _new suffix
-- to avoid conflicts with existing tables.
-- ============================================
-- Version: 1.0.0
-- Date: 2026-02-14
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
-- 3. CREATE wishlists_new TABLE
-- ============================================
-- Stores user wishlists with support for multiple wishlists per user,
-- default wishlist, public sharing, and share tokens
CREATE TABLE IF NOT EXISTS wishlists_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100),
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT false,
  share_token VARCHAR(64) UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. CREATE wishlist_items_new TABLE
-- ============================================
-- Stores products in wishlists with timestamps
CREATE TABLE IF NOT EXISTS wishlist_items_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES wishlists_new(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Constraint: Prevent duplicate products in same wishlist
  CONSTRAINT unique_wishlist_product UNIQUE (wishlist_id, product_id)
);

-- ============================================
-- 5. CREATE wishlist_analytics TABLE
-- ============================================
-- Tracks wishlist events for analytics and insights
CREATE TABLE IF NOT EXISTS wishlist_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES wishlists_new(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Constraint: Valid event types
  CONSTRAINT valid_event_type CHECK (
    event_type IN ('view', 'add_item', 'remove_item', 'share', 'export')
  )
);

-- ============================================
-- 6. CREATE INDEXES FOR wishlists_new TABLE
-- ============================================
-- Index for fast lookups by user_id
CREATE INDEX IF NOT EXISTS idx_wishlists_new_user_id ON wishlists_new(user_id);

-- Index for public wishlist lookups by share_token (partial index)
CREATE INDEX IF NOT EXISTS idx_wishlists_new_share_token 
  ON wishlists_new(share_token) 
  WHERE share_token IS NOT NULL;

-- Index for finding public wishlists (partial index)
CREATE INDEX IF NOT EXISTS idx_wishlists_new_is_public 
  ON wishlists_new(is_public) 
  WHERE is_public = true;

-- ============================================
-- 7. CREATE INDEXES FOR wishlist_items_new TABLE
-- ============================================
-- Index for fast lookups by wishlist_id
CREATE INDEX IF NOT EXISTS idx_wishlist_items_new_wishlist_id 
  ON wishlist_items_new(wishlist_id);

-- Index for finding which wishlists contain a product
CREATE INDEX IF NOT EXISTS idx_wishlist_items_new_product_id 
  ON wishlist_items_new(product_id);

-- Index for sorting items by addition date (DESC for recent first)
CREATE INDEX IF NOT EXISTS idx_wishlist_items_new_added_at 
  ON wishlist_items_new(added_at DESC);

-- ============================================
-- 8. CREATE INDEXES FOR wishlist_analytics TABLE
-- ============================================
-- Index for fast lookups by wishlist_id
CREATE INDEX IF NOT EXISTS idx_wishlist_analytics_wishlist_id 
  ON wishlist_analytics(wishlist_id);

-- Index for filtering by event type
CREATE INDEX IF NOT EXISTS idx_wishlist_analytics_event_type 
  ON wishlist_analytics(event_type);

-- Index for sorting analytics by timestamp (DESC for recent first)
CREATE INDEX IF NOT EXISTS idx_wishlist_analytics_created_at 
  ON wishlist_analytics(created_at DESC);

-- ============================================
-- 9. CREATE TRIGGER FOR wishlists_new TABLE
-- ============================================
-- Trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS update_wishlists_updated_at ON wishlists_new;
CREATE TRIGGER update_wishlists_updated_at
  BEFORE UPDATE ON wishlists_new
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. ADD COMMENTS FOR DOCUMENTATION
-- ============================================
-- Table comments
COMMENT ON TABLE wishlists_new IS 
  'Stores user wishlists with support for multiple wishlists, default wishlist, and public sharing';

COMMENT ON TABLE wishlist_items_new IS 
  'Stores products added to wishlists with timestamps';

COMMENT ON TABLE wishlist_analytics IS 
  'Tracks wishlist events for analytics and insights';

-- wishlists_new column comments
COMMENT ON COLUMN wishlists_new.id IS 'Unique identifier for wishlist';
COMMENT ON COLUMN wishlists_new.user_id IS 'Reference to users table (CASCADE DELETE)';
COMMENT ON COLUMN wishlists_new.name IS 'Optional name for wishlist (e.g., "Birthday Wishlist")';
COMMENT ON COLUMN wishlists_new.is_default IS 'Flag indicating if this is user''s default wishlist';
COMMENT ON COLUMN wishlists_new.is_public IS 'Flag indicating if wishlist is publicly shareable';
COMMENT ON COLUMN wishlists_new.share_token IS 'Unique token for public wishlist sharing';
COMMENT ON COLUMN wishlists_new.created_at IS 'Timestamp when wishlist was created';
COMMENT ON COLUMN wishlists_new.updated_at IS 'Timestamp when wishlist was last updated';

-- wishlist_items_new column comments
COMMENT ON COLUMN wishlist_items_new.id IS 'Unique identifier for wishlist item';
COMMENT ON COLUMN wishlist_items_new.wishlist_id IS 'Reference to wishlists_new table (CASCADE DELETE)';
COMMENT ON COLUMN wishlist_items_new.product_id IS 'Reference to products table (CASCADE DELETE)';
COMMENT ON COLUMN wishlist_items_new.added_at IS 'Timestamp when product was added to wishlist';

-- wishlist_analytics column comments
COMMENT ON COLUMN wishlist_analytics.id IS 'Unique identifier for analytics event';
COMMENT ON COLUMN wishlist_analytics.wishlist_id IS 'Reference to wishlists_new table (CASCADE DELETE)';
COMMENT ON COLUMN wishlist_analytics.event_type IS 'Type of event: view, add_item, remove_item, share, export';
COMMENT ON COLUMN wishlist_analytics.user_id IS 'Reference to users table (SET NULL on delete)';
COMMENT ON COLUMN wishlist_analytics.metadata IS 'Additional event data stored as JSONB';
COMMENT ON COLUMN wishlist_analytics.created_at IS 'Timestamp when event occurred';

-- ============================================
-- 11. COMMIT TRANSACTION
-- ============================================
COMMIT;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Summary:
-- - Created wishlists_new table with 8 columns
-- - Created wishlist_items_new table with 4 columns
-- - Created wishlist_analytics table with 6 columns
-- - Added 8 indexes for performance optimization
-- - Created trigger for automatic updated_at updates on wishlists_new
-- - Added comprehensive table and column comments
-- - All constraints ensure data integrity
-- - Foreign keys with CASCADE DELETE ensure proper cleanup
-- - Migration is idempotent (can run multiple times safely)
-- - Old tables (wishlists, wishlist_items) were NOT modified
-- ============================================
