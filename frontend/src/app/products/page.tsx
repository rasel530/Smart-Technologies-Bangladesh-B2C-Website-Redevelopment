/**
 * Product Listing Page
 * 
 * Server component for product listing with filters, sorting, and pagination.
 * Features include:
 * - Server-side data fetching for SEO
 * - Client-side filtering and sorting
 * - URL parameter handling for state persistence
 * - Mobile filter drawer
 * - Breadcrumb navigation
 * - SEO metadata
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { getAll } from '@/lib/api/products';
import { getCategories } from '@/lib/api/categories';
import { getBrands } from '@/lib/api/brands';
import { SearchFilters } from '@/types/product';
import { ProductGrid } from '@/components/product/ProductGrid';
import { FilterPanel } from '@/components/product/FilterPanel';
import { SortControl } from '@/components/product/SortControl';

/**
 * Generate metadata for SEO
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'All Products - Smart Technologies Bangladesh',
    description: 'Browse our comprehensive collection of premium technology products. Find the latest gadgets, electronics, and accessories.',
    keywords: 'products, technology, electronics, gadgets, Bangladesh, smart technologies',
    openGraph: {
      title: 'All Products - Smart Technologies Bangladesh',
      description: 'Browse our comprehensive collection of premium technology products.',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'All Products - Smart Technologies Bangladesh',
      description: 'Browse our comprehensive collection of premium technology products.',
    },
  };
}

/**
 * Product Listing Page Component
 */
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Parse URL parameters
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const limit = typeof searchParams.limit === 'string' ? parseInt(searchParams.limit) : 20;
  const category = typeof searchParams.category === 'string' ? searchParams.category : undefined;
  const brand = typeof searchParams.brand === 'string' ? searchParams.brand : undefined;
  const search = typeof searchParams.search === 'string' ? searchParams.search : undefined;
  const minPrice = typeof searchParams.minPrice === 'string' ? parseInt(searchParams.minPrice) : undefined;
  const maxPrice = typeof searchParams.maxPrice === 'string' ? parseInt(searchParams.maxPrice) : undefined;
  const status = typeof searchParams.status === 'string' ? searchParams.status as SearchFilters['status'] : undefined;
  const sortBy = typeof searchParams.sortBy === 'string' ? searchParams.sortBy as SearchFilters['sortBy'] : undefined;
  const sortOrder = typeof searchParams.sortOrder === 'string' ? searchParams.sortOrder as SearchFilters['sortOrder'] : undefined;
  const isFeatured = searchParams.isFeatured === 'true';
  const isNewArrival = searchParams.isNewArrival === 'true';
  const isBestSeller = searchParams.isBestSeller === 'true';

  // Build filters object
  const filters: SearchFilters = {
    page,
    limit,
    category,
    brand,
    search,
    minPrice,
    maxPrice,
    status,
    sortBy,
    sortOrder,
    isFeatured,
    isNewArrival,
    isBestSeller,
  };

  // Fetch initial data
  const [productsData, categoriesResponse, brandsResponse] = await Promise.all([
    getAll(filters),
    getCategories({ status: 'active' }),
    getBrands({ status: 'active' }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <nav className="bg-white border-b border-gray-200" aria-label="Breadcrumb">
        <div className="container mx-auto px-4 py-4">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                Home
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium">Products</li>
          </ol>
        </div>
      </nav>

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Products</h1>
          <p className="text-gray-600">
            Browse our comprehensive collection of premium technology products
          </p>
          {productsData.pagination.total > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Showing {productsData.pagination.total} products
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <FilterPanel
              categories={categoriesResponse.categories.map(cat => ({
                id: cat.id,
                name: cat.name,
                slug: cat.slug,
              }))}
              brands={brandsResponse.brands.map(brand => ({
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
                {productsData.pagination.total > 0
                  ? `Showing ${((page - 1) * limit) + 1}-${Math.min(page * limit, productsData.pagination.total)} of ${productsData.pagination.total} products`
                  : 'No products found'
                }
              </p>
              <div className="flex items-center gap-3">
                {/* Mobile Filter Toggle */}
                <button
                  className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                <SortControl />
              </div>
            </div>

            {/* Products Grid */}
            <Suspense fallback={<ProductGrid products={[]} loading />}>
              <ProductGrid
                products={productsData.products}
                pagination={productsData.pagination}
                columns={{
                  mobile: 1,
                  tablet: 2,
                  desktop: 3,
                }}
              />
            </Suspense>
          </main>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <div className="fixed inset-0 z-50 hidden" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <button
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
            <FilterPanel
              categories={categoriesResponse.categories.map(cat => ({
                id: cat.id,
                name: cat.name,
                slug: cat.slug,
              }))}
              brands={brandsResponse.brands.map(brand => ({
                id: brand.id,
                name: brand.name,
                slug: brand.slug,
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
