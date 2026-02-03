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
  });

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    cache: 'no-store', // Disable caching for server components
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Server API] Request failed:', {
      url,
      status: response.status,
      statusText: response.statusText,
      error: errorText,
    });
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
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
  try {
    const response = await fetchAPI<{ brand: BrandWithRelations }>(`/brands/slug/${slug}`);
    
    if (!response.brand) {
      throw new Error('Brand not found');
    }
    
    return response.brand;
  } catch (error) {
    console.error(`[Server API] Error fetching brand with slug ${slug}:`, error);
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
  try {
    const queryString = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, String(value));
      }
    });

    const endpoint = `/brands/${id}/products${queryString.toString() ? `?${queryString.toString()}` : ''}`;
    return await fetchAPI(endpoint);
  } catch (error) {
    console.error(`[Server API] Error fetching products for brand ${id}:`, error);
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
