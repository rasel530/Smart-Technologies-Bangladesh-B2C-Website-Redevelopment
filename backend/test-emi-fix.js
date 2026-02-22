/**
 * Test script to verify EMI "Compare All" fix
 * Tests both UUID and non-UUID plan IDs
 */

const http = require('http');

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Test data - mix of UUID and non-UUID plan IDs
const testPlans = [
  { id: 'city-bank-3m', name: 'City Bank 3 Months (non-UUID)' },
  { id: 'city-bank-6m', name: 'City Bank 6 Months (non-UUID)' },
  { id: 'brac-bank-3m', name: 'BRAC Bank 3 Months (non-UUID)' },
  { id: 'bcdb32cc-a496-4e2c-acb8-30737e0e6880', name: 'City Bank 3 Months (UUID)' },
  { id: '2d1ca102-09dc-4471-989e-44af70983e6d', name: 'City Bank 6 Months (UUID)' }
];

const testAmount = 10000;

function testEmiCalculate(planId, planName) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE_URL}/emi/calculate?amount=${testAmount}&planId=${planId}`;
    
    console.log(`\nTesting: ${planName}`);
    console.log(`URL: ${url}`);
    
    const req = http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`Status: ${res.statusCode}`);
          console.log(`Success: ${response.success}`);
          console.log(`Message: ${response.message}`);
          
          if (response.success && response.data) {
            console.log(`EMI Amount: ${response.data.emiAmount}`);
            console.log(`Duration: ${response.data.duration} months`);
            console.log(`Interest Rate: ${response.data.interestRate}%`);
            console.log(`Total Payable: ${response.data.totalPayable}`);
          }
          
          resolve({ success: response.success, statusCode: res.statusCode });
        } catch (error) {
          console.error(`Error parsing response: ${error.message}`);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`Request error: ${error.message}`);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('EMI "Compare All" Fix Verification Test');
  console.log('='.repeat(60));
  console.log(`\nTest Amount: ${testAmount} BDT`);
  console.log(`Testing ${testPlans.length} plans...\n`);
  
  const results = [];
  
  for (const plan of testPlans) {
    try {
      const result = await testEmiCalculate(plan.id, plan.name);
      results.push({ plan: plan.name, ...result });
    } catch (error) {
      console.error(`\n❌ Test failed for ${plan.name}: ${error.message}`);
      results.push({ plan: plan.name, success: false, error: error.message });
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Test Results Summary');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n✅ All tests passed! The "Compare All" fix is working correctly.');
  } else {
    console.log('\n❌ Some tests failed. Please review the errors above.');
  }
  
  console.log('\n' + '='.repeat(60));
}

runTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
