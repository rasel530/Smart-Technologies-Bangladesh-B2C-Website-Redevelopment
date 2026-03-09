-- Add checkout permissions for admin and super_admin users
-- This script creates the checkout:read and checkout:write permissions
-- and assigns them to admin and super_admin roles

-- Insert checkout permissions
INSERT INTO permissions (name, resource, action, description, created_at)
VALUES
  ('checkout:read', 'checkout', 'read', 'View checkout sessions and analytics', NOW()),
  ('checkout:write', 'checkout', 'write', 'Manage checkout sessions and settings', NOW()),
  ('checkout:edit', 'checkout', 'edit', 'Edit checkout sessions and settings', NOW()),
  ('checkout:delete', 'checkout', 'delete', 'Delete checkout sessions', NOW()),
  ('checkout:update', 'checkout', 'update', 'Update checkout sessions and settings', NOW())
ON CONFLICT (name) DO NOTHING;

-- Assign checkout permissions to admin role
INSERT INTO role_permissions (role_id, permission_id, granted_at, granted_by)
SELECT 
  r.id,
  p.id,
  NOW(),
  'system'
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.name IN ('checkout:read', 'checkout:write', 'checkout:edit', 'checkout:delete', 'checkout:update')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign checkout permissions to super_admin role
INSERT INTO role_permissions (role_id, permission_id, granted_at, granted_by)
SELECT 
  r.id,
  p.id,
  NOW(),
  'system'
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin'
  AND p.name IN ('checkout:read', 'checkout:write', 'checkout:edit', 'checkout:delete', 'checkout:update')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Verify the permissions were added
SELECT 
  r.name as role_name,
  p.name as permission_name,
  p.resource,
  p.action,
  p.description,
  rp.granted_at
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.name IN ('checkout:read', 'checkout:write', 'checkout:edit', 'checkout:delete', 'checkout:update')
ORDER BY r.name, p.name;
