# Qdrant Vector Database Setup

This directory contains the configuration and documentation for Qdrant, a vector similarity search engine used in the Smart Technologies B2C Website project.

## Overview

Qdrant is used to store and search vector embeddings for:
- Product similarity recommendations
- Content-based search
- AI-powered features
- Semantic search capabilities

## Configuration

### Docker Compose Service

The Qdrant service is defined in the root `docker-compose.yml` file with the following configuration:

```yaml
qdrant:
  image: qdrant/qdrant:${QDRANT_VERSION:-latest}
  container_name: smarttech_qdrant
  restart: unless-stopped
  ports:
    - "${QDRANT_PORT:-6333}:6333"
    - "${QDRANT_GRPC_PORT:-6334}:6334"
  volumes:
    - qdrant_data:/qdrant/storage
    - ./qdrant/qdrant.yml:/qdrant/config/production.yaml:ro
  environment:
    - QDRANT__SERVICE__HTTP_PORT=${QDRANT_PORT:-6333}
    - QDRANT__SERVICE__GRPC_PORT=${QDRANT_GRPC_PORT:-6334}
    - QDRANT__LOG_LEVEL=${QDRANT_LOG_LEVEL:-INFO}
  networks:
    - smarttech_network
  healthcheck:
    test: ["CMD-SHELL", "curl -f http://localhost:${QDRANT_PORT:-6333}/health || exit 1"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 30s
```

### Environment Variables

You can configure Qdrant using the following environment variables in your `.env` file:

```bash
# Qdrant configuration
QDRANT_VERSION=latest
QDRANT_PORT=6333
QDRANT_GRPC_PORT=6334
QDRANT_LOG_LEVEL=INFO
```

## Usage

### Starting Qdrant

```bash
# Start all services including Qdrant
docker-compose up -d

# Start only Qdrant
docker-compose up -d qdrant
```

### Accessing Qdrant

- **REST API**: http://localhost:6333
- **gRPC API**: localhost:6334
- **Web UI**: http://localhost:6333/dashboard (if enabled)

### API Examples

#### Health Check

```bash
curl http://localhost:6333/health
```

#### Create Collection

```bash
curl -X PUT http://localhost:6333/collections/products \
  -H "Content-Type: application/json" \
  -d '{
    "vectors": {
      "size": 384,
      "distance": "Cosine"
    }
  }'
```

#### Insert Vectors

```bash
curl -X POST http://localhost:6333/collections/products/points \
  -H "Content-Type: application/json" \
  -d '{
    "points": [
      {
        "id": 1,
        "vector": [0.1, 0.2, 0.3, ...],
        "payload": {
          "product_id": "prod_001",
          "name": "Sample Product",
          "category": "electronics"
        }
      }
    ]
  }'
```

#### Search Vectors

```bash
curl -X POST http://localhost:6333/collections/products/search \
  -H "Content-Type: application/json" \
  -d '{
    "vector": [0.1, 0.2, 0.3, ...],
    "limit": 10,
    "with_payload": true,
    "with_vector": false
  }'
```

## Integration with Application

### Python Client Example

```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

# Initialize client
client = QdrantClient(host="localhost", port=6333)

# Create collection
client.create_collection(
    collection_name="products",
    vectors_config=VectorParams(size=384, distance=Distance.COSINE),
)

# Insert vectors
client.upsert(
    collection_name="products",
    points=[
        PointStruct(
            id=1,
            vector=[0.1, 0.2, 0.3, ...],
            payload={"product_id": "prod_001", "name": "Sample Product"}
        )
    ]
)

# Search
search_result = client.search(
    collection_name="products",
    query_vector=[0.1, 0.2, 0.3, ...],
    limit=10
)
```

### Node.js Client Example

```javascript
const { QdrantClient } = require('@qdrant/js-client-rest');

// Initialize client
const client = new QdrantClient({ host: 'localhost', port: 6333 });

// Create collection
await client.createCollection('products', {
  vectors: {
    size: 384,
    distance: 'Cosine'
  }
});

// Insert vectors
await client.upsert('products', {
  points: [
    {
      id: 1,
      vector: [0.1, 0.2, 0.3, ...],
      payload: { product_id: 'prod_001', name: 'Sample Product' }
    }
  ]
});

// Search
const searchResult = await client.search('products', {
  vector: [0.1, 0.2, 0.3, ...],
  limit: 10
});
```

## Monitoring and Maintenance

### Logs

```bash
# View Qdrant logs
docker-compose logs -f qdrant

# View last 100 lines
docker-compose logs --tail=100 qdrant
```

### Backup

```bash
# Create backup
docker-compose exec qdrant wget http://localhost:6333/snapshots -O backup.json

# Restore from backup
docker-compose exec -T qdrant curl -X POST http://localhost:6333/snapshots/restore \
  -H "Content-Type: application/json" \
  --data-binary @backup.json
```

### Performance Tuning

The configuration can be adjusted in `qdrant.yml`:

- `performance.max_search_threads`: Number of parallel search threads
- `performance.update_threads`: Number of update threads
- `storage.wal.wal_capacity_mb`: Write-ahead log size
- `log_level`: Logging verbosity (DEBUG, INFO, WARN, ERROR)

## Security Considerations

1. In production, consider enabling API key authentication
2. Use HTTPS/TLS for API communication
3. Implement proper network isolation
4. Regular backups of vector data
5. Monitor resource usage and performance

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 6333 and 6334 are available
2. **Memory issues**: Monitor memory usage and adjust container limits
3. **Performance**: Optimize vector size and distance metrics
4. **Connection issues**: Verify network configuration

### Health Check

```bash
# Check if Qdrant is running
curl http://localhost:6333/health

# Check collection info
curl http://localhost:6333/collections/products
```

## Resources

- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [Qdrant GitHub](https://github.com/qdrant/qdrant)
- [Vector Database Best Practices](https://qdrant.tech/articles/)