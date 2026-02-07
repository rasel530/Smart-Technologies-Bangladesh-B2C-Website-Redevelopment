/**
 * Enhanced Search Page Content Component
 *
 * Enhanced search page with:
 * - Click tracking on search results
 * - Dwell time tracking
 * - Conversion tracking (add to cart, purchase)
 * - Personalized result ordering
 * - A/B testing variant support
 * - Trending searches display
 * - Personalized suggestions
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchTracking } from '@/hooks/useSearchTracking';
import { search } from '@/lib/api/search';
import { getPersonalizedResults } from '@/lib/api/searchAnalytics';
import TrendingSearches from './TrendingSearches';
import PersonalizedSuggestions from './PersonalizedSuggestions';
import { FilterSidebar } from '@/components/product/FilterSidebar';
import { SortDropdown } from '@/components/product/SortDropdown';
import type { SearchFilters, ProductWithRelations } from '@/types/product';
import { getImageUrl } from '@/lib/utils/image';

export interface SearchPageContentEnhancedProps {
  query: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  categories?: string[];
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  userId?: string;
  enablePersonalization?: boolean;
  enableTracking?: boolean;
  enableTrending?: boolean;
  enableABTesting?: boolean;
  experimentVariant?: string;
  categoriesData: Array<{ id: string; name: string; slug: string }>;
  brandsData: Array<{ id: string; name: string; slug: string }>;
}

export default function SearchPageContentEnhanced({
  query,
  page,
  limit,
  sortBy,
  sortOrder,
  categories,
  brands,
  minPrice,
  maxPrice,
  rating,
  userId,
  enablePersonalization = true,
  enableTracking = true,
  enableTrending = true,
  enableABTesting = false,
  experimentVariant = 'control',
  categoriesData,
  brandsData,
}: SearchPageContentEnhancedProps) {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchStartTime, setSearchStartTime] = useState<number>(0);
  const [responseTime, setResponseTime] = useState<number>(0);
  const [showPersonalized, setShowPersonalized] = useState(enablePersonalization && !!userId);

  // Search tracking
  const {
    sessionId,
    currentSearchId,
    trackSearch: trackSearchEvent,
    updateSearchResponseTime,
    trackClick,
    trackConversion,
    getDwellTime,
    stopDwellTimeTracking,
  } = useSearchTracking({
    userId,
    enabled: enableTracking,
  });

  // Fetch search results
  const fetchSearchResults = useCallback(async () => {
    if (!query) {
      setProducts([]);
      setTotalResults(0);
      setTotalPages(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSearchStartTime(performance.now());

    try {
      let results;
      
      // Use personalized search if enabled and user is logged in
      if (showPersonalized && userId) {
        results = await getPersonalizedResults(
          query,
          userId,
          {
            page,
            limit,
            categories,
            brands,
            minPrice,
            maxPrice,
            rating,
          }
        );
      } else {
        // Use regular search
        results = await search({
          query,
          page,
          limit,
          sortBy: sortBy as any,
          sortOrder,
          categoryId: categories,
          brandId: brands,
          minPrice,
          maxPrice,
          rating,
        });
      }

      setProducts(results.products as ProductWithRelations[]);
      setTotalResults(results.pagination.total);
      setTotalPages(results.pagination.pages);
      
      // Calculate and set response time
      const endTime = performance.now();
      const calculatedResponseTime = Math.round(endTime - searchStartTime);
      setResponseTime(calculatedResponseTime);
      
      // Track search event
      if (enableTracking) {
        const searchId = await trackSearchEvent(
          query,
          results.pagination.total,
          {
            categories,
            brands,
            minPrice,
            maxPrice,
            rating,
          },
          sortBy || 'relevance'
        );
        
        if (searchId) {
          updateSearchResponseTime(searchId, calculatedResponseTime);
        }
      }
    } catch (err: any) {
      console.error('Error fetching search results:', err);
      setError(err?.message || 'Failed to load search results');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [
    query,
    page,
    limit,
    sortBy,
    sortOrder,
    categories,
    brands,
    minPrice,
    maxPrice,
    rating,
    userId,
    showPersonalized,
    enableTracking,
    searchStartTime,
    trackSearchEvent,
    updateSearchResponseTime,
  ]);

  // Fetch search results on mount and when dependencies change
  useEffect(() => {
    fetchSearchResults();
  }, [fetchSearchResults]);

  // Handle product click
  const handleProductClick = useCallback((productId: string, position: number) => {
    if (enableTracking) {
      trackClick(productId, position);
    }
  }, [enableTracking, trackClick]);

  // Handle add to cart
  const handleAddToCart = useCallback((productId: string) => {
    if (enableTracking) {
      trackConversion('add_to_cart', productId);
    }
    // Call your add to cart function here
  }, [enableTracking, trackConversion]);

  // Handle purchase
  const handlePurchase = useCallback((productId: string) => {
    if (enableTracking) {
      trackConversion('purchase', productId);
    }
    // Call your purchase function here
  }, [enableTracking, trackConversion]);

  // Stop dwell time tracking on unmount
  useEffect(() => {
    return () => {
      stopDwellTimeTracking();
    };
  }, [stopDwellTimeTracking]);

  // Format number
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Search Info Bar */}
      {query && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {query ? `Results for "${query}"` : 'Search'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {loading ? 'Searching...' : totalResults > 0 ? `Found ${formatNumber(totalResults)} products` : 'No products found'}
              </p>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {responseTime > 0 && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{responseTime}ms</span>
                </div>
              )}
              
              {enableABTesting && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span>Variant: {experimentVariant}</span>
                </div>
              )}
              
              {showPersonalized && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-blue-600">Personalized</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Main Content */}
      {query && !loading && products.length > 0 && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <FilterSidebar
              categories={categoriesData}
              brands={brandsData}
            />
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            {/* Sort Control */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, totalResults)} of {formatNumber(totalResults)} results
              </p>
              <SortDropdown />
            </div>

            {/* Products Grid with Click Tracking */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product, index) => {
                const position = (page - 1) * limit + index + 1;
                
                return (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product.id, position)}
                    className="cursor-pointer"
                  >
                    <Link href={`/products/${product.slug}`}>
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        {product.images && product.images.length > 0 && (
                          <div className="aspect-square relative">
                            <img
                              src={getImageUrl(product.images[0].optimizedUrl || product.images[0].originalUrl) || ''}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                            {product.name}
                          </h3>
                          <div className="flex items-center justify-between">
                            <div className="text-lg font-bold text-gray-900">
                              {product.salePrice ? (
                                <>
                                  <span className="text-red-600">${product.salePrice.toFixed(2)}</span>
                                  <span className="text-sm text-gray-500 line-through ml-2">
                                    ${product.regularPrice.toFixed(2)}
                                  </span>
                                </>
                              ) : (
                                `$${product.regularPrice.toFixed(2)}`
                              )}
                            </div>
                            {product.avgRating && (
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.783.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="text-sm text-gray-600">
                                  {product.avgRating.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>
                          {enableTracking && (
                            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                              <span>Position: {position}</span>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleAddToCart(product.id);
                                }}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                Add to Cart
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </main>
        </div>
      )}

      {/* Loading State */}
      {loading && query && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* No Results State */}
      {query && !loading && products.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No results found</h3>
          <p className="mt-2 text-sm text-gray-500">
            We couldn't find any products matching "{query}"
          </p>
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-600">Try:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Checking your spelling</li>
              <li>• Using more general terms</li>
              <li>• Trying different keywords</li>
              <li>• Clearing filters</li>
            </ul>
          </div>
        </div>
      )}

      {/* No Query State - Show Trending and Personalized Suggestions */}
      {!query && (
        <div className="space-y-6">
          {/* Personalized Suggestions */}
          {userId && enablePersonalization && (
            <PersonalizedSuggestions
              userId={userId}
              limit={10}
              showRecentSearches={true}
              showPeopleAlsoSearched={false}
              showRecommendations={true}
            />
          )}

          {/* Trending Searches */}
          {enableTrending && (
            <TrendingSearches
              limit={10}
              showProducts={true}
              showRising={true}
              showCategories={true}
            />
          )}
        </div>
      )}
    </div>
  );
}
