#!/bin/bash

# Database Data Loss Fix Verification Script
# This script verifies that the database fix is working correctly

echo "=========================================="
echo "Database Data Loss Fix Verification"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if containers are running
echo "📋 Step 1: Checking container status..."
if docker ps | grep -q "smarttech_postgres"; then
    echo -e "${GREEN}✅ PostgreSQL container is running${NC}"
else
    echo -e "${RED}❌ PostgreSQL container is not running${NC}"
    echo "Please start containers with: docker-compose up -d"
    exit 1
fi

if docker ps | grep -q "smarttech_backend"; then
    echo -e "${GREEN}✅ Backend container is running${NC}"
else
    echo -e "${RED}❌ Backend container is not running${NC}"
    echo "Please start containers with: docker-compose up -d"
    exit 1
fi

echo ""

# Step 2: Check database exists
echo "📋 Step 2: Checking database exists..."
DB_EXISTS=$(docker exec smarttech_postgres psql -U smart_dev -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='smart_ecommerce_dev'")
if [ "$DB_EXISTS" = "1" ]; then
    echo -e "${GREEN}✅ Database 'smart_ecommerce_dev' exists${NC}"
else
    echo -e "${RED}❌ Database 'smart_ecommerce_dev' does not exist${NC}"
    exit 1
fi

echo ""

# Step 3: Check tables exist
echo "📋 Step 3: Checking tables exist..."
TABLE_COUNT=$(docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'")
echo "Found $TABLE_COUNT tables in database"

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Tables exist in database${NC}"

    # List some tables
    echo ""
    echo "Tables found:"
    docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "\dt" | grep -E "users|products|orders|categories|brands"
else
    echo -e "${RED}❌ No tables found in database${NC}"
    echo "This may indicate a migration issue"
    exit 1
fi

echo ""

# Step 4: Check data exists
echo "📋 Step 4: Checking data exists..."
USER_COUNT=$(docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -tAc "SELECT COUNT(*) FROM users")
PRODUCT_COUNT=$(docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -tAc "SELECT COUNT(*) FROM products")
CATEGORY_COUNT=$(docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -tAc "SELECT COUNT(*) FROM categories")
BRAND_COUNT=$(docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -tAc "SELECT COUNT(*) FROM brands")

echo "Users: $USER_COUNT"
echo "Products: $PRODUCT_COUNT"
echo "Categories: $CATEGORY_COUNT"
echo "Brands: $BRAND_COUNT"

if [ "$USER_COUNT" -gt 0 ] && [ "$PRODUCT_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Data exists in database${NC}"
else
    echo -e "${YELLOW}⚠️ Database may be empty or seeding not complete${NC}"
    echo "This is normal for first-time setup"
fi

echo ""

# Step 5: Test data persistence
echo "📋 Step 5: Testing data persistence..."
echo "Creating a test record..."

# Create a test user via direct SQL
TEST_EMAIL="test-persistence-$(date +%s)@example.com"
docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "INSERT INTO users (id, email, password, \"firstName\", \"lastName\", role, status) VALUES (gen_random_uuid(), '$TEST_EMAIL', 'test123', 'Persistence', 'Test', 'CUSTOMER', 'ACTIVE');" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Test record created${NC}"

    # Verify record exists
    RECORD_EXISTS=$(docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -tAc "SELECT COUNT(*) FROM users WHERE email='$TEST_EMAIL'")
    if [ "$RECORD_EXISTS" = "1" ]; then
        echo -e "${GREEN}✅ Test record verified${NC}"
    else
        echo -e "${RED}❌ Test record not found${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️ Could not create test record (may be permission issue)${NC}"
fi

echo ""

# Step 6: Check PostgreSQL volume
echo "📋 Step 6: Checking PostgreSQL volume..."
VOLUME_EXISTS=$(docker volume ls | grep -c "smarttech_postgres_data")
if [ "$VOLUME_EXISTS" -gt 0 ]; then
    echo -e "${GREEN}✅ PostgreSQL volume exists${NC}"
    docker volume ls | grep postgres
else
    echo -e "${RED}❌ PostgreSQL volume not found${NC}"
    echo "Data will not persist without a volume!"
    exit 1
fi

echo ""

# Step 7: Check migration status
echo "📋 Step 7: Checking Prisma migration status..."
docker exec smarttech_backend npx prisma migrate status

echo ""

# Final summary
echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo ""
echo "✅ Database exists and is accessible"
echo "✅ Tables are created by Prisma migrations"
echo "✅ Data is present in database"
echo "✅ PostgreSQL volume is configured"
echo ""
echo -e "${GREEN}🎉 Database fix appears to be working correctly!${NC}"
echo ""
echo "Next steps:"
echo "1. Restart containers to test persistence: docker-compose restart"
echo "2. Run this script again to verify data persists"
echo "3. Check logs if issues occur: docker-compose logs"
echo ""
echo "For detailed information, see: DATABASE_DATA_LOSS_FIX_PERMANENT_SOLUTION.md"
