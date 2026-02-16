# Docker Hot Reloading Guide

## Complete Documentation for Smart Tech B2C Website Development

**Document Version**: 1.0  
**Last Updated**: 2026-02-16  
**Status**: Implementation Complete

---

## 1. Overview

### What is Hot Reload?

Hot reloading is a development feature that automatically detects code changes and updates the running application without requiring manual restarts or Docker image rebuilds. When you save a file, the development server detects the change and refreshes the affected components instantly, providing immediate feedback on your code modifications.

This is fundamentally different from traditional development workflows where every code change requires:
1. Stopping Docker containers
2. Rebuilding Docker images (2-5 minutes)
3. Restarting containers
4. Waiting for services to initialize

With hot reloading, the iteration cycle becomes:
1. Edit code
2. Save file
3. See changes instantly (1-3 seconds)

### Why Hot Reloading Matters

Developer productivity is directly tied to feedback loop speed. According to the technical specification, the implementation delivers a **60-180x faster iteration cycle**:

| Metric | Before Hot Reload | After Hot Reload |
|--------|-------------------|------------------|
| Time per code change | 3-6 minutes | 1-3 seconds |
| Docker rebuilds per day | 50-100 | 0 |
| Productive development time | ~60% | ~90% |

Beyond speed, hot reloading improves:
- **Debugging efficiency**: See errors immediately as they occur
- **Design iteration**: Visual changes appear instantly
- **Reduced cognitive load**: No context switching between coding and rebuilding
- **Team collaboration**: Consistent development experience across all developers

### Summary of Changes Made

The hot reloading implementation consists of two primary modifications:

1. **Created**: [`backend/nodemon.json`](backend/nodemon.json:1) - Configuration file for Nodemon to monitor backend code changes
2. **Modified**: [`docker-compose.dev.yml`](docker-compose.dev.yml:1) - Added volume mounts and development environment variables

### Expected Benefits

| Benefit Category | Improvement |
|-----------------|-------------|
| Iteration speed | 60-180x faster |
| Resource usage | 70-90% reduction during development |
| Build cache persistence | Named volume for `.next` directory |
| Cross-platform support | Windows, macOS, Linux compatible |

---

## 2. Configuration Details

### 2.1 Backend Nodemon Configuration

**File**: [`backend/nodemon.json`](backend/nodemon.json:1)

The Nodemon configuration file controls how the backend detects and responds to code changes:

```json
{
  "watch": ["src", "routes", "services", "middleware", "prisma"],
  "ext": "js,json",
  "ignore": [
    "node_modules/**",
    ".git/**",
    "uploads/**",
    "exports/**",
    "coverage/**",
    "*.test.js",
    "*.spec.js"
  ],
  "exec": "node index.js",
  "delay": "1000",
  "verbose": true
}
```

**Configuration Explanation**:

| Setting | Value | Purpose |
|---------|-------|---------|
| `watch` | `["src", "routes", "services", "middleware", "prisma"]` | Directories to monitor for changes. Any JavaScript or JSON file in these directories will trigger a restart when modified. |
| `ext` | `js,json` | File extensions to watch. Only `.js` and `.json` files trigger restarts. |
| `ignore` | `node_modules/**`, `.git/**`, etc. | Patterns to exclude from watching. Prevents unnecessary restarts when dependencies or test files change. |
| `exec` | `node index.js` | Command to execute when a restart is triggered. Uses the container's Node.js runtime. |
| `delay` | `1000` | Delay in milliseconds before restarting. Prevents rapid restarts during batch saves. |
| `verbose` | `true` | Enables detailed logging to help troubleshoot hot reload issues. |

**Why This Configuration Works**:

The `watch` array focuses on directories that contain application code rather than system files. By excluding `node_modules`, `uploads`, and test files, Nodemon only restarts when actual application code changes, reducing unnecessary restarts and CPU usage.

### 2.2 Docker Compose Development Configuration

**File**: [`docker-compose.dev.yml`](docker-compose.dev.yml:1)

#### 2.2.1 Frontend Service Changes

**Dockerfile Change** (Line 46):
```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile.dev  # Switched from production Dockerfile
```

**Why This Matters**: The [`Dockerfile.dev`](frontend/Dockerfile.dev:1) uses `npm run dev` which starts Next.js in development mode with Hot Module Replacement (HMR) enabled. The production Dockerfile builds a static export that cannot hot reload.

