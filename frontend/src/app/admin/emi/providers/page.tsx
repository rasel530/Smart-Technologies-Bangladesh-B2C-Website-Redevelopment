'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Check, X, MoreVertical, XCircle } from 'lucide-react';
import { withAuth } from '@/components/auth/withAuth';
import { PageWrapper, Badge, ButtonPrimary, ButtonDanger } from '@/components/design-system';
import { apiClient } from '@/lib/api/client';

interface EmiProvider {
  id: string;
  name: string;
  logoUrl?: string | null;
  website?: string | null;
  isActive: boolean;
  minAmount: number;
  maxAmount: number;
  processingFee: number;
  interestRate: number;
  createdAt: string;
  updatedAt: string;
  emiPlans?: any[];
}

interface ProviderFormData {
  name: string;
  logoUrl?: string;
  website?: string;
  isActive: boolean;
  minAmount: number;
  maxAmount: number;
  processingFee: number;
  interestRate: number;
}

function EmiProvidersPage() {
  const [providers, setProviders] = useState<EmiProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<EmiProvider | null>(null);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<EmiProvider | null>(null);
  const [formData, setFormData] = useState<ProviderFormData>({
    name: '',
    logoUrl: '',
    website: '',
    isActive: true,
    minAmount: 5000,
    maxAmount: 500000,
    processingFee: 0,
    interestRate: 0,
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ProviderFormData, string>>>({});

  const fetchProviders = async (page: number = 1, search: string = '', isActive?: boolean) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      if (search) params.append('search', search);
      if (isActive !== undefined) params.append('isActive', isActive.toString());

      const response = await apiClient.get<{ providers: EmiProvider[]; pagination: { page: number; limit: number; total: number; pages: number } }>(`/admin/emi/providers?${params.toString()}`);
      
      setProviders(response?.providers || []);
      setPagination({
        page,
        limit: 10,
        total: response?.pagination?.total || 0,
        pages: response?.pagination?.pages || 1,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch providers');
      console.error('Error fetching providers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders(currentPage, searchQuery, filterActive ?? undefined);
  }, [currentPage, filterActive, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProviders(1, searchQuery, filterActive ?? undefined);
  };

  const handleToggleStatus = async (provider: EmiProvider) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      await apiClient.put(`/admin/emi/providers/${provider.id}/toggle-status`);
      
      // Show success message
      setSuccessMessage(`Provider ${provider.name} ${provider.isActive ? 'deactivated' : 'activated'} successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Refresh the list
      await fetchProviders(currentPage, searchQuery, filterActive ?? undefined);
    } catch (err: any) {
      setError(err.message || 'Failed to toggle provider status');
      console.error('Error toggling provider status:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!providerToDelete) return;

    try {
      setIsSubmitting(true);
      setError(null);
      
      await apiClient.delete(`/admin/emi/providers/${providerToDelete.id}`);
      setShowDeleteModal(false);
      setProviderToDelete(null);
      
      // Show success message
      setSuccessMessage(`Provider ${providerToDelete.name} deleted successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Refresh the list
      await fetchProviders(currentPage, searchQuery, filterActive ?? undefined);
    } catch (err: any) {
      setError(err.message || 'Failed to delete provider');
      console.error('Error deleting provider:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFilterChange = (status: boolean | null) => {
    setFilterActive(status);
    setCurrentPage(1);
  };

  const handleOpenAddModal = () => {
    setEditingProvider(null);
    setFormData({
      name: '',
      logoUrl: '',
      website: '',
      isActive: true,
      minAmount: 5000,
      maxAmount: 500000,
      processingFee: 0,
      interestRate: 0,
    });
    setFormErrors({});
    setShowProviderModal(true);
  };

  const handleOpenEditModal = (provider: EmiProvider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      logoUrl: provider.logoUrl || '',
      website: provider.website || '',
      isActive: provider.isActive,
      minAmount: provider.minAmount,
      maxAmount: provider.maxAmount,
      processingFee: provider.processingFee,
      interestRate: provider.interestRate,
    });
    setFormErrors({});
    setShowProviderModal(true);
  };

  const handleCloseModal = () => {
    setShowProviderModal(false);
    setEditingProvider(null);
    setFormData({
      name: '',
      logoUrl: '',
      website: '',
      isActive: true,
      minAmount: 5000,
      maxAmount: 500000,
      processingFee: 0,
      interestRate: 0,
    });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ProviderFormData, string>> = {};

    if (!formData.name.trim()) {
      errors.name = 'Provider name is required';
    } else if (formData.name.length < 2) {
      errors.name = 'Provider name must be at least 2 characters';
    } else if (formData.name.length > 100) {
      errors.name = 'Provider name must not exceed 100 characters';
    }

    if (formData.logoUrl && !isValidUrl(formData.logoUrl)) {
      errors.logoUrl = 'Logo URL must be a valid URL';
    }

    if (formData.website && !isValidUrl(formData.website)) {
      errors.website = 'Website must be a valid URL';
    }

    if (formData.minAmount < 0) {
      errors.minAmount = 'Min amount must be non-negative';
    }

    if (formData.maxAmount < 0) {
      errors.maxAmount = 'Max amount must be non-negative';
    }

    if (formData.minAmount > formData.maxAmount) {
      errors.minAmount = 'Min amount cannot be greater than max amount';
    }

    if (formData.processingFee < 0) {
      errors.processingFee = 'Processing fee must be non-negative';
    }

    if (formData.interestRate < 0) {
      errors.interestRate = 'Interest rate must be non-negative';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (editingProvider) {
        // Update existing provider
        await apiClient.put(`/admin/emi/providers/${editingProvider.id}`, formData);
        setSuccessMessage(`Provider ${formData.name} updated successfully`);
      } else {
        // Create new provider
        await apiClient.post(`/admin/emi/providers`, formData);
        setSuccessMessage(`Provider ${formData.name} created successfully`);
      }
      
      setTimeout(() => setSuccessMessage(null), 3000);
      handleCloseModal();
      
      // Refresh the list
      await fetchProviders(currentPage, searchQuery, filterActive ?? undefined);
    } catch (err: any) {
      setError(err.message || `Failed to ${editingProvider ? 'update' : 'create'} provider`);
      console.error('Error submitting provider form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageWrapper
      title="EMI Providers"
      description="Manage EMI providers and their settings"
      actions={
        <ButtonPrimary
          leftIcon={<Plus className="w-5 h-5" />}
          onClick={handleOpenAddModal}
        >
          Add Provider
        </ButtonPrimary>
      }
    >
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search providers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <ButtonPrimary type="submit" disabled={isLoading}>
              Search
            </ButtonPrimary>
          </form>

          <div className="flex gap-2">
            <button
              onClick={() => handleFilterChange(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterActive === null
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleFilterChange(true)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterActive === true
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => handleFilterChange(false)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterActive === false
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Providers List */}
      <div className="bg-white rounded-xl shadow-md">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            Loading providers...
          </div>
        ) : providers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No providers found. Create your first EMI provider.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fees & Rates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plans
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {providers.map((provider) => (
                  <tr key={provider.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {provider.logoUrl && (
                          <img
                            src={provider.logoUrl}
                            alt={provider.name}
                            className="w-10 h-10 rounded-lg mr-3 object-cover"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {provider.name}
                          </div>
                          {provider.website && (
                            <a
                              href={provider.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary-600 hover:text-primary-700"
                            >
                              {provider.website}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {provider.minAmount.toLocaleString()} - {provider.maxAmount.toLocaleString()} BDT
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Processing: {provider.processingFee} BDT</div>
                        <div>Interest: {provider.interestRate}%</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge color={provider.isActive ? 'success' : 'neutral'}>
                        {provider.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {provider.emiPlans?.length || 0} plans
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(provider)}
                          disabled={isSubmitting}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={provider.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {provider.isActive ? (
                            <X className="w-4 h-4 text-red-600" />
                          ) : (
                            <Check className="w-4 h-4 text-green-600" />
                          )}
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(provider)}
                          disabled={isSubmitting}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => {
                            setProviderToDelete(provider);
                            setShowDeleteModal(true);
                          }}
                          disabled={isSubmitting}
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} providers
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={pagination.page === 1 || isLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))}
                disabled={pagination.page === pagination.pages || isLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && providerToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Provider
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{providerToDelete.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProviderToDelete(null);
                }}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <ButtonDanger onClick={handleDelete} disabled={isSubmitting}>
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </ButtonDanger>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Provider Modal */}
      {showProviderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 my-8 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingProvider ? 'Edit Provider' : 'Add New Provider'}
              </h3>
              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Provider Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provider Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., City Bank"
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Logo URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    formErrors.logoUrl ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://example.com/logo.png"
                />
                {formErrors.logoUrl && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.logoUrl}</p>
                )}
              </div>

              {/* Website URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    formErrors.website ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://example.com"
                />
                {formErrors.website && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.website}</p>
                )}
              </div>

              {/* Amount Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Amount (BDT) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.minAmount}
                    onChange={(e) => setFormData({ ...formData, minAmount: parseFloat(e.target.value) || 0 })}
                    disabled={isSubmitting}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.minAmount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="5000"
                    min="0"
                  />
                  {formErrors.minAmount && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.minAmount}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Amount (BDT) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.maxAmount}
                    onChange={(e) => setFormData({ ...formData, maxAmount: parseFloat(e.target.value) || 0 })}
                    disabled={isSubmitting}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.maxAmount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="500000"
                    min="0"
                  />
                  {formErrors.maxAmount && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.maxAmount}</p>
                  )}
                </div>
              </div>

              {/* Fees and Rates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Processing Fee (BDT) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.processingFee}
                    onChange={(e) => setFormData({ ...formData, processingFee: parseFloat(e.target.value) || 0 })}
                    disabled={isSubmitting}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.processingFee ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                  {formErrors.processingFee && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.processingFee}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interest Rate (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.interestRate}
                    onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })}
                    disabled={isSubmitting}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.interestRate ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                  {formErrors.interestRate && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.interestRate}</p>
                  )}
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  disabled={isSubmitting}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <ButtonPrimary type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (editingProvider ? 'Updating...' : 'Creating...') : (editingProvider ? 'Update Provider' : 'Create Provider')}
                </ButtonPrimary>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

export default withAuth(EmiProvidersPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/unauthorized'
});
