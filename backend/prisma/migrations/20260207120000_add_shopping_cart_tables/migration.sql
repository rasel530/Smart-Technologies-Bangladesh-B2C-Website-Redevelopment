-- Migration: Add Shopping Cart Tables (Phase 6, Milestone 1)
-- Description: Non-destructive migration to enhance shopping cart functionality
-- - Renames columns to snake_case naming convention
-- - Adds price calculation fields to carts table
-- - Creates cart_analytics table for tracking cart events and conversion funnel
-- - Updates cart_items table with proper column names and indexes

-- ============================================================================
-- PART 1: Rename existing columns to snake_case (following project convention)
-- ============================================================================

-- Drop indexes on carts table before renaming columns
DROP INDEX IF EXISTS "carts_userId_key";

-- Drop foreign key constraint on carts.userId before renaming
ALTER TABLE "carts" DROP CONSTRAINT IF EXISTS "carts_userId_fkey";

-- Rename columns in carts table from camelCase to snake_case
ALTER TABLE "carts" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "carts" RENAME COLUMN "sessionId" TO "session_id";
ALTER TABLE "carts" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "carts" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "carts" RENAME COLUMN "expiresAt" TO "expires_at";

-- Recreate foreign key constraint with new column name
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Recreate unique constraint with new column name
CREATE UNIQUE INDEX "carts_user_id_key" ON "carts"("user_id");

-- Drop indexes on cart_items table before renaming columns
DROP INDEX IF EXISTS "cart_items_cartId_fkey";
DROP INDEX IF EXISTS "cart_items_productId_fkey";
DROP INDEX IF EXISTS "cart_items_variantId_fkey";

-- Drop foreign key constraints on cart_items before renaming
ALTER TABLE "cart_items" DROP CONSTRAINT IF EXISTS "cart_items_cartId_fkey";
ALTER TABLE "cart_items" DROP CONSTRAINT IF EXISTS "cart_items_productId_fkey";
ALTER TABLE "cart_items" DROP CONSTRAINT IF EXISTS "cart_items_variantId_fkey";

-- Rename columns in cart_items table from camelCase to snake_case
ALTER TABLE "cart_items" RENAME COLUMN "cartId" TO "cart_id";
ALTER TABLE "cart_items" RENAME COLUMN "productId" TO "product_id";
ALTER TABLE "cart_items" RENAME COLUMN "variantId" TO "variant_id";
ALTER TABLE "cart_items" RENAME COLUMN "unitPrice" TO "price";
ALTER TABLE "cart_items" RENAME COLUMN "totalPrice" TO "subtotal";
ALTER TABLE "cart_items" RENAME COLUMN "addedAt" TO "added_at";

-- Recreate foreign key constraints with new column names
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" 
    FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_fkey" 
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_fkey" 
    FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- PART 2: Add new columns to carts table (non-destructive)
-- ============================================================================

ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "tax" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "shipping_cost" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "discount" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "total" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- ============================================================================
-- PART 3: Create cart_analytics table (new table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "cart_analytics" (
    "id" TEXT NOT NULL,
    "cart_id" TEXT NOT NULL,
    "events" JSONB NOT NULL DEFAULT '{}',
    "conversion_funnel" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PART 4: Add constraints and indexes
-- ============================================================================

-- Add primary key to cart_analytics
ALTER TABLE "cart_analytics" ADD CONSTRAINT "cart_analytics_pkey" PRIMARY KEY ("id");

-- Create unique constraint on cart_analytics.cart_id
ALTER TABLE "cart_analytics" ADD CONSTRAINT "cart_analytics_cart_id_key" UNIQUE ("cart_id");

-- Create foreign key from cart_analytics to carts
ALTER TABLE "cart_analytics" ADD CONSTRAINT "cart_analytics_cart_id_fkey" 
    FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for carts table
CREATE INDEX IF NOT EXISTS "carts_user_id_idx" ON "carts"("user_id");
CREATE INDEX IF NOT EXISTS "carts_session_id_idx" ON "carts"("session_id");
CREATE INDEX IF NOT EXISTS "carts_expires_at_idx" ON "carts"("expires_at");

-- Create indexes for cart_items table
CREATE INDEX IF NOT EXISTS "cart_items_cart_id_idx" ON "cart_items"("cart_id");
CREATE INDEX IF NOT EXISTS "cart_items_product_id_idx" ON "cart_items"("product_id");
CREATE INDEX IF NOT EXISTS "cart_items_variant_id_idx" ON "cart_items"("variant_id");

-- Create index for cart_analytics table
CREATE INDEX IF NOT EXISTS "cart_analytics_cart_id_idx" ON "cart_analytics"("cart_id");
