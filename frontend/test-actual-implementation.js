// Test actual TypeScript implementation
const { execSync } = require('child_process');
const path = require('path');

const testCases = [
  // Mobile - Original issue
  { phone: '01914287530', expected: 'valid', type: 'mobile', normalized: '+8801914287530' },  
  // Mobile - Other operators
  { phone: '01712345678', expected: 'valid', type: 'mobile', normalized: '+8801712345678' },
  { phone: '+8801812345678', expected: 'valid', type: 'mobile', normalized: '+8801812345678' },
  
  // Landline - 2-digit area codes (Dhaka)
  { phone: '0212345678', expected: 'valid', type: 'landline', normalized: '+880212345678' },
  { phone: '+880212345678', expected: 'valid', type: 'landline', normalized: '+880212345678' },
  
  // Landline - 3-digit area codes
  { phone: '0311234567', expected: 'valid', type: 'landline', normalized: '+880311234567' },
  { phone: '+880311234567', expected: 'valid', type: 'landline', normalized: '+880311234567' },
  { phone: '0411234567', expected: 'valid', type: 'landline', normalized: '+880411234567' },
  { phone: '0511234567', expected: 'valid', type: 'landline', normalized: '+880511234567' },
  { phone: '0611234567', expected: 'valid', type: 'landline', normalized: '+880611234567' },
  { phone: '0711234567', expected: 'valid', type: 'landline', normalized: '+880711234567' },
  { phone: '0811234567', expected: 'valid', type: 'landline', normalized: '+880811234567' },
  { phone: '0911234567', expected: 'valid', type: 'landline', normalized: '+880911234567' },
  
  // Invalid numbers
  { phone: '0191428753', expected: 'invalid' }, // Too short
  { phone: '019142875301', expected: 'invalid' }, // Too long
  { phone: '01234567890', expected: 'invalid' }, // Invalid prefix
];

console.log('=== Testing Actual Implementation ===\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const expectedValid = testCase.expected === 'valid';
  
  // Build test command
  const testCode = `
    const { validateBangladeshPhone } = require('./src/lib/phoneValidation.ts');
    const result = validateBangladeshPhone('${testCase.phone}');
    console.log(JSON.stringify(result));
  `;
  
  try {
    const result = execSync(`node -e "${testCode.replace(/"/g, '\\"')}"`, { 
      encoding: 'utf8',
      cwd: __dirname
    });
    const validation = JSON.parse(result.trim());
    
    const actualValid = validation.isValid;
    let testPassed = true;
    let details = [];

    if (expectedValid !== actualValid) {
      testPassed = false;
      details.push(`Expected ${testCase.expected}, got ${actualValid ? 'valid' : 'invalid'}`);
    }

    if (expectedValid && actualValid) {
      if (testCase.type && validation.type !== testCase.type) {
        testPassed = false;
        details.push(`Expected type ${testCase.type}, got ${validation.type}`);
      }
      if (testCase.normalized && validation.normalizedPhone !== testCase.normalized) {
        testPassed = false;
        details.push(`Expected normalized ${testCase.normalized}, got ${validation.normalizedPhone}`);
      }
    }

    const status = testPassed ? '✓ PASS' : '✗ FAIL';
    if (testPassed) {
      passed++;
    } else {
      failed++;
    }

    console.log(`Test ${index + 1}: ${testCase.phone}`);
    console.log(`  ${status}`);
    if (!testPassed) {
      details.forEach(detail => console.log(`  - ${detail}`));
      if (validation.error) {
        console.log(`  Error: ${validation.error}`);
      }
    }
    console.log('');
  } catch (error) {
    console.log(`Test ${index + 1}: ${testCase.phone}`);
    console.log(`  ✗ FAIL`);
    console.log(`  Error: ${error.message}`);
    console.log('');
    failed++;
  }
});

console.log('=== Summary ===');
console.log(`Total: ${testCases.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n✓ All tests passed! Phone validation is working correctly.');
}
