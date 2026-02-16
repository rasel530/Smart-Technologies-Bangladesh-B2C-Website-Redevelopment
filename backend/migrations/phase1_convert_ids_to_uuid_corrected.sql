-- ============================================================================
-- PHASE1: ROOT CAUSE FIX - Convert users.id and products.id to UUID
-- Corrected version with actual constraint names
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: DROP ALL FK CONSTRAINTS REFERENCING users.id
-- ============================================================================

ALTER TABLE IF EXISTS addresses DROP CONSTRAINT IF EXISTS addresses_userId_fkey;
ALTER TABLE IF EXISTS user_sessions DROP CONSTRAINT IF EXISTS user_sessions_userId_fkey;
ALTER TABLE IF EXISTS user_social_accounts DROP CONSTRAINT IF EXISTS user_social_accounts_userId_fkey;
ALTER TABLE IF EXISTS carts DROP CONSTRAINT IF EXISTS carts_userId_fkey;
ALTER TABLE IF EXISTS wishlists DROP CONSTRAINT IF EXISTS wishlists_userId_fkey;
ALTER TABLE IF EXISTS wishlists DROP CONSTRAINT IF EXISTS wishlists_userid_fkey;
ALTER TABLE IF EXISTS orders DROP CONSTRAINT IF EXISTS orders_userId_fkey;
ALTER TABLE IF EXISTS reviews DROP CONSTRAINT IF EXISTS reviews_userId_fkey;
ALTER TABLE IF EXISTS search_logs DROP CONSTRAINT IF EXISTS search_logs_userId_fkey;
ALTER TABLE IF EXISTS account_deletion_requests DROP CONSTRAINT IF EXISTS account_deletion_requests_userId_fkey;
ALTER TABLE IF EXISTS password_history DROP CONSTRAINT IF EXISTS password_history_userId_fkey;
ALTER TABLE IF EXISTS email_verification_tokens DROP CONSTRAINT IF EXISTS email_verification_tokens_userId_fkey;
ALTER TABLE IF EXISTS phone_otps DROP CONSTRAINT IF EXISTS phone_otps_userId_fkey;
ALTER TABLE IF EXISTS user_communication_preferences DROP CONSTRAINT IF EXISTS user_communication_preferences_userId_fkey;
ALTER TABLE IF EXISTS user_data_exports DROP CONSTRAINT IF EXISTS user_data_exports_userId_fkey;
ALTER TABLE IF EXISTS user_notification_preferences DROP CONSTRAINT IF EXISTS user_notification_preferences_userId_fkey;
ALTER TABLE IF EXISTS user_privacy_settings DROP CONSTRAINT IF EXISTS user_privacy_settings_userId_fkey;
ALTER TABLE IF EXISTS role_escalation_requests DROP CONSTRAINT IF EXISTS fk_role_escalation_user;
ALTER TABLE IF EXISTS user_roles DROP CONSTRAINT IF EXISTS fk_user_roles_user;
ALTER TABLE IF EXISTS corporate_accounts DROP CONSTRAINT IF EXISTS fk_corporate_accounts_user;
ALTER TABLE IF EXISTS corporate_accounts DROP CONSTRAINT IF EXISTS fk_corporate_accounts_manager;
ALTER TABLE IF EXISTS corporate_users DROP CONSTRAINT IF EXISTS fk_corporate_users_user;

-- Additional tables that may have FK to users.id
ALTER TABLE IF EXISTS search_analytics DROP CONSTRAINT IF EXISTS search_analytics_userId_fkey;
ALTER TABLE IF EXISTS search_recommendations DROP CONSTRAINT IF EXISTS search_recommendations_userId_fkey;
ALTER TABLE IF EXISTS user_search_preferences DROP CONSTRAINT IF EXISTS user_search_preferences_userId_fkey;
ALTER TABLE IF EXISTS product_comparisons DROP CONSTRAINT IF EXISTS product_comparisons_userId_fkey;
ALTER TABLE IF EXISTS comparison_history DROP CONSTRAINT IF EXISTS comparison_history_userId_fkey;
ALTER TABLE IF EXISTS wishlist_analytics DROP CONSTRAINT IF EXISTS fk_wishlist_analytics_user;

-- ============================================================================
-- STEP 2: DROP ALL FK CONSTRAINTS REFERENCING products.id
-- ============================================================================

