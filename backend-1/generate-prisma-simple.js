const { execSync } = require('child_process');

console.log('Setting DATABASE_URL and generating Prisma client...');

// Set environment variable
process.env.DATABASE_URL = 'postgresql://smart_dev:smart_dev_password_2024@localhost:5432/smart_ecommerce_dev';

try {
  // Generate Prisma client
  const output = execSync('npx prisma generate', {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
  });
  
  console.log('Prisma client generated successfully!');
} catch (error) {
  console.error('Failed to generate Prisma client:', error.message);
  process.exit(1);
}