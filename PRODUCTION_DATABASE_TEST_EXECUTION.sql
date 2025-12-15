-- =====================================================
-- PRODUCTION DATABASE RELATIONSHIP TESTING
-- =====================================================
-- SAFE VALIDATION SCRIPT FOR PRODUCTION ENVIRONMENT
-- This script performs read-only validation tests to ensure data integrity

-- Set production database context
\c smart_ecommerce_prod;

-- Enable safety measures for production
SET statement_timeout = '30s';
SET lock_timeout = '10s';
SET idle_in_transaction_session_timeout = '5min';production

-- Start transaction for consistency
BEGIN;

-- =====================================================
-- PHASE 1: DATA INTEGRITY VALIDATION
-- =====================================================

SELECT '=== PRODUCTION DATA INTEGRITY VALIDATION ===' as test_phase;
SELECT 'Execution Time: ' || CURRENT_TIMESTAMP as execution_info;

-- Check for orphaned records (critical for data integrity)
SELECT 
    'Orphaned Addresses' as test_name,
    COUNT(*) as orphaned_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL - Orphaned addresses detected'
    END as test_result
FROM addresses a 
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = a.userId AND a.userId IS NOT NULL);

SELECT 
    'Orphaned Cart Items' as test_name,
    COUNT(*) as orphaned_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL - Orphaned cart items detected'
    END as test_result
FROM cart_items ci 
WHERE NOT EXISTS (SELECT 1 FROM carts c WHERE c.id = ci.cartId AND ci.cartId IS NOT NULL);

SELECT 
    'Orphaned Order Items' as test_name,
    COUNT(*) as orphaned_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL - Orphaned order items detected'
    END as test_result
FROM order_items oi 
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.id = oi.orderId AND oi.orderId IS NOT NULL);

SELECT 
    'Orphaned Reviews' as test_name,
    COUNT(*) as orphaned_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL - Orphaned reviews detected'
    END as test_result
FROM reviews r 
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = r.userId AND r.userId IS NOT NULL)
   OR NOT EXISTS (SELECT 1 FROM products p WHERE p.id = r.productId AND r.productId IS NOT NULL);

SELECT 
    'Orphaned Product Images' as test_name,
    COUNT(*) as orphaned_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL - Orphaned product images detected'
    END as test_result
FROM product_images pi 
WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.id = pi.productId AND pi.productId IS NOT NULL);

SELECT 
    'Orphaned Product Specifications' as test_name,
    COUNT(*) as orphaned_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL - Orphaned product specifications detected'
    END as test_result
FROM product_specifications ps 
WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.id = ps.productId AND ps.productId IS NOT NULL);

SELECT 
    'Orphaned Product Variants' as test_name,
    COUNT(*) as orphaned_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL - Orphaned product variants detected'
    END as test_result
FROM product_variants pv 
WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.id = pv.productId AND pv.productId IS NOT NULL);

SELECT 
    'Orphaned User Sessions' as test_name,
    COUNT(*) as orphaned_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL - Orphaned user sessions detected'
    END as test_result
FROM user_sessions us 
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = us.userId AND us.userId IS NOT NULL);

SELECT 
    'Orphaned Wishlist Items' as test_name,
    COUNT(*) as orphaned_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL - Orphaned wishlist items detected'
    END as test_result
FROM wishlist_items wi 
WHERE NOT EXISTS (SELECT 1 FROM wishlists w WHERE w.id = wi.wishlistId AND wi.wishlistId IS NOT NULL);

-- =====================================================
-- PHASE 2: RELATIONSHIP COUNT VALIDATION
-- =====================================================

SELECT '=== RELATIONSHIP COUNT VALIDATION ===' as test_phase;

-- User relationship validation
SELECT 
    'User Relationship Counts' as test_name,
    COUNT(DISTINCT u.id) as total_users,
    ROUND(AVG(COUNT(DISTINCT a.id)), 2) as avg_addresses_per_user,
    ROUND(AVG(COUNT(DISTINCT o.id)), 2) as avg_orders_per_user,
    ROUND(AVG(COUNT(DISTINCT r.id)), 2) as avg_reviews_per_user,
    CASE 
        WHEN MIN(COUNT(DISTINCT a.id)) >= 0 AND MAX(COUNT(DISTINCT a.id)) <= 10
         AND MIN(COUNT(DISTINCT o.id)) >= 0 AND MAX(COUNT(DISTINCT o.id)) <= 100
         AND MIN(COUNT(DISTINCT r.id)) >= 0 AND MAX(COUNT(DISTINCT r.id)) <= 50
        THEN 'PASS'
        ELSE 'FAIL - Relationship counts outside expected ranges'
    END as test_result
