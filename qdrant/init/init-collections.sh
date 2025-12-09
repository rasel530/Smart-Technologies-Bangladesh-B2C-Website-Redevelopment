#!/bin/bash

# Qdrant initialization script for Smart Technologies B2C Website
# This script creates default collections and configurations

set -e

# Configuration
QDRANT_HOST="${QDRANT_HOST:-localhost}"
QDRANT_PORT="${QDRANT_PORT:-6333}"
QDRANT_URL="http://${QDRANT_HOST}:${QDRANT_PORT}"

# Wait for Qdrant to be ready
echo "Waiting for Qdrant to be ready..."
until curl -s "${QDRANT_URL}/health" > /dev/null; do
    echo "Qdrant is not ready yet. Waiting..."
    sleep 2
done

echo "Qdrant is ready. Initializing collections..."

# Create products collection for product similarity and recommendations
echo "Creating products collection..."
curl -X PUT "${QDRANT_URL}/collections/products" \
    -H "Content-Type: application/json" \
    -d '{
        "vectors": {
            "size": 384,
            "distance": "Cosine"
        },
        "payload_schema": {
            "product_id": "keyword",
            "name": "text",
            "description": "text",
            "category": "keyword",
            "price": "float",
            "brand": "keyword",
            "in_stock": "bool",
            "rating": "float",
            "created_at": "integer"
        }
    }' || echo "Products collection may already exist"

# Create content collection for semantic search
echo "Creating content collection..."
curl -X PUT "${QDRANT_URL}/collections/content" \
    -H "Content-Type: application/json" \
    -d '{
        "vectors": {
            "size": 384,
            "distance": "Cosine"
        },
        "payload_schema": {
            "content_id": "keyword",
            "title": "text",
            "content": "text",
            "type": "keyword",
            "url": "keyword",
            "published_at": "integer",
            "author": "keyword"
        }
    }' || echo "Content collection may already exist"

# Create user_behavior collection for personalization
echo "Creating user_behavior collection..."
curl -X PUT "${QDRANT_URL}/collections/user_behavior" \
    -H "Content-Type: application/json" \
    -d '{
        "vectors": {
            "size": 384,
            "distance": "Cosine"
        },
        "payload_schema": {
            "user_id": "keyword",
            "session_id": "keyword",
            "action": "keyword",
            "product_id": "keyword",
            "timestamp": "integer",
            "duration": "integer"
        }
    }' || echo "User behavior collection may already exist"

# Create search_queries collection for query understanding
echo "Creating search_queries collection..."
curl -X PUT "${QDRANT_URL}/collections/search_queries" \
    -H "Content-Type: application/json" \
    -d '{
        "vectors": {
            "size": 384,
            "distance": "Cosine"
        },
        "payload_schema": {
            "query_id": "keyword",
            "query_text": "text",
            "user_id": "keyword",
            "timestamp": "integer",
            "results_count": "integer",
            "clicked_results": "array"
        }
    }' || echo "Search queries collection may already exist"

# Create categories collection for category-based recommendations
echo "Creating categories collection..."
curl -X PUT "${QDRANT_URL}/collections/categories" \
    -H "Content-Type: application/json" \
    -d '{
        "vectors": {
            "size": 384,
            "distance": "Cosine"
        },
        "payload_schema": {
            "category_id": "keyword",
            "name": "text",
            "description": "text",
            "parent_category": "keyword",
            "level": "integer"
        }
    }' || echo "Categories collection may already exist"

echo "All collections created successfully!"

# Display collection information
echo ""
echo "Created collections:"
curl -s "${QDRANT_URL}/collections" | jq -r '.result.collections[] | "  - \(.name): \(.status)"'

echo ""
echo "Qdrant initialization completed successfully!"
echo ""
echo "You can now:"
echo "1. Access Qdrant REST API at: ${QDRANT_URL}"
echo "2. View collections at: ${QDRANT_URL}/collections"
echo "3. Check health at: ${QDRANT_URL}/health"