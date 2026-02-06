/**
 * Search Tracking Hook
 *
 * Custom hook for tracking search events including:
 * - Search queries
 * - Click events on results
 * - Conversion events (add to cart, purchase)
 * - Dwell time tracking
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  trackSearch as trackSearchApi,
  trackClick as trackClickApi,
  trackConversion as trackConversionApi,
  generateSessionId,
  getDeviceType,
  calculateResponseTime,
} from '@/lib/api/searchAnalytics';
import type { SearchAnalyticsData, ClickTrackingData, ConversionData } from '@/types/searchAnalytics';

export interface UseSearchTrackingOptions {
  userId?: string;
  enabled?: boolean;
}

export interface SearchTrackingData {
  searchAnalyticsId?: string;
  sessionId: string;
  startTime: number;
}

export function useSearchTracking(options: UseSearchTrackingOptions = {}) {
  const { userId, enabled = true } = options;
  
  // State
  const [sessionId] = useState(() => generateSessionId());
  const [currentSearchId, setCurrentSearchId] = useState<string | undefined>();
  const [searchStartTime, setSearchStartTime] = useState<number>(0);
  const [resultPositions, setResultPositions] = useState<Map<string, number>>(new Map());
  const [clickTimestamps, setClickTimestamps] = useState<Map<string, number>>(new Map());
  
  // Refs for tracking dwell time
  const dwellTimeRef = useRef<Map<string, number>>(new Map());
  const dwellTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track search
  const trackSearch = useCallback(async (
    query: string,
    resultsCount: number,
    filtersApplied: Record<string, any> = {},
    sortBy: string = 'relevance'
  ): Promise<string | undefined> => {
    if (!enabled) return undefined;

    const startTime = performance.now();
    setSearchStartTime(startTime);
    
    try {
      const searchAnalyticsData: SearchAnalyticsData = {
        userId,
        sessionId,
        query,
        resultsCount,
        responseTime: 0, // Will be calculated after response
        filtersApplied,
        sortBy,
        deviceType: getDeviceType(),
      };

      // Track search (response time will be updated after search completes)
      await trackSearchApi(searchAnalyticsData);
      
      // Generate a temporary ID for this search
      const tempId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCurrentSearchId(tempId);
      
      // Clear previous tracking data
      setResultPositions(new Map());
      setClickTimestamps(new Map());
      dwellTimeRef.current = new Map();
      
      return tempId;
    } catch (error) {
      console.error('Error tracking search:', error);
      return undefined;
    }
  }, [enabled, userId, sessionId]);

  // Update search response time after search completes
  const updateSearchResponseTime = useCallback((searchId: string, responseTime: number) => {
    if (searchId === currentSearchId) {
      // In a real implementation, you might want to update the search record
      // For now, we just log it
      console.log(`Search ${searchId} completed in ${responseTime}ms`);
    }
  }, [currentSearchId]);

  // Track click on search result
  const trackClick = useCallback(async (
    productId: string,
    position: number
  ): Promise<void> => {
    if (!enabled || !currentSearchId) return;

    try {
      const clickData: ClickTrackingData = {
        searchAnalyticsId: currentSearchId,
        productId,
        position,
      };

      await trackClickApi(clickData);
      
      // Store click timestamp for dwell time calculation
      const timestamp = Date.now();
      setClickTimestamps(prev => new Map(prev).set(productId, timestamp));
      
      // Start tracking dwell time for this product
      if (dwellTimeIntervalRef.current === null) {
        dwellTimeIntervalRef.current = setInterval(() => {
          const now = Date.now();
          const newDwellTimes = new Map(dwellTimeRef.current);
          
          clickTimestamps.forEach((clickTime, pid) => {
            const currentDwell = dwellTimeRef.current.get(pid) || 0;
            newDwellTimes.set(pid, currentDwell + (now - clickTime));
          });
          
          dwellTimeRef.current = newDwellTimes;
        }, 1000);
      }
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  }, [enabled, currentSearchId, clickTimestamps]);

  // Track conversion (add to cart, purchase)
  const trackConversion = useCallback(async (
    conversionType: 'click' | 'add_to_cart' | 'purchase',
    productId?: string
  ): Promise<void> => {
    if (!enabled || !currentSearchId) return;

    try {
      const conversionData: ConversionData = {
        searchAnalyticsId: currentSearchId,
        conversionType,
        productId,
      };

      await trackConversionApi(conversionData);
    } catch (error) {
      console.error('Error tracking conversion:', error);
    }
  }, [enabled, currentSearchId]);

  // Get dwell time for a product
  const getDwellTime = useCallback((productId: string): number => {
    return dwellTimeRef.current.get(productId) || 0;
  }, []);

  // Stop dwell time tracking
  const stopDwellTimeTracking = useCallback(() => {
    if (dwellTimeIntervalRef.current) {
      clearInterval(dwellTimeIntervalRef.current);
      dwellTimeIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDwellTimeTracking();
    };
  }, [stopDwellTimeTracking]);

  return {
    sessionId,
    currentSearchId,
    trackSearch,
    updateSearchResponseTime,
    trackClick,
    trackConversion,
    getDwellTime,
    stopDwellTimeTracking,
  };
}

export default useSearchTracking;
