import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBrandBySlugServer, getBrandProductsServer } from '@/lib/api/server';
import BrandDetail from '@/components/brand/BrandDetail';
import { getImageUrl } from '@/lib/api/product-images';
import { BreadcrumbNavigation } from '@/components/layout/BreadcrumbNavigation';
import { generateBrandBreadcrumbs } from '@/lib/utils/breadcrumbs';
import { BrandPageClient } from './BrandPageClient';

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
 * Error Component for Brand Page
 * Displays user-friendly error messages when brand data cannot be loaded
 */
function BrandErrorFallback({ slug, errorType, errorMessage }: { slug: string; errorType: string; errorMessage?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-red-500 mb-4">
          <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Brand</h1>
        <p className="text-gray-600 mb-4">
          {errorType === 'NOT_FOUND' && `The brand "${slug}" was not found in our database.`}
          {errorType === 'API_ERROR' && `There was an error connecting to our servers while loading brand "${slug}".`}
          {errorType === 'NETWORK_ERROR' && `Network error occurred while loading brand "${slug}". Please check your connection.`}
          {errorType === 'INVALID_DATA' && `Invalid brand data received for "${slug}".`}
          {errorType === 'UNKNOWN' && `An unexpected error occurred while loading brand "${slug}".`}
        </p>
        {errorMessage && (
          <div className="bg-gray-100 rounded p-3 mb-4 text-left">
            <p className="text-xs text-gray-500 font-semibold mb-1">Error Details:</p>
            <p className="text-sm text-gray-700 font-mono">{errorMessage}</p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/brands"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Browse All Brands
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Home
          </Link>
        </div>
        <p className="mt-4 text-xs text-gray-400">
          Requested brand: <span className="font-mono">{slug}</span>
        </p>
      </div>
    </div>
  );
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
 * - Comprehensive error handling with detailed logging
 */
export default async function BrandDetailPage({ params, searchParams }: PageProps) {
  console.log('[BrandPage] Starting brand page render');
  
  let brand: any = null;
  let brandSlug: string = '';
  let errorType: string = 'UNKNOWN';
  let errorMessage: string | undefined = undefined;

  try {
    // Await params in Next.js 15+
    console.log('[BrandPage] Resolving params...');
    const resolvedParams = await params;
    brandSlug = resolvedParams.slug;
    console.log(`[BrandPage] Fetching brand with slug: "${brandSlug}"`);
    
    brand = await getBrandBySlugServer(brandSlug);
    console.log('[BrandPage] Brand data received:', brand ? 'SUCCESS' : 'NULL');
    
    // If brand is null/undefined after API call
    if (!brand) {
      console.error(`[BrandPage] Brand not found in database: "${brandSlug}"`);
      errorType = 'NOT_FOUND';
      errorMessage = `Brand with slug "${brandSlug}" does not exist in the database`;
      return <BrandErrorFallback slug={brandSlug} errorType={errorType} errorMessage={errorMessage} />;
    }

    // Defensive check for brand properties
    if (!brand.name || !brand.slug) {
      console.error('[BrandPage] Invalid brand data structure:', JSON.stringify(brand, null, 2));
      errorType = 'INVALID_DATA';
      errorMessage = `Brand data is missing required fields (name or slug). Received: ${JSON.stringify(brand)}`;
      return <BrandErrorFallback slug={brandSlug} errorType={errorType} errorMessage={errorMessage} />;
    }

    console.log(`[BrandPage] Brand loaded successfully: ${brand.name} (ID: ${brand.id})`);

    const page = parseInt(searchParams.page || '1', 10);
    const sortBy = (searchParams.sortBy as 'price' | 'name' | 'createdAt') || 'createdAt';
    const sortOrder = (searchParams.sortOrder as 'asc' | 'desc') || 'desc';

    console.log(`[BrandPage] Fetching products for brand ${brand.id}, page ${page}, sort by ${sortBy} ${sortOrder}`);

    // Fetch products using the brand ID with error handling
    let productsData;
    try {
      productsData = await getBrandProductsServer(brand.id, {
        page,
        limit: 20,
        sortBy,
        sortOrder,
      });
      console.log(`[BrandPage] Products fetched: ${productsData?.products?.length || 0} products`);
    } catch (productsError) {
      console.error('[BrandPage] Error fetching brand products:', productsError);
      errorType = 'API_ERROR';
      errorMessage = `Failed to fetch products for brand "${brand.name}": ${productsError instanceof Error ? productsError.message : String(productsError)}`;
      return <BrandErrorFallback slug={brandSlug} errorType={errorType} errorMessage={errorMessage} />;
    }

    const products = productsData?.products || [];
    const pagination = productsData?.pagination || { page, totalPages: 1, totalItems: 0 };

    // Generate structured data
    const structuredData = generateStructuredData(brand, products);

    const breadcrumbs = generateBrandBreadcrumbs(
      brand.name || 'Unknown Brand',
      brand.slug || 'unknown-brand'
    );

    console.log('[BrandPage] Rendering brand page successfully');

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
        <BrandPageClient
          brandId={brand.id}
          initialProducts={products}
          initialPagination={pagination}
          initialPage={page}
          initialSortBy={sortBy}
          initialSortOrder={sortOrder}
        />
      </>
    );
  } catch (error) {
    console.error('[BrandPage] Unexpected error in brand page:', error);
    
    // Determine error type based on error properties
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        errorType = 'NETWORK_ERROR';
      } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        errorType = 'API_ERROR';
        errorMessage = `Backend API is not accessible. Error: ${error.message}`;
      } else {
        errorMessage = error.message;
      }
    } else {
      errorMessage = String(error);
    }

    console.error(`[BrandPage] Error type: ${errorType}, Message: ${errorMessage}`);
    console.error('[BrandPage] Full error object:', JSON.stringify(error, null, 2));

    return <BrandErrorFallback slug={brandSlug || 'unknown'} errorType={errorType} errorMessage={errorMessage} />;
  }
}
