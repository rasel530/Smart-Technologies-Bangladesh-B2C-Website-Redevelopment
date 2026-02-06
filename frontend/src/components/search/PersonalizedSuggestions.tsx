/**
 * Personalized Suggestions Component
 *
 * Reusable component showing:
 * - Personalized search suggestions
 * - Recent searches with personalization
 * - "People also searched" feature
 * - Contextual suggestions based on user behavior
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getPersonalizedSuggestions,
  getRecommendations,
  getSearchHistory,
} from '@/lib/api/searchAnalytics';
import type { Suggestion, Recommendation, SearchHistory } from '@/types/searchAnalytics';

export interface PersonalizedSuggestionsProps {
  userId?: string;
  query?: string;
  limit?: number;
  showRecentSearches?: boolean;
  showPeopleAlsoSearched?: boolean;
  showRecommendations?: boolean;
  onSuggestionClick?: (suggestion: Suggestion) => void;
  className?: string;
}

export default function PersonalizedSuggestions({
  userId,
  query,
  limit = 10,
  showRecentSearches = true,
  showPeopleAlsoSearched = true,
  showRecommendations = true,
  onSuggestionClick,
  className = '',
}: PersonalizedSuggestionsProps) {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [personalizedSuggestions, setPersonalizedSuggestions] = useState<Suggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchHistory[]>([]);
  const [peopleAlsoSearched, setPeopleAlsoSearched] = useState<Suggestion[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  // Fetch personalized suggestions
  const fetchPersonalizedSuggestions = async () => {
    if (!userId) return;
    
    try {
      const suggestions = await getPersonalizedSuggestions(userId, limit);
      setPersonalizedSuggestions(suggestions);
    } catch (err: any) {
      console.error('Error fetching personalized suggestions:', err);
    }
  };

  // Fetch recent searches
  const fetchRecentSearches = async () => {
    if (!userId) return;
    
    try {
      const history = await getSearchHistory(userId, limit);
      setRecentSearches(history);
    } catch (err: any) {
      console.error('Error fetching recent searches:', err);
    }
  };

  // Fetch recommendations
  const fetchRecommendations = async () => {
    if (!userId) return;
    
    try {
      const recs = await getRecommendations(userId, 'hybrid', limit);
      setRecommendations(recs);
    } catch (err: any) {
      console.error('Error fetching recommendations:', err);
    }
  };

  // Fetch "people also searched" (simulated for now)
  const fetchPeopleAlsoSearched = async () => {
    if (!query) return;
    
    try {
      // This would typically come from an API endpoint
      // For now, we'll simulate it with the personalized suggestions
      const suggestions = await getPersonalizedSuggestions(userId || '', limit);
      setPeopleAlsoSearched(suggestions.slice(0, 5));
    } catch (err: any) {
      console.error('Error fetching people also searched:', err);
    }
  };

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const promises: Promise<void>[] = [];
    
    if (userId) {
      promises.push(fetchPersonalizedSuggestions());
      if (showRecentSearches) {
        promises.push(fetchRecentSearches());
      }
      if (showRecommendations) {
        promises.push(fetchRecommendations());
      }
    }
    
    if (query && showPeopleAlsoSearched) {
      promises.push(fetchPeopleAlsoSearched());
    }
    
    Promise.all(promises)
      .then(() => setLoading(false))
      .catch((err) => {
        console.error('Error fetching suggestions:', err);
        setError('Failed to load suggestions');
        setLoading(false);
      });
  }, [userId, query, limit, showRecentSearches, showPeopleAlsoSearched, showRecommendations]);

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    }
  };

  // Get suggestion icon based on type
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'product':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      case 'category':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
    }
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
    <div className={`space-y-6 ${className}`}>
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Personalized Suggestions */}
          {userId && personalizedSuggestions.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personalized Suggestions</h3>
              <div className="space-y-2">
                {personalizedSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  >
                    {suggestion.imageUrl && (
                      <img
                        src={suggestion.imageUrl}
                        alt={suggestion.text}
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getSuggestionIcon(suggestion.type)}
                        <span className="font-medium text-gray-900">{suggestion.text}</span>
                      </div>
                      {suggestion.category && (
                        <span className="text-xs text-gray-500">{suggestion.category}</span>
                      )}
                    </div>
                    {suggestion.score && (
                      <span className="text-xs text-gray-500">
                        Score: {suggestion.score.toFixed(2)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Searches */}
          {showRecentSearches && recentSearches.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Searches</h3>
              <div className="space-y-2">
                {recentSearches.map((search, index) => (
                  <Link
                    key={index}
                    href={`/search?q=${encodeURIComponent(search.query)}`}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium text-gray-900">{search.query}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(search.timestamp).toLocaleDateString()}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* People Also Searched */}
          {showPeopleAlsoSearched && query && peopleAlsoSearched.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">People Also Searched</h3>
              <div className="space-y-2">
                {peopleAlsoSearched.map((suggestion, index) => (
                  <Link
                    key={index}
                    href={`/search?q=${encodeURIComponent(suggestion.text)}`}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    {suggestion.imageUrl && (
                      <img
                        src={suggestion.imageUrl}
                        alt={suggestion.text}
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="font-medium text-gray-900">{suggestion.text}</span>
                      </div>
                      {suggestion.category && (
                        <span className="text-xs text-gray-500">{suggestion.category}</span>
                      )}
                    </div>
                    {suggestion.price && (
                      <span className="text-sm font-semibold text-gray-900">
                        ${suggestion.price.toFixed(2)}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Product Recommendations */}
          {showRecommendations && recommendations.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended for You</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {recommendations.map((rec) => (
                  <Link
                    key={rec.id}
                    href={`/products/${rec.productId}`}
                    className="group"
                  >
                    <div className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      {rec.imageUrl && (
                        <div className="aspect-square relative overflow-hidden">
                          <img
                            src={rec.imageUrl}
                            alt={rec.productName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute top-2 left-2">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${getRecommendationTypeColor(rec.recommendationType)}`}
                            >
                              {rec.recommendationType.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="p-3">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                          {rec.productName}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {rec.reason}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-900">
                            Score: {rec.score.toFixed(2)}
                          </span>
                          {rec.category && (
                            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                              {rec.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading &&
            personalizedSuggestions.length === 0 &&
            (!showRecentSearches || recentSearches.length === 0) &&
            (!showPeopleAlsoSearched || peopleAlsoSearched.length === 0) &&
            (!showRecommendations || recommendations.length === 0) && (
              <div className="text-center py-8">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                <p className="mt-4 text-sm text-gray-500">
                  {userId
                    ? 'No personalized suggestions available yet. Start searching to get personalized recommendations!'
                    : 'Sign in to get personalized suggestions and recommendations'}
                </p>
              </div>
            )}
        </>
      )}
    </div>
  );
}
