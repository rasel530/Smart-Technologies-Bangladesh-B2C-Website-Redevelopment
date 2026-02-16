-- Add Cart Permissions to RBAC System
-- This migration adds missing cart permissions and assigns them to appropriate roles
-- Date: 2026-02-09
-- Issue: /api/v1/admin/carts endpoint requires cart:read permission which was missing

-- ============================================================
-- PART 1: INSERT CART PERMISSIONS
-- ============================================================

-- Insert cart:read permission - View cart information
INSERT INTO permissions (name, resource, action, description) VALUES
    ('cart:read', 'cart', 'read', 'View cart information')
ON CONFLICT (name) DO NOTHING;

-- Insert cart:write permission - Create/update cart information
INSERT INTO permissions (name, resource, action, description) VALUES
    ('cart:write', 'cart', 'write', 'Create and update cart information')
ON CONFLICT (name) DO NOTHING;

-- Insert cart:delete permission - Delete cart information
INSERT INTO permissions (name, resource, action, description) VALUES
    ('cart:delete', 'cart', 'delete', 'Delete cart information')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- PART 2: ASSIGN CART PERMISSIONS TO ROLES
-- ============================================================

-- Assign ALL cart permissions to super_admin role
-- super_admin gets cart:read, cart:write, and cart:delete
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'super_admin'),
    id
FROM permissions
WHERE name IN ('cart:read', 'cart:write', 'cart:delete')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign cart:read and cart:write to admin role
-- admin gets cart:read and cart:write (but NOT cart:delete)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'admin'),
    id
FROM permissions
WHERE name IN ('cart:read', 'cart:write')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign cart:read to manager role
-- manager gets only cart:read permission
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'manager'),
    id
FROM permissions
WHERE name = 'cart:read'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign cart:read to staff role (if staff role exists)
-- Note: If 'staff' role doesn't exist, this will insert nothing (no error)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'staff'),
    id
FROM permissions
WHERE name = 'cart:read'
  AND EXISTS (SELECT 1 FROM roles WHERE name = 'staff')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================
-- PART 3: VERIFICATION QUERY (Optional - for debugging)
-- ============================================================

-- Uncomment the following query to verify the migration was successful:
-- 
-- SELECT 
--     r.name AS role_name,
--     p.name AS permission_name,
--     p.description AS permission_description
-- FROM role_permissions rp
-- JOIN roles r ON rp.role_id = r.id
-- JOIN permissions p ON rp.permission_id = p.id
-- WHERE p.name LIKE 'cart:%'
-- ORDER BY r.hierarchy_level DESC, p.name;
--
-- Expected results:
-- - super_admin: cart:read, cart:write, cart:delete
-- - admin: cart:read, cart:write
-- - manager: cart:read
-- - staff: cart:read (if staff role exists)
