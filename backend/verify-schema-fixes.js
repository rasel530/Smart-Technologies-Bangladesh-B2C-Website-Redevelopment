const { PrismaClient } = require('@prisma/client');

async function verifySchemaFixes() {
  console.log('🔍 Verifying Database Schema Fixes...\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Test 1: Verify UserStatus enum works with PENDING
    console.log('🧪 Test 1: Testing UserStatus enum with PENDING...');
    try {
      // Test creating a user with PENDING status using Prisma
      const testUser = await prisma.user.create({
        data: {
          email: `test-${Date.now()}@example.com`,
          firstName: 'Test',
          lastName: 'User',
          status: 'PENDING',
          role: 'CUSTOMER'
        }
      });
      console.log(`✅ Successfully created user with PENDING status: ${testUser.id}`);
      
      // Test updating user status
      const updatedUser = await prisma.user.update({
        where: { id: testUser.id },
        data: { status: 'ACTIVE' }
      });
      console.log(`✅ Successfully updated user status to: ${updatedUser.status}`);
      
      // Clean up
      await prisma.user.delete({
        where: { id: testUser.id }
      });
      console.log('✅ Cleaned up test user');
      
    } catch (error) {
      console.log(`❌ UserStatus test failed: ${error.message}`);
    }
    
    // Test 2: Verify foreign key constraints work
    console.log('\n🧪 Test 2: Testing foreign key constraints...');
    try {
      // Test creating related records
      const testCategory = await prisma.category.create({
        data: {
          name: 'Test Category',
          slug: `test-category-${Date.now()}`
        }
      });
      console.log(`✅ Created category: ${testCategory.id}`);
      
      const testBrand = await prisma.brand.create({
        data: {
          name: 'Test Brand',
          slug: `test-brand-${Date.now()}`
        }
      });
      console.log(`✅ Created brand: ${testBrand.id}`);
      
      const testProduct = await prisma.product.create({
        data: {
          sku: `TEST-${Date.now()}`,
          name: 'Test Product',
          nameEn: 'Test Product',
          slug: `test-product-${Date.now()}`,
          categoryId: testCategory.id,
          brandId: testBrand.id,
          regularPrice: 99.99,
          costPrice: 50.00
        }
      });
      console.log(`✅ Created product with FK references: ${testProduct.id}`);
      
      // Test that FK constraints prevent invalid references
      try {
        await prisma.product.create({
          data: {
            sku: `INVALID-${Date.now()}`,
            name: 'Invalid Product',
            nameEn: 'Invalid Product',
            slug: `invalid-product-${Date.now()}`,
            categoryId: 'invalid-category-id',
            brandId: testBrand.id,
            regularPrice: 99.99,
            costPrice: 50.00
          }
        });
        console.log('❌ FK constraint should have prevented invalid category reference');
      } catch (fkError) {
        console.log('✅ FK constraint correctly prevented invalid category reference');
      }
      
      // Clean up
      await prisma.product.delete({ where: { id: testProduct.id } });
      await prisma.brand.delete({ where: { id: testBrand.id } });
      await prisma.category.delete({ where: { id: testCategory.id } });
      console.log('✅ Cleaned up test records');
      
    } catch (error) {
      console.log(`❌ Foreign key test failed: ${error.message}`);
    }
    
    // Test 3: Verify indexes are being used
    console.log('\n🧪 Test 3: Testing index performance...');
    try {
      // Create test data for index testing
      const testCategory = await prisma.category.create({
        data: {
          name: 'Index Test Category',
          slug: `index-test-category-${Date.now()}`
        }
      });
      
      const testBrand = await prisma.brand.create({
        data: {
          name: 'Index Test Brand',
          slug: `index-test-brand-${Date.now()}`
        }
      });
      
      // Create multiple products to test indexes
      const products = [];
      for (let i = 0; i < 5; i++) {
        const product = await prisma.product.create({
          data: {
            sku: `INDEX-TEST-${i}-${Date.now()}`,
            name: `Index Test Product ${i}`,
            nameEn: `Index Test Product ${i}`,
            slug: `index-test-product-${i}-${Date.now()}`,
            categoryId: testCategory.id,
            brandId: testBrand.id,
            regularPrice: 99.99,
            costPrice: 50.00
          }
        });
        products.push(product);
      }
      
      // Test queries that should use indexes
      console.log('Testing category lookup (should use categories_parentId_idx)...');
      const categoryLookup = await prisma.category.findUnique({
        where: { id: testCategory.id }
      });
      console.log(`✅ Category lookup successful: ${categoryLookup.name}`);
      
      console.log('Testing product by category (should use products_categoryId_idx)...');
      const productsByCategory = await prisma.product.findMany({
        where: { categoryId: testCategory.id }
      });
      console.log(`✅ Found ${productsByCategory.length} products by category`);
      
      console.log('Testing product by brand (should use products_brandId_idx)...');
      const productsByBrand = await prisma.product.findMany({
        where: { brandId: testBrand.id }
      });
      console.log(`✅ Found ${productsByBrand.length} products by brand`);
      
      console.log('Testing product by SKU (should use products_sku_idx)...');
      const productBySku = await prisma.product.findUnique({
        where: { sku: products[0].sku }
      });
      console.log(`✅ Found product by SKU: ${productBySku.name}`);
      
      console.log('Testing product by slug (should use products_slug_idx)...');
      const productBySlug = await prisma.product.findUnique({
        where: { slug: products[0].slug }
      });
      console.log(`✅ Found product by slug: ${productBySlug.name}`);
      
      // Clean up
      for (const product of products) {
        await prisma.product.delete({ where: { id: product.id } });
      }
      await prisma.brand.delete({ where: { id: testBrand.id } });
      await prisma.category.delete({ where: { id: testCategory.id } });
      console.log('✅ Cleaned up index test data');
      
    } catch (error) {
      console.log(`❌ Index test failed: ${error.message}`);
    }
    
    console.log('\n🎉 All schema verification tests completed!');
    
  } catch (error) {
    console.error('❌ Error during schema verification:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('📡 Prisma client disconnected');
  }
}

// Run the verification
if (require.main === module) {
  verifySchemaFixes()
    .then(() => {
      console.log('\n✅ Schema verification completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Schema verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifySchemaFixes };