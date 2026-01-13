/**
 * Find Test User for API Testing
 */

require('dotenv').config();
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
const pool = new Pool({ connectionString: DATABASE_URL });

async function findTestUser() {
  let client;
  try {
    client = await pool.connect();
    console.log('='.repeat(70));
    console.log('FIND TEST USER FOR API TESTING');
    console.log('='.repeat(70));

    // Find any user
    const result = await client.query(
      `SELECT id, email, "firstName", "lastName", role, "status"
       FROM users
       ORDER BY "createdAt" DESC
       LIMIT 5`
    );

    if (result.rows.length > 0) {
      console.log(`\n✅ Found ${result.rows.length} user(s):\n`);
      result.rows.forEach((user, index) => {
        console.log(`   [${index + 1}] ID: ${user.id}`);
        console.log(`       Email: ${user.email}`);
        console.log(`       Name: ${user.firstName} ${user.lastName}`);
        console.log(`       Role: ${user.role}`);
        console.log(`       Status: ${user.status}`);
        console.log('');
      });
      console.log('Use any of these users for API testing.');
      console.log('You will need the user\'s password to login.');
    } else {
      console.log('\n⚠️  No active users found in the database.');
      console.log('Please register a user first via the frontend application.');
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (client) {
      await client.release();
    }
    await pool.end();
  }
}

findTestUser();
