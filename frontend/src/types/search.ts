/**
 * Search-Related Type Definitions
 * 
 * This file contains all TypeScript interfaces and types related to search functionality
 * including filters, sorting, and pagination.
 */

/**
 * Re-export SearchFilters from product types for convenience
 */
export type { SearchFilters } from './product';

/**
 * Sort Options Interface
 */
export interface SortOptions {
  sortBy?: 'price' | 'name' | 'createdAt' | 'stockQuantity' | 'name' | 'sortOrder';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pagination Options Interface
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

/**
 * Pagination Result Interface
 */
export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/**
 * Generic Search Response Interface
 */
export interface SearchResponse<T> {
  data: T[];
  pagination: PaginationResult;
}

/**
 * Advanced Search Filters Interface
 */
export interface AdvancedSearchFilters extends PaginationOptions, SortOptions {
  // Text search
  search?: string;
  
  // Category filters
  category?: string;
  categories?: string[];
  
  // Brand filters
  brand?: string;
  brands?: string[];
  
  // Price range
  minPrice?: number;
  maxPrice?: number;
  
  // Status filters
  status?: string;
  statuses?: string[];
  
  // Feature flags
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  
  // Stock status
  inStock?: boolean;
  lowStock?: boolean;
  outOfStock?: boolean;
}

/**
 * Search Suggestion Interface
 */
export interface SearchSuggestion {
  id: string;
  type: 'product' | 'category' | 'brand';
  name: string;
  slug: string;
  imageUrl?: string;
  category?: string;
  brand?: string;
  price?: number;
}

/**
 * Search History Interface
 */
export interface SearchHistory {
  id: string;
  query: string;
  timestamp: Date;
  resultCount?: number;
}

/**
 * Facet Filter Interface
 */
export interface FacetFilter {
  name: string;
  label: string;
  type: 'checkbox' | 'radio' | 'range';
  options: FacetOption[];
  selected: string[];
}

/**
 * Facet Option Interface
 */
export interface FacetOption {
  value: string;
  label: string;
  count: number;
}

/**
 * Applied Filters Interface
 */
export interface AppliedFilters {
  categories?: string[];
  brands?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  features?: Record<string, string[]>;
}
