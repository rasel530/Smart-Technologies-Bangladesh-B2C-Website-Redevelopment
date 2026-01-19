const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseColumns() {
  console.log('=== CHECKING DATABASE TABLE STRUCTURE ===\n');

  try {
    // Check user_notification_preferences table structure
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user_notification_preferences'
      ORDER BY ordinal_position
    `;

    console.log('user_notification_preferences table columns:');
    console.log('Column Name'.padEnd(30), 'Type'.padEnd(20), 'Nullable');
    console.log('-'.repeat(70));
    result.forEach(col => {
      console.log(
        col.column_name.padEnd(30),
        col.data_type.padEnd(20),
        col.is_nullable
      );
    });

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseColumns();
