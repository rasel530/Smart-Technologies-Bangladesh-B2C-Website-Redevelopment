const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCorporateAccountField() {
  try {
    console.log('Testing corporate account field names...\n');

    // Check the Prisma model metadata
    const corporateAccountModel = prisma.corporateAccount;
    console.log('CorporateAccount model fields:');
    console.log(Object.keys(corporateAccountModel.fields || {}));
    console.log('\n');

    // Try to find a corporate account using different field names
    const testUserId = '252a92b9-25be-4f07-9c32-db217727c16f';

    console.log(`Testing with userId: ${testUserId}\n`);

    // Test 1: Using userId (camelCase)
    console.log('Test 1: Using { userId } (camelCase)');
    try {
      const result1 = await prisma.corporateAccount.findUnique({
        where: { userId: testUserId }
      });
      console.log('✓ Success! Found:', result1 ? 'Yes' : 'No');
    } catch (error) {
      console.log('✗ Error:', error.message);
    }
    console.log('\n');

    // Test 2: Using user_id (snake_case)
    console.log('Test 2: Using { user_id } (snake_case)');
    try {
      const result2 = await prisma.corporateAccount.findUnique({
        where: { user_id: testUserId }
      });
      console.log('✓ Success! Found:', result2 ? 'Yes' : 'No');
    } catch (error) {
      console.log('✗ Error:', error.message);
    }
    console.log('\n');

    // Test 3: Just get all corporate accounts to see structure
    console.log('Test 3: Getting all corporate accounts');
    const allAccounts = await prisma.corporateAccount.findMany();
    console.log(`Found ${allAccounts.length} corporate accounts`);
    if (allAccounts.length > 0) {
      console.log('First account structure:', Object.keys(allAccounts[0]));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCorporateAccountField();
