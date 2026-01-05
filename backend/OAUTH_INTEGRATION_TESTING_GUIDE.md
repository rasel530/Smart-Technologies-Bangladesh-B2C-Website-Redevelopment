# OAuth Integration Testing Guide

## Overview

This guide provides step-by-step instructions for testing the OAuth integration implemented in Milestone 2.

## Prerequisites

1. **Backend Server Running**
   ```bash
   cd backend
   npm start
   ```
   The server should start on port 3001

2. **Frontend Server Running**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend should start on port 3000

3. **Database Connected**
   Ensure PostgreSQL is running and accessible

4. **Redis Connected**
   Ensure Redis is running for session management

## Testing OAuth Endpoints

### Test 1: Check OAuth Providers

**Endpoint:** `GET http://localhost:3001/api/v1/oauth/providers`

**Expected Response:**
```json
{
  "providers": [
    {
      "id": "google",
      "name": "GOOGLE",
      "displayName": "Google"
    },
    {
      "id": "facebook",
      "name": "FACEBOOK",
      "displayName": "Facebook"
    }
  ],
  "message": "Available OAuth providers",
  "messageBn": "উপলব্ধ OAuth প্রদানকারী"
}
```

**Test with curl:**
```bash
curl http://localhost:3001/api/v1/oauth/providers
```

**Test with browser:**
Open `http://localhost:3001/api/v1/oauth/providers` in your browser

### Test 2: Google OAuth Callback

**Endpoint:** `POST http://localhost:3001/api/v1/oauth/callback/google`

**Request Body:**
```json
{
  "profile": {
    "id": "google_demo_user_12345",
    "email": "demo.user@gmail.com",
    "firstName": "Demo",
    "lastName": "User",
    "image": "https://lh3.googleusercontent.com/demo/photo.jpg"
  }
}
```

**Test with curl:**
```bash
curl -X POST http://localhost:3001/api/v1/oauth/callback/google \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "id": "google_demo_user_12345",
      "email": "demo.user@gmail.com",
      "firstName": "Demo",
      "lastName": "User",
      "image": "https://lh3.googleusercontent.com/demo/photo.jpg"
    }
  }'
```

**Expected Response:**
```json
{
  "message": "Account created successfully",
  "messageBn": "অ্যাউন্ট সফলভাবে তৈরি হয়েছে",
  "user": {
    "id": "user-uuid",
    "email": "demo.user@gmail.com",
    "firstName": "Demo",
    "lastName": "User",
    "image": "https://lh3.googleusercontent.com/demo/photo.jpg",
    "role": "CUSTOMER",
    "status": "ACTIVE"
  },
  "token": "jwt-token-here",
  "sessionId": "session-id-here",
  "expiresAt": "2026-01-02T12:13:07.183Z",
  "maxAge": 86400000,
  "provider": "google",
  "isNew": true
}
```

### Test 3: Facebook OAuth Callback

**Endpoint:** `POST http://localhost:3001/api/v1/oauth/callback/facebook`

**Request Body:**
```json
{
  "profile": {
    "id": "facebook_demo_user_67890",
    "email": "demo.user@facebook.com",
    "firstName": "Demo",
    "lastName": "User",
    "image": "https://graph.facebook.com/demo/picture.jpg"
  }
}
```

**Test with curl:**
```bash
curl -X POST http://localhost:3001/api/v1/oauth/callback/facebook \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "id": "facebook_demo_user_67890",
      "email": "demo.user@facebook.com",
      "firstName": "Demo",
      "lastName": "User",
      "image": "https://graph.facebook.com/demo/picture.jpg"
    }
  }'
```

**Expected Response:**
```json
{
  "message": "Account created successfully",
  "messageBn": "অ্যাউন্ট সফলভাবে তৈরি হয়েছে",
  "user": {
    "id": "user-uuid",
    "email": "demo.user@facebook.com",
    "firstName": "Demo",
    "lastName": "User",
    "image": "https://graph.facebook.com/demo/picture.jpg",
    "role": "CUSTOMER",
    "status": "ACTIVE"
  },
  "token": "jwt-token-here",
  "sessionId": "session-id-here",
  "expiresAt": "2026-01-02T12:13:07.183Z",
  "maxAge": 86400000,
  "provider": "facebook",
  "isNew": true
}
```

### Test 4: Get User's Social Accounts

**Endpoint:** `GET http://localhost:3001/api/v1/oauth/accounts`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Test with curl:**
```bash
curl http://localhost:3001/api/v1/oauth/accounts \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Expected Response:**
```json
{
  "socialAccounts": [
    {
      "id": "social-account-uuid",
      "provider": "GOOGLE",
      "providerId": "google_demo_user_12345",
      "createdAt": "2026-01-01T12:13:07.183Z"
    }
  ],
  "message": "Social accounts retrieved successfully",
  "messageBn": "সোশ্যাল অ্যাউন্ট সফলভাবে পুনরুদ্ধার হয়েছে"
}
```

### Test 5: Link Social Account

**Endpoint:** `POST http://localhost:3001/api/v1/oauth/link/google`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "profile": {
    "id": "google_demo_user_12345",
    "email": "demo.user@gmail.com",
    "firstName": "Demo",
    "lastName": "User",
    "image": "https://lh3.googleusercontent.com/demo/photo.jpg"
  }
}
```

**Test with curl:**
```bash
curl -X POST http://localhost:3001/api/v1/oauth/link/google \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "id": "google_demo_user_12345",
      "email": "demo.user@gmail.com",
      "firstName": "Demo",
      "lastName": "User",
      "image": "https://lh3.googleusercontent.com/demo/photo.jpg"
    }
  }'
