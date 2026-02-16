-- ============================================
-- VERIFICATION SCRIPT: Wishlist Data Counts
-- ============================================
-- Phase 6, Milestone 2: Wishlist Management
-- This script verifies the data in all wishlist-related tables
-- by checking row counts and displaying sample data
-- ============================================

-- ============================================
-- 1. CHECK ACTIVE TABLES DATA COUNTS
-- ============================================

-- Check wishlists table (active)
DO $$
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM wishlists;
  
  IF row_count = 0 THEN
    RAISE NOTICE 'wishlists (active): EMPTY (0 rows)';
  ELSE
    RAISE NOTICE 'wishlists (active): CONTAINS DATA (%) rows', row_count;
  END IF;
END $$;

-- Check wishlist_items table (active)
DO $$
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM wishlist_items;
  
  IF row_count = 0 THEN
    RAISE NOTICE 'wishlist_items (active): EMPTY (0 rows)';
  ELSE
    RAISE NOTICE 'wishlist_items (active): CONTAINS DATA (%) rows', row_count;
  END IF;
END $$;

-- Check wishlist_analytics table (active)
DO $$
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM wishlist_analytics;
  
  IF row_count = 0 THEN
    RAISE NOTICE 'wishlist_analytics (active): EMPTY (0 rows)';
  ELSE
    RAISE NOTICE 'wishlist_analytics (active): CONTAINS DATA (%) rows', row_count;
  END IF;
END $$;

-- ============================================
-- 2. CHECK REDUNDANT TABLES DATA COUNTS
-- ============================================

-- Check wishlists_new table (redundant)
DO $$
DECLARE
  row_count INTEGER;
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'wishlists_new'
  ) INTO table_exists;
  
  IF table_exists THEN
    SELECT COUNT(*) INTO row_count FROM wishlists_new;
    
    IF row_count = 0 THEN
      RAISE NOTICE 'wishlists_new (redundant): EMPTY (0 rows) - SAFE TO DROP';
    ELSE
      RAISE NOTICE 'wishlists_new (redundant): CONTAINS DATA (%) rows - DO NOT DROP', row_count;
    END IF;
  ELSE
    RAISE NOTICE 'wishlists_new (redundant): TABLE DOES NOT EXIST';
  END IF;
END $$;

-- Check wishlist_items_new table (redundant)
DO $$
DECLARE
  row_count INTEGER;
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'wishlist_items_new'
  ) INTO table_exists;
  
  IF table_exists THEN
    SELECT COUNT(*) INTO row_count FROM wishlist_items_new;
    
    IF row_count = 0 THEN
      RAISE NOTICE 'wishlist_items_new (redundant): EMPTY (0 rows) - SAFE TO DROP';
    ELSE
      RAISE NOTICE 'wishlist_items_new (redundant): CONTAINS DATA (%) rows - DO NOT DROP', row_count;
    END IF;
  ELSE
    RAISE NOTICE 'wishlist_items_new (redundant): TABLE DOES NOT EXIST';
  END IF;
END $$;

-- ============================================
-- 3. DISPLAY SAMPLE DATA FROM ACTIVE TABLES
-- ============================================

-- Sample data from wishlists (if not empty)
DO $$
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM wishlists;
  
  IF row_count > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '--- SAMPLE DATA: wishlists (first 5 rows) ---';
    RAISE NOTICE 'id | user_id | name | is_default | is_public | share_token | created_at | updated_at';
    RAISE NOTICE '---|---------|------|------------|-----------|-------------|------------|------------';
    PERFORM pg_notify('wishlist_sample', 
      'id | user_id | name | is_default | is_public | share_token | created_at | updated_at');
  END IF;
END $$;

-- Display actual sample data for wishlists
SELECT 
  id::text, 
  user_id::text, 
  name, 
  is_default::text, 
  is_public::text, 
  COALESCE(share_token, 'NULL') as share_token,
  created_at::text, 
  updated_at::text
FROM wishlists 
ORDER BY created_at DESC 
LIMIT 5;

