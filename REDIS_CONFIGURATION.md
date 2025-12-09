# Redis Configuration for Smart Technologies Bangladesh B2C Website

## Overview
This document outlines the enhanced Redis 7+ configuration implemented for the Smart Technologies Bangladesh B2C Website Redevelopment project. The configuration is optimized for e-commerce workloads with focus on security, performance, and reliability.

## Current Setup
- **Redis Version**: 7.4.7 (Alpine)
- **Port**: 6379
- **Container Name**: smarttech_redis
- **Network**: smarttech_network
- **Authentication**: Password protected
- **Persistence**: AOF (Append Only File) with RDB backup

## Configuration Files

### 1. Redis Configuration File (`redis/redis.conf`)
The main Redis configuration file contains optimized settings for e-commerce use cases:

#### Security Settings
- **Password Authentication**: Enabled with secure password
- **Protected Mode**: Enabled for additional security
- **Network Binding**: Configured for container networking

#### Memory Management
- **Max Memory**: 512MB (configurable via REDIS_MAXMEMORY env var)
- **Memory Policy**: allkeys-lru (Least Recently Used eviction)
- **Optimized for**: Session storage and product caching

#### Persistence Configuration
- **AOF Enabled**: Yes (appendonly yes)
- **AOF Sync Strategy**: everysec (balance between performance and data safety)
- **AOF Rewrite**: Auto-rewrite at 100% growth, minimum 64MB
- **RDB Snapshots**: Enabled as backup to AOF
  - Every 15 minutes if at least 1 key changed
  - Every 5 minutes if at least 10 keys changed
  - Every 1 minute if at least 10,000 keys changed

#### Connection Settings
- **Max Clients**: 10,000 (configurable via REDIS_MAXCLIENTS env var)
- **Timeout**: 300 seconds
- **TCP Keepalive**: 300 seconds

#### Performance Optimizations
- **Hash Optimization**: ziplist encoding for small hashes
- **List Optimization**: ziplist encoding for small lists
- **Set Optimization**: intset encoding for small sets
- **Sorted Set Optimization**: ziplist encoding for small sorted sets

#### Monitoring
- **Slow Log**: Enabled for commands slower than 10ms
- **Latency Monitoring**: Enabled with 100ms threshold
- **Key Events**: Expiration events enabled for cache invalidation

### 2. Docker Compose Configuration
Updated to use the dedicated Redis configuration file:

```yaml
redis:
  image: redis:${REDIS_VERSION:-7-alpine}
  container_name: smarttech_redis
  restart: unless-stopped
  command: redis-server /usr/local/etc/redis/redis.conf
  ports:
    - "${REDIS_PORT:-6379}:6379"
  volumes:
    - redis_data:/data
    - ./redis/redis.conf:/usr/local/etc/redis/redis.conf:ro
  environment:
    - REDIS_PASSWORD=${REDIS_PASSWORD:-redis_smarttech_2024}
    - REDIS_MAXMEMORY=${REDIS_MAXMEMORY:-512mb}
    - REDIS_MAXCLIENTS=${REDIS_MAXCLIENTS:-10000}
  networks:
    - smarttech_network
  healthcheck:
    test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD:-redis_smarttech_2024}", "ping"]
    interval: 30s
    timeout: 10s
    retries: 3
```

### 3. Environment Variables
Additional Redis configuration variables added to `.env`:

```bash
# Redis Configuration
REDIS_VERSION=7-alpine
REDIS_PORT=6379
REDIS_PASSWORD=redis_smarttech_2024
REDIS_MAXMEMORY=512mb
REDIS_MAXCLIENTS=10000
```

## E-commerce Specific Optimizations

### 1. Session Storage
- Memory-optimized for user session data
- LRU eviction policy ensures active sessions remain
- Fast access for session validation

### 2. Product Catalog Caching
- Efficient hash encoding for product attributes
- Optimized for frequent read operations
- Automatic expiration support for cache invalidation

