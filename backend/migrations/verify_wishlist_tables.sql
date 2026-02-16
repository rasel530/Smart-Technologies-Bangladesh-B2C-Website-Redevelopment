-- ============================================
-- VERIFICATION SCRIPT: Wishlist Migration
-- ============================================
-- Phase 6, Milestone 2: Wishlist Management
-- This script verifies the successful migration of the
-- wishlist tables and all associated objects
-- ============================================

-- ============================================
-- 1. VERIFY TABLE CREATION
-- ============================================
DO $$
DECLARE
  table_name TEXT;
  tables_to_check TEXT[] := ARRAY['wishlists', 'wishlist_items', 'wishlist_analytics'];
  missing_tables TEXT[] := '{}';
BEGIN
  FOREACH table_name IN ARRAY tables_to_check
  LOOP
    IF NOT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = table_name
    ) THEN
      missing_tables := array_append(missing_tables, table_name);
    END IF;
  END LOOP;
  
  IF array_length(missing_tables, 1) IS NULL THEN
    RAISE NOTICE '✓ All tables created (wishlists, wishlist_items, wishlist_analytics)';
  ELSE
    RAISE EXCEPTION '✗ Missing tables: %', array_to_string(missing_tables, ', ');
  END IF;
END $$;

-- ============================================
-- 2. VERIFY wishlists TABLE STRUCTURE
-- ============================================
DO $$
DECLARE
  column_count INTEGER;
  expected_columns INTEGER := 8;
BEGIN
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'wishlists';
  
  IF column_count = expected_columns THEN
    RAISE NOTICE '✓ wishlists table has correct number of columns (%)', expected_columns;
  ELSE
    RAISE EXCEPTION '✗ wishlists table has % columns, expected %', column_count, expected_columns;
  END IF;
END $$;

-- Verify specific columns exist in wishlists
DO $$
DECLARE
  column_name TEXT;
  columns_to_check TEXT[] := ARRAY[
    'id', 'user_id', 'name', 'is_default', 'is_public',
    'share_token', 'created_at', 'updated_at'
  ];
  missing_columns TEXT[] := '{}';
BEGIN
  FOREACH column_name IN ARRAY columns_to_check
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'wishlists'
      AND column_name = column_name
    ) THEN
      missing_columns := array_append(missing_columns, column_name);
    END IF;
  END LOOP;
  
  IF array_length(missing_columns, 1) IS NULL THEN
    RAISE NOTICE '✓ All required columns exist in wishlists table';
  ELSE
    RAISE EXCEPTION '✗ Missing columns in wishlists: %', array_to_string(missing_columns, ', ');
  END IF;
END $$;

-- ============================================
-- 3. VERIFY wishlist_items TABLE STRUCTURE
-- ============================================
DO $$
DECLARE
  column_count INTEGER;
  expected_columns INTEGER := 4;
BEGIN
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'wishlist_items';
  
  IF column_count = expected_columns THEN
    RAISE NOTICE '✓ wishlist_items table has correct number of columns (%)', expected_columns;
  ELSE
    RAISE EXCEPTION '✗ wishlist_items table has % columns, expected %', column_count, expected_columns;
  END IF;
END $$;

-- Verify specific columns exist in wishlist_items
DO $$
DECLARE
  column_name TEXT;
  columns_to_check TEXT[] := ARRAY[
    'id', 'wishlist_id', 'product_id', 'added_at'
  ];
  missing_columns TEXT[] := '{}';
BEGIN
  FOREACH column_name IN ARRAY columns_to_check
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'wishlist_items'
      AND column_name = column_name
    ) THEN
      missing_columns := array_append(missing_columns, column_name);
    END IF;
  END LOOP;
  
  IF array_length(missing_columns, 1) IS NULL THEN
    RAISE NOTICE '✓ All required columns exist in wishlist_items table';
  ELSE
    RAISE EXCEPTION '✗ Missing columns in wishlist_items: %', array_to_string(missing_columns, ', ');
  END IF;
