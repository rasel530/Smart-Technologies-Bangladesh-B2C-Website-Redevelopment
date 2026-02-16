-- ============================================================================
-- PHASE 1: ROOT CAUSE FIX - Convert users.id and products.id to UUID
-- ============================================================================
-- This migration converts users.id and products.id from TEXT to UUID type.
-- This is the root cause fix that must be completed before any other schema fixes.
--
-- IMPORTANT: This migration must be executed in a single transaction.
-- All tables are currently empty (0 rows), so the conversion is safe.
--
-- Date: 2026-02-14
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: DROP ALL FOREIGN KEY CONSTRAINTS REFERENCING users.id
-- ============================================================================

-- Tables with FK to users.id:
-- addresses, user_sessions, user_social_accounts, carts, wishlists, orders,
-- reviews, search_logs, account_deletion_requests, password_history,
-- email_verification_tokens, phone_otps, user_communication_preferences,
-- user_data_exports, user_notification_preferences, user_privacy_settings,
-- role_escalation_requests, user_roles, corporate_accounts (user_id),
-- corporate_accounts (account_manager_id), corporate_users

-- 1. addresses
ALTER TABLE IF EXISTS addresses DROP CONSTRAINT IF EXISTS addresses_userId_fkey;

-- 2. user_sessions
ALTER TABLE IF EXISTS user_sessions DROP CONSTRAINT IF EXISTS user_sessions_userId_fkey;

-- 3. user_social_accounts
ALTER TABLE IF EXISTS user_social_accounts DROP CONSTRAINT IF EXISTS user_social_accounts_userId_fkey;

-- 4. carts
ALTER TABLE IF EXISTS carts DROP CONSTRAINT IF EXISTS carts_userId_fkey;

-- 5. wishlists
ALTER TABLE IF EXISTS wishlists DROP CONSTRAINT IF EXISTS wishlists_userId_fkey;

-- 6. orders
ALTER TABLE IF EXISTS orders DROP CONSTRAINT IF EXISTS orders_userId_fkey;

-- 7. reviews
ALTER TABLE IF EXISTS reviews DROP CONSTRAINT IF EXISTS reviews_userId_fkey;

-- 8. search_logs
ALTER TABLE IF EXISTS search_logs DROP CONSTRAINT IF EXISTS search_logs_userId_fkey;

-- 9. account_deletion_requests
ALTER TABLE IF EXISTS account_deletion_requests DROP CONSTRAINT IF EXISTS account_deletion_requests_userId_fkey;

-- 10. password_history
ALTER TABLE IF EXISTS password_history DROP CONSTRAINT IF EXISTS password_history_userId_fkey;

-- 11. email_verification_tokens
ALTER TABLE IF EXISTS email_verification_tokens DROP CONSTRAINT IF EXISTS email_verification_tokens_userId_fkey;

-- 12. phone_otps
ALTER TABLE IF EXISTS phone_otps DROP CONSTRAINT IF EXISTS phone_otps_userId_fkey;

-- 13. user_communication_preferences
ALTER TABLE IF EXISTS user_communication_preferences DROP CONSTRAINT IF EXISTS user_communication_preferences_userId_fkey;

-- 14. user_data_exports
ALTER TABLE IF EXISTS user_data_exports DROP CONSTRAINT IF EXISTS user_data_exports_userId_fkey;

-- 15. user_notification_preferences
ALTER TABLE IF EXISTS user_notification_preferences DROP CONSTRAINT IF EXISTS user_notification_preferences_userId_fkey;

-- 16. user_privacy_settings
ALTER TABLE IF EXISTS user_privacy_settings DROP CONSTRAINT IF EXISTS user_privacy_settings_userId_fkey;

-- 17. role_escalation_requests
ALTER TABLE IF EXISTS role_escalation_requests DROP CONSTRAINT IF EXISTS fk_role_escalation_user;

-- 18. user_roles
ALTER TABLE IF EXISTS user_roles DROP CONSTRAINT IF EXISTS fk_user_roles_user;

-- 19. corporate_accounts (user_id)
ALTER TABLE IF EXISTS corporate_accounts DROP CONSTRAINT IF EXISTS fk_corporate_accounts_user;

