'use client';

import React, { useState, useEffect } from 'react';
import { CategoryTree } from '@/types/category';
import { getCategoryTree, moveCategory, deleteCategory } from '@/lib/api/categories';
import { useShowToast } from '@/components/ui/Toast';
import { Search, Edit, Trash2, RefreshCw, AlertCircle, ChevronRight, ChevronDown, FolderOpen, Folder } from 'lucide-react';

/**
 * CategoryTreeEditor Component
 * 
 * Visual tree editor for category hierarchy with drag-and-drop support
 * Features: search/filter, edit/delete, proper error handling, loading states
 */
export const CategoryTreeEditor: React.FC = () => {
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMoving, setIsMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const toast = useShowToast();

  useEffect(() => {
    loadCategories();
  }, [statusFilter]);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getCategoryTree(statusFilter === 'all' ? undefined : statusFilter);
      setCategories(response.tree || []);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load categories';
      setError(errorMessage);
      toast.error(errorMessage, 'Error Loading Categories');
    } finally {
      setIsLoading(false);
    }
  };

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
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDraggedCategory(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, targetCategoryId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(targetCategoryId);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = async (e: React.DragEvent, targetCategoryId: string) => {
    e.preventDefault();
    const sourceCategoryId = e.dataTransfer.getData('text/plain');

    if (!sourceCategoryId || sourceCategoryId === targetCategoryId) {
      handleDragEnd();
      return;
    }

    try {
      setIsMoving(true);
      await moveCategory(sourceCategoryId, { parentId: targetCategoryId });
      toast.success('Category moved successfully', 'Success');
      // Refresh categories
      await loadCategories();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to move category';
      toast.error(errorMessage, 'Move Failed');
      setError(errorMessage);
    } finally {
      setIsMoving(false);
      handleDragEnd();
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete "${categoryName}"? This will also delete all subcategories and products within them.`)) {
      return;
    }

    try {
      setIsMoving(true);
      await deleteCategory(categoryId);
      toast.success('Category deleted successfully', 'Success');
      await loadCategories();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete category';
      toast.error(errorMessage, 'Delete Failed');
      setError(errorMessage);
    } finally {
      setIsMoving(false);
    }
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

  const renderTreeItem = (category: CategoryTree, depth = 0): React.ReactNode => {
    const paddingLeft = depth * 24;
    const isExpanded = expandedCategories.has(category.id);
    const isDragging = draggedCategory === category.id;
    const isDropTarget = dropTarget === category.id && !isDragging;
    const hasChildren = category.children && category.children.length > 0;
    const totalChildren = countAllChildren(category);

    return (
      <div key={category.id} className="mb-1">
        <div
          className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50 opacity-50'
              : isDropTarget
              ? 'border-green-500 bg-green-50 ring-2 ring-green-300'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
          style={{ paddingLeft: `${paddingLeft}px` }}
          draggable
          onDragStart={(e) => handleDragStart(e, category.id)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, category.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, category.id)}
        >
          {/* Expand/Collapse */}
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleExpand(category.id)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          {/* Icon */}
          {hasChildren ? (
            <FolderOpen className={`w-5 h-5 ${isExpanded ? 'text-blue-600' : 'text-gray-500'}`} />
          ) : (
            <Folder className="w-5 h-5 text-gray-500" />
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
            {totalChildren} {totalChildren === 1 ? 'subcategory' : 'subcategories'}
          </span>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-2">
            {/* Edit Button */}
            <a
              href={`/admin/categories/${category.id}/edit`}
              className="p-1.5 hover:bg-blue-100 rounded transition-colors group"
              title="Edit category"
              onClick={(e) => e.stopPropagation()}
            >
              <Edit className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
            </a>

            {/* Delete Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCategory(category.id, category.name);
              }}
              className="p-1.5 hover:bg-red-100 rounded transition-colors group"
              title="Delete category"
              disabled={isMoving}
            >
              <Trash2 className="w-4 h-4 text-gray-600 group-hover:text-red-600" />
            </button>
          </div>
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

  const countAllChildren = (category: CategoryTree): number => {
    if (!category.children || category.children.length === 0) return 0;
    return category.children.length + category.children.reduce((sum, child) => sum + countAllChildren(child), 0);
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
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Error Loading Categories
          </h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadCategories}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Category Tree Editor
          </h1>
          <a
            href="/admin/categories/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            + Add Category
          </a>
        </div>
        <p className="text-gray-600">
          Drag and drop categories to reorganize your category hierarchy. {totalCategories} total ({activeCategories} active, {inactiveCategories} inactive)
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

      {/* Loading Overlay for Move Operations */}
      {isMoving && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl flex items-center gap-3">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
            <span className="text-gray-700 font-medium">Processing...</span>
          </div>
        </div>
      )}

      {/* Category Tree */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {filteredCategories.length > 0 ? (
          <div className="space-y-1">
            {filteredCategories.map((category) => renderTreeItem(category))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Folder className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">
              {searchQuery ? 'No categories found matching your search' : 'No categories found'}
            </p>
            <p className="text-gray-500 mt-2">
              {searchQuery
                ? 'Try adjusting your search query or filters'
                : 'Click "Add Category" to create your first category'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
