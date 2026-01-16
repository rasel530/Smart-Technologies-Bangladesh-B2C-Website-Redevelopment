-- ============================================
-- RBAC DATABASE MIGRATION
-- ============================================
-- Phase 3, Milestone 4, Task 2: Access Control Implementation
-- This migration creates tables for Role-Based Access Control (RBAC)
-- including roles, permissions, role-permission assignments, user-role assignments,
-- and role escalation requests.
-- ============================================

-- ============================================
-- 1. CREATE roles TABLE
-- ============================================
-- Stores system roles with hierarchy levels for permission inheritance
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  hierarchy_level INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_hierarchy_level CHECK (hierarchy_level >= 0 AND hierarchy_level <= 100)
);

-- ============================================
-- 2. CREATE permissions TABLE
-- ============================================
-- Stores granular permissions for different resources and actions
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_permission_name CHECK (name ~ '^[a-z_]+:[a-z_]+$')
);

-- ============================================
-- 3. CREATE role_permissions TABLE
-- ============================================
-- Junction table linking roles to permissions with audit trail
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  granted_by TEXT,

  CONSTRAINT unique_role_permission UNIQUE (role_id, permission_id)
);

-- ============================================
-- 4. CREATE user_roles TABLE
-- ============================================
-- Junction table linking users to roles with tracking and expiration
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by TEXT,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,

  CONSTRAINT unique_user_role_active UNIQUE (user_id, role_id) DEFERRABLE INITIALLY DEFERRED
);

-- ============================================
-- 5. CREATE role_escalation_requests TABLE
-- ============================================
-- Tracks requests for role changes/escalations with approval workflow
CREATE TABLE IF NOT EXISTS role_escalation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  requested_role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  requested_by TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reason TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_escalation_status CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'))
);

-- ============================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ============================================
-- Indexes for roles table
CREATE INDEX IF NOT EXISTS idx_roles_hierarchy_level ON roles(hierarchy_level);

-- Indexes for permissions table
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);

-- Indexes for role_permissions table
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_granted_at ON role_permissions(granted_at);

