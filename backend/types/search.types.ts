/**
 * Search Type Definitions
 * 
 * This file contains all TypeScript interfaces and types related to search functionality
 * including advanced search queries, results, faceted search, autocomplete, and caching.
 */

/**
 * Advanced Search Query Interface
 */
export interface AdvancedSearchQuery {
  /** Search query string */
  query: string;
  /** Category filters (multi-level hierarchy support) */
  categoryIds?: string[];
  /** Brand filters (multiple brand selection) */
  brandIds?: string[];
  /** Price range filter */
  priceRange?: {
    min?: number;
    max?: number;
  };
  /** Specification filters (dynamic product specification filtering) */
  specifications?: SpecificationFilter[];
  /** Stock filter (in-stock only) */
  inStockOnly?: boolean;
  /** Featured filter (featured products only) */
  featuredOnly?: boolean;
  /** New arrivals filter */
  newArrivalsOnly?: boolean;
  /** Best sellers filter */
  bestSellersOnly?: boolean;
  /** Sort option */
  sort?: SearchSortOption;
  /** Page number */
  page?: number;
  /** Page size */
  pageSize?: number;
  /** Minimum score threshold */
  minScore?: number;
  /** Enable fuzzy matching */
  enableFuzzy?: boolean;
  /** Language preference (en or bn) */
  language?: 'en' | 'bn';
}

/**
 * Specification Filter Interface
 */
export interface SpecificationFilter {
  /** Specification name */
  name: string;
  /** Specification values */
  values: string[];
}

/**
 * Search Sort Option Type
 */
export type SearchSortOption = 
  | 'relevance' 
  | 'price_asc' 
  | 'price_desc' 
  | 'rating' 
  | 'newest' 
  | 'name_asc' 
  | 'name_desc';

/**
 * Search Result Interface
 */
