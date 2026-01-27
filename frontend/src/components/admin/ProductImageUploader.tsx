'use client';

import React, { useState, useRef } from 'react';
import { ProductImage } from '@/types/product';
import productsApi from '@/lib/api/products';

interface ProductImageUploaderProps {
  productId: string;
  images: ProductImage[];
  onUpdate: () => void;
}

const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  productId,
  images,
  onUpdate,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave' || e.type === 'drop') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) return;

    await uploadImage(files[0]);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    await uploadImage(files[0]);
  };

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setUploading(true);
    try {
      await productsApi.uploadImage(productId, file);
      onUpdate();
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUpdateAlt = async (imageId: string, alt: string) => {
    try {
      await productsApi.updateImage(productId, imageId, { alt });
      onUpdate();
    } catch (error) {
      console.error('Error updating image alt:', error);
      alert('Failed to update image');
    }
  };

  const handleUpdateSortOrder = async (imageId: string, sortOrder: number) => {
    try {
      await productsApi.updateImage(productId, imageId, { sortOrder });
      onUpdate();
    } catch (error) {
      console.error('Error updating image sort order:', error);
      alert('Failed to update image order');
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      await productsApi.deleteImage(productId, imageId);
      onUpdate();
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image');
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    [newImages[index], newImages[index - 1]] = [
      newImages[index - 1],
      newImages[index],
    ];
    // Update sort orders
    newImages.forEach((img, i) => {
      productsApi.updateImage(productId, img.id, { sortOrder: i }).catch(err => {
        console.error('Error updating sort order:', err);
      });
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [
      newImages[index + 1],
      newImages[index],
    ];
    // Update sort orders
    newImages.forEach((img, i) => {
      productsApi.updateImage(productId, img.id, { sortOrder: i }).catch(err => {
        console.error('Error updating sort order:', err);
      });
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h2>

      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className="cursor-pointer"
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <svg
                className="w-12 h-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-4-4 4 4 0 01-4 4zm0 0l3 3m0 0l-3-3m3 3V4m0 0h-3m3 0h3m-9 6h9"
                />
              </svg>
              <p className="text-gray-600 font-medium">
                Drag and drop images here, or click to browse
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Supported formats: JPEG, PNG, GIF, WebP (Max 5MB)
              </p>
            </div>
          )}
        </label>
      </div>

      {/* Images Grid */}
      {images.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No images uploaded yet</p>
      ) : (
        <div className="mt-6">
          <p className="text-sm text-gray-600 mb-4">
            Drag images to reorder their display order
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((image, index) => (
                <div key={image.id} className="relative group">
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.alt || 'Product image'}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex flex-col justify-center items-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2 mb-4">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Move Up"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === images.length - 1}
                          className="bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Move Down"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const newAlt = prompt('Enter alt text:', image.alt || '');
                            if (newAlt !== null) handleUpdateAlt(image.id, newAlt);
                          }}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                          title="Edit Alt Text"
                        >
                          Alt
                        </button>
                        <button
                          onClick={() => handleDelete(image.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                          title="Delete Image"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                    Order: {image.sortOrder + 1}
                  </div>
                  {image.alt && (
                    <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs truncate max-w-[calc(100%-1rem)]">
                      {image.alt}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductImageUploader;
