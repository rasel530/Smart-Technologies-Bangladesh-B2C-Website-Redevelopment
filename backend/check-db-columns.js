const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Check users table columns
    const result = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('accountStatus', 'deletionRequestedAt', 'deletedAt', 'deletionReason')
    `;
    console.log('Users table columns:', JSON.stringify(result, null, 2));

    // Check if account preferences tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN (
        'user_notification_preferences',
        'user_communication_preferences',
        'user_privacy_settings',
        'account_deletion_requests',
        'user_data_exports'
      )
      ORDER BY table_name
    `;
    console.log('\nAccount preferences tables:', JSON.stringify(tables, null, 2));

    // Check triggers
    const triggers = await prisma.$queryRaw`
      SELECT trigger_name 
      FROM information_schema.triggers 
      WHERE trigger_name LIKE 'update_%_updated_at'
      ORDER BY trigger_name
    `;
    console.log('\nTriggers:', JSON.stringify(triggers, null, 2));

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
