#!/bin/bash

echo "🔧 SmartTech Backend Container Fix Script"
echo "=========================================="

# Stop all services
echo "🛑 Stopping all Docker services..."
docker-compose down

# Remove problematic backend volume
echo "🗑️  Removing problematic backend_node_modules volume..."
docker volume rm smarttech_backend_node_modules 2>/dev/null || echo "Volume doesn't exist or already removed"

# Remove stopped containers
echo "🧹 Cleaning up stopped containers..."
docker container prune -f

# Build and start services
echo "🏗️  Building and starting services with fixed configuration..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to initialize..."
sleep 30

# Check container status
echo "📊 Checking container status..."
docker-compose ps

# Check backend logs
echo "📋 Checking backend container logs..."
docker logs smarttech_backend --tail=20

# Test backend health
echo "🏥 Testing backend health endpoint..."
sleep 10
curl -f http://localhost:3001/api/health || echo "❌ Health check failed"

echo ""
echo "✅ Fix script completed!"
echo "📝 If the backend is still not running, check:"
echo "   1. Docker Desktop is running"
echo "   2. Ports 3001, 5432, 6379, 9200 are available"
echo "   3. Check 'docker logs smarttech_backend' for errors"