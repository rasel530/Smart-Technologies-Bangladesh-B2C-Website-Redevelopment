'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  Trash2,
  Clock,
  Mail,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  Search
} from 'lucide-react';
import adminCartApi, {
  type CleanupHistoryResponse
} from '@/lib/api/admin/cart';

interface CartCleanupHistoryProps {
  language?: 'en' | 'bn';
}

const CartCleanupHistory: React.FC<CartCleanupHistoryProps> = ({ language = 'en' }) => {
  const [history, setHistory] = useState<CleanupHistoryResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchHistory();
  }, [page, limit, typeFilter]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await adminCartApi.getCleanupHistory({
        page,
        limit,
        type: typeFilter || undefined
      });
      if (response.success) {
        setHistory(response.data);
      }
    } catch (error) {
      console.error('Error fetching cleanup history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CART_EXPIRED':
        return <Trash2 className="w-4 h-4 text-red-500" />;
      case 'RESERVATION_RELEASED':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'CART_ABANDONED':
        return <RefreshCw className="w-4 h-4 text-yellow-500" />;
      case 'RECOVERY_REMINDER_SENT':
        return <Mail className="w-4 h-4 text-blue-500" />;
      default:
        return <History className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'CART_EXPIRED':
        return 'Cart Expired';
      case 'RESERVATION_RELEASED':
        return 'Reservation Released';
      case 'CART_ABANDONED':
        return 'Cart Abandoned';
      case 'RECOVERY_REMINDER_SENT':
        return 'Reminder Sent';
      default:
        return type;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const filteredHistory = history?.history.filter(entry => {
    if (!searchQuery) return true;
    return (
      entry.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.cartId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.userId?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }) || [];

  const translations = {
    en: {
      title: 'Cleanup History',
      subtitle: 'View past cart cleanup operations',
      type: 'Type',
      cartId: 'Cart ID',
      userId: 'User ID',
      timestamp: 'Timestamp',
      details: 'Details',
      page: 'Page',
      of: 'of',
      entries: 'entries',
      noData: 'No cleanup history found',
      filterByType: 'Filter by type',
      search: 'Search...',
      allTypes: 'All Types',
      expired: 'Expired',
      abandoned: 'Abandoned',
      reminder: 'Reminder',
      reservation: 'Reservation',
      previous: 'Previous',
      next: 'Next',
      showing: 'Showing',
    },
    bn: {
      title: 'পরিষ্কার ইতিহাস',
      subtitle: 'গত কার্ট পরিষ্কার অপারেশনগুলি দেখুন',
      type: 'ধরন',
      cartId: 'কার্ট আইডি',
      userId: 'ব্যবহারকারী আইডি',
      timestamp: 'সময়',
      details: 'বিবরণ',
      page: 'পৃষ্ঠা',
      of: 'এর',
      entries: 'এন্ট্রি',
      noData: 'কোনো পরিষ্কার ইতিহাস পাওয়া যায়নি',
      filterByType: 'ধরন অনুযায়ী ফিল্টার করুন',
      search: 'অনুসন্ধান...',
      allTypes: 'সব ধরন',
      expired: 'মেয়াদোত্তীর্ণ',
      abandoned: 'পরিত্যক্ত',
      reminder: 'রিমাইন্ডার',
      reservation: 'রিজার্ভেশন',
      previous: 'পূর্ববর্তী',
      next: 'পরবর্তী',
      showing: 'দেখাচ্ছে',
    }
  };

  const t = translations[language];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-gray-500">{t.subtitle}</p>
        </div>
        <button
          onClick={() => fetchHistory()}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t.allTypes}</option>
              <option value="CART_EXPIRED">{t.expired}</option>
              <option value="CART_ABANDONED">{t.abandoned}</option>
              <option value="RECOVERY_REMINDER_SENT">{t.reminder}</option>
              <option value="RESERVATION_RELEASED">{t.reservation}</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Page Size */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{t.showing}</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value));
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-500">{t.entries}</span>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            Loading...
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {t.noData}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.type}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.cartId}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.userId}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.timestamp}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.details}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHistory.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(entry.type)}
                        <span className="text-sm font-medium text-gray-900">
                          {getTypeLabel(entry.type)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.cartId.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.userId ? `${entry.userId.slice(0, 8)}...` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(entry.timestamp)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {JSON.stringify(entry.details).slice(0, 50)}...
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {history && history.pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {t.page} {page} {t.of} {history.pagination.pages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                {t.previous}
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === history.pagination.pages}
                className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {t.next}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartCleanupHistory;
