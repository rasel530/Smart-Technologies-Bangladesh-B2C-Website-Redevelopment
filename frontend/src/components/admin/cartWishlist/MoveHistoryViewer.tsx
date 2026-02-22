'use client';

import React, { useEffect, useState } from 'react';
import {
  Download,
  RefreshCw,
  Filter,
  ArrowRight,
  ArrowLeft,
  ShoppingCart,
  Heart,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { useAdminCartWishlistStore } from '@/store/adminCartWishlistStore';
import { withAuth } from '@/components/auth/withAuth';

interface MoveHistoryViewerProps {
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
  productId: string;
  moveTypeFilter: string;
  startDate: string;
  endDate: string;
  allTypes: string;
  id: string;
  user: string;
  product: string;
  moveType: string;
  quantity: string;
  date: string;
  cartToWishlist: string;
  wishlistToCart: string;
  previous: string;
  next: string;
  page: string;
  of: string;
  total: string;
  sortBy: string;
  userName: string;
  productName: string;
  ascending: string;
  descending: string;
  noMoves: string;
}

const MoveHistoryViewer: React.FC<MoveHistoryViewerProps> = ({ language = 'en' }) => {
  const {
    moveHistory,
    isLoading,
    error,
    fetchMoveHistory,
    setMoveHistoryFilters,
    exportMoveHistory,
    clearError,
  } = useAdminCartWishlistStore();

  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'user' | 'product'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchMoveHistory();
  }, []);

  const handleFilter = () => {
    fetchMoveHistory();
  };

  const handleClearFilters = () => {
    setMoveHistoryFilters({
      userId: undefined,
      productId: undefined,
      moveType: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  };

  const handleSort = (field: 'date' | 'user' | 'product') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handlePageChange = (newPage: number) => {
    fetchMoveHistory({ page: newPage });
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
      title: 'Move History Viewer',
      subtitle: 'View all move operations between cart and wishlist',
      refresh: 'Refresh',
      filters: 'Filters',
      apply: 'Apply',
      clear: 'Clear',
      export: 'Export',
      loading: 'Loading...',
      error: 'Error loading move history',
      retry: 'Retry',
      userId: 'User ID',
      productId: 'Product ID',
      moveTypeFilter: 'Move Type',
      startDate: 'Start Date',
      endDate: 'End Date',
      allTypes: 'All Types',
      id: 'ID',
      user: 'User',
      product: 'Product',
      moveType: 'Move Type',
      quantity: 'Quantity',
      date: 'Date',
      cartToWishlist: 'Cart to Wishlist',
      wishlistToCart: 'Wishlist to Cart',
      previous: 'Previous',
      next: 'Next',
      page: 'Page',
      of: 'of',
      total: 'Total',
      sortBy: 'Sort by',
      userName: 'User Name',
      productName: 'Product Name',
      ascending: 'Ascending',
      descending: 'Descending',
      noMoves: 'No move history found',
    },
    bn: {
      title: 'মুভ ইতিহাস ভিউয়ার',
      subtitle: 'কার্ট এবং উইশলিস্টের মধ্যে সকল মুভ অপারেশন দেখুন',
      refresh: 'রিফ্রেশ',
      filters: 'ফিল্টার',
      apply: 'প্রয়োগ করুন',
      clear: 'সাফ করুন',
      export: 'রপ্তানি',
      loading: 'লোড হচ্ছে...',
      error: 'মুভ ইতিহাস লোড করতে সমস্যা',
      retry: 'পুনরায় চেষ্টা করুন',
      userId: 'ব্যবহারকারী আইডি',
      productId: 'প্রোডাক্ট আইডি',
      moveTypeFilter: 'মুভ ধরন',
      startDate: 'শুরু তারিখ',
      endDate: 'শেষ তারিখ',
      allTypes: 'সব ধরন',
      id: 'আইডি',
      user: 'ব্যবহারকারী',
      product: 'প্রোডাক্ট',
      moveType: 'মুভ ধরন',
      quantity: 'পরিমাণ',
      date: 'তারিখ',
      cartToWishlist: 'কার্ট থেকে উইশলিস্ট',
      wishlistToCart: 'উইশলিস্ট থেকে কার্ট',
      previous: 'আগে',
      next: 'পরে',
      page: 'পৃষ্ঠা',
      of: 'এর',
      total: 'মোট',
      sortBy: 'সর্ট করুন',
      userName: 'ব্যবহারকারী নাম',
      productName: 'প্রোডাক্ট নাম',
      ascending: 'আরোহী',
      descending: 'নিচু',
      noMoves: 'কোন মুভ ইতিহাস পাওয়া যায়নি',
    }
  };

  const t = translations[language];
  const totalPages = Math.ceil(moveHistory.total / moveHistory.pageSize);

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
            onClick={() => fetchMoveHistory()}
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
            onClick={() => exportMoveHistory('json')}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
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
              <div className="h-5 w-5 text-red-400">!</div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-red-700">{t.error}: {error}</p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => {
                  clearError();
                  fetchMoveHistory();
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder={t.userId}
              value={moveHistory.filters.userId || ''}
              onChange={(e) => setMoveHistoryFilters({ userId: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder={t.productId}
              value={moveHistory.filters.productId || ''}
              onChange={(e) => setMoveHistoryFilters({ productId: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={moveHistory.filters.moveType || ''}
              onChange={(e) => setMoveHistoryFilters({ moveType: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t.allTypes}</option>
              <option value="cart_to_wishlist">{t.cartToWishlist}</option>
              <option value="wishlist_to_cart">{t.wishlistToCart}</option>
            </select>
            <input
              type="date"
              placeholder={t.startDate}
              value={moveHistory.filters.startDate || ''}
              onChange={(e) => setMoveHistoryFilters({ startDate: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="date"
              placeholder={t.endDate}
              value={moveHistory.filters.endDate || ''}
              onChange={(e) => setMoveHistoryFilters({ endDate: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 mt-4">
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
      )}

      {/* Sort Options */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{t.sortBy}:</span>
        <button
          onClick={() => handleSort('date')}
          className={`px-3 py-1 rounded text-sm ${
            sortBy === 'date' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
          }`}
        >
          {t.date}
        </button>
        <button
          onClick={() => handleSort('user')}
          className={`px-3 py-1 rounded text-sm ${
            sortBy === 'user' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
          }`}
        >
          {t.userName}
        </button>
        <button
          onClick={() => handleSort('product')}
          className={`px-3 py-1 rounded text-sm ${
            sortBy === 'product' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
          }`}
        >
          {t.productName}
        </button>
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className={`px-3 py-1 rounded text-sm ${
            sortOrder === 'asc' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
          }`}
        >
          {sortOrder === 'asc' ? t.ascending : t.descending}
        </button>
      </div>

      {/* Move History Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">{t.title}</h2>
          <span className="text-sm text-gray-500">
            {t.total}: {moveHistory.total}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1000px] divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.id}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.user}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.product}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.moveType}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.quantity}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.date}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {t.loading}
                  </td>
                </tr>
              ) : moveHistory.history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {t.noMoves}
                  </td>
                </tr>
              ) : (
                moveHistory.history.map((move) => (
                  <tr key={move.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {move.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {move.userName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {move.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {move.moveType === 'cart_to_wishlist' ? (
                          <>
                            <ShoppingCart className="h-4 w-4 text-blue-600" />
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                            <Heart className="h-4 w-4 text-pink-600" />
                          </>
                        ) : (
                          <>
                            <Heart className="h-4 w-4 text-pink-600" />
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                            <ShoppingCart className="h-4 w-4 text-blue-600" />
                          </>
                        )}
                        <span className="text-xs text-gray-600">
                          {move.moveType === 'cart_to_wishlist' ? t.cartToWishlist : t.wishlistToCart}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {move.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(move.createdAt)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {t.total}: {moveHistory.total}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(moveHistory.page - 1)}
              disabled={moveHistory.page === 1}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              {t.previous}
            </button>
            <span className="px-4 py-2">
              {t.page} {moveHistory.page} {t.of} {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(moveHistory.page + 1)}
              disabled={moveHistory.page === totalPages}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {t.next}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default withAuth(MoveHistoryViewer, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/unauthorized',
});
