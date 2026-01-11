#!/usr/bin/env node

/**
 * Database Migration Runner
 *
 * This script runs Prisma migrations on container startup.
 * It ensures that database schema is always up-to-date.
 *
 * IMPORTANT: This script uses 'migrate deploy' which is safe for production.
 * It only runs migrations that haven't been applied yet and will NOT drop data.
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting database migration process...');
console.log('📅 Timestamp:', new Date().toISOString());

try {
  // Change to backend directory
  process.chdir(path.join(__dirname, '..'));

  console.log('📂 Working directory:', process.cwd());

  // Run Prisma migrations using 'deploy' (safe for production)
  // 'migrate deploy' only runs pending migrations, won't drop data
  console.log('🔄 Running Prisma migrations (safe mode)...');

  const migrateCommand = 'npx prisma migrate deploy';
  console.log('📝 Command:', migrateCommand);

  execSync(migrateCommand, {
    stdio: 'inherit',
    env: {
      ...process.env,
      // Ensure DATABASE_URL is set
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://smart_dev:smart_dev_password_2024@postgres:5432/smart_ecommerce_dev'
    }
  });

  console.log('✅ Database migrations completed successfully!');
  console.log('🎉 Database schema is up to date');

  // Generate Prisma Client
  console.log('🔄 Generating Prisma Client...');
  execSync('npx prisma generate', {
    stdio: 'inherit'
  });

  console.log('✅ Prisma Client generated successfully!');

  // Run seed script if it exists and if database is empty
  console.log('🔄 Checking if database needs seeding...');
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // Check if users table is empty
    const userCount = await prisma.user.count();
    console.log(`📊 Current user count: ${userCount}`);

    if (userCount === 0) {
      console.log('🌱 Database is empty, running seed script...');
      try {
        execSync('node prisma/seed.js', {
          stdio: 'inherit',
          env: {
            ...process.env,
            DATABASE_URL: process.env.DATABASE_URL || 'postgresql://smart_dev:smart_dev_password_2024@postgres:5432/smart_ecommerce_dev'
          }
        });
        console.log('✅ Seed data inserted successfully!');
      } catch (seedError) {
        console.warn('⚠️ Seed script failed or not found:', seedError.message);
        console.log('⚠️ Continuing without seeding...');
      }
    } else {
      console.log('✅ Database already contains data, skipping seed');
    }

    await prisma.$disconnect();
  } catch (checkError) {
    console.warn('⚠️ Could not check database for seeding:', checkError.message);
    console.log('⚠️ Continuing...');
  }

  process.exit(0);

} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.error('📋 Stack trace:', error.stack);
  process.exit(1);
}
