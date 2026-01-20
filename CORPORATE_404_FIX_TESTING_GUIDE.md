# Corporate Account 404 Fix Testing Guide

## Overview
This guide provides step-by-step instructions to test the corporate account 404 fix implemented in the frontend.

## Test Environment
- **Valid Corporate Account ID**: `83fbff07-2859-425b-bbe2-26478d548fe0`
- **Stale Cached ID (for testing)**: `5a5eaca8-37a7-4115-9e8d-c9577c6c9333`
- **Test User**: raselbepari88@gmail.com
- **Test Routes**:
  - `http://localhost:3000/account/corporate`
  - `http://localhost:3000/account/corporate/dashboard`

## Prerequisites
1. Ensure the development server is running: `npm run dev` (frontend)
2. Ensure the backend server is running
3. Ensure you're logged in as raselbepari88@gmail.com

## Testing Tool Setup

### Option 1: Use the HTML Testing Tool (Recommended)
1. Open `test-corporate-404-fix.html` in your browser
2. This tool provides buttons to:
   - Clear cache
   - Set stale cache (for testing auto-recovery)
   - Set valid cache
   - View current cache state

### Option 2: Manual Browser Console
Open browser DevTools (F12) and use the Console tab:

```javascript
// Clear cache
localStorage.removeItem('corporateAccountId');
localStorage.removeItem('corporateAccountData');

// Set stale cache (for testing auto-recovery)
localStorage.setItem('corporateAccountId', '5a5eaca8-37a7-4115-9e8d-c9577c6c9333');

// Set valid cache
localStorage.setItem('corporateAccountId', '83fbff07-2859-425b-bbe2-26478d548fe0');

// View current cache
console.log('Corporate Account ID:', localStorage.getItem('corporateAccountId'));
console.log('Corporate Account Data:', localStorage.getItem('corporateAccountData'));
```

## Test Scenarios

### Scenario 1: Clean Start (No Cache)
**Purpose**: Verify the app works correctly with no cached data

**Steps**:
1. Clear all corporate account data from localStorage
2. Navigate to `http://localhost:3000/account/corporate`
3. Observe the page loads and displays corporate account details
4. Check browser console for logs

**Expected Results**:
- ✅ Page loads without errors
- ✅ Corporate account details are displayed
- ✅ Console shows: `[useCorporateAccount] Fetching corporate account data...`
- ✅ Console shows: `[useCorporateAccount] Corporate account data fetched successfully`

### Scenario 2: Valid Cached ID
**Purpose**: Verify the app works with a valid cached ID

**Steps**:
1. Set valid corporate account ID: `83fbff07-2859-425b-bbe2-26478d548fe0`
2. Navigate to `http://localhost:3000/account/corporate`
3. Observe the page loads and displays corporate account details
4. Check browser console for logs

**Expected Results**:
- ✅ Page loads without errors
- ✅ Corporate account details are displayed
- ✅ Console shows: `[useCorporateAccount] Validating cached accountId`
- ✅ Console shows: `[useCorporateAccount] Cached ID validated successfully`
- ✅ No additional API calls made (uses cached data)

### Scenario 3: Stale Cached ID (Auto-Recovery)
**Purpose**: Verify the hook automatically recovers from stale cached data

**Steps**:
1. Set stale corporate account ID: `5a5eaca8-37a7-4115-9e8d-c9577c6c9333`
2. Navigate to `http://localhost:3000/account/corporate`
3. Observe the page behavior
4. Check browser console for logs

**Expected Results**:
- ✅ Page loads without showing "Corporate account not found" error
- ✅ Console shows: `[useCorporateAccount] Validating cached accountId`
- ✅ Console shows: `[useCorporateAccount] Cached ID is invalid (404), clearing cache and fetching fresh data`
- ✅ Console shows: `[useCorporateAccount] Cache cleared, fetching fresh corporate account data...`
- ✅ Console shows: `[useCorporateAccount] Corporate account data fetched successfully`
- ✅ Corporate account details are displayed with the correct ID

### Scenario 4: Dashboard Route
**Purpose**: Verify the dashboard route works correctly

**Steps**:
1. Clear cache (or use any cache state)
2. Navigate to `http://localhost:3000/account/corporate/dashboard`
3. Observe the page loads and displays dashboard
4. Check browser console for logs

**Expected Results**:
- ✅ Dashboard loads without errors
- ✅ Dashboard content is displayed
- ✅ Console logs show appropriate validation messages
- ✅ No "Corporate account not found" errors

### Scenario 5: Manual Refresh Button
**Purpose**: Verify the manual refresh button works correctly

**Steps**:
1. Navigate to `http://localhost:3000/account/corporate`
2. If the page loads successfully, set a stale cache ID manually
3. Click the "Refresh" button on the page
4. Observe the page behavior
5. Check browser console for logs

