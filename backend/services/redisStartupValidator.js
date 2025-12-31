const { configService } = require('./config');
const { redisConnectionPool } = require('./redisConnectionPool');
const { loggerService } = require('./logger');

class RedisStartupValidator {
  constructor() {
    this.validationAttempts = 0;
    this.maxValidationAttempts = 5;
    this.validationDelay = 2000; // 2 seconds between attempts
  }

  // Validate Redis connectivity at startup
  async validateRedisStartup() {
    loggerService.info('🔄 Starting Redis connectivity validation...');
    
    // Enhanced environment detection and logging
    const isDocker = configService.isDocker();
    const nodeEnv = process.env.NODE_ENV;
    const redisHost = process.env.REDIS_HOST;
    
    loggerService.info('🔍 Environment detection for Redis validation', {
      isDocker,
      nodeEnv,
      redisHost,
      dockerEnv: process.env.DOCKER_ENV,
      isDockerEnv: process.env.IS_DOCKER
    });
    
    // First, validate the configuration
    const configValidation = configService.validateRedisConfig();
    if (!configValidation.isValid) {
      loggerService.error('❌ Redis configuration validation failed', {
        errors: configValidation.errors,
        config: configValidation.config
      });
      return false;
    }
    
    loggerService.info('✅ Redis configuration validation passed', {
      config: configValidation.config
    });
    
    // Try to establish connection with retry logic
    for (let attempt = 1; attempt <= this.maxValidationAttempts; attempt++) {
      this.validationAttempts = attempt;
      
      try {
        loggerService.info(`🔄 Redis validation attempt ${attempt}/${this.maxValidationAttempts}`);
        
        // Initialize Redis connection pool
        await redisConnectionPool.initialize();
        
        // Get a client for testing
        const testClient = redisConnectionPool.getClient('startup-validator');
        if (!testClient) {
          throw new Error('Failed to get Redis client for testing');
        }
        
        // Test basic connectivity
        const pingResult = await testClient.ping();
        if (pingResult !== 'PONG') {
          throw new Error(`Redis ping test failed. Expected: PONG, Got: ${pingResult}`);
        }
        
        // Test basic operations
        const testKey = `startup-test-${Date.now()}`;
        const testValue = 'validation-test';
        
        // Test SET operation
        const setResult = await testClient.setEx(testKey, 60, testValue);
        if (setResult !== 'OK') {
          throw new Error(`Redis SET operation failed. Result: ${setResult}`);
        }
        
        // Test GET operation
        const getResult = await testClient.get(testKey);
        if (getResult !== testValue) {
          throw new Error(`Redis GET operation failed. Expected: ${testValue}, Got: ${getResult}`);
        }
        
        // Test DEL operation
        const delResult = await testClient.del(testKey);
        if (delResult !== 1) {
          throw new Error(`Redis DEL operation failed. Result: ${delResult}`);
        }
        
        loggerService.info('✅ Redis connectivity validation successful', {
          attempt,
          host: configValidation.config.host,
          port: configValidation.config.port,
          environment: configValidation.config.environment,
          isDocker: configValidation.config.isDocker
        });
        
        return true;
        
      } catch (error) {
        loggerService.error(`❌ Redis validation attempt ${attempt} failed`, {
          error: error.message,
          code: error.code,
          stack: error.stack,
          attempt,
          maxAttempts: this.maxValidationAttempts
        });
        
        if (attempt < this.maxValidationAttempts) {
          loggerService.info(`⏳ Waiting ${this.validationDelay}ms before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, this.validationDelay));
        }
      }
    }
    
    // All attempts failed
    loggerService.error('❌ Redis connectivity validation failed after all attempts', {
      totalAttempts: this.validationAttempts,
      maxAttempts: this.maxValidationAttempts,
      config: configValidation.config
    });
    
    return false;
  }

  // Get validation status
  getValidationStatus() {
    return {
      attempts: this.validationAttempts,
      maxAttempts: this.maxValidationAttempts,
      isValid: this.validationAttempts > 0 && this.validationAttempts <= this.maxValidationAttempts
    };
  }

  // Reset validation state
  resetValidation() {
    this.validationAttempts = 0;
  }
}

// Singleton instance
const redisStartupValidator = new RedisStartupValidator();

module.exports = {
  RedisStartupValidator,
  redisStartupValidator
};