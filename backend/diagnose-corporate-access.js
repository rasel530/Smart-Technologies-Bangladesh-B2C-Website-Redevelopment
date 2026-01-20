const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnoseCorporateAccess() {
  const corporateAccountId = '5a5eaca8-37a7-4115-9e8d-c9577c6c9333';
  const userId = '252a92b9-25be-4f07-9c32-db217727c16f';

  console.log('=== CORPORATE ACCESS DIAGNOSIS ===\n');

  // 1. Check if user exists
  console.log('1. Checking user existence...');
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });
    if (user) {
      console.log('✓ User found:', user);
    } else {
      console.log('✗ User NOT found with ID:', userId);
    }
  } catch (error) {
    console.log('✗ Error checking user:', error.message);
  }

  // 2. Check if corporate account exists
  console.log('\n2. Checking corporate account existence...');
  try {
    const corporateAccount = await prisma.corporateAccount.findUnique({
      where: { id: corporateAccountId },
      select: {
        id: true,
        company_name: true,
        account_status: true,
        verification_status: true,
        user_id: true
      }
    });
    if (corporateAccount) {
      console.log('✓ Corporate account found:', corporateAccount);
    } else {
      console.log('✗ Corporate account NOT found with ID:', corporateAccountId);
    }
  } catch (error) {
    console.log('✗ Error checking corporate account:', error.message);
  }

  // 3. Check if user is part of corporate account
  console.log('\n3. Checking user-corporate relationship...');
  try {
    const corporateUser = await prisma.corporateUser.findFirst({
      where: {
        corporate_account_id: corporateAccountId,
        user_id: userId,
        is_active: true
      },
      select: {
        id: true,
        role: true,
        is_active: true,
        assigned_at: true,
        expires_at: true
      }
    });
    if (corporateUser) {
      console.log('✓ User is part of corporate account:', corporateUser);
    } else {
      console.log('✗ User is NOT part of this corporate account');
    }
  } catch (error) {
    console.log('✗ Error checking corporate user:', error.message);
  }

  // 4. Check all corporate users for this account
  console.log('\n4. Listing all users in corporate account...');
  try {
    const allCorporateUsers = await prisma.corporateUser.findMany({
      where: {
        corporate_account_id: corporateAccountId
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    console.log(`Found ${allCorporateUsers.length} users in corporate account:`);
    allCorporateUsers.forEach(cu => {
      console.log(`  - ${cu.users.email} (${cu.role}, active: ${cu.is_active})`);
    });
  } catch (error) {
    console.log('✗ Error listing corporate users:', error.message);
  }

  // 5. Check if user has any corporate account
  console.log('\n5. Checking all corporate accounts for this user...');
  try {
    const userCorporateAccounts = await prisma.corporateUser.findMany({
      where: {
        user_id: userId
      },
      include: {
        corporate_accounts: {
          select: {
            id: true,
            company_name: true
          }
        }
      }
    });
    console.log(`Found ${userCorporateAccounts.length} corporate accounts for user:`);
    userCorporateAccounts.forEach(cu => {
      console.log(`  - ${cu.corporate_accounts.company_name} (${cu.role}, active: ${cu.is_active})`);
    });
  } catch (error) {
    console.log('✗ Error checking user corporate accounts:', error.message);
  }

  // 6. Check corporate account owner
  console.log('\n6. Checking corporate account owner...');
  try {
    const corporateAccount = await prisma.corporateAccount.findUnique({
      where: { id: corporateAccountId },
      include: {
        users_corporate_accounts_user_idTousers: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });
    if (corporateAccount) {
      console.log('✓ Corporate account owner:', corporateAccount.users_corporate_accounts_user_idTousers);
      console.log('  Owner ID matches user?', corporateAccount.user_id === userId);
    }
  } catch (error) {
    console.log('✗ Error checking corporate account owner:', error.message);
  }

  console.log('\n=== DIAGNOSIS COMPLETE ===');
}

diagnoseCorporateAccess()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
