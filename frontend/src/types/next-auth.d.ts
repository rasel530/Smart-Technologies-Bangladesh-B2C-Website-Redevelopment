import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

/**
 * Extend NextAuth types to include custom properties
 * 
 * This file extends the default NextAuth types to support:
 * - Phone number authentication
 * - Backend JWT token integration
 * - Session management
 * - Remember me functionality
 * - OAuth provider tracking
 */

/**
 * Module augmentation for next-auth
 */
declare module 'next-auth' {
  /**
   * Extended User type
   */
  interface User extends DefaultUser {
    id: string;
    email?: string;
    phone?: string;
    firstName: string;
    lastName: string;
    role?: string;
    image?: string | null;
    backendToken?: string;
    sessionId?: string;
    rememberMe?: boolean;
    rememberToken?: string;
    oauthProvider?: string;
    oauthAccessToken?: string;
  }

  /**
   * Extended Session type
   */
  interface Session extends DefaultSession {
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
    backendToken?: string;
    sessionId?: string;
    rememberMe?: boolean;
    rememberToken?: string;
    oauthProvider?: string;
  }
}

/**
 * Module augmentation for next-auth/jwt
 */
declare module 'next-auth/jwt' {
  /**
   * Extended JWT type
   */
  interface JWT extends DefaultJWT {
    id: string;
    email?: string;
    phone?: string;
    firstName: string;
    lastName: string;
    role?: string;
    backendToken?: string;
    sessionId?: string;
    rememberMe?: boolean;
    rememberToken?: string;
    oauthProvider?: string;
    oauthAccessToken?: string;
  }
}

/**
 * Make sure this file is treated as a module
 */
export {};
