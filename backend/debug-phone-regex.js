const { phoneValidationService } = require('./services/phoneValidationService');

console.log('=== Debugging Phone Number Regex ===\n');

const testPhone = '0191 428 7530';
const cleanPhone = testPhone.replace(/[^\d+]/g, '').trim();

console.log(`Original: "${testPhone}"`);
console.log(`Cleaned: "${cleanPhone}"`);
console.log(`Length: ${cleanPhone.length}`);
console.log('');

// Test the mobile patterns
const mobilePatterns = [
  /^\+8801[3-9]\d{8}$/, // International format: +8801XXXXXXXXX
  /^8801[3-9]\d{8}$/, // Without +: 8801XXXXXXXXX
  /^01[3-9]\d{8}$/, // Local format: 01XXXXXXXXX
];

console.log('Testing mobile patterns:');
mobilePatterns.forEach((pattern, index) => {
  const match = pattern.test(cleanPhone);
  console.log(`Pattern ${index + 1}: ${pattern}`);
  console.log(`  Match: ${match}`);
  if (match) {
    console.log(`  ✓ This pattern matches!`);
  }
  console.log('');
});

// Now test with the actual service
console.log('Testing with phoneValidationService:');
const result = phoneValidationService.validateBangladeshPhoneNumber(testPhone);
console.log('isValid:', result.isValid);
console.log('error:', result.error);
console.log('code:', result.code);
