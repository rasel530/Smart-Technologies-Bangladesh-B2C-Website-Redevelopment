/**
 * Product Listing Page
 *
 * Client component for product listing with filters, sorting, and pagination.
 * Features include:
 * - Client-side filtering and sorting with URL persistence
 * - URL parameter handling for state persistence
 * - Mobile filter drawer
 * - Breadcrumb navigation
 * - Active filter tags
 * - View mode toggle (grid/list)
 */

'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAll } from '@/lib/api/products';
import { getCategories } from '@/lib/api/categories';
import { getBrands } from '@/lib/api/brands';
import { SearchFilters, ProductWithRelations } from '@/types/product';
import { ProductGrid } from '@/components/product/ProductGrid';
import { FilterSidebar } from '@/components/product/FilterSidebar';
import { SortDropdown } from '@/components/product/SortDropdown';
import { ViewToggle, ViewMode } from '@/components/product/ViewToggle';
import { BreadcrumbNavigation } from '@/components/layout/BreadcrumbNavigation';

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

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // State
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Parse URL parameters
  const categoryParams = searchParams.getAll('category');
  const brandParams = searchParams.getAll('brand');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const rating = searchParams.get('rating');
  const sort = searchParams.get('sort');
  const view = searchParams.get('view') as ViewMode;
  const page = searchParams.get('page');

  // Create stable references for dependencies to prevent infinite loops
  const categoryParamsString = useMemo(() => JSON.stringify(categoryParams.sort()), [categoryParams]);
  const brandParamsString = useMemo(() => JSON.stringify(brandParams.sort()), [brandParams]);
  const minPriceString = useMemo(() => minPrice || '', [minPrice]);
  const maxPriceString = useMemo(() => maxPrice || '', [maxPrice]);
  const ratingString = useMemo(() => rating || '', [rating]);
  const sortString = useMemo(() => sort || '', [sort]);
  const pageString = useMemo(() => page || '1', [page]);

  // Update view mode from URL or localStorage
  useEffect(() => {
    if (view && (view === 'grid' || view === 'list')) {
      setViewMode(view);
    } else {
      const savedView = localStorage.getItem('smart_tech_product_view_mode') as ViewMode;
      if (savedView && (savedView === 'grid' || savedView === 'list')) {
        setViewMode(savedView);
      }
    }
  }, [view]);

  // Update page from URL
  useEffect(() => {
    if (pageString) {
      setCurrentPage(parseInt(pageString));
    }
  }, [pageString]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build filters object
        const filters: SearchFilters = {
          page: currentPage,
          limit: 20,
          category: categoryParams[0], // Take first category for API
          brand: brandParams[0], // Take first brand for API
          minPrice: minPrice ? parseInt(minPrice) : undefined,
          maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
          status: 'active',
          visibility: 'public',
          sortBy: sort === 'price-asc' ? 'price' : 
                 sort === 'price-desc' ? 'price' :
                 sort === 'newest' ? 'createdAt' :
                 sort === 'rating' ? 'name' :
                 sort === 'name-asc' ? 'name' :
                 sort === 'name-desc' ? 'name' : undefined,
          sortOrder: sort === 'price-asc' || sort === 'name-asc' ? 'asc' :
                   sort === 'price-desc' || sort === 'name-desc' ? 'desc' : undefined,
        };

        // Fetch products, categories, and brands
        const [productsData, categoriesResponse, brandsResponse] = await Promise.all([
          getAll(filters),
          getCategories({ status: 'active' }),
          getBrands({ status: 'active' }),
        ]);

        setProducts(productsData.products);
        setTotalProducts(productsData.pagination.total);
        setCategories(categoriesResponse.categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
        })));
        setBrands(brandsResponse.brands.map(brand => ({
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
        })));
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError(err?.message || 'Failed to load products. Please try again later.');
        setProducts([]);
        setTotalProducts(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryParamsString, brandParamsString, minPriceString, maxPriceString, ratingString, sortString, pageString]);

  // Generate page title based on active filters
  const pageTitle = useMemo(() => {
    const parts = ['Products'];
    if (categoryParams.length > 0) {
      const catNames = categories
        .filter(c => categoryParams.includes(c.id))
        .map(c => c.name);
      if (catNames.length > 0) parts.push(catNames.join(', '));
    }
    if (brandParams.length > 0) {
      const brandNames = brands
        .filter(b => brandParams.includes(b.id))
        .map(b => b.name);
      if (brandNames.length > 0) parts.push(brandNames.join(', '));
    }
    return parts.join(' - ');
  }, [categoryParams, brandParams, categories, brands]);

  // Generate active filter tags
  const activeFilters = useMemo(() => {
    const filters: Array<{ key: string; label: string; value: string }> = [];

    categoryParams.forEach(catId => {
      const cat = categories.find(c => c.id === catId);
      if (cat) {
        filters.push({ key: 'category', label: cat.name, value: catId });
      }
    });

    brandParams.forEach(brandId => {
      const brand = brands.find(b => b.id === brandId);
      if (brand) {
        filters.push({ key: 'brand', label: brand.name, value: brandId });
      }
    });

    if (minPrice) {
      filters.push({ key: 'minPrice', label: `Min: ৳${minPrice}`, value: minPrice });
    }

    if (maxPrice) {
      filters.push({ key: 'maxPrice', label: `Max: ৳${maxPrice}`, value: maxPrice });
    }

    if (rating) {
      filters.push({ key: 'rating', label: `${rating}+ Stars`, value: rating });
    }

    return filters;
  }, [categoryParams, brandParams, minPrice, maxPrice, rating, categories, brands]);

  // Remove active filter
  const removeFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (key === 'category' || key === 'brand') {
      const values = params.getAll(key).filter(v => v !== value);
      params.delete(key);
      values.forEach(v => params.append(key, v));
    } else {
      params.delete(key);
    }

    // Reset to page 1 when filter changes
    params.delete('page');
    router.push(`?${params.toString()}`);
  };

  // Clear all filters
  const clearAllFilters = () => {
    router.push('/products');
  };

  // Handle view mode change
  const handleViewChange = (view: ViewMode) => {
    setViewMode(view);
    localStorage.setItem('smart_tech_product_view_mode', view);
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', view);
    router.push(`?${params.toString()}`);
  };

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Products', current: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <BreadcrumbNavigation items={breadcrumbItems} />
        </div>
      </div>

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
          <p className="text-gray-600">
            Browse our comprehensive collection of premium technology products
          </p>
          {error && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          {!error && !loading && totalProducts > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Showing {totalProducts} products
            </p>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700">Active Filters:</span>
              {activeFilters.map((filter, index) => (
                <button
                  key={`${filter.key}-${filter.value}-${index}`}
                  onClick={() => removeFilter(filter.key, filter.value)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors"
                >
                  {filter.label}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ))}
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
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
            {/* Sort, View Toggle, and Mobile Filter Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <p className="text-sm text-gray-600">
                {loading ? 'Loading...' :
                totalProducts > 0
                  ? `Showing ${((currentPage - 1) * 20) + 1}-${Math.min(currentPage * 20, totalProducts)} of ${totalProducts} products`
                  : 'No products found'
                }
              </p>
              <div className="flex items-center gap-3">
                {/* Mobile Filter Toggle */}
                <button
                  onClick={() => setIsMobileFilterOpen(true)}
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
                  {activeFilters.length > 0 && (
                    <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                      {activeFilters.length}
                    </span>
                  )}
                </button>

                {/* View Toggle */}
                <ViewToggle
                  currentView={viewMode}
                  onViewChange={handleViewChange}
                />

                {/* Sort Dropdown */}
                <SortDropdown />
              </div>
            </div>

            {/* Products Grid */}
            <ProductGrid
              products={products}
              loading={loading}
              viewMode={viewMode}
              columns={{
                mobile: 1,
                tablet: 2,
                desktop: viewMode === 'grid' ? 3 : 1,
              }}
            />
          </main>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
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
            <div className="flex-1 overflow-y-auto">
              <FilterSidebar
                categories={categories}
                brands={brands}
                isMobile
                onClose={() => setIsMobileFilterOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Fallback component for Suspense
function ProductsPageFallback() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
        </div>
      </div>
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="h-10 bg-gray-200 rounded animate-pulse w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-96"></div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
          </aside>
          <main className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="h-48 bg-gray-200 rounded animate-pulse mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// Default export with Suspense boundary
export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsPageFallback />}>
      <ProductsPageContent />
    </Suspense>
  );
}
