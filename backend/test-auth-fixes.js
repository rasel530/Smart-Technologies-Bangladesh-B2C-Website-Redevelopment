const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import services to test
const { sessionService } = require('./services/sessionService');
const { loginSecurityService } = require('./services/loginSecurityService');
const { emailService } = require('./services/emailService');
const { phoneValidationService } = require('./services/phoneValidationService');
const { passwordService } = require('./services/passwordService');
const { redisConnectionPool } = require('./services/redisConnectionPool');
const { configService } = require('./services/config');
const { loggerService } = require('./services/logger');

const prisma = new PrismaClient();

class AuthenticationFixesTest {
  constructor() {
    this.testResults = {
      redisConnection: { status: 'pending', issues: [] },
      propertyMappings: { status: 'pending', issues: [] },
      jwtConfiguration: { status: 'pending', issues: [] },
      endToEndFlow: { status: 'pending', issues: [] }
    };
  }

  async runAllTests() {
    console.log('🔧 Starting Authentication Fixes Verification...\n');
    
    try {
      // Test 1: Redis Connection Pool
      await this.testRedisConnectionPool();
      
      // Test 2: Property Name Mappings
      await this.testPropertyMappings();
      
      // Test 3: JWT Configuration
      await this.testJWTConfiguration();
      
      // Test 4: End-to-End Authentication Flow
      await this.testEndToEndFlow();
      
      // Generate results
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Authentication fixes test failed:', error);
      this.testResults.global = { status: 'error', error: error.message };
    }
  }

  async testRedisConnectionPool() {
    console.log('📡 Testing Redis Connection Pool...');
    
    try {
      // Initialize Redis connection pool
      await redisConnectionPool.initialize();
      
      // Test basic Redis operations
      const testKey = `test_${Date.now()}`;
      const testValue = { message: 'Redis connection pool test', timestamp: new Date().toISOString() };
      
      // Get session service client
      const sessionClient = sessionService.redis;
      if (!sessionClient) {
        this.testResults.redisConnection.issues.push('Session service Redis client not available');
        this.testResults.redisConnection.status = 'failed';
        return;
      }
      
      // Test basic operations
      await sessionClient.setEx(testKey, 60, JSON.stringify(testValue));
      const retrievedValue = await sessionClient.get(testKey);
      const parsedValue = JSON.parse(retrievedValue);
      
      if (parsedValue.message !== testValue.message) {
        this.testResults.redisConnection.issues.push('Redis SET/GET operation failed');
        this.testResults.redisConnection.status = 'failed';
        return;
      }
      
      // Test connection status
      const isReady = await sessionClient.isReady();
      if (!isReady) {
        this.testResults.redisConnection.issues.push('Redis connection not ready');
        this.testResults.redisConnection.status = 'failed';
        return;
      }
      
      // Test login security service client
      const securityClient = loginSecurityService.redis;
      if (!securityClient) {
        this.testResults.redisConnection.issues.push('Login security service Redis client not available');
        this.testResults.redisConnection.status = 'failed';
        return;
      }
      
      // Test connection pool status
      const poolStatus = redisConnectionPool.getStatus();
      console.log('Redis Connection Pool Status:', poolStatus);
      
      this.testResults.redisConnection.status = 'passed';
      this.testResults.redisConnection.details = {
        poolStatus,
        basicOperations: 'passed',
        sharedConnection: 'working'
      };
      
    } catch (error) {
      this.testResults.redisConnection.issues.push(`Redis connection test error: ${error.message}`);
      this.testResults.redisConnection.status = 'error';
    }
    
    console.log('✅ Redis Connection Pool test completed');
  }

  async testPropertyMappings() {
    console.log('🏷️ Testing Property Name Mappings...');
    
    try {
      // Test registration with frontend property names
      const frontendData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+8801234567'
      };
      
      // Simulate API call to registration endpoint
      const response = await this.makeAPIRequest('POST', '/api/v1/auth/register', frontendData);
      
      if (response.status === 201) {
        this.testResults.propertyMappings.status = 'passed';
        this.testResults.propertyMappings.details = {
          registration: 'Property mappings handled correctly',
          frontendToBackend: {
            phone: 'phone',
            firstName: 'firstName',
            lastName: 'lastName'
          }
        };
      } else {
        this.testResults.propertyMappings.issues.push(`Registration failed with status ${response.status}`);
        this.testResults.propertyMappings.status = 'failed';
      }
      
    } catch (error) {
      this.testResults.propertyMappings.issues.push(`Property mapping test error: ${error.message}`);
      this.testResults.propertyMappings.status = 'error';
    }
    
