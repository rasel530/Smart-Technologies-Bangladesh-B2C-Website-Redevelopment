'use client';

/**
 * Search Analytics Page
 *
 * Admin-only page that displays comprehensive search analytics including:
 * - Search volume trends
 * - Popular search queries
 * - Search performance metrics
 * - Zero-result searches analysis
 * - User search behavior
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Activity, TrendingUp, Clock, AlertTriangle, Search, Users, Zap, BarChart3 } from 'lucide-react';
import { withAuth } from '@/components/auth/withAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface SearchAnalytics {
  summary: {
    totalSearches: number;
    uniqueQueries: number;
    searchesWithResults: number;
    searchesWithoutResults: number;
    resultsRate: string;
    avgExecutionTime: string;
    medianExecutionTime: string;
  };
  topQueries: {
    query: string;
    count: number;
    lastSearchedAt: string;
  }[];
  performance: {
    totalSearches: number;
    avgExecutionTime: string;
    medianExecutionTime: string;
    p95ExecutionTime: string;
    p99ExecutionTime: string;
    maxExecutionTime: string;
    minExecutionTime: string;
    avgResultsCount: string;
    zeroResultsRate: string;
    slowQueries: number;
    fastQueries: number;
    slowQueryRate: string;
    fastQueryRate: string;
  };
  timeSeries: {
    date: string;
    count: number;
  }[];
  period: {
    startDate: string;
    endDate: string;
  };
}

function SearchAnalyticsPage(): JSX.Element {
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'queries' | 'performance' | 'trends'>('overview');
  const [period, setPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');

  const fetchAnalytics = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('auth_token');
      
      const params = new URLSearchParams();
      if (period !== 'all') {
        params.set('period', period);
      }
      if (groupBy !== 'day') {
        params.set('groupBy', groupBy);
      }

      // Diagnostic logging to trace URL construction
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const endpoint = '/admin/search/analytics';
      const fullUrl = `${apiUrl}${endpoint}?${params.toString()}`;
      
      console.log('[Admin Search Analytics] URL Construction:', {
        NEXT_PUBLIC_API_URL: apiUrl,
        endpoint,
        params: params.toString(),
        fullUrl,
        hasToken: !!token
      });

      const response = await fetch(
        fullUrl,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch search analytics');
      }

      const data = await response.json();
      
      // Transform backend response to match frontend expected structure
      // Backend returns: { analytics: {...}, period: {...}, totalSearches, executionTime }
      // Frontend expects: { summary: {...}, topQueries: [...], performance: {...}, timeSeries: [...], period: {...} }
      
      // Calculate additional performance metrics from available data
      const totalSearches = data.analytics?.totalSearches || 0;
      const resultsRate = parseFloat(data.analytics?.resultsRate || '0');
      const zeroResultsRate = (100 - resultsRate).toFixed(2);
      
      const transformedData: SearchAnalytics = {
        summary: {
          totalSearches: data.analytics?.totalSearches || 0,
          uniqueQueries: data.analytics?.uniqueQueries || 0,
          searchesWithResults: data.analytics?.searchesWithResults || 0,
          searchesWithoutResults: data.analytics?.searchesWithoutResults || 0,
          resultsRate: data.analytics?.resultsRate || '0',
          avgExecutionTime: data.analytics?.avgExecutionTime || '0',
          medianExecutionTime: data.analytics?.medianExecutionTime || '0'
        },
        topQueries: (data.analytics?.topQueries || []).map((item: any) => ({
          query: item.query,
          count: item.count,
          lastSearchedAt: item.lastSearchedAt || new Date().toISOString()
        })),
        performance: {
          totalSearches: totalSearches,
          avgExecutionTime: data.analytics?.avgExecutionTime || '0',
          medianExecutionTime: data.analytics?.medianExecutionTime || '0',
          p95ExecutionTime: data.analytics?.p95ExecutionTime || '0',
          p99ExecutionTime: data.analytics?.p99ExecutionTime || '0',
          maxExecutionTime: data.analytics?.maxExecutionTime || '0',
          minExecutionTime: data.analytics?.minExecutionTime || '0',
          avgResultsCount: data.analytics?.avgResultsCount || '0',
          zeroResultsRate: zeroResultsRate,
          slowQueries: data.analytics?.slowQueries || 0,
          fastQueries: data.analytics?.fastQueries || 0,
          slowQueryRate: data.analytics?.slowQueryRate || '0',
          fastQueryRate: data.analytics?.fastQueryRate || '0'
        },
        timeSeries: (data.analytics?.timeSeries || []).map((item: any) => ({
          date: item.date,
          count: item.count
        })),
        period: {
          startDate: data.period?.startDate || new Date().toISOString(),
          endDate: data.period?.endDate || new Date().toISOString()
        }
      };
      
      setAnalytics(transformedData);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load search analytics');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period, groupBy]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-BD').format(num);
  };

  const getRateColor = (rate: string) => {
    const rateValue = parseFloat(rate);
    if (rateValue >= 90) return 'text-green-600';
    if (rateValue >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <AdminLayout title="Search Analytics">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/admin" className="text-gray-400 hover:text-gray-600">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Search Analytics</h1>
                  <p className="text-sm text-gray-600">
                    Comprehensive search insights and performance metrics
                  </p>
                </div>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              <p className="mt-4 text-gray-600">Loading search analytics...</p>
            </div>
          ) : analytics ? (
            <>
              {/* Period Selector */}
              <div className="bg-white rounded-lg shadow mb-6 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">Time Period:</label>
                    <select
                      value={period}
                      onChange={(e) => setPeriod(e.target.value as any)}
                      className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">Last 7 Days</option>
                      <option value="month">Last 30 Days</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">Group By:</label>
                    <select
                      value={groupBy}
                      onChange={(e) => setGroupBy(e.target.value as any)}
                      className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                    >
                      <option value="day">Day</option>
                      <option value="week">Week</option>
                      <option value="month">Month</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-lg shadow mb-6">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex">
                    {[
                      { id: 'overview', label: 'Overview', icon: <Activity className="h-4 w-4 mr-2" /> },
                      { id: 'queries', label: 'Top Queries', icon: <TrendingUp className="h-4 w-4 mr-2" /> },
                      { id: 'performance', label: 'Performance', icon: <Zap className="h-4 w-4 mr-2" /> },
                      { id: 'trends', label: 'Trends', icon: <BarChart3 className="h-4 w-4 mr-2" /> }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === tab.id
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {tab.icon}
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="p-6 space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                        <div className="flex items-center">
                          <Search className="h-6 w-6 text-blue-600 mr-3" />
                          <div>
                            <p className="text-sm text-gray-600">Total Searches</p>
                            <p className="text-2xl font-semibold text-gray-900">
                              {formatNumber(analytics.summary.totalSearches)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                        <div className="flex items-center">
                          <Users className="h-6 w-6 text-green-600 mr-3" />
                          <div>
                            <p className="text-sm text-gray-600">Unique Queries</p>
                            <p className="text-2xl font-semibold text-gray-900">
                              {formatNumber(analytics.summary.uniqueQueries)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                        <div className="flex items-center">
                          <Activity className="h-6 w-6 text-purple-600 mr-3" />
                          <div>
                            <p className="text-sm text-gray-600">Results Rate</p>
                            <p className={`text-2xl font-semibold ${getRateColor(analytics.summary.resultsRate)}`}>
                              {analytics.summary.resultsRate}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                        <div className="flex items-center">
                          <Clock className="h-6 w-6 text-orange-600 mr-3" />
                          <div>
                            <p className="text-sm text-gray-600">Avg Execution Time</p>
                            <p className="text-2xl font-semibold text-gray-900">
                              {analytics.summary.avgExecutionTime}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Searches with Results</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {formatNumber(analytics.summary.searchesWithResults)}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Searches without Results</p>
                        <p className="text-xl font-semibold text-red-600">
                          {formatNumber(analytics.summary.searchesWithoutResults)}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Median Execution Time</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {analytics.summary.medianExecutionTime}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Top Queries Tab */}
                {activeTab === 'queries' && (
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Top Search Queries
                    </h3>
                    {analytics.topQueries.length === 0 ? (
                      <div className="text-center py-12">
                        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No search queries found</p>
                        <p className="text-sm text-gray-500">
                          Start searching products to see analytics
                        </p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {analytics.topQueries.map((item, index) => (
                          <li key={index} className="px-4 py-3 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    {index + 1}.
                                  </span>
                                  <p className="text-sm text-gray-700">
                                    "{item.query}"
                                  </p>
                                </div>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {formatNumber(item.count)} searches
                                </span>
                              </div>
                              <div className="text-right text-sm text-gray-500">
                                <p>Last: {formatTimestamp(item.lastSearchedAt)}</p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Performance Tab */}
                {activeTab === 'performance' && (
                  <div className="p-6 space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Search Performance Metrics
                    </h3>

                    {/* Performance Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Total Searches</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {formatNumber(analytics.performance.totalSearches)}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Avg Execution Time</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {analytics.performance.avgExecutionTime}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Median Execution Time</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {analytics.performance.medianExecutionTime}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">P95 Execution Time</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {analytics.performance.p95ExecutionTime}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">P99 Execution Time</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {analytics.performance.p99ExecutionTime}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Avg Results Count</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {analytics.performance.avgResultsCount}
                        </p>
                      </div>
                    </div>

                    {/* Query Quality Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <p className="text-sm text-gray-600">Zero Results Rate</p>
                        <p className="text-xl font-semibold text-red-700">
                          {analytics.performance.zeroResultsRate}
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <p className="text-sm text-gray-600">Fast Queries</p>
                        <p className="text-xl font-semibold text-green-700">
                          {formatNumber(analytics.performance.fastQueries)} ({analytics.performance.fastQueryRate})
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                        <p className="text-sm text-gray-600">Slow Queries</p>
                        <p className="text-xl font-semibold text-yellow-700">
                          {formatNumber(analytics.performance.slowQueries)} ({analytics.performance.slowQueryRate})
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Min Execution Time</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {analytics.performance.minExecutionTime}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Trends Tab */}
                {activeTab === 'trends' && (
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Search Volume Trends
                    </h3>
                    {analytics.timeSeries.length === 0 ? (
                      <div className="text-center py-12">
                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No trend data available</p>
                        <p className="text-sm text-gray-500">
                          Search activity will appear here as users search
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="space-y-2">
                          {analytics.timeSeries.map((item, index) => (
                            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-700 font-medium">
                                  {item.date}
                                </span>
                                <div className="flex items-center gap-2">
                                  <div className="w-32 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full"
                                      style={{
                                        width: `${Math.min((item.count / Math.max(...analytics.timeSeries.map(t => t.count))) * 100, 100)}%`
                                      }}
                                    />
                                  </div>
                                  <span className="text-sm text-gray-600">
                                    {formatNumber(item.count)} searches
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Period Info */}
              <div className="mt-4 text-sm text-gray-500 text-center">
                <p>
                  Showing data from {formatTimestamp(analytics.period.startDate)} to {formatTimestamp(analytics.period.endDate)}
                </p>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAuth(SearchAnalyticsPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
