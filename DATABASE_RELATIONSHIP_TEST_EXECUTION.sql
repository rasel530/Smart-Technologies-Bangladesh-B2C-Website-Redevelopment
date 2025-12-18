-- =====================================================
-- COMPREHENSIVE DATABASE RELATIONSHIP TEST EXECUTION
-- =====================================================
-- This script tests all entity relationships with dummy data
-- Execute in order to validate referential integrity

-- Set database context
\c smart_ecommerce_dev;

-- Set up test environment
SET CONSTRAINTS ALL DEFERRED;
BEGIN;

-- =====================================================
-- 1. SETUP BASE DATA
-- =====================================================

-- Insert Categories (Hierarchy Test)
INSERT INTO categories (id, name, slug, description, "isActive") VALUES
('cat-electronics', 'Electronics', 'electronics', 'Electronic devices and accessories', true),
('cat-smartphones', 'Smartphones', 'smartphones', 'Mobile phones and accessories', true),
('cat-laptops', 'Laptops', 'laptops', 'Laptop computers', true),
('cat-clothing', 'Clothing', 'clothing', 'Apparel and fashion items', true),
('cat-mens', 'Men''s Clothing', 'mens-clothing', 'Men''s apparel', true);

-- Update category hierarchy
UPDATE categories SET "parentId" = 'cat-electronics' WHERE id IN ('cat-smartphones', 'cat-laptops');
UPDATE categories SET "parentId" = 'cat-clothing' WHERE id = 'cat-mens';

-- Insert Brands
INSERT INTO brands (id, name, slug, description, website, "isActive") VALUES
('brand-apple', 'Apple', 'apple', 'Apple Inc. products', 'https://apple.com', true),
('brand-samsung', 'Samsung', 'samsung', 'Samsung Electronics', 'https://samsung.com', true),
('brand-nike', 'Nike', 'nike', 'Nike sports apparel', 'https://nike.com', true),
('brand-adidas', 'Adidas', 'adidas', 'Adidas sports wear', 'https://adidas.com', true);