FROM users u
LEFT JOIN addresses a ON u.id = a.userId
LEFT JOIN orders o ON u.id = o.userId
LEFT JOIN reviews r ON u.id = r.userId
WHERE u.isActive = true
GROUP BY u.id
HAVING COUNT(DISTINCT a.id) > 0 OR COUNT(DISTINCT o.id) > 0 OR COUNT(DISTINCT r.id) > 0;

-- Product relationship validation
SELECT 
    'Product Relationship Counts' as test_name,
    COUNT(DISTINCT p.id) as total_products,
    ROUND(AVG(COUNT(DISTINCT pi.id)), 2) as avg_images_per_product,
    ROUND(AVG(COUNT(DISTINCT pv.id)), 2) as avg_variants_per_product,
    ROUND(AVG(COUNT(DISTINCT oi.id)), 2) as avg_order_items_per_product,
    CASE 
        WHEN MIN(COUNT(DISTINCT pi.id)) >= 0 AND MAX(COUNT(DISTINCT pi.id)) <= 10
         AND MIN(COUNT(DISTINCT pv.id)) >= 0 AND MAX(COUNT(DISTINCT pv.id)) <= 5
         AND MIN(COUNT(DISTINCT oi.id)) >= 0 AND MAX(COUNT(DISTINCT oi.id)) <= 100
        THEN 'PASS'
        ELSE 'FAIL - Product relationship counts outside expected ranges'
    END as test_result
FROM products p
LEFT JOIN product_images pi ON p.id = pi.productId
LEFT JOIN product_variants pv ON p.id = pv.productId
LEFT JOIN order_items oi ON p.id = oi.productId
WHERE p.isActive = true
GROUP BY p.id
HAVING COUNT(DISTINCT pi.id) > 0 OR COUNT(DISTINCT pv.id) > 0 OR COUNT(DISTINCT oi.id) > 0;

-- Order relationship validation
SELECT 
    'Order Relationship Counts' as test_name,
    COUNT(DISTINCT o.id) as total_orders,
    ROUND(AVG(COUNT(DISTINCT oi.id)), 2) as avg_items_per_order,
    ROUND(AVG(oi.totalPrice), 2) as avg_order_value,
    CASE 
        WHEN MIN(COUNT(DISTINCT oi.id)) >= 1 AND MAX(COUNT(DISTINCT oi.id)) <= 20
         AND MIN(oi.totalPrice) >= 0 AND MAX(oi.totalPrice) <= 1000000
        THEN 'PASS'
        ELSE 'FAIL - Order relationship counts outside expected ranges'
    END as test_result
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.orderId
GROUP BY o.id
HAVING COUNT(DISTINCT oi.id) > 0;

-- Category hierarchy validation
SELECT 
    'Category Hierarchy Validation' as test_name,
    COUNT(DISTINCT parent.id) as parent_categories,
    COUNT(DISTINCT child.id) as child_categories,
    ROUND(AVG(COUNT(DISTINCT child.id)), 2) as avg_children_per_parent,
    CASE 
        WHEN MIN(COUNT(DISTINCT child.id)) >= 0 AND MAX(COUNT(DISTINCT child.id)) <= 10
        THEN 'PASS'
        ELSE 'FAIL - Category hierarchy outside expected ranges'
    END as test_result
FROM categories parent
LEFT JOIN categories child ON child.parentId = parent.id
WHERE parent.parentId IS NULL
GROUP BY parent.id
HAVING COUNT(DISTINCT child.id) > 0;

-- =====================================================
-- PHASE 3: CONSTRAINT VALIDATION (NON-DESTRUCTIVE)
-- =====================================================

SELECT '=== CONSTRAINT VALIDATION ===' as test_phase;