-- 20. corporate_accounts (account_manager_id)
ALTER TABLE IF EXISTS corporate_accounts DROP CONSTRAINT IF EXISTS fk_corporate_accounts_manager;

-- 21. corporate_users
ALTER TABLE IF EXISTS corporate_users DROP CONSTRAINT IF EXISTS fk_corporate_users_user;

-- 22. search_analytics (if exists)
ALTER TABLE IF EXISTS search_analytics DROP CONSTRAINT IF EXISTS search_analytics_userId_fkey;

-- 23. search_recommendations (if exists)
ALTER TABLE IF EXISTS search_recommendations DROP CONSTRAINT IF EXISTS search_recommendations_userId_fkey;

-- 24. user_search_preferences (if exists)
ALTER TABLE IF EXISTS user_search_preferences DROP CONSTRAINT IF EXISTS user_search_preferences_userId_fkey;

-- 25. product_comparisons (if exists)
ALTER TABLE IF EXISTS product_comparisons DROP CONSTRAINT IF EXISTS product_comparisons_userId_fkey;

-- 26. comparison_history (if exists)
ALTER TABLE IF EXISTS comparison_history DROP CONSTRAINT IF EXISTS comparison_history_userId_fkey;

-- 27. wishlist_analytics (if exists)
ALTER TABLE IF EXISTS wishlist_analytics DROP CONSTRAINT IF EXISTS fk_wishlist_analytics_user;

-- ============================================================================
-- STEP 2: DROP ALL FOREIGN KEY CONSTRAINTS REFERENCING products.id
-- ============================================================================

-- Tables with FK to products.id:
-- product_images, product_specifications, product_variants, product_categories,
-- cross_sell_products (both columns), up_sell_products (both columns),
-- related_products (both columns), order_items, reviews, product_comparison_items,
-- search_recommendations, search_click_tracking, corporate_pricing, cart_items,
-- variant_types, wishlist_items

-- 1. product_images
ALTER TABLE IF EXISTS product_images DROP CONSTRAINT IF EXISTS product_images_productId_fkey;

-- 2. product_specifications
ALTER TABLE IF EXISTS product_specifications DROP CONSTRAINT IF EXISTS product_specifications_productId_fkey;

-- 3. product_variants
ALTER TABLE IF EXISTS product_variants DROP CONSTRAINT IF EXISTS product_variants_productId_fkey;

-- 4. product_categories
ALTER TABLE IF EXISTS product_categories DROP CONSTRAINT IF EXISTS product_categories_productId_fkey;

-- 5. cross_sell_products (productId)
ALTER TABLE IF EXISTS cross_sell_products DROP CONSTRAINT IF EXISTS cross_sell_products_productId_fkey;

-- 6. cross_sell_products (relatedProductId)
ALTER TABLE IF EXISTS cross_sell_products DROP CONSTRAINT IF EXISTS cross_sell_products_relatedProductId_fkey;

-- 7. up_sell_products (productId)
ALTER TABLE IF EXISTS up_sell_products DROP CONSTRAINT IF EXISTS up_sell_products_productId_fkey;

-- 8. up_sell_products (relatedProductId)
ALTER TABLE IF EXISTS up_sell_products DROP CONSTRAINT IF EXISTS up_sell_products_relatedProductId_fkey;

-- 9. related_products (productId)
ALTER TABLE IF EXISTS related_products DROP CONSTRAINT IF EXISTS related_products_productId_fkey;

-- 10. related_products (relatedProductId)
ALTER TABLE IF EXISTS related_products DROP CONSTRAINT IF EXISTS related_products_relatedProductId_fkey;

-- 11. order_items
ALTER TABLE IF EXISTS order_items DROP CONSTRAINT IF EXISTS order_items_productId_fkey;

-- 12. reviews
ALTER TABLE IF EXISTS reviews DROP CONSTRAINT IF EXISTS reviews_productId_fkey;

-- 13. product_comparison_items (if exists)
ALTER TABLE IF EXISTS product_comparison_items DROP CONSTRAINT IF EXISTS product_comparison_items_productId_fkey;