**Environment Variable Changes** (Lines 73-76):
```yaml
environment:
  # ... existing environment variables ...
  - CHOKIDAR_USEPOLLING=true    # Enables file watching in Docker
  - WATCHPACK_POLLING=true       # Enables webpack polling
  - NEXT_TELEMETRY_DISABLED=1   # Disables telemetry for faster builds
```

| Variable | Purpose |
|----------|---------|
| `CHOKIDAR_USEPOLLING=true` | Chokidar is the file watcher used by Next.js. By default, it uses native file system events which may not work reliably in Docker. Polling ensures file changes are detected. |
| `WATCHPACK_POLLING=true` | Watchpack is webpack's file watching module. This provides an additional polling mechanism for webpack-related file changes. |
| `NEXT_TELEMETRY_DISABLED=1` | Disables Next.js telemetry collection, slightly reducing overhead during development. |

**Volume Mount Configuration** (Lines 77-88):
```yaml
volumes:
  # Source code mounts for hot reload
  - ./frontend/src:/app/src
  - ./frontend/public:/app/public
  # Configuration file mounts
  - ./frontend/next.config.js:/app/next.config.js
  - ./frontend/tailward.config.js:/app/tailwind.config.js
  - ./frontend/postcss.config.js:/app/postcss.config.js
  - ./frontend/tsconfig.json:/app/tsconfig.json
  # Build cache persistence
  - frontend_next_cache:/app/.next
  # Environment file
  - ./frontend/.env:/app/.env
```

| Mount | Purpose |
|-------|---------|
| `./frontend/src:/app/src` | Mounts source code so changes are detected by Next.js HMR |
| `./frontend/public:/app/public` | Mounts static assets for hot reloading |
| Config files | Allows configuration changes without rebuild |
| `frontend_next_cache:/app/.next` | Named volume preserves build cache between restarts |
| `./frontend/.env:/app/.env` | Mounts environment variables |

**Environment Mode Change** (Line 60):
```yaml
- NODE_ENV=development  # Changed from 'production'
```

Setting `NODE_ENV=development` enables Next.js development features including HMR, error overlays, and faster compilation.

#### 2.2.2 Backend Service Changes

**Dockerfile Change** (Line 97):
```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile.dev  # Switched from production Dockerfile
```

**Why This Matters**: The [`Dockerfile.dev`](backend/Dockerfile.dev:1) uses the [`docker-startup.sh`](backend/scripts/docker-startup.sh:1) script which runs `npm run dev`. This starts the backend with Nodemon instead of directly running `node index.js`.

**Environment Variable Change** (Line 107):
```yaml
- NODE_ENV=development  # Changed from 'production'
```

**Volume Mount Configuration** (Lines 150-157):
```yaml
volumes:
  # Mount entire backend for hot reload
  - ./backend:/app
  # Use container's node_modules (anonymous volume)
  - /app/node_modules
  # Existing mounts
  - ./backend/uploads:/app/uploads
  - ./backend/.env:/app/.env
  - ./backend/prisma:/app/prisma
```

| Mount | Purpose |
|-------|---------|
| `./backend:/app` | Mounts entire backend directory for code changes |
| `/app/node_modules` | Anonymous volume prevents host node_modules from conflicting with container's |
| `./backend/uploads:/app/uploads` | Preserves uploaded files |
| `./backend/.env:/app/.env` | Mounts environment variables |
| `./backend/prisma:/app/prisma` | Mounts Prisma schema for database configuration changes |

**Critical: Why `/app/node_modules` is Anonymous**:

The mount `/app/node_modules` (without a host path) creates an anonymous volume. This is essential because:

1. It prevents the host machine's `node_modules` from overwriting the container's
2. Different operating systems have different binary formats (Windows vs Linux)
3. The container has the correct architecture for native modules
4. Dependencies installed inside the container remain persistent

#### 2.2.3 New Volume Definition

**Volume Added** (Lines 308-311):
```yaml
volumes:
  frontend_next_cache:
    driver: local
    labels:
      - "com.smarttech.description=Next.js build cache for hot reload"
```

This named volume persists the `.next` directory (Next.js build output) between container restarts, significantly reducing rebuild times.

---

## 3. How to Use

### 3.1 Starting the Development Environment

**Step 1: Ensure Docker is Running**

Verify Docker Desktop or Docker Engine is running:
```bash
docker --version
docker-compose --version
```

