'use client';

/**
 * Admin Wishlist Moderation Queue Page
 *
 * Page for managing flagged wishlists including:
 * - View flagged wishlists
 * - Approve or reject wishlists
 * - Delete inappropriate wishlists
 * - Filter by status
 */

import React, { useState, useEffect } from 'react';
import { withAuth } from '@/components/auth/withAuth';
import {
  RefreshCw,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  Search,
  Filter,
  Clock,
  User,
  MessageSquare
} from 'lucide-react';
import {
  getModerationQueue,
  approveWishlist,
  rejectWishlist,
  deleteWishlist
} from '@/lib/api/adminWishlist';
import { cn } from '@/lib/utils';

function AdminWishlistModerationPage() {
  const [wishlists, setWishlists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<'pending' | 'reviewed' | 'resolved'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWishlist, setSelectedWishlist] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  /**
   * Load moderation queue
   */
  const loadModerationQueue = async () => {
    setIsLoading(true);
    try {
      const data = await getModerationQueue({
        page,
        limit: 10,
        status
      });
      setWishlists(data.wishlists);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Error loading moderation queue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadModerationQueue();
  }, [page, status]);

  /**
   * Handle approve wishlist
   */
  const handleApprove = async (wishlistId: string) => {
    try {
      await approveWishlist(wishlistId);
      await loadModerationQueue();
    } catch (error) {
      console.error('Error approving wishlist:', error);
    }
  };

  /**
   * Handle reject wishlist
   */
  const handleReject = async () => {
    if (!selectedWishlist || !rejectReason) return;

    try {
      await rejectWishlist(selectedWishlist.id, rejectReason);
      setShowRejectModal(false);
      setSelectedWishlist(null);
      setRejectReason('');
      await loadModerationQueue();
    } catch (error) {
      console.error('Error rejecting wishlist:', error);
    }
  };

  /**
   * Handle delete wishlist
   */
  const handleDelete = async (wishlistId: string) => {
    if (!confirm('Are you sure you want to delete this wishlist? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteWishlist(wishlistId);
      await loadModerationQueue();
    } catch (error) {
      console.error('Error deleting wishlist:', error);
    }
  };

  /**
   * Handle view details
   */
  const handleViewDetails = (wishlist: any) => {
    setSelectedWishlist(wishlist);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Wishlist Moderation
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Review and manage flagged wishlists
          </p>
        </div>
        <button
          type="button"
          onClick={loadModerationQueue}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
          </div>
          <div className="flex items-center gap-2">
            {(['pending', 'reviewed', 'resolved'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setStatus(s);
                  setPage(1);
                }}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  status === s
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Moderation Queue */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Flagged Wishlists
          </h2>
        </div>
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg animate-pulse">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : wishlists.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No flagged wishlists found</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {wishlists.map((wishlist) => (
                <div key={wishlist.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {wishlist.name || 'Unnamed Wishlist'}
                          </p>
                          <span className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                            status === 'pending' && 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
                            status === 'reviewed' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
                            status === 'resolved' && 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                          )}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{wishlist.user?.email || 'Unknown user'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{wishlist.flagDate ? new Date(wishlist.flagDate).toLocaleDateString() : 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            <span>{wishlist.flagReason || 'No reason provided'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        type="button"
                        onClick={() => handleViewDetails(wishlist)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="View details"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(wishlist.id)}
                        className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                        title="Approve"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedWishlist(wishlist);
                          setShowRejectModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(wishlist.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedWishlist && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Reject Wishlist
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Please provide a reason for rejecting this wishlist:
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedWishlist(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 text-sm font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={!rejectReason}
                className="px-4 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(AdminWishlistModerationPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
