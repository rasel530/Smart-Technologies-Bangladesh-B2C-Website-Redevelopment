/**
 * User Account Verification and Cleanup Script
 * 
 * This script:
 * 1. Lists all users in the database
 * 2. Verifies required users exist with correct roles
 * 3. Identifies unnecessary users
 * 4. Creates a backup of current users
 * 5. Provides cleanup recommendations
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
  { role: 'Discount Manager', description: 'Discount Manager' }, // Note: This might be stored differently
  { role: 'customer', description: 'Customer' }
];

// Special user ID mentioned in previous task
const SPECIAL_USER_ID = 'ea59bf47-4b66-431d-ba63-a0a69437798f';

/**
 * Format date for display
 */
function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toISOString();
}

/**
 * Check if user has important data (orders, cart, etc.)
 */
async function checkUserData(userId) {
  const [orders, cart, wishlists, addresses] = await Promise.all([
    prisma.order.findMany({ where: { userId }, select: { id: true } }),
    prisma.cart.findUnique({ where: { userId }, select: { id: true } }),
    prisma.wishlist.findMany({ where: { userId }, select: { id: true } }),
    prisma.address.findMany({ where: { userId }, select: { id: true } })
  ]);

  return {
    ordersCount: orders.length,
    hasCart: !!cart,
    wishlistsCount: wishlists.length,
    addressesCount: addresses.length,
    hasImportantData: orders.length > 0 || !!cart || wishlists.length > 0
  };
}

/**
 * Main function to verify and analyze users
 */
