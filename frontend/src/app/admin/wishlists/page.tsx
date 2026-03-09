'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { withAuth } from '@/components/auth/withAuth';
import {
  Heart,
  ShoppingCart,
  Share2,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  TrendingUp,
  Package,
  Users
} from 'lucide-react';
import WishlistStatisticsCard from '@/components/admin/wishlist/WishlistStatisticsCard';
import WishlistTable from '@/components/admin/wishlist/WishlistTable';
import {
  getWishlistStatistics,
  getAllWishlists,
  type WishlistWithUser
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

function AdminWishlistOverviewPage() {
  const [statistics, setStatistics] = useState<any>(null);
  const [wishlists, setWishlists] = useState<WishlistWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  /**
   * Load data
   */
  const loadData = async () => {
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

      // Load statistics
      const stats = await getWishlistStatistics(startDate, endDate);
      setStatistics(stats);

      // Load recent wishlists
      const wishlistsData = await getAllWishlists({ page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' });
      setWishlists(wishlistsData.wishlists);
    } catch (error) {
      console.error('Error loading wishlist data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle delete wishlist
   */
  const handleDeleteWishlist = async (wishlistId: string) => {
    try {
      const { deleteWishlist } = await import('@/lib/api/adminWishlist');
      await deleteWishlist(wishlistId);
      await loadData();
    } catch (error) {
      console.error('Error deleting wishlist:', error);
    }
  };

  /**
   * Handle view wishlist
   */
  const handleViewWishlist = (wishlist: WishlistWithUser) => {
    // Navigate to wishlist detail page
    window.open(`/wishlist/${wishlist.id}`, '_blank');
  };

  return (
    <AdminLayout title="Wishlist Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Wishlist Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Overview and analytics for all wishlists
            </p>
          </div>
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            Refresh
          </button>
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
          </div>
        </div>

        {/* Statistics Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        ) : statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <WishlistStatisticsCard
              title="Total Wishlists"
              value={statistics.totalWishlists}
              icon={Heart}
            />
            <WishlistStatisticsCard
              title="Total Items"
              value={statistics.totalItems}
              icon={Package}
            />
            <WishlistStatisticsCard
              title="Average Items per Wishlist"
              value={statistics.averageItemsPerWishlist.toFixed(2)}
              icon={ShoppingCart}
            />
            <WishlistStatisticsCard
              title="Conversion Rate"
              value={`${(statistics.conversionRate * 100).toFixed(1)}%`}
              icon={TrendingUp}
            />
            <WishlistStatisticsCard
              title="Public Wishlists"
              value={statistics.publicWishlists}
              icon={Users}
            />
            <WishlistStatisticsCard
              title="Shared Wishlists"
              value={statistics.sharedWishlists}
              icon={Share2}
            />
            <WishlistStatisticsCard
              title="Exports"
              value={statistics.topProducts.reduce((sum: number, p: any) => sum + p.wishlistCount, 0)}
              icon={Download}
            />
            <WishlistStatisticsCard
              title="Top Product"
              value={statistics.topProducts[0]?.name || 'N/A'}
              icon={Package}
            />
          </div>
        )}

        {/* Charts */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        ) : statistics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Suspense fallback={<ChartLoadingFallback />}>
              <WishlistAnalyticsChart
                data={statistics.creationTrend}
                type="line"
                title="Wishlist Creation Trend"
                xAxisKey="date"
                dataKey="count"
              />
            </Suspense>
            <Suspense fallback={<ChartLoadingFallback />}>
              <WishlistAnalyticsChart
                data={statistics.topProducts.slice(0, 10).map((p: any) => ({
                  name: p.name,
                  value: p.wishlistCount
                }))}
                type="bar"
                title="Top 10 Most Wishlisted Products"
                xAxisKey="name"
                dataKey="value"
              />
            </Suspense>
        </div>
      )}

        {/* Recent Wishlists */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Recent Wishlists
            </h2>
          </div>
          <div className="p-6">
            <WishlistTable
              wishlists={wishlists}
              onView={handleViewWishlist}
              onDelete={handleDeleteWishlist}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAuth(AdminWishlistOverviewPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
