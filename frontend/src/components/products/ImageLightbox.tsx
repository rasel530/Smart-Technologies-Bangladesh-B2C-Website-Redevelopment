/**
 * ImageLightbox Component
 * 
 * Full-screen image viewer with tap-to-zoom on mobile, hover zoom on desktop,
 * pan functionality, full-screen navigation, thumbnail strip, keyboard navigation,
 * zoom level persistence, close button, image counter, and smooth animations.
 */

'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import { ProductImage } from '@/types/product-image';
import { getImageUrl, getAltText } from '@/lib/api/product-images';

interface ImageLightboxProps {
  isOpen: boolean;
  images: ProductImage[];
  currentIndex: number;
  productName: string;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onIndexChange: (index: number) => void;
}

/**
 * ImageLightbox Component
 * 
 * @param isOpen - Lightbox open state
 * @param images - Array of product images
 * @param currentIndex - Current image index
 * @param productName - Product name for alt text
 * @param onClose - Callback on close
 * @param onNext - Callback on next image
 * @param onPrevious - Callback on previous image
 * @param onIndexChange - Callback on index change
 */
export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  isOpen,
  images,
  currentIndex,
  productName,
  onClose,
  onNext,
  onPrevious,
  onIndexChange
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showThumbnails, setShowThumbnails] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const [isClient, setIsClient] = useState(false);

  // Sort images by display order (memoized)
  const sortedImages = useMemo(() => 
    [...images].sort((a, b) => a.displayOrder - b.displayOrder), 
    [images]
  );
  const currentImage = sortedImages[currentIndex] || sortedImages[0];

  // Track mount state for cleanup
  useEffect(() => {
    isMountedRef.current = true;
    // Set client flag after mount to prevent hydration issues
    setIsClient(true);
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load saved zoom level from localStorage
  useEffect(() => {
    if (isMountedRef.current) {
      const savedZoom = localStorage.getItem('lightboxZoom');
      if (savedZoom) {
        setZoom(parseFloat(savedZoom));
      }
    }
  }, []);

  // Save zoom level to localStorage
  useEffect(() => {
    if (isMountedRef.current) {
      localStorage.setItem('lightboxZoom', zoom.toString());
    }
  }, [zoom]);

  // Reset zoom when image changes
  useEffect(() => {
    if (isMountedRef.current) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [currentIndex]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          onPrevious();
          break;
        case 'ArrowRight':
          onNext();
          break;
        case '+':
        case '=':
          setZoom(prev => Math.min(prev + 0.25, 3));
          break;
        case '-':
        case '_':
          setZoom(prev => Math.max(prev - 0.25, 1));
          break;
        case '0':
          setZoom(1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNext, onPrevious]);

  // Handle zoom on desktop (mouse wheel)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.25 : 0.25;
    setZoom(prev => Math.max(1, Math.min(3, prev + delta)));
  }, []);

  // Handle tap to zoom on mobile
  const handleTap = useCallback((e: React.MouseEvent) => {
    if (zoom === 1) {
      setZoom(2);
    } else {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [zoom]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [zoom, pan]);

  // Handle drag move
  const handleDragMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle thumbnail click
  const handleThumbnailClick = useCallback((index: number) => {
    onIndexChange(index);
  }, [onIndexChange]);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.25, 1));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/95 z-50 flex flex-col"
      onClick={(e) => {
        // Only close if clicking directly on the background, not on content
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <span className="text-white/80 text-lg">
            {currentIndex + 1} / {sortedImages.length}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Zoom Controls */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              zoomOut();
            }}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            aria-label="Zoom out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          
          <span className="text-white/80 text-sm w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              zoomIn();
            }}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            aria-label="Zoom in"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              resetZoom();
            }}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            aria-label="Reset zoom"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
        
        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          aria-label="Close lightbox"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main Image Container */}
      <div
        ref={containerRef}
        className="flex-1 relative flex items-center justify-center py-8"
        onWheel={handleWheel}
      >
        <div
          ref={imageRef}
          className="relative cursor-grab active:cursor-grabbing max-w-full max-h-full"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
          }}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onClick={handleTap}
        >
          <Image
            key={`lightbox-main-${currentImage.id}`}
            src={getImageUrl(currentImage, 'original')}
            alt={getAltText(currentImage) || `${productName} - Image ${currentIndex + 1}`}
            width={currentImage.width || 1200}
            height={currentImage.height || 1200}
            className="max-w-full max-h-[70vh] w-auto h-auto object-contain"
            draggable={false}
            priority
          />
        </div>

        {/* Navigation Arrows */}
        {sortedImages.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onPrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors z-50 pointer-events-auto cursor-pointer"
              aria-label="Previous image"
              type="button"
            >
              <svg className="w-8 h-8 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors z-50 pointer-events-auto cursor-pointer"
              aria-label="Next image"
              type="button"
            >
              <svg className="w-8 h-8 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Zoom Hint */}
        {zoom === 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            Click or scroll to zoom
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {showThumbnails && sortedImages.length > 1 && (
        <div className="p-4 bg-black/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/80 text-sm">Thumbnails</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowThumbnails(!showThumbnails);
              }}
              className="text-white/60 hover:text-white text-sm"
            >
              {showThumbnails ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {sortedImages.map((image, index) => (
              <button
                key={image.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleThumbnailClick(index);
                }}
                className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-white ring-2 ring-white/50'
                    : 'border-white/30 hover:border-white/60'
                }`}
                aria-label={`View image ${index + 1}`}
                aria-current={index === currentIndex ? 'true' : 'false'}
              >
                <Image
                  key={`lightbox-thumb-${image.id}`}
                  src={getImageUrl(image, 'thumbnail')}
                  alt={getAltText(image) || `Thumbnail ${index + 1}`}
                  fill
                  // Priority load first 3 thumbnails to prevent NS_BINDING_ABORTED
                  priority={index < 3}
                  loading={index < 3 ? 'eager' : 'lazy'}
                  className="object-cover"
                  sizes="64px"
                />
                {image.isPrimary && (
                  <div className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] px-1 rounded">
                    Primary
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageLightbox;
