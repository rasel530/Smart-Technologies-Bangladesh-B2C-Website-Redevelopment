'use client';

/**
 * Search Query Details Admin Page
 *
 * Admin-only page that displays detailed query analysis including:
 * - Query details (query string, frequency, avg results)
 * - Search results analysis
 * - Click-through rate by position
 * - Conversion tracking
 * - User demographics
 * - Time-based trends
 * - Related queries
 * - Query optimization suggestions
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  RefreshCw,
  Search,
  TrendingUp,
  Target,
  Activity,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3
} from 'lucide-react';
import { withAuth } from '@/components/auth/withAuth';
import {
  getAdminQueryDetails,
  type QueryDetails
} from '@/lib/api/adminSearchAnalytics';

function SearchQueryDetailsAdminPage(): JSX.Element {
  const params = useParams();
  const queryId = params.id as string;
  
  const [queryDetails, setQueryDetails] = useState<QueryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQueryDetails = async () => {
    try {
      setError(null);
      const data = await getAdminQueryDetails(queryId);
      setQueryDetails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load query details');
    }
  };

  useEffect(() => {
    fetchQueryDetails();
  }, [queryId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchQueryDetails();
    setRefreshing(false);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-BD').format(num);
  };

  const formatTimestamp = (timestamp: string | Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const getConversionIcon = (conversionType: string | null) => {
    switch (conversionType) {
      case 'click':
        return <Target className="h-4 w-4 text-blue-600" />;
      case 'add_to_cart':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'purchase':
        return <CheckCircle className="h-4 w-4 text-purple-600" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  if (!queryDetails && !loading && !error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Query Not Found</h2>
          <p className="text-gray-600 mb-4">
            The query you're looking for doesn't exist or has been deleted.
          </p>
          <Link
            href="/admin/search/analytics"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Back to Analytics
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
              <Link href="/admin/search/analytics" className="text-gray-400 hover:text-gray-600">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Query Details</h1>
                <p className="text-sm text-gray-600">
                  Detailed analysis of search query: {queryDetails?.query || queryId}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
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
            <p className="mt-4 text-gray-600">Loading query details...</p>
          </div>
        ) : null}

        {!loading && queryDetails && (
          <>
            {/* Query Overview */}
            <div className="bg-white rounded-lg shadow mb-6 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Query Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-800">Query</span>
                    <Search className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-xl font-bold text-blue-900 truncate">{queryDetails.query}</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-800">Frequency</span>
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-xl font-bold text-green-900">{formatNumber(queryDetails.frequency)}</p>
                  <p className="text-xs text-green-700 mt-1">searches</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-800">Avg Results</span>
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-xl font-bold text-purple-900">{formatNumber(queryDetails.avgResults)}</p>
                  <p className="text-xs text-purple-700 mt-1">per search</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-orange-800">Unique Users</span>
                    <Users className="h-5 w-5 text-orange-600" />
                  </div>
                  <p className="text-xl font-bold text-orange-900">{formatNumber(queryDetails.uniqueUsers)}</p>
                  <p className="text-xs text-orange-700 mt-1">users</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <span className="text-sm font-medium text-gray-700">Avg Response Time</span>
                  <p className="text-lg font-bold text-gray-900 mt-1">{queryDetails.avgResponseTime}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <span className="text-sm font-medium text-gray-700">Click-Through Rate</span>
                  <p className="text-lg font-bold text-gray-900 mt-1">{queryDetails.clickThroughRate}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <span className="text-sm font-medium text-gray-700">Conversion Rate</span>
                  <p className="text-lg font-bold text-gray-900 mt-1">{queryDetails.conversionRate}</p>
                </div>
              </div>
            </div>

            {/* Click-Through by Position */}
            <div className="bg-white rounded-lg shadow mb-6 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Click-Through Rate by Position
              </h3>
              {Object.keys(queryDetails.clicksByPosition).length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No click data available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(queryDetails.clicksByPosition)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([position, clicks]) => (
                      <div key={position} className="flex items-center gap-3">
                        <span className="text-sm text-gray-700 font-medium w-16">
                          Position {position}
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-4">
                          <div
                            className="bg-indigo-600 h-4 rounded-full"
                            style={{ width: `${(clicks / queryDetails.frequency) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-20 text-right">
                          {formatNumber(clicks)} clicks
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Time-Based Trends */}
            <div className="bg-white rounded-lg shadow mb-6 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Search Trends Over Time
              </h3>
              {queryDetails.timeTrends.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No trend data available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {queryDetails.timeTrends.map((trend, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 font-medium w-32">
                        {formatTimestamp(trend.date)}
                      </span>
                      <div className="flex-1 bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-blue-600 h-4 rounded-full"
                          style={{ width: `${(trend.count / queryDetails.frequency) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-20 text-right">
                        {formatNumber(trend.count)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Related Queries */}
            <div className="bg-white rounded-lg shadow mb-6 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Related Queries
              </h3>
              {queryDetails.relatedQueries.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No related queries found</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {queryDetails.relatedQueries.slice(0, 10).map((related, index) => (
                    <li key={index} className="px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-900">{related.query}</span>
                        <span className="text-sm text-gray-600">
                          {formatNumber(related.count)} searches
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Recent Searches */}
            <div className="bg-white rounded-lg shadow mb-6 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Searches
              </h3>
              {queryDetails.recentSearches.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No recent searches found</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {queryDetails.recentSearches.slice(0, 20).map((search, index) => (
                    <li key={index} className="px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {formatNumber(search.resultsCount)} results
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {search.responseTime}ms
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(search.timestamp)}
                            {search.userId && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                User: {search.userId}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getConversionIcon(search.conversionType)}
                          <span className="text-xs text-gray-500">
                            {search.conversionType || 'No conversion'}
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

export default withAuth(SearchQueryDetailsAdminPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
