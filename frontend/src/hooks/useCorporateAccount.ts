import { useState, useEffect } from 'react';
import { CorporateAPI } from '@/lib/api/corporate';
import { CorporateAccount } from '@/types/corporate';

const CORPORATE_ACCOUNT_ID_KEY = 'corporate_account_id';

interface UseCorporateAccountReturn {
  accountId: string | null;
  account: CorporateAccount | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to retrieve and manage corporate account ID for authenticated user
 * 
 * This hook:
 * 1. Checks if corporate account ID is in localStorage
 * 2. If not, calls the /api/corporate/my-account endpoint
 * 3. Stores the result in localStorage
 * 4. Returns the corporate account ID and account data
 * 5. Handles loading and error states
 * 6. Caches the result to avoid repeated API calls
 */
export const useCorporateAccount = (): UseCorporateAccountReturn => {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [account, setAccount] = useState<CorporateAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCorporateAccount = async () => {
    console.log('[useCorporateAccount] fetchCorporateAccount called');
    setIsLoading(true);
    setError(null);

    try {
      // First, try to get from localStorage
      const cachedAccountId = typeof window !== 'undefined' 
        ? localStorage.getItem(CORPORATE_ACCOUNT_ID_KEY)
        : null;

      console.log('[useCorporateAccount] Cached accountId from localStorage:', cachedAccountId);

      if (cachedAccountId !== null) {
        console.log('[useCorporateAccount] Validating cached accountId:', cachedAccountId);
        
        try {
          // Validate the cached ID by fetching the account details
          const accountDetails = await CorporateAPI.getAccount(cachedAccountId);
          console.log('[useCorporateAccount] Cached ID validated successfully');
          
          setAccountId(cachedAccountId);
          setAccount(accountDetails);
          setIsLoading(false);
          return;
        } catch (validationError: any) {
          console.error('[useCorporateAccount] Cached ID validation failed:', validationError);
          
          // Check if it's a 404 error (account doesn't exist)
          if (validationError.response?.status === 404 || validationError.message?.includes('404')) {
            console.log('[useCorporateAccount] Cached ID is invalid (404), clearing cache and fetching fresh data');
            
            // Clear the invalid cache
            if (typeof window !== 'undefined') {
              localStorage.removeItem(CORPORATE_ACCOUNT_ID_KEY);
            }
            
            // Continue to fetch fresh data from API
          } else {
            // For other errors, still try to fetch fresh data
            console.log('[useCorporateAccount] Validation error (not 404), fetching fresh data');
          }
        }
      }

      // If not in cache or cache was invalid, fetch from API
      console.log('[useCorporateAccount] Fetching from API');
      const response = await CorporateAPI.getMyAccount();
      
      console.log('[useCorporateAccount] API response:', response);

      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(CORPORATE_ACCOUNT_ID_KEY, response.id);
      }

      setAccountId(response.id);
      setAccount(response.account);
      console.log('[useCorporateAccount] Account set successfully:', response.id);
    } catch (err: any) {
      console.error('[useCorporateAccount] Error fetching corporate account:', err);
      setError(err.message || 'Failed to retrieve corporate account');
    } finally {
      console.log('[useCorporateAccount] fetchCorporateAccount complete, isLoading:', false);
      setIsLoading(false);
    }
  };

  const refetch = async () => {
    // Clear cache and refetch
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CORPORATE_ACCOUNT_ID_KEY);
    }
    await fetchCorporateAccount();
  };

  useEffect(() => {
    fetchCorporateAccount();
  }, []);

  return {
    accountId,
    account,
    isLoading,
    error,
    refetch
  };
};

export default useCorporateAccount;
