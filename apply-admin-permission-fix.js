/**
 * Apply Admin Permission Fix
 * Grants user:assign_role permission to ADMIN role
 */

const { Pool } = require('pg');

// Database configuration
const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'smart_ecommerce_dev',
  user: 'smart_dev',
  password: 'smart_dev_password_2024'
};

const pool = new Pool(DB_CONFIG);

async function applyFix() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  Granting user:assign_role Permission to ADMIN Role              ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  try {
    await pool.connect();
    console.log('✓ Connected to database\n');

    // Grant user:assign_role permission to ADMIN role
    const grantQuery = `
      INSERT INTO role_permissions (role_id, permission_id, granted_at, granted_by)
      SELECT 
        r.id as role_id,
        p.id as permission_id,
        NOW() as granted_at,
        'RBAC_FIX_SCRIPT' as granted_by
      FROM roles r
      JOIN permissions p ON p.name = 'user:assign_role'
      WHERE r.name = 'ADMIN'
      ON CONFLICT (role_id, permission_id) DO NOTHING
    `;

    const result = await pool.query(grantQuery);
    console.log(`✓ Permission granted (Rows affected: ${result.rowCount})\n`);

    // Verify the assignment
    const verifyQuery = `
      SELECT 
        r.name as role_name,
        p.name as permission_name,
        rp.granted_at
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE r.name = 'ADMIN' AND p.name = 'user:assign_role'
    `;

    const verifyResult = await pool.query(verifyQuery);
    
    if (verifyResult.rows.length > 0) {
      console.log('✓ Verification successful:');
      console.log(`  Role: ${verifyResult.rows[0].role_name}`);
      console.log(`  Permission: ${verifyResult.rows[0].permission_name}`);
      console.log(`  Granted at: ${verifyResult.rows[0].granted_at}\n`);
      console.log('╔══════════════════════════════════════════════════════════╗');
      console.log('║  Fix Applied Successfully!                                        ║');
      console.log('╚══════════════════════════════════════════════════════════╝\n');
    } else {
      console.log('✗ Verification failed - permission not found\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
    console.log('✓ Database connection closed');
  }
}

applyFix();
