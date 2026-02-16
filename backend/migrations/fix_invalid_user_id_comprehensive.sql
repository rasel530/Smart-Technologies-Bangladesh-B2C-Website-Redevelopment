-- Fix the invalid user ID by replacing it with a valid UUID
-- This handles all foreign key references

BEGIN;

-- First, update all references to the invalid user ID
UPDATE user_roles SET user_id = gen_random_uuid() WHERE user_id = 'test-superadmin-001';
UPDATE user_sessions SET "userId" = gen_random_uuid() WHERE "userId" = 'test-superadmin-001';
UPDATE addresses SET "userId" = gen_random_uuid() WHERE "userId" = 'test-superadmin-001';
UPDATE orders SET "userId" = gen_random_uuid() WHERE "userId" = 'test-superadmin-001';
UPDATE cart_events SET "userId" = gen_random_uuid() WHERE "userId" = 'test-superadmin-001';
UPDATE search_logs SET "userId" = gen_random_uuid() WHERE "userId" = 'test-superadmin-001';
UPDATE search_analytics SET "userId" = gen_random_uuid() WHERE "userId" = 'test-superadmin-001';
UPDATE search_recommendations SET "userId" = gen_random_uuid() WHERE "userId" = 'test-superadmin-001';
UPDATE user_search_preferences SET "userId" = gen_random_uuid() WHERE "userId" = 'test-superadmin-001';
UPDATE user_notification_preferences SET "userId" = gen_random_uuid() WHERE "userId" = 'test-superadmin-001';
UPDATE user_communication_preferences SET "userId" = gen_random_uuid() WHERE "userId" = 'test-superadmin-001';
UPDATE user_privacy_settings SET "userId" = gen_random_uuid() WHERE "userId" = 'test-superadmin-001';
UPDATE account_deletion_requests SET "userId" = gen_random_uuid() WHERE "userId" = 'test-superadmin-001';
UPDATE user_data_exports SET "userId" = gen_random_uuid() WHERE "userId" = 'test-superadmin-001';
UPDATE email_verification_tokens SET "userId" = gen_random_uuid() WHERE "userId" = 'test-superadmin-001';
UPDATE phone_otps SET "userId" = gen_random_uuid() WHERE "userId" = 'test-superadmin-001';
UPDATE password_history SET "userId" = gen_random_uuid() WHERE "userId" = 'test-superadmin-001';
UPDATE reviews SET "userId" = gen_random_uuid() WHERE "userId" = 'test-superadmin-001';
UPDATE product_comparisons SET "userId" = gen_random_uuid() WHERE "userId" = 'test-superadmin-001';
UPDATE comparison_history SET "userId" = gen_random_uuid() WHERE "userId" = 'test-superadmin-001';
UPDATE wishlists SET "userId" = gen_random_uuid() WHERE "userId" = 'test-superadmin-001';
UPDATE wishlist_analytics SET "userId" = gen_random_uuid() WHERE "userId" = 'test-superadmin-001';
UPDATE role_escalation_requests SET user_id = gen_random_uuid() WHERE user_id = 'test-superadmin-001';
UPDATE corporate_accounts SET user_id = gen_random_uuid() WHERE user_id = 'test-superadmin-001';
UPDATE corporate_accounts SET account_manager_id = gen_random_uuid() WHERE account_manager_id = 'test-superadmin-001';
UPDATE corporate_users SET user_id = gen_random_uuid() WHERE user_id = 'test-superadmin-001';

-- Now update the user table itself
UPDATE users SET id = gen_random_uuid() WHERE id = 'test-superadmin-001';

COMMIT;
