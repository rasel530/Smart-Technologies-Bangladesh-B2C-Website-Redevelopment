const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🗄️  Smart Technologies Bangladesh - Database Setup Script');
console.log('==================================================');

async function setupDatabase() {
  try {
    console.log('\n📋 Step 1: Installing dependencies...');
    try {
      execSync('npm install', { stdio: 'inherit', cwd: process.cwd() });
      console.log('✅ Dependencies installed successfully');
    } catch (error) {
      console.error('❌ Failed to install dependencies:', error.message);
      process.exit(1);
    }

    console.log('\n🔧 Step 2: Generating Prisma client...');
    try {
      execSync('npx prisma generate', { stdio: 'inherit', cwd: process.cwd() });
      console.log('✅ Prisma client generated successfully');
    } catch (error) {
      console.error('❌ Failed to generate Prisma client:', error.message);
      process.exit(1);
    }

    console.log('\n🗃 Step 3: Pushing database schema...');
    try {
      execSync('npx prisma db push', { stdio: 'inherit', cwd: process.cwd() });
      console.log('✅ Database schema pushed successfully');
    } catch (error) {
      console.error('❌ Failed to push database schema:', error.message);
      console.log('💡 Make sure PostgreSQL is running and DATABASE_URL is correct in .env file');
      process.exit(1);
    }

    console.log('\n🌱 Step 4: Seeding database with initial data...');
    try {
      execSync('node prisma/seed.js', { stdio: 'inherit', cwd: process.cwd() });
      console.log('✅ Database seeded successfully');
    } catch (error) {
      console.error('❌ Failed to seed database:', error.message);
      process.exit(1);
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📊 Database Summary:');
    console.log('   - 15 Core entities implemented');
    console.log('   - Bangladesh-specific address structure');
    console.log('   - Comprehensive relationships and constraints');
    console.log('   - Initial data seeded for testing');
    console.log('   - Admin and test user accounts created');
    
    console.log('\n🔗 Next Steps:');
    console.log('   1. Start the backend server: npm run dev');
    console.log('   2. Test API endpoints: http://localhost:3001/health');
    console.log('   3. Check database status: http://localhost:3001/api/db-status');
    console.log('   4. Open Prisma Studio: npm run db:studio');
    
    console.log('\n👤 Test Accounts:');
    console.log('   Admin: admin@smarttech.com / admin123');
    console.log('   Customer: customer@example.com / customer123');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.log('💡 Please create a .env file with your database configuration:');
  console.log('   DATABASE_URL="postgresql://username:password@localhost:5432/database_name"');
  console.log('   NODE_ENV="development"');
  console.log('   PORT=3001');
  process.exit(1);
}

// Run the setup
setupDatabase();