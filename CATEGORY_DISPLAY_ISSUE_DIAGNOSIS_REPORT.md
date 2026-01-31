# Category Display Issue - Detailed Diagnosis Report

**Date:** 2026-01-27  
**Issue:** Categories not displaying on `/admin/categories` or `/categories` pages after Docker rebuild with environment variable configuration

---

## Executive Summary

After analyzing the codebase, I've identified **5-7 potential sources** of the problem and narrowed them down to the **2 most likely root causes**. I've added comprehensive diagnostic logging to validate these assumptions.

---

## Potential Problem Sources (5-7)

### 1. **Environment Variable Mismatch** ⚠️ HIGH PRIORITY
**Location:** [`docker-compose.yml`](docker-compose.yml:15-18) & [`frontend/src/lib/api/client.ts`](frontend/src/lib/api/client.ts:5-7)

**Issue:**
- Docker sets `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`
- Docker also sets `NEXT_PUBLIC_BACKEND_API_URL=http://host.docker.internal:3001/api/v1`
- Client-side API client uses `NEXT_PUBLIC_API_URL` (not `NEXT_PUBLIC_BACKEND_API_URL`)
- This creates a mismatch between Docker environment variables and runtime usage

**Impact:** Client-side requests may be going to wrong URL

### 2. **API Client Not Using Next.js Rewrites** ⚠️ HIGH PRIORITY
**Location:** [`frontend/src/lib/api/client.ts`](frontend/src/lib/api/client.ts:295-310)

**Issue:**
- API client makes direct `fetch()` calls to backend
- Does NOT use Next.js rewrites configured in [`next.config.js`](frontend/next.config.js:29-61)
- Next.js rewrites are configured but never used by client-side code

**Impact:** Bypasses Next.js proxy layer, potential CORS/network issues

### 3. **Browser Caching (304 Not Modified)**
**Location:** Browser DevTools

**Issue:**
- User reports 304 Not Modified response for `/admin/categories/new`
- Browser may be serving cached responses
- Cache headers may not be properly configured

**Impact:** Old cached data being displayed instead of fresh data

### 4. **Backend API Not Responding**
**Location:** Backend container

**Issue:**
- Backend may not be running or not responding on port 3001
- API endpoints may be throwing errors
- Database connection issues

**Impact:** No data available to display

### 5. **Client-Side Rendering vs Server-Side Rendering**
**Location:** [`frontend/src/app/admin/categories/page.tsx`](frontend/src/app/admin/categories/page.tsx:1) & [`frontend/src/app/categories/page.tsx`](frontend/src/app/categories/page.tsx:14)

**Issue:**
- Both pages use `'use client'` directive
- API calls happen in browser, not on server
- Server-side environment variables may not be available

**Impact:** Client-side may not have access to correct environment variables

### 6. **Authentication Issues**
**Location:** [`frontend/src/lib/api/client.ts`](frontend/src/lib/api/client.ts:171-186)

**Issue:**
- Admin categories page requires authentication
- Token may be missing or expired
- Authorization header may not be set correctly

**Impact:** API requests failing with 401/403 errors

### 7. **Next.js Build Cache**
**Location:** `.next` directory

**Issue:**
- Docker rebuild may not have cleared Next.js build cache
- Old environment variables may be baked into build
- Changes not reflected in production build

**Impact:** Code using old configuration

---

## Most Likely Root Causes (Top 2)

### 🎯 Root Cause #1: Environment Variable Configuration Mismatch

**Confidence Level:** HIGH (85%)

**Evidence:**
1. Docker Compose sets TWO different environment variables:
   ```yaml
   environment:
     - NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1          # Used by client-side
     - NEXT_PUBLIC_BACKEND_API_URL=http://host.docker.internal:3001/api/v1  # NOT used by client-side
   ```

2. API Client configuration:
   ```typescript
   const API_BASE_URL = typeof window === 'undefined' 
     ? process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001/api/v1'
     : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
   ```

3. **The Problem:** Client-side uses `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`, but:
   - From browser perspective, `localhost:3001` should work if backend is exposed
   - However, if backend is not accessible from browser, requests will fail
   - The `NEXT_PUBLIC_BACKEND_API_URL` with `host.docker.internal` is never used by client-side

4. **Why it's likely:** The environment variable setup is inconsistent and confusing

---

### 🎯 Root Cause #2: API Client Bypassing Next.js Rewrites

**Confidence Level:** MEDIUM-HIGH (70%)

**Evidence:**
1. Next.js config has rewrites configured:
   ```javascript
   async rewrites() {
     const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';
     return [
       {
         source: '/api/v1/:path((?!profile).)*',
         destination: `${backendUrl}/api/v1/:path*`,
       },
       // ...
     ];
   }
   ```

2. But API client makes direct fetch calls:
   ```typescript
   const url = `${API_BASE_URL}${endpoint}`;  // Direct URL, not using rewrites
   const response = await withTimeout(fetch(url, config), timeout);
   ```

3. **The Problem:** 
   - Next.js rewrites are designed to proxy API requests
   - But client-side code bypasses this proxy layer
   - This can cause CORS issues and network problems

4. **Why it's likely:** The rewrite configuration exists but is never used, suggesting a design issue

---

## Diagnostic Logging Added

I've added comprehensive diagnostic logging to help validate these assumptions:

### 1. API Client Configuration Logging
**File:** [`frontend/src/lib/api/client.ts`](frontend/src/lib/api/client.ts:4-20)

