# Redis Environment Configuration Guide

## Overview

This document describes the permanent fixes implemented for Redis connection errors through environment-specific configuration management. The solution automatically detects the deployment environment and applies the appropriate Redis settings.

## Problem Statement

The root cause of Redis connection errors was a configuration mismatch between the backend application and Docker Compose setup:
- Local development expected Redis at `localhost:6379`
- Docker deployment required Redis at `redis:6379` (service name)
- No automatic environment detection existed
- Manual configuration was error-prone

## Solution Architecture

### 1. Environment Detection System

The application now automatically detects the deployment environment and applies appropriate configuration:

#### Detection Methods
- **Docker Environment**: Detected via `/.dockerenv` file, `DOCKER_ENV=true`, or `REDIS_HOST=redis`
- **Development Environment**: Detected via `NODE_ENV=development`
- **Production Environment**: Detected via `NODE_ENV=production`

#### Automatic Configuration
```javascript
// Development (localhost)
REDIS_HOST=localhost
REDIS_PORT=6379

// Docker (service name)
REDIS_HOST=redis
REDIS_PORT=6379
```

### 2. Configuration Files

#### `.env` (Development)
```bash
# Development Configuration
NODE_ENV=development
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_smarttech_2024
REDIS_URL=redis://:redis_smarttech_2024@localhost:6379
```

#### `.env.docker` (Docker/Production)
```bash
# Docker Environment Configuration
NODE_ENV=production
IS_DOCKER=true
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_smarttech_2024
REDIS_URL=redis://:redis_smarttech_2024@redis:6379
```

### 3. Enhanced Configuration Service

#### Environment-Aware Methods
- `isDocker()`: Detects Docker environment
- `getRedisConfigWithEnvironment()`: Returns environment-specific Redis config
- `validateRedisConfig()`: Validates Redis configuration for current environment

#### Configuration Priority
1. `.env.${NODE_ENV}` (environment-specific)
2. `.env.local` (local overrides)
3. `.env` (default configuration)

### 4. Redis Connection Pool Enhancements

#### Environment-Aware Initialization
```javascript
// Uses environment-specific configuration
const redisConfig = configService.getRedisConfigWithEnvironment();

// Docker-specific settings
if (configService.isDocker()) {
  redisConfig.socket.connectTimeout = 15000;
  redisConfig.socket.family = 4; // Force IPv4
}

// Development-specific settings
if (configService.isDevelopment()) {
  redisConfig.socket.connectTimeout = 10000;
  redisConfig.socket.family = 4;
}
```

### 5. Startup Validation System

#### Redis Startup Validator
- Validates Redis configuration before connection
- Tests basic connectivity (PING)
- Tests basic operations (SET/GET/DEL)
- Implements retry logic with exponential backoff
- Provides detailed logging for troubleshooting

#### Validation Process
1. Configuration validation
2. Connection establishment
3. Basic operation testing
4. Error handling and fallback activation

### 6. Docker Compose Integration

#### Enhanced Service Dependencies
```yaml
backend:
  environment:
    - NODE_ENV=production
    - IS_DOCKER=true
    - REDIS_HOST=redis
    - REDIS_PORT=6379
  depends_on:
    redis:
      condition: service_healthy
  healthcheck:
    start_period: 60s  # Increased for Redis validation
```

## Deployment Instructions

### Local Development

1. **Use existing `.env` file** (already configured for localhost)
2. **Start Redis locally**:
   ```bash
   # Windows
   start-redis-windows.bat
   
   # Linux/Mac
   redis-server
   ```
3. **Run application**:
   ```bash
   cd backend
   npm start
   ```

### Docker Deployment

1. **Use `.env.docker` file** (automatically mounted in container)
2. **Build and start services**:
   ```bash
   docker-compose up --build
   ```
3. **Verify Redis connectivity**:
   ```bash
   docker-compose logs backend | grep Redis
   ```

### Environment-Specific Testing

#### Development Environment Test
```bash
cd backend
node test-redis-environment-fix.js
```

#### Docker Environment Test
```bash
# Set Docker environment
export NODE_ENV=docker
export REDIS_HOST=redis

# Run test
node test-redis-environment-fix.js
```

## Troubleshooting

### Common Issues and Solutions

#### 1. "Socket closed unexpectedly" Error
**Cause**: Wrong Redis host for environment
**Solution**: 
- Development: Ensure `REDIS_HOST=localhost`
- Docker: Ensure `REDIS_HOST=redis`

#### 2. Connection Timeout
**Cause**: Redis service not ready
**Solution**: 
- Check Docker service health
- Verify Redis is running locally
- Increase connection timeout in configuration

#### 3. Authentication Failures
**Cause**: Incorrect Redis password
**Solution**:
- Verify `REDIS_PASSWORD` matches Redis configuration
- Check Redis server authentication settings

### Debugging Commands

#### Check Environment Detection
```bash
node -e "console.log('Environment:', process.env.NODE_ENV)"
node -e "console.log('Is Docker:', process.env.IS_DOCKER === 'true')"
```

#### Test Redis Configuration
```bash
cd backend
node -e "
const { configService } = require('./services/config');
console.log('Redis Config:', configService.getRedisConfigWithEnvironment());
"
```

#### Validate Redis Connectivity
```bash
cd backend
node test-redis-environment-fix.js
```

## File Structure

```
backend/
├── .env                    # Development configuration
├── .env.docker             # Docker configuration
├── services/
│   ├── config.js            # Enhanced configuration service
│   ├── redisConnectionPool.js # Environment-aware connection pool
│   ├── redisStartupValidator.js # Startup validation
│   └── redisFallbackService.js # Fallback handling
├── test-redis-environment-fix.js # Comprehensive test script
└── index.js                # Updated main application

docker-compose.yml           # Enhanced Docker configuration
```

## Configuration Validation

### Development Environment
- ✅ Redis Host: localhost
- ✅ Redis Port: 6379
- ✅ Environment Detection: development
- ✅ Auto-configuration: Applied

### Docker Environment
- ✅ Redis Host: redis (service name)
- ✅ Redis Port: 6379
- ✅ Environment Detection: docker/production
- ✅ Auto-configuration: Applied

## Benefits

1. **Automatic Environment Detection**: No manual configuration required
2. **Zero Configuration**: Works out of the box for both environments
3. **Error Prevention**: Eliminates "Socket closed unexpectedly" errors
4. **Enhanced Logging**: Detailed information for troubleshooting
5. **Graceful Fallback**: Memory-based fallback when Redis unavailable
6. **Health Checks**: Comprehensive startup validation

## Migration Guide

### From Manual Configuration
1. **Backup existing `.env` file**
2. **Update configuration files** using provided templates
3. **Test with validation script**
4. **Deploy with confidence**

### For New Deployments
1. **Copy `.env.docker` to backend directory**
2. **Configure Docker Compose** (already updated)
3. **Run deployment tests**
4. **Monitor logs for validation**

## Support

For issues with Redis environment configuration:
1. Run the validation script: `node test-redis-environment-fix.js`
2. Check environment variables: `printenv | grep REDIS`
3. Verify Docker service health: `docker-compose ps`
4. Review application logs: `docker-compose logs backend`

---

**Version**: 1.0.0  
**Last Updated**: 2025-12-23  
**Compatibility**: Node.js 16+, Redis 6+, Docker 20+