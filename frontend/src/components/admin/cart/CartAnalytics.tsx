'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, ShoppingCart, DollarSign, Package, Clock, RefreshCw } from 'lucide-react';
import adminCartApi, { type CartAnalytics } from '@/lib/api/admin/cart';

interface CartAnalyticsProps {
  language?: 'en' | 'bn';
}

const CartAnalytics: React.FC<CartAnalyticsProps> = ({ language = 'en' }) => {
  const [analytics, setAnalytics] = useState<CartAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const startDate = getDateRangeStart(dateRange);
      const response = await adminCartApi.getCartAnalytics(startDate ? { startDate } : undefined);
      setAnalytics(response);
    } catch (error: any) {
      console.error('[CartAnalytics] Error fetching analytics:', error);
      let errorMessage = 'Failed to load analytics. Please try again.';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      if (error?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error?.status === 403) {
        errorMessage = 'You do not have permission to view analytics.';
      } else if (error?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }

      setError(errorMessage);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const getDateRangeStart = (range: string): string | undefined => {
    const now = new Date();
    switch (range) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      case 'all':
      default:
        return undefined;
    }
  };

  const formatPrice = (price: number): string => {
    if (typeof price !== 'number' || isNaN(price)) {
      return '৳0.00';
    }
    return `৳${price.toFixed(2)}`;
  };

  const formatPercent = (value: number): string => {
    if (typeof value !== 'number' || isNaN(value)) {
      return '0.00%';
    }
    return `${value.toFixed(2)}%`;
  };

  const formatDecimal = (value: number): string => {
    if (typeof value !== 'number' || isNaN(value)) {
      return '0.00';
    }
    return value.toFixed(2);
  };

  const translations = {
    en: {
      title: 'Cart Analytics',
      dateRange: 'Date Range',
      last7Days: 'Last 7 Days',
      last30Days: 'Last 30 Days',
      last90Days: 'Last 90 Days',
      allTime: 'All Time',
      refresh: 'Refresh',
      loading: 'Loading analytics...',
      error: 'Error loading analytics',
      retry: 'Retry',
      overview: 'Overview',
      totalCarts: 'Total Carts',
      activeCarts: 'Active Carts',
      expiredCarts: 'Expired Carts',
      abandonedCarts: 'Abandoned Carts',
      conversionRate: 'Conversion Rate',
      averageCartValue: 'Average Cart Value',
      averageItemsPerCart: 'Average Items per Cart',
      topAbandonedProducts: 'Top Abandoned Products',
      cartSizeDistribution: 'Cart Size Distribution',
      timeInCartDistribution: 'Time in Cart Distribution',
      items: 'Items',
      carts: 'Carts',
      productName: 'Product Name',
      abandonmentCount: 'Abandonment Count',
      itemCount: 'Item Count',
      cartCount: 'Cart Count',
      timeRange: 'Time Range',
      noData: 'No data available for this period'
    },
    bn: {
      title: 'কার্ট বিশ্লেষণ',
      dateRange: 'তারিখ সীমা',
      last7Days: 'গত ৭ দিন',
      last30Days: 'গত ৩০ দিন',
      last90Days: 'গত ৯০ দিন',
      allTime: 'সব সময়',
      refresh: 'রিফ্রেশ',
      loading: 'বিশ্লেষণ লোড হচ্ছে...',
      error: 'বিশ্লেষণ লোড করতে ত্রুটি',
      retry: 'পুনরায় চেষ্টা করুন',
      overview: 'সারসংক্ষেপ',
      totalCarts: 'মোট কার্ট',
      activeCarts: 'সক্রিয় কার্ট',
      expiredCarts: 'মেয়াদোত্তীর্ণ কার্ট',
      abandonedCarts: 'পরিত্যাগ কার্ট',
      conversionRate: 'রূপান্তর হার',
      averageCartValue: 'গড় কার্ট মূল্য',
      averageItemsPerCart: 'গড় কার্টে আইটেম',
      topAbandonedProducts: 'শীর্ষ পরিত্যাগ পণ্য',
      cartSizeDistribution: 'কার্ট সাইজ বন্টন',
      timeInCartDistribution: 'কার্টে সময় বন্টন',
      items: 'আইটেম',
      carts: 'কার্ট',
      productName: 'পণ্যর নাম',
      abandonmentCount: 'পরিত্যাগ সংখ্যা',
      itemCount: 'আইটেম সংখ্যা',
      cartCount: 'কার্ট সংখ্যা',
      timeRange: 'সময় সীমা',
      noData: 'এই সময়ের জন্য কোন তথ্য নেই'
    }
  };

  const t = translations[language];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <button
          onClick={() => fetchAnalytics()}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t.refresh}
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">{t.dateRange}:</span>
          <div className="flex gap-2">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  dateRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range === '7d' && t.last7Days}
                {range === '30d' && t.last30Days}
                {range === '90d' && t.last90Days}
                {range === 'all' && t.allTime}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => fetchAnalytics()}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                {t.retry}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          {t.loading}
        </div>
      )}

      {/* Analytics Content */}
      {analytics && !loading && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Carts */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t.totalCarts}</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalCarts}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            {/* Active Carts */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t.activeCarts}</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.activeCarts}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>

            {/* Conversion Rate */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t.conversionRate}</p>
                  <p className="text-2xl font-bold text-blue-600">{formatPercent(analytics.conversionRate)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            {/* Average Cart Value */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t.averageCartValue}</p>
                  <p className="text-2xl font-bold text-purple-600">{formatPrice(analytics.averageCartValue)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Expired Carts */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t.expiredCarts}</p>
                  <p className="text-xl font-bold text-red-600">{analytics.expiredCarts}</p>
                </div>
                <Clock className="w-6 h-6 text-red-600" />
              </div>
            </div>

            {/* Abandoned Carts */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t.abandonedCarts}</p>
                  <p className="text-xl font-bold text-yellow-600">{analytics.abandonedCarts}</p>
                </div>
                <Package className="w-6 h-6 text-yellow-600" />
              </div>
            </div>

            {/* Average Items per Cart */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t.averageItemsPerCart}</p>
                  <p className="text-xl font-bold text-gray-900">{formatDecimal(analytics.averageItemsPerCart)}</p>
                </div>
                <Package className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          {/* Top Abandoned Products */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{t.topAbandonedProducts}</h2>
            </div>
            {analytics.topAbandonedProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">{t.noData}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[600px] divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.productName}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.abandonmentCount}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.topAbandonedProducts.map((product, index) => (
                      <tr key={product.productId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}. {product.productName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.abandonmentCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Cart Size Distribution */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{t.cartSizeDistribution}</h2>
            </div>
            {analytics.cartSizeDistribution.length === 0 ? (
              <div className="p-8 text-center text-gray-500">{t.noData}</div>
            ) : (
              <div className="p-6">
                <div className="space-y-4">
                  {analytics.cartSizeDistribution.map((item) => (
                    <div key={item.itemCount} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">{item.itemCount} {t.items}</span>
                        <span className="text-gray-900 font-medium">{item.cartCount} {t.carts}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(item.cartCount / analytics.totalCarts) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Time in Cart Distribution */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{t.timeInCartDistribution}</h2>
            </div>
            {analytics.timeInCartDistribution.length === 0 ? (
              <div className="p-8 text-center text-gray-500">{t.noData}</div>
            ) : (
              <div className="p-6">
                <div className="space-y-4">
                  {analytics.timeInCartDistribution.map((item) => (
                    <div key={item.timeRange} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">{item.timeRange}</span>
                        <span className="text-gray-900 font-medium">{item.cartCount} {t.carts}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{
                            width: `${(item.cartCount / analytics.totalCarts) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CartAnalytics;
