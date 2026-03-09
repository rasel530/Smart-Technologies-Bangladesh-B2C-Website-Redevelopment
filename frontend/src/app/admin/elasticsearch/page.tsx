'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Database, Activity, AlertTriangle, CheckCircle, XCircle, Clock, Server } from 'lucide-react';
import { withAuth } from '@/components/auth/withAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface ClusterHealth {
  status: string;
  clusterName: string;
  numberOfNodes: number;
  activeShards: number;
  timestamp: string;
}

interface ClusterStats {
  clusterName: string;
  status: string;
  indices: {
    count: number;
    docs: {
      count: number;
    };
    store: {
      size_in_bytes: number;
    };
  };
  nodes: {
    count: {
      total: number;
    };
  };
}

function ElasticsearchOverview() {
  const [health, setHealth] = useState<ClusterHealth | null>(null);
  const [stats, setStats] = useState<ClusterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClusterData = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('auth_token');
      
      const [healthResponse, statsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/elasticsearch/health`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/elasticsearch/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!healthResponse.ok) {
        throw new Error('Failed to fetch cluster health');
      }

      if (!statsResponse.ok) {
        throw new Error('Failed to fetch cluster statistics');
      }

      const healthData = await healthResponse.json();
      const statsData = await statsResponse.json();

      setHealth(healthData.health);
      setStats(statsData);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cluster data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusterData();
    const interval = setInterval(fetchClusterData, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchClusterData();
    setRefreshing(false);
  };

  const getHealthStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'green':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'yellow':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'red':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'green':
        return <CheckCircle className="h-5 w-5" />;
      case 'yellow':
        return <AlertTriangle className="h-5 w-5" />;
      case 'red':
        return <XCircle className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Elasticsearch cluster data...</p>
          </div>
        </div>
      );
  }

  return (
    <AdminLayout title="Elasticsearch Overview">
      <>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Link href="/admin" className="text-gray-400 hover:text-gray-600">
                  ← Back
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Elasticsearch Management</h1>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                Monitor and manage your Elasticsearch cluster
              </p>
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

        {/* Cluster Health Status */}
        {health && (
          <div className={`mb-6 rounded-lg border-2 p-6 ${getHealthStatusColor(health.status)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {getHealthStatusIcon(health.status)}
                <div className="ml-4">
                  <h2 className="text-2xl font-bold capitalize">{health.status}</h2>
                  <p className="text-sm opacity-75">Cluster Status</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{health.clusterName}</p>
                <p className="text-xs opacity-75">
                  Updated: {new Date(health.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-100 rounded-full p-3">
                <Server className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Nodes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {health?.numberOfNodes || stats?.nodes.count.total || '--'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-full p-3">
                <Database className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Indices</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.indices.count || '--'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Documents</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.indices.docs.count ? formatNumber(stats.indices.docs.count) : '--'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-full p-3">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Storage</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.indices.store.size_in_bytes ? formatBytes(stats.indices.store.size_in_bytes) : '--'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/elasticsearch/indices"
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Database className="h-4 w-4 mr-2" />
              Manage Indices
            </Link>
            <Link
              href="/admin/elasticsearch/backups"
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Manage Backups
            </Link>
            <Link
              href="/admin/elasticsearch/performance"
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Activity className="h-4 w-4 mr-2" />
              View Performance
            </Link>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/admin/elasticsearch/indices"
            className="group bg-white rounded-lg shadow p-6 border-2 border-transparent hover:border-primary-200 transition-all"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-primary-100 rounded-lg p-3">
                <Database className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Index Management</h3>
                <p className="text-sm text-gray-600">
                  View, create, delete, and manage Elasticsearch indices
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/elasticsearch/backups"
            className="group bg-white rounded-lg shadow p-6 border-2 border-transparent hover:border-green-200 transition-all"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <RefreshCw className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Backup Management</h3>
                <p className="text-sm text-gray-600">
                  Create, restore, and manage snapshot backups
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/elasticsearch/performance"
            className="group bg-white rounded-lg shadow p-6 border-2 border-transparent hover:border-blue-200 transition-all"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Monitoring</h3>
                <p className="text-sm text-gray-600">
                  View query metrics, cache stats, and alerts
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/elasticsearch/synonyms"
            className="group bg-white rounded-lg shadow p-6 border-2 border-transparent hover:border-purple-200 transition-all"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                <Server className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Synonym Management</h3>
                <p className="text-sm text-gray-600">
                  Add, edit, and manage search synonyms
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
      </>
    </AdminLayout>
  );
}

export default withAuth(ElasticsearchOverview, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
