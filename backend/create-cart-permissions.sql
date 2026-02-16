INSERT INTO permissions (id, name, resource, action, description, created_at) VALUES
  (gen_random_uuid(), 'cart:read', 'cart', 'read', 'View carts and cart items', NOW()),
  (gen_random_uuid(), 'cart:write', 'cart', 'write', 'Modify cart items and status', NOW()),
  (gen_random_uuid(), 'cart:delete', 'cart', 'delete', 'Delete carts and cart items', NOW()),
  (gen_random_uuid(), 'cart:analytics', 'cart', 'analytics', 'View cart analytics data', NOW())
ON CONFLICT (name) DO NOTHING;
