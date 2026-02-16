/**
 * Token synchronization utility
 * Ensures NextAuth session tokens are available to legacy API client via localStorage
 */

/**
 * Syncs the NextAuth backend token to localStorage for API client compatibility
 * Call this after successful login or session update
 */
export const syncTokenToLocalStorage = (backendToken: string | null | undefined): void => {
  if (typeof window !== 'undefined' && backendToken) {
    localStorage.setItem('auth_token', backendToken);
    console.log('[TokenSync] Backend token synced to localStorage');
  }
};

/**
 * Clears the legacy token from localStorage
 * Call this on logout
 */
export const clearLegacyToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    console.log('[TokenSync] Legacy token cleared from localStorage');
  }
};

/**
 * Gets the legacy token from localStorage (fallback for API client)
 */
export const getLegacyToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};
