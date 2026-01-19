-- Add Missing RBAC and Corporate Account Tables
-- This migration adds the missing lowercase RBAC tables and Corporate account tables
-- Date: 2026-01-19

-- ============================================================
-- PART 1: ADD MISSING RBAC TABLES (lowercase, plural)
-- ============================================================

-- Create permissions table (plural, lowercase)
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for permissions table
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);

-- Create roles table (plural, lowercase)
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    hierarchy_level INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP
);

-- Create index for roles table
CREATE INDEX IF NOT EXISTS idx_roles_hierarchy_level ON roles(hierarchy_level);

-- Create role_permissions table (plural, lowercase)
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    granted_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    granted_by TEXT,
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) 
        REFERENCES permissions(id) ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) 
        REFERENCES roles(id) ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT unique_role_permission UNIQUE (role_id, permission_id)
);

-- Create indexes for role_permissions table
CREATE INDEX IF NOT EXISTS idx_role_permissions_granted_at ON role_permissions(granted_at);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);

-- Create role_escalation_requests table (lowercase)
CREATE TABLE IF NOT EXISTS role_escalation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    current_role_id UUID,
    requested_role_id UUID NOT NULL,
    requested_by TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    reason TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ(6),
    review_notes TEXT,
    created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_role_escalation_current_role FOREIGN KEY (current_role_id) 
        REFERENCES roles(id) ON UPDATE NO ACTION,
    CONSTRAINT fk_role_escalation_requested_role FOREIGN KEY (requested_role_id) 
        REFERENCES roles(id) ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT fk_role_escalation_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION
);

-- Create indexes for role_escalation_requests table
CREATE INDEX IF NOT EXISTS idx_role_escalation_created_at ON role_escalation_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_role_escalation_current_role_id ON role_escalation_requests(current_role_id);
CREATE INDEX IF NOT EXISTS idx_role_escalation_requested_role_id ON role_escalation_requests(requested_role_id);
CREATE INDEX IF NOT EXISTS idx_role_escalation_status ON role_escalation_requests(status);
CREATE INDEX IF NOT EXISTS idx_role_escalation_user_id ON role_escalation_requests(user_id);

-- Create user_roles table (lowercase)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    role_id UUID NOT NULL,
    assigned_by TEXT,
    assigned_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ(6),
    is_active BOOLEAN DEFAULT true,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) 
        REFERENCES roles(id) ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT unique_user_role_active UNIQUE (user_id, role_id)
);

-- Create indexes for user_roles table
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_at ON user_roles(assigned_at);
CREATE INDEX IF NOT EXISTS idx_user_roles_expires_at ON user_roles(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_roles_is_active ON user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- ============================================================
-- PART 2: ADD CORPORATE ACCOUNT TABLES
-- ============================================================

-- Create corporate_accounts table
CREATE TABLE IF NOT EXISTS corporate_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    company_name TEXT NOT NULL,
    company_registration_number TEXT NOT NULL UNIQUE,
    tin_number TEXT,
    business_address TEXT NOT NULL,
    business_division TEXT NOT NULL,
    business_district TEXT NOT NULL,
    business_upazila TEXT,
    business_postal_code TEXT,
    authorized_person_name TEXT NOT NULL,
    authorized_person_email TEXT NOT NULL,
    authorized_person_phone TEXT NOT NULL,
    company_email TEXT NOT NULL,
    credit_limit DECIMAL(12, 2),
    credit_used DECIMAL(12, 2) DEFAULT 0,
    account_status VARCHAR(50) DEFAULT 'pending_verification',
    verification_status VARCHAR(50) DEFAULT 'pending',
    account_manager_id TEXT,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP(3),
    approved_by TEXT,
    approved_at TIMESTAMP(3),
    CONSTRAINT fk_corporate_accounts_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_corporate_accounts_manager FOREIGN KEY (account_manager_id) 
        REFERENCES users(id) ON DELETE SET NULL
);

