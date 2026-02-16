-- Inventory Reservation RBAC Permissions
-- Run this script to add inventory permissions to the database

-- Insert inventory permissions
INSERT INTO permissions (id, name, resource, action, description, created_at)
VALUES 
  (gen_random_uuid(), 'inventory:read', 'inventory', 'read', 'Read inventory reservation data', NOW()),
  (gen_random_uuid(), 'inventory:write', 'inventory', 'write', 'Modify inventory reservations (release, confirm)', NOW()),
  (gen_random_uuid(), 'inventory:admin', 'inventory', 'admin', 'Admin inventory operations (cleanup, bulk actions)', NOW())
ON CONFLICT (name) DO NOTHING;

-- Get permission IDs
DO $$
DECLARE
  inventory_read_id UUID;
  inventory_write_id UUID;
  inventory_admin_id UUID;
  admin_role_id UUID;
  manager_role_id UUID;
  super_admin_role_id UUID;
BEGIN
  -- Get permission IDs
  SELECT id INTO inventory_read_id FROM permissions WHERE name = 'inventory:read';
  SELECT id INTO inventory_write_id FROM permissions WHERE name = 'inventory:write';
  SELECT id INTO inventory_admin_id FROM permissions WHERE name = 'inventory:admin';
  
  -- Get role IDs
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
  SELECT id INTO manager_role_id FROM roles WHERE name = 'manager';
  SELECT id INTO super_admin_role_id FROM roles WHERE name = 'super_admin';
  
  -- Grant permissions to admin role
  IF admin_role_id IS NOT NULL AND inventory_read_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id, granted_at)
    VALUES (admin_role_id, inventory_read_id, NOW())
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;
  
  IF admin_role_id IS NOT NULL AND inventory_write_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id, granted_at)
    VALUES (admin_role_id, inventory_write_id, NOW())
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;
  
  IF admin_role_id IS NOT NULL AND inventory_admin_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id, granted_at)
    VALUES (admin_role_id, inventory_admin_id, NOW())
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;
  
  -- Grant permissions to manager role
  IF manager_role_id IS NOT NULL AND inventory_read_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id, granted_at)
    VALUES (manager_role_id, inventory_read_id, NOW())
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;
  
  -- Grant all permissions to super_admin role
  IF super_admin_role_id IS NOT NULL AND inventory_read_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id, granted_at)
    VALUES (super_admin_role_id, inventory_read_id, NOW())
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;
  
  IF super_admin_role_id IS NOT NULL AND inventory_write_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id, granted_at)
    VALUES (super_admin_role_id, inventory_write_id, NOW())
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;
  
  IF super_admin_role_id IS NOT NULL AND inventory_admin_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id, granted_at)
    VALUES (super_admin_role_id, inventory_admin_id, NOW())
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;
END $$;

-- Verify permissions were added
SELECT 
  p.name AS permission_name,
  p.resource,
  p.action,
  r.name AS role_name
FROM permissions p
LEFT JOIN role_permissions rp ON p.id = rp.permission_id
LEFT JOIN roles r ON rp.role_id = r.id
WHERE p.resource = 'inventory'
ORDER BY p.name, r.name;
