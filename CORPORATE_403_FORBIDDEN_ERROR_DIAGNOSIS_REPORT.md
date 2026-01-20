# Corporate Account 403 Forbidden Error - Diagnosis Report

**Report Date:** January 20, 2026  
**Issue:** User receiving 403 Forbidden errors when accessing corporate account endpoints  
**Status:** DIAGNOSIS COMPLETE

---

## Executive Summary

The 403 Forbidden error is occurring because the frontend is attempting to access a corporate account (`5a5eaca8-37a7-4115-9e8d-c9577c6c9333`) that **does not exist in the database**. The authenticated user actually owns a different corporate account (`83fbff07-2859-425b-bbe2-26478d548fe0`).

---

## 1. Database State Analysis

### 1.1 Corporate Account Status

| Field | Value |
|--------|-------|
| **Account ID Being Accessed** | `5a5eaca8-37a7-4115-9e8d-c9577c6c9333` |
| **Exists in Database** | ❌ **NO** |
| **Account ID Owned by User** | `83fbff07-2859-425b-bbe2-26478d548fe0` |
| **Company Name** | Test Company Ltd |
| **Account Status** | active |
| **Verification Status** | verified |

**Finding:** The corporate account ID that the frontend is trying to access does not exist in the database.

### 1.2 User Status

| Field | Value |
|--------|-------|
| **User ID** | `95c63e45-4e91-4a90-93c3-5d9f1f0c0892` |
| **Email** | raselbepari88@gmail.com |
| **Name** | Rasel Bepari |
| **Role** | customer |
| **Status** | active |
| **Account Status** | active |
| **Exists in Database** | ✅ YES |

**Finding:** The user exists and is active in the system.

### 1.3 User-Corporate Account Relationship

| Relationship | Status |
|--------------|--------|
| **Is User Admin/Super Admin?** | ❌ NO (role: "customer") |
| **Is User Corporate Account Owner?** | ❌ NO (different account ID) |
| **Is User in corporate_users table?** | ❌ NO (no entry for non-existent account) |

**Finding:** The user has no valid relationship to the corporate account being accessed.

---

## 2. Authorization Logic Analysis

### 2.1 checkCorporateAccess Middleware

Location: [`backend/routes/corporate.js:30-82`](backend/routes/corporate.js:30)

The `checkCorporateAccess` middleware implements a **three-tier authorization check**:

```javascript
// Check 1: Is user admin or super_admin?
const isAdmin = await prisma.user.findFirst({
  where: {
    id: userId,
    role: { in: ['admin', 'super_admin'] }
  }
});

if (isAdmin) {
  return next(); // Allow access
}

// Check 2: Is user the corporate account owner?
const corporateAccount = await prisma.corporateAccount.findUnique({
  where: { id: accountId },
  select: { userId: true }
});

if (corporateAccount && corporateAccount.userId === userId) {
  return next(); // Allow access
}

// Check 3: Is user in corporate_users table?
const corporateUser = await prisma.corporateUser.findFirst({
  where: {
    corporateAccountId: accountId,
    userId: userId,
    isActive: true
  }
});

if (!corporateUser) {
  return res.status(403).json({
    error: 'Access denied',
    message: 'You do not have access to this corporate account'
  });
}
```

### 2.2 Authorization Flow Diagram

```
Request → authMiddleware.authenticate()
         ↓
    User authenticated (req.user.id = 95c63e45-4e91-4a90-93c3-5d9f1f0c0892)
         ↓
    checkCorporateAccess()
         ↓
    ┌─────────────────────────────────────┐
    │ Check 1: Is admin/super_admin?  │ → ❌ NO (role: customer)
    └─────────────────────────────────────┘
         ↓
    ┌─────────────────────────────────────┐
    │ Check 2: Is account owner?       │ → ❌ NO (account doesn't exist)
    └─────────────────────────────────────┘
         ↓
    ┌─────────────────────────────────────┐
    │ Check 3: In corporate_users?      │ → ❌ NO (no entry)
    └─────────────────────────────────────┘
         ↓
    403 FORBIDDEN
```

### 2.3 Failing API Endpoints

Both failing endpoints use the same authorization middleware:

1. **GET** `/api/v1/corporate/:accountId` (line 1886)
   - Uses: [`authMiddleware.authenticate()`](backend/routes/corporate.js:1888), [`checkCorporateAccess`](backend/routes/corporate.js:1888)
   - Error: 403 Forbidden

2. **GET** `/api/v1/corporate/:accountId/dashboard` (line 1982)
   - Uses: [`authMiddleware.authenticate()`](backend/routes/corporate.js:1984), [`checkCorporateAccess`](backend/routes/corporate.js:1984)
   - Error: 403 Forbidden

---

## 3. Root Cause Analysis

### 3.1 Primary Root Cause

**The corporate account ID being accessed does not exist in the database.**

