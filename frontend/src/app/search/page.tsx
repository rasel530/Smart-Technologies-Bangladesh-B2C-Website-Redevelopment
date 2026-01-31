/**
 * Search Results Page
 *
 * Server component for search results with filters, sorting, and pagination.
 * Features include:
 * - Display search query at top
 * - Show result count
 * - Integrate FilterSidebar (same as products page)
 * - Integrate SortDropdown
 * - Grid/list view toggle
 * - "Did you mean?" suggestions for typos
 * - No results state with suggestions
 * - Recent searches display
 * - Popular searches display
 */

// @ts-ignore - Type mismatch due to API incompatibility
import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { search } from '@/lib/api/search';
import { getCategories } from '@/lib/api/categories';
import { getBrands } from '@/lib/api/brands';
import { ProductGrid } from '@/components/product/ProductGrid';
import { FilterSidebar } from '@/components/product/FilterSidebar';
import { SortDropdown } from '@/components/product/SortDropdown';
import { BreadcrumbNavigation, generateSearchBreadcrumbs } from '@/components/layout/BreadcrumbNavigation';
import { ProductWithRelations } from '@/types/product';
import { SearchHistory } from '@/components/search/SearchHistory';
import { MobileFilterDrawer } from '@/components/search/MobileFilterDrawer';
import { SearchPageContent } from '@/components/search/SearchPageContent';

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  const query = typeof searchParams.q === 'string' ? searchParams.q : '';
  
  return {
    title: query ? `Search Results for "${query}" - Smart Technologies Bangladesh` : 'Search - Smart Technologies Bangladesh',
    description: query 
      ? `Search results for "${query}" at Smart Technologies Bangladesh. Find the best technology products.`
      : 'Search for products at Smart Technologies Bangladesh.',
    keywords: query ? `${query}, search, products, technology, Bangladesh` : 'search, products, technology, Bangladesh',
    openGraph: {
      title: query ? `Search Results for "${query}"` : 'Search',
      description: query ? `Search results for "${query}"` : 'Search products',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: query ? `Search Results for "${query}"` : 'Search',
      description: query ? `Search results for "${query}"` : 'Search products',
    },
  };
}

