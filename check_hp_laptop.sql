-- Check HP Laptop category
SELECT id, name, slug, status, "parentId" FROM categories WHERE name ILIKE '%hp laptop%' OR slug ILIKE '%hp-laptop%';

-- Check products in HP Laptop category
SELECT c.name as category_name, c.slug as category_slug, COUNT(pc."productId") as product_count
FROM categories c
LEFT JOIN product_categories pc ON c.id = pc."categoryId"
WHERE c.name ILIKE '%hp laptop%' OR c.slug ILIKE '%hp-laptop%'
GROUP BY c.id, c.name, c.slug;