**Evidence:**
- Diagnostic query confirmed: `corporateAccount` is `null` for ID `5a5eaca8-37a7-4115-9e8d-c9577c6c9333`
- User owns a different corporate account: `83fbff07-2859-425b-bbe2-26478d548fe0`
- No `corporate_users` entry exists for the non-existent account

### 3.2 Secondary Issues

1. **Frontend State Mismatch:** The frontend is storing or using an incorrect corporate account ID
2. **No Error Handling:** The backend returns 403 instead of 404 for non-existent corporate accounts
3. **User Confusion:** The user has a valid corporate account but is trying to access a non-existent one

### 3.3 Why 403 Instead of 404?

The middleware returns 403 because:
- The middleware checks user access **before** checking if the account exists
- When `corporateAccount` is `null`, the condition `corporateAccount && corporateAccount.userId === userId` fails
- The middleware falls through to the `corporate_users` check, which also fails
- The final check returns 403: "You do not have access to this corporate account"

---

## 4. Database Schema Relationships

### 4.1 CorporateAccount Model

```prisma
model CorporateAccount {
  id                 String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId             String   @unique  // Owner of the account
  companyName        String
  accountStatus      String?  @default("pending_verification")
  verificationStatus String?  @default("pending")
  // ... other fields
  
  users_corporate_accounts_user_idTousers User @relation(...)
  corporate_users CorporateUser[]
}
```

### 4.2 CorporateUser Model

```prisma
model CorporateUser {
  id                   String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  corporateAccountId String   @db.Uuid
  userId              String
  role                 String
  isActive            Boolean  @default(true)
  assignedAt          DateTime @default(now())
  expiresAt           DateTime?
  
  @@unique([corporateAccountId, userId])
}
```

### 4.3 User Model

```prisma
model User {
  id     String    @id @default(uuid())
  email  String    @unique
  role   UserRole  @default(customer)
  status UserStatus @default(active)
  
  corporate_accounts_corporate_accounts_user_idTousers CorporateAccount?
  corporate_users CorporateUser[]
}
```

---

## 5. Recommendations

### 5.1 Immediate Fix (Frontend)

**Problem:** Frontend is using incorrect corporate account ID

**Solution:**
1. Check where the corporate account ID is being stored in frontend state/localStorage
2. Update it to use the correct account ID: `83fbff07-2859-425b-bbe2-26478d548fe0`
3. Implement proper error handling to redirect users when they receive 403 errors
4. Add a check on page load to verify the stored corporate account ID exists

**Code Example (Frontend):**
```javascript
// Fetch user's corporate account on login
const response = await fetch('/api/v1/corporate/my-account', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

if (response.ok) {
  const data = await response.json();
  // Store the correct corporate account ID
  localStorage.setItem('corporateAccountId', data.data.id);
}
```

### 5.2 Backend Improvements

**Issue 1: Middleware returns 403 instead of 404 for non-existent accounts**

**Solution:** Update [`checkCorporateAccess`](backend/routes/corporate.js:30) middleware to check account existence first:

```javascript
const checkCorporateAccess = async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const userId = req.user.id;

    // First, check if corporate account exists
    const corporateAccount = await prisma.corporateAccount.findUnique({
      where: { id: accountId },
      select: { 
        id: true,
        userId: true 
      }
    });

    if (!corporateAccount) {
      return res.status(404).json({
        error: 'Corporate account not found',
        message: 'The requested corporate account does not exist'
      });
    }

    // Then check access permissions...
    // ... rest of the logic
  } catch (error) {
    // error handling
  }
};
```

**Issue 2: No logging for failed access attempts**

**Solution:** Add detailed logging in the middleware:

```javascript
if (!corporateUser) {
  loggerService.warn('Corporate access denied', {
    userId,
    accountId,
    userRole: req.user.role,
    timestamp: new Date().toISOString()
  });
  
  return res.status(403).json({
    error: 'Access denied',
    message: 'You do not have access to this corporate account'
  });
}
```

### 5.3 Data Integrity Check

**Action:** Verify if the corporate account ID `5a5eaca8-37a7-4115-9e8d-c9577c6c9333` was:
- Deleted from the database
- Never existed (stale frontend data)
- Created in a different environment

**Query to run:**
```sql
-- Check if account was deleted
SELECT * FROM corporate_accounts 
WHERE id = '5a5eaca8-37a7-4115-9e8d-c9577c6c9333';

-- Check audit logs if available
SELECT * FROM audit_logs 
WHERE entity_id = '5a5eaca8-37a7-4115-9e8d-c9577c6c9333'
ORDER BY created_at DESC
LIMIT 10;
```

### 5.4 Frontend Error Handling

**Implement proper error handling for corporate account access:**

