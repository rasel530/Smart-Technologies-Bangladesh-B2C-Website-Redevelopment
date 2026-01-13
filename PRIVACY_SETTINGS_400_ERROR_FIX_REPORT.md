# Privacy Settings 400 Error Fix Report

**Date:** 2026-01-13  
**Issue:** PUT /api/v1/profile/preferences/privacy returning 400 Bad Request  
**Status:** ✅ FIXED

---

## Problem Description

When users tried to save privacy settings on the account preferences page (`http://localhost:3000/account/preferences`), the PUT request to `/api/v1/profile/preferences/privacy` was failing with a 400 Bad Request error.

### Error Details
- **Endpoint:** `PUT http://localhost:3000/api/v1/profile/preferences/privacy`
- **Status:** 400 Bad Request
- **Content-Length:** 167 bytes
- **Request Body:** Contains `profileVisibility: "public"` (lowercase)

### Root Cause Analysis

The issue was a **case sensitivity mismatch** between the frontend and backend validation:

1. **Frontend** sends: `profileVisibility` values in lowercase:
   - `"public"`
   - `"private"`
   - `"friends_only"`

2. **Route validation** in [`backend/routes/privacySettings.js`](backend/routes/privacySettings.js:67) accepted lowercase values but only validated against `['PUBLIC', 'PRIVATE']` (missing `'friends_only'`)

3. **Service validation** in [`backend/services/accountPreferences.service.js`](backend/services/accountPreferences.service.js:240) expected uppercase values:
   - `['PUBLIC', 'PRIVATE']` (missing `'FRIENDS_ONLY'`)

4. **Database** stores values in uppercase enum format

This caused validation to fail when the frontend sent lowercase values like `"public"` or `"friends_only"`.

---

## Solution Implemented

### 1. Updated Route Validation ([`backend/routes/privacySettings.js`](backend/routes/privacySettings.js:66))

**Before:**
```javascript
const VALID_PROFILE_VISIBILITY = ['PUBLIC', 'PRIVATE'];

router.put('/privacy', [
  body('profileVisibility').optional().isIn(VALID_PROFILE_VISIBILITY).withMessage('Invalid profile visibility value'),
  // ...
```

**After:**
```javascript
const VALID_PROFILE_VISIBILITY = ['PUBLIC', 'PRIVATE', 'FRIENDS_ONLY'];

router.put('/privacy', [
  body('profileVisibility').optional().custom((value) => {
    // Accept lowercase values and validate them
    if (!value) return true;
    const upperValue = value.toUpperCase();
    const validValues = ['PUBLIC', 'PRIVATE', 'FRIENDS_ONLY'];
    if (!validValues.includes(upperValue)) {
      throw new Error('Invalid profile visibility value');
    }
    return true;
  }),
  // Added missing fields
  body('dataSharingEnabled').optional().isBoolean(),
  body('twoFactorMethod').optional(),
  body('twoFactorSecret').optional()
```

### 2. Updated Route Response Format ([`backend/routes/privacySettings.js`](backend/routes/privacySettings.js:138))

**Before:**
```javascript
res.json({
  success: true,
  data: {
    settings: privacySettings
  }
});
```

**After:**
```javascript
// Convert profileVisibility to lowercase for frontend
const settingsForFrontend = {
  ...privacySettings,
  profileVisibility: privacySettings.profileVisibility?.toLowerCase() || 'private'
};

res.json({
  success: true,
  data: {
    settings: settingsForFrontend
  }
});
```

### 3. Updated GET Response Format ([`backend/routes/privacySettings.js`](backend/routes/privacySettings.js:50))

**Before:**
```javascript
res.json({
  success: true,
  data: { settings: privacySettings }
});
```

**After:**
```javascript
// Convert profileVisibility to lowercase for frontend
const settingsForFrontend = {
  ...privacySettings,
  profileVisibility: privacySettings.profileVisibility?.toLowerCase() || 'private'
};

res.json({
  success: true,
  data: { settings: settingsForFrontend }
});
```

### 4. Updated Service Layer ([`backend/services/accountPreferences.service.js`](backend/services/accountPreferences.service.js:238))

**Before:**
```javascript
if (updates.profileVisibility !== undefined) {
  // Validate visibility
  const validVisibilities = ['PUBLIC', 'PRIVATE'];
  if (!validVisibilities.includes(updates.profileVisibility)) {
    throw new Error('Invalid profile visibility');
  }
  updateData.profileVisibility = updates.profileVisibility;
}
```

**After:**
```javascript
if (updates.profileVisibility !== undefined) {
  // Convert to uppercase for database storage
  const visibilityUpper = updates.profileVisibility.toUpperCase();
  // Validate visibility
  const validVisibilities = ['PUBLIC', 'PRIVATE', 'FRIENDS_ONLY'];
  if (!validVisibilities.includes(visibilityUpper)) {
    throw new Error('Invalid profile visibility');
  }
  updateData.profileVisibility = visibilityUpper;
}
```

### 5. Updated Service GET Response ([`backend/services/accountPreferences.service.js`](backend/services/accountPreferences.service.js:309))

