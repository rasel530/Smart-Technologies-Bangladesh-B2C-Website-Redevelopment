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
  TrendingDown,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Activity,
  Zap,
  AlertTriangle,
  BarChart3
} from 'lucide-react';

interface PerformanceMetrics {
  averageProcessingTime: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  successRate: number;
  gatewayPerformance: GatewayPerformance[];
  slowPayments: SlowPayment[];
  performanceAlerts: PerformanceAlert[];
}

interface GatewayPerformance {
  gateway: string;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  averageProcessingTime: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  successRate: number;
}

interface SlowPayment {
  id: string;
  transactionId: string;
  paymentMethod: string;
  gateway: string;
  amount: number;
  currency: string;
  processingTime: number;
  status: string;
  createdAt: string;
}

interface PerformanceAlert {
  id: string;
  type: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metric: string;
  threshold: number;
  actualValue: number;
  message: string;
  timestamp: string;
  resolved: boolean;
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

function PaymentPerformanceMonitoringPage() {
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [gateway, setGateway] = useState('');
  const [threshold, setThreshold] = useState(2000); // 2 seconds in milliseconds
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchPerformanceMetrics();
  }, [page, dateRange, gateway]);

  const fetchPerformanceMetrics = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(dateRange.startDate && { startDate: dateRange.startDate }),
        ...(dateRange.endDate && { endDate: dateRange.endDate }),
        ...(gateway && { gateway })
      });

      const response = await fetch(`${API_BASE}/admin/payments/performance/metrics?${queryParams}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setPerformanceMetrics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSlowPayments = async () => {
    try {
      const queryParams = new URLSearchParams({
        threshold: threshold.toString(),
        page: page.toString(),
        limit: limit.toString(),
        ...(dateRange.startDate && { startDate: dateRange.startDate }),
        ...(dateRange.endDate && { endDate: dateRange.endDate }),
        ...(gateway && { gateway })
      });

      const response = await fetch(`${API_BASE}/admin/payments/performance/slow?${queryParams}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setPerformanceMetrics(prev => prev ? { ...prev, slowPayments: data.data } : null);
        setTotalPages(Math.ceil(data.total / limit) || 1);
      }
    } catch (error) {
      console.error('Failed to fetch slow payments:', error);
    }
  };

  const fetchPerformanceAlerts = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/payments/performance/alerts`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setPerformanceMetrics(prev => prev ? { ...prev, performanceAlerts: data.data } : null);
      }
    } catch (error) {
      console.error('Failed to fetch performance alerts:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    Promise.all([
      fetchPerformanceMetrics(),
      fetchSlowPayments(),
      fetchPerformanceAlerts()
    ]).finally(() => {
      setRefreshing(false);
    });
  };

  const handleExportToCSV = () => {
    if (!performanceMetrics) return;

    const headers = ['Metric', 'Value', 'Unit'];
    const metricsData = [
      ['Average Processing Time', performanceMetrics.averageProcessingTime.toFixed(2), 'ms'],
      ['P50 Processing Time', performanceMetrics.p50.toFixed(2), 'ms'],
      ['P90 Processing Time', performanceMetrics.p90.toFixed(2), 'ms'],
      ['P95 Processing Time', performanceMetrics.p95.toFixed(2), 'ms'],
      ['P99 Processing Time', performanceMetrics.p99.toFixed(2), 'ms'],
      ['Total Transactions', performanceMetrics.totalTransactions.toString(), 'count'],
      ['Successful Transactions', performanceMetrics.successfulTransactions.toString(), 'count'],
      ['Failed Transactions', performanceMetrics.failedTransactions.toString(), 'count'],
      ['Success Rate', performanceMetrics.successRate.toFixed(2), '%']
    ];

    const csvContent = [
      headers.join(','),
      ...metricsData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-performance-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getAlertSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'LOW':
        return 'bg-blue-100 text-blue-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProcessingTimeColor = (time: number) => {
    if (time < 1000) return 'text-green-600';
    if (time < 2000) return 'text-yellow-600';
    if (time < 5000) return 'text-orange-600';
    return 'text-red-600';
  };

  const isTargetMet = (time: number): boolean => {
    return time < 2000; // Target is < 2 seconds
  };

  return (
    <AdminLayout title="Payment Performance Monitoring">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Performance Monitoring</h1>
            <p className="text-gray-600 mt-1">Monitor payment processing performance and identify bottlenecks</p>
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
            Monitor payment processing performance including average processing times, percentiles (P50, P90, P95, P99), gateway performance,
            slow payments, and performance alerts. Target processing time is &lt;2 seconds.
          </p>
        </div>

        {/* Performance Metrics Cards */}
        {performanceMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Processing Time</p>
                  <p className={`text-2xl font-bold mt-1 ${getProcessingTimeColor(performanceMetrics.averageProcessingTime)}`}>
                    {performanceMetrics.averageProcessingTime.toFixed(0)}ms
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {isTargetMet(performanceMetrics.averageProcessingTime) ? (
                      <span className="text-green-600">Target met ✓</span>
                    ) : (
                      <span className="text-red-600">Target not met ✗</span>
                    )}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${isTargetMet(performanceMetrics.averageProcessingTime) ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Clock className={`w-6 h-6 ${isTargetMet(performanceMetrics.averageProcessingTime) ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">P90 Processing Time</p>
                  <p className={`text-2xl font-bold mt-1 ${getProcessingTimeColor(performanceMetrics.p90)}`}>
                    {performanceMetrics.p90.toFixed(0)}ms
                  </p>
                  <p className="text-xs text-gray-500 mt-2">90th percentile</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {performanceMetrics.successRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {performanceMetrics.successfulTransactions} / {performanceMetrics.totalTransactions}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Failed Transactions</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {performanceMetrics.failedTransactions}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Failed payments</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Percentiles */}
        {performanceMetrics && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Processing Time Percentiles</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">P50 (Median)</p>
                <p className={`text-2xl font-bold ${getProcessingTimeColor(performanceMetrics.p50)}`}>
                  {performanceMetrics.p50.toFixed(0)}ms
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">P90</p>
                <p className={`text-2xl font-bold ${getProcessingTimeColor(performanceMetrics.p90)}`}>
                  {performanceMetrics.p90.toFixed(0)}ms
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">P95</p>
                <p className={`text-2xl font-bold ${getProcessingTimeColor(performanceMetrics.p95)}`}>
                  {performanceMetrics.p95.toFixed(0)}ms
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">P99</p>
                <p className={`text-2xl font-bold ${getProcessingTimeColor(performanceMetrics.p99)}`}>
                  {performanceMetrics.p99.toFixed(0)}ms
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label htmlFor="gateway" className="block text-sm font-medium text-gray-700 mb-1">Gateway</label>
              <select
                id="gateway"
                value={gateway}
                onChange={(e) => setGateway(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Gateways</option>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="sslcommerz">SSLCommerz</option>
                <option value="cod">Cash on Delivery</option>
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label htmlFor="threshold" className="block text-sm font-medium text-gray-700 mb-1">Slow Payment Threshold (ms)</label>
              <input
                id="threshold"
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value) || 2000)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setDateRange({ startDate: '', endDate: '' });
                  setGateway('');
                  setPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Gateway Performance */}
        {performanceMetrics && performanceMetrics.gatewayPerformance && performanceMetrics.gatewayPerformance.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Gateway Performance Comparison</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gateway</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P50</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P90</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P95</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P99</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {performanceMetrics.gatewayPerformance.map((gw) => (
                    <tr key={gw.gateway} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                        {gw.gateway}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {gw.totalTransactions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          gw.successRate >= 95
                            ? 'bg-green-100 text-green-800'
                            : gw.successRate >= 90
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {gw.successRate.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={getProcessingTimeColor(gw.averageProcessingTime)}>
                          {gw.averageProcessingTime.toFixed(0)}ms
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {gw.p50.toFixed(0)}ms
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {gw.p90.toFixed(0)}ms
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {gw.p95.toFixed(0)}ms
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {gw.p99.toFixed(0)}ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Performance Alerts */}
        {performanceMetrics && performanceMetrics.performanceAlerts && performanceMetrics.performanceAlerts.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Alerts</h2>
            <div className="space-y-3">
              {performanceMetrics.performanceAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.type === 'CRITICAL'
                      ? 'bg-red-50 border-red-500'
                      : alert.type === 'HIGH'
                      ? 'bg-orange-50 border-orange-500'
                      : alert.type === 'MEDIUM'
                      ? 'bg-yellow-50 border-yellow-500'
                      : 'bg-blue-50 border-blue-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getAlertSeverityBadge(alert.type)}`}>
                          {alert.type}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{alert.metric}</span>
                      </div>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Threshold: {alert.threshold}ms | Actual: {alert.actualValue.toFixed(0)}ms
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{formatDateTime(alert.timestamp)}</p>
                    </div>
                    {alert.resolved && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Resolved
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Slow Payments */}
        {performanceMetrics && performanceMetrics.slowPayments && performanceMetrics.slowPayments.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Slow Payments</h2>
            <p className="text-gray-600 mb-4">
              Payments with processing time exceeding {threshold}ms threshold
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gateway</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processing Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {performanceMetrics.slowPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payment.transactionId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {payment.paymentMethod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {payment.gateway}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(payment.amount)} {payment.currency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={getProcessingTimeColor(payment.processingTime)}>
                          {payment.processingTime.toFixed(0)}ms
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : payment.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(payment.createdAt)}
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
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, performanceMetrics.slowPayments.length)} of {performanceMetrics.slowPayments.length} entries
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
          </div>
        )}

        {/* Optimization Suggestions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Optimization Suggestions</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Parallel API Calls</p>
                <p className="text-sm text-gray-600">Implement parallel API calls for non-dependent operations to reduce overall processing time.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Database Query Optimization</p>
                <p className="text-sm text-gray-600">Optimize database queries with proper indexing and query optimization techniques.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
              <Activity className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Connection Pooling</p>
                <p className="text-sm text-gray-600">Implement connection pooling for database and external API connections.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Caching Strategy</p>
                <p className="text-sm text-gray-600">Implement caching for frequently accessed data like gateway configurations and user payment methods.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAuth(PaymentPerformanceMonitoringPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
