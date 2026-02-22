'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  Download,
  Trash2,
  CheckSquare,
  Square,
  RefreshCw,
} from 'lucide-react';
import { useAdminCartWishlistStore } from '@/store/adminCartWishlistStore';
import { withAuth } from '@/components/auth/withAuth';

interface SyncConflictResolverProps {
  language?: 'en' | 'bn';
}

interface Translations {
  title: string;
  subtitle: string;
  refresh: string;
  filters: string;
  apply: string;
  clear: string;
  export: string;
  loading: string;
  error: string;
  retry: string;
  userId: string;
  filterStatus: string;
  allStatuses: string;
  id: string;
  user: string;
  type: string;
  createdAt: string;
  tableStatus: string;
  actions: string;
  resolve: string;
  keepCart: string;
  keepWishlist: string;
  merge: string;
  bulkResolve: string;
  selected: string;
  adminNote: string;
  confirmResolve: string;
  cancel: string;
  pending: string;
  resolved: string;
  failed: string;
  noConflicts: string;
  allResolved: string;
}

const SyncConflictResolver: React.FC<SyncConflictResolverProps> = ({ language = 'en' }) => {
  const {
    conflicts,
    isLoading,
    error,
    fetchConflicts,
    resolveConflict,
    bulkResolveConflicts,
    toggleConflictSelection,
    selectAllConflicts,
    clearConflictSelection,
    clearError,
  } = useAdminCartWishlistStore();

  const [filters, setFilters] = useState({
    userId: '',
    status: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState<'keep_cart' | 'keep_wishlist' | 'merge'>('keep_cart');
  const [adminNote, setAdminNote] = useState('');
  const [showBulkResolve, setShowBulkResolve] = useState(false);

  useEffect(() => {
    fetchConflicts();
  }, []);

  const handleFilter = () => {
    fetchConflicts({
      userId: filters.userId || undefined,
      status: filters.status || undefined,
    });
  };

  const handleClearFilters = () => {
    setFilters({ userId: '', status: '' });
    fetchConflicts();
  };

  const handleResolve = async (conflictId: string, resolution: 'keep_cart' | 'keep_wishlist' | 'merge') => {
    await resolveConflict(conflictId, resolution);
  };

  const handleBulkResolve = async () => {
    const selectedIds = Array.from(conflicts.selectedConflictIds);
    if (selectedIds.length === 0) return;

    await bulkResolveConflicts(selectedIds, selectedResolution, adminNote);
    setShowBulkResolve(false);
    setAdminNote('');
  };

  const handleExport = () => {
    const data = JSON.stringify(conflicts.conflicts, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conflicts_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
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

  const translations: Record<string, Translations> = {
    en: {
      title: 'Sync Conflict Resolver',
      subtitle: 'View and resolve sync conflicts',
      refresh: 'Refresh',
      filters: 'Filters',
      apply: 'Apply',
      clear: 'Clear',
      export: 'Export',
      loading: 'Loading...',
      error: 'Error loading conflicts',
      retry: 'Retry',
      userId: 'User ID',
      filterStatus: 'Status',
      allStatuses: 'All Statuses',
      id: 'ID',
      user: 'User',
      type: 'Type',
      createdAt: 'Created At',
      tableStatus: 'Status',
      actions: 'Actions',
      resolve: 'Resolve',
      keepCart: 'Keep Cart',
      keepWishlist: 'Keep Wishlist',
      merge: 'Merge',
      bulkResolve: 'Bulk Resolve',
      selected: 'selected',
      adminNote: 'Admin Note (optional)',
      confirmResolve: 'Confirm Resolve',
      cancel: 'Cancel',
      pending: 'Pending',
      resolved: 'Resolved',
      failed: 'Failed',
      noConflicts: 'No conflicts found',
      allResolved: 'All conflicts have been resolved!',
    },
    bn: {
      title: 'সিঙ্ক কনফ্লিক্ট রিজলভার',
      subtitle: 'সিঙ্ক কনফ্লিক্ট দেখুন এবং সমাধান করুন',
      refresh: 'রিফ্রেশ',
      filters: 'ফিল্টার',
      apply: 'প্রয়োগ করুন',
      clear: 'সাফ করুন',
      export: 'রপ্তানি',
      loading: 'লোড হচ্ছে...',
      error: 'কনফ্লিক্ট লোড করতে সমস্যা',
      retry: 'পুনরায় চেষ্টা করুন',
      userId: 'ব্যবহারকারী আইডি',
      filterStatus: 'স্ট্যাটাস',
      allStatuses: 'সব স্ট্যাটাস',
      id: 'আইডি',
      user: 'ব্যবহারকারী',
      type: 'ধরন',
      createdAt: 'তৈরি হয়েছে',
      tableStatus: 'স্ট্যাটাস',
      actions: 'ক্রিয়া',
      resolve: 'সমাধান',
      keepCart: 'কার্ট রাখুন',
      keepWishlist: 'উইশলিস্ট রাখুন',
      merge: 'মার্জ',
      bulkResolve: 'বাল্ক সমাধান',
      selected: 'নির্বাচিত',
      adminNote: 'অ্যাডমিন নোট (ঐচ্ছিক)',
      confirmResolve: 'সমাধান নিশ্চিত করুন',
      cancel: 'বাতিল',
      pending: 'মুলতুবি',
      resolved: 'সমাধান',
      failed: 'ব্যর্থ',
      noConflicts: 'কোন কনফ্লিক্ট পাওয়া যায়নি',
      allResolved: 'সকল কনফ্লিক্ট সমাধান হয়েছে!',
    }
  };

  const t = translations[language];
  const selectedCount = conflicts.selectedConflictIds.size;

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
            onClick={() => fetchConflicts()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {t.refresh}
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            {t.filters}
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
                  fetchConflicts();
                }}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                {t.retry}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder={t.userId}
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t.allStatuses}</option>
              <option value="pending">{t.pending}</option>
              <option value="resolved">{t.resolved}</option>
              <option value="failed">{t.failed}</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleFilter}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t.apply}
              </button>
              <button
                onClick={handleClearFilters}
                className="flex-1 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t.clear}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-900">
                {selectedCount} {t.selected}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBulkResolve(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                {t.bulkResolve}
              </button>
              <button
                onClick={clearConflictSelection}
                className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <XCircle className="w-4 h-4" />
                {t.clear}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conflicts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">{t.title}</h2>
          <span className="text-sm text-gray-500">
            {conflicts.conflicts.length} conflicts
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1000px] divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={selectAllConflicts}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {conflicts.conflicts.length > 0 && conflicts.selectedConflictIds.size === conflicts.conflicts.length ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.id}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.user}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.type}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.createdAt}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.tableStatus}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.actions}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {t.loading}
                  </td>
                </tr>
              ) : conflicts.conflicts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-lg font-medium">{t.allResolved}</p>
                  </td>
                </tr>
              ) : (
                conflicts.conflicts.map((conflict) => (
                  <tr key={conflict.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleConflictSelection(conflict.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {conflicts.selectedConflictIds.has(conflict.id) ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {conflict.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {conflict.userName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {conflict.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(conflict.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conflict.status)}`}>
                        {conflict.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {conflict.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResolve(conflict.id, 'keep_cart')}
                            className="text-blue-600 hover:text-blue-900 text-xs px-2 py-1 border border-blue-200 rounded hover:bg-blue-50"
                            title={t.keepCart}
                          >
                            Cart
                          </button>
                          <button
                            onClick={() => handleResolve(conflict.id, 'keep_wishlist')}
                            className="text-purple-600 hover:text-purple-900 text-xs px-2 py-1 border border-purple-200 rounded hover:bg-purple-50"
                            title={t.keepWishlist}
                          >
                            Wishlist
                          </button>
                          <button
                            onClick={() => handleResolve(conflict.id, 'merge')}
                            className="text-green-600 hover:text-green-900 text-xs px-2 py-1 border border-green-200 rounded hover:bg-green-50"
                            title={t.merge}
                          >
                            Merge
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Resolve Modal */}
      {showBulkResolve && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.bulkResolve}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.resolve}
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="resolution"
                        value="keep_cart"
                        checked={selectedResolution === 'keep_cart'}
                        onChange={(e) => setSelectedResolution(e.target.value as any)}
                        className="mr-2"
                      />
                      <span>{t.keepCart}</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="resolution"
                        value="keep_wishlist"
                        checked={selectedResolution === 'keep_wishlist'}
                        onChange={(e) => setSelectedResolution(e.target.value as any)}
                        className="mr-2"
                      />
                      <span>{t.keepWishlist}</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="resolution"
                        value="merge"
                        checked={selectedResolution === 'merge'}
                        onChange={(e) => setSelectedResolution(e.target.value as any)}
                        className="mr-2"
                      />
                      <span>{t.merge}</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.adminNote}
                  </label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Optional note for audit trail..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowBulkResolve(false);
                    setAdminNote('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleBulkResolve}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {t.confirmResolve}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default withAuth(SyncConflictResolver, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/unauthorized',
});
