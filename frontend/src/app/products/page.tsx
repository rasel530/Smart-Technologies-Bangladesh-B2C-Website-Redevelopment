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

import { useState, useEffect, useMemo, Suspense, Component, ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/hooks/useWishlist';
import { useWishlistStore } from '@/stores/wishlistStore';
import { toast } from 'sonner';

// Error Boundary Component to catch React rendering errors
class ProductsPageErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('[ProductsPageErrorBoundary] Error caught:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[ProductsPageErrorBoundary] Error caught:', error);
    console.error('[ProductsPageErrorBoundary] Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded max-w-md">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-red-700 mb-4">
              {this.state.error?.message || 'An error occurred while loading the products page.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
  const router = useRouter();
  
  // Cart context
  const { addItem } = useCart();
  
  // Wishlist state
  const { isInWishlist, addToDefaultWishlist, removeFromWishlist, items } = useWishlist();
  
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
  const [isMounted, setIsMounted] = useState(false);

  // Parse URL parameters directly from useSearchParams
  const searchParams = useSearchParams();
  
  // Create stable string references for dependencies to prevent infinite loops
  // These useMemo hooks ensure strings only change when actual URL parameter values change
  const categoryParamsString = useMemo(() => JSON.stringify(searchParams.getAll('category').sort()), [searchParams]);
  const brandParamsString = useMemo(() => JSON.stringify(searchParams.getAll('brand').sort()), [searchParams]);
  const minPriceString = useMemo(() => searchParams.get('minPrice') || '', [searchParams]);
  const maxPriceString = useMemo(() => searchParams.get('maxPrice') || '', [searchParams]);
  const ratingString = useMemo(() => searchParams.get('rating') || '', [searchParams]);
  const sortString = useMemo(() => searchParams.get('sort') || '', [searchParams]);
  const pageString = useMemo(() => searchParams.get('page') || '1', [searchParams]);
  const viewString = useMemo(() => searchParams.get('view') || '', [searchParams]);
  
  // Parse parameters for use in component
  const categoryParams = useMemo(() => searchParams.getAll('category'), [searchParams]);
  const brandParams = useMemo(() => searchParams.getAll('brand'), [searchParams]);
  const minPrice = useMemo(() => searchParams.get('minPrice'), [searchParams]);
  const maxPrice = useMemo(() => searchParams.get('maxPrice'), [searchParams]);
  const rating = useMemo(() => searchParams.get('rating'), [searchParams]);
  const sort = useMemo(() => searchParams.get('sort'), [searchParams]);
  const view = useMemo(() => searchParams.get('view'), [searchParams]);
  const page = useMemo(() => searchParams.get('page') || '1', [searchParams]);

  // Set isMounted to true after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update view mode from URL or localStorage
  useEffect(() => {
    if (!isMounted) return;
    
    console.log('[ProductsPage] viewMode useEffect triggered', { view, currentViewMode: viewMode });
    try {
      if (view && (view === 'grid' || view === 'list')) {
        // Only update if value is different
        if (view !== viewMode) {
          setViewMode(view);
        }
      } else {
        const savedView = localStorage.getItem('smart_tech_product_view_mode') as ViewMode;
        if (savedView && (savedView === 'grid' || savedView === 'list')) {
          // Only update if value is different
          if (savedView !== viewMode) {
            setViewMode(savedView);
          }
        }
      }
    } catch (error) {
      console.error('[ProductsPage] Error in viewMode useEffect:', error);
    }
  }, [view, isMounted]);

  // Update page from URL
  useEffect(() => {
    console.log('[ProductsPage] currentPage useEffect triggered', { pageString, currentPage });
    try {
      if (pageString) {
        const newPage = parseInt(pageString);
        // Only update if the value is different and valid
        if (!isNaN(newPage) && newPage > 0 && newPage !== currentPage) {
          setCurrentPage(newPage);
        }
      }
    } catch (error) {
      console.error('[ProductsPage] Error in currentPage useEffect:', error);
    }
  }, [pageString]);

  // Fetch data
  useEffect(() => {
    console.log('[ProductsPage] fetchData useEffect triggered', {
      categoryParamsString,
      brandParamsString,
      minPriceString,
      maxPriceString,
      ratingString,
      sortString,
      pageString,
      currentPage
    });
    
    const fetchData = async () => {
      console.log('[ProductsPage] Starting data fetch...');
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

        console.log('[ProductsPage] Fetching with filters:', filters);

        // Fetch products, categories, and brands
        const [productsData, categoriesResponse, brandsResponse] = await Promise.all([
          getAll(filters),
          getCategories({ status: 'active' }),
          getBrands({ status: 'active' }),
        ]);

        console.log('[ProductsPage] Data fetched successfully', {
          productsCount: productsData.products?.length,
          totalProducts: productsData.pagination?.total,
          categoriesCount: categoriesResponse.categories?.length,
          brandsCount: brandsResponse.brands?.length
        });

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
        console.error('[ProductsPage] Error fetching products:', err);
        setError(err?.message || 'Failed to load products. Please try again later.');
        setProducts([]);
        setTotalProducts(0);
      } finally {
        console.log('[ProductsPage] Data fetch completed');
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

  // Create wishlisted products set
  const productIds = useMemo(() => products.map(p => p.id), [products]);
  const wishlistedProducts = useMemo(() => {
    return new Set(items.filter(i => productIds.includes(i.productId)).map(i => i.productId));
  }, [productIds, items]);

  // Remove active filter
  const removeFilter = (key: string, value: string) => {
    const params = new URLSearchParams();
    
    if (key === 'category' || key === 'brand') {
      const values = (key === 'category' ? categoryParams : brandParams).filter(v => v !== value);
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
    
    const params = new URLSearchParams();
    params.set('view', view);
    router.push(`?${params.toString()}`);
  };

  // Handle add to cart
  const handleAddToCart = (productId: string, variantId?: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      addItem(product, 1, variantId);
    }
  };

  // Handle toggle wishlist
  const handleToggleWishlist = async (productId: string) => {
    try {
      if (isInWishlist(productId)) {
        // Find item ID and remove
        const item = items.find(i => i.productId === productId);
        if (item) {
          await removeFromWishlist(item.wishlistId, item.id);
          toast.success('Item removed from wishlist');
        }
      } else {
        await addToDefaultWishlist(productId);
        toast.success('Item added to wishlist');
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error('Failed to update wishlist');
    }
  };

  // Memoize breadcrumbs to prevent infinite loop in BreadcrumbNavigation
  const breadcrumbItems = useMemo(() => [
    { label: 'Home', href: '/' },
    { label: 'Products', current: true },
  ], []);

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
                  viewMode={viewMode}
                  onViewModeChange={handleViewChange}
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
              onAddToCart={handleAddToCart}
              onToggleWishlist={handleToggleWishlist}
              wishlistedProducts={wishlistedProducts}
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
      <ProductsPageErrorBoundary>
        <ProductsPageContent />
      </ProductsPageErrorBoundary>
    </Suspense>
  );
}
