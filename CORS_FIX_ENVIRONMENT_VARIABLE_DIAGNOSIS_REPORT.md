# CORS Fix Environment Variable Diagnosis Report

**Date:** 2026-01-26  
**Issue:** Frontend still using wrong API URL after environment variable update  
**Status:** DIAGNOSIS COMPLETE - ROOT CAUSE IDENTIFIED

---

## Executive Summary

The CORS fix did not work because the **Dockerfile contains hardcoded environment variables** that override the `.env` file during the build process. Even though the `.env` file and docker-compose.yml have the correct values, the Docker build process uses the old hardcoded values, which get baked into the Next.js JavaScript bundle.

---

## Detailed Findings

### 1. `.env` File Content ✓ CORRECT

**File:** [`frontend/.env`](frontend/.env:27)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

**Status:** ✅ The `.env` file has the CORRECT value (`localhost:3001`)

---

### 2. Container Environment Variable ✓ CORRECT

**Command executed:**
```bash
docker exec smarttech_frontend env | findstr NEXT_PUBLIC_API_URL
```

**Result:**
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

**Status:** ✅ The container's runtime environment has the CORRECT value (`localhost:3001`)

---

### 3. Other `.env` Files Found ⚠️ CONFLICT IDENTIFIED

**Files found in frontend directory:**
- `.env` - Main environment file (correct value)
- `.env.docker` - Docker-specific environment file (**INCORRECT VALUE**)
- `.env.example` - Template file (not used)

**File:** [`frontend/.env.docker`](frontend/.env.docker:13)

```env
NEXT_PUBLIC_API_URL=http://backend:3000/api/v1
```

**Status:** ⚠️ The `.env.docker` file has the INCORRECT value (`backend:3000`)

---

### 4. Docker Compose Configuration ✓ CORRECT

**File:** [`docker-compose.yml`](docker-compose.yml:15)

```yaml
environment:
  - NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

**Status:** ✅ docker-compose.yml passes the CORRECT value at runtime

---

### 5. Dockerfile Build Configuration ❌ ROOT CAUSE

**File:** [`frontend/Dockerfile`](frontend/Dockerfile:35-36)

```dockerfile
ENV NEXT_PUBLIC_API_URL=http://backend:3000/api/v1
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Status:** ❌ **ROOT CAUSE IDENTIFIED**

The Dockerfile contains **hardcoded ENV statements** in the builder stage that set the environment variables at **BUILD TIME**. These values override the `.env` file and get baked into the Next.js bundle.

---

### 6. Next.js Build Behavior Analysis

**How Next.js handles `NEXT_PUBLIC_*` variables:**

1. **Build Time:** Next.js reads `NEXT_PUBLIC_*` environment variables and **replaces them with their actual values** in the client-side JavaScript bundle
2. **Runtime:** The baked-in values are used - runtime environment variables have NO effect on client-side bundles
3. **Server-side code:** Can read environment variables at runtime, but client-side code cannot

**The Problem:**
```
Docker Build Process:
1. Dockerfile sets: ENV NEXT_PUBLIC_API_URL=http://backend:3000/api/v1
2. Next.js reads this value at BUILD TIME
3. Next.js bakes "http://backend:3000/api/v1" into the JavaScript bundle
4. Bundle is copied to the production image
5. Container starts with runtime env: NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
6. Browser loads bundle with hardcoded: "http://backend:3000/api/v1" ❌
```

---

### 7. Container Build Timeline

**Container created:** 2026-01-26T10:12:08  
**.next directory files created:** 2026-01-26T09:53-09:55  

The `.next` directory (containing the built bundles) was created **before** the container was created, confirming it was built during the Docker image build process.

---

## Root Cause Analysis

### Primary Issue: Dockerfile Hardcoded Environment Variables

The [`frontend/Dockerfile`](frontend/Dockerfile:35-36) contains hardcoded ENV statements:

```dockerfile
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_PUBLIC_API_URL=http://backend:3000/api/v1  # ❌ PROBLEM HERE
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000

RUN npm run build  # Build happens with WRONG values
```

### Why the Rebuild Didn't Work

When you ran `docker-compose up --build frontend`:

1. ✅ The `.env` file was updated with the correct value
2. ✅ The `docker-compose.yml` passes the correct value at runtime
3. ❌ **BUT** the Dockerfile's hardcoded ENV statements override the `.env` file during build
4. ❌ Next.js builds with the old value and bakes it into the bundle
5. ❌ The runtime environment variable has no effect on the already-baked bundle

### Secondary Issue: `.env.docker` File

