'use client';

import React, { useState, useRef } from 'react';
import brandsApi from '@/lib/api/brands';

interface BrandLogoUploaderProps {
  brandId?: string;
  currentLogoUrl?: string | null;
  onLogoChange: (logoUrl: string | null) => void;
}

/**
 * BrandLogoUploader Component
 * 
 * Handles brand logo upload with:
 * - Drag and drop support
 * - Image preview
 * - File validation
 * - Loading states
 */
export const BrandLogoUploader: React.FC<BrandLogoUploaderProps> = ({
  brandId,
  currentLogoUrl,
  onLogoChange
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to API (if brand exists)
      if (brandId) {
        const result = await brandsApi.uploadBrandLogo(brandId, file);
        onLogoChange(result.logoUrl);
      } else {
        // For new brands, just store the preview
        onLogoChange(file.name);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload logo');
      setPreviewUrl(currentLogoUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onLogoChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">
        Brand Logo
      </h2>

      <div className="space-y-4">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isUploading
              ? 'border-gray-300 bg-gray-50'
              : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {previewUrl ? (
            <div className="space-y-4">
              <img
                src={previewUrl}
                alt="Brand Logo Preview"
                className="mx-auto h-32 w-32 object-contain"
              />
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  disabled={isUploading}
                >
                  Change Logo
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  disabled={isUploading}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto h-16 w-16 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Drag and drop your logo here, or
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                  disabled={isUploading}
                >
                  browse files
                </button>
              </div>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF up to 2MB
              </p>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
          disabled={isUploading}
        />

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Upload Status */}
        {isUploading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="animate-spin h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8 0 018 8 0 01-8 8z"></path>
              </svg>
              <p className="text-sm text-blue-600">Uploading logo...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
