const { ConfigService } = require('../services/config');
const assert = require('assert');

// Test Configuration Validation with Missing/Invalid Environment Variables
class ConfigValidationTest {
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
    console.log('🧪 Starting Configuration Validation Tests...\n');
    
    await this.testMissingJWTSecret();
    await this.testMissingDatabaseURL();
    await this.testInvalidDatabaseURL();
    await this.testMissingPaymentGatewayConfig();
    await this.testInvalidSMTPConfig();
    await this.testInvalidFileUploadConfig();
    await this.testInvalidCORSConfig();
    await this.testProductionEnvironmentValidation();
    await this.testDevelopmentEnvironmentValidation();
    await this.testBangladeshPaymentGatewayConfig();
    
    this.generateTestReport();
  }

  restoreEnvironment() {
    process.env = { ...this.originalEnv };
  }

  async testMissingJWTSecret() {
    this.testResults.total++;
    console.log('🔍 Test 1: Missing JWT Secret Validation');
    
    try {
      // Remove JWT_SECRET from environment
      delete process.env.JWT_SECRET;
      
      let errorThrown = false;
      let errorMessage = '';
      
      try {
        // This should throw an error in any environment
        new ConfigService();
      } catch (error) {
        errorThrown = true;
        errorMessage = error.message;
      }
      
      assert(errorThrown, 'Should throw error when JWT_SECRET is missing');
      assert(errorMessage.includes('JWT_SECRET is required'), 'Error should mention JWT_SECRET');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Missing JWT Secret Validation',
        status: 'PASSED',
        message: 'Correctly validated missing JWT_SECRET in all environments'
      });
      
      console.log('✅ PASSED: Missing JWT secret validation working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Missing JWT Secret Validation',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    } finally {
      this.restoreEnvironment();
    }
  }

  async testMissingDatabaseURL() {
    this.testResults.total++;
    console.log('🔍 Test 2: Missing Database URL Validation');
    
    try {
      // Remove DATABASE_URL from environment
      delete process.env.DATABASE_URL;
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'test-secret-key';
      
      let errorThrown = false;
      let errorMessage = '';
      
      try {
        new ConfigService();
      } catch (error) {
        errorThrown = true;
        errorMessage = error.message;
      }
      
      assert(errorThrown, 'Should throw error when DATABASE_URL is missing in production');
      assert(errorMessage.includes('DATABASE_URL'), 'Error should mention DATABASE_URL');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Missing Database URL Validation',
        status: 'PASSED',
        message: 'Correctly validated missing DATABASE_URL in production'
      });
      
      console.log('✅ PASSED: Missing database URL validation working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Missing Database URL Validation',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    } finally {
      this.restoreEnvironment();
    }
  }

  async testInvalidDatabaseURL() {
    this.testResults.total++;
    console.log('🔍 Test 3: Invalid Database URL Format Validation');
    
    try {
      // Set invalid DATABASE_URL
      process.env.DATABASE_URL = 'invalid-url-format';
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'test-secret-key';
      
      let errorThrown = false;
      let errorMessage = '';
      
      try {
        new ConfigService();
      } catch (error) {
        errorThrown = true;
        errorMessage = error.message;
      }
      
      assert(errorThrown, 'Should throw error when DATABASE_URL has invalid format');
      assert(errorMessage.includes('DATABASE_URL'), 'Error should mention DATABASE_URL');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Invalid Database URL Format Validation',
        status: 'PASSED',
        message: 'Correctly validated invalid DATABASE_URL format'
      });
      
      console.log('✅ PASSED: Invalid database URL format validation working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Invalid Database URL Format Validation',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    } finally {
      this.restoreEnvironment();
    }
  }

  async testMissingPaymentGatewayConfig() {
    this.testResults.total++;
    console.log('🔍 Test 4: Missing Payment Gateway Configuration');
    
    try {
      // Set minimal required config
      process.env.NODE_ENV = 'development';
      process.env.JWT_SECRET = 'test-secret-key';
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      // Remove payment gateway configs
      delete process.env.BKASH_API_KEY;
      delete process.env.BKASH_API_SECRET;
      delete process.env.NAGAD_API_KEY;
      delete process.env.NAGAD_API_SECRET;
      delete process.env.ROCKET_API_KEY;
      delete process.env.ROCKET_API_SECRET;
      
      let errorThrown = false;
      let warningLogged = false;
      
      // Mock console.warn to capture warnings
      const originalWarn = console.warn;
      console.warn = (...args) => {
        const message = args.join(' ');
        if (message.includes('payment gateway')) {
          warningLogged = true;
        }
        originalWarn(...args);
      };
      
      try {
        const configService = new ConfigService();
        // Should not throw error in development, but should log warning
        const paymentConfig = configService.getPaymentConfig();
        
        assert(warningLogged, 'Should log warning for missing payment gateway config');
        assert(paymentConfig.bkash.apiKey === undefined, 'bKash API key should be undefined');
        assert(paymentConfig.nagad.apiKey === undefined, 'Nagad API key should be undefined');
        assert(paymentConfig.rocket.apiKey === undefined, 'Rocket API key should be undefined');
        
      } catch (error) {
        errorThrown = true;
      }
      
      console.warn = originalWarn;
      assert(!errorThrown, 'Should not throw error in development for missing payment config');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Missing Payment Gateway Configuration',
        status: 'PASSED',
        message: 'Correctly handled missing payment gateway config with warnings'
      });
      
      console.log('✅ PASSED: Missing payment gateway configuration handled correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Missing Payment Gateway Configuration',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    } finally {
      this.restoreEnvironment();
    }
  }

  async testInvalidSMTPConfig() {
    this.testResults.total++;
    console.log('🔍 Test 5: Invalid SMTP Configuration Validation');
    
    try {
      // Set minimal required config
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'test-secret-key';
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      // Set invalid SMTP port
      process.env.SMTP_PORT = 'invalid-port';
      
      let errorThrown = false;
      let errorMessage = '';
      
      try {
        new ConfigService();
      } catch (error) {
        errorThrown = true;
        errorMessage = error.message;
      }
      
      assert(errorThrown, 'Should throw error when SMTP_PORT is invalid in production');
      assert(errorMessage.includes('SMTP_PORT'), 'Error should mention SMTP_PORT');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Invalid SMTP Configuration Validation',
        status: 'PASSED',
        message: 'Correctly validated invalid SMTP configuration'
      });
      
      console.log('✅ PASSED: Invalid SMTP configuration validation working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Invalid SMTP Configuration Validation',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    } finally {
      this.restoreEnvironment();
    }
  }

  async testInvalidFileUploadConfig() {
    this.testResults.total++;
    console.log('🔍 Test 6: Invalid File Upload Configuration Validation');
    
    try {
      // Set minimal required config
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'test-secret-key';
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      // Set invalid MAX_FILE_SIZE (exceeds 50MB limit)
      process.env.MAX_FILE_SIZE = '60000000'; // 60MB
      
      let errorThrown = false;
      let errorMessage = '';
      
      try {
        new ConfigService();
      } catch (error) {
        errorThrown = true;
        errorMessage = error.message;
      }
      
      assert(errorThrown, 'Should throw error when MAX_FILE_SIZE exceeds security limit');
      assert(errorMessage.includes('MAX_FILE_SIZE'), 'Error should mention MAX_FILE_SIZE');
      assert(errorMessage.includes('security limit'), 'Error should mention security limit');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Invalid File Upload Configuration Validation',
        status: 'PASSED',
        message: 'Correctly validated file size security limit'
      });
      
      console.log('✅ PASSED: Invalid file upload configuration validation working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Invalid File Upload Configuration Validation',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    } finally {
      this.restoreEnvironment();
    }
  }

  async testInvalidCORSConfig() {
    this.testResults.total++;
    console.log('🔍 Test 7: CORS Configuration Validation');
    
    try {
      // Set minimal required config
      process.env.NODE_ENV = 'development';
      process.env.JWT_SECRET = 'test-secret-key';
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      // Set wildcard CORS origin
      process.env.CORS_ORIGIN = '*';
      
      let warningLogged = false;
      
      // Mock console.warn to capture warnings
      const originalWarn = console.warn;
      console.warn = (...args) => {
        const message = args.join(' ');
        if (message.includes('CORS_ORIGIN') && message.includes('insecure')) {
          warningLogged = true;
        }
        originalWarn(...args);
      };
      
      try {
        const configService = new ConfigService();
        const corsConfig = configService.getCORSConfig();
        
        assert(warningLogged, 'Should log warning for wildcard CORS origin');
        assert(corsConfig.origin === '*', 'Should allow wildcard origin in development');
        
      } catch (error) {
        // Should not throw error, just warn
        throw new Error('Should not throw error for wildcard CORS in development');
      }
      
      console.warn = originalWarn;
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'CORS Configuration Validation',
        status: 'PASSED',
        message: 'Correctly validated CORS configuration with appropriate warnings'
      });
      
      console.log('✅ PASSED: CORS configuration validation working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'CORS Configuration Validation',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    } finally {
      this.restoreEnvironment();
    }
  }

  async testProductionEnvironmentValidation() {
    this.testResults.total++;
    console.log('🔍 Test 8: Production Environment Strict Validation');
    
    try {
      // Set production environment with minimal config
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'test-secret-key';
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      const configService = new ConfigService();
      
      // Test production-specific configurations
      assert(configService.isProduction(), 'Should detect production environment');
      assert(!configService.isDevelopment(), 'Should not detect as development');
      
      const jwtConfig = configService.getJWTConfig();
      assert(jwtConfig.secret === 'test-secret-key', 'JWT secret should be set');
      
      const dbConfig = configService.getDatabaseConfig();
      assert(dbConfig.url === process.env.DATABASE_URL, 'Database URL should be set');
      
      const loggingConfig = configService.getLoggingConfig();
      assert(loggingConfig.level === 'info', 'Production should use info log level');
      assert(loggingConfig.format === 'json', 'Production should use json format');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Production Environment Validation',
        status: 'PASSED',
        message: 'Production environment validation working correctly'
      });
      
      console.log('✅ PASSED: Production environment validation working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Production Environment Validation',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    } finally {
      this.restoreEnvironment();
    }
  }

  async testDevelopmentEnvironmentValidation() {
    this.testResults.total++;
    console.log('🔍 Test 9: Development Environment Lenient Validation');
    
    try {
      // Set development environment with minimal config
      process.env.NODE_ENV = 'development';
      process.env.JWT_SECRET = 'test-secret-key';
      // Missing DATABASE_URL should be allowed in development with warning
      
      let warningLogged = false;
      
      // Mock console.warn to capture warnings
      const originalWarn = console.warn;
      console.warn = (...args) => {
        const message = args.join(' ');
        if (message.includes('DATABASE_URL')) {
          warningLogged = true;
        }
        originalWarn(...args);
      };
      
      const configService = new ConfigService();
      
      assert(configService.isDevelopment(), 'Should detect development environment');
      assert(!configService.isProduction(), 'Should not detect as production');
      assert(warningLogged, 'Should log warning for missing DATABASE_URL');
      
      const loggingConfig = configService.getLoggingConfig();
      assert(loggingConfig.level === 'debug', 'Development should use debug log level');
      assert(loggingConfig.colorize === true, 'Development should use colored logs');
      
      console.warn = originalWarn;
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Development Environment Validation',
        status: 'PASSED',
        message: 'Development environment validation working correctly with lenient rules'
      });
      
      console.log('✅ PASSED: Development environment validation working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Development Environment Validation',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    } finally {
      this.restoreEnvironment();
    }
  }

  async testBangladeshPaymentGatewayConfig() {
    this.testResults.total++;
    console.log('🔍 Test 10: Bangladesh Payment Gateway Configuration');
    
    try {
      // Set minimal required config
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'test-secret-key';
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      // Set Bangladesh payment gateway configs
      process.env.BKASH_API_KEY = 'bkash-test-key';
      process.env.BKASH_API_SECRET = 'bkash-test-secret';
      process.env.NAGAD_API_KEY = 'nagad-test-key';
      process.env.NAGAD_API_SECRET = 'nagad-test-secret';
      process.env.ROCKET_API_KEY = 'rocket-test-key';
      process.env.ROCKET_API_SECRET = 'rocket-test-secret';
      
      const configService = new ConfigService();
      const paymentConfig = configService.getPaymentConfig();
      
      // Test production URLs
      assert(paymentConfig.bkash.baseUrl.includes('checkout.pay.bka.sh'), 'bKash should use production URL');
      assert(paymentConfig.nagad.baseUrl.includes('api.nagad.com'), 'Nagad should use production URL');
      assert(paymentConfig.rocket.baseUrl.includes('api.rocket.com'), 'Rocket should use production URL');
      
      // Test API keys are set
      assert(paymentConfig.bkash.apiKey === 'bkash-test-key', 'bKash API key should be set');
      assert(paymentConfig.nagad.apiKey === 'nagad-test-key', 'Nagad API key should be set');
      assert(paymentConfig.rocket.apiKey === 'rocket-test-key', 'Rocket API key should be set');
      
      // Test development URLs
      process.env.NODE_ENV = 'development';
      const devConfigService = new ConfigService();
      const devPaymentConfig = devConfigService.getPaymentConfig();
      
      assert(devPaymentConfig.bkash.baseUrl.includes('sandbox.bka.sh'), 'bKash should use sandbox URL in development');
      assert(devPaymentConfig.nagad.baseUrl.includes('sandbox.nagad.com'), 'Nagad should use sandbox URL in development');
      assert(devPaymentConfig.rocket.baseUrl.includes('sandbox.rocket.com'), 'Rocket should use sandbox URL in development');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Bangladesh Payment Gateway Configuration',
        status: 'PASSED',
        message: 'Bangladesh payment gateway configuration working correctly with environment-specific URLs'
      });
      
      console.log('✅ PASSED: Bangladesh payment gateway configuration working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Bangladesh Payment Gateway Configuration',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    } finally {
      this.restoreEnvironment();
    }
  }

  generateTestReport() {
    console.log('\n📊 CONFIGURATION VALIDATION TEST REPORT');
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
  const test = new ConfigValidationTest();
  test.runAllTests().catch(console.error);
}

module.exports = ConfigValidationTest;