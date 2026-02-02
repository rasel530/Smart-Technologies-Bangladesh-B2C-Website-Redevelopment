CREATE INDEX IF NOT EXISTS "idx_product_images_product_id" ON "product_images"("productId");
CREATE INDEX IF NOT EXISTS "idx_product_images_display_order" ON "product_images"("productId", "sortOrder");
CREATE INDEX IF NOT EXISTS "idx_product_images_processing_status" ON "product_images"("processing_status");
CREATE INDEX IF NOT EXISTS "idx_product_images_is_primary" ON "product_images"("productId", "is_primary");
