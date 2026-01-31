-- Data Integrity Check Script
-- This script checks for orphaned records and data integrity issues

-- Check for products with missing brand
SELECT 'products with missing brand' as check_type, COUNT(*) as count 
FROM products 
WHERE "brandId" NOT IN (SELECT id FROM brands);

-- Check for product_categories with missing product
SELECT 'product_categories with missing product' as check_type, COUNT(*) as count 
FROM product_categories 
WHERE "productId" NOT IN (SELECT id FROM products);

-- Check for product_categories with missing category
SELECT 'product_categories with missing category' as check_type, COUNT(*) as count 
FROM product_categories 
WHERE "categoryId" NOT IN (SELECT id FROM categories);

-- Check for orders with missing user
SELECT 'orders with missing user' as check_type, COUNT(*) as count 
FROM orders 
WHERE "userId" NOT IN (SELECT id FROM users);

-- Check for orders with missing address
SELECT 'orders with missing address' as check_type, COUNT(*) as count 
FROM orders 
WHERE "addressId" NOT IN (SELECT id FROM addresses);

-- Check for order_items with missing order
SELECT 'order_items with missing order' as check_type, COUNT(*) as count 
FROM order_items 
WHERE "orderId" NOT IN (SELECT id FROM orders);

-- Check for order_items with missing product
SELECT 'order_items with missing product' as check_type, COUNT(*) as count 
FROM order_items 
WHERE "productId" NOT IN (SELECT id FROM products);

-- Check for reviews with missing user
SELECT 'reviews with missing user' as check_type, COUNT(*) as count 
FROM reviews 
WHERE "userId" NOT IN (SELECT id FROM users);

-- Check for reviews with missing product
SELECT 'reviews with missing product' as check_type, COUNT(*) as count 
FROM reviews 
WHERE "productId" NOT IN (SELECT id FROM products);

-- Check for cart_items with missing cart
SELECT 'cart_items with missing cart' as check_type, COUNT(*) as count 
FROM cart_items 
WHERE "cartId" NOT IN (SELECT id FROM carts);

-- Check for cart_items with missing product
SELECT 'cart_items with missing product' as check_type, COUNT(*) as count 
FROM cart_items 
WHERE "productId" NOT IN (SELECT id FROM products);

-- Check for addresses with missing user
SELECT 'addresses with missing user' as check_type, COUNT(*) as count 
FROM addresses 
WHERE "userId" NOT IN (SELECT id FROM users);

-- Check for product_images with missing product
SELECT 'product_images with missing product' as check_type, COUNT(*) as count 
FROM product_images 
WHERE "product_id" NOT IN (SELECT id FROM products);

-- Check for product_variants with missing product
SELECT 'product_variants with missing product' as check_type, COUNT(*) as count 
FROM product_variants 
WHERE "productId" NOT IN (SELECT id FROM products);

-- Check for variant_types with missing product
SELECT 'variant_types with missing product' as check_type, COUNT(*) as count 
FROM variant_types 
WHERE "productId" NOT IN (SELECT id FROM products);

-- Check for variant_values with missing variant_type
SELECT 'variant_values with missing variant_type' as check_type, COUNT(*) as count 
FROM variant_values 
WHERE "variantTypeId" NOT IN (SELECT id FROM variant_types);

-- Check for cross_sell_products with missing product
SELECT 'cross_sell_products with missing source product' as check_type, COUNT(*) as count 
FROM cross_sell_products 
WHERE "productId" NOT IN (SELECT id FROM products);

-- Check for cross_sell_products with missing related product
SELECT 'cross_sell_products with missing related product' as check_type, COUNT(*) as count 
FROM cross_sell_products 
WHERE "relatedProductId" NOT IN (SELECT id FROM products);

-- Check for up_sell_products with missing product
SELECT 'up_sell_products with missing source product' as check_type, COUNT(*) as count 
FROM up_sell_products 
WHERE "productId" NOT IN (SELECT id FROM products);

