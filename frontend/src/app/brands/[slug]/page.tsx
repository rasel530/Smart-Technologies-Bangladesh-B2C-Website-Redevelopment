import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBrandBySlugServer, getBrandProductsServer } from '@/lib/api/server';
import BrandDetail from '@/components/brand/BrandDetail';
import { ProductGrid } from '@/components/product/ProductGrid';
import { getImageUrl } from '@/lib/api/product-images';
import { BreadcrumbNavigation, generateBrandBreadcrumbs } from '@/components/layout/BreadcrumbNavigation';

interface PageProps {
  params: {
    slug: string;
  };
  searchParams: {
    page?: string;
    sortBy?: string;
    sortOrder?: string;
  };
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const brand = await getBrandBySlugServer(params.slug);

    if (!brand) {
      return {
        title: 'Brand Not Found | Smart Tech',
        description: 'The requested brand could not be found.',
      };
    }

    return {
      title: brand.metaTitle || `${brand.name} | Smart Tech`,
      description: brand.metaDescription || brand.description || `Browse ${brand.name} products at Smart Tech`,
      keywords: brand.metaKeywords || `${brand.name}, products, Smart Tech`,
      openGraph: {
        title: brand.metaTitle || brand.name,
        description: (brand.metaDescription || brand.description) ?? undefined,
        images: brand.logoUrl ? [brand.logoUrl] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: brand.metaTitle || brand.name,
        description: (brand.metaDescription || brand.description) ?? undefined,
        images: brand.logoUrl ? [brand.logoUrl] : [],
      },
    };
  } catch (error) {
    console.error('Error generating brand metadata:', error);
    return {
      title: 'Brand | Smart Tech',
      description: 'Browse brand products at Smart Tech',
    };
  }
}

/**
 * Generate structured data (JSON-LD) for SEO
 */
function generateStructuredData(brand: any, products: any[]) {
  if (!brand || !brand.name) {
    return null;
  }

  const brandSchema = {
    '@context': 'https://schema.org',
    '@type': 'Brand',
    name: brand.name,
    description: brand.description,
    url: `https://smarttech.com/brands/${brand.slug}`,
    logo: brand.logoUrl,
  };

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: (products || []).map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: product.name,
      url: `https://smarttech.com/products/${product.slug}`,
      image: product.images?.[0] ? getImageUrl(product.images[0], 'medium') : undefined,
    })),
  };

  return JSON.stringify([brandSchema, itemList]);
}

/**
 * Public Brand Detail Page
 *
 * Public brand detail page with:
 * - BrandDetail component integration
 * - Server-side rendering for SEO
 * - Product listing
 * - Structured data (JSON-LD)
 * - Breadcrumb navigation
 */
export default async function BrandDetailPage({ params, searchParams }: PageProps) {
  let brand: any = null;

  try {
    // Await params in Next.js 15+
    const resolvedParams = await params;
    brand = await getBrandBySlugServer(resolvedParams.slug);
  } catch (error) {
    console.error('Error fetching brand:', error);
    // Return 404 if brand not found or API error
    notFound();
  }

  // If brand is null/undefined after try-catch, show 404
  if (!brand) {
    notFound();
  }

  // Defensive check for brand properties
  if (!brand.name || !brand.slug) {
    console.error('Invalid brand data:', brand);
    notFound();
  }

  const page = parseInt(searchParams.page || '1', 10);
  const sortBy = (searchParams.sortBy as 'price' | 'name' | 'createdAt') || 'createdAt';
  const sortOrder = (searchParams.sortOrder as 'asc' | 'desc') || 'desc';

  // Fetch products using the brand ID
  const productsData = await getBrandProductsServer(brand.id, {
    page,
    limit: 20,
    sortBy,
    sortOrder,
  });

  const products = productsData.products;
  const pagination = productsData.pagination;

  // Generate structured data
  const structuredData = generateStructuredData(brand, products);

  // Generate breadcrumbs with defensive check
  const breadcrumbs = generateBrandBreadcrumbs(
    brand.name || 'Unknown Brand',
    brand.slug || 'unknown-brand'
  );

  return (
    <>
      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: structuredData }}
        />
      )}

      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <BreadcrumbNavigation items={breadcrumbs} />
        </div>
      </div>

      {/* Brand Detail Component */}
      <BrandDetail brand={brand} />

      {/* Products Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                {brand.name} Products
              </h2>
              <Link
                href={`/brands/${brand.slug}`}
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
              >
                View Brand Details
                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Sort Options */}
            <div className="mb-6 flex flex-wrap gap-2">
              <Link
                href={`/brands/${brand.slug}?sortBy=createdAt&sortOrder=desc`}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  sortBy === 'createdAt' && sortOrder === 'desc'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Newest
              </Link>
              <Link
                href={`/brands/${brand.slug}?sortBy=price&sortOrder=asc`}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  sortBy === 'price' && sortOrder === 'asc'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Price: Low to High
              </Link>
              <Link
                href={`/brands/${brand.slug}?sortBy=price&sortOrder=desc`}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  sortBy === 'price' && sortOrder === 'desc'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Price: High to Low
              </Link>
              <Link
                href={`/brands/${brand.slug}?sortBy=name&sortOrder=asc`}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  sortBy === 'name' && sortOrder === 'asc'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Name: A to Z
              </Link>
            </div>

            {/* Products Grid */}
            {products.length > 0 ? (
              <>
                <ProductGrid
                  products={products}
                  
                  
                  
                  columns={{
                    mobile: 1,
                    tablet: 2,
                    desktop: 4,
                  }}
                />

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="mt-8 flex justify-center items-center gap-2">
                    {page > 1 && (
                      <Link
                        href={`/brands/${brand.slug}?page=${page - 1}&sortBy=${sortBy}&sortOrder=${sortOrder}`}
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
                          href={`/brands/${brand.slug}?page=${pageNum}&sortBy=${sortBy}&sortOrder=${sortOrder}`}
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
                        href={`/brands/${brand.slug}?page=${page + 1}&sortBy=${sortBy}&sortOrder=${sortOrder}`}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Next
                      </Link>
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
                  {brand.name} doesn't have any products at the moment.
                </p>
                <Link
                  href="/brands"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-6"
                >
                  Browse All Brands
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
