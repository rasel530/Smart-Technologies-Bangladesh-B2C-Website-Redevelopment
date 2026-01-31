/**
 * BulkImageOperations Component (Admin)
 * 
 * Select multiple images, bulk delete with confirmation, bulk alt text update,
 * bulk reordering, bulk set primary, operation progress indicator,
 * undo/redo capability, and operation history.
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { ProductImage, UpdateProductImageRequest } from '@/types/product-image';
import { useBulkImageOperations } from '@/hooks/useAdminProductImages';

interface BulkImageOperationsProps {
  productId: string;
  images: ProductImage[];
  selectedImages: Set<string>;
  onUpdate: () => void;
  onSelectionChange: (selected: Set<string>) => void;
}

/**
 * BulkImageOperations Component
 * 
 * @param productId - Product ID
 * @param images - Array of product images
 * @param selectedImages - Set of selected image IDs
 * @param onUpdate - Callback on update
 * @param onSelectionChange - Callback on selection change
 */
export const BulkImageOperations: React.FC<BulkImageOperationsProps> = ({
  productId,
  images,
  selectedImages,
  onUpdate,
  onSelectionChange
}) => {
  const { processing, progress, error, operationHistory, bulkDelete, bulkUpdate, clearHistory } = useBulkImageOperations();
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAltTextModal, setShowAltTextModal] = useState(false);
  const [bulkAltTextBn, setBulkAltTextBn] = useState('');
  const [bulkAltTextEn, setBulkAltTextEn] = useState('');
  const [operationType, setOperationType] = useState<'delete' | 'update' | 'setPrimary' | 'reorder' | null>(null);

  const selectedCount = selectedImages.size;
  const hasSelection = selectedCount > 0;

  const handleBulkDelete = useCallback(async () => {
    if (!hasSelection) return;

    setOperationType('delete');
    const imageIds = Array.from(selectedImages);
    const result = await bulkDelete(imageIds);

    if (result.failed === 0) {
      setShowDeleteConfirm(false);
      onSelectionChange(new Set());
      onUpdate();
    } else {
      alert(`Deleted ${result.success} images, ${result.failed} failed`);
    }

    setOperationType(null);
  }, [hasSelection, selectedImages, bulkDelete, onSelectionChange, onUpdate]);

  const handleBulkAltTextUpdate = useCallback(async () => {
    if (!hasSelection) return;

    setOperationType('update');
    const updates = Array.from(selectedImages).map(imageId => ({
      imageId,
      data: {
        altTextBn: bulkAltTextBn || undefined,
        altTextEn: bulkAltTextEn || undefined
      } as UpdateProductImageRequest
    }));

    const result = await bulkUpdate(updates);

    if (result.failed === 0) {
      setShowAltTextModal(false);
      setBulkAltTextBn('');
      setBulkAltTextEn('');
      onSelectionChange(new Set());
      onUpdate();
    } else {
      alert(`Updated ${result.success} images, ${result.failed} failed`);
    }

    setOperationType(null);
  }, [hasSelection, selectedImages, bulkAltTextBn, bulkAltTextEn, bulkUpdate, onSelectionChange, onUpdate]);

  const handleBulkSetPrimary = useCallback(async () => {
    if (!hasSelection || selectedCount !== 1) {
      alert('Please select exactly one image to set as primary');
      return;
    }

    setOperationType('setPrimary');
    const imageId = Array.from(selectedImages)[0];
    const result = await bulkUpdate([{
      imageId,
      data: { isPrimary: true }
    }]);

    if (result.failed === 0) {
      onSelectionChange(new Set());
      onUpdate();
    } else {
      alert('Failed to set primary image');
    }

    setOperationType(null);
  }, [hasSelection, selectedCount, selectedImages, bulkUpdate, onSelectionChange, onUpdate]);

  const handleSelectAll = useCallback(() => {
    onSelectionChange(new Set(images.map(img => img.id)));
  }, [images, onSelectionChange]);

  const handleDeselectAll = useCallback(() => {
    onSelectionChange(new Set());
  }, [onSelectionChange]);

  const getOperationLabel = (): string => {
    switch (operationType) {
      case 'delete':
        return 'Deleting images...';
      case 'update':
        return 'Updating images...';
      case 'setPrimary':
        return 'Setting primary image...';
      case 'reorder':
        return 'Reordering images...';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Bulk Operations
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSelectAll}
            disabled={images.length === 0}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Select All
          </button>
          <span className="text-gray-400">|</span>
          <button
            onClick={handleDeselectAll}
            disabled={!hasSelection}
            className="text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Selection Info */}
      <div className={`rounded-lg p-4 border-2 ${
        hasSelection
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {hasSelection
            ? `${selectedCount} image${selectedCount !== 1 ? 's' : ''} selected`
            : 'No images selected'
          }
        </p>
      </div>

      {/* Bulk Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Bulk Delete */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={!hasSelection || processing}
          className="flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete Selected
        </button>

        {/* Bulk Alt Text Update */}
        <button
          onClick={() => setShowAltTextModal(true)}
          disabled={!hasSelection || processing}
          className="flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Update Alt Text
        </button>

        {/* Set Primary */}
        <button
          onClick={handleBulkSetPrimary}
          disabled={!hasSelection || processing}
          className="flex items-center justify-center px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-2.888-3.976a1 1 0 00-1.176-.406l-4.674 1.518a1 1 0 00-.69.95l-2.888 3.976c-.78.253-1.688-.755-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.47-.783-1.588 0-2.05l3.976-2.888a1 1 0 00.363-1.118l-1.518-4.674z" />
          </svg>
          Set as Primary
        </button>

        {/* Clear History */}
        <button
          onClick={clearHistory}
          disabled={operationHistory.length === 0}
          className="flex items-center justify-center px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear History
        </button>
      </div>

      {/* Progress Indicator */}
      {processing && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {getOperationLabel()}
            </p>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700 dark:text-red-400 flex-1">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Operation History */}
      {operationHistory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Operation History
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {operationHistory.slice().reverse().map((operation, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${
                    operation.success ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-gray-700 dark:text-gray-300 capitalize">
                    {operation.type}
                  </span>
                  <span className="text-gray-500 dark:text-gray-500">
                    ({operation.count} images)
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  {new Date(operation.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Delete {selectedCount} Image{selectedCount !== 1 ? 's' : ''}?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete {selectedCount} selected image{selectedCount !== 1 ? 's' : ''}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={processing}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {processing ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alt Text Update Modal */}
      {showAltTextModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Update Alt Text for {selectedCount} Image{selectedCount !== 1 ? 's' : ''}
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Alt Text (বাংলা)
                </label>
                <input
                  type="text"
                  value={bulkAltTextBn}
                  onChange={(e) => setBulkAltTextBn(e.target.value)}
                  placeholder="Enter alt text in Bengali"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Alt Text (English)
                </label>
                <input
                  type="text"
                  value={bulkAltTextEn}
                  onChange={(e) => setBulkAltTextEn(e.target.value)}
                  placeholder="Enter alt text in English"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAltTextModal(false);
                  setBulkAltTextBn('');
                  setBulkAltTextEn('');
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAltTextUpdate}
                disabled={processing || (!bulkAltTextBn && !bulkAltTextEn)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {processing ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkImageOperations;
