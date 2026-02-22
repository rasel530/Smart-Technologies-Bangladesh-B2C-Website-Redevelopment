'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  ShoppingCart, 
  DollarSign, 
  Package, 
  Clock, 
  RefreshCw,
  AlertTriangle,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import {
  getCartAnalyticsDashboard,
  getRealtimeAnalytics,
  type DashboardData,
  type RealtimeAnalytics
} from '@/lib/api/cartAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ConversionFunnelChart from './ConversionFunnelChart';
import AbandonmentMetrics from './AbandonmentMetrics';
import CartEventsTable from './CartEventsTable';
import OptimizationRecommendations from './OptimizationRecommendations';

interface CartAnalyticsDashboardProps {
  language?: 'en' | 'bn';
}

const CartAnalyticsDashboard: React.FC<CartAnalyticsDashboardProps> = ({ language = 'en' }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [realtimeData, setRealtimeData] = useState<RealtimeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [realtimeLoading, setRealtimeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCartAnalyticsDashboard();
      setDashboardData(data);
    } catch (error: any) {
      console.error('[CartAnalyticsDashboard] Error fetching dashboard:', error);
      setError(error?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRealtimeData = useCallback(async () => {
    setRealtimeLoading(true);
    try {
      const data = await getRealtimeAnalytics();
      setRealtimeData(data);
    } catch (error: any) {
      console.error('[CartAnalyticsDashboard] Error fetching realtime data:', error);
    } finally {
      setRealtimeLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchRealtimeData();
  }, [fetchDashboardData, fetchRealtimeData]);

  // Auto-refresh realtime data every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchRealtimeData();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchRealtimeData]);

  const formatPrice = (price: number): string => {
    if (typeof price !== 'number' || isNaN(price)) return '৳0.00';
    return `৳${price.toFixed(2)}`;
  };

  const formatPercent = (value: number): string => {
    if (typeof value !== 'number' || isNaN(value)) return '0.00%';
    return `${value.toFixed(2)}%`;
  };

  const translations = {
    en: {
      title: 'Cart Analytics Dashboard',
      subtitle: 'Real-time insights into cart performance and user behavior',
      refresh: 'Refresh',
      autoRefresh: 'Auto Refresh',
      loading: 'Loading dashboard...',
      error: 'Error loading dashboard',
      retry: 'Retry',
      overview: 'Overview',
      totalCarts: 'Total Carts',
      activeCarts: 'Active Carts',
      abandonedCarts: 'Abandoned Carts',
      convertedCarts: 'Converted Carts',
      abandonmentRate: 'Abandonment Rate',
      conversionRate: 'Conversion Rate',
      averageOrderValue: 'Average Order Value',
      realtimeStats: 'Real-time Statistics',
      activeNow: 'Active Now',
      eventsLastHour: 'Events (Last Hour)',
      checkoutsToday: 'Checkouts Today',
      cartsCreatedToday: 'Carts Created Today',
      conversionFunnel: 'Conversion Funnel',
      abandonmentAnalysis: 'Abandonment Analysis',
      recentEvents: 'Recent Events',
      optimization: 'Optimization Recommendations',
      viewAll: 'View All',
      lastUpdated: 'Last updated',
      highPriority: 'High Priority',
      mediumPriority: 'Medium Priority',
      lowPriority: 'Low Priority'
    },
    bn: {
      title: 'কার্ট অ্যানালিটিক্স ড্যাশবোর্ড',
      subtitle: 'কার্ট পারফরম্যান্স এবং ব্যবহারকারী আচরণের রিয়েলটাইম অন্তর্দৃষ্টি',
      refresh: 'রিফ্রেশ',
      autoRefresh: 'স্বয়ংক্রিয় রিফ্রেশ',
      loading: 'ড্যাশবোর্ড লোড হচ্ছে...',
      error: 'ড্যাশবোর্ড লোড করতে ত্রুটি',
      retry: 'পুনরায় চেষ্টা করুন',
      overview: 'সারসংক্ষেপ',
      totalCarts: 'মোট কার্ট',
      activeCarts: 'সক্রিয় কার্ট',
      abandonedCarts: 'পরিত্যাগ কার্ট',
      convertedCarts: 'রূপান্তরিত কার্ট',
      abandonmentRate: 'পরিত্যাগ হার',
      conversionRate: 'রূপান্তর হার',
      averageOrderValue: 'গড় অর্ডার মূল্য',
      realtimeStats: 'রিয়েলটাইম পরিসংখ্যান',
      activeNow: 'বর্তমানে সক্রিয়',
      eventsLastHour: 'ইভেন্ট (গত ঘন্টা)',
      checkoutsToday: 'আজকের চেকআউট',
      cartsCreatedToday: 'আজকের কার্ট',
      conversionFunnel: 'রূপান্তর ফানেল',
      abandonmentAnalysis: 'পরিত্যাগ বিশ্লেষণ',
      recentEvents: 'সাম্প্রতিক ইভেন্ট',
      optimization: 'অপ্টিমাইজেশন সুপারিশ',
      viewAll: 'সব দেখুন',
      lastUpdated: 'সর্বশেষ আপডেট',
      highPriority: 'উচ্চ অগ্রাধিকার',
      mediumPriority: 'মাঝারি অগ্রাধিকার',
      lowPriority: 'নিম্ন অগ্রাধিকার'
    }
  };

  const t = translations[language];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex flex-col gap-4">
          <span>{error}</span>
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            {t.retry}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const summary = dashboardData?.summary;
  const recommendations = dashboardData?.recommendations;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-gray-600 mt-1">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300"
            />
            {t.autoRefresh}
          </label>
          <Button
            onClick={() => {
              fetchDashboardData();
              fetchRealtimeData();
            }}
            variant="outline"
            size="sm"
            disabled={loading || realtimeLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${realtimeLoading ? 'animate-spin' : ''}`} />
            {t.refresh}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t.totalCarts}
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalCarts?.toLocaleString() || 0}</div>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <span className="text-green-600 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                All time
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t.abandonmentRate}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(summary?.abandonmentRate || 0)}</div>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              {summary?.abandonmentRate && summary.abandonmentRate > 70 ? (
                <span className="text-red-600 flex items-center">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  High
                </span>
              ) : (
                <span className="text-green-600 flex items-center">
                  <ArrowDownRight className="w-3 h-3 mr-1" />
                  Normal
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t.conversionRate}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(summary?.conversionRate || 0)}</div>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <span className="text-blue-600">{t.convertedCarts}: {summary?.convertedCarts || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t.averageOrderValue}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(summary?.averageOrderValue || 0)}</div>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <span className="text-green-600 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                Per order
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Stats */}
      {realtimeData && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-blue-600" />
              {t.realtimeStats}
              <Badge variant="secondary" className="ml-2">
                {t.lastUpdated}: {new Date(realtimeData.timestamp).toLocaleTimeString()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{realtimeData.activeCartsNow}</div>
                <div className="text-sm text-gray-600">{t.activeNow}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{realtimeData.eventsLastHour}</div>
                <div className="text-sm text-gray-600">{t.eventsLastHour}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{realtimeData.checkoutsToday}</div>
                <div className="text-sm text-gray-600">{t.checkoutsToday}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{realtimeData.totalCartsToday}</div>
                <div className="text-sm text-gray-600">{t.cartsCreatedToday}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t.conversionFunnel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData?.conversionFunnel && (
              <ConversionFunnelChart data={dashboardData.conversionFunnel} language={language} />
            )}
          </CardContent>
        </Card>

        {/* Abandonment Metrics */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {t.abandonmentAnalysis}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData?.abandonment && (
              <AbandonmentMetrics data={dashboardData.abandonment} language={language} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t.recentEvents}
          </CardTitle>
          <Button variant="outline" size="sm">
            {t.viewAll}
          </Button>
        </CardHeader>
        <CardContent>
          {realtimeData?.recentEvents && (
            <CartEventsTable events={realtimeData.recentEvents.slice(0, 10)} language={language} />
          )}
        </CardContent>
      </Card>

      {/* Optimization Recommendations */}
      {recommendations && recommendations.totalRecommendations > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t.optimization}
              <div className="flex gap-2 ml-4">
                {recommendations.highPriority > 0 && (
                  <Badge variant="destructive">{t.highPriority}: {recommendations.highPriority}</Badge>
                )}
                {recommendations.mediumPriority > 0 && (
                  <Badge variant="default" className="bg-yellow-500">{t.mediumPriority}: {recommendations.mediumPriority}</Badge>
                )}
                {recommendations.lowPriority > 0 && (
                  <Badge variant="secondary">{t.lowPriority}: {recommendations.lowPriority}</Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OptimizationRecommendations 
              recommendations={recommendations.recommendations} 
              language={language} 
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CartAnalyticsDashboard;
