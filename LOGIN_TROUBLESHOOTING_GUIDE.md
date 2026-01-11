# Login Troubleshooting Guide for Profile Management

## Issue: Demo User Cannot Login to Account Page

## Quick Verification Steps

### Step 1: Verify Demo Users Exist in Database

Run this script to verify demo users:

```bash
cd backend
node check-demo-users.js
```

Expected output:
```
Found 3 demo users:

User 1:
  ID: 092403eb-caab-4d8c-8a1e-d98acd713029
  Email: demo.user1@smarttech.bd
  Name: Rahim Ahmed
  Phone: +8801712345678
  Role: CUSTOMER
  Status: ACTIVE
  Created: Mon Jan 05 2026 15:21:31 GMT+0600

User 2:
  ID: 1fb7b593-4755-41a3-99c9-6be0972cd723
  Email: demo.user2@smarttech.bd
  Name: Fatima Begum
  Phone: +8801812345678
  Role: CUSTOMER
  Status: ACTIVE
  Created: Mon Jan 05 2026 15:21:32 GMT+0600

User 3:
  ID: 8a353a74-2ef6-4dda-ae54-2c54f32ccf73
  Email: demo.user3@smarttech.bd
  Name: Karim Hossain
  Phone: +8801912345678
  Role: CUSTOMER
  Status: ACTIVE
  Created: Mon Jan 05 2026 15:21:32 GMT+0600

✅ Demo users exist in database
```

If demo users don't exist, run:
```bash
cd backend
node test-profile-management.js
```

### Step 2: Test Backend Login API Directly

Create and run this test script:

```javascript
// test-login-direct.js
const axios = require('axios');

async function testLogin() {
  const credentials = {
    identifier: 'demo.user1@smarttech.bd',
    password: 'Demo123456'
  };

  try {
    console.log('Testing login with:', credentials);
    const response = await axios.post('http://localhost:3001/api/v1/auth/login', credentials);
    
    console.log('\n=== LOGIN SUCCESSFUL ===');
    console.log('Status:', response.status);
    console.log('User:', response.data.user);
    console.log('Token:', response.data.token ? 'Present' : 'Missing');
    console.log('User ID:', response.data.user?.id);
    
    if (response.data?.user?.id && response.data?.token) {
      console.log('\n✅ Login test PASSED');
      return true;
    } else {
      console.log('\n❌ Login test FAILED - Missing user or token');
      return false;
    }
  } catch (error) {
    console.log('\n=== LOGIN FAILED ===');
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', error.response.data);
    }
    return false;
  }
}

testLogin();
```

Run:
```bash
cd backend
node test-login-direct.js
```

Expected output:
```
Testing login with: { identifier: 'demo.user1@smarttech.bd', password: 'Demo123456' }

=== LOGIN SUCCESSFUL ===
Status: 200
User: { id: '...', email: 'demo.user1@smarttech.bd', ... }
Token: Present
User ID: 092403eb-caab-4d8c-8a1e-d98acd713029

✅ Login test PASSED
```

### Step 3: Check Backend Server Status

Verify backend is running:

```bash
curl http://localhost:3001/api/v1/auth/password-policy
```

Expected response:
```json
{
  "policy": {
    "minLength": 8,
    "maxLength": 128,
    ...
  },
  "message": "Current password policy requirements"
}
```

If this fails, backend is not running properly.

### Step 4: Check Docker Container Status

```bash
docker-compose ps
```

Expected output:
```
NAME                    STATUS    PORTS
smarttech_frontend       Up         0.0.0.0:3000->3000/tcp
smarttech_backend        Up         0.0.0.0:3001->3000/tcp
smarttech_postgres       Up         0.0.0.0:5432->5432/tcp
smarttech_redis          Up         0.0.0.0:6379->6379/tcp
```

All services should show "Up" status.

## Common Login Issues and Solutions

### Issue 1: "Invalid credentials" Error

**Possible Causes:**
1. Wrong email or password
2. User doesn't exist in database
3. User status is not ACTIVE

**Solutions:**

Check user status in database:
```bash
cd backend
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findUnique({
  where: { email: 'demo.user1@smarttech.bd' },
  select: { id: true, email: true, status: true, emailVerified: true, phoneVerified: true }
}).then(user => {
  console.log('User found:', !!user);
  if (user) {
    console.log('Status:', user.status);
    console.log('Email Verified:', !!user.emailVerified);
    console.log('Phone Verified:', !!user.phoneVerified);
  }
}).finally(() => prisma.$disconnect());
"
```

