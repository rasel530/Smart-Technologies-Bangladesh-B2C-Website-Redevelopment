-- Migration: Fix product_images table to use snake_case columns matching Prisma schema
-- Date: 2026-02-01 05:40:00 UTC
-- Description: 
--   This is a PERMANENT SOLUTION to align the database schema with the Prisma schema.
--   The Prisma schema uses snake_case column names (product_id, display_order, etc.)
--   which is the standard convention for PostgreSQL databases.
--   This migration renames all camelCase columns to snake_case to match the Prisma schema,
--   ensuring no future mismatches between Prisma and the database.

-- Step 1: Drop indexes that reference columns to be renamed
DROP INDEX IF EXISTS "idx_product_images_product_id";
DROP INDEX IF EXISTS "idx_product_images_display_order";
DROP INDEX IF EXISTS "idx_product_images_is_primary";
DROP INDEX IF EXISTS "idx_product_images_processing_status";

-- Step 2: Drop the foreign key constraint
ALTER TABLE "product_images" DROP CONSTRAINT IF EXISTS "product_images_productId_fkey";

-- Step 3: Rename columns from camelCase to snake_case to match Prisma schema
ALTER TABLE "product_images" RENAME COLUMN "productId" TO "product_id";
ALTER TABLE "product_images" RENAME COLUMN "sortOrder" TO "display_order";

-- Step 4: Migrate data from old columns to new columns (if not already done)
-- Migrate url to original_url if original_url is empty
UPDATE "product_images" 
SET "original_url" = "url"
WHERE "original_url" = '' OR "original_url" IS NULL;

-- Migrate alt to alt_text_en if alt_text_en is empty
UPDATE "product_images" 
SET "alt_text_en" = "alt"
WHERE ("alt_text_en" IS NULL OR "alt_text_en" = '') AND "alt" IS NOT NULL;

-- Migrate alt to alt_text_bn if alt_text_bn is empty
UPDATE "product_images" 
SET "alt_text_bn" = "alt"
WHERE ("alt_text_bn" IS NULL OR "alt_text_bn" = '') AND "alt" IS NOT NULL;

-- Step 5: Recreate the foreign key constraint with the new column name
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" 
FOREIGN KEY ("product_id") REFERENCES "products"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 6: Recreate indexes with the new column names
CREATE INDEX "idx_product_images_product_id" ON "product_images"("product_id");
CREATE INDEX "idx_product_images_display_order" ON "product_images"("product_id", "display_order");
CREATE INDEX "idx_product_images_processing_status" ON "product_images"("processing_status");
CREATE INDEX "idx_product_images_is_primary" ON "product_images"("product_id", "is_primary");

-- Step 7: Verify the migration was successful
-- This query should show all columns with snake_case names
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'product_images' 
ORDER BY ordinal_position;

-- Expected columns after migration:
-- id, product_id, url, alt, display_order, original_url, optimized_url, thumbnail_url,
-- alt_text_bn, alt_text_en, is_primary, file_size_bytes, mime_type, width, height,
-- processing_status, created_at, updated_at
