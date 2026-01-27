# Migration Guide: Remove categoryId from Products Table

## Overview
This migration removes the `categoryId` field from the `products` table and migrates to a many-to-many relationship using the `product_categories` junction table.

## Safety Measures
1. **Data Preservation**: All existing product-category relationships will be migrated to the `product_categories` junction table
2. **Backup Strategy**: Database backup is recommended before migration
3. **Rollback Plan**: Rollback script provided if needed
4. **Validation Steps**: Multiple validation checks before and after migration

## Pre-Migration Checklist

- [ ] Create database backup
- [ ] Verify `product_categories` junction table exists
- [ ] Verify all products have at least one category
- [ ] Review migration script
- [ ] Test migration on staging environment

## Migration Steps

### Step 1: Create Database Backup
```bash
# PostgreSQL backup
pg_dump -U your_username -d your_database > backup_before_migration.sql

# Or using Docker
docker exec -i postgres_container pg_dump -U your_username your_database > backup_before_migration.sql
```

### Step 2: Verify Current State
```sql
-- Check products with categoryId
SELECT COUNT(*) as products_with_category_id 
FROM products 
WHERE "categoryId" IS NOT NULL;

-- Check product_categories table exists
SELECT COUNT(*) as product_categories_count 
FROM product_categories;

-- Check products without categories in junction table
SELECT p.id, p.name, p.sku, p."categoryId"
FROM products p
LEFT JOIN product_categories pc ON p.id = pc."productId"
WHERE pc."productId" IS NULL AND p."categoryId" IS NOT NULL;
```

### Step 3: Run Migration
The migration script will:
1. Migrate existing `categoryId` relationships to `product_categories` junction table
2. Drop foreign key constraint
3. Drop `categoryId` column
4. Create indexes for performance

```bash
cd backend
npx prisma migrate dev --name 20260126190700_remove_categoryid_from_products
```

### Step 4: Verify Migration Success
```sql
-- Verify categoryId column is removed
\d products

-- Verify all products have categories in junction table
SELECT p.id, p.name, p.sku, COUNT(pc."categoryId") as category_count
FROM products p
LEFT JOIN product_categories pc ON p.id = pc."productId"
GROUP BY p.id, p.name, p.sku
HAVING COUNT(pc."categoryId") = 0;

-- Verify primary categories are set
SELECT COUNT(*) as products_with_primary
FROM product_categories
WHERE "isPrimary" = true;
```

## Rollback Plan

If you need to rollback, use the rollback script:

```sql
-- ROLLBACK SCRIPT
-- Add categoryId column back to products table
ALTER TABLE products 
ADD COLUMN "categoryId" UUID;

-- Add foreign key constraint
ALTER TABLE products 
ADD CONSTRAINT products_categoryId_fkey 
FOREIGN KEY ("categoryId") REFERENCES categories(id) ON DELETE SET NULL;

-- Migrate primary category back to categoryId
UPDATE products p
SET "categoryId" = (
  SELECT pc."categoryId" 
  FROM product_categories pc 
  WHERE pc."productId" = p.id AND pc."isPrimary" = true
  LIMIT 1
);

-- Drop product_categories table (optional, if you want to revert completely)
-- DROP TABLE IF EXISTS product_categories;
```

## Post-Migration Tasks

1. **Update Application Code**: Ensure all code uses `categories` array instead of `categoryId`
2. **Update API Calls**: Update frontend to use new category management endpoints
3. **Update Admin Panel**: Ensure ProductForm uses ProductCategoryManager
4. **Test All Features**: Test product creation, update, and category management
5. **Monitor Performance**: Check query performance with new indexes

## Validation Queries

### Before Migration
```sql
-- Total products
SELECT COUNT(*) FROM products;

-- Products with categoryId
SELECT COUNT(*) FROM products WHERE "categoryId" IS NOT NULL;

-- Product categories in junction table
SELECT COUNT(*) FROM product_categories;
```

### After Migration
```sql
-- Total products (should be same)
SELECT COUNT(*) FROM products;

-- Products with categories (should be same as before)
SELECT COUNT(DISTINCT "productId") FROM product_categories;

-- Categories per product distribution
SELECT 
  COUNT(*) as product_count,
  COUNT(pc."categoryId") as category_count
FROM products p
LEFT JOIN product_categories pc ON p.id = pc."productId"
GROUP BY category_count;
```

## Troubleshooting

### Issue: Migration fails with "column does not exist"
**Solution**: Ensure you're using the correct database connection

### Issue: Products without categories after migration
**Solution**: Run the data migration step manually:
```sql
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
```

### Issue: Foreign key constraint error
**Solution**: Drop the constraint manually before migration:
```sql
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_categoryId_fkey;
```

## Support

If you encounter any issues:
1. Check the migration logs in `backend/prisma/migrations/`
2. Review the error messages carefully
3. Use the rollback script if necessary
4. Restore from backup if needed

## Notes

- This migration is **irreversible** once the `categoryId` column is dropped
- Always test on a staging environment first
- Monitor application performance after migration
- Update all dependent code before running migration in production