-- Create corporate_users table
CREATE TABLE IF NOT EXISTS corporate_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporate_account_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    role VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    assigned_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP(3),
    CONSTRAINT fk_corporate_users_account FOREIGN KEY (corporate_account_id) 
        REFERENCES corporate_accounts(id) ON DELETE CASCADE,
    CONSTRAINT fk_corporate_users_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT unique_corporate_user UNIQUE (corporate_account_id, user_id)
);

-- Create corporate_documents table
CREATE TABLE IF NOT EXISTS corporate_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporate_account_id UUID NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    document_name TEXT NOT NULL,
    document_url TEXT NOT NULL,
    uploaded_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP(3),
    verified_by TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    CONSTRAINT fk_corporate_documents_account FOREIGN KEY (corporate_account_id) 
        REFERENCES corporate_accounts(id) ON DELETE CASCADE
);

-- Create corporate_approvals table
CREATE TABLE IF NOT EXISTS corporate_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporate_account_id UUID NOT NULL,
    request_type VARCHAR(50) NOT NULL,
    requested_by TEXT NOT NULL,
    requested_amount DECIMAL(12, 2),
    requested_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    approved_by TEXT,
    approved_at TIMESTAMP(3),
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    CONSTRAINT fk_corporate_approvals_account FOREIGN KEY (corporate_account_id) 
        REFERENCES corporate_accounts(id) ON DELETE CASCADE
);

-- Create corporate_pricing table
CREATE TABLE IF NOT EXISTS corporate_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporate_account_id UUID NOT NULL,
    product_id TEXT NOT NULL,
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    special_price DECIMAL(12, 2),
    valid_from TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    valid_to TIMESTAMP(3),
    CONSTRAINT fk_corporate_pricing_account FOREIGN KEY (corporate_account_id) 
        REFERENCES corporate_accounts(id) ON DELETE CASCADE,
    CONSTRAINT fk_corporate_pricing_product FOREIGN KEY (product_id) 
        REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT unique_corporate_product_pricing UNIQUE (corporate_account_id, product_id)
);

-- ============================================================
-- PART 3: UPDATE EXISTING TABLES TO SUPPORT CORPORATE
-- ============================================================

-- Add corporate_account_id column to orders table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'corporate_account_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN corporate_account_id UUID;
        ALTER TABLE orders ADD CONSTRAINT fk_orders_corporate_account 
            FOREIGN KEY (corporate_account_id) REFERENCES corporate_accounts(id);
    END IF;
END $$;

-- ============================================================
-- PART 4: ADD PROFILE VISIBILITY ENUM IF MISSING
-- ============================================================

-- Create ProfileVisibility enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProfileVisibility') THEN
        CREATE TYPE "ProfileVisibility" AS ENUM ('public', 'private', 'friends_only');
    END IF;
END $$;

-- Add profile_visibility column to user_privacy_settings if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_privacy_settings' AND column_name = 'profile_visibility'
    ) THEN
        ALTER TABLE user_privacy_settings ADD COLUMN profile_visibility "ProfileVisibility" DEFAULT 'public';
    END IF;
END $$;

-- ============================================================
-- PART 5: ADD CORPORATE ROLE TO USER ROLE ENUM IF MISSING
-- ============================================================

-- Check if corporate role exists in UserRole enum, add if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'corporate' AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'UserRole'
        )
    ) THEN
        ALTER TYPE "UserRole" ADD VALUE 'corporate';
    END IF;
END $$;

-- ============================================================
-- PART 6: INSERT DEFAULT ROLES AND PERMISSIONS
-- ============================================================

