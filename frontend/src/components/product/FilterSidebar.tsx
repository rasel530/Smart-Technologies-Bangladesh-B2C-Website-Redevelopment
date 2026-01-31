/**
 * FilterSidebar Component
 * 
 * A comprehensive filter sidebar component for product listings.
 * Features include:
 * - Filter by category (multi-select checkboxes)
 * - Filter by brand (multi-select checkboxes)
 * - Price range slider with min/max inputs
 * - Filter by specifications (dynamic based on category)
 * - Rating filter (4+, 3+, etc.)
 * - Clear all filters button
 * - Active filter count display
 * - Collapsible filter sections
 * - Responsive design (mobile drawer on small screens)
 * 
 * @component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SearchFilters } from '@/types/product';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
}

interface Specification {
  id: string;
  name: string;
  value: string;
  sortOrder: number;
}

interface FilterSidebarProps {
  categories?: Category[];
  brands?: Brand[];
  specifications?: Specification[];
  className?: string;
  isMobile?: boolean;
  onClose?: () => void;
}

interface ActiveFilters {
  categories: string[];
  brands: string[];
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  specifications: string[];
}

/**
 * FilterSidebar Component
 * 
 * @param {FilterSidebarProps} props - Component props
 * @returns {JSX.Element} Filter sidebar component
 */
