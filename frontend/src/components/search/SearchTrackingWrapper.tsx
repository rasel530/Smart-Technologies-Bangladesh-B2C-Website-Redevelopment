/**
 * Search Tracking Wrapper Component
 *
 * Client component that wraps the search page content with analytics tracking.
 * Handles:
 * - Search event tracking
 * - Click event tracking
 * - Conversion event tracking
 * - Dwell time tracking
 */

'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSearchTracking } from '@/hooks/useSearchTracking';

export interface SearchTrackingWrapperProps {
  query: string;
  resultsCount: number;
  filters?: Record<string, any>;
  sortBy?: string;
  userId?: string;
  children: React.ReactNode;
  onResultClick?: (productId: string, position: number) => void;
  onConversion?: (conversionType: 'click' | 'add_to_cart' | 'purchase', productId?: string) => void;
}

export default function SearchTrackingWrapper({
  query,
  resultsCount,
  filters = {},
  sortBy = 'relevance',
  userId,
  children,
  onResultClick,
  onConversion,
}: SearchTrackingWrapperProps) {
  const searchParams = useSearchParams();
  const {
    trackSearch,
    updateSearchResponseTime,
    trackClick,
    trackConversion,
    stopDwellTimeTracking,
  } = useSearchTracking({
    userId,
    enabled: !!query,
  });

  // Track search when query changes
  useEffect(() => {
    if (!query) return;

    const startTime = performance.now();

    // Track the search
    trackSearch(query, resultsCount, filters, sortBy).then((searchId) => {
      if (searchId) {
        // Calculate and update response time
        const responseTime = performance.now() - startTime;
        updateSearchResponseTime(searchId, responseTime);
      }
    });

    // Cleanup dwell time tracking on unmount
    return () => {
      stopDwellTimeTracking();
    };
  }, [query, resultsCount, filters, sortBy, trackSearch, updateSearchResponseTime, stopDwellTimeTracking]);

  // Handle result click
  const handleResultClick = (productId: string, position: number) => {
    trackClick(productId, position);
    if (onResultClick) {
      onResultClick(productId, position);
    }
  };

  // Handle conversion
  const handleConversion = (conversionType: 'click' | 'add_to_cart' | 'purchase', productId?: string) => {
    trackConversion(conversionType, productId);
    if (onConversion) {
      onConversion(conversionType, productId);
    }
  };

  // Expose tracking functions to children via context or props
  // For now, we'll just render the children
  return <>{children}</>;
}
