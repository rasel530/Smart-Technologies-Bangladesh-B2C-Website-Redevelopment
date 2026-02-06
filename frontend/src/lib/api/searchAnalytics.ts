/**
 * Search Analytics API Library
 * 
 * Provides functions for interacting with the search analytics, performance,
 * optimization, personalization, and trending API endpoints.
 */

import { apiClient as client } from './client';
import type {
  SearchAnalyticsData,
  ClickTrackingData,
  ConversionData,
  SearchHistory,
  PopularSearch,
  AnalyticsMetrics,
  SearchTrendData,
  PerformanceMetrics,
  PerformanceAlert,
  RealTimeStats,
  ResponseTimeDistribution,
  PerformanceComparison,
  QueryPatterns,
  Experiment,
  ExperimentData,
  ExperimentResults,
  OptimizationInsight,
  RelevanceMetrics,
  UserPreferences,
  Recommendation,
  PersonalizationMetrics,
  PersonalizationEffectiveness,
  TrendingSearch,
  TrendingProduct,
  RisingSearch,
  SearchFilters,
  SearchResults,
  Suggestion,
  DateRange,
} from '@/types/searchAnalytics';

// ============================================================================
// Search Analytics API
// ============================================================================

/**
 * Track a search event
 */
export async function trackSearch(data: SearchAnalyticsData): Promise<void> {
  return client.post<void>('/search-analytics/track', data);
}

/**
 * Track a click event on search results
 */
export async function trackClick(data: ClickTrackingData): Promise<void> {
  return client.post<void>('/search-analytics/click', data);
}

/**
 * Track a conversion event
 */
export async function trackConversion(data: ConversionData): Promise<void> {
  return client.post<void>('/search-analytics/conversion', data);
}

/**
 * Get search history for a user
 */
export async function getSearchHistory(
  userId: string,
  limit: number = 20
): Promise<SearchHistory[]> {
  return client.get<SearchHistory[]>(`/search-analytics/history/${userId}?limit=${limit}`);
}

/**
 * Get popular searches
 */
export async function getPopularSearches(
  limit: number = 10,
  timeRange: string = '7d'
): Promise<PopularSearch[]> {
  return client.get<PopularSearch[]>(`/search-analytics/popular?limit=${limit}&timeRange=${timeRange}`);
}

/**
 * Get analytics metrics for a date range
 */
export async function getAnalyticsMetrics(
  startDate: Date,
  endDate: Date
): Promise<AnalyticsMetrics> {
  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });
  return client.get<AnalyticsMetrics>(`/search-analytics/metrics?${params.toString()}`);
}

/**
 * Get search trends over time
 */
export async function getSearchTrends(
  startDate: Date,
  endDate: Date,
  granularity: 'hour' | 'day' | 'week' = 'day'
): Promise<SearchTrendData[]> {
  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    granularity,
  });
  return client.get<SearchTrendData[]>(`/search-analytics/trends?${params.toString()}`);
}

/**
 * Get zero-result queries
 */
export async function getZeroResultQueries(
  limit: number = 20,
  timeRange: string = '7d'
): Promise<{ query: string; count: number; lastSearched: Date }[]> {
  return client.get<{ query: string; count: number; lastSearched: Date }[]>(
    `/search-performance/zero-results?limit=${limit}&timeRange=${timeRange}`
  );
}

// ============================================================================
// Search Performance API
// ============================================================================

/**
 * Get performance metrics
 */
export async function getPerformanceMetrics(timeRange: string = '24h'): Promise<PerformanceMetrics> {
  return client.get<PerformanceMetrics>(`/search-analytics/metrics?timeRange=${timeRange}`);
}

/**
 * Get performance alerts
 */
export async function getPerformanceAlerts(
  threshold?: number,
  severity?: 'low' | 'medium' | 'high' | 'critical'
): Promise<PerformanceAlert[]> {
  const params = new URLSearchParams();
  if (threshold !== undefined) params.set('threshold', String(threshold));
  if (severity) params.set('severity', severity);
  return client.get<PerformanceAlert[]>(`/search-performance/alerts?${params.toString()}`);
}

/**
 * Get real-time statistics
 */
export async function getRealTimeStats(): Promise<RealTimeStats> {
  return client.get<RealTimeStats>('/search-performance/realtime');
}

/**
 * Get response time distribution
 */
export async function getResponseTimeDistribution(
  timeRange: string = '24h'
): Promise<ResponseTimeDistribution[]> {
  return client.get<ResponseTimeDistribution[]>(
    `/search-performance/response-time-distribution?timeRange=${timeRange}`
  );
}

/**
 * Get performance comparison between time periods
 */
export async function getPerformanceComparison(
  currentRange: string,
  previousRange: string
): Promise<PerformanceComparison> {
  return client.get<PerformanceComparison>(
    `/search-performance/comparison?currentRange=${currentRange}&previousRange=${previousRange}`
  );
}

