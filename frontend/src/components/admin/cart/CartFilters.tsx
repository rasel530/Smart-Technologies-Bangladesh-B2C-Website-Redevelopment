'use client';

import React from 'react';
import { Search, Filter, X, Calendar, User } from 'lucide-react';
import { CartFilters as CartFiltersType } from '@/lib/api/admin/cart';

interface CartFiltersProps {
  filters: CartFiltersType;
  onFiltersChange: (filters: CartFiltersType) => void;
  onApply: () => void;
  language?: 'en' | 'bn';
}

const CartFilters: React.FC<CartFiltersProps> = ({
  filters,
  onFiltersChange,
  onApply,
  language = 'en'
}) => {
  const translations = {
    en: {
      searchPlaceholder: 'Search by cart ID or user email...',
      status: 'Status',
      allStatuses: 'All Statuses',
      active: 'Active',
      abandoned: 'Abandoned',
      converted: 'Converted',
      expired: 'Expired',
      sortBy: 'Sort By',
      newest: 'Newest First',
      oldest: 'Oldest First',
      highestValue: 'Highest Value',
      lowestValue: 'Lowest Value',
      apply: 'Apply Filters',
      clear: 'Clear Filters',
      dateRange: 'Date Range',
      startDate: 'Start Date',
      endDate: 'End Date',
      userFilter: 'User Filter',
      userId: 'User ID'
    },
    bn: {
      searchPlaceholder: 'কার্ট আইডি বা ব্যবহারকারী ইমেইল দিয়ে অনুসন্ধান করুন...',
      status: 'স্ট্যাটাস',
      allStatuses: 'সব স্ট্যাটাস',
      active: 'সক্রিয়',
      abandoned: 'পরিত্যাগ',
      converted: 'রূপান্তরিত',
      expired: 'মেয়াদোত্তীর্ণ',
      sortBy: 'সর্ট অনুযায়ে',
      newest: 'নতুনতম আগে',
      oldest: 'পুরনোতম আগে',
      highestValue: 'সর্বোচ্চ মূল্য আগে',
      lowestValue: 'সর্বনিম্ন মূল্য আগে',
      apply: 'ফিল্টার প্রয়োগ করুন',
      clear: 'ফিল্টার সাফ করুন',
      dateRange: 'তারিখ সীমা',
      startDate: 'শুরুর তারিখ',
      endDate: 'শেষের তারিখ',
      userFilter: 'ব্যবহারকারী ফিল্টার',
      userId: 'ব্যবহারকারী আইডি'
    }
  };

  const t = translations[language];

  const handleChange = (key: keyof CartFiltersType, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleClear = () => {
    onFiltersChange({
      page: 1,
      limit: 20,
      status: undefined,
      search: '',
      userId: undefined,
      startDate: undefined,
      endDate: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="space-y-4">
        {/* Search */}
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 min-w-[60px]">
            {t.status}:
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleChange('status', e.target.value || undefined)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">{t.allStatuses}</option>
            <option value="active">{t.active}</option>
            <option value="abandoned">{t.abandoned}</option>
            <option value="converted">{t.converted}</option>
            <option value="expired">{t.expired}</option>
          </select>
        </div>

        {/* Date Range Filter (AP-CRIT-001: Missing cart filtering) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <label className="text-sm font-medium text-gray-700">
              {t.dateRange}:
            </label>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">{t.startDate}</label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleChange('startDate', e.target.value || undefined)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">{t.endDate}</label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleChange('endDate', e.target.value || undefined)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* User Filter (AP-CRIT-001: Missing cart filtering) */}
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <label className="text-sm font-medium text-gray-700 min-w-[60px]">
            {t.userFilter}:
          </label>
          <input
            type="text"
            placeholder={t.userId}
            value={filters.userId || ''}
            onChange={(e) => handleChange('userId', e.target.value || undefined)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Sort By */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 min-w-[60px]">
            {t.sortBy}:
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleChange('sortBy', e.target.value as any)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="createdAt">{t.newest}</option>
            <option value="updatedAt">{t.oldest}</option>
            <option value="total">{t.highestValue}</option>
          </select>
          <select
            value={filters.sortOrder}
            onChange={(e) => handleChange('sortOrder', e.target.value as any)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="desc">{t.highestValue}</option>
            <option value="asc">{t.lowestValue}</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X className="w-4 h-4" />
            {t.clear}
          </button>
          <button
            onClick={onApply}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
            {t.apply}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartFilters;
