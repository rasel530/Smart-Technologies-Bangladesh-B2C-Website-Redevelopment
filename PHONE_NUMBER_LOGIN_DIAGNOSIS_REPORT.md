# Phone Number Login Issue - Detailed Diagnosis Report

**Date:** 2026-01-10  
**Test Engineer:** Debug Team  
**Issue:** Phone number login failing during NextAuth login flow test

---

## Executive Summary

The phone number login test failed with HTTP 401 error. This is a backend authentication issue where the test phone number (`+8801700000000`) cannot successfully authenticate. The root cause is identified as a **missing or mismatched user record** in the database for the test phone number.

**Test Result:**
- **Status:** ❌ FAIL
- **Expected:** HTTP 200 with token
- **Actual:** HTTP 401 (Unauthorized)
- **Error:** "Login with phone failed or no token returned"

---

## 1. Test Failure Analysis

### Test Configuration (from [`backend/nextauth-login-flow.test.js`](backend/nextauth-login-flow.test.js:22-28))
```javascript
const TEST_USER = {
  email: 'test@example.com',
  phone: '+8801700000000',  // Test phone number
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User'
};
```

### Test Execution (from [`backend/nextauth-login-flow.test.js`](backend/nextauth-login-flow.test.js:508-546))
```javascript
async function testLoginWithPhone() {
  const response = await makeRequest(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: TEST_USER.phone,  // +8801700000000
      password: TEST_USER.password,
      rememberMe: false
    })
  });

  const passed = response.statusCode === 200 && response.data && response.data.token;
  // Result: passed = false (statusCode was 401)
}
```

**Failure Point:** The login request returns HTTP 401, indicating either:
1. User not found with this phone number
2. Password mismatch
3. Phone number format issue

---

## 2. Authentication Flow Analysis

### Login Endpoint (from [`backend/routes/auth.js`](backend/routes/auth.js:473-883))

#### Step 1: Identifier Type Detection (Line 506)
```javascript
const isEmail = identifier.includes('@');
```
- For `+8801700000000`: `isEmail = false` ✅
- Proceeds to phone number validation path

#### Step 2: Phone Number Validation (Lines 529-540)
```javascript
const phoneValidation = phoneValidationService.validateForUseCase(identifier, 'login');
if (!phoneValidation.isValid) {
  return res.status(400).json({
    error: 'Invalid phone format',
    message: phoneValidation.error
  });
}
```
- Validates phone number format
- Returns 400 if format is invalid
- **Test received 401, not 400**, so validation passed ✅

#### Step 3: User Lookup (Lines 542-548)
```javascript
user = await prisma.user.findUnique({
  where: { phone: phoneValidation.normalizedPhone }
});
loginType = 'phone';
```
- Looks up user by **normalized** phone number
- If user not found, proceeds to Step 4

#### Step 4: User Existence Check (Lines 557-564)
```javascript
if (!user || !user.password) {
  return res.status(401).json({
    error: 'Invalid credentials',
    message: 'Invalid phone number or password',
    messageBn: 'অবৈধ ফোন নম্বর বা পাসওয়ার্ড'
  });
}
```
- **This is where the 401 error originates**
- User was not found OR user has no password

---

## 3. Phone Validation Service Analysis

### Validation for Login Use Case (from [`backend/services/phoneValidationService.js`](backend/services/phoneValidationService.js:556-569))

```javascript
case 'login':
  if (baseValidation.type !== 'mobile') {
    return {
      isValid: false,
      error: 'Only mobile numbers can be used for login',
      errorBn: 'শুধুমাত্রমাত্র মোবাইল নম্বর দিয়ে লগিন করা যায়',
      code: 'MOBILE_ONLY'
    };
  }
  return {
    ...baseValidation,
    canLogin: true,
    requiresVerification: false
  };
```

**Key Rule:** Login only accepts **mobile numbers** (not landlines)

### Mobile Number Validation Patterns (Lines 179-183)
```javascript
const mobilePatterns = [
  /^\+8801[3-9]\d{8}$/,  // International: +8801XXXXXXXXX
  /^8801[3-9]\d{8}$/,   // Country code: 8801XXXXXXXXX
  /^01[3-9]\d{8}$/,     // Local: 01XXXXXXXXX
];
```

