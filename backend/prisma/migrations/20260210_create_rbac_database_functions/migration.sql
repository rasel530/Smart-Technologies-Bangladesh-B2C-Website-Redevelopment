-- Migration: Create RBAC Database Functions
-- Date: 2026-02-10
-- Description: Add PostgreSQL functions to support the RBAC permission system

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_user_permissions(UUID);
DROP FUNCTION IF EXISTS user_has_permission(UUID, VARCHAR(100));

-- Function to get all permissions for a user
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR(100),
  resource VARCHAR(50),
  action VARCHAR(50),
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
    SELECT p.id, p.name, p.resource, p.action, p.description
    FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    JOIN roles r ON rp.role_id = r.id
    JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = p_user_id
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    ORDER BY r.hierarchy_level DESC, p.name;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(p_user_id UUID, p_permission_name VARCHAR(100))
RETURNS BOOLEAN
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    JOIN roles r ON rp.role_id = r.id
    JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = p_user_id
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      AND p.name = p_permission_name
  );
END;
$$ LANGUAGE plpgsql;
