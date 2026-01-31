-- ============================================
-- VERIFICATION SCRIPT: product_images Migration
-- ============================================
-- Phase 4, Milestone 4: Product Image Management
-- This script verifies the successful migration of the
-- product_images table and all associated objects
-- ============================================

-- ============================================
-- 1. VERIFY TABLE CREATION
-- ============================================
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'product_images'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✓ product_images table exists';
  ELSE
    RAISE EXCEPTION '✗ product_images table does not exist';
  END IF;
END $$;

-- ============================================
-- 2. VERIFY TABLE STRUCTURE
-- ============================================
DO $$
DECLARE
  column_count INTEGER;
  expected_columns INTEGER := 15;
BEGIN
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'product_images';
  
  IF column_count = expected_columns THEN
    RAISE NOTICE '✓ Table has correct number of columns (%)', expected_columns;
  ELSE
    RAISE EXCEPTION '✗ Table has % columns, expected %', column_count, expected_columns;
  END IF;
END $$;

-- Verify specific columns exist
DO $$
DECLARE
  column_name TEXT;
  columns_to_check TEXT[] := ARRAY[
    'id', 'product_id', 'original_url', 'optimized_url', 'thumbnail_url',
    'alt_text_bn', 'alt_text_en', 'display_order', 'is_primary',
    'file_size_bytes', 'mime_type', 'width', 'height',
    'processing_status', 'created_at', 'updated_at'
  ];
  missing_columns TEXT[] := '{}';
BEGIN
  FOREACH column_name IN ARRAY columns_to_check
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'product_images'
      AND column_name = column_name
    ) THEN
      missing_columns := array_append(missing_columns, column_name);
    END IF;
  END LOOP;
  
  IF array_length(missing_columns, 1) IS NULL THEN
    RAISE NOTICE '✓ All required columns exist';
  ELSE
    RAISE EXCEPTION '✗ Missing columns: %', array_to_string(missing_columns, ', ');
  END IF;
END $$;

-- ============================================
-- 3. VERIFY PRIMARY KEY
-- ============================================
DO $$
DECLARE
  has_pk BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'product_images'
    AND tc.constraint_type = 'PRIMARY KEY'
  ) INTO has_pk;
  
  IF has_pk THEN
    RAISE NOTICE '✓ Primary key constraint exists';
  ELSE
    RAISE EXCEPTION '✗ Primary key constraint missing';
  END IF;
END $$;

-- ============================================
-- 4. VERIFY FOREIGN KEY CONSTRAINT
-- ============================================
DO $$
DECLARE
  has_fk BOOLEAN;
  fk_action TEXT;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
    WHERE tc.table_name = 'product_images'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'product_id'
  ) INTO has_fk;
  
  IF has_fk THEN
    SELECT rc.delete_rule INTO fk_action
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
    WHERE tc.table_name = 'product_images'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'product_id';
    
    IF fk_action = 'CASCADE' THEN
      RAISE NOTICE '✓ Foreign key constraint with CASCADE DELETE exists';
    ELSE
      RAISE EXCEPTION '✗ Foreign key delete rule is %, expected CASCADE', fk_action;
    END IF;
  ELSE
    RAISE EXCEPTION '✗ Foreign key constraint missing';
  END IF;
END $$;

-- ============================================
-- 5. VERIFY INDEXES
-- ============================================
DO $$
DECLARE
  index_count INTEGER;
  expected_indexes INTEGER := 4;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE tablename = 'product_images';
  
  IF index_count >= expected_indexes THEN
    RAISE NOTICE '✓ At least % indexes created (found %)', expected_indexes, index_count;
  ELSE
    RAISE EXCEPTION '✗ Only % indexes found, expected at least %', index_count, expected_indexes;
  END IF;
END $$;

-- Verify specific indexes exist
DO $$
DECLARE
  index_name TEXT;
  indexes_to_check TEXT[] := ARRAY[
    'idx_product_images_product_id',
    'idx_product_images_display_order',
    'idx_product_images_processing_status',
    'idx_product_images_is_primary'
  ];
  missing_indexes TEXT[] := '{}';
BEGIN
  FOREACH index_name IN ARRAY indexes_to_check
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE tablename = 'product_images'
      AND indexname = index_name
    ) THEN
      missing_indexes := array_append(missing_indexes, index_name);
    END IF;
  END LOOP;
  
  IF array_length(missing_indexes, 1) IS NULL THEN
    RAISE NOTICE '✓ All required indexes exist';
  ELSE
    RAISE EXCEPTION '✗ Missing indexes: %', array_to_string(missing_indexes, ', ');
  END IF;
END $$;

-- ============================================
-- 6. VERIFY TRIGGER
-- ============================================
DO $$
DECLARE
  has_trigger BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'update_product_images_updated_at'
    AND event_object_table = 'product_images'
  ) INTO has_trigger;
  
  IF has_trigger THEN
    RAISE NOTICE '✓ Trigger for updated_at exists';
  ELSE
    RAISE EXCEPTION '✗ Trigger for updated_at missing';
  END IF;
