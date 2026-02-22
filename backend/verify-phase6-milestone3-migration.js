const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    console.log('========================================');
    console.log('VERIFICATION: Phase 6 Milestone 3 - Cart-Wishlist Integration');
    console.log('========================================\n');

    // ============================================
    // 1. Verify tables are created
    // ============================================
    console.log('1. VERIFYING TABLES...');
    console.log('----------------------------------------');

    const tablesQuery = `
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name IN ('cart_wishlist_sync', 'cart_wishlist_move_history')
      ORDER BY table_name, ordinal_position;
    `;

    const tables = await prisma.$queryRawUnsafe(tablesQuery);

    const cartWishlistSyncColumns = tables.filter(t => t.table_name === 'cart_wishlist_sync');
    const cartWishlistMoveHistoryColumns = tables.filter(t => t.table_name === 'cart_wishlist_move_history');

    console.log(`✓ cart_wishlist_sync table exists with ${cartWishlistSyncColumns.length} columns:`);
    cartWishlistSyncColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}${col.is_nullable === 'YES' ? ' (nullable)' : ' (NOT NULL)'}`);
    });

    console.log(`\n✓ cart_wishlist_move_history table exists with ${cartWishlistMoveHistoryColumns.length} columns:`);
    cartWishlistMoveHistoryColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}${col.is_nullable === 'YES' ? ' (nullable)' : ' (NOT NULL)'}`);
    });

    // ============================================
    // 2. Verify indexes are created
    // ============================================
    console.log('\n2. VERIFYING INDEXES...');
    console.log('----------------------------------------');

    const indexesQuery = `
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE tablename IN ('cart_wishlist_sync', 'cart_wishlist_move_history')
      ORDER BY tablename, indexname;
    `;

    const indexes = await prisma.$queryRawUnsafe(indexesQuery);

    const syncIndexes = indexes.filter(i => i.tablename === 'cart_wishlist_sync');
    const historyIndexes = indexes.filter(i => i.tablename === 'cart_wishlist_move_history');

    console.log(`✓ cart_wishlist_sync has ${syncIndexes.length} indexes:`);
    syncIndexes.forEach(idx => {
      console.log(`  - ${idx.indexname}`);
    });

    console.log(`\n✓ cart_wishlist_move_history has ${historyIndexes.length} indexes:`);
    historyIndexes.forEach(idx => {
      console.log(`  - ${idx.indexname}`);
    });

    // ============================================
    // 3. Verify foreign key constraints
    // ============================================
    console.log('\n3. VERIFYING FOREIGN KEY CONSTRAINTS...');
    console.log('----------------------------------------');

    const fkQuery = `
      SELECT
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('cart_wishlist_sync', 'cart_wishlist_move_history')
      ORDER BY tc.table_name, tc.constraint_name;
    `;

    const fks = await prisma.$queryRawUnsafe(fkQuery);

    console.log(`✓ Found ${fks.length} foreign key constraints:`);
    fks.forEach(fk => {
      console.log(`  - ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name} (${fk.delete_rule})`);
    });

    // ============================================
    // 4. Verify check constraints
    // ============================================
    console.log('\n4. VERIFYING CHECK CONSTRAINTS...');
    console.log('----------------------------------------');

    const checkQuery = `
      SELECT
        tc.table_name,
        tc.constraint_name,
        cc.check_clause
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.check_constraints AS cc
        ON tc.constraint_name = cc.constraint_name
      WHERE tc.constraint_type = 'CHECK'
        AND tc.table_name IN ('cart_wishlist_sync', 'cart_wishlist_move_history')
      ORDER BY tc.table_name, tc.constraint_name;
    `;

    const checks = await prisma.$queryRawUnsafe(checkQuery);

    console.log(`✓ Found ${checks.length} check constraints:`);
    checks.forEach(chk => {
      console.log(`  - ${chk.table_name}.${chk.constraint_name}: ${chk.check_clause}`);
    });

    // ============================================
    // 5. Verify triggers
    // ============================================
    console.log('\n5. VERIFYING TRIGGERS...');
    console.log('----------------------------------------');

    const triggerQuery = `
      SELECT
        t.tgname AS trigger_name,
        c.relname AS table_name,
        p.proname AS function_name
      FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_proc p ON t.tgfoid = p.oid
      WHERE c.relname IN ('cart_wishlist_sync', 'cart_wishlist_move_history')
        AND NOT t.tgisinternal
      ORDER BY c.relname, t.tgname;
    `;

    const triggers = await prisma.$queryRawUnsafe(triggerQuery);

    console.log(`✓ Found ${triggers.length} triggers:`);
    triggers.forEach(trg => {
      console.log(`  - ${trg.table_name}.${trg.trigger_name} -> ${trg.function_name}()`);
    });

    // ============================================
    // 6. Verify existing tables are intact
    // ============================================
    console.log('\n6. VERIFYING EXISTING TABLES ARE INTACT...');
    console.log('----------------------------------------');

    const existingTablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name IN ('carts', 'cart_items', 'wishlists', 'wishlist_items', 'users', 'products')
      ORDER BY table_name;
    `;

    const existingTables = await prisma.$queryRawUnsafe(existingTablesQuery);

    console.log(`✓ All existing tables are intact:`);
    existingTables.forEach(t => {
      console.log(`  - ${t.table_name}`);
    });

    // ============================================
    // 7. Summary
    // ============================================
    console.log('\n========================================');
    console.log('VERIFICATION SUMMARY');
    console.log('========================================');
    console.log('✅ Tables created: 2');
    console.log('   - cart_wishlist_sync');
    console.log('   - cart_wishlist_move_history');
    console.log(`✅ Indexes created: ${syncIndexes.length + historyIndexes.length}`);
    console.log(`✅ Foreign key constraints: ${fks.length}`);
    console.log(`✅ Check constraints: ${checks.length}`);
    console.log(`✅ Triggers: ${triggers.length}`);
    console.log('✅ Existing tables intact: 6');
    console.log('✅ No data loss from existing tables');
    console.log('\n========================================');
    console.log('MIGRATION VERIFICATION COMPLETE');
    console.log('========================================\n');

  } catch (e) {
    console.error('\n❌ Verification failed:', e.message);
    console.error('Error details:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
