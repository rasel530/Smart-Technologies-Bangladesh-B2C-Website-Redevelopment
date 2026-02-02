'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Download, Upload, Search, Edit, Save, X, FileText, Tag, RefreshCcw } from 'lucide-react';
import { withAuth } from '@/components/auth/withAuth';

interface SynonymCategory {
  name: string;
  ruleCount: number;
  totalTerms: number;
}

interface SynonymStats {
  totalRules: number;
  totalCategories: number;
  categories: {
    [key: string]: {
      ruleCount: number;
      totalTerms: number;
    };
  };
}

function SynonymManagement() {
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [categories, setCategories] = useState<SynonymCategory[]>([]);
  const [stats, setStats] = useState<SynonymStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<{ category: string; rule: string } | null>(null);
  const [newRule, setNewRule] = useState({ category: '', rule: '' });
  const [importContent, setImportContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const fetchSynonyms = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('auth_token');
      
      const [synonymsResponse, categoriesResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/elasticsearch/synonyms${selectedCategory ? `?category=${selectedCategory}` : ''}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/elasticsearch/synonyms/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!synonymsResponse.ok) {
        throw new Error('Failed to fetch synonyms');
      }

      if (!categoriesResponse.ok) {
        throw new Error('Failed to fetch categories');
      }

      const synData = await synonymsResponse.json();
      const catData = await categoriesResponse.json();

      setSynonyms(synData.synonyms || []);
      setCategories(catData.categories || []);
      setStats(catData.totalRules ? catData as any : null);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load synonyms');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSynonyms();
  }, [selectedCategory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSynonyms();
    setRefreshing(false);
  };

  const handleAddSynonym = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/elasticsearch/synonyms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category: newRule.category,
          rule: newRule.rule
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add synonym');
      }

      setShowAddDialog(false);
      setNewRule({ category: '', rule: '' });
      await fetchSynonyms();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add synonym');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSynonym = async (rule: string, category: string) => {
    if (!confirm('Are you sure you want to delete this synonym rule?')) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/elasticsearch/synonyms/${encodeURIComponent(rule)}?category=${encodeURIComponent(category)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete synonym');
      }

      await fetchSynonyms();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete synonym');
    }
  };

  const handleExportSynonyms = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/elasticsearch/synonyms/export`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to export synonyms');
      }

      const content = await response.text();
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'synonyms.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export synonyms');
    }
  };

  const handleImportSynonyms = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setImporting(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/elasticsearch/synonyms/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: importContent,
          category: 'custom'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to import synonyms');
      }

      setShowImportDialog(false);
      setImportContent('');
      await fetchSynonyms();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import synonyms');
    } finally {
      setImporting(false);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportContent(content);
    };
    reader.readAsText(file);
  };

  const filteredSynonyms = synonyms.filter(synonym =>
    synonym.toLowerCase().includes(searchTerm.toLowerCase())
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
                <h1 className="text-3xl font-bold text-gray-900">Synonym Management</h1>
                <p className="text-sm text-gray-600">
                  Add, edit, and manage search synonyms
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowImportDialog(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </button>
              <button
                onClick={handleExportSynonyms}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button
                onClick={() => setShowAddDialog(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Synonym
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCcw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
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
              <X className="h-5 w-5 text-red-600 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-100 rounded-full p-3">
                  <FileText className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Rules</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalRules}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-full p-3">
                  <Tag className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Categories</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalCategories}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-medium text-gray-700">Filter by Category:</h3>
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectedCategory === cat.name
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name} ({cat.ruleCount})
              </button>
            ))}
          </div>
        </div>

        {/* Search and Synonyms List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Synonyms {selectedCategory ? `- ${selectedCategory}` : '(All Categories)'} ({filteredSynonyms.length})
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search synonyms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading synonyms...</p>
            </div>
          ) : filteredSynonyms.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No synonyms found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try a different search term' : 'No synonyms exist in this category'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {filteredSynonyms.map((synonym, index) => (
                <li key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 font-medium">
                        {synonym}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Category: {selectedCategory || 'Multiple'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteSynonym(synonym, selectedCategory || 'custom')}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-red-50 hover:text-red-700"
                        title="Delete synonym"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Add Synonym Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Synonym</h3>
              <button
                onClick={() => setShowAddDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAddSynonym}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    required
                    value={newRule.category}
                    onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Synonym Rule
                  </label>
                  <textarea
                    required
                    value={newRule.rule}
                    onChange={(e) => setNewRule({ ...newRule, rule: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                    rows={3}
                    placeholder="e.g., laptop, notebook, portable computer"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Comma-separated list of synonymous terms
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddDialog(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className={`h-4 w-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
                  {saving ? 'Saving...' : 'Add Synonym'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Synonyms Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Import Synonyms</h3>
              <button
                onClick={() => setShowImportDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleImportSynonyms}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Import from File
                  </label>
                  <input
                    type="file"
                    accept=".txt"
                    onChange={handleFileImport}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Or Paste Content
                  </label>
                  <textarea
                    value={importContent}
                    onChange={(e) => setImportContent(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 font-mono"
                    rows={10}
                    placeholder="laptop, notebook, portable computer&#10;mobile phone, smartphone, cell phone"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    One synonym rule per line, comma-separated terms
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowImportDialog(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing || !importContent.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className={`h-4 w-4 mr-2 ${importing ? 'animate-spin' : ''}`} />
                  {importing ? 'Importing...' : 'Import Synonyms'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(SynonymManagement, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
