/**
 * Admin Delivery Confirmation Page
 * 
 * List and manage all delivery confirmations.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  getDeliveryConfirmations,
  getDeliveryConfirmationsStats,
  getCourierServices,
  type DeliveryConfirmationWithOrder,
  type DeliveryConfirmationsStats,
  type CourierService,
  type BackendConfirmation,
} from '@/lib/api/orderTracking';
import { AdminLayout } from '@/components/admin/AdminLayout';

// Map backend confirmation to frontend type
const mapBackendToFrontend = (backend: BackendConfirmation): DeliveryConfirmationWithOrder => ({
  confirmationId: backend.id,
  orderId: backend.order?.id || '',
  orderNumber: backend.order?.orderNumber || '',
  recipientName: backend.recipientName,
  recipientPhone: backend.recipientPhone,
  confirmedAt: backend.confirmedAt,
  signature: backend.signatureUrl,
  photo: backend.photos,
  notes: backend.deliveryNotes,
  location: backend.deliveryLocation ? { address: backend.deliveryLocation } : null,
  courierService: backend.fulfillment?.courierService ? {
    id: backend.fulfillment.courierService.id,
    name: backend.fulfillment.courierService.name,
  } : null,
  trackingNumber: backend.fulfillment?.trackingNumber,
  confirmationMethod: backend.confirmationMethod,
  otpCode: backend.otpCode,
});

export default function AdminDeliveryConfirmationPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmations, setConfirmations] = useState<DeliveryConfirmationWithOrder[]>([]);
  const [stats, setStats] = useState<DeliveryConfirmationsStats | null>(null);
  const [courierServices, setCourierServices] = useState<CourierService[]>([]);
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    courierServiceId: '',
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  
  const [sortBy, setSortBy] = useState('confirmedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedConfirmations, setSelectedConfirmations] = useState<Set<string>>(new Set());
  const [showConfirmationDetails, setShowConfirmationDetails] = useState<DeliveryConfirmationWithOrder | null>(null);

  // Fetch courier services on mount
  useEffect(() => {
    const fetchCourierServices = async () => {
      try {
        const services = await getCourierServices(true);
        setCourierServices(services);
      } catch (err) {
        console.error('Failed to fetch courier services:', err);
      }
    };
    fetchCourierServices();
  }, []);

  // Fetch delivery confirmations
  const fetchConfirmations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('[Delivery Confirmations] Fetching confirmations with params:', {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        courierServiceId: filters.courierServiceId || undefined,
        search: searchQuery || undefined,
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder,
      });
      const response = await getDeliveryConfirmations({
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        courierServiceId: filters.courierServiceId || undefined,
        search: searchQuery || undefined,
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder,
      });
      console.log('[Delivery Confirmations] API response received:', response);
      console.log('[Delivery Confirmations] Response type:', typeof response);
      console.log('[Delivery Confirmations] Response keys:', response ? Object.keys(response) : 'response is null/undefined');
      console.log('[Delivery Confirmations] response.confirmations:', response?.confirmations);
      console.log('[Delivery Confirmations] response.pagination:', response?.pagination);
      // Map backend confirmations to frontend format
      const mappedConfirmations = response.confirmations.map(mapBackendToFrontend);
      setConfirmations(mappedConfirmations);
      setPagination({
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
      });
    } catch (err: any) {
      console.error('[Delivery Confirmations] Error fetching confirmations:', err);
      setError(err.message || 'Failed to fetch delivery confirmations');
      setConfirmations([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, searchQuery, pagination.page, pagination.limit, sortBy, sortOrder]);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const statsData = await getDeliveryConfirmationsStats({
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to fetch statistics:', err);
    }
  }, [filters.startDate, filters.endDate]);

  // Initial data fetch
  useEffect(() => {
    fetchConfirmations();
    fetchStats();
  }, [fetchConfirmations, fetchStats]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    // Reset to page 1 when filters change
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // Reset to page 1 when search changes
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleApplyFilters = () => {
    fetchConfirmations();
    fetchStats();
  };

  const handleClearFilters = () => {
    setFilters({ startDate: '', endDate: '', courierServiceId: '' });
    setSearchQuery('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleSelectConfirmation = (confirmationId: string) => {
    const newSelected = new Set(selectedConfirmations);
    if (newSelected.has(confirmationId)) {
      newSelected.delete(confirmationId);
    } else {
      newSelected.add(confirmationId);
    }
    setSelectedConfirmations(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedConfirmations.size === confirmations.length) {
      setSelectedConfirmations(new Set());
    } else {
      setSelectedConfirmations(new Set(confirmations.map((c) => c.confirmationId)));
    }
  };

  const handleViewDetails = (confirmation: DeliveryConfirmationWithOrder) => {
    setShowConfirmationDetails(confirmation);
  };

  const handleExportCSV = () => {
    const dataToExport = selectedConfirmations.size > 0
      ? confirmations.filter((c) => selectedConfirmations.has(c.confirmationId))
      : confirmations;

    const csvContent = [
      ['Confirmation ID', 'Order Number', 'Recipient Name', 'Recipient Phone', 'Courier Service', 'Tracking Number', 'Confirmed At', 'Notes'].join(','),
      ...dataToExport.map((c) =>
        [
          c.confirmationId,
          c.orderNumber,
          c.recipientName,
          c.recipientPhone || '',
          c.courierService?.name || '',
          c.trackingNumber || '',
          new Date(c.confirmedAt).toISOString(),
          c.notes || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `delivery-confirmations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading && confirmations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AdminLayout title="Delivery Confirmations">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Delivery Confirmations
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                View and manage all delivery confirmations
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              📊 Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Confirmed</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                    {stats.total}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">With Signature</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                    {stats.withSignature}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-2xl">✍️</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">With Photo</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                    {stats.withPhoto}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📷</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Filters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Courier Service
              </label>
              <select
                value={filters.courierServiceId}
                onChange={(e) => handleFilterChange('courierServiceId', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Couriers</option>
                {courierServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleApplyFilters}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Apply Filters'}
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by recipient name, phone, order number, or notes..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedConfirmations.size > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {selectedConfirmations.size} confirmation{selectedConfirmations.size > 1 ? 's' : ''} selected
              </p>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Export Selected
              </button>
            </div>
          </div>
        )}

        {/* Confirmations List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedConfirmations.size === confirmations.length && confirmations.length > 0}
                      onChange={handleSelectAll}
                      className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Order Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('recipientName')}>
                    Recipient Name {sortBy === 'recipientName' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Recipient Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Courier Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('confirmedAt')}>
                    Confirmed At {sortBy === 'confirmedAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Signature
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Photo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : confirmations.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No delivery confirmations found
                    </td>
                  </tr>
                ) : (
                  confirmations.map((confirmation) => (
                    <tr key={confirmation.confirmationId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedConfirmations.has(confirmation.confirmationId)}
                          onChange={() => handleSelectConfirmation(confirmation.confirmationId)}
                          className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                        {confirmation.orderNumber}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                        {confirmation.recipientName}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {confirmation.recipientPhone || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {confirmation.courierService?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {formatDate(confirmation.confirmedAt)}
                      </td>
                      <td className="px-6 py-4">
                        {confirmation.signature ? (
                          <span className="text-green-500">✓</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {confirmation.photo && confirmation.photo.length > 0 ? (
                          <span className="text-green-500">✓</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {confirmation.location ? (
                          <button
                            onClick={() => alert(`Location: ${confirmation.location?.address || `${confirmation.location?.latitude}, ${confirmation.location?.longitude}`}`)}
                            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            📍 View
                          </button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetails(confirmation)}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1 || isLoading}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          disabled={isLoading}
                          className={`px-3 py-2 rounded-lg ${
                            pagination.page === pageNum
                              ? 'bg-blue-500 text-white'
                              : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages || isLoading}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Details Modal */}
      {showConfirmationDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Delivery Confirmation Details
              </h2>
              <button
                onClick={() => setShowConfirmationDetails(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Order Number</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {showConfirmationDetails.orderNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Courier Service</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {showConfirmationDetails.courierService?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Recipient Name</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {showConfirmationDetails.recipientName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Recipient Phone</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {showConfirmationDetails.recipientPhone || 'N/A'}
                  </p>
                </div>
              </div>
              {showConfirmationDetails.trackingNumber && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tracking Number</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {showConfirmationDetails.trackingNumber}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Confirmed At</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatDate(showConfirmationDetails.confirmedAt)}
                </p>
              </div>
              {showConfirmationDetails.signature && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Signature</p>
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 inline-block">
                    <img
                      src={showConfirmationDetails.signature}
                      alt="Signature"
                      className="max-w-full h-32"
                    />
                  </div>
                </div>
              )}
              {showConfirmationDetails.photo && showConfirmationDetails.photo.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Delivery Photo</p>
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 inline-block">
                    <img
                      src={showConfirmationDetails.photo[0]}
                      alt="Delivery photo"
                      className="max-w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                </div>
              )}
              {showConfirmationDetails.location && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                  <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-gray-900 dark:text-gray-100">
                      <span className="font-medium">Latitude:</span> {showConfirmationDetails.location.latitude?.toFixed(6)}
                    </p>
                    <p className="text-gray-900 dark:text-gray-100">
                      <span className="font-medium">Longitude:</span> {showConfirmationDetails.location.longitude?.toFixed(6)}
                    </p>
                    {showConfirmationDetails.location.address && (
                      <p className="text-gray-900 dark:text-gray-100">
                        <span className="font-medium">Address:</span> {showConfirmationDetails.location.address}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {showConfirmationDetails.notes && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Notes</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {showConfirmationDetails.notes}
                  </p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 rounded-b-lg">
              <button
                onClick={() => setShowConfirmationDetails(null)}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
