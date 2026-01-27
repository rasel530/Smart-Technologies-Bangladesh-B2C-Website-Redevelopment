/**
 * ProductImageGallery Component
 * 
 * An image gallery component for product images with zoom, thumbnails, and lightbox.
 * Features include main image display, thumbnail navigation, and full-size lightbox.
 * 
 * @component
 */

'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { ProductImage } from '@/types/product';

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
  className?: string;
}

/**
 * ProductImageGallery Component
 * 
 * @param {ProductImageGalleryProps} props - Component props
 * @returns {JSX.Element} Product image gallery component
 */
export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  images,
  productName,
  className = ''
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  // Get current image
  const currentImage = images[selectedIndex] || {
    id: '',
    productId: '',
    url: '/images/placeholder-product.png',
    alt: productName,
    sortOrder: 0
  };

  // Handle thumbnail click
  const handleThumbnailClick = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  // Handle previous image
  const handlePrevious = useCallback(() => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  // Handle next image
  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  // Handle image error
  const handleImageError = useCallback((index: number) => {
    setImageErrors((prev) => new Set(Array.from(prev).concat([index])));
  }, []);

  // Handle lightbox open
  const handleLightboxOpen = useCallback(() => {
    setIsLightboxOpen(true);
  }, []);

  // Handle lightbox close
  const handleLightboxClose = useCallback(() => {
    setIsLightboxOpen(false);
  }, []);

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        handleLightboxClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, handlePrevious, handleNext, handleLightboxClose]);

  // Prevent body scroll when lightbox is open
  React.useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLightboxOpen]);

  // If no images, show placeholder
  if (images.length === 0) {
    return (
      <div className={`aspect-square bg-gray-100 rounded-lg overflow-hidden ${className}`}>
        <div className="w-full h-full flex items-center justify-center">
          <svg
            className="w-24 h-24 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Main Image */}
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
        <button
          onClick={handleLightboxOpen}
          className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="View full-size image"
        >
          <div className="bg-black/50 text-white p-3 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </div>
        </button>

        {!imageErrors.has(selectedIndex) ? (
          <Image
            src={currentImage.url}
            alt={currentImage.alt || productName}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => handleImageError(selectedIndex)}
            priority={selectedIndex === 0}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <svg
              className="w-24 h-24 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Navigation Arrows (only show if multiple images) */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Previous image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Next image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded">
            {selectedIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-5 gap-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => handleThumbnailClick(index)}
              className={`
                relative aspect-square rounded-lg overflow-hidden border-2 transition-all
                ${selectedIndex === index
                  ? 'border-primary-600 ring-2 ring-primary-600 ring-offset-2'
                  : 'border-transparent hover:border-gray-300'
                }
              `}
              aria-label={`View image ${index + 1}`}
            >
              {!imageErrors.has(index) ? (
                <Image
                  src={image.url}
                  alt={image.alt || `${productName} - Image ${index + 1}`}
                  fill
                  className="object-cover"
                  onError={() => handleImageError(index)}
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={handleLightboxClose}
        >
          <button
            onClick={handleLightboxClose}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors focus:outline-none"
            aria-label="Close lightbox"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Previous Button */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              className="absolute left-4 text-white hover:text-gray-300 transition-colors focus:outline-none"
              aria-label="Previous image"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Lightbox Image */}
          <div className="relative max-w-4xl max-h-[80vh] w-full">
            {!imageErrors.has(selectedIndex) ? (
              <Image
                src={currentImage.url}
                alt={currentImage.alt || productName}
                width={800}
                height={800}
                className="w-full h-auto object-contain"
                priority
              />
            ) : (
              <div className="w-full h-96 flex items-center justify-center bg-gray-800 rounded-lg">
                <svg
                  className="w-24 h-24 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Next Button */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 text-white hover:text-gray-300 transition-colors focus:outline-none"
              aria-label="Next image"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
              {selectedIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
