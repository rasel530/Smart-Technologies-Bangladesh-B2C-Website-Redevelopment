/**
 * Verify SMS Subscriptions API
 * 
 * This script verifies that the SMS subscriptions API endpoint is working correctly
 * and returns the expected data.
 */

const http = require('http');

// Login credentials
const LOGIN_CREDENTIALS = {
  identifier: 'admin@smarttech.com',
  password: 'AdminPassword123'
};

// Make HTTP request
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(jsonData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${jsonData.message || jsonData.error || 'Unknown error'}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

(async () => {
  try {
    console.log('Verifying SMS Subscriptions API');
    console.log('='.repeat(80));
    console.log('');

    // Step 1: Login to get token
    console.log('Step 1: Logging in as admin...');
    const loginOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const loginResponse = await makeRequest(loginOptions, LOGIN_CREDENTIALS);
    const token = loginResponse.token;
    console.log('  Login successful!');
    console.log('  Token:', token.substring(0, 20) + '...');
    console.log('');

    // Step 2: Get SMS subscriptions
    console.log('Step 2: Fetching SMS subscriptions...');
    const subscriptionsOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v1/admin/local-payment/sms-subscriptions',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const subscriptionsResponse = await makeRequest(subscriptionsOptions);
    console.log('  Subscriptions fetched successfully!');
    console.log('');

    // Step 3: Display results
    console.log('Step 3: Displaying results...');
    console.log('='.repeat(80));
    console.log('');

    if (subscriptionsResponse.success && subscriptionsResponse.data) {
      const subscriptions = subscriptionsResponse.data;
      
      console.log(`Total subscriptions: ${subscriptions.length}`);
      console.log('');

      // Count by status
      const statusCounts = {
        active: subscriptions.filter(s => s.status === 'active').length,
        pending: subscriptions.filter(s => s.status === 'pending').length,
        cancelled: subscriptions.filter(s => s.status === 'cancelled').length,
        expired: subscriptions.filter(s => s.status === 'expired').length
      };

      console.log('Status Counts:');
      console.log(`  Active: ${statusCounts.active}`);
      console.log(`  Pending: ${statusCounts.pending}`);
      console.log(`  Cancelled: ${statusCounts.cancelled}`);
      console.log(`  Expired: ${statusCounts.expired}`);
      console.log('');

      // Calculate monthly revenue
      const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
      const monthlyRevenue = activeSubscriptions.reduce((sum, s) => sum + s.amount, 0);
      console.log(`Monthly Revenue: ${monthlyRevenue} BDT`);
      console.log('');

      // Display all subscriptions
      console.log('All Subscriptions:');
      console.log('='.repeat(80));
      subscriptions.forEach((sub, index) => {
        console.log(`${index + 1}. ID: ${sub.id}`);
        console.log(`   User: ${sub.user?.firstName} ${sub.user?.lastName} (${sub.user?.email})`);
        console.log(`   Phone: ${sub.phoneNumber}`);
        console.log(`   Status: ${sub.status}`);
        console.log(`   Payment Method: ${sub.paymentMethod}`);
        console.log(`   Amount: ${sub.amount} BDT`);
        console.log(`   Start Date: ${sub.startDate}`);
        console.log(`   End Date: ${sub.endDate || 'N/A'}`);
        console.log('');
      });

      // Step 4: Verification Summary
      console.log('='.repeat(80));
      console.log('Verification Summary:');
      console.log('='.repeat(80));
      console.log('');
      console.log('Expected Statistics on Admin Page:');
      console.log(`  Total Subscriptions: ${subscriptions.length}`);
      console.log(`  Active Count: ${statusCounts.active}`);
      console.log(`  Pending Count: ${statusCounts.pending}`);
      console.log(`  Monthly Revenue: ${monthlyRevenue} BDT`);
      console.log('');
      console.log('Search Test Data:');
      const phoneNumbers = subscriptions.map(s => s.phoneNumber);
      const names = subscriptions.map(s => `${s.user?.firstName} ${s.user?.lastName}`);
      const emails = subscriptions.map(s => s.user?.email);
      console.log(`  Phone Numbers: ${phoneNumbers.join(', ')}`);
      console.log(`  Names: ${names.join(', ')}`);
      console.log(`  Emails: ${emails.join(', ')}`);
      console.log('');

      console.log('Status Filter Test Data:');
      console.log(`  Active: ${statusCounts.active} subscription(s)`);
      console.log(`  Pending: ${statusCounts.pending} subscription(s)`);
      console.log(`  Cancelled: ${statusCounts.cancelled} subscription(s)`);
      console.log(`  Expired: ${statusCounts.expired} subscription(s)`);
      console.log('');

      console.log('='.repeat(80));
      console.log('✅ SMS Subscriptions API Verification Complete!');
      console.log('You can now test the admin page at:');
      console.log('http://localhost:3000/admin/local-payment/subscriptions');
      console.log('='.repeat(80));
    } else {
      console.log('❌ Failed to fetch subscriptions');
      console.log('Response:', JSON.stringify(subscriptionsResponse, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();
