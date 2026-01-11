# Token Flow Quick Reference Guide

## Quick Debug Checklist

When users report "No token provided" error, follow these steps:

### Step 1: Check Frontend Console
```
Open Browser DevTools → Console tab
Look for:
✓ [AuthContext] Login attempt for: user@example.com
✓ [AuthContext] Login response received: {hasToken: true, hasUser: true}
✓ [AuthContext] Storing token...
✓ [Token Manager] Token stored: eyJhbGciOiJIUzI1Ni...
```

**If missing:** Token not being stored after login

### Step 2: Check Token Storage
```javascript
// In browser console
localStorage.getItem('auth_token')
// Should return: "eyJhbGciOiJIUzI1Ni..." (long string)
```

**If null/undefined:** Token storage failed

### Step 3: Check API Request
```
Look for:
✓ [API Client] PUT http://localhost:3001/api/v1/profile/me
✓ [API Client] Token check: Token found (eyJhbGciOiJIUzI1Ni...)
✓ [API Client] Authorization header added
✓ [API Client] Final headers: {Authorization: 'Bearer ***'}
```

**If missing:** Token not being sent with request

### Step 4: Check Network Tab
```
Open Browser DevTools → Network tab
Click profile update request
Check Headers tab:
Request Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1Ni...
```

**If missing:** Header not being sent by browser

### Step 5: Check Backend Logs
```
Look for:
✓ Authentication attempt: {method: 'PUT', path: '/profile/me', hasAuthHeader: true}
✓ Token extracted: {tokenLength: 1234, tokenPrefix: 'eyJhbGciOiJIUzI1Ni...'}
✓ Token verified: {userId: 'abc123', exp: 1234567890}
✓ Authentication successful: {userId: 'abc123', email: 'user@example.com'}
```

**If missing:** Backend not receiving request or token

## Common Issues & Solutions

### Issue 1: Token Not Stored After Login

**Symptoms:**
- `[AuthContext] Storing token...` appears but no confirmation
- `localStorage.getItem('auth_token')` returns null

**Solution:**
1. Check browser console for errors
2. Verify localStorage is enabled
3. Check for browser extensions blocking localStorage
4. Try in incognito/private mode

### Issue 2: Token Stored But Not Retrieved

**Symptoms:**
- Token in localStorage
- `[Token Manager] getToken called: No token found`

**Solution:**
1. Check if window is available (SSR issue)
2. Verify localStorage key is exactly 'auth_token'
3. Check for localStorage quota exceeded

### Issue 3: Token Retrieved But Not Sent

**Symptoms:**
- Token retrieved successfully
- `[API Client] Authorization header added` appears
- Network tab shows no Authorization header

**Solution:**
1. Check CORS configuration
2. Verify API base URL is correct
3. Check for request interceptors modifying headers
4. Disable browser extensions that modify requests

### Issue 4: Token Sent But Not Received

**Symptoms:**
- Authorization header in Network tab
- Backend logs show `hasAuthHeader: false`

**Solution:**
1. Check CORS configuration on backend
2. Verify middleware order in Express
3. Check for proxy removing headers
4. Verify API base URL matches backend

### Issue 5: Token Received But Invalid

**Symptoms:**
- Backend receives token
- `Token verification failed` in logs

**Solution:**
1. Check token expiration
2. Verify JWT_SECRET matches between environments
3. Check for token tampering
4. Verify token generation uses correct secret

## Code Locations

### Frontend Token Management
```typescript
// File: frontend/src/lib/api/client.ts

// Get token
const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    console.log('[Token Manager] getToken called:', token ? `Token found` : 'No token found');
    return token;
  }
  return null;
};

// Store token
const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
    console.log('[Token Manager] Token stored:', token.substring(0, 20) + '...');
  }
};
```

### Frontend API Client
```typescript
// File: frontend/src/lib/api/client.ts

// Add auth header
const addAuthHeader = (headers: Record<string, string> = {}): Record<string, string> => {
  const token = getToken();
  console.log('[API Client] Token check:', token ? `Token found` : 'No token found');
  
  if (token) {
    const authHeaders = {
      ...headers,
      Authorization: `Bearer ${token}`,
    };
    console.log('[API Client] Authorization header added');
    return authHeaders;
  }
  
  console.log('[API Client] No Authorization header added');
  return headers;
};
```

### Backend Authentication
```javascript
// File: backend/middleware/auth.js

// Extract token
extractToken(req) {
  const authHeader = req.headers.authorization;
  
  this.logger.debug('Extracting token', {
    hasAuthHeader: !!authHeader,
    authHeaderValue: authHeader ? authHeader.substring(0, 30) + '...' : 'none'
  });
  
  if (!authHeader) {
    return null;
  }
  
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}
```

## Testing Commands

### Test Token Flow
```bash
# Run comprehensive test
node backend/test-profile-token-flow.js
```

### Manual Testing
```javascript
// In browser console

// 1. Check token storage
localStorage.getItem('auth_token')

// 2. Clear all tokens
localStorage.clear()

// 3. Manually set token (for testing)
localStorage.setItem('auth_token', 'your_token_here')

// 4. Make test request
fetch('http://localhost:3001/api/v1/profile/me', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
  }
})
.then(r => r.json())
.then(console.log)
```

## Log Patterns

### Successful Flow
```
[AuthContext] Login attempt for: user@example.com
[AuthContext] Login response received: {hasToken: true, hasUser: true}
[AuthContext] Storing token...
[Token Manager] Token stored: eyJhbGciOiJIUzI1Ni...
[AuthContext] Token stored successfully
[AuthContext] Login successful

[API Client] PUT http://localhost:3001/api/v1/profile/me
[Token Manager] getToken called: Token found (eyJhbGciOiJIUzI1Ni...)
[API Client] Token check: Token found
[API Client] Authorization header added
[API Client] Final headers: {Authorization: 'Bearer ***'}

[Backend] Authentication attempt: {method: 'PUT', path: '/profile/me', hasAuthHeader: true}
[Backend] Token extracted: {tokenLength: 1234, tokenPrefix: 'eyJhbGciOiJIUzI1Ni...'}
[Backend] Token verified: {userId: 'abc123', exp: 1234567890}
[Backend] Authentication successful: {userId: 'abc123', email: 'user@example.com'}
```

### Failed Flow
```
[API Client] PUT http://localhost:3001/api/v1/profile/me
[Token Manager] getToken called: No token found
[API Client] Token check: No token found
[API Client] No Authorization header added
[API Client] Final headers: {Authorization: 'Not set'}

[Backend] Authentication attempt: {method: 'PUT', path: '/profile/me', hasAuthHeader: false}
[Backend] No token provided: {method: 'PUT', path: '/profile/me'}
```

## Quick Fixes

### Fix 1: Reset Token
```javascript
// In browser console
localStorage.removeItem('auth_token')
location.reload()
```

### Fix 2: Clear All Storage
```javascript
// In browser console
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### Fix 3: Test with Manual Token
```javascript
// Get token from backend login
// Then manually set it
localStorage.setItem('auth_token', 'paste_token_here')
```

## Environment Variables

### Frontend (.env)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### Backend (.env)
```env
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=24h
NODE_ENV=development
```

## Support

If you need help:

1. **Check logs** - Frontend console and backend logs
2. **Run test script** - `node backend/test-profile-token-flow.js`
3. **Read full documentation** - `PROFILE_UPDATE_TOKEN_FIX_PERMANENT_SOLUTION.md`
4. **Check troubleshooting guide** - Section in full documentation

---

**Remember:** Always check logs first! They tell you exactly where the issue is.
