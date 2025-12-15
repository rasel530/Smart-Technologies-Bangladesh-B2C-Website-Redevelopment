# Docker Container Restart Loop Fix Guide

## Problem Summary
The `smarttech_backend` container is stuck in a restart loop due to **volume mount conflict** between Docker volume `backend_node_modules` and the container's internal node_modules structure. The volume overwrites properly installed dependencies, causing `@prisma/client` module resolution failure.

## Root Cause Analysis

### Primary Issue: Volume Mount Conflict
1. **Dockerfile Process**: Container builds with `npm install --production` creating complete node_modules
2. **Volume Override**: `docker-compose.yml` mounts `backend_node_modules:/app/node_modules` 
3. **Missing Dependencies**: Mounted volume contains incomplete/old dependencies
4. **Application Failure**: `Error: Cannot find module '@prisma/client'` causes exit code 1
5. **Restart Loop**: `restart: unless-stopped` policy triggers infinite restarts (34 restarts detected)

### Restart Loop Mechanism
- Container exits with code 1 (module not found)
- Docker restart policy: `unless-stopped` automatically restarts
- Process repeats indefinitely

## Immediate Fix Commands

### Step 1: Stop Container and Clean Up
```bash
# Stop the failing container
docker stop smarttech_backend

# Remove problematic volume to force rebuild
docker volume rm smarttech_backend_node_modules

# Remove stopped container
docker rm smarttech_backend
```

### Step 2: Test Container Without Volume
```bash
# Test container startup without volume mount
docker run --rm -it \
  --network smarttech_smarttech_network \
  -e NODE_ENV=production \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  -e DB_USERNAME=smart_dev \
  -e DB_PASSWORD=smart_dev_password_2024 \
  -e DB_NAME=smart_ecommerce_dev \
  -e REDIS_HOST=redis \
  -e REDIS_PORT=6379 \
  -e REDIS_PASSWORD=redis_smarttech_2024 \
  smarttech-backend \
  sh
```

### Step 3: Verify Application Startup
```bash
# Inside container, test startup sequence
cd /app

# Test Prisma client availability
node -e "console.log('Prisma client:', require('@prisma/client'))"

# Test application start
npm run start:prod
```

## Permanent Solutions

### Option 1: Remove Volume Mount (Recommended)
Replace your `docker-compose.yml` backend service with:

```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile
  container_name: smarttech_backend
  restart: unless-stopped
  ports:
    - "${BACKEND_PORT:-3001}:3001"
  environment:
    - NODE_ENV=production
    - DB_HOST=postgres
    - DB_PORT=5432
    - DB_USERNAME=smart_dev
    - DB_PASSWORD=smart_dev_password_2024
    - DB_NAME=smart_ecommerce_dev
    - REDIS_HOST=redis
    - REDIS_PORT=6379
    - REDIS_PASSWORD=redis_smarttech_2024
    - ELASTICSEARCH_NODE=http://elasticsearch:9200
    - FRONTEND_URL=http://localhost:3000
    - JWT_SECRET=smarttech-jwt-secret-key-2024
  # Remove this line:
  # volumes:
  #   - backend_node_modules:/app/node_modules
  networks:
    - smarttech_network
  depends_on:
    - postgres
    - redis
    - elasticsearch
```

### Option 2: Fix Dockerfile for Volume Compatibility
Use the provided `Dockerfile-fixed` which:
1. Installs ALL dependencies (including devDependencies for Prisma generation)
2. Generates Prisma client in production stage
3. Ensures compatibility with volume mounts

### Option 3: Use Named Volume with Proper Initialization
```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile-fixed
  container_name: smarttech_backend
  restart: unless-stopped
  ports:
    - "${BACKEND_PORT:-3001}:3001"
  environment:
    - NODE_ENV=production
    - DB_HOST=postgres
    - DB_PORT=5432
    - DB_USERNAME=smart_dev
    - DB_PASSWORD=smart_dev_password_2024
    - DB_NAME=smart_ecommerce_dev
    - REDIS_HOST=redis
    - REDIS_PORT=6379
    - REDIS_PASSWORD=redis_smarttech_2024
    - ELASTICSEARCH_NODE=http://elasticsearch:9200
    - FRONTEND_URL=http://localhost:3000
    - JWT_SECRET=smarttech-jwt-secret-key-2024
  volumes:
    - backend_node_modules:/app/node_modules
    - ./backend:/app  # Mount source code for development
  networks:
    - smarttech_network
  depends_on:
    - postgres
    - redis
    - elasticsearch
```

## Implementation Steps

### For Quick Fix (Option 1):
```bash
# 1. Stop all services
docker-compose down

# 2. Remove problematic volume
docker volume rm smarttech_backend_node_modules

# 3. Use fixed docker-compose.yml
cp docker-compose-fixed.yml docker-compose.yml

# 4. Restart services
docker-compose up -d --build
```

### For Development with Volume Mounts (Option 3):
```bash
# 1. Stop services
docker-compose down

# 2. Use fixed Dockerfile
cp backend/Dockerfile-fixed backend/Dockerfile

# 3. Start services
docker-compose up -d --build
```

## Verification Commands

### Check Container Status:
```bash
# Verify container is running
docker ps | grep smarttech_backend

# Check logs for errors
docker logs smarttech_backend --tail=20

# Test application health
curl http://localhost:3001/health
```

### Check Dependencies:
```bash
# Verify Prisma client in container
docker exec smarttech_backend ls -la /app/node_modules/@prisma/client

# Test database connection
docker exec smarttech_backend npx prisma db pull
```

## Prevention Measures

### 1. Health Checks
Add healthcheck to backend service:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```

### 2. Proper Volume Management
- Use named volumes for persistent data
- Avoid mounting node_modules unless necessary for development
- Ensure volume initialization scripts are in place

### 3. Dependency Management
- Generate Prisma client during build
- Verify all production dependencies are installed
- Test module resolution in container

## Expected Outcome
After applying these fixes:
- Container starts successfully without restart loop
- `@prisma/client` module is properly resolved
- Application connects to PostgreSQL and Redis
- Health checks pass
- Container remains stable in production