'use client';

/**
 * SearchPageClient Component
 *
 * Client component wrapper for the search page that handles all interactive functionality.
 * This component receives pre-fetched data from the Server Component and manages
 * client-side interactions like filters, sorting, and search history.
 */

import { Suspense, useState, useEffect, useMemo } from 'react';
import { ProductGrid } from '@/components/product/ProductGrid';
import { FilterSidebar } from '@/components/product/FilterSidebar';
import { SortDropdown } from '@/components/product/SortDropdown';
import { ViewToggle } from '@/components/product/ViewToggle';
import { BreadcrumbNavigation, generateSearchBreadcrumbs } from '@/components/layout/BreadcrumbNavigation';
import { SearchHistory } from './SearchHistory';
import { MobileFilterDrawer } from './MobileFilterDrawer';
import { SearchPageContent } from './SearchPageContent';
import { ProductWithRelations } from '@/types/product';

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

interface SearchResults {
  products: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  metadata: {
    query: string;
    executionTime: number;
    searchEngine: string;
  };
}

interface SearchPageClientProps {
  query: string;
  page: number;
  limit: number;
  searchResults: SearchResults;
  categories: Category[];
  brands: Brand[];
  fetchError: string | null;
}

export function SearchPageClient({
  query,
  page,
  limit,
  searchResults,
  categories,
  brands,
  fetchError,
}: SearchPageClientProps) {
  // View mode state with localStorage persistence
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('searchViewMode');
      return (saved === 'list' ? 'list' : 'grid');
    }
    return 'grid';
  });

  // Save view mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('searchViewMode', viewMode);
  }, [viewMode]);

  // Popular searches (static for now, could be fetched from API)
  const popularSearches = [
    'Smartphone',
    'Laptop',
    'Headphones',
    'Smart Watch',
    'Tablet',
    'Power Bank',
    'Bluetooth Speaker',
  ];

  // Memoize breadcrumbs to prevent infinite loop in BreadcrumbNavigation
  const breadcrumbs = useMemo(() => generateSearchBreadcrumbs(query), [query]);

  return (
    <SearchPageContent>
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <BreadcrumbNavigation items={breadcrumbs} />
          </div>
        </div>

        {/* Page Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {query ? `Search Results for "${query}"` : 'Search'}
                </h1>
                <p className="text-gray-600">
                  {fetchError ? (
                    <span className="text-red-600">{fetchError}</span>
                  ) : searchResults.pagination.total > 0 ? (
                    `Found ${searchResults.pagination.total} products`
                  ) : (
                    'No products found'
                  )}
                </p>
              </div>
            </div>

            {/* Did you mean? - Disabled as search API doesn't support this feature */}
            {false && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  Did you mean{' '}
                  <a
                    href={`/search?q=${encodeURIComponent('')}`}
                    className="font-semibold text-blue-600 hover:text-blue-700 underline"
                  >
                    ""
                  </a>
                  ?
                </p>
              </div>
            )}

            {/* Search Suggestions */}
            {!query && (
              <div className="mt-6 space-y-6">
                {/* Recent Searches */}
                <SearchHistory />

                {/* Popular Searches */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Popular Searches</h2>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((search, index) => (
                      <a
                        key={index}
                        href={`/search?q=${encodeURIComponent(search)}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors text-sm"
                      >
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        {search}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* No Results State */}
            {query && !fetchError && searchResults.pagination.total === 0 && (
              <div className="mt-6 text-center py-8">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No results found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  We couldn't find any products matching "{query}"
                </p>
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-600">Try:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Checking your spelling</li>
                    <li>• Using more general terms</li>
                    <li>• Trying different keywords</li>
                    <li>• Clearing filters</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        {query && !fetchError && searchResults.pagination.total > 0 && (
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Filters Sidebar - Desktop */}
              <aside className="hidden lg:block w-64 flex-shrink-0">
                <FilterSidebar
                  categories={categories.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    slug: cat.slug,
                  }))}
                  brands={brands.map(brand => ({
                    id: brand.id,
                    name: brand.name,
                    slug: brand.slug,
                  }))}
                />
              </aside>

              {/* Products Grid */}
              <main className="flex-1">
                {/* Sort Control and Mobile Filter Toggle */}
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm text-gray-600">
                    Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, searchResults.pagination.total)} of {searchResults.pagination.total} results
                  </p>
                  <div className="flex items-center gap-3">
                    {/* Mobile Filter Toggle */}
                    <MobileFilterDrawer
                      categories={categories.map(cat => ({
                        id: cat.id,
                        name: cat.name,
                        slug: cat.slug,
                      }))}
                      brands={brands.map(brand => ({
                        id: brand.id,
                        name: brand.name,
                        slug: brand.slug,
                      }))}
                    />
                    <SortDropdown />
                    {/* View Toggle */}
                    <ViewToggle
                      viewMode={viewMode}
                      onViewModeChange={setViewMode}
                    />
                  </div>
                </div>

                {/* Products Grid */}
                <Suspense fallback={<ProductGrid products={[]} loading />}>
                  <ProductGrid
                    products={searchResults.products}
                    columns={{
                      mobile: 1,
                      tablet: 2,
                      desktop: 3,
                    }}
                    viewMode={viewMode}
                  />
                </Suspense>
              </main>
            </div>
          </div>
        )}
      </div>
    </SearchPageContent>
  );
}

export default SearchPageClient;