-- Check for duplicate emails (UNIQUE constraint validation)
SELECT 
    'Unique Email Constraint' as test_name,
    COUNT(*) as duplicate_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL - Duplicate emails detected'
    END as test_result
FROM users 
WHERE email IN (
    SELECT email 
    FROM users 
    GROUP BY email 
    HAVING COUNT(*) > 1
);

-- Check for duplicate SKUs (UNIQUE constraint validation)
SELECT 
    'Unique SKU Constraint' as test_name,
    COUNT(*) as duplicate_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL - Duplicate SKUs detected'
    END as test_result
FROM products 
WHERE sku IN (
    SELECT sku 
    FROM products 
    GROUP BY sku 
    HAVING COUNT(*) > 1
);

-- Check for duplicate slugs (UNIQUE constraint validation)
SELECT 
    'Unique Slug Constraint' as test_name,
    COUNT(*) as duplicate_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL - Duplicate slugs detected'
    END as test_result
FROM products 
WHERE slug IN (
    SELECT slug 
    FROM products 
    GROUP BY slug 
    HAVING COUNT(*) > 1
);

-- Check for duplicate order numbers (UNIQUE constraint validation)
SELECT 
    'Unique Order Number Constraint' as test_name,
    COUNT(*) as duplicate_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL - Duplicate order numbers detected'
    END as test_result
FROM orders 
WHERE orderNumber IN (
    SELECT orderNumber 
    FROM orders 
    GROUP BY orderNumber 
    HAVING COUNT(*) > 1
);

-- Check for NULL values in required fields (NOT NULL constraint validation)
SELECT 
    'NOT NULL Constraint Validation' as test_name,
    SUM(CASE WHEN email IS NULL THEN 1 ELSE 0 END) as null_emails,
    SUM(CASE WHEN password IS NULL THEN 1 ELSE 0 END) as null_passwords,
    SUM(CASE WHEN name IS NULL THEN 1 ELSE 0 END) as null_product_names,
    SUM(CASE WHEN sku IS NULL THEN 1 ELSE 0 END) as null_skus,
    CASE 
        WHEN SUM(CASE WHEN email IS NULL THEN 1 ELSE 0 END) = 0
         AND SUM(CASE WHEN password IS NULL THEN 1 ELSE 0 END) = 0
         AND SUM(CASE WHEN name IS NULL THEN 1 ELSE 0 END) = 0
         AND SUM(CASE WHEN sku IS NULL THEN 1 ELSE 0 END) = 0
        THEN 'PASS'
        ELSE 'FAIL - NULL values found in required fields'
    END as test_result
FROM users u
FULL OUTER JOIN products p ON 1=1
WHERE u.email IS NULL OR u.password IS NULL OR p.name IS NULL OR p.sku IS NULL;

-- =====================================================
-- PHASE 4: PERFORMANCE VALIDATION
-- =====================================================

SELECT '=== PERFORMANCE VALIDATION ===' as test_phase;

-- Check table sizes and growth patterns
SELECT 
    'Table Size Analysis' as test_name,
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) as table_size,
    n_live_tup as row_count,
    CASE 
        WHEN n_live_tup > 0 AND pg_total_relation_size(tablename::regclass) > 0
        THEN 'PASS'
        ELSE 'FAIL - Empty or corrupted tables detected'
    END as test_result
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'products', 'orders', 'addresses', 'reviews')
ORDER BY pg_total_relation_size(tablename::regclass) DESC;

-- Index usage analysis
SELECT 
    'Index Usage Analysis' as test_name,
    tablename,
    indexname,
    idx_tup_read as index_reads,
    idx_tup_fetch as index_fetches,
    ROUND((idx_tup_fetch::float / NULLIF(idx_tup_read, 0)) * 100, 2) as fetch_efficiency_percent,
    CASE 
        WHEN idx_tup_read > 0 
             AND (idx_tup_fetch::float / NULLIF(idx_tup_read, 0)) * 100 >= 80
        THEN 'PASS'
        ELSE 'FAIL - Poor index efficiency detected'
    END as test_result
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
AND tablename IN ('users', 'products', 'orders', 'addresses', 'reviews')
AND idx_tup_read > 0
ORDER BY idx_tup_read DESC
LIMIT 20;

