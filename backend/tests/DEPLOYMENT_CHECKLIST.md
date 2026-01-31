# Phase 4 Milestone 2 - Deployment Checklist

**Document Version:** 1.0  
**Last Updated:** January 27, 2026  
**Deployment Type:** Production  
**Milestone:** Phase 4 Milestone 2 - Product Management APIs

---

## Table of Contents

1. [Pre-Deployment Checklist](#1-pre-deployment-checklist)
2. [Deployment Steps](#2-deployment-steps)
3. [Post-Deployment Verification](#3-post-deployment-verification)
4. [Rollback Procedures](#4-rollback-procedures)
5. [Troubleshooting Guide](#5-troubleshooting-guide)
6. [Environment Configuration](#6-environment-configuration)
7. [Monitoring Setup](#7-monitoring-setup)

---

## 1. Pre-Deployment Checklist

### 1.1 Code Readiness

| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| ✅ All tests passing | 70/70 tests passing (100%) | ☐ | |
| ✅ Code review completed | All PRs reviewed and approved | ☐ | |
| ✅ No critical bugs | All critical issues resolved | ☐ | |
| ✅ Security scan passed | No high/critical vulnerabilities | ☐ | |
| ✅ Performance benchmarks met | All metrics within requirements | ☐ | |
| ✅ Documentation updated | All docs reflect current code | ☐ | |
| ✅ Changelog updated | Version changes documented | ☐ | |

### 1.2 Database Readiness

| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| ✅ Migration tested | Non-destructive migration verified | ☐ | |
| ✅ Backup created | Full database backup taken | ☐ | |
| ✅ Migration rollback tested | Rollback procedure verified | ☐ | |
| ✅ Data integrity verified | Existing data preserved | ☐ | |
| ✅ Index performance verified | All indexes optimized | ☐ | |
| ✅ Connection pooling configured | Pool size appropriate for load | ☐ | |

### 1.3 Infrastructure Readiness

| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| ✅ Server requirements met | CPU, RAM, storage adequate | ☐ | |
| ✅ PostgreSQL ready | Version compatible, configured | ☐ | |
| ✅ Elasticsearch ready | Version mismatch resolved or fallback tested | ☐ | |
| ✅ Redis ready | Connection configured | ☐ | |
| ✅ SSL certificates valid | HTTPS configured | ☐ | |
| ✅ DNS records updated | If needed | ☐ | |

### 1.4 Security Readiness

| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| ✅ Authentication tested | JWT, role-based access working | ☐ | |
| ✅ Authorization tested | Admin/user access levels verified | ☐ | |
| ✅ Input validation tested | SQLi, XSS prevention verified | ☐ | |
| ✅ Sensitive data protected | Secrets, credentials secured | ☐ | |
| ✅ CORS configured | Cross-origin restrictions set | ☐ | |
| ✅ Rate limiting enabled | Abuse prevention active | ☐ | |

### 1.5 Monitoring Readiness

| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| ✅ Logging configured | Application logs active | ☐ | |
| ✅ Error tracking active | Errors captured and logged | ☐ | |
| ✅ Performance monitoring | Response times tracked | ☐ | |
| ✅ Health check endpoint | /api/health working | ☐ | |
| ✅ Alerting configured | Critical issues trigger alerts | ☐ | |
| ✅ Dashboards ready | Key metrics visualized | ☐ | |

---

## 2. Deployment Steps

### 2.1 Pre-Deployment Steps

```bash
# 1. Create deployment directory
mkdir -p /opt/smart-tech-api
cd /opt/smart-tech-api

# 2. Pull latest code
git checkout main
git pull origin main

# 3. Install dependencies
npm ci --production=false

# 4. Create environment file from template
cp .env.example .env
# Edit .env with production values

# 5. Generate Prisma client
npx prisma generate

# 6. Run database migrations
npx prisma migrate deploy

# 7. Verify database connection
npm run db:verify
```

### 2.2 Database Migration

```bash
# 1. Create backup before migration
pg_dump -U postgres -d smart_tech_b2c > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Test migration in staging first
npm run migrate:staging

# 3. Verify migration results
npm run db:verify

# 4. Run production migration
npm run migrate:production

# 5. Verify data integrity
npm run db:integrity-check
```

### 2.3 Application Deployment

```bash
# Option A: Traditional Deployment (PM2)
# 1. Build application
npm run build

# 2. Stop current instance
pm2 stop smart-tech-api

# 3. Start new instance
pm2 start ecosystem.config.js --env production

# 4. Verify running
pm2 status
pm2 logs smart-tech-api --lines 50

# Option B: Docker Deployment
# 1. Build Docker image
docker build -t smart-tech-api:v4.2.0 .

# 2. Push to registry (if using one)
docker push registry.example.com/smart-tech-api:v4.2.0

# 3. Update container
docker-compose -f docker-compose.prod.yml up -d

# 4. Verify containers
docker-compose ps
docker-compose logs -f
```

### 2.4 Elasticsearch Setup (If Fixed)

```bash
# 1. Verify Elasticsearch connection
curl -X GET "localhost:9200/_cluster/health"

# 2. Create index with mappings
curl -X PUT "localhost:9200/products" -H 'Content-Type: application/json' -d @elasticsearch/mappings.json

# 3. Reindex all products
npm run elasticsearch:reindex

# 4. Verify index health
curl -X GET "localhost:9200/_cat/indices?v"
```

---

## 3. Post-Deployment Verification

### 3.1 Health Checks

| Check | Endpoint | Expected | Status |
|-------|----------|----------|--------|
| ✅ API Health | GET /api/health | 200 OK with status | ☐ |
| ✅ Database | GET /api/health/db | Connected | ☐ |
| ✅ Elasticsearch | GET /api/health/es | Connected or fallback | ☐ |
| ✅ Redis | GET /api/health/redis | Connected | ☐ |

### 3.2 Functional Tests

| Test | Command | Expected | Status |
|------|---------|----------|--------|
| ✅ Product list | GET /api/v1/products | 200 OK, products array | ☐ |
| ✅ Product detail | GET /api/v1/products/1 | 200 OK, product object | ☐ |
| ✅ Product search | GET /api/v1/search?q=laptop | 200 OK, results | ☐ |
| ✅ Category list | GET /api/v1/categories | 200 OK, categories | ☐ |
| ✅ Brand list | GET /api/v1/brands | 200 OK, brands | ☐ |
| ✅ Bulk operations | POST /api/v1/products/bulk | 200 OK, created | ☐ |

### 3.3 Performance Tests

| Test | Command | Expected | Status |
|------|---------|----------|--------|
| ✅ Search response | ab -n 100 -c 10 /api/v1/search?q=phone | < 300ms avg | ☐ |
| ✅ API response | ab -n 100 -c 10 /api/v1/products | < 200ms avg | ☐ |
| ✅ Bulk create | npm run test:bulk-create | < 10s for 100 items | ☐ |

### 3.4 Security Tests

| Test | Command | Expected | Status |
|------|---------|----------|--------|
| ✅ Auth required | GET /api/v1/products (no token) | 401 Unauthorized | ☐ |
| ✅ Invalid token | GET /api/v1/products (invalid token) | 401 Unauthorized | ☐ |
| ✅ SQL injection | GET /api/v1/products?id=' OR '1'='1 | 400 Bad Request | ☐ |
| ✅ XSS prevention | POST product with script tag | Sanitized/escaped | ☐ |

### 3.5 Integration Tests

| Test | Command | Expected | Status |
|------|---------|----------|--------|
| ✅ Full workflow | npm run test:e2e | All tests pass | ☐ |
| ✅ Search workflow | npm run test:search | All tests pass | ☐ |
| ✅ Bulk workflow | npm run test:bulk | All tests pass | ☐ |

---

## 4. Rollback Procedures

### 4.1 Application Rollback

```bash
# Option A: PM2 Rollback
# 1. List previous versions
pm2 list

# 2. Restore previous version
pm2 resurrect smart-tech-api@previous

# Option B: Docker Rollback
# 1. Rollback to previous image
docker-compose -f docker-compose.prod.yml pull smart-tech-api:v4.1.0
docker-compose -f docker-compose.prod.yml up -d

# Option C: Git Rollback
# 1. Revert to previous commit
git revert --no-commit <commit-hash>
git commit -m "Rollback to v4.1.0"
npm run build
pm2 restart smart-tech-api
```

### 4.2 Database Rollback

```bash
# 1. Identify migration to rollback
npx prisma migrate list

# 2. Rollback migration
npx prisma migrate rollback

# 3. Verify rollback
npm run db:verify

# 4. Restore from backup if needed
psql -U postgres -d smart_tech_b2c < backup_20260127_120000.sql
```

### 4.3 Elasticsearch Rollback

```bash
# 1. Delete current index
curl -X DELETE "localhost:9200/products"

# 2. Restore from snapshot (if available)
curl -X POST "localhost:9200/_snapshot/my_repo/snapshot_20260127/_restore"

# 3. Verify restoration
curl -X GET "localhost:9200/products/_count"
```

### 4.4 Emergency Rollback Checklist

| Step | Action | Verification |
|------|--------|--------------|
| 1 | Stop current deployment | pm2 stop / docker stop |
| 2 | Restore previous version | pm2 resurrect / docker pull previous |
| 3 | Start previous version | pm2 restart / docker start |
| 4 | Verify database compatibility | npm run db:verify |
| 5 | Test critical endpoints | npm run test:smoke |
| 6 | Notify stakeholders | Email/Slack |
| 7 | Document rollback reason | Incident report |

---

## 5. Troubleshooting Guide

### 5.1 Common Issues

#### Issue: Database Connection Failed

**Symptoms:**
- API returns 500 errors
- Health check shows database disconnected
- Application logs show connection timeout

**Solutions:**
```bash
# 1. Check database status
sudo systemctl status postgresql

# 2. Check connection
psql -h localhost -U postgres -d smart_tech_b2c

# 3. Check connection string in .env
cat .env | grep DATABASE_URL

# 4. Test connection
npm run db:verify

# 5. Restart database if needed
sudo systemctl restart postgresql
```

#### Issue: Elasticsearch Not Working

**Symptoms:**
- Search returns limited results
- Elasticsearch health check fails
- Application logs show connection errors

**Solutions:**
```bash
# 1. Check Elasticsearch status
curl -X GET "localhost:9200/_cluster/health"

# 2. Check version compatibility
curl -X GET "localhost:9200/"

# 3. Verify fallback is working
npm run app:health

# 4. Restart Elasticsearch
sudo systemctl restart elasticsearch

# 5. If version mismatch persists, use PostgreSQL fallback
# Application is configured to use PostgreSQL when ES is unavailable
```

#### Issue: High Memory Usage

**Symptoms:**
- Application slow
- OOM errors in logs
- Server swapping

**Solutions:**
```bash
# 1. Check memory usage
free -h
pm2 monit

# 2. Increase PM2 memory limit
pm2 restart smart-tech-api --max-memory-restart 1G

# 3. Optimize Prisma connection pool
# Edit .env: DATABASE_CONNECTION_LIMIT=10

# 4. Clear Redis cache
redis-cli FLUSHALL
```

#### Issue: Slow Search Performance

**Symptoms:**
- Search queries taking > 300ms
- User complaints about search speed

**Solutions:**
```bash
# 1. Check database indexes
npx prisma -d mysql -c "SHOW INDEX FROM Product;"

# 2. Add missing indexes
npx prisma migrate add performance_indexes

# 3. Check query performance
EXPLAIN ANALYZE SELECT * FROM "Product" WHERE name ILIKE '%phone%';

# 4. Optimize PostgreSQL settings
# Edit postgresql.conf: work_mem = 64MB
```

#### Issue: Authentication Failures

**Symptoms:**
- Users cannot log in
- Token validation errors
- 401 errors for valid requests

**Solutions:**
```bash
# 1. Check JWT secret
cat .env | grep NEXTAUTH_SECRET

# 2. Verify token format
# Decode JWT at jwt.io

# 3. Check token expiration
# Verify NEXTAUTH_URL is correct

# 4. Clear Redis session store
redis-cli FLUSHALL

# 5. Restart application
pm2 restart smart-tech-api
```

### 5.2 Log Analysis

```bash
# View recent errors
tail -n 100 /var/log/smart-tech-api/error.log

# Search for specific error
grep -i "database" /var/log/smart-tech-api/app.log

# Monitor logs in real-time
tail -f /var/log/smart-tech-api/combined.log

# Check PM2 logs
pm2 logs smart-tech-api --lines 200
```

### 5.3 Performance Monitoring

```bash
# Check CPU usage
top -bn1 | grep "Cpu(s)"

# Check disk usage
df -h

# Check network connections
netstat -tulpn | grep :3000

# Monitor database connections
SELECT count(*) FROM pg_stat_activity;

# Check Redis memory
redis-cli info memory
```

---

## 6. Environment Configuration

### 6.1 Required Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment mode | `production` |
| `DATABASE_URL` | Yes | PostgreSQL connection | `postgresql://...` |
| `NEXTAUTH_SECRET` | Yes | JWT secret key | `complex-secret-string` |
| `NEXTAUTH_URL` | Yes | Application URL | `https://api.example.com` |
| `ELASTICSEARCH_URL` | No | Elasticsearch URL | `http://localhost:9200` |
| `REDIS_URL` | No | Redis connection | `redis://localhost:6379` |
| `AWS_ACCESS_KEY_ID` | No | S3 access key | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | No | S3 secret key | `...` |
| `AWS_REGION` | No | AWS region | `us-east-1` |
| `AWS_S3_BUCKET` | No | S3 bucket name | `smart-tech-media` |

### 6.2 Optional Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Application port |
| `LOG_LEVEL` | `info` | Logging level |
| `CORS_ORIGIN` | `*` | Allowed CORS origins |
| `RATE_LIMIT_MAX` | 100 | Max requests per window |
| `RATE_LIMIT_WINDOW` | 60000 | Rate limit window (ms) |
| `DATABASE_POOL_SIZE` | 10 | Connection pool size |
| `PRISMA_QUERY_LOG` | `error` | Prisma query logging |
| `ES_INDEX_NAME` | `products` | Elasticsearch index |

### 6.3 Production .env Example

```env
# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:password@db.example.com:5432/smart_tech_b2c?schema=public

# Authentication
NEXTAUTH_SECRET=your-super-secret-key-here-min-32-chars
NEXTAUTH_URL=https://api.example.com

# Elasticsearch (Optional - PostgreSQL fallback available)
ELASTICSEARCH_URL=http://elasticsearch.example.com:9200

# Redis (Optional - for caching and sessions)
REDIS_URL=redis://redis.example.com:6379

# File Storage (AWS S3)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_S3_BUCKET=smart-tech-media

# Security
CORS_ORIGIN=https://www.example.com,https://app.example.com
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# Performance
DATABASE_POOL_SIZE=20
PRISMA_QUERY_LOG=error

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-license-key
```

---

## 7. Monitoring Setup

### 7.1 Health Check Endpoint

```javascript
// GET /api/health
{
  "status": "healthy",
  "timestamp": "2026-01-27T12:00:00Z",
  "version": "4.2.0",
  "services": {
    "database": {
      "status": "healthy",
      "latency": "2ms"
    },
    "elasticsearch": {
      "status": "degraded",
      "message": "Using PostgreSQL fallback"
    },
    "redis": {
      "status": "healthy",
      "latency": "1ms"
    }
  },
  "metrics": {
    "uptime": "86400s",
    "memory": "256MB",
    "cpu": "15%"
  }
}
```

### 7.2 Recommended Alerts

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| High Error Rate | Error rate > 5% for 5 min | Critical | Page on-call |
| High Latency | p95 > 1s for 5 min | Warning | Notify team |
| Database Disconnected | DB unreachable | Critical | Page on-call |
| Memory High | Memory > 80% | Warning | Scale up |
| Disk Full | Disk > 90% | Critical | Clean up |

### 7.3 Monitoring Dashboard Metrics

- **API Metrics:** Request count, response time, error rate
- **Database Metrics:** Query time, connections, cache hit rate
- **Search Metrics:** Search count, latency, result count
- **Business Metrics:** Products indexed, categories, brands

---

## 8. Quick Reference

### Deployment Commands

```bash
# Full deployment
npm run deploy:full

# Database migration only
npm run deploy:db

# Application restart
npm run deploy:app

# Rollback
npm run deploy:rollback

# Health check
npm run health:check

# Smoke test
npm run test:smoke
```

### Useful Links

- **API Documentation:** https://api.example.com/docs
- **Swagger UI:** https://api.example.com/api-docs
- **Monitoring:** https://monitoring.example.com
- **Logs:** https://logs.example.com
- **Alerts:** https://alerts.example.com

---

**Document Owner:** Development Team  
**Last Review:** January 27, 2026  
**Next Review:** April 27, 2026  
