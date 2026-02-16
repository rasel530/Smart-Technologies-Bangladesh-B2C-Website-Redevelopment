'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { syncTokenToLocalStorage, clearLegacyToken } from '@/lib/auth/tokenSync';

/**
 * Token Sync Provider
 * Automatically syncs NextAuth session tokens to localStorage
 * Ensures API client has access to authentication token
 */
export function TokenSyncProvider({ children }: { children: React.ReactNode }) {
  // Always call useSession() unconditionally at the top level
  const { data: session, status } = useSession();

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    if (status === 'authenticated' && session?.backendToken) {
      // Sync token when session is available
      syncTokenToLocalStorage(session.backendToken);
    } else if (status === 'unauthenticated') {
      // Clear token when session is gone
      clearLegacyToken();
    }
  }, [session, status]);

  return <>{children}</>;
}
