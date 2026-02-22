/**
 * Detailed User Analysis for Cleanup
 * 
 * This script provides detailed analysis of users to identify:
 * 1. Test users (with 'test' in email or name)
 * 2. Invalid email users
 * 3. Inactive users with no important data
 * 4. Users marked as deleted
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Required users that should exist in the database
const REQUIRED_USERS = [
  { role: 'super_admin', description: 'Super Admin' },
  { role: 'admin', description: 'Admin' },
  { role: 'manager', description: 'Manager' },
  { role: 'corporate', description: 'Corporate' },
  { role: 'support', description: 'Support' },
  { role: 'Discount Manager', description: 'Discount Manager' },
  { role: 'customer', description: 'Customer' }
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
    email.includes('deleted')
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
  console.log('DETAILED USER ANALYSIS FOR CLEANUP');
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
      createdAt: true,
      lastLoginAt: true
    },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Total users: ${allUsers.length}\n`);

  // Categorize users
  const categories = {
    required: [],
    testUsers: [],
    invalidEmail: [],
    inactiveNoData: [],
    other: []
  };

  const requiredRoleNames = REQUIRED_USERS.map(u => u.role);

  for (const user of allUsers) {
    const userData = await checkUserData(user.id);
    user.dataInfo = userData;

    // Check if user has required role
    if (requiredRoleNames.includes(user.role)) {
      categories.required.push(user);
      continue;
    }

    // Check if test user
    if (isTestUser(user)) {
      categories.testUsers.push(user);
      continue;
    }

    // Check if invalid email
    if (!isValidEmail(user.email)) {
      categories.invalidEmail.push(user);
      continue;
    }

    // Check if inactive with no important data
    if (user.status === 'inactive' && !userData.hasImportantData) {
      categories.inactiveNoData.push(user);
      continue;
    }

    // Other users
    categories.other.push(user);
  }

  // Display results
  console.log('USER CATEGORIES:');
  console.log('='.repeat(80));
  console.log('');

  // Required users
  console.log(`1. REQUIRED USERS (${categories.required.length}):`);
  console.log('-'.repeat(80));
  for (const user of categories.required) {
    const fullName = `${user.firstName} ${user.lastName}`;
    console.log(`✓ ${user.email} (${fullName})`);
    console.log(`   Role: ${user.role}, Status: ${user.status}`);
    console.log(`   Data: Orders=${user.dataInfo.ordersCount}, Cart=${user.dataInfo.hasCart}, Wishlists=${user.dataInfo.wishlistsCount}, Addresses=${user.dataInfo.addressesCount}, Reviews=${user.dataInfo.reviewsCount}`);
    console.log('');
  }

  // Test users
  console.log(`2. TEST USERS (${categories.testUsers.length}):`);
  console.log('-'.repeat(80));
  if (categories.testUsers.length > 0) {
    for (const user of categories.testUsers) {
      const fullName = `${user.firstName} ${user.lastName}`;
      const hasData = user.dataInfo.hasImportantData ? 'HAS DATA' : 'NO DATA';
      console.log(`⚠️  ${user.email} (${fullName}) - ${hasData}`);
      console.log(`   Role: ${user.role}, Status: ${user.status}`);
      console.log(`   Data: Orders=${user.dataInfo.ordersCount}, Cart=${user.dataInfo.hasCart}, Wishlists=${user.dataInfo.wishlistsCount}, Addresses=${user.dataInfo.addressesCount}, Reviews=${user.dataInfo.reviewsCount}`);
      console.log('');
    }
  } else {
    console.log('✓ No test users found\n');
  }

  // Invalid email users
  console.log(`3. INVALID EMAIL USERS (${categories.invalidEmail.length}):`);
  console.log('-'.repeat(80));
  if (categories.invalidEmail.length > 0) {
    for (const user of categories.invalidEmail) {
      const fullName = `${user.firstName} ${user.lastName}`;
      const hasData = user.dataInfo.hasImportantData ? 'HAS DATA' : 'NO DATA';
      console.log(`⚠️  ${user.email || 'NO EMAIL'} (${fullName}) - ${hasData}`);
      console.log(`   Role: ${user.role}, Status: ${user.status}`);
      console.log(`   Data: Orders=${user.dataInfo.ordersCount}, Cart=${user.dataInfo.hasCart}, Wishlists=${user.dataInfo.wishlistsCount}, Addresses=${user.dataInfo.addressesCount}, Reviews=${user.dataInfo.reviewsCount}`);
      console.log('');
    }
  } else {
    console.log('✓ No invalid email users found\n');
  }

  // Inactive users with no data
  console.log(`4. INACTIVE USERS WITH NO IMPORTANT DATA (${categories.inactiveNoData.length}):`);
  console.log('-'.repeat(80));
  if (categories.inactiveNoData.length > 0) {
    for (const user of categories.inactiveNoData) {
      const fullName = `${user.firstName} ${user.lastName}`;
      console.log(`⚠️  ${user.email} (${fullName})`);
      console.log(`   Role: ${user.role}, Status: ${user.status}`);
      console.log(`   Data: Orders=${user.dataInfo.ordersCount}, Cart=${user.dataInfo.hasCart}, Wishlists=${user.dataInfo.wishlistsCount}, Addresses=${user.dataInfo.addressesCount}, Reviews=${user.dataInfo.reviewsCount}`);
      console.log('');
    }
  } else {
    console.log('✓ No inactive users with no data found\n');
  }

  // Other users
  console.log(`5. OTHER USERS (${categories.other.length}):`);
  console.log('-'.repeat(80));
  if (categories.other.length > 0) {
    for (const user of categories.other) {
      const fullName = `${user.firstName} ${user.lastName}`;
      console.log(`✓ ${user.email} (${fullName})`);
      console.log(`   Role: ${user.role}, Status: ${user.status}`);
      console.log(`   Data: Orders=${user.dataInfo.ordersCount}, Cart=${user.dataInfo.hasCart}, Wishlists=${user.dataInfo.wishlistsCount}, Addresses=${user.dataInfo.addressesCount}, Reviews=${user.dataInfo.reviewsCount}`);
      console.log('');
    }
  } else {
    console.log('✓ No other users found\n');
  }

  // Identify users safe to delete
  console.log('='.repeat(80));
  console.log('CLEANUP RECOMMENDATIONS');
  console.log('='.repeat(80));
  console.log('');

  const safeToDelete = [];

  // Test users with no important data
  for (const user of categories.testUsers) {
    if (!user.dataInfo.hasImportantData) {
      safeToDelete.push({
        user,
        reason: 'Test user with no important data'
      });
    }
  }

  // Invalid email users with no important data
  for (const user of categories.invalidEmail) {
    if (!user.dataInfo.hasImportantData) {
      safeToDelete.push({
        user,
        reason: 'Invalid email with no important data'
      });
    }
  }

  // Inactive users with no important data
  for (const user of categories.inactiveNoData) {
    safeToDelete.push({
      user,
      reason: 'Inactive with no important data'
    });
  }

  console.log(`Users safe to delete: ${safeToDelete.length}\n`);

  if (safeToDelete.length > 0) {
    console.log('SAFE TO DELETE:');
    console.log('-'.repeat(80));
    for (const item of safeToDelete) {
      const user = item.user;
      const fullName = `${user.firstName} ${user.lastName}`;
      console.log(`• ${user.email} (${fullName})`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Reason: ${item.reason}`);
      console.log(`  Role: ${user.role}, Status: ${user.status}`);
      console.log('');
    }

    console.log('To delete these users, run the following script:');
    console.log('```javascript');
    console.log('const userIdsToDelete = [');
    safeToDelete.forEach((item, index) => {
      console.log(`  '${item.user.id}'${index < safeToDelete.length - 1 ? ',' : ''}`);
    });
    console.log('];');
    console.log('');
    console.log('await prisma.user.deleteMany({');
    console.log('  where: {');
    console.log('    id: { in: userIdsToDelete }');
    console.log('  }');
    console.log('});');
    console.log('```');
  } else {
    console.log('✓ No users safe to delete. All users either have required roles or important data.');
  }
  console.log('');

  // Save analysis to file
  const analysisData = {
    timestamp: new Date().toISOString(),
    totalUsers: allUsers.length,
    categories: {
      required: categories.required.map(u => ({
        id: u.id,
        email: u.email,
        name: `${u.firstName} ${u.lastName}`,
        role: u.role,
        status: u.status,
        dataInfo: u.dataInfo
      })),
      testUsers: categories.testUsers.map(u => ({
        id: u.id,
        email: u.email,
        name: `${u.firstName} ${u.lastName}`,
        role: u.role,
        status: u.status,
        dataInfo: u.dataInfo
      })),
      invalidEmail: categories.invalidEmail.map(u => ({
        id: u.id,
        email: u.email,
        name: `${u.firstName} ${u.lastName}`,
        role: u.role,
        status: u.status,
        dataInfo: u.dataInfo
      })),
      inactiveNoData: categories.inactiveNoData.map(u => ({
        id: u.id,
        email: u.email,
        name: `${u.firstName} ${u.lastName}`,
        role: u.role,
        status: u.status,
        dataInfo: u.dataInfo
      })),
      other: categories.other.map(u => ({
        id: u.id,
        email: u.email,
        name: `${u.firstName} ${u.lastName}`,
        role: u.role,
        status: u.status,
        dataInfo: u.dataInfo
      }))
    },
    safeToDelete: safeToDelete.map(item => ({
      id: item.user.id,
      email: item.user.email,
      name: `${item.user.firstName} ${item.user.lastName}`,
      role: item.user.role,
      status: item.user.status,
      reason: item.reason
    }))
  };

  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const analysisFile = path.join(backupDir, `user-analysis-${Date.now()}.json`);
  fs.writeFileSync(analysisFile, JSON.stringify(analysisData, null, 2));

  console.log(`Analysis saved to: ${analysisFile}`);
  console.log('');

  console.log('='.repeat(80));
  console.log('ANALYSIS COMPLETE');
  console.log('='.repeat(80));
}

main()
  .then(() => {
    console.log('\n✓ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
