/**
 * User Cleanup Script
 * 
 * This script identifies and deletes unnecessary users after confirmation.
 * It will:
 * 1. Identify test users, invalid email users, and inactive users with no data
 * 2. Show a detailed list of users to be deleted
 * 3. Ask for confirmation before deletion
 * 4. Create a backup before deletion
 * 5. Delete the users and verify the result
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const prisma = new PrismaClient();

// Essential users to keep (by email or ID)
const ESSENTIAL_USERS = [
  'test.superadmin@smarttech.com',  // Super Admin
  'admin@smarttech.com',             // Admin
  'admin2@smarttech.com',           // Admin 2
  'raselbepari@gmail.com',          // Manager (active)
  'raselbepari88@gmail.com',        // Customer with orders
  'ea59bf47-4b66-431d-ba63-a0a69437798f'  // Special user ID
];

/**
 * Check if email is valid
 */
function isValidEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if user is essential
 */
function isEssentialUser(user) {
  return ESSENTIAL_USERS.includes(user.email) || ESSENTIAL_USERS.includes(user.id);
}

/**
 * Check if user appears to be a test user
 */
function isTestUser(user) {
  const email = (user.email || '').toLowerCase();
  const firstName = (user.firstName || '').toLowerCase();
  const lastName = (user.lastName || '').toLowerCase();
  
  return (
    email.includes('test') ||
    firstName.includes('test') ||
    lastName.includes('test') ||
    email.includes('trigger') ||
    email.includes('cascade') ||
    email.includes('deleted') ||
    email.includes('1770735781379') || // Test timestamp
    email.includes('1770645430982')   // Deleted timestamp
  );
}

/**
 * Check if user has important data
 */
async function checkUserData(userId) {
  const [orders, cart, wishlists, addresses, reviews] = await Promise.all([
    prisma.order.findMany({ where: { userId }, select: { id: true } }),
    prisma.cart.findUnique({ where: { userId }, select: { id: true } }),
    prisma.wishlist.findMany({ where: { userId }, select: { id: true } }),
    prisma.address.findMany({ where: { userId }, select: { id: true } }),
    prisma.review.findMany({ where: { userId }, select: { id: true } })
  ]);

  return {
    ordersCount: orders.length,
    hasCart: !!cart,
    wishlistsCount: wishlists.length,
    addressesCount: addresses.length,
    reviewsCount: reviews.length,
    hasImportantData: orders.length > 0 || !!cart || wishlists.length > 0 || reviews.length > 0
  };
}

/**
 * Ask for confirmation
 */
function askConfirmation(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(80));
  console.log('USER CLEANUP SCRIPT');
  console.log('='.repeat(80));
  console.log('');

  // Query all users
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      createdAt: true
    },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Total users in database: ${allUsers.length}\n`);

  // Identify users to delete
  const usersToDelete = [];

  for (const user of allUsers) {
    // Skip essential users
    if (isEssentialUser(user)) {
      continue;
    }

    // Check user data
    const userData = await checkUserData(user.id);

    // If user has important data, skip
    if (userData.hasImportantData) {
      continue;
    }

    // If user is a test user, mark for deletion
    if (isTestUser(user)) {
      usersToDelete.push({
        user,
        reason: 'Test user with no important data'
      });
      continue;
    }

    // If user has invalid email, mark for deletion
    if (!isValidEmail(user.email)) {
      usersToDelete.push({
        user,
        reason: 'Invalid email with no important data'
      });
      continue;
    }

    // If user is inactive with no data, mark for deletion
    if (user.status === 'inactive') {
      usersToDelete.push({
        user,
        reason: 'Inactive user with no important data'
      });
      continue;
    }
  }

  console.log('='.repeat(80));
  console.log('ANALYSIS RESULTS');
  console.log('='.repeat(80));
  console.log('');
  console.log(`Total users: ${allUsers.length}`);
  console.log(`Essential users to keep: ${ESSENTIAL_USERS.length}`);
  console.log(`Users marked for deletion: ${usersToDelete.length}`);
  console.log('');

  if (usersToDelete.length === 0) {
    console.log('✓ No users to delete. All users are essential or have important data.');
    console.log('');
    console.log('CURRENT USERS:');
    console.log('-'.repeat(80));
    for (const user of allUsers) {
      const essential = isEssentialUser(user) ? ' [ESSENTIAL]' : '';
      console.log(`• ${user.email} (${user.firstName} ${user.lastName}) - ${user.role}${essential}`);
    }
    console.log('');
    return;
  }

  // Show users to delete
  console.log('USERS MARKED FOR DELETION:');
  console.log('-'.repeat(80));
  for (const item of usersToDelete) {
    const user = item.user;
    const fullName = `${user.firstName} ${user.lastName}`;
    console.log(`• ${user.email} (${fullName})`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Role: ${user.role}, Status: ${user.status}`);
    console.log(`  Reason: ${item.reason}`);
    console.log('');
  }

  // Ask for confirmation
  console.log('='.repeat(80));
  console.log('CONFIRMATION REQUIRED');
  console.log('='.repeat(80));
  console.log('');
  console.log(`You are about to delete ${usersToDelete.length} user(s).`);
  console.log('This action cannot be undone.');
  console.log('');
  
  const confirmed = await askConfirmation('Do you want to proceed with deletion? (yes/no): ');

  if (!confirmed) {
    console.log('');
    console.log('✓ Deletion cancelled by user.');
    console.log('');
    return;
  }

  console.log('');
  console.log('Creating backup before deletion...');

  // Create backup
  const backupData = {
    timestamp: new Date().toISOString(),
    usersToDelete: usersToDelete.map(item => ({
      id: item.user.id,
      email: item.user.email,
      firstName: item.user.firstName,
      lastName: item.user.lastName,
      role: item.user.role,
      status: item.user.status,
      reason: item.reason
    }))
  };

  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFile = path.join(backupDir, `user-deletion-backup-${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

  console.log(`✓ Backup created: ${backupFile}`);
  console.log('');

  // Delete users
  console.log('Deleting users...');
  console.log('-'.repeat(80));

  const userIdsToDelete = usersToDelete.map(item => item.user.id);
  
  const deleteResult = await prisma.user.deleteMany({
    where: {
      id: { in: userIdsToDelete }
    }
  });

  console.log(`✓ Deleted ${deleteResult.count} user(s)`);
  console.log('');

  // Verify deletion
  console.log('Verifying deletion...');
  console.log('-'.repeat(80));

  const remainingUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true
    },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`✓ Remaining users: ${remainingUsers.length}`);
  console.log('');

  console.log('FINAL USER LIST:');
  console.log('-'.repeat(80));
  for (const user of remainingUsers) {
    const essential = isEssentialUser(user) ? ' [ESSENTIAL]' : '';
    console.log(`• ${user.email} (${user.firstName} ${user.lastName}) - ${user.role}${essential}`);
  }
  console.log('');

  console.log('='.repeat(80));
  console.log('CLEANUP COMPLETE');
  console.log('='.repeat(80));
  console.log('');
  console.log('Summary:');
  console.log(`- Users deleted: ${deleteResult.count}`);
  console.log(`- Users remaining: ${remainingUsers.length}`);
  console.log(`- Backup file: ${backupFile}`);
  console.log('');
}

main()
  .then(() => {
    console.log('✓ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
