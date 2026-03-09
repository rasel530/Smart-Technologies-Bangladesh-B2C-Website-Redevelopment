'use client';

/**
 * User Search Behavior Admin Page
 *
 * Admin-only page that displays user search behavior including:
 * - User search history
 * - Search patterns analysis
 * - Preference profile display
 * - Click behavior analysis
 * - Conversion tracking
 * - Personalization effectiveness
 * - Behavior timeline
 * - Export user data
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Activity,
  Target,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { withAuth } from '@/components/auth/withAuth';
import {
  getAdminUserPreferencesDetail,
  updateAdminUserPreferences,
  type UserPreferencesDetail
} from '@/lib/api/adminSearchAnalytics';

function UserSearchBehaviorAdminPage(): JSX.Element {
  const params = useParams();
  const userId = params.id as string;
  
  const [userPreferences, setUserPreferences] = useState<UserPreferencesDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchUserPreferences = async () => {
    try {
      setError(null);
      const data = await getAdminUserPreferencesDetail(userId);
      setUserPreferences(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user preferences');
    }
  };

  useEffect(() => {
    fetchUserPreferences();
  }, [userId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserPreferences();
    setRefreshing(false);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = JSON.stringify(userPreferences, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-${userId}-behavior.json`;
      document.body.appendChild(a);
      a.click();
      // Safe removal with null check to prevent error during logout
      if (document.body && a.parentNode === document.body) {
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export user data');
    }
    setExporting(false);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-BD').format(num);
  };

  const formatTimestamp = (timestamp: string | Date) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!userPreferences && !loading && !error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">User Not Found</h2>
          <p className="text-gray-600 mb-4">
            The user you are looking for does not exist or has been deleted.
          </p>
          <Link
            href="/admin/search/personalization"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Back to Personalization
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin/search/personalization" className="text-gray-400 hover:text-gray-600">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Search Behavior</h1>
                <p className="text-sm text-gray-600">
                  Detailed analysis of user search behavior: {userId}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className={`h-4 w-4 mr-2 ${exporting ? 'animate-pulse' : ''}`} />
                {exporting ? 'Exporting...' : 'Export Data'}
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
            <p className="mt-4 text-gray-600">Loading user behavior data...</p>
          </div>
        ) : null}

        {!loading && userPreferences && (
          <>
            {/* User Overview */}
            <div className="bg-white rounded-lg shadow mb-6 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                User Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-800">User ID</span>
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-xl font-bold text-blue-900 truncate">{userPreferences.userId}</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-800">Search History</span>
                    <Search className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-xl font-bold text-green-900">{formatNumber(userPreferences.searchHistory.length)}</p>
                  <p className="text-xs text-green-700 mt-1">searches</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-800">Clicks</span>
                    <Target className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-xl font-bold text-purple-900">{formatNumber(userPreferences.clicks.length)}</p>
                  <p className="text-xs text-purple-700 mt-1">clicks</p>
                </div>
              </div>
            </div>

            {/* Preferred Categories */}
            <div className="bg-white rounded-lg shadow mb-6 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Preferred Categories
              </h3>
              {userPreferences.preferredCategories.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No preferred categories found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userPreferences.preferredCategories.map((cat, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 font-medium w-48">
                        {cat.categoryName}
                      </span>
                      <div className="flex-1 bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-indigo-600 h-4 rounded-full"
                          style={{ width: `${Math.min(cat.score * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-24 text-right">
                        Score: {cat.score.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preferred Brands */}
            <div className="bg-white rounded-lg shadow mb-6 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Preferred Brands
              </h3>
              {userPreferences.preferredBrands.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No preferred brands found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userPreferences.preferredBrands.map((brand, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 font-medium w-48">
                        {brand.brandName}
                      </span>
                      <div className="flex-1 bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-purple-600 h-4 rounded-full"
                          style={{ width: `${Math.min(brand.score * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-24 text-right">
                        Score: {brand.score.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Price Range */}
            {(userPreferences.priceRangeMin !== null || userPreferences.priceRangeMax !== null) && (
              <div className="bg-white rounded-lg shadow mb-6 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Price Range Preference
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-gray-50 rounded-lg p-4">
                    <span className="text-sm font-medium text-gray-700">Minimum Price</span>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {userPreferences.priceRangeMin !== null ? `৳${formatNumber(userPreferences.priceRangeMin)}` : 'Not set'}
                    </p>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-lg p-4">
                    <span className="text-sm font-medium text-gray-700">Maximum Price</span>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {userPreferences.priceRangeMax !== null ? `৳${formatNumber(userPreferences.priceRangeMax)}` : 'Not set'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Search History */}
            <div className="bg-white rounded-lg shadow mb-6 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Search History
              </h3>
              {userPreferences.searchHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No search history found</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {userPreferences.searchHistory.slice(0, 20).map((search, index) => (
                    <li key={index} className="px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {search.query}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(search.timestamp)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {formatNumber(search.resultCount)} results
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Click Behavior */}
            <div className="bg-white rounded-lg shadow mb-6 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Click Behavior
              </h3>
              {userPreferences.clicks.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No click data found</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {userPreferences.clicks.slice(0, 20).map((click, index) => (
                    <li key={index} className="px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {click.productName || 'Unknown Product'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(click.timestamp)}
                            <span className="ml-2">
                              Position: {click.position}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {click.converted ? 'Converted' : 'Not Converted'}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default withAuth(UserSearchBehaviorAdminPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
