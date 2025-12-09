# E-commerce Database Setup Guide

This document provides comprehensive setup instructions for the Smart Technologies e-commerce database infrastructure, including PostgreSQL, Redis, and pgAdmin.

## Service Overview

The Smart Technologies e-commerce platform runs on a three-service infrastructure:

1. **PostgreSQL 15-alpine** - Primary database for persistent data storage
   - Container: `smarttech_postgres`
   - Port: 5432
   - Database: `smart_ecommerce_dev`

2. **Redis 7-alpine** - In-memory data store for caching and session management
   - Container: `smarttech_redis`
   - Port: 6379
   - Version: Redis 7.4.7

3. **pgAdmin 4** - Web-based PostgreSQL administration tool
   - Container: `smarttech_pgadmin`
   - Port: 5050
   - Web Interface: http://localhost:5050

All services are connected via a shared Docker network (`smarttech_network`) for inter-service communication.

## Database Configuration

### Databases Created
1. **smart_ecommerce_dev** - E-commerce development database

**Note**: The production database (`smarttech_db`) has been removed from the setup.

### Users Created
1. **smart_dev** - Development user
   - Password: `smart_dev_password_2024`
   - Access to smart_ecommerce_dev database
   - Database owner for smart_ecommerce_dev

**Note**: The `smarttech_user` has been disabled and no longer used.

## Connection Details

### Development Database (smart_ecommerce_dev)
- **Host**: localhost
- **Port**: 5432
- **Database**: smart_ecommerce_dev
- **Username**: smart_dev
- **Password**: smart_dev_password_2024

**Note**: Only the e-commerce development database is available for connection.

### Redis Cache Server
- **Host**: localhost
- **Port**: 6379
- **Password**: redis_smarttech_2024
- **Version**: Redis 7.4.7 (alpine)
- **Persistence**: AOF (Append Only File) enabled
- **Container**: smarttech_redis

## pgAdmin Configuration

### Access pgAdmin
- **URL**: http://localhost:5050
- **Email**: admin@smarttech.com
- **Password**: admin123

