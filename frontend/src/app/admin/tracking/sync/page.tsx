/**
 * Admin Bulk Tracking Sync Page
 * 
 * Bulk sync tracking information for multiple orders.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAdminTracking } from '@/hooks/useAdminTracking';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminBulkTrackingSyncPage() {
  const {
    isLoading,
    error,
    courierServices,
    getCourierServices,
    syncAllTracking,
    clearError,
  } = useAdminTracking();

  const [courierServiceId, setCourierServiceId] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [syncResults, setSyncResults] = useState<{
    syncedCount: number;
    failedCount: number;
    errors: Array<{ orderId: string; orderNumber: string; error: string }>;
  } | null>(null);

  // Load courier services on mount
  useEffect(() => {
    getCourierServices(true); // Load only active courier services
  }, [getCourierServices]);

  const handleSyncAll = async () => {
    const data: any = {};
    if (courierServiceId) data.courierServiceId = courierServiceId;
    if (orderStatus) data.orderStatus = orderStatus;

    const result = await syncAllTracking(data);
    if (result) {
      setSyncResults(result);
    }
  };

  const handleRetryFailed = async () => {
    if (!syncResults || syncResults.errors.length === 0) return;

    alert(`Retrying ${syncResults.errors.length} failed orders...`);
    // Implement retry logic
    setSyncResults(null);
  };

  const handleExportResults = () => {
    if (!syncResults) return;

    const csvContent = [
      ['Order ID', 'Order Number', 'Status', 'Error'].join(','),
      ...syncResults.errors.map((err) =>
        [err.orderId, err.orderNumber, 'Failed', err.error].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sync-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setSyncResults(null);
    setCourierServiceId('');
    setOrderStatus('');
  };

  return (
    <AdminLayout title="Tracking Sync">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Bulk Tracking Sync
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Sync tracking information for multiple orders from courier services
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Sync Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Sync Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Courier Service
              </label>
              <select
                value={courierServiceId}
                onChange={(e) => setCourierServiceId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Couriers</option>
                {courierServices.map((courier) => (
                  <option key={courier.id} value={courier.id}>
                    {courier.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Order Status
              </label>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
              </select>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Sync Information
                </p>
                <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Sync will fetch the latest tracking information from courier services</li>
                  <li>• Orders with status: Confirmed, Processing, or Shipped will be synced</li>
                  <li>• This process may take several minutes depending on the number of orders</li>
                  <li>• You can filter by courier service to sync specific couriers only</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSyncAll}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Syncing...
                </span>
              ) : (
                '🔄 Sync All Tracking'
              )}
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Sync Results */}
        {syncResults && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Sync Results
            </h2>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-300">Synced Successfully</p>
                    <p className="text-3xl font-bold text-green-800 dark:text-green-200 mt-2">
                      {syncResults.syncedCount}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-700 dark:text-red-300">Failed</p>
                    <p className="text-3xl font-bold text-red-800 dark:text-red-200 mt-2">
                      {syncResults.failedCount}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                    <span className="text-2xl">❌</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Total Processed</p>
                    <p className="text-3xl font-bold text-blue-800 dark:text-blue-200 mt-2">
                      {syncResults.syncedCount + syncResults.failedCount}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Failed Orders */}
            {syncResults.errors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Failed Orders ({syncResults.errors.length})
                </h3>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-red-100 dark:bg-red-800">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-red-800 dark:text-red-200 uppercase tracking-wider">
                            Order Number
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-red-800 dark:text-red-200 uppercase tracking-wider">
                            Order ID
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-red-800 dark:text-red-200 uppercase tracking-wider">
                            Error
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-200 dark:divide-red-800">
                        {syncResults.errors.map((err, index) => (
                          <tr key={index} className="hover:bg-red-100 dark:hover:bg-red-800">
                            <td className="px-4 py-3 font-medium text-red-900 dark:text-red-100">
                              {err.orderNumber}
                            </td>
                            <td className="px-4 py-3 text-red-700 dark:text-red-300">
                              {err.orderId}
                            </td>
                            <td className="px-4 py-3 text-red-700 dark:text-red-300">
                              {err.error}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              {syncResults.errors.length > 0 && (
                <button
                  onClick={handleRetryFailed}
                  className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
                >
                  🔄 Retry Failed
                </button>
              )}
              <button
                onClick={handleExportResults}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                📊 Export Results
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </AdminLayout>
  );
}
