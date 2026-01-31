# Category Display Issue - Diagnosis Report

**Date:** 2026-01-27
**Issue:** Categories not displaying on frontend pages (http://localhost:3000/categories and http://localhost:3000/admin/categories)

---

## Executive Summary

**ROOT CAUSE IDENTIFIED:** Next.js rewrite configuration in [`frontend/next.config.js`](frontend/next.config.js:32) is configured for Docker environment (`http://backend:3000`) but the application is running in local development mode where backend is on port 3001.

**IMPACT:** Frontend cannot fetch categories because requests are being proxied to the wrong backend URL.

---

## Investigation Findings

### 1. Backend API Status ✅ WORKING

**Test Command:** `curl http://localhost:3001/api/v1/categories`

**Result:** ✅ **SUCCESS** - Backend API is working correctly and returning 30 categories

```json
{
  "categories": [...30 categories...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 30,
    "pages": 1
  }
}
```

**Backend Route:** [`backend/routes/categories.js`](backend/routes/categories.js:185-270)
- Endpoint: `GET /api/v1/categories`
- Returns paginated list of categories with hierarchy support
- No authentication required for public read operations

### 2. Database Status ✅ WORKING

**Schema:** [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma:129-154)
- Category model exists with proper fields
- 30 categories confirmed in database
- Status field properly configured (active/inactive)

### 3. Frontend API Client Configuration ✅ CORRECT

**File:** [`frontend/src/lib/api/client.ts`](frontend/src/lib/api/client.ts:5-7)

```typescript
const API_BASE_URL = typeof window === 'undefined' 
  ? process.env.BACKEND_API_URL || 'http://backend:3000/api/v1'
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
```

**Analysis:**
- Client-side requests: `http://localhost:3001/api/v1` ✅ CORRECT
- Server-side requests: `http://backend:3000/api/v1` ❌ INCORRECT for local dev

### 4. Frontend Environment Variables ✅ CORRECT

**File:** [`frontend/.env`](frontend/.env:25-26)

```bash
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:3001/api
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

**Analysis:** Environment variables are correctly set for local development.

### 5. Next.js Rewrite Configuration ❌ PROBLEM FOUND

**File:** [`frontend/next.config.js`](frontend/next.config.js:29-61)

```javascript
async rewrites() {
  // Always use Docker network URL since we're running in Docker
  // The backend service is accessible at http://backend:3000 within Docker network
  const backendUrl = 'http://backend:3000';
  
  return [
    // Proxy other /api/v1 routes to backend (excluding profile)
    {
      source: '/api/v1/:path((?!profile).)*',
      destination: `${backendUrl}/api/v1/:path*`,
    },
    // ...
  ];
}
```

**PROBLEM:** The rewrite configuration is hardcoded to use `http://backend:3000` which is a Docker internal network URL. This works in Docker but **fails in local development**.

### 6. Frontend Pages ✅ CORRECT IMPLEMENTATION

**Public Categories Page:** [`frontend/src/app/categories/page.tsx`](frontend/src/app/categories/page.tsx:37-58)
- Uses `getCategories({ tree: true })` and `getCategoryTree()` API functions
- Properly handles loading, error, and empty states
- No issues in implementation

**Admin Categories Page:** [`frontend/src/app/admin/categories/page.tsx`](frontend/src/app/admin/categories/page.tsx:28-42)
- Uses `getCategoryStats()` API function
- Properly handles loading, error, and empty states
- No issues in implementation

**CategoryList Component:** [`frontend/src/components/admin/CategoryList.tsx`](frontend/src/components/admin/CategoryList.tsx:22-39)
- Uses `getCategories({ tree: true })` API function
- Properly handles loading, error, and empty states
- No issues in implementation

---

## Root Cause Analysis

### Primary Issue: Next.js Rewrite Configuration Mismatch

**Location:** [`frontend/next.config.js`](frontend/next.config.js:32)

The rewrite configuration is hardcoded for Docker environment:

```javascript
const backendUrl = 'http://backend:3000';
```

**Why this causes the problem:**

1. **Server-side requests** use `process.env.BACKEND_API_URL || 'http://backend:3000/api/v1'`
2. **Next.js rewrites** intercept `/api/v1/*` requests and proxy them to `http://backend:3000/api/v1/*`
3. **Client-side requests** use `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'`

**The conflict:**
- When frontend makes a server-side request (SSR) or when Next.js rewrites intercept the request, it tries to proxy to `http://backend:3000`
- This Docker internal URL is not accessible in local development environment
- Backend is actually running on `http://localhost:3001`

### Secondary Issue: Server-Side API Base URL

**Location:** [`frontend/src/lib/api/client.ts`](frontend/src/lib/api/client.ts:5-6)

```typescript
const API_BASE_URL = typeof window === 'undefined' 
  ? process.env.BACKEND_API_URL || 'http://backend:3000/api/v1'
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
```

**Problem:** Server-side requests default to `http://backend:3000/api/v1` instead of using the environment variable.

---

## Possible Solutions

### Solution 1: Fix Next.js Rewrite Configuration (RECOMMENDED)

**File:** [`frontend/next.config.js`](frontend/next.config.js:29-61)

**Change:**
```javascript
async rewrites() {
  // Use environment variable for backend URL, fallback to localhost:3001 for local dev
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';
  
  return [
    // Keep NextAuth routes on frontend - do not proxy to backend
    {
      source: '/api/auth/:path*',
      destination: '/api/auth/:path*',
    },
    // Keep profile routes on frontend - do not proxy to backend (handled by custom route)
    {
      source: '/api/v1/profile/:path*',
      destination: '/api/v1/:path*',
    },
    // Proxy other /api/v1 routes to backend (excluding profile)
    {
      source: '/api/v1/:path((?!profile).)*',
      destination: `${backendUrl}/api/v1/:path*`,
    },
    // Proxy other /api routes to backend (excluding /api/auth and /api/v1)
    {
      source: '/api/:path((?!auth|v1).)*',
      destination: `${backendUrl}/api/:path*`,
    },
    // Proxy static file uploads to avoid CORS issues
    {
      source: '/uploads/:path*',
      destination: `${backendUrl}/uploads/:path*`,
    },
  ];
}
```

### Solution 2: Fix Server-Side API Base URL

**File:** [`frontend/src/lib/api/client.ts`](frontend/src/lib/api/client.ts:5-7)

**Change:**
```typescript
const API_BASE_URL = typeof window === 'undefined' 
  ? process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001/api/v1'
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
```

### Solution 3: Add Environment Variable for Docker Detection

**File:** [`frontend/next.config.js`](frontend/next.config.js:29-61)

**Change:**
```javascript
async rewrites() {
  // Detect if running in Docker or local development
  const isDocker = process.env.DOCKER_ENV === 'true' || process.env.NODE_ENV === 'production';
  const backendUrl = isDocker 
    ? 'http://backend:3000' 
    : (process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001');
  
  return [
    // ... same rewrites ...
  ];
}
```

---

## Recommended Fix

**Apply both Solution 1 and Solution 2 for complete fix:**

1. Update [`frontend/next.config.js`](frontend/next.config.js:32) to use environment variable
2. Update [`frontend/src/lib/api/client.ts`](frontend/src/lib/api/client.ts:5-6) to fallback to environment variable

This ensures:
- Local development works with `http://localhost:3001`
- Docker environment works with `http://backend:3000`
- Production can be configured with appropriate URL

---

## Verification Steps

After applying the fix:

1. **Clear browser cache** and hard refresh pages
2. **Check browser console** for any network errors
3. **Test public categories page** at http://localhost:3000/categories
4. **Test admin categories page** at http://localhost:3000/admin/categories
5. **Verify API requests** are going to correct backend URL (check Network tab in DevTools)

---

## Additional Notes

- Backend API is working correctly ✅
- Database has 30 categories ✅
- Frontend components are properly implemented ✅
- Frontend environment variables are correct ✅
- **Only issue is the Next.js rewrite configuration** ❌

The fix is straightforward and should resolve the issue immediately once applied.
