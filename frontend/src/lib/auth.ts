/**
 * NextAuth.js Configuration
 * Handles social authentication with Google and Facebook providers
 * Integrates with backend API for session management
 */

import NextAuth, { DefaultSession } from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      role: string;
      image?: string | null;
      firstName?: string;
      lastName?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    role: string;
    image?: string | null;
    firstName?: string;
    lastName?: string;
  }
}

declare module 'next-auth' {
  interface JWT {
    id: string;
    email: string;
    role: string;
    image?: string | null;
    firstName?: string;
    lastName?: string;
    accessToken?: string;
    refreshToken?: string;
    provider?: string;
  }
}

/**
 * Backend API configuration
 */
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';

/**
 * Helper function to authenticate with backend API
 */
async function authenticateWithBackend(
  provider: string,
  profile: any,
  accessToken?: string
): Promise<any> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/oauth/callback/${provider}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profile: {
          id: profile.sub || profile.id,
          email: profile.email,
          firstName: profile.given_name || profile.first_name,
          lastName: profile.family_name || profile.last_name,
          image: profile.picture || profile.image?.data?.url,
        },
        accessToken,
      }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Authentication failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Backend authentication error:', error);
    throw error;
  }
}

/**
 * NextAuth.js configuration
 */
export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),

    // Facebook OAuth Provider
    FacebookProvider({
      clientId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
      clientSecret: process.env.FACEBOOK_APP_SECRET || '',
    }),

    // Credentials Provider for email/password login (integration with existing backend)
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const response = await fetch(`${BACKEND_API_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
            credentials: 'include',
          });

          if (!response.ok) {
            return null;
          }

          const data = await response.json();
          return {
            id: data.user.id,
            email: data.user.email,
            role: data.user.role,
            image: data.user.image,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            accessToken: data.token,
          };
        } catch (error) {
          console.error('Credentials authorization error:', error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    /**
     * JWT Callback
     * Called whenever a JSON Web Token is created or updated
     */
    async jwt({ token, user, account, profile, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
        token.image = user.image;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
      }

      // OAuth sign in - store access token
      if (account && account.provider !== 'credentials') {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.provider = account.provider;
      }

      // Handle session update
      if (trigger === 'update' && session) {
        token = { ...token, ...session };
      }

      return token;
    },

    /**
     * Session Callback
     * Called whenever a session is checked
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
        session.user.image = token.image as string | null;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
      }
      return session;
    },

    /**
     * Sign In Callback
     * Called when a user signs in
     */
    async signIn({ user, account, profile }) {
      // For OAuth providers, authenticate with backend
      if (account && account.provider !== 'credentials') {
        try {
          const authResult = await authenticateWithBackend(
            account.provider,
            profile,
            account.access_token
          );

          // Update user data from backend response
          if (authResult && authResult.user) {
            user.id = authResult.user.id;
            user.email = authResult.user.email;
            user.role = authResult.user.role;
            user.image = authResult.user.image;
            user.firstName = authResult.user.firstName;
            user.lastName = authResult.user.lastName;
          }

          return true;
        } catch (error) {
          console.error('OAuth sign in error:', error);
          return false;
        }
      }

      return true;
    },

    /**
     * Redirect Callback
     * Controls where users are redirected after sign in/out
     */
    async redirect({ url, baseUrl }) {
      // Allow relative URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // Allow same-origin URLs
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Default to dashboard
      return `${baseUrl}/dashboard`;
    },
  },

  pages: {
    signIn: '/login',
    error: '/auth/error',
    signOut: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === 'development',
};

/**
 * NextAuth handler for API routes
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
