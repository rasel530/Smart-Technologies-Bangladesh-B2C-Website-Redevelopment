/**
 * NextAuth.js API Route Handler
 * Handles all authentication endpoints for NextAuth.js
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * NextAuth.js API route
 * This route handles all NextAuth.js endpoints including:
 * - /api/auth/signin
 * - /api/auth/signout
 * - /api/auth/callback/google
 * - /api/auth/callback/facebook
 * - /api/auth/session
 * - /api/auth/csrf
 * - /api/auth/providers
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
