const { databaseService } = require('./services/database');
const { redisConnectionPool } = require('./services/redisConnectionPool');
const { configService } = require('./services/config');
const Redis = require('redis');
const net = require('net');

class ComprehensiveConnectionTest {
  constructor() {
    this.results = {
      database: { status: 'pending', details: {}, errors: [] },
      redis: { status: 'pending', details: {}, errors: [] },
      api: { status: 'pending', details: {}, errors: [] },
      dependencies: { status: 'pending', details: {}, errors: [] }
    };
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🔍 COMPREHENSIVE CONNECTION DIAGNOSTICS');
    console.log('==========================================');
    console.log(`Started at: ${new Date().toISOString()}`);
    console.log('');

    try {
      // Test 1: Configuration Analysis
      await this.testConfiguration();

      // Test 2: Database Connection
      await this.testDatabaseConnection();

      // Test 3: Redis Connection
      await this.testRedisConnection();

      // Test 4: API Endpoints
      await this.testAPIEndpoints();

      // Test 5: Service Dependencies
      await this.testServiceDependencies();

      // Generate Summary Report
      this.generateSummaryReport();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.results.global = { status: 'failed', error: error.message };
    }
  }

  async testConfiguration() {
    console.log('1. CONFIGURATION ANALYSIS');
    console.log('-------------------------');

    try {
      const configChecks = {
        NODE_ENV: process.env.NODE_ENV || 'missing',
        PORT: configService.get('PORT') || 'missing',
        POSTGRES_DATABASE_URL: configService.get('POSTGRES_DATABASE_URL') ? 'configured' : 'missing',
        REDIS_URL: configService.get('REDIS_URL') || 'missing',
        REDIS_TTL: configService.get('REDIS_TTL') || 'missing',
        POSTGRES_JWT_SECRET: configService.get('POSTGRES_JWT_SECRET') ? 'configured' : 'missing',
        JWT_SECRET: configService.get('JWT_SECRET') ? 'configured' : 'missing'
      };

      console.log('Environment Variables:');
      Object.entries(configChecks).forEach(([key, value]) => {
        const status = value === 'missing' ? '❌' : '✅';
        console.log(`  ${status} ${key}: ${value}`);
      });

      // Check Redis URL format
      const redisUrl = configService.get('REDIS_URL');
      if (redisUrl) {
        const redisUrlPattern = /^redis:\/\/([^:]+):([^@]+)@([^:]+):(\d+)(?:\/(.*))?$/;
        const match = redisUrl.match(redisUrlPattern);

        if (match) {
          console.log('  ✅ Redis URL format: ACL-style authentication');
          console.log(`     Host: ${match[3]}, Port: ${match[4]}, Username: ${match[1]}`);
        } else {
          console.log('  ⚠️  Redis URL format: Non-standard or simple format');
        }
      }

      this.results.configuration = { status: 'completed', details: configChecks };

    } catch (error) {
      console.error('  ❌ Configuration test failed:', error.message);
      this.results.configuration = { status: 'failed', error: error.message };
    }

    console.log('');
  }

  async testDatabaseConnection() {
    console.log('2. DATABASE CONNECTION TEST');
    console.log('--------------------------');

    try {
      // Test basic connection
      console.log('  Testing database connection...');
      const healthResult = await databaseService.healthCheck();

      if (healthResult.status === 'healthy') {
        console.log('  ✅ Database connection: HEALTHY');
        console.log(`     Response time: ${healthResult.responseTime}`);
        console.log(`     Server time: ${healthResult.timestamp}`);

        // Test database operations
        console.log('  Testing database operations...');
        const stats = await databaseService.getStats();
        console.log('  ✅ Database operations: SUCCESS');
        console.log('     Database statistics:', stats);

        this.results.database = {
          status: 'healthy',
          details: { health: healthResult, stats },
          errors: []
        };

      } else {
        console.log('  ❌ Database connection: UNHEALTHY');
        console.log(`     Error: ${healthResult.error}`);

        this.results.database = {
          status: 'unhealthy',
          details: healthResult,
          errors: [healthResult.error]
        };
      }

    } catch (error) {
      console.error('  ❌ Database test failed:', error.message);
      this.results.database = {
        status: 'failed',
        details: {},
        errors: [error.message]
      };
    }

    console.log('');
  }

