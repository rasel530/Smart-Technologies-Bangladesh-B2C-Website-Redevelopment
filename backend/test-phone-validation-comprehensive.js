const { phoneValidationService } = require('./services/phoneValidationService');

console.log('=== Comprehensive Phone Number Validation Test ===\n');

const testCases = [
  // Mobile numbers with spaces
  { phone: '0191 428 7530', expected: true, type: 'mobile', operator: 'Banglalink' },
  { phone: '0171 234 5678', expected: true, type: 'mobile', operator: 'Grameenphone' },
  { phone: '0181 234 5678', expected: true, type: 'mobile', operator: 'Robi' },
  { phone: '0161 234 5678', expected: true, type: 'mobile', operator: 'Airtel' },
  
  // Mobile numbers without spaces
  { phone: '01914287530', expected: true, type: 'mobile', operator: 'Banglalink' },
  { phone: '01712345678', expected: true, type: 'mobile', operator: 'Grameenphone' },
  
  // International format
  { phone: '+8801914287530', expected: true, type: 'mobile', operator: 'Banglalink' },
  { phone: '+8801712345678', expected: true, type: 'mobile', operator: 'Grameenphone' },
  
  // Country code format
  { phone: '8801914287530', expected: true, type: 'mobile', operator: 'Banglalink' },
  { phone: '8801712345678', expected: true, type: 'mobile', operator: 'Grameenphone' },
  
  // Landline numbers with spaces
  { phone: '02 1234 5678', expected: true, type: 'landline', area: 'Dhaka' },
  { phone: '031 123 4567', expected: true, type: 'landline', area: 'Chittagong' },
  
  // Landline numbers without spaces
  { phone: '0212345678', expected: true, type: 'landline', area: 'Dhaka' },
  { phone: '0311234567', expected: true, type: 'landline', area: 'Chittagong' },
  
  // International landline
  { phone: '+880212345678', expected: true, type: 'landline', area: 'Dhaka' },
  { phone: '+880311234567', expected: true, type: 'landline', area: 'Chittagong' },
  
  // Invalid numbers
  { phone: '0191 428 753', expected: false, type: 'invalid' },
  { phone: '1234567890', expected: false, type: 'invalid' },
  { phone: '01234567890', expected: false, type: 'invalid' },
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = phoneValidationService.validateBangladeshPhoneNumber(test.phone);
  const status = result.isValid === test.expected ? '✅ PASS' : '❌ FAIL';
  
  if (result.isValid === test.expected) {
    passed++;
  } else {
    failed++;
  }
  
  console.log(`Test ${index + 1}: ${test.phone}`);
  console.log(`  Status: ${status}`);
  console.log(`  Expected: ${test.expected}, Got: ${result.isValid}`);
  
  if (result.isValid) {
    console.log(`  Type: ${result.type}`);
    if (result.operator) console.log(`  Operator: ${result.operator}`);
    if (result.areaInfo) console.log(`  Area: ${result.areaInfo.area}`);
    console.log(`  Normalized: ${result.normalizedPhone}`);
  } else {
    console.log(`  Error: ${result.error}`);
  }
  console.log('');
});

console.log('=== Summary ===');
console.log(`Total: ${testCases.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(2)}%`);
