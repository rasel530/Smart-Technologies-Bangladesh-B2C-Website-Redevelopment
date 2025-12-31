#!/usr/bin/env node

/**
 * Docker Environment Configuration Test
 * 
 * This script tests Docker environment configuration
 * to ensure proper Redis setup for containerized deployment.
 */

const fs = require('fs');
const path = require('path');

console.log('🐳 Docker Environment Configuration Test');
console.log('=======================================');

async function testDockerEnvironment() {
  try {
    // 1. Check .env.docker file exists and is properly configured
    console.log('\n📋 Step 1: .env.docker File Validation');
    console.log('-----------------------------------------');
    
    const envDockerPath = path.join(__dirname, '.env.docker');
    
    if (!fs.existsSync(envDockerPath)) {
      console.log('❌ .env.docker file not found');
      return false;
    }
    
    console.log('✅ .env.docker file exists');
    
    // Read and validate .env.docker content
    const envDockerContent = fs.readFileSync(envDockerPath, 'utf8');
    const requiredVars = [
      'REDIS_HOST=redis',
      'REDIS_PORT=6379',
      'REDIS_PASSWORD=redis_smarttech_2024',
      'REDIS_URL=redis://:redis_smarttech_2024@redis:6379',
      'IS_DOCKER=true',
      'DOCKER_ENV=true'
    ];
    
    let allVarsPresent = true;
    requiredVars.forEach(varName => {
      if (envDockerContent.includes(varName)) {
        console.log(`✅ Found: ${varName}`);
      } else {
        console.log(`❌ Missing: ${varName}`);
        allVarsPresent = false;
      }
    });
    
    if (!allVarsPresent) {
      console.log('❌ .env.docker file is missing required variables');
      return false;
    }
    
    console.log('✅ .env.docker file contains all required variables');
    
    // 2. Check docker-compose.yml configuration
    console.log('\n📋 Step 2: Docker Compose Configuration');
    console.log('-------------------------------------------');
    
    const dockerComposePath = path.join(__dirname, '..', 'docker-compose.yml');
    
    if (!fs.existsSync(dockerComposePath)) {
      console.log('❌ docker-compose.yml file not found');
      return false;
    }
    
    console.log('✅ docker-compose.yml file exists');
    
    const dockerComposeContent = fs.readFileSync(dockerComposePath, 'utf8');
    
    // Check backend service configuration
    const backendServiceMatches = [
      /container_name: smarttech_backend/,
      /volumes:\s*\n\s*- \.\/backend\/\.env\.docker:\/app\/\.env:ro/,
      /environment:\s*\n\s*- NODE_ENV=production/,
      /environment:\s*\n\s*- IS_DOCKER=true/,
      /environment:\s*\n\s*- DOCKER_ENV=true/,
      /depends_on:\s*\n\s*redis:/,
      /redis:\s*\n\s*condition: service_healthy/
    ];
    
    let backendConfigValid = true;
    backendServiceMatches.forEach((regex, index) => {
      if (regex.test(dockerComposeContent)) {
        console.log(`✅ Backend config check ${index + 1} passed`);
      } else {
        console.log(`❌ Backend config check ${index + 1} failed`);
        backendConfigValid = false;
      }
    });
    
    if (!backendConfigValid) {
      console.log('❌ Docker Compose backend service configuration is invalid');
      return false;
    }
    
    console.log('✅ Docker Compose backend service configuration is valid');
    
    // 3. Check Redis service configuration
    console.log('\n📋 Step 3: Redis Service Configuration');
    console.log('----------------------------------------');
    
    const redisServiceMatches = [
      /container_name: smarttech_redis/,
      /image: redis:.*-alpine/,
      /command: redis-server \/usr\/local\/etc\/redis\/redis.conf/,
      /volumes:\s*\n\s*- redis_data:\/data/,
      /volumes:\s*\n\s*- \.\/redis\/redis-stable\.conf:\/usr\/local\/etc\/redis\/redis\.conf:ro/,
      /environment:\s*\n\s*- REDIS_PASSWORD=redis_smarttech_2024/,
      /networks:\s*\n\s*- smarttech_network/,
      /healthcheck:\s*\n\s*test: \["CMD", "redis-cli"/,
      /password: redis_smarttech_2024/
    ];
    
    let redisConfigValid = true;
    redisServiceMatches.forEach((regex, index) => {
      if (regex.test(dockerComposeContent)) {
        console.log(`✅ Redis config check ${index + 1} passed`);
      } else {
        console.log(`❌ Redis config check ${index + 1} failed`);
        redisConfigValid = false;
      }
    });
    
    if (!redisConfigValid) {
      console.log('❌ Docker Compose Redis service configuration is invalid');
      return false;
    }
    
    console.log('✅ Docker Compose Redis service configuration is valid');
    
    // 4. Check Redis configuration file
    console.log('\n📋 Step 4: Redis Configuration File');
    console.log('-------------------------------------');
    
    const redisConfPath = path.join(__dirname, '..', 'redis', 'redis-stable.conf');
    
    if (!fs.existsSync(redisConfPath)) {
      console.log('❌ redis-stable.conf file not found');
      return false;
    }
    
    console.log('✅ redis-stable.conf file exists');
    
    const redisConfContent = fs.readFileSync(redisConfPath, 'utf8');
    
    const redisConfMatches = [
      /bind 0\.0\.0\.0/,
      /port 6379/,
      /protected-mode yes/,
      /requirepass redis_smarttech_2024/,
      /maxmemory 512mb/,
      /maxmemory-policy allkeys-lru/,
      /appendonly yes/,
      /timeout 600/,
      /tcp-keepalive 120/,
      /maxclients 10000/
    ];
    
    let redisConfValid = true;
    redisConfMatches.forEach((regex, index) => {
      if (regex.test(redisConfContent)) {
        console.log(`✅ Redis conf check ${index + 1} passed`);
      } else {
        console.log(`❌ Redis conf check ${index + 1} failed`);
        redisConfValid = false;
      }
    });
    
    if (!redisConfValid) {
      console.log('❌ Redis configuration file is invalid');
      return false;
    }
    
    console.log('✅ Redis configuration file is valid');
    
    // 5. Check network configuration
    console.log('\n📋 Step 5: Network Configuration');
    console.log('----------------------------------');
    
    const networkMatches = [
      /networks:\s*\n\s*smarttech_network:\s*\n\s*driver: bridge/,
      /networks:\s*\n\s*- smarttech_network/
    ];
    
    let networkConfigValid = true;
    networkMatches.forEach((regex, index) => {
      if (regex.test(dockerComposeContent)) {
        console.log(`✅ Network config check ${index + 1} passed`);
      } else {
        console.log(`❌ Network config check ${index + 1} failed`);
        networkConfigValid = false;
      }
    });
    
    if (!networkConfigValid) {
      console.log('❌ Docker network configuration is invalid');
      return false;
    }
    
    console.log('✅ Docker network configuration is valid');
    
    // 6. Check health check scripts
    console.log('\n📋 Step 6: Health Check Scripts');
    console.log('--------------------------------');
    
    const healthCheckPath = path.join(__dirname, 'docker-health-check.js');
    const connectivityTestPath = path.join(__dirname, 'test-redis-docker-connectivity.js');
    
    if (fs.existsSync(healthCheckPath)) {
      console.log('✅ docker-health-check.js exists');
    } else {
      console.log('❌ docker-health-check.js not found');
      return false;
    }
    
    if (fs.existsSync(connectivityTestPath)) {
      console.log('✅ test-redis-docker-connectivity.js exists');
    } else {
      console.log('❌ test-redis-docker-connectivity.js not found');
      return false;
    }
    
    console.log('✅ All health check scripts exist');
    
    // 7. Check service dependencies
    console.log('\n📋 Step 7: Service Dependencies');
    console.log('---------------------------------');
    
    const dependencyMatches = [
      /depends_on:\s*\n\s*postgres:\s*\n\s*condition: service_healthy/,
      /depends_on:\s*\n\s*redis:\s*\n\s*condition: service_healthy/,
      /depends_on:\s*\n\s*elasticsearch:\s*\n\s*condition: service_healthy/
    ];
    
    let dependencyConfigValid = true;
    dependencyMatches.forEach((regex, index) => {
      if (regex.test(dockerComposeContent)) {
        console.log(`✅ Dependency check ${index + 1} passed`);
      } else {
        console.log(`❌ Dependency check ${index + 1} failed`);
        dependencyConfigValid = false;
      }
    });
    
    if (!dependencyConfigValid) {
      console.log('❌ Service dependencies configuration is invalid');
      return false;
    }
    
    console.log('✅ Service dependencies configuration is valid');
    
    console.log('\n🎉 All Docker environment configuration tests passed!');
    console.log('==================================================');
    console.log('\n📝 Summary:');
    console.log('- ✅ .env.docker file properly configured');
    console.log('- ✅ Docker Compose backend service configured');
    console.log('- ✅ Docker Compose Redis service configured');
    console.log('- ✅ Redis configuration file optimized');
    console.log('- ✅ Docker network properly configured');
    console.log('- ✅ Health check scripts available');
    console.log('- ✅ Service dependencies configured');
    
    console.log('\n🚀 Ready for Docker deployment with Redis connectivity!');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Docker environment configuration test failed:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run test
if (require.main === module) {
  testDockerEnvironment()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testDockerEnvironment };