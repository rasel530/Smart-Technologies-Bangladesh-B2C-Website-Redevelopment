# JWT Token Verification Bug - Diagnostic Report

## Executive Summary

**Issue**: `decoded.userId` becomes `undefined` when passed to Prisma query, causing all RBAC endpoints to fail with "User lookup failed"

**Root Cause**: Missing `await` keyword when calling `verifyToken()` method in authentication middleware

**Impact**: All RBAC endpoints fail because the middleware cannot retrieve user ID from JWT token

---

## Diagnostic Evidence

### Test Results from Diagnostic Script

```
Step 3: Calling verifyToken WITHOUT await (simulating the bug)...
✓ verifyToken called (without await)
  Return type: object
  Is Promise?: true
  Has userId property?: false
  userId value: undefined
  userId type: undefined

Step 4: Simulating Prisma query with decodedWithoutAwait.userId...
  Attempting to access decodedWithoutAwait.userId: undefined
  Result: userId is UNDEFINED
```

### What Happens

1. **Token Generation** (Working correctly):
   - Login endpoint generates JWT token with payload: `{ userId, email, phone, role, sessionId }`
   - Token is properly signed and valid

2. **Token Extraction** (Working correctly):
   - [`extractToken()`](backend/middleware/auth.js:130-164) successfully extracts token from Authorization header
   - Token is available and valid

3. **Token Verification** (THE BUG):
   - [`verifyToken()`](backend/middleware/auth.js:37-68) is an **async** method
   - Called **WITHOUT** `await` on line 197 of [`authenticate()`](backend/middleware/auth.js:167-322)
   - Returns a **Promise object**, not the decoded token

4. **User Lookup** (Fails):
   - Tries to access `decoded.userId` on a Promise object
   - Promise objects don't have a `userId` property
   - `decoded.userId` is `undefined`
   - Prisma query fails: `prisma.user.findUnique({ where: { id: undefined } })`

---

## Exact Code Causing the Issue

### File: `backend/middleware/auth.js`

#### Location 1: [`authenticate()`](backend/middleware/auth.js:167-322) method - Line 197

```javascript
// ❌ BUGGY CODE (Line 197)
const decoded = this.verifyToken(token);

this.logger.info('Token verified', {
  userId: decoded.userId,  // ❌ This logs undefined but appears to work
  exp: decoded.exp
});

// ❌ BUGGY CODE (Line 208)
user = await this.prisma.user.findUnique({
  where: { id: decoded.userId },  // ❌ decoded.userId is undefined here!
  // ...
});
```

#### Location 2: [`optional()`](backend/middleware/auth.js:337-399) method - Line 343

```javascript
// ❌ BUGGY CODE (Line 343)
const decoded = this.verifyToken(token);

// ❌ BUGGY CODE (Line 349)
user = await this.prisma.user.findUnique({
  where: { id: decoded.userId },  // ❌ Same issue!
  // ...
});
```

---

## Why `decoded.userId` Becomes Undefined

### Technical Explanation

1. **`verifyToken()` is an async function**:
   ```javascript
   async verifyToken(token) {  // ← Line 37: async keyword
     // ...
     const decoded = jwt.verify(token, jwtSecret, { ... });
     return decoded;
   }
   ```

2. **When called without `await`**:
   ```javascript
   const decoded = this.verifyToken(token);
   // decoded is a Promise object, not the decoded token
   ```

3. **Promise object structure**:
   ```javascript
   Promise {
     <pending>,
     [[PromiseState]]: "pending",
     [[PromiseResult]]: undefined
   }
   ```

4. **Accessing `decoded.userId`**:
   - Promise objects don't have a `userId` property
   - Returns `undefined`
   - Prisma query receives `id: undefined`

### Why the Log Appears to Work

The logger on line 199-202 shows:
```javascript
this.logger.info('Token verified', {
  userId: decoded.userId,  // Logs: undefined
  exp: decoded.exp        // Also logs: undefined
});
```

This logs `undefined` but doesn't throw an error because:
- Logging `undefined` is valid
- The error only occurs when Prisma tries to use `undefined` as an ID
- The log statement completes before the Prisma query executes

---

## Token Payload Structure (Correct)

The JWT token payload is correctly structured:

```json
{
  "userId": "ea59bf47-4b66-431d-ba63-a0a69437798f",
  "email": "admin@smarttech.com",
  "phone": "+8801712345678",
  "role": "admin",
  "sessionId": "session-uuid-here",
  "iat": 1770555582,
  "exp": 1771160382,
  "aud": "smart-ecommerce-clients",
  "iss": "smart-ecommerce-api"
}
```

The token itself is valid. The issue is purely in how it's being accessed in the middleware.

---

## Specific Fix Needed

### Fix Location 1: [`authenticate()`](backend/middleware/auth.js:167-322) method

**File**: `backend/middleware/auth.js`  
**Line**: 197

**BEFORE (Buggy)**:
```javascript
const decoded = this.verifyToken(token);
```

**AFTER (Fixed)**:
```javascript
const decoded = await this.verifyToken(token);
```

### Fix Location 2: [`optional()`](backend/middleware/auth.js:337-399) method

**File**: `backend/middleware/auth.js`  
**Line**: 343

**BEFORE (Buggy)**:
```javascript
const decoded = this.verifyToken(token);
```

**AFTER (Fixed)**:
```javascript
const decoded = await this.verifyToken(token);
```

