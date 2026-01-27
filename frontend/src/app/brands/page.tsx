import { Metadata } from 'next';
import Link from 'next/link';
import brandsApi from '@/lib/api/brands';
import BrandList from '@/components/brand/BrandList';
import FeaturedBrands from '@/components/brand/FeaturedBrands';

/**
 * Generate metadata for SEO
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'All Brands | Smart Tech',
    description: 'Browse all brands at Smart Tech. Find your favorite technology brands and discover their products.',
    keywords: 'brands, technology brands, electronics brands, Smart Tech',
    openGraph: {
      title: 'All Brands | Smart Tech',
      description: 'Browse all brands at Smart Tech',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'All Brands | Smart Tech',
      description: 'Browse all brands at Smart Tech',
    },
  };
}

/**
 * Generate structured data (JSON-LD) for SEO
 */
function generateStructuredData(brands: any[]) {
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: brands.map((brand, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: brand.name,
      url: `https://smarttech.com/brands/${brand.slug}`,
    })),
  };

  return JSON.stringify(itemList);
}

/**
 * Public Brands Listing Page
 * 
 * Public brands listing page with:
 * - BrandList component integration
 * - Featured brands section
 * - Search and filter
 * - Server-side rendering for SEO
 */
export default async function BrandsPage({
  searchParams,
}: {
  searchParams: { search?: string; page?: string; status?: string };
}) {
  const page = parseInt(searchParams.page || '1', 10);
  const search = searchParams.search || '';
  const status = searchParams.status === 'active' ? 'active' : undefined;

  // Fetch brands data
  const [brandsResponse, featuredBrandsResponse] = await Promise.all([
    brandsApi.getBrands({
      page,
      limit: 20,
      search: search || undefined,
      status,
    }),
    brandsApi.getFeaturedBrands(),
  ]);

  const brands = brandsResponse.brands;
  const featuredBrands = featuredBrandsResponse.brands;
  const pagination = brandsResponse.pagination;

  // Generate structured data
  const structuredData = generateStructuredData(brands);

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData }}
      />

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              All Brands
            </h1>
            <p className="text-lg text-gray-600">
              Browse our collection of technology brands and discover their products
            </p>

            {/* Search and Filter */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <form className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    name="search"
                    defaultValue={search}
                    placeholder="Search brands..."
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </form>

              <div className="flex gap-2">
                <Link
                  href="/brands"
                  className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                >
                  All
                </Link>
                <Link
                  href="/brands?status=active"
                  className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                >
                  Active
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Brands Section */}
      {featuredBrands.length > 0 && (
        <section className="bg-gray-50 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              <FeaturedBrands />
            </div>
          </div>
        </section>
      )}

      {/* All Brands Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <BrandList initialBrands={brands} showPagination={false} />
          </div>
        </div>
      </section>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="bg-gray-50 py-8 border-t border-gray-200">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto flex justify-center items-center gap-2">
              {page > 1 && (
                <Link
                  href={`/brands?page=${page - 1}${search ? `&search=${encodeURIComponent(search)}` : ''}${status ? `&status=${status}` : ''}`}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Previous
                </Link>
              )}

              {[...Array(pagination.pages)].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <Link
                    key={pageNum}
                    href={`/brands?page=${pageNum}${search ? `&search=${encodeURIComponent(search)}` : ''}${status ? `&status=${status}` : ''}`}
                    className={`w-10 h-10 rounded-md transition-colors ${
                      page === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </Link>
                );
              })}

              {page < pagination.pages && (
                <Link
                  href={`/brands?page=${page + 1}${search ? `&search=${encodeURIComponent(search)}` : ''}${status ? `&status=${status}` : ''}`}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {brands.length === 0 && (
        <div className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto text-center">
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
                No brands found
              </h2>
              <p className="text-gray-600 mb-6">
                {search
                  ? `No brands found matching "${search}"`
                  : 'No brands available at the moment'}
              </p>
              <Link
                href="/brands"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View All Brands
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
