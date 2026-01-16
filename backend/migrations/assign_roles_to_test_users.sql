-- ============================================
-- ASSIGN ROLES TO TEST USERS
-- ============================================

-- Assign roles to all test users using INSERT ... SELECT with NOT EXISTS
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

  -- Assign CUSTOMER role to customer user if not already assigned
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = customer_user_id AND role_id = customer_role_id
  ) THEN
    INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, is_active)
    VALUES (customer_user_id, customer_role_id, 'system', NOW(), true);
  END IF;

  -- Assign ADMIN role to admin user if not already assigned
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = admin_user_id AND role_id = admin_role_id
  ) THEN
    INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, is_active)
    VALUES (admin_user_id, admin_role_id, 'system', NOW(), true);
  END IF;

  -- Assign SUPER_ADMIN role to super admin user if not already assigned
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = super_admin_user_id AND role_id = super_admin_role_id
  ) THEN
    INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, is_active)
    VALUES (super_admin_user_id, super_admin_role_id, 'system', NOW(), true);
  END IF;

  RAISE NOTICE 'Test users roles assigned successfully';
END $$;

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