  async testRedisConnection() {
    console.log('3. REDIS CONNECTION TEST');
    console.log('-----------------------');

    const redisTests = [];

    // Test 1: Redis Connection Pool
    console.log('  Testing Redis Connection Pool...');
    try {
      await redisConnectionPool.initialize();
      const redisClient = redisConnectionPool.getClient('test-service');

      if (redisClient) {
        await redisClient.ping();
        console.log('  ✅ Redis Connection Pool: CONNECTED');

        // Test basic operations
        const testKey = 'test:connection:' + Date.now();
        await redisClient.setEx(testKey, 60, 'test-value');
        const value = await redisClient.get(testKey);
        await redisClient.del(testKey);

        if (value === 'test-value') {
          console.log('  ✅ Redis operations: SUCCESS');
          redisTests.push({ method: 'connection-pool', status: 'success' });
        } else {
          console.log('  ❌ Redis operations: FAILED');
          redisTests.push({ method: 'connection-pool', status: 'operations-failed' });
        }
      } else {
        console.log('  ❌ Redis Connection Pool: NO CLIENT');
        redisTests.push({ method: 'connection-pool', status: 'no-client' });
      }
    } catch (error) {
      console.error('  ❌ Redis Connection Pool failed:', error.message);
      redisTests.push({ method: 'connection-pool', status: 'failed', error: error.message });
    }

    // Test 2: Direct Redis Connection
    console.log('  Testing Direct Redis Connection...');
    try {
      const redisUrl = configService.get('REDIS_URL');
      const directClient = Redis.createClient({
        url: redisUrl,
        connectTimeout: 5000,
        lazyConnect: true
      });

      await directClient.connect();
      await directClient.ping();
      console.log('  ✅ Direct Redis Connection: CONNECTED');
      redisTests.push({ method: 'direct', status: 'success' });
      await directClient.quit();
    } catch (error) {
      console.error('  ❌ Direct Redis Connection failed:', error.message);
      redisTests.push({ method: 'direct', status: 'failed', error: error.message });
    }

    // Test 3: Network Connectivity
    console.log('  Testing Redis Network Connectivity...');
    const hosts = ['redis', 'localhost', '127.0.0.1'];

    for (const host of hosts) {
      try {
        const canConnect = await this.testNetworkConnection(host, 6379);
        if (canConnect) {
          console.log(`  ✅ Network connectivity to ${host}:6379`);
          redisTests.push({ method: 'network', host, status: 'success' });
        } else {
          console.log(`  ❌ Network connectivity to ${host}:6379`);
          redisTests.push({ method: 'network', host, status: 'failed' });
        }
      } catch (error) {
        console.log(`  ❌ Network test to ${host}:6379 failed:`, error.message);
        redisTests.push({ method: 'network', host, status: 'error', error: error.message });
      }
    }

    this.results.redis = {
      status: redisTests.some(t => t.status === 'success') ? 'healthy' : 'unhealthy',
      details: { tests: redisTests },
      errors: redisTests.filter(t => t.status === 'failed' || t.status === 'error').map(t => t.error || t.status)
    };

    console.log('');
  }

  async testAPIEndpoints() {
    console.log('4. API ENDPOINT CONNECTIVITY TEST');
    console.log('---------------------------------');

    const baseUrl = `http://localhost:${configService.get('PORT') || 3001}`;
    const endpoints = [
      { path: '/', method: 'GET', description: 'Root endpoint' },
      { path: '/health', method: 'GET', description: 'Health check' },
      { path: '/api/db-status', method: 'GET', description: 'Database status' }
    ];

    const apiTests = [];

    for (const endpoint of endpoints) {
      try {
        console.log(`  Testing ${endpoint.description} (${endpoint.method} ${endpoint.path})...`);

        const response = await fetch(`${baseUrl}${endpoint.path}`, {
          method: endpoint.method,
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`  ✅ ${endpoint.description}: SUCCESS (${response.status})`);
          apiTests.push({
            endpoint: endpoint.path,
            status: 'success',
            statusCode: response.status,
            response: data
          });
        } else {
          console.log(`  ❌ ${endpoint.description}: FAILED (${response.status})`);
          apiTests.push({
            endpoint: endpoint.path,
            status: 'failed',
            statusCode: response.status,
            error: response.statusText
          });
        }
      } catch (error) {
        console.error(`  ❌ ${endpoint.description}: ERROR - ${error.message}`);
        apiTests.push({
          endpoint: endpoint.path,
          status: 'error',
          error: error.message
        });
      }
    }

    this.results.api = {
      status: apiTests.some(t => t.status === 'success') ? 'healthy' : 'unhealthy',
      details: { tests: apiTests, baseUrl },
      errors: apiTests.filter(t => t.status === 'failed' || t.status === 'error').map(t => t.error || t.status)
    };

    console.log('');
  }

