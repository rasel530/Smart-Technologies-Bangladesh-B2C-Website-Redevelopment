-- Migration: Remove categoryId from products table and migrate to many-to-many relationship
-- This migration removes the categoryId field from the products table and ensures all existing
-- product-category relationships are properly stored in the product_categories junction table.

-- Step 1: Migrate existing product-category relationships to product_categories junction table
-- This ensures no data is lost when we remove the categoryId column
INSERT INTO product_categories (id, "productId", "categoryId", "isPrimary", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid() as id,
  p.id as "productId",
  p."categoryId" as "categoryId",
  true as "isPrimary",
  NOW() as "createdAt",
  NOW() as "updatedAt"
FROM products p
WHERE 
  p."categoryId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM product_categories pc 
    WHERE pc."productId" = p.id AND pc."categoryId" = p."categoryId"
  )
ON CONFLICT ("productId", "categoryId") DO NOTHING;

-- Step 2: Verify the migration was successful
-- This query will show how many products were migrated
SELECT 
  COUNT(*) as migrated_products,
  COUNT(DISTINCT "productId") as unique_products,
  COUNT(DISTINCT "categoryId") as unique_categories
FROM product_categories
WHERE "isPrimary" = true;

-- Step 3: Drop the foreign key constraint on categoryId
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_categoryId_fkey;

-- Step 4: Drop the categoryId column from products table
ALTER TABLE products
DROP COLUMN IF EXISTS "categoryId";

-- Step 5: Verify data integrity
-- Check that all products still have at least one category
SELECT 
  p.id,
  p.name,
  p.sku,
  COUNT(pc."categoryId") as category_count
FROM products p
LEFT JOIN product_categories pc ON p.id = pc."productId"
GROUP BY p.id, p.name, p.sku
HAVING COUNT(pc."categoryId") = 0;

-- If the above query returns any results, those products need to have categories assigned manually

-- Step 7: Create an index on product_categories for better query performance
CREATE INDEX IF NOT EXISTS idx_product_categories_product_id 
ON product_categories("productId");

CREATE INDEX IF NOT EXISTS idx_product_categories_category_id 
ON product_categories("categoryId");

CREATE INDEX IF NOT EXISTS idx_product_categories_is_primary 
ON product_categories("isPrimary");

-- Step 8: Add a comment to document the change
COMMENT ON TABLE product_categories IS 'Junction table for many-to-many relationship between products and categories. Previously products had a single categoryId field which was migrated to this table.';
