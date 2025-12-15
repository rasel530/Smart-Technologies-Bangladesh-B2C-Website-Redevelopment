const { execSync } = require('child_process');

console.log('Setting DATABASE_URL and generating Prisma client...');

// Set environment variable
process.env.DATABASE_URL = 'postgresql://smart_dev:smart_dev_password_2024@localhost:5432/smart_ecommerce_dev';

// Generate Prisma client
const { execSync } = require('child_process');
const result = execSync('npx prisma generate', { stdio: 'inherit' });

if (result.error) {
  console.error('Failed to generate Prisma client:', result.error);
  process.exit(1);
}

console.log('Prisma client generated successfully!');
console.log('Generated files:');
console.log(result.stdout);