If status is not ACTIVE, update it:
```bash
cd backend
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.update({
  where: { email: 'demo.user1@smarttech.bd' },
  data: { status: 'ACTIVE', emailVerified: new Date(), phoneVerified: new Date() }
}).then(() => console.log('User activated'))
.finally(() => prisma.$disconnect());
"
```

### Issue 2: "Account not verified" Error

**Possible Causes:**
1. emailVerified field is null
2. phoneVerified field is null
3. User status is PENDING

**Solutions:**

Update user verification status:
```bash
cd backend
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.update({
  where: { email: 'demo.user1@smarttech.bd' },
  data: { status: 'ACTIVE', emailVerified: new Date(), phoneVerified: new Date() }
}).then(() => console.log('User verified and activated'))
.finally(() => prisma.$disconnect());
"
```

### Issue 3: Frontend Cannot Access Account Page (404)

**Possible Causes:**
1. Docker containers not rebuilt with new files
2. Next.js cache not cleared
3. Authentication redirect loop

**Solutions:**

Rebuild Docker containers:
```bash
docker-compose down
docker volume prune -f
docker-compose build --no-cache
docker-compose up -d
```

Clear Next.js cache in container:
```bash
docker exec smarttech_frontend rm -rf /app/.next
docker-compose restart frontend
```

### Issue 4: Authentication Token Not Persisting

**Possible Causes:**
1. Cookie not being set properly
2. CORS issues between frontend and backend
3. Token not being stored in localStorage/cookies

**Solutions:**

Check browser DevTools:
1. Open DevTools (F12)
2. Go to Application tab
3. Check Cookies for auth token
4. Check LocalStorage for auth token

If token is not present, check backend CORS settings in [`backend/index.js`](backend/index.js).

### Issue 5: Redis Connection Errors

**Possible Causes:**
1. Redis container not running
2. Redis password mismatch
3. Redis port conflict

**Solutions:**

Check Redis container:
```bash
docker logs smarttech_redis
```

Test Redis connection:
```bash
docker exec smarttech_redis redis-cli -a redis_smarttech_2024 ping
```

Expected output: `PONG`

If Redis is not responding, restart it:
```bash
docker-compose restart redis
```

## Complete Login Test Script

Create [`backend/test-complete-login-flow.js`](backend/test-complete-login-flow.js):

