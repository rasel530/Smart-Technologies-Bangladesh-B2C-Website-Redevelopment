/**
 * Admin Order Modifications Page
 * 
 * List and manage all order modification requests with filtering and actions.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrderManagement } from '@/hooks/useOrderManagement';
import { OrderModification, ModificationType } from '@/lib/api/orderManagement';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminOrderModificationsPage() {
  const router = useRouter();
  const { approveModification, rejectModification, getAllModifications, isLoading, error, clearError } = useOrderManagement();

  const [modifications, setModifications] = useState<OrderModification[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed'>('all');
  const [typeFilter, setTypeFilter] = useState<ModificationType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModification, setSelectedModification] = useState<OrderModification | null>(null);
  const [actionModal, setActionModal] = useState<{ type: 'approve' | 'reject' | 'view'; modificationId: string } | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadModifications();
  }, [statusFilter, typeFilter]);

  const loadModifications = async () => {
    const result = await getAllModifications({
      status: statusFilter === 'all' ? undefined : statusFilter,
      type: typeFilter === 'all' ? undefined : typeFilter,
      page: 1,
      limit: 100,
    });
    
    if (result) {
      setModifications(result.data);
    }
  };

  const filteredModifications = modifications.filter(mod => {
    if (statusFilter !== 'all' && mod.status !== statusFilter) return false;
    if (typeFilter !== 'all' && mod.modification_type !== typeFilter) return false;
    if (searchQuery && !mod.order_id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleApprove = async () => {
    if (!actionModal) return; 

    // Find the modification to get the order_id
    const modification = modifications.find(mod => mod.id === actionModal.modificationId);
    if (!modification) return; 

    const result = await approveModification(modification.order_id, actionModal.modificationId, { adminNotes });
    if (result) {
      setActionModal(null);
      setAdminNotes('');
      loadModifications();
    }
  };

  const handleReject = async () => {
    if (!actionModal) return; 

    // Find the modification to get the order_id
    const modification = modifications.find(mod => mod.id === actionModal.modificationId);
    if (!modification) return; 

    const result = await rejectModification(modification.order_id, actionModal.modificationId, { reason: rejectReason });
    if (result) {
      setActionModal(null);
      setRejectReason('');
      loadModifications();
    }
  };

  const modificationTypeLabels: Record<ModificationType, { en: string; bn: string }> = {
    item_add: { en: 'Add Item', bn: 'আইটেম যোগ করুন' },
    item_remove: { en: 'Remove Item', bn: 'আইটেম সরান' },
    quantity_change: { en: 'Change Quantity', bn: 'পরিমাণ পরিবর্তন করুন' },
    price_change: { en: 'Change Price', bn: 'মূল্য পরিবর্তন করুন' },
    address_change: { en: 'Change Address', bn: 'ঠিকানা পরিবর্তন করুন' },
    shipping_method_change: { en: 'Change Shipping Method', bn: 'শিপিং পদ্ধতি পরিবর্তন করুন' },
    payment_method_change: { en: 'Change Payment Method', bn: 'পেমেন্ট পদ্ধতি পরিবর্তন করুন' },
    custom: { en: 'Custom Request', bn: 'কাস্টম অনুরোধ' },
  };

  const statusLabels: Record<string, { en: string; bn: string; color: string }> = {
    pending: { en: 'Pending', bn: 'অপেক্ষমাণ', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    approved: { en: 'Approved', bn: 'অনুমোদিত', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    rejected: { en: 'Rejected', bn: 'প্রত্যাখ্যাত', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    cancelled: { en: 'Cancelled', bn: 'বাতিল', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
    completed: { en: 'Completed', bn: 'সম্পন্ন', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
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

  return (
    <AdminLayout title="Order Modifications">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => router.push('/admin/orders')}
                  className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-2 inline-flex items-center gap-1"
                >
                  ← Back to Orders
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Order Modifications
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Manage order modification requests
                </p>
              </div>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ maxWidth: '100rem' }}>
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
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="lg:w-48">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Modification Type
              </label>
              <select
                id="type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Types</option>
                {Object.entries(modificationTypeLabels).map(([key, label]) => (
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

        {/* Modifications List */}
        {filteredModifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Modifications Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'No modification requests have been submitted yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredModifications.map((modification) => {
                  const typeInfo = modificationTypeLabels[modification.modification_type];
                  const statusInfo = statusLabels[modification.status];
                  return (
                    <tr key={modification.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400 cursor-pointer">
                        {modification.order_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {typeInfo.en}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {modification.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.en}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(modification.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium min-w-[150px]">
                        <div className="flex justify-end gap-2 flex-wrap">
                          <button
                            onClick={() => {
                              setSelectedModification(modification);
                              setActionModal({ type: 'view', modificationId: modification.id });
                            }}
                            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            View
                          </button>
                          {modification.status === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  setActionModal({ type: 'approve', modificationId: modification.id });
                                }}
                                className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 px-2 py-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setActionModal({ type: 'reject', modificationId: modification.id });
                                }}
                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
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
                Approve Modification
              </h3>
              <div className="mb-4">
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
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setActionModal(null);
                    setAdminNotes('');
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
                  {isLoading ? 'Approving...' : 'Approve'}
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
                Reject Modification
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this modification is being rejected..."
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

      {actionModal && actionModal.type === 'view' && selectedModification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Modification Details
                </h3>
                <button
                  onClick={() => {
                    setActionModal(null);
                    setSelectedModification(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Order ID:</span>
                  <p className="text-gray-900 dark:text-gray-100">{selectedModification.order_id}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Type:</span>
                  <p className="text-gray-900 dark:text-gray-100">
                    {modificationTypeLabels[selectedModification.modification_type].en}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Description:</span>
                  <p className="text-gray-900 dark:text-gray-100">
                    {selectedModification.description || 'No description provided'}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${statusLabels[selectedModification.status].color}`}>
                    {statusLabels[selectedModification.status].en}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Created:</span>
                  <p className="text-gray-900 dark:text-gray-100">{formatDate(selectedModification.created_at)}</p>
                </div>
                {selectedModification.changes && Object.keys(selectedModification.changes).length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Changes:</span>
                    <pre className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded text-xs overflow-x-auto">
                      {JSON.stringify(selectedModification.changes, null, 2)}
                    </pre>
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
