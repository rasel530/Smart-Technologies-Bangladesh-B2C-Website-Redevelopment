-- Script to dump all table structures for schema comparison
-- This will help identify all mismatches between Prisma schema and actual database

\echo '=== users ==='
\d users

\echo '=== addresses ==='
\d addresses

\echo '=== user_sessions ==='
\d user_sessions

\echo '=== user_social_accounts ==='
\d user_social_accounts

\echo '=== brands ==='
\d brands

\echo '=== categories ==='
\d categories

\echo '=== products ==='
\d products

\echo '=== product_images ==='
\d product_images

\echo '=== product_specifications ==='
\d product_specifications

\echo '=== product_variants ==='
\d product_variants

\echo '=== variant_types ==='
\d variant_types

\echo '=== variant_values ==='
\d variant_values

\echo '=== product_categories ==='
\d product_categories

\echo '=== cross_sell_products ==='
\d cross_sell_products

\echo '=== up_sell_products ==='
\d up_sell_products

\echo '=== related_products ==='
\d related_products

\echo '=== carts ==='
\d carts

\echo '=== cart_items ==='
\d cart_items

\echo '=== wishlists ==='
\d wishlists

\echo '=== wishlist_items ==='
\d wishlist_items

\echo '=== orders ==='
\d orders

\echo '=== order_items ==='
\d order_items

\echo '=== transactions ==='
\d transactions

\echo '=== reviews ==='
\d reviews

\echo '=== coupons ==='
\d coupons

\echo '=== email_verification_tokens ==='
\d email_verification_tokens

\echo '=== phone_otps ==='
\d phone_otps

\echo '=== password_history ==='
\d password_history

\echo '=== user_notification_preferences ==='
\d user_notification_preferences

\echo '=== user_communication_preferences ==='
\d user_communication_preferences

\echo '=== user_privacy_settings ==='
\d user_privacy_settings

\echo '=== account_deletion_requests ==='
\d account_deletion_requests

\echo '=== user_data_exports ==='
\d user_data_exports

\echo '=== permissions ==='
\d permissions

\echo '=== role_escalation_requests ==='
\d role_escalation_requests

\echo '=== role_permissions ==='
\d role_permissions

\echo '=== roles ==='
\d roles

\echo '=== user_roles ==='
\d user_roles

\echo '=== corporate_accounts ==='
\d corporate_accounts

\echo '=== corporate_users ==='
\d corporate_users

\echo '=== corporate_documents ==='
\d corporate_documents

\echo '=== corporate_approvals ==='
\d corporate_approvals

\echo '=== corporate_pricing ==='
\d corporate_pricing

\echo '=== search_logs ==='
\d search_logs
