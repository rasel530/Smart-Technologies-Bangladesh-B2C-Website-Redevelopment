/**
 * Comparison API Client
 *
 * This file contains all API client functions for comparison operations.
 * All functions are type-safe with proper error handling.
 */

import apiClient from './client';
import {
  Comparison,
  ComparisonWithProducts,
  ComparisonData,
  ComparisonListResponse,
  CreateComparisonRequest,
  UpdateComparisonRequest,
  AddProductToComparisonRequest,
  ShareComparisonRequest,
  ShareComparisonResponse,
  ExportComparisonRequest,
  ExportComparisonResponse,
  GuestComparisonRequest,
  GuestComparison,
  MergeGuestComparisonRequest,
  ComparisonFilters,
} from '@/types/comparison';

/**
 * Get all comparisons for the current user
 *
 * @param filters - Optional filters for comparison list
 * @returns Promise with comparison list response
 */
export const getComparisons = async (
  filters?: ComparisonFilters
): Promise<ComparisonListResponse> => {
  try {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    }

    const queryString = params.toString();
    const endpoint = `/comparisons${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get<ComparisonListResponse>(endpoint);
    return response;
  } catch (error) {
    console.error('Error fetching comparisons:', error);
    throw error;
  }
};

/**
 * Get a specific comparison by ID
 *
 * @param id - Comparison ID
 * @returns Promise with comparison details
 */
export const getComparison = async (id: string): Promise<ComparisonWithProducts> => {
  try {
    const response = await apiClient.get<{ comparison: ComparisonWithProducts }>(
      `/comparisons/${id}`
    );
    return response.comparison;
  } catch (error) {
    console.error(`Error fetching comparison ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new comparison
 *
 * @param data - Create comparison request data
 * @returns Promise with created comparison
 */
export const createComparison = async (
  data: CreateComparisonRequest
): Promise<Comparison> => {
  try {
    const response = await apiClient.post<{ comparison: Comparison }>(
      '/comparisons',
      data
    );
    return response.comparison;
  } catch (error) {
    console.error('Error creating comparison:', error);
    throw error;
  }
};

/**
 * Update a comparison
 *
 * @param id - Comparison ID
 * @param data - Update comparison request data
 * @returns Promise with updated comparison
 */
export const updateComparison = async (
  id: string,
  data: UpdateComparisonRequest
): Promise<Comparison> => {
  try {
    const response = await apiClient.put<{ comparison: Comparison }>(
      `/comparisons/${id}`,
      data
    );
    return response.comparison;
  } catch (error) {
    console.error(`Error updating comparison ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a comparison
 *
 * @param id - Comparison ID
 * @returns Promise with success message
 */
export const deleteComparison = async (id: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete<{ message: string }>(`/comparisons/${id}`);
    return response;
  } catch (error) {
    console.error(`Error deleting comparison ${id}:`, error);
    throw error;
  }
};

/**
 * Add a product to a comparison
 *
 * @param id - Comparison ID
 * @param data - Add product request data
 * @returns Promise with updated comparison
 */
export const addProductToComparison = async (
  id: string,
  data: AddProductToComparisonRequest
): Promise<ComparisonWithProducts> => {
  try {
    const response = await apiClient.post<{ comparison: ComparisonWithProducts }>(
      `/comparisons/${id}/items`,
      data
    );
    return response.comparison;
  } catch (error) {
    console.error(`Error adding product to comparison ${id}:`, error);
    throw error;
  }
};

/**
 * Remove a product from a comparison
 *
 * @param id - Comparison ID
 * @param itemId - Comparison item ID
 * @returns Promise with updated comparison
 */
export const removeProductFromComparison = async (
  id: string,
  itemId: string
): Promise<ComparisonWithProducts> => {
  try {
    const response = await apiClient.delete<{ comparison: ComparisonWithProducts }>(
      `/comparisons/${id}/items/${itemId}`
    );
    return response.comparison;
  } catch (error) {
    console.error(`Error removing product from comparison ${id}:`, error);
    throw error;
  }
};

/**
 * Get full comparison data (products, specs, prices, images, differences)
 *
 * @param id - Comparison ID
 * @returns Promise with comparison data
 */
export const getComparisonData = async (id: string): Promise<ComparisonData> => {
  try {
    const response = await apiClient.get<ComparisonData>(`/comparisons/${id}/compare`);
    return response;
  } catch (error) {
    console.error(`Error fetching comparison data for ${id}:`, error);
    throw error;
  }
};

/**
 * Get specification comparison data
 *
 * @param id - Comparison ID
 * @returns Promise with specification comparison data
 */
export const getComparisonSpecifications = async (
  id: string
): Promise<ComparisonData['specifications']> => {
  try {
    const response = await apiClient.get<{ specifications: ComparisonData['specifications'] }>(
      `/comparisons/${id}/specifications`
    );
    return response.specifications;
  } catch (error) {
    console.error(`Error fetching specifications for comparison ${id}:`, error);
    throw error;
  }
};

/**
 * Get price comparison data
 *
 * @param id - Comparison ID
 * @returns Promise with price comparison data
 */
export const getComparisonPrices = async (
  id: string
): Promise<ComparisonData['prices']> => {
  try {
    const response = await apiClient.get<{ prices: ComparisonData['prices'] }>(
      `/comparisons/${id}/prices`
    );
    return response.prices;
  } catch (error) {
    console.error(`Error fetching prices for comparison ${id}:`, error);
    throw error;
  }
};

/**
 * Get image comparison data
 *
 * @param id - Comparison ID
 * @returns Promise with image comparison data
 */
export const getComparisonImages = async (
  id: string
): Promise<ComparisonData['images']> => {
  try {
    const response = await apiClient.get<{ images: ComparisonData['images'] }>(
      `/comparisons/${id}/images`
    );
    return response.images;
  } catch (error) {
    console.error(`Error fetching images for comparison ${id}:`, error);
    throw error;
  }
};

/**
 * Get difference highlights for comparison
 *
 * @param id - Comparison ID
 * @returns Promise with difference data
 */
export const getComparisonDifferences = async (
  id: string
): Promise<ComparisonData['differences']> => {
  try {
    const response = await apiClient.get<{ differences: ComparisonData['differences'] }>(
      `/comparisons/${id}/differences`
    );
    return response.differences;
  } catch (error) {
    console.error(`Error fetching differences for comparison ${id}:`, error);
    throw error;
  }
};

/**
 * Share a comparison
 *
 * @param id - Comparison ID
 * @param data - Share request data
 * @returns Promise with share response
 */
export const shareComparison = async (
  id: string,
  data?: ShareComparisonRequest
): Promise<ShareComparisonResponse> => {
  try {
    const response = await apiClient.post<{ share: ShareComparisonResponse }>(
      `/comparisons/${id}/share`,
      data || {}
    );
    return response.share;
  } catch (error) {
    console.error(`Error sharing comparison ${id}:`, error);
    throw error;
  }
};

/**
 * Export a comparison
 *
 * @param id - Comparison ID
 * @param data - Export request data
 * @returns Promise with export response
 */
export const exportComparison = async (
  id: string,
  data: ExportComparisonRequest
): Promise<ExportComparisonResponse> => {
  try {
    const response = await apiClient.post<{ export: ExportComparisonResponse }>(
      `/comparisons/${id}/export`,
      data
    );
    return response.export;
  } catch (error) {
    console.error(`Error exporting comparison ${id}:`, error);
    throw error;
  }
};

/**
 * Create a guest comparison
 *
 * @param data - Guest comparison request data
 * @returns Promise with created guest comparison
 */
export const createGuestComparison = async (
  data: GuestComparisonRequest
): Promise<GuestComparison> => {
  try {
    const response = await apiClient.post<{ comparison: GuestComparison }>(
      '/comparisons/guest',
      data
    );
    return response.comparison;
  } catch (error) {
    console.error('Error creating guest comparison:', error);
    throw error;
  }
};

/**
 * Get a guest comparison by session ID
 *
 * @param sessionId - Guest session ID
 * @returns Promise with guest comparison
 */
export const getGuestComparison = async (
  sessionId: string
): Promise<GuestComparison> => {
  try {
    const response = await apiClient.get<{ comparison: GuestComparison }>(
      `/comparisons/guest/${sessionId}`
    );
    return response.comparison;
  } catch (error) {
    console.error(`Error fetching guest comparison ${sessionId}:`, error);
    throw error;
  }
};

/**
 * Update a guest comparison
 *
 * @param sessionId - Guest session ID
 * @param data - Update data
 * @returns Promise with updated guest comparison
 */
export const updateGuestComparison = async (
  sessionId: string,
  data: UpdateComparisonRequest
): Promise<GuestComparison> => {
  try {
    const response = await apiClient.put<{ comparison: GuestComparison }>(
      `/comparisons/guest/${sessionId}`,
      data
    );
    return response.comparison;
  } catch (error) {
    console.error(`Error updating guest comparison ${sessionId}:`, error);
    throw error;
  }
};

/**
 * Merge a guest comparison to user account
 *
 * @param data - Merge request data
 * @returns Promise with merged comparison
 */
export const mergeGuestComparison = async (
  data: MergeGuestComparisonRequest
): Promise<ComparisonWithProducts> => {
  try {
    const response = await apiClient.post<{ comparison: ComparisonWithProducts }>(
      '/comparisons/guest/merge',
      data
    );
    return response.comparison;
  } catch (error) {
    console.error('Error merging guest comparison:', error);
    throw error;
  }
};

// Export all functions as a named object for convenience
const comparisonsApi = {
  getComparisons,
  getComparison,
  createComparison,
  updateComparison,
  deleteComparison,
  addProductToComparison,
  removeProductFromComparison,
  getComparisonData,
  getComparisonSpecifications,
  getComparisonPrices,
  getComparisonImages,
  getComparisonDifferences,
  shareComparison,
  exportComparison,
  createGuestComparison,
  getGuestComparison,
  updateGuestComparison,
  mergeGuestComparison,
};

export default comparisonsApi;
