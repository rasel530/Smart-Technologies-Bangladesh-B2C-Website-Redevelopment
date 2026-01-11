const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

(async () => {
  try {
    // Read migration SQL
    const migrationPath = path.join(__dirname, 'prisma/migrations/add_triggers/migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying migration: add_triggers');
    console.log('SQL:', migrationSQL);

    // Execute each statement separately
    const statements = [
      'CREATE OR REPLACE FUNCTION update_user_notification_preferences_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW."updatedAt" = CURRENT_TIMESTAMP; RETURN NEW; END; $$ LANGUAGE plpgsql;',
      'DROP TRIGGER IF EXISTS update_user_notification_preferences_updated_at ON "user_notification_preferences"',
      'CREATE TRIGGER update_user_notification_preferences_updated_at BEFORE UPDATE ON "user_notification_preferences" FOR EACH ROW EXECUTE FUNCTION update_user_notification_preferences_updated_at();',
      'CREATE OR REPLACE FUNCTION update_user_communication_preferences_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW."updatedAt" = CURRENT_TIMESTAMP; RETURN NEW; END; $$ LANGUAGE plpgsql;',
      'DROP TRIGGER IF EXISTS update_user_communication_preferences_updated_at ON "user_communication_preferences"',
      'CREATE TRIGGER update_user_communication_preferences_updated_at BEFORE UPDATE ON "user_communication_preferences" FOR EACH ROW EXECUTE FUNCTION update_user_communication_preferences_updated_at();',
      'CREATE OR REPLACE FUNCTION update_user_privacy_settings_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW."updatedAt" = CURRENT_TIMESTAMP; RETURN NEW; END; $$ LANGUAGE plpgsql;',
      'DROP TRIGGER IF EXISTS update_user_privacy_settings_updated_at ON "user_privacy_settings"',
      'CREATE TRIGGER update_user_privacy_settings_updated_at BEFORE UPDATE ON "user_privacy_settings" FOR EACH ROW EXECUTE FUNCTION update_user_privacy_settings_updated_at();'
    ];

    for (const sql of statements) {
      console.log('Executing:', sql);
      await prisma.$executeRawUnsafe(sql);
    }

    console.log('✅ Triggers migration applied successfully!');

  } catch (e) {
    console.error('❌ Migration failed:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
