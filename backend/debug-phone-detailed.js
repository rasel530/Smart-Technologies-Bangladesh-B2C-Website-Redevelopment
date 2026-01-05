const { phoneValidationService } = require('./services/phoneValidationService');

console.log('=== Detailed Phone Validation Debug ===\n');

const testPhone = '0191 428 7530';
const cleanPhone = testPhone.replace(/[^\d+]/g, '').trim();

console.log(`Original: "${testPhone}"`);
console.log(`Cleaned: "${cleanPhone}"`);
console.log('');

// Simulate the validateMobileNumber function
const mobilePatterns = [
  /^\+8801[3-9]\d{8}$/,
  /^8801[3-9]\d{8}$/,
  /^01[3-9]\d{8}$/,
];

console.log('Step 1: Check if mobile pattern matches');
const patternMatch = mobilePatterns.some(pattern => pattern.test(cleanPhone));
console.log(`Pattern match: ${patternMatch}`);
console.log('');

if (patternMatch) {
  console.log('Step 2: Normalize phone number');
  let normalizedPhone = cleanPhone;
  if (cleanPhone.startsWith('01')) {
    normalizedPhone = `+880${cleanPhone}`;
  } else if (cleanPhone.startsWith('880')) {
    normalizedPhone = `+${cleanPhone}`;
  }
  console.log(`Normalized: "${normalizedPhone}"`);
  console.log('');

  console.log('Step 3: Extract operator prefix');
  const prefix = normalizedPhone.substring(3, 6);
  console.log(`Prefix: "${prefix}"`);
  console.log('');

  console.log('Step 4: Check if operator exists');
  const mobileOperators = {
    '013': 'Teletalk',
    '014': 'Banglalink',
    '015': 'Teletalk',
    '016': 'Airtel',
    '017': 'Grameenphone',
    '018': 'Robi',
    '019': 'Banglalink'
  };
  const operator = mobileOperators[prefix];
  console.log(`Operator: ${operator}`);
  console.log('');

  if (!operator) {
    console.log('❌ FAIL: Operator not found!');
  } else {
    console.log('✓ Operator found, should be valid!');
  }
}

console.log('\n=== Testing with actual service ===');
const result = phoneValidationService.validateBangladeshPhoneNumber(testPhone);
console.log('isValid:', result.isValid);
console.log('error:', result.error);
console.log('code:', result.code);
