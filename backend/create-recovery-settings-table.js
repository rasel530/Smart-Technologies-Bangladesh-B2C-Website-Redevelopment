const { PrismaClient } = require('@prisma/client');

async function createTable() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Creating cart_recovery_settings table...');
    
    // Create the table using raw SQL
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "cart_recovery_settings" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "enabled" BOOLEAN NOT NULL DEFAULT true,
        "first_email_delay" INTEGER NOT NULL DEFAULT 1,
        "second_email_delay" INTEGER NOT NULL DEFAULT 24,
        "third_email_delay" INTEGER NOT NULL DEFAULT 72,
        "discount_enabled" BOOLEAN NOT NULL DEFAULT true,
        "discount_percentage" INTEGER NOT NULL DEFAULT 10,
        "discount_code" VARCHAR(50) NOT NULL DEFAULT 'COMEBACK10',
        "max_recovery_attempts" INTEGER NOT NULL DEFAULT 3,
        "min_cart_value" DECIMAL(12, 2) NOT NULL DEFAULT 1000,
        "email_from_name" VARCHAR(100) NOT NULL DEFAULT 'Smart Tech',
        "email_from_address" VARCHAR(255) NOT NULL DEFAULT 'noreply@smarttech.com',
        "cart_abandonment_threshold" INTEGER NOT NULL DEFAULT 30,
        "recovery_token_expiry" INTEGER NOT NULL DEFAULT 7,
        "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
      )
    `);
    
    console.log('✓ Table created successfully');
    
    // Create index
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_cart_recovery_settings_updated" 
      ON "cart_recovery_settings"("updated_at")
    `);
    
    console.log('✓ Index created successfully');
    
    // Insert default settings
    await prisma.$executeRawUnsafe(`
      INSERT INTO "cart_recovery_settings" (
        "enabled",
        "first_email_delay",
        "second_email_delay",
        "third_email_delay",
        "discount_enabled",
        "discount_percentage",
        "discount_code",
        "max_recovery_attempts",
        "min_cart_value",
        "email_from_name",
        "email_from_address",
        "cart_abandonment_threshold",
        "recovery_token_expiry"
      ) VALUES (
        true,
        1,
        24,
        72,
        true,
        10,
        'COMEBACK10',
        3,
        1000,
        'Smart Tech',
        'noreply@smarttech.com',
        30,
        7
      ) ON CONFLICT DO NOTHING
    `);
    
    console.log('✓ Default settings inserted successfully');
    
    // Verify the table was created
    const result = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count FROM "cart_recovery_settings"
    `);
    
    console.log(`✓ Verification: Found ${result[0].count} record(s) in cart_recovery_settings`);
    console.log('\n✓ Migration completed successfully!');
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    if (error.message.includes('already exists')) {
      console.log('Note: Table already exists, which is fine.');
    } else {
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTable();
