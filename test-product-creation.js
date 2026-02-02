const axios = require('axios');

async function testProductCreation() {
  try {
    // First, login to get auth token
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:3001/api/v1/auth/login', {
      identifier: 'admin@smarttech.com',
      password: 'AdminPassword123'
    });

    const token = loginResponse.data.token;
    console.log('✓ Login successful');

    // Get a category and brand
    console.log('\n2. Getting category and brand...');
    const categoriesResponse = await axios.get('http://localhost:3001/api/v1/categories', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const categoryId = categoriesResponse.data.categories[0]?.id;

    const brandsResponse = await axios.get('http://localhost:3001/api/v1/brands', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const brandId = brandsResponse.data.brands[0]?.id;

    if (!categoryId || !brandId) {
      console.error('✗ No category or brand found');
      return;
    }

    console.log(`✓ Using category: ${categoryId}, brand: ${brandId}`);

    // Create a test product
    console.log('\n3. Creating product...');
    const productData = {
      sku: `TEST-${Date.now()}`,
      name: 'Test Product',
      nameEn: 'Test Product',
      slug: `test-product-${Date.now()}`,
      shortDescription: 'A test product',
      description: 'This is a test product',
      categories: [categoryId],
      brandId: brandId,
      regularPrice: 100.00,
      salePrice: 90.00,
      costPrice: 70.00,
      taxRate: 0,
      stockQuantity: 100,
      lowStockThreshold: 10,
      status: 'active',
      visibility: 'public',
      metaTitle: 'Test Product',
      metaDescription: 'A test product',
      metaKeywords: 'test,product',
      isFeatured: false,
      isNewArrival: false,
      isBestSeller: false
    };

    const createResponse = await axios.post(
      'http://localhost:3001/api/v1/products',
      productData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✓ Product created successfully!');
    console.log('Product ID:', createResponse.data.product.id);
    console.log('Product Name:', createResponse.data.product.name);
    console.log('\n✅ PRODUCT CREATION TEST PASSED!');

  } catch (error) {
    console.error('\n✗ PRODUCT CREATION TEST FAILED!');
    console.error('Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    process.exit(1);
  }
}

testProductCreation();
