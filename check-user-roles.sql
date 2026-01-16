-- Check UserRole table for all users
SELECT
    u.id,
    u.email,
    u.role as user_role_legacy,
    ur.role_id,
    r.name as rbac_role_name,
    ur.is_active,
    ur.assigned_at
FROM users u
LEFT JOIN "user_roles" ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY u.email;
