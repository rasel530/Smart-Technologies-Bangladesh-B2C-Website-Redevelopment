-- Check if Tablets category exists
SELECT id, name, slug, status, "parentId" FROM categories WHERE slug = 'tablets';

-- Check if Lenovo Tablet category exists
SELECT id, name, slug, status, "parentId" FROM categories WHERE slug = 'lenovo-tablet';

-- Check if Lenovo Tablet 1 category exists
SELECT id, name, slug, status, "parentId" FROM categories WHERE slug = 'lenovo-tablet-1';

-- Check all tablet-related categories
SELECT id, name, slug, status, "parentId" FROM categories WHERE name ILIKE '%tablet%' OR slug ILIKE '%tablet%' ORDER BY "parentId" NULLS LAST, name;

-- Check products in each category
SELECT c.name as category_name, c.slug as category_slug, COUNT(pc."productId") as product_count
FROM categories c
LEFT JOIN product_categories pc ON c.id = pc."categoryId"
WHERE c.slug IN ('tablets', 'lenovo-tablet', 'lenovo-tablet-1')
GROUP BY c.id, c.name, c.slug;