    console.log('✅ Property Name Mappings test completed');
  }

  async testJWTConfiguration() {
    console.log('🔐 Testing JWT Configuration...');
    
    try {
      const jwtSecret = process.env.JWT_SECRET;
      const jwtExpiry = process.env.JWT_EXPIRES_IN;
      
      if (!jwtSecret) {
        this.testResults.jwtConfiguration.issues.push('JWT_SECRET not configured');
        this.testResults.jwtConfiguration.status = 'failed';
        return;
      }
      
      if (jwtExpiry !== '15m') {
        this.testResults.jwtConfiguration.issues.push(`JWT_EXPIRES_IN set to ${jwtExpiry} instead of 15m`);
        this.testResults.jwtConfiguration.status = 'failed';
        return;
      }
      
      // Test JWT token generation and verification
      const testPayload = { userId: 'test-user-id', email: 'test@example.com' };
      const token = jwt.sign(testPayload, jwtSecret, { expiresIn: '15m' });
      
      const decoded = jwt.verify(token, jwtSecret);
      
      if (!decoded || decoded.userId !== 'test-user-id') {
        this.testResults.jwtConfiguration.issues.push('JWT token generation/verification failed');
        this.testResults.jwtConfiguration.status = 'failed';
        return;
      }
      
      this.testResults.jwtConfiguration.status = 'passed';
      this.testResults.jwtConfiguration.details = {
        secret: !!jwtSecret,
        expiry: jwtExpiry,
        tokenGeneration: 'passed',
        tokenVerification: 'passed'
      };
      
    } catch (error) {
      this.testResults.jwtConfiguration.issues.push(`JWT configuration test error: ${error.message}`);
      this.testResults.jwtConfiguration.status = 'error';
    }
    
    console.log('✅ JWT Configuration test completed');
  }

  async testEndToEndFlow() {
    console.log('🔄 Testing End-to-End Authentication Flow...');
    
    try {
      // Test complete registration flow
      const registrationResult = await this.testRegistrationFlow();
      
      if (registrationResult.success) {
        // Test login flow
        const loginResult = await this.testLoginFlow(registrationResult.user);
        
        if (loginResult.success) {
          // Test session management
          const sessionResult = await this.testSessionManagement(loginResult.sessionId);
          
          if (sessionResult.success) {
            this.testResults.endToEndFlow.status = 'passed';
            this.testResults.endToEndFlow.details = {
              registration: 'passed',
              login: 'passed',
              sessionManagement: 'passed',
              userId: registrationResult.user.id,
              sessionId: loginResult.sessionId
            };
          } else {
            this.testResults.endToEndFlow.issues.push('Session management test failed');
            this.testResults.endToEndFlow.status = 'failed';
          }
        } else {
          this.testResults.endToEndFlow.issues.push('Login flow test failed');
          this.testResults.endToEndFlow.status = 'failed';
        }
      } else {
        this.testResults.endToEndFlow.issues.push('Registration flow test failed');
        this.testResults.endToEndFlow.status = 'failed';
      }
      
    } catch (error) {
      this.testResults.endToEndFlow.issues.push(`End-to-end flow test error: ${error.message}`);
      this.testResults.endToEndFlow.status = 'error';
    }
    
    console.log('✅ End-to-End Authentication Flow test completed');
  }

  async testRegistrationFlow() {
    try {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        phone: '+8801234567'
      };
      
      const response = await this.makeAPIRequest('POST', '/api/v1/auth/register', userData);
      
      if (response.status === 201) {
        return { success: true, user: response.data.user };
      } else {
        console.log('Registration failed:', response.data);
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testLoginFlow(user) {
    try {
      const loginData = {
        identifier: user.email,
        password: 'TestPassword123!',
        rememberMe: false
      };
      
      const response = await this.makeAPIRequest('POST', '/api/v1/auth/login', loginData);
      
      if (response.status === 200) {
        return { success: true, sessionId: response.data.sessionId };
      } else {
        console.log('Login failed:', response.data);
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testSessionManagement(sessionId) {
    try {
      const response = await this.makeAPIRequest('GET', `/api/v1/sessions/validate?sessionId=${sessionId}`);
      
      if (response.status === 200 && response.data.valid) {
        return { success: true };
      } else {
        console.log('Session validation failed:', response.data);
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async makeAPIRequest(method, endpoint, data = null) {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    const url = `${baseUrl}${endpoint}`;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'auth-fixes-test-agent'
      }
    };
    
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    return {
      status: response.status,
      data: await response.json()
    };
  }

  generateTestReport() {
    console.log('\n📋 AUTHENTICATION FIXES TEST REPORT');
    console.log('====================================');
    
    // Overall status
    const overallStatus = this.calculateOverallStatus();
    console.log(`🎯 Overall Status: ${overallStatus.status.toUpperCase()}`);
    console.log(`📊 Score: ${overallStatus.score}/10`);
    
    // Detailed results
    console.log('\n📊 DETAILED RESULTS:');
    console.log('====================================');
    
    Object.entries(this.testResults).forEach(([category, result]) => {
      if (result.status === 'pending') return;
      
      console.log(`\n🔍 ${category.toUpperCase()}:`);
      console.log(`   Status: ${result.status.toUpperCase()}`);
      
      if (result.issues && result.issues.length > 0) {
        console.log('   ❌ Issues Found:');
        result.issues.forEach((issue, index) => {
          console.log(`     ${index + 1}. ${issue}`);
        });
      }
      
      if (result.details) {
        console.log('   ✅ Details:');
        Object.entries(result.details).forEach(([key, value]) => {
          console.log(`     - ${key}: ${value}`);
        });
      }
    });
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('====================================');
    
    const recommendations = this.generateRecommendations();
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    
    // Save report to file
    this.saveReportToFile();
  }

  calculateOverallStatus() {
    const results = this.testResults;
    let score = 10;
    let status = 'excellent';
    
    Object.values(results).forEach(result => {
      if (result.status === 'failed') {
        score -= 3;
        status = 'critical';
      } else if (result.status === 'error') {
        score -= 2;
        if (status !== 'critical') status = 'poor';
      }
    });
    
    return { status, score };
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.testResults.redisConnection.status === 'passed') {
      recommendations.push('✅ Redis connection pool is working correctly');
    } else {
      recommendations.push('🔧 Fix Redis connection configuration and ensure stable connections');
    }
    
    if (this.testResults.propertyMappings.status === 'passed') {
      recommendations.push('✅ Property name mappings are working correctly');
    } else {
      recommendations.push('🔧 Fix property name mismatches between frontend and backend');
    }
    
    if (this.testResults.jwtConfiguration.status === 'passed') {
      recommendations.push('✅ JWT configuration is correct');
    } else {
      recommendations.push('🔧 Fix JWT token configuration (should be 15m expiry)');
    }
    
    if (this.testResults.endToEndFlow.status === 'passed') {
      recommendations.push('✅ End-to-end authentication flow is working');
    } else {
      recommendations.push('🔧 Fix end-to-end authentication flow issues');
    }
    
    return recommendations;
  }

  saveReportToFile() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `auth-fixes-test-report-${timestamp}.json`;
    
    const report = {
      timestamp,
      overallStatus: this.calculateOverallStatus(),
      testResults: this.testResults,
      recommendations: this.generateRecommendations()
    };
    
    try {
      const fs = require('fs');
      fs.writeFileSync(filename, JSON.stringify(report, null, 2));
      console.log(`📄 Report saved to: ${filename}`);
    } catch (error) {
      console.error('Failed to save report:', error);
      }
  }
}

// Run the tests
const test = new AuthenticationFixesTest();
test.runAllTests().then(() => {
  console.log('\n🎯 Authentication fixes verification completed!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Authentication fixes verification failed:', error);
  process.exit(1);
});