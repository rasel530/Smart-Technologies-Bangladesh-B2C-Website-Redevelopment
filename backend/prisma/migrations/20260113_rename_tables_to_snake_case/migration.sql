-- Rename tables to snake_case naming convention
-- Migration: 20260113_rename_tables_to_snake_case

-- Check if Permission table exists and rename it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Permission') THEN
        ALTER TABLE "Permission" RENAME TO permission;
    ELSE
        -- If table doesn't exist, create it with correct name
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'permission') THEN
            CREATE TABLE permission (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                description TEXT,
                category TEXT NOT NULL,
                resource TEXT NOT NULL,
                action TEXT NOT NULL,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        END IF;
    END IF;
END $$;

-- Check if RolePermission table exists and rename it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'RolePermission') THEN
        ALTER TABLE "RolePermission" RENAME TO role_permission;
    ELSE
        -- If table doesn't exist, create it with correct name
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'role_permission') THEN
            CREATE TABLE role_permission (
                role_id TEXT NOT NULL,
                permission_id TEXT NOT NULL,
                granted_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                granted_by TEXT,
                PRIMARY KEY (role_id, permission_id)
            );
        END IF;
    END IF;
END $$;

-- Check if RoleHierarchy table exists and rename it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'RoleHierarchy') THEN
        ALTER TABLE "RoleHierarchy" RENAME TO role_hierarchy;
    ELSE
        -- If table doesn't exist, create it with correct name
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'role_hierarchy') THEN
            CREATE TABLE role_hierarchy (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                parent_role "UserRole" NOT NULL,
                child_role "UserRole" NOT NULL,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (parent_role, child_role)
            );
        END IF;
    END IF;
END $$;
