/**
 * FilterPanel Component
 * 
 * A comprehensive filter panel component for product listings.
 * Features include category, brand, price range, status, and feature filters.
 * 
 * @component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SearchFilters } from '@/types/product';

interface FilterPanelProps {
  categories?: Array<{ id: string; name: string; slug: string }>;
  brands?: Array<{ id: string; name: string; slug: string }>;
  className?: string;
}

/**
 * FilterPanel Component
 * 
 * @param {FilterPanelProps} props - Component props
 * @returns {JSX.Element} Filter panel component
 */
export const FilterPanel: React.FC<FilterPanelProps> = ({
  categories = [],
  brands = [],
  className = ''
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['category', 'price', 'status'])
  );

  // Parse current filters from URL
  const filters: SearchFilters = {
    page: typeof searchParams.get('page') === 'string' ? parseInt(searchParams.get('page')!) : 1,
    limit: typeof searchParams.get('limit') === 'string' ? parseInt(searchParams.get('limit')!) : 20,
    category: searchParams.get('category') || undefined,
    brand: searchParams.get('brand') || undefined,
    search: searchParams.get('search') || undefined,
    minPrice: typeof searchParams.get('minPrice') === 'string' ? parseInt(searchParams.get('minPrice')!) : undefined,
    maxPrice: typeof searchParams.get('maxPrice') === 'string' ? parseInt(searchParams.get('maxPrice')!) : undefined,
    status: (searchParams.get('status') as SearchFilters['status']) || undefined,
    sortBy: (searchParams.get('sortBy') as SearchFilters['sortBy']) || undefined,
    sortOrder: (searchParams.get('sortOrder') as SearchFilters['sortOrder']) || undefined,
    isFeatured: searchParams.get('isFeatured') === 'true',
    isNewArrival: searchParams.get('isNewArrival') === 'true',
    isBestSeller: searchParams.get('isBestSeller') === 'true',
  };

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  // Update a single filter by updating URL
  const updateFilter = (key: keyof SearchFilters, value: any) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === undefined || value === '') {
      params.delete(key);
    } else {
      if (typeof value === 'boolean') {
        params.set(key, value ? 'true' : 'false');
      } else {
        params.set(key, String(value));
      }
    }
    
    // Reset to page 1 when filters change
    params.delete('page');
    
    router.push(`/products?${params.toString()}`);
  };

  // Clear all filters
  const handleClearAll = () => {
    router.push('/products');
  };

  // Check if any filters are active
  const hasActiveFilters = Object.keys(filters).some(
    (key) => filters[key as keyof SearchFilters] !== undefined && filters[key as keyof SearchFilters] !== ''
  );

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={handleClearAll}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Filter Sections */}
      <div className="p-4 space-y-6">
        {/* Category Filter */}
        {categories.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('category')}
              className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3 focus:outline-none"
              aria-expanded={expandedSections.has('category')}
            >
              Category
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  expandedSections.has('category') ? 'rotate-180' : ''
                }`}
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
            {expandedSections.has('category') && (
              <div className="space-y-2">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="category"
                      value={category.id}
                      checked={filters.category === category.id}
                      onChange={(e) =>
                        updateFilter('category', e.target.value || undefined)
                      }
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{category.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Brand Filter */}
        {brands.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('brand')}
              className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3 focus:outline-none"
              aria-expanded={expandedSections.has('brand')}
            >
              Brand
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  expandedSections.has('brand') ? 'rotate-180' : ''
                }`}
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
            {expandedSections.has('brand') && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {brands.map((brand) => (
                  <label
                    key={brand.id}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="brand"
                      value={brand.id}
                      checked={filters.brand === brand.id}
                      onChange={(e) =>
                        updateFilter('brand', e.target.value || undefined)
                      }
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{brand.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Price Range Filter */}
        <div>
          <button
            onClick={() => toggleSection('price')}
            className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3 focus:outline-none"
            aria-expanded={expandedSections.has('price')}
          >
            Price Range
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                  expandedSections.has('price') ? 'rotate-180' : ''
                }`}
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
          {expandedSections.has('price') && (
            <div className="space-y-3">
              <div>
                <label htmlFor="minPrice" className="block text-sm text-gray-600 mb-1">
                  Min Price (BDT)
                </label>
                <input
                  id="minPrice"
                  type="number"
                  min="0"
                  value={filters.minPrice || ''}
                  onChange={(e) =>
                    updateFilter(
                      'minPrice',
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label htmlFor="maxPrice" className="block text-sm text-gray-600 mb-1">
                  Max Price (BDT)
                </label>
                <input
                  id="maxPrice"
                  type="number"
                  min="0"
                  value={filters.maxPrice || ''}
                  onChange={(e) =>
                    updateFilter(
                      'maxPrice',
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Any"
                />
              </div>
            </div>
          )}
        </div>

        {/* Status Filter */}
        <div>
          <button
            onClick={() => toggleSection('status')}
            className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3 focus:outline-none"
            aria-expanded={expandedSections.has('status')}
          >
            Stock Status
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                  expandedSections.has('status') ? 'rotate-180' : ''
                }`}
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
          {expandedSections.has('status') && (
            <div className="space-y-2">
              {[
                { value: 'active', label: 'In Stock' },
                { value: 'out_of_stock', label: 'Out of Stock' }
              ].map((status) => (
                <label
                  key={status.value}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="status"
                    value={status.value}
                    checked={filters.status === status.value}
                    onChange={(e) =>
                      updateFilter(
                        'status',
                        e.target.value as SearchFilters['status']
                      )
                    }
                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{status.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Feature Flags */}
        <div>
          <button
            onClick={() => toggleSection('features')}
            className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3 focus:outline-none"
            aria-expanded={expandedSections.has('features')}
          >
            Features
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                  expandedSections.has('features') ? 'rotate-180' : ''
                }`}
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
          {expandedSections.has('features') && (
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.isFeatured || false}
                  onChange={(e) => updateFilter('isFeatured', e.target.checked || undefined)}
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500 rounded"
                />
                <span className="text-sm text-gray-700">Featured</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.isNewArrival || false}
                  onChange={(e) => updateFilter('isNewArrival', e.target.checked || undefined)}
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500 rounded"
                />
                <span className="text-sm text-gray-700">New Arrivals</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.isBestSeller || false}
                  onChange={(e) => updateFilter('isBestSeller', e.target.checked || undefined)}
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500 rounded"
                />
                <span className="text-sm text-gray-700">Best Sellers</span>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
