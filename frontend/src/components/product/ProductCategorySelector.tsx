'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Search, Check } from 'lucide-react';
import { Category } from '@/types/category';

interface ProductCategorySelectorProps {
  categories: Category[];
  selectedCategories: string[];
  primaryCategoryId?: string;
  onCategoryToggle: (categoryId: string) => void;
  onPrimaryCategoryChange: (categoryId: string) => void;
  className?: string;
}

export const ProductCategorySelector: React.FC<ProductCategorySelectorProps> = ({
  categories,
  selectedCategories,
  primaryCategoryId,
  onCategoryToggle,
  onPrimaryCategoryChange,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [filteredCategories, setFilteredCategories] = useState<Category[]>(categories);

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

  const toggleExpand = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const renderCategory = (category: Category, level: number = 0) => {
    const isSelected = selectedCategories.includes(category.id);
    const isPrimary = primaryCategoryId === category.id;
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div key={category.id} className="select-none">
        <div
          className={`flex items-center gap-2 py-2 px-3 hover:bg-gray-50 cursor-pointer transition-colors ${
            level > 0 ? 'ml-4' : ''
          }`}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(category.id);
              }}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          )}
          
          <button
            onClick={() => onCategoryToggle(category.id)}
            className={`flex-1 flex items-center gap-2 text-left ${
              isSelected ? 'text-blue-600 font-medium' : 'text-gray-700'
            }`}
          >
            <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
              isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 hover:border-blue-400'
            }`}>
              {isSelected && <Check className="w-3 h-3 text-white" />}
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
                onPrimaryCategoryChange(category.id);
              }}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                isPrimary
                  ? 'bg-purple-100 text-purple-700 border border-purple-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-600 border border-gray-200'
              }`}
            >
              {isPrimary ? 'Primary' : 'Set Primary'}
            </button>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-2">
            {category.children?.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Category List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredCategories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No categories found matching "{searchQuery}"
          </div>
        ) : (
          <div className="py-2">
            {filteredCategories.map(category => renderCategory(category))}
          </div>
        )}
      </div>

      {/* Selected Count */}
      <div className="p-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
        {selectedCategories.length} category{selectedCategories.length !== 1 ? 'ies' : ''} selected
        {primaryCategoryId && ' • 1 primary'}
      </div>
    </div>
  );
};

export default ProductCategorySelector;
