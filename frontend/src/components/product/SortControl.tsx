// @ts-ignore
/**
 * SortControl Component
 * 
 * A sort control component for product listings.
 * Features include sort by dropdown and sort order toggle.
 * 
 * @component
 */

'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SearchFilters } from '@/types/product';

interface SortControlProps {
  className?: string;
}

/**
 * SortControl Component
 * 
 * @param {SortControlProps} props - Component props
 * @returns {JSX.Element} Sort control component
 */
export const SortControl: React.FC<SortControlProps> = ({
  className = ''
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Parse current filters from URL
  const sortByValue = searchParams.get('sortBy');
  const filters: SearchFilters = {
    page: typeof searchParams.get('page') === 'string' ? parseInt(searchParams.get('page')!) : 1,
    limit: typeof searchParams.get('limit') === 'string' ? parseInt(searchParams.get('limit')!) : 20,
    category: searchParams.get('category') || undefined,
    brand: searchParams.get('brand') || undefined,
    search: searchParams.get('search') || undefined,
    minPrice: typeof searchParams.get('minPrice') === 'string' ? parseInt(searchParams.get('minPrice')!) : undefined,
    maxPrice: typeof searchParams.get('maxPrice') === 'string' ? parseInt(searchParams.get('maxPrice')!) : undefined,
    status: (searchParams.get('status') as SearchFilters['status']) || undefined,
    sortBy: sortByValue ? (sortByValue as SearchFilters['sortBy']) : undefined,
    sortOrder: (searchParams.get('sortOrder') as SearchFilters['sortOrder']) || undefined,
    isFeatured: searchParams.get('isFeatured') === 'true',
    isNewArrival: searchParams.get('isNewArrival') === 'true',
    isBestSeller: searchParams.get('isBestSeller') === 'true',
  };

  // Sort options
  const sortOptions = [
    { value: 'price', label: 'Price' },
    { value: 'name', label: 'Name' },
    { value: 'createdAt', label: 'Newest' },
    { value: 'stockQuantity', label: 'Stock' }
  ];

  // Get current sort option
  const currentSortOption = sortOptions.find(
    (option) => option.value === filters.sortBy
  ) || sortOptions[0];

  // Handle sort by change
  const handleSortByChange = (value: any) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sortBy', value);
    params.delete('page'); // Reset to page 1
    router.push(`/products?${params.toString()}`);
    setIsOpen(false);
  };

  // Toggle sort order
  const handleSortOrderToggle = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc');
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Sort By Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <span className="text-sm text-gray-700">Sort by:</span>
          <span className="text-sm font-medium text-gray-900">
            {currentSortOption.label}
          </span>
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l7 7-7"
            />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            <ul className="py-1">
              {sortOptions.map((option) => (
                <li key={option.value}>
                  <button
                    onClick={() => handleSortByChange(option.value as SearchFilters['sortBy'])}
                    className={`
                      w-full text-left px-4 py-2 text-sm
                      ${filters.sortBy === option.value
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                      focus:outline-none focus:bg-gray-50
                    `}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>

      {/* Sort Order Toggle */}
      <button
        onClick={handleSortOrderToggle}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        aria-label={`Sort ${filters.sortOrder === 'asc' ? 'descending' : 'ascending'}`}
      >
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${
            filters.sortOrder === 'desc' ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4h13M3 8h9m9 4h6m4 0l4 4m0 0l4 4m-4v12"
          />
        </svg>
        <span className="text-sm text-gray-700">
          {filters.sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
        </span>
      </button>
    </div>
  );
};

export default SortControl;
