const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCorporateAccountRelations() {
  try {
    console.log('Testing corporate account relation names...\n');

    // Get a corporate account to see its structure
    const corporateAccount = await prisma.corporateAccount.findFirst({
      where: { user_id: '252a92b9-25be-4f07-9c32-db217727c16f' }
    });

    if (!corporateAccount) {
      console.log('No corporate account found for test user');
      return;
    }

    console.log('Corporate account found:');
    console.log('- ID:', corporateAccount.id);
    console.log('- user_id:', corporateAccount.user_id);
    console.log('- account_manager_id:', corporateAccount.account_manager_id);
    console.log('\n');

    // Test 1: Try to include user relation
    console.log('Test 1: Including user relation');
    try {
      const result1 = await prisma.corporateAccount.findUnique({
        where: { user_id: '252a92b9-25be-4f07-9c32-db217727c16f' },
        include: {
          user: true
        }
      });
      console.log('✓ Success! User relation works');
      console.log('  User email:', result1?.users_corporate_accounts_user_idTousers?.email || 'N/A');
    } catch (error) {
      console.log('✗ Error:', error.message);
    }
    console.log('\n');

    // Test 2: Try to include account manager relation
    console.log('Test 2: Including account manager relation');
    try {
      const result2 = await prisma.corporateAccount.findUnique({
        where: { user_id: '252a92b9-25be-4f07-9c32-db217727c16f' },
        include: {
          accountManager: true
        }
      });
      console.log('✓ Success! Account manager relation works');
      console.log('  Manager email:', result2?.users_corporate_accounts_account_manager_idTousers?.email || 'N/A');
    } catch (error) {
      console.log('✗ Error:', error.message);
    }
    console.log('\n');

    // Test 3: Try to include both relations with actual relation names
    console.log('Test 3: Including both relations with actual relation names');
    try {
      const result3 = await prisma.corporateAccount.findUnique({
        where: { user_id: '252a92b9-25be-4f07-9c32-db217727c16f' },
        include: {
          users_corporate_accounts_user_idTousers: true,
          users_corporate_accounts_account_manager_idTousers: true
        }
      });
      console.log('✓ Success! Both relations work with actual names');
      console.log('  User email:', result3?.users_corporate_accounts_user_idTousers?.email || 'N/A');
      console.log('  Manager email:', result3?.users_corporate_accounts_account_manager_idTousers?.email || 'N/A');
    } catch (error) {
      console.log('✗ Error:', error.message);
    }
    console.log('\n');

    // Test 4: Replicate the exact query from the route
    console.log('Test 4: Exact query from /my-account route');
    try {
      const result4 = await prisma.corporateAccount.findUnique({
        where: { user_id: '252a92b9-25be-4f07-9c32-db217727c16f' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true
            }
          },
          accountManager: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });
      console.log('✓ Success! Route query works');
      console.log('  User email:', result4?.users_corporate_accounts_user_idTousers?.email || 'N/A');
      console.log('  Manager email:', result4?.users_corporate_accounts_account_manager_idTousers?.email || 'N/A');
    } catch (error) {
      console.log('✗ Error:', error.message);
      console.log('  Error code:', error.code);
      console.log('  Error meta:', JSON.stringify(error.meta, null, 2));
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCorporateAccountRelations();
