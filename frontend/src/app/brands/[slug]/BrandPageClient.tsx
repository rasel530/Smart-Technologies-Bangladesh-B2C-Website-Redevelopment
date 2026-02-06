'use client';

/**
 * Brand Page Client Component
 *
 * Client component wrapper for brand pages that handles interactive functionality
 * including view mode toggle with localStorage persistence and URL parameter support.
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ViewToggle, ViewMode } from '@/components/product/ViewToggle';
import { ProductGrid } from '@/components/product/ProductGrid';

interface BrandPageClientProps {
  brandId: string;
  initialProducts: any[];
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  initialPage: number;
  initialSortBy?: 'price' | 'name' | 'createdAt';
  initialSortOrder?: 'asc' | 'desc';
}

export function BrandPageClient({
  brandId,
  initialProducts,
  initialPagination,
  initialPage,
  initialSortBy,
  initialSortOrder,
}: BrandPageClientProps) {
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
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Sort Options and View Toggle */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <a
                href={`?sortBy=createdAt&sortOrder=desc${searchParams.get('view') ? `&view=${searchParams.get('view')}` : ''}`}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  initialSortBy === 'createdAt' && initialSortOrder === 'desc'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Newest
              </a>
              <a
                href={`?sortBy=price&sortOrder=asc${searchParams.get('view') ? `&view=${searchParams.get('view')}` : ''}`}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  initialSortBy === 'price' && initialSortOrder === 'asc'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Price: Low to High
              </a>
              <a
                href={`?sortBy=price&sortOrder=desc${searchParams.get('view') ? `&view=${searchParams.get('view')}` : ''}`}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  initialSortBy === 'price' && initialSortOrder === 'desc'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Price: High to Low
              </a>
              <a
                href={`?sortBy=name&sortOrder=asc${searchParams.get('view') ? `&view=${searchParams.get('view')}` : ''}`}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  initialSortBy === 'name' && initialSortOrder === 'asc'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Name: A to Z
              </a>
            </div>
            
            {/* View Toggle */}
            <ViewToggle
              viewMode={viewMode}
              onViewModeChange={handleViewChange}
            />
          </div>

          {/* Products Grid */}
          {initialProducts.length > 0 ? (
            <>
              <ProductGrid
                products={initialProducts}
                columns={{
                  mobile: 1,
                  tablet: 2,
                  desktop: viewMode === 'grid' ? 4 : 1,
                }}
                viewMode={viewMode}
              />

              {/* Pagination */}
              {initialPagination.pages > 1 && (
                <div className="mt-8 flex justify-center items-center gap-2">
                  {initialPage > 1 && (
                    <a
                      href={`?page=${initialPage - 1}&sortBy=${initialSortBy}&sortOrder=${initialSortOrder}&view=${viewMode}`}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Previous
                    </a>
                  )}

                  {[...Array(initialPagination.pages)].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <a
                        key={pageNum}
                        href={`?page=${pageNum}&sortBy=${initialSortBy}&sortOrder=${initialSortOrder}&view=${viewMode}`}
                        className={`w-10 h-10 rounded-md transition-colors ${
                          initialPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </a>
                    );
                  })}

                  {initialPage < initialPagination.pages && (
                    <a
                      href={`?page=${initialPage + 1}&sortBy=${initialSortBy}&sortOrder=${initialSortOrder}&view=${viewMode}`}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Next
                    </a>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.293.707V16l2 2a1 1 0 001 1h6a1 1 0 001-1v-6a1 1 0 00-1-1H8a1 1 0 00-1 1v-6z"
                />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No products found
              </h2>
              <p className="text-gray-600">
                This brand doesn't have any products at the moment.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
