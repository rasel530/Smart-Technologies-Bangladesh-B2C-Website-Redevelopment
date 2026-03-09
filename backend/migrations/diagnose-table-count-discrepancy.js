const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://smart_dev:smart_dev_password_2024@localhost:5432/smart_ecommerce_dev'
});

async function diagnoseTableCountDiscrepancy() {
  const client = await pool.connect();

  try {
    console.log('========================================');
    console.log('TABLE COUNT DISCREPANCY DIAGNOSIS');
    console.log('========================================\n');

    // Part 1: Get accurate table count (BASE TABLES only)
    console.log('Part 1: Accurate Table Count (BASE TABLES only)\n');
    console.log('Query: SELECT COUNT(*) FROM information_schema.tables');
    console.log('       WHERE table_schema = \'public\' AND table_type = \'BASE TABLE\';\n');

    const baseTableCount = await client.query(`
      SELECT COUNT(*) as table_count
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE';
    `);

    console.log(`✓ Actual BASE TABLE count: ${baseTableCount.rows[0].table_count}\n`);

    // Part 2: Count views (which should be excluded)
    console.log('Part 2: Count Views (which should be excluded)\n');
    console.log('Query: SELECT COUNT(*) FROM information_schema.tables');
    console.log('       WHERE table_schema = \'public\' AND table_type = \'VIEW\';\n');

    const viewCount = await client.query(`
      SELECT COUNT(*) as view_count
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'VIEW';
    `);

    console.log(`✓ View count: ${viewCount.rows[0].view_count}\n`);

    // Part 3: Count all tables (what the verification script does)
    console.log('Part 3: Count All Tables (what verification script does)\n');
    console.log('Query: SELECT COUNT(*) FROM information_schema.tables');
    console.log('       WHERE table_schema = \'public\';\n');

    const allTablesCount = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public';
    `);

    console.log(`✓ All tables count (BASE TABLES + VIEWS): ${allTablesCount.rows[0].count}\n`);

    // Part 4: List all BASE TABLES
    console.log('Part 4: List All BASE TABLES\n');
    console.log('Query: SELECT table_name FROM information_schema.tables');
    console.log('       WHERE table_schema = \'public\' AND table_type = \'BASE TABLE\'');
    console.log('       ORDER BY table_name;\n');

    const baseTablesList = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`Found ${baseTablesList.rows.length} BASE TABLES:\n`);
    baseTablesList.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.table_name}`);
    });
    console.log();

    // Part 5: List all VIEWS
    console.log('Part 5: List All VIEWS\n');
    console.log('Query: SELECT table_name FROM information_schema.tables');
    console.log('       WHERE table_schema = \'public\' AND table_type = \'VIEW\'');
    console.log('       ORDER BY table_name;\n');

    const viewsList = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'VIEW'
      ORDER BY table_name;
    `);

    if (viewsList.rows.length > 0) {
      console.log(`Found ${viewsList.rows.length} VIEWS:\n`);
      viewsList.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.table_name}`);
      });
    } else {
      console.log('No views found.\n');
    }
    console.log();

    // Part 6: Verify payment tables (snake_case)
    console.log('Part 6: Verify Payment Tables (snake_case)\n');

    const paymentTablesCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name IN ('payment_transaction', 'payment_gateway_settings', 'payment_log')
      ORDER BY table_name;
    `);

    if (paymentTablesCheck.rows.length === 3) {
      console.log('✓ All 3 payment tables found with snake_case names:');
      paymentTablesCheck.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.error(`✗ ERROR: Expected 3 payment tables, found ${paymentTablesCheck.rows.length}`);
    }
    console.log();

    // Part 7: Check for camelCase payment tables (should not exist)
    console.log('Part 7: Check for camelCase Payment Tables (should not exist)\n');

    const camelCaseCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('PaymentTransaction', 'PaymentGatewaySettings', 'PaymentLog')
      ORDER BY table_name;
    `);

    if (camelCaseCheck.rows.length > 0) {
      console.error('✗ ERROR: Found camelCase table names (should not exist):');
      camelCaseCheck.rows.forEach(row => {
        console.error(`  - ${row.table_name}`);
      });
    } else {
      console.log('✓ No camelCase payment tables found (as expected)');
    }
    console.log();

    // Part 8: Summary and Analysis
    console.log('========================================');
    console.log('SUMMARY AND ANALYSIS');
    console.log('========================================\n');

    console.log('Table Counts:');
    console.log(`  - BASE TABLES (actual):     ${baseTableCount.rows[0].table_count}`);
    console.log(`  - VIEWS:                   ${viewCount.rows[0].view_count}`);
    console.log(`  - TOTAL (BASE + VIEWS):    ${allTablesCount.rows[0].count}`);
    console.log();

    console.log('Discrepancy Explanation:');
    if (parseInt(allTablesCount.rows[0].count) === 85 && parseInt(baseTableCount.rows[0].table_count) === 84) {
      console.log('  ✓ The verification script reported 85 tables because it counted');
      console.log('    both BASE TABLES (84) and VIEWS (1).');
      console.log();
      console.log('  ✓ The user sees 84 tables because only BASE TABLES are');
      console.log('    visible in database tools by default.');
      console.log();
      console.log('  ✓ The discrepancy is caused by the verification script not');
      console.log('    filtering by table_type = \'BASE TABLE\'.');
    } else {
      console.log('  - The discrepancy does not match the expected pattern.');
      console.log('  - Further investigation may be needed.');
    }
    console.log();

    console.log('Payment Tables:');
    console.log(`  - Snake_case tables found: ${paymentTablesCheck.rows.length}/3`);
    console.log(`  - CamelCase tables found:  ${camelCaseCheck.rows.length}/3`);
    console.log();

    if (paymentTablesCheck.rows.length === 3 && camelCaseCheck.rows.length === 0) {
      console.log('✓ Payment tables are correctly named with snake_case.');
    } else {
      console.log('✗ Payment tables may have naming issues.');
    }
    console.log();

    console.log('========================================');
    console.log('DIAGNOSIS COMPLETE');
    console.log('========================================\n');

  } catch (error) {
    console.error('Diagnosis failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

diagnoseTableCountDiscrepancy();
