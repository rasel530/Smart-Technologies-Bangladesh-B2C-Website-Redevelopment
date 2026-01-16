-- ============================================
-- ASSIGN RBAC ROLES TO TEST USERS
-- ============================================
-- This script assigns ADMIN and SUPER_ADMIN roles to test users
-- ============================================

-- Get role IDs
DO $$
DECLARE
  customer_user_id TEXT;
  admin_user_id TEXT;
  super_admin_user_id TEXT;
  customer_role_id UUID;
  admin_role_id UUID;
  super_admin_role_id UUID;
BEGIN
  -- Get test user IDs
  SELECT id INTO customer_user_id FROM users WHERE email = 'test.customer@smarttech.com';
  SELECT id INTO admin_user_id FROM users WHERE email = 'test.admin@smarttech.com';
  SELECT id INTO super_admin_user_id FROM users WHERE email = 'test.superadmin@smarttech.com';
  
  -- Get RBAC role IDs
  SELECT id INTO customer_role_id FROM roles WHERE name = 'CUSTOMER';
  SELECT id INTO admin_role_id FROM roles WHERE name = 'ADMIN';
  SELECT id INTO super_admin_role_id FROM roles WHERE name = 'SUPER_ADMIN';
  
  -- Remove existing role assignments for these users
  DELETE FROM user_roles 
  WHERE user_id IN (customer_user_id, admin_user_id, super_admin_user_id);
  
  -- Assign CUSTOMER role to test customer user
  INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, is_active)
  VALUES (customer_user_id, customer_role_id, 'system', NOW(), true);
  
  -- Assign ADMIN role to test admin user
  INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, is_active)
  VALUES (admin_user_id, admin_role_id, 'system', NOW(), true);
  
  -- Assign SUPER_ADMIN role to test super admin user
  INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, is_active)
  VALUES (super_admin_user_id, super_admin_role_id, 'system', NOW(), true);
  
  RAISE NOTICE 'RBAC roles assigned to test users successfully';
END $$;

-- ============================================
-- VERIFY ROLE ASSIGNMENTS
-- ============================================
SELECT 
  u.id,
  u.email,
  u."firstName" as first_name,
  u."lastName" as last_name,
  u.role as legacy_role,
  r.name as rbac_role,
  r.hierarchy_level,
  ur.is_active
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email LIKE 'test.%@smarttech.com'
ORDER BY r.hierarchy_level DESC;

-- ============================================
-- COMPLETE
-- ============================================
-- Summary:
-- - Removed existing role assignments for test users
-- - Assigned CUSTOMER role to test.customer@smarttech.com
-- - Assigned ADMIN role to test.admin@smarttech.com
-- - Assigned SUPER_ADMIN role to test.superadmin@smarttech.com
-- ============================================