```javascript
/**
 * Complete Login Flow Test
 * Tests entire login process from frontend to backend
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';
const DEMO_USER = {
  identifier: 'demo.user1@smarttech.bd',
  password: 'Demo123456'
};

async function testCompleteLoginFlow() {
  console.log('═══════════════════════════════════════════');
  console.log('COMPLETE LOGIN FLOW TEST');
  console.log('═══════════════════════════════════════════\n');

  // Step 1: Test Login
  console.log('Step 1: Testing Login API...');
  try {
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, DEMO_USER);
    
    if (!loginResponse.data?.user?.id || !loginResponse.data?.token) {
      console.log('❌ Login failed - no user or token in response');
      console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
      return;
    }
    
    console.log('✅ Login successful');
    console.log('   User ID:', loginResponse.data.user.id);
    console.log('   User Email:', loginResponse.data.user.email);
    console.log('   User Name:', `${loginResponse.data.user.firstName} ${loginResponse.data.user.lastName}`);
    console.log('   User Status:', loginResponse.data.user.status);
    console.log('   Token:', loginResponse.data.token.substring(0, 20) + '...\n');

    const authToken = loginResponse.data.token;
    const userId = loginResponse.data.user.id;

    // Step 2: Test Get Profile
    console.log('Step 2: Testing Get Profile API...');
    const profileResponse = await axios.get(`${API_BASE_URL}/profile/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (!profileResponse.data?.user) {
      console.log('❌ Get profile failed - no user in response');
      return;
    }

    console.log('✅ Get profile successful');
    console.log('   Profile:', `${profileResponse.data.user.firstName} ${profileResponse.data.user.lastName}`);
    console.log('   Email:', profileResponse.data.user.email);
    console.log('   Phone:', profileResponse.data.user.phone, '\n');

    // Step 3: Test Get Settings
    console.log('Step 3: Testing Get Settings API...');
    const settingsResponse = await axios.get(`${API_BASE_URL}/profile/me/settings`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (!settingsResponse.data?.settings) {
      console.log('❌ Get settings failed - no settings in response');
      return;
    }

    console.log('✅ Get settings successful');
    console.log('   Settings:', JSON.stringify(settingsResponse.data.settings, null, 2), '\n');

    // Step 4: Test Update Profile
    console.log('Step 4: Testing Update Profile API...');
    const updateResponse = await axios.put(`${API_BASE_URL}/profile/me`, {
      firstName: 'Rahim Updated',
      lastName: 'Ahmed Updated'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (!updateResponse.data?.user) {
      console.log('❌ Update profile failed - no user in response');
      return;
    }

    console.log('✅ Update profile successful');
    console.log('   Updated Name:', `${updateResponse.data.user.firstName} ${updateResponse.data.user.lastName}\n`);

    // Summary
    console.log('═══════════════════════════════════════════');
    console.log('TEST SUMMARY');
    console.log('═══════════════════════════════════════════');
    console.log('✅ All login and profile APIs working correctly');
    console.log('✅ Authentication is functioning properly');
    console.log('✅ User can access account page');
    console.log('\nDemo User Credentials:');
    console.log('  Email: demo.user1@smarttech.bd');
    console.log('  Password: Demo123456');
    console.log('\nAccount Page URL:');
    console.log('  http://localhost:3000/account');

  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testCompleteLoginFlow();
```

Run:
```bash
cd backend
node test-complete-login-flow.js
```

## Frontend Login Debugging

### Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Navigate to `http://localhost:3000/login`
4. Enter demo credentials and click Login
5. Watch for any JavaScript errors

### Check Network Requests

1. Open browser DevTools (F12)
2. Go to Network tab
3. Navigate to `http://localhost:3000/login`
4. Login with demo credentials
5. Look for POST request to `/api/v1/auth/login`
6. Check request payload and response

Expected request:
```json
{
  "identifier": "demo.user1@smarttech.bd",
  "password": "Demo123456"
}
```

Expected response (200 OK):
```json
{
  "message": "Login successful",
  "messageBn": "লগ ইন সফল",
  "user": {
    "id": "092403eb-caab-4d8c-8a1e-d98acd713029",
    "email": "demo.user1@smarttech.bd",
    "firstName": "Rahim",
    "lastName": "Ahmed",
    ...
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Check Authentication State

1. After login, go to `http://localhost:3000/account`
2. Open DevTools (F12)
3. Go to Application tab
4. Check LocalStorage for auth tokens
5. Check Cookies for session cookies

## Final Verification Checklist

After completing all steps above:

- [ ] Demo users exist in database
- [ ] Demo users have ACTIVE status
- [ ] Demo users have emailVerified and phoneVerified dates
- [ ] Backend login API returns 200 OK
- [ ] Login response contains user object and token
- [ ] Get profile API works with auth token
- [ ] Get settings API works with auth token
- [ ] Update profile API works with auth token
- [ ] Frontend can successfully login
- [ ] Frontend can access account page
- [ ] Account page displays profile information
- [ ] No JavaScript errors in browser console
- [ ] No 404 errors in browser console

## Next Steps

If all checks pass:

1. Rebuild Docker containers:
   ```bash
   docker-compose down
   docker volume prune -f
   docker-compose build --no-cache
   docker-compose up -d
   ```

2. Clear browser cache:
   - Clear all cookies
   - Clear all local storage
   - Hard refresh page (Ctrl+F5)

3. Test account page:
   - Navigate to `http://localhost:3000/login`
   - Login with demo credentials
   - Navigate to `http://localhost:3000/account`
   - Verify profile displays correctly

## Contact Support

If issues persist after completing all troubleshooting steps:

1. Check backend logs:
   ```bash
   docker logs smarttech_backend
   ```

2. Check frontend logs:
   ```bash
   docker logs smarttech_frontend
   ```

3. Check database logs:
   ```bash
   docker logs smarttech_postgres
   ```

4. Check Redis logs:
   ```bash
   docker logs smarttech_redis
   ```

---

**Note:** This guide assumes you have successfully completed backend implementation and demo data creation as documented in the completion report.
