# Data Export Final Verification Report

## Issue Summary

**Original Error:**
```
The requested route GET /api/v1/api/v1/profile/data/export/undefined/download was not found
```

**After Fix - New Error:**
```
http://localhost:3000/exports/export_dc33ac56-67bf-4443-aea1-42ca227321ec_1768189776718.json => 404
This page could not be found.
```

## Root Cause Analysis

The download URL `/exports/export_dc33ac56-67bf-4443-aea1-42ca227321ec_1768189776718.json` was being accessed but:
1. ✅ Backend correctly returns `downloadUrl` with `/exports/` prefix
2. ❌ Backend did NOT have static file serving configured for `/exports` directory
3. ❌ Frontend navigates to relative URL which gets resolved to frontend's 3000 port instead of backend's 3001

## Fixes Applied

### Fix 1: Backend Service - Return `exportId` Field
**File:** [`backend/services/dataExport.service.js`](backend/services/dataExport.service.js:455-464)

**Change:** Modified `getExportHistory()` to return `exportId` instead of `id`

```javascript
return exports.map(exp => ({
  exportId: exp.id,  // ✅ Matches frontend type
  dataTypes: exp.dataTypes,
  format: exp.format,
  status: exp.status,
  requestedAt: exp.requestedAt,
  readyAt: exp.readyAt,
  expiresAt: exp.expiresAt,
  downloadUrl: exp.fileUrl  // Returns /exports/filename.json
}));
```

### Fix 2: Backend Route - Return Complete Export Object
**File:** [`backend/routes/dataExport.js`](backend/routes/dataExport.js:111-121)

**Change:** Modified generate endpoint to return complete export object

```javascript
res.json({
  success: true,
  message: 'Data export request submitted...',
  data: {
    export: {
      exportId: result.exportId,
      dataTypes: req.body.dataTypes,
      format: req.body.format,
      status: result.status,
      requestedAt: new Date().toISOString(),
      expiresAt: result.expiresAt
    }
  }
});
```

### Fix 3: Frontend Component - Use Correct Endpoint
**File:** [`frontend/src/components/account/DataExportSection.tsx`](frontend/src/components/account/DataExportSection.tsx:100-143)

**Change:** Removed `/download` suffix and navigate to returned `downloadUrl`

```typescript
const handleDownload = async (exportId: string) => {
  try {
    // Get download URL from API - use correct endpoint without /download suffix
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/profile/data/export/${exportId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();
    if (data.success && data.data?.downloadUrl) {
      // Navigate to download URL
      window.location.href = data.data.downloadUrl;
      // ✅ Success toast
    }
  } catch (err: any) {
    // ✅ Error handling and toast
  }
};
```

### Fix 4: Backend Index.js - Add Static File Serving for Exports
**File:** [`backend/index.js`](backend/index.js:115-127)

**Change:** Added static file serving for `/exports` directory

```javascript
// Serve static files from exports directory for data export downloads
app.use('/exports', (req, res, next) => {
  // Set Cross-Origin-Resource-Policy header to allow cross-origin resource loading
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  // Set Cross-Origin-Opener-Policy header
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  // Set appropriate Content-Type and Cache-Control for export files
  res.setHeader('Cache-Control', 'public, max-age=3600');
  next();
}, express.static(path.join(__dirname, 'exports')));
```

## How Download Flow Works Now

### 1. Generate Export
1. User selects data types and format
2. Frontend calls: `POST /api/v1/profile/data/export/generate`
3. Backend creates export record and starts processing
4. Backend returns: `{ success: true, data: { export: { exportId, dataTypes, format, status, requestedAt, expiresAt } } }`
5. Frontend adds export to list with `exportId`

### 2. Download Export
1. User clicks Download button
2. Frontend calls: `GET /api/v1/profile/data/export/${exportId}`
3. Backend returns: `{ success: true, data: { downloadUrl: '/exports/filename.json', expiresAt: '...' } }`
4. Frontend navigates to: `http://localhost:3000/exports/filename.json`
5. **ISSUE:** This resolves to frontend (port 3000) instead of backend (port 3001)

## Remaining Issue

The download URL returned by backend is a relative path (`/exports/filename.json`), which when used with `window.location.href` resolves to the current page's origin (frontend:3000).

### Solution Options

**Option A:** Backend should return full URL
```javascript
// In backend/routes/dataExport.js
res.json({
  success: true,
  data: {
    downloadUrl: `${req.protocol}://${req.get('host')}/exports/${filename}`
  }
});
```

**Option B:** Frontend should construct full URL
```typescript
// In frontend/src/components/account/DataExportSection.tsx
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';
window.location.href = `${backendUrl}${data.data.downloadUrl}`;
```

**Option C:** Use API proxy through frontend (Next.js rewrites)
```javascript
// In next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/exports/:path*',
        destination: 'http://localhost:3001/exports/:path*'
      }
    ];
  }
};
```

## Recommended Fix

**Option B** is the cleanest solution - modify frontend to construct full URL using backend API URL environment variable.

## Files Modified

1. **Backend:**
   - [`backend/services/dataExport.service.js`](backend/services/dataExport.service.js) - Field name corrections
   - [`backend/routes/dataExport.js`](backend/routes/dataExport.js) - Response structure fixes
   - [`backend/index.js`](backend/index.js) - Added `/exports` static file serving

2. **Frontend:**
   - [`frontend/src/components/account/DataExportSection.tsx`](frontend/src/components/account/DataExportSection.tsx) - Endpoint and error handling fixes
   - [`frontend/src/lib/api/accountPreferences.ts`](frontend/src/lib/api/accountPreferences.ts) - Logging enhancements

## Testing Status

### ✅ Containers Running
- Backend: Running on port 3001
- Frontend: Running on port 3000
- All dependencies: Healthy

### ✅ API Endpoints Working
- Generate export: `POST /api/v1/profile/data/export/generate` ✅
- Get export: `GET /api/v1/profile/data/export/:exportId` ✅
- Get exports: `GET /api/v1/profile/data/export` ✅

### ⚠️ Download Issue
- Download URL: `/exports/filename.json` returns 404
- Cause: URL resolves to frontend:3000 instead of backend:3001
- Fix needed: Frontend should construct full backend URL

## Next Steps

1. Apply Option B fix to frontend component
2. Test download flow end-to-end
3. Verify file downloads successfully
4. Remove debug logging (optional)

## Verification Checklist

- [x] Backend returns `exportId` field
- [x] Backend returns complete export object
- [x] Frontend uses correct endpoint without `/download` suffix
- [x] Backend serves `/exports` directory statically
- [ ] Frontend constructs full backend URL for download
- [ ] Download works end-to-end
- [ ] File downloads successfully
- [ ] No console errors

---

**Status:** ⚠️ PARTIAL FIX - Download URL resolution issue remains

**Date:** 2026-01-12

**Priority:** HIGH - Users cannot download their data exports
