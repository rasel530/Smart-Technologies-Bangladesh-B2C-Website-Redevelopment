import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import { User } from '@/types/auth';

// Backend API URL
// Use BACKEND_API_URL for server-side requests (Docker environment)
// Fall back to NEXT_PUBLIC_API_URL for local development
const BACKEND_API_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// DIAGNOSTIC: Log server-side environment variables
console.log('[NextAuth Route Handler] Server-side environment check:');
console.log('[NextAuth Route Handler] - NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET');
console.log('[NextAuth Route Handler] - NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('[NextAuth Route Handler] - NODE_ENV:', process.env.NODE_ENV);
console.log('[NextAuth Route Handler] - BACKEND_API_URL:', BACKEND_API_URL);

/**
 * NextAuth Configuration
 * 
 * This configuration integrates NextAuth with the existing backend authentication system.
 * 
 * Key Features:
 * - Credentials Provider: Validates email/password against backend API
 * - OAuth Providers: Google and Facebook (optional, requires credentials)
 * - JWT Strategy: Uses JWT tokens for session management
 * - Backend Integration: All credential validation happens via backend API
 * - Backward Compatibility: Works with existing backend auth system
 */
const authOptions: NextAuthOptions = {
  // Configure session strategy
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Configure cookies for session persistence
  cookies: {
    // Session token cookie
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        // CRITICAL: In development, secure must be false for http://
        // In production, secure must be true for https://
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        // CRITICAL: Don't set domain in development - it can cause cookie issues
        // domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost',
      },
    },
    // CSRF token cookie
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    // Callback URL cookie
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    // State cookie
    state: {
      name: 'next-auth.state',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  // Configure JWT settings
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Configure pages
  pages: {
    signIn: '/login',
    signOut: '/',  // Redirect to home page after logout
    newUser: '/register',
  },

  // Configure providers
  providers: [
    // Credentials Provider - Validates against backend API
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Email or Phone', type: 'text' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'Remember Me', type: 'checkbox' }
      },
      async authorize(credentials) {
        console.log('[NextAuth] === CREDENTIALS AUTHORIZE START ===');
        console.log('[NextAuth] BACKEND_API_URL:', BACKEND_API_URL);
        console.log('[NextAuth] NODE_ENV:', process.env.NODE_ENV);

        if (!credentials?.identifier || !credentials?.password) {
          console.log('[NextAuth] Missing credentials');
          console.log('[NextAuth] identifier present:', !!credentials?.identifier);
          console.log('[NextAuth] password present:', !!credentials?.password);
          return null;
        }

        console.log('[NextAuth] Attempting login with:', {
          identifier: credentials.identifier,
          password: credentials.password ? '[REDACTED]' : 'MISSING',
          rememberMe: credentials.rememberMe,
          endpoint: `${BACKEND_API_URL}/auth/login`
        });

        try {
          console.log('[NextAuth] === STARTING BACKEND REQUEST ===');
          const loginUrl = `${BACKEND_API_URL}/auth/login`;
          console.log('[NextAuth] URL:', loginUrl);
          console.log('[NextAuth] Method:', 'POST');
          console.log('[NextAuth] Headers:', { 'Content-Type': 'application/json' });
          console.log('[NextAuth] Body:', JSON.stringify({
            identifier: credentials.identifier,
            password: '[REDACTED]',
            rememberMe: credentials.rememberMe || false,
          }));

          const response = await fetch(loginUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              identifier: credentials.identifier,
              password: credentials.password,
              rememberMe: credentials.rememberMe || false,
            }),
          });

          console.log('[NextAuth] === BACKEND RESPONSE RECEIVED ===');
          console.log('[NextAuth] Status:', response.status);
          console.log('[NextAuth] Status Text:', response.statusText);
          console.log('[NextAuth] OK:', response.ok);
          console.log('[NextAuth] Headers:', Object.fromEntries(response.headers.entries()));

          // Get raw text first to see what we're dealing with
          const rawText = await response.text();
          console.log('[NextAuth] Raw response body:', rawText.substring(0, 500));

          let data;
          try {
            data = JSON.parse(rawText);
            console.log('[NextAuth] Parsed response data:', JSON.stringify(data, null, 2));
          } catch (parseError) {
            console.error('[NextAuth] === JSON PARSE ERROR ===');
            console.error('[NextAuth] Failed to parse JSON response:', parseError);
            console.log('[NextAuth] Response is not valid JSON');
            return null;
          }

          // Check for errors in response
          if (!response.ok) {
            console.error('[NextAuth] === BACKEND ERROR RESPONSE ===');
            console.error('[NextAuth] Backend returned error status:', {
              status: response.status,
              statusText: response.statusText,
              error: data.error,
              message: data.message
            });
            return null;
          }

          // Validate response structure
          console.log('[NextAuth] === VALIDATING RESPONSE STRUCTURE ===');
          console.log('[NextAuth] Has token?', !!data.token);
          console.log('[NextAuth] Has user?', !!data.user);
          console.log('[NextAuth] Has sessionId?', !!data.sessionId);

          if (!data.token) {
            console.error('[NextAuth] Backend response missing token');
            return null;
          }

          if (!data.user) {
            console.error('[NextAuth] Backend response missing user');
            return null;
          }

          console.log('[NextAuth] === LOGIN SUCCESSFUL ===');
          console.log('[NextAuth] Backend login successful, returning user object');
          console.log('[NextAuth] User data:', {
            id: data.user.id,
            email: data.user.email,
            phone: data.user.phone,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            role: data.user.role
          });

          // Return user object for NextAuth session
          return {
            id: data.user.id,
            email: data.user.email,
            phone: data.user.phone,
            name: `${data.user.firstName} ${data.user.lastName}`,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            role: data.user.role,
            image: null,
            backendToken: data.token, // Store backend JWT token
            sessionId: data.sessionId,
            rememberMe: data.rememberMe,
            rememberToken: data.rememberToken,
          };
        } catch (error) {
          console.error('[NextAuth] === FETCH ERROR ===');
          console.error('[NextAuth] Error:', error instanceof Error ? error.message : String(error));
          console.error('[NextAuth] Stack:', error instanceof Error ? error.stack : undefined);
          console.error('[NextAuth] Name:', error instanceof Error ? error.name : String(error));
          if (error instanceof Error && 'code' in error) {
            console.error('[NextAuth] Code:', (error as any).code);
          }
          return null;
        }
      },
    }),

    // Google OAuth Provider (optional - requires credentials)
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),

    // Facebook OAuth Provider (optional - requires credentials)
    FacebookProvider({
      clientId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
      clientSecret: process.env.FACEBOOK_APP_SECRET || '',
    }),
  ],

  // Configure callbacks
  callbacks: {
    /**
     * JWT Callback
     * Called whenever a JWT is created or updated
     * CRITICAL: ALWAYS generates a new token on login, never preserves existing tokens
     */
    async jwt({ token, user, account, trigger, session }) {
      // ALWAYS generate a new token on login, never preserve existing
      if (user) {
        console.log('[NextAuth] JWT callback - generating NEW token for user:', user.email);
        
        // Create a fresh token with all user data
        token.id = user.id;
        token.email = user.email;
        token.phone = user.phone;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.role = user.role;
        token.backendToken = user.backendToken;
        token.sessionId = user.sessionId;
        token.rememberMe = user.rememberMe;
        token.rememberToken = user.rememberToken;
        
        // Add timestamps to track token creation
        token.createdAt = new Date().toISOString();
        token.updatedAt = new Date().toISOString();
        
        // Track token version to ensure freshness
        token.tokenVersion = Date.now();
        
        console.log('[NextAuth] NEW token generated with version:', token.tokenVersion);
      } else if (token) {
        // CRITICAL FIX: Do NOT preserve existing tokens
        // When a user logs out and logs back in, a fresh token will be generated
        // This block only returns the existing token for session updates, not for new logins
        console.log('[NextAuth] JWT callback - existing token (only for session updates, not new logins)');
      } else {
        console.log('[NextAuth] JWT callback - no token or user, skipping token population');
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        console.log('[NextAuth] JWT callback - session update');
        token = { ...token, ...session };
      }

      // OAuth sign in
      if (account && account.provider !== 'credentials') {
        console.log('[NextAuth] JWT callback - OAuth sign in:', account.provider);
        // For OAuth, we would need to create/update user in backend
        // This is a placeholder for OAuth integration
        token.oauthProvider = account.provider;
        token.oauthAccessToken = account.access_token;
      }

      return token;
    },

    /**
     * Session Callback
     * Called whenever a session is checked
     * CRITICAL: ALWAYS uses the new token from JWT callback, never preserves existing ones
     */
    async session({ session, token }) {
      console.log('[NextAuth] Session callback - using NEW token from JWT callback');
      console.log('[NextAuth] Token in session callback:', !!token);

      if (token) {
        session.user = {
          id: token.id as string,
          email: token.email as string,
          phone: token.phone as string,
          firstName: token.firstName as string,
          lastName: token.lastName as string,
          name: token.name as string,
          role: token.role as string,
          image: token.picture as string | null,
          preferredLanguage: 'en', // Default, can be updated from backend
          // Use createdAt from token if available, otherwise use current time
          createdAt: token.createdAt ? (token.createdAt as string) : new Date().toISOString(),
          updatedAt: token.updatedAt ? (token.updatedAt as string) : new Date().toISOString(),
        };
        
        // ALWAYS use the new token from JWT callback
        session.backendToken = token.backendToken as string;
        session.sessionId = token.sessionId as string;
        session.rememberMe = token.rememberMe;
        session.rememberToken = token.rememberToken;
        session.oauthProvider = token.oauthProvider as string | undefined;
        
        // Track token version to ensure we're using the new token
        session.tokenVersion = token.tokenVersion as number;
        session.createdAt = token.createdAt as string;
        session.updatedAt = token.updatedAt as string;
        
        console.log('[NextAuth] Session created successfully with token version:', session.tokenVersion);
      } else {
        console.log('[NextAuth] No token in session callback');
      }

      // Always return session if token exists
      // Don't return null as this can cause unexpected logout behavior
      return token ? session : (undefined as any);
    },

    /**
     * Sign In Callback
     * Called when user signs in
     * Returns true to allow sign-in, false to deny
     *
     * Note: Redirect logic is handled on client-side after session is loaded
     */
    async signIn({ user, account, profile }) {
      console.log('[NextAuth] Sign in callback:', { user: user?.email, provider: account?.provider, role: user?.role });

      // Allow sign-in for all authenticated users
      // Client-side will handle role-based redirects after session loads
      return true;
    },

    /**
     * Redirect Callback
     * Called after sign in/sign out
     *
     * CRITICAL: Always return baseUrl to prevent redirect loops
     * Client-side login page will handle role-based redirects
     */
    async redirect({ url, baseUrl }) {
      console.log('[NextAuth] Redirect callback:', { url, baseUrl });
      console.log('[NextAuth] Returning baseUrl to prevent redirect loop:', baseUrl);

      // Always return baseUrl - let client-side handle redirects
      return baseUrl;
    },
  },

  // Configure events
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('[NextAuth] Event - signIn:', { user: user?.email, provider: account?.provider, isNewUser });

      // TODO: Track sign-in events in backend
      // This could be used for analytics, security logging, etc.
    },

    async signOut({ token, session }) {
      console.log('[NextAuth] Event - signOut');

      // Call backend logout API to invalidate session
      if (token?.sessionId || token?.backendToken) {
        try {
          await fetch(`${BACKEND_API_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token.backendToken}`,
            },
          });
        } catch (error) {
          console.error('[NextAuth] Backend logout error:', error);
          // Don't throw - allow frontend logout to proceed
        }
      }
    },

    async createUser({ user }) {
      console.log('[NextAuth] Event - createUser:', user?.email);

      // TODO: Create user in backend for OAuth sign-ins
      // This would involve calling backend registration API with OAuth data
    },

    async updateUser({ user }) {
      console.log('[NextAuth] Event - updateUser:', user?.email);

      // TODO: Sync user updates with backend
    },

    async session({ session, token }) {
      console.log('[NextAuth] Event - session');

      // TODO: Track session events
    },
  },

  // Configure debug mode
  debug: process.env.NODE_ENV === 'development',

  // Configure secret
  secret: process.env.NEXTAUTH_SECRET,
};

// DIAGNOSTIC: Log configuration on load
console.log('[NextAuth] Configuration loaded:');
console.log('[NextAuth] - Session Strategy:', authOptions.session?.strategy);
console.log('[NextAuth] - Session Max Age:', authOptions.session?.maxAge);
console.log('[NextAuth] - JWT Max Age:', authOptions.jwt?.maxAge);
console.log('[NextAuth] - Secret:', authOptions.secret ? 'SET' : 'NOT SET');
console.log('[NextAuth] - NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('[NextAuth] - NODE_ENV:', process.env.NODE_ENV);

// NextAuth route handler
const handler = NextAuth(authOptions);

// Type assertion for Next.js 15 compatibility
export { handler as GET, handler as POST };
