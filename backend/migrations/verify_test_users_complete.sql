-- ============================================
-- COMPLETE VERIFICATION OF TEST USERS
-- ============================================

-- Display all test users with full details
SELECT
  'Test Users' as info_type,
  id,
  email,
  "firstName",
  "lastName",
  phone,
  "accountStatus",
  "emailVerified",
  "phoneVerified",
  "createdAt"
FROM users
WHERE email LIKE 'test.%@smarttech.com'
ORDER BY email;

-- Display roles assigned to test users
SELECT
  'User Roles' as info_type,
  u.id as user_id,
  u.email,
  u."firstName",
  u."lastName",
  r.name as role_name,
  r.hierarchy_level,
  r.description,
  ur.is_active,
  ur.assigned_at,
  ur.expires_at
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email LIKE 'test.%@smarttech.com'
ORDER BY r.hierarchy_level DESC, u.email;

-- Display permissions for test users through their roles
SELECT
  'User Permissions' as info_type,
  u.email,
  u."firstName",
  u."lastName",
  r.name as role_name,
  p.name as permission_name,
  p.resource,
  p.action,
  p.description
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.email LIKE 'test.%@smarttech.com'
ORDER BY u.email, r.hierarchy_level DESC, p.resource, p.action;

-- Count summary
SELECT
  'Summary' as info_type,
  COUNT(DISTINCT u.id) as total_test_users,
  COUNT(DISTINCT ur.role_id) as total_roles_assigned,
  COUNT(DISTINCT p.id) as total_permissions_accessible
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.email LIKE 'test.%@smarttech.com';