-- Check for up_sell_products with missing related product
SELECT 'up_sell_products with missing related product' as check_type, COUNT(*) as count 
FROM up_sell_products 
WHERE "relatedProductId" NOT IN (SELECT id FROM products);

-- Check for related_products with missing product
SELECT 'related_products with missing source product' as check_type, COUNT(*) as count 
FROM related_products 
WHERE "productId" NOT IN (SELECT id FROM products);

-- Check for related_products with missing related product
SELECT 'related_products with missing related product' as check_type, COUNT(*) as count 
FROM related_products 
WHERE "relatedProductId" NOT IN (SELECT id FROM products);

-- Check for corporate_accounts with missing user
SELECT 'corporate_accounts with missing user' as check_type, COUNT(*) as count 
FROM corporate_accounts 
WHERE "user_id" NOT IN (SELECT id FROM users);

-- Check for corporate_accounts with missing account manager
SELECT 'corporate_accounts with missing account manager' as check_type, COUNT(*) as count 
FROM corporate_accounts 
WHERE "account_manager_id" IS NOT NULL 
  AND "account_manager_id" NOT IN (SELECT id FROM users);

-- Check for corporate_users with missing corporate_account
SELECT 'corporate_users with missing corporate_account' as check_type, COUNT(*) as count 
FROM corporate_users 
WHERE "corporate_account_id" NOT IN (SELECT id FROM corporate_accounts);

-- Check for corporate_users with missing user
SELECT 'corporate_users with missing user' as check_type, COUNT(*) as count 
FROM corporate_users 
WHERE "user_id" NOT IN (SELECT id FROM users);

-- Check for corporate_documents with missing corporate_account
SELECT 'corporate_documents with missing corporate_account' as check_type, COUNT(*) as count 
FROM corporate_documents 
WHERE "corporate_account_id" NOT IN (SELECT id FROM corporate_accounts);

-- Check for corporate_approvals with missing corporate_account
SELECT 'corporate_approvals with missing corporate_account' as check_type, COUNT(*) as count 
FROM corporate_approvals 
WHERE "corporate_account_id" NOT IN (SELECT id FROM corporate_accounts);

-- Check for corporate_pricing with missing corporate_account
SELECT 'corporate_pricing with missing corporate_account' as check_type, COUNT(*) as count 
FROM corporate_pricing 
WHERE "corporate_account_id" NOT IN (SELECT id FROM corporate_accounts);

-- Check for corporate_pricing with missing product
SELECT 'corporate_pricing with missing product' as check_type, COUNT(*) as count 
FROM corporate_pricing 
WHERE "product_id" NOT IN (SELECT id FROM products);

-- Check for user_roles with missing user
SELECT 'user_roles with missing user' as check_type, COUNT(*) as count 
FROM user_roles 
WHERE "user_id" NOT IN (SELECT id FROM users);

-- Check for user_roles with missing role
SELECT 'user_roles with missing role' as check_type, COUNT(*) as count 
FROM user_roles 
WHERE "role_id" NOT IN (SELECT id FROM roles);

-- Check for role_permissions with missing role
SELECT 'role_permissions with missing role' as check_type, COUNT(*) as count 
FROM role_permissions 
WHERE "role_id" NOT IN (SELECT id FROM roles);

-- Check for role_permissions with missing permission
SELECT 'role_permissions with missing permission' as check_type, COUNT(*) as count 
FROM role_permissions 
WHERE "permission_id" NOT IN (SELECT id FROM permissions);

-- Check for role_escalation_requests with missing user
SELECT 'role_escalation_requests with missing user' as check_type, COUNT(*) as count 
FROM role_escalation_requests 
WHERE "user_id" NOT IN (SELECT id FROM users);

-- Check for role_escalation_requests with missing current role
SELECT 'role_escalation_requests with missing current role' as check_type, COUNT(*) as count 
FROM role_escalation_requests 
WHERE "current_role_id" IS NOT NULL 
  AND "current_role_id" NOT IN (SELECT id FROM roles);