Expected output:
```
Docker version 24.0.7, build afdd53b
Docker Compose version v2.21.0
```

**Step 2: Stop Any Running Containers**

If you have containers running from a previous session:
```bash
docker-compose -f docker-compose.dev.yml down
```

**Step 3: Build and Start Containers**

```bash
docker-compose -f docker-compose.dev.yml up -d --build
```

**Expected Output**:
```
[+] Building 2/2
[+] Building 0.7s
[+] Building frontend 0.5s
[+] Building backend 0.5s
[+] Running 4/4
 ✔ Container smarttech_backend    Started
 ✔ Container smarttech_frontend   Started
 ✔ Container smarttech_postgres   Started
 ✔ Container smarttech_redis      Started
 ✔ Container smarttech_es_node1  Started
```

**Step 4: Verify Services are Running**

```bash
docker-compose -f docker-compose.dev.yml ps
```

**Expected Output**:
```
NAME                 STATUS    PORTS
smarttech_backend    Up        0.0.0.0:3001->3000/tcp
smarttech_frontend   Up        0.0.0.0:3000->3000/tcp
smarttech_postgres   Up        0.0.0.0:5432->5432/tcp
smarttech_redis      Up        0.0.0.0:6379->6379/tcp
smarttech_es_node1   Up        0.0.0.0:9200->9200/tcp
```

**Step 5: Access the Application**

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Next.js development server |
| Backend API | http://localhost:3001/api/v1 | Express API endpoints |
| pgAdmin | http://localhost:5050 | Database administration |

### 3.2 Testing Frontend Hot Reload

**Step 1: Make a Code Change**

Edit any frontend component, for example [`frontend/src/app/page.tsx`](frontend/src/app/page.tsx):
```tsx
// Change this line
<h1 className="text-4xl font-bold">Welcome to Smart Tech</h1>

// To this
<h1 className="text-4xl font-bold">Smart Tech - Hot Reloaded!</h1>
```

**Step 2: Save the File**

**Step 3: Observe the Results**

Within 1-3 seconds, you should see:
1. Browser automatically refreshes (if open)
2. Changes appear immediately
3. No Docker rebuild required

**Step 4: Verify in Browser**

Refresh http://localhost:3000 and confirm the changes are visible.

**Expected Console Output**:
```
[event] - compiled client and server in 2s (789 modules)
```

### 3.3 Testing Backend Hot Reload

**Step 1: View Backend Logs**

Open a terminal to monitor backend activity:
```bash
docker-compose -f docker-compose.dev.yml logs -f backend
```

**Step 2: Make a Code Change**

Edit any backend route file, for example [`backend/routes/productRoutes.js`](backend/routes/productRoutes.js):
```javascript
// Add a console log
console.log('Testing hot reload - Product routes loaded');
```

**Step 3: Save the File**

**Step 4: Observe the Results**

Within 1-2 seconds, you should see in the logs:
```
[nodemon] restarting due to changes...
[nodemon] restarting
Server running on port 3000
```

**Step 5: Test the API**

Make a request to verify the backend is working:
```bash
curl http://localhost:3001/api/v1/products
```

**Expected Response**:
```json
{
  "success": true,
  "data": [...],
  "message": "Products retrieved successfully"
}
```

### 3.4 What to Expect

| Scenario | Before Hot Reload | After Hot Reload |
|----------|-------------------|------------------|
| Frontend component change | 3-6 minutes (full rebuild) | 1-3 seconds (instant HMR) |
| Backend route change | 3-6 minutes (full rebuild) | 1-2 seconds (nodemon restart) |
| CSS/Tailwind change | 3-6 minutes (full rebuild) | <1 second (instant HMR) |
| Environment variable change | 3-6 minutes (full rebuild) | 10-30 seconds (container restart) |
| Database schema change | 3-6 minutes (full rebuild) | Manual migration required |

---

## 4. Troubleshooting Guide

### 4.1 Hot Reload Not Working

**Symptom**: Code changes are not reflected in the application, even after saving files.

**Diagnosis Steps**:

**Step 1: Verify Volume Mounts**

Check if volume mounts are configured correctly:
```bash
docker-compose -f docker-compose.dev.yml config | grep -A 20 "volumes:"
```

