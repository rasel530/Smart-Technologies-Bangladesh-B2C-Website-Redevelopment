'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { withAuth } from '@/components/auth/withAuth';
import {
  ArrowLeft,
  BarChart3,
  Settings,
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  X,
  RefreshCw,
  XCircle
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import adminPaymentApi, {
  PaymentTransaction,
  DashboardSummary,
  PaymentsResponse,
  PaymentFilters,
} from '@/lib/api/admin/payments';

// Utility functions
const formatCurrency = (amount: number): string => {
  return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'refunded':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'cancelled':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-4 h-4" />;
    case 'pending':
      return <Clock className="w-4 h-4" />;
    case 'failed':
      return <AlertCircle className="w-4 h-4" />;
    case 'refunded':
      return <DollarSign className="w-4 h-4" />;
    case 'cancelled':
      return <AlertCircle className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

// Main component
function PaymentManagementPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const [itemsPerPage] = useState(10);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Sorting
  const [sortField, setSortField] = useState<keyof PaymentTransaction>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modal
  const [selectedPayment, setSelectedPayment] = useState<PaymentTransaction | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // Notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Loading states for operations
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [processingRefund, setProcessingRefund] = useState(false);
  
  // Date range error
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);
  
  // Debounce timers
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const dateDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Show notification
  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build filters for API call
      const filters: PaymentFilters = {
        page,
        limit: itemsPerPage,
        search: search || undefined,
        status: statusFilter as any || undefined,
        startDate: dateFrom || undefined,
        endDate: dateTo || undefined,
        sortBy: sortField as any,
        sortOrder,
      };

      // Call the real API
      const response: PaymentsResponse = await adminPaymentApi.getPayments(filters);
      
      // Update state with API response
      setSummary(response.summary);
      setPayments(response.payments);
      setTotalPages(response.pagination.pages);
      setTotalPayments(response.pagination.total);
      
    } catch (err: any) {
      console.error('Error fetching payments:', err);
      setError(err.message || 'Failed to load payments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, dateFrom, dateTo, sortField, sortOrder, page, itemsPerPage]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Debounced search handler
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    searchDebounceRef.current = setTimeout(() => {
      fetchPayments();
    }, 500);
  };

  // Debounced date filter handlers
  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    setPage(1);
    
    // Validate date range
    if (value && dateTo) {
      const fromDate = new Date(value);
      const toDate = new Date(dateTo);
      if (fromDate > toDate) {
        setDateRangeError('Date From must be before or equal to Date To');
      } else {
        setDateRangeError(null);
      }
    } else {
      setDateRangeError(null);
    }
    
    if (dateDebounceRef.current) {
      clearTimeout(dateDebounceRef.current);
    }
    
    dateDebounceRef.current = setTimeout(() => {
      fetchPayments();
    }, 500);
  };

  const handleDateToChange = (value: string) => {
    setDateTo(value);
    setPage(1);
    
    // Validate date range
    if (dateFrom && value) {
      const fromDate = new Date(dateFrom);
      const toDate = new Date(value);
      if (fromDate > toDate) {
        setDateRangeError('Date From must be before or equal to Date To');
      } else {
        setDateRangeError(null);
      }
    } else {
      setDateRangeError(null);
    }
    
    if (dateDebounceRef.current) {
      clearTimeout(dateDebounceRef.current);
    }
    
    dateDebounceRef.current = setTimeout(() => {
      fetchPayments();
    }, 500);
  };

  const handleFilterChange = () => {
    setPage(1);
    fetchPayments();
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setDateRangeError(null);
    setPage(1);
    setSortField('createdAt');
    setSortOrder('desc');
    fetchPayments();
  };

  const handleSort = (field: keyof PaymentTransaction) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleViewPayment = (payment: PaymentTransaction) => {
    setSelectedPayment(payment);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPayment(null);
  };

  // Update payment status
  const handleUpdateStatus = async (paymentId: string, newStatus: PaymentTransaction['status']) => {
    if (!selectedPayment) return;
    
    setUpdatingStatus(true);
    try {
      // Call the real API
      await adminPaymentApi.updatePaymentStatus(paymentId, newStatus);
      
      // Update selected payment
      setSelectedPayment({
        ...selectedPayment,
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      showNotification('success', `Payment status updated to ${newStatus}`);
      fetchPayments(); // Refresh to update summary
    } catch (err: any) {
      console.error('Error updating status:', err);
      showNotification('error', err.message || 'Failed to update payment status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Process refund
  const handleRefund = async (paymentId: string) => {
    if (!selectedPayment) return;
    
    if (!confirm(`Are you sure you want to refund ${formatCurrency(selectedPayment.amount)} for transaction ${selectedPayment.transactionId}?`)) {
      return;
    }
    
    setProcessingRefund(true);
    try {
      // Call the real API
      await adminPaymentApi.processRefund(paymentId, selectedPayment.amount, 'Admin refund');
      
      // Update selected payment
      setSelectedPayment({
        ...selectedPayment,
        status: 'refunded',
        updatedAt: new Date().toISOString()
      });
      
      showNotification('success', `Refund processed successfully for ${formatCurrency(selectedPayment.amount)}`);
      fetchPayments(); // Refresh to update summary
    } catch (err: any) {
      console.error('Error processing refund:', err);
      showNotification('error', err.message || 'Failed to process refund');
    } finally {
      setProcessingRefund(false);
    }
  };

  const handleExportCSV = async () => {
    if (payments.length === 0) {
      alert('No payments to export');
      return;
    }

    try {
      // Build filters for export
      const filters: PaymentFilters = {
        search: search || undefined,
        status: statusFilter as any || undefined,
        startDate: dateFrom || undefined,
        endDate: dateTo || undefined,
        sortBy: sortField as any,
        sortOrder,
      };

      // Call the real API
      const blob = await adminPaymentApi.exportPayments(filters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      if (document.body && a.parentNode === document.body) { document.body.removeChild(a); }
      
      showNotification('success', 'Payments exported successfully!');
    } catch (err: any) {
      console.error('Error exporting payments:', err);
      showNotification('error', err.message || 'Failed to export payments');
    }
  };

  const SortIcon = ({ field }: { field: keyof PaymentTransaction }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ArrowUp className="w-4 h-4 ml-1" /> : <ArrowDown className="w-4 h-4 ml-1" />;
  };

  return (
    <AdminLayout title="Payment Management">
      <div className="space-y-6">
        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span>{notification.message}</span>
            </div>
          </div>
        )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600 mt-1">
            {totalPayments} {totalPayments === 1 ? 'transaction' : 'transactions'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/payments/analytics"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </Link>
          <Link
            href="/admin/payments/gateways"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Gateway Settings
          </Link>
          <Link
            href="/admin/payments/logs"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Logs
          </Link>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={fetchPayments}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(summary.totalRevenue)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {summary.totalTransactions.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {summary.successRate.toFixed(2)}%
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
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {summary.pendingPayments.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Secondary Metrics */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed Payments</p>
                <p className="text-xl font-bold text-red-600 mt-1">
                  {summary.failedPayments.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Refunded Amount</p>
                <p className="text-xl font-bold text-orange-600 mt-1">
                  {formatCurrency(summary.refundedAmount)}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <DollarSign className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Transaction Value</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {formatCurrency(summary.totalRevenue / Math.max(summary.totalTransactions, 1))}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <form className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by transaction ID, order ID, customer name, email, or payment method..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  handleFilterChange();
                }}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => handleDateFromChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date To */}
            <div>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => handleDateToChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date Range Error */}
            {dateRangeError && (
              <div className="flex items-center gap-2 text-red-600 text-sm col-span-full">
                <XCircle className="w-4 h-4" />
                {dateRangeError}
              </div>
            )}

            {/* Clear Filters */}
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>

            {/* Export Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={payments.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </form>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading transactions...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions Found</h3>
            <p className="text-gray-600">
              {search || statusFilter || dateFrom || dateTo
                ? 'No transactions match your current filters. Try adjusting your search criteria.'
                : 'No transactions have been recorded yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('transactionId')}
                  >
                    <div className="flex items-center">
                      Transaction
                      <SortIcon field="transactionId" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('orderId')}
                  >
                    <div className="flex items-center">
                      Order
                      <SortIcon field="orderId" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center">
                      Amount
                      <SortIcon field="amount" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('paymentMethod')}
                  >
                    <div className="flex items-center">
                      Method
                      <SortIcon field="paymentMethod" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('gateway')}
                  >
                    <div className="flex items-center">
                      Gateway
                      <SortIcon field="gateway" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      <SortIcon field="status" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center">
                      Date
                      <SortIcon field="createdAt" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payment.transactionId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payment.orderId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 capitalize">
                        {payment.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 capitalize">
                        {payment.gateway}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(payment.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewPayment(payment)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="px-4 py-2 text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Payment Detail Modal */}
      {showModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Transaction Details</h2>
                <p className="text-gray-600">{selectedPayment.transactionId}</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Transaction ID</h3>
                  <p className="text-sm text-gray-900">{selectedPayment.transactionId}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Order ID</h3>
                  <p className="text-sm text-gray-900">{selectedPayment.orderId}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Customer Name</h3>
                  <p className="text-sm text-gray-900">{selectedPayment.customerName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Customer Email</h3>
                  <p className="text-sm text-gray-900">{selectedPayment.customerEmail}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Amount</h3>
                  <p className="text-sm text-gray-900">{formatCurrency(selectedPayment.amount)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Currency</h3>
                  <p className="text-sm text-gray-900">{selectedPayment.currency}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Payment Method</h3>
                  <p className="text-sm text-gray-900 capitalize">{selectedPayment.paymentMethod}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Gateway</h3>
                  <p className="text-sm text-gray-900 capitalize">{selectedPayment.gateway}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedPayment.status)}`}>
                    {getStatusIcon(selectedPayment.status)}
                    {selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1)}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Created At</h3>
                  <p className="text-sm text-gray-900">{formatDate(selectedPayment.createdAt)}</p>
                </div>
              </div>

              {/* Status Update Section */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Update Status</h3>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleUpdateStatus(selectedPayment.id, 'pending')}
                    disabled={updatingStatus || selectedPayment.status === 'pending'}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedPayment.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 cursor-default'
                        : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                    Pending
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedPayment.id, 'completed')}
                    disabled={updatingStatus || selectedPayment.status === 'completed'}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedPayment.status === 'completed'
                        ? 'bg-green-100 text-green-800 cursor-default'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Completed
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedPayment.id, 'failed')}
                    disabled={updatingStatus || selectedPayment.status === 'failed'}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedPayment.status === 'failed'
                        ? 'bg-red-100 text-red-800 cursor-default'
                        : 'bg-red-50 text-red-700 hover:bg-red-100'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                    Failed
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedPayment.id, 'cancelled')}
                    disabled={updatingStatus || selectedPayment.status === 'cancelled'}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedPayment.status === 'cancelled'
                        ? 'bg-orange-100 text-orange-800 cursor-default'
                        : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                    Cancelled
                  </button>
                </div>
              </div>

              {/* Refund Section */}
              {selectedPayment.status === 'completed' && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Refund</h3>
                  <button
                    onClick={() => handleRefund(selectedPayment.id)}
                    disabled={processingRefund}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed"
                  >
                    {processingRefund ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Process Refund ({formatCurrency(selectedPayment.amount)})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminLayout>
  );
}

// Wrap with authentication HOC
export default withAuth(PaymentManagementPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
