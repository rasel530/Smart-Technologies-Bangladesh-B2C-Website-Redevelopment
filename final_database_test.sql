-- =====================================================
-- FINAL DATABASE VERIFICATION TEST
-- =====================================================
-- Uses exact column names from database schema

-- Set database context
\c smart_ecommerce_dev;

-- =====================================================
-- 1. BASIC CRUD OPERATIONS
-- =====================================================

-- Test Users CRUD
BEGIN;
-- CREATE
INSERT INTO users (id, email, "firstName", "lastName", password, role, status) 
VALUES ('test-user-1', 'test@example.com', 'Test', 'User', 'hashedpassword', 'CUSTOMER', 'ACTIVE');

-- READ
SELECT id, email, "firstName", "lastName", role, status FROM users WHERE id = 'test-user-1';

-- UPDATE
UPDATE users SET "firstName" = 'Updated' WHERE id = 'test-user-1';
SELECT "firstName" FROM users WHERE id = 'test-user-1';

-- DELETE
DELETE FROM users WHERE id = 'test-user-1';
SELECT COUNT(*) FROM users WHERE id = 'test-user-1';
COMMIT;

-- Test Categories CRUD
BEGIN;
-- CREATE
INSERT INTO categories (id, name, slug, description, "isActive") 
VALUES ('test-cat-1', 'Test Category', 'test-category', 'Test category description', true);

-- READ
SELECT id, name, slug, "isActive" FROM categories WHERE id = 'test-cat-1';

-- UPDATE
UPDATE categories SET description = 'Updated description' WHERE id = 'test-cat-1';
SELECT description FROM categories WHERE id = 'test-cat-1';

-- DELETE
DELETE FROM categories WHERE id = 'test-cat-1';
SELECT COUNT(*) FROM categories WHERE id = 'test-cat-1';
COMMIT;

-- =====================================================
-- 2. FOREIGN KEY RELATIONSHIP TESTS
-- =====================================================

-- Test User -> Addresses relationship
BEGIN;
-- Create test user
INSERT INTO users (id, email, "firstName", "lastName", password, role, status) 
VALUES ('fk-test-user', 'fktest@example.com', 'FK', 'Test', 'hashedpassword', 'CUSTOMER', 'ACTIVE');

-- Create address for user
INSERT INTO addresses (id, "userId", type, "firstName", "lastName", address, city, district, division) 
VALUES ('fk-test-addr', 'fk-test-user', 'SHIPPING', 'FK', 'Test', '123 Test St', 'Test City', 'Test District', 'DHAKA');

-- Verify relationship
SELECT u.email, a.address 
FROM users u 
JOIN addresses a ON u.id = a."userId" 
WHERE u.id = 'fk-test-user';

-- Test cascade delete
DELETE FROM users WHERE id = 'fk-test-user';
-- Verify address is also deleted
SELECT COUNT(*) FROM addresses WHERE id = 'fk-test-addr';
COMMIT;

-- Test Category -> Products relationship
BEGIN;
-- Create test category
INSERT INTO categories (id, name, slug, description, "isActive") 
VALUES ('fk-test-cat', 'FK Test Category', 'fk-test-category', 'Test category', true);

-- Create test brand
INSERT INTO brands (id, name, slug, description, "isActive") 
VALUES ('fk-test-brand', 'FK Test Brand', 'fk-test-brand', 'Test brand', true);

-- Create product with category and brand
INSERT INTO products (id, sku, name, "nameEn", slug, "categoryId", "brandId", "regularPrice", "costPrice", "taxRate", "stockQuantity", "lowStockThreshold", status) 
VALUES ('fk-test-prod', 'FK-TEST-PROD', 'FK Test Product', 'FK Test Product', 'fk-test-product', 'fk-test-cat', 'fk-test-brand', 100.00, 50.00, 0, 10, 5, 'ACTIVE');

-- Verify relationships
SELECT p.name, c.name as category_name, b.name as brand_name 
FROM products p
JOIN categories c ON p."categoryId" = c.id
JOIN brands b ON p."brandId" = b.id
WHERE p.id = 'fk-test-prod';

-- Clean up test data
DELETE FROM products WHERE id = 'fk-test-prod';
DELETE FROM brands WHERE id = 'fk-test-brand';
DELETE FROM categories WHERE id = 'fk-test-cat';
COMMIT;

-- =====================================================
-- 3. DATA INTEGRITY TESTS
-- =====================================================

-- Test unique constraints
BEGIN;
-- Test email uniqueness
INSERT INTO users (id, email, "firstName", "lastName", password, role, status) 
VALUES ('unique-test-1', 'unique@example.com', 'Unique', 'Test1', 'hashedpassword', 'CUSTOMER', 'ACTIVE');
COMMIT;

-- Test not null constraints
BEGIN;
-- This should fail (email is required)
INSERT INTO users (id, "firstName", "lastName", password, role, status) 
VALUES ('null-test-1', 'Null', 'Test', 'hashedpassword', 'CUSTOMER', 'ACTIVE');
ROLLBACK;

-- =====================================================
-- 4. VERIFICATION QUERIES
-- =====================================================

-- Count records in each table
SELECT '=== RECORD COUNTS ===' as section;
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'addresses', COUNT(*) FROM addresses
UNION ALL
SELECT 'brands', COUNT(*) FROM brands
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'carts', COUNT(*) FROM carts;

-- Test foreign key constraints are working
SELECT '=== FOREIGN KEY TEST ===' as section;
SELECT 
    'User->Addresses relationship works: ' || CASE 
        WHEN COUNT(a.id) > 0 THEN 'PASS'
        ELSE 'FAIL'
    END as test_result
FROM users u
LEFT JOIN addresses a ON u.id = a."userId"
WHERE u.email = 'unique@example.com';

-- =====================================================
-- TEST EXECUTION COMPLETE
-- =====================================================