-- 14. search_recommendations (if exists)
ALTER TABLE IF EXISTS search_recommendations DROP CONSTRAINT IF EXISTS search_recommendations_productId_fkey;

-- 15. search_click_tracking (if exists)
ALTER TABLE IF EXISTS search_click_tracking DROP CONSTRAINT IF EXISTS search_click_tracking_productId_fkey;

-- 16. corporate_pricing
ALTER TABLE IF EXISTS corporate_pricing DROP CONSTRAINT IF EXISTS fk_corporate_pricing_product;

-- 17. cart_items
ALTER TABLE IF EXISTS cart_items DROP CONSTRAINT IF EXISTS cart_items_productId_fkey;

-- 18. variant_types
ALTER TABLE IF EXISTS variant_types DROP CONSTRAINT IF EXISTS variant_types_productId_fkey;

-- 19. wishlist_items
ALTER TABLE IF EXISTS wishlist_items DROP CONSTRAINT IF EXISTS wishlist_items_productId_fkey;

-- 20. search_analytics (if exists - productId column)
-- Note: search_analytics may have an optional productId column
-- ALTER TABLE IF EXISTS search_analytics DROP CONSTRAINT IF EXISTS search_analytics_productId_fkey;

-- ============================================================================
-- STEP 3: CONVERT users.id FROM TEXT TO UUID
-- ============================================================================

-- Drop the primary key constraint on users.id
ALTER TABLE users DROP CONSTRAINT users_pkey;

-- Convert the id column from TEXT to UUID
ALTER TABLE users ALTER COLUMN id TYPE UUID USING id::UUID;

-- Re-add the primary key constraint
ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (id);

-- ============================================================================
-- STEP 4: CONVERT products.id FROM TEXT TO UUID
-- ============================================================================

-- Drop the primary key constraint on products.id
ALTER TABLE products DROP CONSTRAINT products_pkey;

-- Convert the id column from TEXT to UUID
ALTER TABLE products ALTER COLUMN id TYPE UUID USING id::UUID;

-- Re-add the primary key constraint
ALTER TABLE products ADD CONSTRAINT products_pkey PRIMARY KEY (id);

-- ============================================================================
-- STEP 5: RE-ADD ALL FOREIGN KEY CONSTRAINTS REFERENCING users.id
-- ============================================================================

-- 1. addresses
ALTER TABLE IF EXISTS addresses 
    ADD CONSTRAINT addresses_userId_fkey 
    FOREIGN KEY ("userId") REFERENCES users(id) 
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- 2. user_sessions
ALTER TABLE IF EXISTS user_sessions 
    ADD CONSTRAINT user_sessions_userId_fkey 
    FOREIGN KEY ("userId") REFERENCES users(id) 
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- 3. user_social_accounts
ALTER TABLE IF EXISTS user_social_accounts 
    ADD CONSTRAINT user_social_accounts_userId_fkey 
    FOREIGN KEY ("userId") REFERENCES users(id) 
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- 4. carts
ALTER TABLE IF EXISTS carts 
    ADD CONSTRAINT carts_userId_fkey 
    FOREIGN KEY ("userId") REFERENCES users(id) 
    ON UPDATE CASCADE ON DELETE SET NULL;

-- 5. wishlists
ALTER TABLE IF EXISTS wishlists 
    ADD CONSTRAINT wishlists_userId_fkey 
    FOREIGN KEY ("userId") REFERENCES users(id) 
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- 6. orders
ALTER TABLE IF EXISTS orders 
    ADD CONSTRAINT orders_userId_fkey 
    FOREIGN KEY ("userId") REFERENCES users(id) 
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- 7. reviews
ALTER TABLE IF EXISTS reviews 
    ADD CONSTRAINT reviews_userId_fkey 
    FOREIGN KEY ("userId") REFERENCES users(id) 
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- 8. search_logs
ALTER TABLE IF EXISTS search_logs 
    ADD CONSTRAINT search_logs_userId_fkey 
    FOREIGN KEY ("userId") REFERENCES users(id) 
    ON UPDATE CASCADE ON DELETE SET NULL;

-- 9. account_deletion_requests
ALTER TABLE IF EXISTS account_deletion_requests 
    ADD CONSTRAINT account_deletion_requests_userId_fkey 
    FOREIGN KEY ("userId") REFERENCES users(id) 
    ON UPDATE CASCADE ON DELETE CASCADE;

