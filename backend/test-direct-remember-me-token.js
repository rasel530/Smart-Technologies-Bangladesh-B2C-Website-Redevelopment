const { sessionService } = require('./services/sessionService');

async function testRememberMeTokenCreation() {
  console.log('=== Testing Direct Remember Me Token Creation ===\n');

  // Create a mock request object
  const mockReq = {
    ip: '127.0.0.1',
    get: (header) => {
      if (header === 'User-Agent') return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      if (header === 'Accept-Language') return 'en-US,en;q=0.9';
      if (header === 'Accept-Encoding') return 'gzip, deflate, br';
      return null;
    }
  };

  const userId = '99485f62-8959-42e8-9d29-aea9ad037f02'; // Test user ID

  try {
    console.log('Step 1: Calling sessionService.createRememberMeToken()');
    console.log('User ID:', userId);
    console.log('Request IP:', mockReq.ip);
    console.log('Request User-Agent:', mockReq.get('User-Agent'));

    const result = await sessionService.createRememberMeToken(userId, mockReq);

    console.log('\nStep 2: Result received');
    console.log('Success:', result.success);
    console.log('Token length:', result.token ? result.token.length : 'N/A');
    console.log('Token (first 20 chars):', result.token ? result.token.substring(0, 20) + '...' : 'N/A');
    console.log('Expires At:', result.expiresAt ? result.expiresAt.toISOString() : 'N/A');

    if (result.success) {
      console.log('\n✅ Remember me token created successfully!');
      console.log('Full token:', result.token);
    } else {
      console.log('\n❌ Failed to create remember me token');
      console.log('Reason:', result.reason);
    }
  } catch (error) {
    console.error('\n❌ Exception occurred:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
  }

  console.log('\n=== Test Complete ===');
  process.exit(0);
}

testRememberMeTokenCreation();
