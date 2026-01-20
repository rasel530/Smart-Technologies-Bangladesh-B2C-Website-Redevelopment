const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCorporateAccessMiddleware() {
  const corporateAccountId = '5a5eaca8-37a7-4115-9e8d-c9577c6c9333';
  const userId = '252a92b9-25be-4f07-9c32-db217727c16f';

  console.log('=== TESTING CORPORATE ACCESS MIDDLEWARE LOGIC ===\n');

  // Simulate checkCorporateAccess middleware logic
  try {
    console.log('Step 1: Checking if user is admin or super admin...');
    const isAdmin = await prisma.user.findFirst({
      where: {
        id: userId,
        role: { in: ['admin', 'super_admin'] }
      }
    });

    if (isAdmin) {
      console.log('✓ User is admin/super admin, access granted');
      return;
    } else {
      console.log('✗ User is not admin/super admin');
    }

    console.log('\nStep 2: Checking if user is part of corporate account...');
    const corporateUser = await prisma.corporateUser.findFirst({
      where: {
        corporate_account_id: corporateAccountId,
        user_id: userId,
        is_active: true
      }
    });

    if (!corporateUser) {
      console.log('✗ No corporate_user entry found');
      console.log('  This would result in 403 Forbidden error');
    } else {
      console.log('✓ Corporate user entry found:', corporateUser);
      console.log('  Access would be granted');
    }

    console.log('\nStep 3: Checking if user is corporate account owner...');
    const corporateAccount = await prisma.corporateAccount.findUnique({
      where: { id: corporateAccountId },
      select: {
        id: true,
        user_id: true,
        company_name: true
      }
    });

    if (corporateAccount) {
      console.log('✓ Corporate account found');
      console.log('  Account owner ID:', corporateAccount.user_id);
      console.log('  Current user ID:', userId);
      console.log('  User is owner?', corporateAccount.user_id === userId);
    }

  } catch (error) {
    console.log('\n✗ ERROR occurred during middleware execution:');
    console.log('  Error name:', error.name);
    console.log('  Error message:', error.message);
    console.log('  Error code:', error.code);
    if (error.meta) {
      console.log('  Error meta:', JSON.stringify(error.meta, null, 2));
    }
    console.log('\n  This would result in 500 Internal Server Error');
  }

  console.log('\n=== TEST COMPLETE ===');
}

testCorporateAccessMiddleware()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
