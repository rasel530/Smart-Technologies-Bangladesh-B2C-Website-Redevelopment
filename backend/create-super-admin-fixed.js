/**
 * Script to create a SUPER_ADMIN user in the database
 * Usage: node backend/create-super-admin-fixed.js [password]
 * If no password is provided, a random password will be generated
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
require('dotenv').config();

async function createSuperAdmin(password = null) {
  const prisma = new PrismaClient();

  try {
    console.log('🔐 Connecting to database...');
    
    // Generate password if not provided
    if (!password) {
      password = generateRandomPassword();
      console.log(`📝 Generated password: ${password}`);
    }

    // Hash the password
    console.log('🔒 Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed successfully');

    // Check if super_admin role exists in RBAC roles table (lowercase)
    console.log('🔍 Checking RBAC super_admin role...');
    const superAdminRole = await prisma.roles.findUnique({
      where: { name: 'super_admin' }
    });

    if (!superAdminRole) {
      console.log('❌ RBAC super_admin role not found in roles table');
      console.log('Please ensure RBAC roles are properly set up in the database');
      throw new Error('RBAC super_admin role not found');
    }

    console.log(`✅ Found RBAC super_admin role (ID: ${superAdminRole.id})`);

    // Check if user already exists
    console.log('👤 Checking if SUPER_ADMIN user already exists...');
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test.superadmin@smarttech.com' }
    });

    if (existingUser) {
      console.log('⚠️  User already exists with this email');
      console.log('📧 Existing User Details:');
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   Status: ${existingUser.status}`);
      
      // Check if user has RBAC super_admin role
      const existingUserRole = await prisma.user_roles.findFirst({
        where: {
          user_id: existingUser.id,
          role_id: superAdminRole.id,
          is_active: true
        },
        include: {
          roles: true
        }
      });

      if (existingUserRole) {
        console.log('✅ User already has RBAC super_admin role assigned');
      } else {
        console.log('⚠️  User does not have RBAC super_admin role');
        console.log('Assigning RBAC super_admin role...');
        
        await prisma.user_roles.create({
          data: {
            user_id: existingUser.id,
            role_id: superAdminRole.id,
            assigned_by: existingUser.id, // Self-assignment for initial setup
            is_active: true
          }
        });
        
        console.log('✅ RBAC super_admin role assigned successfully');
      }

      console.log('');
      console.log('🔑 You can login with:');
      console.log(`   Email: test.superadmin@smarttech.com`);
      console.log(`   Password: ${password}`);
      console.log('');
      console.log('🌐 Access the application at: http://localhost:3000');
      return;
    }

    // Create SUPER_ADMIN user
    console.log('👤 Creating SUPER_ADMIN user...');
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: 'test.superadmin@smarttech.com',
        password: passwordHash,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
        status: 'active',
        emailVerified: new Date(),
        phoneVerified: null
      }
    });

    console.log('✅ SUPER_ADMIN user created successfully!');
    console.log('📧 User Details:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Email Verified: ${user.emailVerified}`);

    // Assign RBAC super_admin role
    console.log('🔐 Assigning RBAC super_admin role...');
    const userRole = await prisma.user_roles.create({
      data: {
        user_id: user.id,
        role_id: superAdminRole.id,
        assigned_by: user.id, // Self-assignment for initial setup
        is_active: true
      }
    });

    console.log('✅ RBAC super_admin role assigned successfully!');
    console.log(`   User Role ID: ${userRole.id}`);
    console.log(`   Role ID: ${userRole.role_id}`);
    console.log(`   Assigned By: ${userRole.assigned_by}`);
    console.log(`   Is Active: ${userRole.is_active}`);

    console.log('');
    console.log('🔑 You can now login with:');
    console.log(`   Email: test.superadmin@smarttech.com`);
    console.log(`   Password: ${password}`);
    console.log('');
    console.log('🌐 Access the application at: http://localhost:3000');

  } catch (error) {
    console.error('❌ Error creating SUPER_ADMIN user:', error.message);
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

// Run the script
const passwordArg = process.argv[2];
createSuperAdmin(passwordArg);
