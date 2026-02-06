'use client';

/**
 * Search Personalization Admin Page
 *
 * Admin-only page that displays search personalization including:
 * - Personalization overview metrics
 * - User preference statistics
 * - Recommendation engine status
 * - Personalization effectiveness metrics
 * - User search behavior insights
 * - Recommendation performance tracking
 * - Personalization configuration (enable/disable features)
 * - A/B testing for personalization
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  Users,
  Settings,
  Activity,
  TrendingUp,
  Target,
  CheckCircle,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Download,
  Search
} from 'lucide-react';
import { withAuth } from '@/components/auth/withAuth';
import {
  getAdminPersonalizationOverview,
  getAdminUserPreferencesList,
  getAdminPersonalizationMetrics,
  getAdminRecommendationStats,
  updateAdminPersonalizationConfig,
  type PersonalizationOverview,
  type UserPreferencesList,
  type RecommendationStats,
  type PersonalizationConfig
} from '@/lib/api/adminSearchAnalytics';
import type { PersonalizationMetrics } from '@/types/searchAnalytics';

function SearchPersonalizationAdminPage(): JSX.Element {
  const [overview, setOverview] = useState<PersonalizationOverview | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferencesList | null>(null);
  const [metrics, setMetrics] = useState<PersonalizationMetrics | null>(null);
  const [recommendationStats, setRecommendationStats] = useState<RecommendationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'metrics' | 'recommendations'>('overview');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [config, setConfig] = useState<PersonalizationConfig>({
    personalizationEnabled: true,
    recommendationEngine: 'collaborative',
    minSearchesForPersonalization: 5
  });
  const [userSearch, setUserSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });

  const fetchOverview = async () => {
    try {
      setError(null);
      const data = await getAdminPersonalizationOverview();
      setOverview(data);
      setConfig({
        personalizationEnabled: data.personalizationEnabled,
        recommendationEngine: data.recommendationEngineStatus,
        minSearchesForPersonalization: 5
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load personalization overview');
    }
  };

  const fetchUserPreferences = async () => {
    try {
      const data = await getAdminUserPreferencesList(
        { query: userSearch },
        pagination
      );
      setUserPreferences(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user preferences');
    }
  };

  const fetchMetrics = async () => {
    try {
      const data = await getAdminPersonalizationMetrics(timeRange);
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load personalization metrics');
    }
  };

  const fetchRecommendationStats = async () => {
    try {
      const data = await getAdminRecommendationStats(timeRange);
      setRecommendationStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendation stats');
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchOverview(),
      fetchUserPreferences(),
      fetchMetrics(),
      fetchRecommendationStats()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, [timeRange, pagination]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const handleConfigUpdate = async () => {
    try {
      await updateAdminPersonalizationConfig(config);
      setConfigDialogOpen(false);
      await fetchOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update personalization config');
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-BD').format(num);
  };

  const formatTimestamp = (timestamp: string | Date) => {
    return new Date(timestamp).toLocaleString();
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
                <h1 className="text-3xl font-bold text-gray-900">Search Personalization</h1>
                <p className="text-sm text-gray-600">
                  User preferences, recommendations, and personalization metrics
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
              <XCircle className="h-5 w-5 text-red-600 mr-3" />
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
            <p className="mt-4 text-gray-600">Loading personalization data...</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex">
                  {[
                    { id: 'overview', label: 'Overview', icon: <Activity className="h-4 w-4 mr-2" /> },
                    { id: 'users', label: 'User Preferences', icon: <Users className="h-4 w-4 mr-2" /> },
                    { id: 'metrics', label: 'Metrics', icon: <TrendingUp className="h-4 w-4 mr-2" /> },
                    { id: 'recommendations', label: 'Recommendations', icon: <Target className="h-4 w-4 mr-2" /> }
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
              {activeTab === 'overview' && overview && (
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Personalization Overview
                  </h3>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-800">Total Users</span>
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <p className="text-3xl font-bold text-blue-900">{formatNumber(overview.totalUsers)}</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-800">Users with Preferences</span>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <p className="text-3xl font-bold text-green-900">{formatNumber(overview.usersWithPreferences)}</p>
                      <p className="text-xs text-green-700 mt-2">
                        {((overview.usersWithPreferences / overview.totalUsers) * 100).toFixed(1)}% of total
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-purple-800">Personalization</span>
                        {overview.personalizationEnabled ? (
                          <ToggleRight className="h-5 w-5 text-purple-600" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-purple-600" />
                        )}
                      </div>
                      <p className="text-lg font-bold text-purple-900">
                        {overview.personalizationEnabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-orange-800">Recommendation Engine</span>
                        <Activity className="h-5 w-5 text-orange-600" />
                      </div>
                      <p className="text-lg font-bold text-orange-900">{overview.recommendationEngineStatus}</p>
                      <p className="text-xs text-orange-700 mt-2">
                        Last updated: {formatTimestamp(overview.lastUpdated)}
                      </p>
                    </div>
                  </div>

                  {/* Status Indicators */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">System Status</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Personalization Enabled</span>
                        {overview.personalizationEnabled ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Recommendation Engine</span>
                        <span className="text-sm font-medium text-green-700">
                          {overview.recommendationEngineStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && userPreferences && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      User Preferences
                    </h3>
                    <span className="text-sm text-gray-600">
                      {userPreferences.pagination.total} users
                    </span>
                  </div>

                  {/* Search */}
                  <div className="mb-4 flex items-center gap-3">
                    <Search className="h-4 w-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search users by email or name..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                    />
                  </div>

                  {userPreferences.preferences.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No user preferences found</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Users will appear here as they interact with search
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {userPreferences.preferences.map((pref) => (
                        <li key={pref.id} className="px-4 py-4 hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="text-sm font-medium text-gray-900">
                                  {pref.user.email}
                                </h4>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {pref.preferredCategories.length} categories
                                </span>
                                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                  {pref.preferredBrands.length} brands
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                {pref.user.firstName} {pref.user.lastName}
                              </p>
                              {pref.priceRangeMin !== null && pref.priceRangeMax !== null && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Price Range: ৳{pref.priceRangeMin} - ৳{pref.priceRangeMax}
                                </p>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Pagination */}
                  {userPreferences.pagination.pages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                      <button
                        onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {pagination.page} of {userPreferences.pagination.pages}
                      </span>
                      <button
                        onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                        disabled={pagination.page >= userPreferences.pagination.pages}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Metrics Tab */}
              {activeTab === 'metrics' && metrics && (
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Personalization Metrics
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-800">Personalized CTR</span>
                        <Target className="h-5 w-5 text-blue-600" />
                      </div>
                      <p className="text-3xl font-bold text-blue-900">{(metrics.personalizedClickRate * 100).toFixed(1)}%</p>
                      <p className="text-xs text-blue-700 mt-2">
                        Non-personalized: {(metrics.nonPersonalizedClickRate * 100).toFixed(1)}%
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-800">Personalized Conversion Rate</span>
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                      <p className="text-3xl font-bold text-green-900">{(metrics.personalizedConversionRate * 100).toFixed(1)}%</p>
                      <p className="text-xs text-green-700 mt-2">
                        Non-personalized: {(metrics.nonPersonalizedConversionRate * 100).toFixed(1)}%
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-purple-800">CTR Improvement</span>
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                      </div>
                      <p className="text-3xl font-bold text-purple-900">
                        {metrics.improvement.clickRate > 0 ? '+' : ''}{(metrics.improvement.clickRate * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-purple-700 mt-2">
                        Click-through rate improvement
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-orange-800">Conversion Improvement</span>
                        <TrendingUp className="h-5 w-5 text-orange-600" />
                      </div>
                      <p className="text-3xl font-bold text-orange-900">
                        {metrics.improvement.conversionRate > 0 ? '+' : ''}{(metrics.improvement.conversionRate * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-orange-700 mt-2">
                        Conversion rate improvement
                      </p>
                    </div>
                  </div>

                  {/* Time Range Selector */}
                  <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center gap-4">
                    <span className="text-sm font-medium text-gray-700">Time Range:</span>
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
                </div>
              )}

              {/* Recommendations Tab */}
              {activeTab === 'recommendations' && recommendationStats && (
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Recommendation Statistics
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-800">Total Recommendations</span>
                        <Target className="h-5 w-5 text-blue-600" />
                      </div>
                      <p className="text-3xl font-bold text-blue-900">{formatNumber(recommendationStats.totalRecommendations)}</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-800">Click-Through Rate</span>
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                      <p className="text-3xl font-bold text-green-900">{recommendationStats.clickThroughRate}</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-purple-800">Conversion Rate</span>
                        <Activity className="h-5 w-5 text-purple-600" />
                      </div>
                      <p className="text-3xl font-bold text-purple-900">{recommendationStats.conversionRate}</p>
                    </div>
                  </div>

                  {/* Top Categories */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Top Categories</h4>
                    <div className="space-y-3">
                      {recommendationStats.topCategories.map((cat, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <span className="text-sm text-gray-700 font-medium w-48">{cat.category}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-4">
                            <div className="bg-indigo-600 h-4 rounded-full" style={{ width: `${parseFloat(cat.percentage)}%` }} />
                          </div>
                          <span className="text-sm text-gray-600 w-24 text-right">{cat.percentage}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Config Dialog */}
      {configDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Personalization Configuration
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personalization Enabled
                  </label>
                  <select
                    value={config.personalizationEnabled ? 'true' : 'false'}
                    onChange={(e) => setConfig({ ...config, personalizationEnabled: e.target.value === 'true' })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                  >
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recommendation Engine
                  </label>
                  <select
                    value={config.recommendationEngine}
                    onChange={(e) => setConfig({ ...config, recommendationEngine: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                  >
                    <option value="collaborative">Collaborative Filtering</option>
                    <option value="content_based">Content-Based</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Searches for Personalization
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={config.minSearchesForPersonalization}
                    onChange={(e) => setConfig({ ...config, minSearchesForPersonalization: parseInt(e.target.value) })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                  />
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

export default withAuth(SearchPersonalizationAdminPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
