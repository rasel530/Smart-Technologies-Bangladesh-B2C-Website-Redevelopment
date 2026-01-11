/**
 * Verify demo data in database and test API
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const API_BASE_URL = 'http://localhost:3001/api/v1';

async function verifyData() {
  console.log('Verifying demo data in database...\n');

  try {
    // Find our demo category
    const category = await prisma.category.findFirst({
      where: {
        slug: {
          contains: 'smartphones-test'
        }
      }
    });

    // Find our demo product
    const product = await prisma.product.findFirst({
      where: {
        sku: {
          contains: 'PSX-DEMO-TEST'
        }
      },
      include: {
        category: true,
        brand: true
      }
    });

    console.log('Database Verification Results:');
    console.log('========================================\n');

    if (category) {
      console.log('✅ Category Found:');
      console.log(`   ID: ${category.id}`);
      console.log(`   Name: ${category.name}`);
      console.log(`   Slug: ${category.slug}`);
      console.log(`   Description: ${category.description}`);
      console.log(`   Status: ${category.isActive ? 'Active' : 'Inactive'}`);
    } else {
      console.log('❌ Category Not Found');
    }

    console.log('');

    if (product) {
      console.log('✅ Product Found:');
      console.log(`   ID: ${product.id}`);
      console.log(`   Name: ${product.name}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Regular Price: ৳${product.regularPrice}`);
      console.log(`   Sale Price: ৳${product.salePrice}`);
      console.log(`   Stock: ${product.stockQuantity}`);
      console.log(`   Status: ${product.status}`);
      console.log(`   Category: ${product.category.name}`);
      console.log(`   Brand: ${product.brand.name}`);
    } else {
      console.log('❌ Product Not Found');
    }

    // Test API endpoints
    console.log('\n========================================');
    console.log('Testing API Endpoints');
    console.log('========================================\n');

    if (category) {
      try {
        console.log('Testing GET /categories...');
        const categoriesResponse = await axios.get(`${API_BASE_URL}/categories`, {
          timeout: 10000
        });

        console.log(`✅ GET /categories successful (HTTP ${categoriesResponse.status})`);
        console.log(`   Total categories: ${categoriesResponse.data.categories.length}`);

        const demoCatInList = categoriesResponse.data.categories.find(
          c => c.slug === category.slug
        );

        if (demoCatInList) {
          console.log(`   Demo category found in list: ✅`);
        } else {
          console.log(`   Demo category found in list: ❌`);
        }

      } catch (error) {
        console.log(`❌ GET /categories failed: ${error.response?.data?.error || error.message}`);
      }

      try {
        console.log(`\nTesting GET /categories/:id (${category.id})...`);
        const categoryResponse = await axios.get(`${API_BASE_URL}/categories/${category.id}`, {
          timeout: 10000
        });

        console.log(`✅ GET /categories/:id successful (HTTP ${categoryResponse.status})`);
        console.log(`   Category: ${categoryResponse.data.category.name}`);

      } catch (error) {
        console.log(`❌ GET /categories/:id failed: ${error.response?.data?.error || error.message}`);
      }
    }

    if (product) {
      try {
        console.log(`\nTesting GET /products...`);
        const productsResponse = await axios.get(`${API_BASE_URL}/products`, {
          timeout: 10000
        });

        console.log(`✅ GET /products successful (HTTP ${productsResponse.status})`);
        console.log(`   Total products: ${productsResponse.data.products.length}`);

        const demoProdInList = productsResponse.data.products.find(
          p => p.sku === product.sku
        );

        if (demoProdInList) {
          console.log(`   Demo product found in list: ✅`);
        } else {
          console.log(`   Demo product found in list: ❌`);
        }

      } catch (error) {
        console.log(`❌ GET /products failed: ${error.response?.data?.error || error.message}`);
      }

      try {
        console.log(`\nTesting GET /products/:id (${product.id})...`);
        const productResponse = await axios.get(`${API_BASE_URL}/products/${product.id}`, {
          timeout: 10000
        });

        console.log(`✅ GET /products/:id successful (HTTP ${productResponse.status})`);
        console.log(`   Product: ${productResponse.data.product.name}`);
        console.log(`   SKU: ${productResponse.data.product.sku}`);
        console.log(`   Price: ৳${productResponse.data.product.regularPrice}`);

      } catch (error) {
        console.log(`❌ GET /products/:id failed: ${error.response?.data?.error || error.message}`);
      }
    }

    console.log('\n========================================');
    console.log('SUMMARY');
    console.log('========================================\n');

    const apiTests = [
      { name: 'GET /categories', passed: !!category },
      { name: 'GET /categories/:id', passed: !!category },
      { name: 'GET /products', passed: !!product },
      { name: 'GET /products/:id', passed: !!product }
    ];

    const passed = apiTests.filter(t => t.passed).length;
    const failed = apiTests.filter(t => !t.passed).length;

    console.log(`Database: ${category ? '✅' : '❌'} Category created`);
    console.log(`Database: ${product ? '✅' : '❌'} Product created`);
    console.log(`API Tests: ${passed}/${apiTests.length} passed`);
    console.log(`Success Rate: ${((passed / apiTests.length) * 100).toFixed(1)}%`);

    if (passed === apiTests.length) {
      console.log('\n🎉 ALL TESTS PASSED! API is working correctly.');
    } else if (passed > 0) {
      console.log('\n⚠️  SOME TESTS PASSED. Review errors above.');
    } else {
      console.log('\n❌ ALL API TESTS FAILED. Check backend logs and configuration.');
    }

  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyData();
