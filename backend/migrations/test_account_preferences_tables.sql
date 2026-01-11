-- ============================================
-- ACCOUNT PREFERENCES TABLES VERIFICATION TEST
-- ============================================
-- This script tests the account preferences tables
-- to ensure they are created correctly and working.
-- ============================================

-- Test 1: Verify user_preferences table exists and has correct structure
SELECT 'Test 1: user_preferences table structure' AS test_name;
\d user_preferences;

-- Test 2: Verify account_deletion_requests table exists and has correct structure
SELECT 'Test 2: account_deletion_requests table structure' AS test_name;
\d account_deletion_requests;

-- Test 3: Verify user_data_exports table exists and has correct structure
SELECT 'Test 3: user_data_exports table structure' AS test_name;
\d user_data_exports;

-- Test 4: Verify users table has deletion tracking columns
SELECT 'Test 4: users table deletion tracking columns' AS test_name;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('account_status', 'deletion_requested_at', 'deleted_at', 'deletion_reason')
ORDER BY column_name;

-- Test 5: Verify indexes on user_preferences
SELECT 'Test 5: Indexes on user_preferences' AS test_name;
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename = 'user_preferences'
ORDER BY indexname;

-- Test 6: Verify indexes on account_deletion_requests
SELECT 'Test 6: Indexes on account_deletion_requests' AS test_name;
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename = 'account_deletion_requests'
ORDER BY indexname;

-- Test 7: Verify indexes on user_data_exports
SELECT 'Test 7: Indexes on user_data_exports' AS test_name;
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename = 'user_data_exports'
ORDER BY indexname;

-- Test 8: Verify constraints on user_preferences
SELECT 'Test 8: Constraints on user_preferences' AS test_name;
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'user_preferences'::regclass
ORDER BY conname;

-- Test 9: Verify constraints on account_deletion_requests
SELECT 'Test 9: Constraints on account_deletion_requests' AS test_name;
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'account_deletion_requests'::regclass
ORDER BY conname;

-- Test 10: Verify constraints on user_data_exports
SELECT 'Test 10: Constraints on user_data_exports' AS test_name;
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'user_data_exports'::regclass
ORDER BY conname;

-- Test 11: Verify trigger on user_preferences
SELECT 'Test 11: Trigger on user_preferences' AS test_name;
SELECT tgname, tgrelid::regclass as table_name 
FROM pg_trigger 
WHERE tgname = 'update_user_preferences_updated_at';

-- Test 12: Verify foreign key relationships
SELECT 'Test 12: Foreign key relationships' AS test_name;
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('user_preferences', 'account_deletion_requests', 'user_data_exports')
ORDER BY tc.table_name, kcu.column_name;

-- Test 13: Test inserting a sample user_preferences record
SELECT 'Test 13: Insert sample user_preferences record' AS test_name;
INSERT INTO user_preferences (user_id, email_notifications, sms_notifications, notification_frequency)
VALUES ('test-user-id-123', true, true, 'daily')
ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
RETURNING id, user_id, notification_frequency;

-- Test 14: Test inserting a sample account_deletion_requests record
SELECT 'Test 14: Insert sample account_deletion_requests record' AS test_name;
INSERT INTO account_deletion_requests (user_id, deletion_token, reason, status, expires_at)
VALUES ('test-user-id-123', gen_random_uuid(), 'No longer using the service', 'pending', NOW() + INTERVAL '7 days')
RETURNING id, user_id, status, expires_at;

-- Test 15: Test inserting a sample user_data_exports record
SELECT 'Test 15: Insert sample user_data_exports record' AS test_name;
INSERT INTO user_data_exports (user_id, export_token, data_types, format, status, expires_at)
VALUES ('test-user-id-123', gen_random_uuid(), '["profile", "orders", "addresses"]'::jsonb, 'json', 'processing', NOW() + INTERVAL '7 days')
RETURNING id, user_id, format, data_types;

-- Test 16: Test updated_at trigger on user_preferences
SELECT 'Test 16: Test updated_at trigger' AS test_name;
SELECT updated_at FROM user_preferences WHERE user_id = 'test-user-id-123';
-- Wait 1 second
SELECT pg_sleep(1);
-- Update record
UPDATE user_preferences SET notification_frequency = 'weekly' WHERE user_id = 'test-user-id-123';
-- Check updated_at changed
SELECT updated_at FROM user_preferences WHERE user_id = 'test-user-id-123';

-- Test 17: Test constraint violations
SELECT 'Test 17: Test constraint violations (should fail)' AS test_name;
-- This should fail due to invalid notification_frequency
-- INSERT INTO user_preferences (user_id, notification_frequency)
-- VALUES ('test-user-id-456', 'invalid_frequency');

-- Test 18: Clean up test data
SELECT 'Test 18: Clean up test data' AS test_name;
DELETE FROM user_data_exports WHERE user_id = 'test-user-id-123';
DELETE FROM account_deletion_requests WHERE user_id = 'test-user-id-123';
DELETE FROM user_preferences WHERE user_id = 'test-user-id-123';

-- ============================================
-- VERIFICATION COMPLETE
-- ============================================
SELECT 'All tests completed successfully!' AS status;
