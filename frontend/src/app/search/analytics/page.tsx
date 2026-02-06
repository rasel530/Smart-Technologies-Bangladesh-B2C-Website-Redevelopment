/**
 * Search Analytics Dashboard Page
 *
 * Comprehensive analytics dashboard showing:
 * - Overview cards with key metrics
 * - Search trends chart
 * - Popular searches table
 * - Search performance metrics
 * - User behavior insights
 * - Filters for date range and category
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { StatsGrid } from '@/components/design-system/Layout/StatsGrid';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/design-system/Card/Card';
import {
  getAnalyticsMetrics,
  getPopularSearches,
  getSearchTrends,
  getZeroResultQueries,
} from '@/lib/api/searchAnalytics';
import type {
  AnalyticsMetrics,
  PopularSearch,
  SearchTrendData,
} from '@/types/searchAnalytics';

export default function SearchAnalyticsDashboard() {
  // Authentication state
  const { data: session, status } = useSession();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>([]);
  const [searchTrends, setSearchTrends] = useState<SearchTrendData[]>([]);
  const [zeroResultQueries, setZeroResultQueries] = useState<
    { query: string; count: number; lastSearched: Date }[]
  >([]);

  // Calculate date range
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (dateRange) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'all':
        startDate.setFullYear(startDate.getFullYear() - 10);
        break;
    }
    
    return { startDate, endDate };
  };

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { startDate, endDate } = getDateRange();
      
      const [metricsData, popularData, trendsData, zeroResultData] = await Promise.all([
        getAnalyticsMetrics(startDate, endDate),
        getPopularSearches(10, dateRange),
        getSearchTrends(startDate, endDate, 'day'),
        getZeroResultQueries(10, dateRange),
      ]);
      
      setMetrics(metricsData);
      setPopularSearches(popularData);
      setSearchTrends(trendsData);
      setZeroResultQueries(zeroResultData);
    } catch (err: any) {
      console.error('Error fetching search analytics:', err);
      setError(err?.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (status === 'authenticated') {
      fetchData();
    }
  }, [dateRange, status]);

  // Format number
  const formatNumber = (num: number): string => {
    if (num === undefined || num === null) {
      return '0';
    }
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Format percentage
  const formatPercentage = (num: number): string => {
    if (num === undefined || num === null) {
      return '0%';
    }
    return `${(num * 100).toFixed(2)}%`;
  };

  // Format date
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Export data as CSV
  const exportToCSV = () => {
    if (!metrics) return;
    
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Searches', metrics.totalSearches.toString()],
      ['Unique Searches', metrics.uniqueSearches.toString()],
      ['Avg Response Time', `${metrics.avgResponseTime.toFixed(2)}ms`],
      ['Conversion Rate', `${(metrics.conversionRate * 100).toFixed(2)}%`],
      ['Click Through Rate', `${(metrics.clickThroughRate * 100).toFixed(2)}%`],
      ['Zero Results Rate', `${(metrics.zeroResultRate * 100).toFixed(2)}%`],
      ['P95 Response Time', `${metrics.p95ResponseTime.toFixed(2)}ms`],
      ['Cache Hit Rate', `${(metrics.cacheHitRate * 100).toFixed(2)}%`],
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `search-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Search Analytics</h1>
              <p className="text-gray-600 mt-1">
                Monitor search performance and user behavior
              </p>
            </div>
            
            {/* Date Range Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="dateRange" className="text-sm font-medium text-gray-700">
                Time Range:
              </label>
              <select
                id="dateRange"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as 'today' | 'week' | 'month' | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="today">Today</option>
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
                <option value="all">All time</option>
              </select>
              <button
                onClick={exportToCSV}
                disabled={!metrics}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Authentication Loading State */}
        {status === 'loading' && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Verifying authentication...</p>
            </div>
          </div>
        )}

        {/* Authentication Error State */}
        {status === 'unauthenticated' && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center max-w-md">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
                <svg className="w-12 h-12 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-lg font-semibold text-red-900 mb-2">Authentication Required</h3>
                <p className="text-red-700">You must be logged in to view search analytics data.</p>
              </div>
              <a
                href="/auth/signin"
                className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In
              </a>
            </div>
          </div>
        )}

        {error && status === 'authenticated' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {status === 'authenticated' && loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading analytics data...</p>
            </div>
          </div>
        ) : status === 'authenticated' && (
          <div className="space-y-6">
            {/* Overview Stats */}
            {metrics && (
              <StatsGrid
                stats={[
                  {
                    title: 'Total Searches',
                    value: formatNumber(metrics.totalSearches),
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    ),
                    color: 'primary',
                  },
                  {
                    title: 'Unique Searches',
                    value: formatNumber(metrics.uniqueSearches),
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    ),
                    color: 'success',
                  },
                  {
                    title: 'Avg Response Time',
                    value: `${metrics.avgResponseTime.toFixed(0)}ms`,
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                    color: 'warning',
                  },
                  {
                    title: 'Conversion Rate',
                    value: formatPercentage(metrics.conversionRate),
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                    color: 'success',
                  },
                  {
                    title: 'Click-Through Rate',
                    value: formatPercentage(metrics.clickThroughRate),
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                    ),
                    color: 'primary',
                  },
                  {
                    title: 'Zero Results Rate',
                    value: formatPercentage(metrics.zeroResultRate),
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    ),
                    color: 'danger',
                  },
                  {
                    title: 'Cache Hit Rate',
                    value: formatPercentage(metrics.cacheHitRate),
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582 4 8 4s8-1.79 8-4m0 5c0 2.21-3.582 4-8 4s8-1.79 8-4" />
                      </svg>
                    ),
                    color: 'success',
                  },
                  {
                    title: 'P95 Response Time',
                    value: `${metrics.p95ResponseTime.toFixed(0)}ms`,
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    ),
                    color: 'warning',
                  },
                ]}
                columns={4}
              />
            )}

            {/* Search Trends Chart */}
            <Card>
              <CardHeader
                title="Search Trends"
                description="Search volume over time"
              />
              <CardBody>
                {searchTrends.length > 0 ? (
                  <div className="h-64 flex items-end gap-2">
                    {searchTrends.map((trend, index) => {
                      const maxSearchCount = Math.max(...searchTrends.map(t => t.searchCount));
                      const height = (trend.searchCount / maxSearchCount) * 100;
                      
                      return (
                        <div
                          key={index}
                          className="flex-1 flex flex-col items-center group"
                        >
                          <div
                            className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer relative"
                            style={{ height: `${height}%` }}
                            title={`${trend.date}: ${trend.searchCount} searches`}
                          >
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {trend.searchCount}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-2 text-center">
                            {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No trend data available</p>
                )}
              </CardBody>
            </Card>

            {/* Popular Searches Table */}
            <Card>
              <CardHeader
                title="Popular Searches"
                description="Most frequently searched terms"
              />
              <CardBody>
                {popularSearches.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Search Term</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Search Count</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Category</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Trend</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {popularSearches.map((search, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <Link
                                href={`/search?q=${encodeURIComponent(search.query)}`}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                              >
                                {search.query}
                              </Link>
                            </td>
                            <td className="py-3 px-4 text-gray-600">{formatNumber(search.searchCount)}</td>
                            <td className="py-3 px-4 text-gray-600">{search.category || '-'}</td>
                            <td className="py-3 px-4">
                              {search.trend && (
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    search.trend === 'up'
                                      ? 'bg-green-100 text-green-800'
                                      : search.trend === 'down'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {search.trend === 'up' && '↑'}
                                  {search.trend === 'down' && '↓'}
                                  {search.trend === 'stable' && '→'}
                                  {search.trendPercentage !== undefined && search.trendPercentage !== null && ` ${search.trendPercentage.toFixed(1)}%`}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <Link
                                href={`/search?q=${encodeURIComponent(search.query)}`}
                                className="text-blue-600 hover:text-blue-700 text-sm"
                              >
                                View Results
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No popular searches data available</p>
                )}
              </CardBody>
            </Card>

            {/* Zero Result Queries */}
            <Card>
              <CardHeader
                title="Zero Result Queries"
                description="Searches that returned no results"
              />
              <CardBody>
                {zeroResultQueries.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Query</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Count</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Last Searched</th>
                        </tr>
                      </thead>
                      <tbody>
                        {zeroResultQueries.map((query, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-gray-900">{query.query}</td>
                            <td className="py-3 px-4 text-gray-600">{query.count}</td>
                            <td className="py-3 px-4 text-gray-600">{formatDate(query.lastSearched)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No zero-result queries found</p>
                )}
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