**Expected Output (Frontend)**:
```yaml
volumes:
  - ./frontend/src:/app/src
  - ./frontend/public:/app/public
  - ./frontend/next.config.js:/app/next.config.js
  - frontend_next_cache:/app/.next
```

**Expected Output (Backend)**:
```yaml
volumes:
  - ./backend:/app
  - /app/node_modules
```

**Step 2: Check File Permissions**

Verify the container can read mounted files:
```bash
docker-compose -f docker-compose.dev.yml exec frontend ls -la /app/src
docker-compose -f docker-compose.dev.yml exec backend ls -la /app
```

**Expected Output**: Should show files and directories with readable permissions.

**Step 3: Verify Environment Variables**

Confirm `NODE_ENV` is set to `development`:
```bash
docker-compose -f docker-compose.dev.yml exec frontend env | grep NODE_ENV
docker-compose -f docker-compose.dev.yml exec backend env | grep NODE_ENV
```

**Expected Output**:
```
NODE_ENV=development
```

**Step 4: Check Container Logs**

Look for file watching errors:
```bash
docker-compose -f docker-compose.dev.yml logs frontend
docker-compose -f docker-compose.dev.yml logs backend
```

**Common Log Messages**:

| Message | Meaning | Solution |
|---------|---------|----------|
| `[nodemon] files changed` | Hot reload working | No action needed |
| `Error: ENOSPC: System limit for file watchers reached` | Too many files watched | Increase inotify limits |
| `Cannot find module` | Missing dependency | Rebuild container |

**Step 5: Test File Change Detection**

Force a log message in your code and check if it appears:

```javascript
// In backend/routes/index.js
console.log('HOT_RELOAD_TEST: ' + new Date().toISOString());
```

If you see repeated log messages after saving, hot reload is working.

### 4.2 High CPU Usage

**Symptom**: System becomes sluggish when editing files, high CPU consumption.

**Solutions**:

**Solution 1: Increase Polling Intervals**

Edit [`backend/nodemon.json`](backend/nodemon.json:14) and increase the delay:
```json
{
  "delay": "2000"  // Increased from 1000ms
}
```

Edit [`frontend/next.config.js`](frontend/next.config.js:62) and increase polling:
```javascript
watchOptions: {
  poll: 5000,  // Increased from 3000ms
}
```

**Solution 2: Exclude More Directories**

Add directories to the ignore list in [`backend/nodemon.json`](backend/nodemon.json:4):
```json
{
  "ignore": [
    "node_modules/**",
    ".git/**",
    "uploads/**",
    "exports/**",
    "coverage/**",
    "*.test.js",
    "*.spec.js",
    "logs/**",      // Add this
    "*.log"         // Add this
  ]
}
```

**Solution 3: Monitor Resource Usage**

Check CPU and memory usage:
```bash
docker stats
```

**Expected Resource Usage**:
| Service | CPU | Memory |
|---------|-----|--------|
| frontend | 5-15% | 500MB-1GB |
| backend | 5-10% | 300-500MB |
| postgres | 1-5% | 200-400MB |

### 4.3 Node Modules Conflicts

**Symptom**: `Module not found` errors, `Cannot find package` errors.

**Solutions**:

**Solution 1: Rebuild Container**

```bash
docker-compose -f docker-compose.dev.yml build --no-cache backend
docker-compose -f docker-compose.dev.yml build --no-cache frontend
```

**Solution 2: Clear Anonymous Volumes**

```bash
docker volume rm $(docker volume ls -qf dangling=true)
```

**Solution 3: Verify Anonymous Volume Exists**

```bash
docker volume ls | grep node_modules
```

If no volume exists, restart the container to recreate it:
```bash
docker-compose -f docker-compose.dev.yml restart backend
```

### 4.4 Permission Issues (Linux/macOS)

**Symptom**: Cannot edit files created by container, "Permission denied" errors.

**Solution 1: Check File Ownership**

```bash
ls -la backend/src/
```

**Solution 2: Set Correct Permissions**

```bash
sudo chown -R $(id -u):$(id -g) backend/
```

**Solution 3: Use User ID Mapping (Advanced)**

Add to `docker-compose.dev.yml`:
```yaml
backend:
  user: "${UID:-1000}:${GID:-1000}"
```

### 4.5 Database Schema Changes Not Applying

**Symptom**: Prisma schema changes don't take effect, database errors.

**Solution**: Database schema changes require manual migration:

