/**
 * Admin-specific API utility functions for product images
 * 
 * This file contains admin-level API functions for product image management including:
 * - Bulk operations
 * - Image statistics
 * - Storage quota information
 * - Processing queue management
 */

import apiClient from './client';
import {
  ProductImage,
  UpdateProductImageRequest,
  BulkUploadResult,
  ImageVariant
} from '@/types/product-image';

/**
 * Get image statistics for a product
 * 
 * @param productId - Product ID
 * @returns Promise with image statistics
 */
export const getProductImageStatistics = async (productId: string): Promise<{
  totalImages: number;
  totalSize: number;
  averageSize: number;
  primaryImage: ProductImage | null;
  mimeTypes: Record<string, number>;
  processingStatus: Record<string, number>;
}> => {
  try {
    const response = await apiClient.get<{
      statistics: {
        totalImages: number;
        totalSize: number;
        averageSize: number;
        primaryImage: ProductImage | null;
        mimeTypes: Record<string, number>;
        processingStatus: Record<string, number>;
      }
    }>(`/admin/products/${productId}/images/statistics`);
    return response?.statistics || {
      totalImages: 0,
      totalSize: 0,
      averageSize: 0,
      primaryImage: null,
      mimeTypes: {},
      processingStatus: {}
    };
  } catch (error) {
    console.error(`Error fetching image statistics for product ${productId}:`, error);
    throw error;
  }
};

/**
 * Get storage quota information for a product
 * 
 * @param productId - Product ID
 * @returns Promise with storage quota information
 */
export const getProductStorageQuota = async (productId: string): Promise<{
  totalSize: number;
  quota: number;
  usedPercentage: number;
  remaining: number;
  isNearLimit: boolean;
  isOverLimit: boolean;
}> => {
  try {
    const response = await apiClient.get<{
      quota: {
        totalSize: number;
        quota: number;
        usedPercentage: number;
        remaining: number;
        isNearLimit: boolean;
        isOverLimit: boolean;
      }
    }>(`/admin/products/${productId}/images/quota`);
    return response?.quota || {
      totalSize: 0,
      quota: 50 * 1024 * 1024, // 50MB
      usedPercentage: 0,
      remaining: 50 * 1024 * 1024,
      isNearLimit: false,
      isOverLimit: false
    };
  } catch (error) {
    console.error(`Error fetching storage quota for product ${productId}:`, error);
    throw error;
  }
};

/**
 * Bulk update image metadata
 * 
 * @param updates - Array of image updates
 * @returns Promise with update result
 */
export const bulkUpdateImages = async (
  updates: Array<{ imageId: string; data: UpdateProductImageRequest }>
): Promise<{ success: number; failed: number; errors: Array<{ imageId: string; error: string }> }> => {
  try {
    const response = await apiClient.put<{
      result: {
        success: number;
        failed: number;
        errors: Array<{ imageId: string; error: string }>;
      }
    }>('/admin/images/bulk-update', { updates });
    return response?.result || { success: 0, failed: 0, errors: [] };
  } catch (error) {
    console.error('Error in bulk image update:', error);
    throw error;
  }
};

/**
 * Bulk delete images
 * 
 * @param imageIds - Array of image IDs to delete
 * @returns Promise with delete result
 */
export const bulkDeleteImages = async (
  imageIds: string[]
): Promise<{ success: number; failed: number; errors: Array<{ imageId: string; error: string }> }> => {
  try {
    const response = await apiClient.post<{
      result: {
        success: number;
        failed: number;
        errors: Array<{ imageId: string; error: string }>;
      }
    }>('/admin/images/bulk-delete', { imageIds });
    return response?.result || { success: 0, failed: 0, errors: [] };
  } catch (error) {
    console.error('Error in bulk image delete:', error);
    throw error;
  }
};

/**
 * Get image processing queue status
 * 
 * @param productId - Product ID
 * @returns Promise with processing queue status
 */
export const getImageProcessingQueue = async (productId: string): Promise<{
  queue: Array<{
    imageId: string;
    fileName: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    error?: string;
    timestamp: Date;
  }>;
  activeJobs: number;
}> => {
  try {
    const response = await apiClient.get<{
      queue: {
        queue: Array<{
          imageId: string;
          fileName: string;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          progress: number;
          error?: string;
          timestamp: Date;
        }>;
        activeJobs: number;
      }
    }>(`/admin/products/${productId}/images/queue`);
    return response?.queue || { queue: [], activeJobs: 0 };
  } catch (error) {
    console.error(`Error fetching processing queue for product ${productId}:`, error);
    throw error;
  }
};

/**
 * Cancel pending image processing jobs
 * 
 * @param productId - Product ID
 * @returns Promise with cancellation result
 */
export const cancelPendingProcessingJobs = async (productId: string): Promise<{
  cancelled: number;
  failed: number;
}> => {
  try {
    const response = await apiClient.post<{
      result: {
        cancelled: number;
        failed: number;
      }
    }>(`/admin/products/${productId}/images/queue/cancel`, {});
    return response?.result || { cancelled: 0, failed: 0 };
  } catch (error) {
    console.error(`Error cancelling processing jobs for product ${productId}:`, error);
    throw error;
  }
};

