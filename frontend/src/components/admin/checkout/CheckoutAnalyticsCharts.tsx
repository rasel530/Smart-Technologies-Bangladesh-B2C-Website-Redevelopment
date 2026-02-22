'use client';

import React from 'react';
import { 
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  DollarSign,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw,
  Calendar,
  Filter
} from 'lucide-react';

// Types
interface CheckoutAnalytics {
  overview: {
    totalSessions: number;
    completedSessions: number;
    abandonedSessions: number;
    activeSessions: number;
    expiredSessions: number;
    conversionRate: number;
    abandonmentRate: number;
    recoveryRate: number;
    avgCartValue: number;
    avgTimeToComplete: number;
  };
  userTypeComparison: {
    guest: {
      total: number;
      completed: number;
      conversionRate: number;
    };
    authenticated: {
      total: number;
      completed: number;
      conversionRate: number;
    };
  };
  abandonmentByStep: Record<string, number>;
  stepAnalytics: Record<string, {
    total: number;
    completed: number;
    abandoned: number;
    conversionRate: number;
  }>;
  deviceType: {
    mobile: number;
    desktop: number;
  };
}

interface CheckoutAnalyticsChartsProps {
  analytics: CheckoutAnalytics;
  onRefresh?: () => void;
  loading?: boolean;
}

