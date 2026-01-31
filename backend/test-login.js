const fetch = require('node-fetch');

async function testLogin() {
  console.log('=== TESTING BACKEND LOGIN ENDPOINT ===\n');

  const testUsers = [
    { email: 'raselbepari88@gmail.com', password: '74Vfo^71~_oY' },
    { email: 'test.superadmin@smarttech.com', password: 'dpWcQf*YH2mwKSXd' },
    { email: 'admin@smarttech.com', password: 'AdminPassword123' },
    { email: 'admin2@smarttech.com', password: 'Xz@4@GvJA@zLduAb' }
  ];

  for (const testUser of testUsers) {
    console.log(`\n--- Testing login for: ${testUser.email} ---`);

    try {
      const response = await fetch('http://localhost:3001/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: testUser.email,
          password: testUser.password,
          rememberMe: false,
        }),
      });

      console.log(`Response Status: ${response.status} ${response.statusText}`);
      console.log(`Response Headers:`, Object.fromEntries(response.headers.entries()));

      const text = await response.text();
      console.log(`Response Body:`, text.substring(0, 500));

      if (response.ok) {
        const data = JSON.parse(text);
        console.log(`✅ Login SUCCESSFUL`);
        console.log(`   User ID: ${data.user?.id}`);
        console.log(`   Token: ${data.token ? data.token.substring(0, 20) + '...' : 'NULL'}`);
        console.log(`   Session ID: ${data.sessionId}`);
      } else {
        console.log(`❌ Login FAILED`);
        try {
          const errorData = JSON.parse(text);
          console.log(`   Error: ${errorData.error}`);
          console.log(`   Message: ${errorData.message}`);
          console.log(`   Message Bn: ${errorData.messageBn}`);
        } catch (e) {
          console.log(`   Could not parse error as JSON`);
        }
      }
    } catch (error) {
      console.error(`❌ Request ERROR: ${error.message}`);
    }
  }

  console.log('\n=== END OF LOGIN TEST ===');
}

testLogin().catch(console.error);
