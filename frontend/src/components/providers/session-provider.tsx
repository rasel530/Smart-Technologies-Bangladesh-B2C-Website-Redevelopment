'use client';

/**
 * Session Provider Component
 * Wraps the application with NextAuth session context
 */

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface AuthSessionProviderProps {
  children: ReactNode;
}

/**
 * Session Provider wrapper
 * Provides authentication state to all child components
 */
export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  return (
    <SessionProvider
      session={undefined}
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  );
}