-- Check for role_escalation_requests with missing requested role
SELECT 'role_escalation_requests with missing requested role' as check_type, COUNT(*) as count 
FROM role_escalation_requests 
WHERE "requested_role_id" NOT IN (SELECT id FROM roles);

-- Check for wishlist_items with missing wishlist
SELECT 'wishlist_items with missing wishlist' as check_type, COUNT(*) as count 
FROM wishlist_items 
WHERE "wishlistId" NOT IN (SELECT id FROM wishlists);

-- Check for wishlist_items with missing product
SELECT 'wishlist_items with missing product' as check_type, COUNT(*) as count 
FROM wishlist_items 
WHERE "productId" NOT IN (SELECT id FROM products);

-- Check for wishlists with missing user
SELECT 'wishlists with missing user' as check_type, COUNT(*) as count 
FROM wishlists 
WHERE "userId" NOT IN (SELECT id FROM users);

-- Check for transactions with missing order
SELECT 'transactions with missing order' as check_type, COUNT(*) as count 
FROM transactions 
WHERE "orderId" NOT IN (SELECT id FROM orders);

-- Check for search_logs with missing user
SELECT 'search_logs with missing user' as check_type, COUNT(*) as count 
FROM search_logs 
WHERE "userId" IS NOT NULL 
  AND "userId" NOT IN (SELECT id FROM users);

-- Check for account_deletion_requests with missing user
SELECT 'account_deletion_requests with missing user' as check_type, COUNT(*) as count 
FROM account_deletion_requests 
WHERE "userId" NOT IN (SELECT id FROM users);

-- Check for user_data_exports with missing user
SELECT 'user_data_exports with missing user' as check_type, COUNT(*) as count 
FROM user_data_exports 
WHERE "userId" NOT IN (SELECT id FROM users);

-- Check for user_notification_preferences with missing user
SELECT 'user_notification_preferences with missing user' as check_type, COUNT(*) as count 
FROM user_notification_preferences 
WHERE "userId" NOT IN (SELECT id FROM users);

-- Check for user_communication_preferences with missing user
SELECT 'user_communication_preferences with missing user' as check_type, COUNT(*) as count 
FROM user_communication_preferences 
WHERE "userId" NOT IN (SELECT id FROM users);

-- Check for user_privacy_settings with missing user
SELECT 'user_privacy_settings with missing user' as check_type, COUNT(*) as count 
FROM user_privacy_settings 
WHERE "userId" NOT IN (SELECT id FROM users);

-- Check for user_sessions with missing user
SELECT 'user_sessions with missing user' as check_type, COUNT(*) as count 
FROM user_sessions 
WHERE "userId" NOT IN (SELECT id FROM users);

-- Check for user_social_accounts with missing user
SELECT 'user_social_accounts with missing user' as check_type, COUNT(*) as count 
FROM user_social_accounts 
WHERE "userId" NOT IN (SELECT id FROM users);

-- Check for email_verification_tokens with missing user
SELECT 'email_verification_tokens with missing user' as check_type, COUNT(*) as count 
FROM email_verification_tokens 
WHERE "userId" NOT IN (SELECT id FROM users);

-- Check for password_history with missing user
SELECT 'password_history with missing user' as check_type, COUNT(*) as count 
FROM password_history 
WHERE "userId" NOT IN (SELECT id FROM users);

-- Check for phone_otps with missing user
SELECT 'phone_otps with missing user' as check_type, COUNT(*) as count 
FROM phone_otps 
WHERE "userId" IS NOT NULL 
  AND "userId" NOT IN (SELECT id FROM users);

-- Check for carts with missing user
SELECT 'carts with missing user' as check_type, COUNT(*) as count 
FROM carts 
WHERE "userId" IS NOT NULL 
  AND "userId" NOT IN (SELECT id FROM users);
