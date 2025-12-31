const redis = require('redis');
const { loggerService } = require('./services/logger');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
  retryDelayOnClusterDown: 300,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  retryDelayOnClusterDown: 300,
  removeOnError: false,
  detach: false,
  family: 4,
  offlineQueue: false
};

async function testRedisConnection() {
  console.log('🔍 Testing Redis connection with enhanced configuration...');
  
  let client;
  let connectionAttempts = 0;
  const maxAttempts = 5;
  
  while (connectionAttempts < maxAttempts) {
    try {
      connectionAttempts++;
      console.log(`📡 Connection attempt ${connectionAttempts}/${maxAttempts}...`);
      
      client = redis.createClient(redisConfig);
      
      await new Promise((resolve, reject) => {
        client.on('connect', () => {
          console.log('✅ Redis connected successfully');
          resolve();
        });
        
        client.on('error', (err) => {
          console.error('❌ Redis connection error:', err);
          reject(err);
        });
        
        client.on('ready', () => {
          console.log('✅ Redis ready for operations');
        });
        
        // Set timeout for connection
        setTimeout(() => {
          if (!client.status || client.status !== 'ready') {
            reject(new Error('Connection timeout'));
          }
        }, 5000);
      });
      
      // Wait for connection or error
      await new Promise((resolve) => setTimeout(resolve, 6000));
      
      if (client.status === 'ready') {
        // Test basic operations
        console.log('🧪 Testing Redis operations...');
        
        try {
          // Test SET operation
          await client.set('test_key', 'test_value', 'EX', 60);
          console.log('✅ SET operation successful');
          
          // Test GET operation
          const value = await client.get('test_key');
          if (value === 'test_value') {
            console.log('✅ GET operation successful');
          } else {
            console.log('❌ GET operation failed');
          }
          
          // Test DEL operation
          await client.del('test_key');
          console.log('✅ DEL operation successful');
          
          // Test KEYS operation
          const keys = await client.keys('test_*');
          console.log(`✅ KEYS operation successful, found ${keys.length} test keys`);
          
          console.log('🎉 All Redis operations working correctly!');
          
          // Cleanup
          await client.quit();
          return true;
          
        } catch (opError) {
          console.error('❌ Redis operation error:', opError);
          await client.quit();
          return false;
        }
      }
      
    } catch (error) {
      console.error(`❌ Connection attempt ${connectionAttempts} failed:`, error.message);
      
      if (client) {
        try {
          await client.quit();
        } catch (quitError) {
          console.error('❌ Error during quit:', quitError.message);
        }
      }
      
      if (connectionAttempts < maxAttempts) {
        console.log(`⏳ Waiting ${2000}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  console.log('❌ All Redis connection attempts failed');
  return false;
}

async function checkRedisService() {
  console.log('🔍 Checking Redis service configuration...');
  
  try {
    // Check if Redis server is running on default port
    const net = require('net');
    const redisPort = process.env.REDIS_PORT || 6379;
    const redisHost = process.env.REDIS_HOST || 'localhost';
    
    const connectionTest = new Promise((resolve) => {
      const socket = new net.Socket();
      
      socket.setTimeout(5000);
      
      socket.on('connect', () => {
        console.log('✅ Redis server is reachable');
        socket.end();
        resolve(true);
      });
      
      socket.on('error', (err) => {
        console.log('❌ Redis server not reachable:', err.message);
        resolve(false);
      });
      
      socket.on('timeout', () => {
        console.log('❌ Redis server connection timeout');
        socket.destroy();
        resolve(false);
      });
      
      socket.connect(redisPort, redisHost);
    });
    
    const isServerReachable = await connectionTest;
    
    if (!isServerReachable) {
      console.log('💡 Starting Redis server...');
      const { spawn } = require('child_process');
      
      // Try to start Redis-server (this assumes Redis is installed)
      const redisProcess = spawn('redis-server', [
        '--port', redisPort.toString(),
        '--bind', redisHost,
        '--daemonize', 'yes',
        '--logfile', 'redis-server.log',
        '--appendonly', 'yes',
        '--appendfilename', 'appendonly.aof'
      ]);
      
      redisProcess.stdout.on('data', (data) => {
        console.log('Redis server output:', data.toString());
      });
      
      redisProcess.stderr.on('data', (data) => {
        console.error('Redis server error:', data.toString());
      });
      
      redisProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Redis server started successfully');
        } else {
          console.log(`❌ Redis server exited with code ${code}`);
        }
      });
      
      // Give Redis server time to start
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    return await testRedisConnection();
    
  } catch (error) {
    console.error('❌ Redis service check failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Redis connection fix process...');
  console.log('📍 Current Redis configuration:', {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD ? '***' : 'none',
    db: process.env.REDIS_DB || 0
  });
  
  const success = await checkRedisService();
  
  if (success) {
    console.log('🎉 Redis connection fix completed successfully!');
    console.log('💡 Your Redis-dependent API endpoints should now work properly.');
    console.log('📝 Next steps:');
    console.log('   1. Restart your backend server');
    console.log('   2. Test Redis-dependent endpoints in Postman');
    console.log('   3. Monitor Redis stability');
  } else {
    console.log('❌ Redis connection fix failed.');
    console.log('💡 Manual troubleshooting steps:');
    console.log('   1. Ensure Redis server is installed: redis-server --version');
    console.log('   2. Check Redis configuration in .env file');
    console.log('   3. Start Redis server manually: redis-server --port 6379');
    console.log('   4. Check for port conflicts: netstat -an | findstr :6379');
    console.log('   5. Verify Redis firewall settings');
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Redis connection fix process interrupted');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Redis connection fix process terminated');
  process.exit(0);
});

// Run the fix
main().catch(error => {
  console.error('💥 Redis fix process failed:', error);
  process.exit(1);
});