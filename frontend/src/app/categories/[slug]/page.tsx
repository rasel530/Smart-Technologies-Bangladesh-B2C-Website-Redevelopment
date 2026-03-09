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
import { getCategoryBySlugServer, getCategoriesServer } from '@/lib/api/server';
import { getBrandsServer } from '@/lib/api/server';
import { BreadcrumbNavigation } from '@/components/layout/BreadcrumbNavigation';
import { generateCategoryBreadcrumbs } from '@/lib/utils/breadcrumbs';
import CategoryProducts from './CategoryProducts';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils/image';

// Simple in-memory cache for category data to avoid duplicate fetches
// Cache key: slug -> category data
const categoryCache = new Map<string, any>();

/**
 * Fetch category data with caching
 */
async function getCategoryWithCache(slug: string) {
  if (categoryCache.has(slug)) {
    return categoryCache.get(slug);
  }
  const category = await getCategoryBySlugServer(slug);
  categoryCache.set(slug, category);
  return category;
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const category = await getCategoryWithCache(params.slug);
    
    if (!category) {
      return {
        title: 'Category Not Found - Smart Technologies Bangladesh',
        description: 'Category not found',
      };
    }

    const imageUrl = category.category.imageUrl ? getImageUrl(category.category.imageUrl) : undefined;
    
    return {
      title: `${category.category.name} - Smart Technologies Bangladesh`,
      description: category.category.description || `Browse ${category.category.name} products at Smart Technologies Bangladesh.`,
      keywords: `${category.category.name}, products, technology, Bangladesh, ${category.category.slug}`,
      openGraph: {
        title: category.category.name,
        description: category.category.description || `Browse ${category.category.name} products`,
        images: imageUrl ? [{ url: imageUrl }] : undefined,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: category.category.name,
        description: category.category.description || `Browse ${category.category.name} products`,
        images: imageUrl ? [imageUrl] : undefined,
      },
      other: imageUrl ? {
        'x-image-preload': imageUrl,
      } : undefined,
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
  let category, categoriesResponse, brandsResponse;
  let fetchError = null;

  try {
    // Fetch category, categories, and brands in parallel
    // Use cached category to avoid duplicate fetch
    // Products are fetched separately in CategoryProducts component with Suspense
    const [categoryData, categoriesData, brandsData] = await Promise.all([
      getCategoryWithCache(slug),
      getCategoriesServer({ status: 'active' }),
      getBrandsServer({ status: 'active' }),
    ]);

    category = categoryData;
    categoriesResponse = categoriesData;
    brandsResponse = brandsData;
  } catch (error: any) {
    console.error('[CategoryPage] Error fetching data:', error);
    fetchError = error?.message || 'Failed to load category. Please try again later.';
    
    // Set default values to prevent page crash
    category = null;
    categoriesResponse = { categories: [] };
    brandsResponse = { brands: [] };
  }

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

  // Defensive check for category data availability
  if (!category || !category.category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  // Get subcategories
  const subcategories = categoriesResponse.categories.filter(
    cat => cat.parentId === category?.category?.id
  );

  // Generate breadcrumbs at component top level
  const breadcrumbItems = category ? generateCategoryBreadcrumbs(category.category) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <BreadcrumbNavigation items={breadcrumbItems} />
        </div>
      </div>

      {/* Category Hero Section */}
      {category.category.imageUrl && (
        <div className="relative h-48 md:h-64 bg-gray-900">
          {category.category.imageUrl && (
            <Image
              src={getImageUrl(category.category.imageUrl) || ''}
              alt={category.category.name}
              fill
              unoptimized={true}
              className="object-cover opacity-50"
              priority
              sizes="(max-width: 768px) 100vw, 1200px"
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

      {/* Subcategories - Always show if available, even when no products */}
      {subcategories.length > 0 && (
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Browse by Subcategory
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {subcategories.map((subcategory) => (
                <Link
                  key={subcategory.id}
                  href={`/categories/${subcategory.slug}`}
                  className="group"
                >
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 hover:shadow-lg hover:scale-105 transition-all duration-200 border border-blue-100">
                    {subcategory.iconUrl ? (
                      <div className="w-16 h-16 mx-auto mb-3">
                        <Image
                          src={getImageUrl(subcategory.iconUrl) || ''}
                          alt={subcategory.name}
                          width={64}
                          height={64}
                          unoptimized={true}
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                    )}
                    <h3 className="text-sm font-semibold text-gray-900 text-center group-hover:text-blue-600 transition-colors">
                      {subcategory.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Stream products with Suspense */}
      <Suspense fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-200 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      }>
        <CategoryProducts
          categoryId={category.category.id}
          page={page}
          limit={limit}
          sortBy={sortBy}
          sortOrder={sortOrder}
          brand={brand}
          minPrice={minPrice}
          maxPrice={maxPrice}
          rating={rating}
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
      </Suspense>

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

    </div>
  );
}