-- Sample data from wishlist_items (if not empty)
DO $$
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM wishlist_items;
  
  IF row_count > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '--- SAMPLE DATA: wishlist_items (first 5 rows) ---';
  END IF;
END $$;

-- Display actual sample data for wishlist_items
SELECT 
  id::text, 
  wishlist_id::text, 
  product_id::text, 
  added_at::text
FROM wishlist_items 
ORDER BY added_at DESC 
LIMIT 5;

-- Sample data from wishlist_analytics (if not empty)
DO $$
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM wishlist_analytics;
  
  IF row_count > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '--- SAMPLE DATA: wishlist_analytics (first 5 rows) ---';
  END IF;
END $$;

-- Display actual sample data for wishlist_analytics
SELECT 
  id::text, 
  wishlist_id::text, 
  event_type, 
  COALESCE(user_id::text, 'NULL') as user_id,
  metadata::text, 
  created_at::text
FROM wishlist_analytics 
ORDER BY created_at DESC 
LIMIT 5;

-- ============================================
-- 4. DISPLAY SAMPLE DATA FROM REDUNDANT TABLES (if they exist and have data)
-- ============================================

-- Sample data from wishlists_new (if exists and not empty)
DO $$
DECLARE
  row_count INTEGER;
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'wishlists_new'
  ) INTO table_exists;
  
  IF table_exists THEN
    SELECT COUNT(*) INTO row_count FROM wishlists_new;
    
    IF row_count > 0 THEN
      RAISE NOTICE '';
      RAISE NOTICE '--- SAMPLE DATA: wishlists_new (first 5 rows) ---';
    END IF;
  END IF;
END $$;

-- Display actual sample data for wishlists_new
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wishlists_new') THEN
    IF EXISTS (SELECT 1 FROM wishlists_new LIMIT 1) THEN
      PERFORM dblink_connect('myconn', 'dbname=smart_tech_db user=postgres password=postgres host=localhost');
      -- Note: This would require dblink extension, using simpler approach below
    END IF;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Ignore errors if table doesn't exist or is empty
END $$;

-- Alternative approach for wishlists_new sample data
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'wishlists_new'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE 'wishlists_new table exists. Use: SELECT * FROM wishlists_new LIMIT 5; to view data';
  END IF;
END $$;

-- Sample data from wishlist_items_new (if exists and not empty)
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'wishlist_items_new'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE 'wishlist_items_new table exists. Use: SELECT * FROM wishlist_items_new LIMIT 5; to view data';
  END IF;
END $$;

-- ============================================
-- 5. SUMMARY REPORT
-- ============================================
DO $$
DECLARE
  wishlists_count INTEGER;
  wishlist_items_count INTEGER;
  wishlist_analytics_count INTEGER;
  wishlists_new_count INTEGER := 0;
  wishlist_items_new_count INTEGER := 0;
  wishlists_new_exists BOOLEAN := FALSE;
  wishlist_items_new_exists BOOLEAN := FALSE;
  total_active_rows INTEGER;
  total_redundant_rows INTEGER;
