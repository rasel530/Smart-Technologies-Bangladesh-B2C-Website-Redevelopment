/**
 * Search Analytics Type Definitions
 * 
 * This file contains all TypeScript interfaces and types related to search analytics,
 * performance, optimization, personalization, and trending functionality.
 */

// ============================================================================
// Search Analytics Types
// ============================================================================

export interface SearchAnalyticsData {
  userId?: string;
  sessionId: string;
  query: string;
  resultsCount: number;
  responseTime: number;
  filtersApplied: Record<string, any>;
  sortBy: string;
  deviceType: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ClickTrackingData {
  searchAnalyticsId: string;
  productId: string;
  position: number;
}

export interface ConversionData {
  searchAnalyticsId: string;
  conversionType: 'click' | 'add_to_cart' | 'purchase';
  productId?: string;
}

export interface SearchHistory {
  id: string;
  userId: string;
  query: string;
  timestamp: Date;
  resultCount: number;
  filters?: Record<string, any>;
}

export interface SearchHistoryItem {
  query: string;
  timestamp: Date;
  resultCount?: number;
}

export interface PopularSearch {
  query: string;
  searchCount: number;
  category?: string;
  trend?: 'up' | 'down' | 'stable';
  trendPercentage?: number;
}

export interface AnalyticsMetrics {
  totalSearches: number;
  uniqueSearches: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  conversionRate: number;
  clickThroughRate: number;
  zeroResultRate: number;
  cacheHitRate: number;
  period?: {
    startDate: Date;
    endDate: Date;
  };
}

export interface SearchTrendData {
  date: string;
  searchCount: number;
  uniqueSearches: number;
  avgResponseTime: number;
  conversionRate: number;
}

// ============================================================================
// Search Performance Types
// ============================================================================

export interface PerformanceMetrics {
  queryCount: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  cacheHitRate: number;
  zeroResultQueries: number;
  timeRange?: string;
}

export interface PerformanceAlert {
  id: string;
  type: 'slow_query' | 'high_zero_results' | 'low_cache_hit' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: Date;
  resolved?: boolean;
}

export interface RealTimeStats {
  currentQueries: number;
  avgResponseTime: number;
  cacheHitRate: number;
  activeUsers: number;
  timestamp: Date;
}

export interface ResponseTimeDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface PerformanceComparison {
  currentPeriod: {
    avgResponseTime: number;
    p95ResponseTime: number;
    cacheHitRate: number;
    zeroResultRate: number;
  };
  previousPeriod: {
    avgResponseTime: number;
    p95ResponseTime: number;
    cacheHitRate: number;
    zeroResultRate: number;
  };
  change: {
    avgResponseTime: number;
    p95ResponseTime: number;
    cacheHitRate: number;
    zeroResultRate: number;
  };
}

// ============================================================================
// Search Optimization Types
// ============================================================================

export interface QueryPatterns {
  commonPatterns: QueryPattern[];
  zeroResultQueries: ZeroResultQuery[];
  queryLengthDistribution: QueryLengthDistribution[];
  filterUsage: FilterUsage[];
  sortByUsage: SortByUsage[];
}

export interface QueryPattern {
  pattern: string;
  count: number;
  percentage: number;
  category?: string;
  avgResults: number;
}

export interface ZeroResultQuery {
  query: string;
  count: number;
  lastSearched: Date;
  suggestedAlternatives?: string[];
}

export interface QueryLengthDistribution {
  lengthRange: string;
  count: number;
  percentage: number;
}

export interface FilterUsage {
  filterName: string;
  count: number;
  percentage: number;
  avgResults: number;
}

export interface SortByUsage {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  count: number;
  percentage: number;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  algorithmVariant: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  metrics: ExperimentMetrics;
  sampleSize: number;
  controlGroupSize: number;
  variantGroupSize: number;
}

export interface ExperimentMetrics {
  clickThroughRate: number;
  conversionRate: number;
  avgResponseTime: number;
  userSatisfaction?: number;
}

export interface ExperimentData {
  name: string;
  description: string;
  algorithmVariant: string;
  startDate: Date;
  endDate?: Date;
  sampleSize: number;
  controlGroupPercentage?: number;
}

export interface ExperimentResults {
  experimentId: string;
  controlMetrics: ExperimentMetrics;
  variantMetrics: ExperimentMetrics;
  statisticalSignificance: number;
  winner?: 'control' | 'variant' | 'inconclusive';
  recommendations: string[];
}

export interface OptimizationInsight {
  type: 'query' | 'filter' | 'sorting' | 'caching' | 'indexing';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  impact: string;
  effort: string;
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
}

export interface RelevanceMetrics {
  averageRelevanceScore: number;
  clickThroughRate: number;
  dwellTime: number;
  conversionRate: number;
  topResultClickRate: number;
}

// ============================================================================
// Personalization Types
// ============================================================================

export interface UserPreferences {
  userId: string;
  preferredCategories: CategoryPreference[];
  preferredBrands: BrandPreference[];
  priceRangeMin?: number;
  priceRangeMax?: number;
  searchHistory: SearchHistoryItem[];
  behaviorProfile?: UserBehaviorProfile;
}

export interface CategoryPreference {
  categoryId: string;
  categoryName: string;
  score: number;
  lastViewed?: Date;
}

export interface BrandPreference {
  brandId: string;
  brandName: string;
  score: number;
  lastViewed?: Date;
}

export interface UserBehaviorProfile {
  avgSessionDuration: number;
  avgQueriesPerSession: number;
  preferredTimeOfDay: string[];
  preferredDeviceType: string;
  purchaseHistory: PurchaseHistoryItem[];
  browsingHistory: BrowsingHistoryItem[];
}

export interface PurchaseHistoryItem {
  productId: string;
  productName: string;
  category: string;
  price: number;
  purchaseDate: Date;
}

export interface BrowsingHistoryItem {
  productId: string;
  productName: string;
  category: string;
  lastViewed: Date;
  viewCount: number;
}

export interface Recommendation {
  id: string;
  productId: string;
  productName: string;
  recommendationType: 'collaborative' | 'content_based' | 'hybrid';
  score: number;
  reason: string;
  category?: string;
  imageUrl?: string;
}

export interface PersonalizationMetrics {
  userId: string;
  personalizedClickRate: number;
  personalizedConversionRate: number;
  nonPersonalizedClickRate: number;
  nonPersonalizedConversionRate: number;
  improvement: {
    clickRate: number;
    conversionRate: number;
  };
  timeRange?: string;
}

export interface PersonalizationEffectiveness {
  overallScore: number;
  clickThroughImprovement: number;
  conversionImprovement: number;
  userSatisfaction: number;
  engagementIncrease: number;
}

// ============================================================================
// Trending Types
// ============================================================================

export interface TrendingSearch {
  query: string;
  searchCount: number;
  trendScore: number;
  category?: string;
  isTrending: boolean;
  trend?: 'rising' | 'stable' | 'falling';
  timeRange?: string;
}

export interface TrendingProduct {
  productId: string;
  productName: string;
  category: string;
  searchCount: number;
  trendScore: number;
  imageUrl?: string;
  price?: number;
  trend?: 'rising' | 'stable' | 'falling';
}

export interface TrendingCategory {
  categoryId: string;
  categoryName: string;
  searchCount: number;
  trendScore: number;
  trend?: 'rising' | 'stable' | 'falling';
}

export interface RisingSearch {
  query: string;
  previousCount: number;
  currentCount: number;
  growthPercentage: number;
  category?: string;
}

// ============================================================================
// Common Types
// ============================================================================

export interface SearchFilters {
  query?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  categories?: string[];
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  specifications?: string[];
}

export interface SearchResults {
  products: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  metadata?: {
    query: string;
    executionTime: number;
    searchEngine: string;
    personalized?: boolean;
    experimentVariant?: string;
  };
}

export interface Suggestion {
  id: string;
  type: 'query' | 'product' | 'category';
  text: string;
  imageUrl?: string;
  category?: string;
  brand?: string;
  price?: number;
  score?: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface TimeRange {
  label: string;
  value: string;
  days: number;
}

// ============================================================================
// Chart Data Types
// ============================================================================

export interface ChartDataPoint {
  label: string;
  value: number;
  date?: string;
}

export interface MultiSeriesChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

export interface PieChartData {
  label: string;
  value: number;
  color?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
