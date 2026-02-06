/**
 * Search Optimization Dashboard Page
 *
 * Optimization dashboard showing:
 * - Query patterns analysis visualization
 * - A/B testing experiment management
 * - Experiment results comparison
 * - Query optimization insights
 * - Relevance scoring metrics
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { StatsGrid } from '@/components/design-system/Layout/StatsGrid';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/design-system/Card/Card';
import {
  analyzeQueryPatterns,
  getExperiments,
  getExperimentResults,
  getOptimizationInsights,
  getRelevanceMetrics,
  createExperiment,
  updateExperimentStatus,
  deleteExperiment,
} from '@/lib/api/searchAnalytics';
import type {
  QueryPatterns,
  Experiment,
  ExperimentData,
  ExperimentResults,
  OptimizationInsight,
  RelevanceMetrics,
} from '@/types/searchAnalytics';

export default function SearchOptimizationDashboard() {
  // Authentication state
  const { data: session, status } = useSession();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [queryPatterns, setQueryPatterns] = useState<QueryPatterns | null>(null);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [experimentResults, setExperimentResults] = useState<ExperimentResults | null>(null);
  const [optimizationInsights, setOptimizationInsights] = useState<OptimizationInsight[]>([]);
  const [relevanceMetrics, setRelevanceMetrics] = useState<RelevanceMetrics | null>(null);
  const [showCreateExperiment, setShowCreateExperiment] = useState(false);
  const [newExperiment, setNewExperiment] = useState<ExperimentData>({
    name: '',
    description: '',
    algorithmVariant: 'default',
    startDate: new Date(),
    sampleSize: 1000,
    controlGroupPercentage: 50,
  });

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [patternsData, experimentsData, insightsData, relevanceData] = await Promise.all([
        analyzeQueryPatterns(timeRange),
        getExperiments(undefined, 20),
        getOptimizationInsights(timeRange),
        getRelevanceMetrics(timeRange),
      ]);
      
      setQueryPatterns(patternsData);
      setExperiments(experimentsData);
      setOptimizationInsights(insightsData);
      setRelevanceMetrics(relevanceData);
    } catch (err: any) {
      console.error('Error fetching search optimization:', err);
      setError(err?.message || 'Failed to load optimization data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (status === 'authenticated') {
      fetchData();
    }
  }, [timeRange, status]);

  // Fetch experiment results
  const fetchExperimentResults = async (experimentId: string) => {
    try {
      const results = await getExperimentResults(experimentId);
      setExperimentResults(results);
    } catch (err: any) {
      console.error('Error fetching experiment results:', err);
      setError(err?.message || 'Failed to load experiment results');
    }
  };

  // Create experiment
  const handleCreateExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const created = await createExperiment(newExperiment);
      setExperiments([...experiments, created]);
      setShowCreateExperiment(false);
      setNewExperiment({
        name: '',
        description: '',
        algorithmVariant: 'default',
        startDate: new Date(),
        sampleSize: 1000,
        controlGroupPercentage: 50,
      });
    } catch (err: any) {
      console.error('Error creating experiment:', err);
      setError(err?.message || 'Failed to create experiment');
    }
  };

  // Update experiment status
  const handleToggleExperiment = async (experiment: Experiment) => {
    try {
      const updated = await updateExperimentStatus(experiment.id, !experiment.isActive);
      setExperiments(experiments.map(exp => (exp.id === experiment.id ? updated : exp)));
    } catch (err: any) {
      console.error('Error updating experiment:', err);
      setError(err?.message || 'Failed to update experiment');
    }
  };

  // Delete experiment
  const handleDeleteExperiment = async (experimentId: string) => {
    if (!confirm('Are you sure you want to delete this experiment?')) return;
    
    try {
      await deleteExperiment(experimentId);
      setExperiments(experiments.filter(exp => exp.id !== experimentId));
      if (selectedExperiment?.id === experimentId) {
        setSelectedExperiment(null);
        setExperimentResults(null);
      }
    } catch (err: any) {
      console.error('Error deleting experiment:', err);
      setError(err?.message || 'Failed to delete experiment');
    }
  };

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

  // Get priority color
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
              <h1 className="text-3xl font-bold text-gray-900">Search Optimization</h1>
              <p className="text-gray-600 mt-1">
                Analyze query patterns and manage A/B testing experiments
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
                <p className="text-red-700">You must be logged in to view search optimization data.</p>
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
              <p className="text-gray-600">Loading optimization data...</p>
            </div>
          </div>
        ) : status === 'authenticated' && (
          <div className="space-y-6">
            {/* Relevance Metrics */}
            {relevanceMetrics && (
              <StatsGrid
                stats={[
                  {
                    title: 'Avg Relevance Score',
                    value: relevanceMetrics.averageRelevanceScore.toFixed(2),
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                    color: 'primary',
                  },
                  {
                    title: 'Click-Through Rate',
                    value: formatPercentage(relevanceMetrics.clickThroughRate),
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                    ),
                    color: 'success',
                  },
                  {
                    title: 'Avg Dwell Time',
                    value: `${relevanceMetrics.dwellTime.toFixed(0)}s`,
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                    color: 'warning',
                  },
                  {
                    title: 'Conversion Rate',
                    value: formatPercentage(relevanceMetrics.conversionRate),
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    ),
                    color: 'success',
                  },
                  {
                    title: 'Top Result Click Rate',
                    value: formatPercentage(relevanceMetrics.topResultClickRate),
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    ),
                    color: 'primary',
                  },
                ]}
                columns={3}
              />
            )}

            {/* Query Patterns */}
            {queryPatterns && (
              <Card>
                <CardHeader
                  title="Query Patterns Analysis"
                  description="Common search patterns and user behavior"
                />
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Common Patterns */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Common Patterns</h3>
                      {queryPatterns.commonPatterns.length > 0 ? (
                        <div className="space-y-2">
                          {queryPatterns.commonPatterns.slice(0, 5).map((pattern, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <div className="font-medium text-gray-900">{pattern.pattern}</div>
                                <div className="text-xs text-gray-500">{pattern.category || 'General'}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-gray-900">{formatNumber(pattern.count)}</div>
                                <div className="text-xs text-gray-500">{pattern.percentage.toFixed(1)}%</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No pattern data available</p>
                      )}
                    </div>

                    {/* Filter Usage */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Filter Usage</h3>
                      {queryPatterns.filterUsage.length > 0 ? (
                        <div className="space-y-2">
                          {queryPatterns.filterUsage.slice(0, 5).map((filter, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="font-medium text-gray-900">{filter.filterName}</div>
                              <div className="text-right">
                                <div className="font-semibold text-gray-900">{formatNumber(filter.count)}</div>
                                <div className="text-xs text-gray-500">{filter.percentage.toFixed(1)}%</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No filter usage data available</p>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Optimization Insights */}
            <Card>
              <CardHeader
                title="Optimization Insights"
                description="Recommendations for improving search performance"
              />
              <CardBody>
                {optimizationInsights.length > 0 ? (
                  <div className="space-y-3">
                    {optimizationInsights.map((insight, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${getPriorityColor(insight.priority)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm">{insight.title}</h4>
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(insight.status)}`}>
                                {insight.status.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-sm mt-1 opacity-75">{insight.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs">
                              <span className="opacity-75">Impact: {insight.impact}</span>
                              <span className="opacity-75">Effort: {insight.effort}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No optimization insights available</p>
                )}
              </CardBody>
            </Card>

            {/* A/B Testing Experiments */}
            <Card>
              <CardHeader
                title="A/B Testing Experiments"
                description="Manage and analyze search algorithm experiments"
                action={
                  <button
                    onClick={() => setShowCreateExperiment(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Create Experiment
                  </button>
                }
              />
              <CardBody>
                {showCreateExperiment && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Experiment</h3>
                    <form onSubmit={handleCreateExperiment} className="space-y-4">
                      <div>
                        <label htmlFor="experimentName" className="block text-sm font-medium text-gray-700 mb-1">
                          Experiment Name
                        </label>
                        <input
                          type="text"
                          id="experimentName"
                          value={newExperiment.name}
                          onChange={(e) => setNewExperiment({ ...newExperiment, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="experimentDescription" className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          id="experimentDescription"
                          value={newExperiment.description}
                          onChange={(e) => setNewExperiment({ ...newExperiment, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={3}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="algorithmVariant" className="block text-sm font-medium text-gray-700 mb-1">
                            Algorithm Variant
                          </label>
                          <select
                            id="algorithmVariant"
                            value={newExperiment.algorithmVariant}
                            onChange={(e) => setNewExperiment({ ...newExperiment, algorithmVariant: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="default">Default</option>
                            <option value="ml_based">ML-Based</option>
                            <option value="semantic">Semantic Search</option>
                            <option value="hybrid">Hybrid</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="sampleSize" className="block text-sm font-medium text-gray-700 mb-1">
                            Sample Size
                          </label>
                          <input
                            type="number"
                            id="sampleSize"
                            value={newExperiment.sampleSize}
                            onChange={(e) => setNewExperiment({ ...newExperiment, sampleSize: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="100"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Create Experiment
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCreateExperiment(false)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {experiments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Name</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Variant</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Sample Size</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">CTR</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Conversion</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {experiments.map((experiment) => (
                          <tr key={experiment.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium text-gray-900">{experiment.name}</div>
                                <div className="text-xs text-gray-500">{experiment.description}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-600">{experiment.algorithmVariant}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  experiment.isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {experiment.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-600">{formatNumber(experiment.sampleSize)}</td>
                            <td className="py-3 px-4 text-gray-600">
                              {formatPercentage(experiment.metrics.clickThroughRate)}
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {formatPercentage(experiment.metrics.conversionRate)}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedExperiment(experiment);
                                    fetchExperimentResults(experiment.id);
                                  }}
                                  className="text-blue-600 hover:text-blue-700 text-sm"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleToggleExperiment(experiment)}
                                  className="text-blue-600 hover:text-blue-700 text-sm"
                                >
                                  {experiment.isActive ? 'Stop' : 'Start'}
                                </button>
                                <button
                                  onClick={() => handleDeleteExperiment(experiment.id)}
                                  className="text-red-600 hover:text-red-700 text-sm"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No experiments found</p>
                )}
              </CardBody>
            </Card>

            {/* Experiment Results */}
            {selectedExperiment && experimentResults && (
              <Card>
                <CardHeader
                  title={`Experiment Results: ${selectedExperiment.name}`}
                  description="Comparison between control and variant groups"
                />
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Control Group */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Control Group</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Click-Through Rate</span>
                          <span className="font-semibold text-gray-900">
                            {formatPercentage(experimentResults.controlMetrics.clickThroughRate)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Conversion Rate</span>
                          <span className="font-semibold text-gray-900">
                            {formatPercentage(experimentResults.controlMetrics.conversionRate)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Avg Response Time</span>
                          <span className="font-semibold text-gray-900">
                            {experimentResults.controlMetrics.avgResponseTime.toFixed(0)}ms
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Variant Group */}
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Variant Group</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Click-Through Rate</span>
                          <span className="font-semibold text-gray-900">
                            {formatPercentage(experimentResults.variantMetrics.clickThroughRate)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Conversion Rate</span>
                          <span className="font-semibold text-gray-900">
                            {formatPercentage(experimentResults.variantMetrics.conversionRate)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Avg Response Time</span>
                          <span className="font-semibold text-gray-900">
                            {experimentResults.variantMetrics.avgResponseTime.toFixed(0)}ms
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statistical Significance */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Statistical Analysis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Statistical Significance:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          {experimentResults.statisticalSignificance.toFixed(2)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Winner:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          {experimentResults.winner === 'control' && 'Control Group'}
                          {experimentResults.winner === 'variant' && 'Variant Group'}
                          {experimentResults.winner === 'inconclusive' && 'Inconclusive'}
                        </span>
                      </div>
                    </div>

                    {/* Recommendations */}
                    {experimentResults.recommendations.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Recommendations</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {experimentResults.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm text-gray-600">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
