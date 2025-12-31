const { redisConnectionPool } = require('./services/redisConnectionPool');
const { configService } = require('./services/config');

async function testFinalConnectionFix() {
    console.log('🔧 FINAL CONNECTION FIX VERIFICATION');
    console.log('=====================================');

    try {
        // Test Redis connection pool initialization
        console.log('\n1. Testing Redis Connection Pool Initialization...');
        await redisConnectionPool.initialize();
        console.log('✅ Redis Connection Pool initialized successfully');

        // Test getting a client
        console.log('\n2. Testing Redis Client Retrieval...');
        const client = redisConnectionPool.getClient('test-service');

        if (client) {
            console.log('✅ Redis client retrieved successfully');

            // Test basic operations
            console.log('\n3. Testing Redis Operations...');

            try {
                // Test ping
                await client.ping();
                console.log('✅ Redis PING: SUCCESS');

                // Test set/get
                const testKey = 'final:test:' + Date.now();
                await client.setEx(testKey, 60, 'final-test-value');
                const value = await client.get(testKey);

                if (value === 'final-test-value') {
                    console.log('✅ Redis SET/GET: SUCCESS');
                } else {
                    console.log('❌ Redis SET/GET: FAILED - value mismatch');
                }

                // Cleanup
                await client.del(testKey);
                console.log('✅ Redis DEL: SUCCESS');

            } catch (error) {
                console.error('❌ Redis operations failed:', error.message);
                console.error('Stack:', error.stack);
            }

        } else {
            console.log('❌ Failed to retrieve Redis client');
        }

        // Test connection status
        console.log('\n4. Testing Connection Status...');
        const status = redisConnectionPool.getStatus();
        console.log('Connection Pool Status:', status);

        console.log('\n🎯 FINAL VERIFICATION COMPLETE');

    } catch (error) {
        console.error('❌ Final verification failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run the test
if (require.main === module) {
    testFinalConnectionFix().catch(console.error);
}

module.exports = { testFinalConnectionFix };