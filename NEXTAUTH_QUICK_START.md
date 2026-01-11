# NextAuth Quick Start Guide

## Prerequisites

- Backend API running on `http://localhost:3001`
- Frontend running on `http://localhost:3000`
- NextAuth.js installed (`next-auth@^4.24.13`)

## Quick Setup

### 1. Generate NextAuth Secret

```bash
openssl rand -base64 32
```

Copy the output to `frontend/.env`:

```bash
NEXTAUTH_SECRET=<your-generated-secret>
```

### 2. Configure OAuth Providers (Optional)

Skip this step if you only want email/password authentication.

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Update `.env`:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

#### Facebook OAuth

1. Go to [Facebook Developer Portal](https://developers.facebook.com)
2. Create a new app
3. Add Facebook Login
4. Add redirect URI: `http://localhost:3000/api/auth/callback/facebook`
5. Update `.env`:

```bash
NEXT_PUBLIC_FACEBOOK_APP_ID=your-app-id
FACEBOOK_APP_SECRET=your-app-secret
```

### 3. Start Services

```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Start frontend
cd frontend
npm run dev
```

### 4. Test Authentication

#### Test Email/Password Login

1. Visit `http://localhost:3000/auth/login`
2. Enter email: `test@example.com`
3. Enter password: `your-password`
4. Click "Login"
5. Check browser console for `[NextAuth]` logs
6. Verify user is logged in

#### Test Session Persistence

1. Login with "Remember Me" checked
2. Refresh the page
3. Verify user remains logged in
4. Close and reopen browser
5. Verify user is still logged in (if remember me was used)

#### Test Logout

1. Click "Logout" button
2. Verify user is logged out
3. Check browser console for `[NextAuth] Event - signOut`

#### Test OAuth (If Configured)

1. Click "Sign in with Google" or "Sign in with Facebook"
2. Authorize the OAuth app
3. Verify user is logged in with OAuth account

## Usage Examples

### Using AuthContext (Recommended)

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, login, logout, isLoading } = useAuth();
  
  const handleLogin = async () => {
    await login('user@example.com', 'password', true);
  };
  
  const handleLogout = async () => {
    await logout();
  };
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {user ? (
        <>
          <p>Welcome, {user.firstName}!</p>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

### Using NextAuth Directly

```typescript
import { useSession, signIn, signOut } from 'next-auth/react';

function MyComponent() {
  const { data: session, status } = useSession();
  
  const handleLogin = async () => {
    await signIn('credentials', {
      identifier: 'user@example.com',
      password: 'password',
      rememberMe: true,
    });
  };
  
  const handleLogout = async () => {
    await signOut();
  };
  
  if (status === 'loading') return <div>Loading...</div>;
  
  return (
    <div>
      {session ? (
        <>
          <p>Welcome, {session.user.firstName}!</p>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

### Accessing Backend Token

```typescript
import { useSession } from 'next-auth/react';

function MyComponent() {
  const { data: session } = useSession();
  
  const callBackendAPI = async () => {
    if (!session?.backendToken) {
      console.error('Not authenticated');
      return;
    }
    
    const response = await fetch('http://localhost:3001/api/v1/protected', {
      headers: {
        'Authorization': `Bearer ${session.backendToken}`,
      },
    });
    
    const data = await response.json();
    console.log('Protected data:', data);
  };
  
  return <button onClick={callBackendAPI}>Call Backend API</button>;
}
```

## Troubleshooting

### Login Fails

**Check**:
1. Backend is running on port 3001
2. `NEXT_PUBLIC_API_URL` is correct in `.env`
3. Browser console shows `[NextAuth]` logs
4. Network tab shows API call to `/api/v1/auth/login`

### Session Not Persisting

**Check**:
1. `NEXTAUTH_SECRET` is set in `.env`
2. `NEXTAUTH_URL` is correct
3. Cookies are enabled in browser
4. No ad-blockers blocking cookies

### OAuth Redirect Fails

**Check**:
1. OAuth app redirect URI matches: `http://localhost:3000/api/auth/callback/google`
2. OAuth credentials are correct in `.env`
3. OAuth app is published/active

### TypeScript Errors

**Check**:
1. `frontend/src/types/next-auth.d.ts` exists
2. Restart TypeScript server
3. Clear Next.js cache: `rm -rf .next`

## Debug Mode

Enable debug logging in `.env`:

```bash
NEXTAUTH_DEBUG=true
```

This will show detailed logs in browser console:
- Session changes
- Provider callbacks
- JWT token operations
- Sign in/sign out events

## Next Steps

1. **Configure OAuth**: Set up Google/Facebook OAuth for social login
2. **Complete OAuth Integration**: Implement backend OAuth endpoints
3. **Add More Providers**: Add GitHub, Twitter, Apple
4. **Implement 2FA**: Integrate with existing two-factor authentication
5. **Session Management**: Add UI to view/manage active sessions

## Support

- Full documentation: See [`NEXTAUTH_SETUP_GUIDE.md`](./NEXTAUTH_SETUP_GUIDE.md)
- NextAuth docs: https://next-auth.js.org/
- NextAuth providers: https://next-auth.js.org/providers/
