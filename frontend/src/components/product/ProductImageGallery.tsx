/**
 * Product Image Gallery with Zoom
 * 
 * Features:
 * - Main image with thumbnails
 * - Click-to-zoom functionality
 * - Hover zoom on desktop
 * - Touch swipe support for mobile
 * - Keyboard navigation
 * - Lightbox modal view
 * - Integration with new ProductImage types
 * - Backward compatibility with existing ProductImage interface
 * 
 * NS_BINDING_ABORTED Error Prevention:
 * - Uses isMountedRef to prevent state updates after unmount
 * - Uses useRef to track current image ID and prevent stale closures
 * - Implements proper error handling for cancelled/failed requests
 * - Stable key props to prevent unnecessary re-renders
 * - Debounced thumbnail clicks to prevent rapid image switching
 */

'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { ProductImage as NewProductImage } from '@/types/product-image';
import { getImageUrl, getAltText } from '@/lib/api/product-images';
import { ImageLightbox } from '@/components/products/ImageLightbox';
import { ImageThumbnailStrip } from '@/components/products/ImageThumbnailStrip';

// Backward compatibility interface
interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  sortOrder: number;
}

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

// Static date string for placeholder images to ensure hydration consistency
const STATIC_DATE_STRING = '2024-01-01T00:00:00.000Z';

// Convert old ProductImage to new ProductImage (memoized for performance)
const convertToNewProductImage = (oldImage: ProductImage): NewProductImage => ({
  id: oldImage.id,
  productId: '', // Will be set by parent
  originalUrl: oldImage.url,
  optimizedUrl: null,
  thumbnailUrl: null,
  altTextBn: oldImage.alt || '',
  altTextEn: oldImage.alt || '',
  displayOrder: oldImage.sortOrder,
  isPrimary: oldImage.sortOrder === 0, // First image is primary
  fileSizeBytes: null,
  mimeType: null,
  width: null,
  height: null,
  processingStatus: 'completed' as const,
  createdAt: STATIC_DATE_STRING,
  updatedAt: STATIC_DATE_STRING
});