**Test Phone Number:** `+8801700000000`
- Pattern: `+8801[3-9]\d{8}$`
- Prefix: `017` (Grameenphone) ✅
- Format: Valid international format ✅
- **Conclusion:** Phone format is valid, validation should pass

### Phone Number Normalization (Lines 195-200)
```javascript
let normalizedPhone = phone;
if (phone.startsWith('01')) {
  normalizedPhone = `+880${phone.substring(1)}`;  // Remove leading 0
} else if (phone.startsWith('880')) {
  normalizedPhone = `+${phone}`;  // Add + prefix
}
```

**For `+8801700000000`:**
- Already in international format
- `normalizedPhone = +8801700000000` ✅

---

## 4. Database Schema Analysis

### User Model Phone Field (from [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma:105-147))

```prisma
model User {
  id            String      @id @default(uuid())
  email         String      @unique
  phone         String?     @unique  // Phone is optional but unique
  password      String?
  // ... other fields
}
```

**Key Points:**
- `phone` field is **optional** (`String?`)
- `phone` field has **unique constraint**
- Phone numbers are stored as strings

---

## 5. Root Cause Analysis

### Possible Sources of the Problem

1. **Missing User Record** ⭐ MOST LIKELY
   - The test phone number `+8801700000000` does not exist in the database
   - User lookup fails at line 544-546 in [`backend/routes/auth.js`](backend/routes/auth.js:544-546)
   - Returns 401 "Invalid phone number or password"

2. **Phone Number Format Mismatch** ⭐ LIKELY
   - Test phone: `+8801700000000`
   - Database phone: Could be stored as `01700000000` or `8801700000000`
   - Normalization produces `+8801700000000`
   - If database has different format, lookup fails

3. **Missing Password**
   - User exists but `password` field is null
   - Check at line 557: `if (!user || !user.password)`
   - Unlikely for test user

4. **User Status Issue**
   - User exists but status is not ACTIVE
   - However, status check happens AFTER user lookup (line 599)
   - 401 occurs before status check

5. **Phone Validation Failure**
   - Phone validation returns `isValid: false`
   - Would return 400, not 401
   - Test received 401, so this is NOT the issue

### Most Likely Root Causes (Distilled)

**Primary Cause: Missing or Mismatched User Record**

The test phone number `+8801700000000` either:
1. Does not exist in the database at all
2. Exists but with a different format (e.g., `01700000000` instead of `+8801700000000`)

**Secondary Cause: Test Data Not Properly Set Up**

The test assumes a user exists with phone `+8801700000000`, but this user may not have been created or may have been created with a different phone number format.

---

## 6. Diagnosis Validation

To confirm the root cause, the following checks should be performed:

### Check 1: Verify User Exists
```sql
SELECT id, email, phone, status FROM users WHERE phone LIKE '%1700000000%';
```

**Expected Results:**
- If no rows: User doesn't exist → **Root cause confirmed**
- If row exists with different format: Format mismatch → **Root cause confirmed**
- If row exists with exact format: Check password

### Check 2: Verify Phone Format in Database
```javascript
// Check how phone numbers are stored
const users = await prisma.user.findMany({
  where: {
    phone: { contains: '1700000000' }
  },
  select: { id: true, email: true, phone: true }
});
```

### Check 3: Test with Email Login
The test shows email login works (Test 8 passed), confirming:
- User `test@example.com` exists ✅
- Password `TestPassword123!` is correct ✅
- Authentication flow is functional ✅

This suggests the issue is specific to phone number lookup, not general authentication.

---

## 7. Recommended Fix Approach

### Immediate Actions

1. **Create or Update Test User with Phone Number**
   ```javascript
   // Ensure user exists with properly formatted phone number
   await prisma.user.upsert({
     where: { email: 'test@example.com' },
     update: {
       phone: '+8801700000000',  // Use normalized format
       status: 'ACTIVE'
     },
     create: {
       email: 'test@example.com',
       phone: '+8801700000000',
       password: hashedPassword,
       firstName: 'Test',
       lastName: 'User',
       status: 'ACTIVE'
     }
   });
   ```

