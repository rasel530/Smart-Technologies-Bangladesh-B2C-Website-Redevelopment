'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Activity, Database, AlertTriangle, Zap, Clock, TrendingUp, Filter, CheckCircle, XCircle } from 'lucide-react';
import { withAuth } from '@/components/auth/withAuth';

interface QueryMetric {
  type: string;
  indexName: string;
  duration: number;
  cacheHit: boolean;
  timestamp: number;
}

interface PerformanceAlert {
  type: string;
  severity: string;
  message: string;
  details: any;
  timestamp: number;
}

interface PerformanceReport {
  summary: {
    totalQueries: number;
    totalErrors: number;
    totalAlerts: number;
    cacheHitRate: string;
  };
  queries: {
    all: {
      count: number;
      avg: string;
      min: number;
      max: number;
      p95: number;
      p99: number;
    };
    search: {
      count: number;
      avg: string;
      min: number;
      max: number;
      p95: number;
      p99: number;
    };
    filter: {
      count: number;
      avg: string;
      min: number;
      max: number;
      p95: number;
      p99: number;
    };
    aggregation: {
      count: number;
      avg: string;
      min: number;
      max: number;
      p95: number;
      p99: number;
    };
  };
  cache: {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    total: number;
    hitRate: string;
  };
  alerts: PerformanceAlert[];
  targets: {
    searchResponseTime: {
      target: number;
      current: number;
      status: string;
    };
    filterResponseTime: {
      target: number;
      current: number;
      status: string;
    };
    aggregationResponseTime: {
      target: number;
      current: number;
      status: string;
    };
    cacheHitRate: {
      target: string;
      current: string;
      status: string;
    };
  };
}

