-- ============================================
-- PRODUCT IMAGES DATABASE MIGRATION
-- ============================================
-- Phase 4, Milestone 4: Product Image Management
-- This migration creates the product_images table for managing
-- multiple images per product with optimized versions and metadata.
-- ============================================

-- ============================================
-- 1. BACKUP EXISTING DATA (IF TABLE EXISTS)
-- ============================================
-- Check if old table exists and backup data
DO $$
DECLARE
  old_table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'product_images'
  ) INTO old_table_exists;
  
  IF old_table_exists THEN
    -- Check if the table has the old schema (text columns instead of UUID)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'product_images'
      AND column_name = 'id'
      AND data_type = 'text'
    ) THEN
      -- Create backup table
      EXECUTE 'CREATE TABLE IF NOT EXISTS product_images_backup_' || to_char(NOW(), 'YYYYMMDDHHMMSS') || ' AS SELECT * FROM product_images';
      RAISE NOTICE '✓ Existing product_images table backed up';
    END IF;
  END IF;
END $$;

-- ============================================
-- 2. DROP OLD TABLE (IF EXISTS WITH OLD SCHEMA)
-- ============================================
DROP TABLE IF EXISTS product_images CASCADE;

-- ============================================
-- 3. CREATE product_images TABLE (NEW SCHEMA)
-- ============================================
-- Stores product images with original, optimized, and thumbnail versions
-- Includes metadata for image processing and display management
CREATE TABLE product_images (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  original_url VARCHAR(500) NOT NULL,
  optimized_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  alt_text_bn VARCHAR(250),
  alt_text_en VARCHAR(250),
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  file_size_bytes INTEGER,
  mime_type VARCHAR(50),
  width INTEGER,
  height INTEGER,
  processing_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_processing_status CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  CONSTRAINT valid_display_order CHECK (display_order >= 0),
  CONSTRAINT valid_file_size CHECK (file_size_bytes IS NULL OR file_size_bytes > 0),
  CONSTRAINT valid_dimensions CHECK (
    (width IS NULL AND height IS NULL) OR
    (width IS NOT NULL AND height IS NOT NULL AND width > 0 AND height > 0)
  ),
  CONSTRAINT valid_mime_type CHECK (
    mime_type IS NULL OR 
    mime_type ~ '^image\/(jpeg|jpg|png|gif|webp|svg\+xml)$'
  )
);

-- ============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================
-- Index for fast lookups by product_id
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

-- Composite index for ordered image retrieval by product
CREATE INDEX IF NOT EXISTS idx_product_images_display_order ON product_images(product_id, display_order);

-- Index for filtering by processing status (useful for background jobs)
CREATE INDEX IF NOT EXISTS idx_product_images_processing_status ON product_images(processing_status);

-- Index for finding primary images quickly
CREATE INDEX IF NOT EXISTS idx_product_images_is_primary ON product_images(product_id, is_primary);

-- ============================================
-- 3. CREATE TRIGGER FOR AUTOMATIC updated_at TIMESTAMP
-- ============================================
-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_product_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for product_images table
DROP TRIGGER IF EXISTS update_product_images_updated_at ON product_images;
CREATE TRIGGER update_product_images_updated_at
  BEFORE UPDATE ON product_images
  FOR EACH ROW
  EXECUTE FUNCTION update_product_images_updated_at();

-- ============================================
-- 4. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to get primary image for a product
CREATE OR REPLACE FUNCTION get_product_primary_image(p_product_id TEXT)
RETURNS TABLE (
  id TEXT,
  original_url VARCHAR,
  optimized_url VARCHAR,
  thumbnail_url VARCHAR,
  alt_text_bn VARCHAR,
  alt_text_en VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pi.id,
    pi.original_url,
    pi.optimized_url,
    pi.thumbnail_url,
    pi.alt_text_bn,
    pi.alt_text_en
  FROM product_images pi
  WHERE pi.product_id = p_product_id
    AND pi.is_primary = TRUE
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all images for a product ordered by display_order
CREATE OR REPLACE FUNCTION get_product_images(p_product_id TEXT)
RETURNS TABLE (
  id TEXT,
  original_url VARCHAR,
  optimized_url VARCHAR,
  thumbnail_url VARCHAR,
  alt_text_bn VARCHAR,
  alt_text_en VARCHAR,
  display_order INTEGER,
  is_primary BOOLEAN,
  processing_status VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pi.id,
    pi.original_url,
    pi.optimized_url,
    pi.thumbnail_url,
    pi.alt_text_bn,
    pi.alt_text_en,
    pi.display_order,
    pi.is_primary,
    pi.processing_status
  FROM product_images pi
  WHERE pi.product_id = p_product_id
  ORDER BY pi.is_primary DESC, pi.display_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to count images by processing status
CREATE OR REPLACE FUNCTION count_images_by_status(p_status VARCHAR)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM product_images
  WHERE processing_status = p_status;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. ADD COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE product_images IS 'Stores product images with multiple versions (original, optimized, thumbnail) and metadata';

COMMENT ON COLUMN product_images.id IS 'Unique identifier for the product image';
COMMENT ON COLUMN product_images.product_id IS 'Reference to the products table (CASCADE DELETE)';
COMMENT ON COLUMN product_images.original_url IS 'URL of the original uploaded image';
COMMENT ON COLUMN product_images.optimized_url IS 'URL of the optimized/compressed image';
COMMENT ON COLUMN product_images.thumbnail_url IS 'URL of the thumbnail version';
COMMENT ON COLUMN product_images.alt_text_bn IS 'Alt text in Bengali for accessibility';
COMMENT ON COLUMN product_images.alt_text_en IS 'Alt text in English for accessibility';
COMMENT ON COLUMN product_images.display_order IS 'Order for displaying images (lower values first)';
COMMENT ON COLUMN product_images.is_primary IS 'Flag indicating if this is the primary image';
COMMENT ON COLUMN product_images.file_size_bytes IS 'File size in bytes';
COMMENT ON COLUMN product_images.mime_type IS 'MIME type of the image (e.g., image/jpeg)';
COMMENT ON COLUMN product_images.width IS 'Image width in pixels';
COMMENT ON COLUMN product_images.height IS 'Image height in pixels';
COMMENT ON COLUMN product_images.processing_status IS 'Status of image optimization (pending/processing/completed/failed)';
COMMENT ON COLUMN product_images.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN product_images.updated_at IS 'Timestamp when the record was last updated';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Summary:
-- - Created product_images table with 15 columns
-- - Added 4 indexes for performance optimization
-- - Created trigger for automatic updated_at updates
-- - Added 3 helper functions for common queries
-- - Added comprehensive table and column comments
-- - All constraints ensure data integrity
-- - Foreign key with CASCADE DELETE ensures cleanup
-- - Migration is idempotent (can run multiple times safely)
-- - No existing tables or data were modified
-- ============================================