export interface SearchResult {
  /** Success status */
  success: boolean;
  /** Total number of results */
  total: number;
  /** Search results/products */
  results: ProductSearchResult[];
  /** Facets/aggregations */
  facets?: SearchFacets;
  /** Current page */
  page: number;
  /** Page size */
  pageSize: number;
  /** Total pages */
  totalPages: number;
  /** Query execution time in milliseconds */
  executionTime: number;
  /** Whether results were cached */
  cached?: boolean;
  /** Maximum score */
  maxScore?: number;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Product Search Result Interface
 */
export interface ProductSearchResult {
  /** Product ID */
  id: string;
  /** Product SKU */
  sku: string;
  /** Product name (English) */
  nameEn: string;
  /** Product name (Bengali) */
  nameBn?: string;
  /** Product slug */
  slug: string;
  /** Short description */
  shortDescription?: string;
  /** Description */
  description?: string;
  /** Regular price */
  regularPrice: number;
  /** Sale price */
  salePrice?: number;
  /** Final price (considering sale) */
  finalPrice: number;
  /** Stock quantity */
  stockQuantity: number;
  /** Low stock threshold */
  lowStockThreshold: number;
  /** Product status */
  status: string;
  /** Is featured */
  isFeatured: boolean;
  /** Is new arrival */
  isNewArrival: boolean;
  /** Is best seller */
  isBestSeller: boolean;
  /** Brand */
  brand: {
    id: string;
    name: string;
    slug: string;
  };
  /** Categories */
  categories: CategorySearchResult[];
  /** Primary image */
  primaryImage?: {
    url: string;
    thumbnailUrl?: string;
    altText?: string;
  };
  /** Average rating */
  averageRating?: number;
  /** Review count */
  reviewCount?: number;
  /** Relevance score */
  _score?: number;
}

/**
 * Category Search Result Interface
 */
export interface CategorySearchResult {
  /** Category ID */
  id: string;
  /** Category name */
  name: string;
  /** Category slug */
  slug: string;
  /** Parent category ID */
  parentId?: string;
  /** Level in hierarchy */
  level?: number;
}

/**
 * Search Facets Interface
 */
export interface SearchFacets {
  /** Category facets */
  categories?: CategoryFacet[];
  /** Brand facets */
  brands?: BrandFacet[];
  /** Price range facets */
  priceRanges?: PriceRangeFacet[];
  /** Rating facets */
  ratings?: RatingFacet[];
  /** Specification facets */
  specifications?: SpecificationFacet[];
  /** Stock status facet */
  inStock?: {
    count: number;
  };
}

/**
 * Category Facet Interface
 */
export interface CategoryFacet {
  /** Category ID */
  id: string;
  /** Category name */
  name: string;
  /** Category slug */
  slug: string;
  /** Product count */
  count: number;
  /** Parent category ID */
  parentId?: string;
  /** Level in hierarchy */
  level?: number;
  /** Child categories */
  children?: CategoryFacet[];
}

/**
 * Brand Facet Interface
 */
export interface BrandFacet {
  /** Brand ID */
  id: string;
  /** Brand name */
  name: string;
  /** Brand slug */
  slug: string;
  /** Product count */
  count: number;
  /** Is featured */
  isFeatured?: boolean;
}

/**
 * Price Range Facet Interface
 */
export interface PriceRangeFacet {
  /** Range key */
  key: string;
  /** Range label */
  label: string;
  /** Minimum price */
  min?: number;
  /** Maximum price */
  max?: number;
  /** Product count */
  count: number;
}

/**
 * Rating Facet Interface
 */
export interface RatingFacet {
  /** Minimum rating */
  minRating: number;
  /** Maximum rating */
  maxRating: number;
  /** Product count */
  count: number;
}

/**
 * Specification Facet Interface
 */
export interface SpecificationFacet {
  /** Specification name */
  name: string;
  /** Specification values */
  values: SpecificationValueFacet[];
}

/**
 * Specification Value Facet Interface
 */
export interface SpecificationValueFacet {
  /** Value */
  value: string;
  /** Product count */
  count: number;
}

/**
 * Autocomplete Result Interface
 */
export interface AutocompleteResult {
  /** Success status */
  success: boolean;
  /** Query string */
  query: string;
  /** Product suggestions */
  products?: ProductSuggestion[];
  /** Category suggestions */
  categories?: CategorySuggestion[];
  /** Brand suggestions */
  brands?: BrandSuggestion[];
  /** Popular search suggestions */
  popularSearches?: string[];
  /** Execution time in milliseconds */
  executionTime: number;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Product Suggestion Interface
 */
export interface ProductSuggestion {
  /** Product ID */
  id: string;
  /** Product name (English) */
  nameEn: string;
  /** Product name (Bengali) */
  nameBn?: string;
  /** Product slug */
  slug: string;
  /** Primary image */
  image?: string;
  /** Regular price */
  regularPrice: number;
  /** Sale price */
  salePrice?: number;
  /** Category */
  category?: {
    name: string;
    slug: string;
  };
  /** Brand */
  brand?: {
    name: string;
    slug: string;
  };
  /** Relevance score */
  _score?: number;
}

/**
 * Category Suggestion Interface
 */
export interface CategorySuggestion {
  /** Category ID */
  id: string;
  /** Category name */
  name: string;
  /** Category slug */
  slug: string;
  /** Product count */
  productCount?: number;
  /** Level in hierarchy */
  level?: number;
}

/**
 * Brand Suggestion Interface
 */
export interface BrandSuggestion {
  /** Brand ID */
  id: string;
  /** Brand name */
  name: string;
  /** Brand slug */
  slug: string;
  /** Product count */
  productCount?: number;
  /** Logo URL */
  logoUrl?: string;
}

/**
 * Popular Search Interface
 */
export interface PopularSearch {
  /** Search query */
  query: string;
  /** Search count */
  count: number;
  /** Last searched at */
  lastSearchedAt: Date;
}

/**
 * Suggestion Result Interface
 */
export interface SuggestionResult {
  /** Success status */
  success: boolean;
  /** Query string */
  query: string;
  /** Suggestions */
  suggestions: string[];
  /** Did you mean suggestions */
  didYouMean?: string[];
  /** Related searches */
  relatedSearches?: string[];
  /** Execution time in milliseconds */
  executionTime: number;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Search Analytics Interface
 */
export interface SearchAnalytics {
  /** Search query */
  query: string;
  /** User ID (optional) */
  userId?: string;
  /** Results count */
  resultsCount: number;
  /** Execution time in milliseconds */
  executionTime: number;
  /** Filters applied */
  filters?: Record<string, any>;
  /** Sort option */
  sort?: string;
  /** Page number */
  page?: number;
  /** IP address */
  ipAddress?: string;
  /** User agent */
  userAgent?: string;
  /** Timestamp */
  timestamp: Date;
}

/**
 * Search Cache Key Interface
 */
export interface SearchCacheKey {
  /** Query string */
  query: string;
  /** Category IDs */
  categoryIds?: string[];
  /** Brand IDs */
  brandIds?: string[];
  /** Price range */
  priceRange?: {
    min?: number;
    max?: number;
  };
  /** Specifications */
  specifications?: SpecificationFilter[];
  /** Stock filter */
  inStockOnly?: boolean;
  /** Featured filter */
  featuredOnly?: boolean;
  /** Sort option */
  sort?: SearchSortOption;
  /** Page number */
  page?: number;
  /** Page size */
  pageSize?: number;
  /** Language preference */
  language?: 'en' | 'bn';
}

/**
 * Cache Statistics Interface
 */
export interface CacheStatistics {
  /** Total cache hits */
  hits: number;
  /** Total cache misses */
  misses: number;
  /** Hit rate */
  hitRate: number;
  /** Total cached items */
  totalItems: number;
  /** Cache size in bytes */
  cacheSize: number;
  /** Average cache item size */
  averageItemSize: number;
}

/**
 * Elasticsearch Query Builder Configuration Interface
 */
export interface ElasticsearchQueryBuilderConfig {
  /** Field boosts for multi-field search */
  fieldBoosts: {
    /** Product name (English) boost */
    nameEn: number;
    /** Product name (Bengali) boost */
    nameBn: number;
    /** Description (English) boost */
    descriptionEn: number;
    /** Description (Bengali) boost */
    descriptionBn: number;
    /** Short description boost */
    shortDescription: number;
    /** SKU boost */
    sku: number;
  };
  /** Fuzzy matching configuration */
  fuzzy: {
    /** Fuzziness level (AUTO or number) */
    fuzziness: string | number;
    /** Prefix length for fuzzy matching */
    prefixLength: number;
    /** Maximum expansions */
    maxExpansions: number;
  };
  /** Recency boosting configuration */
  recencyBoost: {
    /** Enable recency boosting */
    enabled: boolean;
    /** Days considered as new */
    newProductDays: number;
    /** Boost factor for new products */
    boostFactor: number;
  };
  /** Popularity boosting configuration */
  popularityBoost: {
    /** Enable popularity boosting */
    enabled: boolean;
    /** Boost factor for best sellers */
    boostFactor: number;
  };
  /** Minimum score threshold */
  minScore: number;
}

/**
 * Elasticsearch Query Interface
 */
export interface ElasticsearchQuery {
  /** Query DSL */
  query: {
    bool?: {
      must?: any[];
      should?: any[];
      filter?: any[];
      must_not?: any[];
      minimum_should_match?: number;
      min_score?: number;
    };
    function_score?: {
      query: any;
      functions: any[];
      score_mode?: string;
      boost_mode?: string;
      min_score?: number;
    };
  };
  /** Sort options */
  sort?: any[];
  /** Pagination */
  from?: number;
  size?: number;
  /** Aggregations */
  aggs?: Record<string, any>;
  /** Timeout */
  timeout?: string;
  /** Request cache */
  request_cache?: boolean;
  /** Track total hits */
  track_total_hits?: boolean;
  /** Track scores */
  track_scores?: boolean;
  /** Minimum score */
  min_score?: number;
  /** Profile query */
  profile?: boolean;
}

/**
 * Search Service Configuration Interface
 */
export interface SearchServiceConfig {
  /** Default page number */
  defaultPage: number;
  /** Default page size */
  defaultPageSize: number;
  /** Maximum page size */
  maxPageSize: number;
  /** Enable caching */
  enableCaching: boolean;
  /** Cache TTL in seconds */
  cacheTTL: number;
  /** Enable search analytics logging */
  enableAnalytics: boolean;
  /** Minimum score threshold */
  minScore: number;
  /** Enable fuzzy matching by default */
  enableFuzzyByDefault: boolean;
  /** Default language */
  defaultLanguage: 'en' | 'bn';
  /** Enable query optimization */
  enableQueryOptimization: boolean;
}

/**
 * Search Error Interface
 */
export interface SearchError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Error details */
  details?: any;
  /** Stack trace */
  stack?: string;
}