### Pre-configured Servers in pgAdmin
1. **Smart Technologies PostgreSQL - E-commerce Dev**
   - Database: smart_ecommerce_dev
   - User: smart_dev
   - Color: Orange (#FF6B6B)

**Note**: Only the development server is configured in pgAdmin.

## Database Schema

### E-commerce Development Database Structure

#### Users Schema (`users`)
- `customers` - Customer information and authentication
- `profiles` - Extended user profiles (future)

#### Products Schema (`products`)
- `items` - Product catalog with pricing and inventory
- `categories` - Product categories (future)
- `attributes` - Product attributes (future)

#### Orders Schema (`orders`)
- `orders` - Customer orders and order management
- `order_items` - Line items for each order
- `shipping` - Shipping information (future)

#### Inventory Schema (`inventory`)
- `stock` - Inventory management
- `warehouses` - Warehouse locations (future)
- `movements` - Stock movements (future)

#### Payments Schema (`payments`)
- `transactions` - Payment transactions
- `methods` - Payment methods (future)
- `refunds` - Refund management (future)

## Redis Configuration and Usage

### Redis Implementation Details
- **Version**: Redis 7.4.7 (alpine)
- **Container Name**: smarttech_redis
- **Persistence**: AOF (Append Only File) enabled
- **Network**: Connected to `smarttech_network` for inter-service communication
- **Health Checks**: Enabled with 30s interval
- **Volume**: `redis_data` for persistent storage

### Redis Use Cases in E-commerce
1. **Session Management**: User session storage for cart and authentication
2. **Product Caching**: Frequently accessed product data and inventory
3. **Query Result Caching**: Database query results to reduce load
4. **Rate Limiting**: API request throttling and abuse prevention
5. **Shopping Cart**: Temporary cart storage for guest users
6. **Analytics**: Real-time metrics and counters

### Redis Connection Examples

#### Node.js (redis package)
```javascript
const redis = require('redis');

const client = redis.createClient({
  host: 'localhost',
  port: 6379,
  password: 'redis_smarttech_2024'
});

client.on('error', (err) => {
  console.error('Redis Error:', err);
});

// Basic operations
await client.set('key', 'value');
const value = await client.get('key');
```

#### Python (redis-py)
```python
import redis

r = redis.Redis(
    host='localhost',
    port=6379,
    password='redis_smarttech_2024',
    decode_responses=True
)

# Basic operations
r.set('key', 'value')
value = r.get('key')
```

#### PHP (predis)
```php
require 'vendor/autoload.php';

$client = new Predis\Client([
    'scheme' => 'tcp',
    'host'   => 'localhost',
    'port'   => 6379,
    'password' => 'redis_smarttech_2024'
]);

// Basic operations
$client->set('key', 'value');
$value = $client->get('key');
```

### Redis Integration with PostgreSQL

#### Cache-Aside Pattern
```javascript
// Example: Product data caching
async function getProduct(productId) {
  // Try to get from Redis first
  const cachedProduct = await redis.get(`product:${productId}`);
  
  if (cachedProduct) {
    return JSON.parse(cachedProduct);
  }
  
  // If not in cache, query PostgreSQL
  const product = await db.query(
    'SELECT * FROM products.items WHERE id = $1',
    [productId]
  );
  
  // Cache the result for future requests
  await redis.setex(`product:${productId}`, 3600, JSON.stringify(product));
  
  return product;
}
```

#### Session Management Integration
```javascript
// Example: Session storage with database backup
async function createSession(userId, sessionData) {
  const sessionId = generateSessionId();
  
  // Store in Redis for fast access
  await redis.setex(`session:${sessionId}`, 86400, JSON.stringify(sessionData));
  
  // Backup critical session info in PostgreSQL
  await db.query(
    'INSERT INTO users.sessions (id, user_id, created_at) VALUES ($1, $2, NOW())',
    [sessionId, userId]
  );
  
  return sessionId;
}
```

### Common Redis Commands for E-commerce

#### Product Caching
```bash
# Cache product data
SET product:123 '{"id":123,"name":"Laptop","price":999.99}'
EXPIRE product:123 3600

# Get cached product
GET product:123

# Cache product category
SADD category:electronics 123 124 125
```

#### Shopping Cart
```bash
# Add item to cart
HSET cart:user456 item123 2
HSET cart:user456 item124 1

# Get cart contents
HGETALL cart:user456

# Remove item from cart
HDEL cart:user456 item123
```

#### Session Management
```bash
# Create session
SET session:abc123 '{"user_id":456,"role":"customer"}'
EXPIRE session:abc123 86400

# Get session
GET session:abc123

# Refresh session
EXPIRE session:abc123 86400
```

## Security Features

### Implemented Security Measures
1. **User Isolation**: Separate users for different environments
2. **Password Security**: Strong passwords for all users
3. **Audit Logging**: Comprehensive audit trail for all changes
4. **Connection Monitoring**: View to track database connections
5. **Row Level Security**: Prepared for customer data protection
6. **Redis Authentication**: Password-protected Redis instance
7. **Network Isolation**: Services communicate within Docker network

### Audit Logging
- All database changes are logged in `public.audit_log`
- Tracks table operations, user actions, and timestamps
- Accessible to both admin and development users

### Redis Security Configuration
- **Password Authentication**: Redis requires password `redis_smarttech_2024`
- **Network Isolation**: Redis is not exposed to external networks
- **Docker Network**: Only accessible within `smarttech_network`
- **AOF Persistence**: Data persistence enabled for recovery

## Sample Data

### Test Data Included
1. **Test Customer**: test@example.com
2. **Sample Product**: Electronics category, $99.99
3. **Basic Order Structure**: Sample order with items

## Development Workflow

### 1. Database Development
```sql
-- Connect as smart_dev user
psql -h localhost -p 5432 -U smart_dev -d smart_ecommerce_dev

-- Create new tables in appropriate schemas
CREATE TABLE products.new_products (...);
```

### 2. Testing and Validation
```sql
-- Use test data for development
SELECT * FROM users.customers WHERE email = 'test@example.com';
SELECT * FROM products.items WHERE category = 'electronics';
```

### 3. Production Deployment
- Use `smarttech_user` for production changes
- Apply migrations through version-controlled scripts
- Test thoroughly in development first

## Performance Optimizations

### Indexes Created
- Email lookup index for customers
- Category index for products
- Customer and status indexes for orders
- Composite indexes for order items

### Connection Pooling
- Configure application connection pooling
- Recommended pool size: 10-20 connections
- Timeout settings: 10-30 seconds

## Backup and Recovery

### PostgreSQL Automated Backups
```bash
# Backup development database
docker-compose exec postgres pg_dump -U smart_dev smart_ecommerce_dev > backup.sql

# Backup specific tables
docker-compose exec postgres pg_dump -U smart_dev -t users.customers smart_ecommerce_dev > customers_backup.sql

# Create compressed backup
docker-compose exec postgres pg_dump -U smart_dev smart_ecommerce_dev | gzip > backup.sql.gz
```

### PostgreSQL Recovery
```bash
# Restore development database
docker-compose exec -T postgres psql -U smart_dev smart_ecommerce_dev < backup.sql

# Restore compressed backup
gunzip -c backup.sql.gz | docker-compose exec -T postgres psql -U smart_dev smart_ecommerce_dev
```

### Redis Backup and Recovery
```bash
# Redis AOF backup (automatic with persistence)
# AOF file location: redis_data volume at /data/appendonly.aof

# Manual Redis backup
docker-compose exec redis redis-cli -a redis_smarttech_2024 BGSAVE

# Create snapshot backup
docker-compose exec redis redis-cli -a redis_smarttech_2024 SAVE

# Copy AOF file to host
docker cp smarttech_redis:/data/appendonly.aof ./redis_backup.aof

# Redis recovery (restart with existing AOF)
# Redis will automatically recover from AOF file on restart
docker-compose restart redis
```

### Combined Backup Strategy
```bash
#!/bin/bash
# Full infrastructure backup script

DATE=$(date +%Y%m%d_%H%M%S)

# Backup PostgreSQL
docker-compose exec postgres pg_dump -U smart_dev smart_ecommerce_dev > postgres_backup_$DATE.sql

# Backup Redis AOF
docker cp smarttech_redis:/data/appendonly.aof ./redis_backup_$DATE.aof

# Create backup directory
mkdir -p backups/$DATE
mv postgres_backup_$DATE.sql backups/$DATE/
mv redis_backup_$DATE.aof backups/$DATE/

echo "Backup completed: backups/$DATE"
```

## Monitoring and Maintenance

### Health Checks

#### PostgreSQL Health Checks
```sql
-- Check database connectivity
SELECT 1 as health_check;

-- Monitor table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname::tablename)) as size
FROM pg_tables
WHERE schemaname IN ('users', 'products', 'orders', 'inventory', 'payments');
```

#### Redis Health Checks
```bash
# Test Redis connectivity
docker-compose exec redis redis-cli -a redis_smarttech_2024 ping

# Check Redis server info
docker-compose exec redis redis-cli -a redis_smarttech_2024 info server

# Monitor Redis memory usage
docker-compose exec redis redis-cli -a redis_smarttech_2024 info memory

# Check Redis persistence status
docker-compose exec redis redis-cli -a redis_smarttech_2024 info persistence
```

#### Combined Health Check Script
```bash
#!/bin/bash
# Health check for all services

echo "=== PostgreSQL Health Check ==="
docker-compose exec postgres pg_isready -U smart_dev -d smart_ecommerce_dev

echo -e "\n=== Redis Health Check ==="
docker-compose exec redis redis-cli -a redis_smarttech_2024 ping

echo -e "\n=== Container Status ==="
docker-compose ps
```

### Performance Monitoring

#### PostgreSQL Performance Monitoring
```sql
-- Slow query monitoring (requires pg_stat_statements extension)
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Connection monitoring
SELECT state, count(*)
FROM pg_stat_activity
GROUP BY state;

-- Table size monitoring
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname::tablename)) as size,
    pg_total_relation_size(schemaname::tablename) as size_bytes
FROM pg_tables
WHERE schemaname IN ('users', 'products', 'orders', 'inventory', 'payments')
ORDER BY size_bytes DESC;
```

#### Redis Performance Monitoring
```bash
# Monitor Redis commands in real-time
docker-compose exec redis redis-cli -a redis_smarttech_2024 monitor

# Check slow queries
docker-compose exec redis redis-cli -a redis_smarttech_2024 slowlog get 10

# Redis statistics
docker-compose exec redis redis-cli -a redis_smarttech_2024 info stats

# Memory usage details
docker-compose exec redis redis-cli -a redis_smarttech_2024 info memory | grep used_memory

# Client connections
docker-compose exec redis redis-cli -a redis_smarttech_2024 info clients
```

### Maintenance Tasks

#### PostgreSQL Maintenance
```sql
-- Update table statistics
ANALYZE;

-- Rebuild indexes
REINDEX DATABASE smart_ecommerce_dev;

-- Clean up dead rows
VACUUM;

-- View database size
SELECT pg_size_pretty(pg_database_size('smart_ecommerce_dev'));
```

#### Redis Maintenance
```bash
# Force AOF rewrite
docker-compose exec redis redis-cli -a redis_smarttech_2024 bgrewriteaof

# Clean up expired keys (automatic, but can be forced)
docker-compose exec redis redis-cli -a redis_smarttech_2024 debug object expired_key

# Check memory fragmentation
docker-compose exec redis redis-cli -a redis_smarttech_2024 info memory | grep mem_fragmentation_ratio

# Optimize memory usage
docker-compose exec redis redis-cli -a redis_smarttech_2024 memory usage
```

## Security Best Practices

### Application Security
1. Use connection strings with SSL
2. Implement connection pooling
3. Use parameterized queries
4. Validate all user inputs
5. Implement proper error handling

### Database Security
1. Regular password rotation
2. Limit user permissions
3. Monitor audit logs regularly
4. Use VPN for remote access
5. Enable SSL in production

### Redis Security
1. **Password Protection**: Always use Redis password authentication
2. **Network Isolation**: Keep Redis within Docker network, not exposed externally
3. **Data Sanitization**: Sanitize data before storing in Redis to prevent injection attacks
4. **Access Control**: Limit Redis access to application servers only
5. **Key Naming**: Use consistent, non-predictable key naming patterns
6. **Memory Limits**: Set appropriate maxmemory limits to prevent DoS attacks
7. **Command Restrictions**: Disable dangerous Redis commands in production
8. **Regular Backups**: Regularly backup Redis AOF files
9. **Monitoring**: Monitor Redis connections and unusual activity patterns
10. **Encryption**: Consider encrypting sensitive data before storing in Redis

## Troubleshooting

### PostgreSQL Common Issues
1. **Connection Refused**: Check if PostgreSQL container is running
2. **Authentication Failed**: Verify username/password
3. **Permission Denied**: Check user privileges
4. **Database Not Found**: Verify database name and user access

### Redis Common Issues
1. **Connection Refused**: Check if Redis container is running
2. **Authentication Failed**: Verify Redis password
3. **Memory Issues**: Monitor Redis memory usage
4. **Data Loss**: Check AOF persistence status

### Debug Commands
```bash
# Check all container status
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# View Redis logs
docker-compose logs redis

# Test PostgreSQL connection
docker-compose exec postgres pg_isready -U smart_dev -d smart_ecommerce_dev

# Test Redis connection
docker-compose exec redis redis-cli -a redis_smarttech_2024 ping

# Check Redis memory usage
docker-compose exec redis redis-cli -a redis_smarttech_2024 info memory

# Check Redis persistence status
docker-compose exec redis redis-cli -a redis_smarttech_2024 lastsave
```

### Redis-Specific Troubleshooting
```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli -a redis_smarttech_2024

# Check Redis info
INFO server
INFO memory
INFO persistence

# Monitor Redis commands
MONITOR

# Check slow queries
SLOWLOG GET 10

# Flush cache (use with caution)
FLUSHALL
```

### Common Redis Error Solutions

#### Authentication Errors
```bash
# Error: NOAUTH Authentication required
# Solution: Always include password in commands
docker-compose exec redis redis-cli -a redis_smarttech_2024 COMMAND

# Or connect with password flag
docker-compose exec redis redis-cli -a redis_smarttech_2024
```

#### Memory Issues
```bash
# Check memory usage
docker-compose exec redis redis-cli -a redis_smarttech_2024 info memory | grep used_memory

# Check memory fragmentation
docker-compose exec redis redis-cli -a redis_smarttech_2024 info memory | grep mem_fragmentation_ratio

# Clear expired keys
docker-compose exec redis redis-cli -a redis_smarttech_2024 debug object expired_key
```

#### Persistence Issues
```bash
# Check AOF status
docker-compose exec redis redis-cli -a redis_smarttech_2024 info persistence

# Force AOF rewrite
docker-compose exec redis redis-cli -a redis_smarttech_2024 bgrewriteaof

# Manual save
docker-compose exec redis redis-cli -a redis_smarttech_2024 SAVE
```

## Next Steps

1. **Application Integration**: Connect your e-commerce application
2. **Schema Development**: Extend schema based on requirements
3. **Data Migration**: Plan data migration from existing systems
4. **Performance Testing**: Load test with realistic data volumes
5. **Security Audit**: Review and enhance security measures

## Support

### PostgreSQL Support
For database-related issues:
1. Check this documentation
2. Review PostgreSQL logs with `docker-compose logs postgres`
3. Consult PostgreSQL documentation
4. Contact database administrator

### Redis Support
For Redis-related issues:
1. Check this documentation
2. Review Redis logs with `docker-compose logs redis`
3. Test Redis connectivity with `docker-compose exec redis redis-cli -a redis_smarttech_2024 ping`
4. Consult Redis documentation
5. Check Redis configuration in docker-compose.yml

### Application Integration Support
For application integration issues:
1. Verify connection strings for both PostgreSQL and Redis
2. Check application logs for database/cache errors
3. Test with simple queries first
4. Review pgAdmin configuration
5. Test Redis connection from application code

### General Troubleshooting
For infrastructure issues:
1. Check all container status with `docker-compose ps`
2. Review network connectivity between containers
3. Verify environment variables in .env file
4. Check Docker logs for all services
5. Restart services if needed: `docker-compose restart`