/**
 * Script to create multiple admin users in the database
 * Usage: node create-multiple-admins.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
require('dotenv').config();

// Admin users to create
const adminUsers = [
  {
    email: 'test.superadmin@smarttech.com',
    password: 'dpWcQf*YH2mwKSXd',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'super_admin',
    rbacRole: 'SUPER_ADMIN'
  },
  {
    email: 'admin@smarttech.com',
    password: 'AdminPassword123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    rbacRole: 'ADMIN'
  },
  {
    email: 'admin2@smarttech.com',
    password: 'Xz@4@GvJA@zLduAb',
    firstName: 'Admin',
    lastName: 'User 2',
    role: 'admin',
    rbacRole: 'ADMIN'
  }
];

async function createMultipleAdmins() {
  const prisma = new PrismaClient();

  try {
    console.log('🔐 Connecting to database...');
    
    // Check if required RBAC roles exist
    console.log('🔍 Checking RBAC roles...');
    const superAdminRole = await prisma.roles.findUnique({
      where: { name: 'SUPER_ADMIN' }
    });

    const adminRole = await prisma.roles.findUnique({
      where: { name: 'ADMIN' }
    });

    if (!superAdminRole) {
      console.log('❌ RBAC SUPER_ADMIN role not found in roles table');
      throw new Error('RBAC SUPER_ADMIN role not found');
    }

    if (!adminRole) {
      console.log('❌ RBAC ADMIN role not found in roles table');
      throw new Error('RBAC ADMIN role not found');
    }

    console.log(`✅ Found RBAC SUPER_ADMIN role (ID: ${superAdminRole.id})`);
    console.log(`✅ Found RBAC ADMIN role (ID: ${adminRole.id})`);

    console.log('');
    console.log('========================================');
    console.log('Creating Admin Users');
    console.log('========================================');

    for (const userData of adminUsers) {
      console.log('');
      console.log(`👤 Processing user: ${userData.email}`);
      console.log('----------------------------------------');

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`⚠️  User already exists with email: ${userData.email}`);
        console.log(`   User ID: ${existingUser.id}`);
        console.log(`   Current Role: ${existingUser.role}`);
        console.log(`   Status: ${existingUser.status}`);
        
        // Get the appropriate RBAC role ID
        const targetRoleId = userData.rbacRole === 'SUPER_ADMIN' ? superAdminRole.id : adminRole.id;
        
        // Check if user has the correct RBAC role
        const existingUserRole = await prisma.user_roles.findFirst({
          where: {
            user_id: existingUser.id,
            role_id: targetRoleId,
            is_active: true
          }
        });

        if (existingUserRole) {
          console.log(`✅ User already has RBAC ${userData.rbacRole} role assigned`);
        } else {
          console.log(`⚠️  User does not have RBAC ${userData.rbacRole} role`);
          console.log(`Assigning RBAC ${userData.rbacRole} role...`);
          
          await prisma.user_roles.create({
            data: {
              user_id: existingUser.id,
              role_id: targetRoleId,
              assigned_by: existingUser.id,
              is_active: true
            }
          });
          
          console.log(`✅ RBAC ${userData.rbacRole} role assigned successfully`);
        }

        continue;
      }

      // Hash the password
      console.log('🔒 Hashing password...');
      const passwordHash = await bcrypt.hash(userData.password, 10);
      console.log('✅ Password hashed successfully');

      // Create user
      console.log('👤 Creating user...');
      const user = await prisma.user.create({
        data: {
          id: uuidv4(),
          email: userData.email,
          password: passwordHash,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          status: 'active',
          emailVerified: new Date(),
          phoneVerified: null
        }
      });

      console.log('✅ User created successfully!');
      console.log(`   User ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);

      // Assign RBAC role
      const targetRoleId = userData.rbacRole === 'SUPER_ADMIN' ? superAdminRole.id : adminRole.id;
      console.log(`🔐 Assigning RBAC ${userData.rbacRole} role...`);
      
      const userRole = await prisma.user_roles.create({
        data: {
          user_id: user.id,
          role_id: targetRoleId,
          assigned_by: user.id,
          is_active: true
        }
      });

      console.log(`✅ RBAC ${userData.rbacRole} role assigned successfully!`);
      console.log(`   User Role ID: ${userRole.id}`);
      console.log(`   Role ID: ${userRole.role_id}`);
    }

    console.log('');
    console.log('========================================');
    console.log('✅ All admin users created successfully!');
    console.log('========================================');
    console.log('');
    console.log('🔑 Login Credentials:');
    console.log('========================================');
    
    for (const userData of adminUsers) {
      console.log('');
      console.log(`📧 ${userData.email}`);
      console.log(`   Role: ${userData.rbacRole}`);
      console.log(`   Password: ${userData.password}`);
    }
    
    console.log('');
    console.log('========================================');
    console.log('🌐 Access the application at: http://localhost:3000');
    console.log('========================================');

  } catch (error) {
    console.error('❌ Error creating admin users:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createMultipleAdmins();
