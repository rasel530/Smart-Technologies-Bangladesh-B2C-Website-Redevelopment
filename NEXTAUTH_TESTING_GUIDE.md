# NextAuth Testing and Verification Guide

## Overview

This guide provides instructions for testing and verifying the NextAuth.js implementation in the Smart Technologies Bangladesh application.

## Prerequisites

- Backend API running on `http://localhost:3001`
- Frontend running on `http://localhost:3000`
- Test user account exists in backend database
- `NEXTAUTH_SECRET` is configured in `frontend/.env`

## Test User Setup

### Create Test User

If you don't have a test user, create one via backend API:

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "confirmPassword": "TestPassword123!",
    "firstName": "Test",
    "lastName": "User",
    "addressLine1": "Test Address",
    "division": "Dhaka",
    "district": "Dhaka",
    "termsAccepted": true
  }'
```

Or use the registration form at `http://localhost:3000/auth/register`.

## Test Scenarios

### 1. Email/Password Login

**Steps**:
1. Navigate to `http://localhost:3000/auth/login`
2. Enter test credentials:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
3. Click "Login" button
4. Check browser console for `[NextAuth]` logs
5. Verify successful login redirect

**Expected Results**:
- User is redirected to home page or dashboard
- Browser console shows:
  ```
  [NextAuth] Credentials authorize called
  [NextAuth] Backend login response: { token: '...', user: {...} }
  [NextAuth] JWT callback - initial sign in
  [NextAuth] Session callback
  [AuthContext] NextAuth session changed: authenticated
  ```
- User session is stored in cookies
- User data is available in AuthContext

**Verification**:
```typescript
// In browser console
import { useAuth } from '@/contexts/AuthContext';
const { user } = useAuth();
console.log('Authenticated user:', user);
// Should show user object with id, email, firstName, etc.
```

### 2. Phone Number Login

**Steps**:
1. Navigate to `http://localhost:3000/auth/login`
2. Enter phone number:
   - Phone: `01712345678` (or your test phone)
3. Enter password
4. Click "Login" button

**Expected Results**:
- Phone number is validated against backend
- User is logged in successfully
- Session contains phone number

**Verification**:
```typescript
const { user } = useAuth();
console.log('User phone:', user?.phone);
// Should show normalized phone number
```

### 3. Remember Me Functionality

**Steps**:
1. Login with "Remember Me" checkbox checked
2. Close browser
3. Reopen browser and navigate to `http://localhost:3000`
4. Verify user is still logged in

**Expected Results**:
- Session persists across browser restarts
- Session duration is 7 days (604800 seconds)
- Remember me token is stored

**Verification**:
```typescript
// Check browser cookies
// Look for: next-auth.session-token
// Expiration should be 7 days from login time
```

### 4. Session Persistence

**Steps**:
1. Login normally (without remember me)
2. Refresh the page (F5)
3. Verify user remains logged in
4. Wait 24+ hours (or reduce session timeout for testing)
5. Refresh page again
6. Verify user is logged out

**Expected Results**:
- Session persists across page refreshes
- Session expires after configured duration
- User is redirected to login after expiration

**Verification**:
```typescript
// Monitor session changes
useEffect(() => {
  console.log('Session status:', sessionStatus);
}, [sessionStatus]);
// Should show: loading -> authenticated -> unauthenticated (after expiry)
```

### 5. Logout Functionality

**Steps**:
1. Login successfully
2. Click "Logout" button
3. Verify user is logged out
4. Check browser console for logs

**Expected Results**:
- User is redirected to login page
- Session cookies are cleared
- Backend logout API is called
- Browser console shows:
  ```
  [NextAuth] Event - signOut
  [AuthContext] NextAuth session changed: unauthenticated
  ```

**Verification**:
```typescript
const { user } = useAuth();
console.log('User after logout:', user);
// Should be null
```

### 6. Invalid Credentials

**Steps**:
1. Navigate to login page
2. Enter invalid credentials:
   - Email: `wrong@example.com`
   - Password: `WrongPassword123!`
3. Click "Login" button

**Expected Results**:
- Login fails
- Error message is displayed
- User is not logged in
- Browser console shows:
  ```
  [NextAuth] Credentials authorize called
  [NextAuth] Backend login failed
  [NextAuth] NextAuth signIn error: CredentialsSignin
  ```

