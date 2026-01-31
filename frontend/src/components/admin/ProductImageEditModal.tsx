/**
 * ProductImageEditModal Component (Admin)
 * 
 * Modal for editing individual image with image preview with all size variants,
 * alt text editing (Bengali and English), set as primary toggle,
 * display order input, delete button with confirmation, save and cancel buttons,
 * form validation, and error messages in Bengali and English.
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { ProductImage, UpdateProductImageRequest } from '@/types/product-image';
import { getImageUrl, getAltText, updateProductImage, deleteProductImage, setPrimaryImage } from '@/lib/api/product-images';

interface ProductImageEditModalProps {
  image: ProductImage | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onDelete?: () => void;
}

/**
 * ProductImageEditModal Component
 * 
 * @param image - Image to edit
 * @param isOpen - Whether modal is open
 * @param onClose - Callback on close
 * @param onUpdate - Callback on update
 * @param onDelete - Callback on delete
 */
export const ProductImageEditModal: React.FC<ProductImageEditModalProps> = ({
  image,
  isOpen,
  onClose,
  onUpdate,
  onDelete
}) => {
  const [altTextBn, setAltTextBn] = useState('');
  const [altTextEn, setAltTextEn] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isPrimary, setIsPrimary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<'thumbnail' | 'small' | 'medium' | 'large' | 'original'>('original');

  // Reset form when image changes
  useEffect(() => {
    if (image) {
      setAltTextBn(image.altTextBn || '');
      setAltTextEn(image.altTextEn || '');
      setDisplayOrder(image.displayOrder);
      setIsPrimary(image.isPrimary);
      setError(null);
      setSelectedVariant('original');
    }
  }, [image]);

  const handleSave = useCallback(async () => {
    if (!image) return;

    // Validation
    if (!altTextBn.trim() && !altTextEn.trim()) {
      setError('Alt text cannot be empty in both languages');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updateData: UpdateProductImageRequest = {
        altTextBn: altTextBn || undefined,
        altTextEn: altTextEn || undefined,
        displayOrder,
        isPrimary
      };

      await updateProductImage(image.id, updateData);
      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update image');
    } finally {
      setSaving(false);
    }
  }, [image, altTextBn, altTextEn, displayOrder, isPrimary, onUpdate, onClose]);

  const handleDelete = useCallback(async () => {
    if (!image) return;

    setDeleting(true);
    setError(null);

    try {
      await deleteProductImage(image.id);
      onDelete?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete image');
    } finally {
      setDeleting(false);
    }
  }, [image, onDelete, onClose]);

  const handleSetPrimary = useCallback(async () => {
    if (!image || image.isPrimary) return;

    try {
      await setPrimaryImage(image.id);
      setIsPrimary(true);
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to set primary image');
    }
  }, [image, onUpdate]);

  const getErrorMessage = (error: string): { bn: string; en: string } => {
    // Bilingual error messages
    const errorMessages: Record<string, { bn: string; en: string }> = {
      'Alt text cannot be empty in both languages': {
        bn: 'উভয় ভাষাতেই অল্ট টেক্সট খালি থাকতে পারে না',
        en: 'Alt text cannot be empty in both languages'
      },
      'Failed to update image': {
        bn: 'ইমেজ আপডেট করতে ব্যর্থ হয়েছে',
        en: 'Failed to update image'
      },
      'Failed to delete image': {
        bn: 'ইমেজ মুছে ফেলতে ব্যর্থ হয়েছে',
        en: 'Failed to delete image'
      },
      'Failed to set primary image': {
        bn: 'প্রাইমারি ইমেজ সেট করতে ব্যর্থ হয়েছে',
        en: 'Failed to set primary image'
      }
    };

    return errorMessages[error] || {
      bn: error,
      en: error
    };
  };

  if (!isOpen || !image) return null;

  const errorMessage = error ? getErrorMessage(error) : null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Edit Image
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Image Preview */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Image Preview
            </h3>
            
            {/* Variant Selector */}
            <div className="flex flex-wrap gap-2">
              {(['thumbnail', 'small', 'medium', 'large', 'original'] as const).map((variant) => (
                <button
                  key={variant}
                  onClick={() => setSelectedVariant(variant)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedVariant === variant
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {variant.charAt(0).toUpperCase() + variant.slice(1)}
                </button>
              ))}
            </div>

            {/* Image Display */}
            <div className="relative bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden aspect-square">
              <Image
                src={getImageUrl(image, selectedVariant)}
                alt={getAltText(image) || 'Image preview'}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                priority
              />
              
              {/* Primary Badge */}
              {image.isPrimary && (
                <div className="absolute top-4 left-4 bg-blue-600 text-white text-sm px-3 py-1.5 rounded-full">
                  Primary Image
                </div>
              )}

              {/* Dimensions */}
              {image.width && image.height && (
                <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {image.width} × {image.height}
                </div>
              )}
            </div>

            {/* Image Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-gray-600 dark:text-gray-400">File Size</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {((image.fileSizeBytes || 0) / 1024).toFixed(2)} KB
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-gray-600 dark:text-gray-400">MIME Type</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {image.mimeType || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Image Details
            </h3>

            {/* Alt Text - Bengali */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Alt Text (বাংলা)
              </label>
              <input
                type="text"
                value={altTextBn}
                onChange={(e) => setAltTextBn(e.target.value)}
                placeholder="ইমেজের জন্য অল্ট টেক্সট লিখুন"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Alt Text - English */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Alt Text (English)
              </label>
              <input
                type="text"
                value={altTextEn}
                onChange={(e) => setAltTextEn(e.target.value)}
                placeholder="Enter alt text for the image"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Display Order
              </label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Lower numbers appear first in the gallery
              </p>
            </div>

            {/* Set as Primary */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleSetPrimary}
                disabled={image.isPrimary}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  image.isPrimary
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 cursor-default'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {image.isPrimary ? '✓ Primary Image' : 'Set as Primary'}
              </button>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This image will be shown first in product listings
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-red-700 dark:text-red-400 mb-1">
                    {errorMessage.en}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    {errorMessage.bn}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {deleting ? 'Deleting...' : 'Delete Image'}
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              disabled={saving || deleting}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || deleting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Delete Image?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Are you sure you want to delete this image?
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductImageEditModal;
