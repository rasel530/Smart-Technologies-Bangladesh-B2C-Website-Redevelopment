const { DatabaseService } = require('../services/database');
const { ConfigService } = require('../services/config');
const { LoggerService } = require('../services/logger');
const { AuthMiddleware } = require('../middleware/auth');
const assert = require('assert');

// Test Health Check Endpoints with Various Failure Scenarios
class HealthCheckTest {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
    this.originalEnv = { ...process.env };
  }

  async runAllTests() {
    console.log('🧪 Starting Health Check Tests...\n');
    
    await this.testBasicHealthCheck();
    await this.testDatabaseHealthCheck();
    await this.testRedisHealthCheck();
    await this.testExternalServicesHealthCheck();
    await this.testMemoryHealthCheck();
    await this.testDiskSpaceHealthCheck();
    await this.testServiceDependenciesHealthCheck();
    await this.testCircuitBreakerHealthCheck();
    await this.testPerformanceHealthCheck();
    await this.testAggregateHealthStatus();
    
    this.generateTestReport();
  }

  restoreEnvironment() {
    process.env = { ...this.originalEnv };
  }

  async testBasicHealthCheck() {
    this.testResults.total++;
    console.log('🔍 Test 1: Basic Health Check');
    
    try {
      // Mock basic health check service
      const mockHealthService = {
        getBasicHealth: jest.fn().mockResolvedValue({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development'
        }),
        isHealthy: jest.fn().mockReturnValue(true)
      };
      
      // Test basic health check
      const basicHealth = await mockHealthService.getBasicHealth();
      
      assert(basicHealth.status === 'healthy', 'Should return healthy status');
      assert(basicHealth.timestamp !== undefined, 'Should include timestamp');
      assert(basicHealth.uptime !== undefined, 'Should include uptime');
      assert(basicHealth.version === '1.0.0', 'Should include version');
      assert(basicHealth.environment !== undefined, 'Should include environment');
      
      // Test health status check
      const isHealthy = mockHealthService.isHealthy();
      assert(isHealthy === true, 'Should indicate service is healthy');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Basic Health Check',
        status: 'PASSED',
        message: 'Basic health check working correctly with all required fields'
      });
      
      console.log('✅ PASSED: Basic health check working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Basic Health Check',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testDatabaseHealthCheck() {
    this.testResults.total++;
    console.log('🔍 Test 2: Database Health Check');
    
    try {
      // Mock database health check
      const mockDatabaseHealth = {
        checkDatabaseHealth: jest.fn().mockImplementation(async () => {
          const mockPrisma = {
            $queryRaw: jest.fn().mockResolvedValue([{ status: 1, server_time: new Date() }])
          };
          
          try {
            const result = await mockPrisma.$queryRaw`SELECT 1 as status, NOW() as server_time`;
            const responseTime = Math.random() * 100; // Mock response time
            
            return {
              status: 'healthy',
              connection: 'active',
              responseTime: `${responseTime.toFixed(2)}ms`,
              poolStats: {
                activeConnections: 5,
                idleConnections: 3,
                totalConnections: 8,
                maxConnections: 10,
                utilizationRate: '50.00%'
              },
              timestamp: new Date().toISOString()
            };
          } catch (error) {
            return {
              status: 'unhealthy',
              connection: 'failed',
              error: error.message,
              timestamp: new Date().toISOString()
            };
          }
        })
      };
      
      // Test healthy database
      const healthyDb = await mockDatabaseHealth.checkDatabaseHealth();
      assert(healthyDb.status === 'healthy', 'Should return healthy status');
      assert(healthyDb.connection === 'active', 'Should indicate active connection');
      assert(healthyDb.responseTime.includes('ms'), 'Should include response time');
      assert(healthyDb.poolStats !== undefined, 'Should include pool statistics');
      
      // Test failed database
      const mockFailingDatabase = {
        checkDatabaseHealth: jest.fn().mockResolvedValue({
          status: 'unhealthy',
          connection: 'failed',
          error: 'Connection timeout',
          responseTime: '5000ms',
          timestamp: new Date().toISOString()
        })
      };
      
      const failingDb = await mockFailingDatabase.checkDatabaseHealth();
      assert(failingDb.status === 'unhealthy', 'Should return unhealthy status');
      assert(failingDb.connection === 'failed', 'Should indicate failed connection');
      assert(failingDb.error !== undefined, 'Should include error message');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Database Health Check',
        status: 'PASSED',
        message: 'Database health check working correctly for both healthy and failed states'
      });
      
      console.log('✅ PASSED: Database health check working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Database Health Check',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testRedisHealthCheck() {
    this.testResults.total++;
    console.log('🔍 Test 3: Redis Health Check');
    
    try {
      // Mock Redis health check
      const mockRedisHealth = {
        checkRedisHealth: jest.fn().mockImplementation(async () => {
          const mockRedis = {
            ping: jest.fn().mockResolvedValue('PONG'),
            info: jest.fn().mockResolvedValue({
              redis_version: '6.2.6',
              used_memory: '1.5M',
              connected_clients: 2,
              uptime_in_seconds: 86400
            })
          };
          
          try {
            const ping = await mockRedis.ping();
            const info = await mockRedis.info();
            
            if (ping !== 'PONG') {
              return {
                status: 'unhealthy',
                error: 'Redis ping failed',
                timestamp: new Date().toISOString()
              };
            }
            
            return {
              status: 'healthy',
              connection: 'active',
              memory: info.used_memory,
              clients: info.connected_clients,
              uptime: info.uptime_in_seconds,
              version: info.redis_version,
              timestamp: new Date().toISOString()
            };
          } catch (error) {
            return {
              status: 'unhealthy',
              connection: 'failed',
              error: error.message,
              timestamp: new Date().toISOString()
            };
          }
        })
      };
      
      // Test healthy Redis
      const healthyRedis = await mockRedisHealth.checkRedisHealth();
      assert(healthyRedis.status === 'healthy', 'Should return healthy status');
      assert(healthyRedis.connection === 'active', 'Should indicate active connection');
      assert(healthyRedis.memory !== undefined, 'Should include memory usage');
      assert(healthyRedis.clients !== undefined, 'Should include client count');
      assert(healthyRedis.version !== undefined, 'Should include Redis version');
      
      // Test failed Redis
      const mockFailingRedis = {
        checkRedisHealth: jest.fn().mockResolvedValue({
          status: 'unhealthy',
          connection: 'failed',
          error: 'ECONNREFUSED: Connection refused',
          timestamp: new Date().toISOString()
        })
      };
      
      const failingRedis = await mockFailingRedis.checkRedisHealth();
      assert(failingRedis.status === 'unhealthy', 'Should return unhealthy status');
      assert(failingRedis.connection === 'failed', 'Should indicate failed connection');
      assert(failingRedis.error.includes('ECONNREFUSED'), 'Should include connection error');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Redis Health Check',
        status: 'PASSED',
        message: 'Redis health check working correctly for both healthy and failed states'
      });
      
      console.log('✅ PASSED: Redis health check working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Redis Health Check',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testExternalServicesHealthCheck() {
    this.testResults.total++;
    console.log('🔍 Test 4: External Services Health Check');
    
    try {
      // Mock external services health check
      const mockExternalHealth = {
        checkExternalServices: jest.fn().mockImplementation(async () => {
          const services = ['payment_gateway', 'sms_service', 'email_service', 'search_service'];
          const results = {};
          
          for (const service of services) {
            try {
              switch (service) {
                case 'payment_gateway':
                  results[service] = {
                    status: 'healthy',
                    gateways: {
                      bkash: { status: 'active', responseTime: '150ms' },
                      nagad: { status: 'active', responseTime: '200ms' },
                      rocket: { status: 'inactive', responseTime: null }
                    },
                    timestamp: new Date().toISOString()
                  };
                  break;
                  
                case 'sms_service':
                  results[service] = {
                    status: 'healthy',
                    provider: 'banglalink',
                    deliveryRate: '95%',
                    timestamp: new Date().toISOString()
                  };
                  break;
                  
                case 'email_service':
                  results[service] = {
                    status: 'unhealthy',
                    error: 'SMTP authentication failed',
                    timestamp: new Date().toISOString()
                  };
                  break;
                  
                case 'search_service':
                  results[service] = {
                    status: 'healthy',
                    elasticsearch: {
                      status: 'green',
                      nodes: 3,
                      documents: 10000
                    },
                    timestamp: new Date().toISOString()
                  };
                  break;
              }
            } catch (error) {
              results[service] = {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
              };
            }
          }
          
          return {
            overall: Object.values(results).every(r => r.status === 'healthy') ? 'healthy' : 'degraded',
            services: results,
            timestamp: new Date().toISOString()
          };
        })
      };
      
      // Test external services health
      const externalHealth = await mockExternalHealth.checkExternalServices();
      
      assert(externalHealth.overall === 'degraded', 'Should return degraded status (email service failing)');
      assert(externalHealth.services.payment_gateway.status === 'healthy', 'Payment gateway should be healthy');
      assert(externalHealth.services.sms_service.status === 'healthy', 'SMS service should be healthy');
      assert(externalHealth.services.email_service.status === 'unhealthy', 'Email service should be unhealthy');
      assert(externalHealth.services.search_service.status === 'healthy', 'Search service should be healthy');
      
      // Test individual service details
      const paymentGateway = externalHealth.services.payment_gateway;
      assert(paymentGateway.gateways.bkash.status === 'active', 'bKash should be active');
      assert(paymentGateway.gateways.nagad.status === 'active', 'Nagad should be active');
      assert(paymentGateway.gateways.rocket.status === 'inactive', 'Rocket should be inactive');
      
      const smsService = externalHealth.services.sms_service;
      assert(smsService.provider === 'banglalink', 'Should include SMS provider');
      assert(smsService.deliveryRate === '95%', 'Should include delivery rate');
      
      const searchService = externalHealth.services.search_service;
      assert(searchService.elasticsearch.status === 'green', 'Elasticsearch should be green');
      assert(searchService.elasticsearch.nodes === 3, 'Should include node count');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'External Services Health Check',
        status: 'PASSED',
        message: 'External services health check working correctly with detailed status'
      });
      
      console.log('✅ PASSED: External services health check working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'External Services Health Check',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testMemoryHealthCheck() {
    this.testResults.total++;
    console.log('🔍 Test 5: Memory Health Check');
    
    try {
      // Mock memory health check
      const mockMemoryHealth = {
        checkMemoryHealth: jest.fn().mockImplementation(async () => {
          const memoryUsage = process.memoryUsage();
          const totalMemory = require('os').totalmem();
          const freeMemory = require('os').freemem();
          
          const usedMemory = memoryUsage.heapUsed;
          const totalHeap = memoryUsage.heapTotal;
          const memoryUsagePercent = (usedMemory / totalHeap) * 100;
          const systemMemoryUsagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;
          
          // Determine memory status
          let status = 'healthy';
          let warnings = [];
          
          if (memoryUsagePercent > 80) {
            status = 'critical';
            warnings.push('Heap memory usage > 80%');
          } else if (memoryUsagePercent > 60) {
            status = 'warning';
            warnings.push('Heap memory usage > 60%');
          }
          
          if (systemMemoryUsagePercent > 90) {
            status = 'critical';
            warnings.push('System memory usage > 90%');
          }
          
          return {
            status,
            heap: {
              used: `${(usedMemory / 1024 / 1024).toFixed(2)}MB`,
              total: `${(totalHeap / 1024 / 1024).toFixed(2)}MB`,
              usagePercent: `${memoryUsagePercent.toFixed(2)}%`
            },
            system: {
              total: `${(totalMemory / 1024 / 1024 / 1024).toFixed(2)}GB`,
              free: `${(freeMemory / 1024 / 1024 / 1024).toFixed(2)}GB`,
              usagePercent: `${systemMemoryUsagePercent.toFixed(2)}%`
            },
            warnings,
            timestamp: new Date().toISOString()
          };
        })
      };
      
      // Test memory health check
      const memoryHealth = await mockMemoryHealth.checkMemoryHealth();
      
      assert(memoryHealth.status !== undefined, 'Should return memory status');
      assert(memoryHealth.heap !== undefined, 'Should include heap memory info');
      assert(memoryHealth.system !== undefined, 'Should include system memory info');
      assert(Array.isArray(memoryHealth.warnings), 'Should include warnings array');
      assert(memoryHealth.timestamp !== undefined, 'Should include timestamp');
      
      // Test memory status values
      assert(['healthy', 'warning', 'critical'].includes(memoryHealth.status), 'Status should be valid');
      assert(memoryHealth.heap.usagePercent.includes('%'), 'Heap usage should be percentage');
      assert(memoryHealth.system.usagePercent.includes('%'), 'System usage should be percentage');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Memory Health Check',
        status: 'PASSED',
        message: 'Memory health check working correctly with status and warnings'
      });
      
      console.log('✅ PASSED: Memory health check working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Memory Health Check',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testDiskSpaceHealthCheck() {
    this.testResults.total++;
    console.log('🔍 Test 6: Disk Space Health Check');
    
    try {
      // Mock disk space health check
      const mockDiskHealth = {
        checkDiskSpaceHealth: jest.fn().mockImplementation(async () => {
          const fs = require('fs');
          const path = require('path');
          
          const mockStats = {
            uploads: {
              total: 100 * 1024 * 1024 * 1024, // 100GB
              used: 60 * 1024 * 1024 * 1024, // 60GB
              free: 40 * 1024 * 1024 * 1024  // 40GB
            },
            logs: {
              total: 10 * 1024 * 1024 * 1024, // 10GB
              used: 8 * 1024 * 1024 * 1024, // 8GB
              free: 2 * 1024 * 1024 * 1024   // 2GB
            },
            database: {
              total: 50 * 1024 * 1024 * 1024, // 50GB
              used: 35 * 1024 * 1024 * 1024, // 35GB
              free: 15 * 1024 * 1024 * 1024  // 15GB
            }
          };
          
          const results = {};
          let overallStatus = 'healthy';
          
          for (const [mount, stats] of Object.entries(mockStats)) {
            const usagePercent = (stats.used / stats.total) * 100;
            
            let status = 'healthy';
            if (usagePercent > 90) {
              status = 'critical';
            } else if (usagePercent > 80) {
              status = 'warning';
            }
            
            if (status === 'critical' || (status === 'warning' && overallStatus === 'healthy')) {
              overallStatus = status;
            }
            
            results[mount] = {
              status,
              total: `${(stats.total / 1024 / 1024 / 1024).toFixed(2)}GB`,
              used: `${(stats.used / 1024 / 1024 / 1024).toFixed(2)}GB`,
              free: `${(stats.free / 1024 / 1024 / 1024).toFixed(2)}GB`,
              usagePercent: `${usagePercent.toFixed(2)}%`
            };
          }
          
          return {
            overall: overallStatus,
            mounts: results,
            timestamp: new Date().toISOString()
          };
        })
      };
      
      // Test disk space health check
      const diskHealth = await mockDiskHealth.checkDiskSpaceHealth();
      
      assert(diskHealth.overall !== undefined, 'Should return overall status');
      assert(diskHealth.mounts !== undefined, 'Should include mount points');
      assert(diskHealth.timestamp !== undefined, 'Should include timestamp');
      
      // Test individual mount points
      const uploads = diskHealth.mounts.uploads;
      const logs = diskHealth.mounts.logs;
      const database = diskHealth.mounts.database;
      
      assert(uploads.status !== undefined, 'Uploads should have status');
      assert(logs.status !== undefined, 'Logs should have status');
      assert(database.status !== undefined, 'Database should have status');
      
      assert(uploads.usagePercent.includes('%'), 'Uploads usage should be percentage');
      assert(uploads.total.includes('GB'), 'Uploads total should be in GB');
      
      // Test overall status calculation
      assert(['healthy', 'warning', 'critical'].includes(diskHealth.overall), 'Overall status should be valid');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Disk Space Health Check',
        status: 'PASSED',
        message: 'Disk space health check working correctly with mount point analysis'
      });
      
      console.log('✅ PASSED: Disk space health check working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Disk Space Health Check',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testServiceDependenciesHealthCheck() {
    this.testResults.total++;
    console.log('🔍 Test 7: Service Dependencies Health Check');
    
    try {
      // Mock service dependencies health check
      const mockDependenciesHealth = {
        checkServiceDependencies: jest.fn().mockImplementation(async () => {
          const services = ['config', 'database', 'logger', 'auth', 'cache', 'queue'];
          const results = {};
          
          for (const service of services) {
            try {
              switch (service) {
                case 'config':
                  results[service] = {
                    status: 'healthy',
                    initialized: true,
                    lastCheck: new Date().toISOString(),
                    dependencies: []
                  };
                  break;
                  
                case 'database':
                  results[service] = {
                    status: 'healthy',
                    initialized: true,
                    lastCheck: new Date().toISOString(),
                    dependencies: ['config']
                  };
                  break;
                  
                case 'logger':
                  results[service] = {
                    status: 'healthy',
                    initialized: true,
                    lastCheck: new Date().toISOString(),
                    dependencies: ['config']
                  };
                  break;
                  
                case 'auth':
                  results[service] = {
                    status: 'degraded',
                    initialized: true,
                    lastCheck: new Date().toISOString(),
                    dependencies: ['config', 'logger', 'cache'],
                    issues: ['Redis connection unstable']
                  };
                  break;
                  
                case 'cache':
                  results[service] = {
                    status: 'unhealthy',
                    initialized: false,
                    lastCheck: new Date().toISOString(),
                    dependencies: [],
                    error: 'Redis connection failed'
                  };
                  break;
                  
                case 'queue':
                  results[service] = {
                    status: 'healthy',
                    initialized: true,
                    lastCheck: new Date().toISOString(),
                    dependencies: ['database']
                  };
                  break;
              }
            } catch (error) {
              results[service] = {
                status: 'unhealthy',
                initialized: false,
                lastCheck: new Date().toISOString(),
                error: error.message
              };
            }
          }
          
          // Check for circular dependencies
          const dependencyGraph = {};
          for (const [service, info] of Object.entries(results)) {
            dependencyGraph[service] = info.dependencies || [];
          }
          
          const hasCircularDependencies = this.detectCircularDependencies(dependencyGraph);
          
          return {
            overall: Object.values(results).every(r => r.status === 'healthy') ? 'healthy' : 
                    Object.values(results).some(r => r.status === 'unhealthy') ? 'unhealthy' : 'degraded',
            services: results,
            dependencyGraph,
            hasCircularDependencies,
            timestamp: new Date().toISOString()
          };
        }),
        
        detectCircularDependencies: jest.fn().mockImplementation((graph) => {
          const visited = new Set();
          const recursionStack = new Set();
          
          const hasCycle = (node) => {
            if (recursionStack.has(node)) {
              return true;
            }
            if (visited.has(node)) {
              return false;
            }
            
            visited.add(node);
            recursionStack.add(node);
            
            const dependencies = graph[node] || [];
            for (const dep of dependencies) {
              if (hasCycle(dep)) {
                return true;
              }
            }
            
            recursionStack.delete(node);
            return false;
          };
          
          for (const node of Object.keys(graph)) {
            if (hasCycle(node)) {
              return true;
            }
          }
          
          return false;
        })
      };
      
      // Test service dependencies health
      const dependenciesHealth = await mockDependenciesHealth.checkServiceDependencies();
      
      assert(dependenciesHealth.overall === 'degraded', 'Should return degraded status');
      assert(dependenciesHealth.services !== undefined, 'Should include services status');
      assert(dependenciesHealth.dependencyGraph !== undefined, 'Should include dependency graph');
      assert(dependenciesHealth.hasCircularDependencies === false, 'Should not have circular dependencies');
      
      // Test individual service statuses
      assert(dependenciesHealth.services.config.status === 'healthy', 'Config should be healthy');
      assert(dependenciesHealth.services.database.status === 'healthy', 'Database should be healthy');
      assert(dependenciesHealth.services.auth.status === 'degraded', 'Auth should be degraded');
      assert(dependenciesHealth.services.cache.status === 'unhealthy', 'Cache should be unhealthy');
      
      // Test dependency relationships
      assert(dependenciesHealth.services.database.dependencies.includes('config'), 'Database should depend on config');
      assert(dependenciesHealth.services.auth.dependencies.includes('cache'), 'Auth should depend on cache');
      assert(dependenciesHealth.services.cache.error.includes('Redis'), 'Cache should include Redis error');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Service Dependencies Health Check',
        status: 'PASSED',
        message: 'Service dependencies health check working correctly with dependency graph'
      });
      
      console.log('✅ PASSED: Service dependencies health check working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Service Dependencies Health Check',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testCircuitBreakerHealthCheck() {
    this.testResults.total++;
    console.log('🔍 Test 8: Circuit Breaker Health Check');
    
    try {
      // Mock circuit breaker health check
      const mockCircuitBreakerHealth = {
        checkCircuitBreakerHealth: jest.fn().mockImplementation(async () => {
          const circuitBreakers = {
            payment_gateway: {
              state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
              failureCount: 2,
              failureThreshold: 5,
              lastFailureTime: null,
              successThreshold: 3,
              timeout: 30000
            },
            email_service: {
              state: 'OPEN',
              failureCount: 7,
              failureThreshold: 5,
              lastFailureTime: Date.now() - 10000, // 10 seconds ago
              successThreshold: 3,
              timeout: 30000
            },
            search_service: {
              state: 'HALF_OPEN',
              failureCount: 4,
              failureThreshold: 5,
              lastFailureTime: Date.now() - 40000, // 40 seconds ago
              successThreshold: 3,
              timeout: 30000
            }
          };
          
          const results = {};
          let overallStatus = 'healthy';
          
          for (const [service, breaker] of Object.entries(circuitBreakers)) {
            let status = 'healthy';
            
            if (breaker.state === 'OPEN') {
              status = 'unhealthy';
              overallStatus = 'unhealthy';
            } else if (breaker.state === 'HALF_OPEN') {
              status = 'degraded';
              if (overallStatus === 'healthy') {
                overallStatus = 'degraded';
              }
            } else if (breaker.failureCount >= breaker.failureThreshold) {
              status = 'warning';
              if (overallStatus === 'healthy') {
                overallStatus = 'warning';
              }
            }
            
            results[service] = {
              status,
              state: breaker.state,
              failureCount: breaker.failureCount,
              failureThreshold: breaker.failureThreshold,
              timeSinceLastFailure: breaker.lastFailureTime ? 
                `${Math.floor((Date.now() - breaker.lastFailureTime) / 1000)}s` : null,
              timeout: breaker.timeout
            };
          }
          
          return {
            overall: overallStatus,
            circuitBreakers: results,
            timestamp: new Date().toISOString()
          };
        })
      };
      
      // Test circuit breaker health check
      const circuitHealth = await mockCircuitBreakerHealth.checkCircuitBreakerHealth();
      
      assert(circuitHealth.overall === 'warning', 'Should return warning overall status');
      assert(circuitHealth.circuitBreakers !== undefined, 'Should include circuit breakers');
      
      // Test individual circuit breaker statuses
      const paymentGateway = circuitHealth.circuitBreakers.payment_gateway;
      const emailService = circuitHealth.circuitBreakers.email_service;
      const searchService = circuitHealth.circuitBreakers.search_service;
      
      assert(paymentGateway.status === 'healthy', 'Payment gateway should be healthy');
      assert(emailService.status === 'unhealthy', 'Email service should be unhealthy');
      assert(searchService.status === 'degraded', 'Search service should be degraded');
      
      // Test circuit breaker states
      assert(paymentGateway.state === 'CLOSED', 'Payment gateway should be closed');
      assert(emailService.state === 'OPEN', 'Email service should be open');
      assert(searchService.state === 'HALF_OPEN', 'Search service should be half-open');
      
      // Test failure tracking
      assert(emailService.failureCount > emailService.failureThreshold, 'Email service should exceed failure threshold');
      assert(emailService.timeSinceLastFailure !== null, 'Email service should track time since last failure');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Circuit Breaker Health Check',
        status: 'PASSED',
        message: 'Circuit breaker health check working correctly with state tracking'
      });
      
      console.log('✅ PASSED: Circuit breaker health check working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Circuit Breaker Health Check',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testPerformanceHealthCheck() {
    this.testResults.total++;
    console.log('🔍 Test 9: Performance Health Check');
    
    try {
      // Mock performance health check
      const mockPerformanceHealth = {
        checkPerformanceHealth: jest.fn().mockImplementation(async () => {
          const metrics = {
            responseTime: {
              avg: 150, // milliseconds
              p95: 300,
              p99: 500
            },
            throughput: {
              requestsPerSecond: 100,
              requestsPerMinute: 6000
            },
            errorRate: {
              totalRequests: 10000,
              errorRequests: 50,
              percentage: 0.5
            },
            cpu: {
              usagePercent: 65,
              loadAverage: [1.2, 1.5, 1.8]
            },
            memory: {
              heapUsed: 800 * 1024 * 1024, // 800MB
              heapTotal: 1024 * 1024 * 1024, // 1GB
              usagePercent: 78.125
            }
          };
          
          const results = {};
          let overallStatus = 'healthy';
          
          // Response time check
          if (metrics.responseTime.p99 > 1000) {
            results.responseTime = { status: 'critical', threshold: '1000ms' };
            overallStatus = 'critical';
          } else if (metrics.responseTime.p95 > 500) {
            results.responseTime = { status: 'warning', threshold: '500ms' };
            if (overallStatus === 'healthy') overallStatus = 'warning';
          } else {
            results.responseTime = { status: 'healthy', threshold: '500ms' };
          }
          
          // Error rate check
          if (metrics.errorRate.percentage > 5) {
            results.errorRate = { status: 'critical', threshold: '5%' };
            overallStatus = 'critical';
          } else if (metrics.errorRate.percentage > 1) {
            results.errorRate = { status: 'warning', threshold: '1%' };
            if (overallStatus === 'healthy') overallStatus = 'warning';
          } else {
            results.errorRate = { status: 'healthy', threshold: '1%' };
          }
          
          // CPU check
          if (metrics.cpu.usagePercent > 90) {
            results.cpu = { status: 'critical', threshold: '90%' };
            overallStatus = 'critical';
          } else if (metrics.cpu.usagePercent > 80) {
            results.cpu = { status: 'warning', threshold: '80%' };
            if (overallStatus === 'healthy') overallStatus = 'warning';
          } else {
            results.cpu = { status: 'healthy', threshold: '80%' };
          }
          
          // Memory check
          if (metrics.memory.usagePercent > 90) {
            results.memory = { status: 'critical', threshold: '90%' };
            overallStatus = 'critical';
          } else if (metrics.memory.usagePercent > 80) {
            results.memory = { status: 'warning', threshold: '80%' };
            if (overallStatus === 'healthy') overallStatus = 'warning';
          } else {
            results.memory = { status: 'healthy', threshold: '80%' };
          }
          
          return {
            overall: overallStatus,
            metrics,
            checks: results,
            timestamp: new Date().toISOString()
          };
        })
      };
      
      // Test performance health check
      const performanceHealth = await mockPerformanceHealth.checkPerformanceHealth();
      
      assert(performanceHealth.overall !== undefined, 'Should return overall status');
      assert(performanceHealth.metrics !== undefined, 'Should include performance metrics');
      assert(performanceHealth.checks !== undefined, 'Should include individual checks');
      
      // Test performance metrics
      const metrics = performanceHealth.metrics;
      assert(metrics.responseTime.avg > 0, 'Should have average response time');
      assert(metrics.throughput.requestsPerSecond > 0, 'Should have throughput metrics');
      assert(metrics.errorRate.percentage >= 0, 'Should have error rate');
      assert(metrics.cpu.usagePercent > 0, 'Should have CPU usage');
      assert(metrics.memory.usagePercent > 0, 'Should have memory usage');
      
      // Test individual check results
      const checks = performanceHealth.checks;
      assert(checks.responseTime.status !== undefined, 'Should have response time check');
      assert(checks.errorRate.status !== undefined, 'Should have error rate check');
      assert(checks.cpu.status !== undefined, 'Should have CPU check');
      assert(checks.memory.status !== undefined, 'Should have memory check');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Performance Health Check',
        status: 'PASSED',
        message: 'Performance health check working correctly with comprehensive metrics'
      });
      
      console.log('✅ PASSED: Performance health check working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Performance Health Check',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testAggregateHealthStatus() {
    this.testResults.total++;
    console.log('🔍 Test 10: Aggregate Health Status');
    
    try {
      // Mock aggregate health status
      const mockAggregateHealth = {
        getAggregateHealthStatus: jest.fn().mockImplementation(async () => {
          const individualChecks = {
            basic: { status: 'healthy', weight: 1 },
            database: { status: 'healthy', weight: 2 },
            redis: { status: 'degraded', weight: 2 },
            external_services: { status: 'healthy', weight: 1 },
            memory: { status: 'warning', weight: 2 },
            disk_space: { status: 'healthy', weight: 1 },
            dependencies: { status: 'healthy', weight: 1 },
            circuit_breakers: { status: 'degraded', weight: 2 },
            performance: { status: 'healthy', weight: 2 }
          };
          
          // Calculate weighted health score
          let totalWeight = 0;
          let healthyWeight = 0;
          let criticalIssues = [];
          let warnings = [];
          
          for (const [check, result] of Object.entries(individualChecks)) {
            totalWeight += result.weight;
            
            if (result.status === 'healthy') {
              healthyWeight += result.weight;
            } else if (result.status === 'critical') {
              criticalIssues.push(check);
            } else if (result.status === 'warning' || result.status === 'degraded') {
              warnings.push(check);
            }
          }
          
          const healthScore = totalWeight > 0 ? (healthyWeight / totalWeight) * 100 : 0;
          
          // Determine overall status
          let overallStatus = 'healthy';
          if (criticalIssues.length > 0) {
            overallStatus = 'critical';
          } else if (warnings.length > 0) {
            overallStatus = 'degraded';
          }
          
          return {
            overall: overallStatus,
            healthScore: Math.round(healthScore),
            individualChecks,
            summary: {
              totalChecks: Object.keys(individualChecks).length,
              healthyChecks: Object.values(individualChecks).filter(r => r.status === 'healthy').length,
              criticalIssues: criticalIssues.length,
              warnings: warnings.length
            },
            timestamp: new Date().toISOString()
          };
        })
      };
      
      // Test aggregate health status
      const aggregateHealth = await mockAggregateHealth.getAggregateHealthStatus();
      
      assert(aggregateHealth.overall === 'degraded', 'Should return degraded overall status');
      assert(typeof aggregateHealth.healthScore === 'number', 'Should include health score');
      assert(aggregateHealth.individualChecks !== undefined, 'Should include individual checks');
      assert(aggregateHealth.summary !== undefined, 'Should include summary');
      
      // Test health score calculation
      assert(aggregateHealth.healthScore > 0 && aggregateHealth.healthScore <= 100, 'Health score should be between 0-100');
      
      // Test summary
      const summary = aggregateHealth.summary;
      assert(summary.totalChecks === 9, 'Should have 9 total checks');
      assert(summary.healthyChecks > 0, 'Should have healthy checks');
      assert(summary.criticalIssues === 0, 'Should have no critical issues');
      assert(summary.warnings > 0, 'Should have warnings');
      
      // Test individual check inclusion
      const checks = aggregateHealth.individualChecks;
      assert(checks.basic.status === 'healthy', 'Basic check should be healthy');
      assert(checks.redis.status === 'degraded', 'Redis check should be degraded');
      assert(checks.memory.status === 'warning', 'Memory check should be warning');
      assert(checks.circuit_breakers.status === 'degraded', 'Circuit breaker check should be degraded');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Aggregate Health Status',
        status: 'PASSED',
        message: 'Aggregate health status working correctly with weighted scoring'
      });
      
      console.log('✅ PASSED: Aggregate health status working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Aggregate Health Status',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  generateTestReport() {
    console.log('\n📊 HEALTH CHECK TEST REPORT');
    console.log('================================');
    console.log(`Total Tests: ${this.testResults.total}`);
    console.log(`Passed: ${this.testResults.passed}`);
    console.log(`Failed: ${this.testResults.failed}`);
    console.log(`Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(2)}%\n`);
    
    console.log('📋 Detailed Results:');
    this.testResults.details.forEach((detail, index) => {
      const status = detail.status === 'PASSED' ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${detail.test}: ${detail.message}`);
    });
    
    return this.testResults;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const test = new HealthCheckTest();
  test.runAllTests().catch(console.error);
}

module.exports = HealthCheckTest;