/**
 * Admin Delivery Performance Page
 * 
 * Display delivery performance metrics with charts and statistics.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAdminTracking } from '@/hooks/useAdminTracking';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminDeliveryPerformancePage() {
  const {
    isLoading,
    error,
    deliveryPerformance,
    courierServices,
    getDeliveryPerformance,
    getCourierServices,
    clearError,
  } = useAdminTracking();

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    courierServiceId: '',
  });

  useEffect(() => {
    loadPerformance();
    loadCourierServices();
  }, []);

  const loadPerformance = async () => {
    const apiFilters: any = {};
    if (filters.startDate) apiFilters.startDate = filters.startDate;
    if (filters.endDate) apiFilters.endDate = filters.endDate;
    if (filters.courierServiceId) apiFilters.courierServiceId = filters.courierServiceId;

    await getDeliveryPerformance(apiFilters);
  };

  const loadCourierServices = async () => {
    await getCourierServices();
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    loadPerformance();
  };

  const handleClearFilters = () => {
    setFilters({ startDate: '', endDate: '', courierServiceId: '' });
    loadPerformance();
  };

  const handleShowAllData = () => {
    setFilters({ startDate: '', endDate: '', courierServiceId: '' });
    loadPerformance();
  };

  const handleExportCSV = () => {
    if (!deliveryPerformance) return;

    const csvContent = [
      ['Metric', 'Value'].join(','),
      ['Total Deliveries', deliveryPerformance.totalDeliveries].join(','),
      ['On-Time Deliveries', deliveryPerformance.onTimeDeliveries].join(','),
      ['Late Deliveries', deliveryPerformance.lateDeliveries].join(','),
      ['Failed Deliveries', deliveryPerformance.failedDeliveries].join(','),
      ['Average Delivery Time (hours)', deliveryPerformance.averageDeliveryTime.toFixed(2)].join(','),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `delivery-performance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AdminLayout title="Delivery Performance">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Delivery Performance
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Monitor and analyze delivery performance metrics
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
                onClick={clearError}
                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Filters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                {courierServices && courierServices.map((courier) => (
                  <option key={courier.id} value={courier.id}>
                    {courier.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Apply Filters
            </button>
            <button
              onClick={handleShowAllData}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              Show All Data
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {deliveryPerformance && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Deliveries</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                    {deliveryPerformance.totalDeliveries}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📦</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">On-Time</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                    {deliveryPerformance.onTimeDeliveries}
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Late</p>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
                    {deliveryPerformance.lateDeliveries}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                    {deliveryPerformance.failedDeliveries}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <span className="text-2xl">❌</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Time</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                    {deliveryPerformance.averageDeliveryTime.toFixed(1)}h
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⏱️</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* On-Time Rate by Courier */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              On-Time Rate by Courier
            </h3>
            {deliveryPerformance && Object.keys(deliveryPerformance.byCourier).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(deliveryPerformance.byCourier).map(([courier, data]) => {
                  const onTimeRate = data.total > 0 ? (data.onTime / data.total) * 100 : 0;
                  return (
                    <div key={courier}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {courier}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {onTimeRate.toFixed(1)}% ({data.onTime}/{data.total})
                        </span>
                      </div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            onTimeRate >= 90
                              ? 'bg-green-500'
                              : onTimeRate >= 70
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${onTimeRate}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No courier data available
              </div>
            )}
          </div>

          {/* Delivery Time by Region */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Deliveries by Region
            </h3>
            {deliveryPerformance && Object.keys(deliveryPerformance.byRegion).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(deliveryPerformance.byRegion)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .slice(0, 5)
                  .map(([region, count]) => {
                    const maxCount = Math.max(...Object.values(deliveryPerformance.byRegion) as number[]);
                    const percentage = (count / maxCount) * 100;
                    return (
                      <div key={region}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {region}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {count}
                          </span>
                        </div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No region data available
              </div>
            )}
          </div>
        </div>

        {/* Detailed Statistics Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Detailed Statistics
            </h3>
          </div>
          {deliveryPerformance && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Metric
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                      Total Deliveries
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {deliveryPerformance.totalDeliveries}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      100%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium text-green-600 dark:text-green-400">
                      On-Time Deliveries
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {deliveryPerformance.onTimeDeliveries}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {deliveryPerformance.totalDeliveries > 0
                        ? ((deliveryPerformance.onTimeDeliveries / deliveryPerformance.totalDeliveries) * 100).toFixed(1)
                        : '0'}%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium text-yellow-600 dark:text-yellow-400">
                      Late Deliveries
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {deliveryPerformance.lateDeliveries}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {deliveryPerformance.totalDeliveries > 0
                        ? ((deliveryPerformance.lateDeliveries / deliveryPerformance.totalDeliveries) * 100).toFixed(1)
                        : '0'}%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium text-red-600 dark:text-red-400">
                      Failed Deliveries
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {deliveryPerformance.failedDeliveries}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {deliveryPerformance.totalDeliveries > 0
                        ? ((deliveryPerformance.failedDeliveries / deliveryPerformance.totalDeliveries) * 100).toFixed(1)
                        : '0'}%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                      Average Delivery Time
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {deliveryPerformance.averageDeliveryTime.toFixed(2)} hours
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      -
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      </div>
    </AdminLayout>
  );
}
