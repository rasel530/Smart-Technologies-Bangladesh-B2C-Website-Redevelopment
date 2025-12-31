const { configService } = require('./services/config');

console.log('Testing Redis connection through services...');

async function testServices() {
  try {
    console.log('1. Loading Redis URL from config...');
    const redisUrl = configService.get('REDIS_URL');
    console.log('Redis URL:', redisUrl);
    
    console.log('2. Testing sessionService...');
    const { sessionService } = require('./services/sessionService');
    const sessionTest = await sessionService.testConnection();
    console.log('Session service test:', sessionTest);
    
    console.log('3. Testing loginSecurityService...');
    const { loginSecurityService } = require('./services/loginSecurityService');
    const securityTest = await loginSecurityService.testConnection();
    console.log('Login security service test:', securityTest);
    
    console.log('✅ All services connected successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error testing services:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testServices();