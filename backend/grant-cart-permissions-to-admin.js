/**
 * Grant Cart Permissions to Admin Role
 * 
 * This script grants all necessary cart-related permissions to admin role
 * to fix Issue 3: Admin user getting 401 Unauthorized when accessing /api/v1/admin/carts
 * 
 * Required permissions:
 * - cart:read - List carts, get cart details, get cart items
 * - cart:write - Update cart items, update cart status
 * - cart:delete - Delete cart items, clear carts, delete carts
 * - cart:analytics - Get cart analytics data
 */

const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('./services/logger');

async function grantCartPermissionsToAdmin() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Starting cart permissions grant process...');
    
    // Step 1: Find admin role
    console.log('\nStep 1: Finding admin role...');
    const adminRole = await prisma.roles.findUnique({
      where: { name: 'ADMIN' }
    });
    
    if (!adminRole) {
      console.error('❌ Admin role not found!');
      console.log('Please ensure ADMIN role exists in roles table.');
      process.exit(1);
    }
    
    console.log(`✓ Found admin role: ${adminRole.id}`);
    
    // Step 2: Find cart permissions
    console.log('\nStep 2: Finding cart permissions...');
    const cartPermissions = await prisma.permissions.findMany({
      where: {
        name: {
          in: ['cart:read', 'cart:write', 'cart:delete', 'cart:analytics']
        }
      }
    });
    
    if (cartPermissions.length === 0) {
      console.error('❌ Cart permissions not found!');
      console.log('Permissions needed: cart:read, cart:write, cart:delete, cart:analytics');
      process.exit(1);
    }
    
    console.log(`✓ Found ${cartPermissions.length} cart permissions:`);
    cartPermissions.forEach(p => {
      console.log(`  - ${p.name} (${p.id})`);
    });
    
    // Step 3: Check which permissions are already assigned to admin role
    console.log('\nStep 3: Checking existing permissions on admin role...');
    const existingPermissions = await prisma.$queryRaw`
      SELECT permission_id
      FROM role_permissions
      WHERE role_id = ${adminRole.id}::uuid
    `;
    
    console.log(`✓ Admin role currently has ${existingPermissions.length} permissions`);
    
    // Step 4: Assign missing permissions to admin role
    console.log('\nStep 4: Assigning missing permissions to admin role...');
    let assignedCount = 0;
    
    for (const permission of cartPermissions) {
      const isAssigned = existingPermissions.some(ep => ep.permission_id === permission.id);
      
      if (!isAssigned) {
        await prisma.$queryRaw`
          INSERT INTO role_permissions (role_id, permission_id, granted_by, granted_at)
          VALUES (${adminRole.id}::uuid, ${permission.id}::uuid, 'system', NOW())
        `;
        
        assignedCount++;
        console.log(`  ✓ Assigned: ${permission.name}`);
      } else {
        console.log(`  ⊙ Already assigned: ${permission.name}`);
      }
    }
    
    console.log(`\n✓ Successfully assigned ${assignedCount} new permissions to admin role`);
    
    // Step 5: Verify final permissions
    console.log('\nStep 5: Verifying final permissions...');
    const finalPermissions = await prisma.$queryRaw`
      SELECT rp.*, p.name as permission_name, r.name as role_name
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      JOIN roles r ON rp.role_id = r.id
      WHERE r.name = 'ADMIN' AND p.name LIKE 'cart:%'
      ORDER BY p.name
    `;
    
    console.log('\n✓ Final ADMIN role cart permissions:');
    finalPermissions.forEach(fp => {
      console.log(`  - ${fp.permission_name} (granted at: ${fp.granted_at})`);
    });
    
    console.log(`\n✅ SUCCESS! Admin role now has ${finalPermissions.length} cart permissions`);
    console.log('\nYou can now access /api/v1/admin/carts endpoints');
    
  } catch (error) {
    console.error('\n❌ Error granting cart permissions:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run script
grantCartPermissionsToAdmin();
