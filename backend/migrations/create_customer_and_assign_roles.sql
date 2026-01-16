-- ============================================
-- CREATE CUSTOMER USER AND ASSIGN ALL ROLES
-- ============================================

-- Insert Customer Test User with a unique phone number
INSERT INTO users (
  id,
  email,
  password,
  "firstName",
  "lastName",
  phone,
  "emailVerified",
  "phoneVerified",
  "accountStatus",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  'test.customer@smarttech.com',
  '$2a$10$22KFT/uVxRyPoAmRSG4.Jeqo4jstEFxii4Qgk7//gdAJoB9cs1SxO',
  'Test',
  'Customer',
  '+8801700000004',
  NOW(),
  NOW(),
  'active',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Assign roles to all test users
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

-- Display test users
SELECT
  'Test Users Created' as status,
  id,
  email,
  "firstName",
  "lastName",
  "accountStatus",
  "emailVerified",
  "phoneVerified"
FROM users
WHERE email LIKE 'test.%@smarttech.com'
ORDER BY email;

-- Display assigned roles
SELECT
  'Test Users with Roles' as status,
  u.id as user_id,
  u.email,
  u."firstName",
  u."lastName",
  r.name as role_name,
  r.hierarchy_level,
  ur.is_active,
  ur.assigned_at
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email LIKE 'test.%@smarttech.com'
ORDER BY r.hierarchy_level DESC, u.email;
