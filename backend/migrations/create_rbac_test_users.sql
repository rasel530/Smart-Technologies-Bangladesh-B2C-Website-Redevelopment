-- ============================================
-- CREATE RBAC TEST USERS WITH ELEVATED ROLES
-- ============================================
-- This script creates test users for RBAC testing
-- with ADMIN and SUPER_ADMIN roles assigned
-- ============================================

-- ============================================
-- 1. CREATE TEST USERS
-- ============================================
-- Note: Passwords are hashed using bcrypt
-- test.customer@smarttech.com / TestCustomer123!
-- test.admin@smarttech.com / TestAdmin123!
-- test.superadmin@smarttech.com / TestSuperAdmin123!

-- Insert test customer user
INSERT INTO users (
  id,
  email,
  password,
  first_name,
  last_name,
  role,
  status,
  account_status,
  created_at,
  updated_at,
  email_verified,
  preferred_language
) VALUES (
  gen_random_uuid(),
  'test.customer@smarttech.com',
  '$2b$10$rKZzXyYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYz',
  'Test',
  'Customer',
  'customer',
  'active',
  'active',
  NOW(),
  NOW(),
  NOW(),
  'en'
) ON CONFLICT (email) DO NOTHING;

-- Insert test admin user
INSERT INTO users (
  id,
  email,
  password,
  first_name,
  last_name,
  role,
  status,
  account_status,
  created_at,
  updated_at,
  email_verified,
  preferred_language
) VALUES (
  gen_random_uuid(),
  'test.admin@smarttech.com',
  '$2b$10$rKZzXyYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYz',
  'Test',
  'Admin',
  'admin',
  'active',
  'active',
  NOW(),
  NOW(),
  NOW(),
  'en'
) ON CONFLICT (email) DO NOTHING;

-- Insert test super admin user
INSERT INTO users (
  id,
  email,
  password,
  first_name,
  last_name,
  role,
  status,
  account_status,
  created_at,
  updated_at,
  email_verified,
  preferred_language
) VALUES (
  gen_random_uuid(),
  'test.superadmin@smarttech.com',
  '$2b$10$rKZzXyYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYz',
  'Test',
  'SuperAdmin',
  'super_admin',
  'active',
  'active',
  NOW(),
  NOW(),
  NOW(),
  'en'
) ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 2. ASSIGN RBAC ROLES TO TEST USERS
-- ============================================
-- Get role IDs and assign them to test users

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
  
  -- Assign CUSTOMER role to test customer user
  INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, is_active)
  VALUES (customer_user_id, customer_role_id, 'system', NOW(), true)
  ON CONFLICT (user_id, role_id) DO UPDATE SET
    is_active = true,
    assigned_at = NOW();
  
  -- Assign ADMIN role to test admin user
  INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, is_active)
  VALUES (admin_user_id, admin_role_id, 'system', NOW(), true)
  ON CONFLICT (user_id, role_id) DO UPDATE SET
    is_active = true,
    assigned_at = NOW();
  
  -- Assign SUPER_ADMIN role to test super admin user
  INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, is_active)
  VALUES (super_admin_user_id, super_admin_role_id, 'system', NOW(), true)
  ON CONFLICT (user_id, role_id) DO UPDATE SET
    is_active = true,
    assigned_at = NOW();
  
  RAISE NOTICE 'Test users created and RBAC roles assigned successfully';
END $$;

-- ============================================
-- 3. VERIFY TEST USERS AND ROLES
-- ============================================
-- Display created test users
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.role as legacy_role,
  r.name as rbac_role,
  r.hierarchy_level,
  ur.is_active
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email LIKE 'test.%@smarttech.com'
ORDER BY r.hierarchy_level DESC;

-- ============================================
-- 4. CREATE HELPER FUNCTION TO RESET TEST USERS
-- ============================================
CREATE OR REPLACE FUNCTION reset_test_users_passwords()
RETURNS VOID AS $$
BEGIN
  -- Reset passwords to default for all test users
  -- Default passwords:
  -- test.customer@smarttech.com / TestCustomer123!
  -- test.admin@smarttech.com / TestAdmin123!
  -- test.superadmin@smarttech.com / TestSuperAdmin123!
  
  UPDATE users
  SET password = '$2b$10$rKZzXyYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYz',
      updated_at = NOW()
  WHERE email LIKE 'test.%@smarttech.com';
  
  RAISE NOTICE 'Test user passwords reset to default';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMPLETE
-- ============================================
-- Summary:
-- - Created 3 test users (customer, admin, super_admin)
-- - Assigned appropriate RBAC roles to each user
-- - Created helper function to reset passwords
-- - All test users are active and verified
-- ============================================