export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  categories = [],
  brands = [],
  specifications = [],
  className = '',
  isMobile = false,
  onClose
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['category', 'brand', 'price', 'rating'])
  );

  // Parse active filters from URL
  const activeFilters: ActiveFilters = {
    categories: searchParams.getAll('category') || [],
    brands: searchParams.getAll('brand') || [],
    minPrice: typeof searchParams.get('minPrice') === 'string' ? parseInt(searchParams.get('minPrice')!) : undefined,
    maxPrice: typeof searchParams.get('maxPrice') === 'string' ? parseInt(searchParams.get('maxPrice')!) : undefined,
    rating: typeof searchParams.get('rating') === 'string' ? parseInt(searchParams.get('rating')!) : undefined,
    specifications: searchParams.getAll('specification') || [],
  };

  // Calculate active filter count
  const activeFilterCount = 
    activeFilters.categories.length +
    activeFilters.brands.length +
    activeFilters.specifications.length +
    (activeFilters.minPrice ? 1 : 0) +
    (activeFilters.maxPrice ? 1 : 0) +
    (activeFilters.rating ? 1 : 0);

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

  // Update filters by updating URL
  const updateFilters = (updates: Partial<ActiveFilters>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Handle categories (multi-select)
    if (updates.categories !== undefined) {
      params.delete('category');
      updates.categories.forEach(cat => params.append('category', cat));
    }
    
    // Handle brands (multi-select)
    if (updates.brands !== undefined) {
      params.delete('brand');
      updates.brands.forEach(brand => params.append('brand', brand));
    }
    
    // Handle price range
    if (updates.minPrice !== undefined) {
      if (updates.minPrice === undefined || updates.minPrice === 0) {
        params.delete('minPrice');
      } else {
        params.set('minPrice', String(updates.minPrice));
      }
    }
    
    if (updates.maxPrice !== undefined) {
      if (updates.maxPrice === undefined) {
        params.delete('maxPrice');
      } else {
        params.set('maxPrice', String(updates.maxPrice));
      }
    }
    
    // Handle rating
    if (updates.rating !== undefined) {
      if (updates.rating === undefined) {
        params.delete('rating');
      } else {
        params.set('rating', String(updates.rating));
      }
    }
    
    // Handle specifications
    if (updates.specifications !== undefined) {
      params.delete('specification');
      updates.specifications.forEach(spec => params.append('specification', spec));
    }
    
    // Reset to page 1 when filters change
    params.delete('page');
    
    router.push(`?${params.toString()}`);
  };

  // Toggle category selection
  const toggleCategory = (categoryId: string) => {
    const newCategories = activeFilters.categories.includes(categoryId)
      ? activeFilters.categories.filter(id => id !== categoryId)
      : [...activeFilters.categories, categoryId];
    updateFilters({ categories: newCategories });
  };

  // Toggle brand selection
  const toggleBrand = (brandId: string) => {
    const newBrands = activeFilters.brands.includes(brandId)
      ? activeFilters.brands.filter(id => id !== brandId)
      : [...activeFilters.brands, brandId];
    updateFilters({ brands: newBrands });
  };

  // Toggle specification selection
  const toggleSpecification = (specValue: string) => {
    const newSpecs = activeFilters.specifications.includes(specValue)
      ? activeFilters.specifications.filter(s => s !== specValue)
      : [...activeFilters.specifications, specValue];
    updateFilters({ specifications: newSpecs });
  };

  // Clear all filters
  const handleClearAll = () => {
    const params = new URLSearchParams();
    router.push(`?${params.toString()}`);
    if (isMobile && onClose) {
      onClose();
    }
  };

  // Rating options
  const ratingOptions = [
    { value: 4, label: '4 & Up', stars: 4 },
    { value: 3, label: '3 & Up', stars: 3 },
    { value: 2, label: '2 & Up', stars: 2 },
    { value: 1, label: '1 & Up', stars: 1 },
  ];

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-gray-900">Filters</h2>
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={handleClearAll}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Filter Sections */}
      <div className="p-4 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Category Filter */}
        {categories.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('category')}
              className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3 focus:outline-none"
              aria-expanded={expandedSections.has('category')}
            >
              <span>Category</span>
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
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={activeFilters.categories.includes(category.id)}
                      onChange={() => toggleCategory(category.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
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
              <span>Brand</span>
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
                      type="checkbox"
                      checked={activeFilters.brands.includes(brand.id)}
                      onChange={() => toggleBrand(brand.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
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
            <span>Price Range</span>
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
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label htmlFor="minPrice" className="block text-xs text-gray-600 mb-1">
                    Min
                  </label>
                  <input
                    id="minPrice"
                    type="number"
                    min="0"
                    value={activeFilters.minPrice || ''}
                    onChange={(e) => updateFilters({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="0"
                  />
                </div>
                <span className="text-gray-400 mt-5">-</span>
                <div className="flex-1">
                  <label htmlFor="maxPrice" className="block text-xs text-gray-600 mb-1">
                    Max
                  </label>
                  <input
                    id="maxPrice"
                    type="number"
                    min="0"
                    value={activeFilters.maxPrice || ''}
                    onChange={(e) => updateFilters({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Any"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rating Filter */}
        <div>
          <button
            onClick={() => toggleSection('rating')}
            className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3 focus:outline-none"
            aria-expanded={expandedSections.has('rating')}
          >
            <span>Rating</span>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                expandedSections.has('rating') ? 'rotate-180' : ''
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
          {expandedSections.has('rating') && (
            <div className="space-y-2">
              {ratingOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center space-x-2 cursor-pointer ${
                    activeFilters.rating === option.value ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="rating"
                    value={option.value}
                    checked={activeFilters.rating === option.value}
                    onChange={() => updateFilters({ rating: option.value })}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${
                          i < option.stars ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm ml-1">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Specifications Filter */}
        {specifications.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('specifications')}
              className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3 focus:outline-none"
              aria-expanded={expandedSections.has('specifications')}
            >
              <span>Specifications</span>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  expandedSections.has('specifications') ? 'rotate-180' : ''
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
            {expandedSections.has('specifications') && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {specifications.map((spec) => (
                  <label
                    key={spec.id}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={activeFilters.specifications.includes(spec.value)}
                      onChange={() => toggleSpecification(spec.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">{spec.name}</p>
                      <p className="text-xs text-gray-500">{spec.value}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile: Apply Filters Button */}
      {isMobile && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Apply Filters
            {activeFilterCount > 0 && ` (${activeFilterCount})`}
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterSidebar;
