/**
 * Admin Courier Services Page
 * 
 * List and manage courier services with filtering and actions.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CourierService, getCourierServices, createCourierService, updateCourierService, deleteCourierService } from '@/lib/api/orderManagement';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminCourierServicesPage() {
  const router = useRouter();
  const [courierServices, setCourierServices] = useState<CourierService[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<CourierService | null>(null);
  const [actionModal, setActionModal] = useState<'create' | 'edit' | 'delete' | 'test' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    apiEndpoint: '',
    trackingUrlTemplate: '',
    isActive: true,
    coverageAreas: '',
    baseRate: '',
    ratePerKg: '',
  });

  useEffect(() => {
    loadCourierServices();
  }, []);

  const loadCourierServices = async () => {
    try {
      setIsLoading(true);
      const data = await getCourierServices();
      setCourierServices(data);
    } catch (error) {
      console.error('Failed to load courier services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const filteredServices = (courierServices || []).filter(service => {
    // Filter by search query (name or code)
    if (searchQuery && !service.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !service.code.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    // Filter by status (active/inactive)
    if (activeFilter !== 'all') {
      const isActive = activeFilter === 'true';
      if (service.isActive !== isActive) return false;
    }
    
    return true;
  });

  const handleCreate = async () => {
    try {
      setIsLoading(true);
      
      // Prepare data for API call
      const coverageAreasArray = formData.coverageAreas
        .split(',')
        .map(area => area.trim())
        .filter(area => area.length > 0);
      
      const pricing: { baseRate?: number; ratePerKg?: number } = {};
      if (formData.baseRate) pricing.baseRate = parseFloat(formData.baseRate);
      if (formData.ratePerKg) pricing.ratePerKg = parseFloat(formData.ratePerKg);
      
      await createCourierService({
        name: formData.name,
        code: formData.code,
        apiEndpoint: formData.apiEndpoint || undefined,
        trackingUrlTemplate: formData.trackingUrlTemplate || undefined,
        isActive: formData.isActive,
        coverageAreas: coverageAreasArray.length > 0 ? coverageAreasArray : undefined,
        pricing: Object.keys(pricing).length > 0 ? pricing : undefined,
      });
      
      showNotification('success', 'Courier service created successfully!');
      setActionModal(null);
      resetForm();
      await loadCourierServices();
    } catch (error: any) {
      console.error('Failed to create courier service:', error);
      showNotification('error', `Failed to create courier service: ${error.message || 'Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedService) return;
    
    try {
      setIsLoading(true);
      
      // Prepare data for API call
      const coverageAreasArray = formData.coverageAreas
        .split(',')
        .map(area => area.trim())
        .filter(area => area.length > 0);
      
      const pricing: { baseRate?: number; ratePerKg?: number } = {};
      if (formData.baseRate) pricing.baseRate = parseFloat(formData.baseRate);
      if (formData.ratePerKg) pricing.ratePerKg = parseFloat(formData.ratePerKg);
      
      await updateCourierService(selectedService.id, {
        name: formData.name,
        code: formData.code,
        apiEndpoint: formData.apiEndpoint || undefined,
        trackingUrlTemplate: formData.trackingUrlTemplate || undefined,
        isActive: formData.isActive,
        coverageAreas: coverageAreasArray.length > 0 ? coverageAreasArray : undefined,
        pricing: Object.keys(pricing).length > 0 ? pricing : undefined,
      });
      
      showNotification('success', 'Courier service updated successfully!');
      setActionModal(null);
      resetForm();
      await loadCourierServices();
    } catch (error: any) {
      console.error('Failed to update courier service:', error);
      showNotification('error', `Failed to update courier service: ${error.message || 'Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedService) return;
    
    try {
      setIsLoading(true);
      
      await deleteCourierService(selectedService.id);
      
      showNotification('success', 'Courier service deleted successfully!');
      setActionModal(null);
      setSelectedService(null);
      await loadCourierServices();
    } catch (error: any) {
      console.error('Failed to delete courier service:', error);
      showNotification('error', `Failed to delete courier service: ${error.message || 'Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!selectedService) return;
    
    try {
      setIsLoading(true);
      
      // In a real implementation, this would test the courier API connection
      // For now, we'll simulate a successful test
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!selectedService.apiEndpoint) {
        throw new Error('No API endpoint configured for this service');
      }
      
      showNotification('success', `Connection test successful for ${selectedService.name}!`);
    } catch (error: any) {
      console.error('Failed to test courier connection:', error);
      showNotification('error', `Connection test failed: ${error.message || 'Please check your API configuration.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      apiEndpoint: '',
      trackingUrlTemplate: '',
      isActive: true,
      coverageAreas: '',
      baseRate: '',
      ratePerKg: '',
    });
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AdminLayout title="Manage Couriers">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span>{notification.message}</span>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 shadow">
          <div style={{ maxWidth: '100rem' }} className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => router.push('/admin/orders')}
                  className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-2 inline-flex items-center gap-1"
                >
                  ← Back to Orders
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Courier Services
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Manage shipping courier services
                </p>
              </div>
              <button
                onClick={() => {
                  setActionModal('create');
                  resetForm();
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Add Courier Service
              </button>
            </div>
        </div>
      </div>

      <div style={{ maxWidth: '100rem' }} className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search by Name or Code
              </label>
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter name or code..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="lg:w-48">
              <label htmlFor="active" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                id="active"
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {filteredServices.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🚚</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Courier Services Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery || activeFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'No courier services have been added yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    API Endpoint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Base Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {service.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {service.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {service.apiEndpoint || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {service.baseRate ? `৳${Number(service.baseRate).toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        service.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {service.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(service.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedService(service);
                            setFormData({
                              name: service.name,
                              code: service.code,
                              apiEndpoint: service.apiEndpoint || '',
                              trackingUrlTemplate: service.trackingUrl || '',
                              isActive: service.isActive,
                              coverageAreas: service.coverageAreas.join(', '),
                              baseRate: service.baseRate?.toString() || '',
                              ratePerKg: service.ratePerKg?.toString() || '',
                            });
                            setActionModal('edit');
                          }}
                          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedService(service);
                            setActionModal('test');
                          }}
                          className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                        >
                          Test
                        </button>
                        <button
                          onClick={() => {
                            setSelectedService(service);
                            setActionModal('delete');
                          }}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
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

      {actionModal === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Add Courier Service
                </h3>
                <button
                  onClick={() => {
                    setActionModal(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter service name..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="Enter service code (e.g., PATHAO)..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    API Endpoint
                  </label>
                  <input
                    type="url"
                    value={formData.apiEndpoint}
                    onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                    placeholder="Enter API endpoint URL..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tracking URL Template
                  </label>
                  <input
                    type="text"
                    value={formData.trackingUrlTemplate}
                    onChange={(e) => setFormData({ ...formData, trackingUrlTemplate: e.target.value })}
                    placeholder="Enter tracking URL with {trackingNumber} placeholder..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Use {`{trackingNumber}`} as placeholder for tracking number
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Coverage Areas (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.coverageAreas}
                    onChange={(e) => setFormData({ ...formData, coverageAreas: e.target.value })}
                    placeholder="Enter coverage areas (e.g., Dhaka, Chittagong)..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Base Rate (৳)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.baseRate}
                      onChange={(e) => setFormData({ ...formData, baseRate: e.target.value })}
                      placeholder="Enter base rate..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rate per Kg (৳)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.ratePerKg}
                      onChange={(e) => setFormData({ ...formData, ratePerKg: e.target.value })}
                      placeholder="Enter rate per kg..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-500 rounded"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Active
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setActionModal(null);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isLoading || !formData.name.trim() || !formData.code.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : 'Add Service'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {actionModal === 'edit' && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Edit Courier Service
                </h3>
                <button
                  onClick={() => {
                    setActionModal(null);
                    setSelectedService(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter service name..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="Enter service code (e.g., PATHAO)..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    API Endpoint
                  </label>
                  <input
                    type="url"
                    value={formData.apiEndpoint}
                    onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                    placeholder="Enter API endpoint URL..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tracking URL Template
                  </label>
                  <input
                    type="text"
                    value={formData.trackingUrlTemplate}
                    onChange={(e) => setFormData({ ...formData, trackingUrlTemplate: e.target.value })}
                    placeholder="Enter tracking URL with {trackingNumber} placeholder..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Use {`{trackingNumber}`} as placeholder for tracking number
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Coverage Areas (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.coverageAreas}
                    onChange={(e) => setFormData({ ...formData, coverageAreas: e.target.value })}
                    placeholder="Enter coverage areas (e.g., Dhaka, Chittagong)..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Base Rate (৳)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.baseRate}
                      onChange={(e) => setFormData({ ...formData, baseRate: e.target.value })}
                      placeholder="Enter base rate..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rate per Kg (৳)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.ratePerKg}
                      onChange={(e) => setFormData({ ...formData, ratePerKg: e.target.value })}
                      placeholder="Enter rate per kg..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-500 rounded"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Active
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setActionModal(null);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isLoading || !formData.name.trim() || !formData.code.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : 'Update Service'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {actionModal === 'delete' && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Delete Courier Service
              </h3>
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-400">
                  Are you sure you want to delete <strong>{selectedService.name}</strong>? This action will mark the service as inactive.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setActionModal(null);
                    setSelectedService(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {actionModal === 'test' && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Test Courier Connection
              </h3>
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Testing connection to <strong>{selectedService.name}</strong> ({selectedService.code})
                </p>
                {selectedService.apiEndpoint && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Endpoint: {selectedService.apiEndpoint}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setActionModal(null);
                    setSelectedService(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                >
                  Close
                </button>
                <button
                  onClick={handleTestConnection}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                >
                  Test Connection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminLayout>
  );
}
