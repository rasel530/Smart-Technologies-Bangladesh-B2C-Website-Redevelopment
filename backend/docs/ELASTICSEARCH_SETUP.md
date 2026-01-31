# Elasticsearch Setup Guide

## Phase 4 Milestone 2: Elasticsearch Integration

This guide provides comprehensive instructions for setting up and configuring Elasticsearch for the Smart Tech B2C E-commerce Platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Index Initialization](#index-initialization)
6. [Product Indexing](#product-indexing)
7. [Verification](#verification)
8. [Troubleshooting](#troubleshooting)
9. [Maintenance](#maintenance)

---

## Overview

Elasticsearch powers the advanced search functionality in Phase 4 Milestone 2, providing:

- **Full-text Search**: Search products by name, description, SKU with fuzzy matching
- **Bilingual Support**: Search in both English and Bangla
- **Faceted Search**: Filter by category, brand, price range, and status flags
- **Autocomplete**: Real-time search suggestions
- **Performance**: Sub-300ms response times for search queries

---

## Prerequisites

### System Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Disk | 20 GB SSD | 50+ GB SSD |
| Java | OpenJDK 11+ | OpenJDK 17 |

### Software Requirements

- Elasticsearch 7.x or 8.x
- Node.js 18+
- npm or yarn

---

## Installation

### Option 1: Docker Installation (Recommended)

```bash
# Create Docker network
docker network create smart-tech-network

# Run Elasticsearch container
docker run -d \
  --name elasticsearch \
  --network smart-tech-network \
  -p 9200:9200 \
  -p 9300:9300 \
  -e "discovery.type=single-node" \
  -e "ES_JAVA_OPTS=-Xms2g -Xmx2g" \
  -e "xpack.security.enabled=false" \
  docker.elastic.co/elasticsearch/elasticsearch:8.10.2
```

### Option 2: Manual Installation

#### Download and Install

**Linux (Ubuntu/Debian):**

```bash
# Install Java
sudo apt update
sudo apt install openjdk-17-jdk

# Download Elasticsearch
wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-8.10.2-amd64.deb

# Install Elasticsearch
sudo dpkg -i elasticsearch-8.10.2-amd64.deb

# Start Elasticsearch service
sudo systemctl start elasticsearch
sudo systemctl enable elasticsearch
```

**macOS:**

```bash
# Using Homebrew
brew install elasticsearch

# Start Elasticsearch
brew services start elasticsearch
```

**Windows:**

1. Download Elasticsearch from https://www.elastic.co/downloads/elasticsearch
2. Extract to `C:\elasticsearch`
3. Run `bin\elasticsearch.bat`

---

## Configuration

### Environment Variables

Create or update the `.env` file in the backend directory:

```env
# Elasticsearch Configuration
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_INDEX_PREFIX=smart_tech
ELASTICSEARCH_USERNAME=
ELASTICSEARCH_PASSWORD=

# Optional: Enable/disable Elasticsearch
ELASTICSEARCH_ENABLED=true
```

### Elasticsearch Configuration File

Edit `config/elasticsearch.yml`:

```yaml
# /etc/elasticsearch/elasticsearch.yml

cluster.name: smart-tech-cluster
node.name: node-1
network.host: 0.0.0.0
http.port: 9200

# Disable security for development (enable in production)
xpack.security.enabled: false

# Memory settings
bootstrap.memory_lock: true
ES_JAVA_OPTS="-Xms2g -Xmx2g"

# Performance settings
indices.memory.index_buffer_size: 20%
indices.queries.cache.size: 15%
```

### Backend Configuration

The backend uses `backend/config/elasticsearch.js`:

```javascript
const { Client } = require('@elastic/elasticsearch');

const elasticsearchConfig = {
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  indexPrefix: process.env.ELASTICSEARCH_INDEX_PREFIX || 'smart_tech',
  
  // Get Elasticsearch client
  getClient() {
    return new Client({
      node: this.node,
      auth: process.env.ELASTICSEARCH_USERNAME ? {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD
      } : undefined,
      maxRetries: 3,
      requestTimeout: 30000
    });
  },
  
  // Build index name with prefix
  buildIndexName(baseName) {
    return `${this.indexPrefix}_${baseName}`;
  },
  
  // Check if Elasticsearch is available
  async isAvailable() {
    try {
      const client = this.getClient();
      const health = await client.cluster.health();
      return health.status !== 'red';
    } catch (error) {
      return false;
    }
  },
  
  // Graceful degradation wrapper
  async withGracefulDegradation(elasticsearchFn, fallbackFn) {
    try {
      if (await this.isAvailable()) {
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

## Index Initialization

### Create Product Index

Run the index initialization script:

```bash
cd backend
node scripts/init-elasticsearch-index.js
```

### Index Mapping

The product index uses the following mapping:

```javascript
const productMapping = {
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
    analysis: {
      analyzer: {
        product_analyzer: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase', 'asciifolding', 'product_stemmer']
        }
      },
      filter: {
        product_stemmer: {
          type: 'stemmer',
          language: 'english'
        }
      }
    }
  },
  mappings: {
    properties: {
      id: { type: 'keyword' },
      sku: { type: 'keyword' },
      name: { 
        type: 'text',
        analyzer: 'product_analyzer',
        fields: {
          keyword: { type: 'keyword' }
        }
      },
      nameEn: { 
        type: 'text',
        analyzer: 'standard',
        fields: {
          keyword: { type: 'keyword' }
        }
      },
      nameBn: { 
        type: 'text',
        analyzer: 'standard'
      },
      slug: { type: 'keyword' },
      shortDescription: { type: 'text' },
      descriptionEn: { type: 'text' },
      descriptionBn: { type: 'text' },
      type: 'float' },
      discountPrice: { type: 'float' },
      salePrice basePrice: {: { type: 'float' },
      thumbnail: { type: 'keyword' },
      rating: { type: 'float' },
      reviewCount: { type: 'integer' },
      inStock: { type: 'boolean' },
      isFeatured: { type: 'boolean' },
      isNewArrival: { type: 'boolean' },
      isBestSeller: { type: 'boolean' },
      status: { type: 'keyword' },
      visibility: { type: 'keyword' },
      categoryId: { type: 'keyword' },
      categoryName: { type: 'keyword' },
      categoryNameEn: { type: 'keyword' },
      categoryNameBn: { type: 'keyword' },
      brandId: { type: 'keyword' },
      brandName: { type: 'keyword' },
      brandNameEn: { type: 'keyword' },
      brandNameBn: { type: 'keyword' },
      createdAt: { type: 'date' },
      updatedAt: { type: 'date' }
    }
  }
};
```

### Create Index Script

```javascript
// scripts/init-elasticsearch-index.js

const { elasticsearchConfig } = require('../config/elasticsearch');

async function initializeIndex() {
  const client = elasticsearchConfig.getClient();
  const indexName = elasticsearchConfig.buildIndexName('products');

  try {
    // Check if index exists
    const exists = await client.indices.exists({ index: indexName });
    
    if (exists) {
      console.log(`Index ${indexName} already exists`);
      return;
    }

    // Create index with mapping
    await client.indices.create({
      index: indexName,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          analysis: {
            analyzer: {
              product_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'asciifolding']
              }
            }
          }
        },
        mappings: {
          properties: {
            id: { type: 'keyword' },
            sku: { type: 'keyword' },
            name: { type: 'text', analyzer: 'product_analyzer' },
            nameEn: { type: 'text', analyzer: 'standard' },
            nameBn: { type: 'text', analyzer: 'standard' },
            slug: { type: 'keyword' },
            shortDescription: { type: 'text' },
            basePrice: { type: 'float' },
            discountPrice: { type: 'float' },
            salePrice: { type: 'float' },
            thumbnail: { type: 'keyword' },
            rating: { type: 'float' },
            reviewCount: { type: 'integer' },
            inStock: { type: 'boolean' },
            isFeatured: { type: 'boolean' },
            isNewArrival: { type: 'boolean' },
            isBestSeller: { type: 'boolean' },
            status: { type: 'keyword' },
            visibility: { type: 'keyword' },
            categoryId: { type: 'keyword' },
            categoryNameEn: { type: 'keyword' },
            brandId: { type: 'keyword' },
            brandNameEn: { type: 'keyword' },
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' }
          }
        }
      }
    });

    console.log(`Index ${indexName} created successfully`);
  } catch (error) {
    console.error('Failed to create index:', error);
    process.exit(1);
  }
}

