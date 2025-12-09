#!/bin/bash

# Elasticsearch Setup Script
# This script helps set up and configure Elasticsearch for the Smart Technologies B2C Website

set -e

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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    log_step "Checking if Docker is running..."
    
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    log_info "Docker is running!"
}

# Function to check if docker-compose is available
check_docker_compose() {
    log_step "Checking if docker-compose is available..."
    
    if ! command -v docker-compose > /dev/null 2>&1; then
        log_error "docker-compose is not installed or not in PATH."
        exit 1
    fi
    
    log_info "docker-compose is available!"
}

# Function to start Elasticsearch
start_elasticsearch() {
    log_step "Starting Elasticsearch..."
    
    # Navigate to project root (assuming this script is in elasticsearch/scripts/)
    cd "$(dirname "$0")/../.."
    
    # Start Elasticsearch
    if docker-compose up -d elasticsearch; then
        log_info "Elasticsearch is starting up..."
    else
        log_error "Failed to start Elasticsearch."
        exit 1
    fi
}

# Function to wait for Elasticsearch to be ready
wait_for_elasticsearch() {
    log_step "Waiting for Elasticsearch to be ready..."
    
    local max_retries=30
    local retry_interval=10
    
    for i in $(seq 1 $max_retries); do
        if curl -s -f "http://localhost:9200/_cluster/health" > /dev/null 2>&1; then
            log_info "Elasticsearch is ready!"
            return 0
        fi
        
        log_warn "Attempt $i/$max_retries: Elasticsearch not ready yet. Waiting $retry_interval seconds..."
        sleep $retry_interval
    done
    
    log_error "Elasticsearch is not ready after $max_retries attempts."
    exit 1
}

# Function to initialize indices
initialize_indices() {
    log_step "Initializing Elasticsearch indices..."
    
    # Navigate to project root
    cd "$(dirname "$0")/../.."
    
    # Run the initialization script
    if docker-compose exec elasticsearch /usr/share/elasticsearch/scripts/init-indices.sh; then
        log_info "Indices initialized successfully!"
    else
        log_error "Failed to initialize indices."
        exit 1
    fi
}

# Function to run tests
run_tests() {
    log_step "Running Elasticsearch tests..."
    
    # Navigate to project root
    cd "$(dirname "$0")/../.."
    
    # Run the test script
    if docker-compose exec elasticsearch /usr/share/elasticsearch/scripts/test-elasticsearch.sh; then
        log_info "All tests passed!"
    else
        log_warn "Some tests failed. Please check the output above."
    fi
}

# Function to show usage information
show_usage() {
    echo ""
    echo "=========================================="
    echo "Elasticsearch Setup Complete!"
    echo "=========================================="
    echo ""
    echo "Elasticsearch is now running and configured."
    echo ""
    echo "Access URLs:"
    echo "  - Elasticsearch: http://localhost:9200"
    echo "  - Health Check: http://localhost:9200/_cluster/health"
    echo ""
    echo "Useful Commands:"
    echo "  - View indices: curl http://localhost:9200/_cat/indices?v"
    echo "  - Search products: curl -X GET 'http://localhost:9200/products/_search?q=*'"
    echo "  - Stop Elasticsearch: docker-compose stop elasticsearch"
    echo "  - View logs: docker-compose logs -f elasticsearch"
    echo ""
    echo "Documentation:"
    echo "  - See elasticsearch/README.md for detailed documentation"
    echo ""
}

# Main execution
main() {
    echo "=========================================="
    echo "Elasticsearch Setup for Smart Technologies"
    echo "=========================================="
    echo ""
    
    # Check prerequisites
    check_docker
    check_docker_compose
    
    # Start Elasticsearch
    start_elasticsearch
    
    # Wait for it to be ready
    wait_for_elasticsearch
    
    # Initialize indices
    initialize_indices
    
    # Run tests
    run_tests
    
    # Show usage information
    show_usage
}

# Execute main function
main "$@"