# Data Export Rate Limit Fix Report

## Summary
Changed the data export rate limiting from 60 minutes to 5 minutes as requested by the user.

## Changes Made

### 1. Backend Route Configuration
**File:** [`backend/routes/dataExport.js`](backend/routes/dataExport.js:26-44)

**Before:**
```javascript
const checkRateLimit = (userId, action, res) => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

  const key = `${userId}_${action}`;
  const lastAttempt = rateLimitMap.get(key);

  if (lastAttempt && (now - lastAttempt < oneHour)) {
    const remainingTime = Math.ceil((oneHour - (now - lastAttempt)) / 1000 / 60); // minutes
    return res.status(429).json({
      error: 'Too many requests',
      message: `Please wait ${remainingTime} minutes before trying again`,
      messageBn: `অনুরোধ করার জন্য ${remainingTime} মিনিট অপেক্ষা করুন`
    });
  }
  ...
}
```

**After:**
```javascript
const checkRateLimit = (userId, action, res) => {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

  const key = `${userId}_${action}`;
  const lastAttempt = rateLimitMap.get(key);

  if (lastAttempt && (now - lastAttempt < fiveMinutes)) {
    const remainingTime = Math.ceil((fiveMinutes - (now - lastAttempt)) / 1000 / 60); // minutes
    return res.status(429).json({
      error: 'Too many requests',
      message: `Please wait ${remainingTime} minutes before trying again`,
      messageBn: `অনুরোধ করার জন্য ${remainingTime} মিনিট অপেক্ষা করুন`
    });
  }
  ...
}
```

## Key Changes
1. **Rate Limit Duration:** Changed from 60 minutes (1 hour) to 5 minutes
2. **Variable Name:** Renamed `oneHour` to `fiveMinutes` for clarity
3. **Time Calculation:** Updated all references to use the new 5-minute duration

## Deployment
- Backend container has been rebuilt with the new configuration
- Backend container has been restarted successfully
- Changes are now active

## How to Test

### Manual Testing via Browser
1. Navigate to `http://localhost:3000/account/preferences`
2. Scroll to the "Data Export" section
3. Select data types and click "Generate Export"
4. Immediately try to generate another export
5. **Expected Result:** You should see a message like "Please wait 5 minutes before trying again"

### API Testing via Postman/curl
```bash
# First request - should succeed
curl -X POST http://localhost:3001/api/v1/profile/data/export/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dataTypes": ["profile", "orders", "addresses", "wishlist"],
    "format": "json"
  }'

# Second request - should be rate limited
curl -X POST http://localhost:3001/api/v1/profile/data/export/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dataTypes": ["profile", "orders", "addresses", "wishlist"],
    "format": "json"
  }'

# Expected response for second request:
# {
#   "error": "Too many requests",
#   "message": "Please wait 5 minutes before trying again",
#   "messageBn": "অনুরোধ করার জন্য 5 মিনিট অপেক্ষা করুন"
# }
```

## Notes
- The rate limiting is implemented using an in-memory Map (`rateLimitMap`)
- Each user's export requests are tracked separately by `userId`
- The cooldown period is now 5 minutes instead of 60 minutes
- Export files still expire after 7 days (unchanged)
- The export processing itself is asynchronous and typically completes within seconds

## Future Considerations
If you need to change the rate limit again in the future:
1. Edit [`backend/routes/dataExport.js`](backend/routes/dataExport.js:28)
2. Change the value on line 28: `const fiveMinutes = X * 60 * 1000;`
3. Rebuild and restart the backend container

## Verification
To verify the change is working:
1. Check the backend logs: `docker logs smarttech_backend`
2. Look for successful startup messages
3. Try generating two exports in quick succession
4. Confirm you see the 5-minute wait message

## Status
✅ **COMPLETED** - Rate limiting changed from 60 minutes to 5 minutes
✅ **DEPLOYED** - Backend container rebuilt and restarted
✅ **READY FOR TESTING** - Changes are live and ready for user testing
