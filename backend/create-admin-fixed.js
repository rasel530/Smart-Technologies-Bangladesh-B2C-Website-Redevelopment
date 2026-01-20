/**
 * Script to create an ADMIN user in the database
 * Usage: node backend/create-admin-fixed.js <email> <password> <firstName> <lastName>
 * 
 * Examples:
 *   node backend/create-admin-fixed.js admin@smarttech.com AdminPassword123 "John" "Doe"
 *   node backend/create-admin-fixed.js admin@smarttech.com (auto-generates password)
 *   node backend/create-admin-fixed.js admin@smarttech.com MyPassword123 "Admin" "User"
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
require('dotenv').config();

async function createAdmin(email, password = null, firstName = 'Admin', lastName = 'User') {
  const prisma = new PrismaClient();

  try {
    console.log('🔐 Connecting to database...');

    // Validate email
    if (!email || !email.includes('@')) {
      console.error('❌ Invalid email address');
      console.log('Usage: node backend/create-admin-fixed.js <email> [password] [firstName] [lastName]');
      console.log('Example: node backend/create-admin-fixed.js admin@smarttech.com AdminPassword123 "John" "Doe"');
      process.exit(1);
    }

    // Generate password if not provided
    if (!password) {
      password = generateRandomPassword();
      console.log(`📝 Generated password: ${password}`);
    }

    // Validate password strength
    if (password.length < 8) {
      console.error('❌ Password must be at least 8 characters long');
      process.exit(1);
    }

    // Hash password
    console.log('🔒 Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed successfully');

    // Check if admin role exists in RBAC roles table (lowercase)
    console.log('🔍 Checking RBAC admin role...');
    const adminRole = await prisma.roles.findUnique({
      where: { name: 'admin' }
    });

    if (!adminRole) {
      console.log('❌ RBAC admin role not found in roles table');
      console.log('Please ensure RBAC roles are properly set up in the database');
      throw new Error('RBAC admin role not found');
    }

    console.log(`✅ Found RBAC admin role (ID: ${adminRole.id})`);

    // Check if user already exists
    console.log('👤 Checking if user already exists...');
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('⚠️  User already exists with this email');
      console.log('📧 Existing User Details:');
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   Status: ${existingUser.status}`);
      
      // Check if user has RBAC admin role
      const existingUserRole = await prisma.user_roles.findFirst({
        where: {
          user_id: existingUser.id,
          role_id: adminRole.id,
          is_active: true
        }
      });

      if (existingUserRole) {
        console.log('✅ User already has RBAC admin role assigned');
      } else {
        console.log('⚠️  User does not have RBAC admin role');
        console.log('Assigning RBAC admin role...');
        
        await prisma.user_roles.create({
          data: {
            user_id: existingUser.id,
            role_id: adminRole.id,
            assigned_by: existingUser.id,
            is_active: true
          }
        });
        
        console.log('✅ RBAC admin role assigned successfully');
      }

      console.log('');
      console.log('🔑 You can login with:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      console.log('');
      console.log('🌐 Access the application at: http://localhost:3000');
      return;
    }

    // Create ADMIN user
    console.log('👤 Creating ADMIN user...');
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: email,
        password: passwordHash,
        firstName: firstName,
        lastName: lastName,
        role: 'admin',
        status: 'active',
        emailVerified: new Date(),
        phoneVerified: null
      }
    });

    console.log('✅ ADMIN user created successfully!');
    console.log('📧 User Details:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Email Verified: ${user.emailVerified}`);

    // Assign RBAC admin role
    console.log('🔐 Assigning RBAC admin role...');
    const userRole = await prisma.user_roles.create({
      data: {
        user_id: user.id,
        role_id: adminRole.id,
        assigned_by: user.id, // Self-assignment for initial setup
        is_active: true
      }
    });

    console.log('✅ RBAC admin role assigned successfully!');
    console.log(`   User Role ID: ${userRole.id}`);
    console.log(`   Role ID: ${userRole.role_id}`);
    console.log(`   Assigned By: ${userRole.assigned_by}`);
    console.log(`   Is Active: ${userRole.is_active}`);

    console.log('');
    console.log('🔑 You can now login with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('');
    console.log('🌐 Access the application at: http://localhost:3000');

  } catch (error) {
    console.error('❌ Error creating ADMIN user:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

function generateRandomPassword() {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

// Parse command line arguments
const args = process.argv.slice(2);
const email = args[0];
const password = args[1];
const firstName = args[2];
const lastName = args[3];

// Show usage if no arguments provided
if (!email) {
  console.log('====================================');
  console.log('  Admin User Creation Script');
  console.log('====================================');
  console.log('');
  console.log('Usage: node backend/create-admin-fixed.js <email> [password] [firstName] [lastName]');
  console.log('');
  console.log('Arguments:');
  console.log('  email      - Required. User email address');
  console.log('  password   - Optional. User password (auto-generated if not provided)');
  console.log('  firstName  - Optional. User first name (default: "Admin")');
  console.log('  lastName   - Optional. User last name (default: "User")');
  console.log('');
  console.log('Examples:');
  console.log('  node backend/create-admin-fixed.js admin@smarttech.com AdminPassword123 "John" "Doe"');
  console.log('  node backend/create-admin-fixed.js admin@smarttech.com MyPassword123');
  console.log('  node backend/create-admin-fixed.js admin@smarttech.com');
  console.log('');
  process.exit(0);
}

// Run the script
createAdmin(email, password, firstName, lastName);
