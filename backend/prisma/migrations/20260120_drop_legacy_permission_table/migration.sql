-- Migration: Drop legacy permission table
-- Date: 2026-01-20
-- Description: Remove legacy 'permission' table that conflicts with 'permissions' table

-- Drop the legacy permission table (it's not used, only 'permissions' table is active)
DROP TABLE IF EXISTS permission CASCADE;

-- Note: The Permission model has been removed from schema.prisma
-- The RBAC system uses the 'permissions' table (snake_case) which is the correct one
