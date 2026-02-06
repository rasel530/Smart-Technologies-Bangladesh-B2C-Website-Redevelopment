/**
 * Search Personalization Dashboard Page
 *
 * Personalization dashboard showing:
 * - User preference management interface
 * - Personalized search results preview
 * - Recommendation engine status
 * - Personalization effectiveness metrics
 * - User behavior tracking visualization
 */

'use client';

import React, { useState, useEffect } from 'react';
import { StatsGrid } from '@/components/design-system/Layout/StatsGrid';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/design-system/Card/Card';
import {
  getUserPreferences,
  updateUserPreferences,
  getPersonalizedSuggestions,
  getRecommendations,
  getPersonalizationMetrics,
  getPersonalizationEffectiveness,
  updateUserBehavior,
} from '@/lib/api/searchAnalytics';
import type {
  UserPreferences,
  Recommendation,
  PersonalizationMetrics,
  PersonalizationEffectiveness,
} from '@/types/searchAnalytics';

export default function SearchPersonalizationDashboard() {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [personalizedSuggestions, setPersonalizedSuggestions] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [personalizationMetrics, setPersonalizationMetrics] = useState<PersonalizationMetrics | null>(null);
  const [personalizationEffectiveness, setPersonalizationEffectiveness] = useState<PersonalizationEffectiveness | null>(null);
  const [editingPreferences, setEditingPreferences] = useState(false);
  const [editedPreferences, setEditedPreferences] = useState<Partial<UserPreferences>>({});
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  // Fetch data
  const fetchData = async (uid: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const [preferencesData, suggestionsData, recommendationsData, metricsData, effectivenessData] =
        await Promise.all([
          getUserPreferences(uid),
          getPersonalizedSuggestions(uid, 10),
          getRecommendations(uid, 'hybrid', 10),
          getPersonalizationMetrics(uid, timeRange),
          getPersonalizationEffectiveness(timeRange),
        ]);
      
      setUserPreferences(preferencesData);
      setEditedPreferences(preferencesData);
      setPersonalizedSuggestions(suggestionsData);
      setRecommendations(recommendationsData);
      setPersonalizationMetrics(metricsData);
      setPersonalizationEffectiveness(effectivenessData);
    } catch (err: any) {
      console.error('Error fetching personalization data:', err);
      setError(err?.message || 'Failed to load personalization data');
    } finally {
      setLoading(false);
    }
  };

  // Handle user ID change
  const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserId(e.target.value);
  };

  // Handle search user
  const handleSearchUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (userId.trim()) {
      fetchData(userId.trim());
    }
  };

  // Save preferences
  const handleSavePreferences = async () => {
    if (!userId) return;
    
    try {
      await updateUserPreferences(userId, editedPreferences);
      setUserPreferences({ ...userPreferences!, ...editedPreferences });
      setEditingPreferences(false);
    } catch (err: any) {
      console.error('Error saving preferences:', err);
      setError(err?.message || 'Failed to save preferences');
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

  // Get recommendation type color
  const getRecommendationTypeColor = (type: string): string => {
    switch (type) {
      case 'collaborative':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'content_based':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'hybrid':
        return 'bg-green-100 text-green-800 border-green-200';
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
              <h1 className="text-3xl font-bold text-gray-900">Search Personalization</h1>
              <p className="text-gray-600 mt-1">
                Manage user preferences and personalization settings
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
                onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* User Search */}
        <Card className="mb-6">
          <CardBody>
            <form onSubmit={handleSearchUser} className="flex items-center gap-4">
              <div className="flex-1">
                <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
                  User ID
                </label>
                <input
                  type="text"
                  id="userId"
                  value={userId}
                  onChange={handleUserIdChange}
                  placeholder="Enter user ID to view personalization data"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="pt-6">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Search User
                </button>
              </div>
            </form>
          </CardBody>
        </Card>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {loading && userId ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : userPreferences ? (
          <div className="space-y-6">
            {/* Personalization Effectiveness */}
            {personalizationEffectiveness && (
              <StatsGrid
                stats={[
                  {
                    title: 'Overall Score',
                    value: personalizationEffectiveness.overallScore.toFixed(2),
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                    color: 'primary',
                  },
                  {
                    title: 'CTR Improvement',
                    value: `${personalizationEffectiveness.clickThroughImprovement.toFixed(1)}%`,
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                    ),
                    color: 'success',
                  },
                  {
                    title: 'Conversion Improvement',
                    value: `${personalizationEffectiveness.conversionImprovement.toFixed(1)}%`,
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    ),
                    color: 'success',
                  },
                  {
                    title: 'User Satisfaction',
                    value: `${personalizationEffectiveness.userSatisfaction.toFixed(1)}%`,
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                    color: 'primary',
                  },
                  {
                    title: 'Engagement Increase',
                    value: `${personalizationEffectiveness.engagementIncrease.toFixed(1)}%`,
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    ),
                    color: 'success',
                  },
                ]}
                columns={3}
              />
            )}

            {/* User Preferences */}
            <Card>
              <CardHeader
                title="User Preferences"
                description="Manage user's personalization preferences"
                action={
                  editingPreferences ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingPreferences(false);
                          setEditedPreferences(userPreferences);
                        }}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSavePreferences}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingPreferences(true)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Edit
                    </button>
                  )
                }
              />
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Preferred Categories */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Preferred Categories</h3>
                    {editedPreferences.preferredCategories && editedPreferences.preferredCategories.length > 0 ? (
                      <div className="space-y-2">
                        {editedPreferences.preferredCategories.map((cat, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900">{cat.categoryName}</div>
                              <div className="text-xs text-gray-500">Score: {cat.score.toFixed(2)}</div>
                            </div>
                            {editingPreferences && (
                              <button
                                onClick={() => {
                                  const newCategories = [...(editedPreferences.preferredCategories || [])];
                                  newCategories.splice(index, 1);
                                  setEditedPreferences({ ...editedPreferences, preferredCategories: newCategories });
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No preferred categories</p>
                    )}
                  </div>

                  {/* Preferred Brands */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Preferred Brands</h3>
                    {editedPreferences.preferredBrands && editedPreferences.preferredBrands.length > 0 ? (
                      <div className="space-y-2">
                        {editedPreferences.preferredBrands.map((brand, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900">{brand.brandName}</div>
                              <div className="text-xs text-gray-500">Score: {brand.score.toFixed(2)}</div>
                            </div>
                            {editingPreferences && (
                              <button
                                onClick={() => {
                                  const newBrands = [...(editedPreferences.preferredBrands || [])];
                                  newBrands.splice(index, 1);
                                  setEditedPreferences({ ...editedPreferences, preferredBrands: newBrands });
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No preferred brands</p>
                    )}
                  </div>

                  {/* Price Range */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Price Range</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label htmlFor="priceMin" className="block text-sm font-medium text-gray-700 mb-1">
                          Min Price
                        </label>
                        <input
                          type="number"
                          id="priceMin"
                          value={editedPreferences.priceRangeMin || ''}
                          onChange={(e) =>
                            setEditedPreferences({
                              ...editedPreferences,
                              priceRangeMin: e.target.value ? parseInt(e.target.value) : undefined,
                            })
                          }
                          disabled={!editingPreferences}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor="priceMax" className="block text-sm font-medium text-gray-700 mb-1">
                          Max Price
                        </label>
                        <input
                          type="number"
                          id="priceMax"
                          value={editedPreferences.priceRangeMax || ''}
                          onChange={(e) =>
                            setEditedPreferences({
                              ...editedPreferences,
                              priceRangeMax: e.target.value ? parseInt(e.target.value) : undefined,
                            })
                          }
                          disabled={!editingPreferences}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Behavior Profile */}
                  {userPreferences.behaviorProfile && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Behavior Profile</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Avg Session Duration</span>
                          <span className="font-semibold text-gray-900">
                            {userPreferences.behaviorProfile.avgSessionDuration.toFixed(0)}s
                          </span>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Avg Queries per Session</span>
                          <span className="font-semibold text-gray-900">
                            {userPreferences.behaviorProfile.avgQueriesPerSession.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Preferred Device</span>
                          <span className="font-semibold text-gray-900">
                            {userPreferences.behaviorProfile.preferredDeviceType}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Personalization Metrics */}
            {personalizationMetrics && (
              <Card>
                <CardHeader
                  title="Personalization Metrics"
                  description="Comparison of personalized vs non-personalized results"
                />
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Personalized Results</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Click Rate</span>
                          <span className="font-semibold text-gray-900">
                            {formatPercentage(personalizationMetrics.personalizedClickRate)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Conversion Rate</span>
                          <span className="font-semibold text-gray-900">
                            {formatPercentage(personalizationMetrics.personalizedConversionRate)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-100 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Non-Personalized Results</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Click Rate</span>
                          <span className="font-semibold text-gray-900">
                            {formatPercentage(personalizationMetrics.nonPersonalizedClickRate)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Conversion Rate</span>
                          <span className="font-semibold text-gray-900">
                            {formatPercentage(personalizationMetrics.nonPersonalizedConversionRate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Improvement</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Click Rate Improvement</span>
                        <span className="font-semibold text-green-700">
                          +{personalizationMetrics.improvement.clickRate.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Conversion Rate Improvement</span>
                        <span className="font-semibold text-green-700">
                          +{personalizationMetrics.improvement.conversionRate.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Personalized Suggestions */}
            <Card>
              <CardHeader
                title="Personalized Suggestions"
                description="Search suggestions based on user behavior"
              />
              <CardBody>
                {personalizedSuggestions.length > 0 ? (
                  <div className="space-y-2">
                    {personalizedSuggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                        <div className="flex items-center gap-3">
                          {suggestion.imageUrl && (
                            <img
                              src={suggestion.imageUrl}
                              alt={suggestion.text}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{suggestion.text}</div>
                            {suggestion.category && (
                              <div className="text-xs text-gray-500">{suggestion.category}</div>
                            )}
                          </div>
                        </div>
                        {suggestion.score && (
                          <div className="text-sm text-gray-500">
                            Score: {suggestion.score.toFixed(2)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No personalized suggestions available</p>
                )}
              </CardBody>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader
                title="Product Recommendations"
                description="Personalized product recommendations"
              />
              <CardBody>
                {recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {recommendations.map((rec, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          {rec.imageUrl && (
                            <img
                              src={rec.imageUrl}
                              alt={rec.productName}
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div>
                            <div className="font-semibold text-gray-900">{rec.productName}</div>
                            <div className="text-sm text-gray-600">{rec.reason}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${getRecommendationTypeColor(rec.recommendationType)}`}
                            >
                              {rec.recommendationType.replace('_', ' ')}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {rec.score.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No recommendations available</p>
                )}
              </CardBody>
            </Card>

            {/* Search History */}
            {userPreferences.searchHistory && userPreferences.searchHistory.length > 0 && (
              <Card>
                <CardHeader
                  title="Search History"
                  description="Recent search queries"
                />
                <CardBody>
                  <div className="space-y-2">
                    {userPreferences.searchHistory.slice(0, 10).map((history, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium text-gray-900">{history.query}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(history.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Enter a User ID</h3>
            <p className="mt-2 text-sm text-gray-500">
              Search for a user to view their personalization data
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
