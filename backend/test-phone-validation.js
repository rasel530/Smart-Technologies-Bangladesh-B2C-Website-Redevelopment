const { phoneValidationService } = require('./services/phoneValidationService');

console.log('=== Phone Number Validation Test ===\n');

const testPhones = [
  '0191 428 7530',
  '01914287530',
  '+8801914287530',
  '8801914287530'
];

testPhones.forEach(phone => {
  console.log(`Testing: "${phone}"`);
  const result = phoneValidationService.validateBangladeshPhoneNumber(phone);
  console.log('Result:', JSON.stringify(result, null, 2));
  console.log('---\n');
});
