-- Check all tablet-related categories with full details
SELECT id, name, slug, status, "parentId", "imageUrl", "iconUrl", description
FROM categories
WHERE slug IN ('tablets', 'lenovo-tablet', 'lenovo-tablet-1')
ORDER BY "parentId" NULLS LAST, name;

-- Check HP Laptop category for comparison
SELECT id, name, slug, status, "parentId", "imageUrl", "iconUrl", description
FROM categories
WHERE slug = 'hp-laptop';
