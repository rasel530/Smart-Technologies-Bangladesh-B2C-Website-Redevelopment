/**
 * Server-Side API Client
 * 
 * This file contains API client functions specifically for Server Components.
 * These functions make direct HTTP requests to the backend without relying on
 * client-side features like localStorage.
 */

import { BrandWithRelations } from '@/types/brand';
import { CategoryDetailResponse } from '@/types/category';

const API_BASE_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001/api/v1';

/**
 * Generic fetch wrapper for server-side requests
 */
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log('[Server API] Making request:', {
    method: options.method || 'GET',
    url,
    API_BASE_URL,
  });

  let response: Response;
  
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      cache: 'no-store', // Disable caching for server components
    });
  } catch (fetchError) {
    // Handle network-level errors (ECONNREFUSED, ENOTFOUND, etc.)
    console.error('[Server API] Network error occurred:', {
      url,
      API_BASE_URL,
      error: fetchError instanceof Error ? fetchError.message : String(fetchError),
      errorName: fetchError instanceof Error ? fetchError.name : 'Unknown',
    });
    
    // Provide more specific error messages for common network issues
    const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND')) {
      throw new Error(`Backend API is not accessible at ${API_BASE_URL}. Please ensure the backend server is running.`);
    }
    
    throw new Error(`Network error while connecting to backend API: ${errorMessage}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Server API] Request failed:', {
      url,
      status: response.status,
      statusText: response.statusText,
      error: errorText,
    });
    
    // Provide more specific error messages based on status code
    let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
    
    if (response.status === 404) {
      errorMessage = `Resource not found: ${endpoint}`;
    } else if (response.status === 500) {
      errorMessage = `Internal server error at backend API: ${errorText}`;
    } else if (response.status === 503) {
      errorMessage = `Backend API service unavailable: ${errorText}`;
    } else if (errorText && errorText.trim().length > 0) {
      errorMessage = `API error (${response.status}): ${errorText}`;
    }
    
    throw new Error(errorMessage);
  }

  const data = await response.json();
  console.log('[Server API] Response received:', {
    url,
    status: response.status,
  });

  return data as T;
}

// ============================================
// BRAND API FUNCTIONS (Server-Side)
// ============================================

/**
 * Get brand by slug (Server-Side)
 * 
 * @param slug - Brand slug
 * @returns Promise with brand details
 */
export async function getBrandBySlugServer(slug: string): Promise<BrandWithRelations> {
  console.log(`[Server API] Fetching brand by slug: "${slug}"`);
  
  try {
    const response = await fetchAPI<{ brand: BrandWithRelations }>(`/brands/slug/${slug}`);
    
    if (!response.brand) {
      console.error(`[Server API] Brand not found for slug: "${slug}"`);
      throw new Error(`Brand with slug "${slug}" not found in database`);
    }
    
    console.log(`[Server API] Brand found: "${response.brand.name}" (ID: ${response.brand.id})`);
    return response.brand;
  } catch (error) {
    console.error(`[Server API] Error fetching brand with slug "${slug}":`, {
      error: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

/**
 * Get brand products (Server-Side)
 * 
 * @param id - Brand ID
 * @param params - Query parameters
 * @returns Promise with brand products
 */
export async function getBrandProductsServer(
  id: string,
  params: {
    page?: number;
    limit?: number;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: string;
  } = {}
): Promise<{
  brand: { id: string; name: string; slug: string; logoUrl: string | null };
  products: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> {
  console.log(`[Server API] Fetching products for brand ID: "${id}"`, params);
  
  try {
    const queryString = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, String(value));
      }
    });

    const endpoint = `/brands/${id}/products${queryString.toString() ? `?${queryString.toString()}` : ''}`;
    const result = await fetchAPI<{
      brand: { id: string; name: string; slug: string; logoUrl: string | null };
      products: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(endpoint);
    
    console.log(`[Server API] Products fetched for brand "${id}":`, {
      productCount: result.products?.length || 0,
      pagination: result.pagination,
    });
    
    return result;
  } catch (error) {
    console.error(`[Server API] Error fetching products for brand "${id}":`, {
      error: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      params,
    });
    throw error;
  }
}

// ============================================
// CATEGORY API FUNCTIONS (Server-Side)
// ============================================

/**
 * Get category by slug (Server-Side)
 * 
 * @param slug - Category slug
 * @returns Promise with category details and path
 */
export async function getCategoryBySlugServer(slug: string): Promise<CategoryDetailResponse> {
  try {
    const response = await fetchAPI<CategoryDetailResponse>(`/categories/slug/${slug}`);
    
    if (!response.category) {
      throw new Error('Category not found');
    }
    
    return response;
  } catch (error) {
    console.error(`[Server API] Error fetching category with slug ${slug}:`, error);
    throw error;
  }
}

/**
 * Get all categories (Server-Side)
 * 
 * @param params - Query parameters
 * @returns Promise with categories
 */
export async function getCategoriesServer(params: {
  status?: string;
  tree?: boolean;
} = {}): Promise<{ categories: any[] }> {
  try {
    const queryString = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, String(value));
      }
    });

    const endpoint = `/categories${queryString.toString() ? `?${queryString.toString()}` : ''}`;
    return await fetchAPI(endpoint);
  } catch (error) {
    console.error('[Server API] Error fetching categories:', error);
    throw error;
  }
}

/**
 * Get category products (Server-Side)
 * 
 * @param id - Category ID
 * @param params - Query parameters
 * @returns Promise with category products
 */
export async function getCategoryProductsServer(
  id: string,
  params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    brandId?: string;
    minPrice?: number;
    maxPrice?: number;
    visibility?: string;
  } = {}
): Promise<{
  category: { id: string; name: string; slug: string; imageUrl?: string };
  products: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> {
  try {
    const queryString = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, String(value));
      }
    });

    const endpoint = `/categories/${id}/products${queryString.toString() ? `?${queryString.toString()}` : ''}`;
    return await fetchAPI(endpoint);
  } catch (error) {
    console.error(`[Server API] Error fetching products for category ${id}:`, error);
    throw error;
  }
}

/**
  * Get brands (Server-Side)
  * 
  * @param params - Query parameters
  * @returns Promise with brands
  */
export async function getBrandsServer(params: {
  status?: string;
} = {}): Promise<{ brands: any[] }> {
  try {
    const queryString = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, String(value));
      }
    });

    const endpoint = `/brands${queryString.toString() ? `?${queryString.toString()}` : ''}`;
    return await fetchAPI(endpoint);
  } catch (error) {
    console.error('[Server API] Error fetching brands:', error);
    throw error;
  }
}

// ============================================
// SEARCH API FUNCTIONS (Server-Side)
// ============================================

/**
  * Search products with filters (Server-Side)
  * 
  * @param filters - Search filters
  * @returns Promise with search results
  */
export async function searchServer(filters: {
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
} = {}): Promise<{
  products: any[];
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
}> {
  try {
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

    const endpoint = `/products${params.toString() ? `?${params.toString()}` : ''}`;
    return await fetchAPI(endpoint);
  } catch (error) {
    console.error('[Server API] Error searching products:', error);
    throw error;
  }
}

// ============================================
// SEARCH ANALYTICS FUNCTIONS (Server-Side)
// ============================================

/**
 * Track search event server-side
 * 
 * @param data - Search tracking data
 * @returns Promise<void>
 */
export async function trackSearchServer(data: {
  query: string;
  resultsCount: number;
  userId?: string;
  filters?: any;
}): Promise<void> {
  try {
    // Server-side tracking implementation
    // Log to server-side analytics or send to backend
    console.log('[Server] Search tracked:', data);
    
    // Optionally send to backend analytics endpoint
    // const response = await fetch(`${API_BASE_URL}/api/v1/analytics/search`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data)
    // });
  } catch (error) {
    console.error('[Server] Failed to track search:', error);
    // Don't throw - tracking failures shouldn't break the app
  }
}

/**
 * Get trending searches server-side
 * 
 * @returns Promise with trending searches array
 */
export async function getTrendingSearchesServer(): Promise<string[]> {
  try {
    // Server-side trending searches implementation
    // Could fetch from backend analytics or cache
    console.log('[Server] Fetching trending searches');
    
    // For now, return empty array or mock data
    // In production, this would fetch from backend
    return [];
  } catch (error) {
    console.error('[Server] Failed to fetch trending searches:', error);
    return [];
  }
}

/**
 * Get personalized suggestions server-side
 * 
 * @param userId - Optional user ID for personalization
 * @returns Promise with personalized suggestions array
 */
export async function getPersonalizedSuggestionsServer(userId?: string): Promise<string[]> {
  try {
    // Server-side personalized suggestions implementation
    console.log('[Server] Fetching personalized suggestions for user:', userId);
    
    // For now, return empty array or mock data
    // In production, this would fetch from backend based on user history
    return [];
  } catch (error) {
    console.error('[Server] Failed to fetch personalized suggestions:', error);
    return [];
  }
}
