'use client';

import React, { useState, useEffect } from 'react';
import { CategoryTree } from '@/types/category';
import { getCategoryTree, moveCategory } from '@/lib/api/categories';

/**
 * CategoryTreeEditor Component
 * 
 * Visual tree editor for category hierarchy with drag-and-drop support
 */
export const CategoryTreeEditor: React.FC = () => {
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoading(true);
        const response = await getCategoryTree('active');
        setCategories(response.tree || []);
      } catch (err: any) {
        console.error('Failed to load categories:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  const toggleExpand = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleDragStart = (e: React.DragEvent, categoryId: string) => {
    e.dataTransfer.setData('text/plain', categoryId);
    setDraggedCategory(categoryId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetCategoryId: string) => {
    e.preventDefault();
    const sourceCategoryId = e.dataTransfer.getData('text/plain');

    if (!sourceCategoryId || sourceCategoryId === targetCategoryId) {
      setDraggedCategory(null);
      return;
    }

    try {
      await moveCategory(sourceCategoryId, { parentId: targetCategoryId });
      // Refresh categories
      const response = await getCategoryTree('active');
      setCategories(response.tree || []);
    } catch (err: any) {
      alert(`Failed to move category: ${err.message}`);
    } finally {
      setDraggedCategory(null);
    }
  };

  const renderTreeItem = (category: CategoryTree, depth = 0): React.ReactNode => {
    const paddingLeft = depth * 24;
    const isExpanded = expandedCategories.has(category.id);
    const isDragging = draggedCategory === category.id;
    const hasChildren = category.children && category.children.length > 0;

    return (
      <div className="mb-1">
        <div
          className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50 opacity-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
          style={{ paddingLeft: `${paddingLeft}px` }}
          draggable
          onDragStart={(e) => handleDragStart(e, category.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, category.id)}
        >
          {/* Expand/Collapse */}
          {hasChildren && (
            <button
              type="button"
              onClick={() => toggleExpand(category.id)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}

          {/* Icon */}
          {category.iconUrl && (
            <img
              src={category.iconUrl}
              alt={category.name}
              className="w-6 h-6 object-contain"
            />
          )}

          {/* Name */}
          <span className="flex-1 font-medium text-gray-900">
            {category.name}
          </span>

          {/* Status Badge */}
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              category.status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {category.status}
          </span>

          {/* Product Count */}
          <span className="text-sm text-gray-500">
            {category.children?.length || 0} subcategories
          </span>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="ml-4 mt-1 border-l-2 border-gray-200 pl-4">
            {category.children!.map((child) => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Category Tree Editor
        </h1>
        <p className="text-gray-600 mt-2">
          Drag and drop categories to reorganize your category hierarchy.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {categories.length > 0 ? (
          renderTreeItem(categories[0])
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No categories found.</p>
            <p className="text-gray-500 mt-2">
              Create your first category to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
