/**
 * Custom hooks for product image operations
 * 
 * This file contains React hooks for managing product images including:
 * - Fetching product images
 * - Uploading images
 * - Updating image metadata
 * - Deleting images
 * - Reordering images
 * - Setting primary image
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ProductImage,
  UploadProductImagesRequest,
  UpdateProductImageRequest,
  ReorderProductImagesRequest,
  BulkUploadResult,
  FileToUpload,
  ImageUploadError
} from '@/types/product-image';
import {
  getProductImages,
  uploadProductImages,
  updateProductImage,
  deleteProductImage,
  setPrimaryImage,
  reorderProductImages,
  validateImageFile
} from '@/lib/api/product-images';

/**
 * Hook to fetch and manage product images
 * 
 * @param productId - Product ID
 * @returns Object with images, loading state, error, and operations
 */
export const useProductImages = (productId: string) => {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    if (!productId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await getProductImages(productId);
      setImages(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch product images');
      console.error('Error fetching product images:', err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  return {
    images,
    loading,
    error,
    refetch: fetchImages,
    setImages
  };
};

/**
 * Hook to upload product images
 * 
 * @returns Object with upload state, progress, and upload function
 */
export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkUploadResult | null>(null);

  const uploadImages = useCallback(async (
    productId: string,
    files: FileToUpload[]
  ): Promise<BulkUploadResult | null> => {
    setUploading(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      // Validate all files
      const validationErrors: ImageUploadError[] = [];
      const validFiles = files.filter(file => {
        const validation = validateImageFile(file.file);
        if (!validation.isValid) {
          validationErrors.push({
            fileName: file.file.name,
            error: validation.error || 'Invalid file'
          });
          return false;
        }
        return true;
      });

      if (validationErrors.length > 0) {
        setError(`${validationErrors.length} file(s) failed validation`);
        return null;
      }

      if (validFiles.length === 0) {
        setError('No valid files to upload');
        return null;
      }

      // Prepare upload request
      const uploadRequest: UploadProductImagesRequest = {
        productId,
        images: validFiles.map(file => ({
          file: file.file,
          altTextBn: file.altTextBn,
          altTextEn: file.altTextEn,
          displayOrder: file.displayOrder,
          isPrimary: file.isPrimary
        }))
      };

      // Upload images
      const uploadResult = await uploadProductImages(productId, uploadRequest);
      
      setProgress(100);
      setResult(uploadResult);
      return uploadResult;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to upload images';
      setError(errorMessage);
      console.error('Error uploading images:', err);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
    setResult(null);
  }, []);

  return {
    uploading,
    progress,
    error,
    result,
    uploadImages,
    reset
  };
};

/**
 * Hook to update image metadata
 * 
 * @returns Object with update state and update function
 */
export const useImageUpdate = () => {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateImage = useCallback(async (
    imageId: string,
    data: UpdateProductImageRequest
  ): Promise<ProductImage | null> => {
    setUpdating(true);
    setError(null);

    try {
      const updatedImage = await updateProductImage(imageId, data);
      return updatedImage;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update image';
      setError(errorMessage);
      console.error('Error updating image:', err);
      return null;
    } finally {
      setUpdating(false);
    }
  }, []);

  return {
    updating,
    error,
    updateImage
  };
};

/**
 * Hook to delete product image
 * 
 * @returns Object with delete state and delete function
 */
export const useImageDelete = () => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteImage = useCallback(async (imageId: string): Promise<boolean> => {
    setDeleting(true);
    setError(null);

    try {
      await deleteProductImage(imageId);
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete image';
      setError(errorMessage);
      console.error('Error deleting image:', err);
      return false;
    } finally {
      setDeleting(false);
    }
  }, []);

  return {
    deleting,
    error,
    deleteImage
  };
};

/**
 * Hook to set primary image
 * 
 * @returns Object with set primary state and function
 */
export const useSetPrimaryImage = () => {
  const [setting, setSetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setPrimary = useCallback(async (imageId: string): Promise<ProductImage | null> => {
    setSetting(true);
    setError(null);

    try {
      const updatedImage = await setPrimaryImage(imageId);
      return updatedImage;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to set primary image';
      setError(errorMessage);
      console.error('Error setting primary image:', err);
      return null;
    } finally {
      setSetting(false);
    }
  }, []);

  return {
    setting,
    error,
    setPrimary
  };
};

/**
 * Hook to reorder product images
 * 
 * @returns Object with reorder state and reorder function
 */
export const useImageReorder = () => {
  const [reordering, setReordering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reorderImages = useCallback(async (
    productId: string,
    imageIds: string[]
  ): Promise<boolean> => {
    setReordering(true);
    setError(null);

    try {
      const reorderRequest: ReorderProductImagesRequest = {
        productId,
        imageIds
      };
      await reorderProductImages(productId, reorderRequest);
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to reorder images';
      setError(errorMessage);
      console.error('Error reordering images:', err);
      return false;
    } finally {
      setReordering(false);
    }
  }, []);

  return {
    reordering,
    error,
    reorderImages
  };
};

/**
 * Hook to manage image alt text
 * 
 * @returns Object with alt text state and update function
 */
export const useImageAltText = () => {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateAltText = useCallback(async (
    imageId: string,
    altTextBn: string,
    altTextEn: string
  ): Promise<ProductImage | null> => {
    setUpdating(true);
    setError(null);

    try {
      const updatedImage = await updateProductImage(imageId, {
        altTextBn,
        altTextEn
      });
      return updatedImage;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update alt text';
      setError(errorMessage);
      console.error('Error updating alt text:', err);
      return null;
    } finally {
      setUpdating(false);
    }
  }, []);

  return {
    updating,
    error,
    updateAltText
  };
};

/**
 * Hook to generate alt text from product name
 * 
 * @returns Function to generate alt text
 */
export const useAltTextGenerator = () => {
  const generateAltText = useCallback((productName: string, language: 'bn' | 'en' = 'en'): string => {
    if (language === 'bn') {
      // For Bengali, we'll use a simple transliteration or keep English
      // In a real implementation, you might use a translation service
      return productName || 'প্রোডাক্ট ইমেজ';
    }
    return productName || 'Product image';
  }, []);

  return { generateAltText };
};

/**
 * Hook to validate image files before upload
 * 
 * @returns Object with validation results and validate function
 */
export const useImageValidation = () => {
  const [errors, setErrors] = useState<ImageUploadError[]>([]);

  const validateFiles = useCallback((files: File[]): ImageUploadError[] => {
    const validationErrors: ImageUploadError[] = [];
    
    files.forEach(file => {
      const result = validateImageFile(file);
      if (!result.isValid) {
        validationErrors.push({
          fileName: file.name,
          error: result.error || 'Invalid file'
        });
      }
    });

    setErrors(validationErrors);
    return validationErrors;
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return {
    errors,
    validateFiles,
    clearErrors
  };
};