```javascript
async function fetchCorporateAccount(accountId) {
  const response = await fetch(`/api/v1/corporate/${accountId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.status === 404) {
    // Account doesn't exist - redirect to user's own account
    const myAccount = await fetch('/api/v1/corporate/my-account');
    if (myAccount.ok) {
      const data = await myAccount.json();
      localStorage.setItem('corporateAccountId', data.data.id);
      window.location.href = `/corporate/${data.data.id}`;
    }
    return;
  }

  if (response.status === 403) {
    // Access denied - show error message
    showError('You do not have access to this corporate account');
    return;
  }

  // ... handle other responses
}
```

---

## 6. Diagnostic Script Output

The diagnostic script [`backend/diagnose-corporate-403-error.js`](backend/diagnose-corporate-403-error.js) was executed and produced the following output:

```
================================================================================
CORPORATE ACCOUNT 403 FORBIDDEN ERROR DIAGNOSIS
================================================================================

1. CHECKING CORPORATE ACCOUNT EXISTENCE
--------------------------------------------------------------------------------
❌ Corporate account NOT found in database
   Account ID: 5a5eaca8-37a7-4115-9e8d-c9577c6c9333

2. CHECKING USER EXISTENCE
--------------------------------------------------------------------------------
✅ User found in database
   User ID: 95c63e45-4e91-4a90-93c3-5d9f1f0c0892
   Email: raselbepari88@gmail.com
   Name: Rasel Bepari
   Role: customer
   Status: active
   Account Status: active

3. CHECKING USER-CORPORATE ACCOUNT RELATIONSHIP (OWNER)
--------------------------------------------------------------------------------
⚠️  Cannot check relationship - missing corporate account or user

4. CHECKING CORPORATE_USERS TABLE
--------------------------------------------------------------------------------
❌ No users found in corporate_users table for this corporate account

5. CHECKING IF USER IS IN CORPORATE_USERS TABLE
--------------------------------------------------------------------------------
❌ User is NOT in corporate_users table for this corporate account
   User ID: 95c63e45-4e91-4a90-93c3-5d9f1f0c0892
   Corporate Account ID: 5a5eaca8-37a7-4115-9e8d-c9577c6c9333
   ⚠️  This is causing 403 Forbidden error

6. CHECKING ALL CORPORATE ACCOUNTS ASSOCIATED WITH USER
--------------------------------------------------------------------------------
✅ User owns 1 corporate account(s):
   [1] Account ID: 83fbff07-2859-425b-bbe2-26478d548fe0
       Company Name: Test Company Ltd
       Account Status: active
       Verification Status: verified
       Created At: Tue Jan 20 2026 22:00:28 GMT+0600

================================================================================
DIAGNOSIS SUMMARY
================================================================================

Authorization Logic in checkCorporateAccess middleware:
  1. Check if user is admin or super_admin
  2. Check if user is corporate account owner (corporateAccount.userId === userId)
  3. Check if user is in corporate_users table with isActive: true

Current State:
  - User Role: customer
  - Is Admin/Super Admin: NO
  - Is Corporate Account Owner: NO
  - Is in corporate_users table: NO

ROOT CAUSE ANALYSIS:
❌ ROOT CAUSE: Corporate account does not exist in database

================================================================================
DIAGNOSIS COMPLETE
================================================================================
```

---

## 7. Conclusion

### Summary

The 403 Forbidden error is **not an authorization issue** but rather a **data consistency issue**. The frontend is attempting to access a corporate account that does not exist in the database, while the user actually owns a valid, active corporate account.

### Key Findings

1. ✅ User is authenticated and active
2. ✅ User owns a valid corporate account (`83fbff07-2859-425b-bbe2-26478d548fe0`)
3. ❌ Frontend is trying to access non-existent account (`5a5eaca8-37a7-4115-9e8d-c9577c6c9333`)
4. ❌ Backend returns 403 instead of 404 for non-existent accounts
5. ❌ No error handling in frontend to redirect to correct account

### Recommended Actions

**Priority 1 (Frontend):**
- Update frontend to use correct corporate account ID
- Implement proper error handling for 403/404 responses
- Add validation on page load to verify stored account ID

**Priority 2 (Backend):**
- Update middleware to return 404 for non-existent accounts
- Add detailed logging for failed access attempts
- Improve error messages to distinguish between "not found" and "access denied"

**Priority 3 (Data Integrity):**
- Investigate why incorrect account ID is being used
- Check if account was deleted or never existed
- Verify frontend state management

---

## 8. Related Files

- **Backend Routes:** [`backend/routes/corporate.js`](backend/routes/corporate.js)
- **Auth Middleware:** [`backend/middleware/auth.js`](backend/middleware/auth.js)
- **RBAC Middleware:** [`backend/middleware/rbacAuth.js`](backend/middleware/rbacAuth.js)
- **Prisma Schema:** [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)
- **Diagnostic Script:** [`backend/diagnose-corporate-403-error.js`](backend/diagnose-corporate-403-error.js)

---

**Report Generated:** January 20, 2026  
**Diagnostic Tool:** [`backend/diagnose-corporate-403-error.js`](backend/diagnose-corporate-403-error.js)  
**Status:** ✅ DIAGNOSIS COMPLETE - Ready for Fix Implementation
