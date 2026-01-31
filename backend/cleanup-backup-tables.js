const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupBackupTables() {
  try {
    console.log('Starting backup tables cleanup...');

    // Drop backup table 1
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS product_images_backup_20260128020128`);
    console.log('✓ Dropped product_images_backup_20260128020128');

    // Drop backup table 2
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS product_images_backup_20260128050134`);
    console.log('✓ Dropped product_images_backup_20260128050134');

    // Verify cleanup
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_name LIKE 'product_images_backup_%'
    `;

    console.log(`\nBackup tables cleanup completed`);
    console.log(`Remaining backup tables: ${result[0].count}`);

    if (result[0].count === 0) {
      console.log('✓ All backup tables successfully removed');
    } else {
      console.log('⚠ Some backup tables still exist');
    }

  } catch (error) {
    console.error('Error cleaning up backup tables:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupBackupTables()
  .then(() => {
    console.log('\n✓ Cleanup script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Cleanup script failed:', error);
    process.exit(1);
  });
