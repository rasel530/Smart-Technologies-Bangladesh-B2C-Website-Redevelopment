-- Sample data from users table
SELECT id, email, "firstName", "lastName", role, status, "createdAt" FROM users LIMIT 5;

-- Sample data from products table
SELECT id, sku, name, "brandId", "regularPrice", "salePrice", status FROM products LIMIT 5;

-- Sample data from categories table
SELECT id, name, slug, "parentId", status FROM categories LIMIT 5;

-- Sample data from roles table
SELECT id, name, description, "hierarchy_level" FROM roles LIMIT 5;

-- Sample data from permissions table
SELECT id, name, resource, action FROM permissions LIMIT 5;