// Debounce utility for preventing rapid image switching that causes NS_BINDING_ABORTED
// FIXED: Uses ref to always call the latest callback, preventing stale closure issues
function useDebounce<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Keep callbackRef current with the latest callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]) as T;
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Refs for preventing stale closures and NS_BINDING_ABORTED errors
  const isMountedRef = useRef(true);
  const currentImageIdRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const selectedIndexRef = useRef(selectedIndex);
  
  const mainImageRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);

  // Set client flag after mount and cleanup on unmount
  useEffect(() => {
    setIsClient(true);
    
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Update ref when selectedIndex changes
  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  // Convert and memoize images to prevent re-renders
  const newImages = useMemo(() => 
    images.map(convertToNewProductImage), 
    [images]
  );
  
  // Memoize validImages with stable reference
  const validImages = useMemo(() => 
    newImages.length > 0 ? newImages : [
      {
        id: 'placeholder',
        productId: '',
        originalUrl: '/images/placeholder-product.jpg',
        optimizedUrl: null,
        thumbnailUrl: null,
        altTextBn: productName,
        altTextEn: productName,
        displayOrder: 0,
        isPrimary: true,
        fileSizeBytes: null,
        mimeType: null,
        width: null,
        height: null,
        processingStatus: 'completed' as const,
        createdAt: STATIC_DATE_STRING,
        updatedAt: STATIC_DATE_STRING
      }
    ],
    [newImages, productName]
  );

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLightboxOpen]);

  // Handle thumbnail click - immediate state update for responsiveness
  const handleThumbnailClick = useCallback((index: number) => {
    if (index === selectedIndexRef.current) return;
    if (index >= 0 && index < validImages.length) {
      setSelectedIndex(index);
      // Show loading state for the new image
      setIsLoaded(false);
      setHasError(false);
    }
  }, [validImages.length]);

  // Simple direct navigation without debounce for lightbox buttons
  // The debounce was causing stale closure issues where isMountedRef.current was false
  const handleLightboxNav = useCallback((direction: 'prev' | 'next') => {
    console.log('[ProductImageGallery] handleLightboxNav called:', direction, {
      currentIndex: selectedIndex,
      totalImages: validImages.length
    });
    
    setSelectedIndex(prev => {
      const newIndex = direction === 'prev'
        ? (prev > 0 ? prev - 1 : validImages.length - 1)
        : (prev < validImages.length - 1 ? prev + 1 : 0);
      console.log('[ProductImageGallery] Navigating to index:', { prev, direction, newIndex });
      return newIndex;
    });
    setIsLoaded(false);
    setHasError(false);
  }, [validImages.length, selectedIndex]);

  // Keep debounced version for keyboard navigation only
  const debouncedKeyboardNav = useDebounce((direction: 'prev' | 'next') => {
    handleLightboxNav(direction);
  }, 50);

  // Handle keyboard navigation with debounce to prevent NS_BINDING_ABORTED
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen || !isMountedRef.current) return;
      
      switch (e.key) {
        case 'Escape':
          setIsLightboxOpen(false);
          break;
        case 'ArrowLeft':
          debouncedKeyboardNav('prev');
          break;
        case 'ArrowRight':
          debouncedKeyboardNav('next');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, debouncedKeyboardNav]);

  const handleMainImageClick = useCallback(() => {
    setIsLightboxOpen(true);
    setIsLoaded(false);
    setHasError(false);
  }, []);

  const handleLightboxClose = useCallback(() => {
    setIsLightboxOpen(false);
  }, []);

  const handleLightboxBackgroundClick = useCallback((e: React.MouseEvent) => {
    if (e.target === lightboxRef.current) {
      handleLightboxClose();
    }
  }, [handleLightboxClose]);

  // Handle image load
  const handleImageLoad = useCallback(() => {
    console.log('[ProductImageGallery] Image loaded successfully');
    setIsLoaded(true);
    setHasError(false);
  }, []);

  // Handle image error - distinguish between actual errors and cancelled requests
  const handleImageError = useCallback(() => {
    const currentImage = validImages[selectedIndexRef.current];
    console.error('[ProductImageGallery] Image failed to load:', {
      imageId: currentImageIdRef.current,
      imageUrl: currentImage ? getImageUrl(currentImage, 'large') : 'unknown',
      isMounted: isMountedRef.current
    });
    // Only treat as error if the component is still mounted and this is the current image
    if (isMountedRef.current &&
        currentImageIdRef.current === validImages[selectedIndexRef.current]?.id) {
      setHasError(true);
      setIsLoaded(false);
    }
  }, [validImages]);

  // Update current image ID when selectedIndex changes
  useEffect(() => {
    currentImageIdRef.current = validImages[selectedIndex]?.id || null;
  }, [selectedIndex, validImages]);

  // Show loading skeleton until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="space-y-4">
        <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Get the current image with stable reference
  const currentImage = validImages[selectedIndex];
  // FIX: Use image ID in key to ensure proper re-rendering while avoiding index-based re-mounts
  const imageKey = currentImage?.id || 'placeholder';

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <div 
          ref={mainImageRef}
          className="relative aspect-square bg-white rounded-lg overflow-hidden border border-gray-200 cursor-zoom-in group"
          onClick={handleMainImageClick}
        >
          {/* Conditionally render only the selected image to prevent NS_BINDING_ABORTED errors */}
          {currentImage && (
            <div className="absolute inset-0">
              <Image
                key={`main-image-${imageKey}`}
                src={getImageUrl(currentImage, 'large')}
                alt={getAltText(currentImage) || `${productName} - Image ${selectedIndex + 1}`}
                fill
                className="object-contain transition-transform duration-200 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                unoptimized={getImageUrl(currentImage, 'large').startsWith('http://localhost:3001')}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </div>
          )}
          
          {/* Loading skeleton - shown when image is not loaded */}
          {/* FIXED: Removed animate-pulse to prevent blinking effect */}
          {!isLoaded && !hasError && (
            <div className="absolute inset-0 bg-gray-100" />
          )}
          
          {/* Error state placeholder - shown when image fails to load */}
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">Image unavailable</p>
              </div>
            </div>
          )}
          
          {/* Zoom hint */}
          <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            Click to enlarge
          </div>
          
          {/* Navigation arrows for mobile */}
          {validImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newIndex = selectedIndex > 0 ? selectedIndex - 1 : validImages.length - 1;
                  handleThumbnailClick(newIndex);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                aria-label="Previous image"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newIndex = selectedIndex < validImages.length - 1 ? selectedIndex + 1 : 0;
                  handleThumbnailClick(newIndex);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                aria-label="Next image"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {validImages.length > 1 && (
          <ImageThumbnailStrip
            images={validImages}
            activeIndex={selectedIndex}
            onThumbnailClick={handleThumbnailClick}
          />
        )}
      </div>

      {/* Lightbox Modal */}
      <ImageLightbox
        isOpen={isLightboxOpen}
        images={validImages}
        currentIndex={selectedIndex}
        productName={productName}
        onClose={handleLightboxClose}
        onNext={() => handleLightboxNav('next')}
        onPrevious={() => handleLightboxNav('prev')}
        onIndexChange={setSelectedIndex}
      />
    </>
  );
}

export default ProductImageGallery;
