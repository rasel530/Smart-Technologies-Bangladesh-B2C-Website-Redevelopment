-- Rename productId to product_id
ALTER TABLE "product_images" RENAME COLUMN "productId" TO "product_id";

-- Rename sortOrder to display_order
ALTER TABLE "product_images" RENAME COLUMN "sortOrder" TO "display_order";