2. **Verify Phone Number Storage Format**
   - Ensure all phone numbers are stored in **international format** (`+880...`)
   - Update existing records if needed

3. **Add Debug Logging to Login Route**
   ```javascript
   // In backend/routes/auth.js, line 543
   console.log('[PHONE LOGIN] Looking up user with phone:', phoneValidation.normalizedPhone);
   user = await prisma.user.findUnique({
     where: { phone: phoneValidation.normalizedPhone }
   });
   console.log('[PHONE LOGIN] User found:', !!user);
   if (user) {
     console.log('[PHONE LOGIN] User phone in DB:', user.phone);
   }
   ```

### Long-term Improvements

1. **Consistent Phone Number Normalization**
   - Ensure registration and login use the same normalization logic
   - Store all phone numbers in international format (`+880...`)
   - Add database constraint or migration to enforce format

2. **Enhanced Error Messages**
   ```javascript
   // In backend/routes/auth.js, line 557
   if (!user) {
     return res.status(401).json({
       error: 'User not found',
       message: 'No account found with this phone number',
       messageBn: 'এই ফোন নম্বর দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি',
       suggestion: 'Please register or check your phone number format'
     });
   }
   ```

3. **Phone Number Format Validation at Registration**
   - Ensure registration normalizes phone numbers before storing
   - Display the normalized format to user for confirmation

4. **Test Data Management**
   - Create a dedicated test data setup script
   - Ensure test users are created with all required fields
   - Verify test data before running tests

---

## 8. Implementation Steps

### Step 1: Verify Current Database State
```bash
# Connect to PostgreSQL
docker exec -it smarttech_postgres psql -U smarttech_user -d smarttech_db

# Check for test user by phone
SELECT id, email, phone, status FROM users WHERE phone LIKE '%1700000000%';
```

### Step 2: Update/Create Test User
```javascript
// Create script: backend/ensure-test-user.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function ensureTestUser() {
  const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {
      phone: '+8801700000000',
      password: hashedPassword,
      status: 'ACTIVE'
    },
    create: {
      email: 'test@example.com',
      phone: '+8801700000000',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      status: 'ACTIVE',
      role: 'CUSTOMER'
    }
  });
  
  console.log('Test user ensured:', user.id, user.email, user.phone);
}

ensureTestUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### Step 3: Run Test Again
```bash
cd backend
node nextauth-login-flow.test.js
```

### Step 4: Verify Fix
- Test 9 should now pass ✅
- Phone number login should return HTTP 200
- Token should be returned

---

## 9. Additional Considerations

### Phone Number Format Consistency
The system accepts multiple phone number formats:
- International: `+8801712345678`
- Country code: `8801712345678`
- Local: `01712345678`

**Recommendation:** Store all phone numbers in **international format** (`+880...`) in the database to ensure consistency and avoid lookup issues.

### Unique Constraint on Phone
The `phone` field has a unique constraint. This means:
- Only one user can have a specific phone number
- If test user is created with phone, no other user can use it
- Ensure test phone numbers don't conflict with real users

### Phone Validation Service Behavior
The validation service:
- Normalizes phone numbers to international format
- Validates against Bangladesh mobile operator prefixes
- Rejects landlines for login/OTP use cases

**Current behavior is correct**, but ensure:
- Registration uses the same normalization
- Database stores normalized format
- Test data matches expected format

---

## 10. Conclusion

### Root Cause
**The phone number login fails because the test phone number (`+8801700000000`) does not exist in the database or exists with a different format.**

The authentication flow is working correctly:
1. Phone validation passes ✅
2. User lookup executes ✅
3. User not found → Returns 401 ✅

### Fix Required
**Create or update the test user record with the correct phone number format.**

### Impact
- **Current:** Phone number login tests fail
- **After Fix:** Phone number login should work correctly
- **Risk:** Low - only affects test data, not production code

### Next Steps
1. Verify database state for test phone number
2. Create/update test user with correct phone format
3. Re-run login tests
4. Verify phone number login works
5. Document test data setup process

---

**Report Generated:** 2026-01-10T06:38:00Z  
**Status:** 🔍 Root Cause Identified  
**Action Required:** Update test data in database
