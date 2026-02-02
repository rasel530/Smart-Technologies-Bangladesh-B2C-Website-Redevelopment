/**
 * Brand API Client
 * 
 * This file contains all API client functions for brand-related operations.
 * All functions are type-safe with proper error handling.
 */

import apiClient from './client';
import {
  Brand,
  BrandWithRelations,
  CreateBrandRequest,
  UpdateBrandRequest,
  BrandListFilter,
  BrandListResponse,
  FeaturedBrandsResponse,
  BrandStatusUpdateRequest,
  BrandFeaturedUpdateRequest,
  FeaturedBrandReorderRequest,
  BrandProductFilter,
  BrandProductListResponse,
  BrandSEO
} from '@/types/brand';

/**
 * Build query string from filters object
 */
const buildQueryString = (filters: Record<string, any>): string => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  
  return params.toString();
};

/**
 * Get all brands with pagination, filtering, and sorting
 * 
 * @param params - Brand list filters including pagination, status, and search options
 * @returns Promise with brand list response containing brands and pagination info
 */
export const getBrands = async (params: BrandListFilter = {}): Promise<BrandListResponse> => {
  try {
    const queryString = buildQueryString(params);
    const endpoint = `/brands${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get<BrandListResponse>(endpoint) as unknown as BrandListResponse;
    
    return {
      brands: response.brands || [],
      pagination: response.pagination || {
        page: 1,
        limit: 50,
        total: 0,
        pages: 0
      }
    };
  } catch (error) {
    console.error('Error fetching brands:', error);
    throw error;
  }
};

/**
 * Get featured brands
 * 
 * @returns Promise with featured brands response
 */
export const getFeaturedBrands = async (): Promise<FeaturedBrandsResponse> => {
  try {
    const response = await apiClient.get<FeaturedBrandsResponse>('/brands/featured') as unknown as FeaturedBrandsResponse;
    return {
      brands: response.brands || [],
      total: response.total || 0
    };
  } catch (error) {
    console.error('Error fetching featured brands:', error);
    throw error;
  }
};

/**
 * Get brand by ID with full details
 * 
 * @param id - Brand ID
 * @returns Promise with brand details
 */
export const getBrandById = async (id: string): Promise<BrandWithRelations> => {
  try {
    const response = await apiClient.get<{ brand: BrandWithRelations }>(`/brands/${id}`) as unknown as { brand: BrandWithRelations };
    return response.brand!;
  } catch (error) {
    console.error(`Error fetching brand ${id}:`, error);
    throw error;
  }
};

/**
 * Get brand by slug
 * 
 * @param slug - Brand slug
 * @returns Promise with brand details
 */
export const getBrandBySlug = async (slug: string): Promise<BrandWithRelations> => {
  try {
    const response = await apiClient.get<{ brand: BrandWithRelations }>(`/brands/slug/${slug}`) as unknown as { brand: BrandWithRelations };
    return response.brand!;
  } catch (error) {
    console.error(`Error fetching brand with slug ${slug}:`, error);
    throw error;
  }
};

/**
 * Create a new brand (admin only)
 * 
 * @param data - Brand creation data
 * @returns Promise with created brand
 */
export const createBrand = async (data: CreateBrandRequest): Promise<Brand> => {
  try {
    const response = await apiClient.post<{ brand: Brand }>(
      '/brands',
      data
    ) as unknown as { brand: Brand };
    return response.brand!;
  } catch (error) {
    console.error('Error creating brand:', error);
    throw error;
  }
};

/**
 * Update an existing brand (admin only)
 * 
 * @param id - Brand ID
 * @param data - Partial brand update data
 * @returns Promise with updated brand
 */
export const updateBrand = async (
  id: string,
  data: Partial<UpdateBrandRequest>
): Promise<Brand> => {
  try {
    const response = await apiClient.put<{ brand: Brand }>(
      `/brands/${id}`,
      data
    ) as unknown as { brand: Brand };
    return response.brand!;
  } catch (error) {
    console.error(`Error updating brand ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a brand (admin only)
 * 
 * @param id - Brand ID
 * @returns Promise with success message
 */
export const deleteBrand = async (id: string): Promise<void> => {
  try {
    await apiClient.delete<{ message: string }>(`/brands/${id}`);
  } catch (error) {
    console.error(`Error deleting brand ${id}:`, error);
    throw error;
  }
};

/**
 * Update brand status (admin only)
 * 
 * @param id - Brand ID
 * @param status - New brand status
 * @returns Promise with updated brand
 */
export const updateBrandStatus = async (
  id: string,
  status: 'active' | 'inactive'
): Promise<Brand> => {
  try {
    const response = await apiClient.patch<{ brand: Brand }>(
      `/brands/${id}/status`,
      { status }
    ) as unknown as { brand: Brand };
    return response.brand!;
  } catch (error) {
    console.error(`Error updating status for brand ${id}:`, error);
    throw error;
  }
};

/**
 * Toggle brand featured status (admin only)
 * 
 * @param id - Brand ID
 * @param isFeatured - Featured status
 * @param featuredOrder - Optional featured order
 * @returns Promise with updated brand
 */
export const toggleBrandFeatured = async (
  id: string,
  isFeatured: boolean,
  featuredOrder?: number
): Promise<Brand> => {
  try {
    const data: BrandFeaturedUpdateRequest = { isFeatured };
    if (featuredOrder !== undefined) {
      data.featuredOrder = featuredOrder;
    }
    
    const response = await apiClient.patch<{ brand: Brand }>(
      `/brands/${id}/featured`,
      data
    ) as unknown as { brand: Brand };
    return response.brand!;
  } catch (error) {
    console.error(`Error toggling featured status for brand ${id}:`, error);
    throw error;
  }
};

/**
 * Reorder featured brands (admin only)
 * 
 * @param orders - Array of brand IDs with their new featured order
 * @returns Promise with updated brands
 */
export const reorderFeaturedBrands = async (
  orders: FeaturedBrandReorderRequest
): Promise<Brand[]> => {
  try {
    const response = await apiClient.patch<{ brands: Brand[] }>(
      '/brands/featured-reorder',
      orders
    ) as unknown as { brands: Brand[] };
    return response.brands || [];
  } catch (error) {
    console.error('Error reordering featured brands:', error);
    throw error;
  }
};

/**
 * Get products by brand
 * 
 * @param id - Brand ID
 * @param params - Product list filters
 * @returns Promise with brand product list response
 */
export const getBrandProducts = async (
  id: string,
  params: BrandProductFilter = {}
): Promise<BrandProductListResponse> => {
  try {
    const queryString = buildQueryString(params);
    const endpoint = `/brands/${id}/products${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get<BrandProductListResponse>(endpoint) as unknown as BrandProductListResponse;
    
    return {
      brand: response.brand || {
        id: '',
        name: '',
        slug: '',
        logoUrl: null
      },
      products: response.products || [],
      pagination: response.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      }
    };
  } catch (error) {
    console.error(`Error fetching products for brand ${id}:`, error);
    throw error;
  }
};

/**
 * Upload brand logo (admin only)
 * 
 * @param id - Brand ID
 * @param file - Logo file to upload
 * @returns Promise with updated brand
 */
export const uploadBrandLogo = async (
  id: string,
  file: File
): Promise<Brand> => {
  try {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await apiClient.post<{ brand: Brand }>(
      `/brands/${id}/logo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000 // 60 second timeout for brand logo upload
      }
    ) as unknown as { brand: Brand };
    return response.brand!;
  } catch (error) {
    console.error(`Error uploading logo for brand ${id}:`, error);
    throw error;
  }
};