**Verification**:
```typescript
const { error } = useAuth();
console.log('Login error:', error);
// Should show error object with message
```

### 7. Session Timeout Warning

**Steps**:
1. Login with a session
2. Reduce session timeout for testing (optional)
3. Wait for session to approach expiration
4. Verify timeout warning appears

**Expected Results**:
- Warning banner appears before session expires
- User can extend session
- User is logged out if not extended

**Verification**:
```typescript
// Check SessionTimeoutWarning component is rendered
// Should show warning at 2 minutes before expiration
```

### 8. Protected Routes

**Steps**:
1. Try to access a protected route while logged out
2. Verify redirect to login page
3. Login and try to access same route
4. Verify access is granted

**Expected Results**:
- Unauthenticated users are redirected to login
- Authenticated users can access protected routes
- Session is checked on each navigation

**Verification**:
```typescript
// In a protected page component
const { user, isLoading } = useAuth();

if (isLoading) return <div>Loading...</div>;
if (!user) return <div>Please log in</div>;
return <div>Protected content</div>;
```

## Backend Integration Testing

### Backend API Calls

**Test 1: Login API**

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "password": "TestPassword123!",
    "rememberMe": false
  }'
```

**Expected**: JSON response with `token` and `user` fields

**Test 2: Logout API**

```bash
curl -X POST http://localhost:3001/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected**: Success message

**Test 3: Get Current User**

```bash
curl -X GET http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected**: JSON response with user data

### Backend Token Usage

**Test using backend token from NextAuth session**:

```typescript
import { useSession } from 'next-auth/react';

