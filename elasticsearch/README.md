# Elasticsearch Configuration for Smart Technologies B2C Website

This directory contains the Elasticsearch configuration files for the Smart Technologies Bangladesh B2C Website Redevelopment project.

## Directory Structure

```
elasticsearch/
├── README.md                    # This documentation file
├── elasticsearch.yml            # Main Elasticsearch configuration
├── init/
│   ├── products-mapping.json    # Products index mapping template
│   └── sample-products.json     # Sample product data for testing
└── scripts/
    ├── init-indices.sh          # Initialization script for indices
    ├── test-elasticsearch.sh    # Test script for connectivity and functionality
    └── setup-elasticsearch.sh   # Complete setup script for easy deployment
```

## Configuration Overview

### Environment Variables

The following environment variables are configured in the project's `.env` file:

- `ELASTICSEARCH_VERSION=8.11.0` - Elasticsearch version
- `ELASTICSEARCH_PORT=9200` - HTTP port for Elasticsearch
- `ELASTICSEARCH_JAVA_OPTS=-Xms2g -Xmx2g` - JVM heap size settings
- `ELASTICSEARCH_HOST=elasticsearch` - Hostname for internal Docker communication
- `ELASTICSEARCH_URL=http://elasticsearch:9200` - URL for backend application connection

### Main Configuration (elasticsearch.yml)

The Elasticsearch configuration includes:

- **Cluster Settings**: Single-node cluster named `smarttech-cluster`
- **Network**: Binds to all interfaces on port 9200
- **Security**: Disabled for development environment
- **Performance**: Optimized settings for e-commerce workloads
- **Custom Analyzers**: Specialized analyzers for product search

## Custom Analyzers

### Product Name Analyzer
- **Tokenizer**: Standard
- **Filters**: lowercase, stop, stemmer, word_delimiter_graph
- **Purpose**: Enhanced product name search with stemming and word splitting

### Product Search Analyzer
- **Tokenizer**: Keyword
- **Filters**: lowercase, ascii_folding, trim
- **Purpose**: Exact matching with case insensitivity and ASCII folding

### Description Analyzer
- **Tokenizer**: Standard
- **Filters**: lowercase, stop, stemmer, synonym
- **Purpose**: Full-text search in product descriptions with synonym support

### Category Analyzer
- **Tokenizer**: Keyword
- **Filters**: lowercase, trim
- **Purpose**: Exact category matching with case insensitivity

## Index Mappings

### Products Index

The products index includes the following field types:

| Field | Type | Description |
|-------|------|-------------|
| id | keyword | Unique product identifier |
| name | text | Product name with custom analyzers |

### Quick Setup (Recommended)

For a complete setup including Elasticsearch startup, index initialization, and testing:

```bash
# Navigate to elasticsearch/scripts directory
cd elasticsearch/scripts

# Run the complete setup script
./setup-elasticsearch.sh
```

This script will:
- Check Docker and docker-compose availability
- Start Elasticsearch container
- Wait for Elasticsearch to be ready
- Initialize indices with mappings
- Load sample product data
- Run connectivity and functionality tests
- Display useful URLs and commands

### Manual Setup

If you prefer to set up manually:

#### Starting Elasticsearch

1. Ensure Docker is running
2. Navigate to the project root directory
3. Run the following command:
   ```bash
   docker-compose up -d elasticsearch
   ```

#### Initializing Indices

After starting Elasticsearch, you can initialize the indices using the provided script:

```bash
# Execute the initialization script inside the Elasticsearch container
docker-compose exec elasticsearch /usr/share/elasticsearch/scripts/init-indices.sh
```

The script will:
- Wait for Elasticsearch to be ready
- Create the products index template
- Create the initial products index
- Load sample product data (if available)
- Verify the indices were created successfully

#### Testing Elasticsearch

To verify that Elasticsearch is working correctly:

```bash
# Run the test script inside the Elasticsearch container
docker-compose exec elasticsearch /usr/share/elasticsearch/scripts/test-elasticsearch.sh
```

