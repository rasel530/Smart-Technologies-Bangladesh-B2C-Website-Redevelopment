const { phoneValidationService } = require('./services/phoneValidationService');

console.log('=== Debug Landline Regex Patterns ===\n');

// Get the landline area codes
const validAreaCodes = Object.keys(phoneValidationService.landlineAreaCodes);
const twoDigitAreaCodes = validAreaCodes.filter(code => code.length === 2);
const threeDigitAreaCodes = validAreaCodes.filter(code => code.length === 3);

console.log('Valid area codes:', validAreaCodes);
console.log('2-digit area codes:', twoDigitAreaCodes);
console.log('3-digit area codes:', threeDigitAreaCodes);
console.log('');

// Create regex patterns
const twoDigitPattern = twoDigitAreaCodes.join('|');
const threeDigitPattern = threeDigitAreaCodes.join('|');

console.log('Two digit pattern:', twoDigitPattern);
console.log('Three digit pattern:', threeDigitPattern);
console.log('');

// Create the regex patterns
const patterns = [
  new RegExp(`^\\+880(${twoDigitPattern})[1-9]\\d{7}$`),
  new RegExp(`^\\+880(${threeDigitPattern})[1-9]\\d{6}$`),
];

console.log('Pattern 1 (2-digit):', patterns[0]);
console.log('Pattern 2 (3-digit):', patterns[1]);
console.log('');

// Test the patterns
const testNumbers = [
  '+880212345678',
  '+880311234567',
  '880212345678',
  '880311234567',
  '0212345678',
  '0311234567'
];

testNumbers.forEach(num => {
  console.log(`Testing "${num}":`);
  console.log(`  Pattern 1 match: ${patterns[0].test(num)}`);
  console.log(`  Pattern 2 match: ${patterns[1].test(num)}`);
  console.log('');
});
