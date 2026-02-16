/**
 * Script to create/update a SUPER_ADMIN user with 100% full access to all permissions
 * Usage: node create-super-admin-full-access.js
 * 
 * This script:
 * 1. Connects to the database using backend services
 * 2. Creates or updates the user with specified credentials
 * 3. Ensures the user has the SUPER_ADMIN role
 * 4. Assigns ALL available permissions to ensure 100% full access
 * 5. Sets the user as active
 */

const { databaseService } = require('./services/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
require('dotenv').config();

// User credentials
const SUPER_ADMIN_EMAIL = 'test.superadmin@smarttech.com';
const SUPER_ADMIN_PASSWORD = 'dpWcQf*YH2mwKSXd';

async function createSuperAdminWithFullAccess() {
  let prisma = null;

  try {
    console.log('🔐 Connecting to database...');
    await databaseService.connect();
    prisma = databaseService.getClient();
    console.log('✅ Database connected successfully\n');

    // Hash the password
    console.log('🔒 Hashing password...');
    const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
    console.log('✅ Password hashed successfully\n');

    // Step 1: Check if SUPER_ADMIN role exists
    console.log('🔍 Checking for SUPER_ADMIN role...');
    let superAdminRole = await prisma.roles.findFirst({
      where: { name: 'SUPER_ADMIN' }
    });

    if (!superAdminRole) {
      console.log('⚠️  SUPER_ADMIN role not found, creating it...');
      superAdminRole = await prisma.roles.create({
        data: {
          id: uuidv4(),
          name: 'SUPER_ADMIN',
          description: 'Super Administrator with full system access',
          hierarchy_level: 1000
        }
      });
      console.log(`✅ SUPER_ADMIN role created (ID: ${superAdminRole.id})\n`);
    } else {
      console.log(`✅ Found SUPER_ADMIN role (ID: ${superAdminRole.id})\n`);
    }

    // Step 2: Get ALL available permissions
    console.log('🔍 Fetching all available permissions...');
    const allPermissions = await prisma.permissions.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }]
    });

    console.log(`✅ Found ${allPermissions.length} permissions\n`);

    // Step 3: Assign ALL permissions to SUPER_ADMIN role
    console.log('🔐 Assigning ALL permissions to SUPER_ADMIN role...');
    let assignedCount = 0;
    
    for (const permission of allPermissions) {
      // Check if permission is already assigned
      const existingAssignment = await prisma.role_permissions.findFirst({
        where: {
          role_id: superAdminRole.id,
          permission_id: permission.id
        }
      });

      if (!existingAssignment) {
        await prisma.role_permissions.create({
          data: {
            id: uuidv4(),
            role_id: superAdminRole.id,
            permission_id: permission.id,
            granted_by: superAdminRole.id, // Self-granted for initial setup
            granted_at: new Date()
          }
        });
        assignedCount++;
        console.log(`   ✓ Assigned: ${permission.resource}:${permission.action} (${permission.name})`);
      }
    }

    if (assignedCount > 0) {
      console.log(`✅ Assigned ${assignedCount} new permissions to SUPER_ADMIN role\n`);
    } else {
      console.log('✅ All permissions already assigned to SUPER_ADMIN role\n');
    }

    // Step 4: Check if user exists
    console.log('👤 Checking if user exists...');
    let user = await prisma.user.findUnique({
      where: { email: SUPER_ADMIN_EMAIL }
    });

    if (user) {
      console.log('⚠️  User already exists, updating...');
      
      // Update user to ensure active status and correct password
      user = await prisma.user.update({
        where: { email: SUPER_ADMIN_EMAIL },
        data: {
          password: passwordHash,
          role: 'super_admin',
          status: 'active',
          emailVerified: user.emailVerified || new Date(),
          firstName: 'Super',
          lastName: 'Admin'
        }
      });

      console.log('✅ User updated successfully');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Status: ${user.status}\n`);
    } else {
      // Create new user
      console.log('👤 Creating new SUPER_ADMIN user...');
      
      user = await prisma.user.create({
        data: {
          id: uuidv4(),
          email: SUPER_ADMIN_EMAIL,
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
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Status: ${user.status}\n`);
    }

    // Step 5: Assign SUPER_ADMIN role to user
    console.log('🔐 Assigning SUPER_ADMIN role to user...');
    let userRole = await prisma.user_roles.findFirst({
      where: {
        user_id: user.id,
        role_id: superAdminRole.id
      }
    });

    if (!userRole) {
      userRole = await prisma.user_roles.create({
        data: {
          id: uuidv4(),
          user_id: user.id,
          role_id: superAdminRole.id,
          assigned_by: user.id, // Self-assignment for initial setup
          is_active: true,
          assigned_at: new Date()
        }
      });
      console.log('✅ SUPER_ADMIN role assigned to user');
    } else {
      // Ensure user role is active
      userRole = await prisma.user_roles.update({
        where: { id: userRole.id },
        data: {
          is_active: true
        }
      });
      console.log('✅ SUPER_ADMIN role already assigned and active');
    }

    console.log(`   User Role ID: ${userRole.id}`);
    console.log(`   Role ID: ${userRole.role_id}`);
    console.log(`   Is Active: ${userRole.is_active}\n`);

    // Step 6: Verify full access
    console.log('🔍 Verifying user has full access...');
    
    // Count role permissions
    const rolePermissionCount = await prisma.role_permissions.count({
      where: { role_id: superAdminRole.id }
    });

    console.log(`✅ SUPER_ADMIN role has ${rolePermissionCount} permissions assigned`);
    console.log(`✅ Total available permissions: ${allPermissions.length}`);
    
    if (rolePermissionCount === allPermissions.length) {
      console.log('✅ User has 100% FULL ACCESS to all permissions!\n');
    } else {
      console.log(`⚠️  User has ${rolePermissionCount}/${allPermissions.length} permissions (${Math.round(rolePermissionCount/allPermissions.length*100)}%)\n`);
    }

    // Final summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 SUPER ADMIN USER SETUP COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('🔑 Login Credentials:');
    console.log(`   Email:    ${SUPER_ADMIN_EMAIL}`);
    console.log(`   Password: ${SUPER_ADMIN_PASSWORD}`);
    console.log('');
    console.log('📊 User Status:');
    console.log(`   ID:      ${user.id}`);
    console.log(`   Status:  ${user.status}`);
    console.log(`   Role:    ${user.role}`);
    console.log('');
    console.log('🔐 Access Level:');
    console.log(`   Role:           SUPER_ADMIN`);
    console.log(`   Permissions:    ${rolePermissionCount}/${allPermissions.length} (100% full access)`);
    console.log(`   Role Active:    Yes`);
    console.log('');
    console.log('🌐 Access the application at: http://localhost:3000');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ Error creating SUPER_ADMIN user:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (prisma) {
      await databaseService.disconnect();
      console.log('\n✅ Database disconnected');
    }
  }
}

// Run the script
createSuperAdminWithFullAccess();
