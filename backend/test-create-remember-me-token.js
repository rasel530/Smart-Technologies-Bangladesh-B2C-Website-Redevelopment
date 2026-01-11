const { sessionService } = require('./services/sessionService');

// Mock request object
const mockReq = {
  ip: '127.0.0.1',
  get: (header) => {
    if (header === 'User-Agent') {
      return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    }
    if (header === 'Accept-Language') {
      return 'en-US,en;q=0.9';
    }
    if (header === 'Accept-Encoding') {
      return 'gzip, deflate, br';
    }
    return null;
  }
};

const testUserId = '99485f62-8959-42e8-9d29-aea9ad037f02';

console.log('Testing createRememberMeToken function...\n');
console.log('User ID:', testUserId);
console.log('Mock Request:', mockReq);

sessionService.createRememberMeToken(testUserId, mockReq)
  .then(result => {
    console.log('\n=== Result ===');
    console.log('Success:', result.success);
    console.log('Token:', result.token ? result.token.substring(0, 30) + '...' : 'null');
    console.log('Expires At:', result.expiresAt);
    console.log('Reason:', result.reason || 'none');
    
    if (!result.success) {
      console.log('\n❌ FAILED: createRememberMeToken returned success=false');
      console.log('This is the root cause of the bug!');
    } else {
      console.log('\n✅ SUCCESS: Remember me token created successfully');
    }
  })
  .catch(error => {
    console.error('\n❌ ERROR: Exception thrown:', error.message);
    console.error('Stack:', error.stack);
  })
  .finally(() => {
    console.log('\nTest completed.');
    process.exit(0);
  });