initializeIndex();
```

---

## Product Indexing

### Index a Single Product

```javascript
const { elasticsearchConfig } = require('../config/elasticsearch');

async function indexProduct(product) {
  const client = elasticsearchConfig.getClient();
  const indexName = elasticsearchConfig.buildIndexName('products');

  const document = {
    id: product.id,
    sku: product.sku,
    name: product.name,
    nameEn: product.nameEn,
    nameBn: product.nameBn,
    slug: product.slug,
    shortDescription: product.shortDescription,
    basePrice: parseFloat(product.regularPrice),
    discountPrice: product.salePrice ? parseFloat(product.salePrice) : null,
    salePrice: product.salePrice ? parseFloat(product.salePrice) : null,
    thumbnail: product.images[0]?.url || null,
    rating: 0,
    reviewCount: 0,
    inStock: product.stockQuantity > 0,
    isFeatured: product.isFeatured,
    isNewArrival: product.isNewArrival,
    isBestSeller: product.isBestSeller,
    status: product.status,
    visibility: product.visibility,
    categoryId: product.categories[0]?.categoryId || null,
    categoryNameEn: product.categories[0]?.category?.nameEn || null,
    brandId: product.brandId,
    brandNameEn: product.brand?.nameEn || null,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };

  await client.index({
    index: indexName,
    id: product.id,
    body: document,
    refresh: true
  });
}
```

### Bulk Index Products

```javascript
async function bulkIndexProducts(products) {
  const client = elasticsearchConfig.getClient();
  const indexName = elasticsearchConfig.buildIndexName('products');

  const operations = products.flatMap(product => [
    { index: { _index: indexName, _id: product.id } },
    {
      id: product.id,
      sku: product.sku,
      name: product.name,
      nameEn: product.nameEn,
      nameBn: product.nameBn,
      slug: product.slug,
      shortDescription: product.shortDescription,
      basePrice: parseFloat(product.regularPrice),
      status: product.status,
      visibility: product.visibility,
      isFeatured: product.isFeatured,
      isNewArrival: product.isNewArrival,
      isBestSeller: product.isBestSeller,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }
  ]);

  const result = await client.bulk({ body: operations, refresh: true });
  return result;
}
```

### Full Indexing Script

```javascript
// scripts/reindex-all-products.js

