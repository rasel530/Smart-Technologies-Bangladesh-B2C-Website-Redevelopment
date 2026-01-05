// Detailed debug for regex patterns
const LANDLINE_AREA_CODES = {
  '02': { area: 'Dhaka', region: 'Central' },
  '031': { area: 'Chittagong', region: 'Southeast' },
  '041': { area: 'Khulna', region: 'Southwest' },
  '051': { area: 'Rajshahi', region: 'Northwest' },
  '061': { area: 'Sylhet', region: 'Northeast' },
  '071': { area: 'Barisal', region: 'South' },
  '081': { area: 'Rangpur', region: 'North' },
  '091': { area: 'Mymensingh', region: 'North-central' }
};

const validAreaCodes = Object.keys(LANDLINE_AREA_CODES);
const twoDigitAreaCodes = validAreaCodes.filter(code => code.length === 2);
const threeDigitAreaCodes = validAreaCodes.filter(code => code.length === 3);

const twoDigitPattern = twoDigitAreaCodes.join('|');
const threeDigitPattern = threeDigitAreaCodes.join('|');

console.log('Area Codes:');
console.log('2-digit pattern:', twoDigitPattern);
console.log('3-digit pattern:', threeDigitPattern);
console.log('');

const landlinePatterns = [
  new RegExp(`^\\+880(${twoDigitPattern})[1-9]\\d{7}$`), // 2-digit: 7 digits after area code = 10 total after +880
  new RegExp(`^\\+880(${threeDigitPattern})[1-9]\\d{6}$`), // 3-digit: 6 digits after area code = 10 total after +880
  new RegExp(`^880(${twoDigitPattern})[1-9]\\d{7}$`), // 2-digit: 7 digits after area code = 10 total after 880
  new RegExp(`^880(${threeDigitPattern})[1-9]\\d{6}$`), // 3-digit: 6 digits after area code = 10 total after 880
  new RegExp(`^(${twoDigitPattern})[1-9]\\d{7}$`), // 2-digit: 7 digits after area code = 10 total
  new RegExp(`^(${threeDigitPattern})[1-9]\\d{6}$`), // 3-digit: 6 digits after area code = 10 total
];

console.log('Regex Patterns:');
landlinePatterns.forEach((pattern, index) => {
  console.log(`Pattern ${index + 1}:`, pattern.toString());
});
console.log('');

const testPhones = [
  '0212345678',
  '+880212345678',
  '0311234567',
  '+880311234567',
];

console.log('Testing patterns:');
testPhones.forEach(phone => {
  console.log(`\nPhone: ${phone} (length: ${phone.length})`);
  landlinePatterns.forEach((pattern, index) => {
    const matches = pattern.test(phone);
    console.log(`  Pattern ${index + 1}: ${matches ? '✓' : '✗'}`);
    if (matches) {
      const match = phone.match(pattern);
      if (match) {
        console.log(`    Match groups: ${match.slice(1).join(', ')}`);
      }
    }
  });
});
