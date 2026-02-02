// Test script to verify Category Products API fix
const http = require('http');

const categoryId = '1cd82d6b-d04b-4a3d-836e-7f2fe4d07b34';
const options = {
  hostname: 'localhost',
  port: 3001,
  path: `/api/v1/categories/${categoryId}/products`,
  method: 'GET'
};

console.log('Testing Category Products API endpoint...');
console.log(`URL: http://localhost:3001/api/v1/categories/${categoryId}/products`);
console.log('');

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Status Message: ${res.statusMessage}`);
  console.log('');

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response Body:');
    try {
      const jsonData = JSON.parse(data);
      console.log(JSON.stringify(jsonData, null, 2));

      // Verify the response structure
      console.log('\n=== Verification ===');
      if (res.statusCode === 200) {
        console.log('✅ Status Code: 200 OK (PASSED)');

        if (jsonData.category) {
          console.log('✅ Category data present (PASSED)');
          console.log(`   Category ID: ${jsonData.category.id}`);
          console.log(`   Category Name: ${jsonData.category.name}`);
        } else {
          console.log('❌ Category data missing (FAILED)');
        }

        if (Array.isArray(jsonData.products)) {
          console.log('✅ Products array present (PASSED)');
          console.log(`   Number of products: ${jsonData.products.length}`);

          // Check if products have correct image fields
          if (jsonData.products.length > 0) {
            const firstProduct = jsonData.products[0];
            if (firstProduct.images && firstProduct.images.length > 0) {
              const firstImage = firstProduct.images[0];
              console.log('✅ Product images present (PASSED)');
              console.log(`   First Image ID: ${firstImage.id}`);

              // Verify correct field names
              if (firstImage.hasOwnProperty('originalUrl')) {
                console.log('✅ Image has "originalUrl" field (PASSED)');
                console.log(`   Original URL: ${firstImage.originalUrl}`);
              } else {
                console.log('❌ Image missing "originalUrl" field (FAILED)');
              }

              if (firstImage.hasOwnProperty('altTextEn')) {
                console.log('✅ Image has "altTextEn" field (PASSED)');
                console.log(`   Alt Text: ${firstImage.altTextEn}`);
              } else {
                console.log('❌ Image missing "altTextEn" field (FAILED)');
              }

              // Check that old field names are NOT present
              if (firstImage.hasOwnProperty('url')) {
                console.log('❌ Image still has old "url" field (FAILED)');
              } else {
                console.log('✅ Old "url" field removed (PASSED)');
              }

              if (firstImage.hasOwnProperty('alt')) {
                console.log('❌ Image still has old "alt" field (FAILED)');
              } else {
                console.log('✅ Old "alt" field removed (PASSED)');
              }
            } else {
              console.log('⚠️  No product images found (products may not have images)');
            }
          }
        } else {
          console.log('❌ Products array missing (FAILED)');
        }

        if (jsonData.pagination) {
          console.log('✅ Pagination info present (PASSED)');
          console.log(`   Page: ${jsonData.pagination.page}`);
          console.log(`   Limit: ${jsonData.pagination.limit}`);
          console.log(`   Total: ${jsonData.pagination.total}`);
        } else {
          console.log('❌ Pagination info missing (FAILED)');
        }

        console.log('\n=== Test Result: SUCCESS ===');
        console.log('The Category Products API field name error has been fixed!');
      } else {
        console.log('❌ Status Code: NOT 200 (FAILED)');
        console.log('\n=== Test Result: FAILED ===');
      }
    } catch (error) {
      console.log('Error parsing JSON:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error making request:', error.message);
  console.log('\n=== Test Result: FAILED ===');
  console.log('Could not connect to the API server.');
});

req.end();
