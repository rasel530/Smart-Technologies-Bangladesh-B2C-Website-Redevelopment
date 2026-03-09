/**
 * Admin Tracking Analytics Page
 * 
 * Display tracking analytics with charts and statistics.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAdminTracking } from '@/hooks/useAdminTracking';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminTrackingAnalyticsPage() {
  const {
    isLoading,
    error,
    trackingAnalytics,
    courierServices,
    getTrackingAnalytics,
    getCourierServices,
    clearError,
  } = useAdminTracking();

  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [selectedCourier, setSelectedCourier] = useState('');

  useEffect(() => {
    loadAnalytics();
    loadCourierServices();
  }, []);

  const loadCourierServices = async () => {
    await getCourierServices();
  };

  const loadAnalytics = async () => {
    const filters: any = {};
    if (dateRange.startDate) filters.startDate = dateRange.startDate;
    if (dateRange.endDate) filters.endDate = dateRange.endDate;
    if (selectedCourier) filters.courierServiceId = selectedCourier;

    await getTrackingAnalytics(filters);
  };

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    loadAnalytics();
  };

  const handleClearFilters = () => {
    setDateRange({ startDate: '', endDate: '' });
    setSelectedCourier('');
    loadAnalytics();
  };

  const handleExportCSV = () => {
    if (!trackingAnalytics) return;

    const csvContent = [
      ['Metric', 'Value'].join(','),
      ['Total Tracked', trackingAnalytics.totalTracked].join(','),
      ['On-Time Rate (%)', trackingAnalytics.onTimeRate.toFixed(2)].join(','),
      ['Delayed Rate (%)', trackingAnalytics.delayedRate.toFixed(2)].join(','),
      ['Average Delivery Time (hours)', trackingAnalytics.averageDeliveryTime.toFixed(2)].join(','),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tracking-analytics-${new Date().toISOString().split('T')[0]}.csv`;
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
    <AdminLayout title="Tracking Analytics">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Tracking Analytics
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Monitor and analyze order tracking performance
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
                value={dateRange.startDate}
                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Courier Service
              </label>
              <select
                value={selectedCourier}
                onChange={(e) => setSelectedCourier(e.target.value)}
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
          </div>
          <div className="flex gap-4 mt-4">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Apply Filters
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
        {trackingAnalytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Tracked</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                    {trackingAnalytics.totalTracked}
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">On-Time Rate</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                    {trackingAnalytics.onTimeRate.toFixed(1)}%
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Delayed Rate</p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                    {trackingAnalytics.delayedRate.toFixed(1)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Delivery Time</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                    {trackingAnalytics.averageDeliveryTime.toFixed(1)}h
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
          {/* On-Time vs Delayed Pie Chart Placeholder */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              On-Time vs Delayed
            </h3>
            {trackingAnalytics && (
              <div className="flex items-center justify-center h-64">
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 36 36" className="w-full h-full">
                    <path
                      d={`M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831`}
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="3"
                      strokeDasharray={`${trackingAnalytics.onTimeRate}, 100`}
                    />
                    <path
                      d={`M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831`}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="3"
                      strokeDasharray={`${trackingAnalytics.delayedRate}, 100`}
                      strokeDashoffset={`-${trackingAnalytics.onTimeRate}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {trackingAnalytics.onTimeRate.toFixed(0)}%
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">On-Time</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">On-Time</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Delayed</span>
              </div>
            </div>
          </div>

          {/* Status Distribution Bar Chart Placeholder */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Status Distribution
            </h3>
            {trackingAnalytics && Object.keys(trackingAnalytics.byStatus).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(trackingAnalytics.byStatus).map(([status, count]) => {
                  const percentage = (count / trackingAnalytics.totalTracked) * 100;
                  return (
                    <div key={status}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No status data available
              </div>
            )}
          </div>
        </div>

        {/* By Courier Bar Chart Placeholder */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Tracking Events by Courier
          </h3>
          {trackingAnalytics && Object.keys(trackingAnalytics.byCourier).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(trackingAnalytics.byCourier)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([courier, count]) => {
                  const maxCount = Math.max(...Object.values(trackingAnalytics.byCourier) as number[]);
                  const percentage = (count / maxCount) * 100;
                  return (
                    <div key={courier}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {courier}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {count}
                        </span>
                      </div>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
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
              No courier data available
            </div>
          )}
        </div>
      </div>
      </div>
    </AdminLayout>
  );
}