### 3. Shopping Cart Persistence
- AOF ensures cart data is not lost on restart
- RDB snapshots provide additional backup
- Fast operations for cart updates

### 4. Rate Limiting
- Sorted sets optimized for rate limiting implementations
- Efficient memory usage for counters
- Fast expiration of old rate limit data

## Security Enhancements

### 1. Authentication
- Strong password authentication required
- Password not stored in configuration file (uses environment variable)
- Protected mode enabled to prevent unauthorized access

### 2. Network Security
- Container networking isolates Redis from external networks
- Port exposure controlled through Docker Compose
- No direct public exposure

### 3. Data Protection
- AOF with fsync every second ensures data durability
- RDB snapshots provide point-in-time recovery
- Secure file permissions on data directory

## Performance Tuning

### 1. Memory Efficiency
- Ziplist encoding for small data structures
- Optimized memory usage for e-commerce patterns
- Configurable memory limits

### 2. Connection Management
- High connection limit (10,000) for concurrent users
- Connection timeout prevents resource leaks
- TCP keepalive maintains connection health

### 3. Monitoring Capabilities
- Slow log for performance analysis
- Latency monitoring for issue detection
- Key event notifications for cache management

## Testing Results

All Redis operations have been tested and verified:

### 1. Basic Operations
- ✅ PING command works correctly
- ✅ SET/GET operations function properly
- ✅ EXPIRE/TTL operations work as expected

### 2. Connectivity
- ✅ Internal Docker network connectivity confirmed
- ✅ Host machine connectivity verified
- ✅ Password authentication working correctly

### 3. Persistence
- ✅ AOF persistence confirmed (data survives restart)
- ✅ RDB snapshots enabled as backup
- ✅ AOF rewrite configuration working

## Maintenance and Monitoring

### 1. Health Checks
- Docker health check configured with 30-second intervals
- Automatic restart on failure
- Ping command used for health verification

### 2. Log Management
- Redis logs configured for appropriate verbosity
- Error and warning messages captured
- Performance metrics available through INFO command

### 3. Backup Strategy
- AOF provides continuous durability
- RDB snapshots provide point-in-time recovery
- Data volume mounted for backup operations

## Scaling Considerations

### 1. Memory Scaling
- Memory limit configurable via environment variable
- LRU eviction policy handles memory pressure
- Monitoring recommended for memory usage

### 2. Connection Scaling
- Max clients configurable via environment variable
- Connection pooling recommended for applications
- Monitoring for connection count recommended

### 3. Performance Scaling
- Redis clustering available for horizontal scaling
- Read replicas can be added for read-heavy workloads
- Monitoring for performance metrics recommended

## Security Best Practices

### 1. Password Management
- Use strong, unique passwords
- Store passwords in environment variables or secret managers
- Regular password rotation recommended

### 2. Network Access
- Limit network exposure to required services
- Use firewall rules when appropriate
- Consider TLS for sensitive environments

### 3. Access Control
- Implement application-level access controls
- Use Redis ACLs for fine-grained permissions (if needed)
- Regular access audits recommended

## Troubleshooting

### 1. Common Issues
- **Connection Refused**: Check if Redis is running and port is accessible
- **Authentication Failed**: Verify password in environment variables
- **Memory Issues**: Check memory usage and eviction policy

### 2. Performance Issues
- **Slow Operations**: Check slow log for problematic commands
- **High Memory Usage**: Review eviction policy and memory limit
- **Connection Issues**: Check max clients setting and connection pooling

### 3. Persistence Issues
- **Data Loss**: Check AOF and RDB configuration
- **Slow Startup**: Check AOF file size and rewrite settings
- **Disk Space**: Monitor data directory size

## Conclusion

The Redis configuration has been enhanced to provide a secure, performant, and reliable caching solution for the Smart Technologies Bangladesh B2C Website. The configuration follows Redis best practices and is optimized for e-commerce workloads with proper security measures, performance tuning, and data persistence.