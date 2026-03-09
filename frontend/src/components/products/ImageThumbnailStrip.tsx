/**
 * ImageThumbnailStrip Component
 * 
 * Horizontal thumbnail strip with click to select, active indicator,
 * scrollable for many thumbnails, responsive sizing, hover effects,
 * primary image badge, loading states, and error handling.
 */

'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { ProductImage } from '@/types/product-image';
import { getImageUrl, getAltText } from '@/lib/api/product-images';

interface ImageThumbnailStripProps {
  images: ProductImage[];
  activeIndex: number;
  onThumbnailClick: (index: number) => void;
  maxVisible?: number;
}

/**
 * ImageThumbnailStrip Component
 * 
 * @param images - Array of product images
 * @param activeIndex - Currently selected image index
 * @param onThumbnailClick - Callback on thumbnail click
 * @param maxVisible - Maximum visible thumbnails (default: 5)
 */
  export const ImageThumbnailStrip: React.FC<ImageThumbnailStripProps> = ({
    images,
    activeIndex,
    onThumbnailClick,
    maxVisible = 5
  }) => {
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
    const [errorStates, setErrorStates] = useState<Record<string, boolean>>({});
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollPosition, setScrollPosition] = useState(0);
    const isMountedRef = useRef(true);
    const [isClient, setIsClient] = useState(false);

    // Sort images by display order (memoized)
    const sortedImages = useMemo(() => 
      [...images].sort((a, b) => a.displayOrder - b.displayOrder), 
      [images]
    );

    // Track mount state for cleanup
    useEffect(() => {
      isMountedRef.current = true;
      setIsClient(true);
      return () => {
        isMountedRef.current = false;
      };
    }, []);

  // Scroll to active thumbnail
  useEffect(() => {
    if (containerRef.current && activeIndex >= 0 && isMountedRef.current) {
      const thumbnailWidth = containerRef.current.scrollWidth / sortedImages.length;
      const scrollLeft = activeIndex * thumbnailWidth - (containerRef.current.clientWidth / 2) + (thumbnailWidth / 2);
      containerRef.current.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  }, [activeIndex, sortedImages.length]);

  // Handle image load
  const handleImageLoad = useCallback((imageId: string) => {
    if (isMountedRef.current) {
      setLoadingStates(prev => ({ ...prev, [imageId]: false }));
    }
  }, []);

  // Handle image error
  const handleImageError = useCallback((imageId: string) => {
    if (isMountedRef.current) {
      setErrorStates(prev => ({ ...prev, [imageId]: true }));
      setLoadingStates(prev => ({ ...prev, [imageId]: false }));
    }
  }, []);

  // Handle thumbnail click
  const handleClick = useCallback((index: number, imageId: string) => {
    console.log('[ImageThumbnailStrip] Thumbnail clicked:', { index, imageId });
    // FIX: Only set loading state if image wasn't already loaded
    // This prevents thumbnails from vanishing when clicked (cached images won't fire onLoad again)
    setLoadingStates(prev => {
      // If already loaded (false), keep it loaded - don't reset to loading
      if (prev[imageId] === false) {
        return prev;
      }
      return { ...prev, [imageId]: true };
    });
    onThumbnailClick(index);
  }, [onThumbnailClick]);

    // Initialize loading states only on client to prevent hydration issues
    useEffect(() => {
      if (!isClient || sortedImages.length === 0) return;
      
      // Only initialize if not already initialized to prevent re-renders
      setLoadingStates(prev => {
        if (Object.keys(prev).length === sortedImages.length) {
          return prev; // Already initialized
        }
        const initialLoadingStates: Record<string, boolean> = {};
        sortedImages.forEach(image => {
          initialLoadingStates[image.id] = true;
        });
        return initialLoadingStates;
      });
    }, [sortedImages, isClient]);

    // Don't render thumbnails until after hydration to prevent NS_BINDING_ABORTED
    // This avoids re-renders during hydration which cause duplicate image requests
    if (sortedImages.length === 0) {
      return (
        <div className="flex items-center justify-center h-20 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">No images</p>
        </div>
      );
    }

    // Only render on client to prevent hydration mismatch and NS_BINDING_ABORTED
    if (!isClient) {
      return (
        <div className="flex gap-2">
          {Array.from({ length: Math.min(sortedImages.length, 5) }).map((_, i) => (
            <div key={i} className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      );
    }

  return (
    <div className="space-y-2">
      {/* Thumbnail Strip */}
      <div
        ref={containerRef}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {sortedImages.map((image, index) => {
          const isActive = index === activeIndex;
          const isLoading = loadingStates[image.id];
          const hasError = errorStates[image.id];

          return (
            <button
              key={image.id}
              onClick={() => handleClick(index, image.id)}
              disabled={isLoading}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isActive
                  ? 'border-blue-600 ring-2 ring-blue-100 dark:ring-blue-900'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              } ${isLoading ? 'opacity-70' : ''}`}
              aria-label={`View image ${index + 1}`}
              aria-current={isActive ? 'true' : 'false'}
              style={{
                scrollSnapAlign: 'start'
              }}
            >
              {/* Image */}
              <Image
                // Use stable key without index to prevent re-mounting on re-renders
                key={image.id}
                src={hasError ? '/images/placeholder-product.jpg' : getImageUrl(image, 'thumbnail')}
                alt={getAltText(image) || `Thumbnail ${index + 1}`}
                fill
                // FIX: Use unoptimized for external URLs to prevent Next.js Image optimization issues
                unoptimized={true}
                className={`object-cover transition-transform duration-200 ${
                  isActive ? 'scale-105' : 'hover:scale-105'
                } ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                sizes="80px"
                onLoad={() => handleImageLoad(image.id)}
                onError={() => handleImageError(image.id)}
              />

              {/* Loading Skeleton */}
              {isLoading && (
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
              )}

              {/* Error State */}
              {hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {/* Primary Image Badge */}
              {image.isPrimary && (
                <div className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium shadow-md">
                  Primary
                </div>
              )}

              {/* Active Indicator */}
              {isActive && (
                <div className="absolute inset-0 border-2 border-blue-600 rounded-lg pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>

      {/* Scroll Indicators */}
      {sortedImages.length > maxVisible && (
        <div className="flex items-center justify-between px-2">
          <button
            onClick={() => {
              if (containerRef.current) {
                containerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
              }
            }}
            className="w-8 h-8 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 transition-colors"
            aria-label="Scroll left"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {activeIndex + 1} / {sortedImages.length}
          </span>
          
          <button
            onClick={() => {
              if (containerRef.current) {
                containerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
              }
            }}
            className="w-8 h-8 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 transition-colors"
            aria-label="Scroll right"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageThumbnailStrip;
