/**
 * Product Images API Client
 * 
 * This file contains all API client functions for product image operations.
 * All functions are type-safe with proper error handling.
 */

import apiClient from './client';
import {
  ProductImage,
  CreateProductImageRequest,
  UpdateProductImageRequest,
  UploadProductImagesRequest,
  ReorderProductImagesRequest,
  BulkUploadResult,
  ImageVersionsResponse,
  ImageVariant
} from '@/types/product-image';

/**
 * Get all images for a product
 * 
 * @param productId - Product ID
 * @returns Promise with array of product images
 */
export const getProductImages = async (productId: string): Promise<ProductImage[]> => {
  try {
    const response = await apiClient.get<{ images: ProductImage[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
      `/products/${productId}/images?limit=100`
    );
    return response?.images || [];
  } catch (error) {
    console.error(`Error fetching images for product ${productId}:`, error);
    throw error;
  }
};

/**
 * Upload multiple images for a product
 * 
 * @param productId - Product ID
 * @param data - Upload request data with files
 * @param onProgress - Optional callback for upload progress
 * @returns Promise with upload result
 */
export const uploadProductImages = async (
  productId: string,
  data: UploadProductImagesRequest
): Promise<BulkUploadResult> => {
  try {
    const formData = new FormData();
    
    // Add each image file with field name 'images' (array format)
    data.images.forEach((image) => {
      formData.append('images', image.file);
    });

    // Add metadata as separate fields
    formData.append('imagesData', JSON.stringify(data.images.map(img => ({
      altTextBn: img.altTextBn || '',
      altTextEn: img.altTextEn || '',
      displayOrder: img.displayOrder,
      isPrimary: img.isPrimary
    }))));

    const response = await apiClient.post<{ result: BulkUploadResult }>(
      `/products/${productId}/images`,
      formData,
      { timeout: 60000 } // 60 second timeout for image uploads
    );
    return response?.result;
  } catch (error) {
    console.error(`Error uploading images for product ${productId}:`, error);
    throw error;
  }
};

/**
 * Update product image metadata
 * 
 * @param imageId - Image ID
 * @param data - Update data
 * @returns Promise with updated image
 */
export const updateProductImage = async (
  imageId: string,
  data: UpdateProductImageRequest
): Promise<ProductImage> => {
  try {
    const response = await apiClient.put<{ image: ProductImage }>(
      `/images/${imageId}`,
      data
    );
    return response?.image;
  } catch (error) {
    console.error(`Error updating image ${imageId}:`, error);
    throw error;
  }
};

/**
 * Reorder product images
 * 
 * @param productId - Product ID
 * @param data - Reorder request with image IDs in new order
 * @returns Promise with success message
 */
export const reorderProductImages = async (
  productId: string,
  data: ReorderProductImagesRequest
): Promise<{ message: string }> => {
  try {
    const response = await apiClient.put<{ message: string }>(
      `/products/${productId}/images/reorder`,
      data
    );
    return response;
  } catch (error) {
    console.error(`Error reordering images for product ${productId}:`, error);
    throw error;
  }
};

/**
 * Delete a product image
 * 
 * @param imageId - Image ID
 * @returns Promise with success message
 */
export const deleteProductImage = async (imageId: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete<{ message: string }>(`/images/${imageId}`);
    return response;
  } catch (error) {
    console.error(`Error deleting image ${imageId}:`, error);
    throw error;
  }
};

/**
 * Set an image as primary for a product
 * 
 * @param imageId - Image ID
 * @returns Promise with updated image
 */
export const setPrimaryImage = async (imageId: string): Promise<ProductImage> => {
  try {
    const response = await apiClient.post<{ image: ProductImage }>(
      `/images/${imageId}/primary`,
      {}
    );
    return response?.image;
  } catch (error) {
    console.error(`Error setting image ${imageId} as primary:`, error);
    throw error;
  }
};

/**
 * Get all size variants for an image
 * 
 * @param imageId - Image ID
 * @returns Promise with image variants
 */
export const getImageVersions = async (imageId: string): Promise<ImageVariant[]> => {
  try {
    const response = await apiClient.get<ImageVersionsResponse>(`/images/${imageId}/versions`);
    return response?.variants || [];
  } catch (error) {
    console.error(`Error fetching versions for image ${imageId}:`, error);
    throw error;
  }
};

/**
 * Validate an image file before upload
 * 
 * @param file - File to validate
 * @returns Validation result
 */
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
    };
  }

  // Check file size (5MB max)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size exceeds 5MB limit.'
    };
  }

  return { isValid: true };
};

/**
 * Get the best URL for an image based on size requirements
 * 
 * @param image - Product image
 * @param size - Desired size ('thumbnail', 'small', 'medium', 'large', 'original')
 * @returns Best URL for the requested size
 */
export const getImageUrl = (
  image: ProductImage,
  size: 'thumbnail' | 'small' | 'medium' | 'large' | 'original' = 'original'
): string => {
  // Get the image URL based on size preference
  const imageUrl = (() => {
    switch (size) {
      case 'thumbnail':
        return image.thumbnailUrl || image.optimizedUrl || image.originalUrl;
      case 'small':
      case 'medium':
      case 'large':
        return image.optimizedUrl || image.originalUrl;
      case 'original':
      default:
        return image.originalUrl;
    }
  })();

  // If URL is relative (starts with /), prepend backend URL
  // This ensures images work correctly in Docker environment
  if (imageUrl && imageUrl.startsWith('/')) {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';
    // Remove /api/v1 suffix if present
    const uploadsBackendUrl = backendUrl.replace('/api/v1', '');
    return uploadsBackendUrl + imageUrl;
  }

  // FIX: Also handle URLs that don't start with / but are still relative
  // Check if URL looks like a relative path (contains no protocol and no leading /)
  if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('https') && !imageUrl.startsWith('/')) {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';
    const uploadsBackendUrl = backendUrl.replace('/api/v1', '');
    return `${uploadsBackendUrl}/uploads/products/${image.productId}/${imageUrl.split('/').pop()}`;
  }

  return imageUrl;
};

/**
 * Generate srcset for responsive images
 * 
 * @param image - Product image
 * @returns Srcset string for responsive images
 */
export const generateSrcset = (image: ProductImage): string => {
  const urls: string[] = [];
  
  if (image.thumbnailUrl) {
    urls.push(`${image.thumbnailUrl} 150w`);
  }
  if (image.optimizedUrl) {
    urls.push(`${image.optimizedUrl} 600w`);
  }
  urls.push(`${image.originalUrl} 1200w`);
  
  return urls.join(', ');
};

/**
 * Generate sizes attribute for responsive images
 * 
 * @returns Sizes string for responsive images
 */
export const generateSizes = (): string => {
  return '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw';
};

/**
 * Get alt text based on language preference
 * 
 * @param image - Product image
 * @param language - Language preference ('bn' or 'en')
 * @returns Alt text in the preferred language
 */
export const getAltText = (
  image: ProductImage,
  language: 'bn' | 'en' = 'en'
): string => {
  if (language === 'bn') {
    return image.altTextBn || image.altTextEn || '';
  }
  return image.altTextEn || image.altTextBn || '';
};

// Export all functions as a named object for convenience
const productImagesApi = {
  getProductImages,
  uploadProductImages,
  updateProductImage,
  reorderProductImages,
  deleteProductImage,
  setPrimaryImage,
  getImageVersions,
  validateImageFile,
  getImageUrl,
  generateSrcset,
  generateSizes,
  getAltText
};

export default productImagesApi;
