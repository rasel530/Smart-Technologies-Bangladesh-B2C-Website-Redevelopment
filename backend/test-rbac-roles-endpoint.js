/**
 * Test script to verify RBAC roles endpoint is working
 */

const { Pool } = require('pg');

// Database configuration
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://smart_dev:smart_dev_password_2024@localhost:5432/smart_ecommerce_dev';

async function testRBACRolesEndpoint() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
  });

  const client = await pool.connect();

  try {
    console.log('🔐 Connecting to database...');
    
    // Test direct database query
    const dbResult = await client.query(
      `SELECT id, name, description, hierarchy_level, created_at, updated_at 
       FROM roles 
       ORDER BY hierarchy_level ASC, name ASC`
    );
    
    console.log('\n✅ Database Query Result:');
    console.log(`Total roles found: ${dbResult.rows.length}`);
    console.log('');
    
    dbResult.rows.forEach((role, index) => {
      console.log(`${index + 1}. ${role.name}`);
      console.log(`   ID: ${role.id}`);
      console.log(`   Hierarchy Level: ${role.hierarchy_level}`);
      console.log(`   Description: ${role.description || 'No description'}`);
      console.log('');
    });
    
    // Test if we can query roles via HTTP
    console.log('\n🌐 Testing HTTP endpoint at http://localhost:3001/api/v1/rbac/roles');
    
    const response = await fetch('http://localhost:3001/api/v1/rbac/roles', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`\nHTTP Response Status: ${response.status}`);
    console.log(`HTTP Response Headers:`);
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ HTTP Response Data:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('\n❌ HTTP Error Response:');
      console.log(errorText);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

// Run the test
testRBACRolesEndpoint();
