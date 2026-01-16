-- Verify user_roles table has entry for test user
SELECT
  ur.id,
  ur.user_id,
  ur.role_id,
  r.name as role_name,
  ur.assigned_at,
  ur.is_active
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = 'fe73940c-9719-4767-9a49-c70abcd316e7'
ORDER BY ur.assigned_at DESC;
