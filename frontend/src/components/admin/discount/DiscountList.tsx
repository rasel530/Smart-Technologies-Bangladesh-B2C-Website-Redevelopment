'use client';

import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  X,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  Copy
} from 'lucide-react';
import adminDiscountApi, {
  Discount,
  CreateDiscountData
} from '@/lib/api/admin/discount';

interface DiscountListProps {
  language?: 'en' | 'bn';
  onEdit?: (discount: Discount) => void;
}

const DiscountList: React.FC<DiscountListProps> = ({
  language = 'en',
  onEdit
}) => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    isActive: undefined as boolean | undefined,
    search: ''
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);

  // Create form state
  const [formData, setFormData] = useState<CreateDiscountData>({
    code: '',
    type: 'PERCENTAGE',
    value: 0,
    description: '',
    maxUses: undefined,
    expiresAt: ''
  });

  const translations = {
    en: {
      title: 'Discount Management',
      createDiscount: 'Create Discount',
      editDiscount: 'Edit Discount',
      search: 'Search discounts...',
      filter: 'Filter',
      all: 'All',
      active: 'Active',
      inactive: 'Inactive',
      code: 'Code',
      type: 'Type',
      value: 'Value',
      description: 'Description',
      uses: 'Uses',
      status: 'Status',
      expiresAt: 'Expires At',
      createdAt: 'Created At',
      actions: 'Actions',
      noDiscounts: 'No discounts found',
      create: 'Create',
      update: 'Update',
      cancel: 'Cancel',
      delete: 'Delete',
      confirmDelete: 'Are you sure you want to deactivate this discount?',
      discountCode: 'Discount Code',
      enterCode: 'Enter code',
      percentage: 'Percentage',
      fixed: 'Fixed Amount',
      promotional: 'Promotional',
      maxUsesLabel: 'Max Uses (optional)',
      expiresAtLabel: 'Expires At (optional)',
      success: 'Success',
      error: 'Error',
      discountCreated: 'Discount created successfully',
      discountUpdated: 'Discount updated successfully',
      discountDeleted: 'Discount deactivated successfully',
      copyCode: 'Copy code',
      copied: 'Copied!'
    },
    bn: {
      title: 'ডিসকাউন্ট ব্যবস্থাপনা',
      createDiscount: 'ডিসকাউন্ট তৈরি করুন',
      editDiscount: 'ডিসকাউন্ট সম্পাদনা করুন',
      search: 'ডিসকাউন্ট খুঁজুন...',
      filter: 'ফিল্টার',
      all: 'সব',
      active: 'সক্রিয়',
      inactive: 'নিষ্ক্রিয়',
      code: 'কোড',
      type: 'ধরন',
      value: 'মান',
      description: 'বিবরণ',
      uses: 'ব্যবহার',
      status: 'স্ট্যাটাস',
      expiresAt: 'মেয়াদ শেষ',
      createdAt: 'তৈরি হয়েছে',
      actions: 'ক্রিয়া',
      noDiscounts: 'কোনো ডিসকাউন্ট পাওয়া যায়নি',
      create: 'তৈরি করুন',
      update: 'আপডেট করুন',
      cancel: 'বাতিল',
      delete: 'মুছুন',
      confirmDelete: 'আপনি কি নিশ্চিত যে আপনি এই ডিসকাউন্ট নিষ্ক্রিয় করতে চান?',
      discountCode: 'ডিসকাউন্ট কোড',
      enterCode: 'কোড লিখুন',
      percentage: 'শতাংশ',
      fixed: 'স্থির পরিমাণ',
      promotional: 'প্রমোশনাল',
      maxUsesLabel: 'সর্বোচ্চ ব্যবহার (ঐচ্ছিক)',
      expiresAtLabel: 'মেয়াদ শেষ (ঐচ্ছিক)',
      success: 'সফল',
      error: 'ত্রুটি',
      discountCreated: 'ডিসকাউন্ট সফলভাবে তৈরি হয়েছে',
      discountUpdated: 'ডিসকাউন্ট সফলভাবে আপডেট হয়েছে',
      discountDeleted: 'ডিসকাউন্ট সফলভাবে নিষ্ক্রিয় হয়েছে',
      copyCode: 'কোড কপি করুন',
      copied: 'কপি হয়েছে!'
    }
  };

  const t = translations[language];

  // Fetch discounts
  const fetchDiscounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminDiscountApi.getDiscounts({
        isActive: filters.isActive,
        page: pagination.page,
        limit: pagination.limit
      });
      setDiscounts(result.discounts);
      setPagination(prev => ({
        ...prev,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages
      }));
    } catch (err: any) {
      setError(err.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, [pagination.page, filters.isActive]);

  // Handle create/update
  const handleSubmit = async () => {
    if (!formData.code.trim()) {
      setError('Discount code is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingDiscount) {
        await adminDiscountApi.updateDiscount(editingDiscount.id, {
          maxUses: formData.maxUses,
          expiresAt: formData.expiresAt || undefined,
          description: formData.description
        });
        setSuccess(t.discountUpdated);
      } else {
        await adminDiscountApi.createDiscount(formData);
        setSuccess(t.discountCreated);
      }
      setShowCreateDialog(false);
      setEditingDiscount(null);
      setFormData({
        code: '',
        type: 'PERCENTAGE',
        value: 0,
        description: '',
        maxUses: undefined,
        expiresAt: ''
      });
      fetchDiscounts();
    } catch (err: any) {
      setError(err.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (discount: Discount) => {
    if (!confirm(t.confirmDelete)) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await adminDiscountApi.deleteDiscount(discount.id, 'Deactivated by admin');
      setSuccess(t.discountDeleted);
      fetchDiscounts();
    } catch (err: any) {
      setError(err.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (discount: Discount) => {
    setEditingDiscount(discount);
    setFormData({
      code: discount.code,
      type: discount.type,
      value: discount.value,
      description: discount.description || '',
      maxUses: discount.maxUses || undefined,
      expiresAt: discount.expiresAt ? new Date(discount.expiresAt).toISOString().split('T')[0] : ''
    });
    setShowCreateDialog(true);
    onEdit?.(discount);
  };

  // Copy code to clipboard
  const copyToClipboard = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setSuccess(t.copied);
    setTimeout(() => setSuccess(null), 2000);
  };

  // Format date
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get type label
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'PERCENTAGE': return t.percentage;
      case 'FIXED': return t.fixed;
      case 'PROMOTIONAL': return t.promotional;
      default: return type;
    }
  };

  return (
    <div className="space-y-4">
      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-green-700">{success}</span>
          <button
            onClick={() => setSuccess(null)}
            className="ml-auto text-green-500 hover:text-green-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{t.title}</h2>
        <button
          onClick={() => {
            setEditingDiscount(null);
            setFormData({
              code: '',
              type: 'PERCENTAGE',
              value: 0,
              description: '',
              maxUses: undefined,
              expiresAt: ''
            });
            setShowCreateDialog(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t.createDiscount}
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white rounded-lg shadow p-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t.search}
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filters.isActive === undefined ? '' : filters.isActive.toString()}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              isActive: e.target.value === '' ? undefined : e.target.value === 'true'
            }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">{t.all}</option>
            <option value="true">{t.active}</option>
            <option value="false">{t.inactive}</option>
          </select>
        </div>
      </div>

      {/* Discounts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : discounts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t.noDiscounts}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[800px] divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.code}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.type}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.value}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.uses}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.status}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.expiresAt}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {discounts.map((discount) => (
                  <tr key={discount.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {discount.code}
                        </span>
                        <button
                          onClick={() => copyToClipboard(discount.code)}
                          className="text-gray-400 hover:text-gray-600"
                          title={t.copyCode}
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getTypeLabel(discount.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {discount.type === 'PERCENTAGE' ? `${discount.value}%` : `৳${discount.value}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {discount.usedCount}{discount.maxUses ? `/${discount.maxUses}` : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        discount.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {discount.isActive ? t.active : t.inactive}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(discount.expiresAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(discount)}
                          className="text-blue-600 hover:text-blue-900"
                          title={t.editDiscount}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(discount)}
                          className="text-red-600 hover:text-red-900"
                          title={t.delete}
                        >
                          <Trash2 className="w-4 h-4" />
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
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-700">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {editingDiscount ? t.editDiscount : t.createDiscount}
              </h3>
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setEditingDiscount(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.discountCode}
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder={t.enterCode}
                  disabled={!!editingDiscount}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.type}
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="PERCENTAGE">{t.percentage}</option>
                  <option value="FIXED">{t.fixed}</option>
                  <option value="PROMOTIONAL">{t.promotional}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.value}
                </label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                  min={0}
                  step={formData.type === 'PERCENTAGE' ? 1 : 0.01}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.description}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.maxUsesLabel}
                </label>
                <input
                  type="number"
                  value={formData.maxUses || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxUses: e.target.value ? parseInt(e.target.value) : undefined }))}
                  min={1}
                  placeholder="Unlimited"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.expiresAtLabel}
                </label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setEditingDiscount(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : (editingDiscount ? t.update : t.create)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountList;
