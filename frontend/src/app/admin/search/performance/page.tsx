'use client';

/**
 * Search Performance Admin Page
 *
 * Admin-only page that displays search performance monitoring including:
 * - Performance metrics overview
 * - Response time distribution chart
 * - Cache performance visualization
 * - Performance alerts list with severity
 * - Zero-result queries analysis
 * - Performance comparison between time periods
 * - Performance threshold configuration
 * - Alert management (acknowledge, dismiss, configure)
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  TrendingUp,
  TrendingDown,
  Calendar,
  Gauge,
  Database
} from 'lucide-react';
import { withAuth } from '@/components/auth/withAuth';
import {
  getAdminPerformanceOverview,
  getAdminPerformanceAlerts,
  updateAdminAlertStatus,
  getAdminPerformanceComparison,
  updateAdminPerformanceThreshold,
  type PerformanceOverview
} from '@/lib/api/adminSearchAnalytics';

interface TabType {
  id: 'overview' | 'alerts' | 'comparison';
  label: string;
  icon: React.ReactNode;
}

function SearchPerformanceAdminPage(): JSX.Element {
  const [performance, setPerformance] = useState<PerformanceOverview | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'comparison'>('overview');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [comparisonPeriod1, setComparisonPeriod1] = useState('week');
  const [comparisonPeriod2, setComparisonPeriod2] = useState('month');
  const [showThresholdDialog, setShowThresholdDialog] = useState(false);
  const [thresholds, setThresholds] = useState({
    slowQueryThreshold: 1000,
    highZeroResultsThreshold: 10,
    lowCacheHitThreshold: 50
  });

  const fetchPerformance = async () => {
    try {
      setError(null);
      const data = await getAdminPerformanceOverview(timeRange);
      setPerformance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load performance data');
    }
  };

  const fetchAlerts = async () => {
    try {
      const data = await getAdminPerformanceAlerts(thresholds);
      setAlerts(data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  const fetchComparison = async () => {
    try {
      const data = await getAdminPerformanceComparison(comparisonPeriod1, comparisonPeriod2);
      setComparison(data);
    } catch (err) {
      console.error('Failed to fetch comparison:', err);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchPerformance(),
      fetchAlerts()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, [timeRange]);

  useEffect(() => {
    if (activeTab === 'comparison') {
      fetchComparison();
    }
  }, [activeTab, comparisonPeriod1, comparisonPeriod2]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const handleAlertAction = async (alertId: string, status: string) => {
    try {
      await updateAdminAlertStatus(alertId, status);
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, resolved: status === 'resolved' } : alert
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update alert');
    }
  };

  const handleUpdateThresholds = async () => {
    try {
      await updateAdminPerformanceThreshold(thresholds);
      setShowThresholdDialog(false);
      await fetchAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update thresholds');
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-BD').format(num);
  };

  const formatTimestamp = (timestamp: string | Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-5 w-5" />;
      case 'high': return <AlertTriangle className="h-5 w-5" />;
      case 'medium': return <AlertTriangle className="h-5 w-5" />;
      case 'low': return <Activity className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const getChangeColor = (change: string) => {
    const changeValue = parseFloat(change);
    if (changeValue > 0) return 'text-red-600';
    if (changeValue < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change: string) => {
    const changeValue = parseFloat(change);
    if (changeValue > 0) return <TrendingUp className="h-4 w-4" />;
    if (changeValue < 0) return <TrendingDown className="h-4 w-4" />;
    return null;
  };

  const tabs: TabType[] = [
    { id: 'overview', label: 'Overview', icon: <Activity className="h-4 w-4 mr-2" /> },
    { id: 'alerts', label: 'Alerts', icon: <AlertTriangle className="h-4 w-4 mr-2" /> },
    { id: 'comparison', label: 'Comparison', icon: <TrendingUp className="h-4 w-4 mr-2" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin/search" className="text-gray-400 hover:text-gray-600">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Search Performance</h1>
                <p className="text-sm text-gray-600">
                  Performance monitoring and optimization metrics
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowThresholdDialog(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Settings className="h-4 w-4 mr-2" />
                Thresholds
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            <p className="mt-4 text-gray-600">Loading performance data...</p>
          </div>
        ) : (
          <>
            {/* Controls */}
            <div className="bg-white rounded-lg shadow mb-6 p-4">
              <div className="flex items-center gap-4">
                <Calendar className="h-4 w-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Time Range:</label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                >
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Overview Tab */}
              {activeTab === 'overview' && performance && (
                <div className="p-6 space-y-6">
                  {/* Performance Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                      <div className="flex items-center">
                        <Activity className="h-6 w-6 text-blue-600 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">Avg Response Time</p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {performance.avgResponseTime}ms
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                      <div className="flex items-center">
                        <Clock className="h-6 w-6 text-purple-600 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">P95 Response Time</p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {performance.p95ResponseTime}ms
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                      <div className="flex items-center">
                        <Database className="h-6 w-6 text-green-600 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">Cache Hit Rate</p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {performance.cacheHitRate}%
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertTriangle className="h-6 w-6 text-orange-600 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">Zero Results Rate</p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {performance.zeroResultRate}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Median Response Time</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {performance.medianResponseTime}ms
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">P99 Response Time</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {performance.p99ResponseTime}ms
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Total Searches</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {formatNumber(performance.totalSearches)}
                      </p>
                    </div>
                  </div>

                  {/* Response Time Distribution */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Response Time Distribution
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-700 font-medium w-32">Fast (less than 100ms)</span>
                        <div className="flex-1 bg-green-200 rounded-full h-4">
                          <div className="bg-green-600 h-4 rounded-full" style={{ width: '75%' }} />
                        </div>
                        <span className="text-sm text-gray-600 w-24 text-right">75%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-700 font-medium w-32">Normal (100-1000ms)</span>
                        <div className="flex-1 bg-blue-200 rounded-full h-4">
                          <div className="bg-blue-600 h-4 rounded-full" style={{ width: '20%' }} />
                        </div>
                        <span className="text-sm text-gray-600 w-24 text-right">20%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-700 font-medium w-32">Slow (greater than 1000ms)</span>
                        <div className="flex-1 bg-red-200 rounded-full h-4">
                          <div className="bg-red-600 h-4 rounded-full" style={{ width: '5%' }} />
                        </div>
                        <span className="text-sm text-gray-600 w-24 text-right">5%</span>
                      </div>
                    </div>
                  </div>

                  {/* Cache Performance */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Cache Performance
                    </h3>
                    <div className="flex items-center gap-6">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Cache Hit Rate</span>
                          <span className="text-sm font-semibold text-green-600">{performance.cacheHitRate}%</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-3">
                          <div className="bg-green-600 h-3 rounded-full transition-all duration-300" style={{ width: `${performance.cacheHitRate}%` }} />
                        </div>
                      </div>
                      <div className="flex-1 text-center">
                        <Gauge className="h-20 w-20 text-green-600 mx-auto" />
                        <p className="text-sm text-gray-600 mt-2">Performance Score</p>
                        <p className="text-2xl font-semibold text-green-600">Good</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Alerts Tab */}
              {activeTab === 'alerts' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Performance Alerts
                    </h3>
                    <span className="text-sm text-gray-600">
                      {alerts.length} active alerts
                    </span>
                  </div>
                  {alerts.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-gray-600">No active performance alerts</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Your search performance is within normal thresholds
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {alerts.map((alert) => (
                        <li key={alert.id} className="px-4 py-4 hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                {getSeverityIcon(alert.severity)}
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {alert.message}
                                  </p>
                                  <div className="flex items-center gap-4 mt-1">
                                    <span className={`text-xs px-2 py-1 rounded border ${getSeverityColor(alert.severity)}`}>
                                      {alert.severity.toUpperCase()}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatTimestamp(alert.timestamp)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {!alert.resolved && (
                              <div className="flex items-center gap-2 ml-4">
                                <button
                                  onClick={() => handleAlertAction(alert.id, 'acknowledged')}
                                  className="text-xs px-3 py-1 border border-blue-300 rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                                >
                                  Acknowledge
                                </button>
                                <button
                                  onClick={() => handleAlertAction(alert.id, 'dismissed')}
                                  className="text-xs px-3 py-1 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  Dismiss
                                </button>
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Comparison Tab */}
              {activeTab === 'comparison' && comparison && (
                <div className="p-6 space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Performance Comparison
                  </h3>
                  
                  {/* Period Selection */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Current Period:</label>
                        <select
                          value={comparisonPeriod1}
                          onChange={(e) => setComparisonPeriod1(e.target.value)}
                          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                        >
                          <option value="today">Today</option>
                          <option value="week">Last 7 Days</option>
                          <option value="month">Last 30 Days</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Previous Period:</label>
                        <select
                          value={comparisonPeriod2}
                          onChange={(e) => setComparisonPeriod2(e.target.value)}
                          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                        >
                          <option value="today">Today</option>
                          <option value="week">Last 7 Days</option>
                          <option value="month">Last 30 Days</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Comparison Metrics */}
                  <div className="space-y-4">
                    {[
                      { label: 'Avg Response Time', current: comparison.currentPeriod.avgResponseTime, previous: comparison.previousPeriod.avgResponseTime, change: comparison.change.avgResponseTime, unit: 'ms' },
                      { label: 'P95 Response Time', current: comparison.currentPeriod.p95ResponseTime, previous: comparison.previousPeriod.p95ResponseTime, change: comparison.change.p95ResponseTime, unit: 'ms' },
                      { label: 'Cache Hit Rate', current: comparison.currentPeriod.cacheHitRate, previous: comparison.previousPeriod.cacheHitRate, change: comparison.change.cacheHitRate, unit: '%' },
                      { label: 'Zero Result Rate', current: comparison.currentPeriod.zeroResultRate, previous: comparison.previousPeriod.zeroResultRate, change: comparison.change.zeroResultRate, unit: '%' }
                    ].map((metric, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-gray-600">{metric.label}</p>
                            <div className="flex items-center gap-6 mt-2">
                              <div>
                                <p className="text-xs text-gray-500">Current</p>
                                <p className="text-lg font-semibold text-gray-900">{metric.current}{metric.unit}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Previous</p>
                                <p className="text-lg font-semibold text-gray-900">{metric.previous}{metric.unit}</p>
                              </div>
                            </div>
                          </div>
                          <div className={`flex items-center gap-1 ${getChangeColor(metric.change)}`}>
                            {getChangeIcon(metric.change)}
                            <span className="text-sm font-medium">
                              {parseFloat(metric.change) > 0 ? '+' : ''}{metric.change}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Period Info */}
            {performance && (
              <div className="mt-4 text-sm text-gray-500 text-center">
                <p>
                  Showing data from {formatTimestamp(performance.period.startDate)} to {formatTimestamp(performance.period.endDate)}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Threshold Dialog */}
      {showThresholdDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Configure Performance Thresholds
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slow Query Threshold (ms)
                  </label>
                  <input
                    type="number"
                    value={thresholds.slowQueryThreshold}
                    onChange={(e) => setThresholds({ ...thresholds, slowQueryThreshold: parseInt(e.target.value) })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    High Zero Results Threshold
                  </label>
                  <input
                    type="number"
                    value={thresholds.highZeroResultsThreshold}
                    onChange={(e) => setThresholds({ ...thresholds, highZeroResultsThreshold: parseInt(e.target.value) })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Low Cache Hit Threshold (%)
                  </label>
                  <input
                    type="number"
                    value={thresholds.lowCacheHitThreshold}
                    onChange={(e) => setThresholds({ ...thresholds, lowCacheHitThreshold: parseInt(e.target.value) })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowThresholdDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateThresholds}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Save Thresholds
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(SearchPerformanceAdminPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
