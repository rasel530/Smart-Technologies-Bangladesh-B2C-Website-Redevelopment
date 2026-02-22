'use client';

import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Users,
  ShoppingCart,
  Heart,
  TrendingUp,
  TrendingDown 
} from 'lucide-react';
import {
  getAdminSyncStatus,
  getAdminRecentSyncs,
  getAdminAllConflicts,
  getAdminSystemAnalytics,
  adminResolveConflict
} from '@/lib/api/cartWishlistApi';
import type {
  AdminSyncStatus,
  AdminSyncRecord,
  AdminConflict,
  SystemAnalytics
} from '@/lib/api/cartWishlistApi';

interface SyncStatusCardProps {
  status: AdminSyncStatus;
  loading: boolean;
}

const SyncStatusCard: React.FC<SyncStatusCardProps> = ({ status, loading }) => {
  const getHealthColor = () => {
    switch (status.systemHealth) {
      case 'healthy':
        return 'text-green-600 bg-green-50';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getHealthIcon = () => {
    switch (status.systemHealth) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5" />;
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">System Sync Status</h3>
        {loading ? (
          <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
        ) : (
          <button
            onClick={() => window.location.reload()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>
      
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${getHealthColor()} rounded-lg p-4 mb-4`}>
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            {getHealthIcon()}
          </div>
          <p className="text-2xl font-bold">{status.totalSyncs}</p>
          <p className="text-sm text-gray-600">Total Syncs</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold">{status.activeSyncs}</p>
          <p className="text-sm text-gray-600">Active Syncs</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold">{status.completedSyncs}</p>
          <p className="text-sm text-gray-600">Completed</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold">{status.failedSyncs}</p>
          <p className="text-sm text-gray-600">Failed</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-gray-600" />
          <div>
            <p className="text-sm text-gray-600">Last Sync</p>
            <p className="font-medium">
              {status.lastSyncAt 
                ? new Date(status.lastSyncAt).toLocaleString()
                : 'Never'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-gray-600" />
          <div>
            <p className="text-sm text-gray-600">Pending Operations</p>
            <p className="font-medium">{status.pendingOperations}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface RecentSyncsTableProps {
  syncs: AdminSyncRecord[];
  loading: boolean;
}

const RecentSyncsTable: React.FC<RecentSyncsTableProps> = ({ syncs, loading }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'syncing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sync Operations</h3>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
          <p className="ml-3 text-gray-600">Loading sync records...</p>
        </div>
      ) : syncs.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>No sync records found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Items</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Started</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Completed</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Errors</th>
              </tr>
            </thead>
            <tbody>
              {syncs.map((sync) => (
                <tr key={sync.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {sync.user?.firstName} {sync.user?.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{sync.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(sync.syncStatus)}`}>
                      {sync.syncStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{sync.syncType}</td>
                  <td className="py-3 px-4 text-gray-700">{sync.itemsProcessed}</td>
                  <td className="py-3 px-4 text-gray-700">
                    {new Date(sync.startedAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {sync.completedAt ? new Date(sync.completedAt).toLocaleString() : '-'}
                  </td>
                  <td className="py-3 px-4">
                    {sync.errors ? (
                      <span className="text-red-600">{sync.errors}</span>
                    ) : (
                      <span className="text-green-600">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

interface ConflictsTableProps {
  conflicts: AdminConflict[];
  loading: boolean;
  onResolve: (conflictId: string, resolution: 'keep_cart' | 'keep_wishlist' | 'merge') => void;
}

const ConflictsTable: React.FC<ConflictsTableProps> = ({ conflicts, loading, onResolve }) => {
  const [resolving, setResolving] = useState<string | null>(null);

  const handleResolve = async (conflictId: string, resolution: 'keep_cart' | 'keep_wishlist' | 'merge') => {
    setResolving(conflictId);
    try {
      await adminResolveConflict(conflictId, resolution);
      onResolve(conflictId, resolution);
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      alert('Failed to resolve conflict. Please try again.');
    } finally {
      setResolving(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Conflicts</h3>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
          <p className="ml-3 text-gray-600">Loading conflicts...</p>
        </div>
      ) : conflicts.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
          <p>No active conflicts</p>
        </div>
      ) : (
        <div className="space-y-4">
          {conflicts.map((conflict) => (
            <div key={conflict.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {conflict.user?.firstName} {conflict.user?.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{conflict.user?.email}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  conflict.resolved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {conflict.resolved ? 'Resolved' : 'Active'}
                </span>
              </div>
              
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-1">Type: {conflict.type}</p>
                <p className="text-sm text-gray-600 mb-1">Timestamp: {new Date(conflict.timestamp).toLocaleString()}</p>
                {conflict.data && (
                  <details className="mt-2">
                    <summary className="text-sm text-blue-600 cursor-pointer hover:underline">
                      View Conflict Details
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto">
                      {JSON.stringify(conflict.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
              
              {!conflict.resolved && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleResolve(conflict.id, 'keep_cart')}
                    disabled={resolving === conflict.id}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {resolving === conflict.id ? 'Resolving...' : 'Keep Cart'}
                  </button>
                  <button
                    onClick={() => handleResolve(conflict.id, 'keep_wishlist')}
                    disabled={resolving === conflict.id}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {resolving === conflict.id ? 'Resolving...' : 'Keep Wishlist'}
                  </button>
                  <button
                    onClick={() => handleResolve(conflict.id, 'merge')}
                    disabled={resolving === conflict.id}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {resolving === conflict.id ? 'Resolving...' : 'Merge'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface AnalyticsSummaryProps {
  analytics: SystemAnalytics | null;
  loading: boolean;
}

const AnalyticsSummary: React.FC<AnalyticsSummaryProps> = ({ analytics, loading }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">System Analytics</h3>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
          <p className="ml-3 text-gray-600">Loading analytics...</p>
        </div>
      ) : analytics ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold text-blue-900">{analytics.totalUsers}</p>
            <p className="text-sm text-blue-700">Total Users</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold text-green-900">{analytics.activeCarts}</p>
            <p className="text-sm text-green-700">Active Carts</p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Heart className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold text-purple-900">{analytics.activeWishlists}</p>
            <p className="text-sm text-purple-700">Active Wishlists</p>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 text-orange-600" />
            <p className="text-2xl font-bold text-orange-900">{analytics.totalSyncs}</p>
            <p className="text-sm text-orange-700">Total Syncs</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold text-green-900">{analytics.successfulSyncs}</p>
            <p className="text-sm text-green-700">Successful</p>
          </div>
          
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
            <p className="text-2xl font-bold text-red-900">{analytics.failedSyncs}</p>
            <p className="text-sm text-red-700">Failed</p>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold text-blue-900">{analytics.cartToWishlistMoves}</p>
            <p className="text-sm text-blue-700">Cart → Wishlist</p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <TrendingDown className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold text-purple-900">{analytics.wishlistToCartMoves}</p>
            <p className="text-sm text-purple-700">Wishlist → Cart</p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const CartWishlistSyncDashboard: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<AdminSyncStatus | null>(null);
  const [recentSyncs, setRecentSyncs] = useState<AdminSyncRecord[]>([]);
  const [conflicts, setConflicts] = useState<AdminConflict[]>([]);
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [statusData, syncsData, conflictsData, analyticsData] = await Promise.all([
        getAdminSyncStatus(),
        getAdminRecentSyncs(10),
        getAdminAllConflicts(),
        getAdminSystemAnalytics()
      ]);
      
      setSyncStatus(statusData);
      setRecentSyncs(syncsData.data);
      setConflicts(conflictsData.conflicts);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const handleConflictResolved = (conflictId: string, resolution: 'keep_cart' | 'keep_wishlist' | 'merge') => {
    setConflicts(conflicts.filter(c => c.id !== conflictId));
    fetchData(); // Refresh data after resolution
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cart-Wishlist Sync Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor and manage cart-wishlist synchronization operations</p>
        </div>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            autoRefresh 
              ? 'bg-green-600 text-white hover:bg-green-700' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin-slow' : ''}`} />
          <span>Auto-refresh {autoRefresh ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {syncStatus && <SyncStatusCard status={syncStatus} loading={loading} />}
          <RecentSyncsTable syncs={recentSyncs} loading={loading} />
        </div>
        
        <div className="space-y-6">
          <ConflictsTable 
            conflicts={conflicts} 
            loading={loading} 
            onResolve={handleConflictResolved}
          />
          <AnalyticsSummary analytics={analytics} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default CartWishlistSyncDashboard;
