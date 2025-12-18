-- =====================================================
-- DATABASE VERIFICATION AND CRUD TEST
-- =====================================================
-- This script verifies database structure and tests basic CRUD operations

-- Set database context
\c smart_ecommerce_dev;

-- =====================================================
-- 1. TABLE AND ENUM VERIFICATION
-- =====================================================

-- Verify all expected tables exist
SELECT '=== TABLE VERIFICATION ===' as section;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verify all expected enums exist
SELECT '=== ENUM VERIFICATION ===' as section;
SELECT 
    t.typname AS enum_name,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typtype = 'e' AND t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
GROUP BY t.typname
ORDER BY t.typname;

-- =====================================================
-- 2. BASIC CRUD OPERATIONS TEST
-- =====================================================

-- Test Users CRUD
BEGIN;
-- CREATE
INSERT INTO users (id, email, firstName, lastName, password, role, status) 
VALUES ('test-user-1', 'test@example.com', 'Test', 'User', 'hashedpassword', 'CUSTOMER', 'ACTIVE');

-- READ
SELECT id, email, firstName, lastName, role, status FROM users WHERE id = 'test-user-1';

-- UPDATE
UPDATE users SET firstName = 'Updated' WHERE id = 'test-user-1';
SELECT firstName FROM users WHERE id = 'test-user-1';

-- DELETE
DELETE FROM users WHERE id = 'test-user-1';
SELECT COUNT(*) FROM users WHERE id = 'test-user-1';
COMMIT;

-- Test Categories CRUD
BEGIN;
-- CREATE
INSERT INTO categories (id, name, slug, description, isActive) 
VALUES ('test-cat-1', 'Test Category', 'test-category', 'Test category description', true);

-- READ
SELECT id, name, slug, isActive FROM categories WHERE id = 'test-cat-1';

-- UPDATE
UPDATE categories SET description = 'Updated description' WHERE id = 'test-cat-1';
SELECT description FROM categories WHERE id = 'test-cat-1';

-- DELETE
DELETE FROM categories WHERE id = 'test-cat-1';
SELECT COUNT(*) FROM categories WHERE id = 'test-cat-1';
COMMIT;

-- =====================================================
-- 3. FOREIGN KEY RELATIONSHIP TESTS
-- =====================================================

-- Test User -> Addresses relationship
BEGIN;
-- Create test user
INSERT INTO users (id, email, firstName, lastName, password, role, status) 
VALUES ('fk-test-user', 'fktest@example.com', 'FK', 'Test', 'hashedpassword', 'CUSTOMER', 'ACTIVE');

-- Create address for the user
INSERT INTO addresses (id, userId, type, firstName, lastName, address, city, district, division) 
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
INSERT INTO categories (id, name, slug, description, isActive) 
VALUES ('fk-test-cat', 'FK Test Category', 'fk-test-category', 'Test category', true);

-- Create test brand
INSERT INTO brands (id, name, slug, description, isActive) 
VALUES ('fk-test-brand', 'FK Test Brand', 'fk-test-brand', 'Test brand', true);

-- Create product with category and brand
INSERT INTO products (id, sku, name, nameEn, slug, categoryId, brandId, regularPrice, costPrice, taxRate, stockQuantity, lowStockThreshold, status) 
VALUES ('fk-test-prod', 'FK-TEST-PROD', 'FK Test Product', 'FK Test Product', 'fk-test-product', 'fk-test-cat', 'fk-test-brand', 100.00, 50.00, 0, 10, 5, 'ACTIVE');

-- Verify relationships
SELECT p.name, c.name as category_name, b.name as brand_name 
FROM products p
JOIN categories c ON p."categoryId" = c.id
JOIN brands b ON p."brandId" = b.id
WHERE p.id = 'fk-test-prod';

-- Test restrict delete (should fail)
BEGIN SAVEPOINT restrict_test;
DELETE FROM categories WHERE id = 'fk-test-cat';
ROLLBACK TO restrict_test;
COMMIT;

-- Clean up test data
DELETE FROM products WHERE id = 'fk-test-prod';
DELETE FROM brands WHERE id = 'fk-test-brand';
DELETE FROM categories WHERE id = 'fk-test-cat';
COMMIT;

-- =====================================================
-- 4. DATA INTEGRITY TESTS
-- =====================================================

-- Test unique constraints
BEGIN;
-- Test email uniqueness
INSERT INTO users (id, email, firstName, lastName, password, role, status) 
VALUES ('unique-test-1', 'unique@example.com', 'Unique', 'Test1', 'hashedpassword', 'CUSTOMER', 'ACTIVE');
-- This should fail
INSERT INTO users (id, email, firstName, lastName, password, role, status) 
VALUES ('unique-test-2', 'unique@example.com', 'Unique', 'Test2', 'hashedpassword', 'CUSTOMER', 'ACTIVE');
ROLLBACK;

-- Test not null constraints
BEGIN;
-- This should fail (email is required)
INSERT INTO users (id, firstName, lastName, password, role, status) 
VALUES ('null-test-1', 'Null', 'Test', 'hashedpassword', 'CUSTOMER', 'ACTIVE');
ROLLBACK;

-- =====================================================
-- 5. VERIFICATION QUERIES
-- =====================================================

-- Check foreign key constraints are properly set up
SELECT '=== FOREIGN KEY CONSTRAINTS ===' as section;
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- TEST EXECUTION COMPLETE
-- =====================================================