/**
 * Get cache statistics
 */
export async function getCacheStats(timeRange: string = '24h'): Promise<{
  hitRate: number;
  missRate: number;
  totalRequests: number;
  hits: number;
  misses: number;
}> {
  return client.get<{
    hitRate: number;
    missRate: number;
    totalRequests: number;
    hits: number;
    misses: number;
  }>(`/search-performance/cache-stats?timeRange=${timeRange}`);
}

// ============================================================================
// Search Optimization API
// ============================================================================

/**
 * Analyze query patterns
 */
export async function analyzeQueryPatterns(timeRange: string = '7d'): Promise<QueryPatterns> {
  return client.get<QueryPatterns>(`/search-optimization/patterns?timeRange=${timeRange}`);
}

/**
 * Create an A/B testing experiment
 */
export async function createExperiment(data: ExperimentData): Promise<Experiment> {
  return client.post<Experiment>('/search-optimization/experiments', data);
}

/**
 * Get experiment results
 */
export async function getExperimentResults(experimentId: string): Promise<ExperimentResults> {
  return client.get<ExperimentResults>(`/search-optimization/experiments/${experimentId}/results`);
}

/**
 * Get all experiments
 */
export async function getExperiments(
  isActive?: boolean,
  limit: number = 20
): Promise<Experiment[]> {
  const params = new URLSearchParams();
  if (isActive !== undefined) params.set('isActive', String(isActive));
  params.set('limit', String(limit));
  return client.get<Experiment[]>(`/search-optimization/experiments?${params.toString()}`);
}

/**
 * Get optimized search results
 */
export async function getOptimizedResults(
  query: string,
  filters: SearchFilters = {},
  sortBy: string = 'relevance'
): Promise<SearchResults> {
  const params = new URLSearchParams({ query, sortBy });
  
  if (filters.categories) {
    filters.categories.forEach(cat => params.append('category', cat));
  }
  if (filters.brands) {
    filters.brands.forEach(brand => params.append('brand', brand));
  }
  if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
  if (filters.rating !== undefined) params.set('rating', String(filters.rating));
  if (filters.page !== undefined) params.set('page', String(filters.page));
  if (filters.limit !== undefined) params.set('limit', String(filters.limit));
  
  return client.get<SearchResults>(`/search-optimization/results?${params.toString()}`);
}

/**
 * Get optimization insights
 */
export async function getOptimizationInsights(
  timeRange: string = '7d'
): Promise<OptimizationInsight[]> {
  return client.get<OptimizationInsight[]>(
    `/search-optimization/insights?timeRange=${timeRange}`
  );
}

/**
 * Get relevance metrics
 */
export async function getRelevanceMetrics(
  timeRange: string = '7d'
): Promise<RelevanceMetrics> {
  return client.get<RelevanceMetrics>(
    `/search-optimization/relevance-metrics?timeRange=${timeRange}`
  );
}

/**
 * Update experiment status
 */
export async function updateExperimentStatus(
  experimentId: string,
  isActive: boolean
): Promise<Experiment> {
  return client.patch<Experiment>(`/search-optimization/experiments/${experimentId}`, {
    isActive,
  });
}

/**
 * Delete an experiment
 */
export async function deleteExperiment(experimentId: string): Promise<void> {
  return client.delete<void>(`/search-optimization/experiments/${experimentId}`);
}

// ============================================================================
// Personalization API
// ============================================================================

/**
 * Get user preferences
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  return client.get<UserPreferences>(`/search-personalization/preferences/${userId}`);
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<void> {
  return client.put<void>(`/search-personalization/preferences/${userId}`, preferences);
}

/**
 * Get personalized search results
 */
export async function getPersonalizedResults(
  query: string,
  userId: string,
  filters: SearchFilters = {}
): Promise<SearchResults> {
  const params = new URLSearchParams({ query, userId });
  
  if (filters.categories) {
    filters.categories.forEach(cat => params.append('category', cat));
  }
  if (filters.brands) {
    filters.brands.forEach(brand => params.append('brand', brand));
  }
  if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
  if (filters.rating !== undefined) params.set('rating', String(filters.rating));
  if (filters.page !== undefined) params.set('page', String(filters.page));
  if (filters.limit !== undefined) params.set('limit', String(filters.limit));
  
  return client.get<SearchResults>(`/search-personalization/results?${params.toString()}`);
}

/**
 * Get personalized suggestions
 */
export async function getPersonalizedSuggestions(
  userId: string,
  limit: number = 10
): Promise<Suggestion[]> {
  return client.get<Suggestion[]>(
    `/search-personalization/suggestions/${userId}?limit=${limit}`
  );
}

/**
 * Get recommendations for a user
 */