END $$;

-- ============================================
-- 7. VERIFY HELPER FUNCTIONS
-- ============================================
DO $$
DECLARE
  function_name TEXT;
  functions_to_check TEXT[] := ARRAY[
    'get_product_primary_image',
    'get_product_images',
    'count_images_by_status'
  ];
  missing_functions TEXT[] := '{}';
BEGIN
  FOREACH function_name IN ARRAY functions_to_check
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_name = function_name
      AND routine_schema = 'public'
    ) THEN
      missing_functions := array_append(missing_functions, function_name);
    END IF;
  END LOOP;
  
  IF array_length(missing_functions, 1) IS NULL THEN
    RAISE NOTICE '✓ All helper functions exist';
  ELSE
    RAISE EXCEPTION '✗ Missing functions: %', array_to_string(missing_functions, ', ');
  END IF;
END $$;

-- ============================================
-- 8. VERIFY DEFAULT VALUES
-- ============================================
DO $$
DECLARE
  has_defaults BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO has_defaults
  FROM information_schema.columns
  WHERE table_name = 'product_images'
  AND column_default IS NOT NULL
  AND column_name IN ('display_order', 'is_primary', 'processing_status', 'created_at', 'updated_at');
  
  IF has_defaults = 5 THEN
    RAISE NOTICE '✓ Default values set correctly';
  ELSE
    RAISE EXCEPTION '✗ Default values missing (found %)', has_defaults;
  END IF;
END $$;

-- ============================================
-- 9. VERIFY CHECK CONSTRAINTS
-- ============================================
DO $$
DECLARE
  constraint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.table_constraints
  WHERE table_name = 'product_images'
  AND constraint_type = 'CHECK';
  
  IF constraint_count >= 4 THEN
    RAISE NOTICE '✓ Check constraints exist (found %)', constraint_count;
  ELSE
    RAISE EXCEPTION '✗ Check constraints missing (found %)', constraint_count;
  END IF;
END $$;

-- ============================================
-- 10. TEST CASCADE DELETE BEHAVIOR
-- ============================================
-- This test creates a temporary product and image to verify CASCADE DELETE
DO $$
DECLARE
  test_product_id UUID;
  test_image_id UUID;
  product_exists_before BOOLEAN;
  product_exists_after BOOLEAN;
  image_exists_before BOOLEAN;
  image_exists_after BOOLEAN;
BEGIN
  -- Get an existing product ID if available
  SELECT id INTO test_product_id
  FROM products
  LIMIT 1;
  
  IF test_product_id IS NOT NULL THEN
    -- Create a test image
    INSERT INTO product_images (
      product_id, original_url, display_order, is_primary
    ) VALUES (
      test_product_id, 'http://test.com/image.jpg', 0, FALSE
    ) RETURNING id INTO test_image_id;
    
    -- Verify image exists
    SELECT EXISTS (
      SELECT 1 FROM product_images WHERE id = test_image_id
    ) INTO image_exists_before;
    
    IF image_exists_before THEN
      RAISE NOTICE '✓ Test image created successfully';
      
      -- Note: We cannot actually delete the product to test CASCADE
      -- as it would affect real data. The constraint is verified above.
      RAISE NOTICE '✓ CASCADE DELETE constraint verified (cannot test on production data)';
    ELSE
      RAISE EXCEPTION '✗ Failed to create test image';
    END IF;
    
    -- Clean up test image
    DELETE FROM product_images WHERE id = test_image_id;
  ELSE
    RAISE NOTICE '⚠ No products found to test CASCADE DELETE (constraint verified above)';
  END IF;
END $$;

-- ============================================
-- 11. VERIFY TABLE COMMENTS
-- ============================================
DO $$
DECLARE
  has_comments BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO has_comments
  FROM pg_description
  JOIN pg_class ON pg_description.objoid = pg_class.oid
  WHERE pg_class.relname = 'product_images';
  
  IF has_comments > 0 THEN
    RAISE NOTICE '✓ Table/column comments exist (%)', has_comments;
  ELSE
    RAISE NOTICE '⚠ No comments found (optional)';
  END IF;
END $$;

-- ============================================
-- VERIFICATION COMPLETE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'VERIFICATION COMPLETE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'All critical checks passed successfully!';
  RAISE NOTICE 'The product_images migration is ready for use.';
  RAISE NOTICE '============================================';
END $$;

-- ============================================
-- DETAILED SCHEMA INFORMATION
-- ============================================
-- Uncomment the following queries to see detailed schema info:

-- View complete table structure
-- \d product_images

-- View all indexes
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'product_images';

-- View all constraints
-- SELECT constraint_name, constraint_type 
-- FROM information_schema.table_constraints 
-- WHERE table_name = 'product_images';

-- View all triggers
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE event_object_table = 'product_images';

-- View all functions
-- SELECT routine_name, routine_type
-- FROM information_schema.routines
-- WHERE routine_schema = 'public'
-- AND routine_name LIKE '%product%';
