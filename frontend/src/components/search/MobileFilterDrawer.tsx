'use client';

/**
 * MobileFilterDrawer Component
 *
 * Client component that handles the mobile filter drawer with toggle state.
 * Provides a slide-in drawer for filtering on mobile devices.
 */

import React, { useState } from 'react';
import { FilterSidebar } from '@/components/product/FilterSidebar';

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

interface MobileFilterDrawerProps {
  categories: Category[];
  brands: Brand[];
}

export function MobileFilterDrawer({ categories, brands }: MobileFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
  };

  const closeDrawer = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Filter Toggle Button */}
      <button
        onClick={toggleDrawer}
        className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Toggle filters"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        <span>Filters</span>
      </button>

      {/* Mobile Filter Drawer */}
      <div
        className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="absolute inset-0 bg-black/50"
          onClick={closeDrawer}
        />
        <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <button
              onClick={closeDrawer}
              className="p-2 text-gray-400 hover:text-gray-500"
              aria-label="Close filters"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="p-4 overflow-y-auto h-[calc(100%-64px)]">
            <FilterSidebar
              isMobile={true}
              onClose={closeDrawer}
              categories={categories}
              brands={brands}
            />
          </div>
        </div>
      </div>
    </>
  );
}
