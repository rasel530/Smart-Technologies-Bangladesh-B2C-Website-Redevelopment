# Docker Networking Fix - NextAuth Authentication

## Problem Summary

NextAuth was unable to authenticate users due to a Docker networking issue. The frontend container was trying to connect to `http://localhost:3001/api/v1` to reach the backend, but inside Docker containers, `localhost` refers to the container itself, not other containers.

### Error Details
- **Error**: `ECONNREFUSED 127.0.0.1:3001`
- **Root Cause**: Frontend container using `localhost:3001` to connect to backend container
- **Impact**: Users could not log in through NextAuth

## Solution Implemented

### 1. Updated Docker Compose Configuration

**File**: [`docker-compose.yml`](docker-compose.yml:11)

Added a new environment variable for server-side backend API calls:

```yaml
environment:
  - NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
  - NEXT_PUBLIC_APP_URL=http://localhost:3000
  - NEXT_PUBLIC_BACKEND_API_URL=http://localhost:3001/api/v1
  - BACKEND_API_URL=http://backend:3000/api/v1  # NEW: Server-side Docker URL
  - NODE_ENV=development
  - IS_DOCKER=true
  - NEXT_PRIVATE_SKIP_SWC=1
```

**Key Points**:
- `NEXT_PUBLIC_*` variables are for browser-side requests (still use `localhost:3001`)
- `BACKEND_API_URL` is for server-side requests (uses Docker service name `backend:3000`)
- Browser requests go through port mapping (localhost:3001 → backend:3000)
- Server-side requests use internal Docker network (backend:3000)

### 2. Updated NextAuth Configuration

**File**: [`frontend/src/app/api/auth/[...nextauth]/route.ts`](frontend/src/app/api/auth/[...nextauth]/route.ts:8)

Modified the backend URL resolution to prioritize server-side environment variable:

```typescript
// Backend API URL
// Use BACKEND_API_URL for server-side requests (Docker environment)
// Fall back to NEXT_PUBLIC_API_URL for local development
const BACKEND_API_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
```

**Key Points**:
- NextAuth runs server-side, so it needs the Docker service name
- Falls back to `NEXT_PUBLIC_API_URL` for local development
- Provides backward compatibility

### 3. Created Docker-Specific Environment File

**File**: [`frontend/.env.docker`](frontend/.env.docker)

Created a dedicated Docker environment file with proper configuration:

```env
# Server-side backend URL (for NextAuth and other server-side code)
# In Docker, containers use service names to communicate
BACKEND_API_URL=http://backend:3000/api/v1

# Keep NEXT_PUBLIC_* variables for browser-side requests
# Browser still accesses backend via localhost (port mapping)
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Docker Network Architecture

### Before Fix
```
Browser → Frontend Container (localhost:3000)
                      ↓
                 localhost:3001 ❌ (refused - points to frontend itself)
                      ↓
              Backend Container (port 3000)
```

### After Fix
```
Browser → Frontend Container (localhost:3000)
                      ↓
          NEXT_PUBLIC_API_URL=http://localhost:3001 (browser requests)
                      ↓
              Port Mapping (3001:3000)
                      ↓
              Backend Container (port 3000)

Server-side (NextAuth) → BACKEND_API_URL=http://backend:3000/api/v1
                              ↓
                      Docker Service Name Resolution
                              ↓
              Backend Container (port 3000)
