'use client';

import React, { useState, useEffect } from 'react';
import { Category, CreateCategoryRequest, UpdateCategoryRequest, CategoryStatus } from '@/types/category';
import { createCategory, updateCategory, getCategoryById, getCategories } from '@/lib/api/categories';
import { useShowToast } from '@/components/ui/Toast';

interface CategoryFormProps {
  categoryId?: string;
  onSuccess?: (category: Category) => void;
  onCancel?: () => void;
}

/**
 * CategoryForm Component
 * 
 * Form for creating/editing categories with all category fields
 */
export const CategoryForm: React.FC<CategoryFormProps> = ({
  categoryId,
  onSuccess,
  onCancel
}) => {
  const { success } = useShowToast();
  const [formData, setFormData] = useState<CreateCategoryRequest>({
    name: '',
    slug: '',
    nameEn: '',
    nameBn: '',
    description: '',
    parentId: '',
    displayOrder: 0,
    sortOrder: 0,
    status: CategoryStatus.ACTIVE,
    metaTitle: '',
    metaDescription: '',
    metaKeywords: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [availableParents, setAvailableParents] = useState<Category[]>([]);

  useEffect(() => {
    if (categoryId) {
      const loadCategory = async () => {
        try {
          const response = await getCategoryById(categoryId);
          const category = response.category;
          setFormData({
            name: category.name,
            slug: category.slug,
            nameEn: category.nameEn || '',
            nameBn: category.nameBn || '',
            description: category.description || '',
            parentId: category.parentId || '',
            displayOrder: category.displayOrder,
            sortOrder: category.sortOrder,
            status: category.status,
            metaTitle: category.metaTitle || '',
            metaDescription: category.metaDescription || '',
            metaKeywords: category.metaKeywords || ''
          });
        } catch (err: any) {
          console.error('Failed to load category:', err);
        }
      };
      loadCategory();
    }
  }, [categoryId]);

  // Fetch available parent categories
  useEffect(() => {
    const loadAvailableParents = async () => {
      try {
        const response = await getCategories({ status: 'active' });
        const allCategories = response.categories;

        // If editing, filter out the current category and its descendants to prevent circular references
        if (categoryId) {
          const excludedIds = new Set<string>([categoryId]);
          
          // Recursively find all descendant IDs
          const findDescendants = (parentId: string) => {
            allCategories.forEach((cat) => {
              if (cat.parentId === parentId && !excludedIds.has(cat.id)) {
                excludedIds.add(cat.id);
                findDescendants(cat.id);
              }
            });
          };
          
          findDescendants(categoryId);
          
          // Filter out excluded categories
          setAvailableParents(allCategories.filter((cat) => !excludedIds.has(cat.id)));
        } else {
          // When creating, show all available categories
          setAvailableParents(allCategories);
        }
      } catch (err: any) {
        console.error('Failed to load available parent categories:', err);
        setAvailableParents([]);
      }
    };
    loadAvailableParents();
  }, [categoryId]);

  // Helper function to render parent options with hierarchy indentation
  const renderParentOptions = (categories: Category[], parentId: string | null = null, level: number = 0): JSX.Element[] => {
    const options: JSX.Element[] = [];
    const indent = '\u00A0\u00A0\u00A0\u00A0'.repeat(level); // Non-breaking spaces for indentation

    categories
      .filter((cat) => cat.parentId === parentId)
      .forEach((cat) => {
        options.push(
          <option key={cat.id} value={cat.id}>
            {indent}{cat.name}
          </option>
        );
        // Recursively render children
        options.push(...renderParentOptions(categories, cat.id, level + 1));
      });

    return options;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+(?:-[a-z0-9-]+)*$/.test(formData.slug)) {
      newErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      let result: Category;

      if (categoryId) {
        result = await updateCategory(categoryId, formData as UpdateCategoryRequest);
        success('Category updated successfully');
      } else {
        result = await createCategory(formData);
        success('Category created successfully');
      }

      onSuccess?.(result);
    } catch (err: any) {
      alert(`Failed to ${categoryId ? 'update' : 'create'} category: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof CreateCategoryRequest, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Basic Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
              Slug *
            </label>
            <input
              type="text"
              id="slug"
              value={formData.slug}
              onChange={(e) => handleChange('slug', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                errors.slug ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.slug && (
              <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
            )}
          </div>

          {/* Name English */}
          <div>
            <label htmlFor="nameEn" className="block text-sm font-medium text-gray-700 mb-2">
              Name (English)
            </label>
            <input
              type="text"
              id="nameEn"
              value={formData.nameEn}
              onChange={(e) => handleChange('nameEn', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Name Bengali */}
          <div>
            <label htmlFor="nameBn" className="block text-sm font-medium text-gray-700 mb-2">
              Name (Bengali)
            </label>
            <input
              type="text"
              id="nameBn"
              value={formData.nameBn}
              onChange={(e) => handleChange('nameBn', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Description */}
        <div className="mt-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Parent Category */}
        <div className="mt-4">
          <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 mb-2">
            Parent Category
          </label>
          <select
            id="parentId"
            value={formData.parentId}
            onChange={(e) => handleChange('parentId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">None (Root Category)</option>
            {renderParentOptions(availableParents)}
          </select>
        </div>

        {/* Display Order */}
        <div className="mt-4">
          <label htmlFor="displayOrder" className="block text-sm font-medium text-gray-700 mb-2">
            Display Order
          </label>
          <input
            type="number"
            id="displayOrder"
            value={formData.displayOrder}
            onChange={(e) => handleChange('displayOrder', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            min="0"
          />
        </div>

        {/* Status */}
        <div className="mt-4">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value as CategoryStatus)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value={CategoryStatus.ACTIVE}>Active</option>
            <option value={CategoryStatus.INACTIVE}>Inactive</option>
          </select>
        </div>
      </div>

      {/* SEO Fields */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          SEO Settings
        </h2>

        <div className="space-y-4">
          {/* Meta Title */}
          <div>
            <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700 mb-2">
              Meta Title
            </label>
            <input
              type="text"
              id="metaTitle"
              value={formData.metaTitle}
              onChange={(e) => handleChange('metaTitle', e.target.value)}
              placeholder="Recommended: 50-60 characters"
              maxLength={60}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Meta Description */}
          <div>
            <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Meta Description
            </label>
            <textarea
              id="metaDescription"
              rows={3}
              value={formData.metaDescription}
              onChange={(e) => handleChange('metaDescription', e.target.value)}
              placeholder="Recommended: 150-160 characters"
              maxLength={160}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Meta Keywords */}
          <div>
            <label htmlFor="metaKeywords" className="block text-sm font-medium text-gray-700 mb-2">
              Meta Keywords
            </label>
            <input
              type="text"
              id="metaKeywords"
              value={formData.metaKeywords}
              onChange={(e) => handleChange('metaKeywords', e.target.value)}
              placeholder="Comma-separated keywords"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Saving...' : categoryId ? 'Update Category' : 'Create Category'}
        </button>
      </div>
    </form>
  );
};
