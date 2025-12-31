# Redis Docker Configuration Guide

## Overview

This guide documents the Redis configuration fixes implemented for the Smart Technologies Bangladesh B2C Website backend to ensure proper connectivity in Docker environments.

## Issues Fixed

### 1. Environment Detection
**Problem**: Inconsistent Docker environment detection
**Solution**: Enhanced environment detection in `config.js` to properly identify Docker containers

```javascript
// Enhanced Docker environment detection
const isDockerEnvironment = fs.existsSync('/.dockerenv') ||
  process.env.DOCKER_ENV === 'true' ||
  process.env.IS_DOCKER === 'true' ||
  nodeEnv === 'docker' ||
  (process.env.REDIS_HOST && process.env.REDIS_HOST === 'redis');
```

### 2. Configuration File Loading
**Problem**: Backend container not using `.env.docker` file properly
**Solution**: Updated Docker Compose to mount `.env.docker` as `.env` in container

```yaml
volumes:
  - ./backend/.env.docker:/app/.env:ro
```

### 3. Redis Host Configuration
**Problem**: Inconsistent Redis host configuration between environments
**Solution**: Standardized Redis configuration with environment-specific logic

```javascript
// Docker environment
if (isDockerEnvironment || nodeEnv === 'production') {
  if (!process.env.REDIS_HOST || process.env.REDIS_HOST === 'localhost') {
    process.env.REDIS_HOST = 'redis';
  }
}
```

## Configuration Files

### `.env.docker`
Contains Docker-specific environment variables:

```bash
# Environment Detection
IS_DOCKER=true
DOCKER_ENV=true

# Redis Configuration (Docker)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_smarttech_2024
REDIS_URL=redis://:redis_smarttech_2024@redis:6379
REDIS_TTL=3600
```

### `docker-compose.yml`
Updated with proper environment detection and health checks:

```yaml
backend:
  environment:
    # Environment Detection - Critical for Redis configuration
    - NODE_ENV=production
    - IS_DOCKER=true
    - DOCKER_ENV=true
  volumes:
    - ./backend/.env.docker:/app/.env:ro
  healthcheck:
    test: ["CMD", "node", "docker-health-check.js"]
    start_period: 60s  # Increased startup time for Redis validation
```

## Redis Connection Pool

The Redis connection pool (`redisConnectionPool.js`) provides:

- **Automatic reconnection** with exponential backoff
- **Connection validation** and health checks
- **Graceful fallback** when Redis is unavailable
- **Service-specific logging** for debugging

### Key Features

1. **Connection Lock**: Prevents concurrent initialization
2. **Enhanced Socket Configuration**: Optimized for Docker networking
3. **Wrapped Client**: Provides fallback responses on errors
4. **Automatic Recovery**: Attempts reconnection on failures

## Redis Startup Validator

The startup validator (`redisStartupValidator.js`) ensures:

- **Configuration validation** before connection attempts
- **Connectivity testing** with retry logic
- **Environment-aware logging** for debugging
- **Comprehensive error reporting**

### Validation Steps

1. Environment detection and logging
2. Configuration validation
3. Connection establishment with retry
4. Basic operations testing (PING, SET, GET, DEL)
5. Detailed success/failure reporting

## Health Checks

### Docker Health Check
`docker-health-check.js` provides container health monitoring:

- **Quick validation** (10-second timeout)
- **Environment-aware configuration**
- **Proper exit codes** for Docker
- **Detailed logging** for troubleshooting

### Application Health Check
Enhanced `/api/v1/health` endpoint includes:

- **Redis connection status**
- **Connection pool statistics**
- **Configuration validation**
- **Service availability reporting**

## Testing

### Redis Connectivity Test
`test-redis-docker-connectivity.js` provides comprehensive testing:

1. **Environment Detection** verification
2. **Configuration Validation** testing
3. **Direct Connection** testing
4. **Connection Pool** testing
5. **Startup Validator** testing
6. **Status Reporting**

### Usage

```bash
# Run connectivity test
node backend/test-redis-docker-connectivity.js

# Run health check
node backend/docker-health-check.js
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check Redis container is running
   - Verify network connectivity
   - Confirm host configuration

2. **Authentication Failed**
   - Verify Redis password matches
   - Check REDIS_PASSWORD environment variable
   - Confirm Redis server configuration

3. **Timeout Errors**
   - Increase connection timeout
   - Check network latency
   - Verify Redis server responsiveness

### Debugging Steps

1. Check environment variables:
   ```bash
   docker exec smarttech_backend env | grep REDIS
   ```

2. Test Redis connectivity from container:
   ```bash
   docker exec smarttech_backend node docker-health-check.js
   ```

3. Check Redis container logs:
   ```bash
   docker logs smarttech_redis
   ```

4. Verify network connectivity:
   ```bash
   docker exec smarttech_backend ping redis
   ```

## Configuration Validation

### Required Environment Variables

- `REDIS_HOST`: Redis server hostname
- `REDIS_PORT`: Redis server port (default: 6379)
- `REDIS_PASSWORD`: Redis authentication password
- `REDIS_URL`: Complete Redis connection URL (optional)
- `REDIS_TTL`: Default TTL for Redis keys (optional)

### Docker-Specific Variables

- `IS_DOCKER=true`: Indicates Docker environment
- `DOCKER_ENV=true`: Enables Docker-specific configuration
- `NODE_ENV=production`: Sets production mode

## Security Considerations

1. **Password Protection**: Redis requires authentication
2. **Network Isolation**: Redis only accessible within Docker network
3. **Environment Variables**: Sensitive data properly mounted as read-only
4. **Health Checks**: Regular monitoring of connection status

## Performance Optimizations

1. **Connection Pooling**: Reuses connections efficiently
2. **Keep-Alive**: Maintains persistent connections
3. **Timeout Configuration**: Optimized for Docker networking
4. **Retry Logic**: Exponential backoff prevents thundering herd

## Monitoring

### Metrics Available

- Connection status
- Pool size and utilization
- Error rates and types
- Response times
- Reconnection attempts

### Logging

- Environment detection results
- Configuration validation
- Connection events
- Error details with stack traces
- Performance metrics

## Best Practices

1. **Always use environment-specific configuration files**
2. **Implement proper health checks**
3. **Use connection pooling**
4. **Add comprehensive logging**
5. **Test connectivity in container environment**
6. **Monitor Redis performance**
7. **Implement graceful fallbacks**

## Conclusion

The Redis configuration fixes ensure:

✅ **Proper Docker environment detection**
✅ **Consistent configuration across environments**
✅ **Robust connection handling**
✅ **Comprehensive health monitoring**
✅ **Graceful error handling**
✅ **Detailed logging for debugging**

These fixes resolve the critical backend configuration issues that were preventing the authentication system from functioning properly in Docker environments.