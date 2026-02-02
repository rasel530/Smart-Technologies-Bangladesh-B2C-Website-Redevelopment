'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Database, Trash2, RefreshCw, Eye, FileText, Search, Plus, AlertTriangle } from 'lucide-react';
import { withAuth } from '@/components/auth/withAuth';

interface IndexStats {
  primaries: {
    docs: {
      count: number;
    };
    store: {
      size_in_bytes: number;
    };
  };
}

interface Index {
  name: string;
  stats: IndexStats | null;
}

function IndexManagement() {
  const [indices, setIndices] = useState<Index[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndices, setSelectedIndices] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [selectedIndexForMapping, setSelectedIndexForMapping] = useState<string | null>(null);
  const [mappingData, setMappingData] = useState<any>(null);

  const fetchIndices = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/elasticsearch/indices`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch indices');
      }

      const data = await response.json();
      setIndices(data.indices || []);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load indices');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndices();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchIndices();
    setRefreshing(false);
  };

  const handleSelectIndex = (indexName: string) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(indexName)) {
      newSelected.delete(indexName);
    } else {
      newSelected.add(indexName);
    }
    setSelectedIndices(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIndices.size === filteredIndices.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(filteredIndices.map(idx => idx.name)));
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const deletePromises = Array.from(selectedIndices).map(indexName =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/elasticsearch/indices/${encodeURIComponent(indexName)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        })
      );

      await Promise.all(deletePromises);
      setShowDeleteDialog(false);
      setSelectedIndices(new Set());
      await fetchIndices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete indices');
    }
  };

  const handleViewMapping = async (indexName: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/elasticsearch/indices/${encodeURIComponent(indexName)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch index mapping');
      }

      const data = await response.json();
      setSelectedIndexForMapping(indexName);
      setMappingData(data);
      setShowMappingDialog(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch index mapping');
    }
  };

  const handleRefreshIndex = async (indexName: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/elasticsearch/indices/${encodeURIComponent(indexName)}/refresh`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to refresh index');
      }

      await fetchIndices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh index');
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

  const filteredIndices = indices.filter(idx =>
    idx.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                <h1 className="text-3xl font-bold text-gray-900">Index Management</h1>
                <p className="text-sm text-gray-600">
                  Manage Elasticsearch indices
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

        {/* Search and Actions Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search indices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {selectedIndices.size > 0 && (
                <>
                  <button
                    onClick={handleDeleteClick}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected ({selectedIndices.size})
                  </button>
                </>
              )}
              <Link
                href="/admin/elasticsearch"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Overview
              </Link>
            </div>
          </div>
        </div>

        {/* Indices List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading indices...</p>
          </div>
        ) : filteredIndices.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No indices found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try a different search term' : 'No indices exist in the cluster'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedIndices.size === filteredIndices.length && filteredIndices.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {selectedIndices.size} of {filteredIndices.length} selected
                </span>
              </div>
            </div>
            <ul className="divide-y divide-gray-200">
              {filteredIndices.map((index) => (
                <li key={index.name} className="px-4 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <input
                        type="checkbox"
                        checked={selectedIndices.has(index.name)}
                        onChange={() => handleSelectIndex(index.name)}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <div className="ml-4 flex-1">
                        <div className="flex items-center gap-2">
                          <Database className="h-5 w-5 text-indigo-600" />
                          <h3 className="text-lg font-semibold text-gray-900">{index.name}</h3>
                        </div>
                        {index.stats && (
                          <div className="mt-2 flex gap-6 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Documents:</span>{' '}
                              {formatNumber(index.stats.primaries.docs.count)}
                            </div>
                            <div>
                              <span className="font-medium">Size:</span>{' '}
                              {formatBytes(index.stats.primaries.store.size_in_bytes)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleViewMapping(index.name)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                        title="View Mapping"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Mapping
                      </button>
                      <button
                        onClick={() => handleRefreshIndex(index.name)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                        title="Refresh Index"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Refresh
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-red-100 rounded-full p-3">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Delete {selectedIndices.size} {selectedIndices.size === 1 ? 'Index' : 'Indices'}?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  This action cannot be undone. All data in the selected indices will be permanently deleted.
                </p>
                <div className="bg-gray-50 rounded-md p-3 mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-1">Selected indices:</p>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    {Array.from(selectedIndices).map(name => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowDeleteDialog(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mapping Dialog */}
      {showMappingDialog && mappingData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Index Mapping: {selectedIndexForMapping}
              </h3>
              <button
                onClick={() => setShowMappingDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FileText className="h-6 w-6" />
              </button>
            </div>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto text-sm">
              {JSON.stringify(mappingData.mapping, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(IndexManagement, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
