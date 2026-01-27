-- Check current state before migration
-- This ensures no data loss occurs

-- Check products table structure
\d products;

-- Check if categoryId column exists and has data
SELECT
  COUNT(*) as total_products,
  COUNT("categoryId") as products_with_category,
  COUNT(CASE WHEN "categoryId" IS NOT NULL THEN 1 END) as products_with_category_not_null
FROM products;

-- Check product_categories table
SELECT COUNT(*) as total_product_categories FROM "product_categories";

-- Check for any products that have categoryId but no corresponding product_categories entry
SELECT
  p.id,
  p.name,
  p.sku,
  p."categoryId"
FROM products p
LEFT JOIN "product_categories" pc ON p.id = pc."productId" AND p."categoryId" = pc."categoryId"
WHERE p."categoryId" IS NOT NULL
  AND pc."productId" IS NULL
LIMIT 10;
