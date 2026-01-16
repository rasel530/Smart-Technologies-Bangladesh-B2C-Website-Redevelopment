/**
 * Fix user createdAt date
 * 
 * This script will update the createdAt date for a specific user
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUserCreatedAt() {
  console.log('=== Fixing User Created At Date ===\n');

  const userEmail = 'raselbepari88@gmail.com';
  // Use the actual creation time: January 11, 2026 at 18:30:21 local time (Bangladesh time)
  const correctDate = new Date('2026-01-11T18:30:21.000Z');

  try {
    // Check if user exists
    console.log('Checking for user...');
    let user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      console.log('User not found!');
      process.exit(1);
    }

    console.log(`Found user: ${user.email}`);
    console.log(`Current createdAt: ${user.createdAt}`);
    console.log(`Setting createdAt to: ${correctDate}`);

    // Update createdAt date
    user = await prisma.user.update({
      where: { email: userEmail },
      data: {
        createdAt: correctDate
      }
    });

    console.log('✓ User createdAt updated successfully!');
    console.log(`New createdAt: ${user.createdAt}`);

  } catch (error) {
    console.error('❌ Error updating user createdAt:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserCreatedAt();
