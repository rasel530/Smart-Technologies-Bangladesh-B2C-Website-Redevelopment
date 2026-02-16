# Docker Desktop Fix Guide - Complete Solution

## Problem Identified
Docker Desktop has a lingering process `com.docker.build.exe` (PID: 16516) that is preventing proper startup and causing 500 API errors.

## Permanent Solution Steps

### Step 1: Close Docker Desktop Completely
1. Right-click on Docker Desktop icon in system tray
2. Select "Quit Docker Desktop"
3. Wait for all Docker processes to stop

### Step 2: Kill Lingering Processes (Run as Administrator)
Open Command Prompt or PowerShell **as Administrator** and run:

```cmd
taskkill /F /IM com.docker.build.exe
taskkill /F /IM com.docker.backend.exe
taskkill /F /IM Docker Desktop.exe
```

### Step 3: Clean Up Docker State
```cmd
# Remove any stopped containers
docker container prune -f

# Remove unused images
docker image prune -a -f

# Remove unused volumes (BE CAREFUL - this may delete data!)
# docker volume prune -f  # Uncomment ONLY if you have backups
```

### Step 4: Restart Docker Desktop
1. Start Docker Desktop from Start Menu
2. Wait for Docker to fully initialize (usually 1-2 minutes)
3. Verify Docker is running: `docker version`

### Step 5: Start All Containers
```cmd
cd e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment
docker-compose up -d
```

### Step 6: Verify All Containers Are Running
```cmd
docker ps
```

Expected containers:
- smarttech_frontend
- smarttech_backend
- smarttech_elasticsearch (NEWLY ADDED)
- smarttech_es_node1
- smarttech_es_node2
- smarttech_es_node3
- smarttech_kibana
- smarttech_redis
- smarttech_postgres
- smarttech_qdrant
- smarttech_ollama
- smarttech_pgadmin

### Step 7: Check Container Health
```cmd
docker-compose ps
```

All containers should show "Up" status.

## What Was Done

### 1. Added smarttech_elasticsearch Service
- Single-node Elasticsearch configuration
- Container name: smarttech_elasticsearch
- Ports: 9203:9200, 9303:9300 (avoiding conflicts)
- Memory: 2GB heap size
- Health check configured

### 2. Added elasticsearch_data Volume
- Persistent storage for Elasticsearch data
- Prevents data loss on container restart

### 3. Built All Docker Images
- smarttech-frontend: Built successfully
- smarttech-backend: Built successfully
- All other services: Using pre-built images

## Troubleshooting

### If Docker Still Shows 500 Errors
1. Restart Windows (this clears all file locks)
2. Check Docker Desktop logs: Help > Diagnostics & Troubleshoot
3. Reinstall Docker Desktop (last resort)

### If Containers Won't Start
1. Check port conflicts: `netstat -ano | findstr "9200"`
2. Check disk space: `dir`
3. Check memory usage in Task Manager

### If Elasticsearch Fails
1. Check memory allocation (2GB minimum recommended)
2. Check vm.max_map_count: `sysctl vm.max_map_count`
3. Review logs: `docker logs smarttech_elasticsearch`

## Quick Reference Commands

```cmd
# Stop all containers
docker-compose down

# Start all containers
docker-compose up -d

# View logs
docker-compose logs -f

# Restart specific container
docker-compose restart <service_name>

# Check container status
docker-compose ps

# View container logs
docker logs <container_name>
```

## Success Criteria
✓ All 12 containers are running
✓ All containers show "Up" status
✓ All health checks pass
✓ Frontend accessible at http://localhost:3000
✓ Backend accessible at http://localhost:3001
✓ Elasticsearch accessible at http://localhost:9200 (cluster) and http://localhost:9203 (single node)
✓ No 500 API errors
