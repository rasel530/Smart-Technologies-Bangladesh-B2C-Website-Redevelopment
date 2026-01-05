'use client';

/**
 * Session Provider Component
 * Wraps the application with NextAuth session context
 */

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface SessionProviderProps {
  children: ReactNode;
}

/**
 * Session Provider wrapper
 * Provides authentication state to all child components
 */
export function AuthSessionProvider({ children }: SessionProviderProps) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
