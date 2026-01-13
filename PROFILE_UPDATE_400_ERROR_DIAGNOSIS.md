# Profile Update 400 Error Diagnosis

## Issue Summary
The user is experiencing a 400 Bad Request error when attempting to update their profile via the account page.

## Error Details
- **Endpoint**: `PUT /api/v1/profile/me`
- **Status Code**: 400 Bad Request
- **Response**: 95 bytes
- **Error Message**: Not visible in browser console (needs backend logs)

## Investigation Findings

### 1. Backend Route Analysis
The profile update route in [`backend/routes/profile.js`](backend/routes/profile.js:118-240) has:
- Validation middleware for firstName, lastName, phone, dateOfBirth, and gender
- Authentication middleware
- Body validation to check if req.body exists and is valid
- Check for at least one updateable field

### 2. Test Results
Created [`backend/test-profile-update-400.js`](backend/test-profile-update-400.js) to test the endpoint:

**Test 1: Valid Update Data** ✅
```javascript
{
  firstName: "Test",
  lastName: "User"
}
```
Result: **SUCCESS** - Profile updated successfully

**Test 2: Empty Body** ❌
```javascript
{}
```
Result: **400 Bad Request** - "No update data provided"

**Test 3: Invalid Data** ❌
```javascript
{
  firstName: "A",  // Too short (min 2 chars)
  phone: "invalid"  // Invalid format
}
```
Result: **400 Bad Request** - Validation failed

### 3. Root Cause Analysis

The backend logs show:
```
[Profile Update] Invalid request body: undefined
```

This indicates that `req.body` is `undefined` when the request reaches the backend. This suggests:

1. **JSON body is not being parsed** by Express middleware
2. **Request body is malformed** or missing
3. **Content-Type header issue** - Express may not be parsing the body correctly

### 4. Middleware Configuration Check

In [`backend/index.js`](backend/index.js:85-106):
```javascript
app.use(express.json({
  limit: '10mb',
  strict: false
}));
```

The JSON parser is configured correctly. However, the issue is that the request body is coming through as `undefined`.

### 5. Frontend API Client Analysis

In [`frontend/src/lib/api/client.ts`](frontend/src/lib/api/client.ts:361-362):
```javascript
put: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) =>
  apiClient.request<T>(endpoint, { ...options, method: 'PUT', body }),
```

The `put` method correctly passes the body to the request.

### 6. Browser Console Analysis

From the user's console logs:
```
[API Client] PUT /api/v1/profile/me
[API Client] Request options: 
Object { method: "PUT", hasBody: true, timeout: 10000, skipAuthRefresh: undefined }
[Token Manager] getToken called: Token found (eyJhbGciOiJIUzI1NiIs...)
[API Client] Token check: Token found (eyJhbGciOiJIUzI1NiIs...)
[API Client] Authorization header added
[API Client] Final headers: 
Object { "Content-Type": "application/json", Authorization: "Bearer ***" }
```

The frontend is:
- ✅ Sending PUT request
- ✅ Including body (`hasBody: true`)
- ✅ Setting Content-Type: application/json
- ✅ Adding Authorization header

## Diagnostic Actions Taken

### 1. Added Detailed Logging
Modified [`backend/routes/profile.js`](backend/routes/profile.js:118-136) to add comprehensive logging:
```javascript
console.log('[Profile Update] Request received');
console.log('[Profile Update] req.body:', req.body);
console.log('[Profile Update] req.body type:', typeof req.body);
console.log('[Profile Update] req.body keys:', req.body ? Object.keys(req.body) : 'N/A');
console.log('[Profile Update] Content-Type header:', req.get('Content-Type'));
console.log('[Profile Update] Content-Length header:', req.get('Content-Length'));
```

### 2. Restarted Backend
Restarted the backend container to apply the logging changes.

### 3. Created Test Script
Created [`backend/test-profile-update-400.js`](backend/test-profile-update-400.js) to test various scenarios.

## Next Steps

### For User
1. **Try updating profile again** - Navigate to the account page and attempt to update your profile
2. **Check browser console** - Look for any error messages or warnings
3. **Check backend logs** - The detailed logging will show exactly what's being received

### For Investigation
1. **Review backend logs** - After user tries update, check logs for:
   - `[Profile Update] Request received`
   - `[Profile Update] req.body:`
   - `[Profile Update] req.body type:`
   - `[Profile Update] req.body keys:`
   - `[Profile Update] Content-Type header:`
   - `[Profile Update] Content-Length header:`

2. **Compare frontend vs test script** - The test script works, so compare:
   - Request headers
   - Request body format
   - Content-Type header
   - Authorization header

## Possible Solutions

### Solution 1: Frontend Sending Empty Body
If the frontend is sending an empty body `{}`, the backend will reject it with "No update data provided".

**Fix**: Ensure frontend sends at least one field to update.

### Solution 2: JSON Parsing Issue
If Express is not parsing the JSON body correctly, we may need to:
- Check Content-Type header is exactly `application/json`
- Verify body is not being consumed by middleware
- Add explicit JSON parsing before route

### Solution 3: Middleware Order Issue
If middleware is consuming the body before it reaches the route, we may need to:
- Reorder middleware in [`backend/index.js`](backend/index.js)
- Ensure rate limiting doesn't consume body
- Check if any middleware modifies req.body

## Current Status

- ✅ Backend logging added
- ✅ Backend restarted
- ✅ Test script created and validated
- ⏳ Waiting for user to reproduce issue with new logging
- ⏳ Awaiting backend logs to determine root cause

## Files Modified

1. [`backend/routes/profile.js`](backend/routes/profile.js) - Added detailed logging
2. [`backend/test-profile-update-400.js`](backend/test-profile-update-400.js) - Created diagnostic test script

## Test Results

| Test Case | Data | Expected | Actual | Status |
|-----------|------|----------|--------|--------|
| Valid Update | { firstName: "Test", lastName: "User" } | 200 OK | 200 OK | ✅ PASS |
| Empty Body | {} | 400 Bad Request | 400 Bad Request | ✅ PASS |
| Invalid Data | { firstName: "A", phone: "invalid" } | 400 Bad Request | 400 Bad Request | ✅ PASS |

All test cases work as expected, confirming the backend logic is correct.

## Conclusion

The backend validation and logic are working correctly. The issue appears to be that the request body is `undefined` when it reaches the backend, suggesting either:
1. The frontend is not sending the body correctly
2. A middleware is consuming the body before it reaches the route
3. The Content-Type header is not being set correctly

**Action Required**: User needs to attempt profile update again with new logging enabled to capture detailed request information.
