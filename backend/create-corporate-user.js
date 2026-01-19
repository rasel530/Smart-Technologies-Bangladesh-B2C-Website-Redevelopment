/**
 * Script to add an existing user to a corporate account with a specific role
 * Usage: node backend/create-corporate-user.js <corporateAccountId> <userId> <role> [expiresAt]
 * 
 * Examples:
 *   node backend/create-corporate-user.js 550e8400-e29b-41d4-a716-446655440000 123e4567-e89b-12d3-a456-426614174000 admin
 *   node backend/create-corporate-user.js 550e8400-e29b-41d4-a716-446655440000 123e4567-e89b-12d3-a456-426614174000 requester "2026-12-31"
 *   node backend/create-corporate-user.js 550e8400-e29b-41d4-a716-446655440000 123e4567-e89b-12d3-a456-426614174000 approver
 */

const { PrismaClient } = require('@prisma/client');

// Load environment variables
require('dotenv').config();

async function createCorporateUser(corporateAccountId, userId, role, expiresAt = null) {
  const prisma = new PrismaClient();

  try {
    console.log('🔐 Connecting to database...');

    // Validate corporate account ID
    if (!corporateAccountId) {
      console.error('❌ Corporate Account ID is required');
      console.log('Usage: node backend/create-corporate-user.js <corporateAccountId> <userId> <role> [expiresAt]');
      process.exit(1);
    }

    // Validate user ID
    if (!userId) {
      console.error('❌ User ID is required');
      console.log('Usage: node backend/create-corporate-user.js <corporateAccountId> <userId> <role> [expiresAt]');
      process.exit(1);
    }

    // Validate role
    const validRoles = ['requester', 'approver', 'admin'];
    if (!role || !validRoles.includes(role.toLowerCase())) {
      console.error('❌ Invalid role. Valid roles are: requester, approver, admin');
      console.log('Usage: node backend/create-corporate-user.js <corporateAccountId> <userId> <role> [expiresAt]');
      process.exit(1);
    }

    const normalizedRole = role.toLowerCase();

    // Check if corporate account exists
    console.log('🔍 Checking corporate account...');
    const corporateAccount = await prisma.corporateAccount.findUnique({
      where: { id: corporateAccountId },
      include: {
        users_corporate_accounts_user_idTousers: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!corporateAccount) {
      console.log('❌ Corporate account not found');
      console.log(`   Corporate Account ID: ${corporateAccountId}`);
      throw new Error('Corporate account not found');
    }

    console.log('✅ Corporate account found');
    console.log(`   Company Name: ${corporateAccount.company_name}`);
    console.log(`   Account Status: ${corporateAccount.account_status}`);
    console.log(`   Account Manager: ${corporateAccount.users_corporate_accounts_user_idTousers.firstName} ${corporateAccount.users_corporate_accounts_user_idTousers.lastName}`);

    // Check if user exists
    console.log('👤 Checking user...');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true
      }
    });

    if (!user) {
      console.log('❌ User not found');
      console.log(`   User ID: ${userId}`);
      throw new Error('User not found');
    }

    console.log('✅ User found');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);

    // Check if user is already assigned to this corporate account
    console.log('🔍 Checking existing corporate user assignment...');
    const existingCorporateUser = await prisma.corporateUser.findFirst({
      where: {
        corporate_account_id: corporateAccountId,
        user_id: userId,
        is_active: true
      }
    });

    if (existingCorporateUser) {
      console.log('⚠️  User is already assigned to this corporate account');
      console.log('📊 Existing Assignment Details:');
      console.log(`   Corporate User ID: ${existingCorporateUser.id}`);
      console.log(`   Role: ${existingCorporateUser.role}`);
      console.log(`   Is Active: ${existingCorporateUser.is_active}`);
      console.log(`   Assigned At: ${existingCorporateUser.assigned_at}`);
      console.log(`   Expires At: ${existingCorporateUser.expires_at || 'Never'}`);

      console.log('');
      console.log('💡 To update the role, you can:');
      console.log('   1. Remove the existing assignment first');
      console.log('   2. Add the user again with the new role');
      return;
    }

    // Parse expiration date if provided
    let expiresAtDate = null;
    if (expiresAt) {
      expiresAtDate = new Date(expiresAt);
      if (isNaN(expiresAtDate.getTime())) {
        console.error('❌ Invalid expiration date format');
        console.log('Please use ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ');
        process.exit(1);
      }

      if (expiresAtDate <= new Date()) {
        console.error('❌ Expiration date must be in the future');
        process.exit(1);
      }

      console.log(`📅 Expiration date: ${expiresAtDate.toISOString()}`);
    } else {
      console.log('📅 No expiration date (permanent assignment)');
    }

    // Create corporate user assignment
    console.log('👥 Adding user to corporate account...');
    const corporateUser = await prisma.corporateUser.create({
      data: {
        corporate_account_id: corporateAccountId,
        user_id: userId,
        role: normalizedRole,
        is_active: true,
        assigned_at: new Date(),
        expires_at: expiresAtDate
      }
    });

    console.log('✅ Corporate user assignment created successfully!');
    console.log('📊 Assignment Details:');
    console.log(`   Corporate User ID: ${corporateUser.id}`);
    console.log(`   Corporate Account ID: ${corporateUser.corporate_account_id}`);
    console.log(`   User ID: ${corporateUser.user_id}`);
    console.log(`   Role: ${corporateUser.role}`);
    console.log(`   Is Active: ${corporateUser.is_active}`);
    console.log(`   Assigned At: ${corporateUser.assigned_at.toISOString()}`);
    console.log(`   Expires At: ${corporateUser.expires_at ? corporateUser.expires_at.toISOString() : 'Never'}`);

    console.log('');
    console.log('🎉 User has been successfully added to the corporate account!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   Company: ${corporateAccount.company_name}`);
    console.log(`   User: ${user.email} (${user.firstName} ${user.lastName})`);
    console.log(`   Corporate Role: ${normalizedRole}`);
    console.log(`   Access Type: ${expiresAtDate ? 'Temporary (expires ' + expiresAtDate.toLocaleDateString() + ')' : 'Permanent'}`);

  } catch (error) {
    console.error('❌ Error creating corporate user:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const corporateAccountId = args[0];
const userId = args[1];
const role = args[2];
const expiresAt = args[3];

// Show usage if no arguments provided
if (!corporateAccountId || !userId || !role) {
  console.log('====================================');
  console.log('  Corporate User Creation Script');
  console.log('====================================');
  console.log('');
  console.log('Usage: node backend/create-corporate-user.js <corporateAccountId> <userId> <role> [expiresAt]');
  console.log('');
  console.log('Arguments:');
  console.log('  corporateAccountId - Required. Corporate account UUID');
  console.log('  userId           - Required. User UUID to add to corporate account');
  console.log('  role             - Required. Corporate role: requester, approver, or admin');
  console.log('  expiresAt        - Optional. Expiration date (ISO 8601 format)');
  console.log('');
  console.log('Corporate Roles:');
  console.log('  requester - Can create and manage purchase requests');
  console.log('  approver  - Can approve purchase requests');
  console.log('  admin     - Full administrative access to corporate account');
  console.log('');
  console.log('Examples:');
  console.log('  node backend/create-corporate-user.js 550e8400-e29b-41d4-a716-446655440000 123e4567-e89b-12d3-a456-426614174000 admin');
  console.log('  node backend/create-corporate-user.js 550e8400-e29b-41d4-a716-446655440000 123e4567-e89b-12d3-a456-426614174000 requester "2026-12-31"');
  console.log('  node backend/create-corporate-user.js 550e8400-e29b-41d4-a716-446655440000 123e4567-e89b-12d3-a456-426614174000 approver "2026-06-30T23:59:59Z"');
  console.log('');
  process.exit(0);
}

// Run the script
createCorporateUser(corporateAccountId, userId, role, expiresAt);
