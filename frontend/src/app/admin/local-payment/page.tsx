'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Check, X, Smartphone, CreditCard, XCircle, MessageSquare } from 'lucide-react';
import { withAuth } from '@/components/auth/withAuth';
import { PageWrapper, Badge, ButtonPrimary, ButtonDanger } from '@/components/design-system';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';

interface LocalPaymentMethod {
  id: string;
  name: string;
  code: string;
  displayName: string;
  logoUrl?: string | null;
  isActive: boolean;
  minAmount: number;
  maxAmount: number;
  processingFee: number;
  processingFeePercent: number;
  requiresPhone: boolean;
  requiresPin: boolean;
  supportedNetworks: string[];
  description?: string;
  instructions?: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  code: string;
  displayName: string;
  logoUrl: string;
  isActive: boolean;
  minAmount: number;
  maxAmount: number;
  processingFee: number;
  processingFeePercent: number;
  requiresPhone: boolean;
  requiresPin: boolean;
  description: string;
  instructions: string;
  supportedNetworks: string;
}

const initialFormData: FormData = {
  name: '',
  code: '',
  displayName: '',
  logoUrl: '',
  isActive: true,
  minAmount: 10,
  maxAmount: 200000,
  processingFee: 0,
  processingFeePercent: 0,
  requiresPhone: true,
  requiresPin: false,
  description: '',
  instructions: '',
  supportedNetworks: ''
};