END $$;

-- ============================================
-- 4. VERIFY wishlist_analytics TABLE STRUCTURE
-- ============================================
DO $$
DECLARE
  column_count INTEGER;
  expected_columns INTEGER := 6;
BEGIN
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'wishlist_analytics';
  
  IF column_count = expected_columns THEN
    RAISE NOTICE '✓ wishlist_analytics table has correct number of columns (%)', expected_columns;
  ELSE
    RAISE EXCEPTION '✗ wishlist_analytics table has % columns, expected %', column_count, expected_columns;
  END IF;
END $$;

-- Verify specific columns exist in wishlist_analytics
DO $$
DECLARE
  column_name TEXT;
  columns_to_check TEXT[] := ARRAY[
    'id', 'wishlist_id', 'event_type', 'user_id', 'metadata', 'created_at'
  ];
  missing_columns TEXT[] := '{}';
BEGIN
  FOREACH column_name IN ARRAY columns_to_check
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'wishlist_analytics'
      AND column_name = column_name
    ) THEN
      missing_columns := array_append(missing_columns, column_name);
    END IF;
  END LOOP;
  
  IF array_length(missing_columns, 1) IS NULL THEN
    RAISE NOTICE '✓ All required columns exist in wishlist_analytics table';
  ELSE
    RAISE EXCEPTION '✗ Missing columns in wishlist_analytics: %', array_to_string(missing_columns, ', ');
  END IF;
END $$;

-- ============================================
-- 5. VERIFY PRIMARY KEYS
-- ============================================
DO $$
DECLARE
  table_name TEXT;
  tables_to_check TEXT[] := ARRAY['wishlists', 'wishlist_items', 'wishlist_analytics'];
  missing_pks TEXT[] := '{}';
BEGIN
  FOREACH table_name IN ARRAY tables_to_check
  LOOP
    IF NOT EXISTS (
      SELECT FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = table_name
      AND tc.constraint_type = 'PRIMARY KEY'
    ) THEN
      missing_pks := array_append(missing_pks, table_name);
    END IF;
  END LOOP;
  
  IF array_length(missing_pks, 1) IS NULL THEN
    RAISE NOTICE '✓ All tables have primary key constraints';
  ELSE
    RAISE EXCEPTION '✗ Missing primary keys in: %', array_to_string(missing_pks, ', ');
  END IF;
END $$;

-- ============================================
-- 6. VERIFY FOREIGN KEY CONSTRAINTS
-- ============================================
-- Check wishlists -> users foreign key
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
    WHERE tc.table_name = 'wishlists'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'user_id'
  ) INTO has_fk;
  
  IF has_fk THEN
    SELECT rc.delete_rule INTO fk_action
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
    WHERE tc.table_name = 'wishlists'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'user_id';
    
    IF fk_action = 'CASCADE' THEN
      RAISE NOTICE '✓ wishlists.user_id foreign key with CASCADE DELETE exists';
    ELSE
      RAISE EXCEPTION '✗ wishlists.user_id delete rule is %, expected CASCADE', fk_action;
    END IF;
  ELSE
    RAISE EXCEPTION '✗ wishlists.user_id foreign key constraint missing';
  END IF;
END $$;

-- Check wishlist_items -> wishlists foreign key
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
    WHERE tc.table_name = 'wishlist_items'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'wishlist_id'
  ) INTO has_fk;
  
  IF has_fk THEN
    SELECT rc.delete_rule INTO fk_action
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
    WHERE tc.table_name = 'wishlist_items'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'wishlist_id';
    
    IF fk_action = 'CASCADE' THEN
      RAISE NOTICE '✓ wishlist_items.wishlist_id foreign key with CASCADE DELETE exists';
    ELSE
      RAISE EXCEPTION '✗ wishlist_items.wishlist_id delete rule is %, expected CASCADE', fk_action;
    END IF;
  ELSE
    RAISE EXCEPTION '✗ wishlist_items.wishlist_id foreign key constraint missing';
  END IF;
