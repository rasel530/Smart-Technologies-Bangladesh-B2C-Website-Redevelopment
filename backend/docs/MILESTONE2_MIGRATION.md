# Phase 4 Milestone 2 Migration Guide

## Database Migration and Configuration Changes

This guide provides step-by-step instructions for migrating to Phase 4 Milestone 2, including database changes, Elasticsearch setup, and configuration updates.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Database Migration](#database-migration)
4. [Elasticsearch Setup](#elasticsearch-setup)
5. [Configuration Updates](#configuration-updates)
6. [Deployment Steps](#deployment-steps)
7. [Rollback Procedures](#rollback-procedures)
8. [Verification](#verification)

---

## Overview

Phase 4 Milestone 2 introduces:

- **New SearchLog Table**: For tracking search analytics
- **Elasticsearch Integration**: Full-text product search
- **Updated Product Status Values**: New enum values for product status
- **Bulk Operations**: Batch processing for products, categories, and brands

### Migration Summary

| Change | Type | Downtime Required |
|--------|------|-------------------|
| SearchLog table | New table | No |
| Product status enum | Extended | No |
| Elasticsearch index | New | Yes |
| Configuration updates | Modified | No |

---

## Prerequisites

### System Requirements

- PostgreSQL 13+
- Elasticsearch 7.x or 8.x
- Node.js 18+
- 500MB free disk space

### Backup Requirements

Before starting migration:

```bash
# Backup database
pg_dump -h localhost -U postgres -d smart_tech > backup_pre_milestone2.sql

# Backup configuration files
cp backend/.env backend/.env.backup
cp backend/config/elasticsearch.js backend/config/elasticsearch.js.backup
```

---

## Database Migration

### Step 1: Run Database Migration

Create and run the Prisma migration:

```bash
cd backend

# Generate migration file
npx prisma migrate dev --name milestone2_search_log

# Or apply migration directly
npx prisma migrate deploy
```

### Migration SQL

The migration creates the following:

```sql
-- Create SearchLog table
CREATE TABLE "search_logs" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
    "query" VARCHAR(500) NOT NULL,
    "user_id" UUID,
    "results_count" INTEGER DEFAULT 0,
    "execution_time" DOUBLE PRECISION DEFAULT 0,
    "filters" JSONB DEFAULT '{}',
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT "search_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create indexes for SearchLog
CREATE INDEX "search_logs_user_id_idx" ON "search_logs"("user_id");
CREATE INDEX "search_logs_timestamp_idx" ON "search_logs"("timestamp");
CREATE INDEX "search_logs_query_idx" ON "search_logs"("query");

-- Extend ProductStatus enum (if using PostgreSQL enum)
-- Note: If not using enum type, no change needed
```

### Step 2: Verify Migration

```bash
# Check table exists
psql -d smart_tech -c "\d search_logs"

# Verify indexes
psql -d smart_tech -c "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'search_logs';"

# Check for any failed migrations
npx prisma migrate status
```

### Step 3: Generate Prisma Client

```bash
# Regenerate Prisma client
npx prisma generate

# Verify client includes new models
grep -i "searchlog" node_modules/.prisma/client/index.d.ts
```

---

## Elasticsearch Setup

### Step 1: Install Elasticsearch (if not already installed)

See [ELASTICSEARCH_SETUP.md](ELASTICSEARCH_SETUP.md) for detailed instructions.

### Step 2: Initialize Elasticsearch Index

```bash
cd backend

# Initialize product search index
node scripts/init-elasticsearch-index.js

# Expected output:
# Index smart_tech_products created successfully
```

### Step 3: Index Existing Products

```bash
# Index all existing products
node scripts/reindex-all-products.js

# Expected output:
# Starting full product reindex...
# Found 150 products to index
# Indexed 100/150 products
# Indexed 150/150 products
# Full reindex completed successfully
```

### Step 4: Verify Elasticsearch

```bash
# Check cluster health
curl http://localhost:9200/_cluster/health

# Check index exists
curl http://localhost:9200/_cat/indices/smart_tech_products?v

# Verify documents exist
curl http://localhost:9200/smart_tech_products/_count
```

---

## Configuration Updates

### Step 1: Update Environment Variables

Add or update the following in `backend/.env`:

```env
# ============================================
# Phase 4 Milestone 2 - Elasticsearch Configuration
# ============================================

# Elasticsearch
ELASTICSEARCH_ENABLED=true
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_INDEX_PREFIX=smart_tech

# Optional: Authentication (enable in production)
# ELASTICSEARCH_USERNAME=elastic
# ELASTICSEARCH_PASSWORD=your_password

# ============================================
# Phase 4 Milestone 2 - Bulk Operations
# ============================================

# Bulk operation limits
BULK_OPERATION_MAX_ITEMS=100
CSV_IMPORT_MAX_SIZE=5242880
```

### Step 2: Install Required Dependencies

```bash
cd backend

# Install Elasticsearch client
npm install @elastic/elasticsearch

# Install CSV parser (if not already installed)
npm install csv-parser
```

### Step 3: Update Configuration Files

The following configuration files should be updated:

#### backend/config/elasticsearch.js (New File)

```javascript
const { Client } = require('@elastic/elasticsearch');

const elasticsearchConfig = {
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  indexPrefix: process.env.ELASTICSEARCH_INDEX_PREFIX || 'smart_tech',
  
  getClient() {
    return new Client({
      node: this.node,
      maxRetries: 3,
      requestTimeout: 30000
    });
  },
  
  buildIndexName(baseName) {
    return `${this.indexPrefix}_${baseName}`;
  },
  
  async isAvailable() {
    try {
      const client = this.getClient();
      const health = await client.cluster.health();
      return health.status !== 'red';
    } catch (error) {
      return false;
    }
  },
  
  async withGracefulDegradation(elasticsearchFn, fallbackFn) {
    try {
      if (await this.isAvailable() && process.env.ELASTICSEARCH_ENABLED === 'true') {
        return await elasticsearchFn();
      }
    } catch (error) {
      console.warn('Elasticsearch unavailable, using fallback:', error.message);
    }
    return await fallbackFn();
  }
};

module.exports = { elasticsearchConfig };
```

---

## Deployment Steps

### Step 1: Prepare Environment

```bash
# On production server
cd /path/to/backend

# Create backup
cp .env .env.backup.$(date +%Y%m%d)

# Pull latest changes
git pull origin main

# Install dependencies
npm install
```

### Step 2: Run Database Migration

```bash
# Run migrations
npx prisma migrate deploy

# Generate client
npx prisma generate

# Verify migration
npx prisma migrate status
```

### Step 3: Initialize Elasticsearch

```bash
# Initialize index
node scripts/init-elasticsearch-index.js

# Index products
node scripts/reindex-all-products.js
```

### Step 4: Start Application

```bash
# Build application (if using TypeScript)
npm run build

# Start with PM2 or similar
pm2 restart smart-tech-backend

# Or use systemd
sudo systemctl restart smart-tech-backend
```

### Step 5: Verify Deployment

```bash
# Check application logs
pm2 logs smart-tech-backend --lines 50

# Test API endpoints
curl http://localhost:3000/api/v1/search?q=iphone

# Check Elasticsearch integration
curl http://localhost:9200/_cluster/health
```

---

## Rollback Procedures

### Database Rollback

```bash
# Option 1: Rollback last migration
npx prisma migrate down

# Option 2: Manual rollback
psql -d smart_tech -c "DROP TABLE IF EXISTS search_logs;"

# Restore from backup
psql -d smart_tech < backup_pre_milestone2.sql
```

### Elasticsearch Rollback

```bash
# Delete product index
curl -X DELETE "localhost:9200/smart_tech_products"

# Optional: Restore from backup
# (if snapshots were created)
curl -X POST "localhost:9200/_snapshot/my_backup/snapshot_001/_restore"
```

### Configuration Rollback

```bash
# Restore environment file
cp backend/.env.backup backend/.env

# Restore config files
cp backend/config/elasticsearch.js.backup backend/config/elasticsearch.js
```

### Full Rollback Checklist

- [ ] Database migration rolled back
- [ ] Elasticsearch index deleted
- [ ] Environment variables restored
- [ ] Application restarted
- [ ] Health checks passing

---

## Verification

### API Endpoint Tests

```bash
# Test search endpoint
curl -s http://localhost:3000/api/v1/search?q=iphone | jq '.products | length'

# Test suggestions endpoint
curl -s "http://localhost:3000/api/v1/search/suggestions?q=iph" | jq '.suggestions | length'

# Test facets endpoint
curl -s http://localhost:3000/api/v1/search/facets | jq '.facets | keys'

# Test bulk operations (requires auth)
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password"}' | jq -r '.token')

curl -X POST http://localhost:3000/api/v1/products/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"products":[]}'
```

### Elasticsearch Verification

```bash
# Check cluster health
echo "Cluster Health:"
curl -s http://localhost:9200/_cluster/health | jq '{status, number_of_nodes}'

# Check index
echo -e "\nIndex Status:"
curl -s "http://localhost:9200/_cat/indices/smart_tech_products?v"

# Test search
echo -e "\nSearch Test:"
curl -s -X GET "localhost:9200/smart_tech_products/_search" \
  -H "Content-Type: application/json" \
  -d '{"query":{"match_all":{}}}' | jq '.hits.total.value'
```

### Database Verification

```bash
# Check SearchLog table
psql -d smart_tech -c "SELECT COUNT(*) FROM search_logs;"

# Check for search logs after API usage
psql -d smart_tech -c "SELECT query, results_count, execution_time FROM search_logs ORDER BY timestamp DESC LIMIT 10;"
```

---

## Troubleshooting

### Common Issues

#### Migration Fails

```bash
# Check migration logs
npx prisma migrate status

# Reset migration state (development only)
npx prisma migrate reset

# Manual fix
psql -d smart_tech -c "DELETE FROM _prisma_migrations WHERE migration_name LIKE '%milestone2%';"
```

#### Elasticsearch Connection Failed

```bash
# Check Elasticsearch status
curl http://localhost:9200

# Check configuration
cat backend/.env | grep ELASTICSEARCH

# Restart Elasticsearch
sudo systemctl restart elasticsearch
```

#### No Search Results

```bash
# Reindex products
node scripts/reindex-all-products.js

# Check index mapping
curl "localhost:9200/smart_tech_products/_mapping"

# Verify product data
curl "localhost:9200/smart_tech_products/_search" -H "Content-Type: application/json" -d '{"query":{"match_all":{}},"size":1}'
```

#### Bulk Operations Fail

```bash
# Check authentication
curl -v http://localhost:3000/api/v1/products/bulk

# Verify admin role
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/auth/me | jq '.role'

# Check request size limits
# Verify in nginx.conf or similar
client_max_body_size 10M;
```

---

## Checklist

### Pre-Migration

- [ ] Database backup created
- [ ] Configuration backup created
- [ ] Elasticsearch installed and running
- [ ] Node.js dependencies updated
- [ ] Sufficient disk space available

### During Migration

- [ ] Database migration successful
- [ ] Prisma client regenerated
- [ ] Elasticsearch index created
- [ ] Products indexed successfully
- [ ] Environment variables updated
- [ ] Application restarted successfully

### Post-Migration

- [ ] Search API working
- [ ] Bulk operations working
- [ ] CSV import/export working
- [ ] Search analytics logging
- [ ] Error handling verified
- [ ] Performance acceptable

---

## Support

For migration assistance:

1. Check troubleshooting section above
2. Review application logs: `pm2 logs smart-tech-backend`
3. Contact: api-support@smarttech.com

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024 | Initial migration guide |

**Version**: 1.0.0  
**Last Updated**: 2024
