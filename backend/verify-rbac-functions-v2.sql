-- Verify RBAC functions were created successfully

-- Check if get_user_permissions function exists
SELECT 
  routine_name as function_name,
  routine_type as type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_user_permissions', 'user_has_permission')
ORDER BY routine_name;

-- Get the superadmin user ID
SELECT id, email FROM users WHERE email = 'test.superadmin@smarttech.com' LIMIT 1;
