/**
 * Demo Category and Product Upload Test
 * 
 * This script tests the API by:
 * 1. Creating a demo category
 * 2. Creating a demo product associated with the category
 * 3. Testing GET endpoints to verify data
 * 
 * Requires: Backend running at http://localhost:3001
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Test data
const DEMO_CATEGORY = {
  name: 'Smartphones',
  slug: 'smartphones-demo',
  description: 'Latest smartphones from top brands with advanced features',
  sortOrder: 1,
  isActive: true
};

const DEMO_BRAND = {
  name: 'TechBrand Demo',
  slug: 'techbrand-demo',
  description: 'Demo brand for testing',
  isActive: true
};

const DEMO_PRODUCT = {
  name: 'Premium Smartphone X',
  nameEn: 'Premium Smartphone X',
  nameBn: 'প্রিমিয়াম স্মার্টফোন এক্স',
  slug: 'premium-smartphone-x-demo',
  sku: 'PSX-DEMO-001',
  regularPrice: 49999,
  salePrice: 44999,
  costPrice: 35000,
  stockQuantity: 50,
  lowStockThreshold: 10,
  status: 'ACTIVE',
  description: 'Experience the future with our premium smartphone featuring cutting-edge technology, stunning display, and powerful performance.',
  shortDescription: 'Premium smartphone with advanced features',
  warrantyPeriod: 12,
  warrantyType: 'manufacturer'
};

// Test results tracking
const testResults = {
  login: null,
  category: null,
  brand: null,
  product: null,
  getCategory: null,
  getProduct: null,
  getCategories: null,
  getProducts: null,
  errors: []
};

// Admin credentials
const ADMIN_CREDENTIALS = [
  { identifier: 'admin@smarttech.com', password: 'Admin123456' }
];

let authToken = null;
let adminUser = null;

/**
 * Login to get admin token
 */
async function loginAsAdmin() {
  console.log('\n' + '='.repeat(70));
  console.log('STEP 1: LOGIN AS ADMIN');
  console.log('='.repeat(70));

  for (const creds of ADMIN_CREDENTIALS) {
    try {
      console.log(`\nAttempting login with: ${creds.identifier}`);
      
      const response = await axios.post(`${API_BASE_URL}/auth/login`, creds, {
        timeout: 30000
      });

      if (response.data && response.data.token) {
        authToken = response.data.token;
        adminUser = response.data.user;
        
        console.log(`\n✅ Login successful!`);
        console.log(`   User ID: ${adminUser.id}`);
        console.log(`   Email: ${adminUser.email}`);
        console.log(`   Role: ${adminUser.role}`);
        console.log(`   Status: ${adminUser.status}`);
        console.log(`   Token: ${authToken.substring(0, 20)}...`);
        
        testResults.login = {
          success: true,
          userId: adminUser.id,
          email: adminUser.email,
          role: adminUser.role
        };
        
        return true;
      }
    } catch (error) {
      console.log(`   ❌ Login failed: ${error.response?.data?.error || error.message}`);
    }
  }

  console.log('\n❌ All login attempts failed. Cannot proceed with admin operations.');
  testResults.login = { success: false, error: 'No admin user could login' };
  return false;
}

/**
 * Create a demo category
 */
