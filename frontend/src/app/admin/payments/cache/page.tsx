'use client';

import React, { useState, useEffect } from 'react';
import { withAuth } from '@/components/auth/withAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Database,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  Zap,
  TrendingUp
} from 'lucide-react';

interface CacheEntry {
  id: string;
  cache_key: string;
  cached_response: any;
  expires_at: string;
  created_at: string;
  access_count?: number;
  last_accessed_at?: string;
}

interface CacheStatistics {
  totalEntries: number;
  hitRate: number;
  missRate: number;
  memoryUsage: number;
  averageEntrySize: number;
  byKeyPattern: {
    [key: string]: number;
  };
  oldestEntry?: string;
  newestEntry?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

const formatCurrency = (amount: number): string => {
  if (isNaN(amount) || !isFinite(amount)) return 'N/A';
  return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

function PaymentCacheManagementPage() {
  const [cacheEntries, setCacheEntries] = useState<CacheEntry[]>([]);
  const [cacheStatistics, setCacheStatistics] = useState<CacheStatistics | null>(null);
  const [filters, setFilters] = useState({
    pattern: '',
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchCacheStatistics();
    fetchCacheEntries();
  }, [page]);

  const fetchCacheStatistics = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/payments/cache/statistics`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCacheStatistics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch cache statistics:', error);
    }
  };

  const fetchCacheEntries = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters.pattern && { pattern: filters.pattern }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });

      const response = await fetch(`${API_BASE}/admin/payments/cache/entries?${queryParams}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setCacheEntries(data.data);
        setTotalPages(Math.ceil(data.total / limit) || 1);
      }
    } catch (error) {
      console.error('Failed to fetch cache entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvalidateCache = async (cacheKey: string) => {
    try {
      const response = await fetch(`${API_BASE}/admin/payments/cache/${encodeURIComponent(cacheKey)}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        fetchCacheStatistics();
        fetchCacheEntries();
      }
    } catch (error) {
      console.error('Failed to invalidate cache:', error);
    }
  };

  const handleInvalidateByPattern = async () => {
    if (!filters.pattern) {
      alert('Please enter a cache key pattern');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/payments/cache/pattern/${encodeURIComponent(filters.pattern)}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        fetchCacheStatistics();
        fetchCacheEntries();
      }
    } catch (error) {
      console.error('Failed to invalidate cache by pattern:', error);
    }
  };

  const handleClearExpired = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/payments/cache/clear-expired`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        fetchCacheStatistics();
        fetchCacheEntries();
      }
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
    }
  };

  const handleWarmCache = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/payments/cache/warm`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        fetchCacheStatistics();
        fetchCacheEntries();
      }
    } catch (error) {
      console.error('Failed to warm cache:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    Promise.all([
      fetchCacheStatistics(),
      fetchCacheEntries()
    ]).finally(() => {
      setRefreshing(false);
    });
  };

  const handleExportToCSV = () => {
    const headers = ['ID', 'Cache Key', 'Expires At', 'Created At', 'Access Count', 'Last Accessed'];
    const csvContent = [
      headers.join(','),
      ...cacheEntries.map(entry => [
        entry.id,
        entry.cache_key,
        new Date(entry.expires_at).toISOString(),
        new Date(entry.created_at).toISOString(),
        entry.access_count || 0,
        entry.last_accessed_at ? new Date(entry.last_accessed_at).toISOString() : 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-cache-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getKeyPattern = (cacheKey: string): string => {
    if (cacheKey.startsWith('gateway_config:')) return 'Gateway Config';
    if (cacheKey.startsWith('user_payment_methods:')) return 'User Payment Methods';
    if (cacheKey.startsWith('payment_method_availability:')) return 'Payment Method Availability';
    if (cacheKey.startsWith('payment_response:')) return 'Payment Response';
    return 'Other';
  };

  const getPatternBadge = (pattern: string): string => {
    switch (pattern) {
      case 'Gateway Config':
        return 'bg-purple-100 text-purple-800';
      case 'User Payment Methods':
        return 'bg-blue-100 text-blue-800';
      case 'Payment Method Availability':
        return 'bg-green-100 text-green-800';
      case 'Payment Response':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isExpired = (expiresAt: string): boolean => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <AdminLayout title="Payment Cache Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Cache Management</h1>
            <p className="text-gray-600 mt-1">Monitor and manage payment cache entries</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
              {refreshing && <Loader2 className="w-4 h-4 animate-spin" />}
            </button>
            <button
              onClick={handleExportToCSV}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export to CSV
            </button>
          </div>
        </div>

        {/* Page Description */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Monitor and manage payment cache entries. View cache statistics, invalidate cache entries, clear expired entries,
            and warm cache with frequently accessed data. Caching improves payment processing performance by storing frequently accessed data.
          </p>
        </div>

        {/* Statistics Cards */}
        {cacheStatistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Entries</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{cacheStatistics.totalEntries}</p>
                  <p className="text-xs text-gray-500 mt-2">All cache entries</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Database className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Hit Rate</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{cacheStatistics.hitRate.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500 mt-2">Cache effectiveness</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Memory Usage</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{(cacheStatistics.memoryUsage / 1024 / 1024).toFixed(2)} MB</p>
                  <p className="text-xs text-gray-500 mt-2">Total cache memory</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Database className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Entry Size</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">{(cacheStatistics.averageEntrySize / 1024).toFixed(2)} KB</p>
                  <p className="text-xs text-gray-500 mt-2">Per entry size</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Database className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* By Key Pattern Statistics */}
        {cacheStatistics && cacheStatistics.byKeyPattern && Object.keys(cacheStatistics.byKeyPattern).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">By Key Pattern</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(cacheStatistics.byKeyPattern).map(([pattern, count]) => (
                <div key={pattern} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{pattern}</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters & Actions</h2>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="pattern" className="block text-sm font-medium text-gray-700 mb-1">Cache Key Pattern</label>
              <input
                id="pattern"
                type="text"
                value={filters.pattern}
                onChange={(e) => setFilters({ ...filters, pattern: e.target.value })}
                placeholder="e.g., gateway_config, user_payment_methods"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1">
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1">
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchCacheEntries}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Apply Filters
              </button>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters({ pattern: '', startDate: '', endDate: '' });
                  setPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleInvalidateByPattern}
              disabled={!filters.pattern}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Invalidate by Pattern
            </button>
            <button
              onClick={handleClearExpired}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors inline-flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear Expired
            </button>
            <button
              onClick={handleWarmCache}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Warm Cache
            </button>
          </div>
        </div>

        {/* Cache Entries Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cache Entries</h2>
          <p className="text-gray-600 mb-4">
            {loading ? 'Loading...' : `Showing ${(page - 1) * limit + 1} to ${Math.min(page * limit, cacheEntries.length)} of ${cacheEntries.length} entries`}
          </p>

          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading cache entries...</p>
            </div>
          ) : cacheEntries.length === 0 ? (
            <div className="text-center py-8">
              <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No cache entries found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cache Key</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pattern</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires At</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Access Count</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Accessed</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cacheEntries.map((entry) => (
                      <tr key={entry.id} className={isExpired(entry.expires_at) ? 'bg-red-50' : 'hover:bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {entry.id.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={entry.cache_key}>
                          {entry.cache_key}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPatternBadge(getKeyPattern(entry.cache_key))}`}>
                            {getKeyPattern(entry.cache_key)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDateTime(entry.expires_at)}
                          {isExpired(entry.expires_at) && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Expired
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDateTime(entry.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.access_count || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.last_accessed_at ? formatDateTime(entry.last_accessed_at) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button
                            onClick={() => handleInvalidateCache(entry.cache_key)}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors inline-flex items-center gap-1 text-xs"
                          >
                            <Trash2 className="w-3 h-3" />
                            Invalidate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, cacheEntries.length)} of {cacheEntries.length} entries
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    <span className="px-3 py-1 bg-blue-600 text-white rounded-lg">
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAuth(PaymentCacheManagementPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