export async function getRecommendations(
  userId: string,
  type: 'collaborative' | 'content_based' | 'hybrid' = 'hybrid',
  limit: number = 10
): Promise<Recommendation[]> {
  return client.get<Recommendation[]>(
    `/search-personalization/recommendations/${userId}?type=${type}&limit=${limit}`
  );
}

/**
 * Get personalization metrics
 */
export async function getPersonalizationMetrics(
  userId: string,
  timeRange: string = '7d'
): Promise<PersonalizationMetrics> {
  return client.get<PersonalizationMetrics>(
    `/search-personalization/metrics/${userId}?timeRange=${timeRange}`
  );
}

/**
 * Get personalization effectiveness
 */
export async function getPersonalizationEffectiveness(
  timeRange: string = '7d'
): Promise<PersonalizationEffectiveness> {
  return client.get<PersonalizationEffectiveness>(
    `/search-personalization/effectiveness?timeRange=${timeRange}`
  );
}

/**
 * Update user behavior data
 */
export async function updateUserBehavior(
  userId: string,
  behaviorData: {
    productId?: string;
    action: 'view' | 'click' | 'add_to_cart' | 'purchase';
    context?: Record<string, any>;
  }
): Promise<void> {
  return client.post<void>(`/search-personalization/behavior/${userId}`, behaviorData);
}

// ============================================================================
// Trending API
// ============================================================================

/**
 * Get trending searches
 */
export async function getTrendingSearches(
  limit: number = 10,
  timeRange: string = '24h'
): Promise<TrendingSearch[]> {
  return client.get<TrendingSearch[]>(
    `/search-trending/searches?limit=${limit}&timeRange=${timeRange}`
  );
}

/**
 * Get trending products
 */
export async function getTrendingProducts(
  limit: number = 10,
  category?: string,
  timeRange: string = '24h'
): Promise<TrendingProduct[]> {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  params.set('timeRange', timeRange);
  if (category) params.set('category', category);
  return client.get<TrendingProduct[]>(`/search-trending/products?${params.toString()}`);
}

/**
 * Get rising searches
 */
export async function getRisingSearches(
  limit: number = 10,
  timeRange: string = '7d'
): Promise<RisingSearch[]> {
  return client.get<RisingSearch[]>(
    `/search-trending/rising?limit=${limit}&timeRange=${timeRange}`
  );
}

/**
 * Get trending categories
 */
export async function getTrendingCategories(
  limit: number = 10,
  timeRange: string = '24h'
): Promise<{ categoryId: string; categoryName: string; searchCount: number; trendScore: number }[]> {
  return client.get<{ categoryId: string; categoryName: string; searchCount: number; trendScore: number }[]>(
    `/search-trending/categories?limit=${limit}&timeRange=${timeRange}`
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a session ID for tracking
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get device type from user agent
 */
export function getDeviceType(): string {
  if (typeof window === 'undefined') return 'server';
  
  const userAgent = navigator.userAgent;
  
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/.test(userAgent)) {
    return 'mobile';
  }
  if (/Tablet|iPad|PlayBook|Nexus 7/.test(userAgent)) {
    return 'tablet';
  }
  return 'desktop';
}

/**
 * Calculate response time for a search
 */
export function calculateResponseTime(startTime: number): number {
  return Math.round(performance.now() - startTime);
}

/**
 * Format date for API requests
 */
export function formatDateForApi(date: Date): string {
  return date.toISOString();
}

/**
 * Parse date from API response
 */
export function parseDateFromApi(dateString: string): Date {
  return new Date(dateString);
}

// Export all functions as a default object for convenience
const searchAnalyticsApi = {
  // Search Analytics
  trackSearch,
  trackClick,
  trackConversion,
  getSearchHistory,
  getPopularSearches,
  getAnalyticsMetrics,
  getSearchTrends,
  getZeroResultQueries,
  
  // Search Performance
  getPerformanceMetrics,
  getPerformanceAlerts,
  getRealTimeStats,
  getResponseTimeDistribution,
  getPerformanceComparison,
  getCacheStats,
  
  // Search Optimization
  analyzeQueryPatterns,
  createExperiment,
  getExperimentResults,
  getExperiments,
  getOptimizedResults,
  getOptimizationInsights,
  getRelevanceMetrics,
  updateExperimentStatus,
  deleteExperiment,
  
  // Personalization
  getUserPreferences,
  updateUserPreferences,
  getPersonalizedResults,
  getPersonalizedSuggestions,
  getRecommendations,
  getPersonalizationMetrics,
  getPersonalizationEffectiveness,
  updateUserBehavior,
  
  // Trending
  getTrendingSearches,
  getTrendingProducts,
  getRisingSearches,
  getTrendingCategories,
  
  // Utilities
  generateSessionId,
  getDeviceType,
  calculateResponseTime,
  formatDateForApi,
  parseDateFromApi,
};

export default searchAnalyticsApi;
