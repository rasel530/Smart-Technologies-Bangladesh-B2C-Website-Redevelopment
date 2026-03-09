/**
 * Trending Searches Component
 *
 * Reusable component showing:
 * - Trending searches list with trend indicators
 * - Trending products section
 * - Rising searches highlight
 * - Category-based trending
 * - Time-based filtering
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getTrendingSearches,
  getTrendingProducts,
  getRisingSearches,
  getTrendingCategories,
} from '@/lib/api/searchAnalytics';
import type {
  TrendingSearch,
  TrendingProduct,
  RisingSearch,
} from '@/types/searchAnalytics';
import { getImageUrl } from '@/lib/utils/image';

export interface TrendingSearchesProps {
  limit?: number;
  showProducts?: boolean;
  showRising?: boolean;
  showCategories?: boolean;
  category?: string;
  className?: string;
}

export default function TrendingSearches({
  limit = 10,
  showProducts = true,
  showRising = true,
  showCategories = true,
  category,
  className = '',
}: TrendingSearchesProps) {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');
  const [trendingSearches, setTrendingSearches] = useState<TrendingSearch[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<TrendingProduct[]>([]);
  const [risingSearches, setRisingSearches] = useState<RisingSearch[]>([]);
  const [trendingCategories, setTrendingCategories] = useState<
    { categoryId: string; categoryName: string; searchCount: number; trendScore: number }[]
  >([]);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const promises: Promise<any>[] = [getTrendingSearches(limit, timeRange)];
      
      if (showProducts) {
        promises.push(getTrendingProducts(limit, category, timeRange));
      }
      
      if (showRising) {
        promises.push(getRisingSearches(limit, timeRange));
      }
      
      if (showCategories) {
        promises.push(getTrendingCategories(limit, timeRange));
      }
      
      const results = await Promise.all(promises);
      
      setTrendingSearches(results[0]);
      
      if (showProducts) {
        setTrendingProducts(results[1]);
      }
      
      if (showRising) {
        setRisingSearches(results[showProducts ? 2 : 1]);
      }
      
      if (showCategories) {
        setTrendingCategories(results[showProducts && showRising ? 3 : showProducts || showRising ? 2 : 1]);
      }
    } catch (err: any) {
      console.error('Error fetching trending data:', err);
      setError(err?.message || 'Failed to load trending data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [limit, category, timeRange, showProducts, showRising, showCategories]);

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

  // Get trend icon
  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'rising':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'falling':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Time Range Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Trending Searches</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as '1h' | '24h' | '7d')}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="1h">Last 1 hour</option>
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Trending Searches List */}
          {trendingSearches.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trending Now</h3>
              <div className="space-y-2">
                {trendingSearches.map((search, index) => (
                  <Link
                    key={index}
                    href={`/search?q=${encodeURIComponent(search.query)}`}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-500 w-6">{index + 1}</span>
                      <div>
                        <span className="font-medium text-gray-900">{search.query}</span>
                        {search.category && (
                          <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {search.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {getTrendIcon(search.trend)}
                        <span className="text-sm text-gray-600">{formatNumber(search.searchCount)}</span>
                      </div>
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Rising Searches */}
          {showRising && risingSearches.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rising Searches</h3>
              <div className="space-y-2">
                {risingSearches.map((search, index) => (
                  <Link
                    key={index}
                    href={`/search?q=${encodeURIComponent(search.query)}`}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-green-600 w-6">↑</span>
                      <div>
                        <span className="font-medium text-gray-900">{search.query}</span>
                        {search.category && (
                          <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {search.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-green-600">
                        +{search.growthPercentage.toFixed(0)}%
                      </span>
                      <span className="text-sm text-gray-600">
                        {formatNumber(search.currentCount)} searches
                      </span>
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Trending Products */}
          {showProducts && trendingProducts.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trending Products</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {trendingProducts.map((product) => (
                  <Link
                    key={product.productId}
                    href={`/products/${product.productId}`}
                    className="group"
                  >
                    <div className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      {product.imageUrl && (
                        <div className="aspect-square relative overflow-hidden">
                          <img
                            src={getImageUrl(product.imageUrl) || ''}
                            alt={product.productName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          {product.trend && (
                            <div className="absolute top-2 right-2">
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  product.trend === 'rising'
                                    ? 'bg-green-500 text-white'
                                    : product.trend === 'falling'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-500 text-white'
                                }`}
                              >
                                {product.trend}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="p-3">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                          {product.productName}
                        </h4>
                        <div className="flex items-center justify-between">
                          {product.price && (
                            <span className="text-sm font-semibold text-gray-900">
                              ${product.price.toFixed(2)}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatNumber(product.searchCount)} searches
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Trending Categories */}
          {showCategories && trendingCategories.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trending Categories</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {trendingCategories.map((cat) => (
                  <Link
                    key={cat.categoryId}
                    href={`/categories/${cat.categoryId}`}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-center"
                  >
                    <div className="text-lg font-semibold text-gray-900 mb-1">
                      {cat.categoryName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatNumber(cat.searchCount)} searches
                    </div>
                    <div className="mt-2 flex items-center justify-center gap-1">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span className="text-xs text-green-600">Trending</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading &&
            trendingSearches.length === 0 &&
            (!showProducts || trendingProducts.length === 0) &&
            (!showRising || risingSearches.length === 0) &&
            (!showCategories || trendingCategories.length === 0) && (
              <div className="text-center py-8">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                <p className="mt-4 text-sm text-gray-500">No trending data available</p>
              </div>
            )}
        </>
      )}
    </div>
  );
}
