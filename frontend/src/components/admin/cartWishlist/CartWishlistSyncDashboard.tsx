'use client';

import React, { useEffect, useState } from 'react';
import {
  RefreshCw,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Filter,
  Download,
} from 'lucide-react';
import { useAdminCartWishlistStore } from '@/store/adminCartWishlistStore';
import { withAuth } from '@/components/auth/withAuth';

interface CartWishlistSyncDashboardProps {
  language?: 'en' | 'bn';
}

const CartWishlistSyncDashboard: React.FC<CartWishlistSyncDashboardProps> = ({ language = 'en' }) => {
  const {
    syncStatus,
    isLoading,
    error,
    fetchSyncStatus,
    fetchRecentSyncs,
    clearError,
  } = useAdminCartWishlistStore();

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchSyncStatus();
    fetchRecentSyncs({ limit: 10 });

    // Set up auto-refresh
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchSyncStatus();
        fetchRecentSyncs({ limit: 10 });
      }, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh]);

  const handleRefresh = () => {
    fetchSyncStatus();
    fetchRecentSyncs({ limit: 10 });
  };

  const handleExport = async () => {
    // Export sync data
    const data = JSON.stringify(syncStatus, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sync_dashboard_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'syncing':
      case 'active':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const translations = {
    en: {
      title: 'Cart-Wishlist Sync Dashboard',
      subtitle: 'Monitor synchronization across all users',
      refresh: 'Refresh',
      autoRefresh: 'Auto Refresh',
      export: 'Export',
      loading: 'Loading...',
      error: 'Error loading sync data',
      retry: 'Retry',
      
      // Stats
      totalSyncs: 'Total Syncs',
      activeSyncs: 'Active Syncs',
      completedSyncs: 'Completed Syncs',
      failedSyncs: 'Failed Syncs',
      averageSyncTime: 'Average Sync Time',
      successRate: 'Success Rate',
      
      // Recent Syncs
      recentSyncs: 'Recent Syncs',
      user: 'User',
      status: 'Status',
      lastSync: 'Last Sync',
      errorMessage: 'Error Message',
      
      // Status
      completed: 'Completed',
      failed: 'Failed',
      syncing: 'Syncing',
      active: 'Active',
      pending: 'Pending',
      
      // Empty state
      noSyncs: 'No syncs found',
    },
    bn: {
      title: 'কার্ট-উইশলিস্ট সিঙ্ক ড্যাশবোর্ড',
      subtitle: 'সকল ব্যবহারকারীর জন্য সিঙ্ক্রোনাইজেশন মনিটর করুন',
      refresh: 'রিফ্রেশ',
      autoRefresh: 'অটো রিফ্রেশ',
      export: 'রপ্তানি',
      loading: 'লোড হচ্ছে...',
      error: 'সিঙ্ক ডেটা লোড করতে সমস্যা',
      retry: 'পুনরায় চেষ্টা করুন',
      
      // Stats
      totalSyncs: 'মোট সিঙ্ক',
      activeSyncs: 'সক্রিয় সিঙ্ক',
      completedSyncs: 'সম্পন্ন সিঙ্ক',
      failedSyncs: 'ব্যর্থ সিঙ্ক',
      averageSyncTime: 'গড় সিঙ্ক সময়',
      successRate: 'সাফল্যতা হার',
      
      // Recent Syncs
      recentSyncs: 'সাম্প্রতিক সিঙ্ক',
      user: 'ব্যবহারকারী',
      status: 'স্ট্যাটাস',
      lastSync: 'শেষ সিঙ্ক',
      errorMessage: 'ত্রুটি বার্তা',
      
      // Status
      completed: 'সম্পন্ন',
      failed: 'ব্যর্থ',
      syncing: 'সিঙ্ক হচ্ছে',
      active: 'সক্রিয়',
      pending: 'মুলতুবি',
      
      // Empty state
      noSyncs: 'কোন সিঙ্ক পাওয়া যায়নি',
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
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              autoRefresh
                ? 'bg-green-50 border-green-300 text-green-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Activity className="w-4 h-4" />
            {t.autoRefresh}
          </button>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {t.refresh}
          </button>
          <button
            onClick={handleExport}
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
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-red-700">{t.error}: {error}</p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => {
                  clearError();
                  handleRefresh();
                }}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                {t.retry}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {syncStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t.totalSyncs}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {syncStatus.totalSyncs}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t.activeSyncs}</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {syncStatus.activeSyncs}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <RefreshCw className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t.completedSyncs}</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {syncStatus.completedSyncs}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t.failedSyncs}</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {syncStatus.failedSyncs}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {syncStatus?.performanceMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t.averageSyncTime}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {syncStatus.performanceMetrics.averageSyncTime.toFixed(2)}s
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t.successRate}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {(syncStatus.performanceMetrics.successRate * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Syncs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t.recentSyncs}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[800px] divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.user}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.status}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.lastSync}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.errorMessage}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    {t.loading}
                  </td>
                </tr>
              ) : !syncStatus?.recentSyncs || syncStatus.recentSyncs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    {t.noSyncs}
                  </td>
                </tr>
              ) : (
                syncStatus.recentSyncs.map((sync, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sync.userName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sync.status)}`}>
                        {sync.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(sync.lastSyncAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {sync.errorMessage || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default withAuth(CartWishlistSyncDashboard, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/unauthorized',
});
