'use client';

/**
 * Category Page Client Component
 *
 * Client component wrapper for category pages that handles interactive functionality
 * including view mode toggle with localStorage persistence and URL parameter support.
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ViewToggle, ViewMode } from '@/components/product/ViewToggle';
import { ProductGrid } from '@/components/product/ProductGrid';
import { FilterSidebar } from '@/components/product/FilterSidebar';
import { SortDropdown } from '@/components/product/SortDropdown';

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

interface CategoryPageClientProps {
  categoryId: string;
  initialProducts: any[];
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  categories: Category[];
  brands: Brand[];
  initialPage: number;
  initialLimit: number;
  initialSortBy?: 'price' | 'name' | 'createdAt' | 'stockQuantity';
  initialSortOrder?: 'asc' | 'desc';
  initialBrand?: string;
  initialMinPrice?: number;
  initialMaxPrice?: number;
  initialRating?: number;
}

export function CategoryPageClient({
  categoryId,
  initialProducts,
  initialPagination,
  categories,
  brands,
  initialPage,
  initialLimit,
  initialSortBy,
  initialSortOrder,
  initialBrand,
  initialMinPrice,
  initialMaxPrice,
  initialRating,
}: CategoryPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // View mode state with localStorage persistence and URL parameter support
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Update view mode from URL or localStorage
  useEffect(() => {
    const view = searchParams.get('view') as ViewMode;
    if (view && (view === 'grid' || view === 'list')) {
      setViewMode(view);
    } else {
      const savedView = localStorage.getItem('smart_tech_product_view_mode') as ViewMode;
      if (savedView && (savedView === 'grid' || savedView === 'list')) {
        setViewMode(savedView);
      }
    }
  }, [searchParams]);

  // Handle view mode change
  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('smart_tech_product_view_mode', mode);
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', mode);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <FilterSidebar
            categories={categories}
            brands={brands}
          />
        </aside>

        {/* Products Grid */}
        <main className="flex-1">
          {/* Sort Control, View Toggle, and Mobile Filter Toggle */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-600">
              {initialPagination.total > 0 ? (
                `Showing ${((initialPage - 1) * initialLimit) + 1}-${Math.min(initialPage * initialLimit, initialPagination.total)} of ${initialPagination.total} products`
              ) : (
                'No products found'
              )}
            </p>
            <div className="flex items-center gap-3">
              {/* Mobile Filter Toggle */}
              <button
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
              
              {/* View Toggle */}
              <ViewToggle
                viewMode={viewMode}
                onViewModeChange={handleViewChange}
              />
              
              {/* Sort Dropdown */}
              <SortDropdown />
            </div>
          </div>

          {/* Products Grid */}
          <ProductGrid
            products={initialProducts}
            columns={{
              mobile: 1,
              tablet: 2,
              desktop: viewMode === 'grid' ? 3 : 1,
            }}
            viewMode={viewMode}
          />
        </main>
      </div>
    </div>
  );
}