/**
 * Delete brand logo (admin only)
 * 
 * @param id - Brand ID
 * @returns Promise with updated brand
 */
export const deleteBrandLogo = async (id: string): Promise<Brand> => {
  try {
    const response = await apiClient.delete<{ brand: Brand }>(`/brands/${id}/logo`) as unknown as { brand: Brand };
    return response.brand!;
  } catch (error) {
    console.error(`Error deleting logo for brand ${id}:`, error);
    throw error;
  }
};

/**
 * Update brand SEO fields (admin only)
 * 
 * @param id - Brand ID
 * @param data - SEO data
 * @returns Promise with updated brand
 */
export const updateBrandSEO = async (
  id: string,
  data: BrandSEO
): Promise<Brand> => {
  try {
    const response = await apiClient.patch<{ brand: Brand }>(
      `/brands/${id}/seo`,
      data
    ) as unknown as { brand: Brand };
    return response.brand!;
  } catch (error) {
    console.error(`Error updating SEO for brand ${id}:`, error);
    throw error;
  }
};

// Export all functions as a named object for convenience
const brandsApi = {
  getBrands,
  getFeaturedBrands,
  getBrandById,
  getBrandBySlug,
  createBrand,
  updateBrand,
  deleteBrand,
  updateBrandStatus,
  toggleBrandFeatured,
  reorderFeaturedBrands,
  getBrandProducts,
  uploadBrandLogo,
  deleteBrandLogo,
  updateBrandSEO
};

export default brandsApi;
