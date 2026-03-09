/**
 * Admin Order Fulfillments Page
 * 
 * List and manage all order fulfillments with filtering and actions.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrderManagement } from '@/hooks/useOrderManagement';
import { OrderFulfillment, CourierService } from '@/lib/api/orderManagement';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminOrderFulfillmentsPage() {
  const router = useRouter();
  const { createFulfillment, updateFulfillment, getCourierServices, isLoading, error, clearError } = useOrderManagement();

  const [fulfillments, setFulfillments] = useState<OrderFulfillment[]>([]);
  const [courierServices, setCourierServices] = useState<CourierService[]>([]);
  const [courierFilter, setCourierFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFulfillment, setSelectedFulfillment] = useState<OrderFulfillment | null>(null);
  const [actionModal, setActionModal] = useState<'create' | 'edit' | 'view' | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    orderId: '',
    courierServiceId: '',
    trackingNumber: '',
    estimatedDelivery: '',
    notes: '',
  });

  // Filter fulfillments based on search and courier filter
  const filteredFulfillments = fulfillments.filter(fulfillment => {
    const matchesSearch = !searchQuery || 
      fulfillment.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (fulfillment.trackingNumber && fulfillment.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCourier = courierFilter === 'all' || fulfillment.courierServiceId === courierFilter;
    return matchesSearch && matchesCourier;
  });

  useEffect(() => {
    loadFulfillments();
    loadCourierServices();
  }, []);

  const loadFulfillments = async () => {
    try {
      // In a real implementation, this would call an API to get all fulfillments
      // For now, we'll use a mock implementation
      const mockFulfillments: OrderFulfillment[] = [];
      setFulfillments(mockFulfillments);
    } catch (err) {
      console.error('Error loading fulfillments:', err);
    }
  };

  const loadCourierServices = async () => {
    const services = await getCourierServices(true);
    if (services) {
      setCourierServices(services);
    }
  };const handleCreate = async () => {
    const result = await createFulfillment(formData.orderId, {
      courierServiceId: formData.courierServiceId || undefined,
      trackingNumber: formData.trackingNumber || undefined,
      estimatedDelivery: formData.estimatedDelivery || undefined,
      packagingDetails: formData.notes ? { notes: formData.notes } : undefined,
    });
    if (result) {
      setActionModal(null);
      resetForm();
      loadFulfillments();
    }
  };

  const handleUpdate = async () => {
    if (!selectedFulfillment) return;

    const result = await updateFulfillment(selectedFulfillment.orderId, selectedFulfillment.id, {
      trackingNumber: formData.trackingNumber || undefined,
      estimatedDelivery: formData.estimatedDelivery || undefined,
      notes: formData.notes || undefined,
    });
    if (result) {
      setActionModal(null);
      resetForm();
      loadFulfillments();
    }
  };

  const resetForm = () => {
    setFormData({
      orderId: '',
      courierServiceId: '',
      trackingNumber: '',
      estimatedDelivery: '',
      notes: '',
    });
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AdminLayout title="Order Fulfillments">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => router.push('/admin/orders')}
                  className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-2 inline-flex items-center gap-1"
                >
                  ← Back to Orders
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Order Fulfillments
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Manage order shipping and tracking
                </p>
              </div>
              <button
                onClick={() => {
                  setActionModal('create');
                  resetForm();
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Create Fulfillment
              </button>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search by Order ID or Tracking
              </label>
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter order ID or tracking number..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Courier Filter */}
            <div className="lg:w-48">
              <label htmlFor="courier" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Courier Service
              </label>
              <select
                id="courier"
                value={courierFilter}
                onChange={(e) => setCourierFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Couriers</option>
                {courierServices.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={clearError}
                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Fulfillments List */}
        {filteredFulfillments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🚚</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Fulfillments Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery || courierFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'No fulfillments have been created yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Courier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tracking Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Est. Delivery
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Shipped
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Delivered
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {fulfillments.map((fulfillment) => (
                  <tr key={fulfillment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400 cursor-pointer">
                      {fulfillment.orderId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {fulfillment.courierService?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {fulfillment.trackingNumber ? (
                        <a
                          href={fulfillment.courierService?.trackingUrl?.replace('{trackingNumber}', fulfillment.trackingNumber)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {fulfillment.trackingNumber}
                        </a>
                      ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(fulfillment.estimatedDelivery)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(fulfillment.shippedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(fulfillment.deliveredAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedFulfillment(fulfillment);
                            setFormData({
                              orderId: fulfillment.orderId,
                              courierServiceId: fulfillment.courierServiceId || '',
                              trackingNumber: fulfillment.trackingNumber || '',
                              estimatedDelivery: fulfillment.estimatedDelivery ? new Date(fulfillment.estimatedDelivery).toISOString().split('T')[0] : '',
                              notes: fulfillment.notes || '',
                            });
                            setActionModal('view');
                          }}
                          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          View
                        </button>
                        <button
                          onClick={() => {
                            setSelectedFulfillment(fulfillment);
                            setFormData({
                              orderId: fulfillment.orderId,
                              courierServiceId: fulfillment.courierServiceId || '',
                              trackingNumber: fulfillment.trackingNumber || '',
                              estimatedDelivery: fulfillment.estimatedDelivery ? new Date(fulfillment.estimatedDelivery).toISOString().split('T')[0] : '',
                              notes: fulfillment.notes || '',
                            });
                            setActionModal('edit');
                          }}
                          className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                        >
                          Edit
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

      {/* Action Modals */}
      {(actionModal === 'create' || actionModal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {actionModal === 'create' ? 'Create Fulfillment' : 'Edit Fulfillment'}
                </h3>
                <button
                  onClick={() => {
                    setActionModal(null);
                    setSelectedFulfillment(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                {actionModal === 'create' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Order ID *
                    </label>
                    <input
                      type="text"
                      value={formData.orderId}
                      onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                      placeholder="Enter order ID..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Courier Service
                  </label>
                  <select
                    value={formData.courierServiceId}
                    onChange={(e) => setFormData({ ...formData, courierServiceId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select courier...</option>
                    {courierServices.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={formData.trackingNumber}
                    onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                    placeholder="Enter tracking number..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estimated Delivery Date
                  </label>
                  <input
                    type="date"
                    value={formData.estimatedDelivery}
                    onChange={(e) => setFormData({ ...formData, estimatedDelivery: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add any notes..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setActionModal(null);
                    setSelectedFulfillment(null);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={actionModal === 'create' ? handleCreate : handleUpdate}
                  disabled={isLoading || (actionModal === 'create' && !formData.orderId.trim())}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : actionModal === 'create' ? 'Create' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {actionModal === 'view' && selectedFulfillment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Fulfillment Details
                </h3>
                <button
                  onClick={() => {
                    setActionModal(null);
                    setSelectedFulfillment(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Order ID:</span>
                  <p className="text-gray-900 dark:text-gray-100">{selectedFulfillment.orderId}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Courier Service:</span>
                  <p className="text-gray-900 dark:text-gray-100">{selectedFulfillment.courierService?.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tracking Number:</span>
                  <p className="text-gray-900 dark:text-gray-100">
                    {selectedFulfillment.trackingNumber ? (
                      <a
                        href={selectedFulfillment.courierService?.trackingUrl?.replace('{trackingNumber}', selectedFulfillment.trackingNumber)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {selectedFulfillment.trackingNumber}
                      </a>
                    ) : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estimated Delivery:</span>
                  <p className="text-gray-900 dark:text-gray-100">{formatDate(selectedFulfillment.estimatedDelivery)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Shipped At:</span>
                  <p className="text-gray-900 dark:text-gray-100">{formatDate(selectedFulfillment.shippedAt)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Delivered At:</span>
                  <p className="text-gray-900 dark:text-gray-100">{formatDate(selectedFulfillment.deliveredAt)}</p>
                </div>
                {selectedFulfillment.notes && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes:</span>
                    <p className="text-gray-900 dark:text-gray-100">{selectedFulfillment.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminLayout>
  );
}