async function createDemoCategory() {
  console.log('\n' + '='.repeat(70));
  console.log('STEP 2: CREATE DEMO CATEGORY');
  console.log('='.repeat(70));

  try {
    console.log('\nCreating category with data:');
    console.log(JSON.stringify(DEMO_CATEGORY, null, 2));

    const response = await axios.post(`${API_BASE_URL}/categories`, DEMO_CATEGORY, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (response.status === 201) {
      const category = response.data.category;
      console.log(`\n✅ Category created successfully!`);
      console.log(`   Category ID: ${category.id}`);
      console.log(`   Name: ${category.name}`);
      console.log(`   Slug: ${category.slug}`);
      console.log(`   Description: ${category.description}`);
      console.log(`   Sort Order: ${category.sortOrder}`);
      console.log(`   Is Active: ${category.isActive}`);
      
      testResults.category = {
        success: true,
        id: category.id,
        name: category.name,
        slug: category.slug
      };
      
      return category;
    }
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    console.log(`\n❌ Failed to create category: ${errorMsg}`);
    if (error.response?.data?.details) {
      console.log('   Details:', JSON.stringify(error.response.data.details, null, 2));
    }
    testResults.category = { success: false, error: errorMsg };
    testResults.errors.push({ step: 'createCategory', error: errorMsg });
    return null;
  }
}

/**
 * Create a demo brand (required for product)
 */
async function createDemoBrand() {
  console.log('\n' + '='.repeat(70));
  console.log('STEP 3: CREATE DEMO BRAND');
  console.log('='.repeat(70));

  try {
    console.log('\nCreating brand with data:');
    console.log(JSON.stringify(DEMO_BRAND, null, 2));

    const response = await axios.post(`${API_BASE_URL}/brands`, DEMO_BRAND, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (response.status === 201) {
      const brand = response.data.brand;
      console.log(`\n✅ Brand created successfully!`);
      console.log(`   Brand ID: ${brand.id}`);
      console.log(`   Name: ${brand.name}`);
      console.log(`   Slug: ${brand.slug}`);
      
      testResults.brand = {
        success: true,
        id: brand.id,
        name: brand.name,
        slug: brand.slug
      };
      
      return brand;
    }
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    console.log(`\n❌ Failed to create brand: ${errorMsg}`);
    if (error.response?.data?.details) {
      console.log('   Details:', JSON.stringify(error.response.data.details, null, 2));
    }
    testResults.brand = { success: false, error: errorMsg };
    testResults.errors.push({ step: 'createBrand', error: errorMsg });
    return null;
  }
}

/**
 * Create a demo product
 */
async function createDemoProduct(categoryId, brandId) {
  console.log('\n' + '='.repeat(70));
  console.log('STEP 4: CREATE DEMO PRODUCT');
  console.log('='.repeat(70));

  const productData = {
    ...DEMO_PRODUCT,
    categoryId: categoryId,
    brandId: brandId
  };

  try {
    console.log('\nCreating product with data:');
    console.log(JSON.stringify(productData, null, 2));

    const response = await axios.post(`${API_BASE_URL}/products`, productData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (response.status === 201) {
      const product = response.data.product;
      console.log(`\n✅ Product created successfully!`);
      console.log(`   Product ID: ${product.id}`);
      console.log(`   Name: ${product.name}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Regular Price: ৳${product.regularPrice}`);
      console.log(`   Sale Price: ৳${product.salePrice}`);
      console.log(`   Stock: ${product.stockQuantity}`);
      console.log(`   Status: ${product.status}`);
      console.log(`   Category ID: ${product.categoryId}`);
      console.log(`   Brand ID: ${product.brandId}`);
      
      testResults.product = {
        success: true,
        id: product.id,
        name: product.name,
        sku: product.sku,
        categoryId: product.categoryId,
        brandId: product.brandId
      };
      
      return product;
    }
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    console.log(`\n❌ Failed to create product: ${errorMsg}`);
    if (error.response?.data?.details) {
      console.log('   Details:', JSON.stringify(error.response.data.details, null, 2));
    }
    testResults.product = { success: false, error: errorMsg };
    testResults.errors.push({ step: 'createProduct', error: errorMsg });
    return null;
  }
}

/**
 * Test GET category by ID
 */
async function testGetCategory(categoryId) {
  console.log('\n' + '='.repeat(70));
  console.log('STEP 5: TEST GET CATEGORY BY ID');
  console.log('='.repeat(70));

  try {
    console.log(`\nFetching category with ID: ${categoryId}`);

    const response = await axios.get(`${API_BASE_URL}/categories/${categoryId}`, {
      timeout: 30000
    });

    if (response.status === 200) {
      const category = response.data.category;
      console.log(`\n✅ Category retrieved successfully!`);
      console.log(`   Category ID: ${category.id}`);
      console.log(`   Name: ${category.name}`);
      console.log(`   Slug: ${category.slug}`);
      console.log(`   Description: ${category.description}`);
      console.log(`   Product Count: ${category._count?.products || 0}`);
      
      // Verify data matches
      const matches = category.name === DEMO_CATEGORY.name && 
                     category.slug === DEMO_CATEGORY.slug;
      
      console.log(`   Data matches: ${matches ? '✅ Yes' : '❌ No'}`);
      
      testResults.getCategory = {
        success: true,
        id: category.id,
        name: category.name,
        dataMatches: matches
      };
      
      return true;
    }
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    console.log(`\n❌ Failed to get category: ${errorMsg}`);
    testResults.getCategory = { success: false, error: errorMsg };
    testResults.errors.push({ step: 'getCategory', error: errorMsg });
    return false;
  }
}

/**
 * Test GET product by ID
 */
async function testGetProduct(productId) {
  console.log('\n' + '='.repeat(70));
  console.log('STEP 6: TEST GET PRODUCT BY ID');
  console.log('='.repeat(70));

  try {
    console.log(`\nFetching product with ID: ${productId}`);

    const response = await axios.get(`${API_BASE_URL}/products/${productId}`, {
      timeout: 30000
    });

    if (response.status === 200) {
      const product = response.data.product;
      console.log(`\n✅ Product retrieved successfully!`);
      console.log(`   Product ID: ${product.id}`);
      console.log(`   Name: ${product.name}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Regular Price: ৳${product.regularPrice}`);
      console.log(`   Sale Price: ৳${product.salePrice}`);
      console.log(`   Stock: ${product.stockQuantity}`);
      console.log(`   Category: ${product.category?.name || 'N/A'}`);
      console.log(`   Brand: ${product.brand?.name || 'N/A'}`);
      
      // Verify data matches
      const matches = product.name === DEMO_PRODUCT.name && 
                     product.sku === DEMO_PRODUCT.sku &&
                     product.regularPrice === DEMO_PRODUCT.regularPrice;
      
      console.log(`   Data matches: ${matches ? '✅ Yes' : '❌ No'}`);
      
      testResults.getProduct = {
        success: true,
        id: product.id,
        name: product.name,
        dataMatches: matches
      };
      
      return true;
    }
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    console.log(`\n❌ Failed to get product: ${errorMsg}`);
    testResults.getProduct = { success: false, error: errorMsg };
    testResults.errors.push({ step: 'getProduct', error: errorMsg });
    return false;
  }
}

/**
 * Test GET all categories
 */
async function testGetAllCategories() {
  console.log('\n' + '='.repeat(70));
  console.log('STEP 7: TEST GET ALL CATEGORIES');
  console.log('='.repeat(70));

  try {
    console.log('\nFetching all categories...');

    const response = await axios.get(`${API_BASE_URL}/categories`, {
      timeout: 30000
    });

    if (response.status === 200) {
      const categories = response.data.categories;
      console.log(`\n✅ Categories retrieved successfully!`);
      console.log(`   Total categories: ${categories.length}`);
      
      // Find our demo category
      const demoCategory = categories.find(c => c.slug === DEMO_CATEGORY.slug);
      
      if (demoCategory) {
        console.log(`   Demo category found: ✅`);
        console.log(`   Category ID: ${demoCategory.id}`);
        console.log(`   Name: ${demoCategory.name}`);
      } else {
        console.log(`   Demo category found: ❌`);
      }
      
      testResults.getCategories = {
        success: true,
        total: categories.length,
        demoCategoryFound: !!demoCategory
      };
      
      return true;
    }
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    console.log(`\n❌ Failed to get categories: ${errorMsg}`);
    testResults.getCategories = { success: false, error: errorMsg };
    testResults.errors.push({ step: 'getCategories', error: errorMsg });
    return false;
  }
}

/**
 * Test GET all products
 */
async function testGetAllProducts() {
  console.log('\n' + '='.repeat(70));
  console.log('STEP 8: TEST GET ALL PRODUCTS');
  console.log('='.repeat(70));

  try {
    console.log('\nFetching all products...');

    const response = await axios.get(`${API_BASE_URL}/products`, {
      timeout: 30000
    });

    if (response.status === 200) {
      const products = response.data.products;
      console.log(`\n✅ Products retrieved successfully!`);
      console.log(`   Total products: ${products.length}`);
      console.log(`   Page: ${response.data.pagination.page}`);
      console.log(`   Limit: ${response.data.pagination.limit}`);
      console.log(`   Total pages: ${response.data.pagination.pages}`);
      
      // Find our demo product
      const demoProduct = products.find(p => p.sku === DEMO_PRODUCT.sku);
      
      if (demoProduct) {
        console.log(`   Demo product found: ✅`);
        console.log(`   Product ID: ${demoProduct.id}`);
        console.log(`   Name: ${demoProduct.name}`);
        console.log(`   SKU: ${demoProduct.sku}`);
      } else {
        console.log(`   Demo product found: ❌`);
      }
      
      testResults.getProducts = {
        success: true,
        total: products.length,
        demoProductFound: !!demoProduct
      };
      
      return true;
    }
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    console.log(`\n❌ Failed to get products: ${errorMsg}`);
    testResults.getProducts = { success: false, error: errorMsg };
    testResults.errors.push({ step: 'getProducts', error: errorMsg });
    return false;
  }
}

/**
 * Print test summary
 */
function printSummary() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70));

  const tests = [
    { name: 'Login as Admin', result: testResults.login },
    { name: 'Create Demo Category', result: testResults.category },
    { name: 'Create Demo Brand', result: testResults.brand },
    { name: 'Create Demo Product', result: testResults.product },
    { name: 'GET Category by ID', result: testResults.getCategory },
    { name: 'GET Product by ID', result: testResults.getProduct },
    { name: 'GET All Categories', result: testResults.getCategories },
    { name: 'GET All Products', result: testResults.getProducts }
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach(test => {
    const status = test.result?.success ? '✅ PASS' : '❌ FAIL';
    console.log(`\n${status} - ${test.name}`);
    if (test.result?.success) {
      passed++;
    } else {
      failed++;
      if (test.result?.error) {
        console.log(`   Error: ${test.result.error}`);
      }
    }
  });

  console.log('\n' + '-'.repeat(70));
  console.log(`Total Tests: ${tests.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);

  if (testResults.errors.length > 0) {
    console.log('\n' + '-'.repeat(70));
    console.log('ERRORS ENCOUNTERED:');
    testResults.errors.forEach((err, index) => {
      console.log(`\n${index + 1}. ${err.step}:`);
      console.log(`   ${err.error}`);
    });
  }

  console.log('\n' + '='.repeat(70));
  
  if (passed === tests.length) {
    console.log('🎉 ALL TESTS PASSED! API is working correctly.');
  } else if (passed > 0) {
    console.log('⚠️  SOME TESTS PASSED. Review errors above.');
  } else {
    console.log('❌ ALL TESTS FAILED. Check backend logs and configuration.');
  }
  console.log('='.repeat(70));
}

/**
 * Main test execution
 */
async function runTests() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       DEMO CATEGORY AND PRODUCT UPLOAD TEST                    ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log(`\nAPI Base URL: ${API_BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);

  try {
    // Step 1: Login as admin
    const loginSuccess = await loginAsAdmin();
    if (!loginSuccess) {
      console.log('\n❌ Cannot proceed without admin authentication.');
      printSummary();
      return;
    }

    // Step 2: Create demo category
    const category = await createDemoCategory();
    if (!category) {
      console.log('\n❌ Cannot proceed without category.');
      printSummary();
      return;
    }

    // Step 3: Create demo brand
    const brand = await createDemoBrand();
    if (!brand) {
      console.log('\n❌ Cannot proceed without brand.');
      printSummary();
      return;
    }

    // Step 4: Create demo product
    const product = await createDemoProduct(category.id, brand.id);
    if (!product) {
      console.log('\n❌ Failed to create product.');
      printSummary();
      return;
    }

    // Step 5: Test GET category by ID
    await testGetCategory(category.id);

    // Step 6: Test GET product by ID
    await testGetProduct(product.id);

    // Step 7: Test GET all categories
    await testGetAllCategories();

    // Step 8: Test GET all products
    await testGetAllProducts();

    // Print summary
    printSummary();

  } catch (error) {
    console.error('\n❌ Fatal error during test execution:', error.message);
    console.error('Stack trace:', error.stack);
    testResults.errors.push({ step: 'fatal', error: error.message });
    printSummary();
  }
}

// Run tests
runTests()
  .then(() => {
    console.log('\n✅ Test suite completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
