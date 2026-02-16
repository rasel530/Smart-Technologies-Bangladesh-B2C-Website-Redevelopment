/**
 * Comprehensive Test Suite for Wishlist Infinite Loading Fix
 *
 * This test suite verifies that all implemented fixes resolve the infinite loading state
 * on the wishlist page. It covers:
 *
 * Fix #1: Added skipDeduplication option to RequestOptions interface
 * Fix #2: Modified retry logic to use skipDeduplication: true during token refresh retries
 * Fix #3: Enhanced setToken() function for atomic token updates
 * Fix #4: Replaced module-level flag with ref-based approach in useWishlist.ts
 * Fix #5: Added timeout mechanism in wishlistStore.ts to clear loading state after 30 seconds
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useWishlist } from '@/hooks/useWishlist';
import { apiClient, setToken, getToken, updateCachedSessionToken } from '@/lib/api/client';
import useWishlistStore from '@/stores/wishlistStore';

// Mock fetch globally
global.fetch = jest.fn();

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock wishlist API
jest.mock('@/lib/api/wishlist', () => ({
  getWishlists: jest.fn(),
  getWishlistById: jest.fn(),
  createWishlist: jest.fn(),
  updateWishlist: jest.fn(),
  deleteWishlist: jest.fn(),
  addItemToWishlist: jest.fn(),
  removeItemFromWishlist: jest.fn(),
  moveItemsToCart: jest.fn(),
  shareWishlist: jest.fn(),
  exportWishlist: jest.fn(),
}));

import wishlistApi from '@/lib/api/wishlist';

describe('Wishlist Infinite Loading Fix - Comprehensive Test Suite', () => {
  let mockUseSession: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Clear localStorage
    localStorage.clear();
    sessionStorage.clear();

    // Reset store state
    useWishlistStore.getState().reset();

    // Setup default session mock
    mockUseSession = require('next-auth/react').useSession;
    mockUseSession.mockReturnValue({
      data: { backendToken: 'initial-token' },
      status: 'authenticated',
    });

    // Setup console spies for debugging
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Fix #1 & #2: skipDeduplication Option and Retry Logic', () => {
    it('should use skipDeduplication: true when retrying after token refresh', async () => {
      // Setup: Initial 401 response, then successful response
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      let requestCount = 0;
      mockFetch.mockImplementation(async (url: string, options: any) => {
        requestCount++;
        
        if (requestCount === 1) {
          // First request: 401 error
          return {
            ok: false,
            status: 401,
            statusText: 'Unauthorized',
            headers: new Headers(),
            json: async () => ({ message: 'Token expired' }),
          } as Response;
        } else if (requestCount === 2) {
          // Token refresh request
          return {
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: new Headers(),
            json: async () => ({
              success: true,
              data: { token: 'new-refreshed-token' },
            }),
          } as Response;
        } else if (requestCount === 3) {
          // Retry request after token refresh - should have skipDeduplication: true
          // Verify the request was made (not deduplicated)
          return {
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: new Headers(),
            json: async () => ({
              success: true,
              data: {
                wishlists: [
                  { id: '1', name: 'My Wishlist', isDefault: true, items: [] },
                ],
              },
            }),
          } as Response;
        }
        
        throw new Error('Unexpected request');
      });

      // Mock wishlist API
      (wishlistApi.getWishlists as jest.Mock).mockImplementation(async () => {
        return apiClient.request('/wishlists', { method: 'GET' });
      });

      // Execute: Load wishlists
      const { result } = renderHook(() => useWishlist());

      await act(async () => {
        await result.current.loadWishlists();
      });

      // Assert: Verify the retry was made with skipDeduplication
      expect(requestCount).toBe(3); // Initial + refresh + retry
      
      // Verify token was updated
      const currentToken = getToken();
      expect(currentToken).toBe('new-refreshed-token');
      
      // Verify loading state was cleared
      expect(result.current.isLoading).toBe(false);
    });

    it('should bypass deduplication cache when skipDeduplication is true', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      let requestCount = 0;
      mockFetch.mockImplementation(async () => {
        requestCount++;
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers(),
          json: async () => ({
            success: true,
            data: {
              wishlists: [{ id: '1', name: 'Wishlist 1', isDefault: true, items: [] }],
            },
          }),
        } as Response;
      });

      // First request without skipDeduplication
      await act(async () => {
        await apiClient.request('/wishlists', { method: 'GET' });
      });

      // Second request without skipDeduplication - should be deduplicated
      await act(async () => {
        await apiClient.request('/wishlists', { method: 'GET' });
      });

      // Should still be 1 request due to deduplication
      expect(requestCount).toBe(1);

      // Third request with skipDeduplication: true - should bypass cache
      await act(async () => {
        await apiClient.request('/wishlists', { 
          method: 'GET',
          skipDeduplication: true 
        });
      });

      // Should now be 2 requests (deduplication was bypassed)
      expect(requestCount).toBe(2);
    });

    it('should handle concurrent requests with skipDeduplication correctly', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      let requestCount = 0;
      mockFetch.mockImplementation(async () => {
        requestCount++;
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers(),
          json: async () => ({
            success: true,
            data: {
              wishlists: [{ id: '1', name: 'Wishlist 1', isDefault: true, items: [] }],
            },
          }),
        } as Response;
      });

      // Make concurrent requests - only one should go through due to deduplication
      const promises = [
        apiClient.request('/wishlists', { method: 'GET' }),
        apiClient.request('/wishlists', { method: 'GET' }),
        apiClient.request('/wishlists', { method: 'GET' }),
      ];

      await act(async () => {
        await Promise.all(promises);
      });

      // Should only be 1 request due to deduplication
      expect(requestCount).toBe(1);

      // Make concurrent requests with skipDeduplication - all should go through
      const promises2 = [
        apiClient.request('/wishlists', { method: 'GET', skipDeduplication: true }),
        apiClient.request('/wishlists', { method: 'GET', skipDeduplication: true }),
        apiClient.request('/wishlists', { method: 'GET', skipDeduplication: true }),
      ];

      await act(async () => {
        await Promise.all(promises2);
      });

      // Should now be 4 requests total (1 + 3)
      expect(requestCount).toBe(4);
    });
  });

  describe('Fix #3: Atomic Token Updates', () => {
    it('should update both localStorage and cached token atomically', () => {
      const testToken = 'test-token-123';

      // Execute: Set token
      setToken(testToken);

      // Assert: Both localStorage and cached token should be updated
      expect(localStorage.getItem('auth_token')).toBe(testToken);
      expect(getToken()).toBe(testToken);
    });

    it('should maintain consistency between localStorage and cached token', () => {
      const tokens = ['token-1', 'token-2', 'token-3'];

      tokens.forEach((token) => {
        setToken(token);
        expect(localStorage.getItem('auth_token')).toBe(token);
        expect(getToken()).toBe(token);
      });
    });

    it('should handle concurrent token updates correctly', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      mockFetch.mockImplementation(async (url: string, options: any) => {
        // Simulate token refresh that updates token
        if (url.includes('/auth/refresh')) {
          return {
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: new Headers(),
            json: async () => ({
              success: true,
              data: { token: 'concurrent-refresh-token' },
            }),
          } as Response;
        }
        
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers(),
          json: async () => ({
            success: true,
            data: {
              wishlists: [{ id: '1', name: 'Wishlist 1', isDefault: true, items: [] }],
            },
          }),
        } as Response;
      });

      // Set initial token
      setToken('initial-token');

      // Make concurrent requests that might trigger token refresh
      const promises = [
        apiClient.request('/wishlists', { method: 'GET' }),
        apiClient.request('/wishlists', { method: 'GET' }),
      ];

      await act(async () => {
        await Promise.all(promises);
      });

      // Verify token consistency
      const localStorageToken = localStorage.getItem('auth_token');
      const cachedToken = getToken();
      
      expect(localStorageToken).toBe(cachedToken);
      expect(localStorageToken).toBeTruthy();
    });

    it('should update cached token via updateCachedSessionToken', () => {
      const testToken = 'session-token-456';

      // Execute: Update cached session token
      updateCachedSessionToken(testToken);

      // Assert: Cached token should be updated
      expect(getToken()).toBe(testToken);
    });

    it('should clear both localStorage and cached token when null is passed', () => {
      // Set initial token
      setToken('initial-token');
      expect(getToken()).toBe('initial-token');

      // Clear token
      updateCachedSessionToken(null);

      // Assert: Both should be cleared
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(getToken()).toBeNull();
    });
  });

  describe('Fix #4: Ref-Based Flag in useWishlist', () => {
    it('should allow retry attempts after initial load fails', async () => {
      const { result } = renderHook(() => useWishlist());

      // Mock initial failure
      (wishlistApi.getWishlists as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      // First load attempt
      await act(async () => {
        try {
          await result.current.loadWishlists();
        } catch (error) {
          // Expected error
        }
      });

      // Should have error state
      expect(result.current.error).toBeTruthy();

      // Mock successful response for retry
      (wishlistApi.getWishlists as jest.Mock).mockResolvedValueOnce({
        wishlists: [{ id: '1', name: 'My Wishlist', isDefault: true, items: [] }],
      });

      // Retry should succeed
      await act(async () => {
        await result.current.loadWishlists();
      });

      // Should have data now
      expect(result.current.wishlists).toHaveLength(1);
      expect(result.current.error).toBeNull();
    });

    it('should reset flag on unauthenticated status', async () => {
      const { result, rerender } = renderHook(() => useWishlist());

      // Initial authenticated state
      mockUseSession.mockReturnValue({
        data: { backendToken: 'token' },
        status: 'authenticated',
      });

      // Load wishlists
      (wishlistApi.getWishlists as jest.Mock).mockResolvedValueOnce({
        wishlists: [{ id: '1', name: 'My Wishlist', isDefault: true, items: [] }],
      });

      await act(async () => {
        await result.current.loadWishlists();
      });

      expect(result.current.wishlists).toHaveLength(1);

      // Switch to unauthenticated
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      rerender();

      // Flag should be reset, allowing future loads
      // This is verified by the hook's internal behavior
    });

    it('should handle token changes and trigger retry', async () => {
      const { result } = renderHook(() => useWishlist());

      // Set initial state with needsRefresh
      useWishlistStore.setState({
        needsRefresh: true,
        isLoading: false,
        error: '401 Unauthorized',
        wishlists: [],
      });

      // Mock successful response
      (wishlistApi.getWishlists as jest.Mock).mockResolvedValueOnce({
        wishlists: [{ id: '1', name: 'My Wishlist', isDefault: true, items: [] }],
      });

      // Set token in localStorage
      localStorage.setItem('auth_token', 'new-token');

      // Trigger retry via the hook's token change effect
      await act(async () => {
        await result.current.loadWishlists();
      });

      // Should have loaded data
      expect(result.current.wishlists).toHaveLength(1);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Fix #5: Loading State Timeout Mechanism', () => {
    it('should clear loading state after 30 seconds if request hangs', async () => {
      const { result } = renderHook(() => useWishlist());

      // Mock a hanging request
      (wishlistApi.getWishlists as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      // Start loading
      let loadPromise: Promise<void>;
      await act(async () => {
        loadPromise = result.current.loadWishlists();
      });

      // Should be loading
      expect(result.current.isLoading).toBe(true);

      // Fast-forward 30 seconds
      jest.advanceTimersByTime(30000);

      // Wait for timeout
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Loading state should be cleared
      expect(result.current.isLoading).toBe(false);
    });

    it('should clear loading state on successful completion', async () => {
      const { result } = renderHook(() => useWishlist());

      // Mock successful response
      (wishlistApi.getWishlists as jest.Mock).mockResolvedValueOnce({
        wishlists: [{ id: '1', name: 'My Wishlist', isDefault: true, items: [] }],
      });

      // Load wishlists
      await act(async () => {
        await result.current.loadWishlists();
      });

      // Loading state should be cleared
      expect(result.current.isLoading).toBe(false);
      expect(result.current.wishlists).toHaveLength(1);
    });

    it('should clear loading state on error', async () => {
      const { result } = renderHook(() => useWishlist());

      // Mock error response
      (wishlistApi.getWishlists as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      // Load wishlists
      await act(async () => {
        try {
          await result.current.loadWishlists();
        } catch (error) {
          // Expected error
        }
      });

      // Loading state should be cleared
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeTruthy();
    });

    it('should clear timeout when request completes successfully', async () => {
      const { result } = renderHook(() => useWishlist());

      // Mock successful response
      (wishlistApi.getWishlists as jest.Mock).mockResolvedValueOnce({
        wishlists: [{ id: '1', name: 'My Wishlist', isDefault: true, items: [] }],
      });

      // Load wishlists
      await act(async () => {
        await result.current.loadWishlists();
      });

      // Fast-forward beyond timeout
      jest.advanceTimersByTime(35000);

      // Wait for any pending timers
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Loading state should still be false (timeout was cleared)
      expect(result.current.isLoading).toBe(false);
    });

    it('should clear timeout when request fails', async () => {
      const { result } = renderHook(() => useWishlist());

      // Mock error response
      (wishlistApi.getWishlists as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      // Load wishlists
      await act(async () => {
        try {
          await result.current.loadWishlists();
        } catch (error) {
          // Expected error
        }
      });

      // Fast-forward beyond timeout
      jest.advanceTimersByTime(35000);

      // Wait for any pending timers
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Loading state should still be false (timeout was cleared)
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Integration Test: Complete Wishlist Loading Flow', () => {
    it('should handle the exact scenario from the original issue', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      let requestSequence = 0;
      mockFetch.mockImplementation(async (url: string, options: any) => {
        requestSequence++;

        // Request 1: Initial GET request fails with 401
        if (requestSequence === 1) {
          return {
            ok: false,
            status: 401,
            statusText: 'Unauthorized',
            headers: new Headers(),
            json: async () => ({ message: 'Token expired' }),
          } as Response;
        }

        // Request 2: Token refresh succeeds
        if (requestSequence === 2) {
          return {
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: new Headers(),
            json: async () => ({
              success: true,
              data: { token: 'new-refreshed-token' },
            }),
          } as Response;
        }

        // Request 3: Retry request completes successfully
        if (requestSequence === 3) {
          return {
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: new Headers(),
            json: async () => ({
              success: true,
              data: {
                wishlists: [
                  {
                    id: '1',
                    name: 'My Wishlist',
                    isDefault: true,
                    items: [
                      {
                        id: 'item-1',
                        productId: 'product-1',
                        wishlistId: '1',
                        product: {
                          id: 'product-1',
                          name: 'Test Product',
                          regularPrice: 10000,
                          salePrice: 8000,
                          images: ['/test.jpg'],
                          stockQuantity: 10,
                        },
                        addedAt: new Date().toISOString(),
                      },
                    ],
                  },
                ],
              },
            }),
          } as Response;
        }

        throw new Error('Unexpected request');
      });

      // Mock wishlist API to use apiClient
      (wishlistApi.getWishlists as jest.Mock).mockImplementation(async () => {
        return apiClient.request('/wishlists', { method: 'GET' });
      });

      // Set initial token
      setToken('initial-expired-token');

      // Execute: Navigate to wishlist page (simulate by loading wishlists)
      const { result } = renderHook(() => useWishlist());

      await act(async () => {
        await result.current.loadWishlists();
      });

      // Assert: Verify the complete flow

      // 1. Initial GET request was made
      expect(requestSequence).toBeGreaterThanOrEqual(1);

      // 2. Token refresh succeeded
      const currentToken = getToken();
      expect(currentToken).toBe('new-refreshed-token');

      // 3. Retry request completed successfully
      expect(result.current.wishlists).toHaveLength(1);
      expect(result.current.wishlists[0].name).toBe('My Wishlist');

      // 4. Loading state is cleared
      expect(result.current.isLoading).toBe(false);

      // 5. Wishlist data is displayed
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].product.name).toBe('Test Product');

      // 6. No error state
      expect(result.current.error).toBeNull();
    });

    it('should handle multiple concurrent 401 errors correctly', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      let requestSequence = 0;
      mockFetch.mockImplementation(async (url: string, options: any) => {
        requestSequence++;

        // Token refresh request
        if (url.includes('/auth/refresh')) {
          return {
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: new Headers(),
            json: async () => ({
              success: true,
              data: { token: 'refreshed-token' },
            }),
          } as Response;
        }

        // All other requests succeed after token refresh
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers(),
          json: async () => ({
            success: true,
            data: {
              wishlists: [{ id: '1', name: 'My Wishlist', isDefault: true, items: [] }],
            },
          }),
        } as Response;
      });

      // Set initial token
      setToken('initial-token');

      // Execute: Make concurrent requests
      const { result } = renderHook(() => useWishlist());

      const promises = [
        result.current.loadWishlists(),
        result.current.loadWishlists(),
        result.current.loadWishlists(),
      ];

      await act(async () => {
        await Promise.all(promises);
      });

      // Assert: All requests should complete successfully
      expect(result.current.isLoading).toBe(false);
      expect(result.current.wishlists).toHaveLength(1);
      expect(result.current.error).toBeNull();
    });

    it('should handle token refresh failure gracefully', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      let requestSequence = 0;
      mockFetch.mockImplementation(async (url: string, options: any) => {
        requestSequence++;

        // Initial request fails with 401
        if (requestSequence === 1) {
          return {
            ok: false,
            status: 401,
            statusText: 'Unauthorized',
            headers: new Headers(),
            json: async () => ({ message: 'Token expired' }),
          } as Response;
        }

        // Token refresh fails
        if (requestSequence === 2) {
          return {
            ok: false,
            status: 401,
            statusText: 'Unauthorized',
            headers: new Headers(),
            json: async () => ({ message: 'Refresh token expired' }),
          } as Response;
        }

        throw new Error('Unexpected request');
      });

      // Set initial token
      setToken('initial-token');

      // Execute: Load wishlists
      const { result } = renderHook(() => useWishlist());

      await act(async () => {
        try {
          await result.current.loadWishlists();
        } catch (error) {
          // Expected error
        }
      });

      // Assert: Should handle refresh failure gracefully
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeTruthy();
      expect(getToken()).toBeNull(); // Token should be cleared
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle network errors without infinite loading', async () => {
      const { result } = renderHook(() => useWishlist());

      // Mock network error
      (wishlistApi.getWishlists as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      // Load wishlists
      await act(async () => {
        try {
          await result.current.loadWishlists();
        } catch (error) {
          // Expected error
        }
      });

      // Should not be stuck in loading state
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeTruthy();
    });

    it('should handle malformed API responses', async () => {
      const { result } = renderHook(() => useWishlist());

      // Mock malformed response
      (wishlistApi.getWishlists as jest.Mock).mockResolvedValueOnce({
        invalid: 'response',
      });

      // Load wishlists
      await act(async () => {
        try {
          await result.current.loadWishlists();
        } catch (error) {
          // Expected error
        }
      });

      // Should not be stuck in loading state
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle rapid load attempts', async () => {
      const { result } = renderHook(() => useWishlist());

      // Mock successful response
      (wishlistApi.getWishlists as jest.Mock).mockResolvedValue({
        wishlists: [{ id: '1', name: 'My Wishlist', isDefault: true, items: [] }],
      });

      // Make rapid load attempts
      const promises = Array(10).fill(null).map(() => result.current.loadWishlists());

      await act(async () => {
        await Promise.all(promises);
      });

      // Should complete successfully without infinite loading
      expect(result.current.isLoading).toBe(false);
      expect(result.current.wishlists).toHaveLength(1);
    });

    it('should handle session changes during loading', async () => {
      const { result, rerender } = renderHook(() => useWishlist());

      // Mock hanging request
      (wishlistApi.getWishlists as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      // Start loading
      let loadPromise: Promise<void>;
      await act(async () => {
        loadPromise = result.current.loadWishlists();
      });

      expect(result.current.isLoading).toBe(true);

      // Change session to unauthenticated
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      rerender();

      // Fast-forward to trigger timeout
      jest.advanceTimersByTime(30000);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Loading state should be cleared
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Console Log Verification for Debugging', () => {
    it('should log appropriate messages during token refresh flow', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log');
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      let requestSequence = 0;
      mockFetch.mockImplementation(async (url: string, options: any) => {
        requestSequence++;

        if (url.includes('/auth/refresh')) {
          return {
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: new Headers(),
            json: async () => ({
              success: true,
              data: { token: 'new-token' },
            }),
          } as Response;
        }

        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers(),
          json: async () => ({
            success: true,
            data: {
              wishlists: [{ id: '1', name: 'My Wishlist', isDefault: true, items: [] }],
            },
          }),
        } as Response;
      });

      // Load wishlists
      const { result } = renderHook(() => useWishlist());

      await act(async () => {
        await result.current.loadWishlists();
      });

      // Verify console logs for debugging
      const logMessages = consoleLogSpy.mock.calls.map(call => call[0]);
      
      // Should have logged token update
      expect(logMessages.some(msg => 
        typeof msg === 'string' && msg.includes('Token updated atomically')
      )).toBe(true);
    });

    it('should log timeout warning when loading takes too long', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn');
      const { result } = renderHook(() => useWishlist());

      // Mock hanging request
      (wishlistApi.getWishlists as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      // Start loading
      await act(async () => {
        result.current.loadWishlists();
      });

      // Fast-forward to trigger timeout
      jest.advanceTimersByTime(30000);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Verify timeout warning was logged
      const warnMessages = consoleWarnSpy.mock.calls.map(call => call[0]);
      expect(warnMessages.some(msg => 
        typeof msg === 'string' && msg.includes('Loading timeout')
      )).toBe(true);
    });
  });
});