**What it logs:**
- Whether running server-side or client-side
- The actual `API_BASE_URL` being used
- All environment variables being read
- `window.location.origin` (client-side only)

**Expected output:**
```
[API Client] ================================================
[API Client] API_BASE_URL Configuration:
[API Client] - isServer: false
[API Client] - API_BASE_URL: http://localhost:3001/api/v1
[API Client] - NEXT_PUBLIC_API_URL: http://localhost:3001/api/v1
[API Client] - NEXT_PUBLIC_BACKEND_API_URL: http://host.docker.internal:3001/api/v1
[API Client] - window.location.origin: http://localhost:3000
[API Client] ================================================
```

### 2. Categories API Function Logging
**File:** [`frontend/src/lib/api/categories.ts`](frontend/src/lib/api/categories.ts:49-70)

**What it logs:**
- When `getCategories()` is called
- Request filters and endpoint
- Response data
- Number of categories returned
- Detailed error information

**Expected output:**
```
[Categories API] getCategories called with filters: { tree: true }
[Categories API] Request endpoint: /categories?tree=true
[API Client] GET http://localhost:3001/api/v1/categories?tree=true
[Categories API] Response received: { success: true, data: { categories: [...] } }
[Categories API] Categories count: 5
```

### 3. Category Tree Logging
**File:** [`frontend/src/lib/api/categories.ts`](frontend/src/lib/api/categories.ts:171-200)

**What it logs:**
- When `getCategoryTree()` is called
- Request endpoint
- Response data
- Number of tree nodes

### 4. Category Stats Logging
**File:** [`frontend/src/lib/api/categories.ts`](frontend/src/lib/api/categories.ts:449-478)

**What it logs:**
- When `getCategoryStats()` is called
- Request endpoint
- Response data
- Statistics (total, active, inactive)

---

## Validation Steps

To confirm the diagnosis, please:

### Step 1: Rebuild and Restart Docker Container
```bash
docker-compose down
docker-compose build frontend
docker-compose up -d frontend
```

### Step 2: Open Browser Console
1. Navigate to `http://localhost:3000/admin/categories`
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for diagnostic log messages

### Step 3: Check Network Tab
1. In DevTools, go to Network tab
2. Filter by "XHR" or "Fetch"
3. Look for requests to `/api/v1/categories`
4. Check:
   - Request URL (is it `localhost:3001` or something else?)
   - Response status (200, 404, 500, etc.)
   - Response headers
   - Response body

### Step 4: Check Backend Logs
```bash
docker logs smarttech_backend --tail 50
```

### Step 5: Test API Directly
```bash
# From host machine
curl http://localhost:3001/api/v1/categories

# Or from inside Docker container
docker exec smarttech_frontend curl http://host.docker.internal:3001/api/v1/categories
```

---

## Expected Diagnostic Outcomes

### If Root Cause #1 is correct:
- Console will show: `API_BASE_URL: http://localhost:3001/api/v1`
- Network tab will show requests to `http://localhost:3001/api/v1/categories`
- Requests will FAIL with network error or CORS error
- Backend logs will show NO incoming requests

### If Root Cause #2 is correct:
- Console will show direct fetch URLs (not using rewrites)
- Network tab will show requests bypassing Next.js
- May see CORS errors in console

### If Backend is the issue:
- Console will show API_BASE_URL correctly
- Network tab will show requests being made
- Backend logs will show errors or no data

### If Caching is the issue:
- Console will show 304 Not Modified responses
- Network tab will show cached responses
- Clearing browser cache will fix it temporarily

---

## Recommended Fixes (Once Diagnosis is Confirmed)

### Fix #1: Unify Environment Variables
**File:** [`docker-compose.yml`](docker-compose.yml:15-18)

Change to use consistent environment variables:
```yaml
environment:
  - NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
  - NEXT_PUBLIC_BACKEND_API_URL=http://localhost:3001/api/v1  # Same as above
  - BACKEND_API_URL=http://localhost:3001/api/v1
```

### Fix #2: Use Next.js Rewrites for Client-Side Requests
**File:** [`frontend/src/lib/api/client.ts`](frontend/src/lib/api/client.ts:295)

Change to use relative URLs for client-side:
```typescript
const url = typeof window === 'undefined' 
  ? `${API_BASE_URL}${endpoint}`  // Server-side: use full URL
  : `/api/v1${endpoint}`;         // Client-side: use rewrite URL
```

### Fix #3: Clear Next.js Build Cache
```bash
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

---

## Next Steps

1. **Rebuild the frontend container** with the new diagnostic logging
2. **Navigate to `/admin/categories`** and check browser console
3. **Share the console logs** with me so I can confirm the diagnosis
4. **Check the Network tab** to see what URLs are being called
5. **Share any error messages** from the console or network tab

Once I see the diagnostic logs, I can:
- Confirm which root cause is responsible
- Apply the appropriate fix
- Verify the fix works

---

## Files Modified

1. [`frontend/src/lib/api/client.ts`](frontend/src/lib/api/client.ts) - Added API_BASE_URL configuration logging
2. [`frontend/src/lib/api/categories.ts`](frontend/src/lib/api/categories.ts) - Added function-level logging for `getCategories()`, `getCategoryTree()`, and `getCategoryStats()`

---

## Questions for User

1. After rebuilding, what do you see in the browser console when you visit `/admin/categories`?
2. What URLs do you see in the Network tab for category requests?
3. Are there any error messages in the console?
4. What do the backend logs show when you try to load categories?

---

**Status:** Awaiting diagnostic logs from user to confirm root cause and apply appropriate fix.
