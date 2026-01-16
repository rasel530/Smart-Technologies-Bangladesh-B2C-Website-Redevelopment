-- ============================================
-- FIX USER ROLES MIGRATION
-- ============================================
-- This migration fixes the user_roles table to ensure all users have
-- correct RBAC role assignments based on their legacy role field
-- ============================================

-- Step 1: Remove incorrect role assignments
-- Users with legacy 'customer' role should NOT have ADMIN or SUPER_ADMIN
DELETE FROM user_roles
WHERE user_id IN (
  SELECT u.id FROM users u
  WHERE u.role = 'customer'
)
AND role_id IN (
  SELECT r.id FROM roles r
  WHERE r.name IN ('ADMIN', 'SUPER_ADMIN')
);

-- Step 2: Assign CUSTOMER role to all users with legacy 'customer' role
-- Only insert if they don't already have this role
INSERT INTO user_roles (user_id, role_id, assigned_at, is_active)
SELECT
  u.id as user_id,
  r.id as role_id,
  NOW() as assigned_at,
  true as is_active
FROM users u
JOIN roles r ON r.name = 'CUSTOMER'
WHERE u.role = 'customer'
AND NOT EXISTS (
  SELECT 1 FROM user_roles ur
  WHERE ur.user_id = u.id AND ur.role_id = r.id
);

-- Step 3: Assign ADMIN role to all users with legacy 'admin' role
-- Only insert if they don't already have this role
INSERT INTO user_roles (user_id, role_id, assigned_at, is_active)
SELECT
  u.id as user_id,
  r.id as role_id,
  NOW() as assigned_at,
  true as is_active
FROM users u
JOIN roles r ON r.name = 'ADMIN'
WHERE u.role = 'admin'
AND NOT EXISTS (
  SELECT 1 FROM user_roles ur
  WHERE ur.user_id = u.id AND ur.role_id = r.id
);

-- Step 4: Assign SUPPORT role to all users with legacy 'support' role (if any)
-- Only insert if they don't already have this role
INSERT INTO user_roles (user_id, role_id, assigned_at, is_active)
SELECT
  u.id as user_id,
  r.id as role_id,
  NOW() as assigned_at,
  true as is_active
FROM users u
JOIN roles r ON r.name = 'SUPPORT'
WHERE u.role = 'support'
AND NOT EXISTS (
  SELECT 1 FROM user_roles ur
  WHERE ur.user_id = u.id AND ur.role_id = r.id
);

-- Step 5: Assign CORPORATE role to all users with legacy 'corporate' role (if any)
-- Only insert if they don't already have this role
INSERT INTO user_roles (user_id, role_id, assigned_at, is_active)
SELECT
  u.id as user_id,
  r.id as role_id,
  NOW() as assigned_at,
  true as is_active
FROM users u
JOIN roles r ON r.name = 'CORPORATE'
WHERE u.role = 'corporate'
AND NOT EXISTS (
  SELECT 1 FROM user_roles ur
  WHERE ur.user_id = u.id AND ur.role_id = r.id
);

-- Step 6: Assign CUSTOMER role to any users without a role
-- This ensures all users have at least a basic role
INSERT INTO user_roles (user_id, role_id, assigned_at, is_active)
SELECT
  u.id as user_id,
  r.id as role_id,
  NOW() as assigned_at,
  true as is_active
FROM users u
JOIN roles r ON r.name = 'CUSTOMER'
WHERE u.id NOT IN (
  SELECT DISTINCT user_id FROM user_roles
);

-- Verification: Show results
SELECT
  'Users with CUSTOMER role' as category,
  COUNT(*) as count
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'CUSTOMER'

UNION ALL

SELECT
  'Users with ADMIN role' as category,
  COUNT(*) as count
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'ADMIN'

UNION ALL

SELECT
  'Users with SUPER_ADMIN role' as category,
  COUNT(*) as count
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'SUPER_ADMIN'

UNION ALL

SELECT
  'Users with SUPPORT role' as category,
  COUNT(*) as count
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'SUPPORT'

UNION ALL

SELECT
  'Users with CORPORATE role' as category,
  COUNT(*) as count
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'CORPORATE'

UNION ALL

SELECT
  'Users without RBAC role' as category,
  COUNT(*) as count
FROM users u
WHERE u.id NOT IN (
  SELECT DISTINCT user_id FROM user_roles
);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Summary:
-- - Removed incorrect role assignments
-- - Assigned correct RBAC roles to all users based on legacy role
-- - Ensured all users have at least a basic CUSTOMER role
-- - Verified results with counts
-- ============================================
