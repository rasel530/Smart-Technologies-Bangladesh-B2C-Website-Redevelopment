/**
 * Diagnostic Script for Corporate Account 403 Forbidden Error
 * 
 * This script investigates why a user is getting 403 Forbidden errors
 * when trying to access a corporate account.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnoseCorporateAccess() {
  console.log('='.repeat(80));
  console.log('CORPORATE ACCOUNT 403 FORBIDDEN ERROR DIAGNOSIS');
  console.log('='.repeat(80));
  console.log();

  const corporateAccountId = '5a5eaca8-37a7-4115-9e8d-c9577c6c9333';
  const userId = '95c63e45-4e91-4a90-93c3-5d9f1f0c0892';

  try {
    // ========================================================================
    // 1. CHECK CORPORATE ACCOUNT EXISTENCE
    // ========================================================================
    console.log('1. CHECKING CORPORATE ACCOUNT EXISTENCE');
    console.log('-'.repeat(80));
    
    const corporateAccount = await prisma.corporateAccount.findUnique({
      where: { id: corporateAccountId },
      include: {
        users_corporate_accounts_user_idTousers: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        users_corporate_accounts_account_manager_idTousers: {
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
      console.log('❌ Corporate account NOT found in database');
      console.log(`   Account ID: ${corporateAccountId}`);
    } else {
      console.log('✅ Corporate account found in database');
      console.log(`   Account ID: ${corporateAccount.id}`);
      console.log(`   Company Name: ${corporateAccount.companyName}`);
      console.log(`   Company Registration Number: ${corporateAccount.companyRegistrationNumber}`);
      console.log(`   Account Status: ${corporateAccount.accountStatus}`);
      console.log(`   Verification Status: ${corporateAccount.verificationStatus}`);
      console.log(`   Owner User ID: ${corporateAccount.userId}`);
      console.log(`   Account Manager ID: ${corporateAccount.accountManagerId || 'None'}`);
      console.log(`   Created At: ${corporateAccount.createdAt}`);
      console.log(`   Updated At: ${corporateAccount.updatedAt}`);
      
      if (corporateAccount.users_corporate_accounts_user_idTousers) {
        console.log(`   Owner User Email: ${corporateAccount.users_corporate_accounts_user_idTousers.email}`);
        console.log(`   Owner User Role: ${corporateAccount.users_corporate_accounts_user_idTousers.role}`);
      }
      
      if (corporateAccount.users_corporate_accounts_account_manager_idTousers) {
        console.log(`   Account Manager Email: ${corporateAccount.users_corporate_accounts_account_manager_idTousers.email}`);
      }
    }
    console.log();

    // ========================================================================
    // 2. CHECK USER EXISTENCE
    // ========================================================================
    console.log('2. CHECKING USER EXISTENCE');
    console.log('-'.repeat(80));
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        accountStatus: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      console.log('❌ User NOT found in database');
      console.log(`   User ID: ${userId}`);
    } else {
      console.log('✅ User found in database');
      console.log(`   User ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Account Status: ${user.accountStatus}`);
      console.log(`   Created At: ${user.createdAt}`);
      console.log(`   Updated At: ${user.updatedAt}`);
    }
    console.log();

    // ========================================================================
    // 3. CHECK USER-CORPORATE ACCOUNT RELATIONSHIP (OWNER)
    // ========================================================================
    console.log('3. CHECKING USER-CORPORATE ACCOUNT RELATIONSHIP (OWNER)');
    console.log('-'.repeat(80));
    
    if (corporateAccount && user) {
      const isOwner = corporateAccount.userId === userId;
      console.log(`   Corporate Account Owner ID: ${corporateAccount.userId}`);
      console.log(`   Current User ID: ${userId}`);
      console.log(`   Is User the Owner? ${isOwner ? '✅ YES' : '❌ NO'}`);
      
      if (!isOwner) {
        console.log(`   ⚠️  User is NOT the owner of this corporate account`);
        console.log(`   ⚠️  This is likely causing the 403 Forbidden error`);
      }
    } else {
      console.log('⚠️  Cannot check relationship - missing corporate account or user');
    }
    console.log();

    // ========================================================================
    // 4. CHECK CORPORATE_USERS TABLE
    // ========================================================================
    console.log('4. CHECKING CORPORATE_USERS TABLE');
    console.log('-'.repeat(80));
    
    const corporateUsers = await prisma.corporateUser.findMany({
      where: {
        corporateAccountId: corporateAccountId
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    if (corporateUsers.length === 0) {
      console.log('❌ No users found in corporate_users table for this corporate account');
    } else {
      console.log(`✅ Found ${corporateUsers.length} user(s) in corporate_users table:`);
      corporateUsers.forEach((cu, index) => {
        console.log(`   [${index + 1}] Corporate User ID: ${cu.id}`);
        console.log(`       User ID: ${cu.userId}`);
        console.log(`       User Email: ${cu.users.email}`);
        console.log(`       User Name: ${cu.users.firstName} ${cu.users.lastName}`);
        console.log(`       User Role (in system): ${cu.users.role}`);
        console.log(`       Corporate Role: ${cu.role}`);
        console.log(`       Is Active: ${cu.isActive}`);
        console.log(`       Assigned At: ${cu.assignedAt}`);
        console.log(`       Expires At: ${cu.expiresAt || 'Never'}`);
        
        if (cu.userId === userId) {
          console.log(`       ✅ THIS IS THE CURRENT USER`);
        }
        console.log();
      });
    }
    console.log();

    // ========================================================================
    // 5. CHECK IF USER IS IN CORPORATE_USERS
    // ========================================================================
    console.log('5. CHECKING IF USER IS IN CORPORATE_USERS TABLE');
    console.log('-'.repeat(80));
    
    const userCorporateEntry = await prisma.corporateUser.findFirst({
      where: {
        corporateAccountId: corporateAccountId,
        userId: userId
      }
    });

    if (!userCorporateEntry) {
      console.log('❌ User is NOT in corporate_users table for this corporate account');
      console.log(`   User ID: ${userId}`);
      console.log(`   Corporate Account ID: ${corporateAccountId}`);
      console.log('   ⚠️  This is causing the 403 Forbidden error');
    } else {
      console.log('✅ User found in corporate_users table');
      console.log(`   Corporate User ID: ${userCorporateEntry.id}`);
      console.log(`   User ID: ${userCorporateEntry.userId}`);
      console.log(`   Corporate Account ID: ${userCorporateEntry.corporateAccountId}`);
      console.log(`   Role: ${userCorporateEntry.role}`);
      console.log(`   Is Active: ${userCorporateEntry.isActive}`);
      console.log(`   Assigned At: ${userCorporateEntry.assignedAt}`);
      console.log(`   Expires At: ${userCorporateEntry.expiresAt || 'Never'}`);
      
      if (!userCorporateEntry.isActive) {
        console.log('   ⚠️  User is NOT ACTIVE - this will cause 403 Forbidden');
      }
      
      if (userCorporateEntry.expiresAt && new Date(userCorporateEntry.expiresAt) < new Date()) {
        console.log('   ⚠️  User access has EXPIRED - this will cause 403 Forbidden');
      }
    }
    console.log();

    // ========================================================================
    // 6. CHECK USER'S CORPORATE ACCOUNTS (ALL)
    // ========================================================================
    console.log('6. CHECKING ALL CORPORATE ACCOUNTS ASSOCIATED WITH USER');
    console.log('-'.repeat(80));
    
    const userCorporateAccounts = await prisma.corporateAccount.findMany({
      where: { userId: userId },
      select: {
        id: true,
        companyName: true,
        accountStatus: true,
        verificationStatus: true,
        createdAt: true
      }
    });

    if (userCorporateAccounts.length === 0) {
      console.log('❌ User does NOT own any corporate accounts');
      console.log(`   User ID: ${userId}`);
    } else {
      console.log(`✅ User owns ${userCorporateAccounts.length} corporate account(s):`);
      userCorporateAccounts.forEach((account, index) => {
        console.log(`   [${index + 1}] Account ID: ${account.id}`);
        console.log(`       Company Name: ${account.companyName}`);
        console.log(`       Account Status: ${account.accountStatus}`);
        console.log(`       Verification Status: ${account.verificationStatus}`);
        console.log(`       Created At: ${account.createdAt}`);
        
        if (account.id === corporateAccountId) {
          console.log(`       ✅ THIS IS THE ACCOUNT BEING ACCESSED`);
        }
        console.log();
      });
    }
    console.log();

    // ========================================================================
    // 7. DIAGNOSIS SUMMARY
    // ========================================================================
    console.log('='.repeat(80));
    console.log('DIAGNOSIS SUMMARY');
    console.log('='.repeat(80));
    console.log();
    
    console.log('Authorization Logic in checkCorporateAccess middleware:');
    console.log('  1. Check if user is admin or super_admin');
    console.log('  2. Check if user is the corporate account owner (corporateAccount.userId === userId)');
    console.log('  3. Check if user is in corporate_users table with isActive: true');
    console.log();
    
    console.log('Current State:');
    console.log(`  - User Role: ${user ? user.role : 'NOT FOUND'}`);
    console.log(`  - Is Admin/Super Admin: ${user && (user.role === 'admin' || user.role === 'super_admin') ? 'YES' : 'NO'}`);
    console.log(`  - Is Corporate Account Owner: ${corporateAccount && user && corporateAccount.userId === userId ? 'YES' : 'NO'}`);
    console.log(`  - Is in corporate_users table: ${userCorporateEntry ? 'YES' : 'NO'}`);
    if (userCorporateEntry) {
      console.log(`  - corporate_users isActive: ${userCorporateEntry.isActive}`);
      console.log(`  - corporate_users expired: ${userCorporateEntry.expiresAt && new Date(userCorporateEntry.expiresAt) < new Date() ? 'YES' : 'NO'}`);
    }
    console.log();
    
    console.log('ROOT CAUSE ANALYSIS:');
    
    if (!corporateAccount) {
      console.log('❌ ROOT CAUSE: Corporate account does not exist in database');
    } else if (!user) {
      console.log('❌ ROOT CAUSE: User does not exist in database');
    } else if (user.role === 'admin' || user.role === 'super_admin') {
      console.log('⚠️  UNEXPECTED: User is admin/super_admin but still getting 403');
      console.log('   This suggests an issue with the auth middleware or token');
    } else if (corporateAccount.userId === userId) {
      console.log('⚠️  UNEXPECTED: User is the owner but still getting 403');
      console.log('   This suggests an issue with the auth middleware or token');
    } else if (userCorporateEntry && userCorporateEntry.isActive) {
      console.log('⚠️  UNEXPECTED: User is in corporate_users and active but still getting 403');
      console.log('   This suggests an issue with the auth middleware or token');
    } else if (userCorporateEntry && !userCorporateEntry.isActive) {
      console.log('❌ ROOT CAUSE: User is in corporate_users but is NOT ACTIVE');
      console.log('   The checkCorporateAccess middleware requires isActive: true');
    } else if (userCorporateEntry && userCorporateEntry.expiresAt && new Date(userCorporateEntry.expiresAt) < new Date()) {
      console.log('❌ ROOT CAUSE: User access has EXPIRED');
      console.log('   The expiresAt date has passed');
    } else {
      console.log('❌ ROOT CAUSE: User is NOT the owner and NOT in corporate_users table');
      console.log('   The checkCorporateAccess middleware requires one of these conditions:');
      console.log('     1. User is admin or super_admin');
      console.log('     2. User is the corporate account owner (userId matches)');
      console.log('     3. User is in corporate_users table with isActive: true');
    }
    console.log();

    console.log('='.repeat(80));
    console.log('DIAGNOSIS COMPLETE');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ ERROR during diagnosis:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseCorporateAccess();
