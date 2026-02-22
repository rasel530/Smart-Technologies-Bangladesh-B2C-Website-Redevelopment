'use client';

import React, { useState, useEffect } from 'react';
import { withAuth } from '@/components/auth/withAuth';
import CheckoutAnalyticsCharts from '@/components/admin/checkout/CheckoutAnalyticsCharts';
import { apiClient } from '@/lib/api/client';
import { BarChart3, Loader2, X, Calendar } from 'lucide-react';

// Types
interface CheckoutAnalytics {
  overview: {
    totalSessions: number;
    completedSessions: number;
    abandonedSessions: number;
    activeSessions: number;
    expiredSessions: number;
    conversionRate: number;
    abandonmentRate: number;
    recoveryRate: number;
    avgCartValue: number;
    avgTimeToComplete: number;
  };
  userTypeComparison: {
    guest: {
      total: number;
      completed: number;
      conversionRate: number;
    };
    authenticated: {
      total: number;
      completed: number;
      conversionRate: number;
    };
  };
  abandonmentByStep: Record<string, number>;
  stepAnalytics: Record<string, {
    total: number;
    completed: number;
    abandoned: number;
    conversionRate: number;
  }>;
  deviceType: {
    mobile: number;
    desktop: number;
  };
}

interface AnalyticsResponse {
  success: boolean;
  data: CheckoutAnalytics;
}

/**
 * Admin Checkout Analytics Page
 * 
 * This page provides a comprehensive dashboard for checkout analytics.
 * Admins can view detailed metrics, conversion funnels, and performance insights.
 * 
 * Features:
 * - Overview metrics (total sessions, conversion rate, abandonment rate, recovery rate)
 * - Conversion funnel visualization
 * - Step-by-step drop-off analysis
 * - Abandonment rate by step
 * - Mobile vs desktop checkout performance
 * - Guest vs authenticated checkout comparison
 * - Average cart value and time to complete
 * - Key insights and recommendations
 * - Date range filtering
 * - Mobile-responsive design
 */
function AdminCheckoutAnalyticsPage() {
  const [analytics, setAnalytics] = useState<CheckoutAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Date range filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const queryString = params.toString();
      const response: AnalyticsResponse = await apiClient.get(
        `/admin/checkout/analytics${queryString ? `?${queryString}` : ''}`
      );
      
      setAnalytics(response.data);
    } catch (err: any) {
      console.error('Error fetching checkout analytics:', err);
      setError(err.message || 'Failed to load checkout analytics. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-100 rounded-lg">
          <BarChart3 className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Checkout Analytics</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive checkout performance metrics and insights
          </p>
        </div>
      </div>

      {/* Date Range Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
          </div>
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <span className="text-gray-500">to</span>
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={fetchAnalytics}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading checkout analytics...</p>
        </div>
      ) : analytics ? (
        /* Analytics Charts */
        <CheckoutAnalyticsCharts 
          analytics={analytics} 
          onRefresh={handleRefresh}
          loading={refreshing}
        />
      ) : (
        /* No Data State */
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Data Available</h3>
          <p className="text-gray-600">
            No checkout data has been collected yet. Analytics will appear once checkout sessions are created.
          </p>
        </div>
      )}
    </div>
  );
}

// Wrap with authentication HOC
export default withAuth(AdminCheckoutAnalyticsPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