**Expected Results**:
- ✅ Clicking "Refresh" clears the cache
- ✅ Console shows: `[Corporate Page] Refreshing corporate account data...`
- ✅ Console shows: `[useCorporateAccount] Cache cleared by refresh, fetching fresh data...`
- ✅ Page reloads with fresh data
- ✅ Corporate account details are displayed correctly

## Expected Console Logs

### When Cache is Valid
```
[useCorporateAccount] Validating cached accountId
[useCorporateAccount] Cached ID validated successfully
```

### When Cache is Invalid (Stale)
```
[useCorporateAccount] Validating cached accountId
[useCorporateAccount] Cached ID is invalid (404), clearing cache and fetching fresh data
[useCorporateAccount] Cache cleared, fetching fresh corporate account data...
[useCorporateAccount] Corporate account data fetched successfully
```

### When No Cache Exists
```
[useCorporateAccount] Fetching corporate account data...
[useCorporateAccount] Corporate account data fetched successfully
```

### When Manual Refresh is Clicked
```
[Corporate Page] Refreshing corporate account data...
[useCorporateAccount] Cache cleared by refresh, fetching fresh data...
[useCorporateAccount] Corporate account data fetched successfully
```

## Troubleshooting

### Issue: Page shows "Corporate account not found" error
**Possible Causes**:
- Backend server is not running
- User is not logged in
- Corporate account does not exist in database
- Network connectivity issues

**Solutions**:
1. Check backend server is running
2. Verify user is logged in
3. Check browser Network tab for failed API requests
4. Verify corporate account exists in database

### Issue: Console logs don't appear
**Possible Causes**:
- Console filter is set to hide info logs
- Code changes not deployed

**Solutions**:
1. Ensure console filter shows all log levels
2. Verify frontend server is running latest code
3. Hard refresh the page (Ctrl+Shift+R)

### Issue: Auto-recovery not working
**Possible Causes**:
- Stale ID is actually valid (404 not triggered)
- API endpoint not returning 404 for invalid ID

**Solutions**:
1. Verify the stale ID is truly invalid in the database
2. Check Network tab to see API response status
3. Verify the hook code is implemented correctly

## Test Report Template

After completing the tests, document your findings using this template:

```markdown
# Corporate Account 404 Fix Test Report

**Test Date**: [Date]
**Tester**: [Name]
**Environment**: Development

## Test Results Summary

| Scenario | Status | Notes |
|----------|--------|-------|
| Clean Start (No Cache) | [PASS/FAIL] | [Notes] |
| Valid Cached ID | [PASS/FAIL] | [Notes] |
| Stale Cached ID (Auto-Recovery) | [PASS/FAIL] | [Notes] |
| Dashboard Route | [PASS/FAIL] | [Notes] |
| Manual Refresh Button | [PASS/FAIL] | [Notes] |

## Detailed Findings

### Scenario 1: Clean Start (No Cache)
- **Expected**: Page loads and displays corporate account details
- **Actual**: [What happened]
- **Console Logs**: [Relevant logs]
- **Screenshot**: [If applicable]

### Scenario 2: Valid Cached ID
- **Expected**: Page loads using cached data
- **Actual**: [What happened]
- **Console Logs**: [Relevant logs]
- **Screenshot**: [If applicable]

### Scenario 3: Stale Cached ID (Auto-Recovery)
- **Expected**: Auto-recovery clears stale cache and fetches fresh data
- **Actual**: [What happened]
- **Console Logs**: [Relevant logs]
- **Screenshot**: [If applicable]

### Scenario 4: Dashboard Route
- **Expected**: Dashboard loads correctly
- **Actual**: [What happened]
- **Console Logs**: [Relevant logs]
- **Screenshot**: [If applicable]

### Scenario 5: Manual Refresh Button
- **Expected**: Refresh clears cache and reloads data
- **Actual**: [What happened]
- **Console Logs**: [Relevant logs]
- **Screenshot**: [If applicable]

## Issues Found

1. [Issue 1 description]
   - Severity: [Low/Medium/High]
   - Steps to reproduce: [Steps]
   - Expected behavior: [What should happen]
   - Actual behavior: [What actually happened]

2. [Issue 2 description]
   - Severity: [Low/Medium/High]
   - Steps to reproduce: [Steps]
   - Expected behavior: [What should happen]
   - Actual behavior: [What actually happened]

## Recommendations

1. [Recommendation 1]
2. [Recommendation 2]

## Overall Assessment

- **Overall Status**: [PASS/FAIL/PARTIAL]
- **Confidence Level**: [High/Medium/Low]
- **Ready for Production**: [Yes/No]

## Additional Notes

[Any additional observations or notes]
```

## Next Steps

After completing the tests:
1. Document your findings in a test report
2. Share the report with the development team
3. If issues are found, create bug reports
4. If all tests pass, the fix can be considered verified

## Contact

For questions or issues during testing, contact the development team.
