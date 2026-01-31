/**
 * ImageStorageQuota Component (Admin)
 * 
 * Display current storage usage, show storage quota (50MB per product),
 * visual progress bar, per-image size breakdown, warning when approaching quota,
 * alert when quota exceeded, and storage optimization suggestions.
 */

'use client';

import React, { useMemo } from 'react';
import { ProductImage } from '@/types/product-image';
import { useImageStorageQuota } from '@/hooks/useAdminProductImages';

interface ImageStorageQuotaProps {
  images: ProductImage[];
  productId: string;
  onOptimize?: () => void;
}

/**
 * ImageStorageQuota Component
 * 
 * @param images - Array of product images
 * @param productId - Product ID
 * @param onOptimize - Callback for optimization action
 */
export const ImageStorageQuota: React.FC<ImageStorageQuotaProps> = ({
  images,
  productId,
  onOptimize
}) => {
  const storageInfo = useImageStorageQuota(images);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 100) return 'bg-red-600';
    if (percentage >= 80) return 'bg-orange-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getProgressText = (percentage: number): string => {
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 80) return 'text-orange-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getWarningMessage = (): string | null => {
    if (storageInfo.isOverLimit) {
      return 'Storage quota exceeded. Please delete some images or optimize existing ones.';
    }
    if (storageInfo.isNearLimit) {
      return 'Approaching storage quota limit. Consider optimizing images.';
    }
    return null;
  };

  const getOptimizationSuggestions = useMemo(() => {
    const suggestions: string[] = [];
    
    // Check for large images
    const largeImages = images.filter(img => (img.fileSizeBytes || 0) > 2 * 1024 * 1024); // > 2MB
    if (largeImages.length > 0) {
      suggestions.push(`${largeImages.length} image(s) are larger than 2MB. Consider compressing them.`);
    }

    // Check for non-optimized images
    const nonOptimized = images.filter(img => !img.optimizedUrl);
    if (nonOptimized.length > 0) {
      suggestions.push(`${nonOptimized.length} image(s) are not optimized. Optimization can save up to 70% space.`);
    }

    // Check for duplicate sizes
    const sizeGroups = images.reduce((acc, img) => {
      const size = `${img.width}x${img.height}`;
      acc[size] = (acc[size] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const duplicates = Object.entries(sizeGroups).filter(([_, count]) => count > 1);
    if (duplicates.length > 0) {
      suggestions.push(`${duplicates.length} duplicate size(s) found. Consider removing duplicates.`);
    }

    return suggestions;
  }, [images]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Storage Quota
        </h3>
        {onOptimize && getOptimizationSuggestions.length > 0 && (
          <button
            onClick={onOptimize}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Optimize Images
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Used: <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatBytes(storageInfo.totalSize)}
              </span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Quota: <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatBytes(storageInfo.quota)}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${getProgressText(storageInfo.usedPercentage)}`}>
              {storageInfo.usedPercentage.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formatBytes(storageInfo.remaining)} remaining
            </p>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out ${getProgressColor(storageInfo.usedPercentage)}`}
            style={{ width: `${Math.min(storageInfo.usedPercentage, 100)}%` }}
          />
        </div>

        {/* Warning Message */}
        {getWarningMessage() && (
          <div className={`mt-4 p-3 rounded-lg ${
            storageInfo.isOverLimit
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
          }`}>
            <div className="flex items-start">
              <svg
                className={`w-5 h-5 mt-0.5 mr-2 ${
                  storageInfo.isOverLimit ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className={`text-sm ${
                storageInfo.isOverLimit ? 'text-red-700 dark:text-red-400' : 'text-yellow-700 dark:text-yellow-400'
              }`}>
                {getWarningMessage()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Per-Image Size Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Image Size Breakdown
        </h4>
        <div className="space-y-2">
          {images.map((image, index) => {
            const sizePercentage = storageInfo.totalSize > 0
              ? ((image.fileSizeBytes || 0) / storageInfo.totalSize) * 100
              : 0;
            
            return (
              <div key={image.id} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={image.thumbnailUrl || image.optimizedUrl || image.originalUrl}
                    alt={`Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                      {image.altTextEn || image.altTextBn || `Image ${index + 1}`}
                    </p>
                    <div className="flex items-center space-x-2">
                      {image.isPrimary && (
                        <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded">
                          Primary
                        </span>
                      )}
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {formatBytes(image.fileSizeBytes || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${sizePercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Optimization Suggestions */}
      {getOptimizationSuggestions.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Optimization Suggestions
          </h4>
          <ul className="space-y-2">
            {getOptimizationSuggestions.map((suggestion, index) => (
              <li key={index} className="text-sm text-blue-800 dark:text-blue-200 flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Image Count Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Images</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {storageInfo.imageCount}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {storageInfo.imagesRemaining} remaining
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Average Size</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatBytes(storageInfo.averageImageSize)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">per image</p>
        </div>
      </div>
    </div>
  );
};

export default ImageStorageQuota;
