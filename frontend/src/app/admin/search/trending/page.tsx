'use client';

/**
 * Search Trending Admin Page
 *
 * Admin-only page that displays trending searches including:
 * - Trending searches list with trend indicators
 * - Trend score configuration (threshold, decay factor)
 * - Trending products management
 * - Rising searches highlight
 * - Trending categories breakdown
 * - Time-based filtering (1h, 24h, 7d, 30d)
 * - Manual trend adjustment
 * - Trend refresh controls
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Settings,
  Activity,
  Search,
  Package,
  Tag,
  Clock,
  Zap,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { withAuth } from '@/components/auth/withAuth';
import {
  getAdminTrendingOverview,
  getAdminTrendingSearches,
  getAdminTrendingProducts,
  calculateAdminTrends,
  updateAdminTrendThreshold,
  updateAdminTrendDecay,
  clearAdminOldTrends,
  type TrendingOverview,
  type TrendingFilters
} from '@/lib/api/adminSearchAnalytics';
import type { TrendingSearch, TrendingProduct } from '@/types/searchAnalytics';

function SearchTrendingAdminPage(): JSX.Element {
  const [overview, setOverview] = useState<TrendingOverview | null>(null);
  const [trendingSearches, setTrendingSearches] = useState<TrendingSearch[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<TrendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'searches' | 'products'>('searches');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [config, setConfig] = useState({
    threshold: 10,
    decay: 0.9
  });

  const fetchOverview = async () => {
    try {
      setError(null);
      const data = await getAdminTrendingOverview();
      setOverview(data);
      setConfig({
        threshold: data.trendThreshold,
        decay: data.trendDecay
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trending overview');
    }
  };

  const fetchTrendingSearches = async () => {
    try {
      const filters: TrendingFilters = { limit: 50, timeRange };
      const data = await getAdminTrendingSearches(filters);
      setTrendingSearches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trending searches');
    }
  };

  const fetchTrendingProducts = async () => {
    try {
      const filters: TrendingFilters = { limit: 50, timeRange };
      const data = await getAdminTrendingProducts(filters);
      setTrendingProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trending products');
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchOverview(),
      fetchTrendingSearches(),
      fetchTrendingProducts()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, [timeRange]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const handleCalculateTrends = async () => {
    setCalculating(true);
    try {
      await calculateAdminTrends();
      await fetchAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate trends');
    }
    setCalculating(false);
  };

  const handleConfigUpdate = async () => {
    try {
      await updateAdminTrendThreshold(config.threshold);
      await updateAdminTrendDecay(config.decay);
      setConfigDialogOpen(false);
      await fetchOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update trend configuration');
    }
  };

  const handleClearOldTrends = async () => {
    if (!confirm('Are you sure you want to clear trends older than 30 days?')) return;
    try {
      await clearAdminOldTrends(30);
      await fetchAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear old trends');
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-BD').format(num);
  };

  const formatTimestamp = (timestamp: string | Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'rising':
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'falling':
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'rising':
        return 'text-green-600';
      case 'falling':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

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
                <h1 className="text-3xl font-bold text-gray-900">Trending Searches</h1>
                <p className="text-sm text-gray-600">
                  Trending searches, products, and trend management
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setConfigDialogOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </button>
              <button
                onClick={handleCalculateTrends}
                disabled={calculating}
                className="inline-flex items-center px-4 py-2 border border-indigo-300 rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className={`h-4 w-4 mr-2 ${calculating ? 'animate-pulse' : ''}`} />
                {calculating ? 'Calculating...' : 'Calculate Trends'}
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
              <Activity className="h-5 w-5 text-red-600 mr-3" />
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
            <p className="mt-4 text-gray-600">Loading trending data...</p>
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            {overview && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-800">Trending Searches</span>
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-blue-900">{formatNumber(overview.totalTrendingSearches)}</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-800">Trending Products</span>
                    <Package className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-green-900">{formatNumber(overview.totalTrendingProducts)}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-800">Trend Threshold</span>
                    <Activity className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-3xl font-bold text-purple-900">{overview.trendThreshold}</p>
                  <p className="text-xs text-purple-700 mt-2">
                    Decay: {overview.trendDecay.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="bg-white rounded-lg shadow mb-6 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <label className="text-sm font-medium text-gray-700">Time Range:</label>
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as any)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                  >
                    <option value="1h">Last Hour</option>
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                  </select>
                </div>
                <button
                  onClick={handleClearOldTrends}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Clear Old Trends (30 days)
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex">
                  {[
                    { id: 'searches', label: 'Trending Searches', icon: <Search className="h-4 w-4 mr-2" /> },
                    { id: 'products', label: 'Trending Products', icon: <Package className="h-4 w-4 mr-2" /> }
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

              {/* Trending Searches Tab */}
              {activeTab === 'searches' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Trending Searches
                    </h3>
                    <span className="text-sm text-gray-600">
                      {trendingSearches.length} searches
                    </span>
                  </div>

                  {trendingSearches.length === 0 ? (
                    <div className="text-center py-12">
                      <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No trending searches found</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Searches will appear here as trends are calculated
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {trendingSearches.map((search, index) => (
                        <li key={index} className="px-4 py-4 hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {search.query}
                                </span>
                                {getTrendIcon(search.trend)}
                                <span className={`text-xs px-2 py-1 rounded ${getTrendColor(search.trend)}`}>
                                  {search.trend || 'stable'}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Activity className="h-3 w-3" />
                                  {formatNumber(search.searchCount)} searches
                                </span>
                                <span className="flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3" />
                                  Score: {search.trendScore.toFixed(2)}
                                </span>
                                {search.category && (
                                  <span className="flex items-center gap-1">
                                    <Tag className="h-3 w-3" />
                                    {search.category}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Trending Products Tab */}
              {activeTab === 'products' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Trending Products
                    </h3>
                    <span className="text-sm text-gray-600">
                      {trendingProducts.length} products
                    </span>
                  </div>

                  {trendingProducts.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No trending products found</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Products will appear here as trends are calculated
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {trendingProducts.map((product, index) => (
                        <li key={index} className="px-4 py-4 hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              {product.imageUrl && (
                                <img
                                  src={product.imageUrl}
                                  alt={product.productName}
                                  className="w-16 h-16 object-cover rounded-md"
                                />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    {product.productName}
                                  </span>
                                  {getTrendIcon(product.trend)}
                                  <span className={`text-xs px-2 py-1 rounded ${getTrendColor(product.trend)}`}>
                                    {product.trend || 'stable'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Activity className="h-3 w-3" />
                                    {formatNumber(product.searchCount)} searches
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    Score: {product.trendScore.toFixed(2)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Tag className="h-3 w-3" />
                                    {product.category}
                                  </span>
                                  {product.price && (
                                    <span className="flex items-center gap-1">
                                      ৳{formatNumber(product.price)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Last Calculated */}
            {overview && (
              <div className="mt-4 text-sm text-gray-500 text-center">
                <p>
                  Last calculated: {formatTimestamp(overview.lastCalculated)}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Config Dialog */}
      {configDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Trend Configuration
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trend Threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={config.threshold}
                    onChange={(e) => setConfig({ ...config, threshold: parseInt(e.target.value) })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum trend score to be considered trending
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trend Decay Factor
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={config.decay}
                    onChange={(e) => setConfig({ ...config, decay: parseFloat(e.target.value) })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How quickly trends lose importance (0-1, higher = slower decay)
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setConfigDialogOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfigUpdate}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(SearchTrendingAdminPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
