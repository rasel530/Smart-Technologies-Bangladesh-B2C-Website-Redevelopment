'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, TrendingUp, Activity, Download, RefreshCw, Clock, Wifi, WifiOff } from 'lucide-react';
import { withAuth } from '@/components/auth/withAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatsGrid, Badge, ButtonPrimary } from '@/components/design-system';
import { apiClient } from '@/lib/api/client';

interface MobileAnalytics {
  totalUsers: number;
  activeUsers: number;
  offlineUsers: number;
  totalCarts: number;
  syncedCarts: number;
  pendingSync: number;
  averageSyncTime: number;
  platformBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  recentActivity: {
    id: string;
    userId: string;
    deviceId: string;
    platform: string;
    action: string;
    timestamp: string;
  }[];
  performanceMetrics: {
    averageLoadTime: number;
    averageSyncTime: number;
    successRate: number;
    errorRate: number;
  };
}

function MobileAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<MobileAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  
  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
 
      // Fetch analytics and performance metrics
      const [analyticsResponse, performanceResponse] = await Promise.all([
        apiClient.get<{ data: MobileAnalytics }>('/admin/mobile/analytics'),
        apiClient.get<{ data: any }>('/admin/mobile/performance'),
      ]);
 
      const analyticsData: Partial<MobileAnalytics> = analyticsResponse.data || {};
      const performanceData = performanceResponse.data || {};

      setAnalytics({
        totalUsers: analyticsData.totalUsers ?? 0,
        activeUsers: analyticsData.activeUsers ?? 0,
        offlineUsers: analyticsData.offlineUsers ?? 0,
        totalCarts: analyticsData.totalCarts ?? 0,
        syncedCarts: analyticsData.syncedCarts ?? 0,
        pendingSync: analyticsData.pendingSync ?? 0,
        averageSyncTime: analyticsData.averageSyncTime ?? 0,
        platformBreakdown: analyticsData.platformBreakdown ?? { mobile: 0, desktop: 0, tablet: 0 },
        recentActivity: analyticsData.recentActivity ?? [],
        performanceMetrics: performanceData.performanceMetrics ?? analyticsData.performanceMetrics ?? {
          averageLoadTime: 0,
          averageSyncTime: 0,
          successRate: 0,
          errorRate: 0,
        },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch mobile analytics');
    } finally {
      setIsLoading(false);
    }
  };
 
  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);
 
  const handleRefresh = () => {
    fetchAnalytics();
  };
 
  const handleExport = async () => {
    try {
      // Use native fetch for blob download since apiClient doesn't support responseType
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/admin/mobile/analytics/export`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export analytics');
      }

      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `mobile-analytics-${selectedPeriod}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError(err.message || 'Failed to export analytics');
    }
  };
 
  if (!analytics) {
    return (
      <AdminLayout title="Mobile Analytics">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading analytics...</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        ) : null}
      </AdminLayout>
    );
  }
 
  const statsData = [
    {
      title: 'Total Mobile Users',
      value: (analytics.totalUsers ?? 0).toLocaleString(),
      icon: <Smartphone className="w-6 h-6 text-primary-600" />,
      color: 'primary' as const,
    },
    {
      title: 'Active Users',
      value: (analytics.activeUsers ?? 0).toLocaleString(),
      icon: <Activity className="w-6 h-6 text-green-600" />,
      color: 'success' as const,
    },
    {
      title: 'Offline Users',
      value: (analytics.offlineUsers ?? 0).toLocaleString(),
      icon: <WifiOff className="w-6 h-6 text-orange-600" />,
      color: 'warning' as const,
    },
    {
      title: 'Pending Sync',
      value: (analytics.pendingSync ?? 0).toLocaleString(),
      icon: <Clock className="w-6 h-6 text-red-600" />,
      color: 'danger' as const,
    },
  ];
 
  const syncStatsData = [
    {
      title: 'Total Carts',
      value: (analytics.totalCarts ?? 0).toLocaleString(),
      icon: <Activity className="w-6 h-6 text-blue-600" />,
      color: 'primary' as const,
    },
    {
      title: 'Synced Carts',
      value: (analytics.syncedCarts ?? 0).toLocaleString(),
      icon: <Wifi className="w-6 h-6 text-green-600" />,
      color: 'success' as const,
    },
    {
      title: 'Avg Sync Time',
      value: `${(analytics.averageSyncTime ?? 0).toFixed(2)}s`,
      icon: <Clock className="w-6 h-6 text-purple-600" />,
      color: 'primary' as const,
    },
    {
      title: 'Sync Success Rate',
      value: `${analytics.performanceMetrics?.successRate?.toFixed(1) || 0}%`,
      icon: <TrendingUp className="w-6 h-6 text-green-600" />,
      color: 'success' as const,
    },
  ];
 
  return (
    <AdminLayout title="Mobile Analytics">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}
 
      {/* Period Selector */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex gap-2">
          {['24h', '7d', '30d', '90d'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period === '24h' ? 'Last 24 Hours' : 
               period === '7d' ? 'Last 7 Days' :
               period === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
            </button>
          ))}
        </div>
      </div>
 
      {/* User Statistics */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Statistics</h3>
        <StatsGrid stats={statsData} columns={4} />
      </div>
 
      {/* Section Divider */}
      <div className="border-t border-neutral-200 my-8"></div>
 
      {/* Sync Statistics */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Statistics</h3>
        <StatsGrid stats={syncStatsData} columns={4} />
      </div>
 
      {/* Section Divider */}
      <div className="border-t border-neutral-200 my-8"></div>
 
      {/* Platform Breakdown */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Platform Breakdown</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Mobile</span>
              <Smartphone className="w-5 h-5 text-primary-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {analytics.platformBreakdown?.mobile?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {analytics.totalUsers > 0
                ? ((analytics.platformBreakdown?.mobile || 0) / analytics.totalUsers * 100).toFixed(1)
                : 0}% of users
            </div>
          </div>
 
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Desktop</span>
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {analytics.platformBreakdown?.desktop?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {analytics.totalUsers > 0
                ? ((analytics.platformBreakdown?.desktop || 0) / analytics.totalUsers * 100).toFixed(1)
                : 0}% of users
            </div>
          </div>
 
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Tablet</span>
              <Smartphone className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {analytics.platformBreakdown?.tablet?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {analytics.totalUsers > 0
                ? ((analytics.platformBreakdown?.tablet || 0) / analytics.totalUsers * 100).toFixed(1)
                : 0}% of users
            </div>
          </div>
        </div>
      </div>
 
      {/* Performance Metrics */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Metrics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Average Load Time</p>
            <p className="text-xl font-bold text-blue-900">
              {(analytics.performanceMetrics?.averageLoadTime ?? 0).toFixed(2)}s
            </p>
          </div>
 
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Average Sync Time</p>
            <p className="text-xl font-bold text-green-900">
              {(analytics.performanceMetrics?.averageSyncTime ?? 0).toFixed(2)}s
            </p>
          </div>
 
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Success Rate</p>
            <p className="text-xl font-bold text-purple-900">
              {(analytics.performanceMetrics?.successRate ?? 0).toFixed(1)}%
            </p>
          </div>
 
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Error Rate</p>
            <p className="text-xl font-bold text-red-900">
              {(analytics.performanceMetrics?.errorRate ?? 0).toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
 
      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading activity...</div>
          ) : analytics.recentActivity && analytics.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {analytics.recentActivity.slice(0, 10).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <Smartphone className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {activity.action}
                      </p>
                      <p className="text-xs text-gray-500">
                        Device: {activity.deviceId} • Platform: {activity.platform}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No recent activity</div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
 
export default withAuth(MobileAnalyticsDashboard, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/unauthorized'
});