/**
 * Retry failed image processing jobs
 * 
 * @param productId - Product ID
 * @returns Promise with retry result
 */
export const retryFailedProcessingJobs = async (productId: string): Promise<{
  retried: number;
  failed: number;
}> => {
  try {
    const response = await apiClient.post<{
      result: {
        retried: number;
        failed: number;
      }
    }>(`/admin/products/${productId}/images/queue/retry`, {});
    return response?.result || { retried: 0, failed: 0 };
  } catch (error) {
    console.error(`Error retrying processing jobs for product ${productId}:`, error);
    throw error;
  }
};

/**
 * Get all products with image statistics
 * 
 * @param filters - Optional filters (hasImages, imageCount, etc.)
 * @returns Promise with products and image statistics
 */
export const getProductsWithImageStatistics = async (filters?: {
  hasImages?: boolean;
  minImageCount?: number;
  maxImageCount?: number;
}): Promise<{
  products: Array<{
    id: string;
    name: string;
    sku: string;
    imageCount: number;
    totalSize: number;
    primaryImage: ProductImage | null;
  }>;
  total: number;
}> => {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    if (filters?.hasImages !== undefined) {
      queryParams.append('hasImages', String(filters.hasImages));
    }
    if (filters?.minImageCount !== undefined) {
      queryParams.append('minImageCount', String(filters.minImageCount));
    }
    if (filters?.maxImageCount !== undefined) {
      queryParams.append('maxImageCount', String(filters.maxImageCount));
    }

    const endpoint = queryParams.toString()
      ? `/admin/products/images/statistics?${queryParams.toString()}`
      : '/admin/products/images/statistics';

    const response = await apiClient.get<{
      result: {
        products: Array<{
          id: string;
          name: string;
          sku: string;
          imageCount: number;
          totalSize: number;
          primaryImage: ProductImage | null;
        }>;
        total: number;
      }
    }>(endpoint);
    return response?.result || { products: [], total: 0 };
  } catch (error) {
    console.error('Error fetching products with image statistics:', error);
    throw error;
  }
};

/**
 * Get CDN sync status for product images
 * 
 * @param productId - Product ID
 * @returns Promise with CDN sync status
 */
export const getCDNSyncStatus = async (productId: string): Promise<{
  synced: number;
  pending: number;
  failed: number;
  lastSyncTime: Date | null;
}> => {
  try {
    const response = await apiClient.get<{
      status: {
        synced: number;
        pending: number;
        failed: number;
        lastSyncTime: Date | null;
      }
    }>(`/admin/products/${productId}/images/cdn-status`);
    return response?.status || { synced: 0, pending: 0, failed: 0, lastSyncTime: null };
  } catch (error) {
    console.error(`Error fetching CDN sync status for product ${productId}:`, error);
    throw error;
  }
};

/**
 * Trigger CDN sync for product images
 * 
 * @param productId - Product ID
 * @returns Promise with sync result
 */
export const triggerCDNSync = async (productId: string): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const response = await apiClient.post<{
      result: {
        success: boolean;
        message: string;
      }
    }>(`/admin/products/${productId}/images/cdn-sync`, {});
    return response?.result || { success: false, message: 'Failed to trigger CDN sync' };
  } catch (error) {
    console.error(`Error triggering CDN sync for product ${productId}:`, error);
    throw error;
  }
};

/**
 * Get image optimization suggestions
 * 
 * @param productId - Product ID
 * @returns Promise with optimization suggestions
 */
export const getImageOptimizationSuggestions = async (productId: string): Promise<{
  suggestions: Array<{
    imageId: string;
    type: 'compress' | 'resize' | 'convert' | 'remove';
    currentSize: number;
    potentialSavings: number;
    recommendation: string;
  }>;
  totalPotentialSavings: number;
}> => {
  try {
    const response = await apiClient.get<{
      suggestions: {
        suggestions: Array<{
          imageId: string;
          type: 'compress' | 'resize' | 'convert' | 'remove';
          currentSize: number;
          potentialSavings: number;
          recommendation: string;
        }>;
        totalPotentialSavings: number;
      }
    }>(`/admin/products/${productId}/images/optimization-suggestions`);
    return response?.suggestions || { suggestions: [], totalPotentialSavings: 0 };
  } catch (error) {
    console.error(`Error fetching optimization suggestions for product ${productId}:`, error);
    throw error;
  }
};

// Export all functions as a named object for convenience
const adminProductImagesApi = {
  getProductImageStatistics,
  getProductStorageQuota,
  bulkUpdateImages,
  bulkDeleteImages,
  getImageProcessingQueue,
  cancelPendingProcessingJobs,
  retryFailedProcessingJobs,
  getProductsWithImageStatistics,
  getCDNSyncStatus,
  triggerCDNSync,
  getImageOptimizationSuggestions
};

export default adminProductImagesApi;
