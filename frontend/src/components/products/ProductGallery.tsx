/**
 * ProductGallery Component
 * 
 * Responsive image gallery with main image display, thumbnail navigation,
 * carousel/slider, dot indicators, arrow navigation, auto-advance,
 * smooth transitions, lazy loading, dark mode support, and touch gestures.
 */

'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import { ProductImage } from '@/types/product-image';
import { getImageUrl, getAltText } from '@/lib/api/product-images';

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
  onImageSelect?: (image: ProductImage) => void;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showThumbnails?: boolean;
  lazyLoad?: boolean;
}

/**
 * ProductGallery Component
 * 
 * @param images - Array of product images
 * @param productName - Product name for alt text
 * @param onImageSelect - Callback on image selection
 * @param autoPlay - Enable auto-advance (default: false)
 * @param autoPlayInterval - Auto-advance interval in ms (default: 5000)
 * @param showThumbnails - Show thumbnail strip (default: true)
 * @param lazyLoad - Enable lazy loading (default: true)
 */
export const ProductGallery: React.FC<ProductGalleryProps> = ({
  images,
  productName,
  onImageSelect,
  autoPlay = false,
  autoPlayInterval = 5000,
  showThumbnails = true,
  lazyLoad = true
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  // Track which images are currently loading to prevent redundant requests
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  
  const galleryRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Sort images by display order (memoized to prevent unnecessary re-sorts)
  const sortedImages = useMemo(() => 
    [...images].sort((a, b) => a.displayOrder - b.displayOrder), 
    [images]
  );
  const currentImage = sortedImages[currentIndex] || sortedImages[0];

  // Track mount state for cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && sortedImages.length > 1) {
      autoPlayRef.current = setInterval(() => {
        if (isMountedRef.current) {
          setCurrentIndex(prev => (prev + 1) % sortedImages.length);
        }
      }, autoPlayInterval);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [autoPlay, autoPlayInterval, sortedImages.length]);

  // Reset loaded state when image changes
  useEffect(() => {
    if (isMountedRef.current) {
      setIsLoaded(false);
    }
  }, [currentIndex]);

  // Track image loading state to prevent redundant requests
  const handleImageLoad = useCallback((imageId: string) => {
    if (isMountedRef.current) {
      setLoadingStates(prev => ({ ...prev, [imageId]: false }));
    }
  }, []);

  const handleImageError = useCallback((imageId: string) => {
    if (isMountedRef.current) {
      setLoadingStates(prev => ({ ...prev, [imageId]: false }));
    }
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) {
        switch (e.key) {
          case 'ArrowLeft':
            setCurrentIndex(prev => (prev > 0 ? prev - 1 : sortedImages.length - 1));
            break;
          case 'ArrowRight':
            setCurrentIndex(prev => (prev < sortedImages.length - 1 ? prev + 1 : 0));
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, sortedImages.length]);

  // Touch handlers for swipe gestures
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCurrentIndex(prev => (prev < sortedImages.length - 1 ? prev + 1 : 0));
    } else if (isRightSwipe) {
      setCurrentIndex(prev => (prev > 0 ? prev - 1 : sortedImages.length - 1));
    }
  }, [touchStart, touchEnd, sortedImages.length]);

  // Navigation handlers
  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : sortedImages.length - 1));
  }, [sortedImages.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev < sortedImages.length - 1 ? prev + 1 : 0));
  }, [sortedImages.length]);

  const goToImage = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsLoaded(false);
  }, []);

  const handleImageClick = useCallback(() => {
    setIsLightboxOpen(true);
    if (currentImage && onImageSelect) {
      onImageSelect(currentImage);
    }
  }, [currentImage, onImageSelect]);

  // Pause auto-play on user interaction
  const handleUserInteraction = useCallback(() => {
    if (autoPlay && autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  }, [autoPlay]);

  if (sortedImages.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">No images available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" ref={galleryRef}>
      {/* Main Image Display */}
      <div
        className="relative aspect-square bg-white dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 cursor-zoom-in group"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleImageClick}
        onMouseEnter={handleUserInteraction}
      >
        {sortedImages.map((image, index) => (
          <div
            key={image.id}
            className={`absolute inset-0 transition-opacity duration-300 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <Image
              // Use stable key without prefix to prevent re-mounting
              key={image.id}
              src={getImageUrl(image, 'large')}
              alt={getAltText(image) || `${productName} - Image ${index + 1}`}
              fill
              className={`object-contain transition-transform duration-200 group-hover:scale-105 ${
                isLoaded ? '' : 'opacity-0'
              }`}
              sizes="(max-width: 320px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1440px) 33vw, 33vw"
              priority={index === 0}
              loading={lazyLoad && index > 0 ? 'lazy' : 'eager'}
              onLoad={() => {
                setIsLoaded(true);
                handleImageLoad(image.id);
              }}
              onError={() => handleImageError(image.id)}
            />
          </div>
        ))}

        {/* Loading Skeleton */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse" />
        )}

        {/* Navigation Arrows */}
        {sortedImages.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-gray-800"
              aria-label="Previous image"
            >
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-gray-800"
              aria-label="Next image"
            >
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Image Counter */}
        {sortedImages.length > 1 && (
          <div className="absolute bottom-4 left-4 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
            {currentIndex + 1} / {sortedImages.length}
          </div>
        )}

        {/* Zoom Hint */}
        <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          Click to enlarge
        </div>
      </div>

      {/* Dot Indicators */}
      {sortedImages.length > 1 && (
        <div className="flex justify-center space-x-2">
          {sortedImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-blue-600 w-6'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
              aria-label={`Go to image ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : 'false'}
            />
          ))}
        </div>
      )}

      {/* Thumbnail Strip */}
      {showThumbnails && sortedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {sortedImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => goToImage(index)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-blue-600 ring-2 ring-blue-100 dark:ring-blue-900'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              aria-label={`View image ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : 'false'}
            >
              <Image
                // Use stable key without prefix to prevent re-mounting
                key={image.id}
                src={getImageUrl(image, 'thumbnail')}
                alt={getAltText(image) || `Thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
                loading={index < 3 ? 'eager' : 'lazy'}
                priority={index < 3}
                onLoad={() => handleImageLoad(image.id)}
                onError={() => handleImageError(image.id)}
              />
              {image.isPrimary && (
                <div className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] px-1 rounded">
                  Primary
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 w-12 h-12 text-white/80 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Close lightbox"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Navigation Arrows */}
          {sortedImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="Previous image"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="Next image"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Main Lightbox Image */}
          <div className="relative w-full h-full max-w-6xl max-h-[90vh] mx-auto p-4 flex items-center justify-center">
            <Image
              // Use stable key without prefix to prevent re-mounting
              key={currentImage.id}
              src={getImageUrl(currentImage, 'original')}
              alt={getAltText(currentImage) || `${productName} - Image ${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
              onLoad={() => handleImageLoad(currentImage.id)}
              onError={() => handleImageError(currentImage.id)}
            />
          </div>

          {/* Image Counter */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/80 text-lg">
            {currentIndex + 1} / {sortedImages.length}
          </div>

          {/* Thumbnail Strip in Lightbox */}
          {showThumbnails && sortedImages.length > 1 && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw]">
              {sortedImages.map((image, index) => (
                <button
                  key={image.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToImage(index);
                  }}
                  className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentIndex
                      ? 'border-white ring-2 ring-white/50'
                      : 'border-white/30 hover:border-white/60'
                  }`}
                  aria-label={`View image ${index + 1}`}
                >
                  <Image
                    // Use stable key without prefix to prevent re-mounting
                    key={image.id}
                    src={getImageUrl(image, 'thumbnail')}
                    alt={getAltText(image) || `Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                    loading={index < 3 ? 'eager' : 'lazy'}
                    priority={index < 3}
                    onLoad={() => handleImageLoad(image.id)}
                    onError={() => handleImageError(image.id)}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
