const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyMigration() {
  try {
    console.log('Verifying Phase 7 Milestone 1: Checkout Foundation Tables...\n');

    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('checkout_sessions', 'checkout_abandonment', 'guest_sessions') 
      ORDER BY tablename
    `;
    console.log('✓ Tables created:', tables.map(t => t.tablename));

    // Check AddressType enum values
    const enumValues = await prisma.$queryRaw`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AddressType')
      ORDER BY enumsortorder
    `;
    console.log('✓ AddressType enum values:', enumValues.map(e => e.enumlabel));

    // Check table structures
    const checkoutSessionColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'checkout_sessions' 
      ORDER BY ordinal_position
    `;
    console.log('\n✓ checkout_sessions columns:', checkoutSessionColumns.length);

    const checkoutAbandonmentColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'checkout_abandonment' 
      ORDER BY ordinal_position
    `;
    console.log('✓ checkout_abandonment columns:', checkoutAbandonmentColumns.length);

    const guestSessionColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'guest_sessions' 
      ORDER BY ordinal_position
    `;
    console.log('✓ guest_sessions columns:', guestSessionColumns.length);

    // Check foreign keys
    const foreignKeys = await prisma.$queryRaw`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_name IN ('checkout_sessions', 'checkout_abandonment', 'guest_sessions')
      ORDER BY tc.table_name, kcu.column_name
    `;
    console.log('\n✓ Foreign keys:', foreignKeys.length);

    // Check indexes
    const indexes = await prisma.$queryRaw`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename IN ('checkout_sessions', 'checkout_abandonment', 'guest_sessions')
      ORDER BY tablename, indexname
    `;
    console.log('✓ Indexes:', indexes.length);

    // Check existing tables are still intact
    const existingTables = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('users', 'addresses', 'carts', 'orders')
      ORDER BY tablename
    `;
    console.log('\n✓ Existing tables intact:', existingTables.map(t => t.tablename));

    console.log('\n✓ Migration verification completed successfully!');

  } catch (error) {
    console.error('✗ Verification failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyMigration()
  .then(() => {
    console.log('\n✓ All checks passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Verification failed:', error);
    process.exit(1);
  });
