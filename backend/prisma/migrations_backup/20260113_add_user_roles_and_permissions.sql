-- Add User Roles and Permissions
-- This migration adds comprehensive role-based access control system
-- Date: 2026-01-13

-- Step 1: Drop default constraint from role column
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;

-- Step 2: Create temporary enum with new roles
CREATE TYPE "UserRole_new" AS ENUM ('customer', 'admin', 'manager', 'super_admin', 'support', 'corporate');

-- Step 3: Alter the column to use the new type
ALTER TABLE "users" 
  ALTER COLUMN "role" TYPE "UserRole_new" 
  USING "role"::text::"UserRole_new";

-- Step 4: Drop the old enum type
DROP TYPE "UserRole";

-- Step 5: Rename the temporary type to the original name
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

-- Step 6: Re-create default value constraint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'customer';

-- Step 7: Create Permission table
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- Step 8: Create RolePermission junction table
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId", "permissionId")
);

-- Step 9: Create RoleHierarchy table
CREATE TABLE "RoleHierarchy" (
    "id" TEXT NOT NULL,
    "parentRole" TEXT NOT NULL,
    "childRole" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleHierarchy_pkey" PRIMARY KEY ("id")
);

-- Step 10: Create indexes for better performance
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");
CREATE INDEX "RolePermission_grantedBy_idx" ON "RolePermission"("grantedBy");
CREATE INDEX "RoleHierarchy_parentRole_idx" ON "RoleHierarchy"("parentRole");
CREATE INDEX "RoleHierarchy_childRole_idx" ON "RoleHierarchy"("childRole");

-- Step 11: Insert default permissions
INSERT INTO "Permission" ("id", "name", "description", "category", "resource", "action") VALUES
-- Users permissions
('perm_001', 'user:read', 'View user information', 'users', 'user', 'read'),
('perm_002', 'user:create', 'Create new users', 'users', 'user', 'create'),
('perm_003', 'user:update', 'Update user information', 'users', 'user', 'update'),
('perm_004', 'user:delete', 'Delete users', 'users', 'user', 'delete'),
('perm_005', 'user:assign_role', 'Assign roles to users', 'users', 'user', 'assign_role'),

-- Products permissions
('perm_006', 'product:read', 'View products', 'products', 'product', 'read'),
('perm_007', 'product:create', 'Create new products', 'products', 'product', 'create'),
('perm_008', 'product:update', 'Update product information', 'products', 'product', 'update'),
('perm_009', 'product:delete', 'Delete products', 'products', 'product', 'delete'),

-- Orders permissions
('perm_010', 'order:read', 'View orders', 'orders', 'order', 'read'),
('perm_011', 'order:create', 'Create orders', 'orders', 'order', 'create'),
('perm_012', 'order:update', 'Update order information', 'orders', 'order', 'update'),
('perm_013', 'order:delete', 'Delete orders', 'orders', 'order', 'delete'),
('perm_014', 'order:manage_status', 'Manage order status', 'orders', 'order', 'manage_status'),

-- Categories permissions
('perm_015', 'category:read', 'View categories', 'categories', 'category', 'read'),
('perm_016', 'category:create', 'Create new categories', 'categories', 'category', 'create'),
('perm_017', 'category:update', 'Update category information', 'categories', 'category', 'update'),
('perm_018', 'category:delete', 'Delete categories', 'categories', 'category', 'delete'),

-- Brands permissions
('perm_019', 'brand:read', 'View brands', 'brands', 'brand', 'read'),
('perm_020', 'brand:create', 'Create new brands', 'brands', 'brand', 'create'),
('perm_021', 'brand:update', 'Update brand information', 'brands', 'brand', 'update'),
('perm_022', 'brand:delete', 'Delete brands', 'brands', 'brand', 'delete'),

-- Reviews permissions
('perm_023', 'review:read', 'View reviews', 'reviews', 'review', 'read'),
('perm_024', 'review:create', 'Create reviews', 'reviews', 'review', 'create'),
('perm_025', 'review:manage', 'Manage reviews (approve/delete)', 'reviews', 'review', 'manage'),

-- Analytics permissions
('perm_026', 'analytics:view', 'View analytics dashboard', 'analytics', 'analytics', 'view'),
('perm_027', 'analytics:export', 'Export analytics data', 'analytics', 'analytics', 'export'),

-- Support permissions
('perm_028', 'support:read', 'View support tickets', 'support', 'support', 'read'),
('perm_029', 'support:respond', 'Respond to support tickets', 'support', 'support', 'respond'),
('perm_030', 'support:manage', 'Manage support tickets', 'support', 'support', 'manage'),

-- Corporate permissions
('perm_031', 'corporate:read', 'View corporate accounts', 'corporate', 'corporate', 'read'),
('perm_032', 'corporate:create', 'Create corporate accounts', 'corporate', 'corporate', 'create'),
('perm_033', 'corporate:update', 'Update corporate accounts', 'corporate', 'corporate', 'update'),
('perm_034', 'corporate:manage_users', 'Manage corporate users', 'corporate', 'corporate', 'manage_users'),

-- System permissions
('perm_035', 'system:config', 'Configure system settings', 'system', 'system', 'config'),
('perm_036', 'system:logs', 'View system logs', 'system', 'system', 'logs'),
('perm_037', 'system:backup', 'Create system backups', 'system', 'system', 'backup');

-- Step 12: Insert role hierarchy
INSERT INTO "RoleHierarchy" ("id", "parentRole", "childRole") VALUES
('hier_001', 'super_admin', 'admin'),
('hier_002', 'admin', 'manager'),
('hier_003', 'admin', 'support'),
('hier_004', 'admin', 'corporate'),
('hier_005', 'manager', 'customer'),
('hier_006', 'support', 'customer'),
('hier_007', 'corporate', 'customer');

-- Step 13: Assign default permissions to roles

-- SUPER_ADMIN gets all permissions
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT 'super_admin', id FROM "Permission";

-- ADMIN gets most permissions (except system config, logs, backup)
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT 'admin', id FROM "Permission"
WHERE category != 'system';

-- MANAGER gets product, category, brand, order, and analytics permissions
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT 'manager', id FROM "Permission"
WHERE category IN ('products', 'categories', 'brands', 'orders', 'analytics');

-- SUPPORT gets support permissions and basic read permissions
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT 'support', id FROM "Permission"
WHERE category IN ('support', 'users', 'orders') AND action IN ('read', 'respond', 'manage');

-- CORPORATE gets corporate permissions and basic read permissions
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT 'corporate', id FROM "Permission"
WHERE category IN ('corporate', 'users', 'orders')
   OR (category IN ('products', 'categories', 'brands', 'reviews') AND action = 'read');

-- CUSTOMER gets basic read and create permissions
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT 'customer', id FROM "Permission"
WHERE (category IN ('products', 'categories', 'brands', 'reviews') AND action IN ('read', 'create'))
   OR (category = 'orders' AND action IN ('read', 'create'));
