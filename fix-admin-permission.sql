-- ============================================
-- GRANT user:assign_role PERMISSION TO ADMIN ROLE
-- ============================================
-- This script fixes the missing user:assign_role permission for ADMIN role
-- Phase 3, Milestone 4, Task 2 - RBAC Fixes
-- ============================================

-- Grant user:assign_role permission to ADMIN role
INSERT INTO role_permissions (role_id, permission_id, granted_at, granted_by)
SELECT 
  r.id as role_id,
  p.id as permission_id,
  NOW() as granted_at,
  'RBAC_FIX_SCRIPT' as granted_by
FROM roles r
JOIN permissions p ON p.name = 'user:assign_role'
WHERE r.name = 'ADMIN'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Verify the assignment
SELECT 
  r.name as role_name,
  p.name as permission_name,
  rp.granted_at
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'ADMIN' AND p.name = 'user:assign_role';

-- ============================================
-- FIX COMPLETE
-- ============================================
-- ADMIN role now has user:assign_role permission
-- ============================================
