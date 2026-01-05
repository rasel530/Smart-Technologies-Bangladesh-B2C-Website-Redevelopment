/**
 * NextAuth.js Type Definitions
 * Extends default NextAuth types for our application
 */

import { DefaultSession, DefaultUser } from 'next-auth';

/**
 * Extended Session interface
 */
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

/**
 * Extended JWT interface
 */
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
 * Provider configuration types
 */
export interface ProviderConfig {
  id: string;
  name: string;
  displayName: string;
  enabled: boolean;
  clientId?: string;
}

/**
 * OAuth profile types
 */
export interface GoogleProfile {
  sub: string;
  email: string;
  email_verified: boolean;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export interface FacebookProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  picture?: {
    data?: {
      url?: string;
    };
  };
}
