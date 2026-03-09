'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Download, Trash2, Eye, Calendar, User, Package, AlertCircle } from 'lucide-react';
import { withAuth } from '@/components/auth/withAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatsGrid } from '@/components/design-system';
import adminComparisonsApi, {
  AdminComparison,
  AdminComparisonFilters,
  AdminComparisonStats
} from '@/lib/api/admin-comparisons';
import { format } from 'date-fns';

/**
 * Admin Comparisons Page
 *
 * Main page for managing product comparisons with:
 * - Comparison list with search and filters
 * - Statistics section
 * - View comparison details
 * - Delete comparison with confirmation
 * - Export comparison data
 * - Bulk actions (delete multiple)
 * - Pagination support
 */
function AdminComparisonsPage() {
  const [comparisons, setComparisons] = useState<AdminComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminComparisonStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'name'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Bulk actions
  const [selectedComparisons, setSelectedComparisons] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // View details modal
  const [selectedComparison, setSelectedComparison] = useState<AdminComparison | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchComparisons();
  }, [page, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchComparisons = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: AdminComparisonFilters = {
        page,
        limit: 20,
        status: statusFilter as 'active' | 'expired' | 'all',
        sortBy,
        sortOrder,
      };
      
      if (search) {
        // Note: The backend doesn't support search by name/email directly
        // We'll filter client-side for now
      }

      const response = await adminComparisonsApi.getAdminComparisons(filters);
      
      // Apply client-side search filter if needed
      let filteredComparisons = response.comparisons;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredComparisons = response.comparisons.filter(comp =>
          comp.name.toLowerCase().includes(searchLower) ||
          comp.user?.email?.toLowerCase().includes(searchLower) ||
          comp.user?.firstName?.toLowerCase().includes(searchLower) ||
          comp.user?.lastName?.toLowerCase().includes(searchLower)
        );
      }

      setComparisons(filteredComparisons);
      setTotalPages(response.pagination.pages);
      setTotal(response.pagination.total);
    } catch (err: any) {
      console.error('Error fetching comparisons:', err);
      setError(err.message || 'Failed to load comparisons');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const response = await adminComparisonsApi.getAdminComparisonStats('all');
      setStats(response.stats);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchComparisons();
  };

  const handleViewDetails = async (comparison: AdminComparison) => {
    try {
      const response = await adminComparisonsApi.getAdminComparison(comparison.id);
      setSelectedComparison(response.comparison);
      setShowDetailsModal(true);
    } catch (err: any) {
      console.error('Error fetching comparison details:', err);
      alert('Failed to load comparison details');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this comparison? This action cannot be undone.')) {
      return;
    }
    
    try {
      await adminComparisonsApi.deleteAdminComparison(id);
      setComparisons(comparisons.filter(c => c.id !== id));
      setTotal(total - 1);
      setSelectedComparisons(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      // Refresh stats
      fetchStats();
    } catch (err: any) {
      console.error('Error deleting comparison:', err);
      alert('Failed to delete comparison');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedComparisons.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedComparisons.size} comparison(s)? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await Promise.all(
        Array.from(selectedComparisons).map(id => 
          adminComparisonsApi.deleteAdminComparison(id)
        )
      );
      setComparisons(comparisons.filter(c => !selectedComparisons.has(c.id)));
      setTotal(total - selectedComparisons.size);
      setSelectedComparisons(new Set());
      setShowBulkActions(false);
      // Refresh stats
      fetchStats();
    } catch (err: any) {
      console.error('Error deleting comparisons:', err);
      alert('Failed to delete some comparisons');
    }
  };

  const handleSelectComparison = (id: string) => {
    setSelectedComparisons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      setShowBulkActions(newSet.size > 0);
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedComparisons.size === comparisons.length) {
      setSelectedComparisons(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedComparisons(new Set(comparisons.map(c => c.id)));
      setShowBulkActions(true);
    }
  };

  const handleExport = async () => {
    try {
      const data = comparisons.map(comp => ({
        id: comp.id,
        name: comp.name,
        user: comp.user ? `${comp.user.firstName || ''} ${comp.user.lastName || ''} (${comp.user.email})` : 'Guest',
        itemCount: comp.itemCount,
        status: comp.expiresAt && new Date(comp.expiresAt) < new Date() ? 'expired' : 'active',
        createdAt: comp.createdAt,
        updatedAt: comp.updatedAt,
      }));

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comparisons-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      if (document.body && a.parentNode === document.body) { document.body.removeChild(a); }
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting data:', err);
      alert('Failed to export data');
    }
  };

  const getStatusBadge = (comparison: AdminComparison) => {
    const isExpired = comparison.expiresAt && new Date(comparison.expiresAt) < new Date();
    if (isExpired) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Active
      </span>
    );
  };

  const statsData = [
    {
      title: 'Total Comparisons',
      value: loadingStats ? 'Loading...' : stats?.totalComparisons || 0,
      icon: <Package className="w-6 h-6 text-primary-600" />,
      color: 'primary' as const,
    },
    {
      title: 'Active Comparisons',
      value: loadingStats ? 'Loading...' : stats?.activeComparisons || 0,
      icon: <Eye className="w-6 h-6 text-green-600" />,
      color: 'success' as const,
    },
    {
      title: 'Expired Comparisons',
      value: loadingStats ? 'Loading...' : stats?.expiredComparisons || 0,
      icon: <AlertCircle className="w-6 h-6 text-red-600" />,
      color: 'danger' as const,
    },
    {
      title: 'Avg Products/Comparison',
      value: loadingStats ? 'Loading...' : stats?.avgItemsPerComparison?.toFixed(1) || '0',
      icon: <Package className="w-6 h-6 text-blue-600" />,
      color: 'default' as const,
    },
  ];

  return (
    <AdminLayout title="Product Comparisons">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <StatsGrid stats={statsData} columns={4} />

        {/* Section Divider */}
        <div className="border-t border-neutral-200 my-8"></div>

        {/* Bulk Actions Bar */}
        {showBulkActions && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm font-medium text-blue-900">
                {selectedComparisons.size} comparison(s) selected
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedComparisons(new Set())}
                className="px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
              >
                Clear Selection
              </button>
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or user email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'updatedAt' | 'name')}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="createdAt">Sort by Created Date</option>
              <option value="updatedAt">Sort by Updated Date</option>
              <option value="name">Sort by Name</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
            <button
              type="submit"
              className="inline-flex items-center px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <Filter className="w-5 h-5 mr-2" />
              Apply Filters
            </button>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </AlertCircle>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={fetchComparisons}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Comparisons Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2">Loading comparisons...</p>
            </div>
          ) : comparisons.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No comparisons found</p>
              <p className="text-sm">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedComparisons.size === comparisons.length && comparisons.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comparison Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Products
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {comparisons.map((comparison) => (
                    <tr key={comparison.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedComparisons.has(comparison.id)}
                          onChange={() => handleSelectComparison(comparison.id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{comparison.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {comparison.user ? (
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {comparison.user.firstName} {comparison.user.lastName}
                              </div>
                              <div className="text-xs text-gray-500">{comparison.user.email}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center text-sm text-gray-500">
                            <User className="w-4 h-4 mr-2" />
                            Guest Session
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">{comparison.itemCount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(comparison)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                          {format(new Date(comparison.createdAt), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {format(new Date(comparison.createdAt), 'HH:mm')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetails(comparison)}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => handleDelete(comparison.id)}
                            className="text-red-600 hover:text-red-900 flex items-center"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
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
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {page} of {totalPages} ({total} total)
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Next
            </button>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedComparison && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Comparison Details</h2>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-sm text-gray-900">{selectedComparison.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                  {selectedComparison.user ? (
                    <p className="text-sm text-gray-900">
                      {selectedComparison.user.firstName} {selectedComparison.user.lastName} ({selectedComparison.user.email})
                    </p>
                  ) : (
                    <p className="text-sm text-gray-900">Guest Session</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Products</label>
                  <p className="text-sm text-gray-900">{selectedComparison.itemCount} items</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  {getStatusBadge(selectedComparison)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                  <p className="text-sm text-gray-900">
                    {format(new Date(selectedComparison.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                  <p className="text-sm text-gray-900">
                    {format(new Date(selectedComparison.updatedAt), 'MMM dd, yyyy HH:mm:ss')}
                  </p>
                </div>
                {selectedComparison.expiresAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expires</label>
                    <p className="text-sm text-gray-900">
                      {format(new Date(selectedComparison.expiresAt), 'MMM dd, yyyy HH:mm:ss')}
                    </p>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default withAuth(AdminComparisonsPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
