/**
 * Admin-specific custom hooks for product image operations
 * 
 * This file contains React hooks for admin-level product image management including:
 * - Bulk operations (delete, update, reorder)
 * - Image processing queue monitoring
 * - Storage quota tracking
 * - Image statistics and analytics
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ProductImage,
  UpdateProductImageRequest,
  ReorderProductImagesRequest,
  BulkUploadResult,
  FileToUpload,
  MAX_IMAGES_PER_PRODUCT,
  MAX_STORAGE_QUOTA_PER_PRODUCT
} from '@/types/product-image';
import {
  getProductImages,
  uploadProductImages,
  updateProductImage,
  deleteProductImage,
  setPrimaryImage,
  reorderProductImages
} from '@/lib/api/product-images';

/**
 * Hook to manage admin-level product image operations
 * 
 * @param productId - Product ID
 * @returns Object with images, loading state, error, and admin operations
 */
export const useAdminProductImages = (productId: string) => {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

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

  // Toggle image selection
  const toggleImageSelection = useCallback((imageId: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  }, []);

  // Select all images
  const selectAllImages = useCallback(() => {
    setSelectedImages(new Set(images.map(img => img.id)));
  }, [images]);

  // Deselect all images
  const deselectAllImages = useCallback(() => {
    setSelectedImages(new Set());
  }, []);

  return {
    images,
    loading,
    error,
    selectedImages,
    refetch: fetchImages,
    setImages,
    toggleImageSelection,
    selectAllImages,
    deselectAllImages
  };
};

/**
 * Hook to perform bulk image operations
 * 
 * @returns Object with bulk operation state and functions
 */
