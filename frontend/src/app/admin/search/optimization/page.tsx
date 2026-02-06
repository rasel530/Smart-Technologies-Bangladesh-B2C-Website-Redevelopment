'use client';

/**
 * Search Optimization Admin Page
 *
 * Admin-only page that displays search optimization including:
 * - Query patterns analysis visualization
 * - Relevance scoring metrics
 * - A/B testing experiment management
 * - Create new experiment dialog
 * - Experiment list with status
 * - Experiment results comparison
 * - Statistical significance analysis
 * - Experiment actions (start, stop, pause, delete)
 * - Optimization insights with priority levels
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  Activity,
  TrendingUp,
  AlertTriangle,
  Plus,
  Play,
  Pause,
  Trash2,
  BarChart3,
  Settings,
  Zap,
  Target,
  Calendar
} from 'lucide-react';
import { withAuth } from '@/components/auth/withAuth';
import {
  getAdminQueryPatterns,
  getAdminExperiments,
  getAdminExperimentDetails,
  createAdminExperiment,
  updateAdminExperimentStatus,
  deleteAdminExperiment,
  getAdminOptimizationInsights
} from '@/lib/api/adminSearchAnalytics';
import type {
  QueryPatterns,
  Experiment,
  ExperimentData,
  OptimizationInsight
} from '@/types/searchAnalytics';

function SearchOptimizationAdminPage(): JSX.Element {
  const [patterns, setPatterns] = useState<QueryPatterns | null>(null);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [insights, setInsights] = useState<OptimizationInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'patterns' | 'experiments' | 'insights'>('patterns');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [experimentForm, setExperimentForm] = useState({
    name: '',
    description: '',
    algorithmVariant: 'bm25',
    startDate: new Date(),
    sampleSize: 100,
    controlGroupPercentage: 50
  });

  const fetchPatterns = async () => {
    try {
      setError(null);
      const data = await getAdminQueryPatterns(timeRange);
      setPatterns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load query patterns');
    }
  };

  const fetchExperiments = async () => {
    try {
      const data = await getAdminExperiments({});
      setExperiments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load experiments');
    }
  };

  const fetchInsights = async () => {
    try {
      const data = await getAdminOptimizationInsights();
      setInsights(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchPatterns(),
      fetchExperiments(),
      fetchInsights()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, [timeRange]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const handleCreateExperiment = async () => {
    try {
      const data = await createAdminExperiment(experimentForm);
      setExperiments([...experiments, data]);
      setShowCreateDialog(false);
      setExperimentForm({
        name: '',
        description: '',
        algorithmVariant: 'bm25',
        startDate: new Date(),
        sampleSize: 100,
        controlGroupPercentage: 50
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create experiment');
    }
  };

  const handleExperimentAction = async (experimentId: string, action: 'start' | 'pause' | 'stop' | 'delete') => {
    try {
      await updateAdminExperimentStatus(experimentId, action);
      setExperiments(experiments.map(exp => 
        exp.id === experimentId ? { ...exp, isActive: action === 'start' } : exp
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update experiment');
    }
  };

  const handleDeleteExperiment = async (experimentId: string) => {
    try {
      await deleteAdminExperiment(experimentId);
      setExperiments(experiments.filter(exp => exp.id !== experimentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete experiment');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-BD').format(num);
  };

  const formatTimestamp = (timestamp: string | Date) => {
    return new Date(timestamp).toLocaleString();
  };

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
                <h1 className="text-3xl font-bold text-gray-900">Search Optimization</h1>
                <p className="text-sm text-gray-600">
                  Query patterns, A/B testing, and optimization insights
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateDialog(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Experiment
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
            <p className="mt-4 text-gray-600">Loading optimization data...</p>
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
                  {[
                    { id: 'patterns', label: 'Query Patterns', icon: <Activity className="h-4 w-4 mr-2" /> },
                    { id: 'experiments', label: 'A/B Testing', icon: <BarChart3 className="h-4 w-4 mr-2" /> },
                    { id: 'insights', label: 'Insights', icon: <Zap className="h-4 w-4 mr-2" /> }
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

              {/* Query Patterns Tab */}
              {activeTab === 'patterns' && patterns && (
                <div className="p-6 space-y-6">
                  {/* Query Length Distribution */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Query Length Distribution
                    </h3>
                    <div className="space-y-3">
                      {patterns.queryLengthDistribution.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <span className="text-sm text-gray-700 font-medium w-48">{item.lengthRange}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-4">
                            <div className="bg-blue-600 h-4 rounded-full" style={{ width: `${item.percentage}%` }} />
                          </div>
                          <span className="text-sm text-gray-600 w-24 text-right">{item.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Filter Usage */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Filter Usage
                    </h3>
                    <div className="space-y-3">
                      {patterns.filterUsage.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <span className="text-sm text-gray-700 font-medium w-48">{item.filterName}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-4">
                            <div className="bg-purple-600 h-4 rounded-full" style={{ width: `${item.percentage}%` }} />
                          </div>
                          <span className="text-sm text-gray-600 w-24 text-right">{item.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sort By Usage */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Sort By Usage
                    </h3>
                    <div className="space-y-3">
                      {patterns.sortByUsage.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <span className="text-sm text-gray-700 font-medium w-48">{item.sortBy}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-4">
                            <div className="bg-indigo-600 h-4 rounded-full" style={{ width: `${item.percentage}%` }} />
                          </div>
                          <span className="text-sm text-gray-600 w-24 text-right">{item.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Zero Result Queries */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Zero-Result Queries (Top 10)
                    </h3>
                    <ul className="divide-y divide-gray-200">
                      {patterns.zeroResultQueries.slice(0, 10).map((query, index) => (
                        <li key={index} className="px-4 py-3 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">{query.query}</p>
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                {query.count} searches
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">
                              Last: {formatTimestamp(query.lastSearched)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Experiments Tab */}
              {activeTab === 'experiments' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      A/B Testing Experiments
                    </h3>
                    <span className="text-sm text-gray-600">
                      {experiments.length} experiments
                    </span>
                  </div>
                  {experiments.length === 0 ? (
                    <div className="text-center py-12">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No experiments yet</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Start by creating an experiment to optimize search
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {experiments.map((exp) => (
                        <li key={exp.id} className="px-4 py-4 hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(exp.isActive ? 'active' : 'paused')}`}>
                                  {exp.isActive ? 'Running' : 'Paused'}
                                </span>
                                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 border-blue-200 ml-2">
                                  {formatNumber(exp.sampleSize)} users
                                </span>
                              </div>
                              <h4 className="text-sm font-medium text-gray-900">{exp.name}</h4>
                              <p className="text-xs text-gray-500">
                                {exp.algorithmVariant}
                              </p>
                              <div className="text-xs text-gray-500 mt-1">
                                {formatTimestamp(exp.startDate)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => exp.isActive ? handleExperimentAction(exp.id, 'pause') : handleExperimentAction(exp.id, 'start')}
                                className="text-xs px-3 py-1 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                              >
                                {exp.isActive ? <Pause className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
                                {exp.isActive ? 'Pause' : 'Start'}
                              </button>
                              <button
                                onClick={() => handleDeleteExperiment(exp.id)}
                                className="text-xs px-3 py-1 border border-red-300 rounded-md text-red-700 bg-red-50 hover:bg-red-100"
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
              )}

              {/* Insights Tab */}
              {activeTab === 'insights' && (
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Optimization Insights
                  </h3>
                  {insights.length === 0 ? (
                    <div className="text-center py-12">
                      <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No optimization insights yet</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Insights will appear as data is collected
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {insights.map((insight, index) => (
                        <div key={index} className={`bg-white border rounded-lg p-4 ${getPriorityColor(insight.priority)}`}>
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(insight.priority)}`}>
                                  {insight.priority.toUpperCase()}
                                </span>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900">
                                    {insight.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {insight.description}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2">
                                    <span className="text-xs bg-gray-500">
                                      Impact: {insight.impact}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      Effort: {insight.effort}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs px-2 py-1 rounded bg-gray-200">
                                {insight.status}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setInsights(insights.map((i, idx) => 
                                  idx === insights.indexOf(insight) ? { ...i, status: 'dismissed' } : i
                                ))}
                                className="text-xs px-3 py-1 border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
               )}
             </div>
          </>
        )}
      </div>

      {/* Create Experiment Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Create New A/B Testing Experiment
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experiment Name
                  </label>
                  <input
                    type="text"
                    value={experimentForm.name}
                    onChange={(e) => setExperimentForm({ ...experimentForm, name: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={experimentForm.description}
                    onChange={(e) => setExperimentForm({ ...experimentForm, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Algorithm Variant
                  </label>
                  <select
                    value={experimentForm.algorithmVariant}
                    onChange={(e) => setExperimentForm({ ...experimentForm, algorithmVariant: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                  >
                    <option value="bm25">BM25</option>
                    <option value="tfidf">TF-IDF</option>
                    <option value="cosine">Cosine Similarity</option>
                    <option value="learning-to-rank">Learning to Rank</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={experimentForm.startDate.toISOString().split('T')[0]}
                    onChange={(e) => setExperimentForm({ ...experimentForm, startDate: new Date(e.target.value) })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sample Size
                  </label>
                  <input
                    type="number"
                    value={experimentForm.sampleSize}
                    onChange={(e) => setExperimentForm({ ...experimentForm, sampleSize: parseInt(e.target.value) })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Control Group Percentage
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={experimentForm.controlGroupPercentage}
                    onChange={(e) => setExperimentForm({ ...experimentForm, controlGroupPercentage: parseInt(e.target.value) })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCreateDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateExperiment}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Create Experiment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(SearchOptimizationAdminPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
