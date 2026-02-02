const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testProductCreation() {
  try {
    console.log('=== Checking database state ===\n');

    // Check categories
    const categories = await prisma.category.findMany({
      select: { id: true, name: true },
      take: 5
    });
    console.log('Categories found:', categories.length);
    console.log('Sample categories:', categories.map(c => ({ id: c.id, name: c.name })));

    // Check brands
    const brands = await prisma.brand.findMany({
      select: { id: true, name: true },
      take: 5
    });
    console.log('\nBrands found:', brands.length);
    console.log('Sample brands:', brands.map(b => ({ id: b.id, name: b.name })));

    // Check existing products
    const products = await prisma.product.findMany({
      select: { id: true, sku: true, slug: true },
      take: 5
    });
    console.log('\nExisting products:', products.length);
    console.log('Sample products:', products);

    // Try to create a test product
    console.log('\n=== Attempting to create test product ===\n');

    if (categories.length === 0) {
      console.error('ERROR: No categories found in database!');
      return;
    }

    if (brands.length === 0) {
      console.error('ERROR: No brands found in database!');
      return;
    }

    const testProductData = {
      sku: 'TEST-001',
      name: 'Test Product',
      nameEn: 'Test Product',
      slug: 'test-product-' + Date.now(),
      shortDescription: 'A test product',
      description: 'This is a test product',
      brandId: brands[0].id,
      regularPrice: 99.99,
      salePrice: null,
      costPrice: 79.99,
      taxRate: 0,
      stockQuantity: 100,
      lowStockThreshold: 10,
      status: 'active',
      visibility: 'public',
      metaTitle: 'Test Product',
      metaDescription: 'Test product description',
      metaKeywords: 'test,product',
      isFeatured: false,
      isNewArrival: false,
      isBestSeller: false,
      warrantyPeriod: null,
      warrantyType: null,
      publishedAt: null,
      categories: {
        create: [
          {
            categoryId: categories[0].id,
            isPrimary: true
          }
        ]
      }
    };

    console.log('Creating product with data:', {
      sku: testProductData.sku,
      name: testProductData.name,
      slug: testProductData.slug,
      brandId: testProductData.brandId,
      categories: [{ categoryId: categories[0].id }]
    });

    const product = await prisma.product.create({
      data: testProductData,
      include: {
        categories: {
          include: {
            category: true
          }
        },
        brand: true
      }
    });

    console.log('\n✅ SUCCESS: Product created!');
    console.log('Product ID:', product.id);
    console.log('Product SKU:', product.sku);
    console.log('Product name:', product.name);

    // Cleanup test product
    await prisma.product.delete({
      where: { id: product.id }
    });
    console.log('\n✅ Test product cleaned up successfully');

  } catch (error) {
    console.error('\n❌ ERROR: Failed to create product');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error meta:', error.meta);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProductCreation();
