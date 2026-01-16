-- ============================================
-- RBAC TEST USERS INSERTION SCRIPT
-- ============================================
-- This script creates test users with known credentials
-- and assigns them appropriate RBAC roles for testing
-- ============================================

-- ============================================
-- TEST USER CREDENTIALS
-- ============================================
-- Customer User:
--   Email: test.customer@smarttech.com
--   Password: TestCustomer123!
--   Role: CUSTOMER
--
-- Admin User:
--   Email: test.admin@smarttech.com
--   Password: TestAdmin123!
--   Role: ADMIN
--
-- Super Admin User:
--   Email: test.superadmin@smarttech.com
--   Password: TestSuperAdmin123!
--   Role: SUPER_ADMIN
-- ============================================

-- ============================================
-- 1. INSERT TEST USERS
-- ============================================
-- Note: Passwords are hashed using bcryptjs with 10 rounds
-- The passwords are:
-- - TestCustomer123!
-- - TestAdmin123!
-- - TestSuperAdmin123!

-- Insert Customer Test User
INSERT INTO users (
  id,
  email,
  password,
  first_name,
  last_name,
  phone_number,
  is_email_verified,
  is_phone_verified,
  status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'test.customer@smarttech.com',
  '$2a$10$22KFT/uVxRyPoAmRSG4.Jeqo4jstEFxii4Qgk7//gdAJoB9cs1SxO',
  'Test',
  'Customer',
  '+8801700000001',
  true,
  true,
  'active',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert Admin Test User
INSERT INTO users (
  id,
  email,
  password,
  first_name,
  last_name,
  phone_number,
  is_email_verified,
  is_phone_verified,
  status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'test.admin@smarttech.com',
  '$2a$10$ZRYPx0JPtZqLr3h2VcjRFOVQrdK2WmEr7qpBEDuviyulxP6UGvAKi',
  'Test',
  'Admin',
  '+8801700000002',
  true,
  true,
  'active',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert Super Admin Test User
INSERT INTO users (
  id,
  email,
  password,
  first_name,
  last_name,
  phone_number,
  is_email_verified,
  is_phone_verified,
  status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'test.superadmin@smarttech.com',
  '$2a$10$iCXPnHQZbpDScp.JcVZs5ObgHp6N5qj7ee/h7a.6fu5Ds7c4Y8wJq',
  'Test',
  'SuperAdmin',
  '+8801700000003',
  true,
  true,
  'active',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 2. ASSIGN ROLES TO TEST USERS
-- ============================================

-- Get role IDs and assign to users
DO $$
DECLARE
  customer_role_id UUID;
  admin_role_id UUID;
  super_admin_role_id UUID;
  customer_user_id TEXT;
  admin_user_id TEXT;
  super_admin_user_id TEXT;
BEGIN
  -- Get role IDs
  SELECT id INTO customer_role_id FROM roles WHERE name = 'CUSTOMER';
  SELECT id INTO admin_role_id FROM roles WHERE name = 'ADMIN';
  SELECT id INTO super_admin_role_id FROM roles WHERE name = 'SUPER_ADMIN';

  -- Get user IDs
  SELECT id INTO customer_user_id FROM users WHERE email = 'test.customer@smarttech.com';
  SELECT id INTO admin_user_id FROM users WHERE email = 'test.admin@smarttech.com';
  SELECT id INTO super_admin_user_id FROM users WHERE email = 'test.superadmin@smarttech.com';

  -- Assign CUSTOMER role to customer user
  INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, is_active)
  VALUES (customer_user_id, customer_role_id, 'system', NOW(), true)
  ON CONFLICT (user_id, role_id) DO NOTHING;

  -- Assign ADMIN role to admin user
  INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, is_active)
  VALUES (admin_user_id, admin_role_id, 'system', NOW(), true)
  ON CONFLICT (user_id, role_id) DO NOTHING;

  -- Assign SUPER_ADMIN role to super admin user
  INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, is_active)
  VALUES (super_admin_user_id, super_admin_role_id, 'system', NOW(), true)
  ON CONFLICT (user_id, role_id) DO NOTHING;

  RAISE NOTICE 'Test users created and roles assigned successfully';
END $$;

-- ============================================
-- 3. VERIFY TEST USERS AND ROLES
-- ============================================

-- Display test users
SELECT
  'Test Users Created' as status,
  email,
  first_name,
  last_name,
  status as user_status,
  is_email_verified,
  is_phone_verified
FROM users
WHERE email LIKE 'test.%@smarttech.com'
ORDER BY email;

-- Display assigned roles
SELECT
  'Test Users with Roles' as status,
  u.email,
  u.first_name,
  u.last_name,
  r.name as role_name,
  r.hierarchy_level,
  ur.is_active,
  ur.assigned_at
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email LIKE 'test.%@smarttech.com'
ORDER BY r.hierarchy_level DESC, u.email;

-- ============================================
-- 4. DOCUMENTATION
-- ============================================
-- Test User Credentials Summary:
-- ============================================
-- Customer User:
--   Email: test.customer@smarttech.com
--   Password: TestCustomer123!
--   Role: CUSTOMER (Level 20)
--   Permissions: Basic read and create operations
--
-- Admin User:
--   Email: test.admin@smarttech.com
--   Password: TestAdmin123!
--   Role: ADMIN (Level 80)
--   Permissions: Full access to most areas except system config
--
-- Super Admin User:
--   Email: test.superadmin@smarttech.com
--   Password: TestSuperAdmin123!
--   Role: SUPER_ADMIN (Level 100)
--   Permissions: Complete system access including system config
-- ============================================

-- ============================================
-- NOTE: PASSWORD HASHING
-- ============================================
-- The password hashes above are actual bcrypt hashes generated using bcryptjs
-- with 10 rounds of salt. These are the credentials:
--
-- Customer User:
--   Email: test.customer@smarttech.com
--   Password: TestCustomer123!
--   Hash: $2a$10$22KFT/uVxRyPoAmRSG4.Jeqo4jstEFxii4Qgk7//gdAJoB9cs1SxO
--
-- Admin User:
--   Email: test.admin@smarttech.com
--   Password: TestAdmin123!
--   Hash: $2a$10$ZRYPx0JPtZqLr3h2VcjRFOVQrdK2WmEr7qpBEDuviyulxP6UGvAKi
--
-- Super Admin User:
--   Email: test.superadmin@smarttech.com
--   Password: TestSuperAdmin123!
--   Hash: $2a$10$iCXPnHQZbpDScp.JcVZs5ObgHp6N5qj7ee/h7a.6fu5Ds7c4Y8wJq
--
-- These hashes were generated using:
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('TestCustomer123!', 10);
-- ============================================

-- ============================================
-- SCRIPT COMPLETE
-- ============================================
