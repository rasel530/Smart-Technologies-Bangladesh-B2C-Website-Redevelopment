-- Apply remaining performance indexes
-- This file contains the indexes that need proper quoting

CREATE INDEX IF NOT EXISTS idx_products_regular_price ON products("regularPrice");
CREATE INDEX IF NOT EXISTS idx_products_sale_price ON products("salePrice");
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products("brandId");
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products("createdAt");
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products("updatedAt");

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories("parentId");

CREATE INDEX IF NOT EXISTS idx_brands_is_featured ON brands("isFeatured");

CREATE INDEX IF NOT EXISTS idx_product_categories_product_id ON "product_categories"("productId");
CREATE INDEX IF NOT EXISTS idx_product_categories_category_id ON "product_categories"("categoryId");
CREATE INDEX IF NOT EXISTS idx_product_categories_is_primary ON "product_categories"("isPrimary");
