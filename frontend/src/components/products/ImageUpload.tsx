/**
 * ImageUpload Component
 * 
 * Multi-image upload component with drag-and-drop interface, file validation,
 * progress tracking, and alt text input for each image.
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ProductImage, FileToUpload, MAX_IMAGES_PER_PRODUCT, MIN_IMAGES_PER_PRODUCT } from '@/types/product-image';
import { useImageUpload, useAltTextGenerator } from '@/hooks/useProductImages';

interface ImageUploadProps {
  productId: string;
  productName: string;
  onUploadComplete: (images: ProductImage[]) => void;
  maxImages?: number;
  existingImages?: ProductImage[];
}

/**
 * ImageUpload Component
 * 
 * @param productId - Product ID to upload images for
 * @param productName - Product name for auto-generating alt text
 * @param onUploadComplete - Callback on successful upload
 * @param maxImages - Maximum images allowed (default: 10)
 * @param existingImages - Existing images to display
 */
export const ImageUpload: React.FC<ImageUploadProps> = ({
  productId,
  productName,
  onUploadComplete,
  maxImages = MAX_IMAGES_PER_PRODUCT,
  existingImages = []
}) => {
  const { uploading, progress, error, result, uploadImages, reset } = useImageUpload();
  const { generateAltText } = useAltTextGenerator();
  
  const [files, setFiles] = useState<FileToUpload[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [language, setLanguage] = useState<'bn' | 'en'>('en');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate alt text from product name
  const handleAutoGenerateAlt = useCallback((fileId: string) => {
    setFiles(prev => prev.map(file => {
      if (file.id === fileId) {
        const altText = generateAltText(productName, language);
        return {
          ...file,
          altTextBn: language === 'bn' ? altText : file.altTextBn,
          altTextEn: language === 'en' ? altText : file.altTextEn
        };
      }
      return file;
    }));
  }, [productName, language, generateAltText]);

  // Handle file selection
  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FileToUpload[] = [];
    const totalSlots = maxImages - existingImages.length;
    const slotsAvailable = totalSlots - files.length;

    for (let i = 0; i < Math.min(selectedFiles.length, slotsAvailable); i++) {
      const file = selectedFiles[i];
      const preview = URL.createObjectURL(file);
      
      newFiles.push({
        id: `temp-${Date.now()}-${i}`,
        file,
        altTextBn: '',
        altTextEn: '',
        displayOrder: existingImages.length + files.length + i,
        isPrimary: existingImages.length === 0 && i === 0,
        preview
      });
    }

    if (newFiles.length < selectedFiles.length) {
      console.warn(`Only ${newFiles.length} of ${selectedFiles.length} files were added due to max limit`);
    }

    setFiles(prev => [...prev, ...newFiles]);
  }, [files, existingImages, maxImages]);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  }, [handleFileSelect]);

  // Remove file from list
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => {
      const filtered = prev.filter(f => f.id !== fileId);
      // Update display orders
      return filtered.map((f, index) => ({
        ...f,
        displayOrder: existingImages.length + index
      }));
    });
  }, [existingImages]);

  // Toggle primary image
  const togglePrimary = useCallback((fileId: string) => {
    setFiles(prev => prev.map(file => ({
      ...file,
      isPrimary: file.id === fileId
    })));
  }, []);

  // Update alt text
  const updateAltText = useCallback((fileId: string, field: 'altTextBn' | 'altTextEn', value: string) => {
    setFiles(prev => prev.map(file => {
      if (file.id === fileId) {
        return { ...file, [field]: value };
      }
      return file;
    }));
  }, []);

  // Handle upload
  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;

    const uploadResult = await uploadImages(productId, files);
    
    if (uploadResult && uploadResult.successful > 0) {
      onUploadComplete(uploadResult.images);
      reset();
      setFiles([]);
    }
  }, [files, productId, uploadImages, onUploadComplete, reset]);

  // Reset upload state
  const handleReset = useCallback(() => {
    reset();
    setFiles([]);
  }, [reset]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  const canUpload = files.length >= MIN_IMAGES_PER_PRODUCT;
  const isFull = (existingImages.length + files.length) >= maxImages;

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        } ${isFull ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isFull && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleInputChange}
          className="hidden"
          disabled={isFull || uploading}
        />
        
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 text-gray-400">
            <svg
              className="w-full h-full"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              {isFull ? 'Maximum images reached' : 'Drop images here or click to upload'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {existingImages.length + files.length} / {maxImages} images
            </p>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Supports JPEG, PNG, WebP (max 5MB each)
          </p>
        </div>
      </div>

      {/* Language Toggle */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Alt Text Language:
        </span>
        <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
          <button
            type="button"
            onClick={() => setLanguage('bn')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              language === 'bn'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            বাংলা
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              language === 'en'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Image Preview Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file, index) => (
            <div
              key={file.id}
              className="relative group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Image Preview */}
              <div className="relative aspect-square">
                <Image
                  src={file.preview || ''}
                  alt={`Preview ${index + 1}`}
                  fill
                  className="object-cover"
                />
                
                {/* Primary Badge */}
                {file.isPrimary && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    Primary
                  </div>
                )}
                
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  aria-label="Remove image"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Alt Text Input */}
              <div className="p-3 space-y-2">
                <input
                  type="text"
                  value={language === 'bn' ? file.altTextBn : file.altTextEn}
                  onChange={(e) => updateAltText(file.id, language === 'bn' ? 'altTextBn' : 'altTextEn', e.target.value)}
                  placeholder={`Alt text (${language === 'bn' ? 'বাংলা' : 'English'})`}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleAutoGenerateAlt(file.id)}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Auto-generate
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => togglePrimary(file.id)}
                    className={`text-xs px-2 py-1 rounded ${
                      file.isPrimary
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {file.isPrimary ? 'Primary' : 'Set Primary'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">
            {error}
          </p>
        </div>
      )}

      {/* Progress Bar */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Uploading images...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {files.length > 0 && !uploading && (
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={handleUpload}
            disabled={!canUpload}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            Upload {files.length} Image{files.length !== 1 ? 's' : ''}
          </button>
          
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Upload Result */}
      {result && result.successful > 0 && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-400">
            Successfully uploaded {result.successful} of {result.total} images
          </p>
          {result.failed > 0 && (
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">
              {result.failed} image(s) failed to upload
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
