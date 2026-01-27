'use client';

import React, { useState, useEffect } from 'react';
import { Folder, FolderOpen, Plus, Trash2, GripVertical, Check, X } from 'lucide-react';
import { Category } from '@/types/category';
import { ProductCategory } from '@/types/product';

interface ProductCategoryManagerProps {
  productId: string;
  categories: Category[];
  productCategories: ProductCategory[];
  onAssignCategories: (categoryIds: string[], primaryCategoryId?: string) => Promise<void>;
  onRemoveCategory: (categoryId: string) => Promise<void>;
  onSetPrimaryCategory: (categoryId: string) => Promise<void>;
  className?: string;
}

export const ProductCategoryManager: React.FC<ProductCategoryManagerProps> = ({
  productId,
  categories,
  productCategories,
  onAssignCategories,
  onRemoveCategory,
  onSetPrimaryCategory,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCategories, setFilteredCategories] = useState<Category[]>(categories);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);

  const selectedCategoryIds = productCategories.map(pc => pc.categoryId);
  const primaryCategoryId = productCategories.find(pc => pc.isPrimary)?.categoryId;

  useEffect(() => {
    if (!searchQuery) {
      setFilteredCategories(categories);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = categories.filter(cat => 
      cat.name.toLowerCase().includes(query) ||
      cat.nameEn?.toLowerCase().includes(query) ||
      cat.nameBn?.includes(query)
    );
    setFilteredCategories(filtered);
  }, [searchQuery, categories]);

  const handleCategoryToggle = async (categoryId: string) => {
    const isSelected = selectedCategoryIds.includes(categoryId);
    
    if (isSelected) {
      await onRemoveCategory(categoryId);
    } else {
      await onAssignCategories([...selectedCategoryIds, categoryId]);
    }
  };

  const handleSetPrimary = async (categoryId: string) => {
    setIsSaving(true);
    try {
      await onSetPrimaryCategory(categoryId);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, categoryId: string) => {
    setDraggedCategory(categoryId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetCategoryId: string) => {
    e.preventDefault();
    if (!draggedCategory || draggedCategory === targetCategoryId) return;

    const currentIndex = selectedCategoryIds.indexOf(draggedCategory);
    const targetIndex = selectedCategoryIds.indexOf(targetCategoryId);
    
    if (currentIndex === -1 || targetIndex === -1) return;

    const newOrder = [...selectedCategoryIds];
    newOrder.splice(currentIndex, 1);
    newOrder.splice(targetIndex, 0, draggedCategory);
    
    setIsSaving(true);
    try {
      await onAssignCategories(newOrder, primaryCategoryId);
    } finally {
      setIsSaving(false);
      setDraggedCategory(null);
    }
  };

  const renderCategory = (category: Category, level: number = 0) => {
    const isSelected = selectedCategoryIds.includes(category.id);
    const isPrimary = primaryCategoryId === category.id;
    const hasChildren = category.children && category.children.length > 0;

    return (
      <div key={category.id} className="select-none">
        <div
          className={`flex items-center gap-2 py-2 px-3 hover:bg-gray-50 cursor-pointer transition-colors ${
            level > 0 ? 'ml-4' : ''
          }`}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          draggable={isSelected}
          onDragStart={(e) => handleDragStart(e, category.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, category.id)}
        >
          {hasChildren && (
            <div className="text-gray-400">
              <FolderOpen className="w-4 h-4" />
            </div>
          )}
          
          <button
            onClick={() => handleCategoryToggle(category.id)}
            className={`flex-1 flex items-center gap-2 text-left ${
              isSelected ? 'text-blue-600 font-medium' : 'text-gray-700'
            }`}
          >
            <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
              isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 hover:border-blue-400'
            }`}>
              {isSelected ? <Check className="w-3 h-3 text-white" /> : null}
            </div>
            <span className="flex-1">{category.name}</span>
            {category.nameEn && (
              <span className="text-sm text-gray-400">{category.nameEn}</span>
            )}
          </button>

          {isSelected && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSetPrimary(category.id);
              }}
              disabled={isSaving || isPrimary}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                isPrimary
                  ? 'bg-purple-100 text-purple-700 border border-purple-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-600 border border-gray-200'
              }`}
            >
              {isPrimary ? 'Primary' : 'Set Primary'}
            </button>
          )}

          {isSelected && (
            <div className="cursor-move text-gray-400 hover:text-gray-600">
              <GripVertical className="w-4 h-4" />
            </div>
          )}
        </div>

        {hasChildren && category.children?.map(child => renderCategory(child, level + 1))}
      </div>
    );
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">
              Product Categories
            </h3>
          </div>
          <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200">
            {selectedCategoryIds.length} selected
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Select categories for this product. One category can be set as primary.
        </p>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Category List */}
      <div className="max-h-96 overflow-y-auto p-2">
        {filteredCategories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No categories found matching "{searchQuery}"
          </div>
        ) : (
          <div className="space-y-1">
            {filteredCategories.map(category => renderCategory(category))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-gray-600">
            <div className="flex items-center gap-1">
              <Check className="w-4 h-4 text-blue-600" />
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-1">
              <Folder className="w-4 h-4 text-purple-600" />
              <span>Primary category</span>
            </div>
            <div className="flex items-center gap-1">
              <GripVertical className="w-4 h-4 text-gray-500" />
              <span>Drag to reorder</span>
            </div>
          </div>
          {isSaving && (
            <div className="text-blue-600 font-medium">
              Saving...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCategoryManager;