The [`frontend/.env.docker`](frontend/.env.docker:13) file also contains the old value and could be causing confusion, but it's not the primary issue since the Dockerfile's ENV statements take precedence.

---

## Environment Variable Precedence

During Docker build (highest to lowest priority):

1. **Dockerfile ENV statements** (line 35-36) ❌ **WINS** - Sets `http://backend:3000/api/v1`
2. `.env.docker` file - Sets `http://backend:3000/api/v1`
3. `.env` file - Sets `http://localhost:3001/api/v1` ✅
4. docker-compose.yml environment variables - Only affect runtime, not build

---

## Recommendations

### Option 1: Update Dockerfile ENV Statements (RECOMMENDED)

**File:** [`frontend/Dockerfile`](frontend/Dockerfile:35-36)

**Change:**
```dockerfile
# OLD (INCORRECT)
ENV NEXT_PUBLIC_API_URL=http://backend:3000/api/v1
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000

# NEW (CORRECT)
ENV NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Then rebuild:**
```bash
docker-compose up --build frontend --force-recreate
```

---

### Option 2: Remove Dockerfile ENV Statements (ALTERNATIVE)

**File:** [`frontend/Dockerfile`](frontend/Dockerfile:35-36)

**Remove lines 35-36:**
```dockerfile
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# REMOVE THESE LINES:
# ENV NEXT_PUBLIC_API_URL=http://backend:3000/api/v1
# ENV NEXT_PUBLIC_APP_URL=http://localhost:3000

RUN npm run build
```

**This will allow Next.js to read from `.env` file during build.**

**Then rebuild:**
```bash
docker-compose up --build frontend --force-recreate
```

---

### Option 3: Use Build Arguments (MOST FLEXIBLE)

**File:** [`docker-compose.yml`](docker-compose.yml:3-5)

**Update frontend service:**
```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
    args:
      - NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
      - NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**File:** [`frontend/Dockerfile`](frontend/Dockerfile:35-36)

**Update builder stage:**
```dockerfile
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

RUN npm run build
```

---

### Option 4: Update `.env.docker` File (CLEANUP)

**File:** [`frontend/.env.docker`](frontend/.env.docker:13)

**Change:**
```env
# OLD (INCORRECT)
NEXT_PUBLIC_API_URL=http://backend:3000/api/v1

# NEW (CORRECT)
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

**Note:** This alone won't fix the issue, but it's good for consistency.

---

## Verification Steps

After applying any fix, verify:

1. **Check the built bundle:**
   ```bash
   docker exec smarttech_frontend grep -r "localhost:3001" /app/.next/static/chunks
   ```

2. **Check browser console:**
   - Open browser DevTools
   - Navigate to http://localhost:3000
   - Check console for API requests
   - Verify URL shows `http://localhost:3001/api/v1`

3. **Test API call:**
   - Make a request to the categories endpoint
   - Verify no CORS errors
   - Verify successful response

---

## Summary

| Component | Value | Status |
|-----------|-------|--------|
| [`frontend/.env`](frontend/.env:27) | `http://localhost:3001/api/v1` | ✅ Correct |
| Container runtime env | `http://localhost:3001/api/v1` | ✅ Correct |
| [`docker-compose.yml`](docker-compose.yml:15) | `http://localhost:3001/api/v1` | ✅ Correct |
| [`frontend/.env.docker`](frontend/.env.docker:13) | `http://backend:3000/api/v1` | ⚠️ Incorrect |
| [`frontend/Dockerfile`](frontend/Dockerfile:35-36) | `http://backend:3000/api/v1` | ❌ **ROOT CAUSE** |

---

## Next Steps

1. **Choose a fix option** (Option 1 is recommended)
2. **Apply the fix** to the Dockerfile
3. **Rebuild the frontend container:**
   ```bash
   docker-compose up --build frontend --force-recreate
   ```
4. **Clear browser cache** (Ctrl+Shift+R or Cmd+Shift+R)
5. **Verify the fix** using the verification steps above

---

## Additional Notes

- **Next.js caching:** After fixing, you may need to clear the `.next` directory locally if doing local development
- **Browser caching:** Always hard refresh (Ctrl+Shift+R) after rebuilding to ensure you get the new JavaScript bundle
- **Docker layer caching:** Use `--no-cache` flag if you suspect Docker is using cached build layers:
  ```bash
  docker-compose build --no-cache frontend
  ```

---

**Report Generated:** 2026-01-26T10:26:00Z  
**Diagnosis Method:** Systematic investigation of environment variable precedence and Next.js build behavior  
**Root Cause:** Dockerfile hardcoded ENV statements override .env file during build
