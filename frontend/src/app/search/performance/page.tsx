/**
 * Search Performance Dashboard Page
 *
 * Performance monitoring dashboard showing:
 * - Real-time performance metrics
 * - Response time charts (avg, p95, p99)
 * - Cache hit/miss visualization
 * - Performance alerts list
 * - Zero-result queries analysis
 * - Performance comparison over time periods
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { StatsGrid } from '@/components/design-system/Layout/StatsGrid';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/design-system/Card/Card';
import {
  getPerformanceMetrics,
  getPerformanceAlerts,
  getRealTimeStats,
  getResponseTimeDistribution,
  getPerformanceComparison,
  getCacheStats,
} from '@/lib/api/searchAnalytics';
import type {
  PerformanceMetrics,
  PerformanceAlert,
  RealTimeStats,
  ResponseTimeDistribution,
  PerformanceComparison,
} from '@/types/searchAnalytics';

export default function SearchPerformanceDashboard() {
  // Authentication state
  const { data: session, status } = useSession();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [realTimeStats, setRealTimeStats] = useState<RealTimeStats | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [responseTimeDistribution, setResponseTimeDistribution] = useState<ResponseTimeDistribution[]>([]);
  const [performanceComparison, setPerformanceComparison] = useState<PerformanceComparison | null>(null);
  const [cacheStats, setCacheStats] = useState<{
    hitRate: number;
    missRate: number;
    totalRequests: number;
    hits: number;
    misses: number;
  } | null>(null);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [metricsData, alertsData, realTimeData, distributionData, comparisonData, cacheData] =
        await Promise.all([
          getPerformanceMetrics(timeRange),
          getPerformanceAlerts(undefined, 'high'),
          getRealTimeStats(),
          getResponseTimeDistribution(timeRange),
          getPerformanceComparison(timeRange, timeRange === 'week' ? 'week' : timeRange === 'month' ? 'month' : 'day'),
          getCacheStats(timeRange),
        ]);
      
      setMetrics(metricsData);
      setAlerts(alertsData);
      setRealTimeStats(realTimeData);
      setResponseTimeDistribution(distributionData);
      setPerformanceComparison(comparisonData);
      setCacheStats(cacheData);
    } catch (err: any) {
      console.error('Error fetching search performance:', err);
      setError(err?.message || 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (status === 'authenticated') {
      fetchData();
      
      // Refresh real-time stats every 30 seconds
      const interval = setInterval(() => {
        getRealTimeStats()
          .then(setRealTimeStats)
          .catch(err => console.error('Error fetching real-time stats:', err));
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [timeRange, status]);

  // Format number
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Format percentage
  const formatPercentage = (num: number): string => {
    return `${(num * 100).toFixed(2)}%`;
  };

  // Get severity color
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Search Performance</h1>
              <p className="text-gray-600 mt-1">
                Monitor search performance metrics in real-time
              </p>
            </div>
            
            {/* Time Range Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="timeRange" className="text-sm font-medium text-gray-700">
                Time Range:
              </label>
              <select
                id="timeRange"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as 'today' | 'week' | 'month' | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="today">Today</option>
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Authentication Loading State */}
        {status === 'loading' && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Verifying authentication...</p>
            </div>
          </div>
        )}

        {/* Authentication Error State */}
        {status === 'unauthenticated' && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center max-w-md">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
                <svg className="w-12 h-12 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-lg font-semibold text-red-900 mb-2">Authentication Required</h3>
                <p className="text-red-700">You must be logged in to view search performance data.</p>
              </div>
              <a
                href="/auth/signin"
                className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In
              </a>
            </div>
          </div>
        )}

        {error && status === 'authenticated' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {status === 'authenticated' && loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading performance data...</p>
            </div>
          </div>
        ) : status === 'authenticated' && (
          <div className="space-y-6">
            {/* Real-time Stats */}
            {realTimeStats && (
              <StatsGrid
                stats={[
                  {
                    title: 'Current Queries',
                    value: realTimeStats.currentQueries.toString(),
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    ),
                    color: 'primary',
                  },
                  {
                    title: 'Active Users',
                    value: realTimeStats.activeUsers.toString(),
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    ),
                    color: 'success',
                  },
                  {
                    title: 'Avg Response Time',
                    value: `${realTimeStats.avgResponseTime.toFixed(0)}ms`,
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                    color: 'warning',
                  },
                  {
                    title: 'Cache Hit Rate',
                    value: formatPercentage(realTimeStats.cacheHitRate),
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                      </svg>
                    ),
                    color: 'success',
                  },
                ]}
                columns={4}
              />
            )}

            {/* Performance Metrics */}
            {metrics && (
              <StatsGrid
                stats={[
                  {
                    title: 'Total Queries',
                    value: formatNumber(metrics.queryCount),
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    ),
                    color: 'primary',
                  },
                  {
                    title: 'Avg Response Time',
                    value: `${metrics.avgResponseTime.toFixed(0)}ms`,
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                    color: 'warning',
                  },
                  {
                    title: 'P95 Response Time',
                    value: `${metrics.p95ResponseTime.toFixed(0)}ms`,
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    ),
                    color: 'warning',
                  },
                  {
                    title: 'P99 Response Time',
                    value: `${metrics.p99ResponseTime.toFixed(0)}ms`,
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    ),
                    color: 'danger',
                  },
                  {
                    title: 'Cache Hit Rate',
                    value: formatPercentage(metrics.cacheHitRate),
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                      </svg>
                    ),
                    color: 'success',
                  },
                  {
                    title: 'Zero Result Queries',
                    value: formatNumber(metrics.zeroResultQueries),
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    ),
                    color: 'danger',
                  },
                ]}
                columns={3}
              />
            )}

            {/* Response Time Distribution */}
            <Card>
              <CardHeader
                title="Response Time Distribution"
                description="Distribution of query response times"
              />
              <CardBody>
                {responseTimeDistribution.length > 0 ? (
                  <div className="space-y-3">
                    {responseTimeDistribution.map((dist, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-24 text-sm text-gray-600">{dist.range}</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${dist.percentage}%` }}
                          />
                        </div>
                        <div className="w-20 text-right text-sm font-medium text-gray-900">
                          {dist.count} ({dist.percentage.toFixed(1)}%)
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No response time distribution data available</p>
                )}
              </CardBody>
            </Card>

            {/* Cache Statistics */}
            {cacheStats && (
              <Card>
                <CardHeader
                  title="Cache Statistics"
                  description="Cache hit/miss performance"
                />
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {formatPercentage(cacheStats.hitRate)}
                      </div>
                      <div className="text-sm text-gray-600">Hit Rate</div>
                      <div className="text-xs text-gray-500 mt-1">{formatNumber(cacheStats.hits)} hits</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600 mb-2">
                        {formatPercentage(cacheStats.missRate)}
                      </div>
                      <div className="text-sm text-gray-600">Miss Rate</div>
                      <div className="text-xs text-gray-500 mt-1">{formatNumber(cacheStats.misses)} misses</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {formatNumber(cacheStats.totalRequests)}
                      </div>
                      <div className="text-sm text-gray-600">Total Requests</div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Performance Comparison */}
            {performanceComparison && (
              <Card>
                <CardHeader
                  title="Performance Comparison"
                  description="Compare current period with previous period"
                />
                <CardBody>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Metric</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Current</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Previous</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <td className="py-3 px-4 font-medium text-gray-900">Avg Response Time</td>
                          <td className="py-3 px-4 text-gray-600">{performanceComparison.currentPeriod.avgResponseTime.toFixed(0)}ms</td>
                          <td className="py-3 px-4 text-gray-600">{performanceComparison.previousPeriod.avgResponseTime.toFixed(0)}ms</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                performanceComparison.change.avgResponseTime < 0
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {performanceComparison.change.avgResponseTime < 0 ? '↓' : '↑'}
                              {Math.abs(performanceComparison.change.avgResponseTime).toFixed(0)}ms
                            </span>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-3 px-4 font-medium text-gray-900">P95 Response Time</td>
                          <td className="py-3 px-4 text-gray-600">{performanceComparison.currentPeriod.p95ResponseTime.toFixed(0)}ms</td>
                          <td className="py-3 px-4 text-gray-600">{performanceComparison.previousPeriod.p95ResponseTime.toFixed(0)}ms</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                performanceComparison.change.p95ResponseTime < 0
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {performanceComparison.change.p95ResponseTime < 0 ? '↓' : '↑'}
                              {Math.abs(performanceComparison.change.p95ResponseTime).toFixed(0)}ms
                            </span>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-3 px-4 font-medium text-gray-900">Cache Hit Rate</td>
                          <td className="py-3 px-4 text-gray-600">{formatPercentage(performanceComparison.currentPeriod.cacheHitRate)}</td>
                          <td className="py-3 px-4 text-gray-600">{formatPercentage(performanceComparison.previousPeriod.cacheHitRate)}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                performanceComparison.change.cacheHitRate > 0
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {performanceComparison.change.cacheHitRate > 0 ? '↑' : '↓'}
                              {Math.abs(performanceComparison.change.cacheHitRate * 100).toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-3 px-4 font-medium text-gray-900">Zero Result Rate</td>
                          <td className="py-3 px-4 text-gray-600">{formatPercentage(performanceComparison.currentPeriod.zeroResultRate)}</td>
                          <td className="py-3 px-4 text-gray-600">{formatPercentage(performanceComparison.previousPeriod.zeroResultRate)}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                performanceComparison.change.zeroResultRate < 0
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {performanceComparison.change.zeroResultRate < 0 ? '↓' : '↑'}
                              {Math.abs(performanceComparison.change.zeroResultRate * 100).toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Performance Alerts */}
            <Card>
              <CardHeader
                title="Performance Alerts"
                description="Active performance alerts and warnings"
              />
              <CardBody>
                {alerts.length > 0 ? (
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-sm">{alert.message}</h4>
                            <p className="text-xs mt-1 opacity-75">
                              {alert.metric}: {alert.value} (threshold: {alert.threshold})
                            </p>
                            <p className="text-xs mt-1 opacity-75">
                              {new Date(alert.timestamp).toLocaleString()}
                            </p>
                          </div>
                          {alert.resolved !== undefined && (
                            <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
                              {alert.resolved ? 'Resolved' : 'Active'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No active alerts</p>
                )}
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
