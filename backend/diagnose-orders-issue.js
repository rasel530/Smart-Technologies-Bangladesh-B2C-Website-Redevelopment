/**
 * Diagnostic script to investigate orders not appearing in admin dashboard
 * 
 * This script will check:
 * 1. User roles in the database
 * 2. Orders in the database
 * 3. Role values (case sensitivity)
 * 4. Order-user relationships
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnoseOrders() {
  console.log('='.repeat(80));
  console.log('ORDERS DIAGNOSTIC REPORT');
  console.log('='.repeat(80));
  console.log();

  try {
    // 1. Check all users and their roles
    console.log('1. USERS AND ROLES IN DATABASE');
    console.log('-'.repeat(80));
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Total users: ${users.length}`);
    console.log();
    
    // Group by role
    const roleGroups = {};
    users.forEach(user => {
      if (!roleGroups[user.role]) {
        roleGroups[user.role] = [];
      }
      roleGroups[user.role].push(user);
    });

    console.log('Users by role:');
    Object.keys(roleGroups).sort().forEach(role => {
      console.log(`  ${role}: ${roleGroups[role].length} user(s)`);
      roleGroups[role].forEach(user => {
        console.log(`    - ${user.email} (${user.firstName} ${user.lastName}) - Status: ${user.status}`);
      });
    });
    console.log();

    // 2. Check RBAC roles
    console.log('2. RBAC ROLES IN DATABASE');
    console.log('-'.repeat(80));
    const rbacRoles = await prisma.roles.findMany({
      include: {
        user_roles: {
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
        }
      },
      orderBy: { hierarchy_level: 'desc' }
    });

    console.log(`Total RBAC roles: ${rbacRoles.length}`);
    rbacRoles.forEach(role => {
      console.log(`  ${role.name} (Level: ${role.hierarchy_level}): ${role.user_roles.length} user(s)`);
      role.user_roles.forEach(ur => {
        console.log(`    - ${ur.users.email} (${ur.users.firstName} ${ur.users.lastName}) - Active: ${ur.is_active}`);
      });
    });
    console.log();

    // 3. Check orders in database
    console.log('3. ORDERS IN DATABASE');
    console.log('-'.repeat(80));
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    console.log(`Total orders in database: ${await prisma.order.count()}`);
    console.log(`Showing last 20 orders:`);
    console.log();

    if (orders.length === 0) {
      console.log('  ⚠️  NO ORDERS FOUND IN DATABASE!');
      console.log('  This could mean:');
      console.log('    - Orders are not being created successfully');
      console.log('    - Orders are being created but not persisted');
      console.log('    - Orders are being deleted after creation');
    } else {
      orders.forEach((order, index) => {
        console.log(`  ${index + 1}. Order #${order.orderNumber}`);
        console.log(`     ID: ${order.id}`);
        console.log(`     User: ${order.user.email} (${order.user.firstName} ${order.user.lastName})`);
        console.log(`     User Role: ${order.user.role}`);
        console.log(`     Status: ${order.status}`);
        console.log(`     Payment Method: ${order.paymentMethod}`);
        console.log(`     Payment Status: ${order.paymentStatus}`);
        console.log(`     Total: ${order.total}`);
        console.log(`     Items: ${order.items.length}`);
        console.log(`     Created: ${order.createdAt}`);
        console.log();
      });
    }
    console.log();

    // 4. Check orders by status
    console.log('4. ORDERS BY STATUS');
    console.log('-'.repeat(80));
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: true
    });

    if (statusCounts.length === 0) {
      console.log('  No orders found');
    } else {
      statusCounts.forEach(sc => {
        console.log(`  ${sc.status}: ${sc._count} order(s)`);
      });
    }
    console.log();

    // 5. Test case sensitivity issue
    console.log('5. CASE SENSITIVITY DIAGNOSTIC');
    console.log('-'.repeat(80));
    console.log('  Checking if admin users have uppercase or lowercase role values:');
    
    const adminUsers = users.filter(u => u.role.toLowerCase() === 'admin');
    console.log(`  Found ${adminUsers.length} user(s) with admin role`);
    
    adminUsers.forEach(user => {
      console.log(`    Email: ${user.email}`);
      console.log(`    Role value: "${user.role}"`);
      console.log(`    Role type: ${typeof user.role}`);
      console.log(`    Role === 'ADMIN': ${user.role === 'ADMIN'}`);
      console.log(`    Role === 'admin': ${user.role === 'admin'}`);
      console.log(`    Role.toUpperCase() === 'ADMIN': ${user.role.toUpperCase() === 'ADMIN'}`);
      console.log();
    });

    // 6. Simulate the orders route logic
    console.log('6. SIMULATING ORDERS ROUTE LOGIC');
    console.log('-'.repeat(80));
    console.log('  Testing the logic from backend/routes/orders.js line 29:');
    console.log('  if (req.user.role !== "ADMIN") { req.query.userId = req.user.id; }');
    console.log();

    adminUsers.forEach(user => {
      console.log(`  User: ${user.email}`);
      console.log(`    req.user.role = "${user.role}"`);
      console.log(`    req.user.role !== "ADMIN" = ${user.role !== 'ADMIN'}`);
      console.log(`    Result: ${user.role !== 'ADMIN' ? 'FILTERED to own orders only ❌' : 'Can see ALL orders ✓'}`);
      console.log();
    });

    // 7. Check for any order creation errors in recent logs (if available)
    console.log('7. RECOMMENDATIONS');
    console.log('-'.repeat(80));
    
    if (orders.length === 0) {
      console.log('  ⚠️  CRITICAL: No orders found in database');
      console.log('  Possible causes:');
      console.log('    1. Order creation API is failing silently');
      console.log('    2. Database transaction is being rolled back');
      console.log('    3. Orders are being created in a different database');
      console.log('    4. Orders table does not exist or has wrong schema');
      console.log();
      console.log('  Recommended actions:');
      console.log('    1. Check backend logs for order creation errors');
      console.log('    2. Test order creation API directly with curl/Postman');
      console.log('    3. Verify database connection string is correct');
      console.log('    4. Check if orders table exists: \\d orders');
    } else if (adminUsers.length > 0) {
      const hasCaseIssue = adminUsers.some(u => u.role !== 'ADMIN');
      if (hasCaseIssue) {
        console.log('  ⚠️  CRITICAL: Case sensitivity issue detected!');
        console.log('  The orders route checks for "ADMIN" (uppercase) but');
        console.log('  the database stores role as "admin" (lowercase).');
        console.log();
        console.log('  This causes admins to be filtered to see only their own orders!');
        console.log();
        console.log('  Fix: Change line 29 in backend/routes/orders.js from:');
        console.log('    if (req.user.role !== "ADMIN") {');
        console.log('  to:');
        console.log('    if (req.user.role?.toUpperCase() !== "ADMIN") {');
        console.log('  OR:');
        console.log('    if (req.user.role !== "admin") {');
      } else {
        console.log('  ✓ No case sensitivity issues detected');
      }
    } else {
      console.log('  ⚠️  WARNING: No admin users found in database');
      console.log('  You need to create an admin user to access all orders');
      console.log();
      console.log('  To create an admin user, you can run:');
      console.log('    node backend/create-admin.js');
    }

    console.log();
    console.log('='.repeat(80));
    console.log('DIAGNOSTIC COMPLETE');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('Error during diagnosis:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the diagnostic
diagnoseOrders();
