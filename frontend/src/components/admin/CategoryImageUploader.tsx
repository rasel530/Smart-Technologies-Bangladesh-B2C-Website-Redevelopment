'use client';

import React, { useState, useEffect } from 'react';
import { Category } from '@/types/category';
import { uploadCategoryImage, uploadCategoryIcon, deleteCategoryImage, deleteCategoryIcon, getCategoryById } from '@/lib/api/categories';

interface CategoryImageUploaderProps {
  categoryId: string;
  onSuccess?: (category: Category) => void;
}

export const CategoryImageUploader: React.FC<CategoryImageUploaderProps> = ({
  categoryId,
  onSuccess
}) => {
  const [category, setCategory] = useState<Category | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);

  useEffect(() => {
    const loadCategory = async () => {
      try {
        const response = await getCategoryById(categoryId);
        setCategory(response.category);
        setImagePreview(response.category.imageUrl || null);
        setIconPreview(response.category.iconUrl || null);
      } catch (err: any) {
        console.error('Failed to load category:', err);
      }
    };
    loadCategory();
  }, [categoryId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      setIsUploadingImage(true);
      const updatedCategory = await uploadCategoryImage(categoryId, file);
      setCategory(updatedCategory);
      setImagePreview(updatedCategory.imageUrl || null);
      onSuccess?.(updatedCategory);
    } catch (err: any) {
      alert(`Failed to upload image: ${err.message}`);
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid icon file (JPEG, PNG, GIF, WebP, or SVG)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Icon file size must be less than 2MB');
      return;
    }

    try {
      setIsUploadingIcon(true);
      const updatedCategory = await uploadCategoryIcon(categoryId, file);
      setCategory(updatedCategory);
      setIconPreview(updatedCategory.iconUrl || null);
      onSuccess?.(updatedCategory);
    } catch (err: any) {
      alert(`Failed to upload icon: ${err.message}`);
    } finally {
      setIsUploadingIcon(false);
      e.target.value = '';
    }
  };

  const handleDeleteImage = async () => {
    if (!confirm('Are you sure you want to delete the category image?')) {
      return;
    }

    try {
      const updatedCategory = await deleteCategoryImage(categoryId);
      setCategory(updatedCategory);
      setImagePreview(null);
      onSuccess?.(updatedCategory);
    } catch (err: any) {
      alert(`Failed to delete image: ${err.message}`);
    }
  };

  const handleDeleteIcon = async () => {
    if (!confirm('Are you sure you want to delete the category icon?')) {
      return;
    }

    try {
      const updatedCategory = await deleteCategoryIcon(categoryId);
      setCategory(updatedCategory);
      setIconPreview(null);
      onSuccess?.(updatedCategory);
    } catch (err: any) {
      alert(`Failed to delete icon: ${err.message}`);
    }
  };

  if (!category) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Image</h2>
        <div className="space-y-4">
          {imagePreview ? (
            <div className="relative">
              <img src={imagePreview} alt="Category image" className="w-full h-64 object-cover rounded-lg" />
              <button type="button" onClick={handleDeleteImage} className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors" title="Delete image">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 011.138 2H6.862a2 2 0 01-1.995-1.858L5 7m5 4v6M4 7v6a2 2 0 002 2h6a2 2 0 002-2v-5m-1.414-1.414L9 16.172A2 2 0 01.586 15H7a2 2 0 01-2-2v-6a2 2 0 012-2h2a2 2 0 012-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v5a2 2 0 012 2h2a2 2 0 012-2V9a2 2 0 00-2-2H4a2 2 0 00-2 2v5z"/></svg>
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012-2v-6.414a2 2 0 012-2 8.586l-4.586 4.586a2 2 0 01-2 2V16m0-4v4a2 2 0 012-2h6a2 2 0 002 2v6a2 2 0 012-2h2a2 2 0 012-2V9a2 2 0 00-2-2H4a2 2 0 00-2 2v5a2 2 0 012 2h2a2 2 0 012-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v5z"/></svg>
              <p className="text-gray-600">No image uploaded</p>
              <p className="text-sm text-gray-500 mt-1">Recommended size: 1200x400px, max 5MB</p>
            </div>
          )}
          <div>
            <input type="file" id="categoryImage" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handleImageUpload} className="hidden" disabled={isUploadingImage} />
            <label htmlFor="categoryImage" className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-md cursor-pointer transition-colors ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'}`}>
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a1 1 0 011-1h3a1 1 0 011-1v-3m-1 4h-3m-1-4h-3m4 4h16v1a1 1 0 011-1h-3a1 1 0 01-1-1V9a1 1 0 00-1-1H4a1 1 0 00-1 1v5a1 1 0 011-1h-3a1 1 0 01-1-1V9a1 1 0 00-1-1H4a1 1 0 00-1 1v5z"/></svg>
              <span className="font-medium">{isUploadingImage ? 'Uploading...' : 'Upload Image'}</span>
            </label>
          </div>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Icon</h2>
        <div className="space-y-4">
          {iconPreview ? (
            <div className="relative">
              <img src={iconPreview} alt="Category icon" className="w-32 h-32 object-contain rounded-lg" />
              <button type="button" onClick={handleDeleteIcon} className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors" title="Delete icon">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 011.138 2H6.862a2 2 0 01-1.995-1.858L5 7m5 4v6M4 7v6a2 2 0 002 2h6a2 2 0 002-2v-5m-1.414-1.414L9 16.172A2 2 0 01.586 15H7a2 2 0 01-2-2v-6a2 2 0 012-2h2a2 2 0 012-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v5a2 2 0 012 2h2a2 2 0 012-2V9a2 2 0 00-2-2H4a2 2 0 00-2 2v5z"/></svg>
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012-2v-6.414a2 2 0 012-2 8.586l-4.586 4.586a2 2 0 01-2 2V16m0-4v4a2 2 0 012-2h6a2 2 0 002 2v6a2 2 0 012-2h2a2 2 0 012-2V9a2 2 0 00-2-2H4a2 2 0 00-2 2v5a2 2 0 012 2h2a2 2 0 012-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v5z"/></svg>
              <p className="text-gray-600">No icon uploaded</p>
              <p className="text-sm text-gray-500 mt-1">Recommended size: 64x64px, max 2MB</p>
            </div>
          )}
          <div>
            <input type="file" id="categoryIcon" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml" onChange={handleIconUpload} className="hidden" disabled={isUploadingIcon} />
            <label htmlFor="categoryIcon" className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-md cursor-pointer transition-colors ${isUploadingIcon ? 'opacity-50 cursor-not-allowed' : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'}`}>
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a1 1 0 011-1h3a1 1 0 011-1v-3m-1 4h-3m-1-4h-3m4 4h16v1a1 1 0 011-1h-3a1 1 0 01-1-1V9a1 1 0 00-1-1H4a1 1 0 00-1 1v5a1 1 0 011-1h-3a1 1 0 01-1-1V9a1 1 0 00-1-1H4a1 1 0 00-1 1v5z"/></svg>
              <span className="font-medium">{isUploadingIcon ? 'Uploading...' : 'Upload Icon'}</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