```bash
# Run database migration
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate dev

# Optional: Open Prisma Studio
docker-compose -f docker-compose.dev.yml exec backend npx prisma studio
```

---

## 5. Rollback Plan

### 5.1 Quick Rollback (Full Revert)

If hot reloading causes issues and you need to revert completely:

**Step 1: Stop Containers**
```bash
docker-compose -f docker-compose.dev.yml down
```

**Step 2: Restore Backup**
```bash
# If you created a backup before
cp docker-compose.dev.yml.backup docker-compose.dev.yml

# If no backup exists, you'll need to manually revert changes
# See section 5.2 below
```

**Step 3: Remove Nodemon Configuration**
```bash
rm backend/nodemon.json
```

**Step 4: Rebuild with Original Configuration**
```bash
docker-compose -f docker-compose.dev.yml build
```

**Step 5: Start Containers**
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 5.2 Manual Rollback (Without Backup)

If you don't have a backup, manually revert the following changes in [`docker-compose.dev.yml`](docker-compose.dev.yml:1):

**Frontend Service Changes to Revert**:

| Line | Original | Change To |
|------|----------|-----------|
| 46 | `dockerfile: Dockerfile.dev` | `dockerfile: Dockerfile` |
| 60 | `NODE_ENV=development` | `NODE_ENV=production` |
| 74-76 | Hot reload env vars | Remove lines 74-76 |
| 77-88 | Volume mounts | Remove these lines |

**Backend Service Changes to Revert**:

| Line | Original | Change To |
|------|----------|-----------|
| 97 | `dockerfile: Dockerfile.dev` | `dockerfile: Dockerfile` |
| 107 | `NODE_ENV=development` | `NODE_ENV=production` |
| 150-157 | Volume mounts | Remove these lines |

**Volume Definition to Remove**:

| Lines | Change |
|-------|--------|
| 308-311 | Remove `frontend_next_cache` volume |

### 5.3 Partial Rollback

**Rollback Frontend Only** (Keep Backend Hot Reload):

1. Revert lines 46, 60, 74-76, 77-88 in [`docker-compose.dev.yml`](docker-compose.dev.yml:1)
2. Keep backend changes intact
3. Rebuild and restart:
```bash
docker-compose -f docker-compose.dev.yml build frontend
docker-compose -f docker-compose.dev.yml restart frontend
```

**Rollback Backend Only** (Keep Frontend Hot Reload):

1. Revert lines 97, 107, 150-157 in [`docker-compose.dev.yml`](docker-compose.dev.yml:1)
2. Remove [`backend/nodemon.json`](backend/nodemon.json:1)
3. Keep frontend changes intact
4. Rebuild and restart:
```bash
docker-compose -f docker-compose.dev.yml build backend
docker-compose -f docker-compose.dev.yml restart backend
```

---

## 6. Important Notes

### 6.1 Files NOT Changed

The following files remain **completely unchanged** and are not affected by this implementation:

| File | Status | Notes |
|------|--------|-------|
| `docker-compose.yml` | Unchanged | Production configuration |
| `frontend/Dockerfile` | Unchanged | Production frontend Dockerfile |
| `backend/Dockerfile` | Unchanged | Production backend Dockerfile |
| `frontend/package.json` | Unchanged | Frontend dependencies |
| `backend/package.json` | Unchanged | Backend dependencies |
| `docker-compose.override.yml` | Unchanged (if exists) | Local overrides |

### 6.2 When to Use Each Configuration

| File | When to Use | Purpose |
|------|-------------|---------|
| `docker-compose.dev.yml` | Daily development | Hot reloading enabled, dev mode |
| `docker-compose.yml` | Production deployment | Optimized for performance, no hot reload |

**Usage Examples**:

```bash
# Development with hot reload
docker-compose -f docker-compose.dev.yml up -d

# Production build
docker-compose -f docker-compose.yml build
docker-compose -f docker-compose.yml up -d

# Never use -v flag (removes all data)
docker-compose -f docker-compose.dev.yml down -v  # DON'T DO THIS
```

### 6.3 Best Practices for Development Workflow

**DO**:

1. **Use docker-compose.dev.yml for development**
   ```bash
   # Correct
   docker-compose -f docker-compose.dev.yml up -d
   
   # Incorrect
   docker-compose up -d  # Uses docker-compose.yml
   ```

2. **Create backups before major changes**
   ```bash
   cp docker-compose.dev.yml docker-compose.dev.yml.backup
   ```

