/**
 * Admin Search Analytics API Library
 * 
 * Provides admin-only functions for interacting with search analytics, performance,
 * optimization, personalization, and trending API endpoints.
 */

import { apiClient as client } from './client';
import type {
  AnalyticsMetrics,
  PerformanceMetrics,
  PerformanceAlert,
  PerformanceComparison,
  QueryPatterns,
  Experiment,
  ExperimentData,
  OptimizationInsight,
  PersonalizationMetrics,
  TrendingSearch,
  TrendingProduct,
} from '@/types/searchAnalytics';

// ============================================================================
// Type Definitions
// ============================================================================

export interface AnalyticsOverview {
  totalSearches: number;
  avgResponseTime: string;
  conversionRate: string;
  zeroResults: number;
  clickThroughRate: string;
  uniqueQueries: number;
  resultsRate: string;
  medianResponseTime: string;
  timeSeries: { date: string; count: number }[];
  period: { startDate: string; endDate: string };
}

export interface QueryList {
  queries: {
    query: string;
    count: number;
    avgResults: number;
    avgResponseTime: string;
    lastSearchedAt: string;
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface QueryDetails {
  query: string;
  frequency: number;
  avgResults: number;
  avgResponseTime: string;
  clickThroughRate: string;
  conversionRate: string;
  uniqueUsers: number;
  clicksByPosition: Record<number, number>;
  timeTrends: { date: string; count: number }[];
  relatedQueries: { query: string; count: number }[];
  recentSearches: {
    timestamp: string;
    resultsCount: number;
    responseTime: number;
    userId: string | null;
    conversionType: string | null;
  }[];
}

export interface ZeroResultQuery {
  query: string;
  count: number;
  lastSearched: string;
}

export interface ConversionData {
  totalSearches: number;
  conversions: number;
  conversionRate: string;
  conversionByType: Record<string, number>;
  funnel: {
    searches: number;
    searchesWithResults: number;
    clicks: number;
    conversions: number;
  };
  period: { startDate: string; endDate: string };
}

export interface PerformanceOverview {
  totalSearches: number;
  avgResponseTime: string;
  medianResponseTime: string;
  p95ResponseTime: string;
  p99ResponseTime: string;
  cacheHitRate: string;
  zeroResultQueries: number;
  zeroResultRate: string;
  period: { startDate: string; endDate: string };
}

export interface PerformanceThresholds {
  slowQueryThreshold?: number;
  highZeroResultsThreshold?: number;
  lowCacheHitThreshold?: number;
}

export interface ExperimentDetails {
  id: string;
  name: string;
  description: string;
  algorithmVariant: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  sampleSize: number;
  controlGroupSize: number;
  variantGroupSize: number;
  metrics: {
    clickThroughRate: number;
    conversionRate: number;
    avgResponseTime: number;
  };
}

export interface PersonalizationOverview {
  totalUsers: number;
  usersWithPreferences: number;
  personalizationEnabled: boolean;
  recommendationEngineStatus: string;
  lastUpdated: string;
}

export interface UserPreferencesList {
  preferences: {
    id: string;
    userId: string;
    preferredCategories: any[];
    preferredBrands: any[];
    priceRangeMin: number | null;
    priceRangeMax: number | null;
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UserPreferencesDetail {
  userId: string;
  preferredCategories: any[];
  preferredBrands: any[];
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  searchHistory: any[];
  clicks: any[];
}

export interface RecommendationStats {
  totalRecommendations: number;
  clickThroughRate: string;
  conversionRate: string;
  avgPosition: number;
  topCategories: {
    category: string;
    count: number;
    percentage: string;
  }[];
  period: { startDate: string; endDate: string };
}

export interface TrendingOverview {
  totalTrendingSearches: number;
  totalTrendingProducts: number;
  trendThreshold: number;
  trendDecay: number;
  lastCalculated: string;
}

export interface QueryFilters {
  query?: string;
  minResults?: number;
  maxResults?: number;
  minResponseTime?: number;
  maxResponseTime?: number;
  hasConversion?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface Pagination {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ExperimentFilters {
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TrendingFilters {
  limit?: number;
  timeRange?: '1h' | '24h' | '7d' | '30d';
}

export interface UserFilters {
  query?: string;
}

export interface PersonalizationConfig {
  personalizationEnabled?: boolean;
  recommendationEngine?: string;
  minSearchesForPersonalization?: number;
}

// ============================================================================
// Analytics API
// ============================================================================

/**
 * Get analytics overview
 */
export async function getAdminAnalyticsOverview(
  timeRange: string = 'week'
): Promise<AnalyticsOverview> {
  return client.get<AnalyticsOverview>(
    `/admin/search/analytics/overview?timeRange=${timeRange}`
  );
}

/**
 * Get analytics metrics
 */
export async function getAdminAnalyticsMetrics(
  startDate: Date,
  endDate: Date
): Promise<AnalyticsMetrics> {
  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });
  return client.get<AnalyticsMetrics>(
    `/admin/search/analytics/metrics?${params.toString()}`
  );
}

/**
 * Get search queries
 */
export async function getAdminSearchQueries(
  filters: QueryFilters = {},
  pagination: Pagination = {}
): Promise<QueryList> {
  const params = new URLSearchParams();
  
  if (filters.query) params.set('query', filters.query);
  if (filters.minResults !== undefined) params.set('minResults', String(filters.minResults));
  if (filters.maxResults !== undefined) params.set('maxResults', String(filters.maxResults));
  if (filters.minResponseTime !== undefined) params.set('minResponseTime', String(filters.minResponseTime));
  if (filters.maxResponseTime !== undefined) params.set('maxResponseTime', String(filters.maxResponseTime));
  if (filters.hasConversion !== undefined) params.set('hasConversion', String(filters.hasConversion));
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  
  if (pagination.page !== undefined) params.set('page', String(pagination.page));
  if (pagination.limit !== undefined) params.set('limit', String(pagination.limit));
  if (pagination.sortBy) params.set('sortBy', pagination.sortBy);
  if (pagination.sortOrder) params.set('sortOrder', pagination.sortOrder);
  
  return client.get<QueryList>(`/admin/search/analytics/queries?${params.toString()}`);
}

/**
 * Get query details
 */
export async function getAdminQueryDetails(queryId: string): Promise<QueryDetails> {
  return client.get<QueryDetails>(`/admin/search/analytics/queries/${queryId}`);
}

/**
 * Get zero-result queries
 */
export async function getAdminZeroResultQueries(
  limit: number = 50
): Promise<ZeroResultQuery[]> {
  return client.get<ZeroResultQuery[]>(
    `/admin/search/analytics/zero-results?limit=${limit}`
  );
}

/**
 * Get conversion data
 */
export async function getAdminConversionData(
  timeRange: string = 'week'
): Promise<ConversionData> {
  return client.get<ConversionData>(
    `/admin/search/analytics/conversions?timeRange=${timeRange}`
  );
}

/**
 * Export admin analytics data
 */
export async function exportAdminAnalyticsData(
  format: 'csv' | 'excel' = 'csv',
  filters?: QueryFilters
): Promise<Blob> {
  const params = new URLSearchParams();
  params.append('format', format);
  
  if (filters) {
    if (filters.query) params.append('query', filters.query);
    if (filters.minResults !== undefined) params.append('minResults', filters.minResults.toString());
    if (filters.maxResults !== undefined) params.append('maxResults', filters.maxResults.toString());
    if (filters.minResponseTime !== undefined) params.append('minResponseTime', filters.minResponseTime.toString());
    if (filters.maxResponseTime !== undefined) params.append('maxResponseTime', filters.maxResponseTime.toString());
    if (filters.hasConversion !== undefined) params.append('hasConversion', filters.hasConversion.toString());
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
  }

  // Use apiClient infrastructure (base URL, auth) but handle blob response manually
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const baseUrl = typeof window === 'undefined' 
    ? process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001/api/v1'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  
  const response = await fetch(`${baseUrl}/admin/search/analytics/export?${params.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to export analytics data');
  }
  
  return response.blob();
}

// ============================================================================
// Performance API
// ============================================================================

/**
 * Get performance overview
 */
export async function getAdminPerformanceOverview(
  timeRange: string = 'week'
): Promise<PerformanceOverview> {
  return client.get<PerformanceOverview>(
    `/admin/search/performance/overview?timeRange=${timeRange}`
  );
}

/**
 * Get performance metrics
 */
export async function getAdminPerformanceMetrics(
  timeRange: string = 'week'
): Promise<PerformanceMetrics> {
  return client.get<PerformanceMetrics>(
    `/admin/search/performance/metrics?timeRange=${timeRange}`
  );
}

/**
 * Get performance alerts
 */
export async function getAdminPerformanceAlerts(
  thresholds: PerformanceThresholds = {}
): Promise<PerformanceAlert[]> {
  const params = new URLSearchParams();
  
  if (thresholds.slowQueryThreshold !== undefined) params.set('slowQueryThreshold', String(thresholds.slowQueryThreshold));
  if (thresholds.highZeroResultsThreshold !== undefined) params.set('highZeroResultsThreshold', String(thresholds.highZeroResultsThreshold));
  if (thresholds.lowCacheHitThreshold !== undefined) params.set('lowCacheHitThreshold', String(thresholds.lowCacheHitThreshold));
  
  return client.get<PerformanceAlert[]>(
    `/admin/search/performance/alerts?${params.toString()}`
  );
}

/**
 * Update alert status
 */
export async function updateAdminAlertStatus(
  alertId: string,
  status: string
): Promise<void> {
  return client.put<void>(`/admin/search/performance/alerts/${alertId}`, { status });
}

/**
 * Get performance comparison
 */
export async function getAdminPerformanceComparison(
  period1: string,
  period2: string
): Promise<PerformanceComparison> {
  return client.get<PerformanceComparison>(
    `/admin/search/performance/comparison?period1=${period1}&period2=${period2}`
  );
}

/**
 * Update performance threshold
 */
export async function updateAdminPerformanceThreshold(
  thresholds: PerformanceThresholds
): Promise<void> {
  return client.post<void>('/admin/search/performance/threshold', thresholds);
}

// ============================================================================
// Optimization API
// ============================================================================

/**
 * Get query patterns
 */
export async function getAdminQueryPatterns(
  timeRange: string = 'week'
): Promise<QueryPatterns> {
  return client.get<QueryPatterns>(
    `/admin/search/optimization/patterns?timeRange=${timeRange}`
  );
}

/**
 * Get experiments
 */
export async function getAdminExperiments(
  filters: ExperimentFilters = {}
): Promise<Experiment[]> {
  const params = new URLSearchParams();
  
  if (filters.status) params.set('status', filters.status);
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
  
  return client.get<Experiment[]>(
    `/admin/search/optimization/experiments?${params.toString()}`
  );
}

/**
 * Get experiment details
 */
export async function getAdminExperimentDetails(
  experimentId: string
): Promise<ExperimentDetails> {
  return client.get<ExperimentDetails>(
    `/admin/search/optimization/experiments/${experimentId}`
  );
}

/**
 * Create experiment
 */
export async function createAdminExperiment(
  experimentData: ExperimentData
): Promise<Experiment> {
  return client.post<Experiment>(
    '/admin/search/optimization/experiments',
    experimentData
  );
}

/**
 * Update experiment status
 */
export async function updateAdminExperimentStatus(
  experimentId: string,
  status: string
): Promise<void> {
  return client.put<void>(
    `/admin/search/optimization/experiments/${experimentId}/status`,
    { status }
  );
}

/**
 * Delete experiment
 */
export async function deleteAdminExperiment(
  experimentId: string
): Promise<void> {
  return client.delete<void>(
    `/admin/search/optimization/experiments/${experimentId}`
  );
}

/**
 * Get optimization insights
 */
export async function getAdminOptimizationInsights(): Promise<OptimizationInsight[]> {
  return client.get<OptimizationInsight[]>(
    '/admin/search/optimization/insights'
  );
}

// ============================================================================
// Personalization API
// ============================================================================

/**
 * Get personalization overview
 */
export async function getAdminPersonalizationOverview(): Promise<PersonalizationOverview> {
  return client.get<PersonalizationOverview>(
    '/admin/search/personalization/overview'
  );
}

/**
 * Get user preferences list
 */
export async function getAdminUserPreferencesList(
  filters: UserFilters = {},
  pagination: Pagination = {}
): Promise<UserPreferencesList> {
  const params = new URLSearchParams();
  
  if (filters.query) params.set('query', filters.query);
  if (pagination.page !== undefined) params.set('page', String(pagination.page));
  if (pagination.limit !== undefined) params.set('limit', String(pagination.limit));
  
  return client.get<UserPreferencesList>(
    `/admin/search/personalization/users?${params.toString()}`
  );
}

/**
 * Get user preferences detail
 */
export async function getAdminUserPreferencesDetail(
  userId: string
): Promise<UserPreferencesDetail> {
  return client.get<UserPreferencesDetail>(
    `/admin/search/personalization/users/${userId}`
  );
}

/**
 * Update user preferences
 */
export async function updateAdminUserPreferences(
  userId: string,
  preferences: any
): Promise<void> {
  return client.put<void>(
    `/admin/search/personalization/users/${userId}`,
    preferences
  );
}

/**
 * Get personalization metrics
 */
export async function getAdminPersonalizationMetrics(
  timeRange: string = 'week'
): Promise<PersonalizationMetrics> {
  return client.get<PersonalizationMetrics>(
    `/admin/search/personalization/metrics?timeRange=${timeRange}`
  );
}

/**
 * Get recommendation stats
 */
export async function getAdminRecommendationStats(
  timeRange: string = 'week'
): Promise<RecommendationStats> {
  return client.get<RecommendationStats>(
    `/search-personalization/admin/recommendations?timeRange=${timeRange}`
  );
}

/**
 * Update personalization config
 */
export async function updateAdminPersonalizationConfig(
  config: PersonalizationConfig
): Promise<void> {
  return client.put<void>(
    '/admin/search/personalization/config',
    config
  );
}

// ============================================================================
// Trending API
// ============================================================================

/**
 * Get trending overview
 */
export async function getAdminTrendingOverview(): Promise<TrendingOverview> {
  return client.get<TrendingOverview>(
    '/admin/search/trending/overview'
  );
}

/**
 * Get trending searches
 */
export async function getAdminTrendingSearches(
  filters: TrendingFilters = {}
): Promise<TrendingSearch[]> {
  const params = new URLSearchParams();
  
  if (filters.limit !== undefined) params.set('limit', String(filters.limit));
  if (filters.timeRange) params.set('timeRange', filters.timeRange);
  
  return client.get<TrendingSearch[]>(
    `/search-trending/admin/trending?${params.toString()}`
  );
}

/**
 * Get trending products
 */
export async function getAdminTrendingProducts(
  filters: TrendingFilters = {}
): Promise<TrendingProduct[]> {
  const params = new URLSearchParams();
  
  if (filters.limit !== undefined) params.set('limit', String(filters.limit));
  if (filters.timeRange) params.set('timeRange', filters.timeRange);
  
  return client.get<TrendingProduct[]>(
    `/admin/search/trending/products?${params.toString()}`
  );
}

/**
 * Calculate trends
 */
export async function calculateAdminTrends(): Promise<void> {
  return client.post<void>('/admin/search/trending/calculate', {});
}

/**
 * Update trend threshold
 */
export async function updateAdminTrendThreshold(
  threshold: number
): Promise<void> {
  return client.put<void>(
    '/admin/search/trending/threshold',
    { threshold }
  );
}

/**
 * Update trend decay
 */
export async function updateAdminTrendDecay(
  decay: number
): Promise<void> {
  return client.put<void>(
    '/admin/search/trending/decay',
    { decay }
  );
}

/**
 * Clear old trends
 */
export async function clearAdminOldTrends(
  days: number = 30
): Promise<void> {
  return client.delete<void>(
    `/admin/search/trending/old?days=${days}`
  );
}

// ============================================================================
// Export all functions as default object
// ============================================================================

const adminSearchAnalyticsApi = {
  // Analytics
  getAdminAnalyticsOverview,
  getAdminAnalyticsMetrics,
  getAdminSearchQueries,
  getAdminQueryDetails,
  getAdminZeroResultQueries,
  getAdminConversionData,
  exportAdminAnalyticsData,
  
  // Performance
  getAdminPerformanceOverview,
  getAdminPerformanceMetrics,
  getAdminPerformanceAlerts,
  updateAdminAlertStatus,
  getAdminPerformanceComparison,
  updateAdminPerformanceThreshold,
  
  // Optimization
  getAdminQueryPatterns,
  getAdminExperiments,
  getAdminExperimentDetails,
  createAdminExperiment,
  updateAdminExperimentStatus,
  deleteAdminExperiment,
  getAdminOptimizationInsights,
  
  // Personalization
  getAdminPersonalizationOverview,
  getAdminUserPreferencesList,
  getAdminUserPreferencesDetail,
  updateAdminUserPreferences,
  getAdminPersonalizationMetrics,
  getAdminRecommendationStats,
  updateAdminPersonalizationConfig,
  
  // Trending
  getAdminTrendingOverview,
  getAdminTrendingSearches,
  getAdminTrendingProducts,
  calculateAdminTrends,
  updateAdminTrendThreshold,
  updateAdminTrendDecay,
  clearAdminOldTrends,
};

export default adminSearchAnalyticsApi;