ALTER TABLE IF EXISTS products DROP CONSTRAINT IF EXISTS products_brandId_fkey;
ALTER TABLE IF EXISTS product_images DROP CONSTRAINT IF EXISTS product_images_product_id_fkey;
ALTER TABLE IF EXISTS product_specifications DROP CONSTRAINT IF EXISTS product_specifications_product_id_fkey;
ALTER TABLE IF EXISTS product_variants DROP CONSTRAINT IF EXISTS product_variants_product_id_fkey;
ALTER TABLE IF EXISTS product_categories DROP CONSTRAINT IF EXISTS product_categories_product_id_fkey;
ALTER TABLE IF EXISTS product_categories DROP CONSTRAINT IF EXISTS product_categories_categoryId_fkey;
ALTER TABLE IF EXISTS cross_sell_products DROP CONSTRAINT IF EXISTS cross_sell_products_productId_fkey;
ALTER TABLE IF EXISTS cross_sell_products DROP CONSTRAINT IF EXISTS cross_sell_products_relatedProductId_fkey;
ALTER TABLE IF EXISTS up_sell_products DROP CONSTRAINT IF EXISTS up_sell_products_productId_fkey;
ALTER TABLE IF EXISTS up_sell_products DROP CONSTRAINT IF EXISTS up_sell_products_relatedProductId_fkey;
ALTER TABLE IF EXISTS related_products DROP CONSTRAINT IF EXISTS related_products_productId_fkey;
ALTER TABLE IF EXISTS related_products DROP CONSTRAINT IF EXISTS related_products_relatedProductId_fkey;
ALTER TABLE IF EXISTS order_items DROP CONSTRAINT IF EXISTS order_items_productId_fkey;
ALTER TABLE IF EXISTS reviews DROP CONSTRAINT IF EXISTS reviews_productId_fkey;
ALTER TABLE IF EXISTS product_comparison_items DROP CONSTRAINT IF EXISTS product_comparison_items_comparisonId_fkey;
ALTER TABLE IF EXISTS product_comparison_items DROP CONSTRAINT IF EXISTS product_comparison_items_productId_fkey;
ALTER TABLE IF EXISTS search_recommendations DROP CONSTRAINT IF EXISTS search_recommendations_productId_fkey;
ALTER TABLE IF EXISTS search_click_tracking DROP CONSTRAINT IF EXISTS search_click_tracking_productId_fkey;
ALTER TABLE IF EXISTS corporate_pricing DROP CONSTRAINT IF EXISTS fk_corporate_pricing_product;
ALTER TABLE IF EXISTS cart_items DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey;
ALTER TABLE IF EXISTS variant_types DROP CONSTRAINT IF EXISTS variant_types_product_id_fkey;
ALTER TABLE IF EXISTS wishlist_items DROP CONSTRAINT IF EXISTS wishlist_items_productId_fkey;
ALTER TABLE IF EXISTS wishlist_items DROP CONSTRAINT IF EXISTS wishlist_items_productid_fkey;

-- ============================================================================
-- STEP 3: CONVERT users.id FROM TEXT TO UUID
-- ============================================================================

ALTER TABLE users DROP CONSTRAINT users_pkey;
ALTER TABLE users ALTER COLUMN id TYPE UUID USING id::UUID;
ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (id);

-- ============================================================================
-- STEP 4: CONVERT products.id FROM TEXT TO UUID
-- ============================================================================

ALTER TABLE products DROP CONSTRAINT products_pkey;
ALTER TABLE products ALTER COLUMN id TYPE UUID USING id::UUID;
ALTER TABLE products ADD CONSTRAINT products_pkey PRIMARY KEY (id);

-- ============================================================================
-- STEP 5: RE-ADD ALL FK CONSTRAINTS REFERENCING users.id
-- ============================================================================

