const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://smart_dev:smart_dev_password_2024@localhost:5432/smart_ecommerce_dev'
});

async function checkPaymentTables() {
  const client = await pool.connect();

  try {
    console.log('Checking payment gateway tables...\n');

    // Check PaymentTransaction table
    const paymentTransactionColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'PaymentTransaction'
      ORDER BY ordinal_position;
    `);

    console.log('PaymentTransaction columns:');
    paymentTransactionColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    // Check PaymentGatewaySettings table
    const paymentGatewaySettingsColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'PaymentGatewaySettings'
      ORDER BY ordinal_position;
    `);

    console.log('\nPaymentGatewaySettings columns:');
    paymentGatewaySettingsColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    // Check PaymentLog table
    const paymentLogColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'PaymentLog'
      ORDER BY ordinal_position;
    `);

    console.log('\nPaymentLog columns:');
    paymentLogColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.release();
    await pool.end();
  }
}

checkPaymentTables();