---

## Complete Fix Code Snippet

### For [`authenticate()`](backend/middleware/auth.js:167-322) method:

```javascript
// Line 197 - ADD 'await' keyword
const decoded = await this.verifyToken(token);

this.logger.info('Token verified', {
  userId: decoded.userId,  // ✓ Now correctly logs the user ID
  exp: decoded.exp
});

// Line 207-208 - Now works correctly
user = await this.prisma.user.findUnique({
  where: { id: decoded.userId },  // ✓ decoded.userId is now defined
  select: {
    id: true,
    email: true,
    phone: true,
    firstName: true,
    lastName: true,
    role: true,
    status: true,
    emailVerified: true,
    phoneVerified: true,
    createdAt: true,
    updatedAt: true
  }
});
```

### For [`optional()`](backend/middleware/auth.js:337-399) method:

```javascript
// Line 343 - ADD 'await' keyword
const decoded = await this.verifyToken(token);

// Line 348-349 - Now works correctly
user = await this.prisma.user.findUnique({
  where: { id: decoded.userId },  // ✓ decoded.userId is now defined
  select: {
    id: true,
    email: true,
    phone: true,
    firstName: true,
    lastName: true,
    role: true,
    status: true,
    emailVerified: true,
    phoneVerified: true,
    createdAt: true,
    updatedAt: true
  }
});
```

---

## Why This Fix Works

1. **With `await`**:
   ```javascript
   const decoded = await this.verifyToken(token);
   // decoded is now the actual decoded token object
   // decoded.userId contains the user ID
   ```

2. **Decoded token structure**:
   ```javascript
   {
     userId: "ea59bf47-4b66-431d-ba63-a0a69437798f",
     email: "admin@smarttech.com",
     phone: "+8801712345678",
     role: "admin",
     sessionId: "session-uuid-here",
     iat: 1770555582,
     exp: 1771160382,
     aud: "smart-ecommerce-clients",
     iss: "smart-ecommerce-api"
   }
   ```

3. **Prisma query succeeds**:
   ```javascript
   prisma.user.findUnique({
     where: { id: decoded.userId }  // ✓ Valid UUID
   })
   ```

---

## Impact of the Bug

### Affected Endpoints
All RBAC-protected endpoints that use [`authMiddleware.authenticate()`](backend/middleware/auth.js:167-322):
- `/api/v1/rbac/*` endpoints
- Any endpoint requiring authentication
- Admin-only endpoints
- Manager-only endpoints
- User-specific endpoints

### Error Messages
```
Invalid prisma.user.findUnique() invocation:
{
  where: { id: undefined, ... }
}

{
  error: 'Authentication failed',
  message: 'User lookup failed'
}
```

### User Experience
- All authenticated requests fail
- Users cannot access protected resources
- Admin panel inaccessible
- API endpoints return 401 errors

---

## Verification Steps

After applying the fix:

1. **Test token generation**:
   ```bash
   # Login to get a valid token
   curl -X POST http://localhost:3001/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"identifier":"admin@smarttech.com","password":"password"}'
   ```

2. **Test token verification**:
   ```bash
   # Use the token to access a protected endpoint
   curl -X GET http://localhost:3001/api/v1/rbac/roles \
     -H "Authorization: Bearer <token>"
   ```

3. **Expected behavior**:
   - Token is verified successfully
   - User ID is extracted from token
   - User is found in database
   - Request proceeds successfully

---

## Additional Notes

### Why the Bug Wasn't Caught Earlier

1. **Logging masked the issue**:
   - Logger shows `userId: decoded.userId` which logs `undefined`
   - This doesn't throw an error, so it appears to work

2. **Error occurs downstream**:
   - The actual error happens in the Prisma query
   - By that time, the code has moved past the verification step

3. **Async/await confusion**:
   - `verifyToken()` is async but called synchronously
   - Easy to miss in code review
   - TypeScript would catch this, but plain JavaScript doesn't

### Prevention

1. **Use TypeScript**:
   - Would catch this at compile time
   - Type checking would show `Promise<DecodedToken>` vs `DecodedToken`

2. **ESLint rules**:
   - `require-await` rule
   - `no-floating-promises` rule

3. **Code review checklist**:
   - Always await async functions
   - Check return types

---

## Conclusion

**Root Cause**: Missing `await` keyword when calling async `verifyToken()` method

**Fix**: Add `await` before `this.verifyToken(token)` in two locations:
1. Line 197 in [`authenticate()`](backend/middleware/auth.js:167-322) method
2. Line 343 in [`optional()`](backend/middleware/auth.js:337-399) method

**Impact**: Critical - all RBAC endpoints fail without this fix

**Difficulty**: Simple one-word fix (`await`)

**Testing**: Verify with diagnostic script and test RBAC endpoints

---

## Diagnostic Script

The diagnostic script used to identify this issue is located at:
`backend/debug-jwt-verification.js`

To run it:
```bash
cd backend
node debug-jwt-verification.js
```

The script demonstrates:
1. Token generation (working)
2. Token decoding without verification (working)
3. Token verification WITHOUT await (buggy - returns Promise)
4. Token verification WITH await (correct - returns decoded token)

---

**Report Generated**: 2026-02-08
**Diagnostic Tool**: debug-jwt-verification.js
**Status**: ✅ Root cause identified
**Ready for Fix**: ✅ Yes
