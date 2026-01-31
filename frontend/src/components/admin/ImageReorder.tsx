/**
 * ImageReorder Component (Admin)
 * 
 * Drag-and-drop reordering interface for product images with visual feedback,
 * position persistence, "Set as Primary" action, undo/redo capability,
 * preview thumbnails, alt text inline editing, delete confirmation dialog,
 * and bulk operations support.
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ProductImage } from '@/types/product-image';
import { getImageUrl, getAltText } from '@/lib/api/product-images';
import { useImageDelete, useSetPrimaryImage, useImageReorder } from '@/hooks/useProductImages';

interface ImageReorderProps {
  productId: string;
  images: ProductImage[];
  onReorder: (images: ProductImage[]) => void;
  onSetPrimary: (imageId: string) => void;
  onDelete: (imageId: string) => void;
}

/**
 * ImageReorder Component
 * 
 * @param productId - Product ID
 * @param images - Array of product images
 * @param onReorder - Callback on reorder
 * @param onSetPrimary - Callback on set primary
 * @param onDelete - Callback on delete
 */
export const ImageReorder: React.FC<ImageReorderProps> = ({
  productId,
  images,
  onReorder,
  onSetPrimary,
  onDelete
}) => {
  const { deleting, deleteImage } = useImageDelete();
  const { setting, setPrimary } = useSetPrimaryImage();
  const { reordering, reorderImages } = useImageReorder();
  
  const [draggedItem, setDraggedItem] = useState<ProductImage | null>(null);
  const [dragOverItem, setDragOverItem] = useState<ProductImage | null>(null);
  const [history, setHistory] = useState<ProductImage[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<ProductImage | null>(null);
  const [altTextValues, setAltTextValues] = useState<Record<string, { bn: string; en: string }>>({});
  
  const dragStartRef = useRef<number | null>(null);

  // Sort images by display order
  const sortedImages = [...images].sort((a, b) => a.displayOrder - b.displayOrder);

  // Initialize alt text values
  useEffect(() => {
    const values: Record<string, { bn: string; en: string }> = {};
    sortedImages.forEach(image => {
      values[image.id] = {
        bn: image.altTextBn || '',
        en: image.altTextEn || ''
      };
    });
    setAltTextValues(values);
  }, [sortedImages]);

  // Save to history
  const saveToHistory = useCallback((newImages: ProductImage[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newImages);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, image: ProductImage) => {
    setDraggedItem(image);
    dragStartRef.current = sortedImages.indexOf(image);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', image.id);
  }, [sortedImages]);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent, image: ProductImage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(image);
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback(() => {
    setDragOverItem(null);
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent, targetImage: ProductImage) => {
    e.preventDefault();
    setDragOverItem(null);

    if (!draggedItem || draggedItem.id === targetImage.id) {
      return;
    }

    const fromIndex = sortedImages.indexOf(draggedItem);
    const toIndex = sortedImages.indexOf(targetImage);

    const newImages = [...sortedImages];
    newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, draggedItem);

    // Update display orders
    const reorderedImages = newImages.map((img, index) => ({
      ...img,
      displayOrder: index
    }));

    setDraggedItem(null);
    saveToHistory(reorderedImages);
    onReorder(reorderedImages);
  }, [draggedItem, sortedImages, saveToHistory, onReorder]);

  // Handle set primary
  const handleSetPrimary = useCallback(async (image: ProductImage) => {
    const updatedImage = await setPrimary(image.id);
    if (updatedImage) {
      const newImages = sortedImages.map(img =>
        img.id === image.id ? { ...img, isPrimary: true } : { ...img, isPrimary: false }
      );
      saveToHistory(newImages);
      onSetPrimary(image.id);
    }
  }, [sortedImages, setPrimary, saveToHistory, onSetPrimary]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!imageToDelete) {
      return;
    }

    const success = await deleteImage(imageToDelete.id);
    if (success) {
      const newImages = sortedImages.filter(img => img.id !== imageToDelete.id);
      // Update display orders
      const reorderedImages = newImages.map((img, index) => ({
        ...img,
        displayOrder: index
      }));
      saveToHistory(reorderedImages);
      onDelete(imageToDelete.id);
      setShowDeleteConfirm(false);
      setImageToDelete(null);
    }
  }, [imageToDelete, sortedImages, deleteImage, saveToHistory, onDelete]);

  // Show delete confirmation
  const showDeleteConfirmation = useCallback((image: ProductImage) => {
    setImageToDelete(image);
    setShowDeleteConfirm(true);
  }, []);

  // Handle undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onReorder(history[newIndex]);
    }
  }, [historyIndex, history, onReorder]);

  // Handle redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onReorder(history[newIndex]);
    }
  }, [historyIndex, history, onReorder]);

  // Handle save changes
  const handleSave = useCallback(async () => {
    const imageIds = sortedImages.map(img => img.id);
    const success = await reorderImages(productId, imageIds);
    if (success) {
      // Clear history after successful save
      setHistory([]);
      setHistoryIndex(-1);
    }
  }, [sortedImages, productId, reorderImages]);

  // Handle alt text update
  const handleAltTextUpdate = useCallback((imageId: string, field: 'bn' | 'en', value: string) => {
    setAltTextValues(prev => ({
      ...prev,
      [imageId]: {
        ...prev[imageId],
        [field]: value
      }
    }));
  }, []);

  // Handle bulk select
  const handleSelectAll = useCallback(() => {
    setSelectedImages(new Set(sortedImages.map(img => img.id)));
  }, [sortedImages]);

  const handleDeselectAll = useCallback(() => {
    setSelectedImages(new Set());
  }, []);

  const handleToggleSelect = useCallback((imageId: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  }, []);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const hasChanges = history.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Reorder Product Images
        </h2>
        
        <div className="flex items-center space-x-2">
          {/* Undo/Redo */}
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Undo"
          >
            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Redo"
          >
            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {selectedImages.size} selected
          </span>
          <button
            onClick={handleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Select All
          </button>
          <button
            onClick={handleDeselectAll}
            className="text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            Deselect All
          </button>
        </div>
        
        <button
          onClick={handleSave}
          disabled={!hasChanges || reordering}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {reordering ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedImages.map((image, index) => {
          const isDragging = draggedItem?.id === image.id;
          const isDragOver = dragOverItem?.id === image.id;
          const isSelected = selectedImages.has(image.id);
          const altText = altTextValues[image.id] || { bn: '', en: '' };

          return (
            <div
              key={image.id}
              draggable
              onDragStart={(e) => handleDragStart(e, image)}
              onDragOver={(e) => handleDragOver(e, image)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, image)}
              className={`relative group bg-white dark:bg-gray-800 rounded-lg border-2 overflow-hidden transition-all ${
                isDragging
                  ? 'opacity-50 border-blue-600'
                  : isDragOver
                  ? 'border-blue-400 ring-2 ring-blue-200 dark:ring-blue-900'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
            >
              {/* Drag Handle */}
              <div className="absolute top-2 left-2 cursor-grab active:cursor-grabbing z-10">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
              </div>

              {/* Checkbox */}
              <button
                onClick={() => handleToggleSelect(image.id)}
                className="absolute top-2 right-2 w-6 h-6 rounded border-2 flex items-center justify-center z-10 transition-colors"
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
                  <div className="absolute top-8 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    Primary
                  </div>
                )}

                {/* Display Order */}
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  #{index + 1}
                </div>

                {/* Action Buttons */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  <button
                    onClick={() => handleSetPrimary(image)}
                    disabled={image.isPrimary || setting}
                    className="w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Set as primary"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-2.888-3.976a1 1 0 00-1.176-.406l-4.674 1.518a1 1 0 00-.69.95l-2.888 3.976c-.78.253-1.688-.755-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.47-.783-1.588 0-2.05l3.976-2.888a1 1 0 00.363-1.118l-1.518-4.674z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => showDeleteConfirmation(image)}
                    disabled={deleting}
                    className="w-10 h-10 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Delete image"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Alt Text Inline Edit */}
              <div className="p-3 space-y-2">
                <input
                  type="text"
                  value={altText.bn}
                  onChange={(e) => handleAltTextUpdate(image.id, 'bn', e.target.value)}
                  placeholder="Alt text (বাংলা)"
                  className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <input
                  type="text"
                  value={altText.en}
                  onChange={(e) => handleAltTextUpdate(image.id, 'en', e.target.value)}
                  placeholder="Alt text (English)"
                  className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && imageToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Delete Image?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this image? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setImageToDelete(null);
                }}
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
      )}
    </div>
  );
};

export default ImageReorder;
