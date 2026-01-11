const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

(async () => {
  try {
    console.log('Applying migration: add_account_deletion_columns');

    // Execute each ALTER TABLE statement separately
    const statements = [
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "accountStatus" TEXT DEFAULT \'active\'',
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletionRequestedAt" TIMESTAMP(3)',
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletionReason" TEXT',
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3)',
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "preferredLanguage" TEXT DEFAULT \'en\''
    ];

    for (const sql of statements) {
      console.log('Executing:', sql);
      await prisma.$executeRawUnsafe(sql);
    }

    console.log('✅ Migration applied successfully!');

  } catch (e) {
    console.error('❌ Migration failed:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
