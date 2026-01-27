'use client';

import React, { useState, useEffect } from 'react';
import { CategoryTree, CategoryListResponse } from '@/types/category';
import { getCategories, deleteCategory, reorderCategory } from '@/lib/api/categories';

/**
 * CategoryList Component
 * 
 * Tree view of categories with expand/collapse functionality
 * Supports search, filter, and drag-and-drop for reordering
 */
export const CategoryList: React.FC = () => {
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const filters: any = { tree: true };
        if (statusFilter !== 'all') filters.status = statusFilter;
        
        const response = await getCategories(filters);
        setCategories(response.tree || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load categories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [statusFilter]);

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

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete "${categoryName}"? This will also delete all subcategories.`)) {
      return;
    }

    try {
      await deleteCategory(categoryId);
      setCategories((prev) => removeCategoryFromTree(prev, categoryId));
      setSelectedCategory(null);
    } catch (err: any) {
      alert(`Failed to delete category: ${err.message}`);
    }
  };

  const handleReorder = async (categoryId: string, newOrder: number) => {
    try {
      await reorderCategory(categoryId, newOrder);
      setCategories((prev) => updateCategoryOrderInTree(prev, categoryId, newOrder));
    } catch (err: any) {
      alert(`Failed to reorder category: ${err.message}`);
    }
  };

  const removeCategoryFromTree = (tree: CategoryTree[], categoryId: string): CategoryTree[] => {
    return tree
      .filter((cat) => cat.id !== categoryId)
      .map((cat) => ({
        ...cat,
        children: cat.children ? removeCategoryFromTree(cat.children, categoryId) : []
      }));
  };

  const updateCategoryOrderInTree = (tree: CategoryTree[], categoryId: string, newOrder: number): CategoryTree[] => {
    return tree.map((cat) => {
      if (cat.id === categoryId) {
        return { ...cat, displayOrder: newOrder };
      }
      return {
        ...cat,
        children: cat.children ? updateCategoryOrderInTree(cat.children, categoryId, newOrder) : []
      };
    });
  };

  const filterCategories = (tree: CategoryTree[]): CategoryTree[] => {
    if (!searchQuery) return tree;

    return tree
      .filter((cat) => {
        const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase());
        const childrenMatch = cat.children ? filterCategories(cat.children).length > 0 : false;
        return matchesSearch || childrenMatch;
      })
      .map((cat) => ({
        ...cat,
        children: cat.children ? filterCategories(cat.children) : []
      }));
  };

  const renderCategoryTree = (tree: CategoryTree[], depth = 0): React.ReactNode => {
    return tree.map((category) => (
      <CategoryTreeItem
        key={category.id}
        category={category}
        depth={depth}
        isExpanded={expandedCategories.has(category.id)}
        isSelected={selectedCategory === category.id}
        onToggleExpand={toggleExpand}
        onSelectCategory={handleSelectCategory}
        onDeleteCategory={handleDeleteCategory}
        onReorder={handleReorder}
      />
    ));
  };

  const CategoryTreeItem: React.FC<{
    category: CategoryTree;
    depth: number;
    isExpanded: boolean;
    isSelected: boolean;
    onToggleExpand: (id: string) => void;
    onSelectCategory: (id: string) => void;
    onDeleteCategory: (id: string, name: string) => void;
    onReorder: (id: string, order: number) => void;
  }> = ({
    category,
    depth,
    isExpanded,
    isSelected,
    onToggleExpand,
    onSelectCategory,
    onDeleteCategory,
    onReorder
  }) => {
    const hasChildren = category.children && category.children.length > 0;
    const paddingLeft = depth * 24;

    return (
      <div className="mb-2">
        <div
          className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
            isSelected
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
          style={{ paddingLeft: `${paddingLeft}px` }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              type="button"
              onClick={() => onToggleExpand(category.id)}
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

          {/* Category Icon */}
          {category.iconUrl && (
            <img
              src={category.iconUrl}
              alt={category.name}
              className="w-6 h-6 object-contain"
            />
          )}

          {/* Category Name */}
          <button
            type="button"
            onClick={() => onSelectCategory(category.id)}
            className="flex-1 text-left font-medium text-gray-900 hover:text-blue-600"
          >
            {category.name}
          </button>

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
          {hasChildren && (
            <span className="text-sm text-gray-500">
              {category.children.length} subcategories
            </span>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Edit Button */}
            <a
              href={`/admin/categories/${category.id}/edit`}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Edit"
            >
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-1.414L9 16.172A2 2 0 01.586 15H7a2 2 0 01-2-2v-6a2 2 0 012-2h2a2 2 0 012 2v5a2 2 0 01-2 2z"
                />
              </svg>
            </a>

            {/* Delete Button */}
            <button
              type="button"
              onClick={() => onDeleteCategory(category.id, category.name)}
              className="p-1 hover:bg-red-100 rounded transition-colors"
              title="Delete"
            >
              <svg
                className="w-4 h-4 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 011.138 2H6.862a2 2 0 01-1.995-1.858L5 7m5 4v6M4 7v6a2 2 0 002 2h6a2 2 0 002-2V9a2 2 0 00-2-2h-2a2 2 0 00-2 2v5a2 2 0 012 2h2a2 2 0 012-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v5a2 2 0 012 2h2a2 2 0 012-2V9a2 2 0 00-2-2h-2a2 2 0 00-2 2v5a2 2 0 012 2h2a2 2 0 012-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v5a2 2 0 012 2h2a2 2 0 012-2V9a2 2 0 00-2-2h-2a2 2 0 00-2 2v5a2 2 0 012 2h2a2 2 0 012-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v5z"
                />
              </svg>
            </button>

            {/* Reorder Button */}
            <button
              type="button"
              onClick={() => {
                const newOrder = prompt('Enter new display order:', category.displayOrder.toString());
                if (newOrder) {
                  onReorder(category.id, parseInt(newOrder));
                }
              }}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Reorder"
            >
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4 0l4 8m0 0l4-8m0 0l4 8M4 4v16m0 0l4-4m-4 0l4 4"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="ml-4 mt-2 border-l-2 border-gray-200 pl-4">
            {renderCategoryTree(category.children!, depth + 1)}
          </div>
        )}
      </div>
    );
  };

  const filteredCategories = filterCategories(categories);
  const totalCategories = categories.length;
  const activeCategories = categories.filter((cat) => cat.status === 'active').length;
  const inactiveCategories = categories.filter((cat) => cat.status === 'inactive').length;

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

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h1 className="text-xl font-semibold text-red-800 mb-2">
            Error Loading Categories
          </h1>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Categories
          </h1>
          <p className="text-gray-600 mt-1">
            {totalCategories} total ({activeCategories} active, {inactiveCategories} inactive)
          </p>
        </div>
        <a
          href="/admin/categories/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          + Add Category
        </a>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Category Tree */}
      {filteredCategories.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          {renderCategoryTree(filteredCategories)}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7v0a7 7 0 0114 0z"
            />
          </svg>
          <p className="text-gray-600 text-lg">No categories found</p>
          <p className="text-gray-500 mt-2">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Click "Add Category" to create your first category'}
          </p>
        </div>
      )}
    </div>
  );
};
