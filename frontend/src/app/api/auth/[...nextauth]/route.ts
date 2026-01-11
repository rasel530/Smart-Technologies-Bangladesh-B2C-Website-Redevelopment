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
export const authOptions: NextAuthOptions = {
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
    signOut: '/login',
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
        console.log('[NextAuth] Credentials authorize called');
        console.log('[NextAuth] BACKEND_API_URL:', BACKEND_API_URL);

        if (!credentials?.identifier || !credentials?.password) {
          console.log('[NextAuth] Missing credentials');
          return null;
        }

        console.log('[NextAuth] Attempting login with:', {
          identifier: credentials.identifier,
          password: credentials.password ? '[REDACTED]' : 'MISSING',
          rememberMe: credentials.rememberMe,
          endpoint: `${BACKEND_API_URL}/auth/login`
        });

        try {
          // Call backend login API
          console.log('[NextAuth] Sending request to backend...');
          const response = await fetch(`${BACKEND_API_URL}/auth/login`, {
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

          console.log('[NextAuth] Backend response received:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
          });

          // Get raw text first to see what we're dealing with
          const rawText = await response.text();
          console.log('[NextAuth] Raw response body:', rawText.substring(0, 500));

          let data;
          try {
            data = JSON.parse(rawText);
            console.log('[NextAuth] Parsed response data:', JSON.stringify(data, null, 2));
          } catch (parseError) {
            console.error('[NextAuth] Failed to parse JSON response:', parseError);
            console.log('[NextAuth] Response is not valid JSON');
            return null;
          }

          // Check for errors in response
          if (!response.ok) {
            console.log('[NextAuth] Backend returned error status:', {
              status: response.status,
              statusText: response.statusText,
              error: data.error,
              message: data.message
            });
            return null;
          }

          // Validate response structure
          console.log('[NextAuth] Validating response structure...');
          console.log('[NextAuth] Has token?', !!data.token);
          console.log('[NextAuth] Has user?', !!data.user);
          console.log('[NextAuth] Has sessionId?', !!data.sessionId);

          if (!data.token) {
            console.log('[NextAuth] Backend response missing token');
            return null;
          }

          if (!data.user) {
            console.log('[NextAuth] Backend response missing user');
            return null;
          }

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
          console.error('[NextAuth] Credentials authorize error:', error);
          console.error('[NextAuth] Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
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
     */
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in - populate token with user data
      if (user) {
        console.log('[NextAuth] JWT callback - initial sign in');
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
        console.log('[NextAuth] Token populated with user data');
      } else if (token) {
        // Token already exists, preserve it
        console.log('[NextAuth] JWT callback - preserving existing token');
      } else {
        console.log('[NextAuth] JWT callback - no token or user');
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
     */
    async session({ session, token }) {
      console.log('[NextAuth] Session callback');
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        session.backendToken = token.backendToken as string;
        session.sessionId = token.sessionId as string;
        session.rememberMe = token.rememberMe as boolean;
        session.rememberToken = token.rememberToken as string;
        session.oauthProvider = token.oauthProvider as string | undefined;
        console.log('[NextAuth] Session created successfully');
      } else {
        console.log('[NextAuth] No token in session callback');
      }
      
      // Always return session if token exists
      // Don't return null as this can cause unexpected logout behavior
      return token ? session : null;
    },

    /**
     * Sign In Callback
     * Called when user signs in
     */
    async signIn({ user, account, profile }) {
      console.log('[NextAuth] Sign in callback:', { user: user?.email, provider: account?.provider });
      
      // Always return true to allow sign-in to proceed
      // The credentials provider has already validated the user with backend API
      return true;
    },

    /**
     * Redirect Callback
     * Called after sign in/sign out
     *
     * CRITICAL FIX: Prevent redirect loop and session loss
     * - Don't redirect to login if user is already authenticated
     * - Allow session restoration without interference
     */
    async redirect({ url, baseUrl }) {
      console.log('[NextAuth] Redirect callback:', { url, baseUrl });
      
      // Handle absolute URLs directly
      if (url.startsWith('http://') || url.startsWith('https://')) {
        try {
          const parsedUrl = new URL(url);
          
          // Only redirect if not already on the target page
          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            console.log('[NextAuth] Redirect comparison:', { currentPath, targetPath: parsedUrl.pathname, url });
            
            // If redirecting to same page, don't redirect
            if (currentPath === parsedUrl.pathname) {
              console.log('[NextAuth] Skipping redirect - already on target page');
              return null; // Don't redirect
            }
          }
          
          // Only allow redirects to same origin
          if (parsedUrl.origin === baseUrl) {
            console.log('[NextAuth] Allowing same-origin redirect:', url);
            return url;
          } else {
            console.log('[NextAuth] Blocking cross-origin redirect:', url);
            return baseUrl;
          }
        } catch (e) {
          console.log('[NextAuth] Could not parse absolute URL, using baseUrl:', url);
          return baseUrl;
        }
      }
      
      // Handle relative URLs
      if (url.startsWith('/')) {
        const fullUrl = `${baseUrl}${url}`;
        
        // Only redirect if not already on the target page
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          console.log('[NextAuth] Redirect comparison:', { currentPath, targetPath: url, fullUrl });
          
          // If redirecting to same page, don't redirect
          if (currentPath === url) {
            console.log('[NextAuth] Skipping redirect - already on target page');
            return null; // Don't redirect
          }
        }
        
        return fullUrl;
      }
      
      // CRITICAL FIX: Return null for all other cases to prevent unwanted redirects
      // This prevents NextAuth from redirecting during session restoration
      console.log('[NextAuth] Returning null to prevent redirect:', url);
      return null;
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

export { handler as GET, handler as POST };
