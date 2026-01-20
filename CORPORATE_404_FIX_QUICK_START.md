# Corporate Account 404 Fix - Quick Start Testing Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Open the Testing Tool
Open [`test-corporate-404-fix.html`](test-corporate-404-fix.html:1) in your browser

### Step 2: Clear Cache
Click the **"Clear Corporate Account Cache"** button

### Step 3: Test Route 1
Navigate to: **http://localhost:3000/account/corporate**
- ✅ Should load without errors
- ✅ Should show corporate account details
- ✅ Check console for: `[useCorporateAccount] Fetching corporate account data...`

### Step 4: Test Route 2
Navigate to: **http://localhost:3000/account/corporate/dashboard**
- ✅ Should load without errors
- ✅ Should show dashboard content

### Step 5: Test Auto-Recovery (Critical!)
1. Go back to the testing tool
2. Click **"Set Stale Cache ID"** (sets invalid ID: 5a5eaca8-37a7-4115-9e8d-c9577c6c9333)
3. Navigate to: **http://localhost:3000/account/corporate**
4. ✅ Should auto-recover and show correct data
5. ✅ Check console for:
   - `[useCorporateAccount] Validating cached accountId`
   - `[useCorporateAccount] Cached ID is invalid (404), clearing cache and fetching fresh data`
   - `[useCorporateAccount] Corporate account data fetched successfully`

### Step 6: Test Refresh Button
1. On the corporate page, click the **"Refresh"** button
2. ✅ Should reload data correctly
3. ✅ Check console for: `[Corporate Page] Refreshing corporate account data...`

## 📋 What to Document

After testing, fill in [`CORPORATE_404_FIX_TEST_REPORT.md`](CORPORATE_404_FIX_TEST_REPORT.md:1):

### For Each Scenario:
- ✅ PASS or ❌ FAIL
- What actually happened
- Copy relevant console logs
- Any screenshots (if issues found)

### Expected Console Logs:

**Valid Cache:**
```
[useCorporateAccount] Validating cached accountId
[useCorporateAccount] Cached ID validated successfully
```

**Stale Cache (Auto-Recovery):**
```
[useCorporateAccount] Validating cached accountId
[useCorporateAccount] Cached ID is invalid (404), clearing cache and fetching fresh data
[useCorporateAccount] Cache cleared, fetching fresh corporate account data...
[useCorporateAccount] Corporate account data fetched successfully
```

**No Cache:**
```
[useCorporateAccount] Fetching corporate account data...
[useCorporateAccount] Corporate account data fetched successfully
```

**Manual Refresh:**
```
[Corporate Page] Refreshing corporate account data...
[useCorporateAccount] Cache cleared by refresh, fetching fresh data...
[useCorporateAccount] Corporate account data fetched successfully
```

## 🔍 Troubleshooting

### Issue: Page shows "Corporate account not found"
**Check:**
1. Backend server is running
2. User is logged in (raselbepari88@gmail.com)
3. Check Network tab for API errors

### Issue: Console logs don't appear
**Check:**
1. Console filter shows all log levels
2. Frontend server is running latest code
3. Hard refresh page (Ctrl+Shift+R)

### Issue: Auto-recovery not working
**Check:**
1. Stale ID is truly invalid in database
2. Network tab shows 404 for stale ID
3. Hook code is implemented correctly

## 📊 Test Results Summary

| Scenario | Status | Notes |
|----------|--------|-------|
| Clean Start (No Cache) | [ ] | |
| Valid Cached ID | [ ] | |
| Stale Cached ID (Auto-Recovery) | [ ] | **CRITICAL** |
| Dashboard Route | [ ] | |
| Manual Refresh Button | [ ] | |

## 📁 Files Created

1. **[`test-corporate-404-fix.html`](test-corporate-404-fix.html:1)** - Browser-based testing tool
2. **[`CORPORATE_404_FIX_TESTING_GUIDE.md`](CORPORATE_404_FIX_TESTING_GUIDE.md:1)** - Detailed testing instructions
3. **[`CORPORATE_404_FIX_TEST_REPORT.md`](CORPORATE_404_FIX_TEST_REPORT.md:1)** - Test report template

## 🎯 Success Criteria

✅ Both routes load without "Corporate account not found" error
✅ Auto-recovery works when stale cache is detected
✅ Manual refresh button clears cache and reloads data
✅ Console logs show validation process
✅ No critical issues found

## 📝 Next Steps

1. Complete all 5 test scenarios
2. Document results in test report
3. Share report with development team
4. If issues found, create bug reports
5. If all tests pass, fix is verified

## 💡 Tips

- Keep browser DevTools Console open during testing
- Take screenshots of any errors or unexpected behavior
- Copy console logs for each scenario
- Test in an Incognito/Private window if you see unexpected caching behavior

---

**Need Help?** Refer to [`CORPORATE_404_FIX_TESTING_GUIDE.md`](CORPORATE_404_FIX_TESTING_GUIDE.md:1) for detailed instructions.