ALTER TABLE IF EXISTS addresses ADD CONSTRAINT addresses_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE IF EXISTS user_sessions ADD CONSTRAINT user_sessions_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE IF EXISTS user_social_accounts ADD CONSTRAINT user_social_accounts_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE IF EXISTS carts ADD CONSTRAINT carts_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE IF EXISTS wishlists ADD CONSTRAINT wishlists_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE IF EXISTS wishlists ADD CONSTRAINT wishlists_userid_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE IF EXISTS orders ADD CONSTRAINT orders_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE IF EXISTS reviews ADD CONSTRAINT reviews_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE IF EXISTS search_logs ADD CONSTRAINT search_logs_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE IF EXISTS account_deletion_requests ADD CONSTRAINT account_deletion_requests_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE IF EXISTS password_history ADD CONSTRAINT password_history_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE IF EXISTS email_verification_tokens ADD CONSTRAINT email_verification_tokens_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE IF EXISTS phone_otps ADD CONSTRAINT phone_otps_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE IF EXISTS user_communication_preferences ADD CONSTRAINT user_communication_preferences_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE IF EXISTS user_data_exports ADD CONSTRAINT user_data_exports_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE IF EXISTS user_notification_preferences ADD CONSTRAINT user_notification_preferences_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE IF EXISTS user_privacy_settings ADD CONSTRAINT user_privacy_settings_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE IF EXISTS role_escalation_requests ADD CONSTRAINT fk_role_escalation_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS user_roles ADD CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS corporate_accounts ADD CONSTRAINT fk_corporate_accounts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS corporate_accounts ADD CONSTRAINT fk_corporate_accounts_manager FOREIGN KEY (account_manager_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS corporate_users ADD CONSTRAINT fk_corporate_users_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS search_analytics ADD CONSTRAINT search_analytics_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE IF EXISTS search_recommendations ADD CONSTRAINT search_recommendations_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS user_search_preferences ADD CONSTRAINT user_search_preferences_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS product_comparisons ADD CONSTRAINT product_comparisons_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE IF EXISTS comparison_history ADD CONSTRAINT comparison_history_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS wishlist_analytics ADD CONSTRAINT fk_wishlist_analytics_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 6: RE-ADD ALL FK CONSTRAINTS REFERENCING products.id
-- ============================================================================

ALTER TABLE IF EXISTS products ADD CONSTRAINT products_brandId_fkey FOREIGN KEY ("brandId") REFERENCES brands(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE IF EXISTS product_images ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE IF EXISTS product_specifications ADD CONSTRAINT product_specifications_product_id_fkey FOREIGN KEY ("productId") REFERENCES products(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE IF EXISTS product_variants ADD CONSTRAINT product_variants_product_id_fkey FOREIGN KEY ("productId") REFERENCES products(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE IF EXISTS product_categories ADD CONSTRAINT product_categories_product_id_fkey FOREIGN KEY ("productId") REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE IF EXISTS product_categories ADD CONSTRAINT product_categories_categoryId_fkey FOREIGN KEY ("categoryId") REFERENCES categories(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE IF EXISTS cross_sell_products ADD CONSTRAINT cross_sell_products_productId_fkey FOREIGN KEY ("productId") REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE IF EXISTS cross_sell_products ADD CONSTRAINT cross_sell_products_relatedProductId_fkey FOREIGN KEY ("relatedProductId") REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE IF EXISTS up_sell_products ADD CONSTRAINT up_sell_products_productId_fkey FOREIGN KEY ("productId") REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE IF EXISTS up_sell_products ADD CONSTRAINT up_sell_products_relatedProductId_fkey FOREIGN KEY ("relatedProductId") REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE IF EXISTS related_products ADD CONSTRAINT related_products_productId_fkey FOREIGN KEY ("productId") REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE IF EXISTS related_products ADD CONSTRAINT related_products_relatedProductId_fkey FOREIGN KEY ("relatedProductId") REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE IF EXISTS order_items ADD CONSTRAINT order_items_productId_fkey FOREIGN KEY ("productId") REFERENCES products(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE IF EXISTS reviews ADD CONSTRAINT reviews_productId_fkey FOREIGN KEY ("productId") REFERENCES products(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE IF EXISTS product_comparison_items ADD CONSTRAINT product_comparison_items_comparisonId_fkey FOREIGN KEY ("comparisonId") REFERENCES product_comparisons(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE IF EXISTS product_comparison_items ADD CONSTRAINT product_comparison_items_productId_fkey FOREIGN KEY ("productId") REFERENCES products(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE IF EXISTS search_recommendations ADD CONSTRAINT search_recommendations_productId_fkey FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS search_click_tracking ADD CONSTRAINT search_click_tracking_productId_fkey FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS corporate_pricing ADD CONSTRAINT fk_corporate_pricing_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS cart_items ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY ("productId") REFERENCES products(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE IF EXISTS variant_types ADD CONSTRAINT variant_types_product_id_fkey FOREIGN KEY ("productId") REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE IF EXISTS wishlist_items ADD CONSTRAINT wishlist_items_productId_fkey FOREIGN KEY ("productId") REFERENCES products(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE IF EXISTS wishlist_items ADD CONSTRAINT wishlist_items_productid_fkey FOREIGN KEY ("productId") REFERENCES products(id) ON UPDATE CASCADE ON DELETE RESTRICT;

COMMIT;