```

**Expected Response:**
```json
{
  "message": "Social account linked successfully",
  "messageBn": "সোশ্যাল অ্যাউন্ট অ্যাউন্ট সফলভাবে লিঙ্ক করা হয়েছে",
  "provider": "google"
}
```

### Test 6: Unlink Social Account

**Endpoint:** `DELETE http://localhost:3001/api/v1/oauth/unlink/google`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Test with curl:**
```bash
curl -X DELETE http://localhost:3001/api/v1/oauth/unlink/google \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Expected Response:**
```json
{
  "message": "Social account unlinked successfully",
  "messageBn": "সোশ্যাল অ্যাউন্ট অ্যাউন্ট আনলিঙ্ক সফলভাবে সম্পন্ন হয়েছে",
  "provider": "google"
}
```

## Testing with Real OAuth Providers

### Google OAuth Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project
   - Enable Google+ API

2. **Create OAuth 2.0 Credentials**
   - Go to Credentials page
   - Create OAuth 2.0 Client ID
   - Select Web application
   - Add authorized redirect URIs:
     - `http://localhost:3000/auth/callback/google` (development)
     - `https://smarttechnologies-bd.com/auth/callback/google` (production)

3. **Update Environment Variables**
   ```bash
   # In backend/.env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback/google
   ```

4. **Test Google OAuth Flow**
   - Open `http://localhost:3000/login`
   - Click "Continue with Google"
   - Authorize the application
   - Verify callback and user creation

### Facebook OAuth Setup

1. **Create Facebook App**
   - Go to [Facebook Developer Portal](https://developers.facebook.com)
   - Create a new app
   - Add Facebook Login product

2. **Configure OAuth Settings**
   - Set Valid OAuth Redirect URIs:
     - `http://localhost:3000/auth/callback/facebook` (development)
     - `https://smarttechnologies-bd.com/auth/callback/facebook` (production)

3. **Update Environment Variables**
   ```bash
   # In backend/.env
   FACEBOOK_APP_ID=your-facebook-app-id
   FACEBOOK_APP_SECRET=your-facebook-app-secret
   FACEBOOK_REDIRECT_URI=http://localhost:3000/auth/callback/facebook
   ```

4. **Test Facebook OAuth Flow**
   - Open `http://localhost:3000/login`
   - Click "Continue with Facebook"
   - Authorize the application
   - Verify callback and user creation

## Database Verification

### Check UserSocialAccount Records

```sql
-- Check if social accounts are being created
SELECT 
  usa."provider",
  usa."providerId",
  usa."createdAt",
  u.email,
  u."firstName",
  u."lastName"
FROM "user_social_accounts" usa
JOIN "users" u ON usa."userId" = u.id
ORDER BY usa."createdAt" DESC;
```

### Check User Records

```sql
-- Verify users created via OAuth
SELECT 
  id,
  email,
  "firstName",
  "lastName",
  image,
  role,
  status,
  "emailVerified",
  "createdAt"
FROM "users"
WHERE "emailVerified" IS NOT NULL
ORDER BY "createdAt" DESC;
```

## Troubleshooting

### Issue: OAuth Routes Return 404

**Solution:** Ensure backend server is restarted after adding OAuth routes

```bash
# Stop the server
# Press Ctrl+C in the terminal

# Restart the server
cd backend
npm start
```

### Issue: Provider Not Enabled

**Solution:** Check environment variables are set correctly

```bash
# Verify environment variables
cd backend
cat .env | grep GOOGLE
cat .env | grep FACEBOOK
```

### Issue: Session Not Created

**Solution:** Check Redis connection and session service

```bash
# Check Redis status
redis-cli ping

# Check Redis logs in backend terminal
```

### Issue: CORS Errors

**Solution:** Ensure frontend URL is in CORS allowed origins

```bash
# Check backend/.env
cat .env | grep FRONTEND_URL
cat .env | grep CORS_ORIGIN
```

## Testing Checklist

- [ ] Backend server running on port 3001
- [ ] Frontend server running on port 3000
- [ ] PostgreSQL database connected
- [ ] Redis connected
- [ ] GET /api/v1/oauth/providers returns providers
- [ ] POST /api/v1/oauth/callback/google creates user
- [ ] POST /api/v1/oauth/callback/facebook creates user
- [ ] GET /api/v1/oauth/accounts returns linked accounts
- [ ] POST /api/v1/oauth/link/google links account
- [ ] DELETE /api/v1/oauth/unlink/google unlinks account
- [ ] UserSocialAccount records created in database
- [ ] User records updated with OAuth data
- [ ] Sessions created in Redis
- [ ] JWT tokens generated correctly
- [ ] Cookies set correctly
- [ ] Frontend redirects work correctly
- [ ] Error handling works properly

## Success Criteria

All tests pass when:
1. OAuth providers endpoint returns enabled providers
2. Google callback creates/updates user successfully
3. Facebook callback creates/updates user successfully
4. Social accounts are linked correctly
5. Social accounts are unlinked correctly
6. Sessions are created and managed properly
7. JWT tokens are generated and validated
8. Database records are created correctly
9. Error handling works for all scenarios
10. Bilingual messages are displayed correctly

## Next Steps

After successful testing:

1. **Configure Production OAuth Credentials**
   - Obtain production Google OAuth credentials
   - Obtain production Facebook OAuth credentials
   - Update environment variables for production

2. **Security Review**
   - Review OAuth implementation for security issues
   - Test for common OAuth vulnerabilities
   - Implement additional security measures if needed

3. **Monitor and Logging**
   - Set up OAuth-specific logging
   - Monitor OAuth usage and success rates
   - Set up alerts for failures

4. **Documentation**
   - Update API documentation with OAuth endpoints
   - Create user guide for OAuth login
   - Document troubleshooting steps

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [OAuth 2.0 Best Practices](https://oauth.net/2/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Documentation](https://expressjs.com/)
