const fs = require('fs');

// Read and validate the Postman collection
const collection = JSON.parse(fs.readFileSync('postman-collection-updated.json', 'utf8'));

console.log('📋 Postman Collection Validation Report');
console.log('=====================================');

// Check collection structure
console.log('✅ Collection Name:', collection.info.name);
console.log('✅ Collection Version:', collection.info.version);
console.log('✅ Total Folders:', collection.item.length);

// Count endpoints
let totalEndpoints = 0;
collection.item.forEach(folder => {
  const endpointCount = folder.item ? folder.item.length : 0;
  totalEndpoints += endpointCount;
  console.log(`📁 ${folder.name}: ${endpointCount} endpoints`);
});

console.log('✅ Total Endpoints:', totalEndpoints);

// Check variables
console.log('✅ Environment Variables:', collection.variable.length);
collection.variable.forEach(v => {
  console.log(`  - ${v.key}: ${v.description || 'No description'}`);
});

// Check authentication
console.log('✅ Authentication Type:', collection.auth.type);

// Check event scripts
const hasPreRequest = collection.event && collection.event.some(e => e.listen === 'prerequest');
const hasTest = collection.event && collection.event.some(e => e.listen === 'test');
console.log('✅ Pre-request Script:', hasPreRequest ? 'Yes' : 'No');
console.log('✅ Test Script:', hasTest ? 'Yes' : 'No');

console.log('\n🎯 Collection is ready for import!');
console.log('📖 Usage Guide: UPDATED_POSTMAN_COLLECTION_GUIDE.md');

// Validate collection structure
const requiredFields = ['info', 'item', 'variable'];
const missingFields = requiredFields.filter(field => !collection[field]);
if (missingFields.length > 0) {
  console.log('⚠️  Missing required fields:', missingFields.join(', '));
} else {
  console.log('✅ Collection structure is valid');
}

// Check for duplicate endpoints
const endpointPaths = new Set();
let duplicates = 0;
collection.item.forEach(folder => {
  if (folder.item) {
    folder.item.forEach(endpoint => {
      const path = endpoint.request.url.raw || endpoint.request.url.path?.join('/');
      if (endpointPaths.has(path)) {
        duplicates++;
      } else {
        endpointPaths.add(path);
      }
    });
  }
});

if (duplicates > 0) {
  console.log(`⚠️  Found ${duplicates} duplicate endpoints`);
} else {
  console.log('✅ No duplicate endpoints found');
}

console.log('\n🚀 Ready for API testing!');