-- Insert default roles
INSERT INTO roles (name, description, hierarchy_level) VALUES
    ('customer', 'Regular customer with basic permissions', 0),
    ('support', 'Support staff with limited admin permissions', 1),
    ('corporate', 'Corporate account user', 2),
    ('manager', 'Manager with elevated permissions', 3),
    ('admin', 'Administrator with most permissions', 4),
    ('super_admin', 'Super administrator with all permissions', 5)
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (name, resource, action, description) VALUES
    -- User permissions
    ('user:read', 'user', 'read', 'View user information'),
    ('user:create', 'user', 'create', 'Create new users'),
    ('user:update', 'user', 'update', 'Update user information'),
    ('user:delete', 'user', 'delete', 'Delete users'),
    ('user:assign_role', 'user', 'assign_role', 'Assign roles to users'),
    
    -- Product permissions
    ('product:read', 'product', 'read', 'View products'),
    ('product:create', 'product', 'create', 'Create new products'),
    ('product:update', 'product', 'update', 'Update product information'),
    ('product:delete', 'product', 'delete', 'Delete products'),
    
    -- Order permissions
    ('order:read', 'order', 'read', 'View orders'),
    ('order:create', 'order', 'create', 'Create orders'),
    ('order:update', 'order', 'update', 'Update order information'),
    ('order:delete', 'order', 'delete', 'Delete orders'),
    ('order:manage_status', 'order', 'manage_status', 'Manage order status'),
    
    -- Category permissions
    ('category:read', 'category', 'read', 'View categories'),
    ('category:create', 'category', 'create', 'Create new categories'),
    ('category:update', 'category', 'update', 'Update category information'),
    ('category:delete', 'category', 'delete', 'Delete categories'),
    
    -- Brand permissions
    ('brand:read', 'brand', 'read', 'View brands'),
    ('brand:create', 'brand', 'create', 'Create new brands'),
    ('brand:update', 'brand', 'update', 'Update brand information'),
    ('brand:delete', 'brand', 'delete', 'Delete brands'),
    
    -- Review permissions
    ('review:read', 'review', 'read', 'View reviews'),
    ('review:create', 'review', 'create', 'Create reviews'),
    ('review:manage', 'review', 'manage', 'Manage reviews (approve/delete)'),
    
    -- Analytics permissions
    ('analytics:view', 'analytics', 'view', 'View analytics dashboard'),
    ('analytics:export', 'analytics', 'export', 'Export analytics data'),
    
    -- Support permissions
    ('support:read', 'support', 'read', 'View support tickets'),
    ('support:respond', 'support', 'respond', 'Respond to support tickets'),
    ('support:manage', 'support', 'manage', 'Manage support tickets'),
    
    -- Corporate permissions
    ('corporate:read', 'corporate', 'read', 'View corporate accounts'),
    ('corporate:create', 'corporate', 'create', 'Create corporate accounts'),
    ('corporate:update', 'corporate', 'update', 'Update corporate accounts'),
    ('corporate:manage_users', 'corporate', 'manage_users', 'Manage corporate users'),
    
    -- System permissions
    ('system:config', 'system', 'config', 'Configure system settings'),
    ('system:logs', 'system', 'logs', 'View system logs'),
    ('system:backup', 'system', 'backup', 'Create system backups')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'super_admin'),
    id
FROM permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Admin gets most permissions except system config, logs, backup
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'admin'),
    id
FROM permissions
WHERE resource != 'system'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Manager gets product, category, brand, order, and analytics permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'manager'),
    id
FROM permissions
WHERE resource IN ('products', 'categories', 'brands', 'orders', 'analytics')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Support gets support permissions and basic read permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'support'),
    id
FROM permissions
WHERE category IN ('support', 'users', 'orders') AND action IN ('read', 'respond', 'manage')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Corporate gets corporate permissions and basic read permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'corporate'),
    id
FROM permissions
WHERE resource IN ('corporate', 'users', 'orders')
   OR (resource IN ('products', 'categories', 'brands', 'reviews') AND action = 'read')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Customer gets basic read and create permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'customer'),
    id
FROM permissions
WHERE (resource IN ('products', 'categories', 'brands', 'reviews') AND action IN ('read', 'create'))
   OR (resource = 'orders' AND action IN ('read', 'create'))
ON CONFLICT (role_id, permission_id) DO NOTHING;
