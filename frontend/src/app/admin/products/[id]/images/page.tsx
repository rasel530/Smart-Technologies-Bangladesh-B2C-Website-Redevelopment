/**
 * Product Image Management Page (Admin)
 * 
 * Complete image management interface for a product with image listing with thumbnail previews,
 * bulk upload interface (max 10 images at once), alt text management for each image,
 * primary image selection, image reordering with visual feedback, delete with confirmation dialog,
 * upload progress tracking, processing status indicators (uploaded, processing, failed),
 * image statistics (total images, total size, storage quota), breadcrumb navigation,
 * and back to product details link.
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ProductImage, MAX_IMAGES_PER_PRODUCT } from '@/types/product-image';
import { useAdminProductImages, useImageStatistics, useAdminImageUpload } from '@/hooks/useAdminProductImages';
import { getImageUrl, getAltText } from '@/lib/api/product-images';
import { withAuth } from '@/components/auth/withAuth';
import ImageUpload from '@/components/products/ImageUpload';
import ImageReorder from '@/components/admin/ImageReorder';
import ImageAltTextEditor from '@/components/admin/ImageAltTextEditor';
import ProductImageEditModal from '@/components/admin/ProductImageEditModal';
import ImageProcessingQueue from '@/components/admin/ImageProcessingQueue';
import BulkImageOperations from '@/components/admin/BulkImageOperations';
import ImageStorageQuota from '@/components/admin/ImageStorageQuota';
import productsApi from '@/lib/api/products';

function ProductImagesPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  
  const [product, setProduct] = useState<{ id: string; name: string; sku: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload' | 'reorder' | 'queue'>('gallery');
  const [editingImage, setEditingImage] = useState<ProductImage | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const {
    images,
    loading: imagesLoading,
    error: imagesError,
    selectedImages,
    refetch,
    toggleImageSelection,
    selectAllImages,
    deselectAllImages
  } = useAdminProductImages(productId);

  const statistics = useImageStatistics(images);
  const { uploading, progress, uploadImages, reset: resetUpload } = useAdminImageUpload();

  // Fetch product info
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productData = await productsApi.getById(productId);
        setProduct({
          id: productData.id,
          name: productData.name,
          sku: productData.sku
        });
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Handle image upload complete
  const handleUploadComplete = useCallback((uploadedImages: ProductImage[]) => {
    refetch();
    setActiveTab('gallery');
    resetUpload();
  }, [refetch, resetUpload]);

  // Handle image update
  const handleImageUpdate = useCallback(() => {
    refetch();
  }, [refetch]);

  // Handle image delete
  const handleImageDelete = useCallback(() => {
    refetch();
  }, [refetch]);

  // Handle image reorder
  const handleImageReorder = useCallback((reorderedImages: ProductImage[]) => {
    refetch();
  }, [refetch]);

  // Handle set primary
  const handleSetPrimary = useCallback((imageId: string) => {
    refetch();
  }, [refetch]);

  // Handle edit image
  const handleEditImage = useCallback((image: ProductImage) => {
    setEditingImage(image);
    setIsEditModalOpen(true);
  }, []);

  // Handle close edit modal
  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingImage(null);
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="ml-4 text-gray-600 dark:text-gray-400">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-red-600 dark:text-red-400">Product not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <Link href="/admin" className="hover:text-gray-900 dark:hover:text-gray-100">
            Admin
          </Link>
          <span>/</span>
          <Link href="/admin/products" className="hover:text-gray-900 dark:hover:text-gray-100">
            Products
          </Link>
          <span>/</span>
          <Link href={`/admin/products/${productId}/edit`} className="hover:text-gray-900 dark:hover:text-gray-100">
            {product.name}
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100">Images</span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Product Images
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {product.name} <span className="text-gray-400">({product.sku})</span>
              </p>
            </div>
            <Link
              href={`/admin/products/${productId}/edit`}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              ← Back to Product Details
            </Link>
          </div>
        </div>

        {/* Image Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Images</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {statistics.totalImages}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {MAX_IMAGES_PER_PRODUCT - statistics.totalImages} remaining
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Size</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatBytes(statistics.totalSize)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {formatBytes(statistics.averageSize)} avg
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Primary Image</p>
            <p className={`text-2xl font-bold ${statistics.hasPrimaryImage ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {statistics.hasPrimaryImage ? '✓' : '✗'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {statistics.primaryImages} set
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Processing</p>
            <p className={`text-2xl font-bold ${statistics.hasProcessingImages ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
              {statistics.processingImages}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {statistics.failedImages} failed
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'gallery'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <span className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Gallery ({images.length})</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'upload'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <span className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Upload</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('reorder')}
              className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'reorder'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <span className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
                <span>Reorder</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'queue'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <span className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Processing Queue</span>
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Gallery Tab */}
          {activeTab === 'gallery' && (
            <div className="space-y-6">
              {/* Bulk Operations */}
              <BulkImageOperations
                productId={productId}
                images={images}
                selectedImages={selectedImages}
                onUpdate={handleImageUpdate}
                onSelectionChange={(selected) => {
                  // Update selection state manually
                  selected.forEach(id => toggleImageSelection(id));
                }}
              />

              {/* Image Grid */}
              {imagesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : images.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center shadow-sm border border-gray-200 dark:border-gray-700">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">No images uploaded yet</p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Upload Images
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((image, index) => {
                    const isSelected = selectedImages.has(image.id);
                    return (
                      <div
                        key={image.id}
                        className={`relative group bg-white dark:bg-gray-800 rounded-lg border-2 overflow-hidden transition-all ${
                          isSelected
                            ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleImageSelection(image.id)}
                          className="absolute top-2 left-2 w-6 h-6 rounded border-2 flex items-center justify-center z-10 transition-colors"
                          style={{
                            backgroundColor: isSelected ? '#2563eb' : (document.documentElement.classList.contains('dark') ? '#374151' : '#ffffff'),
                            borderColor: isSelected ? '#2563eb' : '#d1d5db'
                          }}
                          aria-label={isSelected ? 'Deselect' : 'Select'}
                        >
                          {isSelected && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>

                        {/* Image Preview */}
                        <div className="relative aspect-square">
                          <Image
                            src={getImageUrl(image, 'thumbnail')}
                            alt={getAltText(image) || `Image ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="200px"
                          />
                          
                          {/* Primary Badge */}
                          {image.isPrimary && (
                            <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                              Primary
                            </div>
                          )}

                          {/* Status Badge */}
                          {image.processingStatus !== 'completed' && (
                            <div className="absolute bottom-2 left-2">
                              {getStatusBadge(image.processingStatus)}
                            </div>
                          )}

                          {/* Edit Button */}
                          <button
                            onClick={() => handleEditImage(image)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            aria-label="Edit image"
                          >
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>

                        {/* Image Info */}
                        <div className="p-3">
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {getAltText(image) || `Image ${index + 1}`}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {formatBytes(image.fileSizeBytes || 0)}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              #{image.displayOrder + 1}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Storage Quota */}
              <ImageStorageQuota
                images={images}
                productId={productId}
              />
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <ImageUpload
                productId={productId}
                productName={product.name}
                onUploadComplete={handleUploadComplete}
                maxImages={MAX_IMAGES_PER_PRODUCT}
                existingImages={images}
              />
            </div>
          )}

          {/* Reorder Tab */}
          {activeTab === 'reorder' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <ImageReorder
                productId={productId}
                images={images}
                onReorder={handleImageReorder}
                onSetPrimary={handleSetPrimary}
                onDelete={handleImageDelete}
              />
            </div>
          )}

          {/* Queue Tab */}
          {activeTab === 'queue' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <ImageProcessingQueue
                productId={productId}
                autoRefresh={true}
                refreshInterval={5000}
              />
            </div>
          )}
        </div>

        {/* Error Display */}
        {imagesError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700 dark:text-red-400 flex-1">
                {imagesError}
              </p>
              <button
                onClick={refetch}
                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <ProductImageEditModal
        image={editingImage}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onUpdate={handleImageUpdate}
        onDelete={handleImageDelete}
      />
    </div>
  );
}

export default withAuth(ProductImagesPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
