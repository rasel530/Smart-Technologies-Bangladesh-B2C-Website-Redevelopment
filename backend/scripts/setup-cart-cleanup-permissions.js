/**
 * RBAC Permission Setup Script for Cart Cleanup
 * 
 * This script creates the required permissions for cart cleanup operations.
 * 
 * Required Permissions:
 * - cart:delete - For cleanup of expired carts, reservations, and full cleanup
 * - cart:write - For marking carts as abandoned and sending reminders
 * - cart:read - For viewing cleanup stats, history, and scheduler status
 * - cart:admin - For starting/stopping scheduler and running manual jobs
 * 
 * Run: node setup-cart-cleanup-permissions.js
 */

const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Setting up cart cleanup permissions...\n');
    
    // Define the permissions needed for cart cleanup
    const permissions = [
      {
        name: 'cart:delete',
        resource: 'cart',
        action: 'delete',
        description: 'Delete/cleanup expired carts, reservations, and run full cleanup'
      },
      {
        name: 'cart:write',
        resource: 'cart',
        action: 'write',
        description: 'Mark carts as abandoned and send recovery reminders'
      },
      {
        name: 'cart:read',
        resource: 'cart',
        action: 'read',
        description: 'View cleanup statistics, history, and scheduler status'
      },
      {
        name: 'cart:admin',
        resource: 'cart',
        action: 'admin',
        description: 'Manage cleanup scheduler - start/stop and run manual jobs'
      }
    ];
    
    // Create or update permissions
    for (const perm of permissions) {
      const existing = await prisma.permissions.findFirst({
        where: { name: perm.name }
      });
      
      if (existing) {
        console.log(`✓ Permission '${perm.name}' already exists (ID: ${existing.id})`);
        
        // Update description if changed
        if (existing.description !== perm.description) {
          await prisma.permissions.update({
            where: { id: existing.id },
            data: { description: perm.description }
          });
          console.log(`  Updated description: ${perm.description}`);
        }
      } else {
        const created = await prisma.permissions.create({
          data: perm
        });
        console.log(`✓ Created permission '${perm.name}' (ID: ${created.id})`);
      }
    }
    
    console.log('\nPermission setup completed!');
    console.log('\nSummary of cart cleanup permissions:');
    console.log('-------------------------------------');
    for (const perm of permissions) {
      console.log(`- ${perm.name}: ${perm.description}`);
    }
    
    // Verify by fetching all cart permissions
    console.log('\nVerifying cart permissions in database...');
    const cartPerms = await prisma.permissions.findMany({
      where: { resource: 'cart' },
      orderBy: { name: 'asc' }
    });
    
    console.log(`Found ${cartPerms.length} cart permissions:`);
    for (const p of cartPerms) {
      console.log(`  - ${p.name} (${p.action})`);
    }
    
  } catch (error) {
    console.error('Error setting up permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('\nRBAC permission setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nRBAC permission setup failed:', error);
    process.exit(1);
  });
