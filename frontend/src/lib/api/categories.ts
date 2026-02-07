/**
 * Category API Client
 * 
 * This file contains all API client functions for category-related operations.
 * All functions are type-safe with proper error handling.
 */

import apiClient from './client';
import {
  Category,
  CategoryTree,
  CategoryPath,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategorySEO,
  CategoryListResponse,
  CategoryTreeResponse,
  CategoryDetailResponse,
  CategoryProductsResponse,
  CategoryReorderRequest,
  CategoryMoveRequest
} from '@/types/category';

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

// ============================================
// CATEGORY CRUD FUNCTIONS
// ============================================

/**
 * Get all categories with pagination and filtering
 * 
 * @param filters - Search filters including pagination, status, parentId
 * @returns Promise with categories and pagination info
 */
export const getCategories = async (
  filters: {
    page?: number;
    limit?: number;
    status?: 'active' | 'inactive';
    parentId?: string;
    tree?: boolean;
    includeProducts?: boolean;
  } = {}
): Promise<CategoryListResponse> => {
  try {
    const queryString = buildQueryString(filters);
    const endpoint = `/categories${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get<CategoryListResponse>(endpoint) as unknown as CategoryListResponse;
    
    return response || { categories: [] };
  } catch (error) {
    throw error;
  }
};

/**
 * Get category by ID with details
 * 
 * @param id - Category ID
 * @returns Promise with category details and path
 */
export const getCategoryById = async (id: string): Promise<CategoryDetailResponse> => {
  try {
    const response = await apiClient.get<CategoryDetailResponse>(`/categories/${id}`);
    return (response as unknown as CategoryDetailResponse) || { category: null as any, path: [] };
  } catch (error) {
    console.error(`Error fetching category ${id}:`, error);
    throw error;
  }
};

/**
 * Get category by slug
 * 
 * @param slug - Category slug
 * @returns Promise with category details and path
 */
export const getCategoryBySlug = async (slug: string): Promise<CategoryDetailResponse> => {
  try {
    const response = await apiClient.get<CategoryDetailResponse>(`/categories/slug/${slug}`);
    return (response as unknown as CategoryDetailResponse) || { category: null as any, path: [] };
  } catch (error) {
    console.error(`Error fetching category with slug ${slug}:`, error);
    throw error;
  }
};

/**
 * Create a new category (admin only)
 * 
 * @param data - Category creation data
 * @returns Promise with created category
 */
export const createCategory = async (data: CreateCategoryRequest): Promise<Category> => {
  try {
    const response = await apiClient.post<{ category: Category }>(
      '/categories',
      data
    );
    return (response as unknown as { category: Category })?.category;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

/**
 * Update an existing category (admin only)
 * 
 * @param id - Category ID
 * @param data - Partial category update data
 * @returns Promise with updated category
 */
export const updateCategory = async (
  id: string,
  data: Partial<UpdateCategoryRequest>
): Promise<Category> => {
  try {
    const response = await apiClient.put<{ category: Category }>(
      `/categories/${id}`,
      data
    );
    return (response as unknown as { category: Category })?.category;
  } catch (error) {
    console.error(`Error updating category ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a category (admin only)
 * 
 * @param id - Category ID
 * @returns Promise with success message
 */
export const deleteCategory = async (id: string): Promise<void> => {
  try {
    await apiClient.delete<{ message: string }>(`/categories/${id}`);
  } catch (error) {
    console.error(`Error deleting category ${id}:`, error);
    throw error;
  }
};

// ============================================
// CATEGORY HIERARCHY MANAGEMENT FUNCTIONS
// ============================================

/**
 * Get category tree structure
 * 
 * @param status - Optional status filter
 * @returns Promise with category tree
 */
export const getCategoryTree = async (status?: 'active' | 'inactive'): Promise<CategoryTreeResponse> => {
  try {
    const filters: any = {};
    if (status) filters.status = status;
    
    const queryString = buildQueryString(filters);
    const endpoint = `/categories/tree${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get<CategoryTreeResponse>(endpoint) as unknown as CategoryTreeResponse;
    
    return response || { tree: [], total: 0 };
  } catch (error) {
    throw error;
  }
};

/**
 * Create subcategory
 * 
 * @param parentId - Parent category ID
 * @param data - Subcategory creation data
 * @returns Promise with created subcategory
 */
export const createSubcategory = async (
  parentId: string,
  data: Omit<CreateCategoryRequest, 'parentId'>
): Promise<Category> => {
  try {
    const response = await apiClient.post<{ subcategory: Category }>(
      `/categories/${parentId}/subcategories`,
      data
    );
    return (response as unknown as { subcategory: Category })?.subcategory;
  } catch (error) {
    console.error(`Error creating subcategory for ${parentId}:`, error);
    throw error;
  }
};

/**
 * Move category to new parent
 * 
 * @param id - Category ID
 * @param data - Move request with optional new parent ID
 * @returns Promise with updated category
 */
export const moveCategory = async (
  id: string,
  data: CategoryMoveRequest
): Promise<Category> => {
  try {
    const response = await apiClient.put<{ category: Category }>(
      `/categories/${id}/move`,
      data
    );
    return (response as unknown as { category: Category })?.category;
  } catch (error) {
    console.error(`Error moving category ${id}:`, error);
    throw error;
  }
};

// ============================================
// CATEGORY REORDERING FUNCTIONS
// ============================================

/**
 * Reorder category (update display order)
 * 
 * @param id - Category ID
 * @param displayOrder - New display order
 * @returns Promise with updated category
 */
export const reorderCategory = async (
  id: string,
  displayOrder: number
): Promise<Category> => {
  try {
    const response = await apiClient.patch<{ category: Category }>(
      `/categories/${id}/reorder`,
      { displayOrder }
    );
    return (response as unknown as { category: Category })?.category;
  } catch (error) {
    console.error(`Error reordering category ${id}:`, error);
    throw error;
  }
};

/**
 * Batch reorder categories
 * 
 * @param orders - Array of category reorder requests
 * @returns Promise with updated categories
 */
export const reorderCategoriesBatch = async (
  orders: CategoryReorderRequest[]
): Promise<Category[]> => {
  try {
    const response = await apiClient.patch<{ categories: Category[] }>(
      '/categories/reorder-batch',
      { orders }
    );
    return (response as unknown as { categories: Category[] })?.categories || [];
  } catch (error) {
    console.error('Error batch reordering categories:', error);
    throw error;
  }
};

// ============================================
// CATEGORY PRODUCT LISTING FUNCTION
// ============================================

/**
 * Get products in category
 * 
 * @param id - Category ID
 * @param params - Optional filters and pagination
 * @returns Promise with products and pagination info
 */
export const getCategoryProducts = async (
  id: string,
  params: {
    page?: number;
    limit?: number;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'price' | 'name' | 'createdAt' | 'rating';
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<CategoryProductsResponse> => {
  try {
    const queryString = buildQueryString(params);
    const endpoint = `/categories/${id}/products${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get<CategoryProductsResponse>(endpoint);
    return (response as unknown as CategoryProductsResponse) || { category: null as any, products: [], pagination: {} as any };
  } catch (error) {
    console.error(`Error fetching products for category ${id}:`, error);
    throw error;
  }
};

// ============================================
// CATEGORY IMAGE/ICON UPLOAD FUNCTIONS
// ============================================

/**
 * Upload category image
 * 
 * @param id - Category ID
 * @param file - Image file
 * @returns Promise with updated category
 */
export const uploadCategoryImage = async (
  id: string,
  file: File
): Promise<Category> => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    // Note: Do not set Content-Type header manually for FormData
    // The browser will automatically set it with the correct boundary
    const response = await apiClient.post<{ category: Category }>(
      `/categories/${id}/image`,
      formData,
      {
        timeout: 60000 // 60 second timeout for category image upload
      }
    );
    return (response as unknown as { category: Category })?.category;
  } catch (error) {
    console.error(`Error uploading image for category ${id}:`, error);
    throw error;
  }
};

/**
 * Upload category icon
 * 
 * @param id - Category ID
 * @param file - Icon file
 * @returns Promise with updated category
 */
export const uploadCategoryIcon = async (
  id: string,
  file: File
): Promise<Category> => {
  try {
    const formData = new FormData();
    formData.append('icon', file);

    // Note: Do not set Content-Type header manually for FormData
    // The browser will automatically set it with the correct boundary
    const response = await apiClient.post<{ category: Category }>(
      `/categories/${id}/icon`,
      formData,
      {
        timeout: 60000 // 60 second timeout for category icon upload
      }
    );
    return (response as unknown as { category: Category })?.category;
  } catch (error) {
    console.error(`Error uploading icon for category ${id}:`, error);
    throw error;
  }
};

/**
 * Delete category image
 * 
 * @param id - Category ID
 * @returns Promise with updated category
 */
export const deleteCategoryImage = async (id: string): Promise<Category> => {
  try {
    const response = await apiClient.delete<{ category: Category }>(`/categories/${id}/image`);
    return (response as unknown as { category: Category })?.category;
  } catch (error) {
    console.error(`Error deleting image for category ${id}:`, error);
    throw error;
  }
};

/**
 * Delete category icon
 * 
 * @param id - Category ID
 * @returns Promise with updated category
 */
export const deleteCategoryIcon = async (id: string): Promise<Category> => {
  try {
    const response = await apiClient.delete<{ category: Category }>(`/categories/${id}/icon`);
    return (response as unknown as { category: Category })?.category;
  } catch (error) {
    console.error(`Error deleting icon for category ${id}:`, error);
    throw error;
  }
};

// ============================================
// CATEGORY SEO MANAGEMENT FUNCTION
// ============================================

/**
 * Update category SEO fields
 * 
 * @param id - Category ID
 * @param data - SEO data
 * @returns Promise with updated category
 */
export const updateCategorySEO = async (
  id: string,
  data: CategorySEO
): Promise<Category> => {
  try {
    const response = await apiClient.patch<{ category: Category }>(
      `/categories/${id}/seo`,
      data
    );
    return (response as unknown as { category: Category })?.category;
  } catch (error) {
    console.error(`Error updating SEO for category ${id}:`, error);
    throw error;
  }
};

  // ============================================
  // CATEGORY STATISTICS FUNCTIONS
  // ============================================

  /**
   * Get category statistics
   * 
   * @returns Promise with category statistics
   */
  export const getCategoryStats = async (): Promise<{
  total: number;
  active: number;
  inactive: number;
}> => {
  try {
    const endpoint = '/categories/stats';
    
    const response = await apiClient.get<{
      total: number;
      active: number;
      inactive: number;
    }>(endpoint) as unknown as { total: number; active: number; inactive: number };
    
    return response || { total: 0, active: 0, inactive: 0 };
  } catch (error) {
    throw error;
  }
};

  // Export all functions as a named object for convenience
  const categoriesApi = {
    getCategories,
    getCategoryById,
    getCategoryBySlug,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryTree,
    createSubcategory,
    moveCategory,
    reorderCategory,
    reorderCategoriesBatch,
    getCategoryProducts,
    uploadCategoryImage,
    uploadCategoryIcon,
    deleteCategoryImage,
    deleteCategoryIcon,
    updateCategorySEO,
    getCategoryStats
  };

  export default categoriesApi;