END $$;

-- Check wishlist_items -> products foreign key
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
    WHERE tc.table_name = 'wishlist_items'
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
    WHERE tc.table_name = 'wishlist_items'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'product_id';
    
    IF fk_action = 'CASCADE' THEN
      RAISE NOTICE '✓ wishlist_items.product_id foreign key with CASCADE DELETE exists';
    ELSE
      RAISE EXCEPTION '✗ wishlist_items.product_id delete rule is %, expected CASCADE', fk_action;
    END IF;
  ELSE
    RAISE EXCEPTION '✗ wishlist_items.product_id foreign key constraint missing';
  END IF;
END $$;

-- Check wishlist_analytics -> wishlists foreign key
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
    WHERE tc.table_name = 'wishlist_analytics'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'wishlist_id'
  ) INTO has_fk;
  
  IF has_fk THEN
    SELECT rc.delete_rule INTO fk_action
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
    WHERE tc.table_name = 'wishlist_analytics'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'wishlist_id';
    
    IF fk_action = 'CASCADE' THEN
      RAISE NOTICE '✓ wishlist_analytics.wishlist_id foreign key with CASCADE DELETE exists';
    ELSE
      RAISE EXCEPTION '✗ wishlist_analytics.wishlist_id delete rule is %, expected CASCADE', fk_action;
    END IF;
  ELSE
    RAISE EXCEPTION '✗ wishlist_analytics.wishlist_id foreign key constraint missing';
  END IF;
END $$;

-- Check wishlist_analytics -> users foreign key (SET NULL)
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
    WHERE tc.table_name = 'wishlist_analytics'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'user_id'
  ) INTO has_fk;
  
  IF has_fk THEN
    SELECT rc.delete_rule INTO fk_action
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
    WHERE tc.table_name = 'wishlist_analytics'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'user_id';
    
    IF fk_action = 'SET NULL' THEN
      RAISE NOTICE '✓ wishlist_analytics.user_id foreign key with SET NULL exists';
    ELSE
      RAISE EXCEPTION '✗ wishlist_analytics.user_id delete rule is %, expected SET NULL', fk_action;
    END IF;
  ELSE
    RAISE EXCEPTION '✗ wishlist_analytics.user_id foreign key constraint missing';
  END IF;
END $$;

-- ============================================
-- 7. VERIFY UNIQUE CONSTRAINTS
-- ============================================
-- Check unique_user_default constraint
DO $$
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'wishlists'
    AND constraint_name = 'unique_user_default'
    AND constraint_type = 'UNIQUE'
  ) INTO constraint_exists;
  
  IF constraint_exists THEN
    RAISE NOTICE '✓ unique_user_default constraint exists on wishlists table';
  ELSE
    RAISE EXCEPTION '✗ unique_user_default constraint missing on wishlists table';
  END IF;
END $$;

-- Check unique_wishlist_product constraint
DO $$
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'wishlist_items'
    AND constraint_name = 'unique_wishlist_product'
    AND constraint_type = 'UNIQUE'
  ) INTO constraint_exists;
  
  IF constraint_exists THEN
    RAISE NOTICE '✓ unique_wishlist_product constraint exists on wishlist_items table';
  ELSE
    RAISE EXCEPTION '✗ unique_wishlist_product constraint missing on wishlist_items table';
  END IF;
END $$;

-- ============================================
-- 8. VERIFY CHECK CONSTRAINTS
-- ============================================
-- Check valid_event_type constraint
DO $$
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'wishlist_analytics'
    AND constraint_name = 'valid_event_type'
    AND constraint_type = 'CHECK'
  ) INTO constraint_exists;
  
  IF constraint_exists THEN
    RAISE NOTICE '✓ valid_event_type check constraint exists on wishlist_analytics table';
  ELSE
    RAISE EXCEPTION '✗ valid_event_type check constraint missing on wishlist_analytics table';
  END IF;