-- 10. password_history
ALTER TABLE IF EXISTS password_history 
    ADD CONSTRAINT password_history_userId_fkey 
    FOREIGN KEY ("userId") REFERENCES users(id) 
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- 11. email_verification_tokens
ALTER TABLE IF EXISTS email_verification_tokens 
    ADD CONSTRAINT email_verification_tokens_userId_fkey 
    FOREIGN KEY ("userId") REFERENCES users(id) 
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- 12. phone_otps
ALTER TABLE IF EXISTS phone_otps 
    ADD CONSTRAINT phone_otps_userId_fkey 
    FOREIGN KEY ("userId") REFERENCES users(id) 
    ON UPDATE CASCADE ON DELETE SET NULL;

-- 13. user_communication_preferences
ALTER TABLE IF EXISTS user_communication_preferences 
    ADD CONSTRAINT user_communication_preferences_userId_fkey 
    FOREIGN KEY ("userId") REFERENCES users(id) 
    ON UPDATE CASCADE ON DELETE CASCADE;

-- 14. user_data_exports
ALTER TABLE IF EXISTS user_data_exports 
    ADD CONSTRAINT user_data_exports_userId_fkey 
    FOREIGN KEY ("userId") REFERENCES users(id) 
    ON UPDATE CASCADE ON DELETE CASCADE;

-- 15. user_notification_preferences
ALTER TABLE IF EXISTS user_notification_preferences 
    ADD CONSTRAINT user_notification_preferences_userId_fkey 
    FOREIGN KEY ("userId") REFERENCES users(id) 
    ON UPDATE CASCADE ON DELETE CASCADE;

-- 16. user_privacy_settings
ALTER TABLE IF EXISTS user_privacy_settings 
    ADD CONSTRAINT user_privacy_settings_userId_fkey 
    FOREIGN KEY ("userId") REFERENCES users(id) 
    ON UPDATE CASCADE ON DELETE CASCADE;

-- 17. role_escalation_requests
ALTER TABLE IF EXISTS role_escalation_requests 
    ADD CONSTRAINT fk_role_escalation_user 
    FOREIGN KEY (user_id) REFERENCES users(id) 
    ON DELETE CASCADE;

-- 18. user_roles
ALTER TABLE IF EXISTS user_roles 
    ADD CONSTRAINT fk_user_roles_user 
    FOREIGN KEY (user_id) REFERENCES users(id) 
    ON DELETE CASCADE;

-- 19. corporate_accounts (user_id)
ALTER TABLE IF EXISTS corporate_accounts 
    ADD CONSTRAINT fk_corporate_accounts_user 
    FOREIGN KEY (user_id) REFERENCES users(id) 
    ON DELETE CASCADE;

-- 20. corporate_accounts (account_manager_id)
ALTER TABLE IF EXISTS corporate_accounts 
    ADD CONSTRAINT fk_corporate_accounts_manager 
    FOREIGN KEY (account_manager_id) REFERENCES users(id) 
    ON DELETE SET NULL;

-- 21. corporate_users
ALTER TABLE IF EXISTS corporate_users 
    ADD CONSTRAINT fk_corporate_users_user 
    FOREIGN KEY (user_id) REFERENCES users(id) 
    ON DELETE CASCADE;

-- 22. search_analytics (if exists)
ALTER TABLE IF EXISTS search_analytics 
    ADD CONSTRAINT search_analytics_userId_fkey 
    FOREIGN KEY ("userId") REFERENCES users(id) 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 23. search_recommendations (if exists)
ALTER TABLE IF EXISTS search_recommendations 
    ADD CONSTRAINT search_recommendations_userId_fkey 
    FOREIGN KEY ("userId") REFERENCES users(id) 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 24. user_search_preferences (if exists)
ALTER TABLE IF EXISTS user_search_preferences 
    ADD CONSTRAINT user_search_preferences_userId_fkey 
    FOREIGN KEY ("userId") REFERENCES users(id) 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 25. product_comparisons (if exists)
