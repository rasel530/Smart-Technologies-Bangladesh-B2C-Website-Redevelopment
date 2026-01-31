/**
 * Category Page Template
 * 
 * Server component for category pages with filters, sorting, and pagination.
 * Features include:
 * - Category hero section with image/description
 * - BreadcrumbNavigation
 * - Category-specific filters
 * - Subcategory cards
 * - Featured products in category
 * - Product grid/list with filters
 * - Category description at bottom
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { getAll } from '@/lib/api/products';
import { getCategoryBySlugServer, getCategoriesServer } from '@/lib/api/server';
import { getBrandsServer } from '@/lib/api/server';
import { ProductGrid } from '@/components/product/ProductGrid';
import { FilterSidebar } from '@/components/product/FilterSidebar';
import { SortDropdown } from '@/components/product/SortDropdown';
import { BreadcrumbNavigation, generateCategoryBreadcrumbs } from '@/components/layout/BreadcrumbNavigation';
import Image from 'next/image';
import { getImageUrl } from '@/lib/api/product-images';

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const category = await getCategoryBySlugServer(params.slug);
    
    if (!category) {
      return {
        title: 'Category Not Found - Smart Technologies Bangladesh',
        description: 'Category not found',
      };
    }

    return {
      title: `${category.category.name} - Smart Technologies Bangladesh`,
      description: category.category.description || `Browse ${category.category.name} products at Smart Technologies Bangladesh.`,
      keywords: `${category.category.name}, products, technology, Bangladesh, ${category.category.slug}`,
      openGraph: {
        title: category.category.name,
        description: category.category.description || `Browse ${category.category.name} products`,
        images: category.category.imageUrl ? [{ url: category.category.imageUrl }] : undefined,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: category.category.name,
        description: category.category.description || `Browse ${category.category.name} products`,
        images: category.category.imageUrl ? [category.category.imageUrl] : undefined,
      },
    };
  } catch (error) {
    return {
      title: 'Category - Smart Technologies Bangladesh',
      description: 'Browse our product categories',
    };
  }
}

/**
 * Category Page Component
 */
export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Await params in Next.js 15+
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const limit = typeof searchParams.limit === 'string' ? parseInt(searchParams.limit) : 20;
  const sortBy = typeof searchParams.sortBy === 'string' ? searchParams.sortBy as 'price' | 'name' | 'createdAt' | 'stockQuantity' : undefined;
  const sortOrder = typeof searchParams.sortOrder === 'string' ? searchParams.sortOrder as 'asc' | 'desc' : undefined;
  const brands = searchParams.brand as string[] || [];
  const brand = brands.length > 0 ? brands[0] : undefined;
  const minPrice = typeof searchParams.minPrice === 'string' ? parseInt(searchParams.minPrice) : undefined;
  const maxPrice = typeof searchParams.maxPrice === 'string' ? parseInt(searchParams.maxPrice) : undefined;
  const rating = typeof searchParams.rating === 'string' ? parseInt(searchParams.rating) : undefined;

  // Fetch category data
  let category, productsData, categoriesResponse, brandsResponse;
  let fetchError = null;

  try {
    // Fetch category, categories, and brands first
    const [categoryData, categoriesData, brandsData] = await Promise.all([
      getCategoryBySlugServer(slug),
      getCategoriesServer({ status: 'active' }),
      getBrandsServer({ status: 'active' }),
    ]);

    category = categoryData;
    categoriesResponse = categoriesData;
    brandsResponse = brandsData;

    // Then fetch products using category ID
    productsData = await getAll({
      page,
      limit,
      categoryId: category.category.id,
      sortBy,
      sortOrder,
      brandId: brand,
      minPrice,
      maxPrice,
      visibility: 'public',
    });
  } catch (error: any) {
    console.error('[CategoryPage] Error fetching data:', error);
    fetchError = error?.message || 'Failed to load category. Please try again later.';
    
    // Set default values to prevent page crash
    category = null;
    productsData = {
      products: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      }
    };
    categoriesResponse = { categories: [] };
    brandsResponse = { brands: [] };
  }

  // Get subcategories
  const subcategories = categoriesResponse.categories.filter(
    cat => cat.parentId === category?.category?.id
  );

  // Get featured products in category
  const featuredProducts = productsData.products.filter(p => p.isFeatured).slice(0, 4);

  // If category not found, show 404
  if (!category || !category.category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Category Not Found</h1>
          <p className="text-gray-600 mb-6">
            The category you're looking for doesn't exist.
          </p>
          <Link
            href="/categories"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Browse All Categories
          </Link>
        </div>
      </div>
    );
  }

  // Defensive check for category properties
  if (!category.category.name || !category.category.slug) {
    console.error('Invalid category data:', category);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Invalid Category</h1>
          <p className="text-gray-600 mb-6">
            The category data is invalid.
          </p>
          <Link
            href="/categories"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Browse All Categories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <BreadcrumbNavigation items={generateCategoryBreadcrumbs(category.category)} />
        </div>
      </div>

      {/* Category Hero Section */}
      {category.category.imageUrl && (
        <div className="relative h-48 md:h-64 bg-gray-900">
          {category.category.imageUrl && (
            <Image
              src={category.category.imageUrl}
              alt={category.category.name}
              fill
              className="object-cover opacity-50"
              priority
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {category.category.name}
              </h1>
              {category.category.description && (
                <p className="text-lg text-gray-200 max-w-2xl mx-auto">
                  {category.category.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subcategories */}
      {subcategories.length > 0 && (
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Browse by Subcategory
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {subcategories.map((subcategory) => (
                <Link
                  key={subcategory.id}
                  href={`/categories/${subcategory.slug}`}
                  className="group"
                >
                  <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    {subcategory.iconUrl && (
                      <div className="w-12 h-12 mx-auto mb-2">
                        <Image
                          src={subcategory.iconUrl}
                          alt={subcategory.name}
                          width={48}
                          height={48}
                          className="object-contain"
                        />
                      </div>
                    )}
                    <h3 className="text-sm font-medium text-gray-900 text-center group-hover:text-blue-600 transition-colors">
                      {subcategory.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Featured Products
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group"
                >
                  <div className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    {product.images?.[0] && (
                      <div className="relative aspect-square">
                        <Image
                          src={getImageUrl(product.images[0], 'medium')}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        ৳{product.salePrice || product.regularPrice}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
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
                {fetchError ? (
                  <span className="text-red-600">{fetchError}</span>
                ) : productsData.pagination.total > 0 ? (
                  `Showing ${((page - 1) * limit) + 1}-${Math.min(page * limit, productsData.pagination.total)} of ${productsData.pagination.total} products`
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
                <SortDropdown />
              </div>
            </div>

            {/* Products Grid */}
            <Suspense fallback={<ProductGrid products={[]} loading />}>
              <ProductGrid
                products={productsData.products}
                
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

      {/* Category Description at Bottom */}
      {category.category.description && (
        <div className="bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 py-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              About {category.category.name}
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              {category.category.description}
            </p>
          </div>
        </div>
      )}

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
            <FilterSidebar
              isMobile={true}
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
