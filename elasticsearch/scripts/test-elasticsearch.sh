#!/bin/bash

# Elasticsearch Test Script
# This script tests Elasticsearch connectivity and basic functionality

set -e

# Configuration
ELASTICSEARCH_URL=${ELASTICSEARCH_URL:-"http://elasticsearch:9200"}
MAX_RETRIES=10
RETRY_INTERVAL=5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
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

# Function to test cluster health
test_cluster_health() {
    log_test "Testing cluster health..."
    
    local health_response=$(curl -s "$ELASTICSEARCH_URL/_cluster/health")
    local status=$(echo "$health_response" | jq -r '.status' 2>/dev/null || echo "unknown")
    local nodes=$(echo "$health_response" | jq -r '.number_of_nodes' 2>/dev/null || echo "unknown")
    
    echo "Cluster Status: $status"
    echo "Number of Nodes: $nodes"
    
    if [ "$status" = "green" ] || [ "$status" = "yellow" ]; then
        log_info "Cluster health test passed!"
        return 0
    else
        log_error "Cluster health test failed! Status: $status"
        return 1
    fi
}

# Function to test node info
test_node_info() {
    log_test "Testing node information..."
    
    local node_response=$(curl -s "$ELASTICSEARCH_URL/_nodes")
    local node_name=$(echo "$node_response" | jq -r '.nodes | to_entries[0].value.name' 2>/dev/null || echo "unknown")
    local version=$(echo "$node_response" | jq -r '.nodes | to_entries[0].value.version' 2>/dev/null || echo "unknown")
    
    echo "Node Name: $node_name"
    echo "Elasticsearch Version: $version"
    
    if [ "$node_name" != "unknown" ] && [ "$version" != "unknown" ]; then
        log_info "Node info test passed!"
        return 0
    else
        log_error "Node info test failed!"
        return 1
    fi
}

# Function to test index operations
test_index_operations() {
    log_test "Testing index operations..."
    
    local test_index="test_index_$(date +%s)"
    
    # Create test index
    log_info "Creating test index: $test_index"
    if ! curl -s -X PUT "$ELASTICSEARCH_URL/$test_index" > /dev/null; then
        log_error "Failed to create test index"
        return 1
    fi
    
    # Add a document
    log_info "Adding test document..."
    if ! curl -s -X PUT "$ELASTICSEARCH_URL/$test_index/_doc/1" \
        -H "Content-Type: application/json" \
        -d '{"name": "Test Product", "price": 99.99, "category": "Electronics"}' > /dev/null; then
        log_error "Failed to add test document"
        return 1
    fi
    
    # Refresh index
    log_info "Refreshing index..."
    if ! curl -s -X POST "$ELASTICSEARCH_URL/$test_index/_refresh" > /dev/null; then
        log_error "Failed to refresh index"
        return 1
    fi
    
    # Search for document
    log_info "Searching for test document..."
    local search_response=$(curl -s -X GET "$ELASTICSEARCH_URL/$test_index/_search" \
        -H "Content-Type: application/json" \
        -d '{"query": {"match": {"name": "Test Product"}}}')
    
    local hits=$(echo "$search_response" | jq -r '.hits.total.value' 2>/dev/null || echo "0")
    
    if [ "$hits" -gt 0 ]; then
        log_info "Found $hits documents in search"
    else
        log_error "No documents found in search"
        return 1
    fi
    
    # Delete test index
    log_info "Cleaning up test index..."
    if ! curl -s -X DELETE "$ELASTICSEARCH_URL/$test_index" > /dev/null; then
        log_error "Failed to delete test index"
        return 1
    fi
    
    log_info "Index operations test passed!"
    return 0
}

# Function to test products index
test_products_index() {
    log_test "Testing products index..."
    
    # Check if products index exists
    if curl -s -f "$ELASTICSEARCH_URL/products" > /dev/null; then
        log_info "Products index exists"
        
        # Get index mapping
        local mapping_response=$(curl -s "$ELASTICSEARCH_URL/products/_mapping")
        local has_name_mapping=$(echo "$mapping_response" | jq -r '.products.mappings.properties.name' 2>/dev/null || echo "null")
        
        if [ "$has_name_mapping" != "null" ]; then
            log_info "Products index has proper mappings"
            return 0
        else
            log_warn "Products index exists but may not have proper mappings"
            return 1
        fi
    else
        log_warn "Products index does not exist. Run init-indices.sh first."
        return 1
    fi
}

# Function to test analyzers
test_analyzers() {
    log_test "Testing custom analyzers..."
    
    # Test product name analyzer
    local analyzer_test='{
        "analyzer": "product_name_analyzer",
        "text": "Smart Phone Pro Max"
    }'
    
    local analyzer_response=$(curl -s -X POST "$ELASTICSEARCH_URL/_analyze" \
        -H "Content-Type: application/json" \
        -d "$analyzer_test")
    
    local tokens=$(echo "$analyzer_response" | jq -r '.tokens | length' 2>/dev/null || echo "0")
    
    if [ "$tokens" -gt 0 ]; then
        log_info "Product name analyzer is working (produced $tokens tokens)"
        return 0
    else
        log_error "Product name analyzer test failed"
        return 1
    fi
}

# Main execution
main() {
    echo "=========================================="
    echo "Elasticsearch Connectivity Test Suite"
    echo "=========================================="
    echo ""
    
    # Wait for Elasticsearch to be ready
    wait_for_elasticsearch
    
    echo ""
    echo "Running tests..."
    echo ""
    
    local failed_tests=0
    
    # Run tests
    test_cluster_health || ((failed_tests++))
    echo ""
    
    test_node_info || ((failed_tests++))
    echo ""
    
    test_index_operations || ((failed_tests++))
    echo ""
    
    test_products_index || ((failed_tests++))
    echo ""
    
    test_analyzers || ((failed_tests++))
    echo ""
    
    # Summary
    echo "=========================================="
    if [ $failed_tests -eq 0 ]; then
        log_info "All tests passed! Elasticsearch is properly configured and functional."
    else
        log_error "$failed_tests test(s) failed. Please check the configuration."
    fi
    echo "=========================================="
    
    exit $failed_tests
}

# Execute main function
main "$@"