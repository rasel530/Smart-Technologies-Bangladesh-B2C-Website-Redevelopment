/**
 * Admin Order Cancellations Page
 * 
 * List and manage all order cancellation requests with filtering and actions.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrderManagement } from '@/hooks/useOrderManagement';
import { OrderCancellation, CancellationType } from '@/lib/api/orderManagement';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminOrderCancellationsPage() {
  const router = useRouter();
  const { getAllCancellations, approveCancellation, rejectCancellation, isLoading, error, clearError } = useOrderManagement();

  const [cancellations, setCancellations] = useState<OrderCancellation[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'processed'>('all');
  const [typeFilter, setTypeFilter] = useState<CancellationType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCancellation, setSelectedCancellation] = useState<OrderCancellation | null>(null);
  const [actionModal, setActionModal] = useState<{ type: 'approve' | 'reject' | 'view'; orderId: string; cancellationId: string } | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundMethod, setRefundMethod] = useState('original');
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadCancellations();
  }, []);

  const loadCancellations = async () => {
    try {
      const result = await getAllCancellations({
        status: statusFilter === 'all' ? undefined : statusFilter,
        type: typeFilter === 'all' ? undefined : typeFilter,
        search: searchQuery || undefined,
      });
      
      if (result) {
        setCancellations(result.data);
      }
    } catch (err) {
      console.error('Error loading cancellations:', err);
    }
  };

  // Reload cancellations when filters change
  useEffect(() => {
    loadCancellations();
  }, [statusFilter, typeFilter, searchQuery]);

  const handleApprove = async () => {
    if (!actionModal) return;

    const result = await approveCancellation(actionModal.orderId, actionModal.cancellationId, {
      adminNotes,
      refundAmount: refundAmount ? parseFloat(refundAmount) : undefined,
      refundMethod,
    });
    if (result) {
      setActionModal(null);
      setAdminNotes('');
      setRefundAmount('');
      setRefundMethod('original');
      loadCancellations();
    }
  };

  const handleReject = async () => {
    if (!actionModal) return;

    const result = await rejectCancellation(actionModal.orderId, actionModal.cancellationId, { reason: rejectReason });
    if (result) {
      setActionModal(null);
      setRejectReason('');
      loadCancellations();
    }
  };

  const cancellationTypeLabels: Record<CancellationType, { en: string; bn: string }> = {
    customer_request: { en: 'Customer Request', bn: 'গ্রাহকের অনুরোধ' },
    fraud: { en: 'Fraud', bn: 'প্রতারণা' },
    out_of_stock: { en: 'Out of Stock', bn: 'স্টক নেই' },
    payment_failed: { en: 'Payment Failed', bn: 'পেমেন্ট ব্যর্থ হয়েছে' },
    duplicate: { en: 'Duplicate', bn: 'ডুপ্লিকেট' },
    other: { en: 'Other', bn: 'অন্যান্য' },
  };

  const statusLabels: Record<string, { en: string; bn: string; color: string }> = {
    pending: { en: 'Pending', bn: 'অপেক্ষমাণ', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    approved: { en: 'Approved', bn: 'অনুমোদিত', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    rejected: { en: 'Rejected', bn: 'প্রত্যাখ্যাত', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    processed: { en: 'Processed', bn: 'প্রক্রিয়া করা হয়েছে', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount?: number | string) => {
    if (!amount) return 'N/A';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `৳${numAmount.toFixed(2)}`;
  };

  return (
    <AdminLayout title="Order Cancellations">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow">
          <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6" style={{ maxWidth: '100rem' }}>
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => router.push('/admin/orders')}
                  className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-2 inline-flex items-center gap-1"
                >
                  ← Back to Orders
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Order Cancellations
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Manage order cancellation requests
                </p>
              </div>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ maxWidth: '100rem' }}>
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search by Order ID
              </label>
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter order ID..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Status Filter */}
            <div className="lg:w-48">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="processed">Processed</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="lg:w-48">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cancellation Type
              </label>
              <select
                id="type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Types</option>
                {Object.entries(cancellationTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label.en}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={clearError}
                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Cancellations List */}
        {cancellations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Cancellations Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'No cancellation requests have been submitted yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden" style={{ maxWidth: '100rem' }}>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Refund Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {(cancellations || []).map((cancellation) => {
                  // Handle both camelCase (API) and snake_case (database) field names
                  const cancellationType = cancellation?.cancellationType || (cancellation as any)?.cancellation_type;
                  const typeInfo = cancellationTypeLabels[cancellationType as CancellationType] || { en: 'Unknown', bn: 'অজানা' };
                  const statusInfo = statusLabels[cancellation?.status] || { en: 'Unknown', bn: 'অজানা', color: 'bg-gray-100 text-gray-800' };
                  return (
                    <tr key={cancellation?.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400 cursor-pointer">
                        {cancellation?.orderId || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {typeInfo?.en || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {cancellation?.reason || 'No reason provided'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo?.color || 'bg-gray-100 text-gray-800'}`}>
                          {statusInfo?.en || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatCurrency(cancellation?.refundAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {cancellation?.createdAt ? formatDate(cancellation.createdAt) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedCancellation(cancellation);
                              setActionModal({ type: 'view', orderId: cancellation?.orderId || '', cancellationId: cancellation?.id || '' });
                            }}
                            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            View
                          </button>
                          {cancellation?.status === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  setActionModal({ type: 'approve', orderId: cancellation?.orderId || '', cancellationId: cancellation?.id || '' });
                                }}
                                className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setActionModal({ type: 'reject', orderId: cancellation?.orderId || '', cancellationId: cancellation?.id || '' });
                                }}
                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modals */}
      {actionModal && actionModal.type === 'approve' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Approve Cancellation
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Refund Amount (Optional)
                  </label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="Enter refund amount..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Refund Method
                  </label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="original">Original Payment Method</option>
                    <option value="wallet">Wallet Balance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add any notes for this approval..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setActionModal(null);
                    setAdminNotes('');
                    setRefundAmount('');
                    setRefundMethod('original');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Approving...' : 'Approve & Process'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {actionModal && actionModal.type === 'reject' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Reject Cancellation
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this cancellation is being rejected..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                  rows={3}
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setActionModal(null);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={isLoading || !rejectReason.trim()}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {actionModal && actionModal.type === 'view' && selectedCancellation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Cancellation Details
                </h3>
                <button
                  onClick={() => {
                    setActionModal(null);
                    setSelectedCancellation(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Order ID:</span>
                  <p className="text-gray-900 dark:text-gray-100">{selectedCancellation?.orderId || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Type:</span>
                  <p className="text-gray-900 dark:text-gray-100">
                    {/* Handle both camelCase (API) and snake_case (database) field names */}
                    {(cancellationTypeLabels[(selectedCancellation?.cancellationType || (selectedCancellation as any)?.cancellation_type) as CancellationType] || { en: 'Unknown' }).en}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Reason:</span>
                  <p className="text-gray-900 dark:text-gray-100">{selectedCancellation?.reason || 'No reason provided'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${(statusLabels[selectedCancellation?.status] || { color: 'bg-gray-100 text-gray-800' }).color}`}>
                    {(statusLabels[selectedCancellation?.status] || { en: 'Unknown' }).en}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Refund Amount:</span>
                  <p className="text-gray-900 dark:text-gray-100">{formatCurrency(selectedCancellation?.refundAmount)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Refund Method:</span>
                  <p className="text-gray-900 dark:text-gray-100">{selectedCancellation?.refundMethod || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Created:</span>
                  <p className="text-gray-900 dark:text-gray-100">{selectedCancellation?.createdAt ? formatDate(selectedCancellation.createdAt) : 'N/A'}</p>
                </div>
                {selectedCancellation?.adminNotes && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Admin Notes:</span>
                    <p className="text-gray-900 dark:text-gray-100">{selectedCancellation.adminNotes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminLayout>
  );
}