export const useBulkImageOperations = () => {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkUploadResult | null>(null);
  const [operationHistory, setOperationHistory] = useState<Array<{
    type: string;
    count: number;
    timestamp: Date;
    success: boolean;
  }>>([]);

  // Bulk delete images
  const bulkDelete = useCallback(async (imageIds: string[]): Promise<{ success: number; failed: number }> => {
    setProcessing(true);
    setProgress(0);
    setError(null);

    let success = 0;
    let failed = 0;

    try {
      for (let i = 0; i < imageIds.length; i++) {
        try {
          await deleteProductImage(imageIds[i]);
          success++;
        } catch (err) {
          failed++;
          console.error(`Failed to delete image ${imageIds[i]}:`, err);
        }
        setProgress(Math.round(((i + 1) / imageIds.length) * 100));
      }

      setOperationHistory(prev => [...prev, {
        type: 'delete',
        count: success,
        timestamp: new Date(),
        success: failed === 0
      }]);

      return { success, failed };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete images';
      setError(errorMessage);
      console.error('Error in bulk delete:', err);
      return { success, failed };
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  }, []);

  // Bulk update images
  const bulkUpdate = useCallback(async (
    updates: Array<{ imageId: string; data: UpdateProductImageRequest }>
  ): Promise<{ success: number; failed: number }> => {
    setProcessing(true);
    setProgress(0);
    setError(null);

    let success = 0;
    let failed = 0;

    try {
      for (let i = 0; i < updates.length; i++) {
        try {
          await updateProductImage(updates[i].imageId, updates[i].data);
          success++;
        } catch (err) {
          failed++;
          console.error(`Failed to update image ${updates[i].imageId}:`, err);
        }
        setProgress(Math.round(((i + 1) / updates.length) * 100));
      }

      setOperationHistory(prev => [...prev, {
        type: 'update',
        count: success,
        timestamp: new Date(),
        success: failed === 0
      }]);

      return { success, failed };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update images';
      setError(errorMessage);
      console.error('Error in bulk update:', err);
      return { success, failed };
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  }, []);

  // Clear operation history
  const clearHistory = useCallback(() => {
    setOperationHistory([]);
  }, []);

  return {
    processing,
    progress,
    error,
    result,
    operationHistory,
    bulkDelete,
    bulkUpdate,
    clearHistory
  };
};

/**
 * Hook to monitor image processing queue
 * 
 * @returns Object with queue state and operations
 */
export const useImageProcessingQueue = () => {
  const [queue, setQueue] = useState<Array<{
    imageId: string;
    fileName: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    error?: string;
    timestamp: Date;
  }>>([]);
  const [activeJobs, setActiveJobs] = useState(0);

  // Add job to queue
  const addJob = useCallback((imageId: string, fileName: string) => {
    setQueue(prev => [...prev, {
      imageId,
      fileName,
      status: 'pending',
      progress: 0,
      timestamp: new Date()
    }]);
  }, []);

  // Update job status
  const updateJob = useCallback((imageId: string, updates: Partial<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    error?: string;
  }>) => {
    setQueue(prev => prev.map(job => 
      job.imageId === imageId ? { ...job, ...updates } : job
    ));
  }, []);

  // Remove job from queue
  const removeJob = useCallback((imageId: string) => {
    setQueue(prev => prev.filter(job => job.imageId !== imageId));
  }, []);

  // Cancel pending jobs
  const cancelPendingJobs = useCallback(() => {
    setQueue(prev => prev.filter(job => job.status !== 'pending'));
  }, []);

  // Retry failed jobs
  const retryFailedJobs = useCallback(() => {
    setQueue(prev => prev.map(job => 
      job.status === 'failed' 
        ? { ...job, status: 'pending', progress: 0, error: undefined }
        : job
    ));
  }, []);

  // Clear completed jobs
  const clearCompletedJobs = useCallback(() => {
    setQueue(prev => prev.filter(job => job.status !== 'completed'));
  }, []);

  // Update active jobs count
  useEffect(() => {
    const active = queue.filter(job => job.status === 'processing').length;
    setActiveJobs(active);
  }, [queue]);

  return {
    queue,
    activeJobs,
    addJob,
    updateJob,
    removeJob,
    cancelPendingJobs,
    retryFailedJobs,
    clearCompletedJobs
  };
};

/**
 * Hook to track image storage quota
 * 
 * @param images - Array of product images
 * @returns Object with storage quota information
 */
export const useImageStorageQuota = (images: ProductImage[]) => {
  const storageInfo = useMemo(() => {
    const totalSize = images.reduce((sum, img) => sum + (img.fileSizeBytes || 0), 0);
    const quota = MAX_STORAGE_QUOTA_PER_PRODUCT;
    const usedPercentage = (totalSize / quota) * 100;
    const remaining = quota - totalSize;
    const imageCount = images.length;
    const maxImages = MAX_IMAGES_PER_PRODUCT;
    const imagesRemaining = maxImages - imageCount;

    return {
      totalSize,
      quota,
      usedPercentage,
      remaining,
      isNearLimit: usedPercentage > 80,
      isOverLimit: usedPercentage > 100,
      imageCount,
      maxImages,
      imagesRemaining,
      averageImageSize: imageCount > 0 ? totalSize / imageCount : 0
    };
  }, [images]);

  return storageInfo;
};

/**
 * Hook to get image statistics
 * 
 * @param images - Array of product images
 * @returns Object with image statistics
 */
export const useImageStatistics = (images: ProductImage[]) => {
  const statistics = useMemo(() => {
    const totalImages = images.length;
    const primaryImages = images.filter(img => img.isPrimary).length;
    const completedImages = images.filter(img => img.processingStatus === 'completed').length;
    const processingImages = images.filter(img => img.processingStatus === 'processing').length;
    const failedImages = images.filter(img => img.processingStatus === 'failed').length;
    const pendingImages = images.filter(img => img.processingStatus === 'pending').length;

    const totalSize = images.reduce((sum, img) => sum + (img.fileSizeBytes || 0), 0);
    const averageSize = totalImages > 0 ? totalSize / totalImages : 0;

    const mimeTypes = images.reduce((acc, img) => {
      const type = img.mimeType || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dimensions = images
      .filter(img => img.width && img.height)
      .map(img => ({ width: img.width!, height: img.height! }));

    return {
      totalImages,
      primaryImages,
      completedImages,
      processingImages,
      failedImages,
      pendingImages,
      totalSize,
      averageSize,
      mimeTypes,
      dimensions,
      hasPrimaryImage: primaryImages > 0,
      hasProcessingImages: processingImages > 0,
      hasFailedImages: failedImages > 0
    };
  }, [images]);

  return statistics;
};

/**
 * Hook to manage image upload with admin features
 * 
 * @returns Object with upload state and functions
 */
export const useAdminImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkUploadResult | null>(null);

  const uploadImages = useCallback(async (
    productId: string,
    files: FileToUpload[],
    onProgress?: (progress: number) => void
  ): Promise<BulkUploadResult | null> => {
    setUploading(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(prev + 10, 90);
          onProgress?.(newProgress);
          return newProgress;
        });
      }, 200);

      const uploadResult = await uploadProductImages(productId, {
        productId,
        images: files.map(file => ({
          file: file.file,
          altTextBn: file.altTextBn,
          altTextEn: file.altTextEn,
          displayOrder: file.displayOrder,
          isPrimary: file.isPrimary
        }))
      });

      clearInterval(progressInterval);
      setProgress(100);
      onProgress?.(100);
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