The test script will:
- Check cluster health
- Verify node information
- Test basic index operations (create, index, search, delete)
- Validate products index and mappings
- Test custom analyzers

| description | text | Product description with full-text search |
| price | double | Product price with scaled_float field |
| stock_quantity | integer | Available stock quantity |
| category | text | Product category |
| is_active | boolean | Product availability status |
| created_at/updated_at | date | Timestamps |
| tags | keyword | Product tags |
| brand | text | Product brand |
| sku | keyword | Stock keeping unit |
| weight | double | Product weight |
| dimensions | object | Product dimensions (length, width, height) |
| images | object | Product images with metadata |
| variants | nested | Product variants with attributes |
| attributes | object | Dynamic product attributes |
| rating | double | Average product rating |
| review_count | integer | Number of reviews |
| sales_count | integer | Number of sales |
| view_count | integer | Number of views |

## Usage Instructions

### Starting Elasticsearch

1. Ensure Docker is running
2. Navigate to the project root directory
3. Run the following command:
   ```bash
   docker-compose up -d elasticsearch
   ```

### Initializing Indices

After starting Elasticsearch, you can initialize the indices using the provided script:

```bash
# Execute the initialization script inside the Elasticsearch container
docker-compose exec elasticsearch /usr/share/elasticsearch/scripts/init-indices.sh
```

The script will:
- Wait for Elasticsearch to be ready
- Create the products index template
- Create the initial products index
- Verify the indices were created successfully

### Manual Index Creation

If you prefer to create indices manually:

```bash
# Create products index with mapping
curl -X PUT "localhost:9200/products" \
  -H "Content-Type: application/json" \
  -d @elasticsearch/init/products-mapping.json
```

## API Examples

### Basic Product Search

```bash
# Search for products by name
curl -X GET "localhost:9200/products/_search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "match": {
        "name": "smartphone"
      }
    }
  }'
```

### Filter by Category and Price Range

```bash
curl -X GET "localhost:9200/products/_search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "bool": {
        "must": [
          {"term": {"category.keyword": "Electronics"}},
          {"range": {"price": {"gte": 100, "lte": 500}}}
        ]
      }
    }
  }'
```

### Autocomplete Suggestions

```bash
curl -X GET "localhost:9200/products/_search" \
  -H "Content-Type: application/json" \
  -d '{
    "suggest": {
      "product_suggest": {
        "prefix": "smart",
        "completion": {
          "field": "name.suggest"
        }
      }
    }
  }'
```

### Aggregation by Category

```bash
curl -X GET "localhost:9200/products/_search" \
  -H "Content-Type: application/json" \
  -d '{
    "size": 0,
    "aggs": {
      "categories": {
        "terms": {
          "field": "category.keyword"
        }
      }
    }
  }'
```

## Monitoring and Maintenance

### Health Check

```bash
# Check cluster health
curl -X GET "localhost:9200/_cluster/health?pretty"

# Check indices status
curl -X GET "localhost:9200/_cat/indices?v"
```

### Performance Tuning

The configuration includes performance optimizations for e-commerce workloads:

- **Index Buffer Size**: 10% of heap memory
- **Query Cache**: 5% of heap memory
- **Field Data Cache**: 40% of heap memory
- **Thread Pool**: Optimized for search and write operations

## Troubleshooting

### Common Issues

1. **Out of Memory Errors**: Increase `ELASTICSEARCH_JAVA_OPTS` in `.env`
2. **Connection Refused**: Ensure Elasticsearch is running and port 9200 is accessible
3. **Index Creation Fails**: Check mapping syntax and field definitions

### Logs

View Elasticsearch logs:

```bash
docker-compose logs -f elasticsearch
```

## Security Considerations

This configuration is optimized for development environments. For production:

1. Enable security features (`xpack.security.enabled=true`)
2. Set up proper authentication and authorization
3. Configure SSL/TLS encryption
4. Implement proper firewall rules
5. Regularly update Elasticsearch to the latest stable version

## Additional Resources

- [Elasticsearch Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Elasticsearch Query DSL](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html)
- [Elasticsearch Analyzers](https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis.html)