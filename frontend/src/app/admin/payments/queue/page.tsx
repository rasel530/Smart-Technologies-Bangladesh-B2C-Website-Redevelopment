'use client';

import React, { useState, useEffect } from 'react';
import { withAuth } from '@/components/auth/withAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  XCircle,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';

interface QueueItem {
  id: string;
  transaction_id: string;
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  attempts: number;
  max_attempts: number;
  created_at: string;
  next_attempt_at: string;
  last_attempt_at: string;
  error_messages: string[];
}

interface QueueStatus {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
  averageWaitTime: number;
  processingRate: number;
}

interface QueueStatistics {
  totalItems: number;
  byStatus: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    cancelled: number;
  };
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
  averageWaitTime: number;
  averageProcessingTime: number;
  successRate: number;
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

function PaymentQueueManagementPage() {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [queueStatistics, setQueueStatistics] = useState<QueueStatistics | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchQueueStatus();
    fetchQueueStatistics();
    fetchQueueItems();
  }, [page]);

  const fetchQueueStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/payments/queue/status`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setQueueStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch queue status:', error);
    }
  };

  const fetchQueueStatistics = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/payments/queue/statistics`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setQueueStatistics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch queue statistics:', error);
    }
  };

  const fetchQueueItems = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });

      const response = await fetch(`${API_BASE}/admin/payments/queue/items?${queryParams}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setQueueItems(data.data);
        setTotalPages(Math.ceil(data.total / limit) || 1);
      }
    } catch (error) {
      console.error('Failed to fetch queue items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/admin/payments/queue/${id}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        fetchQueueItems();
      }
    } catch (error) {
      console.error('Failed to retry payment:', error);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/admin/payments/queue/${id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        fetchQueueItems();
      }
    } catch (error) {
      console.error('Failed to cancel payment:', error);
    }
  };

  const handleProcessQueue = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/payments/queue/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        fetchQueueStatus();
        fetchQueueStatistics();
      }
    } catch (error) {
      console.error('Failed to process queue:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    Promise.all([
      fetchQueueStatus(),
      fetchQueueStatistics(),
      fetchQueueItems()
    ]).finally(() => {
      setRefreshing(false);
    });
  };

  const handleExportToCSV = () => {
    const headers = ['ID', 'Transaction ID', 'Priority', 'Status', 'Attempts', 'Created At', 'Next Attempt At', 'Last Attempt At', 'Error Messages'];
    const csvContent = [
      headers.join(','),
      ...queueItems.map(item => [
        item.id,
        item.transaction_id,
        item.priority,
        item.status,
        item.attempts,
        new Date(item.created_at).toISOString(),
        new Date(item.next_attempt_at).toISOString(),
        new Date(item.last_attempt_at).toISOString(),
        item.error_messages.join('; ')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-queue-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Pending', icon: Clock },
      processing: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Processing', icon: RefreshCw },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed', icon: CheckCircle },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed', icon: XCircle },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled', icon: XCircle }
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const getPriorityBadge = (priority: number) => {
    if (priority >= 5) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">High</span>;
    } else if (priority >= 3) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Medium</span>;
    } else {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Low</span>;
    }
  };

  return (
    <AdminLayout title="Payment Queue Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Queue Management</h1>
            <p className="text-gray-600 mt-1">Monitor and manage payment processing queue</p>
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
            Monitor and manage the payment processing queue. View queue status, retry failed payments, cancel queued payments,
            and manually trigger queue processing. The queue processes payments based on priority and uses exponential backoff for retries.
          </p>
        </div>

        {/* Status Cards */}
        {queueStatus && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{queueStatus.total}</p>
                  <p className="text-xs text-gray-500 mt-2">All queue items</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{queueStatus.pending}</p>
                  <p className="text-xs text-gray-500 mt-2">Awaiting processing</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Processing</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{queueStatus.processing}</p>
                  <p className="text-xs text-gray-500 mt-2">Currently processing</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <RefreshCw className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{queueStatus.completed}</p>
                  <p className="text-xs text-gray-500 mt-2">Successfully processed</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{queueStatus.failed}</p>
                  <p className="text-xs text-gray-500 mt-2">Processing errors</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        {queueStatistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Queue Statistics</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold">{queueStatistics.totalItems}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Average Wait Time</p>
                  <p className="text-2xl font-bold">{queueStatistics.averageWaitTime.toFixed(2)}s</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Average Processing Time</p>
                  <p className="text-2xl font-bold">{queueStatistics.averageProcessingTime.toFixed(2)}s</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">{queueStatistics.successRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">By Status</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="font-bold">{queueStatistics.byStatus.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Processing</span>
                  <span className="font-bold">{queueStatistics.byStatus.processing}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="font-bold text-green-600">{queueStatistics.byStatus.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Failed</span>
                  <span className="font-bold text-red-600">{queueStatistics.byStatus.failed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Cancelled</span>
                  <span className="font-bold">{queueStatistics.byStatus.cancelled}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">By Priority</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">High (5+)</span>
                  <span className="font-bold">{queueStatistics.byPriority.high}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Medium (3-4)</span>
                  <span className="font-bold">{queueStatistics.byPriority.medium}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Low (1-2)</span>
                  <span className="font-bold">{queueStatistics.byPriority.low}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters & Actions</h2>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                id="priority"
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All priorities</option>
                <option value="5">High</option>
                <option value="3">Medium</option>
                <option value="1">Low</option>
              </select>
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
                onClick={fetchQueueItems}
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
                  setFilters({ status: '', priority: '', startDate: '', endDate: '' });
                  setPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleProcessQueue}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Process Queue
            </button>
          </div>
        </div>

        {/* Queue Items Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Queue Items</h2>
          <p className="text-gray-600 mb-4">
            {loading ? 'Loading...' : `Showing ${(page - 1) * limit + 1} to ${Math.min(page * limit, queueItems.length)} of ${queueItems.length} items`}
          </p>

          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading queue items...</p>
            </div>
          ) : queueItems.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No queue items found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attempts</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Attempt</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Attempt</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {queueItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {item.id.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.transaction_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getPriorityBadge(item.priority)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status).bg} ${getStatusBadge(item.status).text}`}>
                            {getStatusBadge(item.status).label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.attempts} / {item.max_attempts}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDateTime(item.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDateTime(item.next_attempt_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDateTime(item.last_attempt_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRetry(item.id)}
                              disabled={item.status === 'processing' || item.status === 'completed'}
                              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1 text-xs"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Retry
                            </button>
                            <button
                              onClick={() => handleCancel(item.id)}
                              disabled={item.status === 'processing' || item.status === 'completed'}
                              className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1 text-xs"
                            >
                              <XCircle className="w-3 h-3" />
                              Cancel
                            </button>
                          </div>
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
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, queueItems.length)} of {queueItems.length} entries
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

export default withAuth(PaymentQueueManagementPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
