-- Fix the invalid user ID by replacing it with a valid UUID
-- This generates one UUID and uses it consistently across all tables

BEGIN;

-- Generate a new UUID for the test-superadmin-001 user
DO $$
DECLARE
    new_uuid UUID;
BEGIN
    SELECT gen_random_uuid() INTO new_uuid;
    
    -- Update all references to the invalid user ID with the new UUID
    UPDATE user_roles SET user_id = new_uuid WHERE user_id = 'test-superadmin-001';
    UPDATE user_sessions SET "userId" = new_uuid WHERE "userId" = 'test-superadmin-001';
    UPDATE addresses SET "userId" = new_uuid WHERE "userId" = 'test-superadmin-001';
    UPDATE orders SET "userId" = new_uuid WHERE "userId" = 'test-superadmin-001';
    UPDATE cart_events SET "userId" = new_uuid WHERE "userId" = 'test-superadmin-001';
    UPDATE search_logs SET "userId" = new_uuid WHERE "userId" = 'test-superadmin-001';
    UPDATE search_analytics SET "userId" = new_uuid WHERE "userId" = 'test-superadmin-001';
    UPDATE search_recommendations SET "userId" = new_uuid WHERE "userId" = 'test-superadmin-001';
    UPDATE user_search_preferences SET "userId" = new_uuid WHERE "userId" = 'test-superadmin-001';
    UPDATE user_notification_preferences SET "userId" = new_uuid WHERE "userId" = 'test-superadmin-001';
    UPDATE user_communication_preferences SET "userId" = new_uuid WHERE "userId" = 'test-superadmin-001';
    UPDATE user_privacy_settings SET "userId" = new_uuid WHERE "userId" = 'test-superadmin-001';
    UPDATE account_deletion_requests SET "userId" = new_uuid WHERE "userId" = 'test-superadmin-001';
    UPDATE user_data_exports SET "userId" = new_uuid WHERE "userId" = 'test-superadmin-001';
    UPDATE email_verification_tokens SET "userId" = new_uuid WHERE "userId" = 'test-superadmin-001';
    UPDATE phone_otps SET "userId" = new_uuid WHERE "userId" = 'test-superadmin-001';
    UPDATE password_history SET "userId" = new_uuid WHERE "userId" = 'test-superadmin-001';
    UPDATE reviews SET "userId" = new_uuid WHERE "userId" = 'test-superadmin-001';
    UPDATE product_comparisons SET "userId" = new_uuid WHERE "userId" = 'test-superadmin-001';
    UPDATE comparison_history SET "userId" = new_uuid WHERE "userId" = 'test-superadmin-001';
    UPDATE wishlists SET "userId" = new_uuid WHERE "userId" = 'test-superadmin-001';
    UPDATE wishlist_analytics SET "userId" = new_uuid WHERE "userId" = 'test-superadmin-001';
    UPDATE role_escalation_requests SET user_id = new_uuid WHERE user_id = 'test-superadmin-001';
    UPDATE corporate_accounts SET user_id = new_uuid WHERE user_id = 'test-superadmin-001';
    UPDATE corporate_accounts SET account_manager_id = new_uuid WHERE account_manager_id = 'test-superadmin-001';
    UPDATE corporate_users SET user_id = new_uuid WHERE user_id = 'test-superadmin-001';
    
    -- Now update the user table itself
    UPDATE users SET id = new_uuid WHERE id = 'test-superadmin-001';
END $$;

COMMIT;
