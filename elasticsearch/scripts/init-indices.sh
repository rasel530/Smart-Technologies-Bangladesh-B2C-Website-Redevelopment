#!/bin/bash

# Elasticsearch Indices Initialization Script
# This script initializes Elasticsearch indices with custom mappings for the Smart Technologies B2C Website

set -e

# Configuration
ELASTICSEARCH_URL=${ELASTICSEARCH_URL:-"http://elasticsearch:9200"}
MAX_RETRIES=30
RETRY_INTERVAL=10

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Elasticsearch is ready
wait_for_elasticsearch() {
    log_info "Waiting for Elasticsearch to be ready at $ELASTICSEARCH_URL..."
    
    for i in $(seq 1 $MAX_RETRIES); do
        if curl -s -f "$ELASTICSEARCH_URL/_cluster/health" > /dev/null; then
            log_info "Elasticsearch is ready!"
            return 0
        fi
        
        log_warn "Attempt $i/$MAX_RETRIES: Elasticsearch not ready yet. Waiting $RETRY_INTERVAL seconds..."
        sleep $RETRY_INTERVAL
    done
    
    log_error "Elasticsearch is not ready after $MAX_RETRIES attempts. Exiting."
    exit 1
}

# Function to create index with mapping
create_index() {
    local index_name=$1
    local mapping_file=$2
    
    log_info "Creating index: $index_name"
    
    # Check if index already exists
    if curl -s -f "$ELASTICSEARCH_URL/$index_name" > /dev/null; then
        log_warn "Index '$index_name' already exists. Skipping creation."
        return 0
    fi
    
    # Create index with mapping
    if curl -s -X PUT "$ELASTICSEARCH_URL/$index_name" \
        -H "Content-Type: application/json" \
        -d @"$mapping_file"; then
        log_info "Successfully created index: $index_name"
        return 0
    else
        log_error "Failed to create index: $index_name"
        return 1
    fi
}

# Function to create index template
create_index_template() {
    local template_name=$1
    local mapping_file=$2
    
    log_info "Creating index template: $template_name"
    
    # Create index template
    if curl -s -X PUT "$ELASTICSEARCH_URL/_index_template/$template_name" \
        -H "Content-Type: application/json" \
        -d @"$mapping_file"; then
        log_info "Successfully created index template: $template_name"
        return 0
    else
        log_error "Failed to create index template: $template_name"
        return 1
    fi
}

# Main execution
main() {
    log_info "Starting Elasticsearch indices initialization..."
    
    # Wait for Elasticsearch to be ready
    wait_for_elasticsearch
    
    # Get cluster info
    log_info "Elasticsearch cluster information:"
    curl -s "$ELASTICSEARCH_URL" | jq '.' 2>/dev/null || curl -s "$ELASTICSEARCH_URL"
    
    echo ""
    
    # Create products index template
    log_info "Setting up products index template..."
    if [ -f "/usr/share/elasticsearch/init/products-mapping.json" ]; then
        create_index_template "products-template" "/usr/share/elasticsearch/init/products-mapping.json"
    else
        log_error "Products mapping file not found at /usr/share/elasticsearch/init/products-mapping.json"
        exit 1
    fi
    
    # Create initial products index
    log_info "Creating initial products index..."
    create_index "products" "/usr/share/elasticsearch/init/products-mapping.json"
    
    # Load sample data if available
    if [ -f "/usr/share/elasticsearch/init/sample-products.json" ]; then
        log_info "Loading sample product data..."
        
        # Read and index each product from the sample data
        local temp_file=$(mktemp)
        # Convert JSON array to NDJSON for bulk indexing
        jq -c '.[] | {"index": {"_index": "products", "_id": .id}}, .' /usr/share/elasticsearch/init/sample-products.json > "$temp_file"
        
        # Bulk index the data
        if curl -s -X POST "$ELASTICSEARCH_URL/_bulk" \
            -H "Content-Type: application/json" \
            --data-binary @"$temp_file" | grep -q '"errors":false'; then
            log_info "Sample data loaded successfully!"
        else
            log_warn "Some errors occurred while loading sample data"
        fi
        
        rm -f "$temp_file"
        
        # Refresh the index to make data searchable
        curl -s -X POST "$ELASTICSEARCH_URL/products/_refresh" > /dev/null
    else
        log_info "No sample data file found. Skipping data loading."
    fi
    
    # Verify indices
    log_info "Verifying created indices:"
    curl -s "$ELASTICSEARCH_URL/_cat/indices?v" || log_error "Failed to list indices"
    
    # Show sample documents count
    if curl -s -f "$ELASTICSEARCH_URL/products" > /dev/null; then
        local doc_count=$(curl -s "$ELASTICSEARCH_URL/products/_count" | jq -r '.count' 2>/dev/null || echo "unknown")
        log_info "Products index contains $doc_count documents"
    fi
    
    echo ""
    log_info "Elasticsearch indices initialization completed successfully!"
}

# Execute main function
main "$@"