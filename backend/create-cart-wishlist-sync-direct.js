const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    console.log('Creating cart_wishlist_sync table directly...\n');

    // Create the table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS cart_wishlist_sync (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        cart_id TEXT REFERENCES carts(id) ON DELETE CASCADE,
        wishlist_id UUID REFERENCES wishlists(id) ON DELETE CASCADE,
        sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'completed', 'failed')),
        last_sync_at TIMESTAMP,
        error_message TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await prisma.$executeRawUnsafe(createTableQuery);
    console.log('✅ Table created successfully!');

    // Create indexes
    console.log('\nCreating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_cart_wishlist_sync_user_id ON cart_wishlist_sync(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_cart_wishlist_sync_status ON cart_wishlist_sync(sync_status);',
      'CREATE INDEX IF NOT EXISTS idx_cart_wishlist_sync_last_sync ON cart_wishlist_sync(last_sync_at DESC);',
      'CREATE INDEX IF NOT EXISTS idx_cart_wishlist_sync_cart_id ON cart_wishlist_sync(cart_id);',
      'CREATE INDEX IF NOT EXISTS idx_cart_wishlist_sync_wishlist_id ON cart_wishlist_sync(wishlist_id);'
    ];

    for (const idx of indexes) {
      await prisma.$executeRawUnsafe(idx);
      console.log('✓ Index created');
    }

    // Create trigger
    console.log('\nCreating trigger...');
    const dropTrigger = 'DROP TRIGGER IF EXISTS update_cart_wishlist_sync_updated_at ON cart_wishlist_sync;';
    await prisma.$executeRawUnsafe(dropTrigger);

    const createTrigger = `
      CREATE TRIGGER update_cart_wishlist_sync_updated_at
        BEFORE UPDATE ON cart_wishlist_sync
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `;
    await prisma.$executeRawUnsafe(createTrigger);
    console.log('✓ Trigger created');

    console.log('\n✅ All operations completed successfully!');

  } catch (e) {
    console.error('\n❌ Error:', e.message);
    console.error('Details:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