BEGIN
  -- Get counts for active tables
  SELECT COUNT(*) INTO wishlists_count FROM wishlists;
  SELECT COUNT(*) INTO wishlist_items_count FROM wishlist_items;
  SELECT COUNT(*) INTO wishlist_analytics_count FROM wishlist_analytics;
  
  -- Get counts for redundant tables if they exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'wishlists_new'
  ) INTO wishlists_new_exists;
  
  IF wishlists_new_exists THEN
    SELECT COUNT(*) INTO wishlists_new_count FROM wishlists_new;
  END IF;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'wishlist_items_new'
  ) INTO wishlist_items_new_exists;
  
  IF wishlist_items_new_exists THEN
    SELECT COUNT(*) INTO wishlist_items_new_count FROM wishlist_items_new;
  END IF;
  
  -- Calculate totals
  total_active_rows := wishlists_count + wishlist_items_count + wishlist_analytics_count;
  total_redundant_rows := wishlists_new_count + wishlist_items_new_count;
  
  -- Display summary
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'WISHLIST DATA COUNT SUMMARY REPORT';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'ACTIVE TABLES:';
  RAISE NOTICE '  wishlists:              % rows %', 
    wishlists_count, 
    CASE WHEN wishlists_count = 0 THEN '(EMPTY)' ELSE '(CONTAINS DATA)' END;
  RAISE NOTICE '  wishlist_items:         % rows %', 
    wishlist_items_count, 
    CASE WHEN wishlist_items_count = 0 THEN '(EMPTY)' ELSE '(CONTAINS DATA)' END;
  RAISE NOTICE '  wishlist_analytics:     % rows %', 
    wishlist_analytics_count, 
    CASE WHEN wishlist_analytics_count = 0 THEN '(EMPTY)' ELSE '(CONTAINS DATA)' END;
  RAISE NOTICE '';
  RAISE NOTICE 'REDUNDANT TABLES:';
  IF wishlists_new_exists THEN
    RAISE NOTICE '  wishlists_new:          % rows %', 
      wishlists_new_count, 
      CASE WHEN wishlists_new_count = 0 THEN '(EMPTY - SAFE TO DROP)' ELSE '(CONTAINS DATA - DO NOT DROP)' END;
  ELSE
    RAISE NOTICE '  wishlists_new:          (TABLE DOES NOT EXIST)';
  END IF;
  
  IF wishlist_items_new_exists THEN
    RAISE NOTICE '  wishlist_items_new:     % rows %', 
      wishlist_items_new_count, 
      CASE WHEN wishlist_items_new_count = 0 THEN '(EMPTY - SAFE TO DROP)' ELSE '(CONTAINS DATA - DO NOT DROP)' END;
  ELSE
    RAISE NOTICE '  wishlist_items_new:     (TABLE DOES NOT EXIST)';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'TOTALS:';
  RAISE NOTICE '  Active tables total:     % rows', total_active_rows;
  RAISE NOTICE '  Redundant tables total: % rows', total_redundant_rows;
  RAISE NOTICE '';
  
  -- Safety check for dropping redundant tables
  IF total_redundant_rows = 0 THEN
    RAISE NOTICE 'SAFETY STATUS: ✓ REDUNDANT TABLES ARE EMPTY - SAFE TO DROP';
  ELSE
    RAISE NOTICE 'SAFETY STATUS: ⚠ REDUNDANT TABLES CONTAIN DATA - DO NOT DROP';
  END IF;
  
  RAISE NOTICE '============================================';
END $$;

-- ============================================
-- 6. DETAILED QUERIES FOR MANUAL VERIFICATION
-- ============================================
-- Uncomment the following queries for detailed inspection:

-- View all data in wishlists table
-- SELECT * FROM wishlists ORDER BY created_at DESC;

-- View all data in wishlist_items table
-- SELECT * FROM wishlist_items ORDER BY added_at DESC;

-- View all data in wishlist_analytics table
-- SELECT * FROM wishlist_analytics ORDER BY created_at DESC;

-- View all data in wishlists_new table (if exists)
-- SELECT * FROM wishlists_new ORDER BY created_at DESC;

-- View all data in wishlist_items_new table (if exists)
-- SELECT * FROM wishlist_items_new ORDER BY added_at DESC;

-- View relationships between tables
-- SELECT 
--   w.id as wishlist_id,
--   w.name as wishlist_name,
--   w.user_id,
--   COUNT(wi.id) as item_count,
--   COUNT(wa.id) as analytics_count
-- FROM wishlists w
-- LEFT JOIN wishlist_items wi ON w.id = wi.wishlist_id
-- LEFT JOIN wishlist_analytics wa ON w.id = wa.wishlist_id
-- GROUP BY w.id, w.name, w.user_id
-- ORDER BY item_count DESC;

-- ============================================
-- VERIFICATION COMPLETE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'DATA COUNT VERIFICATION COMPLETE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Review the summary report above for details.';
  RAISE NOTICE '============================================';
END $$;
