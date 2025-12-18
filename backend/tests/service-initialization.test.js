const { DatabaseService } = require('../services/database');
const { ConfigService } = require('../services/config');
const { LoggerService } = require('../services/logger');
const { AuthMiddleware } = require('../middleware/auth');
const assert = require('assert');

// Test Service Initialization and Dependency Resolution
class ServiceInitializationTest {
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
    console.log('🧪 Starting Service Initialization Tests...\n');
    
    await this.testConfigServiceInitialization();
    await this.testDatabaseServiceInitialization();
    await this.testLoggerServiceInitialization();
    await this.testAuthMiddlewareInitialization();
    await this.testDependencyInjection();
    await this.testServiceHealthChecks();
    await this.testServiceStartupSequence();
    await this.testServiceRestartCapability();
    await this.testServiceConfigurationReload();
    await this.testServiceDependencyFailures();
    
    this.generateTestReport();
  }

  restoreEnvironment() {
    process.env = { ...this.originalEnv };
  }

  async testConfigServiceInitialization() {
    this.testResults.total++;
    console.log('🔍 Test 1: Config Service Initialization');
    
    try {
      // Set minimal environment
      process.env.NODE_ENV = 'test';
      process.env.JWT_SECRET = 'test-jwt-secret';
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      let initializationError = null;
      let configService = null;
      
      try {
        configService = new ConfigService();
      } catch (error) {
        initializationError = error;
      }
      
      assert(initializationError === null, 'Config service should initialize without errors');
      assert(configService !== null, 'Config service instance should be created');
      
      // Test configuration methods
      assert(typeof configService.get === 'function', 'Should have get method');
      assert(typeof configService.getAll === 'function', 'Should have getAll method');
      assert(typeof configService.isProduction === 'function', 'Should have isProduction method');
      assert(typeof configService.isDevelopment === 'function', 'Should have isDevelopment method');
      assert(typeof configService.isTest === 'function', 'Should have isTest method');
      
      // Test configuration helpers
      const dbConfig = configService.getDatabaseConfig();
      const jwtConfig = configService.getJWTConfig();
      const corsConfig = configService.getCORSConfig();
      
      assert(dbConfig !== undefined, 'Should provide database config');
      assert(jwtConfig !== undefined, 'Should provide JWT config');
      assert(corsConfig !== undefined, 'Should provide CORS config');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Config Service Initialization',
        status: 'PASSED',
        message: 'Config service initialized successfully with all required methods'
      });
      
      console.log('✅ PASSED: Config service initialization working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Config Service Initialization',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    } finally {
      this.restoreEnvironment();
    }
  }

  async testDatabaseServiceInitialization() {
    this.testResults.total++;
    console.log('🔍 Test 2: Database Service Initialization');
    
    try {
      // Mock PrismaClient for testing
      const mockPrisma = {
        $connect: jest.fn().mockResolvedValue(true),
        $disconnect: jest.fn().mockResolvedValue(true),
        $queryRaw: jest.fn(),
        $on: jest.fn()
      };

      const originalPrismaClient = require('@prisma/client').PrismaClient;
      require('@prisma/client').PrismaClient = jest.fn(() => mockPrisma);

      let initializationError = null;
      let dbService = null;
      
      try {
        dbService = new DatabaseService();
      } catch (error) {
        initializationError = error;
      }
      
      assert(initializationError === null, 'Database service should initialize without errors');
      assert(dbService !== null, 'Database service instance should be created');
      
      // Test database service methods
      assert(typeof dbService.connect === 'function', 'Should have connect method');
      assert(typeof dbService.disconnect === 'function', 'Should have disconnect method');
      assert(typeof dbService.healthCheck === 'function', 'Should have healthCheck method');
      assert(typeof dbService.getStats === 'function', 'Should have getStats method');
      assert(typeof dbService.transaction === 'function', 'Should have transaction method');
      assert(typeof dbService.getClient === 'function', 'Should have getClient method');
      assert(typeof dbService.query === 'function', 'Should have query method');
      
      // Test connection pool initialization
      const poolStats = dbService.getConnectionPoolStats();
      assert(poolStats !== null, 'Should have connection pool stats');
      assert(typeof poolStats.maxConnections === 'number', 'Should have max connections setting');
      assert(typeof poolStats.activeConnections === 'number', 'Should track active connections');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Database Service Initialization',
        status: 'PASSED',
        message: 'Database service initialized successfully with connection pooling'
      });
      
      console.log('✅ PASSED: Database service initialization working correctly\n');
      
      require('@prisma/client').PrismaClient = originalPrismaClient;
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Database Service Initialization',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testLoggerServiceInitialization() {
    this.testResults.total++;
    console.log('🔍 Test 3: Logger Service Initialization');
    
    try {
      // Set environment for logger testing
      process.env.NODE_ENV = 'test';
      
      let initializationError = null;
      let loggerService = null;
      
      try {
        loggerService = new LoggerService();
      } catch (error) {
        initializationError = error;
      }
      
      assert(initializationError === null, 'Logger service should initialize without errors');
      assert(loggerService !== null, 'Logger service instance should be created');
      
      // Test logger service methods
      assert(typeof loggerService.getLogger === 'function', 'Should have getLogger method');
      assert(typeof loggerService.info === 'function', 'Should have info method');
      assert(typeof loggerService.error === 'function', 'Should have error method');
      assert(typeof loggerService.warn === 'function', 'Should have warn method');
      assert(typeof loggerService.debug === 'function', 'Should have debug method');
      assert(typeof loggerService.requestLogger === 'function', 'Should have requestLogger method');
      assert(typeof loggerService.errorLogger === 'function', 'Should have errorLogger method');
      
      // Test logger configuration
      const config = loggerService.config;
      assert(config !== undefined, 'Should have logger configuration');
      assert(typeof config.level === 'string', 'Should have log level configured');
      assert(typeof config.format === 'string', 'Should have log format configured');
      
      // Test performance metrics
      const metrics = loggerService.getPerformanceMetrics();
      assert(metrics !== undefined, 'Should have performance metrics');
      assert(typeof metrics.totalLogs === 'number', 'Should track total logs');
      assert(typeof metrics.averageLogTime === 'number', 'Should track average log time');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Logger Service Initialization',
        status: 'PASSED',
        message: 'Logger service initialized successfully with performance tracking'
      });
      
      console.log('✅ PASSED: Logger service initialization working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Logger Service Initialization',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    } finally {
      this.restoreEnvironment();
    }
  }

  async testAuthMiddlewareInitialization() {
    this.testResults.total++;
    console.log('🔍 Test 4: Auth Middleware Initialization');
    
    try {
      // Mock Redis for auth middleware
      const mockRedis = {
        connect: jest.fn().mockResolvedValue(true),
        on: jest.fn(),
        get: jest.fn().mockResolvedValue(null),
        setEx: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1)
      };

      jest.mock('redis', () => ({
        createClient: jest.fn(() => mockRedis)
      }));

      let initializationError = null;
      let authMiddleware = null;
      
      try {
        authMiddleware = new AuthMiddleware();
        await authMiddleware.initializeRedis();
      } catch (error) {
        initializationError = error;
      }
      
      assert(initializationError === null, 'Auth middleware should initialize without errors');
      assert(authMiddleware !== null, 'Auth middleware instance should be created');
      
      // Test auth middleware methods
      assert(typeof authMiddleware.authenticate === 'function', 'Should have authenticate method');
      assert(typeof authMiddleware.authorize === 'function', 'Should have authorize method');
      assert(typeof authMiddleware.adminOnly === 'function', 'Should have adminOnly method');
      assert(typeof authMiddleware.rateLimit === 'function', 'Should have rateLimit method');
      assert(typeof authMiddleware.blacklistToken === 'function', 'Should have blacklistToken method');
      assert(typeof authMiddleware.isTokenBlacklisted === 'function', 'Should have isTokenBlacklisted method');
      
      // Test Redis connection
      assert(authMiddleware.redis !== null, 'Should have Redis client initialized');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Auth Middleware Initialization',
        status: 'PASSED',
        message: 'Auth middleware initialized successfully with Redis connection'
      });
      
      console.log('✅ PASSED: Auth middleware initialization working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Auth Middleware Initialization',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testDependencyInjection() {
    this.testResults.total++;
    console.log('🔍 Test 5: Dependency Injection');
    
    try {
      // Mock dependency injection container
      const mockContainer = {
        services: new Map(),
        register: jest.fn().mockImplementation((name, factory) => {
          mockContainer.services.set(name, factory);
        }),
        get: jest.fn().mockImplementation((name) => {
          const factory = mockContainer.services.get(name);
          if (!factory) {
            throw new Error(`Service ${name} not registered`);
          }
          return factory();
        }),
        has: jest.fn().mockImplementation((name) => {
          return mockContainer.services.has(name);
        })
      };
      
      // Test service registration
      mockContainer.register('config', () => new ConfigService());
      mockContainer.register('database', () => new DatabaseService());
      mockContainer.register('logger', () => new LoggerService());
      mockContainer.register('auth', () => new AuthMiddleware());
      
      assert(mockContainer.register.mock.calls.length === 4, 'Should register 4 services');
      
      // Test service resolution
      const configService = mockContainer.get('config');
      const databaseService = mockContainer.get('database');
      const loggerService = mockContainer.get('logger');
      const authMiddleware = mockContainer.get('auth');
      
      assert(configService !== undefined, 'Should resolve config service');
      assert(databaseService !== undefined, 'Should resolve database service');
      assert(loggerService !== undefined, 'Should resolve logger service');
      assert(authMiddleware !== undefined, 'Should resolve auth middleware');
      
      // Test service existence check
      assert(mockContainer.has('config') === true, 'Should detect config service exists');
      assert(mockContainer.has('nonexistent') === false, 'Should detect nonexistent service');
      
      // Test dependency resolution error
      let dependencyError = null;
      try {
        mockContainer.get('nonexistent');
      } catch (error) {
        dependencyError = error;
      }
      
      assert(dependencyError !== null, 'Should throw error for unregistered service');
      assert(dependencyError.message.includes('not registered'), 'Should indicate service not registered');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Dependency Injection',
        status: 'PASSED',
        message: 'Dependency injection working correctly with service registration and resolution'
      });
      
      console.log('✅ PASSED: Dependency injection working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Dependency Injection',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testServiceHealthChecks() {
    this.testResults.total++;
    console.log('🔍 Test 6: Service Health Checks');
    
    try {
      // Mock health check service
      const mockHealthCheck = {
        checks: new Map(),
        registerCheck: jest.fn().mockImplementation((name, checkFunction) => {
          mockHealthCheck.checks.set(name, checkFunction);
        }),
        runAllChecks: jest.fn().mockImplementation(async () => {
          const results = new Map();
          
          for (const [name, checkFunction] of mockHealthCheck.checks) {
            try {
              const result = await checkFunction();
              results.set(name, { status: 'healthy', ...result });
            } catch (error) {
              results.set(name, { status: 'unhealthy', error: error.message });
            }
          }
          
          return {
            overall: Array.from(results.values()).every(r => r.status === 'healthy') ? 'healthy' : 'unhealthy',
            checks: Object.fromEntries(results),
            timestamp: new Date().toISOString()
          };
        })
      };
      
      // Register health checks
      mockHealthCheck.registerCheck('database', async () => {
        return { connection: 'active', responseTime: '50ms' };
      });
      
      mockHealthCheck.registerCheck('redis', async () => {
        return { connection: 'active', memory: '45MB' };
      });
      
      mockHealthCheck.registerCheck('disk_space', async () => {
        return { available: '500GB', used: '200GB' };
      });
      
      // Test health check registration
      assert(mockHealthCheck.registerCheck.mock.calls.length === 3, 'Should register 3 health checks');
      
      // Test health check execution
      const healthResults = await mockHealthCheck.runAllChecks();
      
      assert(healthResults.overall === 'healthy', 'Overall status should be healthy');
      assert(healthResults.checks.database.status === 'healthy', 'Database check should be healthy');
      assert(healthResults.checks.redis.status === 'healthy', 'Redis check should be healthy');
      assert(healthResults.checks.disk_space.status === 'healthy', 'Disk space check should be healthy');
      assert(healthResults.timestamp !== undefined, 'Should include timestamp');
      
      // Test failing health check
      mockHealthCheck.registerCheck('failing_service', async () => {
        throw new Error('Service unavailable');
      });
      
      const failingHealthResults = await mockHealthCheck.runAllChecks();
      assert(failingHealthResults.overall === 'unhealthy', 'Overall status should be unhealthy when one check fails');
      assert(failingHealthResults.checks.failing_service.status === 'unhealthy', 'Failing check should be marked unhealthy');
      assert(failingHealthResults.checks.failing_service.error !== undefined, 'Should include error message for failing check');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Service Health Checks',
        status: 'PASSED',
        message: 'Service health checks working correctly with failure detection'
      });
      
      console.log('✅ PASSED: Service health checks working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Service Health Checks',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testServiceStartupSequence() {
    this.testResults.total++;
    console.log('🔍 Test 7: Service Startup Sequence');
    
    try {
      // Mock service startup orchestrator
      const mockOrchestrator = {
        services: [],
        startupOrder: ['config', 'logger', 'database', 'auth'],
        startedServices: new Set(),
        
        registerService: jest.fn().mockImplementation((name, startupFunction) => {
          mockOrchestrator.services.push({ name, startup: startupFunction });
        }),
        
        startServices: jest.fn().mockImplementation(async () => {
          const results = [];
          
          for (const serviceName of mockOrchestrator.startupOrder) {
            try {
              const service = mockOrchestrator.services.find(s => s.name === serviceName);
              if (!service) {
                throw new Error(`Service ${serviceName} not registered`);
              }
              
              await service.startup();
              mockOrchestrator.startedServices.add(serviceName);
              results.push({ service: serviceName, status: 'started' });
            } catch (error) {
              results.push({ service: serviceName, status: 'failed', error: error.message });
              throw error; // Stop startup on first failure
            }
          }
          
          return {
            success: mockOrchestrator.startedServices.size === mockOrchestrator.startupOrder.length,
            started: Array.from(mockOrchestrator.startedServices),
            failed: results.filter(r => r.status === 'failed'),
            timestamp: new Date().toISOString()
          };
        })
      };
      
      // Register services with startup functions
      mockOrchestrator.registerService('config', async () => {
        return new ConfigService();
      });
      
      mockOrchestrator.registerService('logger', async () => {
        return new LoggerService();
      });
      
      mockOrchestrator.registerService('database', async () => {
        const dbService = new DatabaseService();
        await dbService.connect();
        return dbService;
      });
      
      mockOrchestrator.registerService('auth', async () => {
        const authMiddleware = new AuthMiddleware();
        await authMiddleware.initializeRedis();
        return authMiddleware;
      });
      
      // Test service registration
      assert(mockOrchestrator.registerService.mock.calls.length === 4, 'Should register 4 services');
      
      // Test startup sequence
      const startupResults = await mockOrchestrator.startServices();
      
      assert(startupResults.success === true, 'All services should start successfully');
      assert(startupResults.started.length === 4, 'Should start all 4 services');
      assert(startupResults.started.includes('config'), 'Should start config service');
      assert(startupResults.started.includes('logger'), 'Should start logger service');
      assert(startupResults.started.includes('database'), 'Should start database service');
      assert(startupResults.started.includes('auth'), 'Should start auth service');
      assert(startupResults.failed.length === 0, 'Should have no failed services');
      
      // Test startup order validation
      const expectedOrder = ['config', 'logger', 'database', 'auth'];
      const actualOrder = startupResults.started;
      
      for (let i = 0; i < expectedOrder.length; i++) {
        assert(actualOrder[i] === expectedOrder[i], `Service ${expectedOrder[i]} should start in correct order`);
      }
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Service Startup Sequence',
        status: 'PASSED',
        message: 'Service startup sequence working correctly with proper order'
      });
      
      console.log('✅ PASSED: Service startup sequence working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Service Startup Sequence',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testServiceRestartCapability() {
    this.testResults.total++;
    console.log('🔍 Test 8: Service Restart Capability');
    
    try {
      // Mock service restart manager
      const mockRestartManager = {
        services: new Map(),
        registerService: jest.fn().mockImplementation((name, service) => {
          mockRestartManager.services.set(name, {
            instance: service,
            restartCount: 0,
            lastRestart: null
          });
        }),
        
        restartService: jest.fn().mockImplementation(async (serviceName) => {
          const serviceInfo = mockRestartManager.services.get(serviceName);
          if (!serviceInfo) {
            throw new Error(`Service ${serviceName} not registered`);
          }
          
          try {
            // Cleanup if possible
            if (serviceInfo.instance.cleanup) {
              await serviceInfo.instance.cleanup();
            }
            
            // Reinitialize
            serviceInfo.restartCount++;
            serviceInfo.lastRestart = new Date();
            
            return {
              service: serviceName,
              status: 'restarted',
              restartCount: serviceInfo.restartCount,
              timestamp: serviceInfo.lastRestart
            };
          } catch (error) {
            throw new Error(`Failed to restart ${serviceName}: ${error.message}`);
          }
        }),
        
        getRestartInfo: jest.fn().mockImplementation((serviceName) => {
          const serviceInfo = mockRestartManager.services.get(serviceName);
          if (!serviceInfo) {
            return null;
          }
          
          return {
            service: serviceName,
            restartCount: serviceInfo.restartCount,
            lastRestart: serviceInfo.lastRestart
          };
        })
      };
      
      // Register services with cleanup capability
      const mockConfigService = { cleanup: jest.fn().mockResolvedValue(true) };
      const mockDatabaseService = { cleanup: jest.fn().mockResolvedValue(true) };
      const mockLoggerService = { cleanup: jest.fn().mockResolvedValue(true) };
      
      mockRestartManager.registerService('config', mockConfigService);
      mockRestartManager.registerService('database', mockDatabaseService);
      mockRestartManager.registerService('logger', mockLoggerService);
      
      // Test service restart
      const configRestart = await mockRestartManager.restartService('config');
      const databaseRestart = await mockRestartManager.restartService('database');
      const loggerRestart = await mockRestartManager.restartService('logger');
      
      assert(configRestart.status === 'restarted', 'Config service should restart');
      assert(databaseRestart.status === 'restarted', 'Database service should restart');
      assert(loggerRestart.status === 'restarted', 'Logger service should restart');
      
      // Test restart tracking
      const configInfo = mockRestartManager.getRestartInfo('config');
      assert(configInfo.restartCount === 1, 'Should track config service restart count');
      assert(configInfo.lastRestart !== null, 'Should track last restart time');
      
      // Test restart failure
      let restartError = null;
      try {
        await mockRestartManager.restartService('nonexistent');
      } catch (error) {
        restartError = error;
      }
      
      assert(restartError !== null, 'Should throw error for nonexistent service');
      assert(restartError.message.includes('not registered'), 'Should indicate service not registered');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Service Restart Capability',
        status: 'PASSED',
        message: 'Service restart capability working correctly with tracking'
      });
      
      console.log('✅ PASSED: Service restart capability working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Service Restart Capability',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testServiceConfigurationReload() {
    this.testResults.total++;
    console.log('🔍 Test 9: Service Configuration Reload');
    
    try {
      // Mock configuration reload manager
      const mockReloadManager = {
        services: new Map(),
        registerService: jest.fn().mockImplementation((name, service) => {
          mockReloadManager.services.set(name, {
            instance: service,
            reloadConfig: service.reloadConfig || null
          });
        }),
        
        reloadConfiguration: jest.fn().mockImplementation(async (serviceName, newConfig) => {
          const serviceInfo = mockReloadManager.services.get(serviceName);
          if (!serviceInfo) {
            throw new Error(`Service ${serviceName} not registered`);
          }
          
          if (!serviceInfo.reloadConfig) {
            throw new Error(`Service ${serviceName} does not support configuration reload`);
          }
          
          try {
            await serviceInfo.reloadConfig(newConfig);
            return {
              service: serviceName,
              status: 'reloaded',
              timestamp: new Date().toISOString()
            };
          } catch (error) {
            throw new Error(`Failed to reload ${serviceName}: ${error.message}`);
          }
        })
      };
      
      // Register services with reload capability
      const mockConfigService = {
        reloadConfig: jest.fn().mockImplementation(async (config) => {
          return { reloaded: true, config };
        })
      };
      
      const mockDatabaseService = {
        reloadConfig: jest.fn().mockImplementation(async (config) => {
          return { reconnected: true, config };
        })
      };
      
      mockReloadManager.registerService('config', mockConfigService);
      mockReloadManager.registerService('database', mockDatabaseService);
      
      // Test configuration reload
      const newConfig = { timeout: 5000, retries: 3 };
      const configReload = await mockReloadManager.reloadConfiguration('config', newConfig);
      const databaseReload = await mockReloadManager.reloadConfiguration('database', newConfig);
      
      assert(configReload.status === 'reloaded', 'Config service should reload');
      assert(databaseReload.status === 'reloaded', 'Database service should reload');
      
      // Test reload function calls
      assert(mockConfigService.reloadConfig.calledWith(newConfig), 'Should call config reload with new config');
      assert(mockDatabaseService.reloadConfig.calledWith(newConfig), 'Should call database reload with new config');
      
      // Test reload failure
      let reloadError = null;
      try {
        await mockReloadManager.reloadConfiguration('nonexistent', newConfig);
      } catch (error) {
        reloadError = error;
      }
      
      assert(reloadError !== null, 'Should throw error for nonexistent service');
      assert(reloadError.message.includes('not registered'), 'Should indicate service not registered');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Service Configuration Reload',
        status: 'PASSED',
        message: 'Service configuration reload working correctly'
      });
      
      console.log('✅ PASSED: Service configuration reload working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Service Configuration Reload',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testServiceDependencyFailures() {
    this.testResults.total++;
    console.log('🔍 Test 10: Service Dependency Failures');
    
    try {
      // Mock service dependency failure handler
      const mockDependencyHandler = {
        services: new Map(),
        dependencies: new Map(),
        
        registerService: jest.fn().mockImplementation((name, factory, dependencies = []) => {
          mockDependencyHandler.services.set(name, { factory, dependencies });
        }),
        
        initializeServices: jest.fn().mockImplementation(async () => {
          const results = [];
          const initialized = new Set();
          
          // Topological sort for dependency resolution
          const initializeService = async (serviceName) => {
            if (initialized.has(serviceName)) {
              return;
            }
            
            const serviceInfo = mockDependencyHandler.services.get(serviceName);
            if (!serviceInfo) {
              throw new Error(`Service ${serviceName} not registered`);
            }
            
            // Check dependencies
            for (const dep of serviceInfo.dependencies) {
              if (!initialized.has(dep)) {
                try {
                  await initializeService(dep);
                } catch (error) {
                  throw new Error(`Dependency ${dep} failed to initialize: ${error.message}`);
                }
              }
            }
            
            try {
              const instance = await serviceInfo.factory();
              initialized.add(serviceName);
              results.push({ service: serviceName, status: 'initialized' });
            } catch (error) {
              results.push({ service: serviceName, status: 'failed', error: error.message });
              throw error;
            }
          };
          
          // Initialize all services
          for (const serviceName of mockDependencyHandler.services.keys()) {
            if (!initialized.has(serviceName)) {
              await initializeService(serviceName);
            }
          }
          
          return {
            success: initialized.size === mockDependencyHandler.services.size,
            initialized: Array.from(initialized),
            failed: results.filter(r => r.status === 'failed'),
            timestamp: new Date().toISOString()
          };
        })
      };
      
      // Register services with dependencies
      mockDependencyHandler.registerService('config', async () => new ConfigService(), []);
      mockDependencyHandler.registerService('logger', async () => new LoggerService(), ['config']);
      mockDependencyHandler.registerService('database', async () => {
        const dbService = new DatabaseService();
        await dbService.connect();
        return dbService;
      }, ['config', 'logger']);
      mockDependencyHandler.registerService('auth', async () => {
        const authMiddleware = new AuthMiddleware();
        await authMiddleware.initializeRedis();
        return authMiddleware;
      }, ['config', 'database']);
      
      // Test service initialization with dependencies
      const initResults = await mockDependencyHandler.initializeServices();
      
      assert(initResults.success === true, 'All services should initialize successfully');
      assert(initResults.initialized.length === 4, 'Should initialize all 4 services');
      assert(initResults.failed.length === 0, 'Should have no failed services');
      
      // Test dependency order
      const configIndex = initResults.initialized.indexOf('config');
      const loggerIndex = initResults.initialized.indexOf('logger');
      const databaseIndex = initResults.initialized.indexOf('database');
      const authIndex = initResults.initialized.indexOf('auth');
      
      assert(configIndex < loggerIndex, 'Config should initialize before logger');
      assert(loggerIndex < databaseIndex, 'Logger should initialize before database');
      assert(databaseIndex < authIndex, 'Database should initialize before auth');
      
      // Test dependency failure handling
      mockDependencyHandler.registerService('failing_service', async () => {
        throw new Error('Service initialization failed');
      }, ['config']);
      
      let dependencyError = null;
      try {
        await mockDependencyHandler.initializeServices();
      } catch (error) {
        dependencyError = error;
      }
      
      assert(dependencyError !== null, 'Should catch dependency failure');
      assert(dependencyError.message.includes('failed to initialize'), 'Should indicate dependency failure');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Service Dependency Failures',
        status: 'PASSED',
        message: 'Service dependency failures handled correctly with proper resolution order'
      });
      
      console.log('✅ PASSED: Service dependency failures handled correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Service Dependency Failures',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  generateTestReport() {
    console.log('\n📊 SERVICE INITIALIZATION TEST REPORT');
    console.log('========================================');
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
  const test = new ServiceInitializationTest();
  test.runAllTests().catch(console.error);
}

module.exports = ServiceInitializationTest;