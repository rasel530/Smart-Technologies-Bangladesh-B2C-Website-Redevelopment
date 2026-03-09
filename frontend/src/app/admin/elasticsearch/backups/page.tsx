'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Download, Upload, Clock, Database, AlertTriangle, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { withAuth } from '@/components/auth/withAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface BackupRepository {
  name: string;
  type?: string;
  settings?: any;
}

interface Backup {
  snapshot: string;
  repository: string;
  state: string;
  startTime?: string;
  endTime?: string;
  indices?: string[];
}

function BackupManagement() {
  const [repositories, setRepositories] = useState<BackupRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [newBackup, setNewBackup] = useState({
    repository: '',
    snapshot: '',
    indices: [] as string[]
  });
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const fetchRepositories = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/elasticsearch/backups`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch backup repositories');
      }

      const data = await response.json();
      setRepositories(data.repositories || []);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load backup repositories');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRepositories();
    setRefreshing(false);
  };

  const handleCreateBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/elasticsearch/backups/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          repository: newBackup.repository,
          snapshot: newBackup.snapshot,
          indices: newBackup.indices.length > 0 ? newBackup.indices : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create backup');
      }

      setShowCreateDialog(false);
      setNewBackup({ repository: '', snapshot: '', indices: [] });
      await fetchRepositories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create backup');
    } finally {
      setCreating(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;
    
    try {
      setRestoring(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/elasticsearch/backups/${encodeURIComponent(selectedBackup.snapshot)}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          repository: selectedBackup.repository
        })
      });

      if (!response.ok) {
        throw new Error('Failed to restore backup');
      }

      setShowRestoreDialog(false);
      setSelectedBackup(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore backup');
    } finally {
      setRestoring(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleString();
  };

  const getBackupStateColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getBackupStateIcon = (state: string) => {
    switch (state.toLowerCase()) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <AdminLayout title="Elasticsearch Backups">
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
                <h1 className="text-3xl font-bold text-gray-900">Backup Management</h1>
                <p className="text-sm text-gray-600">
                  Create and manage Elasticsearch snapshot backups
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateDialog(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Backup
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

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <Database className="h-6 w-6 text-blue-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">About Backups</h3>
              <p className="text-sm text-blue-800 mb-2">
                Backups are snapshots of your Elasticsearch cluster data. They allow you to restore your data to a previous state in case of data loss or corruption.
              </p>
              <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                <li>Backups are stored in repositories (file system or cloud storage)</li>
                <li>Each backup can include specific indices or all indices</li>
                <li>Restoring a backup will overwrite existing data</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Repositories List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading backup repositories...</p>
          </div>
        ) : repositories.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No backup repositories found</h3>
            <p className="text-gray-600 mb-4">
              Create a backup repository to start managing snapshots
            </p>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Backup
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Backup Repositories ({repositories.length})
              </h2>
            </div>
            <ul className="divide-y divide-gray-200">
              {repositories.map((repo) => (
                <li key={repo.name} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <Database className="h-5 w-5 text-indigo-600 mr-4" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{repo.name}</h3>
                        {repo.type && (
                          <p className="text-sm text-gray-600">Type: {repo.type}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                        title="Restore from this repository"
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        Restore
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Create Backup Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Backup</h3>
              <button
                onClick={() => setShowCreateDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Trash2 className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleCreateBackup}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Repository Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newBackup.repository}
                    onChange={(e) => setNewBackup({ ...newBackup, repository: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                    placeholder="e.g., backup-repo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Snapshot Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newBackup.snapshot}
                    onChange={(e) => setNewBackup({ ...newBackup, snapshot: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                    placeholder="e.g., snapshot-2024-01-31"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Indices (optional)
                  </label>
                  <input
                    type="text"
                    value={newBackup.indices.join(', ')}
                    onChange={(e) => setNewBackup({ 
                      ...newBackup, 
                      indices: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                    })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                    placeholder="e.g., products, categories (leave empty for all indices)"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty to backup all indices
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateDialog(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${creating ? 'animate-spin' : ''}`} />
                  {creating ? 'Creating...' : 'Create Backup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </AdminLayout>
  );
}

export default withAuth(BackupManagement, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