const { PrismaClient } = require('@prisma/client');
const { elasticsearchConfig } = require('../config/elasticsearch');

const prisma = new PrismaClient();

async function reindexAllProducts() {
  console.log('Starting full product reindex...');

  const client = elasticsearchConfig.getClient();
  const indexName = elasticsearchConfig.buildIndexName('products');

  try {
    // Delete existing index
    const exists = await client.indices.exists({ index: indexName });
    if (exists) {
      await client.indices.delete({ index: indexName });
      console.log('Deleted existing index');
    }

    // Recreate index
    await initializeIndex();

    // Fetch all products
    const products = await prisma.product.findMany({
      include: {
        categories: {
          include: {
            category: {
              select: { id: true, nameEn: true }
            }
          }
        },
        brand: {
          select: { id: true, nameEn: true }
        },
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 1
        }
      }
    });

    console.log(`Found ${products.length} products to index`);

    // Bulk index in batches
    const batchSize = 100;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      await bulkIndexProducts(batch);
      console.log(`Indexed ${Math.min(i + batchSize, products.length)}/${products.length} products`);
    }

    console.log('Full reindex completed successfully');
  } catch (error) {
    console.error('Reindex failed:', error);
    process.exit(1);
  }
}

reindexAllProducts();
```

---

## Verification

### Health Check

```bash
curl http://localhost:9200/_cluster/health
```

Expected response:

```json
{
  "cluster_name": "smart-tech-cluster",
  "status": "green",
  "timed_out": false,
  "number_of_nodes": 1,
  "number_of_data_nodes": 1,
  "active_primary_shards": 1,
  "active_shards": 1
}
```

### Test Search

```bash
curl -X GET "localhost:9200/smart_tech_products/_search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "multi_match": {
        "query": "iphone",
        "fields": ["nameEn^3", "nameBn^2.5", "descriptionEn^1.5"]
      }
    }
  }'
```

### Test Indexing

```bash
# Index a test document
curl -X PUT "localhost:9200/smart_tech_products/_doc/test-001" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-001",
    "sku": "TEST-001",
    "nameEn": "Test Product",
    "nameBn": "টেস্ট প্রোডাক্ট",
    "slug": "test-product",
    "basePrice": 99.99,
    "status": "active",
    "visibility": "public"
  }'

# Verify indexing
curl "localhost:9200/smart_tech_products/_doc/test-001"
```

---

## Troubleshooting

### Common Issues

#### 1. Elasticsearch Won't Start

**Problem**: Elasticsearch service fails to start

**Solution**:

```bash
# Check Java installation
java -version

# Check Elasticsearch logs
tail -f /var/log/elasticsearch/smart-tech-cluster.log

