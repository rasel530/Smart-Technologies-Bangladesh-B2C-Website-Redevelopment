const Redis = require('redis');
const { configService } = require('./services/config');

class RedisConnectionDeepDiagnosis {
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

  async testDirectRedisConnection() {
    this.log('=== Testing Direct Redis Connection (Bypassing Pool) ===');
    
    const config = configService.getRedisConfigWithEnvironment();
    this.log('Redis configuration', {
      host: config.host,
      port: config.port,
      hasPassword: !!config.password,
      connectTimeout: config.socket?.connectTimeout,
      keepAlive: config.socket?.keepAlive
    });

    const redisUrl = config.password
      ? `redis://:${config.password}@${config.host}:${config.port}`
      : `redis://${config.host}:${config.port}`;

    // Test 1: Basic connection with minimal configuration
    this.log('Test 1: Basic connection attempt');
    try {
      const client1 = Redis.createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000,
          lazyConnect: true
        }
      });

      client1.on('error', (err) => {
        this.log('Basic client error', { error: err.message, code: err.code });
        this.connectionEvents.push({ type: 'error', client: 'basic', error: err.message, timestamp: Date.now() });
      });

      client1.on('connect', () => {
        this.log('Basic client connected');
        this.connectionEvents.push({ type: 'connect', client: 'basic', timestamp: Date.now() });
      });

      client1.on('ready', () => {
        this.log('Basic client ready');
        this.connectionEvents.push({ type: 'ready', client: 'basic', timestamp: Date.now() });
      });

      client1.on('end', () => {
        this.log('Basic client connection ended');
        this.connectionEvents.push({ type: 'end', client: 'basic', timestamp: Date.now() });
      });

      await client1.connect();
      const pong = await client1.ping();
      this.log('Basic client ping successful', { response: pong });
      
      // Test operations
      await client1.set('test-key', 'test-value', { EX: 10 });
      const value = await client1.get('test-key');
      this.log('Basic client operations successful', { value });

      // Keep connection alive for 30 seconds to monitor stability
      this.log('Monitoring basic connection stability for 30 seconds...');
      await new Promise(resolve => setTimeout(resolve, 30000));

      await client1.quit();
      this.log('Basic client disconnected gracefully');
      
    } catch (error) {
      this.log('Basic client failed', { error: error.message, stack: error.stack });
    }

    // Test 2: Connection with enhanced socket settings
    this.log('Test 2: Enhanced socket settings connection attempt');
    try {
      const client2 = Redis.createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 15000,
          keepAlive: true,
          noDelay: true,
          family: 4,
          reconnectStrategy: (retries) => {
            if (retries > 5) {
              this.log('Enhanced client max reconnection attempts reached');
              return false;
            }
            const delay = Math.min(1000 * Math.pow(2, retries), 10000);
            this.log('Enhanced client reconnecting', { attempt: retries + 1, delay });
            return delay;
          }
        }
      });

      client2.on('error', (err) => {
        this.log('Enhanced client error', { error: err.message, code: err.code });
        this.connectionEvents.push({ type: 'error', client: 'enhanced', error: err.message, timestamp: Date.now() });
      });

      client2.on('connect', () => {
        this.log('Enhanced client connected');
        this.connectionEvents.push({ type: 'connect', client: 'enhanced', timestamp: Date.now() });
      });

      client2.on('ready', () => {
        this.log('Enhanced client ready');
        this.connectionEvents.push({ type: 'ready', client: 'enhanced', timestamp: Date.now() });
      });

      client2.on('end', () => {
        this.log('Enhanced client connection ended');
        this.connectionEvents.push({ type: 'end', client: 'enhanced', timestamp: Date.now() });
      });

      await client2.connect();
      const pong2 = await client2.ping();
      this.log('Enhanced client ping successful', { response: pong2 });
      
      // Test rapid operations
      this.log('Testing rapid operations...');
      for (let i = 0; i < 100; i++) {
        await client2.set(`rapid-test-${i}`, `value-${i}`, { EX: 30 });
        const val = await client2.get(`rapid-test-${i}`);
        if (i % 20 === 0) {
          this.log(`Completed ${i + 1} rapid operations`);
        }
      }
      this.log('Rapid operations completed successfully');

      // Keep connection alive for 30 seconds to monitor stability
      this.log('Monitoring enhanced connection stability for 30 seconds...');
      await new Promise(resolve => setTimeout(resolve, 30000));

      await client2.quit();
      this.log('Enhanced client disconnected gracefully');
      
    } catch (error) {
      this.log('Enhanced client failed', { error: error.message, stack: error.stack });
    }

    // Test 3: Multiple concurrent connections
    this.log('Test 3: Multiple concurrent connections');
    try {
      const clients = [];
      const connectionPromises = [];

      for (let i = 0; i < 5; i++) {
        const client = Redis.createClient({
          url: redisUrl,
          socket: {
            connectTimeout: 10000,
            keepAlive: true,
            reconnectStrategy: false // Disable auto-reconnect for this test
          }
        });

        client.on('error', (err) => {
          this.log(`Concurrent client ${i} error`, { error: err.message });
        });

        connectionPromises.push(
          client.connect()
            .then(async () => {
              const pong = await client.ping();
              this.log(`Concurrent client ${i} connected`, { ping: pong });
              return client;
            })
            .catch(error => {
              this.log(`Concurrent client ${i} failed to connect`, { error: error.message });
              return null;
            })
        );
        
        clients.push(client);
      }

      const connectedClients = (await Promise.all(connectionPromises)).filter(c => c !== null);
      this.log('Concurrent connections established', { 
        attempted: clients.length, 
        successful: connectedClients.length 
      });

      // Test operations on all concurrent clients
      if (connectedClients.length > 0) {
        await Promise.all(connectedClients.map(async (client, index) => {
          await client.set(`concurrent-test-${index}`, `value-${index}`, { EX: 30 });
          const value = await client.get(`concurrent-test-${index}`);
          this.log(`Concurrent client ${index} operation successful`, { value });
        }));
      }

      // Close all concurrent clients
      await Promise.all(connectedClients.map(client => client.quit()));
      this.log('All concurrent clients disconnected');
      
    } catch (error) {
      this.log('Concurrent connections test failed', { error: error.message, stack: error.stack });
    }
  }

  async testConnectionPoolBehavior() {
    this.log('=== Testing Connection Pool Behavior ===');
    
    try {
      const { redisConnectionPool } = require('./services/redisConnectionPool');
      
      // Test pool status
      const status = redisConnectionPool.getStatus();
      this.log('Connection pool status', status);

      // Test getting multiple clients
      const clients = [];
      for (let i = 0; i < 3; i++) {
        const client = redisConnectionPool.getClient(`test-service-${i}`);
        clients.push(client);
        this.log(`Retrieved client ${i} from pool`, { 
          clientExists: !!client,
          serviceName: client?.serviceName 
        });
      }

      // Test operations on pool clients
      for (let i = 0; i < clients.length; i++) {
        if (clients[i]) {
          try {
            await clients[i].set(`pool-test-${i}`, `pool-value-${i}`, { EX: 30 });
            const value = await clients[i].get(`pool-test-${i}`);
            this.log(`Pool client ${i} operation successful`, { value });
          } catch (error) {
            this.log(`Pool client ${i} operation failed`, { error: error.message });
          }
        }
      }

      // Monitor pool behavior for 30 seconds
      this.log('Monitoring connection pool behavior for 30 seconds...');
      const initialStatus = redisConnectionPool.getStatus();
      
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      const finalStatus = redisConnectionPool.getStatus();
      this.log('Connection pool status change', { 
        initial: initialStatus, 
        final: finalStatus,
        timeElapsed: '30 seconds'
      });

    } catch (error) {
      this.log('Connection pool test failed', { error: error.message, stack: error.stack });
    }
  }

  async analyzeConnectionEvents() {
    this.log('=== Connection Event Analysis ===');
    
    const errorEvents = this.connectionEvents.filter(e => e.type === 'error');
    const connectEvents = this.connectionEvents.filter(e => e.type === 'connect');
    const endEvents = this.connectionEvents.filter(e => e.type === 'end');

    this.log('Event summary', {
      totalEvents: this.connectionEvents.length,
      errors: errorEvents.length,
      connects: connectEvents.length,
      ends: endEvents.length
    });

    if (errorEvents.length > 0) {
      this.log('Error patterns', {
        errorMessages: [...new Set(errorEvents.map(e => e.error))],
        errorFrequency: errorEvents.map(e => ({
          error: e.error,
          timestamp: new Date(e.timestamp).toISOString(),
          client: e.client
        }))
      });
    }

    if (connectEvents.length > 1) {
      const connectionGaps = [];
      for (let i = 1; i < connectEvents.length; i++) {
        const gap = connectEvents[i].timestamp - connectEvents[i-1].timestamp;
        connectionGaps.push(gap);
      }
      
      this.log('Connection timing analysis', {
        averageGap: connectionGaps.reduce((a, b) => a + b, 0) / connectionGaps.length,
        minGap: Math.min(...connectionGaps),
        maxGap: Math.max(...connectionGaps),
        totalConnections: connectEvents.length
      });
    }
  }

  async testRedisServerConfiguration() {
    this.log('=== Testing Redis Server Configuration ===');
    
    try {
      const config = configService.getRedisConfigWithEnvironment();
      const client = Redis.createClient({
        url: config.password
          ? `redis://:${config.password}@${config.host}:${config.port}`
          : `redis://${config.host}:${config.port}`,
        socket: { connectTimeout: 10000 }
      });

      await client.connect();
      
      // Get server configuration
      const serverConfig = await client.config.get('*');
      this.log('Redis server configuration', {
        timeout: serverConfig.timeout,
        tcpKeepalive: serverConfig['tcp-keepalive'],
        maxclients: serverConfig.maxclients,
        maxmemory: serverConfig.maxmemory,
        maxmemoryPolicy: serverConfig['maxmemory-policy']
      });

      // Get server info
      const serverInfo = await client.info();
      this.log('Redis server info', {
        uptime: serverInfo.match(/uptime_in_seconds:(\d+)/)?.[1],
        connectedClients: serverInfo.match(/connected_clients:(\d+)/)?.[1],
        usedMemory: serverInfo.match(/used_memory_human:(.+)/)?.[1],
        totalCommandsProcessed: serverInfo.match(/total_commands_processed:(\d+)/)?.[1]
      });

      await client.quit();
      
    } catch (error) {
      this.log('Redis server configuration test failed', { error: error.message, stack: error.stack });
    }
  }

  async generateDiagnosisReport() {
    this.log('=== Generating Diagnosis Report ===');
    
    const testDuration = Date.now() - this.testStartTime;
    const report = {
      testDuration: `${Math.round(testDuration / 1000)} seconds`,
      totalEvents: this.connectionEvents.length,
      errorCount: this.connectionEvents.filter(e => e.type === 'error').length,
      connectionPatterns: this.analyzeConnectionPatterns(),
      recommendations: this.generateRecommendations(),
      rawEvents: this.connectionEvents,
      testResults: this.testResults
    };

    // Write report to file
    const fs = require('fs');
    const reportPath = `./redis-connection-diagnosis-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log('Diagnosis report generated', { reportPath });
    
    return report;
  }

  analyzeConnectionPatterns() {
    const patterns = {
      frequentDisconnections: false,
      connectionStability: 'unknown',
      primaryIssue: 'none'
    };

    const errorEvents = this.connectionEvents.filter(e => e.type === 'error');
    const connectEvents = this.connectionEvents.filter(e => e.type === 'connect');

    if (errorEvents.length > connectEvents.length) {
      patterns.frequentDisconnections = true;
      patterns.connectionStability = 'poor';
    } else if (errorEvents.length > 0) {
      patterns.connectionStability = 'unstable';
    } else {
      patterns.connectionStability = 'stable';
    }

    // Identify primary issue
    const socketClosedErrors = errorEvents.filter(e => e.error.includes('Socket closed unexpectedly'));
    const timeoutErrors = errorEvents.filter(e => e.error.includes('timeout'));
    const connectionRefusedErrors = errorEvents.filter(e => e.error.includes('ECONNREFUSED'));

    if (socketClosedErrors.length > 0) {
      patterns.primaryIssue = 'socket_closure';
    } else if (timeoutErrors.length > 0) {
      patterns.primaryIssue = 'timeout';
    } else if (connectionRefusedErrors.length > 0) {
      patterns.primaryIssue = 'connection_refused';
    }

    return patterns;
  }

  generateRecommendations() {
    const patterns = this.analyzeConnectionPatterns();
    const recommendations = [];

    if (patterns.primaryIssue === 'socket_closure') {
      recommendations.push({
        issue: 'Socket closure',
        cause: 'Redis server or network layer closing connections unexpectedly',
        solution: 'Increase Redis timeout and tcp-keepalive settings',
        priority: 'high'
      });
    }

    if (patterns.primaryIssue === 'timeout') {
      recommendations.push({
        issue: 'Connection timeout',
        cause: 'Client or server timeout settings too aggressive',
        solution: 'Increase connectTimeout and commandTimeout values',
        priority: 'high'
      });
    }

    if (patterns.connectionStability === 'poor') {
      recommendations.push({
        issue: 'Connection instability',
        cause: 'Multiple connection failures detected',
        solution: 'Implement connection pooling with proper retry logic',
        priority: 'high'
      });
    }

    recommendations.push({
      issue: 'General optimization',
      cause: 'Connection reliability improvements',
      solution: 'Configure proper keepalive, disable Nagle\'s algorithm, use IPv4',
      priority: 'medium'
    });

    return recommendations;
  }

  async runCompleteDiagnosis() {
    this.log('Starting Redis Connection Deep Diagnosis');
    
    try {
      await this.testDirectRedisConnection();
      await this.testConnectionPoolBehavior();
      await this.testRedisServerConfiguration();
      await this.analyzeConnectionEvents();
      const report = await this.generateDiagnosisReport();
      
      this.log('=== DIAGNOSIS COMPLETE ===');
      this.log('Connection stability', report.connectionPatterns.connectionStability);
      this.log('Primary issue', report.connectionPatterns.primaryIssue);
      this.log('Recommendations', report.recommendations.length);
      
      return report;
    } catch (error) {
      this.log('Diagnosis failed', { error: error.message, stack: error.stack });
      throw error;
    }
  }
}

// Run the diagnosis
async function runDiagnosis() {
  const diagnosis = new RedisConnectionDeepDiagnosis();
  try {
    const report = await diagnosis.runCompleteDiagnosis();
    console.log('\n=== DIAGNOSIS SUMMARY ===');
    console.log(`Connection Stability: ${report.connectionPatterns.connectionStability}`);
    console.log(`Primary Issue: ${report.connectionPatterns.primaryIssue}`);
    console.log(`Total Errors: ${report.errorCount}`);
    console.log(`Recommendations: ${report.recommendations.length}`);
    
    report.recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. ${rec.issue} (${rec.priority})`);
      console.log(`   Cause: ${rec.cause}`);
      console.log(`   Solution: ${rec.solution}`);
    });
    
    return report;
  } catch (error) {
    console.error('Diagnosis failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runDiagnosis();
}

module.exports = { RedisConnectionDeepDiagnosis };