ALTER TABLE IF EXISTS product_comparisons 
    ADD CONSTRAINT product_comparisons_userId_fkey 
    FOREIGN KEY ("userId") REFERENCES users(id) 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 26. comparison_history (if exists)
ALTER TABLE IF EXISTS comparison_history 
    ADD CONSTRAINT comparison_history_userId_fkey 
    FOREIGN KEY ("userId") REFERENCES users(id) 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 27. wishlist_analytics (if exists)
ALTER TABLE IF EXISTS wishlist_analytics 
    ADD CONSTRAINT fk_wishlist_analytics_user 
    FOREIGN KEY (user_id) REFERENCES users(id) 
    ON DELETE CASCADE;

-- ============================================================================
-- STEP 6: RE-ADD ALL FOREIGN KEY CONSTRAINTS REFERENCING products.id
-- ============================================================================

-- 1. product_images
ALTER TABLE IF EXISTS product_images 
    ADD CONSTRAINT product_images_productId_fkey 
    FOREIGN KEY (product_id) REFERENCES products(id) 
    ON UPDATE CASCADE ON DELETE CASCADE;

-- 2. product_specifications
ALTER TABLE IF EXISTS product_specifications 
    ADD CONSTRAINT product_specifications_productId_fkey 
    FOREIGN KEY ("productId") REFERENCES products(id) 
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- 3. product_variants
ALTER TABLE IF EXISTS product_variants 
    ADD CONSTRAINT product_variants_productId_fkey 
    FOREIGN KEY ("productId") REFERENCES products(id) 
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- 4. product_categories
ALTER TABLE IF EXISTS product_categories 
    ADD CONSTRAINT product_categories_productId_fkey 
    FOREIGN KEY ("productId") REFERENCES products(id) 
    ON UPDATE CASCADE ON DELETE CASCADE;

-- 5. cross_sell_products (productId)
ALTER TABLE IF EXISTS cross_sell_products 
    ADD CONSTRAINT cross_sell_products_productId_fkey 
    FOREIGN KEY ("productId") REFERENCES products(id) 
    ON UPDATE CASCADE ON DELETE CASCADE;

-- 6. cross_sell_products (relatedProductId)
ALTER TABLE IF EXISTS cross_sell_products 
    ADD CONSTRAINT cross_sell_products_relatedProductId_fkey 
    FOREIGN KEY ("relatedProductId") REFERENCES products(id) 
    ON UPDATE CASCADE ON DELETE CASCADE;

-- 7. up_sell_products (productId)
ALTER TABLE IF EXISTS up_sell_products 
    ADD CONSTRAINT up_sell_products_productId_fkey 
    FOREIGN KEY ("productId") REFERENCES products(id) 
    ON UPDATE CASCADE ON DELETE CASCADE;

-- 8. up_sell_products (relatedProductId)
ALTER TABLE IF EXISTS up_sell_products 
    ADD CONSTRAINT up_sell_products_relatedProductId_fkey 
    FOREIGN KEY ("relatedProductId") REFERENCES products(id) 
    ON UPDATE CASCADE ON DELETE CASCADE;

-- 9. related_products (productId)
ALTER TABLE IF EXISTS related_products 
    ADD CONSTRAINT related_products_productId_fkey 
    FOREIGN KEY ("productId") REFERENCES products(id) 
    ON UPDATE CASCADE ON DELETE CASCADE;

-- 10. related_products (relatedProductId)
ALTER TABLE IF EXISTS related_products 
    ADD CONSTRAINT related_products_relatedProductId_fkey 
    FOREIGN KEY ("relatedProductId") REFERENCES products(id) 
    ON UPDATE CASCADE ON DELETE CASCADE;

-- 11. order_items
ALTER TABLE IF EXISTS order_items 
    ADD CONSTRAINT order_items_productId_fkey 
    FOREIGN KEY ("productId") REFERENCES products(id) 
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- 12. reviews
ALTER TABLE IF EXISTS reviews 
    ADD CONSTRAINT reviews_productId_fkey 
    FOREIGN KEY ("productId") REFERENCES products(id) 
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- 13. product_comparison_items (if exists)
ALTER TABLE IF EXISTS product_comparison_items 
    ADD CONSTRAINT product_comparison_items_productId_fkey 
    FOREIGN KEY ("productId") REFERENCES products(id) 
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- 14. search_recommendations (if exists)
ALTER TABLE IF EXISTS search_recommendations 
    ADD CONSTRAINT search_recommendations_productId_fkey 
    FOREIGN KEY ("productId") REFERENCES products(id) 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 15. search_click_tracking (if exists)