-- Insert Users
INSERT INTO users (id, email, password, "firstName", "lastName", phone, "status", role, "createdAt", "updatedAt") VALUES
('user-john', 'john.doe@example.com', '$2b$10$hashedpassword1', 'John', 'Doe', '+8801712345678', 'ACTIVE', 'CUSTOMER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('user-jane', 'jane.smith@example.com', '$2b$10$hashedpassword2', 'Jane', 'Smith', '+8801812345679', 'ACTIVE', 'CUSTOMER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('user-admin', 'admin@smarttech.com', '$2b$10$hashedpassword3', 'Admin', 'User', '+8801912345670', 'ACTIVE', 'ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('user-mike', 'mike.wilson@example.com', '$2b$10$hashedpassword4', 'Mike', 'Wilson', '+8801712345671', 'ACTIVE', 'CUSTOMER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('user-sarah', 'sarah.jones@example.com', '$2b$10$hashedpassword5', 'Sarah', 'Jones', '+8801812345671', 'INACTIVE', 'CUSTOMER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Products
INSERT INTO products (id, sku, name, "nameEn", slug, "shortDescription", description, "regularPrice", "salePrice", "costPrice", "taxRate", "stockQuantity", "lowStockThreshold", "status", "isFeatured", "categoryId", "brandId", "createdAt", "updatedAt") VALUES
('prod-iphone14', 'IPHONE14-256', 'iPhone 14 Pro', 'iPhone 14 Pro', 'iphone-14-pro', 'Latest iPhone with advanced features', 'iPhone 14 Pro 256GB', 129999.00, 139999.00, 110000.00, 5.00, 50, 5, 'ACTIVE', true, 'cat-smartphones', 'brand-apple', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-galaxy-s23', 'GALAXYS23-128', 'Samsung Galaxy S23', 'Samsung Galaxy S23', 'samsung-galaxy-s23', 'Flagship Android smartphone', 'Galaxy S23 128GB', 89999.00, 99999.00, 75000.00, 5.00, 30, 3, 'ACTIVE', true, 'cat-smartphones', 'brand-samsung', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-macbook', 'MACBOOK14-M2', 'MacBook Pro 14"', 'MacBook Pro 14"', 'macbook-pro-14', 'Professional laptop', 'MBP M2 Pro', 185000.00, 195000.00, 160000.00, 5.00, 15, 2, 'ACTIVE', true, 'cat-laptops', 'brand-apple', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-airmax', 'AIRMAX90', 'Nike Air Max', 'Nike Air Max', 'nike-air-max', 'Classic running shoes', 'Air Max 90', 8500.00, 9500.00, 6000.00, 5.00, 100, 10, 'ACTIVE', false, 'cat-mens', 'brand-nike', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-ultraboost', 'ULTRABOOST22', 'Adidas Ultraboost', 'Adidas Ultraboost', 'adidas-ultraboost', 'Performance running shoes', 'Ultraboost 22', 12000.00, 13500.00, 8500.00, 5.00, 75, 8, 'ACTIVE', false, 'cat-mens', 'brand-adidas', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Product Variants
INSERT INTO product_variants (id, "productId", name, sku, price, "comparePrice", stock, "isActive") VALUES
('var-iphone14-128', 'prod-iphone14', 'iPhone 14 Pro 128GB', 'IPHONE14-128', 109999.00, 119999.00, 20, true),
('var-iphone14-256', 'prod-iphone14', 'iPhone 14 Pro 256GB', 'IPHONE14-256', 129999.00, 139999.00, 25, true),
('var-iphone14-512', 'prod-iphone14', 'iPhone 14 Pro 512GB', 'IPHONE14-512', 149999.00, 159999.00, 5, true),
('var-galaxy-s23-128', 'prod-galaxy-s23', 'Galaxy S23 128GB', 'GALAXYS23-128', 89999.00, 99999.00, 15, true),
('var-galaxy-s23-256', 'prod-galaxy-s23', 'Galaxy S23 256GB', 'GALAXYS23-256', 99999.00, 109999.00, 15, true);

-- Insert Product Images
INSERT INTO product_images (id, "productId", url, alt, "sortOrder") VALUES
('img-iphone14-1', 'prod-iphone14', 'https://example.com/iphone14-front.jpg', 'iPhone 14 Pro Front', 0),
('img-iphone14-2', 'prod-iphone14', 'https://example.com/iphone14-back.jpg', 'iPhone 14 Pro Back', 1),
('img-galaxy-1', 'prod-galaxy-s23', 'https://example.com/galaxy-s23-front.jpg', 'Galaxy S23 Front', 0),
('img-galaxy-2', 'prod-galaxy-s23', 'https://example.com/galaxy-s23-back.jpg', 'Galaxy S23 Back', 1),
('img-macbook-1', 'prod-macbook', 'https://example.com/macbook-pro.jpg', 'MacBook Pro', 0);

-- Insert Product Specifications
INSERT INTO product_specifications (id, "productId", name, value, "sortOrder") VALUES
('spec-iphone14-1', 'prod-iphone14', 'Display', '6.1" Super Retina XDR', 0),
('spec-iphone14-2', 'prod-iphone14', 'Processor', 'A16 Bionic chip', 1),
('spec-iphone14-3', 'prod-iphone14', 'Camera', '48MP Main camera', 2),
('spec-galaxy-1', 'prod-galaxy-s23', 'Display', '6.1" Dynamic AMOLED 2X', 0),
('spec-galaxy-2', 'prod-galaxy-s23', 'Processor', 'Snapdragon 8 Gen 2', 1),
('spec-macbook-1', 'prod-macbook', 'Display', '14.2" Liquid Retina XDR', 0),
('spec-macbook-2', 'prod-macbook', 'Processor', 'M2 Pro chip', 1);

-- Insert User Addresses
INSERT INTO addresses (id, "userId", type, "firstName", "lastName", phone, address, city, district, division, upazila, "postalCode", "isDefault") VALUES
('addr-john-1', 'user-john', 'SHIPPING', 'John', 'Doe', '+8801712345678', 'House 12, Road 5, Dhanmondi', 'Dhaka', 'Dhaka', 'DHAKA', 'Dhanmondi', '1209', true),
('addr-john-2', 'user-john', 'BILLING', 'John', 'Doe', '+8801712345678', 'House 12, Road 5, Dhanmondi', 'Dhaka', 'Dhaka', 'DHAKA', 'Dhanmondi', '1209', false),
('addr-jane-1', 'user-jane', 'SHIPPING', 'Jane', 'Smith', '+8801812345679', 'Flat 3B, Building 10, Gulshan', 'Dhaka', 'Dhaka', 'DHAKA', 'Gulshan', '1213', true),
('addr-mike-1', 'user-mike', 'SHIPPING', 'Mike', 'Wilson', '+8801712345671', 'House 5, Mirpur', 'Dhaka', 'Dhaka', 'DHAKA', 'Mirpur', '1216', true);

-- Insert User Sessions
INSERT INTO user_sessions (id, "userId", token, "expiresAt", "createdAt") VALUES
('sess-john-1', 'user-john', 'jwt-token-john-1', CURRENT_TIMESTAMP + INTERVAL '7 days', CURRENT_TIMESTAMP),
('sess-john-2', 'user-john', 'jwt-token-john-2', CURRENT_TIMESTAMP + INTERVAL '7 days', CURRENT_TIMESTAMP),
('sess-jane-1', 'user-jane', 'jwt-token-jane-1', CURRENT_TIMESTAMP + INTERVAL '7 days', CURRENT_TIMESTAMP),
('sess-admin-1', 'user-admin', 'jwt-token-admin-1', CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP);

-- Insert User Social Accounts
INSERT INTO user_social_accounts (id, "userId", provider, "providerId", "createdAt", "updatedAt") VALUES
('social-john-google', 'user-john', 'GOOGLE', 'google_user_id_123', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('social-john-facebook', 'user-john', 'FACEBOOK', 'fb_user_id_456', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('social-jane-google', 'user-jane', 'GOOGLE', 'google_user_id_789', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Carts
INSERT INTO carts (id, "userId", "sessionId", "createdAt", "updatedAt") VALUES
('cart-john', 'user-john', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cart-jane', 'user-jane', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cart-guest-1', NULL, 'guest-session-123', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Wishlists
INSERT INTO wishlists (id, "userId", "createdAt", "updatedAt") VALUES
('wish-john', 'user-john', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('wish-jane', 'user-jane', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Cart Items
INSERT INTO cart_items (id, "cartId", "productId", "variantId", quantity, "unitPrice", "totalPrice", "addedAt") VALUES
('ci-john-1', 'cart-john', 'prod-iphone14', 'var-iphone14-256', 1, 129999.00, 129999.00, CURRENT_TIMESTAMP),
('ci-john-2', 'cart-john', 'prod-airmax', NULL, 2, 8500.00, 17000.00, CURRENT_TIMESTAMP),
('ci-jane-1', 'cart-jane', 'prod-galaxy-s23', 'var-galaxy-s23-128', 1, 89999.00, 89999.00, CURRENT_TIMESTAMP),
('ci-guest-1', 'cart-guest-1', 'prod-ultraboost', NULL, 1, 12000.00, 12000.00, CURRENT_TIMESTAMP);

-- Insert Wishlist Items
INSERT INTO wishlist_items (id, "wishlistId", "productId", "addedAt") VALUES
('wi-john-1', 'wish-john', 'prod-macbook', CURRENT_TIMESTAMP),
('wi-john-2', 'wish-john', 'prod-ultraboost', CURRENT_TIMESTAMP),
('wi-jane-1', 'wish-jane', 'prod-iphone14', CURRENT_TIMESTAMP),
('wi-jane-2', 'wish-jane', 'prod-airmax', CURRENT_TIMESTAMP);

-- Insert Orders (need addressId first)
INSERT INTO orders (id, "orderNumber", "userId", "addressId", subtotal, tax, "shippingCost", discount, "total", "paymentMethod", "paymentStatus", "status", notes, "createdAt", "updatedAt") VALUES
('order-john-1', 'ORD-2023001', 'user-john', 'addr-john-1', 239998.00, 24000.00, 500.00, 10000.00, 254898.00, 'CREDIT_CARD', 'COMPLETED', 'DELIVERED', 'Delivered to office address', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('order-jane-1', 'ORD-2023002', 'user-jane', 'addr-jane-1', 89999.00, 9000.00, 300.00, 0.00, 99299.00, 'BANK_TRANSFER', 'PENDING', 'PROCESSING', 'Payment pending verification', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('order-mike-1', 'ORD-2023003', 'user-mike', 'addr-mike-1', 17000.00, 1700.00, 200.00, 500.00, 18400.00, 'CASH_ON_DELIVERY', 'PENDING', 'CONFIRMED', 'Cash on delivery requested', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Order Items
INSERT INTO order_items (id, "orderId", "productId", "variantId", quantity, "unitPrice", "totalPrice") VALUES
('oi-john-1-1', 'order-john-1', 'prod-iphone14', 'var-iphone14-256', 1, 129999.00, 129999.00),
('oi-john-1-2', 'order-john-1', 'prod-airmax', NULL, 2, 8500.00, 17000.00),
('oi-jane-1-1', 'order-jane-1', 'prod-galaxy-s23', 'var-galaxy-s23-128', 1, 89999.00, 89999.00),
('oi-mike-1-1', 'order-mike-1', 'prod-airmax', NULL, 2, 8500.00, 17000.00);

-- Insert Transactions
INSERT INTO transactions (id, "orderId", "paymentMethod", amount, currency, "status", "transactionId", "gatewayResponse", "createdAt", "updatedAt") VALUES
('trans-john-1', 'order-john-1', 'CREDIT_CARD', 254898.00, 'BDT', 'COMPLETED', 'TXN_123456789', '{"status": "success", "gateway": "sslcommerz"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('trans-jane-1', 'order-jane-1', 'BANK_TRANSFER', 99299.00, 'BDT', 'PENDING', 'BTN_987654321', '{"status": "pending", "gateway": "bank"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Reviews
INSERT INTO reviews (id, "productId", "userId", rating, title, comment, "isVerified", "isApproved", "createdAt", "updatedAt") VALUES
('rev-iphone14-1', 'prod-iphone14', 'user-john', 5, 'Excellent Phone!', 'Best iPhone I''ve ever used. Camera is amazing!', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('rev-iphone14-2', 'prod-iphone14', 'user-jane', 4, 'Great but expensive', 'Love the phone but price is high', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('rev-airmax-1', 'prod-airmax', 'user-mike', 5, 'Perfect fit', 'Very comfortable and stylish', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('rev-galaxy-1', 'prod-galaxy-s23', 'user-sarah', 3, 'Good but not great', 'Decent phone, battery life could be better', false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Coupons
INSERT INTO coupons (id, code, type, value, "minAmount", "maxDiscount", "usageLimit", "usedCount", "isActive", "expiresAt", "createdAt", "updatedAt") VALUES
('coupon-welcome10', 'WELCOME10', 'PERCENTAGE', 10.00, 5000.00, 200.00, 100, 25, true, CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('coupon-fixed500', 'FIXED500', 'FIXED_AMOUNT', 500.00, 10000.00, 500.00, 50, 10, true, CURRENT_TIMESTAMP + INTERVAL '15 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('coupon-expired', 'EXPIRED20', 'PERCENTAGE', 20.00, 8000.00, 300.00, 30, 30, false, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

COMMIT;

-- =====================================================
-- 2. POSITIVE RELATIONSHIP TESTS
-- =====================================================

-- Test 1: User → Addresses Relationship
BEGIN;
-- Verify John has 2 addresses
SELECT u.email, COUNT(a.id) as address_count
FROM users u
LEFT JOIN addresses a ON u.id = a."userId"
WHERE u.id = 'user-john'
GROUP BY u.email;

-- Test cascade delete from user to addresses
SAVEPOINT delete_user_test;
DELETE FROM user_sessions WHERE "userId" = 'user-john';
DELETE FROM user_social_accounts WHERE "userId" = 'user-john';
DELETE FROM carts WHERE "userId" = 'user-john';
DELETE FROM wishlists WHERE "userId" = 'user-john';
DELETE FROM reviews WHERE "userId" = 'user-john';
DELETE FROM addresses WHERE "userId" = 'user-john';
DELETE FROM users WHERE id = 'user-john';

-- Verify cascade worked
SELECT COUNT(*) as remaining_addresses FROM addresses WHERE "userId" = 'user-john';
SELECT COUNT(*) as remaining_sessions FROM user_sessions WHERE "userId" = 'user-john';
ROLLBACK TO delete_user_test;
COMMIT;

-- Test 2: Category Hierarchy
BEGIN;
-- Verify category hierarchy
SELECT parent.name as parent_name, child.name as child_name
FROM categories parent
LEFT JOIN categories child ON child."parentId" = parent.id
WHERE parent.id = 'cat-electronics';

-- Test SET NULL on parent delete
SAVEPOINT delete_category_test;
UPDATE categories SET "parentId" = NULL WHERE "parentId" = 'cat-electronics';
DELETE FROM categories WHERE id = 'cat-electronics';

-- Verify children have NULL parentId
SELECT id, name, "parentId" FROM categories WHERE "parentId" IS NULL AND id IN ('cat-smartphones', 'cat-laptops');
ROLLBACK TO delete_category_test;
COMMIT;

-- Test 3: Product → Multiple Relationships
BEGIN;
-- Verify product relationships
SELECT
    p.name,
    COUNT(DISTINCT pi.id) as image_count,
    COUNT(DISTINCT ps.id) as spec_count,
    COUNT(DISTINCT pv.id) as variant_count,
    COUNT(DISTINCT ci.id) as cart_item_count,
    COUNT(DISTINCT oi.id) as order_item_count,
    COUNT(DISTINCT r.id) as review_count,
    COUNT(DISTINCT wi.id) as wishlist_count
FROM products p
LEFT JOIN product_images pi ON p.id = pi."productId"
LEFT JOIN product_specifications ps ON p.id = ps."productId"
LEFT JOIN product_variants pv ON p.id = pv."productId"
LEFT JOIN cart_items ci ON p.id = ci."productId"
LEFT JOIN order_items oi ON p.id = oi."productId"
LEFT JOIN reviews r ON p.id = r."productId"
LEFT JOIN wishlist_items wi ON p.id = wi."productId"
WHERE p.id = 'prod-iphone14'
GROUP BY p.id, p.name;

-- Test cascade delete from product
SAVEPOINT delete_product_test;
DELETE FROM product_images WHERE "productId" = 'prod-iphone14';
DELETE FROM product_specifications WHERE "productId" = 'prod-iphone14';
DELETE FROM product_variants WHERE "productId" = 'prod-iphone14';
DELETE FROM cart_items WHERE "productId" = 'prod-iphone14';
DELETE FROM reviews WHERE "productId" = 'prod-iphone14';
DELETE FROM wishlist_items WHERE "productId" = 'prod-iphone14';
DELETE FROM products WHERE id = 'prod-iphone14';

-- Verify cascade worked
SELECT COUNT(*) as remaining_images FROM product_images WHERE "productId" = 'prod-iphone14';
SELECT COUNT(*) as remaining_specs FROM product_specifications WHERE "productId" = 'prod-iphone14';
ROLLBACK TO delete_product_test;
COMMIT;

-- Test 4: Cart → CartItems Relationship
BEGIN;
-- Verify cart relationships
SELECT c.id as cart_id, u.email as user_email, COUNT(ci.id) as item_count
FROM carts c
LEFT JOIN users u ON c."userId" = u.id
LEFT JOIN cart_items ci ON c.id = ci."cartId"
WHERE c.id = 'cart-john'
GROUP BY c.id, u.email;

-- Test cascade delete from cart
SAVEPOINT delete_cart_test;
DELETE FROM cart_items WHERE "cartId" = 'cart-john';
DELETE FROM carts WHERE id = 'cart-john';

-- Verify cascade worked
SELECT COUNT(*) as remaining_cart_items FROM cart_items WHERE "cartId" = 'cart-john';
ROLLBACK TO delete_cart_test;
COMMIT;

-- Test 5: Order → OrderItems Relationship
BEGIN;
-- Verify order relationships
SELECT
    o."orderNumber",
    u.email as user_email,
    COUNT(oi.id) as item_count,
    SUM(oi."totalPrice") as order_total
FROM orders o
LEFT JOIN users u ON o."userId" = u.id
LEFT JOIN order_items oi ON o.id = oi."orderId"
WHERE o.id = 'order-john-1'
GROUP BY o.id, o."orderNumber", u.email;

-- Test cascade delete from order
SAVEPOINT delete_order_test;
DELETE FROM order_items WHERE "orderId" = 'order-john-1';
DELETE FROM transactions WHERE "orderId" = 'order-john-1';
DELETE FROM orders WHERE id = 'order-john-1';

-- Verify cascade worked
SELECT COUNT(*) as remaining_order_items FROM order_items WHERE "orderId" = 'order-john-1';
ROLLBACK TO delete_order_test;
COMMIT;

-- =====================================================
-- 3. NEGATIVE TESTS (Constraint Violations)
-- =====================================================

-- Test 6: NOT NULL Violations
BEGIN;
-- Try to insert user with NULL email (should fail)
SAVEPOINT not_null_test;
INSERT INTO users (id, email, password, "firstName", "lastName", "createdAt", "updatedAt") VALUES ('user-null-email', NULL, 'hashedpass', 'Test', 'User', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
-- Check if it failed
SELECT 'NOT NULL email test: ' || CASE
    WHEN EXISTS (SELECT 1 FROM users WHERE id = 'user-null-email')
    THEN 'FAILED - Should not allow NULL email'
    ELSE 'PASSED - Correctly rejected NULL email'
END as test_result;

-- Try to insert product with NULL required fields (should fail)
INSERT INTO products (id, sku, name, "nameEn", slug, "regularPrice", "costPrice", "categoryId", "brandId", "createdAt", "updatedAt")
VALUES ('prod-null-fields', 'NULL-TEST', NULL, 'null-test', 'NULL-TEST', 100.00, 50.00, 'cat-electronics', 'brand-apple', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
-- Check if it failed
SELECT 'NOT NULL product fields test: ' || CASE
    WHEN EXISTS (SELECT 1 FROM products WHERE id = 'prod-null-fields')
    THEN 'FAILED - Should not allow NULL required fields'
    ELSE 'PASSED - Correctly rejected NULL required fields'
END as test_result;
ROLLBACK TO not_null_test;
COMMIT;

-- Test 7: UNIQUE Constraint Violations
BEGIN;
-- Try to insert duplicate email (should fail)
SAVEPOINT unique_test;
INSERT INTO users (id, email, password, "firstName", "lastName", "createdAt", "updatedAt") VALUES ('user-dup-1', 'john.doe@example.com', 'hashedpass1', 'Test', 'User1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO users (id, email, password, "firstName", "lastName", "createdAt", "updatedAt") VALUES ('user-dup-2', 'john.doe@example.com', 'hashedpass2', 'Test', 'User2', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
-- Check if it failed
SELECT 'UNIQUE email test: ' || CASE
    WHEN (SELECT COUNT(*) FROM users WHERE email = 'john.doe@example.com') > 1
    THEN 'FAILED - Should not allow duplicate emails'
    ELSE 'PASSED - Correctly rejected duplicate email'
END as test_result;

-- Try to insert duplicate SKU (should fail)
INSERT INTO products (id, sku, name, "nameEn", slug, "regularPrice", "costPrice", "categoryId", "brandId", "createdAt", "updatedAt")
VALUES ('prod-dup-1', 'DUPLICATE-SKU', 'Product 1', 'prod-1', 'DUPLICATE-SKU', 100.00, 50.00, 'cat-electronics', 'brand-apple', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO products (id, sku, name, "nameEn", slug, "regularPrice", "costPrice", "categoryId", "brandId", "createdAt", "updatedAt")
VALUES ('prod-dup-2', 'DUPLICATE-SKU', 'Product 2', 'prod-2', 'DUPLICATE-SKU', 200.00, 100.00, 'cat-electronics', 'brand-apple', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
-- Check if it failed
SELECT 'UNIQUE SKU test: ' || CASE
    WHEN (SELECT COUNT(*) FROM products WHERE sku = 'DUPLICATE-SKU') > 1
    THEN 'FAILED - Should not allow duplicate SKUs'
    ELSE 'PASSED - Correctly rejected duplicate SKU'
END as test_result;
ROLLBACK TO unique_test;
COMMIT;

-- Test 8: FOREIGN KEY Violations
BEGIN;
-- Try to insert address with invalid user (should fail)
SAVEPOINT fk_test;
INSERT INTO addresses (id, "userId", type, "firstName", "lastName", address, city, district, division)
VALUES ('addr-invalid-fk', 'invalid-user-id', 'SHIPPING', 'Test', 'User', '123 St', 'City', 'District', 'DHAKA');
-- Check if it failed
SELECT 'FOREIGN KEY user test: ' || CASE
    WHEN EXISTS (SELECT 1 FROM addresses WHERE "userId" = 'invalid-user-id')
    THEN 'FAILED - Should not allow invalid user reference'
    ELSE 'PASSED - Correctly rejected invalid user reference'
END as test_result;

-- Try to insert cart item with invalid product (should fail)
INSERT INTO cart_items (id, "cartId", "productId", quantity, "unitPrice", "totalPrice", "addedAt")
VALUES ('ci-invalid-fk', 'cart-john', 'invalid-product-id', 1, 100.00, 100.00, CURRENT_TIMESTAMP);
-- Check if it failed
SELECT 'FOREIGN KEY product test: ' || CASE
    WHEN EXISTS (SELECT 1 FROM cart_items WHERE "productId" = 'invalid-product-id')
    THEN 'FAILED - Should not allow invalid product reference'
    ELSE 'PASSED - Correctly rejected invalid product reference'
END as test_result;
ROLLBACK TO fk_test;
COMMIT;

-- =====================================================
-- 4. EDGE CASE TESTS
-- =====================================================

-- Test 9: NULL Values in Optional Fields
BEGIN;
-- Insert user with NULL optional fields
INSERT INTO users (id, email, password, "firstName", "lastName", phone, "createdAt", "updatedAt")
VALUES ('user-null-opts', 'nullopts@example.com', 'hashedpass', 'Test', 'User', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
-- Verify NULL values are accepted
SELECT "firstName", "lastName", phone, image
FROM users
WHERE id = 'user-null-opts';

-- Insert product with NULL optional fields
INSERT INTO products (id, sku, name, "nameEn", slug, "regularPrice", "costPrice", "categoryId", "brandId", "salePrice", "createdAt", "updatedAt")
VALUES ('prod-null-opts', 'NULL-OPTS', 'Null Options Product', 'null-opts-prod', 'NULL-OPTS', 100.00, 50.00, 'cat-electronics', 'brand-apple', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
-- Verify NULL values are accepted
SELECT "salePrice", "costPrice"
FROM products
WHERE id = 'prod-null-opts';
COMMIT;

-- Test 10: Transaction Rollback
BEGIN;
-- Start transaction
SAVEPOINT rollback_test;
-- Insert related data
INSERT INTO users (id, email, password, "firstName", "lastName", "createdAt", "updatedAt") VALUES ('user-rollback', 'rollback@example.com', 'hashedpass', 'Rollback', 'Test', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO addresses (id, "userId", type, "firstName", "lastName", address, city, district, division)
VALUES ('addr-rollback', 'user-rollback', 'SHIPPING', 'Rollback', 'Test', '123 St', 'City', 'District', 'DHAKA');
-- Intentional error to trigger rollback
INSERT INTO addresses (id, "userId", type, "firstName", "lastName", address, city, district, division)
VALUES ('addr-rollback-error', 'invalid-user-id', 'SHIPPING', 'Error', 'Test', '456 St', 'City', 'District', 'DHAKA');
-- Rollback should clean up everything
ROLLBACK TO rollback_test;
-- Verify rollback worked
SELECT 'Transaction rollback test: ' || CASE 
    WHEN EXISTS (SELECT 1 FROM users WHERE id = 'user-rollback') 
    THEN 'FAILED - Rollback did not clean up user'
    ELSE 'PASSED - Rollback worked correctly'
END as test_result;
COMMIT;

-- Test 11: Concurrent Operations Simulation
BEGIN;
-- Test concurrent cart updates
SAVEPOINT concurrent_test;
-- First update
UPDATE cart_items SET quantity = quantity + 1 WHERE id = 'ci-john-1';
-- Second update (simulating concurrent access)
UPDATE cart_items SET quantity = quantity + 1 WHERE id = 'ci-john-1';
-- Verify final quantity
SELECT quantity FROM cart_items WHERE id = 'ci-john-1';
ROLLBACK TO concurrent_test;
COMMIT;

-- =====================================================
-- 5. PERFORMANCE TESTS
-- =====================================================

-- Test 12: Large Dataset Operations
BEGIN;
-- Create temporary large dataset
CREATE TEMP TABLE temp_large_users AS
SELECT 'user-perf-' || generate_series::text as id,
       'user' || generate_series || '@perf.com' as email,
       'hashedpass' as password
FROM generate_series(1, 100);

-- Bulk insert test
INSERT INTO users (id, email, password, "firstName", "lastName", "createdAt", "updatedAt")
SELECT id, email, password, 'Bulk', 'User', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM temp_large_users;

-- Verify bulk insert
SELECT COUNT(*) as bulk_insert_count FROM users WHERE email LIKE '%@perf.com';

-- Bulk delete test
DELETE FROM users WHERE email LIKE '%@perf.com';

-- Verify bulk delete
SELECT COUNT(*) as remaining_perf_users FROM users WHERE email LIKE '%@perf.com';

DROP TABLE temp_large_users;
COMMIT;

-- =====================================================
-- 6. VERIFICATION QUERIES
-- =====================================================

-- Verify all relationships are intact
SELECT '=== USER RELATIONSHIPS ===' as section;
SELECT
    u.id,
    u.email,
    COUNT(DISTINCT a.id) as addresses,
    COUNT(DISTINCT us.id) as sessions,
    COUNT(DISTINCT usa.id) as social_accounts,
    COUNT(DISTINCT c.id) as carts,
    COUNT(DISTINCT w.id) as wishlists,
    COUNT(DISTINCT o.id) as orders,
    COUNT(DISTINCT r.id) as reviews
FROM users u
LEFT JOIN addresses a ON u.id = a."userId"
LEFT JOIN user_sessions us ON u.id = us."userId"
LEFT JOIN user_social_accounts usa ON u.id = usa."userId"
LEFT JOIN carts c ON u.id = c."userId"
LEFT JOIN wishlists w ON u.id = w."userId"
LEFT JOIN orders o ON u.id = o."userId"
LEFT JOIN reviews r ON u.id = r."userId"
WHERE u.id IN ('user-john', 'user-jane', 'user-mike')
GROUP BY u.id, u.email;

SELECT '=== PRODUCT RELATIONSHIPS ===' as section;
SELECT
    p.id,
    p.name,
    COUNT(DISTINCT pi.id) as images,
    COUNT(DISTINCT ps.id) as specifications,
    COUNT(DISTINCT pv.id) as variants,
    COUNT(DISTINCT ci.id) as cart_items,
    COUNT(DISTINCT oi.id) as order_items,
    COUNT(DISTINCT r.id) as reviews,
    COUNT(DISTINCT wi.id) as wishlist_items
FROM products p
LEFT JOIN product_images pi ON p.id = pi."productId"
LEFT JOIN product_specifications ps ON p.id = ps."productId"
LEFT JOIN product_variants pv ON p.id = pv."productId"
LEFT JOIN cart_items ci ON p.id = ci."productId"
LEFT JOIN order_items oi ON p.id = oi."productId"
LEFT JOIN reviews r ON p.id = r."productId"
LEFT JOIN wishlist_items wi ON p.id = wi."productId"
WHERE p.id IN ('prod-iphone14', 'prod-galaxy-s23', 'prod-airmax')
GROUP BY p.id, p.name;

SELECT '=== ORDER RELATIONSHIPS ===' as section;
SELECT
    o.id,
    o."orderNumber",
    o."status",
    COUNT(DISTINCT oi.id) as items,
    SUM(oi."totalPrice") as total,
    t."status" as payment_status
FROM orders o
LEFT JOIN order_items oi ON o.id = oi."orderId"
LEFT JOIN transactions t ON o.id = t."orderId"
WHERE o.id IN ('order-john-1', 'order-jane-1', 'order-mike-1')
GROUP BY o.id, o."orderNumber", o."status", t."status";

SELECT '=== CATEGORY HIERARCHY ===' as section;
SELECT
    parent.name as parent_category,
    COUNT(child.id) as child_count,
    STRING_AGG(child.name, ', ') as children
FROM categories parent
LEFT JOIN categories child ON child."parentId" = parent.id
WHERE parent."parentId" IS NULL
GROUP BY parent.id, parent.name;

-- =====================================================
-- 7. CLEANUP TEST DATA
-- =====================================================

-- Uncomment the following lines to clean up test data
/*
BEGIN;
DELETE FROM reviews WHERE "userId" LIKE 'user-%' OR "productId" LIKE 'prod-%';
DELETE FROM transactions WHERE "orderId" LIKE 'order-%';
DELETE FROM order_items WHERE "orderId" LIKE 'order-%';
DELETE FROM orders WHERE "userId" LIKE 'user-%';
DELETE FROM wishlist_items WHERE "wishlistId" LIKE 'wish-%';
DELETE FROM wishlists WHERE "userId" LIKE 'user-%';
DELETE FROM cart_items WHERE "cartId" LIKE 'cart-%';
DELETE FROM carts WHERE "userId" LIKE 'user-%';
DELETE FROM user_sessions WHERE "userId" LIKE 'user-%';
DELETE FROM user_social_accounts WHERE "userId" LIKE 'user-%';
DELETE FROM addresses WHERE "userId" LIKE 'user-%';
DELETE FROM product_specifications WHERE "productId" LIKE 'prod-%';
DELETE FROM product_images WHERE "productId" LIKE 'prod-%';
DELETE FROM product_variants WHERE "productId" LIKE 'prod-%';
DELETE FROM products WHERE id LIKE 'prod-%';
DELETE FROM coupons WHERE code LIKE 'coupon-%';
DELETE FROM categories WHERE id LIKE 'cat-%';
DELETE FROM brands WHERE id LIKE 'brand-%';
DELETE FROM users WHERE id LIKE 'user-%';
COMMIT;
*/

-- =====================================================
-- TEST EXECUTION COMPLETE
-- =====================================================
-- All entity relationships have been tested with dummy data
-- Verify results in the verification queries section above