function PerformanceMonitoring() {
  const [performance, setPerformance] = useState<PerformanceReport | null>(null);
  const [slowQueries, setSlowQueries] = useState<QueryMetric[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'queries' | 'alerts'>('overview');
  const [queryTypeFilter, setQueryTypeFilter] = useState<'all' | 'search' | 'filter' | 'aggregation'>('all');

  const fetchPerformanceData = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('auth_token');
      
      const [performanceResponse, slowQueriesResponse, alertsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/elasticsearch/performance`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/elasticsearch/performance/slow-queries?limit=20`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/elasticsearch/performance/alerts?limit=20`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!performanceResponse.ok) {
        throw new Error('Failed to fetch performance data');
      }

      const perfData = await performanceResponse.json();
      setPerformance(perfData.performance);

      if (slowQueriesResponse.ok) {
        const queriesData = await slowQueriesResponse.json();
        setSlowQueries(queriesData.slowQueries || []);
      }

      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData.alerts || []);
      }

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load performance data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
    const interval = setInterval(fetchPerformanceData, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPerformanceData();
    setRefreshing(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'met':
        return 'text-green-600';
      case 'not_met':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'met':
        return <CheckCircle className="h-4 w-4" />;
      case 'not_met':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const filteredSlowQueries = slowQueries.filter(q => 
    queryTypeFilter === 'all' || q.type === queryTypeFilter
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin/elasticsearch" className="text-gray-400 hover:text-gray-600">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Performance Monitoring</h1>
                <p className="text-sm text-gray-600">
                  Query metrics, cache stats, and alerts
                </p>
              </div>
            </div>
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

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              {[
                { id: 'overview', label: 'Overview', icon: <Activity className="h-4 w-4 mr-2" /> },
                { id: 'queries', label: 'Slow Queries', icon: <Clock className="h-4 w-4 mr-2" /> },
                { id: 'alerts', label: 'Alerts', icon: <AlertTriangle className="h-4 w-4 mr-2" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
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
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Activity className="h-6 w-6 text-indigo-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Total Queries</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {performance.summary.totalQueries}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Database className="h-6 w-6 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Cache Hit Rate</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {performance.summary.cacheHitRate}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Total Alerts</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {performance.summary.totalAlerts}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <XCircle className="h-6 w-6 text-orange-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Total Errors</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {performance.summary.totalErrors}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Query Performance */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Query Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'All Queries', data: performance.queries.all, color: 'indigo' },
                    { label: 'Search Queries', data: performance.queries.search, color: 'blue' },
                    { label: 'Filter Queries', data: performance.queries.filter, color: 'green' },
                    { label: 'Aggregation Queries', data: performance.queries.aggregation, color: 'purple' }
                  ].map((item) => (
                    <div key={item.label} className={`bg-${item.color}-50 rounded-lg p-4`}>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">{item.label}</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Count:</span>{' '}
                          <span className="font-semibold text-gray-900">{item.data.count}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Avg:</span>{' '}
                          <span className="font-semibold text-gray-900">{item.data.avg}ms</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Min:</span>{' '}
                          <span className="font-semibold text-gray-900">{item.data.min}ms</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Max:</span>{' '}
                          <span className="font-semibold text-gray-900">{item.data.max}ms</span>
                        </div>
                        <div>
                          <span className="text-gray-500">P95:</span>{' '}
                          <span className="font-semibold text-gray-900">{item.data.p95}ms</span>
                        </div>
                        <div>
                          <span className="text-gray-500">P99:</span>{' '}
                          <span className="font-semibold text-gray-900">{item.data.p99}ms</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Targets */}
              {performance.targets && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Targets</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Search Response Time', target: performance.targets.searchResponseTime },
                      { label: 'Filter Response Time', target: performance.targets.filterResponseTime },
                      { label: 'Aggregation Response Time', target: performance.targets.aggregationResponseTime },
                      { label: 'Cache Hit Rate', target: performance.targets.cacheHitRate }
                    ].map((item, index) => {
                      if (!item.target || (item.target.status === undefined && item.target.current === undefined)) {
                        return null;
                      }
                      return (
                        <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center">
                            {getStatusIcon(item.target.status)}
                            <div className="ml-3">
                              <h4 className="text-sm font-medium text-gray-900">{item.label}</h4>
                              <p className="text-xs text-gray-500">
                                Target: {typeof item.target.target === 'string' ? item.target.target : `${item.target.target}ms`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-semibold ${getStatusColor(item.target.status)}`}>
                              {typeof item.target.current === 'string' ? item.target.current : `${item.target.current}ms`}
                            </p>
                            <p className={`text-xs ${getStatusColor(item.target.status)}`}>
                              {item.target.status ? item.target.status.replace('_', ' ').toUpperCase() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Slow Queries Tab */}
          {activeTab === 'queries' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Slow Queries</h3>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={queryTypeFilter}
                    onChange={(e) => setQueryTypeFilter(e.target.value as any)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                  >
                    <option value="all">All Types</option>
                    <option value="search">Search</option>
                    <option value="filter">Filter</option>
                    <option value="aggregation">Aggregation</option>
                  </select>
                </div>
              </div>

              {filteredSlowQueries.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No slow queries found</h3>
                  <p className="text-gray-600">
                    All queries are performing within acceptable limits
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {filteredSlowQueries.map((query, index) => (
                    <li key={index} className="px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              query.cacheHit ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {query.cacheHit ? 'Cache Hit' : 'Cache Miss'}
                            </span>
                            <span className="text-xs text-gray-500 uppercase">
                              {query.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 font-medium">
                            {query.indexName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${
                            query.duration >= 1000 ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            {formatDuration(query.duration)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTimestamp(query.timestamp)}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Alerts</h3>

              {alerts.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts</h3>
                  <p className="text-gray-600">
                    All performance metrics are within acceptable ranges
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {alerts.map((alert, index) => (
                    <li key={index} className={`px-4 py-3 ${getSeverityColor(alert.severity)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase ${getSeverityColor(alert.severity)}`}>
                              {alert.severity}
                            </span>
                            <span className="text-xs text-gray-500 uppercase">
                              {alert.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 font-medium">
                            {alert.message}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {formatTimestamp(alert.timestamp)}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default withAuth(PerformanceMonitoring, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
