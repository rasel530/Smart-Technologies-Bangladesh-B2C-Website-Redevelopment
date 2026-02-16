/**
 * Check database state for users with _deleted_ patterns
 * This script queries database to find users with email/phone containing _deleted_
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseState() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   DATABASE STATE CHECK - USERS WITH _DELETED_ PATTERNS             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Find all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        status: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Total users in database: ${allUsers.length}\n`);

    // Find users with _deleted_ in email
    const usersWithDeletedInEmail = allUsers.filter(user => 
      user.email && user.email.includes('_deleted_')
    );

    console.log(`Users with _deleted_ in email: ${usersWithDeletedInEmail.length}`);
    if (usersWithDeletedInEmail.length > 0) {
      console.log('\n--- Users with _deleted_ in email ---');
      usersWithDeletedInEmail.forEach(user => {
        console.log(`ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Phone: ${user.phone}`);
        console.log(`Status: ${user.status}`);
        console.log(`DeletedAt: ${user.deletedAt}`);
        console.log(`CreatedAt: ${user.createdAt}`);
        console.log(`UpdatedAt: ${user.updatedAt}`);
        console.log('---');
      });
    }

    // Find users with _deleted_ in phone
    const usersWithDeletedInPhone = allUsers.filter(user => 
      user.phone && user.phone.includes('_deleted_')
    );

    console.log(`\nUsers with _deleted_ in phone: ${usersWithDeletedInPhone.length}`);
    if (usersWithDeletedInPhone.length > 0) {
      console.log('\n--- Users with _deleted_ in phone ---');
      usersWithDeletedInPhone.forEach(user => {
        console.log(`ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Phone: ${user.phone}`);
        console.log(`Status: ${user.status}`);
        console.log(`DeletedAt: ${user.deletedAt}`);
        console.log(`CreatedAt: ${user.createdAt}`);
        console.log(`UpdatedAt: ${user.updatedAt}`);
        console.log('---');
      });
    }

    // Find soft-deleted users (deletedAt is not null)
    const softDeletedUsers = allUsers.filter(user => 
      user.deletedAt !== null
    );

    console.log(`\nSoft-deleted users (deletedAt is not null): ${softDeletedUsers.length}`);
    if (softDeletedUsers.length > 0) {
      console.log('\n--- Soft-deleted users ---');
      softDeletedUsers.forEach(user => {
        console.log(`ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Phone: ${user.phone}`);
        console.log(`Status: ${user.status}`);
        console.log(`DeletedAt: ${user.deletedAt}`);
        console.log(`CreatedAt: ${user.createdAt}`);
        console.log(`UpdatedAt: ${user.updatedAt}`);
        console.log('---');
      });
    }

    // Find active users
    const activeUsers = allUsers.filter(user => 
      user.deletedAt === null && user.status === 'active'
    );

    console.log(`\nActive users (deletedAt is null and status is active): ${activeUsers.length}`);

    // Check for specific test cases mentioned in task
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   CHECKING SPECIFIC TEST CASES FROM BUG REPORT                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const testCase1 = 'test.fixes.1770619748455@example.com_deleted_1770645113784_deleted_1770645121255_deleted_1770645131397_deleted_1770645160942_deleted_1770645173246_deleted_1770645208153_deleted_1770645277344';
    const testCase2 = 'invalid@_deleted_1770645430982';

    const foundTestCase1 = allUsers.find(user => user.email === testCase1);
    const foundTestCase2 = allUsers.find(user => user.email === testCase2);

    console.log(`Test Case 1: ${testCase1}`);
    console.log(`Found in database: ${foundTestCase1 ? 'YES' : 'NO'}`);
    if (foundTestCase1) {
      console.log(`User ID: ${foundTestCase1.id}`);
      console.log(`Status: ${foundTestCase1.status}`);
      console.log(`DeletedAt: ${foundTestCase1.deletedAt}`);
    }

    console.log(`\nTest Case 2: ${testCase2}`);
    console.log(`Found in database: ${foundTestCase2 ? 'YES' : 'NO'}`);
    if (foundTestCase2) {
      console.log(`User ID: ${foundTestCase2.id}`);
      console.log(`Status: ${foundTestCase2.status}`);
      console.log(`DeletedAt: ${foundTestCase2.deletedAt}`);
    }

  } catch (error) {
    console.error('Error checking database state:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseState();
