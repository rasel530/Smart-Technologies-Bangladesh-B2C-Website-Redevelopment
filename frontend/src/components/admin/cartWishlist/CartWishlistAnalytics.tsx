'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Download,
  Calendar,
  TrendingUp,
  ShoppingCart,
  Heart,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { useAdminCartWishlistStore } from '@/store/adminCartWishlistStore';
import { withAuth } from '@/components/auth/withAuth';

interface CartWishlistAnalyticsProps {
  language?: 'en' | 'bn';
}

const CartWishlistAnalytics: React.FC<CartWishlistAnalyticsProps> = ({ language = 'en' }) => {
  const {
    analytics,
    isLoading,
    error,
    fetchSystemAnalytics,
    fetchBehaviorAnalytics,
    fetchConversionAnalytics,
    fetchAbandonmentAnalytics,
    clearError,
  } = useAdminCartWishlistStore();

  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchSystemAnalytics();
    fetchBehaviorAnalytics();
    fetchConversionAnalytics();
    fetchAbandonmentAnalytics();
  }, []);

  const handleFilter = () => {
    fetchSystemAnalytics({
      startDate: dateRange.startDate || undefined,
      endDate: dateRange.endDate || undefined,
    });
    fetchBehaviorAnalytics({
      startDate: dateRange.startDate || undefined,
      endDate: dateRange.endDate || undefined,
    });
  };

  const handleClearFilters = () => {
    setDateRange({ startDate: '', endDate: '' });
    fetchSystemAnalytics();
    fetchBehaviorAnalytics();
  };

  const handleExport = async (format: 'json' | 'csv') => {
    const data = {
      systemAnalytics: analytics.systemAnalytics,
      behaviorAnalytics: analytics.behaviorAnalytics,
      conversionAnalytics: analytics.conversionAnalytics,
      abandonmentAnalytics: analytics.abandonmentAnalytics,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_export_${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  const translations = {
    en: {
      title: 'Cart-Wishlist Analytics',
      subtitle: 'Combined analytics view for cart and wishlist behavior',
      refresh: 'Refresh',
      filters: 'Filters',
      apply: 'Apply',
      clear: 'Clear',
      export: 'Export',
      loading: 'Loading...',
      error: 'Error loading analytics',
      retry: 'Retry',
      
      // Date Range
      startDate: 'Start Date',
      endDate: 'End Date',
      
      // Overview
      overview: 'Overview',
      cartActivity: 'Cart Activity',
      wishlistActivity: 'Wishlist Activity',
      moveOperations: 'Move Operations',
      syncStats: 'Sync Statistics',
      
      // Stats
      totalAdds: 'Total Adds',
      totalRemoves: 'Total Removes',
      totalViews: 'Total Views',
      cartToWishlist: 'Cart to Wishlist',
      wishlistToCart: 'Wishlist to Cart',
      totalSyncs: 'Total Syncs',
      successfulSyncs: 'Successful Syncs',
      failedSyncs: 'Failed Syncs',
      
      // Charts
      activityTrend: 'Activity Trend',
      conversionFunnel: 'Conversion Funnel',
      abandonmentRate: 'Abandonment Rate',
      movePatterns: 'Move Patterns',
      
      // Funnel
      views: 'Views',
      cartAdds: 'Cart Adds',
      wishlistAdds: 'Wishlist Adds',
      cartToWishlistMoves: 'Cart to Wishlist Moves',
      wishlistToCartMoves: 'Wishlist to Cart Moves',
      checkouts: 'Checkouts',
      
      // Empty state
      noData: 'No data available',
    },
    bn: {
      title: 'কার্ট-উইশলিস্ট অ্যানালিটিক্স',
      subtitle: 'কার্ট এবং উইশলিস্ট আচরণের জন্য সম্মিলিত অ্যানালিটিক্স দৃশ্য',
      refresh: 'রিফ্রেশ',
      filters: 'ফিল্টার',
      apply: 'প্রয়োগ করুন',
      clear: 'সাফ করুন',
      export: 'রপ্তানি',
      loading: 'লোড হচ্ছে...',
      error: 'অ্যানালিটিক্স লোড করতে সমস্যা',
      retry: 'পুনরায় চেষ্টা করুন',
      
      // Date Range
      startDate: 'শুরু তারিখ',
      endDate: 'শেষ তারিখ',
      
      // Overview
      overview: 'ওভারভিউ',
      cartActivity: 'কার্ট অ্যাক্টিভিটি',
      wishlistActivity: 'উইশলিস্ট অ্যাক্টিভিটি',
      moveOperations: 'মুভ অপারেশন',
      syncStats: 'সিঙ্ক পরিসংখ্যান',
      
      // Stats
      totalAdds: 'মোট যোগ',
      totalRemoves: 'মোট অপসারণ',
      totalViews: 'মোট ভিউ',
      cartToWishlist: 'কার্ট থেকে উইশলিস্ট',
      wishlistToCart: 'উইশলিস্ট থেকে কার্ট',
      totalSyncs: 'মোট সিঙ্ক',
      successfulSyncs: 'সফল সিঙ্ক',
      failedSyncs: 'ব্যর্থ সিঙ্ক',
      
      // Charts
      activityTrend: 'অ্যাক্টিভিটি ট্রেন্ড',
      conversionFunnel: 'রূপান্তর ফানেল',
      abandonmentRate: 'পরিত্যাগ হার',
      movePatterns: 'মুভ প্যাটার্ন',
      
      // Funnel
      views: 'ভিউ',
      cartAdds: 'কার্ট যোগ',
      wishlistAdds: 'উইশলিস্ট যোগ',
      cartToWishlistMoves: 'কার্ট থেকে উইশলিস্ট মুভ',
      wishlistToCartMoves: 'উইশলিস্ট থেকে কার্ট মুভ',
      checkouts: 'চেকআউট',
      
      // Empty state
      noData: 'কোন ডেটা উপলব্ধ',
    }
  };

  const t = translations[language];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-gray-600 mt-1">{t.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              fetchSystemAnalytics();
              fetchBehaviorAnalytics();
              fetchConversionAnalytics();
              fetchAbandonmentAnalytics();
            }}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {t.refresh}
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            {t.filters}
          </button>
          <button
            onClick={() => handleExport('json')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            {t.export}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="h-5 w-5 text-red-400">!</div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-red-700">{t.error}: {error}</p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => {
                  clearError();
                  fetchSystemAnalytics();
                  fetchBehaviorAnalytics();
                  fetchConversionAnalytics();
                  fetchAbandonmentAnalytics();
                }}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                {t.retry}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.startDate}
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.endDate}
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleFilter}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t.apply}
              </button>
              <button
                onClick={handleClearFilters}
                className="flex-1 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t.clear}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      {analytics.systemAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t.cartActivity}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {analytics.systemAnalytics.cartActivity.totalAdds}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {t.totalAdds}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t.wishlistActivity}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {analytics.systemAnalytics.wishlistActivity.totalAdds}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {t.totalAdds}
                </p>
              </div>
              <div className="p-3 bg-pink-100 rounded-lg">
                <Heart className="h-6 w-6 text-pink-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t.moveOperations}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {analytics.systemAnalytics.moveOperations.total}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {t.cartToWishlist}: {analytics.systemAnalytics.moveOperations.cartToWishlist}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t.syncStats}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {analytics.systemAnalytics.syncStats.totalSyncs}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {t.successfulSyncs}: {analytics.systemAnalytics.syncStats.successfulSyncs}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <RefreshCw className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Trend Chart */}
      {analytics.systemAnalytics && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.activityTrend}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { name: 'Cart Adds', cart: analytics.systemAnalytics.cartActivity.totalAdds, wishlist: 0 },
              { name: 'Wishlist Adds', cart: 0, wishlist: analytics.systemAnalytics.wishlistActivity.totalAdds },
              { name: 'Cart Removes', cart: analytics.systemAnalytics.cartActivity.totalRemoves, wishlist: 0 },
              { name: 'Wishlist Removes', cart: 0, wishlist: analytics.systemAnalytics.wishlistActivity.totalRemoves },
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cart" fill="#3b82f6" name="Cart" />
              <Bar dataKey="wishlist" fill="#ec4899" name="Wishlist" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Conversion Funnel Chart */}
      {analytics.conversionAnalytics && analytics.conversionAnalytics.funnel ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.conversionFunnel}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={[
              { name: t.views, value: analytics.conversionAnalytics.funnel.views },
              { name: t.cartAdds, value: analytics.conversionAnalytics.funnel.cartAdds },
              { name: t.wishlistAdds, value: analytics.conversionAnalytics.funnel.wishlistAdds },
              { name: t.cartToWishlistMoves, value: analytics.conversionAnalytics.funnel.cartToWishlistMoves },
              { name: t.wishlistToCartMoves, value: analytics.conversionAnalytics.funnel.wishlistToCartMoves },
              { name: t.checkouts, value: analytics.conversionAnalytics.funnel.checkouts },
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">Conversion funnel data not available</p>
        </div>
      )}

      {/* Move Patterns Pie Chart */}
      {analytics.behaviorAnalytics && analytics.behaviorAnalytics.movePatterns ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.movePatterns}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: t.cartToWishlist, value: analytics.behaviorAnalytics.movePatterns.cartToWishlist },
                  { name: t.wishlistToCart, value: analytics.behaviorAnalytics.movePatterns.wishlistToCart },
                  { name: 'Cart → Wishlist → Cart', value: analytics.behaviorAnalytics.movePatterns.cartToWishlistToCart },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Tooltip />
                <Legend />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">Move patterns data not available</p>
        </div>
      )}

      {/* Abandonment Rate Chart */}
      {analytics.abandonmentAnalytics && analytics.abandonmentAnalytics.cartAbandonment && analytics.abandonmentAnalytics.wishlistAbandonment ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.abandonmentRate}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { name: 'Cart Abandonment', rate: analytics.abandonmentAnalytics.cartAbandonment.abandonmentRate * 100 },
              { name: 'Wishlist Abandonment', rate: analytics.abandonmentAnalytics.wishlistAbandonment.abandonmentRate * 100 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: any) => `${Number(value).toFixed(1)}%`} />
              <Bar dataKey="rate" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">Abandonment rate data not available</p>
        </div>
      )}
    </div>
  );
};

export default withAuth(CartWishlistAnalytics, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/unauthorized',
});
