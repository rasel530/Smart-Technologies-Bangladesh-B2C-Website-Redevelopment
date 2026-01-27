#!/bin/bash

# Apply Performance Indexes Migration
# This script applies all performance indexes to the database

echo "Applying performance indexes..."

# Product Table Indexes
echo "Creating product table indexes..."
docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);"
docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "CREATE INDEX IF NOT EXISTS idx_products_visibility ON products(visibility);"
docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "CREATE INDEX IF NOT EXISTS idx_products_regular_price ON products(\"regularPrice\");"
docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "CREATE INDEX IF NOT EXISTS idx_products_sale_price ON products(\"salePrice\");"
docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(\"brandId\");"
docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(\"createdAt\");"
docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(\"updatedAt\");"

# Category Table Indexes
echo "Creating category table indexes..."
docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);"
docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(\"parentId\");"

# Brand Table Indexes
echo "Creating brand table indexes..."
docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "CREATE INDEX IF NOT EXISTS idx_brands_status ON brands(status);"
docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "CREATE INDEX IF NOT EXISTS idx_brands_is_featured ON brands(\"isFeatured\");"

# ProductCategory Junction Table Indexes
echo "Creating product_categories table indexes..."
docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "CREATE INDEX IF NOT EXISTS idx_product_categories_product_id ON \"product_categories\"(\"productId\");"
docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "CREATE INDEX IF NOT EXISTS idx_product_categories_category_id ON \"product_categories\"(\"categoryId\");"
docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "CREATE INDEX IF NOT EXISTS idx_product_categories_is_primary ON \"product_categories\"(\"isPrimary\");"

# Composite Indexes
echo "Creating composite indexes..."
docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "CREATE INDEX IF NOT EXISTS idx_products_status_visibility ON products(status, visibility);"
docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "CREATE INDEX IF NOT EXISTS idx_products_status_created_at ON products(status, \"createdAt\" DESC);"

echo "Performance indexes applied successfully!"