/**
 * Search Results Page Component
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const query = typeof searchParams.q === 'string' ? searchParams.q : '';
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const limit = typeof searchParams.limit === 'string' ? parseInt(searchParams.limit) : 20;
  
  // Parse sort parameter into sortBy and sortOrder
  const sortParam = typeof searchParams.sort === 'string' ? searchParams.sort : undefined;
  
  // Improved sort parameter mapping to match API options
  const sortMapping: Record<string, { sortBy: 'price' | 'name' | 'rating' | 'popularity' | 'createdAt'; sortOrder: 'asc' | 'desc' }> = {
    'price-asc': { sortBy: 'price', sortOrder: 'asc' },
    'price-desc': { sortBy: 'price', sortOrder: 'desc' },
    'name-asc': { sortBy: 'name', sortOrder: 'asc' },
    'name-desc': { sortBy: 'name', sortOrder: 'desc' },
    'rating-asc': { sortBy: 'rating', sortOrder: 'asc' },
    'rating-desc': { sortBy: 'rating', sortOrder: 'desc' },
    'popularity-asc': { sortBy: 'popularity', sortOrder: 'asc' },
    'popularity-desc': { sortBy: 'popularity', sortOrder: 'desc' },
    'newest': { sortBy: 'createdAt', sortOrder: 'desc' },
    'oldest': { sortBy: 'createdAt', sortOrder: 'asc' },
  };
  
  const { sortBy, sortOrder } = sortParam && sortMapping[sortParam] ? sortMapping[sortParam] : { sortBy: undefined, sortOrder: undefined };
  
  // Parse filters - support multiple selections for categories and brands
  const categories = Array.isArray(searchParams.category) ? searchParams.category : (searchParams.category ? [searchParams.category] : []);
  const brands = Array.isArray(searchParams.brand) ? searchParams.brand : (searchParams.brand ? [searchParams.brand] : []);
  const minPrice = typeof searchParams.minPrice === 'string' ? parseInt(searchParams.minPrice) : undefined;
  const maxPrice = typeof searchParams.maxPrice === 'string' ? parseInt(searchParams.maxPrice) : undefined;
  const rating = typeof searchParams.rating === 'string' ? parseInt(searchParams.rating) : undefined;
  const specifications = Array.isArray(searchParams.specification) ? searchParams.specification : (searchParams.specification ? [searchParams.specification] : []);
 
  // Fetch data
  let searchResults, categoriesResponse, brandsResponse;
  let fetchError = null;
  
  // Helper function to transform ProductSearchResult to ProductWithRelations
  const transformProductSearchResult = (result: any): any => ({
    ...result,
    id: result.id,
    sku: result.sku,
    name: result.name,
    nameEn: result.nameEn,
    nameBn: result.nameBn,
    slug: result.slug,
    shortDescription: result.shortDescription,
    description: result.shortDescription,
    regularPrice: result.basePrice,
    salePrice: result.salePrice || result.discountPrice,
    costPrice: result.basePrice,
    stockQuantity: result.inStock ? 100 : 0,
    lowStockThreshold: 10,
    taxRate: 0,
    status: 'published' as const,
    visibility: 'public' as const,
    metaTitle: result.name,
    metaDescription: result.shortDescription,
    metaKeywords: '',
    isFeatured: result.isFeatured || false,
    isNewArrival: result.isNewArrival || false,
    isBestSeller: result.isBestSeller || false,
    warrantyPeriod: null,
    warrantyType: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date(),
    brand: result.brandName ? {
      id: result.brandId || '',
      name: result.brandName || '',
      slug: result.brandName?.toLowerCase().replace(/\s+/g, '-') || '',
      logoUrl: undefined,
    } : undefined,
    categories: result.categoryName ? [{
      id: result.categoryId || '',
      category: {
        id: result.categoryId || '',
        name: result.categoryName || '',
        nameEn: result.categoryNameEn || result.categoryName || '',
        nameBn: result.categoryNameBn,
        slug: result.categoryName?.toLowerCase().replace(/\s+/g, '-') || '',
        imageUrl: undefined,
        iconUrl: undefined,
      }
    }] : [],
    images: result.thumbnail ? [{
      id: '',
      productId: result.id,
      originalUrl: result.thumbnail,
      optimizedUrl: result.thumbnail,
      thumbnailUrl: result.thumbnail,
      altTextBn: result.name,
      altTextEn: result.nameEn || result.name,
      displayOrder: 0,
      isPrimary: true,
      fileSizeBytes: null,
      mimeType: null,
      width: null,
      height: null,
      processingStatus: 'completed' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    }] : [],
    specifications: [],
    variants: [],
    avgRating: result.rating,
    _count: {
      reviews: result.reviewCount || 0,
    },
  });
 
  try {
    [searchResults, categoriesResponse, brandsResponse] = await Promise.all([
      search({
        query,
        page,
        limit,
        sortBy,
        sortOrder,
        categoryId: categories.length > 0 ? categories : undefined,
        brandId: brands.length > 0 ? brands : undefined,
        minPrice,
        maxPrice,
        rating,
        specifications: specifications.length > 0 ? specifications : undefined,
      }),
      getCategories({ status: 'active' }),
      getBrands({ status: 'active' }),
    ]);
  } catch (error: any) {
    console.error('[SearchPage] Error fetching data:', error);
    fetchError = error?.message || 'Failed to load search results. Please try again later.';
    
    // Set default values to prevent page crash
    searchResults = {
      products: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      },
      metadata: {
        query: '',
        executionTime: 0,
        searchEngine: '',
      },
    };
    categoriesResponse = { categories: [] };
    brandsResponse = { brands: [] };
  }

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

  return (
    <SearchPageContent>
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <BreadcrumbNavigation items={generateSearchBreadcrumbs(query)} />
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
                  <Link
                    href={`/search?q=${encodeURIComponent('')}`}
                    className="font-semibold text-blue-600 hover:text-blue-700 underline"
                  >
                    ""
                  </Link>
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
                      <Link
                        key={index}
                        href={`/search?q=${encodeURIComponent(search)}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors text-sm"
                      >
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        {search}
                      </Link>
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
                    Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, searchResults.pagination.total)} of {searchResults.pagination.total} results
                  </p>
                  <div className="flex items-center gap-3">
                    {/* Mobile Filter Toggle */}
                    <MobileFilterDrawer
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
                    <SortDropdown />
                  </div>
                </div>

                {/* Products Grid */}
                <Suspense fallback={<ProductGrid products={[]} loading />}>
                  <ProductGrid
                    products={searchResults.products.map(transformProductSearchResult)}
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
        )}
      </div>
    </SearchPageContent>
  );
}