END $$;

-- ============================================
-- 9. VERIFY INDEXES
-- ============================================
DO $$
DECLARE
  index_name TEXT;
  indexes_to_check TEXT[] := ARRAY[
    'idx_wishlists_user_id',
    'idx_wishlists_share_token',
    'idx_wishlists_is_public',
    'idx_wishlist_items_wishlist_id',
    'idx_wishlist_items_product_id',
    'idx_wishlist_items_added_at',
    'idx_wishlist_analytics_wishlist_id',
    'idx_wishlist_analytics_event_type',
    'idx_wishlist_analytics_created_at'
  ];
  missing_indexes TEXT[] := '{}';
BEGIN
  FOREACH index_name IN ARRAY indexes_to_check
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE indexname = index_name
    ) THEN
      missing_indexes := array_append(missing_indexes, index_name);
    END IF;
  END LOOP;
  
  IF array_length(missing_indexes, 1) IS NULL THEN
    RAISE NOTICE '✓ All required indexes exist (9 indexes)';
  ELSE
    RAISE EXCEPTION '✗ Missing indexes: %', array_to_string(missing_indexes, ', ');
  END IF;
END $$;

-- ============================================
-- 10. VERIFY TRIGGER
-- ============================================
DO $$
DECLARE
  has_trigger BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'update_wishlists_updated_at'
    AND event_object_table = 'wishlists'
  ) INTO has_trigger;
  
  IF has_trigger THEN
    RAISE NOTICE '✓ Trigger for updated_at exists on wishlists table';
  ELSE
    RAISE EXCEPTION '✗ Trigger for updated_at missing on wishlists table';
  END IF;
END $$;

-- ============================================
-- 11. VERIFY TRIGGER FUNCTION
-- ============================================
DO $$
DECLARE
  function_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_name = 'update_updated_at_column'
    AND routine_schema = 'public'
  ) INTO function_exists;
  
  IF function_exists THEN
    RAISE NOTICE '✓ update_updated_at_column() function exists';
  ELSE
    RAISE EXCEPTION '✗ update_updated_at_column() function missing';
  END IF;
END $$;

-- ============================================
-- 12. VERIFY DEFAULT VALUES
-- ============================================
DO $$
DECLARE
  has_defaults INTEGER;
BEGIN
  SELECT COUNT(*) INTO has_defaults
  FROM information_schema.columns
  WHERE table_name = 'wishlists'
  AND column_default IS NOT NULL
  AND column_name IN ('is_default', 'is_public', 'created_at', 'updated_at');
  
  IF has_defaults = 4 THEN
    RAISE NOTICE '✓ Default values set correctly on wishlists table';
  ELSE
    RAISE EXCEPTION '✗ Default values missing on wishlists table (found %)', has_defaults;
  END IF;
END $$;

DO $$
DECLARE
  has_defaults INTEGER;
BEGIN
  SELECT COUNT(*) INTO has_defaults
  FROM information_schema.columns
  WHERE table_name = 'wishlist_items'
  AND column_default IS NOT NULL
  AND column_name = 'added_at';
  
  IF has_defaults = 1 THEN
    RAISE NOTICE '✓ Default values set correctly on wishlist_items table';
  ELSE
    RAISE EXCEPTION '✗ Default values missing on wishlist_items table (found %)', has_defaults;
  END IF;
END $$;

DO $$
DECLARE
  has_defaults INTEGER;
BEGIN
  SELECT COUNT(*) INTO has_defaults
  FROM information_schema.columns
  WHERE table_name = 'wishlist_analytics'
  AND column_default IS NOT NULL
  AND column_name = 'created_at';
  
  IF has_defaults = 1 THEN
    RAISE NOTICE '✓ Default values set correctly on wishlist_analytics table';
  ELSE
    RAISE EXCEPTION '✗ Default values missing on wishlist_analytics table (found %)', has_defaults;
  END IF;
END $$;

