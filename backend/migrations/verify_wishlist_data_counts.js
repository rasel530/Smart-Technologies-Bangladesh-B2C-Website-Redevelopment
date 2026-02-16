const dotenv = require('dotenv');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function verifyWishlistDataCounts() {
  console.log('============================================');
  console.log('WISHLIST DATA COUNT VERIFICATION');
  console.log('============================================\n');

  try {
    // ============================================
    // 1. CHECK ACTIVE TABLES DATA COUNTS
    // ============================================
    console.log('ACTIVE TABLES:');
    console.log('-------------');

    // Check wishlists table
    const wishlistsCount = await pool.query('SELECT COUNT(*) as count FROM wishlists');
    const wishlistsCountValue = parseInt(wishlistsCount.rows[0].count);
    console.log(`  wishlists:              ${wishlistsCountValue} rows ${wishlistsCountValue === 0 ? '(EMPTY)' : '(CONTAINS DATA)'}`);

    // Check wishlist_items table
    const wishlistItemsCount = await pool.query('SELECT COUNT(*) as count FROM wishlist_items');
    const wishlistItemsCountValue = parseInt(wishlistItemsCount.rows[0].count);
    console.log(`  wishlist_items:         ${wishlistItemsCountValue} rows ${wishlistItemsCountValue === 0 ? '(EMPTY)' : '(CONTAINS DATA)'}`);

    // Check wishlist_analytics table
    const wishlistAnalyticsCount = await pool.query('SELECT COUNT(*) as count FROM wishlist_analytics');
    const wishlistAnalyticsCountValue = parseInt(wishlistAnalyticsCount.rows[0].count);
    console.log(`  wishlist_analytics:     ${wishlistAnalyticsCountValue} rows ${wishlistAnalyticsCountValue === 0 ? '(EMPTY)' : '(CONTAINS DATA)'}`);

    // ============================================
    // 2. CHECK REDUNDANT TABLES DATA COUNTS
    // ============================================
    console.log('\nREDUNDANT TABLES:');
    console.log('-----------------');

    // Check if wishlists_new table exists
    const wishlistsNewExists = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'wishlists_new'
      ) as exists
    `);

    let wishlistsNewCountValue = 0;
    if (wishlistsNewExists.rows[0].exists) {
      const wishlistsNewCount = await pool.query('SELECT COUNT(*) as count FROM wishlists_new');
      wishlistsNewCountValue = parseInt(wishlistsNewCount.rows[0].count);
      console.log(`  wishlists_new:          ${wishlistsNewCountValue} rows ${wishlistsNewCountValue === 0 ? '(EMPTY - SAFE TO DROP)' : '(CONTAINS DATA - DO NOT DROP)'}`);
    } else {
      console.log('  wishlists_new:          (TABLE DOES NOT EXIST)');
    }

    // Check if wishlist_items_new table exists
    const wishlistItemsNewExists = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'wishlist_items_new'
      ) as exists
    `);

    let wishlistItemsNewCountValue = 0;
    if (wishlistItemsNewExists.rows[0].exists) {
      const wishlistItemsNewCount = await pool.query('SELECT COUNT(*) as count FROM wishlist_items_new');
      wishlistItemsNewCountValue = parseInt(wishlistItemsNewCount.rows[0].count);
      console.log(`  wishlist_items_new:     ${wishlistItemsNewCountValue} rows ${wishlistItemsNewCountValue === 0 ? '(EMPTY - SAFE TO DROP)' : '(CONTAINS DATA - DO NOT DROP)'}`);
    } else {
      console.log('  wishlist_items_new:     (TABLE DOES NOT EXIST)');
    }

    // ============================================
    // 3. DISPLAY SAMPLE DATA FROM ACTIVE TABLES
    // ============================================
    if (wishlistsCountValue > 0) {
      console.log('\n--- SAMPLE DATA: wishlists (first 5 rows) ---');
      const wishlistsSample = await pool.query(`
        SELECT 
          id::text as id, 
          user_id::text as user_id, 
          name, 
          is_default::text as is_default, 
          is_public::text as is_public, 
          COALESCE(share_token, 'NULL') as share_token,
          created_at::text as created_at, 
          updated_at::text as updated_at
        FROM wishlists 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      
      console.log('id | user_id | name | is_default | is_public | share_token | created_at | updated_at');
      console.log('---|---------|------|------------|-----------|-------------|------------|------------');
      wishlistsSample.rows.forEach(row => {
        console.log(`${row.id} | ${row.user_id} | ${row.name} | ${row.is_default} | ${row.is_public} | ${row.share_token} | ${row.created_at} | ${row.updated_at}`);
      });
    }

    if (wishlistItemsCountValue > 0) {
      console.log('\n--- SAMPLE DATA: wishlist_items (first 5 rows) ---');
      const wishlistItemsSample = await pool.query(`
        SELECT 
          id::text as id, 
          wishlist_id::text as wishlist_id, 
          product_id::text as product_id, 
          added_at::text as added_at
        FROM wishlist_items 
        ORDER BY added_at DESC 
        LIMIT 5
      `);
      
      console.log('id | wishlist_id | product_id | added_at');
      console.log('---|-------------|------------|------------');
      wishlistItemsSample.rows.forEach(row => {
        console.log(`${row.id} | ${row.wishlist_id} | ${row.product_id} | ${row.added_at}`);
      });
    }

    if (wishlistAnalyticsCountValue > 0) {
      console.log('\n--- SAMPLE DATA: wishlist_analytics (first 5 rows) ---');
      const wishlistAnalyticsSample = await pool.query(`
        SELECT 
          id::text as id, 
          wishlist_id::text as wishlist_id, 
          event_type, 
          COALESCE(user_id::text, 'NULL') as user_id,
          metadata::text as metadata, 
          created_at::text as created_at
        FROM wishlist_analytics 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      
      console.log('id | wishlist_id | event_type | user_id | metadata | created_at');
      console.log('---|-------------|------------|---------|----------|------------');
      wishlistAnalyticsSample.rows.forEach(row => {
        console.log(`${row.id} | ${row.wishlist_id} | ${row.event_type} | ${row.user_id} | ${row.metadata} | ${row.created_at}`);
      });
    }

    // ============================================
    // 4. DISPLAY SAMPLE DATA FROM REDUNDANT TABLES (if they exist and have data)
    // ============================================
    if (wishlistsNewExists.rows[0].exists && wishlistsNewCountValue > 0) {
      console.log('\n--- SAMPLE DATA: wishlists_new (first 5 rows) ---');
      const wishlistsNewSample = await pool.query(`
        SELECT 
          id::text as id, 
          user_id::text as user_id, 
          name, 
          is_default::text as is_default, 
          is_public::text as is_public, 
          COALESCE(share_token, 'NULL') as share_token,
          created_at::text as created_at, 
          updated_at::text as updated_at
        FROM wishlists_new 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      
      console.log('id | user_id | name | is_default | is_public | share_token | created_at | updated_at');
      console.log('---|---------|------|------------|-----------|-------------|------------|------------');
      wishlistsNewSample.rows.forEach(row => {
        console.log(`${row.id} | ${row.user_id} | ${row.name} | ${row.is_default} | ${row.is_public} | ${row.share_token} | ${row.created_at} | ${row.updated_at}`);
      });
    }

    if (wishlistItemsNewExists.rows[0].exists && wishlistItemsNewCountValue > 0) {
      console.log('\n--- SAMPLE DATA: wishlist_items_new (first 5 rows) ---');
      const wishlistItemsNewSample = await pool.query(`
        SELECT 
          id::text as id, 
          wishlist_id::text as wishlist_id, 
          product_id::text as product_id, 
          added_at::text as added_at
        FROM wishlist_items_new 
        ORDER BY added_at DESC 
        LIMIT 5
      `);
      
      console.log('id | wishlist_id | product_id | added_at');
      console.log('---|-------------|------------|------------');
      wishlistItemsNewSample.rows.forEach(row => {
        console.log(`${row.id} | ${row.wishlist_id} | ${row.product_id} | ${row.added_at}`);
      });
    }

    // ============================================
    // 5. SUMMARY REPORT
    // ============================================
    const totalActiveRows = wishlistsCountValue + wishlistItemsCountValue + wishlistAnalyticsCountValue;
    const totalRedundantRows = wishlistsNewCountValue + wishlistItemsNewCountValue;

    console.log('\n============================================');
    console.log('WISHLIST DATA COUNT SUMMARY REPORT');
    console.log('============================================');
    console.log('');
    console.log('ACTIVE TABLES:');
    console.log(`  wishlists:              ${wishlistsCountValue} rows ${wishlistsCountValue === 0 ? '(EMPTY)' : '(CONTAINS DATA)'}`);
    console.log(`  wishlist_items:         ${wishlistItemsCountValue} rows ${wishlistItemsCountValue === 0 ? '(EMPTY)' : '(CONTAINS DATA)'}`);
    console.log(`  wishlist_analytics:     ${wishlistAnalyticsCountValue} rows ${wishlistAnalyticsCountValue === 0 ? '(EMPTY)' : '(CONTAINS DATA)'}`);
    console.log('');
    console.log('REDUNDANT TABLES:');
    if (wishlistsNewExists.rows[0].exists) {
      console.log(`  wishlists_new:          ${wishlistsNewCountValue} rows ${wishlistsNewCountValue === 0 ? '(EMPTY - SAFE TO DROP)' : '(CONTAINS DATA - DO NOT DROP)'}`);
    } else {
      console.log('  wishlists_new:          (TABLE DOES NOT EXIST)');
    }
    if (wishlistItemsNewExists.rows[0].exists) {
      console.log(`  wishlist_items_new:     ${wishlistItemsNewCountValue} rows ${wishlistItemsNewCountValue === 0 ? '(EMPTY - SAFE TO DROP)' : '(CONTAINS DATA - DO NOT DROP)'}`);
    } else {
      console.log('  wishlist_items_new:     (TABLE DOES NOT EXIST)');
    }
    console.log('');
    console.log('TOTALS:');
    console.log(`  Active tables total:     ${totalActiveRows} rows`);
    console.log(`  Redundant tables total: ${totalRedundantRows} rows`);
    console.log('');

    // Safety check for dropping redundant tables
    if (totalRedundantRows === 0) {
      console.log('SAFETY STATUS: ✓ REDUNDANT TABLES ARE EMPTY - SAFE TO DROP');
    } else {
      console.log('SAFETY STATUS: ⚠ REDUNDANT TABLES CONTAIN DATA - DO NOT DROP');
    }

    console.log('============================================');

    // ============================================
    // 6. RELATIONSHIP ANALYSIS (if data exists)
    // ============================================
    if (wishlistsCountValue > 0) {
      console.log('\n--- RELATIONSHIP ANALYSIS ---');
      const relationshipAnalysis = await pool.query(`
        SELECT 
          w.id as wishlist_id,
          w.name as wishlist_name,
          w.user_id,
          COUNT(wi.id) as item_count,
          COUNT(wa.id) as analytics_count
        FROM wishlists w
        LEFT JOIN wishlist_items wi ON w.id = wi.wishlist_id
        LEFT JOIN wishlist_analytics wa ON w.id = wa.wishlist_id
        GROUP BY w.id, w.name, w.user_id
        ORDER BY item_count DESC
        LIMIT 10
      `);
      
      console.log('wishlist_id | wishlist_name | user_id | item_count | analytics_count');
      console.log('-------------|---------------|---------|------------|----------------');
      relationshipAnalysis.rows.forEach(row => {
        console.log(`${row.wishlist_id} | ${row.wishlist_name} | ${row.user_id} | ${row.item_count} | ${row.analytics_count}`);
      });
    }

    console.log('\n============================================');
    console.log('VERIFICATION COMPLETE');
    console.log('============================================');

  } catch (error) {
    console.error('Error during verification:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Execute the verification
verifyWishlistDataCounts();
