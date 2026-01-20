/**
 * Script to update user status from "pending" to "active"
 * Target user: raselbepari88@gmail.com
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn']
});

async function updateUserStatus() {
  const targetEmail = 'raselbepari88@gmail.com';
  const newStatus = 'active';
  
  console.log('========================================');
  console.log('User Status Update Script');
  console.log('========================================');
  console.log(`Target Email: ${targetEmail}`);
  console.log(`New Status: ${newStatus}`);
  console.log('----------------------------------------');

  try {
    // Step 1: Find the user and check current status
    console.log('\n[Step 1] Checking current user status...');
    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      console.error(`❌ User with email "${targetEmail}" not found in database.`);
      return;
    }

    console.log(`✅ User found:`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Name: ${user.firstName} ${user.lastName}`);
    console.log(`   - Current Status: ${user.status}`);
    console.log(`   - Role: ${user.role}`);
    console.log(`   - Created At: ${user.createdAt}`);

    // Check if status is already 'active'
    if (user.status === 'active') {
      console.log(`\nℹ️  User status is already "active". No update needed.`);
      return;
    }

    // Step 2: Update the user status
    console.log(`\n[Step 2] Updating user status from "${user.status}" to "${newStatus}"...`);
    const updatedUser = await prisma.user.update({
      where: { email: targetEmail },
      data: { status: newStatus },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        updatedAt: true
      }
    });

    console.log(`✅ User status updated successfully:`);
    console.log(`   - ID: ${updatedUser.id}`);
    console.log(`   - Email: ${updatedUser.email}`);
    console.log(`   - Name: ${updatedUser.firstName} ${updatedUser.lastName}`);
    console.log(`   - New Status: ${updatedUser.status}`);
    console.log(`   - Updated At: ${updatedUser.updatedAt}`);

    // Step 3: Verify the update
    console.log(`\n[Step 3] Verifying update...`);
    const verifiedUser = await prisma.user.findUnique({
      where: { email: targetEmail },
      select: {
        id: true,
        email: true,
        status: true,
        updatedAt: true
      }
    });

    if (verifiedUser.status === newStatus) {
      console.log(`✅ Verification successful! User status is confirmed as "${newStatus}".`);
      console.log('========================================');
      console.log('SUMMARY');
      console.log('========================================');
      console.log(`✅ Successfully updated user status for ${targetEmail}`);
      console.log(`   Previous Status: ${user.status}`);
      console.log(`   New Status: ${newStatus}`);
      console.log(`   Updated At: ${verifiedUser.updatedAt}`);
      console.log('========================================');
    } else {
      console.error(`❌ Verification failed! User status is "${verifiedUser.status}" instead of "${newStatus}".`);
    }

  } catch (error) {
    console.error('\n❌ Error occurred during user status update:');
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    if (error.meta) {
      console.error('Error Meta:', JSON.stringify(error.meta, null, 2));
    }
  } finally {
    // Disconnect Prisma client
    await prisma.$disconnect();
    console.log('\n[Cleanup] Database connection closed.');
  }
}

// Execute the function
updateUserStatus()
  .then(() => {
    console.log('\n✅ Script execution completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script execution failed:', error);
    process.exit(1);
  });