# Fix memory lock issue (if using systemd)
sudo systemctl edit elasticsearch
# Add:
# [Service]
# LimitMEMLOCK=infinity
```

#### 2. Connection Refused

**Problem**: Cannot connect to Elasticsearch

**Solution**:

```bash
# Check if Elasticsearch is running
curl http://localhost:9200

# Check port binding
netstat -tlnp | grep 9200

# Verify configuration
cat /etc/elasticsearch/elasticsearch.yml | grep network.host
```

#### 3. Out of Memory

**Problem**: Elasticsearch runs out of memory

**Solution**:

```bash
# Increase heap size
# Edit /etc/elasticsearch/jvm.options
-Xms4g
-Xmx4g

# Or set environment variable
ES_JAVA_OPTS="-Xms4g -Xmx4g"
```

#### 4. Index Missing

**Problem**: Index doesn't exist

**Solution**:

```bash
# List all indices
curl "localhost:9200/_cat/indices?v"

# Recreate index
node backend/scripts/init-elasticsearch-index.js
```

#### 5. Search Returns No Results

**Problem**: Search queries return empty results

**Solution**:

```bash
# Check document count
curl "localhost:9200/smart_tech_products/_count"

# Verify mapping
curl "localhost:9200/smart_tech_products/_mapping"

# Reindex products
node backend/scripts/reindex-all-products.js
```

### Debug Mode

Enable debug logging in `config/elasticsearch.js`:

```javascript
const { Client } = require('@elastic/elasticsearch');

const client = new Client({
  node: process.env.ELASTICSEARCH_NODE,
  log: ['info', 'debug'], // Enable debug logging
  trace: {
    elasticsearch: true // Trace Elasticsearch requests
  }
});
```

---

## Maintenance

### Regular Maintenance Tasks

#### 1. Index Optimization

```bash
# Force merge segments (run during low traffic)
curl -X POST "localhost:9200/smart_tech_products/_forcemerge?max_num_segments=1"
```

#### 2. Index Statistics

```bash
# Get index statistics
curl "localhost:9200/smart_tech_products/_stats"

# Get index status
curl "localhost:9200/_cat/indices/smart_tech_products?v"
```

#### 3. Backup and Restore

```bash
# Create snapshot repository
curl -X PUT "localhost:9200/_snapshot/my_backup" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "fs",
    "settings": {
      "location": "/backup/elasticsearch"
    }
  }'

# Create snapshot
curl -X PUT "localhost:9200/_snapshot/my_backup/snapshot_001"

# Restore snapshot
curl -X POST "localhost:9200/_snapshot/my_backup/snapshot_001/_restore"
```

### Monitoring

Use Elasticsearch's built-in monitoring or tools like Kibana:

```bash
# Get node stats
curl "localhost:9200/_nodes/stats"

# Get cluster stats
curl "localhost:9200/_cluster/stats"
```

---

## Security (Production)

### Enable Security

```yaml
# elasticsearch.yml
xpack.security.enabled: true
xpack.security.transport.ssl.enabled: true
```

### Generate Certificates

```bash
# Generate CA certificate
elasticsearch-certutil ca --out elastic-stack-ca.p12 --pass

# Generate node certificate
elasticsearch-certutil cert --ca elastic-stack-ca.p12 --out elastic-certificates.p12 --pass
```

### Set Passwords

```bash
# Use interactive mode
elasticsearch-setup-passwords interactive

# Or use bootstrap password
elasticsearch-setup-passwords auto
```

### Configure Backend Authentication

```env
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your-password
```

---

## Support

For Elasticsearch-related issues:

1. Check the [Elasticsearch Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
2. Review the troubleshooting section above
3. Contact: api-support@smarttech.com

---

## Quick Reference

### Essential Commands

| Command | Description |
|---------|-------------|
| `curl localhost:9200` | Health check |
| `curl localhost:9200/_cluster/health` | Cluster health |
| `curl localhost:9200/_cat/indices?v` | List indices |
| `curl localhost:9200/<index>/_search` | Search index |
| `node scripts/init-elasticsearch-index.js` | Initialize index |
| `node scripts/reindex-all-products.js` | Reindex all products |

### File Locations

| Path | Description |
|------|-------------|
| `/etc/elasticsearch/elasticsearch.yml` | Elasticsearch config |
| `/var/log/elasticsearch/` | Log files |
| `/var/lib/elasticsearch/` | Data directory |
| `backend/config/elasticsearch.js` | Backend config |
| `backend/scripts/` | Indexing scripts |

**Version**: 4.2.0  
**Last Updated**: 2024
