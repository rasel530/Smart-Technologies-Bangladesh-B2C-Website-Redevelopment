'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Check, X, Clock, Loader2 } from 'lucide-react';
import { withAuth } from '@/components/auth/withAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { apiClient } from '@/lib/api/client';

interface EmiPlan {
  id: string;
  providerId: string;
  name: string;
  duration: number;
  interestRate: number;
  minAmount: number;
  maxAmount: number;
  processingFee: number;
  downPayment: number;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  provider?: {
    id: string;
    name: string;
    logoUrl?: string | null;
  };
}

interface ProviderOption {
  id: string;
  name: string;
}

interface PlanFormData {
  providerId: string;
  name: string;
  duration: number;
  interestRate: number;
  minAmount: number;
  maxAmount: number;
  processingFee: number;
  downPayment: number;
  isActive: boolean;
  displayOrder: number;
}

function EmiPlansPage() {
  const [plans, setPlans] = useState<EmiPlan[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<EmiPlan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<EmiPlan | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<PlanFormData>({
    providerId: '',
    name: '',
    duration: 12,
    interestRate: 12,
    minAmount: 5000,
    maxAmount: 500000,
    processingFee: 0,
    downPayment: 0,
    isActive: true,
    displayOrder: 0,
  });

  const fetchProviders = async () => {
    try {
      const response = await apiClient.get<{ providers: ProviderOption[]; pagination: { page: number; limit: number; total: number; pages: number } }>('/admin/emi/providers?limit=100');
      setProviders(response?.providers || []);
    } catch (err: any) {
      console.error('Failed to fetch providers:', err);
      setError('Failed to load providers. Please try again.');
    }
  };

  const fetchPlans = async (page: number = 1, search: string = '', isActive?: boolean, providerId?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      if (search) params.append('search', search);
      if (isActive !== undefined) params.append('isActive', isActive.toString());
      if (providerId) params.append('providerId', providerId);

      const response = await apiClient.get<{ plans: EmiPlan[]; pagination: { page: number; limit: number; total: number; pages: number } }>(`/admin/emi/plans?${params.toString()}`);
      
      setPlans(response?.plans || []);
      setPagination({
        page,
        limit: 10,
        total: response?.pagination?.total || 0,
        pages: response?.pagination?.pages || 1,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch plans');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
    fetchPlans(currentPage, searchQuery, filterActive ?? undefined, selectedProvider || undefined);
  }, [currentPage, filterActive, selectedProvider, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPlans(1, searchQuery, filterActive ?? undefined, selectedProvider || undefined);
  };

  const handleToggleStatus = async (plan: EmiPlan) => {
    try {
      await apiClient.put(`/admin/emi/plans/${plan.id}`, {
        ...plan,
        isActive: !plan.isActive,
      });
      setSuccessMessage(`Plan ${plan.name} ${!plan.isActive ? 'activated' : 'deactivated'} successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
      // Refresh list
      fetchPlans(currentPage, searchQuery, filterActive ?? undefined, selectedProvider || undefined);
    } catch (err: any) {
      setError(err.message || 'Failed to toggle plan status');
    }
  };

  const handleDelete = async () => {
    if (!planToDelete) return; 

    try {
      await apiClient.delete(`/admin/emi/plans/${planToDelete.id}`);
      setShowDeleteModal(false);
      setPlanToDelete(null);
      setSuccessMessage(`Plan ${planToDelete.name} deleted successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
      // Refresh list
      fetchPlans(currentPage, searchQuery, filterActive ?? undefined, selectedProvider || undefined);
    } catch (err: any) {
      setError(err.message || 'Failed to delete plan');
    }
  };

  const handleFilterChange = (status: boolean | null) => {
    setFilterActive(status);
    setCurrentPage(1);
  };

  const handleOpenCreateModal = () => {
    setFormData({
      providerId: '',
      name: '',
      duration: 12,
      interestRate: 12,
      minAmount: 5000,
      maxAmount: 500000,
      processingFee: 0,
      downPayment: 0,
      isActive: true,
      displayOrder: 0,
    });
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (plan: EmiPlan) => {
    setPlanToEdit(plan);
    setFormData({
      providerId: plan.providerId,
      name: plan.name,
      duration: plan.duration,
      interestRate: plan.interestRate,
      minAmount: plan.minAmount,
      maxAmount: plan.maxAmount,
      processingFee: plan.processingFee,
      downPayment: plan.downPayment,
      isActive: plan.isActive,
      displayOrder: plan.displayOrder,
    });
    setShowEditModal(true);
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate form before submission
    if (!formData.providerId || formData.providerId.trim() === '') {
      setError('Please select a provider. If no providers are available, you need to create an EMI provider first.');
      setIsSubmitting(false);
      return;
    }

    if (!formData.name || formData.name.trim() === '') {
      setError('Please enter a plan name.');
      setIsSubmitting(false);
      return;
    }

    // Debug logging to diagnose validation issues
    console.log('[handleCreatePlan] Form data being submitted:', formData);
    console.log('[handleCreatePlan] Form data types:', Object.keys(formData).reduce((acc, key) => {
      acc[key as keyof typeof acc] = typeof formData[key as keyof typeof formData];
      return acc;
    }, {} as Record<string, string>));

    try {
      const response = await apiClient.post('/admin/emi/plans', formData);
      console.log('[handleCreatePlan] Response:', response);
      setShowCreateModal(false);
      setSuccessMessage('Plan created successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchPlans(currentPage, searchQuery, filterActive ?? undefined, selectedProvider || undefined);
    } catch (err: any) {
      console.error('[handleCreatePlan] Error:', err);
      console.error('[handleCreatePlan] Error response:', err.response);

      // Show detailed validation error if available
      const errorMessage = err.response?.details 
        ? `Validation failed: ${err.response.details.map((d: any) => d.msg).join(', ')}`
        : err.message || 'Failed to create plan';

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planToEdit) return; 

    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.put(`/admin/emi/plans/${planToEdit.id}`, formData);
      setShowEditModal(false);
      setPlanToEdit(null);
      setSuccessMessage('Plan updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchPlans(currentPage, searchQuery, filterActive ?? undefined, selectedProvider || undefined);
    } catch (err: any) {
      setError(err.message || 'Failed to update plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateMonthlyEmi = (principal: number, rate: number, months: number) => {
    const monthlyRate = rate / 12 / 100;
    if (monthlyRate === 0) return principal / months;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  };

  const PlanFormModal = ({ isOpen, onClose, onSubmit, title, isEdit }: { 
    isOpen: boolean; 
    onClose: () => void; 
    onSubmit: (e: React.FormEvent) => void;
    title: string;
    isEdit: boolean;
  }) => {
    if (!isOpen) return null; 

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6 my-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">{title}</h3>
          
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provider *
                </label>
                <select
                  value={formData.providerId}
                  onChange={(e) => setFormData({ ...formData, providerId: e.target.value })}
                  required
                  disabled={isEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Provider</option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., 12 Months EMI"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (months) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interest Rate (% p.a.) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Amount (BDT) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minAmount}
                  onChange={(e) => setFormData({ ...formData, minAmount: parseInt(e.target.value) })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Amount (BDT) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.maxAmount}
                  onChange={(e) => setFormData({ ...formData, maxAmount: parseInt(e.target.value) })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Processing Fee (BDT)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.processingFee}
                  onChange={(e) => setFormData({ ...formData, processingFee: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Down Payment (BDT)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.downPayment}
                  onChange={(e) => setFormData({ ...formData, downPayment: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEdit ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  isEdit ? 'Update Plan' : 'Create Plan'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout title="EMI Plans">
      <div className="space-y-6">
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search plans..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Search
              </button>
            </form>

            <div className="flex gap-2">
              <select
                value={selectedProvider}
                onChange={(e) => {
                  setSelectedProvider(e.target.value);
                  setCurrentPage(1);
                }}
                className="min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Providers</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => handleFilterChange(null)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterActive === null
                    ? 'bg-blue-100 text-blue-700'
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

        {/* Plans List */}
        <div className="bg-white rounded-xl shadow-md">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              Loading plans...
            </div>
          ) : plans.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No plans found. Create your first EMI plan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Interest Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount Range
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fees
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {plans.map((plan) => {
                    const sampleAmount = plan.minAmount;
                    const monthlyEmi = calculateMonthlyEmi(sampleAmount, plan.interestRate, plan.duration);
                    
                    return (
                      <tr key={plan.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {plan.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            Order: {plan.displayOrder}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {plan.provider?.logoUrl && (
                              <img
                                src={plan.provider.logoUrl}
                                alt={plan.provider.name}
                                className="w-6 h-6 rounded mr-2"
                              />
                            )}
                            <div className="text-sm text-gray-900">
                              {plan.provider?.name || 'Unknown'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Clock className="w-4 h-4 mr-1 text-gray-400" />
                            {plan.duration} months
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {plan.interestRate}% p.a.
                          </div>
                          <div className="text-xs text-gray-500">
                            {(plan.interestRate / 12).toFixed(2)}% p.m.
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {plan.minAmount.toLocaleString()} - {plan.maxAmount.toLocaleString()} BDT
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div>Processing: {plan.processingFee} BDT</div>
                            <div>Down Payment: {plan.downPayment} BDT</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            plan.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {plan.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleStatus(plan)}
                              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                              title={plan.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {plan.isActive ? (
                                <X className="w-4 h-4 text-red-600" />
                              ) : (
                                <Check className="w-4 h-4 text-green-600" />
                              )}
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(plan)}
                              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => {
                                setPlanToDelete(plan);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} plans
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 bg-blue-600 text-white rounded">
                  {pagination.page} / {pagination.pages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create Plan Modal */}
        <PlanFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePlan}
          title="Create New EMI Plan"
          isEdit={false}
        />

        {/* Edit Plan Modal */}
        <PlanFormModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setPlanToEdit(null);
          }}
          onSubmit={handleUpdatePlan}
          title="Edit EMI Plan"
          isEdit={true}
        />

        {/* Delete Confirmation Modal */}
        {showDeleteModal && planToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Delete Plan
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{planToDelete.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPlanToDelete(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default withAuth(EmiPlansPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/unauthorized'
});
