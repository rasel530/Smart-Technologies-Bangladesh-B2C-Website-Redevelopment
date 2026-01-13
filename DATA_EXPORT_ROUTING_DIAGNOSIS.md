# Data Export Routing Issue - Diagnosis Report

## Problem Statement
When accessing `http://localhost:3000/account/preferences` and clicking on Data Export, the following error occurs:
```
The requested route GET /api/v1/api/v1/profile/data/export/undefined/download was not found
```

## Identified Issues

### Issue 1: Duplicate `/api/v1` Prefix
**Symptom:** URL contains `/api/v1/api/v1/` (double prefix)

**Root Cause:** Inconsistent API URL construction:
- [`frontend/src/components/account/DataExportSection.tsx:97`](frontend/src/components/account/DataExportSection.tsx:97) manually constructs: `http://localhost:3001/api/v1/profile/data/export/${exportId}/download`
- [`frontend/src/lib/api/client.ts:4`](frontend/src/lib/api/client.ts:4) defines base URL as: `http://localhost:3001/api/v1`
- This causes double prefixing when base URL is used inconsistently

### Issue 2: Non-existent `/download` Endpoint
**Symptom:** Frontend calls `/profile/data/export/${exportId}/download` but backend doesn't have this endpoint

**Root Cause:**
- Backend only has: [`GET /api/v1/profile/data/export/:exportId`](backend/routes/dataExport.js:136)
- This endpoint returns a JSON response with `downloadUrl` field, not the actual file
- Frontend incorrectly expects a `/download` endpoint that serves the file directly

### Issue 3: Field Name Mismatch (Most Likely Cause of `undefined`)
**Symptom:** `exportId` is `undefined` in the URL

**Root Cause:** Field name mismatch between frontend and backend:
- **Frontend type** ([`DataExport`](frontend/src/types/accountPreferences.ts:36)) expects: `exportId: string`
- **Backend service** ([`getExportHistory`](backend/services/dataExport.service.js:455-464)) returns: `id: string`

**Backend response structure:**
```javascript
{
  id: exp.id,           // ← Backend returns 'id'
  dataTypes: exp.dataTypes,
  format: exp.format,
  status: exp.status,
  requestedAt: exp.requestedAt,
  readyAt: exp.readyAt,
  expiresAt: exp.expiresAt,
  downloadUrl: exp.fileUrl
}
```

**Frontend expects:**
```typescript
{
  exportId: string,     // ← Frontend expects 'exportId'
  dataTypes: string[],
  format: 'json' | 'csv',
  status: 'processing' | 'ready' | 'expired',
  downloadUrl?: string,
  requestedAt: string,
  expiresAt: string
}
```

## Diagnostic Logging Added

I've added comprehensive logging to validate these assumptions:

### Frontend Logging
1. **[`DataExportSection.tsx`](frontend/src/components/account/DataExportSection.tsx:34-52)** - Logs when exports are loaded:
   - Full exports array
   - First export item
   - First export's `exportId` value
   - All keys in first export object

2. **[`DataExportSection.tsx`](frontend/src/components/account/DataExportSection.tsx:93-130)** - Logs when download is clicked:
   - `exportId` parameter value and type
   - API URL being used
   - Full constructed URL
   - Response status and data
   - Download URL from response

3. **[`accountPreferences.ts`](frontend/src/lib/api/accountPreferences.ts:175-190)** - Logs API response:
   - Full response data
   - Exports array
   - First export item and its keys

### Backend Logging
1. **[`dataExport.js`](backend/routes/dataExport.js:132-170)** - Logs when export endpoint is called:
   - Request parameters
   - Export record found
   - Export status and file URL

2. **[`dataExport.js`](backend/routes/dataExport.js:173-185)** - Added debug route for `/download` endpoint:
   - Logs warning when non-existent `/download` endpoint is called
   - Returns 404 with helpful message

## Testing Instructions

1. **Navigate to** `http://localhost:3000/account/preferences`
2. **Open browser console** (F12)
3. **Click on Data Export** section
4. **Check console logs** for:
   - `[DataExport] Loaded exports:` - Shows what data is received
   - `[DataExport] First export exportId:` - Shows if `exportId` exists
   - `[DataExport] First export keys:` - Shows all available fields
5. **Generate a new export** (if no exports exist)
6. **Click Download** button on any export
7. **Check console logs** for:
   - `[DataExport] handleDownload called with exportId:` - Shows what value is passed
   - `[DataExport] Constructed URL:` - Shows the full URL being requested
   - `[DataExport] Response status:` - Shows the response
8. **Check backend logs** for:
   - `[DataExport Route] GET /data/export/:exportId called`
   - `[DataExport Route] WARNING: /download endpoint called`

## Expected Findings

Based on the analysis, you should see:

1. **Field name mismatch confirmed:**
   - Console shows `exportId: undefined`
   - Console shows `First export keys: ['id', 'dataTypes', ...]` (not 'exportId')

2. **Wrong endpoint confirmed:**
   - Console shows URL ends with `/download`
   - Backend logs show `WARNING: /download endpoint called`

3. **Double prefix (possible):**
   - URL shows `/api/v1/api/v1/` if environment variable is set incorrectly

## Proposed Fixes

Once diagnosis is confirmed, the fixes will be:

### Fix 1: Align Field Names
**Option A:** Change backend to return `exportId` instead of `id`
**Option B:** Change frontend to use `id` instead of `exportId`

### Fix 2: Correct Download Flow
- Remove `/download` endpoint call
- Use the correct endpoint: `GET /api/v1/profile/data/export/:exportId`
- Extract `downloadUrl` from response and navigate to it

### Fix 3: Standardize API URL Construction
- Remove manual URL construction in component
- Use the `apiClient` consistently
- Ensure base URL is not duplicated

## Next Steps

**Please test the application with the added logging and share the console output.** This will confirm:
1. Which field name the backend actually returns
2. Whether the `/download` endpoint is being called
3. The exact URL being constructed

Once confirmed, I will implement the appropriate fixes.