-- ============================================
-- 13. TEST BASIC OPERATIONS
-- ============================================
DO $$
DECLARE
  test_user_id UUID;
  test_wishlist_id UUID;
  test_product_id UUID;
  test_item_id UUID;
  user_exists BOOLEAN;
  product_exists BOOLEAN;
BEGIN
  -- Get an existing user ID if available
  SELECT id INTO test_user_id
  FROM users
  LIMIT 1;
  
  -- Get an existing product ID if available
  SELECT id INTO test_product_id
  FROM products
  LIMIT 1;
  
  IF test_user_id IS NOT NULL AND test_product_id IS NOT NULL THEN
    -- Create a test wishlist
    INSERT INTO wishlists (user_id, name, is_default, is_public)
    VALUES (test_user_id, 'Test Wishlist', false, false)
    RETURNING id INTO test_wishlist_id;
    
    IF test_wishlist_id IS NOT NULL THEN
      RAISE NOTICE '✓ Test wishlist created successfully';
      
      -- Add a test item
      INSERT INTO wishlist_items (wishlist_id, product_id)
      VALUES (test_wishlist_id, test_product_id)
      RETURNING id INTO test_item_id;
      
      IF test_item_id IS NOT NULL THEN
        RAISE NOTICE '✓ Test wishlist item created successfully';
        
        -- Test analytics event
        INSERT INTO wishlist_analytics (wishlist_id, event_type, user_id, metadata)
        VALUES (test_wishlist_id, 'add_item', test_user_id, '{"test": true}'::jsonb);
        
        RAISE NOTICE '✓ Test analytics event created successfully';
        
        -- Clean up test data
        DELETE FROM wishlist_analytics WHERE wishlist_id = test_wishlist_id;
        DELETE FROM wishlist_items WHERE id = test_item_id;
        DELETE FROM wishlists WHERE id = test_wishlist_id;
        
        RAISE NOTICE '✓ Test data cleaned up successfully';
      ELSE
        RAISE EXCEPTION '✗ Failed to create test wishlist item';
      END IF;
    ELSE
      RAISE EXCEPTION '✗ Failed to create test wishlist';
    END IF;
  ELSE
    IF test_user_id IS NULL THEN
      RAISE NOTICE '⚠ No users found to test basic operations';
    END IF;
    IF test_product_id IS NULL THEN
      RAISE NOTICE '⚠ No products found to test basic operations';
    END IF;
  END IF;
END $$;

-- ============================================
-- 14. VERIFY TABLE COMMENTS
-- ============================================
DO $$
DECLARE
  comment_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO comment_count
  FROM pg_description
  JOIN pg_class ON pg_description.objoid = pg_class.oid
  WHERE pg_class.relname IN ('wishlists', 'wishlist_items', 'wishlist_analytics');
  
  IF comment_count >= 3 THEN
    RAISE NOTICE '✓ Table comments exist (%)', comment_count;
  ELSE
    RAISE NOTICE '⚠ Table comments missing (found %)', comment_count;
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
  RAISE NOTICE 'The wishlist migration is ready for use.';
  RAISE NOTICE '============================================';
END $$;

-- ============================================
-- DETAILED SCHEMA INFORMATION
-- ============================================
-- Uncomment the following queries to see detailed schema info:

-- View complete table structure
-- \d wishlists
-- \d wishlist_items
-- \d wishlist_analytics

-- View all indexes
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('wishlists', 'wishlist_items', 'wishlist_analytics');

-- View all constraints
-- SELECT constraint_name, constraint_type, table_name
-- FROM information_schema.table_constraints 
-- WHERE table_name IN ('wishlists', 'wishlist_items', 'wishlist_analytics');

-- View all triggers
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE event_object_table IN ('wishlists', 'wishlist_items', 'wishlist_analytics');

-- View sample data
-- SELECT * FROM wishlists LIMIT 5;
-- SELECT * FROM wishlist_items LIMIT 5;
-- SELECT * FROM wishlist_analytics LIMIT 5;
