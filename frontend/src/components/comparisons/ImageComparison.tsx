/**
 * Image Comparison Component
 *
 * Component for comparing product images side-by-side.
 * Features primary image display, image gallery, carousel, and zoom functionality.
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, X } from 'lucide-react';
import { ComparisonImageData } from '@/types/comparison';
import { getImageUrl } from '@/lib/api/product-images';

interface ImageComparisonProps {
  images: ComparisonImageData;
  productNames: { [productId: string]: string };
  className?: string;
}

export function ImageComparison({
  images,
  productNames,
  className = '',
}: ImageComparisonProps) {
  // Initialize selected image indices to 0 for all products
  const initialIndices: { [productId: string]: number } = {};
  images.products.forEach((p) => {
    initialIndices[p.productId] = 0;
  });

  const [selectedImageIndices, setSelectedImageIndices] = useState<{ [productId: string]: number }>(initialIndices);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<{ productId: string; imageIndex: number } | null>(null);

  const handlePreviousImage = (productId: string) => {
    const product = images.products.find((p) => p.productId === productId);
    if (!product || product.images.length === 0) return;

    const currentIndex = selectedImageIndices[productId] || 0;
    const newIndex = currentIndex === 0 ? product.images.length - 1 : currentIndex - 1;
    setSelectedImageIndices((prev) => ({ ...prev, [productId]: newIndex }));
  };

  const handleNextImage = (productId: string) => {
    const product = images.products.find((p) => p.productId === productId);
    if (!product || product.images.length === 0) return;

    const currentIndex = selectedImageIndices[productId] || 0;
    const newIndex = currentIndex === product.images.length - 1 ? 0 : currentIndex + 1;
    setSelectedImageIndices((prev) => ({ ...prev, [productId]: newIndex }));
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
    setIsZoomed(true);
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 1));
    if (zoomLevel - 0.5 <= 1) {
      setIsZoomed(false);
    }
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setIsZoomed(false);
  };

  const handleImageClick = (productId: string, imageIndex: number) => {
    setFullscreenImage({ productId, imageIndex });
  };

  const handleCloseFullscreen = () => {
    setFullscreenImage(null);
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">Image Comparison</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleZoomOut();
              }
            }}
            disabled={zoomLevel <= 1}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Zoom out"
            tabIndex={0}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-gray-700 w-12 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleZoomIn();
              }
            }}
            disabled={zoomLevel >= 3}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Zoom in"
            tabIndex={0}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          {isZoomed && (
            <button
              onClick={handleResetZoom}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleResetZoom();
                }
              }}
              className="ml-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
              aria-label="Reset zoom"
              tabIndex={0}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Image Grid */}
      <div className="p-4">
        <div
          className={`grid gap-4 ${
            images.products.length === 1
              ? 'grid-cols-1'
              : images.products.length === 2
              ? 'grid-cols-1 md:grid-cols-2'
              : images.products.length === 3
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
          }`}
        >
          {images.products.map((product) => {
            const currentImageIndex = selectedImageIndices[product.productId] || 0;
            const currentImage = product.images[currentImageIndex];

            return (
              <div key={product.productId} className="space-y-2">
                {/* Product Name */}
                <p className="text-sm font-medium text-gray-900 truncate">
                  {productNames[product.productId] || `Product ${product.productId}`}
                </p>

                {/* Main Image */}
                <div
                  className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer group"
                  onClick={() => handleImageClick(product.productId, currentImageIndex)}
                >
                  {currentImage ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={getImageUrl(currentImage, 'large')}
                        alt={productNames[product.productId]}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  {/* Image Navigation */}
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviousImage(product.productId);
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNextImage(product.productId);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-4 h-4 text-gray-700" />
                      </button>
                    </>
                  )}

                  {/* Image Counter */}
                  {product.images.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/70 text-white text-xs rounded-full">
                      {currentImageIndex + 1} / {product.images.length}
                    </div>
                  )}
                </div>

                {/* Thumbnail Gallery */}
                {product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-1">
                    {product.images.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() =>
                          setSelectedImageIndices((prev) => ({ ...prev, [product.productId]: index }))
                        }
                        className={`relative aspect-square rounded overflow-hidden border-2 transition-colors ${
                          index === currentImageIndex ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
                        }`}
                        aria-label={`View image ${index + 1}`}
                      >
                        <Image
                          src={getImageUrl(image, 'thumbnail')}
                          alt={`${productNames[product.productId]} thumbnail ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="25vw"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="fullscreen-title"
          onClick={handleCloseFullscreen}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleCloseFullscreen();
            }
          }}
        >
          <button
            onClick={handleCloseFullscreen}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCloseFullscreen();
              }
            }}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close fullscreen"
            tabIndex={0}
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="relative max-w-5xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={
                getImageUrl(
                  images.products
                    .find((p) => p.productId === fullscreenImage.productId)
                    ?.images[fullscreenImage.imageIndex]!,
                  'original'
                )
              }
              alt={productNames[fullscreenImage.productId]}
              width={1200}
              height={1200}
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>

          {/* Navigation */}
          {images.products.find((p) => p.productId === fullscreenImage.productId)?.images.length! > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreviousImage(fullscreenImage.productId);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    handlePreviousImage(fullscreenImage.productId);
                  }
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                aria-label="Previous image"
                tabIndex={0}
              >
                <ChevronLeft className="w-8 h-8 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextImage(fullscreenImage.productId);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    handleNextImage(fullscreenImage.productId);
                  }
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                aria-label="Next image"
                tabIndex={0}
              >
                <ChevronRight className="w-8 h-8 text-white" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-sm text-gray-600">
          <strong>Tip:</strong> Click on any image to view it in fullscreen. Use the zoom controls to see details.
        </p>
      </div>
    </div>
  );
}

export default ImageComparison;
