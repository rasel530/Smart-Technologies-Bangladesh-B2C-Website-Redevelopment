const { configService } = require('./services/config');
const { redisConnectionPool } = require('./services/redisConnectionPool');
const { redisStartupValidator } = require('./services/redisStartupValidator');
const { redisFallbackService } = require('./services/redisFallbackService');

async function testRedisEnvironmentFix() {
  console.log('🧪 Testing Redis Environment Fix Implementation');
  console.log('='.repeat(50));

  // Test 1: Environment Detection
  console.log('\n📋 Test 1: Environment Detection');
  console.log('-'.repeat(30));
  
  const isDev = configService.isDevelopment();
  const isProd = configService.isProduction();
  const isDocker = configService.isDocker();
  const nodeEnv = process.env.NODE_ENV;
  
  console.log(`Environment: ${nodeEnv}`);
  console.log(`Is Development: ${isDev}`);
  console.log(`Is Production: ${isProd}`);
  console.log(`Is Docker: ${isDocker}`);
  
  // Test 2: Configuration Validation
  console.log('\n📋 Test 2: Configuration Validation');
  console.log('-'.repeat(30));
  
  const configValidation = configService.validateRedisConfig();
  console.log(`Configuration Valid: ${configValidation.isValid}`);
  if (!configValidation.isValid) {
    console.log('Configuration Errors:', configValidation.errors);
  } else {
    console.log('Redis Configuration:', {
      host: configValidation.config.host,
      port: configValidation.config.port,
      hasPassword: configValidation.config.hasPassword,
      environment: configValidation.config.environment,
      isDocker: configValidation.config.isDocker
    });
  }
  
  // Test 3: Environment-Aware Configuration
  console.log('\n📋 Test 3: Environment-Aware Configuration');
  console.log('-'.repeat(30));
  
  const envConfig = configService.getRedisConfigWithEnvironment();
  console.log('Environment-Aware Redis Config:', {
    host: envConfig.host,
    port: envConfig.port,
    hasPassword: !!envConfig.password,
    socketTimeout: envConfig.socket?.connectTimeout,
    keepAlive: envConfig.socket?.keepAlive,
    family: envConfig.socket?.family
  });
  
  // Test 4: Redis Connectivity
  console.log('\n📋 Test 4: Redis Connectivity');
  console.log('-'.repeat(30));
  
  let validationSuccess = false;
  try {
    validationSuccess = await redisStartupValidator.validateRedisStartup();
    console.log(`Redis Validation: ${validationSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (validationSuccess) {
      // Test basic operations
      const testClient = redisConnectionPool.getClient('test-environment');
      if (testClient) {
        console.log('Testing basic Redis operations...');
        
        // Test SET/GET
        const testKey = `env-test-${Date.now()}`;
        const testValue = 'environment-test-value';
        
        await testClient.setEx(testKey, 60, testValue);
        const retrievedValue = await testClient.get(testKey);
        console.log(`SET/GET Test: ${retrievedValue === testValue ? '✅ PASSED' : '❌ FAILED'}`);
        
        // Test DEL
        const delResult = await testClient.del(testKey);
        console.log(`DEL Test: ${delResult === 1 ? '✅ PASSED' : '❌ FAILED'}`);
        
        // Test PING
        const pingResult = await testClient.ping();
        console.log(`PING Test: ${pingResult === 'PONG' ? '✅ PASSED' : '❌ FAILED'}`);
      }
    }
  } catch (error) {
    console.log(`❌ Redis connectivity test failed: ${error.message}`);
  }
  
  // Test 5: Fallback Service
  console.log('\n📋 Test 5: Fallback Service');
  console.log('-'.repeat(30));
  
  try {
    await redisFallbackService.initialize(redisConnectionPool);
    const fallbackStatus = redisFallbackService.getStatus();
    console.log('Fallback Service Status:', {
      isRedisAvailable: fallbackStatus.isRedisAvailable,
      fallbackMode: fallbackStatus.fallbackMode,
      memoryCacheSize: fallbackStatus.memoryCacheSize
    });
    
    // Test fallback client
    const fallbackClient = redisFallbackService.getClient('test-fallback');
    if (fallbackClient) {
      console.log('Testing fallback client operations...');
      
      const testKey = `fallback-test-${Date.now()}`;
      const testValue = 'fallback-test-value';
      
      await fallbackClient.setEx(testKey, 60, testValue);
      const retrievedValue = await fallbackClient.get(testKey);
      console.log(`Fallback SET/GET Test: ${retrievedValue === testValue ? '✅ PASSED' : '❌ FAILED'}`);
      
      await fallbackClient.del(testKey);
    }
  } catch (error) {
    console.log(`❌ Fallback service test failed: ${error.message}`);
  }
  
  // Test 6: Connection Pool Status
  console.log('\n📋 Test 6: Connection Pool Status');
  console.log('-'.repeat(30));
  
  const poolStatus = redisConnectionPool.getStatus();
  console.log('Connection Pool Status:', poolStatus);
  
  // Summary
  console.log('\n📋 Test Summary');
  console.log('-'.repeat(30));
  console.log(`Environment: ${nodeEnv} (${isDocker ? 'Docker' : 'Local'})`);
  console.log(`Redis Host: ${configValidation.config.host}:${configValidation.config.port}`);
  console.log(`Configuration: ${configValidation.isValid ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`Connectivity: ${validationSuccess ? '✅ Connected' : '❌ Failed'}`);
  console.log(`Fallback: ${redisFallbackService.getStatus().fallbackMode ? '✅ Active' : '✅ Ready'}`);
  
  console.log('\n🎯 Environment Fix Implementation Test Complete!');
}

// Run the test
if (require.main === module) {
  testRedisEnvironmentFix()
    .then(() => {
      console.log('\n✅ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testRedisEnvironmentFix };