3. **Monitor container logs during development**
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f
   ```

4. **Rebuild when adding dependencies**
   ```bash
   docker-compose -f docker-compose.dev.yml build --no-cache service_name
   ```

5. **Use meaningful commit messages for config changes**
   ```bash
   git commit -m "chore: update docker-compose.dev.yml for hot reload"
   ```

**DON'T**:

1. **Don't use `docker-compose down -v`** - This removes all data volumes
2. **Don't edit files outside mounted directories** - Changes won't be reflected
3. **Don't mix dev and prod Dockerfiles** - Use the correct compose file
4. **Don't ignore container logs** - They provide early warning of issues
5. **Don't forget to restart after env var changes** - Hot reload doesn't apply

### 6.4 Performance Optimization Tips

**For Windows Users**:

1. **Excluded folders from Windows Defender**:
   ```powershell
   Add-MpPreference -ExclusionPath "C:\path\to\project\backend\node_modules"
   Add-MpPreference -ExclusionPath "C:\path\to\project\frontend\.next"
   ```

2. **Use WSL2** (Recommended):
   ```powershell
   wsl
   cd /mnt/e/Drive_D_Backup/Smart_Tech_B2C_Website_Redevelopment
   docker-compose -f docker-compose.dev.yml up -d
   ```

**For macOS Users**:

1. **Consider using docker-sync** for better volume performance:
   ```bash
   gem install docker-sync
   docker-sync start
   ```

**For Linux Users**:

1. **Increase inotify limits**:
   ```bash
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

### 6.5 Troubleshooting Quick Reference

| Problem | Quick Check | Solution |
|---------|------------|----------|
| Changes not appearing | Check volume mounts | Verify `./backend:/app` mount exists |
| High CPU | Check polling settings | Increase poll intervals |
| Module errors | Check node_modules | Rebuild container |
| Permission errors | Check file ownership | Run `chown` command |
| Backend not restarting | Check nodemon logs | Verify `backend/nodemon.json` exists |
| Frontend not reloading | Check Next.js logs | Verify `NODE_ENV=development` |
| Database issues | Check connection | Verify `DATABASE_URL` environment variable |

---

## 7. Quick Reference Commands

### Development Commands

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Restart a service
docker-compose -f docker-compose.dev.yml restart frontend

# Stop all services
docker-compose -f docker-compose.dev.yml down

# Rebuild a service
docker-compose -f docker-compose.dev.yml build --no-cache frontend

# Check service status
docker-compose -f docker-compose.dev.yml ps

# Check container resources
docker stats
```

### Database Commands

```bash
# Backup database
docker exec -i smarttech_postgres pg_dump -U smart_dev smart_ecommerce_dev > backup.sql

# Run Prisma migration
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate dev

# Open Prisma Studio
docker-compose -f docker-compose.dev.yml exec backend npx prisma studio
```

### Troubleshooting Commands

```bash
# Verify volume mounts
docker-compose -f docker-compose.dev.yml config | grep -A 10 volumes

# Check environment variables
docker-compose -f docker-compose.dev.yml exec frontend env | grep NODE_ENV

# Check file permissions
docker-compose -f docker-compose.dev.yml exec backend ls -la /app

# View detailed logs
docker-compose -f docker-compose.dev.yml logs backend --details
```

---

## 8. File Reference

### Modified Files

| File | Change Type | Purpose |
|------|-------------|---------|
| [`docker-compose.dev.yml`](docker-compose.dev.yml:1) | Modified | Added volume mounts and dev environment |
| [`backend/nodemon.json`](backend/nodemon.json:1) | Created | Backend hot reload configuration |

### Related Files

| File | Purpose |
|------|---------|
| [`plans/docker-hot-reloading-solution.md`](plans/docker-hot-reloading-solution.md:1) | Technical specification |
| [`frontend/Dockerfile.dev`](frontend/Dockerfile.dev:1) | Frontend development Dockerfile |
| [`backend/Dockerfile.dev`](backend/Dockerfile.dev:1) | Backend development Dockerfile |
| [`backend/scripts/docker-startup.sh`](backend/scripts/docker-startup.sh:1) | Backend startup script |
| [`frontend/next.config.js`](frontend/next.config.js:1) | Next.js configuration |

---

**Document Version**: 1.0  
**Created**: 2026-02-16  
**Status**: Complete
