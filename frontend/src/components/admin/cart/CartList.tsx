'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Eye, Trash2, Search, Filter, Download, CheckSquare, Square, AlertTriangle } from 'lucide-react';
import adminCartApi, { AdminCart, CartFilters } from '@/lib/api/admin/cart';

interface CartListProps {
  language?: 'en' | 'bn';
}

const CartList: React.FC<CartListProps> = ({ language = 'en' }) => {
  const [carts, setCarts] = useState<AdminCart[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<CartFilters>({
    page: 1,
    limit: 20,
    status: undefined,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCarts, setSelectedCarts] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchCarts();
  }, [page, filters.status, filters.search, filters.userId, filters.startDate, filters.endDate, filters.sortBy, filters.sortOrder]);

  useEffect(() => {
    // Update select all state when all carts are selected
    if (carts.length > 0 && selectedCarts.size === carts.length) {
      setSelectAll(true);
    } else if (selectedCarts.size === 0) {
      setSelectAll(false);
    }
  }, [selectedCarts, carts.length]);

  const fetchCarts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminCartApi.getCarts({
        ...filters,
        page
      });
      setCarts(response.carts);
      setTotalPages(response.pagination.pages);
      setTotal(response.pagination.total);
      // Clear selection when fetching new carts
      setSelectedCarts(new Set());
      setSelectAll(false);
    } catch (error: any) {
      console.error('[CartList] Error fetching carts:', error);
      let errorMessage = 'Failed to load carts. Please try again.';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      if (error?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error?.status === 403) {
        errorMessage = 'You do not have permission to view carts.';
      } else if (error?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }

      setError(errorMessage);
      setCarts([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCarts();
  };

  const handleClearCart = async (cartId: string) => {
    if (!confirm('Are you sure you want to clear this cart?')) return;

    try {
      await adminCartApi.clearCart(cartId);
      setCarts(carts.map(c =>
        c.id === cartId ? { ...c, items: [], total: 0, subtotal: 0 } : c
      ));
    } catch (error) {
      console.error('Error clearing cart:', error);
      alert('Failed to clear cart');
    }
  };

  // AP-HIGH-001: Export functionality
  const handleExport = async () => {
    setExportLoading(true);
    try {
      const blob = await adminCartApi.exportCarts(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `carts_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting carts:', error);
      alert('Failed to export carts');
    } finally {
      setExportLoading(false);
    }
  };

  // AP-HIGH-002: Bulk actions
  const handleSelectCart = (cartId: string) => {
    setSelectedCarts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cartId)) {
        newSet.delete(cartId);
      } else {
        newSet.add(cartId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCarts(new Set());
    } else {
      setSelectedCarts(new Set(carts.map(c => c.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleBulkDelete = async () => {
    const cartIds = Array.from(selectedCarts);
    if (cartIds.length === 0) {
      alert('Please select at least one cart to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${cartIds.length} cart(s)?`)) return;

    try {
      await adminCartApi.bulkDeleteCarts({ cartIds });
      setCarts(carts.filter(c => !selectedCarts.has(c.id)));
      setSelectedCarts(new Set());
      setSelectAll(false);
      alert(`${cartIds.length} cart(s) deleted successfully`);
    } catch (error) {
      console.error('Error bulk deleting carts:', error);
      alert('Failed to delete carts');
    }
  };

  const handleBulkClear = async () => {
    const cartIds = Array.from(selectedCarts);
    if (cartIds.length === 0) {
      alert('Please select at least one cart to clear');
      return;
    }

    if (!confirm(`Are you sure you want to clear ${cartIds.length} cart(s)?`)) return;

    try {
      await adminCartApi.bulkClearCarts({ cartIds });
      setCarts(carts.map(c =>
        selectedCarts.has(c.id) ? { ...c, items: [], total: 0, subtotal: 0 } : c
      ));
      setSelectedCarts(new Set());
      setSelectAll(false);
      alert(`${cartIds.length} cart(s) cleared successfully`);
    } catch (error) {
      console.error('Error bulk clearing carts:', error);
      alert('Failed to clear carts');
    }
  };

  const handleBulkUpdateStatus = async (status: 'active' | 'abandoned' | 'converted' | 'expired') => {
    const cartIds = Array.from(selectedCarts);
    if (cartIds.length === 0) {
      alert('Please select at least one cart to update');
      return;
    }

    if (!confirm(`Are you sure you want to update ${cartIds.length} cart(s) to ${status}?`)) return;

    try {
      await adminCartApi.bulkUpdateCartStatus({ cartIds, status });
      setCarts(carts.map(c =>
        selectedCarts.has(c.id) ? { ...c, status } : c
      ));
      setSelectedCarts(new Set());
      setSelectAll(false);
      alert(`${cartIds.length} cart(s) updated successfully`);
    } catch (error) {
      console.error('Error bulk updating cart status:', error);
      alert('Failed to update cart status');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      abandoned: 'bg-yellow-100 text-yellow-800',
      converted: 'bg-blue-100 text-blue-800',
      expired: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
      </span>
    );
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number): string => {
    if (typeof price !== 'number' || isNaN(price)) {
      return '৳0.00';
    }
    return `৳${price.toFixed(2)}`;
  };

  const translations = {
    en: {
      title: 'Carts',
      searchPlaceholder: 'Search carts...',
      allStatuses: 'All Statuses',
      active: 'Active',
      abandoned: 'Abandoned',
      converted: 'Converted',
      expired: 'Expired',
      newest: 'Newest',
      oldest: 'Oldest',
      highestValue: 'Highest Value',
      lowestValue: 'Lowest Value',
      view: 'View',
      clear: 'Clear',
      loading: 'Loading...',
      noCarts: 'No carts found',
      previous: 'Previous',
      next: 'Next',
      page: 'Page',
      of: 'of',
      total: 'Total',
      items: 'Items',
      user: 'User',
      date: 'Date',
      status: 'Status',
      actions: 'Actions',
      filters: 'Filters',
      apply: 'Apply',
      export: 'Export',
      bulkActions: 'Bulk Actions',
      bulkDelete: 'Delete Selected',
      bulkClear: 'Clear Selected',
      bulkSetActive: 'Set Active',
      bulkSetAbandoned: 'Set Abandoned',
      bulkSetConverted: 'Set Converted',
      bulkSetExpired: 'Set Expired',
      selected: 'selected'
    },
    bn: {
      title: 'কার্ট',
      searchPlaceholder: 'কার্ট অনুসন্ধান করুন...',
      allStatuses: 'সব স্ট্যাটাস',
      active: 'সক্রিয়',
      abandoned: 'পরিত্যাগ',
      converted: 'রূপান্তরিত',
      expired: 'মেয়াদোত্তীর্ণ',
      newest: 'নতুনতম',
      oldest: 'পুরনোতম',
      highestValue: 'সর্বোচ্চ মূল্য',
      lowestValue: 'সর্বনিম্ন মূল্য',
      view: 'দেখুন',
      clear: 'সাফ করুন',
      loading: 'লোড হচ্ছে...',
      noCarts: 'কোন কার্ট পাওয়া যায়নি',
      previous: 'আগে',
      next: 'পরে',
      page: 'পৃষ্ঠা',
      of: 'এর',
      total: 'মোট',
      items: 'আইটেম',
      user: 'ব্যবহারকারী',
      date: 'তারিখ',
      status: 'স্ট্যাটাস',
      actions: 'ক্রিয়া',
      filters: 'ফিল্টার',
      apply: 'প্রয়োগ করুন',
      export: 'রপ্তানি',
      bulkActions: 'বাল্ক ক্রিয়া',
      bulkDelete: 'নির্বাচিত মুছে ফেলুন',
      bulkClear: 'নির্বাচিত সাফ করুন',
      bulkSetActive: 'সক্রিয় সেট করুন',
      bulkSetAbandoned: 'পরিত্যাগ সেট করুন',
      bulkSetConverted: 'রূপান্তরিত সেট করুন',
      bulkSetExpired: 'মেয়াদোত্তীর্ণ সেট করুন',
      selected: 'নির্বাচিত'
    }
  };

  const t = translations[language];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <div className="flex gap-2">
          {/* AP-HIGH-001: Export button */}
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {exportLoading ? 'Exporting...' : t.export}
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            {t.filters}
          </button>
        </div>
      </div>

      {/* AP-HIGH-002: Bulk Actions Bar */}
      {selectedCarts.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {selectedCarts.size} {t.selected}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
                {t.bulkDelete}
              </button>
              <button
                onClick={handleBulkClear}
                className="flex items-center gap-2 px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
              >
                {t.bulkClear}
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <button
                onClick={() => handleBulkUpdateStatus('active')}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                {t.bulkSetActive}
              </button>
              <button
                onClick={() => handleBulkUpdateStatus('abandoned')}
                className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
              >
                {t.bulkSetAbandoned}
              </button>
              <button
                onClick={() => handleBulkUpdateStatus('converted')}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                {t.bulkSetConverted}
              </button>
              <button
                onClick={() => handleBulkUpdateStatus('expired')}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                {t.bulkSetExpired}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as any || undefined })}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t.allStatuses}</option>
                <option value="active">{t.active}</option>
                <option value="abandoned">{t.abandoned}</option>
                <option value="converted">{t.converted}</option>
                <option value="expired">{t.expired}</option>
              </select>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="createdAt">{t.newest}</option>
                <option value="updatedAt">{t.oldest}</option>
                <option value="total">{t.highestValue}</option>
              </select>
              <select
                value={filters.sortOrder}
                onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value as any })}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="desc">{t.highestValue}</option>
                <option value="asc">{t.lowestValue}</option>
              </select>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                {t.apply}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => fetchCarts()}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Carts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">{t.loading}</div>
        ) : carts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t.noCarts}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[800px] divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {/* AP-HIGH-002: Bulk selection checkbox */}
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={handleSelectAll}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {selectAll ? (
                        <CheckSquare className="w-5 h-5" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.user}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.items}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.total}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.status}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.date}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {carts.map((cart) => (
                  <tr key={cart.id} className="hover:bg-gray-50">
                    {/* AP-HIGH-002: Individual cart selection checkbox */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleSelectCart(cart.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {selectedCarts.has(cart.id) ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ShoppingCart className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          {cart.user ? (
                            <>
                              <div className="text-sm font-medium text-gray-900">
                                {cart.user.firstName} {cart.user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{cart.user.email}</div>
                            </>
                          ) : (
                            <div className="text-sm text-gray-500">Guest Cart</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cart._count?.items || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(cart.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(cart.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(cart.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/cart/${cart.id}`}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          {t.view}
                        </Link>
                        <button
                          onClick={() => handleClearCart(cart.id)}
                          className="text-red-600 hover:text-red-900 flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          {t.clear}
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
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {t.total}: {total}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.previous}
            </button>
            <span className="px-4 py-2">
              {t.page} {page} {t.of} {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.next}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartList;
