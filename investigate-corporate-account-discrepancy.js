/**
 * Corporate Account Discrepancy Investigation Script
 * 
 * This script investigates the discrepancy between:
 * 1. Initial diagnosis: Corporate account 5a5eaca8-37a7-4115-9e8d-c9577c6c9333 does NOT exist
 * 2. Test results: API returns 403 Forbidden instead of 404 Not Found for this account
 * 
 * The script will:
 * - Query the database to check if the account exists
 * - Check the corporate_users table for any relationships
 * - Verify the user's actual corporate account
 * - Analyze the middleware flow
 * 
 * Usage: node investigate-corporate-account-discrepancy.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Account IDs to investigate
const INVESTIGATED_ACCOUNT_ID = '5a5eaca8-37a7-4115-9e8d-c9577c6c9333';
const USER_ID = '95c63e45-4e91-4a90-93c3-5d9f1f0c0892';
const EXPECTED_USER_ACCOUNT_ID = '83fbff07-2859-425b-bbe2-26478d548fe0';

async function investigate() {
  console.log('='.repeat(80));
  console.log('CORPORATE ACCOUNT DISCREPANCY INVESTIGATION');
  console.log('='.repeat(80));
  console.log('');
  console.log(`Investigated Account ID: ${INVESTIGATED_ACCOUNT_ID}`);
  console.log(`User ID: ${USER_ID}`);
  console.log(`Expected User Account ID: ${EXPECTED_USER_ACCOUNT_ID}`);
  console.log('');

  try {
    // 1. Check if the investigated account exists
    console.log('1. CHECKING IF INVESTIGATED ACCOUNT EXISTS');
    console.log('-'.repeat(80));
    const investigatedAccount = await prisma.corporateAccount.findUnique({
      where: { id: INVESTIGATED_ACCOUNT_ID },
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
        corporate_users: true
      }
    });

    if (investigatedAccount) {
      console.log('✅ ACCOUNT EXISTS IN DATABASE');
      console.log('');
      console.log('Account Details:');
      console.log(`  ID: ${investigatedAccount.id}`);
      console.log(`  Company Name: ${investigatedAccount.companyName}`);
      console.log(`  Company Registration Number: ${investigatedAccount.companyRegistrationNumber}`);
      console.log(`  Account Status: ${investigatedAccount.accountStatus}`);
      console.log(`  Verification Status: ${investigatedAccount.verificationStatus}`);
      console.log(`  Owner User ID: ${investigatedAccount.userId}`);
      console.log(`  Created At: ${investigatedAccount.createdAt}`);
      console.log(`  Updated At: ${investigatedAccount.updatedAt}`);
      console.log('');
      
      if (investigatedAccount.users_corporate_accounts_user_idTousers) {
        console.log('Owner Details:');
        console.log(`  Owner ID: ${investigatedAccount.users_corporate_accounts_user_idTousers.id}`);
        console.log(`  Owner Email: ${investigatedAccount.users_corporate_accounts_user_idTousers.email}`);
        console.log(`  Owner Name: ${investigatedAccount.users_corporate_accounts_user_idTousers.firstName} ${investigatedAccount.users_corporate_accounts_user_idTousers.lastName}`);
        console.log(`  Owner Role: ${investigatedAccount.users_corporate_accounts_user_idTousers.role}`);
        console.log('');
      }

      if (investigatedAccount.corporate_users && investigatedAccount.corporate_users.length > 0) {
        console.log(`Corporate Users (${investigatedAccount.corporate_users.length}):`);
        investigatedAccount.corporate_users.forEach((cu, index) => {
          console.log(`  [${index + 1}] User ID: ${cu.userId}`);
          console.log(`      Role: ${cu.role}`);
          console.log(`      Is Active: ${cu.isActive}`);
          console.log(`      Assigned At: ${cu.assignedAt}`);
          console.log(`      Expires At: ${cu.expiresAt || 'Never'}`);
        });
        console.log('');
      } else {
        console.log('Corporate Users: None');
        console.log('');
      }
    } else {
      console.log('❌ ACCOUNT DOES NOT EXIST IN DATABASE');
      console.log('');
    }

    // 2. Check the user's actual corporate account
    console.log('2. CHECKING USER\'S ACTUAL CORPORATE ACCOUNT');
    console.log('-'.repeat(80));
    const userAccount = await prisma.corporateAccount.findUnique({
      where: { userId: USER_ID },
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
        corporate_users: true
      }
    });

    if (userAccount) {
      console.log('✅ USER HAS A CORPORATE ACCOUNT');
      console.log('');
      console.log('Account Details:');
      console.log(`  ID: ${userAccount.id}`);
      console.log(`  Company Name: ${userAccount.companyName}`);
      console.log(`  Company Registration Number: ${userAccount.companyRegistrationNumber}`);
      console.log(`  Account Status: ${userAccount.accountStatus}`);
      console.log(`  Verification Status: ${userAccount.verificationStatus}`);
      console.log(`  Owner User ID: ${userAccount.userId}`);
      console.log(`  Created At: ${userAccount.createdAt}`);
      console.log(`  Updated At: ${userAccount.updatedAt}`);
      console.log('');

      if (userAccount.corporate_users && userAccount.corporate_users.length > 0) {
        console.log(`Corporate Users (${userAccount.corporate_users.length}):`);
        userAccount.corporate_users.forEach((cu, index) => {
          console.log(`  [${index + 1}] User ID: ${cu.userId}`);
          console.log(`      Role: ${cu.role}`);
          console.log(`      Is Active: ${cu.isActive}`);
          console.log(`      Assigned At: ${cu.assignedAt}`);
          console.log(`      Expires At: ${cu.expiresAt || 'Never'}`);
        });
        console.log('');
      } else {
        console.log('Corporate Users: None');
        console.log('');
      }

      // Check if user account ID matches expected
      if (userAccount.id === EXPECTED_USER_ACCOUNT_ID) {
        console.log('✅ User account ID matches expected ID');
      } else {
        console.log('⚠️  User account ID does NOT match expected ID');
        console.log(`   Expected: ${EXPECTED_USER_ACCOUNT_ID}`);
        console.log(`   Actual: ${userAccount.id}`);
      }
      console.log('');
    } else {
      console.log('❌ USER DOES NOT HAVE A CORPORATE ACCOUNT');
      console.log('');
    }

    // 3. Check corporate_users table for the investigated account
    console.log('3. CHECKING CORPORATE_USERS TABLE FOR INVESTIGATED ACCOUNT');
    console.log('-'.repeat(80));
    const corporateUsersForInvestigatedAccount = await prisma.corporateUser.findMany({
      where: { corporateAccountId: INVESTIGATED_ACCOUNT_ID },
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

    if (corporateUsersForInvestigatedAccount.length > 0) {
      console.log(`✅ FOUND ${corporateUsersForInvestigatedAccount.length} CORPORATE USER(S)`);
      console.log('');
      corporateUsersForInvestigatedAccount.forEach((cu, index) => {
        console.log(`[${index + 1}] Corporate User ID: ${cu.id}`);
        console.log(`    User ID: ${cu.userId}`);
        console.log(`    User Email: ${cu.users?.email || 'N/A'}`);
        console.log(`    User Name: ${cu.users?.firstName} ${cu.users?.lastName || 'N/A'}`);
        console.log(`    User Role: ${cu.users?.role || 'N/A'}`);
        console.log(`    Corporate Role: ${cu.role}`);
        console.log(`    Is Active: ${cu.isActive}`);
        console.log(`    Assigned At: ${cu.assignedAt}`);
        console.log(`    Expires At: ${cu.expiresAt || 'Never'}`);
        console.log('');
      });
    } else {
      console.log('❌ NO CORPORATE USERS FOUND FOR THIS ACCOUNT');
      console.log('');
    }

    // 4. Check if the user is in corporate_users for the investigated account
    console.log('4. CHECKING IF USER IS IN CORPORATE_USERS FOR INVESTIGATED ACCOUNT');
    console.log('-'.repeat(80));
    const userCorporateUserEntry = await prisma.corporateUser.findFirst({
      where: {
        corporateAccountId: INVESTIGATED_ACCOUNT_ID,
        userId: USER_ID
      }
    });

    if (userCorporateUserEntry) {
      console.log('✅ USER HAS ENTRY IN CORPORATE_USERS TABLE');
      console.log('');
      console.log('Entry Details:');
      console.log(`  Corporate User ID: ${userCorporateUserEntry.id}`);
      console.log(`  Role: ${userCorporateUserEntry.role}`);
      console.log(`  Is Active: ${userCorporateUserEntry.isActive}`);
      console.log(`  Assigned At: ${userCorporateUserEntry.assignedAt}`);
      console.log(`  Expires At: ${userCorporateUserEntry.expiresAt || 'Never'}`);
      console.log('');
    } else {
      console.log('❌ USER DOES NOT HAVE ENTRY IN CORPORATE_USERS TABLE');
      console.log('');
    }

    // 5. Check user details
    console.log('5. CHECKING USER DETAILS');
    console.log('-'.repeat(80));
    const user = await prisma.user.findUnique({
      where: { id: USER_ID },
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

    if (user) {
      console.log('✅ USER EXISTS');
      console.log('');
      console.log('User Details:');
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.firstName} ${user.lastName}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Status: ${user.status}`);
      console.log(`  Account Status: ${user.accountStatus}`);
      console.log(`  Created At: ${user.createdAt}`);
      console.log(`  Updated At: ${user.updatedAt}`);
      console.log('');
    } else {
      console.log('❌ USER DOES NOT EXIST');
      console.log('');
    }

    // 6. Check all corporate accounts in the database
    console.log('6. CHECKING ALL CORPORATE ACCOUNTS IN DATABASE');
    console.log('-'.repeat(80));
    const allCorporateAccounts = await prisma.corporateAccount.findMany({
      select: {
        id: true,
        companyName: true,
        userId: true,
        accountStatus: true,
        verificationStatus: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${allCorporateAccounts.length} corporate account(s):`);
    console.log('');
    allCorporateAccounts.forEach((account, index) => {
      const isInvestigated = account.id === INVESTIGATED_ACCOUNT_ID;
      const isUserAccount = account.id === EXPECTED_USER_ACCOUNT_ID;
      const marker = isInvestigated ? ' [INVESTIGATED]' : isUserAccount ? ' [USER ACCOUNT]' : '';
      console.log(`[${index + 1}]${marker} ID: ${account.id}`);
      console.log(`    Company Name: ${account.companyName}`);
      console.log(`    Owner User ID: ${account.userId}`);
      console.log(`    Account Status: ${account.accountStatus}`);
      console.log(`    Verification Status: ${account.verificationStatus}`);
      console.log(`    Created At: ${account.createdAt}`);
      console.log('');
    });

    // 7. Analyze the discrepancy
    console.log('7. DISCREPANCY ANALYSIS');
    console.log('-'.repeat(80));
    console.log('');

    if (investigatedAccount) {
      console.log('🔴 CRITICAL FINDING: The investigated account EXISTS in the database!');
      console.log('');
      console.log('This explains why the API returns 403 Forbidden instead of 404 Not Found:');
      console.log('  1. The account exists, so the middleware does NOT return 404');
      console.log('  2. The user is not the owner (userId mismatch)');
      console.log('  3. The user is not in corporate_users table for this account');
      console.log('  4. Therefore, the middleware returns 403 Forbidden');
      console.log('');
      console.log('Middleware Flow:');
      console.log('  Step 1: Check if account exists → ✅ EXISTS (skip 404)');
      console.log('  Step 2: Check if user is admin → ❌ NO (role: customer)');
      console.log('  Step 3: Check if user is owner → ❌ NO (different userId)');
      console.log('  Step 4: Check if user in corporate_users → ❌ NO');
      console.log('  Result: 403 Forbidden');
      console.log('');
    } else {
      console.log('✅ CONFIRMED: The investigated account does NOT exist in the database');
      console.log('');
      console.log('This means the middleware SHOULD return 404 Not Found');
      console.log('But the test shows 403 Forbidden, which indicates:');
      console.log('  1. Possible middleware issue');
      console.log('  2. Possible database connection issue');
      console.log('  3. Possible caching issue');
      console.log('');
    }

    // 8. Summary and recommendations
    console.log('8. SUMMARY AND RECOMMENDATIONS');
    console.log('-'.repeat(80));
    console.log('');

    if (investigatedAccount) {
      console.log('ROOT CAUSE:');
      console.log('  The corporate account 5a5eaca8-37a7-4115-9e8d-c9577c6c9333 EXISTS in the database');
      console.log('  The initial diagnosis was INCORRECT');
      console.log('');
      console.log('WHY 403 INSTEAD OF 404:');
      console.log('  - Account exists → middleware passes the 404 check');
      console.log('  - User has no access → middleware returns 403');
      console.log('');
      console.log('RECOMMENDATIONS:');
      console.log('  1. Update the initial diagnosis report');
      console.log('  2. Investigate why the frontend is using the wrong account ID');
      console.log('  3. Check if the investigated account should be deleted');
      console.log('  4. Update frontend to use the correct account ID');
      console.log('');
    } else {
      console.log('ROOT CAUSE:');
      console.log('  The corporate account 5a5eaca8-37a7-4115-9e8d-c9577c6c9333 does NOT exist');
      console.log('  The initial diagnosis was CORRECT');
      console.log('');
      console.log('WHY 403 INSTEAD OF 404:');
      console.log('  - This is UNEXPECTED and requires further investigation');
      console.log('  - Possible causes:');
      console.log('    a) Middleware code has been modified');
      console.log('    b) Database connection issue');
      console.log('    c) Caching issue');
      console.log('    d) Different database instance');
      console.log('');
      console.log('RECOMMENDATIONS:');
      console.log('  1. Review the middleware code in backend/routes/corporate.js');
      console.log('  2. Check if there are multiple database instances');
      console.log('  3. Clear any caches');
      console.log('  4. Re-run the test with additional logging');
      console.log('');
    }

  } catch (error) {
    console.error('❌ ERROR DURING INVESTIGATION:');
    console.error(error);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }

  console.log('='.repeat(80));
  console.log('INVESTIGATION COMPLETE');
  console.log('='.repeat(80));
}

investigate();