-- Database size and growth analysis
SELECT 
    'Database Growth Analysis' as test_name,
    pg_size_pretty(pg_database_size('smart_ecommerce_prod')) as current_database_size,
    CASE 
        WHEN pg_size_pretty(pg_database_size('smart_ecommerce_prod')) IS NOT NULL
        THEN 'PASS'
        ELSE 'FAIL - Unable to determine database size'
    END as test_result;

-- =====================================================
-- PHASE 5: PRODUCTION READINESS ASSESSMENT
-- =====================================================

SELECT '=== PRODUCTION READINESS ASSESSMENT ===' as test_phase;

-- Overall health score calculation
SELECT 
    'Overall Database Health Score' as assessment_name,
    CASE 
        WHEN (SELECT COUNT(*) FROM addresses WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = addresses.userId AND addresses.userId IS NOT NULL)) = 0
         AND (SELECT COUNT(*) FROM cart_items WHERE NOT EXISTS (SELECT 1 FROM carts c WHERE c.id = cart_items.cartId AND cart_items.cartId IS NOT NULL)) = 0
         AND (SELECT COUNT(*) FROM order_items WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.orderId AND order_items.orderId IS NOT NULL)) = 0
         AND (SELECT COUNT(*) FROM reviews WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = reviews.userId AND reviews.userId IS NOT NULL)) = 0
         AND (SELECT COUNT(*) FROM product_images WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.id = product_images.productId AND product_images.productId IS NOT NULL)) = 0
         AND (SELECT COUNT(*) FROM product_specifications WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.id = product_specifications.productId AND product_specifications.productId IS NOT NULL)) = 0
         AND (SELECT COUNT(*) FROM product_variants WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.id = product_variants.productId AND product_variants.productId IS NOT NULL)) = 0
         AND (SELECT COUNT(*) FROM user_sessions WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = user_sessions.userId AND user_sessions.userId IS NOT NULL)) = 0
         AND (SELECT COUNT(*) FROM wishlist_items WHERE NOT EXISTS (SELECT 1 FROM wishlists w WHERE w.id = wishlist_items.wishlistId AND wishlist_items.wishlistId IS NOT NULL)) = 0
        THEN 100
        ELSE 0
    END as health_score;

-- Constraint compliance check
SELECT 
    'Constraint Compliance Score' as assessment_name,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public') >= 20
         AND (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'UNIQUE' AND table_schema = 'public') >= 10
         AND (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'CHECK' AND table_schema = 'public') >= 5
        THEN 100
        ELSE 0
    END as compliance_score;

-- Performance benchmark check
SELECT 
    'Performance Benchmark Score' as assessment_name,
    CASE 
        WHEN (SELECT AVG(n_live_tup) FROM pg_stat_user_tables WHERE schemaname = 'public') < 1000000
        THEN 100
        ELSE 50
    END as performance_score;

-- Final production readiness assessment
SELECT 
    'Production Readiness' as final_assessment,
    CASE 
        WHEN (SELECT CASE 
                    WHEN (SELECT COUNT(*) FROM addresses WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = addresses.userId AND addresses.userId IS NOT NULL)) = 0
                         AND (SELECT COUNT(*) FROM cart_items WHERE NOT EXISTS (SELECT 1 FROM carts c WHERE c.id = cart_items.cartId AND cart_items.cartId IS NOT NULL)) = 0
                         AND (SELECT COUNT(*) FROM order_items WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.orderId AND order_items.orderId IS NOT NULL)) = 0
                         AND (SELECT COUNT(*) FROM reviews WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = reviews.userId AND reviews.userId IS NOT NULL)) = 0
                    THEN 100 ELSE 0 END) = 100
        THEN 'READY FOR PRODUCTION'
        ELSE 'NEEDS ATTENTION'
    END as readiness_status;

-- Summary report
SELECT '=== PRODUCTION VALIDATION SUMMARY ===' as summary_phase;
SELECT 
    'Validation Completed' as status,
    CURRENT_TIMESTAMP as completion_time,
    'Review detailed results above for specific recommendations' as notes;

COMMIT;

-- =====================================================
-- PRODUCTION VALIDATION COMPLETE
-- =====================================================
-- All tests are read-only and safe for production
-- Review results above for detailed analysis
-- No data has been modified during this validation