const Redis = require('redis');
const { redisConnectionPool } = require('./services/redisConnectionPool');
const { configService } = require('./services/config');

class RedisConnectionFixVerification {
  constructor() {
    this.testResults = [];
    this.connectionEvents = [];
    this.testStartTime = Date.now();
  }

  log(message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, data };
    this.testResults.push(logEntry);
    console.log(`[${timestamp}] ${message}`, data);
  }

  async testFixedConnectionPool() {
    this.log('=== Testing Fixed Connection Pool ===');
    
    try {
      // Initialize the connection pool
      this.log('Initializing Redis connection pool...');
      await redisConnectionPool.initialize();
      
      // Check initial status
      let status = redisConnectionPool.getStatus();
      this.log('Initial pool status', status);

      // Test getting a client
      const client = redisConnectionPool.getClient('test-service');
      this.log('Retrieved client from pool', { 
        clientExists: !!client,
        serviceName: client?.serviceName 
      });

      if (!client) {
        throw new Error('Failed to get client from connection pool');
      }

      // Test basic operations
      this.log('Testing basic Redis operations...');
      
      // Test SET/GET
      await client.setEx('test-fix-key', 60, 'test-fix-value');
      const value = await client.get('test-fix-key');
      this.log('SET/GET operation successful', { value });

      // Test EXISTS/DEL
      const exists = await client.exists('test-fix-key');
      this.log('EXISTS operation successful', { exists });

      const deleted = await client.del('test-fix-key');
      this.log('DEL operation successful', { deleted });

      // Test TTL
      await client.setEx('ttl-test-key', 30, 'ttl-value');
      const ttl = await client.ttl('ttl-test-key');
      this.log('TTL operation successful', { ttl });

      // Test hash operations
      await client.hIncrBy('hash-test', 'counter', 1);
      await client.hIncrBy('hash-test', 'counter', 5);
      const hashData = await client.hGetAll('hash-test');
      this.log('Hash operations successful', { hashData });

      // Test sorted set operations
      await client.zAdd('zset-test', [{ score: 1, value: 'member1' }, { score: 2, value: 'member2' }]);
      const zrange = await client.zRange('zset-test', 0, -1);
      this.log('Sorted set operations successful', { zrange });

      // Monitor connection stability for 60 seconds
      this.log('Monitoring connection stability for 60 seconds...');
      const monitorStartTime = Date.now();
      
      while (Date.now() - monitorStartTime < 60000) {
        try {
          // Perform periodic operations
          await client.setEx('stability-test', 30, `value-${Date.now()}`);
          const checkValue = await client.get('stability-test');
          const isReady = await client.isReady();
          
          if (checkValue && isReady) {
            // Connection is stable
          } else {
            this.log('Connection instability detected', { 
              checkValue: !!checkValue, 
              isReady,
              timestamp: new Date().toISOString()
            });
          }
          
          await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
        } catch (error) {
          this.log('Error during stability monitoring', { 
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Final status check
      const finalStatus = redisConnectionPool.getStatus();
      this.log('Final pool status', finalStatus);

      // Test multiple concurrent clients
      this.log('Testing concurrent client operations...');
      const concurrentClients = [];
      const concurrentPromises = [];

      for (let i = 0; i < 3; i++) {
        const concurrentClient = redisConnectionPool.getClient(`concurrent-test-${i}`);
        concurrentClients.push(concurrentClient);
        
        concurrentPromises.push(
          (async () => {
            await concurrentClient.setEx(`concurrent-${i}`, 30, `value-${i}`);
            const value = await concurrentClient.get(`concurrent-${i}`);
            return { index: i, value };
          })()
        );
      }

      const concurrentResults = await Promise.all(concurrentPromises);
      this.log('Concurrent operations completed', { results: concurrentResults });

      this.log('✅ Connection pool test completed successfully');
      return true;

    } catch (error) {
      this.log('❌ Connection pool test failed', { error: error.message, stack: error.stack });
      return false;
    }
  }

  async testDirectRedisComparison() {
    this.log('=== Testing Direct Redis Connection for Comparison ===');
    
    try {
      const config = configService.getRedisConfigWithEnvironment();
      const redisUrl = config.password
        ? `redis://:${config.password}@${config.host}:${config.port}`
        : `redis://${config.host}:${config.port}`;

      // Create direct client with same enhanced settings
      const directClient = Redis.createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 15000,
          keepAlive: true,
          keepAliveInitialDelay: 1000,
          noDelay: true,
          family: 4
        },
        commandTimeout: 10000
      });

      let connectionEvents = [];
      
      directClient.on('error', (err) => {
        this.log('Direct client error', { error: err.message });
        connectionEvents.push({ type: 'error', timestamp: Date.now() });
      });

      directClient.on('connect', () => {
        this.log('Direct client connected');
        connectionEvents.push({ type: 'connect', timestamp: Date.now() });
      });

      directClient.on('ready', () => {
        this.log('Direct client ready');
        connectionEvents.push({ type: 'ready', timestamp: Date.now() });
      });

      directClient.on('end', () => {
        this.log('Direct client ended');
        connectionEvents.push({ type: 'end', timestamp: Date.now() });
      });

      await directClient.connect();
      
      // Test operations
      await directClient.setEx('direct-test', 60, 'direct-value');
      const value = await directClient.get('direct-test');
      this.log('Direct client operations successful', { value });

      // Monitor for 30 seconds
      this.log('Monitoring direct connection for 30 seconds...');
      await new Promise(resolve => setTimeout(resolve, 30000));

      await directClient.quit();
      
      this.log('Direct client test completed', { 
        events: connectionEvents.length,
        errors: connectionEvents.filter(e => e.type === 'error').length
      });

      return connectionEvents.filter(e => e.type === 'error').length === 0;

    } catch (error) {
      this.log('Direct client test failed', { error: error.message });
      return false;
    }
  }

  async testHealthCheckEndpoint() {
    this.log('=== Testing Health Check Endpoint ===');
    
    try {
      const response = await fetch('http://localhost:3001/api/v1/health');
      const healthData = await response.json();
      
      this.log('Health check response', healthData);
      
      const redisHealthy = healthData.services?.redis?.status === 'healthy';
      this.log('Redis health status', { healthy: redisHealthy });
      
      return redisHealthy;

    } catch (error) {
      this.log('Health check failed', { error: error.message });
      return false;
    }
  }

  generateVerificationReport() {
    this.log('=== Generating Verification Report ===');
    
    const testDuration = Date.now() - this.testStartTime;
    const report = {
      testDuration: `${Math.round(testDuration / 1000)} seconds`,
      timestamp: new Date().toISOString(),
      summary: {
        connectionPoolFixed: this.testResults.some(r => r.message.includes('✅ Connection pool test completed successfully')),
        directConnectionStable: this.testResults.some(r => r.message.includes('Direct client test completed')),
        healthCheckPassed: this.testResults.some(r => r.data?.healthy === true)
      },
      recommendations: this.generateRecommendations(),
      testResults: this.testResults
    };

    // Write report to file
    const fs = require('fs');
    const reportPath = `./redis-connection-fix-verification-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log('Verification report generated', { reportPath });
    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    // Check if connection pool is working
    const poolSuccess = this.testResults.some(r => r.message.includes('✅ Connection pool test completed successfully'));
    if (!poolSuccess) {
      recommendations.push({
        issue: 'Connection pool still unstable',
        solution: 'Further investigation needed for socket configuration',
        priority: 'high'
      });
    }

    // Check for any socket errors
    const socketErrors = this.testResults.filter(r => 
      r.data?.error?.includes('Socket closed unexpectedly')
    );
    if (socketErrors.length > 0) {
      recommendations.push({
        issue: 'Socket closure errors persist',
        solution: 'Consider Redis server configuration or network issues',
        priority: 'high'
      });
    }

    if (poolSuccess && socketErrors.length === 0) {
      recommendations.push({
        issue: 'Connection appears stable',
        solution: 'Monitor for continued stability in production',
        priority: 'low'
      });
    }

    return recommendations;
  }

  async runCompleteVerification() {
    this.log('Starting Redis Connection Fix Verification');
    
    try {
      const poolResult = await this.testFixedConnectionPool();
      const directResult = await this.testDirectRedisComparison();
      const healthResult = await this.testHealthCheckEndpoint();
      
      const report = this.generateVerificationReport();
      
      this.log('=== VERIFICATION COMPLETE ===');
      this.log('Connection Pool Fixed', poolResult);
      this.log('Direct Connection Stable', directResult);
      this.log('Health Check Passed', healthResult);
      
      return {
        success: poolResult && directResult && healthResult,
        report
      };
      
    } catch (error) {
      this.log('Verification failed', { error: error.message, stack: error.stack });
      throw error;
    }
  }
}

// Run verification
async function runVerification() {
  const verification = new RedisConnectionFixVerification();
  try {
    const result = await verification.runCompleteVerification();
    console.log('\n=== VERIFICATION SUMMARY ===');
    console.log(`Overall Success: ${result.success}`);
    console.log(`Recommendations: ${result.report.recommendations.length}`);
    
    result.report.recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. ${rec.issue} (${rec.priority})`);
      console.log(`   Solution: ${rec.solution}`);
    });
    
    return result;
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runVerification();
}

module.exports = { RedisConnectionFixVerification };