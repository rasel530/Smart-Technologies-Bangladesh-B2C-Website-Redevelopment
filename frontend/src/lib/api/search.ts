/**
 * Search API Library
 * 
 * Provides functions for interacting with the search API endpoints.
 * Features:
 * - Product search with filters
 * - Autocomplete/suggestions
 * - Faceted search results
 */

import { apiClient as client } from './client';

export interface SearchFilters {
  query?: string;
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'name' | 'rating' | 'popularity' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  categoryId?: string | string[];
  brandId?: string | string[];
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  specifications?: string[];
  status?: 'active' | 'inactive' | 'draft' | 'published' | 'archived' | 'out_of_stock' | 'discontinued';
  visibility?: 'public' | 'private' | 'restricted';
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
}

export interface SearchResult {
  products: ProductSearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  metadata: {
    query: string;
    executionTime: number;
    searchEngine: string;
  };
}

export interface ProductSearchResult {
  id: string;
  sku: string;
  name: string;
  nameEn: string;
  nameBn?: string;
  slug: string;
  shortDescription?: string;
  basePrice: number;
  discountPrice?: number;
  salePrice?: number;
  thumbnail?: string;
  rating?: number;
  reviewCount: number;
  inStock: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  categoryId?: string;
  categoryName?: string;
  categoryNameEn?: string;
  categoryNameBn?: string;
  brandId?: string;
  brandName?: string;
  brandNameEn?: string;
  brandNameBn?: string;
}

export interface SearchSuggestion {
  id: string;
  nameEn: string;
  nameBn?: string;
  slug: string;
  thumbnail?: string;
  categoryId?: string;
  categoryNameEn?: string;
  categoryNameBn?: string;
}

export interface SearchFacets {
  categories: FacetItem[];
  brands: FacetItem[];
  priceRanges: PriceRangeFacet[];
  statusFlags: StatusFlagFacet[];
}

export interface FacetItem {
  id: string;
  count: number;
  name: string;
  nameEn?: string;
}

export interface PriceRangeFacet {
  key: string;
  count: number;
  from?: number;
  to?: number;
}

export interface StatusFlagFacet {
  key: string;
  count: number;
}

/**
 * Search products with filters
 */
export async function search(filters: SearchFilters = {}): Promise<SearchResult> {
  const params = new URLSearchParams();
  
  if (filters.query) params.set('search', filters.query);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
  
  // Handle categoryId (single value or array)
  if (filters.categoryId) {
    if (Array.isArray(filters.categoryId)) {
      params.delete('categoryId');
      filters.categoryId.forEach(id => params.append('categoryId', id));
    } else {
      params.set('categoryId', filters.categoryId);
    }
  }
  
  // Handle brandId (single value or array)
  if (filters.brandId) {
    if (Array.isArray(filters.brandId)) {
      params.delete('brandId');
      filters.brandId.forEach(id => params.append('brandId', id));
    } else {
      params.set('brandId', filters.brandId);
    }
  }
  
  if (filters.minPrice !== undefined) params.set('priceMin', String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set('priceMax', String(filters.maxPrice));
  if (filters.rating !== undefined) params.set('rating', String(filters.rating));
  
  // Handle specifications (array)
  if (filters.specifications && filters.specifications.length > 0) {
    params.delete('specification');
    filters.specifications.forEach(spec => params.append('specification', spec));
  }
  
  if (filters.status) params.set('status', filters.status);
  if (filters.visibility) params.set('visibility', filters.visibility);
  if (filters.isFeatured !== undefined) params.set('isFeatured', String(filters.isFeatured));
  if (filters.isNewArrival !== undefined) params.set('isNewArrival', String(filters.isNewArrival));
  if (filters.isBestSeller !== undefined) params.set('isBestSeller', String(filters.isBestSeller));

  return client.get<SearchResult>(`/products?${params.toString()}`);
}

/**
 * Get search autocomplete suggestions
 */
export async function searchSuggestions(
  query: string,
  limit: number = 10
): Promise<{ suggestions: SearchSuggestion[]; count: number; query: string }> {
  if (!query || query.trim().length < 2) {
    return { suggestions: [], count: 0, query };
  }

  const params = new URLSearchParams({
    search: query,
    limit: String(limit),
    page: '1'
  });

  try {
    // Use the products endpoint for search suggestions
    const response = await client.get<{ products: any[]; pagination: any }>(`/products?${params.toString()}`);
    
    const suggestions: SearchSuggestion[] = (response.products || []).map((product: any) => ({
      id: product.id,
      nameEn: product.nameEn || product.name,
      nameBn: product.nameBn,
      slug: product.slug,
      thumbnail: product.images?.[0]?.url || product.thumbnail,
      categoryId: product.categories?.[0]?.category?.id,
      categoryNameEn: product.categories?.[0]?.category?.name,
      categoryNameBn: product.categories?.[0]?.category?.nameBn
    }));

    return {
      suggestions,
      count: suggestions.length,
      query
    };
  } catch (error) {
    console.error('Search suggestions error:', error);
    return { suggestions: [], count: 0, query };
  }
}

/**
 * Get search facets for filtering
 * Note: This function returns empty facets as the products endpoint doesn't provide facets
 */
export async function searchFacets(
  query?: string
): Promise<{ facets: SearchFacets; query: string }> {
  // Return empty facets - the products endpoint doesn't support faceted search
  return {
    facets: {
      categories: [],
      brands: [],
      priceRanges: [],
      statusFlags: []
    },
    query: query || ''
  };
}

export default {
  search,
  searchSuggestions,
  searchFacets
};