function TestComponent() {
  const { data: session } = useSession();
  
  const callBackendAPI = async () => {
    if (!session?.backendToken) {
      alert('Not authenticated');
      return;
    }
    
    const response = await fetch('http://localhost:3001/api/v1/protected', {
      headers: {
        'Authorization': `Bearer ${session.backendToken}`,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Protected data:', data);
    } else {
      console.error('API call failed:', response.status);
    }
  };
  
  return <button onClick={callBackendAPI}>Test Backend API</button>;
}
```

## OAuth Testing (Optional)

### Google OAuth (Requires Credentials)

**Prerequisites**:
- Google OAuth app configured
- Redirect URI: `http://localhost:3000/api/auth/callback/google`

**Steps**:
1. Click "Sign in with Google"
2. Authorize the OAuth app
3. Verify user is logged in

**Expected Results**:
- User is redirected to Google OAuth
- After authorization, user is logged in
- User profile data is synced (if backend integration is complete)

**Verification**:
```typescript
const { user } = useAuth();
console.log('OAuth provider:', user?.oauthProvider);
// Should show 'google' if logged in via Google
```

### Facebook OAuth (Requires Credentials)

**Prerequisites**:
- Facebook OAuth app configured
- Redirect URI: `http://localhost:3000/api/auth/callback/facebook`

**Steps**:
1. Click "Sign in with Facebook"
2. Authorize the OAuth app
3. Verify user is logged in

**Expected Results**:
- User is redirected to Facebook OAuth
- After authorization, user is logged in
- User profile data is synced (if backend integration is complete)

## Debug Mode Testing

### Enable Debug Logging

Set in `frontend/.env`:

```bash
NEXTAUTH_DEBUG=true
```

### Check Console Logs

Open browser DevTools (F12) and check Console tab for:
- `[NextAuth]` prefixed logs
- `[AuthContext]` prefixed logs
- Any errors or warnings

### Common Debug Scenarios

**Scenario 1: Backend API Not Responding**

```
[NextAuth] Credentials authorize called
[NextAuth] Backend login failed
[AuthContext] NextAuth signIn error: TypeError: Failed to fetch
```

**Solution**: Check backend is running on port 3001

**Scenario 2: Invalid NEXTAUTH_SECRET**

```
Error: [next-auth][error] NEXTAUTH_SECRET environment variable is not set
```

**Solution**: Generate and set `NEXTAUTH_SECRET` in `.env`

**Scenario 3: Cookie Issues**

```
Error: [next-auth][error] Unable to set session cookie
```

**Solution**: Check browser cookie settings, disable ad-blockers

## Performance Testing

### Session Creation Time

**Test**: Measure time from login to session creation

```javascript
console.time('Login');
await login('test@example.com', 'password');
console.timeEnd('Login');
// Should complete in < 2 seconds
```

### Session Refresh Time

**Test**: Measure time for session refresh

```javascript
console.time('Session Refresh');
// Trigger session refresh (page navigation, etc.)
console.timeEnd('Session Refresh');
// Should complete in < 500ms
```

## Security Testing

### Session Hijacking Prevention

**Test**:
1. Login as User A
2. Copy session cookie
3. Try to use session cookie in different browser/incognito
4. Verify session is not valid

**Expected**: Session cookie is bound to browser/session, cannot be reused

### CSRF Protection

**Test**: Verify CSRF tokens are used

**Expected**: NextAuth automatically includes CSRF protection

### Cookie Security

**Test**: Check cookie attributes

**Expected**:
- `HttpOnly` flag is set
- `Secure` flag is set (in production with HTTPS)
- `SameSite` attribute is set

## Automated Testing

### Run Test Suite

Create a test file `frontend/tests/auth.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/contexts/AuthContext';

describe('NextAuth Integration', () => {
  test('login with valid credentials', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });
    
    expect(result.current.user).not.toBeNull();
  });
  
  test('login with invalid credentials', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.login('wrong@example.com', 'wrong');
    });
    
    expect(result.current.error).not.toBeNull();
  });
  
  test('logout clears session', async () => {
    const { result } = renderHook(() => useAuth());
    
    // First login
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });
    
    expect(result.current.user).not.toBeNull();
    
    // Then logout
    await act(async () => {
      await result.current.logout();
    });
    
    expect(result.current.user).toBeNull();
  });
});
```

Run tests:

```bash
cd frontend
npm test
```

## Troubleshooting

### Issue: Login Not Working

**Symptoms**:
- Login button does nothing
- No console logs
- Page refreshes

**Solutions**:
1. Check backend is running: `curl http://localhost:3001/api/v1/health`
2. Check `NEXT_PUBLIC_API_URL` in `.env`
3. Check browser console for errors
4. Clear Next.js cache: `rm -rf .next`

### Issue: Session Not Persisting

**Symptoms**:
- User logged out on page refresh
- Session lost on navigation

**Solutions**:
1. Check `NEXTAUTH_SECRET` is set
2. Check `NEXTAUTH_URL` is correct
3. Check browser cookies are enabled
4. Check for ad-blockers or privacy extensions
5. Verify CORS settings on backend

### Issue: TypeScript Errors

**Symptoms**:
- Type errors in IDE
- Build fails

**Solutions**:
1. Check `frontend/src/types/next-auth.d.ts` exists
2. Restart TypeScript server
3. Clear Next.js cache: `rm -rf .next`
4. Restart development server

### Issue: OAuth Not Working

**Symptoms**:
- OAuth button redirects to error page
- OAuth callback fails

**Solutions**:
1. Verify OAuth app is configured
2. Check redirect URI matches: `http://localhost:3000/api/auth/callback/google`
3. Check OAuth credentials in `.env`
4. Verify OAuth app is published/active

## Success Criteria

NextAuth implementation is successful when:

✅ **Email/Password Login**: Users can login with email and password
✅ **Phone Login**: Users can login with phone number
✅ **Session Persistence**: Sessions persist across page refreshes
✅ **Remember Me**: Extended session duration works correctly
✅ **Logout**: Users can logout and sessions are cleared
✅ **Backend Integration**: Credentials validated against backend API
✅ **Error Handling**: Invalid credentials show appropriate errors
✅ **Type Safety**: No TypeScript errors
✅ **Debug Logging**: Comprehensive logs for troubleshooting

## Next Steps

After successful testing:

1. **Configure OAuth**: Set up Google/Facebook OAuth credentials
2. **Complete OAuth Integration**: Implement backend OAuth endpoints
3. **Add More Providers**: Add GitHub, Twitter, Apple
4. **Implement 2FA**: Integrate with existing two-factor authentication
5. **Session Management UI**: Add UI to view/manage active sessions
6. **Performance Optimization**: Cache user data, optimize token refresh

## Support

- Full documentation: See [`NEXTAUTH_SETUP_GUIDE.md`](./NEXTAUTH_SETUP_GUIDE.md)
- Quick start: See [`NEXTAUTH_QUICK_START.md`](./NEXTAUTH_QUICK_START.md)
- NextAuth docs: https://next-auth.js.org/
- NextAuth providers: https://next-auth.js.org/providers/