  async testServiceDependencies() {
    console.log('5. SERVICE DEPENDENCIES TEST');
    console.log('----------------------------');

    const dependencyTests = [];

    // Test 1: Logger Service
    try {
      const { loggerService } = require('./services/logger');
      loggerService.info('Test log message from connection diagnostics');
      console.log('  ✅ Logger Service: WORKING');
      dependencyTests.push({ service: 'logger', status: 'success' });
    } catch (error) {
      console.error('  ❌ Logger Service: FAILED -', error.message);
      dependencyTests.push({ service: 'logger', status: 'failed', error: error.message });
    }

    // Test 2: Config Service
    try {
      const testConfig = configService.getServerConfig();
      console.log('  ✅ Config Service: WORKING');
      dependencyTests.push({ service: 'config', status: 'success' });
    } catch (error) {
      console.error('  ❌ Config Service: FAILED -', error.message);
      dependencyTests.push({ service: 'config', status: 'failed', error: error.message });
    }

    // Test 3: Prisma Client
    try {
      const prisma = databaseService.getClient();
      if (prisma) {
        console.log('  ✅ Prisma Client: AVAILABLE');
        dependencyTests.push({ service: 'prisma', status: 'success' });
      } else {
        console.log('  ❌ Prisma Client: NOT AVAILABLE');
        dependencyTests.push({ service: 'prisma', status: 'unavailable' });
      }
    } catch (error) {
      console.error('  ❌ Prisma Client: FAILED -', error.message);
      dependencyTests.push({ service: 'prisma', status: 'failed', error: error.message });
    }

    // Test 4: Environment-specific services
    if (process.env.NODE_ENV !== 'production') {
      // Test email service in development
      try {
        const { emailService } = require('./services/emailService');
        console.log('  ✅ Email Service: LOADED');
        dependencyTests.push({ service: 'email', status: 'success' });
      } catch (error) {
        console.log('  ⚠️  Email Service: NOT LOADED (expected in some environments)');
        dependencyTests.push({ service: 'email', status: 'not-loaded' });
      }
    }

    this.results.dependencies = {
      status: dependencyTests.some(t => t.status === 'failed') ? 'unhealthy' : 'healthy',
      details: { tests: dependencyTests },
      errors: dependencyTests.filter(t => t.status === 'failed').map(t => t.error || t.status)
    };

    console.log('');
  }

  async testNetworkConnection(host, port) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(3000);

      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });

      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });

      socket.connect(port, host);
    });
  }

  generateSummaryReport() {
    console.log('📊 COMPREHENSIVE TEST SUMMARY');
    console.log('==============================');

    const duration = Date.now() - this.startTime;
    console.log(`Test Duration: ${duration}ms`);
    console.log(`Completed at: ${new Date().toISOString()}`);
    console.log('');

    const categories = ['configuration', 'database', 'redis', 'api', 'dependencies'];
    let overallStatus = 'healthy';

    categories.forEach(category => {
      const result = this.results[category];
      const status = result.status || 'unknown';
      const icon = status === 'healthy' || status === 'completed' ? '✅' :
        status === 'unhealthy' || status === 'failed' ? '❌' : '⚠️';

      console.log(`${icon} ${category.toUpperCase()}: ${status.toUpperCase()}`);

      if (result.errors && result.errors.length > 0) {
        result.errors.forEach(error => {
          console.log(`   - ${error}`);
        });
      }

      if (status === 'unhealthy' || status === 'failed') {
        overallStatus = 'unhealthy';
      }
    });

    console.log('');
    console.log(`🎯 OVERALL STATUS: ${overallStatus.toUpperCase()}`);

    if (overallStatus === 'unhealthy') {
      console.log('');
      console.log('🔧 RECOMMENDED ACTIONS:');

      if (this.results.database.status !== 'healthy') {
        console.log('- Check PostgreSQL service status and configuration');
        console.log('- Verify database credentials and network connectivity');
      }

      if (this.results.redis.status !== 'healthy') {
        console.log('- Check Redis service status and configuration');
        console.log('- Verify Redis credentials and network connectivity');
        console.log('- Consider Redis URL format and authentication method');
      }

      if (this.results.api.status !== 'healthy') {
        console.log('- Ensure backend server is running on correct port');
        console.log('- Check for port conflicts or firewall issues');
      }
    }

    // Save detailed results to file
    const reportData = {
      timestamp: new Date().toISOString(),
      duration,
      overallStatus,
      results: this.results
    };

    const fs = require('fs');
    const reportPath = `./connection-test-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

    try {
      fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
      console.log('');
      console.log(`📄 Detailed report saved to: ${reportPath}`);
    } catch (error) {
      console.error('Failed to save detailed report:', error.message);
    }
  }
}

// Run the comprehensive test
if (require.main === module) {
  const tester = new ComprehensiveConnectionTest();
  tester.runAllTests().catch(console.error);
}

module.exports = { ComprehensiveConnectionTest };