async function main() {
  console.log('='.repeat(80));
  console.log('USER ACCOUNT VERIFICATION AND CLEANUP');
  console.log('='.repeat(80));
  console.log('');

  // Step 1: Query all users
  console.log('Step 1: Querying all users from database...');
  console.log('-'.repeat(80));
  
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
      phone: true
    },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Found ${allUsers.length} users in database\n`);

  // Display all users
  console.log('ALL USERS IN DATABASE:');
  console.log('-'.repeat(80));
  console.log(sprintf('%-40s %-30s %-15s %-10s %-20s', 
    'ID', 'Email', 'Name', 'Role', 'Status'));
  console.log('-'.repeat(80));

  for (const user of allUsers) {
    const fullName = `${user.firstName} ${user.lastName}`;
    console.log(sprintf('%-40s %-30s %-15s %-10s %-20s',
      user.id,
      user.email || 'N/A',
      fullName.substring(0, 14),
      user.role,
      user.status
    ));
  }
  console.log('');

  // Step 2: Check for RBAC roles
  console.log('Step 2: Checking RBAC user_roles table...');
  console.log('-'.repeat(80));
  
  const userRoles = await prisma.user_roles.findMany({
    include: {
      roles: {
        select: {
          id: true,
          name: true,
          description: true
        }
      },
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

  console.log(`Found ${userRoles.length} role assignments in user_roles table\n`);

  if (userRoles.length > 0) {
    console.log('RBAC ROLE ASSIGNMENTS:');
    console.log('-'.repeat(80));
    for (const ur of userRoles) {
      const fullName = `${ur.users.firstName} ${ur.users.lastName}`;
      console.log(`User: ${ur.users.email} (${fullName})`);
      console.log(`  Role: ${ur.roles.name} - ${ur.roles.description || 'No description'}`);
      console.log(`  Assigned: ${formatDate(ur.assigned_at)}`);
      console.log(`  Active: ${ur.is_active}`);
      console.log('');
    }
  }

  // Step 3: Verify required users exist
  console.log('Step 3: Verifying required users...');
  console.log('-'.repeat(80));

  const roleUsers = {};
  allUsers.forEach(user => {
    if (!roleUsers[user.role]) {
      roleUsers[user.role] = [];
    }
    roleUsers[user.role].push(user);
  });

  console.log('REQUIRED USERS VERIFICATION:');
  console.log('-'.repeat(80));
  
  const missingRoles = [];
  for (const required of REQUIRED_USERS) {
    const users = roleUsers[required.role] || [];
    if (users.length === 0) {
      console.log(`❌ MISSING: ${required.description} (role: ${required.role})`);
      missingRoles.push(required);
    } else {
      console.log(`✓ FOUND: ${required.description} (role: ${required.role}) - ${users.length} user(s)`);
      users.forEach(user => {
        console.log(`  - ${user.email} (${user.firstName} ${user.lastName}) - Status: ${user.status}`);
      });
    }
  }
  console.log('');

  // Check for special user ID
  console.log('SPECIAL USER ID CHECK:');
  console.log('-'.repeat(80));
  const specialUser = allUsers.find(u => u.id === SPECIAL_USER_ID);
  if (specialUser) {
    console.log(`✓ Special user found: ${SPECIAL_USER_ID}`);
    console.log(`  Email: ${specialUser.email}`);
    console.log(`  Name: ${specialUser.firstName} ${specialUser.lastName}`);
    console.log(`  Role: ${specialUser.role}`);
    console.log(`  Status: ${specialUser.status}`);
  } else {
    console.log(`❌ Special user NOT found: ${SPECIAL_USER_ID}`);
  }
  console.log('');

  // Step 4: Identify potentially unnecessary users
  console.log('Step 4: Identifying potentially unnecessary users...');
  console.log('-'.repeat(80));

  const requiredRoleNames = REQUIRED_USERS.map(u => u.role);
  const potentiallyUnnecessary = [];
  
  for (const user of allUsers) {
    // Skip if user has a required role
    if (requiredRoleNames.includes(user.role)) {
      continue;
    }
    
    // Skip if user has important data
    const userData = await checkUserData(user.id);
    if (userData.hasImportantData) {
      continue;
    }
    
    potentiallyUnnecessary.push({
      ...user,
      dataInfo: userData
    });
  }

  console.log(`Found ${potentiallyUnnecessary.length} potentially unnecessary users\n`);

  if (potentiallyUnnecessary.length > 0) {
    console.log('POTENTIALLY UNNECESSARY USERS:');
    console.log('-'.repeat(80));
    console.log(sprintf('%-40s %-30s %-15s %-10s %-20s', 
      'ID', 'Email', 'Name', 'Role', 'Status'));
    console.log('-'.repeat(80));

    for (const user of potentiallyUnnecessary) {
      const fullName = `${user.firstName} ${user.lastName}`;
      console.log(sprintf('%-40s %-30s %-15s %-10s %-20s',
        user.id,
        user.email || 'N/A',
        fullName.substring(0, 14),
        user.role,
        user.status
      ));
      console.log(`  Data: Orders=${user.dataInfo.ordersCount}, Cart=${user.dataInfo.hasCart}, Wishlists=${user.dataInfo.wishlistsCount}, Addresses=${user.dataInfo.addressesCount}`);
    }
    console.log('');
  }

  // Step 5: Create backup
  console.log('Step 5: Creating backup of current users...');
  console.log('-'.repeat(80));

  const backupData = {
    timestamp: new Date().toISOString(),
    totalUsers: allUsers.length,
    requiredRoles: REQUIRED_USERS,
    users: allUsers,
    userRoles: userRoles,
    potentiallyUnnecessary: potentiallyUnnecessary,
    missingRoles: missingRoles
  };

  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFile = path.join(backupDir, `user-backup-${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

  console.log(`✓ Backup created: ${backupFile}`);
  console.log('');

  // Step 6: Summary and recommendations
  console.log('Step 6: Summary and Recommendations');
  console.log('='.repeat(80));
  console.log('');
  
  console.log('SUMMARY:');
  console.log(`- Total users in database: ${allUsers.length}`);
  console.log(`- Users with required roles: ${allUsers.filter(u => requiredRoleNames.includes(u.role)).length}`);
  console.log(`- Potentially unnecessary users: ${potentiallyUnnecessary.length}`);
  console.log(`- Missing required roles: ${missingRoles.length}`);
  console.log('');

  if (missingRoles.length > 0) {
    console.log('⚠️  WARNING: The following required roles are missing:');
    missingRoles.forEach(role => {
      console.log(`  - ${role.description} (${role.role})`);
    });
    console.log('');
  }

  if (potentiallyUnnecessary.length > 0) {
    console.log('⚠️  RECOMMENDATION: The following users can be safely deleted:');
    console.log('  They have no important data (orders, cart, wishlists, addresses)');
    console.log('');
    
    console.log('To delete these users, run:');
    console.log('```');
    console.log('const userIdsToDelete = [');
    potentiallyUnnecessary.forEach((user, index) => {
      console.log(`  '${user.id}'${index < potentiallyUnnecessary.length - 1 ? ',' : ''}`);
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
    console.log('✓ No unnecessary users found. All users are either required or have important data.');
  }
  console.log('');

  console.log('='.repeat(80));
  console.log('VERIFICATION COMPLETE');
  console.log('='.repeat(80));
}

// Simple sprintf implementation for formatting
function sprintf(format, ...args) {
  return format.replace(/%-?\d*[sd]/g, (match) => {
    const arg = args.shift();
    if (match.endsWith('s')) {
      return String(arg);
    } else if (match.endsWith('d')) {
      return String(Math.floor(arg));
    }
    return String(arg);
  });
}

// Run the script
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
