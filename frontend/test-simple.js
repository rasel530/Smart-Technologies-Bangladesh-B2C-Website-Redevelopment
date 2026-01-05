// Simple test using actual implementation
const { execSync } = require('child_process');

const testPhone = '01914287530';

const testCode = `
  const { validateBangladeshPhone } = require('./src/lib/phoneValidation.ts');
  const result = validateBangladeshPhone('${testPhone}');
  console.log(JSON.stringify(result, null, 2));
`;

try {
  const result = execSync(`node -e "${testCode.replace(/"/g, '\\"')}"`, { 
    encoding: 'utf8',
    cwd: __dirname
  });
  console.log('Result:', result.trim());
} catch (error) {
  console.log('Error:', error.message);
}
