# NextAuth.js Setup and Configuration Guide

## Overview

This document provides comprehensive information about the NextAuth.js implementation in the Smart Technologies Bangladesh application. NextAuth.js has been integrated as a frontend authentication solution that works with the existing backend API.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Configuration](#configuration)
3. [Providers](#providers)
4. [Session Management](#session-management)
5. [Backend Integration](#backend-integration)
6. [Usage](#usage)
7. [Adding New Providers](#adding-new-providers)
8. [Migration from Custom Auth](#migration-from-custom-auth)
9. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Integration Approach

NextAuth.js is implemented as a **frontend-only authentication solution** that:

- **Validates credentials** against the existing backend API at `/api/v1/auth/login`
- **Manages sessions** using JWT tokens stored in cookies
- **Supports OAuth providers** (Google, Facebook) for social authentication
- **Maintains backward compatibility** with the existing custom auth system
- **Allows gradual migration** from custom auth to NextAuth

### Key Components

1. **NextAuth Route Handler**: `frontend/src/app/api/auth/[...nextauth]/route.ts`
   - Handles all authentication requests
   - Configures providers and callbacks
   - Integrates with backend API

2. **Type Extensions**: `frontend/src/types/next-auth.d.ts`
   - Extends NextAuth types for custom properties
   - Supports phone numbers, backend tokens, remember me functionality

3. **AuthContext**: `frontend/src/contexts/AuthContext.tsx`
   - Wraps NextAuth hooks for backward compatibility
   - Maintains existing API surface for components
   - Syncs NextAuth session with local state

4. **Environment Configuration**: `frontend/.env`
   - Contains all NextAuth configuration variables
   - OAuth provider credentials
   - Security settings

---

## Configuration

### Environment Variables

Required environment variables in `frontend/.env`:

```bash
# NextAuth Configuration
NEXTAUTH_SECRET=your-nextauth-secret-at-least-32-characters-long-please-change-this
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SESSION_MAX_AGE=2592000
NEXTAUTH_SESSION_UPDATE_AGE=86400

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# OAuth Providers
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Security
NEXTAUTH_SECURE_COOKIES=false
NEXTAUTH_DEBUG=true
```

### Generating NEXTAUTH_SECRET

Generate a secure secret using OpenSSL:

```bash
openssl rand -base64 32
```

Or using Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Important**: Never commit `NEXTAUTH_SECRET` to version control. Use environment-specific secrets in production.

### Production Configuration

For production deployment:

```bash
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECURE_COOKIES=true
NEXTAUTH_DEBUG=false
```

---

## Providers

### Credentials Provider

The Credentials provider validates email/password against the backend API:

```typescript
CredentialsProvider({
  name: 'Credentials',
  credentials: {
    identifier: { label: 'Email or Phone', type: 'text' },
    password: { label: 'Password', type: 'password' },
    rememberMe: { label: 'Remember Me', type: 'checkbox' }
  },
  async authorize(credentials) {
    // Calls backend API: POST /api/v1/auth/login
    // Returns user object with backend token
  }
})
```

**Features**:
- Email or phone number login
- Password validation via backend
- Remember me functionality
- Session management

### Google OAuth Provider

Google OAuth allows users to sign in with their Google account:

```typescript
GoogleProvider({
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  allowDangerousEmailAccountLinking: true,
})
```

**Setup Steps**:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env`

**Current Status**: Configured but requires OAuth credentials to function.

### Facebook OAuth Provider

Facebook OAuth allows users to sign in with their Facebook account:

```typescript
FacebookProvider({
  clientId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
})
```

**Setup Steps**:

1. Go to [Facebook Developer Portal](https://developers.facebook.com)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URI: `http://localhost:3000/api/auth/callback/facebook`
5. Copy App ID and App Secret to `.env`

**Current Status**: Configured but requires OAuth credentials to function.

---

## Session Management

### Session Strategy

NextAuth uses **JWT strategy** for session management:

```typescript
session: {
  strategy: 'jwt',
  maxAge: 30 * 24 * 60 * 60, // 30 days
}
```

### Session Flow

1. **Login**: User credentials validated against backend API
2. **Token Storage**: Backend JWT token stored in NextAuth JWT
3. **Cookie**: Session stored in encrypted HTTP-only cookie
4. **Auto-Refresh**: NextAuth automatically refreshes sessions
5. **Logout**: Backend logout API called, cookie cleared

### Session Data

The NextAuth session contains:

```typescript
{
  user: {
    id: string;
    email?: string;
    phone?: string;
    firstName: string;
    lastName: string;
    name: string;
    role?: string;
    image?: string | null;
    preferredLanguage: 'en' | 'bn';
    createdAt: string;
    updatedAt: string;
  };
  backendToken: string;      // Backend JWT token
  sessionId: string;          // Backend session ID
  rememberMe: boolean;         // Remember me flag
  rememberToken?: string;      // Remember me token
  oauthProvider?: string;       // OAuth provider (if applicable)
}
```

### Remember Me Functionality

Remember me extends session duration:

- **Default**: 24 hours (86400 seconds)
- **Remember Me**: 7 days (604800 seconds)

The remember me token is stored in the NextAuth JWT and used for session refresh.

---

## Backend Integration

### API Endpoints

NextAuth integrates with the following backend endpoints:

| Endpoint | Method | Purpose |
|-----------|---------|---------|
| `/api/v1/auth/login` | POST | Validate credentials |
| `/api/v1/auth/logout` | POST | Invalidate session |
| `/api/v1/auth/me` | GET | Get current user |

### Credential Validation

When a user logs in with credentials:

1. NextAuth receives email/phone and password
2. Calls `POST /api/v1/auth/login` with credentials
3. Backend validates and returns user data + JWT token
4. NextAuth stores user data and backend token in JWT
5. Session cookie is set with encrypted JWT

### Backend Token Storage

The backend JWT token is stored in the NextAuth JWT:

```typescript
token.backendToken = user.backendToken;
token.sessionId = user.sessionId;
token.rememberMe = user.rememberMe;
```

This token can be used for API calls to the backend:

```typescript
const response = await fetch(`${BACKEND_API_URL}/protected`, {
  headers: {
    'Authorization': `Bearer ${session.backendToken}`,
  }
});
```

### OAuth Integration (Future)

OAuth providers (Google, Facebook) are configured but not fully integrated with the backend. To complete OAuth integration:

1. **User Creation**: Create user in backend from OAuth profile
2. **Account Linking**: Link OAuth account to existing user
3. **Profile Sync**: Sync OAuth profile data with backend

Example backend endpoint needed:

```typescript
POST /api/v1/auth/oauth
{
  provider: 'google',
  accessToken: 'google-access-token',
  profile: {
    email: 'user@example.com',
    name: 'John Doe',
    picture: 'https://...'
  }
}
```

---

## Usage

### Using NextAuth Hooks

The application uses the custom `useAuth` hook which wraps NextAuth hooks:

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, login, logout, isLoading } = useAuth();
  
  // Login
  await login('user@example.com', 'password', true);
  
  // Logout
  await logout();
  
  // Check authentication
  if (user) {
    console.log('User is authenticated:', user.email);
  }
}
```

### Direct NextAuth Usage

You can also use NextAuth hooks directly:

```typescript
import { useSession, signIn, signOut } from 'next-auth/react';

function MyComponent() {
  const { data: session, status } = useSession();
  
  // Sign in with credentials
  await signIn('credentials', {
    identifier: 'user@example.com',
    password: 'password',
    rememberMe: true,
  });
  
  // Sign in with Google
  await signIn('google');
  
  // Sign out
  await signOut();
}
```

### Protected Routes

Use NextAuth middleware or session checks to protect routes:

```typescript
import { useSession } from 'next-auth/react';

export default function ProtectedPage() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') {
    return <div>Loading...</div>;
  }
  
  if (!session) {
    return <div>Please sign in</div>;
  }
  
  return <div>Welcome, {session.user.name}</div>;
}
```

### Session Provider

Wrap your application with `SessionProvider`:

```typescript
// app/layout.tsx
import { SessionProvider } from 'next-auth/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
```

---

## Adding New Providers

### Step 1: Install Provider Package

```bash
npm install next-auth/providers/github
```

### Step 2: Add to Configuration

Update `frontend/src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import GitHubProvider from 'next-auth/providers/github';

export const authOptions: NextAuthOptions = {
  providers: [
    // ... existing providers
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  // ... rest of configuration
};
```

### Step 3: Add Environment Variables

```bash
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Step 4: Configure OAuth App

1. Go to the OAuth provider's developer portal
2. Create a new OAuth application
3. Add redirect URI: `http://localhost:3000/api/auth/callback/github`
4. Copy credentials to `.env`

### Step 5: Handle OAuth Callbacks

Update the `signIn` callback in NextAuth configuration:

```typescript
callbacks: {
  async signIn({ user, account, profile }) {
    if (account?.provider === 'github') {
      // Create or update user in backend
      await fetch(`${BACKEND_API_URL}/auth/oauth`, {
        method: 'POST',
        body: JSON.stringify({
          provider: 'github',
          accessToken: account.access_token,
          profile: profile,
        }),
      });
    }
    return true;
  },
}
```

---

## Migration from Custom Auth

### What Changed

| Feature | Before | After |
|----------|---------|--------|
| Login | Direct API call | NextAuth `signIn()` |
| Session | Custom state | NextAuth session |
| Token Storage | localStorage | Encrypted cookie |
| OAuth | Not supported | Google, Facebook |
| Session Refresh | Manual | Automatic |

### Backward Compatibility

The implementation maintains backward compatibility:

1. **AuthContext API**: Existing components continue to work without changes
2. **Backend API**: Backend endpoints remain unchanged
3. **Registration**: Still uses backend API directly
4. **Verification**: Email/phone verification still uses backend API

### Migration Steps

1. **Phase 1**: NextAuth is enabled, existing auth continues to work
2. **Phase 2**: Gradually migrate components to use NextAuth hooks directly
3. **Phase 3**: Remove custom auth logic from AuthContext
4. **Phase 4**: Complete OAuth integration with backend

### Component Migration Example

**Before**:

```typescript
const { login } = useAuth();
await login('user@example.com', 'password');
```

**After** (direct NextAuth):

```typescript
import { signIn } from 'next-auth/react';

await signIn('credentials', {
  identifier: 'user@example.com',
  password: 'password',
  rememberMe: false,
});
```

---

## Troubleshooting

### Common Issues

#### Issue: "Invalid NEXTAUTH_SECRET"

**Solution**: Generate a secure secret using OpenSSL:

```bash
openssl rand -base64 32
```

#### Issue: "OAuth callback URL mismatch"

**Solution**: Ensure the redirect URI in OAuth app settings matches:

```
http://localhost:3000/api/auth/callback/google
```

#### Issue: Session not persisting

**Solution**: Check:
1. `NEXTAUTH_URL` is correct
2. Cookies are enabled in browser
3. `NEXTAUTH_SECRET` is set
4. No ad-blockers blocking cookies

#### Issue: TypeScript errors

**Solution**: Ensure type extensions are loaded:
1. Check `frontend/src/types/next-auth.d.ts` exists
2. Restart TypeScript server
3. Clear Next.js cache: `rm -rf .next`

#### Issue: Backend API not called

**Solution**: Check:
1. `NEXT_PUBLIC_API_URL` is correct
2. Backend is running on port 3001
3. CORS is configured on backend

### Debug Mode

Enable debug logging:

```bash
NEXTAUTH_DEBUG=true
```

This will log detailed information about:
- Session changes
- Provider callbacks
- JWT token operations
- Sign in/sign out events

### Testing NextAuth

Test the NextAuth configuration:

```bash
# Start frontend
cd frontend
npm run dev

# Start backend
cd backend
npm start

# Visit http://localhost:3000
# Try logging in with credentials
```

Check browser console for NextAuth logs prefixed with `[NextAuth]`.

---

## Security Considerations

### Cookie Security

- **HTTP-Only**: Cookies cannot be accessed via JavaScript
- **Secure**: Cookies only sent over HTTPS (production)
- **SameSite**: Cookies only sent to same origin
- **Encrypted**: Session data encrypted with NEXTAUTH_SECRET

### Token Storage

- **Backend JWT**: Stored in NextAuth JWT (encrypted)
- **Session ID**: Stored in NextAuth JWT (encrypted)
- **Remember Me Token**: Stored in NextAuth JWT (encrypted)

### Best Practices

1. **Never commit secrets** to version control
2. **Use HTTPS** in production
3. **Rotate secrets** regularly
4. **Monitor logs** for suspicious activity
5. **Keep dependencies** updated
6. **Use strong passwords** for OAuth apps

---

## Future Enhancements

### Planned Features

1. **Complete OAuth Integration**: Full backend integration for Google/Facebook
2. **Additional Providers**: GitHub, Twitter, Apple
3. **Two-Factor Authentication**: Integration with existing 2FA system
4. **Session Management UI**: View and manage active sessions
5. **Account Linking**: Link multiple OAuth accounts
6. **Social Login Flow**: Seamless OAuth to account creation

### Performance Optimizations

1. **Session Caching**: Cache user data in Redis
2. **Token Refresh**: Optimize backend token refresh
3. **Lazy Loading**: Load OAuth providers on demand

---

## Support and Resources

### Documentation

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [NextAuth.js Providers](https://next-auth.js.org/providers/)
- [Next.js Documentation](https://nextjs.org/docs)

### Related Files

- `frontend/src/app/api/auth/[...nextauth]/route.ts` - NextAuth configuration
- `frontend/src/types/next-auth.d.ts` - Type extensions
- `frontend/src/contexts/AuthContext.tsx` - Auth context wrapper
- `frontend/.env` - Environment variables

### Backend Files

- `backend/routes/auth.js` - Backend authentication endpoints
- `backend/services/sessionService.js` - Session management
- `backend/middleware/auth.js` - Authentication middleware

---

## Summary

NextAuth.js has been successfully integrated into the Smart Technologies Bangladesh application with the following features:

✅ **Credentials Provider**: Email/password authentication via backend API
✅ **OAuth Providers**: Google and Facebook (configured, requires credentials)
✅ **Session Management**: JWT-based sessions with automatic refresh
✅ **Backend Integration**: Validates credentials against existing backend
✅ **Backward Compatibility**: Existing components continue to work
✅ **Type Safety**: Full TypeScript support with custom types
✅ **Security**: Encrypted cookies, HTTP-only, secure in production
✅ **Remember Me**: Extended session duration support
✅ **Debug Mode**: Comprehensive logging for troubleshooting

The implementation allows for gradual migration from the custom auth system to NextAuth while maintaining all existing functionality.
