/**
 * SortDropdown Component
 * 
 * A dropdown component for sorting products.
 * Features include:
 * - Sort options: Featured, Price Low-High, Price High-Low, Newest, Best Selling, Rating
 * - Visual icon for current sort
 * - Mobile-friendly dropdown
 * - Integration with URL search params
 * 
 * @component
 */

'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export type SortOption = 
  | 'featured'
  | 'price-asc'
  | 'price-desc'
  | 'newest'
  | 'best-selling'
  | 'rating'
  | 'name-asc'
  | 'name-desc';

interface SortOptionConfig {
  value: SortOption;
  label: string;
  icon: React.ReactNode;
}

interface SortDropdownProps {
  className?: string;
}

const sortOptions: SortOptionConfig[] = [
  {
    value: 'featured',
    label: 'Featured',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
    ),
  },
  {
    value: 'price-asc',
    label: 'Price: Low to High',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
        />
      </svg>
    ),
  },
  {
    value: 'price-desc',
    label: 'Price: High to Low',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
        />
      </svg>
    ),
  },
  {
    value: 'newest',
    label: 'Newest',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    value: 'best-selling',
    label: 'Best Selling',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
      </svg>
    ),
  },
  {
    value: 'rating',
    label: 'Rating',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ),
  },
  {
    value: 'name-asc',
    label: 'Name: A to Z',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
        />
      </svg>
    ),
  },
  {
    value: 'name-desc',
    label: 'Name: Z to A',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
        />
      </svg>
    ),
  },
];

/**
 * SortDropdown Component
 * 
 * @param {SortDropdownProps} props - Component props
 * @returns {JSX.Element} Sort dropdown component
 */
export const SortDropdown: React.FC<SortDropdownProps> = ({
  className = ''
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Get current sort option from URL
  const currentSort = (searchParams.get('sort') as SortOption) || 'featured';
  const currentSortOption = sortOptions.find(option => option.value === currentSort) || sortOptions[0];

  // Handle sort change
  const handleSortChange = (value: SortOption) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === 'featured') {
      params.delete('sort');
    } else {
      params.set('sort', value);
    }
    
    // Reset to page 1 when sort changes
    params.delete('page');
    
    router.push(`?${params.toString()}`);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.sort-dropdown')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative sort-dropdown ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Sort products"
      >
        <span className="text-sm text-gray-700">Sort by:</span>
        <span className="flex items-center gap-1 text-sm font-medium text-gray-900">
          {currentSortOption.icon}
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
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
          role="listbox"
          aria-label="Sort options"
        >
          <ul className="py-1 max-h-96 overflow-y-auto">
            {sortOptions.map((option) => (
              <li key={option.value}>
                <button
                  onClick={() => handleSortChange(option.value)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-sm text-left
                    transition-colors
                    ${currentSort === option.value
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                    focus:outline-none focus:bg-gray-50
                  `}
                  role="option"
                  aria-selected={currentSort === option.value}
                >
                  <span className={currentSort === option.value ? 'text-blue-600' : 'text-gray-400'}>
                    {option.icon}
                  </span>
                  <span>{option.label}</span>
                  {currentSort === option.value && (
                    <svg className="w-4 h-4 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SortDropdown;
