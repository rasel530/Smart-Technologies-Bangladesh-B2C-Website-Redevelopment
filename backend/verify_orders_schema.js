const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkOrdersSchema() {
  try {
    // Get the orders table structure
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'orders'
      ORDER BY ordinal_position;
    `;

    console.log('Orders table columns:');
    console.table(result);

    // Check specifically for corporate_account_id
    const corporateColumn = result.find(col => col.column_name === 'corporate_account_id');
    if (corporateColumn) {
      console.log('\n✓ corporate_account_id column EXISTS in orders table');
      console.log('  Data type:', corporateColumn.data_type);
      console.log('  Nullable:', corporateColumn.is_nullable);
    } else {
      console.log('\n✗ corporate_account_id column DOES NOT EXIST in orders table');
    }
  } catch (error) {
    console.error('Error checking orders schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrdersSchema();
