/**
 * Script to list all roles from database
 * Shows role details including hierarchy level and description
 */

const { Pool } = require('pg');

// Database configuration
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://smart_dev:smart_dev_password_2024@localhost:5432/smart_ecommerce_dev';

async function listAllRoles() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
  });

  const client = await pool.connect();

  try {
    console.log('🔐 Connecting to database...');
    
    // Query all roles
    const result = await client.query(
      `SELECT id, name, description, hierarchy_level, created_at, updated_at 
       FROM roles 
       ORDER BY hierarchy_level ASC, name ASC`
    );
    
    console.log('\n📋 All Roles in Database:\n');
    console.log('═'.repeat(80));
    
    if (result.rows.length === 0) {
      console.log('❌ No roles found in database');
    } else {
      result.rows.forEach((role, index) => {
        console.log(`\n${index + 1}. ${role.name}`);
        console.log(`   ID: ${role.id}`);
        console.log(`   Hierarchy Level: ${role.hierarchy_level}`);
        console.log(`   Description: ${role.description || 'No description'}`);
        console.log(`   Created: ${role.created_at}`);
        console.log(`   Updated: ${role.updated_at}`);
        console.log('─'.repeat(80));
      });
      
      console.log(`\n✅ Total: ${result.rows.length} role(s) found`);
    }
    
  } catch (error) {
    console.error('❌ Error fetching roles:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

// Run the script
listAllRoles();