ALTER TABLE IF EXISTS search_click_tracking 
    ADD CONSTRAINT search_click_tracking_productId_fkey 
    FOREIGN KEY ("productId") REFERENCES products(id) 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 16. corporate_pricing
ALTER TABLE IF EXISTS corporate_pricing 
    ADD CONSTRAINT fk_corporate_pricing_product 
    FOREIGN KEY (product_id) REFERENCES products(id) 
    ON DELETE CASCADE;

-- 17. cart_items
ALTER TABLE IF EXISTS cart_items 
    ADD CONSTRAINT cart_items_productId_fkey 
    FOREIGN KEY ("productId") REFERENCES products(id) 
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- 18. variant_types
ALTER TABLE IF EXISTS variant_types 
    ADD CONSTRAINT variant_types_productId_fkey 
    FOREIGN KEY ("productId") REFERENCES products(id) 
    ON UPDATE CASCADE ON DELETE CASCADE;

-- 19. wishlist_items
ALTER TABLE IF EXISTS wishlist_items 
    ADD CONSTRAINT wishlist_items_productId_fkey 
    FOREIGN KEY ("productId") REFERENCES products(id) 
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- 20. search_analytics (if exists - productId column)
-- Note: search_analytics may have an optional productId column
-- ALTER TABLE IF EXISTS search_analytics 
--     ADD CONSTRAINT search_analytics_productId_fkey 
--     FOREIGN KEY ("productId") REFERENCES products(id) 
--     ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- STEP 7: VERIFY CONVERSION
-- ============================================================================

-- Verify users.id is now UUID
DO $$
BEGIN
    RAISE NOTICE 'Verifying users.id column type...';
    
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
          AND column_name = 'id' 
          AND data_type = 'uuid'
    ) THEN
        RAISE NOTICE 'SUCCESS: users.id is now UUID type';
    ELSE
        RAISE EXCEPTION 'FAILED: users.id is not UUID type';
    END IF;
END $$;

-- Verify products.id is now UUID
DO $$
BEGIN
    RAISE NOTICE 'Verifying products.id column type...';
    
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
          AND column_name = 'id' 
          AND data_type = 'uuid'
    ) THEN
        RAISE NOTICE 'SUCCESS: products.id is now UUID type';
    ELSE
        RAISE EXCEPTION 'FAILED: products.id is not UUID type';
    END IF;
END $$;

-- Verify foreign key constraints are recreated
DO $$
DECLARE
    v_users_fk_count INTEGER;
    v_products_fk_count INTEGER;
BEGIN
    RAISE NOTICE 'Verifying foreign key constraints...';
    
    -- Count FKs referencing users.id
    SELECT COUNT(*) INTO v_users_fk_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'users'
      AND ccu.column_name = 'id';
    
    -- Count FKs referencing products.id
    SELECT COUNT(*) INTO v_products_fk_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'products'
      AND ccu.column_name = 'id';
    
    RAISE NOTICE 'Foreign keys referencing users.id: %', v_users_fk_count;
    RAISE NOTICE 'Foreign keys referencing products.id: %', v_products_fk_count;
    
    IF v_users_fk_count >= 20 AND v_products_fk_count >= 16 THEN
        RAISE NOTICE 'SUCCESS: Foreign key constraints have been recreated';
    ELSE
        RAISE WARNING 'WARNING: Some foreign key constraints may be missing';
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- The following changes have been made:
-- 1. All foreign key constraints referencing users.id have been dropped and recreated
-- 2. All foreign key constraints referencing products.id have been dropped and recreated
-- 3. users.id has been converted from TEXT to UUID
-- 4. products.id has been converted from TEXT to UUID
-- 5. All foreign key constraints have been recreated with proper UUID types
--
-- The database is now ready for Phase 2 schema fixes.
-- ============================================================================
