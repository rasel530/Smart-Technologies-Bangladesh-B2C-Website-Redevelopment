-- Fix legacy users.role column for two specific users
-- This script updates the legacy role column to match their RBAC roles

-- Update test.admin@smarttech.com from 'customer' to 'admin'
UPDATE users
SET role = 'admin'
WHERE email = 'test.admin@smarttech.com'
  AND id = '1db5b3e0-4b28-48a9-a15f-e2ed78856f3c';

-- Update test.superadmin@smarttech.com from 'customer' to 'super_admin'
UPDATE users
SET role = 'super_admin'
WHERE email = 'test.superadmin@smarttech.com'
  AND id = 'abb83716-388e-471e-8add-0abad5ad3ce1';

-- Verification query to check the updates
SELECT id, email, role, created_at
FROM users
WHERE email IN ('test.admin@smarttech.com', 'test.superadmin@smarttech.com')
ORDER BY email;