// Utility functions
const formatCurrency = (amount: number): string => {
  return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

/**
 * CheckoutAnalyticsCharts Component
 * 
 * Displays comprehensive checkout analytics with various visualizations:
 * - Overview metrics cards
 * - Conversion funnel
 * - Step-by-step analytics
 * - User type comparison
 * - Abandonment by step
 * - Device type breakdown
 */
export default function CheckoutAnalyticsCharts({ analytics, onRefresh, loading = false }: CheckoutAnalyticsChartsProps) {
  const {
    overview,
    userTypeComparison,
    abandonmentByStep,
    stepAnalytics,
    deviceType
  } = analytics;

  // Calculate funnel data
  const funnelSteps = ['cart', 'shipping', 'billing', 'payment', 'review', 'confirmation'];
  const funnelData = funnelSteps.map(step => ({
    step,
    total: stepAnalytics[step]?.total || 0,
    completed: stepAnalytics[step]?.completed || 0,
    abandoned: stepAnalytics[step]?.abandoned || 0,
    conversionRate: stepAnalytics[step]?.conversionRate || 0
  }));

  // Calculate abandonment by step data for chart
  const abandonmentSteps = Object.keys(abandonmentByStep);
  const abandonmentData = abandonmentSteps.map(step => ({
    step,
    count: abandonmentByStep[step]
  }));

  // Calculate user type comparison data
  const userTypeData = [
    { type: 'Guest', ...userTypeComparison.guest },
    { type: 'Authenticated', ...userTypeComparison.authenticated }
  ];

  // Calculate device type data
  const totalDeviceSessions = deviceType.mobile + deviceType.desktop;
  const deviceData = [
    { type: 'Mobile', count: deviceType.mobile, percentage: totalDeviceSessions > 0 ? (deviceType.mobile / totalDeviceSessions) * 100 : 0 },
    { type: 'Desktop', count: deviceType.desktop, percentage: totalDeviceSessions > 0 ? (deviceType.desktop / totalDeviceSessions) * 100 : 0 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Checkout Analytics</h2>
          <p className="text-gray-600 mt-1">Comprehensive checkout performance metrics</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </>
          )}
        </button>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sessions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(overview.totalSessions)}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-blue-600" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">Active: {formatNumber(overview.activeSessions)}</span>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
              <p className="text-2xl font-bold text-green-600">{formatPercent(overview.conversionRate)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">Completed: {formatNumber(overview.completedSessions)}</span>
          </div>
        </div>

        {/* Abandonment Rate */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Abandonment Rate</p>
              <p className="text-2xl font-bold text-red-600">{formatPercent(overview.abandonmentRate)}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">Abandoned: {formatNumber(overview.abandonedSessions)}</span>
          </div>
        </div>

        {/* Recovery Rate */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Recovery Rate</p>
              <p className="text-2xl font-bold text-purple-600">{formatPercent(overview.recoveryRate)}</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">Recovered from abandoned</span>
          </div>
        </div>

        {/* Average Cart Value */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg Cart Value</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(overview.avgCartValue)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">Per completed checkout</span>
          </div>
        </div>

        {/* Average Time to Complete */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg Time to Complete</p>
              <p className="text-2xl font-bold text-orange-600">{Math.round(overview.avgTimeToComplete / 60)}m</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">Minutes per checkout</span>
          </div>
        </div>

        {/* Guest Sessions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Guest Sessions</p>
              <p className="text-2xl font-bold text-indigo-600">{formatNumber(userTypeComparison.guest.total)}</p>
            </div>
            <Users className="w-8 h-8 text-indigo-600" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">Conversion: {formatPercent(userTypeComparison.guest.conversionRate)}</span>
          </div>
        </div>

        {/* Authenticated Sessions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Authenticated Sessions</p>
              <p className="text-2xl font-bold text-teal-600">{formatNumber(userTypeComparison.authenticated.total)}</p>
            </div>
            <Users className="w-8 h-8 text-teal-600" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">Conversion: {formatPercent(userTypeComparison.authenticated.conversionRate)}</span>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Conversion Funnel</h3>
          </div>
          <div className="space-y-3">
            {funnelData.map((item, index) => (
              <div key={item.step} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700 capitalize">{item.step}</span>
                  <span className="text-gray-600">
                    {formatNumber(item.completed)} / {formatNumber(item.total)} ({formatPercent(item.conversionRate)})
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${item.conversionRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Abandonment by Step */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Abandonment by Step</h3>
          </div>
          <div className="space-y-3">
            {abandonmentData.length > 0 ? (
              abandonmentData.map((item) => {
                const maxCount = Math.max(...abandonmentData.map(d => d.count));
                const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                return (
                  <div key={item.step} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700 capitalize">{item.step}</span>
                      <span className="text-gray-600">{formatNumber(item.count)} abandonments</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-red-500 h-4 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-center py-4">No abandonment data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Type Comparison */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Guest vs Authenticated</h3>
          </div>
          <div className="space-y-4">
            {userTypeData.map((item) => (
              <div key={item.type} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">{item.type}</span>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {formatNumber(item.completed)} / {formatNumber(item.total)}
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      {formatPercent(item.conversionRate)}
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-6">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-6 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                    style={{ width: `${item.conversionRate}%` }}
                  >
                    <span className="text-xs text-white font-medium">{formatPercent(item.conversionRate)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Type Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <LineChart className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Device Type Breakdown</h3>
          </div>
          <div className="space-y-4">
            {deviceData.map((item) => (
              <div key={item.type} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">{item.type}</span>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {formatNumber(item.count)} sessions
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {formatPercent(item.percentage)}
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-6">
                  <div
                    className={`h-6 rounded-full transition-all duration-300 flex items-center justify-end pr-2 ${
                      item.type === 'Mobile' 
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600' 
                        : 'bg-gradient-to-r from-green-500 to-green-600'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  >
                    <span className="text-xs text-white font-medium">{formatPercent(item.percentage)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step-by-Step Analytics Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Step-by-Step Analytics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Step
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Sessions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Abandoned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversion Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {funnelData.map((item) => (
                <tr key={item.step} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900 capitalize">{item.step}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{formatNumber(item.total)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-green-600">{formatNumber(item.completed)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-red-600">{formatNumber(item.abandoned)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-blue-600">{formatPercent(item.conversionRate)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${item.conversionRate}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Key Insights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Overall Performance</p>
            <p className="text-lg font-bold text-gray-900">
              {overview.conversionRate > 50 ? 'Excellent' : overview.conversionRate > 30 ? 'Good' : 'Needs Improvement'}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Top Abandonment Step</p>
            <p className="text-lg font-bold text-gray-900 capitalize">
              {abandonmentSteps.length > 0 ? abandonmentSteps[0] : 'N/A'}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Best Performing User Type</p>
            <p className="text-lg font-bold text-gray-900">
              {userTypeComparison.guest.conversionRate > userTypeComparison.authenticated.conversionRate 
                ? 'Guest' 
                : 'Authenticated'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