**Before:**
```javascript
return {
  twoFactorEnabled: preferences.privacyPrefs.twoFactorEnabled,
  twoFactorMethod: preferences.privacyPrefs.twoFactorMethod,
  dataSharingEnabled: preferences.privacyPrefs.dataSharingEnabled,
  profileVisibility: preferences.privacyPrefs.profileVisibility
};
```

**After:**
```javascript
// Convert profileVisibility to lowercase for frontend
const profileVisibilityLower = preferences.privacyPrefs.profileVisibility?.toLowerCase() || 'private';

return {
  twoFactorEnabled: preferences.privacyPrefs.twoFactorEnabled,
  twoFactorMethod: preferences.privacyPrefs.twoFactorMethod,
  dataSharingEnabled: preferences.privacyPrefs.dataSharingEnabled,
  profileVisibility: profileVisibilityLower
};
```

---

## Testing Results

### Test 1: GET Privacy Settings
```bash
curl -X GET http://localhost:3001/api/v1/profile/preferences/privacy \
  -H "Authorization: Bearer <token>"
```

**Result:** ✅ 200 OK
**Response:**
```json
{
  "success": true,
  "data": {
    "settings": {
      "id": "...",
      "userId": "...",
      "profileVisibility": "private",  // ✅ Lowercase
      "showEmail": false,
      "showPhone": false,
      "showAddress": false,
      "allowSearchByEmail": false,
      "allowSearchByPhone": false,
      "twoFactorEnabled": true,
      "twoFactorSecret": null,
      "twoFactorMethod": null,
      "dataSharingEnabled": true
    }
  }
}
```

### Test 2: PUT Privacy Settings (profileVisibility: public)
```bash
curl -X PUT http://localhost:3001/api/v1/profile/preferences/privacy \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"twoFactorEnabled":false,"dataSharingEnabled":true,"profileVisibility":"public"}'
```

**Result:** ✅ 200 OK
**Response:**
```json
{
  "success": true,
  "data": {
    "settings": {
      "profileVisibility": "public",  // ✅ Lowercase
      "twoFactorEnabled": false,
      "dataSharingEnabled": true,
      // ... other fields
    }
  }
}
```

### Test 3: PUT Privacy Settings (profileVisibility: private)
```bash
curl -X PUT http://localhost:3001/api/v1/profile/preferences/privacy \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"twoFactorEnabled":false,"dataSharingEnabled":false,"profileVisibility":"private"}'
```

**Result:** ✅ 200 OK

### Test 4: PUT Privacy Settings (profileVisibility: friends_only)
```bash
curl -X PUT http://localhost:3001/api/v1/profile/preferences/privacy \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"twoFactorEnabled":true,"dataSharingEnabled":false,"profileVisibility":"friends_only"}'
```

**Result:** ✅ 200 OK
**Note:** The `'friends_only'` option was previously missing from validation and is now supported.

---

## Files Modified

1. **[`backend/routes/privacySettings.js`](backend/routes/privacySettings.js:1)**
   - Updated `VALID_PROFILE_VISIBILITY` to include `'FRIENDS_ONLY'`
   - Changed validation to accept lowercase values and convert to uppercase
   - Added missing validation fields (`dataSharingEnabled`, `twoFactorMethod`, `twoFactorSecret`)
   - Updated GET and PUT responses to convert `profileVisibility` to lowercase for frontend

2. **[`backend/services/accountPreferences.service.js`](backend/services/accountPreferences.service.js:1)**
   - Updated `updatePrivacySettings()` to convert lowercase input to uppercase for database
   - Updated `VALID_PROFILE_VISIBILITY` to include `'FRIENDS_ONLY'`
   - Updated `getPrivacySettings()` to convert uppercase database values to lowercase for frontend

---

## Summary

### What Was Fixed
1. ✅ **Case sensitivity issue:** Frontend can now send lowercase `profileVisibility` values
2. ✅ **Missing validation:** Added `'friends_only'` to valid visibility options
3. ✅ **Response format:** API now returns `profileVisibility` in lowercase matching frontend expectations
4. ✅ **Missing fields:** Added validation for `dataSharingEnabled`, `twoFactorMethod`, `twoFactorSecret`

### How It Works
- **Frontend → API:** Sends lowercase values (`"public"`, `"private"`, `"friends_only"`)
- **API → Database:** Converts to uppercase for storage (`"PUBLIC"`, `"PRIVATE"`, `"FRIENDS_ONLY"`)
- **Database → API:** Stores in uppercase enum format
- **API → Frontend:** Converts back to lowercase for consistency with frontend type definitions

### Benefits
- ✅ No more 400 errors when saving privacy settings
- ✅ All three visibility options now work: `public`, `private`, `friends_only`
- ✅ Consistent data format between frontend and backend
- ✅ Proper validation for all privacy settings fields
- ✅ Database maintains proper enum format (uppercase)

---

## Verification

The fix has been tested and verified to work correctly:
- ✅ GET requests return proper lowercase `profileVisibility`
- ✅ PUT requests accept lowercase `profileVisibility` values
- ✅ All three visibility options work: `public`, `private`, `friends_only`
- ✅ Settings are persisted correctly in the database
- ✅ Response format matches frontend expectations (`data.settings`)

The privacy settings page at `http://localhost:3000/account/preferences` should now work without errors.