function LocalPaymentMethodsPage() {
  const [methods, setMethods] = useState<LocalPaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [methodToDelete, setMethodToDelete] = useState<LocalPaymentMethod | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<LocalPaymentMethod | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMethods = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<LocalPaymentMethod[]>('/admin/local-payment/methods', {
        timeout: 60000, // 60 second timeout for admin endpoints
        retries: 3, // 3 retry attempts
        retryDelay: 2000 // 2 second base delay between retries
      });
      
      // Diagnostic logging
      console.log('[Local Payment Page] Response received:', {
        type: typeof response,
        isArray: Array.isArray(response),
        length: Array.isArray(response) ? response.length : 'N/A',
        response: response
      });
      
      setMethods(response || []);
    } catch (err: any) {
      console.error('[Local Payment Page] Error fetching methods:', err);
      
      // Enhanced error handling with helpful messages
      let errorMessage = 'Failed to fetch payment methods';
      
      if (err.message?.includes('timeout')) {
        errorMessage = 'Request timeout. The backend service may be unresponsive or Redis is not running. Please ensure the backend server and Redis are running.';
      } else if (err.message?.includes('Redis')) {
        errorMessage = 'Redis connection failed. Please ensure Redis is running on the backend server.';
      } else if (err.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (err.status === 403) {
        errorMessage = 'Access denied. You do not have permission to view payment methods.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleToggleStatus = async (method: LocalPaymentMethod) => {
    try {
      await apiClient.put(`/admin/local-payment/methods/${method.id}`, {
        isActive: !method.isActive,
      });
      // Refresh the list
      fetchMethods();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle method status');
    }
  };

  const handleDelete = async () => {
    if (!methodToDelete) return;

    try {
      await apiClient.delete(`/admin/local-payment/methods/${methodToDelete.id}`);
      setShowDeleteModal(false);
      setMethodToDelete(null);
      // Refresh the list
      fetchMethods();
    } catch (err: any) {
      setError(err.message || 'Failed to delete payment method');
    }
  };

  const handleOpenCreateModal = () => {
    setEditingMethod(null);
    setFormData(initialFormData);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (method: LocalPaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      code: method.code,
      displayName: method.displayName,
      logoUrl: method.logoUrl || '',
      isActive: method.isActive,
      minAmount: method.minAmount,
      maxAmount: method.maxAmount,
      processingFee: method.processingFee,
      processingFeePercent: method.processingFeePercent,
      requiresPhone: method.requiresPhone,
      requiresPin: method.requiresPin,
      description: method.description || '',
      instructions: method.instructions || '',
      supportedNetworks: method.supportedNetworks?.join(', ') || ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMethod(null);
    setFormData(initialFormData);
    setFormError(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleCheckboxChange = (name: keyof FormData) => {
    setFormData(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setFormError('Name is required');
      return false;
    }
    if (!formData.code.trim()) {
      setFormError('Code is required');
      return false;
    }
    if (!formData.displayName.trim()) {
      setFormError('Display name is required');
      return false;
    }
    if (formData.minAmount < 0) {
      setFormError('Minimum amount must be non-negative');
      return false;
    }
    if (formData.maxAmount <= formData.minAmount) {
      setFormError('Maximum amount must be greater than minimum amount');
      return false;
    }
    if (formData.processingFee < 0) {
      setFormError('Processing fee must be non-negative');
      return false;
    }
    if (formData.processingFeePercent < 0 || formData.processingFeePercent > 100) {
      setFormError('Processing fee percent must be between 0 and 100');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toLowerCase(),
        displayName: formData.displayName.trim(),
        logoUrl: formData.logoUrl.trim() || null,
        isActive: formData.isActive,
        minAmount: parseFloat(formData.minAmount.toString()),
        maxAmount: parseFloat(formData.maxAmount.toString()),
        processingFee: parseFloat(formData.processingFee.toString()),
        processingFeePercent: parseFloat(formData.processingFeePercent.toString()),
        requiresPhone: formData.requiresPhone,
        requiresPin: formData.requiresPin,
        description: formData.description.trim() || null,
        instructions: formData.instructions.trim() || null,
        supportedNetworks: formData.supportedNetworks
          .split(',')
          .map(n => n.trim())
          .filter(n => n.length > 0)
      };

      if (editingMethod) {
        // Update existing method
        await apiClient.put(`/admin/local-payment/methods/${editingMethod.id}`, payload);
      } else {
        // Create new method
        await apiClient.post('/admin/local-payment/methods', payload);
      }

      // Refresh the list and close modal
      await fetchMethods();
      handleCloseModal();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save payment method');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMethods = methods.filter(method =>
    method.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    method.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    method.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMethodIcon = (code: string) => {
    switch (code) {
      case 'bkash':
        return <Smartphone className="w-6 h-6 text-pink-600" />;
      case 'nagad':
        return <Smartphone className="w-6 h-6 text-orange-600" />;
      case 'rocket':
        return <Smartphone className="w-6 h-6 text-purple-600" />;
      case 'surecash':
        return <Smartphone className="w-6 h-6 text-blue-600" />;
      default:
        return <CreditCard className="w-6 h-6 text-gray-600" />;
    }
  };

  return (
    <PageWrapper
      title="Local Payment Methods"
      description="Manage Bangladesh-specific local payment methods (bKash, Nagad, Rocket, SureCash)"
      actions={
        <div className="flex gap-3">
          <Link
            href="/admin/local-payment/subscriptions"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            SMS Subscriptions
          </Link>
          <ButtonPrimary
            leftIcon={<Plus className="w-5 h-5" />}
            onClick={handleOpenCreateModal}
          >
            Add Payment Method
          </ButtonPrimary>
        </div>
      }
    >
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 mb-2">{error}</p>
              {error.includes('timeout') || error.includes('Redis') ? (
                <div className="text-sm text-red-700">
                  <p className="mb-1">Possible solutions:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Check if the backend server is running at <code className="bg-red-100 px-1 rounded">http://localhost:3001</code></li>
                    <li>Ensure Redis is running (usually at <code className="bg-red-100 px-1 rounded">localhost:6379</code>)</li>
                    <li>Start backend with Docker Compose: <code className="bg-red-100 px-1 rounded">docker-compose up -d</code></li>
                  </ul>
                  <button
                    onClick={() => {
                      setError(null);
                      fetchMethods();
                    }}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Retry Request
                  </button>
                </div>
              ) : error.includes('401') || error.includes('403') ? (
                <button
                  onClick={() => {
                    window.location.href = '/admin/login';
                  }}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Go to Login
                </button>
              ) : (
                <button
                  onClick={() => {
                    setError(null);
                    fetchMethods();
                  }}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search payment methods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full p-8 text-center text-gray-500">Loading payment methods...</div>
        ) : filteredMethods.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500">
            No payment methods found. Add your first payment method.
          </div>
        ) : (
          filteredMethods.map((method) => (
            <div
              key={method.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mr-4">
                      {method.logoUrl ? (
                        <img
                          src={method.logoUrl}
                          alt={method.name}
                          className="w-8 h-8 rounded"
                        />
                      ) : (
                        getMethodIcon(method.code)
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{method.displayName}</h3>
                      <p className="text-sm text-gray-500">{method.name}</p>
                    </div>
                  </div>
                  <Badge color={method.isActive ? 'success' : 'neutral'}>
                    {method.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              {/* Details */}
              <div className="p-6 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Amount Range</p>
                  <p className="text-sm font-medium text-gray-900">
                    {method.minAmount.toLocaleString()} - {method.maxAmount.toLocaleString()} BDT
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Processing Fee</p>
                  <p className="text-sm font-medium text-gray-900">
                    {method.processingFee > 0 ? `${method.processingFee} BDT` : 'No fixed fee'}
                    {method.processingFeePercent > 0 && ` + ${method.processingFeePercent}%`}
                  </p>
                </div>

                <div className="flex gap-2">
                  {method.requiresPhone && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Phone Required
                    </span>
                  )}
                  {method.requiresPin && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      PIN Required
                    </span>
                  )}
                </div>

                {method.supportedNetworks && method.supportedNetworks.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Supported Networks</p>
                    <div className="flex flex-wrap gap-1">
                      {method.supportedNetworks.map((network, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
                        >
                          {network}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => handleToggleStatus(method)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100"
                >
                  {method.isActive ? (
                    <>
                      <X className="w-4 h-4 text-red-600" />
                      <span className="text-red-600">Deactivate</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-green-600">Activate</span>
                    </>
                  )}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEditModal(method)}
                    className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => {
                      setMethodToDelete(method);
                      setShowDeleteModal(true);
                    }}
                    className="p-2 rounded-lg hover:bg-red-100 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 my-8">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingMethod ? 'Edit Payment Method' : 'Add New Payment Method'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <XCircle className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800">{formError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="e.g., bKash"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleFormChange}
                    placeholder="e.g., bkash"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                    disabled={!!editingMethod}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleFormChange}
                    placeholder="e.g., bKash Mobile Payment"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    name="logoUrl"
                    value={formData.logoUrl}
                    onChange={handleFormChange}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Amount (BDT)
                  </label>
                  <input
                    type="number"
                    name="minAmount"
                    value={formData.minAmount}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Amount (BDT)
                  </label>
                  <input
                    type="number"
                    name="maxAmount"
                    value={formData.maxAmount}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Processing Fee (BDT)
                  </label>
                  <input
                    type="number"
                    name="processingFee"
                    value={formData.processingFee}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Processing Fee Percent (%)
                  </label>
                  <input
                    type="number"
                    name="processingFeePercent"
                    value={formData.processingFeePercent}
                    onChange={handleFormChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supported Networks (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="supportedNetworks"
                    value={formData.supportedNetworks}
                    onChange={handleFormChange}
                    placeholder="e.g., GP, Banglalink, Robi, Airtel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows={2}
                    placeholder="Brief description of the payment method"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructions (JSON format)
                  </label>
                  <textarea
                    name="instructions"
                    value={formData.instructions}
                    onChange={handleFormChange}
                    rows={3}
                    placeholder='[{"step": 1, "title_en": "Step 1", "description_en": "Description"}]'
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleFormChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="requiresPhone"
                    checked={formData.requiresPhone}
                    onChange={handleFormChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Requires Phone Number</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="requiresPin"
                    checked={formData.requiresPin}
                    onChange={handleFormChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Requires PIN</span>
                </label>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <ButtonPrimary
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : editingMethod ? 'Update Method' : 'Create Method'}
                </ButtonPrimary>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && methodToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Payment Method
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{methodToDelete.displayName}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setMethodToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <ButtonDanger onClick={handleDelete}>
                Delete
              </ButtonDanger>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

export default withAuth(LocalPaymentMethodsPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/unauthorized'
});
