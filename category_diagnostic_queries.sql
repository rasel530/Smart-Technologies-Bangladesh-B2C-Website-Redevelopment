-- Query 1: Check if HP Laptop category exists and is active
SELECT id, name, slug, status, "parentId"
FROM categories
WHERE slug = 'hp-laptop';

-- Query 2: Check if Laptop category exists and is active
SELECT id, name, slug, status, "parentId"
FROM categories
WHERE slug = 'laptops';

-- Query 3: Check if products are associated with HP Laptop category
SELECT pc.id, pc."productId", pc."categoryId", pc."isPrimary", pc."createdAt",
       p.name as product_name, p.status as product_status, p.visibility,
       c.name as category_name
FROM product_categories pc
JOIN products p ON pc."productId" = p.id
JOIN categories c ON pc."categoryId" = c.id
WHERE c.slug = 'hp-laptop';

-- Query 4: Check total products in HP Laptop category
SELECT COUNT(*) as product_count
FROM product_categories
WHERE "categoryId" = (SELECT id FROM categories WHERE slug = 'hp-laptop');

-- Query 5: Check all categories with their hierarchy
SELECT id, name, slug, status, "parentId"
FROM categories
WHERE status = 'active'
ORDER BY "parentId" NULLS LAST, name;

-- Query 6: Check products with their category associations
SELECT p.id, p.name, p.slug, p.status, p.visibility,
       COUNT(pc."categoryId") as category_count
FROM products p
LEFT JOIN product_categories pc ON p.id = pc."productId"
WHERE p.status = 'active'
GROUP BY p.id, p.name, p.slug, p.status, p.visibility
ORDER BY p.name
LIMIT 20;

-- Query 7: Check total counts
SELECT COUNT(*) as total_products FROM products;
SELECT COUNT(*) as total_categories FROM categories;
SELECT COUNT(*) as total_product_categories FROM product_categories;
