'use client';

import React, { useState } from 'react';
import { Category } from '@/types/category';
import { Brand } from '@/types/brand';

interface CategoryFilterProps {
  category: Category;
  onFilterChange: (filters: {
    minPrice?: number;
    maxPrice?: number;
    subcategoryId?: string;
    brandId?: string;
  }) => void;
}

/**
 * CategoryFilter Component
 * 
 * Category-based product filtering UI
 * Supports subcategory selection and price range filter
 */
export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  category,
  onFilterChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');

  const handleApplyFilter = () => {
    onFilterChange({
      minPrice: minPrice === '' ? undefined : minPrice,
      maxPrice: maxPrice === '' ? undefined : maxPrice,
      subcategoryId: selectedSubcategory || undefined,
      brandId: selectedBrandId || undefined
    });
    setIsOpen(false);
  };

  const handleClearFilter = () => {
    setMinPrice('');
    setMaxPrice('');
    setSelectedSubcategory('');
    setSelectedBrandId('');
    onFilterChange({});
  };

  const hasSubcategories = category.children && category.children?.length > 0;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg
          className="w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1v16a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1zm0 4a1 1 0 011-1v4a1 1 0 01-1 1H3a1 1 0 01-1-1V8a1 1 0 011-1zm0 4a1 1 0 011-1v4a1 1 0 01-1 1H3a1 1 0 01-1-1v-4a1 1 0 011-1zm0 4a1 1 0 011-1v4a1 1 0 01-1 1H3a1 1 0 01-1-1v-4a1 1 0 011-1z"
          />
        </svg>
        <span className="font-medium text-gray-700">Filters</span>
        {(minPrice !== '' || maxPrice !== '' || selectedSubcategory || selectedBrandId) && (
          <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-xs rounded-full">
            {(minPrice !== '' ? 1 : 0) +
             (maxPrice !== '' ? 1 : 0) +
             (selectedSubcategory ? 1 : 0) +
             (selectedBrandId ? 1 : 0)}
          </span>
        )}
        <svg
          className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Filter Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-300 rounded-lg shadow-xl z-50">
          <div className="p-4">
            {/* Subcategory Filter */}
            {hasSubcategories && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Subcategory
                </h3>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSubcategory('')}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      selectedSubcategory === ''
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    All Subcategories
                  </button>
                  {category.children?.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => setSelectedSubcategory(child.id)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-2 ${
                        selectedSubcategory === child.id
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {child.iconUrl && (
                        <img
                          src={child.iconUrl}
                          alt={child.name}
                          className="w-5 h-5 object-contain"
                        />
                      )}
                      {child.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range Filter */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Price Range (৳)
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label htmlFor="minPrice" className="sr-only">
                    Minimum Price
                  </label>
                  <input
                    type="number"
                    id="minPrice"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                  />
                </div>
                <span className="text-gray-400">-</span>
                <div className="flex-1">
                  <label htmlFor="maxPrice" className="sr-only">
                    Maximum Price
                  </label>
                  <input
                    type="number"
                    id="maxPrice"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Brand Filter */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Brand
              </h3>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSelectedBrandId('')}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    selectedBrandId === ''
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  All Brands
                </button>
                {category.brands?.map((brand) => (
                  <button
                    key={brand.id}
                    type="button"
                    onClick={() => setSelectedBrandId(brand.id)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-2 ${
                      selectedBrandId === brand.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {brand.logoUrl && (
                      <img
                        src={brand.logoUrl}
                        alt={brand.name}
                        className="w-5 h-5 object-contain"
                      />
                    )}
                    {brand.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleApplyFilter}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={handleClearFilter}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
