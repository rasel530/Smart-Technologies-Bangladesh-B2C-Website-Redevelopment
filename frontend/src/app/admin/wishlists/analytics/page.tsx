'use client';

/**
 * Admin Wishlist Analytics Dashboard
 *
 * Analytics dashboard for wishlist data including:
 * - Creation rate and trends
 * - Average wishlist size
 * - Abandonment rate
 * - Conversion rate
 * - Sharing and export statistics
 * - Event counts
 */

import React, { useState, useEffect, Suspense } from 'react';
import { withAuth } from '@/components/auth/withAuth';
import {
  RefreshCw,
  Calendar,
  Filter,
  Download,
  TrendingUp,
  ShoppingCart,
  Share2,
  FileText,
  BarChart3
} from 'lucide-react';
import WishlistStatisticsCard from '@/components/admin/wishlist/WishlistStatisticsCard';
import {
  getWishlistAnalytics,
  type WishlistAnalytics
} from '@/lib/api/adminWishlist';
import { cn } from '@/lib/utils';
import { AdminLayout } from '@/components/admin/AdminLayout';

// PRIORITY 6: Dynamic import for Recharts to reduce initial bundle size
const WishlistAnalyticsChart = React.lazy(() => import('@/components/admin/wishlist/WishlistAnalyticsChart'));

// Loading component for chart
const ChartLoadingFallback = () => (
  <div className="h-64 flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-t-2 border-primary-600"></div>
  </div>
);

function AdminWishlistAnalyticsPage() {
  const [analytics, setAnalytics] = useState<WishlistAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');

  /**
   * Load analytics
   */
  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // Calculate dates
      let startDate: string | undefined;
      let endDate: string | undefined;

      if (dateRange === 'custom') {
        startDate = customStartDate;
        endDate = customEndDate;
      } else {
        const now = new Date();
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        const start = new Date(now);
        start.setDate(start.getDate() - days);
        startDate = start.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
      }

      const data = await getWishlistAnalytics(startDate, endDate, groupBy);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, customStartDate, customEndDate, groupBy]);

  /**
   * Handle export analytics
   */
  const handleExportAnalytics = () => {
    if (!analytics) return;

    const data = {
      dateRange,
      groupBy,
      metrics: {
        creationRate: analytics.creationRate,
        averageWishlistSize: analytics.averageWishlistSize,
        abandonmentRate: analytics.abandonmentRate,
        conversionRate: analytics.conversionRate
      },
      sharingStats: analytics.sharingStats,
      eventCounts: analytics.eventCounts,
      creationTrend: analytics.creationTrend
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wishlist-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    if (document.body && a.parentNode === document.body) { document.body.removeChild(a); }
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout title="Wishlist Analytics">
      <div className="space-y-6">
        {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Wishlist Analytics
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Detailed analytics and insights for wishlist activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportAnalytics}
            disabled={!analytics || isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            type="button"
            onClick={loadAnalytics}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Range:</span>
          </div>
          <div className="flex items-center gap-2">
            {(['7d', '30d', '90d', 'custom'] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setDateRange(range)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  dateRange === range
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                {range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : range === '90d' ? 'Last 90 days' : 'Custom'}
              </button>
            ))}
          </div>
          {dateRange === 'custom' && (
            <>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            </>
          )}
          <div className="flex items-center gap-2 ml-4">
            <BarChart3 className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Group By:</span>
          </div>
          <div className="flex items-center gap-2">
            {(['day', 'week', 'month'] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setGroupBy(period)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  groupBy === period
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      ) : analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <WishlistStatisticsCard
            title="Creation Rate"
            value={analytics.creationRate.toLocaleString()}
            icon={TrendingUp}
          />
          <WishlistStatisticsCard
            title="Average Wishlist Size"
            value={analytics.averageWishlistSize.toFixed(2)}
            icon={ShoppingCart}
          />
          <WishlistStatisticsCard
            title="Abandonment Rate"
            value={`${(analytics.abandonmentRate * 100).toFixed(1)}%`}
            icon={TrendingUp}
          />
          <WishlistStatisticsCard
            title="Conversion Rate"
            value={`${(analytics.conversionRate * 100).toFixed(1)}%`}
            icon={TrendingUp}
          />
        </div>
      )}

      {/* Sharing Statistics */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      ) : analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <WishlistStatisticsCard
            title="Total Shares"
            value={analytics.sharingStats.totalShares.toLocaleString()}
            icon={Share2}
          />
          <WishlistStatisticsCard
            title="Total Exports"
            value={analytics.sharingStats.totalExports.toLocaleString()}
            icon={FileText}
          />
        </div>
      )}

      {/* Charts */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      ) : analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Suspense fallback={<ChartLoadingFallback />}>
            <WishlistAnalyticsChart
              data={analytics.creationTrend.map(item => ({
                name: item.date,
                value: item.count
              }))}
              type="line"
              title="Wishlist Creation Trend"
              xAxisKey="name"
              dataKey="value"
            />
          </Suspense>
          <Suspense fallback={<ChartLoadingFallback />}>
            <WishlistAnalyticsChart
              data={Object.entries(analytics.eventCounts).map(([name, value]) => ({
              name,
              value
            }))}
            type="pie"
            title="Event Distribution"
            xAxisKey="name"
            dataKey="value"
          />
          </Suspense>
        </div>
      )}

      {/* Event Counts */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      ) : analytics && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Event Counts
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(analytics.eventCounts).map(([event, count]) => (
                <div key={event} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {event.replace(/_/g, ' ')}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {count.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminLayout>
  );
}

export default withAuth(AdminWishlistAnalyticsPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