-- Indexes for user_roles table
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_at ON user_roles(assigned_at);
CREATE INDEX IF NOT EXISTS idx_user_roles_expires_at ON user_roles(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_roles_is_active ON user_roles(is_active);

-- Indexes for role_escalation_requests table
CREATE INDEX IF NOT EXISTS idx_role_escalation_user_id ON role_escalation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_role_escalation_current_role_id ON role_escalation_requests(current_role_id);
CREATE INDEX IF NOT EXISTS idx_role_escalation_requested_role_id ON role_escalation_requests(requested_role_id);
CREATE INDEX IF NOT EXISTS idx_role_escalation_status ON role_escalation_requests(status);
CREATE INDEX IF NOT EXISTS idx_role_escalation_created_at ON role_escalation_requests(created_at);

-- ============================================
-- 7. SEED INITIAL ROLES
-- ============================================
-- Role Hierarchy:
-- SUPER_ADMIN (Level 100) - Highest privilege
-- ADMIN (Level 80) - System administrator
-- SUPPORT (Level 50) - Customer service
-- CORPORATE (Level 40) - Corporate account holder
-- CUSTOMER (Level 20) - Regular customer (lowest privilege)

INSERT INTO roles (name, description, hierarchy_level) VALUES
  ('CUSTOMER', 'Regular customer with basic permissions', 20),
  ('SUPPORT', 'Customer service representative with elevated permissions', 50),
  ('CORPORATE', 'Corporate account holder with business-specific permissions', 40),
  ('ADMIN', 'System administrator with full access to most areas', 80),
  ('SUPER_ADMIN', 'Super administrator with complete system access', 100)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 8. SEED INITIAL PERMISSIONS
-- ============================================
-- Permissions are organized by resource and action
-- Format: resource:action (e.g., user:read, product:create)

-- User Management Permissions
INSERT INTO permissions (name, resource, action, description) VALUES
  ('user:read', 'user', 'read', 'View user information'),
  ('user:create', 'user', 'create', 'Create new users'),
  ('user:update', 'user', 'update', 'Update user information'),
  ('user:delete', 'user', 'delete', 'Delete users'),
  ('user:assign_role', 'user', 'assign_role', 'Assign roles to users')
ON CONFLICT (name) DO NOTHING;

-- Product Management Permissions
INSERT INTO permissions (name, resource, action, description) VALUES
  ('product:read', 'product', 'read', 'View products'),
  ('product:create', 'product', 'create', 'Create new products'),
  ('product:update', 'product', 'update', 'Update product information'),
  ('product:delete', 'product', 'delete', 'Delete products')
ON CONFLICT (name) DO NOTHING;

-- Order Management Permissions
INSERT INTO permissions (name, resource, action, description) VALUES
  ('order:read', 'order', 'read', 'View orders'),
  ('order:create', 'order', 'create', 'Create orders'),
  ('order:update', 'order', 'update', 'Update order information'),
  ('order:delete', 'order', 'delete', 'Delete orders'),
  ('order:manage_status', 'order', 'manage_status', 'Manage order status')
ON CONFLICT (name) DO NOTHING;

-- Category Management Permissions
INSERT INTO permissions (name, resource, action, description) VALUES
  ('category:read', 'category', 'read', 'View categories'),
  ('category:create', 'category', 'create', 'Create new categories'),
  ('category:update', 'category', 'update', 'Update category information'),
  ('category:delete', 'category', 'delete', 'Delete categories')
ON CONFLICT (name) DO NOTHING;

-- Brand Management Permissions
INSERT INTO permissions (name, resource, action, description) VALUES
  ('brand:read', 'brand', 'read', 'View brands'),
  ('brand:create', 'brand', 'create', 'Create new brands'),
  ('brand:update', 'brand', 'update', 'Update brand information'),
  ('brand:delete', 'brand', 'delete', 'Delete brands')
ON CONFLICT (name) DO NOTHING;

-- Review Management Permissions
INSERT INTO permissions (name, resource, action, description) VALUES
  ('review:read', 'review', 'read', 'View reviews'),
  ('review:create', 'review', 'create', 'Create reviews'),
  ('review:moderate', 'review', 'moderate', 'Moderate and approve/reject reviews')
ON CONFLICT (name) DO NOTHING;

-- Analytics Permissions
INSERT INTO permissions (name, resource, action, description) VALUES
  ('analytics:view', 'analytics', 'view', 'View analytics and reports'),
  ('analytics:export', 'analytics', 'export', 'Export analytics data')
ON CONFLICT (name) DO NOTHING;

-- Support Permissions
INSERT INTO permissions (name, resource, action, description) VALUES
  ('support:read', 'support', 'read', 'View support tickets'),
  ('support:respond', 'support', 'respond', 'Respond to support tickets'),
  ('support:manage', 'support', 'manage', 'Manage support tickets')
ON CONFLICT (name) DO NOTHING;

-- Corporate Account Permissions
INSERT INTO permissions (name, resource, action, description) VALUES
  ('corporate:read', 'corporate', 'read', 'View corporate accounts'),
  ('corporate:create', 'corporate', 'create', 'Create corporate accounts'),
  ('corporate:update', 'corporate', 'update', 'Update corporate accounts'),
  ('corporate:manage_users', 'corporate', 'manage_users', 'Manage corporate account users')
ON CONFLICT (name) DO NOTHING;

-- System Administration Permissions
INSERT INTO permissions (name, resource, action, description) VALUES
  ('system:configure', 'system', 'configure', 'Configure system settings'),
  ('system:view_logs', 'system', 'view_logs', 'View system logs'),
  ('system:backup', 'system', 'backup', 'Perform system backups')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 9. SEED ROLE-PERMISSION ASSIGNMENTS
-- ============================================
-- Assign permissions to roles based on hierarchy and business requirements

-- Get role IDs
DO $$
DECLARE
  customer_role_id UUID;
  support_role_id UUID;
  corporate_role_id UUID;
  admin_role_id UUID;
  super_admin_role_id UUID;
BEGIN
  SELECT id INTO customer_role_id FROM roles WHERE name = 'CUSTOMER';
  SELECT id INTO support_role_id FROM roles WHERE name = 'SUPPORT';
  SELECT id INTO corporate_role_id FROM roles WHERE name = 'CORPORATE';
  SELECT id INTO admin_role_id FROM roles WHERE name = 'ADMIN';
  SELECT id INTO super_admin_role_id FROM roles WHERE name = 'SUPER_ADMIN';

  -- CUSTOMER permissions (basic read and create operations)
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT customer_role_id, id FROM permissions
  WHERE name IN (
    'product:read', 'category:read', 'brand:read',
    'order:read', 'order:create',
    'review:read', 'review:create'
  )
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- SUPPORT permissions (inherits CUSTOMER + support-specific)
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT support_role_id, id FROM permissions
  WHERE name IN (
    'product:read', 'category:read', 'brand:read',
    'order:read', 'order:create',
    'review:read', 'review:create',
    'support:read', 'support:respond', 'support:manage',
    'user:read'
  )
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- CORPORATE permissions (inherits CUSTOMER + corporate-specific)
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT corporate_role_id, id FROM permissions
  WHERE name IN (
    'product:read', 'category:read', 'brand:read',
    'order:read', 'order:create', 'order:update',
    'review:read', 'review:create',
    'corporate:read', 'corporate:create', 'corporate:update', 'corporate:manage_users',
    'user:read'
  )
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- ADMIN permissions (full access to most areas except system config)
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT admin_role_id, id FROM permissions
  WHERE name IN (
    'user:read', 'user:create', 'user:update', 'user:delete',
    'product:read', 'product:create', 'product:update', 'product:delete',
    'order:read', 'order:create', 'order:update', 'order:delete', 'order:manage_status',
    'category:read', 'category:create', 'category:update', 'category:delete',
    'brand:read', 'brand:create', 'brand:update', 'brand:delete',
    'review:read', 'review:moderate',
    'analytics:view', 'analytics:export',
    'support:read', 'support:respond', 'support:manage',
    'corporate:read', 'corporate:create', 'corporate:update', 'corporate:manage_users'
  )
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- SUPER_ADMIN permissions (complete system access including system config)
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT super_admin_role_id, id FROM permissions
  WHERE name IN (
    'user:read', 'user:create', 'user:update', 'user:delete', 'user:assign_role',
    'product:read', 'product:create', 'product:update', 'product:delete',
    'order:read', 'order:create', 'order:update', 'order:delete', 'order:manage_status',
    'category:read', 'category:create', 'category:update', 'category:delete',
    'brand:read', 'brand:create', 'brand:update', 'brand:delete',
    'review:read', 'review:moderate',
    'analytics:view', 'analytics:export',
    'support:read', 'support:respond', 'support:manage',
    'corporate:read', 'corporate:create', 'corporate:update', 'corporate:manage_users',
    'system:configure', 'system:view_logs', 'system:backup'
  )
  ON CONFLICT (role_id, permission_id) DO NOTHING;
END $$;

-- ============================================
-- 10. CREATE TRIGGER FOR updated_at TIMESTAMP
-- ============================================
-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for roles table
DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 11. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to check if a user has a specific permission
CREATE OR REPLACE FUNCTION user_has_permission(p_user_id TEXT, p_permission_name VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN := FALSE;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
      AND ur.is_active = TRUE
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      AND p.name = p_permission_name
  ) INTO v_has_permission;

  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all permissions for a user
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id TEXT)
RETURNS TABLE (
  permission_id UUID,
  permission_name VARCHAR,
  resource VARCHAR,
  action VARCHAR,
  description TEXT,
  role_name VARCHAR,
  hierarchy_level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.resource,
    p.action,
    p.description,
    r.name,
    r.hierarchy_level
  FROM user_roles ur
  JOIN role_permissions rp ON ur.role_id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = p_user_id
    AND ur.is_active = TRUE
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ORDER BY r.hierarchy_level DESC, p.resource, p.action;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user roles
CREATE OR REPLACE FUNCTION get_user_roles(p_user_id TEXT)
RETURNS TABLE (
  role_id UUID,
  role_name VARCHAR,
  hierarchy_level INTEGER,
  assigned_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.name,
    r.hierarchy_level,
    ur.assigned_at,
    ur.expires_at,
    ur.is_active
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = p_user_id
  ORDER BY r.hierarchy_level DESC, ur.assigned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user has minimum role level
CREATE OR REPLACE FUNCTION user_has_minimum_role_level(p_user_id TEXT, p_min_level INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_level BOOLEAN := FALSE;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
      AND ur.is_active = TRUE
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      AND r.hierarchy_level >= p_min_level
  ) INTO v_has_level;

  RETURN v_has_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Summary:
-- - Created 5 tables: roles, permissions, role_permissions, user_roles, role_escalation_requests
-- - Added 15 indexes for performance optimization
-- - Seeded 5 predefined roles with hierarchy levels
-- - Seeded 37 permissions across 10 resource categories
-- - Assigned permissions to roles based on business requirements
-- - Created helper functions for permission checking
-- - Added triggers for automatic timestamp updates
-- ============================================
