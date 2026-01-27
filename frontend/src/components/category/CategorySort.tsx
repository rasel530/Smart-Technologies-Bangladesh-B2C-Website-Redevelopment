'use client';

import React, { useState } from 'react';

interface CategorySortProps {
  sortBy: 'price' | 'name' | 'createdAt' | 'rating';
  sortOrder: 'asc' | 'desc';
  onSortChange: (
    sortBy: 'price' | 'name' | 'createdAt' | 'rating',
    sortOrder: 'asc' | 'desc'
  ) => void;
}

/**
 * CategorySort Component
 * 
 * Category sorting controls
 * Supports sorting by: relevance, price, name, rating, newest
 */
export const CategorySort: React.FC<CategorySortProps> = ({
  sortBy,
  sortOrder,
  onSortChange
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const sortOptions = [
    { value: 'createdAt' as const, label: 'Newest', order: 'desc' as const },
    { value: 'price' as const, label: 'Price: Low to High', order: 'asc' as const },
    { value: 'price' as const, label: 'Price: High to Low', order: 'desc' as const },
    { value: 'name' as const, label: 'Name: A to Z', order: 'asc' as const },
    { value: 'name' as const, label: 'Name: Z to A', order: 'desc' as const },
    { value: 'rating' as const, label: 'Top Rated', order: 'desc' as const }
  ];

  const currentSortLabel = sortOptions.find(
    (opt) => opt.value === sortBy && opt.order === sortOrder
  )?.label || 'Sort by';

  const handleSortSelect = (value: typeof sortBy, order: typeof sortOrder) => {
    onSortChange(value, order);
    setIsOpen(false);
  };

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
            d="M3 4h13M3 8h13M3 12h13M3 16h13M3 20h13M10 4v16"
          />
        </svg>
        <span className="font-medium text-gray-700">{currentSortLabel}</span>
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

      {/* Sort Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-300 rounded-lg shadow-xl z-50">
          <ul className="py-1" role="menu">
            {sortOptions.map((option) => (
              <li key={`${option.value}-${option.order}`}>
                <button
                  type="button"
                  onClick={() => handleSortSelect(option.value, option.order)}
                  className={`w-full text-left px-4 py-2 transition-colors ${
                    sortBy === option.value && sortOrder === option.order
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                  role="menuitem"
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
