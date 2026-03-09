/**
 * Admin Order Sharing Management Page
 * 
 * Manage all shared orders with filters, search, bulk actions,
 * and share link details modal.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { withAuth } from '@/components/auth/withAuth';
import { useAdminSharing } from '@/hooks/useOrderConfirmation';
import { ShareLink } from '@/lib/api/orderConfirmation';
import { AdminLayout } from '@/components/admin/AdminLayout';

function AdminOrderSharingPage() {
  const {
    shares,
    total,
    page,
    totalPages,
    loading,
    error,
    getSharedOrders,
    disableShareLink,
    deleteShareLink,
    bulkDisableShareLinks,
    bulkDeleteShareLinks,
  } = useAdminSharing();

  const [selectedShares, setSelectedShares] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    orderId: '',
    shareType: '',
    isActive: '',
    startDate: '',
    endDate: '',
  });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedShare, setSelectedShare] = useState<ShareLink | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadShares();
  }, [page]);

  const loadShares = () => {
    getSharedOrders({
      orderId: filters.orderId || undefined,
      shareType: filters.shareType || undefined,
      isActive: filters.isActive === 'true' ? true : filters.isActive === 'false' ? false : undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      page,
      limit: 20,
    });
  };

  const handleFilterChange = () => {
    setSelectedShares(new Set());
    loadShares();
  };

  const clearFilters = () => {
    setFilters({
      orderId: '',
      shareType: '',
      isActive: '',
      startDate: '',
      endDate: '',
    });
    setSelectedShares(new Set());
    loadShares();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && shares) {
      setSelectedShares(new Set(shares.map((s) => s.id)));
    } else {
      setSelectedShares(new Set());
    }
  };

  const handleSelectShare = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedShares);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedShares(newSelected);
  };

  const handleViewDetails = (share: ShareLink) => {
    setSelectedShare(share);
    setShowDetailModal(true);
  };

  const handleDisable = async (shareId: string) => {
    if (!confirm('Are you sure you want to disable this share link?')) {
      return;
    }
    setActionLoading(true);
    try {
      await disableShareLink(shareId);
      alert('Share link disabled successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to disable share link');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (shareId: string) => {
    if (!confirm('Are you sure you want to delete this share link?')) {
      return;
    }
    setActionLoading(true);
    try {
      await deleteShareLink(shareId);
      alert('Share link deleted successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to delete share link');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDisable = async () => {
    if (selectedShares.size === 0) {
      alert('Please select at least one share link');
      return;
    }
    if (!confirm(`Are you sure you want to disable ${selectedShares.size} share link(s)?`)) {
      return;
    }
    setActionLoading(true);
    try {
      await bulkDisableShareLinks(Array.from(selectedShares));
      alert('Share links disabled successfully!');
      setSelectedShares(new Set());
    } catch (err: any) {
      alert(err.message || 'Failed to disable share links');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedShares.size === 0) {
      alert('Please select at least one share link');
      return;
    }
    if (!confirm(`Are you sure you want to delete ${selectedShares.size} share link(s)?`)) {
      return;
    }
    setActionLoading(true);
    try {
      await bulkDeleteShareLinks(Array.from(selectedShares));
      alert('Share links deleted successfully!');
      setSelectedShares(new Set());
    } catch (err: any) {
      alert(err.message || 'Failed to delete share links');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!shares || shares.length === 0) {
      alert('No share links to export');
      return;
    }

    const headers = ['Share ID', 'Order ID', 'Share Type', 'Share URL', 'Views', 'Active', 'Created At', 'Last Accessed'];
    const csvContent = [
      headers.join(','),
      ...shares.map((s) => [
        s.id,
        s.shareToken,
        s.shareType,
        s.shareUrl,
        s.viewCount,
        s.isActive,
        s.createdAt,
        s.lastAccessedAt || '',
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shared-orders-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    if (document.body && a.parentNode === document.body) { document.body.removeChild(a); }
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const shareTypeLabels: Record<string, string> = {
    public_link: 'Public Link',
    protected_link: 'Protected Link',
    one_time_link: 'One-Time Link',
  };

  return (
    <AdminLayout title="Order Sharing">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Order Sharing Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {total} {total === 1 ? 'share link' : 'share links'}
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={!shares || shares.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Order ID</label>
            <input
              type="text"
              value={filters.orderId}
              onChange={(e) => setFilters({ ...filters, orderId: e.target.value })}
              placeholder="Search by order ID"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Share Type</label>
            <select
              value={filters.shareType}
              onChange={(e) => setFilters({ ...filters, shareType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">All Types</option>
              <option value="public_link">Public Link</option>
              <option value="protected_link">Protected Link</option>
              <option value="one_time_link">One-Time Link</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              value={filters.isActive}
              onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={loadShares}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Search
          </button>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedShares.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {selectedShares.size} share link(s) selected
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleBulkDisable}
                disabled={actionLoading}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Disable Selected
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Share Links Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading share links...</p>
          </div>
        ) : !shares || shares.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">🔗</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Share Links Found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              No share links match your current filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={shares && selectedShares.size === shares.length && shares.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Share Token
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Accessed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {shares && shares.map((share) => (
                  <tr key={share.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedShares.has(share.id)}
                        onChange={(e) => handleSelectShare(share.id, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {share.shareToken}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {shareTypeLabels[share.shareType] || share.shareType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {share.viewCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        share.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {share.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(share.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(share.lastAccessedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(share)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          View
                        </button>
                        {share.isActive && (
                          <button
                            onClick={() => handleDisable(share.id)}
                            className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                          >
                            Disable
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(share.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
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
            onClick={() => {
              if (page > 1) {
                loadShares();
              }
            }}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => {
              if (page < totalPages) {
                loadShares();
              }
            }}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Share Detail Modal */}
      {showDetailModal && selectedShare && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowDetailModal(false)}></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Share Link Details
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Share Token</p>
                    <p className="text-gray-900 dark:text-gray-100">{selectedShare.shareToken}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Share Type</p>
                    <p className="text-gray-900 dark:text-gray-100">{shareTypeLabels[selectedShare.shareType]}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Share URL</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={selectedShare.shareUrl}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedShare.shareUrl);
                          alert('Link copied to clipboard!');
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">View Count</p>
                      <p className="text-gray-900 dark:text-gray-100">{selectedShare.viewCount}</p>
                    </div>
                    {selectedShare.maxViews && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Max Views</p>
                        <p className="text-gray-900 dark:text-gray-100">{selectedShare.maxViews}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedShare.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {selectedShare.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Created At</p>
                      <p className="text-gray-900 dark:text-gray-100">{formatDate(selectedShare.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Last Accessed</p>
                      <p className="text-gray-900 dark:text-gray-100">{formatDate(selectedShare.lastAccessedAt)}</p>
                    </div>
                  </div>
                  {selectedShare.expirationDate && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Expiration Date</p>
                      <p className="text-gray-900 dark:text-gray-100">{formatDate(selectedShare.expirationDate)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}

export default withAuth(AdminOrderSharingPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/unauthorized',
});
