'use client';

/**
 * Search Analytics Admin Page
 *
 * Admin-only page that displays comprehensive search analytics including:
 * - Overview metrics dashboard
 * - Search volume chart over time
 * - Top search queries table
 * - Zero-result queries analysis
 * - Search conversion funnel visualization
 * - Date range filtering
 * - Export functionality
 * - Real-time updates toggle
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  Download,
  Activity,
  TrendingUp,
  Clock,
  AlertTriangle,
  Search,
  Users,
  Target,
  BarChart3,
  Calendar,
  Filter,
  Zap
} from 'lucide-react';
import { withAuth } from '@/components/auth/withAuth';
import {
  getAdminAnalyticsOverview,
  getAdminSearchQueries,
  getAdminZeroResultQueries,
  getAdminConversionData,
  exportAdminAnalyticsData,
  type AnalyticsOverview,
  type QueryList,
  type ZeroResultQuery,
  type ConversionData
} from '@/lib/api/adminSearchAnalytics';

interface TabType {
  id: 'overview' | 'queries' | 'zero-results' | 'conversions';
  label: string;
  icon: React.ReactNode;
}

function SearchAnalyticsAdminPage(): JSX.Element {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [queries, setQueries] = useState<QueryList | null>(null);
  const [zeroResults, setZeroResults] = useState<ZeroResultQuery[]>([]);
  const [conversions, setConversions] = useState<ConversionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'queries' | 'zero-results' | 'conversions'>('overview');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [realTimeUpdates, setRealTimeUpdates] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');
  const [exporting, setExporting] = useState(false);
  const [queryPage, setQueryPage] = useState(1);

  const fetchAnalytics = async () => {
    try {
      setError(null);
      const data = await getAdminAnalyticsOverview(timeRange);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    }
  };

  const fetchQueries = async () => {
    try {
      const data = await getAdminSearchQueries({}, { page: queryPage, limit: 20, sortBy: 'count', sortOrder: 'desc' });
      setQueries(data);
    } catch (err) {
      console.error('Failed to fetch queries:', err);
    }
  };

  const fetchZeroResults = async () => {
    try {
      const data = await getAdminZeroResultQueries(20);
      setZeroResults(data);
    } catch (err) {
      console.error('Failed to fetch zero results:', err);
    }
  };

  const fetchConversions = async () => {
    try {
      const data = await getAdminConversionData(timeRange);
      setConversions(data);
    } catch (err) {
      console.error('Failed to fetch conversions:', err);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchAnalytics(),
      fetchQueries(),
      fetchZeroResults(),
      fetchConversions()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, [timeRange]);

  useEffect(() => {
    if (realTimeUpdates) {
      const interval = setInterval(fetchAnalytics, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [realTimeUpdates, timeRange]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await exportAdminAnalyticsData(exportFormat, {});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search-analytics-${new Date().toISOString().split('T')[0]}.${exportFormat === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setExporting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
      setExporting(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-BD').format(num);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getRateColor = (rate: string) => {
    const rateValue = parseFloat(rate);
    if (rateValue >= 90) return 'text-green-600';
    if (rateValue >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const tabs: TabType[] = [
    { id: 'overview', label: 'Overview', icon: <Activity className="h-4 w-4 mr-2" /> },
    { id: 'queries', label: 'Top Queries', icon: <TrendingUp className="h-4 w-4 mr-2" /> },
    { id: 'zero-results', label: 'Zero Results', icon: <AlertTriangle className="h-4 w-4 mr-2" /> },
    { id: 'conversions', label: 'Conversions', icon: <Target className="h-4 w-4 mr-2" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin/search" className="text-gray-400 hover:text-gray-600">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Search Analytics</h1>
                <p className="text-sm text-gray-600">
                  Comprehensive search insights and performance metrics
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting ? 'Exporting...' : 'Export'}
              </button>
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
        ) : (
          <>
            {/* Controls */}
            <div className="bg-white rounded-lg shadow mb-6 p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <label className="text-sm font-medium text-gray-700">Time Range:</label>
                    <select
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value as any)}
                      className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                    >
                      <option value="today">Today</option>
                      <option value="week">Last 7 Days</option>
                      <option value="month">Last 30 Days</option>
                      <option value="all">All Time</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Export Format:</label>
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value as any)}
                      className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                    >
                      <option value="csv">CSV</option>
                      <option value="excel">Excel</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Real-time Updates:</label>
                  <button
                    onClick={() => setRealTimeUpdates(!realTimeUpdates)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      realTimeUpdates ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        realTimeUpdates ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
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
              {activeTab === 'overview' && analytics && (
                <div className="p-6 space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                      <div className="flex items-center">
                        <Search className="h-6 w-6 text-blue-600 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">Total Searches</p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {formatNumber(analytics.totalSearches)}
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
                            {formatNumber(analytics.uniqueQueries)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                      <div className="flex items-center">
                        <Target className="h-6 w-6 text-purple-600 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">Conversion Rate</p>
                          <p className={`text-2xl font-semibold ${getRateColor(analytics.conversionRate)}`}>
                            {analytics.conversionRate}%
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertTriangle className="h-6 w-6 text-orange-600 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">Zero Results</p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {formatNumber(analytics.zeroResults)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4">
                      <div className="flex items-center">
                        <Zap className="h-6 w-6 text-indigo-600 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">Click-Through Rate</p>
                          <p className={`text-2xl font-semibold ${getRateColor(analytics.clickThroughRate)}`}>
                            {analytics.clickThroughRate}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Results Rate</p>
                      <p className={`text-xl font-semibold ${getRateColor(analytics.resultsRate)}`}>
                        {analytics.resultsRate}%
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Avg Response Time</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {analytics.avgResponseTime}ms
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Median Response Time</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {analytics.medianResponseTime}ms
                      </p>
                    </div>
                  </div>

                  {/* Search Volume Chart */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Search Volume Over Time
                    </h3>
                    {analytics.timeSeries.length === 0 ? (
                      <div className="text-center py-8">
                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No trend data available</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {analytics.timeSeries.map((item, index) => {
                          const maxCount = Math.max(...analytics.timeSeries.map(t => t.count));
                          const percentage = (item.count / maxCount) * 100;
                          return (
                            <div key={index} className="flex items-center gap-3">
                              <span className="text-sm text-gray-700 font-medium w-28">
                                {item.date}
                              </span>
                              <div className="flex-1 bg-gray-200 rounded-full h-3">
                                <div
                                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600 w-20 text-right">
                                {formatNumber(item.count)} searches
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Top Queries Tab */}
              {activeTab === 'queries' && queries && (
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Top Search Queries
                  </h3>
                  {queries.queries.length === 0 ? (
                    <div className="text-center py-12">
                      <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No search queries found</p>
                    </div>
                  ) : (
                    <>
                      <ul className="divide-y divide-gray-200">
                        {queries.queries.map((item, index) => (
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
                                <div className="flex items-center gap-4 mt-1">
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    {formatNumber(item.count)} searches
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    Avg: {item.avgResults} results
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {item.avgResponseTime}ms
                                  </span>
                                </div>
                              </div>
                              <div className="text-right text-sm text-gray-500">
                                <p>Last: {formatTimestamp(item.lastSearchedAt)}</p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                      {queries.pagination.pages > 1 && (
                        <div className="mt-4 flex items-center justify-center gap-2">
                          <button
                            onClick={() => setQueryPage(Math.max(1, queryPage - 1))}
                            disabled={queryPage === 1}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <span className="text-sm text-gray-600">
                            Page {queryPage} of {queries.pagination.pages}
                          </span>
                          <button
                            onClick={() => setQueryPage(Math.min(queries.pagination.pages, queryPage + 1))}
                            disabled={queryPage === queries.pagination.pages}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Zero Results Tab */}
              {activeTab === 'zero-results' && (
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Zero-Result Queries
                  </h3>
                  {zeroResults.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No zero-result queries found</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {zeroResults.map((item, index) => (
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
                              <span className="mt-1 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                {formatNumber(item.count)} searches
                              </span>
                            </div>
                            <div className="text-right text-sm text-gray-500">
                              <p>Last: {formatTimestamp(item.lastSearched)}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Conversions Tab */}
              {activeTab === 'conversions' && conversions && (
                <div className="p-6 space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Search Conversion Funnel
                  </h3>
                  
                  {/* Conversion Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-sm text-gray-600">Total Searches</p>
                      <p className="text-2xl font-semibold text-blue-700">
                        {formatNumber(conversions.totalSearches)}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="text-sm text-gray-600">Conversions</p>
                      <p className="text-2xl font-semibold text-green-700">
                        {formatNumber(conversions.conversions)}
                      </p>
                    </div>
                  </div>

                  {/* Conversion Funnel Visualization */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Conversion Funnel</h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-48 text-sm text-gray-600">Searches</div>
                        <div className="flex-1 bg-blue-200 rounded-full h-8">
                          <div className="bg-blue-600 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ width: '100%' }}>
                            {formatNumber(conversions.funnel.searches)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-48 text-sm text-gray-600">With Results</div>
                        <div className="flex-1 bg-green-200 rounded-full h-8">
                          <div className="bg-green-600 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ width: `${(conversions.funnel.searchesWithResults / conversions.funnel.searches) * 100}%` }}>
                            {formatNumber(conversions.funnel.searchesWithResults)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-48 text-sm text-gray-600">Clicks</div>
                        <div className="flex-1 bg-purple-200 rounded-full h-8">
                          <div className="bg-purple-600 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ width: `${(conversions.funnel.clicks / conversions.funnel.searches) * 100}%` }}>
                            {formatNumber(conversions.funnel.clicks)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-48 text-sm text-gray-600">Conversions</div>
                        <div className="flex-1 bg-indigo-200 rounded-full h-8">
                          <div className="bg-indigo-600 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ width: `${(conversions.funnel.conversions / conversions.funnel.searches) * 100}%` }}>
                            {formatNumber(conversions.funnel.conversions)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Conversion Rate */}
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Overall Conversion Rate</p>
                        <p className="text-3xl font-semibold text-indigo-700">
                          {conversions.conversionRate}%
                        </p>
                      </div>
                      <Target className="h-12 w-12 text-indigo-600" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Period Info */}
            {analytics && (
              <div className="mt-4 text-sm text-gray-500 text-center">
                <p>
                  Showing data from {formatTimestamp(analytics.period.startDate)} to {formatTimestamp(analytics.period.endDate)}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default withAuth(SearchAnalyticsAdminPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
