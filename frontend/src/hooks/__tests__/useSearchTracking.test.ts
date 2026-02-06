/**
 * useSearchTracking Hook Tests
 * 
 * Comprehensive tests for useSearchTracking hook covering:
 * - Initialization with default options
 * - Initialization with custom options
 * - Session ID generation
 * - Search tracking
 * - Click tracking
 * - Conversion tracking
 * - Dwell time tracking
 * - Response time tracking
 * - Disabled state
 * - Error handling
 * - Cleanup on unmount
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSearchTracking } from '../useSearchTracking';
import {
  trackSearch as trackSearchApi,
  trackClick as trackClickApi,
  trackConversion as trackConversionApi,
  generateSessionId,
  getDeviceType,
} from '@/lib/api/searchAnalytics';

// Mock API functions
jest.mock('@/lib/api/searchAnalytics');

describe('useSearchTracking Hook', () => {
  const mockUserId = 'user-123';
  const mockSessionId = 'session-123';
  const mockDeviceType = 'desktop';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (generateSessionId as jest.Mock).mockReturnValue(mockSessionId);
    (getDeviceType as jest.Mock).mockReturnValue(mockDeviceType);
    (trackSearchApi as jest.Mock).mockResolvedValue({ id: 'search-123' });
    (trackClickApi as jest.Mock).mockResolvedValue({ id: 'click-123' });
    (trackConversionApi as jest.Mock).mockResolvedValue({ id: 'conversion-123' });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      const { result } = renderHook(() => useSearchTracking());

      expect(result.current.sessionId).toBe(mockSessionId);
      expect(result.current.currentSearchId).toBeUndefined();
      expect(typeof result.current.trackSearch).toBe('function');
      expect(typeof result.current.trackClick).toBe('function');
      expect(typeof result.current.trackConversion).toBe('function');
      expect(typeof result.current.getDwellTime).toBe('function');
      expect(typeof result.current.stopDwellTimeTracking).toBe('function');
    });

    it('should initialize with custom userId', () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      expect(result.current.sessionId).toBe(mockSessionId);
      expect(result.current.currentSearchId).toBeUndefined();
    });

    it('should initialize with enabled false', () => {
      const { result } = renderHook(() => useSearchTracking({ enabled: false }));

      expect(result.current.sessionId).toBe(mockSessionId);
      expect(result.current.currentSearchId).toBeUndefined();
    });

    it('should generate unique session ID', () => {
      const { result: result1 } = renderHook(() => useSearchTracking());
      const { result: result2 } = renderHook(() => useSearchTracking());

      expect(result1.current.sessionId).toBeDefined();
      expect(result2.current.sessionId).toBeDefined();
    });
  });

  describe('Session ID Generation', () => {
    it('should call generateSessionId on mount', () => {
      renderHook(() => useSearchTracking());

      expect(generateSessionId).toHaveBeenCalled();
    });

    it('should return the generated session ID', () => {
      const { result } = renderHook(() => useSearchTracking());

      expect(result.current.sessionId).toBe(mockSessionId);
    });
  });

  describe('Search Tracking', () => {
    it('should track search when enabled', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      const searchId = await act(async () => {
        return await result.current.trackSearch('laptop', 100);
      });

      expect(trackSearchApi).toHaveBeenCalledWith({
        userId: mockUserId,
        sessionId: mockSessionId,
        query: 'laptop',
        resultsCount: 100,
        responseTime: 0,
        filtersApplied: {},
        sortBy: 'relevance',
        deviceType: mockDeviceType,
      });

      expect(searchId).toBeDefined();
    });

    it('should track search with custom filters', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      const filters = {
        category: 'Electronics',
        brand: 'Apple',
      };

      await act(async () => {
        await result.current.trackSearch('laptop', 100, filters, 'price');
      });

      expect(trackSearchApi).toHaveBeenCalledWith(
        expect.objectContaining({
          filtersApplied: filters,
          sortBy: 'price',
        })
      );
    });

    it('should track search with custom sort order', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      await act(async () => {
        await result.current.trackSearch('laptop', 100, {}, 'price_asc');
      });

      expect(trackSearchApi).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'price_asc',
        })
      );
    });

    it('should set current search ID after tracking', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      await act(async () => {
        await result.current.trackSearch('laptop', 100);
      });

      expect(result.current.currentSearchId).toBeDefined();
      expect(result.current.currentSearchId).toMatch(/^search_\d+_[a-z0-9]+$/);
    });

    it('should not track search when disabled', async () => {
      const { result } = renderHook(() => useSearchTracking({ enabled: false }));

      const searchId = await act(async () => {
        return await result.current.trackSearch('laptop', 100);
      });

      expect(trackSearchApi).not.toHaveBeenCalled();
      expect(searchId).toBeUndefined();
    });

    it('should handle search tracking errors', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      (trackSearchApi as jest.Mock).mockRejectedValue(new Error('API Error'));

      const searchId = await act(async () => {
        return await result.current.trackSearch('laptop', 100);
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error tracking search:', expect.any(Error));
      expect(searchId).toBeUndefined();

      consoleSpy.mockRestore();
    });

    it('should clear previous tracking data on new search', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      await act(async () => {
        await result.current.trackSearch('laptop', 100);
      });

      const firstSearchId = result.current.currentSearchId;

      await act(async () => {
        await result.current.trackSearch('phone', 50);
      });

      expect(result.current.currentSearchId).not.toBe(firstSearchId);
    });
  });

  describe('Response Time Tracking', () => {
    it('should update search response time', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await act(async () => {
        await result.current.trackSearch('laptop', 100);
      });

      const searchId = result.current.currentSearchId;

      act(() => {
        result.current.updateSearchResponseTime(searchId!, 150);
      });

      expect(consoleSpy).toHaveBeenCalledWith(`Search ${searchId} completed in 150ms`);

      consoleSpy.mockRestore();
    });

    it('should not update response time for different search ID', () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      act(() => {
        result.current.updateSearchResponseTime('different-search-id', 150);
      });

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Click Tracking', () => {
    it('should track click when enabled', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      await act(async () => {
        await result.current.trackSearch('laptop', 100);
      });

      await act(async () => {
        await result.current.trackClick('prod-1', 1);
      });

      expect(trackClickApi).toHaveBeenCalledWith({
        searchAnalyticsId: result.current.currentSearchId,
        productId: 'prod-1',
        position: 1,
      });
    });

    it('should track click with position', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      await act(async () => {
        await result.current.trackSearch('laptop', 100);
      });

      await act(async () => {
        await result.current.trackClick('prod-1', 5);
      });

      expect(trackClickApi).toHaveBeenCalledWith(
        expect.objectContaining({
          position: 5,
        })
      );
    });

    it('should not track click when disabled', async () => {
      const { result } = renderHook(() => useSearchTracking({ enabled: false }));

      await act(async () => {
        await result.current.trackClick('prod-1', 1);
      });

      expect(trackClickApi).not.toHaveBeenCalled();
    });

    it('should not track click when no search ID', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      await act(async () => {
        await result.current.trackClick('prod-1', 1);
      });

      expect(trackClickApi).not.toHaveBeenCalled();
    });

    it('should handle click tracking errors', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      (trackClickApi as jest.Mock).mockRejectedValue(new Error('API Error'));

      await act(async () => {
        await result.current.trackSearch('laptop', 100);
      });

      await act(async () => {
        await result.current.trackClick('prod-1', 1);
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error tracking click:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should start dwell time tracking on click', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      await act(async () => {
        await result.current.trackSearch('laptop', 100);
      });

      await act(async () => {
        await result.current.trackClick('prod-1', 1);
      });

      // Fast-forward timers to allow interval to run
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const dwellTime = result.current.getDwellTime('prod-1');
      expect(dwellTime).toBeGreaterThan(0);
    });
  });

  describe('Conversion Tracking', () => {
    it('should track add_to_cart conversion', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      await act(async () => {
        await result.current.trackSearch('laptop', 100);
      });

      await act(async () => {
        await result.current.trackConversion('add_to_cart', 'prod-1');
      });

      expect(trackConversionApi).toHaveBeenCalledWith({
        searchAnalyticsId: result.current.currentSearchId,
        conversionType: 'add_to_cart',
        productId: 'prod-1',
      });
    });

    it('should track purchase conversion', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      await act(async () => {
        await result.current.trackSearch('laptop', 100);
      });

      await act(async () => {
        await result.current.trackConversion('purchase', 'prod-1');
      });

      expect(trackConversionApi).toHaveBeenCalledWith({
        searchAnalyticsId: result.current.currentSearchId,
        conversionType: 'purchase',
        productId: 'prod-1',
      });
    });

    it('should track click conversion', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      await act(async () => {
        await result.current.trackSearch('laptop', 100);
      });

      await act(async () => {
        await result.current.trackConversion('click', 'prod-1');
      });

      expect(trackConversionApi).toHaveBeenCalledWith({
        searchAnalyticsId: result.current.currentSearchId,
        conversionType: 'click',
        productId: 'prod-1',
      });
    });

    it('should track conversion without product ID', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      await act(async () => {
        await result.current.trackSearch('laptop', 100);
      });

      await act(async () => {
        await result.current.trackConversion('add_to_cart');
      });

      expect(trackConversionApi).toHaveBeenCalledWith({
        searchAnalyticsId: result.current.currentSearchId,
        conversionType: 'add_to_cart',
        productId: undefined,
      });
    });

    it('should not track conversion when disabled', async () => {
      const { result } = renderHook(() => useSearchTracking({ enabled: false }));

      await act(async () => {
        await result.current.trackConversion('add_to_cart', 'prod-1');
      });

      expect(trackConversionApi).not.toHaveBeenCalled();
    });

    it('should not track conversion when no search ID', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      await act(async () => {
        await result.current.trackConversion('add_to_cart', 'prod-1');
      });

      expect(trackConversionApi).not.toHaveBeenCalled();
    });

    it('should handle conversion tracking errors', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      (trackConversionApi as jest.Mock).mockRejectedValue(new Error('API Error'));

      await act(async () => {
        await result.current.trackSearch('laptop', 100);
      });

      await act(async () => {
        await result.current.trackConversion('add_to_cart', 'prod-1');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error tracking conversion:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('Dwell Time Tracking', () => {
    it('should return 0 dwell time for non-clicked product', () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      const dwellTime = result.current.getDwellTime('prod-1');
      expect(dwellTime).toBe(0);
    });

    it('should calculate dwell time after click', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      await act(async () => {
        await result.current.trackSearch('laptop', 100);
      });

      await act(async () => {
        await result.current.trackClick('prod-1', 1);
      });

      // Fast-forward timers by 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      const dwellTime = result.current.getDwellTime('prod-1');
      expect(dwellTime).toBeGreaterThanOrEqual(5000);
    });

    it('should track dwell time for multiple products', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      await act(async () => {
        await result.current.trackSearch('laptop', 100);
      });

      await act(async () => {
        await result.current.trackClick('prod-1', 1);
      });

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await act(async () => {
        await result.current.trackClick('prod-2', 2);
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      const dwellTime1 = result.current.getDwellTime('prod-1');
      const dwellTime2 = result.current.getDwellTime('prod-2');

      expect(dwellTime1).toBeGreaterThanOrEqual(5000);
      expect(dwellTime2).toBeGreaterThanOrEqual(3000);
    });

    it('should stop dwell time tracking when stopped', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      await act(async () => {
        await result.current.trackSearch('laptop', 100);
      });

      await act(async () => {
        await result.current.trackClick('prod-1', 1);
      });

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      const dwellTime1 = result.current.getDwellTime('prod-1');

      act(() => {
        result.current.stopDwellTimeTracking();
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      const dwellTime2 = result.current.getDwellTime('prod-1');

      expect(dwellTime2).toBe(dwellTime1);
    });
  });

  describe('Stop Dwell Time Tracking', () => {
    it('should stop dwell time tracking', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      await act(async () => {
        await result.current.trackSearch('laptop', 100);
      });

      await act(async () => {
        await result.current.trackClick('prod-1', 1);
      });

      act(() => {
        result.current.stopDwellTimeTracking();
      });

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      const dwellTime = result.current.getDwellTime('prod-1');
      expect(dwellTime).toBe(0);
    });

    it('should handle stopping when not tracking', () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      expect(() => {
        result.current.stopDwellTimeTracking();
      }).not.toThrow();
    });
  });

  describe('Cleanup on Unmount', () => {
    it('should stop dwell time tracking on unmount', async () => {
      const { result, unmount } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      await act(async () => {
        await result.current.trackSearch('laptop', 100);
      });

      await act(async () => {
        await result.current.trackClick('prod-1', 1);
      });

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      unmount();

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Dwell time should not increase after unmount
      const dwellTime = result.current.getDwellTime('prod-1');
      expect(dwellTime).toBeLessThan(5000);
    });
  });

  describe('Device Type', () => {
    it('should get device type on search', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      await act(async () => {
        await result.current.trackSearch('laptop', 100);
      });

      expect(getDeviceType).toHaveBeenCalled();
    });

    it('should include device type in search tracking data', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      await act(async () => {
        await result.current.trackSearch('laptop', 100);
      });

      expect(trackSearchApi).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceType: mockDeviceType,
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty query', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      await act(async () => {
        await result.current.trackSearch('', 0);
      });

      expect(trackSearchApi).toHaveBeenCalledWith(
        expect.objectContaining({
          query: '',
          resultsCount: 0,
        })
      );
    });

    it('should handle zero results', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      await act(async () => {
        await result.current.trackSearch('nonexistent', 0);
      });

      expect(trackSearchApi).toHaveBeenCalledWith(
        expect.objectContaining({
          resultsCount: 0,
        })
      );
    });

    it('should handle very large result counts', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      await act(async () => {
        await result.current.trackSearch('test', 999999);
      });

      expect(trackSearchApi).toHaveBeenCalledWith(
        expect.objectContaining({
          resultsCount: 999999,
        })
      );
    });

    it('should handle negative position', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      await act(async () => {
        await result.current.trackSearch('laptop', 100);
      });

      await act(async () => {
        await result.current.trackClick('prod-1', -1);
      });

      expect(trackClickApi).toHaveBeenCalledWith(
        expect.objectContaining({
          position: -1,
        })
      );
    });

    it('should handle very large position', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      await act(async () => {
        await result.current.trackSearch('laptop', 100);
      });

      await act(async () => {
        await result.current.trackClick('prod-1', 999999);
      });

      expect(trackClickApi).toHaveBeenCalledWith(
        expect.objectContaining({
          position: 999999,
        })
      );
    });
  });

  describe('Multiple Searches', () => {
    it('should handle multiple searches in sequence', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      const searchId1 = await act(async () => {
        return await result.current.trackSearch('laptop', 100);
      });

      const searchId2 = await act(async () => {
        return await result.current.trackSearch('phone', 50);
      });

      expect(searchId1).toBeDefined();
      expect(searchId2).toBeDefined();
      expect(searchId1).not.toBe(searchId2);
    });

    it('should use latest search ID for tracking', async () => {
      const { result } = renderHook(() => useSearchTracking({ userId: mockUserId }));

      await act(async () => {
        await result.current.trackSearch('laptop', 100);
      });

      const firstSearchId = result.current.currentSearchId;

      await act(async () => {
        await result.current.trackSearch('phone', 50);
      });

      const secondSearchId = result.current.currentSearchId;

      await act(async () => {
        await result.current.trackClick('prod-1', 1);
      });

      expect(trackClickApi).toHaveBeenCalledWith(
        expect.objectContaining({
          searchAnalyticsId: secondSearchId,
        })
      );
      expect(trackClickApi).not.toHaveBeenCalledWith(
        expect.objectContaining({
          searchAnalyticsId: firstSearchId,
        })
      );
    });
  });
});
