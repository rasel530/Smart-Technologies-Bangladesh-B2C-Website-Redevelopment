/**
 * Automatic User Cleanup Script
 * 
 * This script automatically deletes unnecessary users without requiring confirmation.
 * It will:
 * 1. Identify test users, invalid email users, and inactive users with no data
 * 2. Create a backup before deletion
 * 3. Delete users and verify result
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

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
 * Main function
 */
async function main() {
  console.log('='.repeat(80));
  console.log('AUTOMATIC USER CLEANUP SCRIPT');
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

  console.log('='.repeat(80));
  console.log('CREATING BACKUP');
  console.log('='.repeat(80));
  console.log('');

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

  console.log('='.repeat(80));
  console.log('DELETING USERS');
  console.log('='.repeat(80));
  console.log('');

  // Delete users
  console.log('Deleting users and their related data...');
  console.log('-'.repeat(80));

  const userIdsToDelete = usersToDelete.map(item => item.user.id);
  
  // Delete related records first (in order of dependencies)
  console.log('Step 1: Deleting email verification tokens...');
  await prisma.emailVerificationToken.deleteMany({
    where: { userId: { in: userIdsToDelete } }
  });
  console.log('✓ Email verification tokens deleted');

  console.log('Step 2: Deleting phone OTPs...');
  await prisma.phoneOTP.deleteMany({
    where: { userId: { in: userIdsToDelete } }
  });
  console.log('✓ Phone OTPs deleted');

  console.log('Step 3: Deleting password history...');
  await prisma.passwordHistory.deleteMany({
    where: { userId: { in: userIdsToDelete } }
  });
  console.log('✓ Password history deleted');

  console.log('Step 4: Deleting user sessions...');
  await prisma.userSession.deleteMany({
    where: { userId: { in: userIdsToDelete } }
  });
  console.log('✓ User sessions deleted');

  console.log('Step 5: Deleting user social accounts...');
  await prisma.userSocialAccount.deleteMany({
    where: { userId: { in: userIdsToDelete } }
  });
  console.log('✓ User social accounts deleted');

  console.log('Step 6: Deleting user notification preferences...');
  await prisma.userNotificationPreferences.deleteMany({
    where: { userId: { in: userIdsToDelete } }
  });
  console.log('✓ User notification preferences deleted');

  console.log('Step 7: Deleting user communication preferences...');
  await prisma.userCommunicationPreferences.deleteMany({
    where: { userId: { in: userIdsToDelete } }
  });
  console.log('✓ User communication preferences deleted');

  console.log('Step 8: Deleting user privacy settings...');
  await prisma.userPrivacySettings.deleteMany({
    where: { userId: { in: userIdsToDelete } }
  });
  console.log('✓ User privacy settings deleted');

  console.log('Step 9: Deleting user search preferences...');
  await prisma.userSearchPreferences.deleteMany({
    where: { userId: { in: userIdsToDelete } }
  });
  console.log('✓ User search preferences deleted');

  console.log('Step 10: Deleting cart SMS subscriptions...');
  await prisma.cartSmsSubscription.deleteMany({
    where: { userId: { in: userIdsToDelete } }
  });
  console.log('✓ Cart SMS subscriptions deleted');

  console.log('Step 11: Deleting cart offline syncs...');
  await prisma.cartOfflineSync.deleteMany({
    where: { userId: { in: userIdsToDelete } }
  });
  console.log('✓ Cart offline syncs deleted');

  console.log('Step 12: Deleting cart SMS logs...');
  await prisma.cartSmsLog.deleteMany({
    where: { userId: { in: userIdsToDelete } }
  });
  console.log('✓ Cart SMS logs deleted');

  console.log('Step 13: Deleting cart wishlist syncs...');
  await prisma.cartWishlistSync.deleteMany({
    where: { userId: { in: userIdsToDelete } }
  });
  console.log('✓ Cart wishlist syncs deleted');

  console.log('Step 14: Deleting cart wishlist move histories...');
  await prisma.cartWishlistMoveHistory.deleteMany({
    where: { userId: { in: userIdsToDelete } }
  });
  console.log('✓ Cart wishlist move histories deleted');

  console.log('Step 15: Deleting user roles (RBAC)...');
  await prisma.user_roles.deleteMany({
    where: { user_id: { in: userIdsToDelete } }
  });
  console.log('✓ User roles deleted');

  console.log('Step 16: Deleting role escalation requests...');
  await prisma.role_escalation_requests.deleteMany({
    where: { user_id: { in: userIdsToDelete } }
  });
  console.log('✓ Role escalation requests deleted');

  console.log('Step 17: Deleting corporate users...');
  await prisma.corporateUser.deleteMany({
    where: { userId: { in: userIdsToDelete } }
  });
  console.log('✓ Corporate users deleted');

  console.log('Step 18: Deleting search analytics...');
  await prisma.searchAnalytics.deleteMany({
    where: { userId: { in: userIdsToDelete } }
  });
  console.log('✓ Search analytics deleted');

  console.log('Step 19: Deleting search logs...');
  await prisma.searchLog.deleteMany({
    where: { userId: { in: userIdsToDelete } }
  });
  console.log('✓ Search logs deleted');

  console.log('Step 20: Deleting search recommendations...');
  await prisma.searchRecommendations.deleteMany({
    where: { userId: { in: userIdsToDelete } }
  });
  console.log('✓ Search recommendations deleted');

  console.log('Step 21: Deleting comparison history...');
  await prisma.comparisonHistory.deleteMany({
    where: { userId: { in: userIdsToDelete } }
  });
  console.log('✓ Comparison history deleted');

  console.log('Step 22: Deleting product comparisons...');
  await prisma.productComparison.deleteMany({
    where: { userId: { in: userIdsToDelete } }
  });
  console.log('✓ Product comparisons deleted');

  console.log('Step 23: Deleting wishlist analytics...');
  await prisma.wishlistAnalytics.deleteMany({
    where: { userId: { in: userIdsToDelete } }
  });
  console.log('✓ Wishlist analytics deleted');

  console.log('Step 24: Deleting wishlists...');
  await prisma.wishlist.deleteMany({
    where: { userId: { in: userIdsToDelete } }
  });
  console.log('✓ Wishlists deleted');

  console.log('Step 25: Deleting carts...');
  await prisma.cart.deleteMany({
    where: { userId: { in: userIdsToDelete } }
  });
  console.log('✓ Carts deleted');

  console.log('Step 26: Deleting users...');
  const deleteResult = await prisma.user.deleteMany({
    where: {
      id: { in: userIdsToDelete }
    }
  });

  console.log(`✓ Deleted ${deleteResult.count} user(s)`);
  console.log('');

  // Verify deletion
  console.log('='.repeat(80));
  console.log('VERIFYING DELETION');
  console.log('='.repeat(80));
  console.log('');

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