```

## Verification

### 1. Container Status
All 8 services running successfully:
- ✅ smarttech_frontend (port 3000)
- ✅ smarttech_backend (port 3001:3000)
- ✅ smarttech_postgres (port 5432)
- ✅ smarttech_redis (port 6379)
- ✅ smarttech_elasticsearch (port 9200)
- ✅ smarttech_qdrant (port 6333-6334)
- ✅ smarttech_ollama (port 11434)
- ✅ smarttech_pgadmin (port 5050)

### 2. Network Connectivity Test
```bash
# Test from frontend container to backend using service name
docker exec smarttech_frontend node -e "const http = require('http'); const options = { hostname: 'backend', port: 3000, path: '/api/v1/health', method: 'GET' }; const req = http.request(options, (res) => { console.log('Status:', res.statusCode); process.exit(0); }); req.on('error', (err) => { console.error('Error:', err.message); process.exit(1); }); req.end();"
```

**Result**: ✅ Status: 200

### 3. Environment Variables Verification
```bash
docker exec smarttech_frontend env | findstr BACKEND
```

**Result**:
```
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:3001/api/v1
BACKEND_API_URL=http://backend:3000/api/v1
```

### 4. NextAuth Login Test
```bash
cd frontend && node test-docker-networking-fix.js
```

**Result**:
```
✅ Backend is accessible (Status: 200)
✅ External connectivity working (localhost:3001)
✅ NextAuth redirecting successfully
✅ LOGIN TEST PASSED - NextAuth authentication working!
```

## Key Changes Summary

| File | Change | Purpose |
|------|---------|---------|
| [`docker-compose.yml`](docker-compose.yml:11) | Added `BACKEND_API_URL=http://backend:3000/api/v1` | Server-side Docker URL |
| [`frontend/src/app/api/auth/[...nextauth]/route.ts`](frontend/src/app/api/auth/[...nextauth]/route.ts:8) | Updated `BACKEND_API_URL` resolution | Use Docker service name |
| [`frontend/.env.docker`](frontend/.env.docker) | Created Docker-specific env file | Docker configuration |

## How It Works

1. **Browser Requests**: Use `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`
   - Browser sends request to `localhost:3001`
   - Docker port mapping forwards to backend container port 3000
   - Works because browser is outside Docker network

2. **Server-Side Requests (NextAuth)**: Use `BACKEND_API_URL=http://backend:3000/api/v1`
   - NextAuth runs inside frontend container
   - Uses Docker service name `backend` to resolve backend container
   - Direct container-to-container communication via Docker network

3. **Docker Network**: All containers in `smarttech_network`
   - Service names resolve to container IP addresses
   - `backend` resolves to `smarttech_backend` container
   - No need for `localhost` references

## Testing Instructions

### 1. Verify Containers Running
```bash
docker-compose ps
```

### 2. Check Environment Variables
```bash
docker exec smarttech_frontend env | findstr BACKEND
```

### 3. Test Network Connectivity
```bash
docker exec smarttech_frontend node -e "const http = require('http'); const options = { hostname: 'backend', port: 3000, path: '/api/v1/health', method: 'GET' }; const req = http.request(options, (res) => { console.log('Status:', res.statusCode); process.exit(0); }); req.on('error', (err) => { console.error('Error:', err.message); process.exit(1); }); req.end();"
```

### 4. Test NextAuth Login
```bash
cd frontend && node test-docker-networking-fix.js
```

### 5. Manual Browser Test
1. Open http://localhost:3000/login
2. Enter test credentials
3. Verify successful login and redirect to dashboard

## Troubleshooting

### Issue: Still getting ECONNREFUSED
**Solution**:
1. Verify containers are in same network: `docker network inspect smarttech_network`
2. Check backend service name matches docker-compose: `backend`
3. Restart containers: `docker-compose restart`

### Issue: NextAuth not using correct URL
**Solution**:
1. Check environment variable: `docker exec smarttech_frontend env | grep BACKEND_API_URL`
2. Verify NextAuth config uses `process.env.BACKEND_API_URL`
3. Rebuild frontend: `docker-compose up -d --build frontend`

### Issue: Browser requests failing
**Solution**:
1. Verify port mapping: `docker-compose ps` (should show `0.0.0.0:3001->3000/tcp`)
2. Check firewall settings
3. Ensure backend is listening on port 3000

## Production Considerations

For production deployment, update the environment variables:

```yaml
environment:
  - NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
  - NEXT_PUBLIC_APP_URL=https://yourdomain.com
  - NEXT_PUBLIC_BACKEND_API_URL=https://api.yourdomain.com/api/v1
  - BACKEND_API_URL=http://backend:3000/api/v1  # Still uses Docker service name
```

## Conclusion

The Docker networking issue has been successfully resolved. NextAuth can now authenticate users by:

1. Using `BACKEND_API_URL=http://backend:3000/api/v1` for server-side requests
2. Maintaining `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1` for browser requests
3. Leveraging Docker's built-in service name resolution
4. Eliminating ECONNREFUSED errors

The fix is backward compatible and works in both Docker and local development environments.

---

**Date**: 2026-01-10  
**Status**: ✅ Complete and Verified  
**Test Results**: All tests passing
