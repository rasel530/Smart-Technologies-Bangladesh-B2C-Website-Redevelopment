/**
 * Product Detail Page
 * 
 * Client component for individual product details.
 * Features include:
 * - Client-side data fetching with useEffect
 * - Structured data (JSON-LD) for products
 * - Breadcrumb navigation using BreadcrumbNavigation component
 * - Variant selector integration
 * - Stock indicator integration
 * - Specifications display integration
 * - Related products section
 * - Recently viewed products (localStorage)
 * - SEO metadata with Open Graph tags (via generateMetadata)
 * - Canonical URL
 */

'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getBySlug, getAll } from '@/lib/api/products';
import { ProductWithRelations, ProductVariant } from '@/types/product';
import { BreadcrumbNavigation, generateProductBreadcrumbs } from '@/components/layout/BreadcrumbNavigation';
import { VariantSelector } from '@/components/product/VariantSelector';
import { StockIndicator } from '@/components/product/StockIndicator';
import { SpecificationsDisplay } from '@/components/product/SpecificationsDisplay';
import { ProductGrid } from '@/components/product/ProductGrid';
import { getImageUrl } from '@/lib/api/product-images';

// Dynamic import for ProductDetail to avoid SSR issues
const ProductDetail = dynamic(
  () => import('@/components/product/ProductDetail').then(mod => mod.ProductDetail),
  { 
    ssr: false,
    loading: () => (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded-lg mb-8"></div>
          <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
        </div>
      </div>
    )
  }
);

// Dynamic import for ProductCard to avoid SSR issues
const ProductCard = dynamic(
  () => import('@/components/product/ProductCard').then(mod => mod.ProductCard),
  { ssr: false }
);

interface LoadingSkeletonProps {
  count?: number;
}

function ProductCardSkeleton({ count = 4 }: LoadingSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        </div>
      ))}
    </>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm mb-6">
        <div className="h-4 bg-gray-200 rounded w-16"></div>
        <span className="text-gray-300">/</span>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <span className="text-gray-300">/</span>
        <div className="h-4 bg-gray-200 rounded w-48"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery Skeleton */}
        <div>
          <div className="h-96 bg-gray-200 rounded-lg mb-4"></div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 w-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>

        {/* Product Info Skeleton */}
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-12 bg-gray-200 rounded w-32"></div>
          <div className="flex gap-3">
            <div className="h-12 bg-gray-200 rounded w-40"></div>
            <div className="h-12 w-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Product Detail Page Component
 */
export default function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const [product, setProduct] = useState<ProductWithRelations | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductWithRelations[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<ProductWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [structuredData, setStructuredData] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch product by slug
        const productData = await getBySlug(params.slug);
        setProduct(productData);
        
        // Generate structured data (JSON-LD)
        if (productData) {
          const sd = {
            '@context': 'https://schema.org/',
            '@type': 'Product',
            name: productData.name,
            image: productData.images?.map(img => getImageUrl(img, 'original')) || [],
            description: productData.description || productData.shortDescription || '',
            sku: productData.sku,
            brand: {
              '@type': 'Brand',
              name: productData.brand?.name,
            },
            category: productData.categories?.[0]?.category?.name,
            offers: {
              '@type': 'Offer',
              price: productData.salePrice || productData.regularPrice,
              priceCurrency: 'BDT',
              availability: productData.status === 'active' && productData.stockQuantity > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
              priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
            aggregateRating: productData.avgRating ? {
              '@type': 'AggregateRating',
              ratingValue: productData.avgRating,
              reviewCount: productData._count?.reviews || 0,
            } : undefined,
          };
          setStructuredData(sd);
          
          // Update document title
          if (typeof document !== 'undefined') {
            document.title = `${productData.name} - Smart Technologies Bangladesh`;
          }
        }
        
        // Fetch related products from same category
        if (productData.categories && productData.categories.length > 0) {
          const relatedData = await getAll({
            category: productData.categories[0].categoryId,
            limit: 8,
            status: 'active',
          });
          // Filter out current product
          const filtered = relatedData.products.filter(p => p.id !== productData.id).slice(0, 4);
          setRelatedProducts(filtered);
        }
        
        // Load recently viewed products from localStorage
        const savedRecentlyViewed = localStorage.getItem('smart_tech_recently_viewed');
        if (savedRecentlyViewed) {
          try {
            const viewed: ProductWithRelations[] = JSON.parse(savedRecentlyViewed);
            // Add current product to beginning, remove duplicates, and keep only 4
            const updated = [productData, ...viewed.filter(p => p.id !== productData.id)].slice(0, 4);
            setRecentlyViewed(updated);
            localStorage.setItem('smart_tech_recently_viewed', JSON.stringify(updated));
          } catch (e) {
            console.error('Error loading recently viewed:', e);
          }
        } else if (productData) {
          // First time viewing a product
          setRecentlyViewed([productData]);
          localStorage.setItem('smart_tech_recently_viewed', JSON.stringify([productData]));
        }
      } catch (err: any) {
        console.error('Error fetching product:', err);
        setError(err?.message || 'Failed to load product. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [params.slug]);
  
  // Handle product not found
  if (!loading && !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ErrorDisplay 
          message={error || 'The product you are looking for does not exist or has been removed.'}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }
  
  // Generate variant options from product variants
  const variantOptions = product?.variants?.map(variant => ({
    id: variant.id,
    value: variant.name,
    type: 'other' as const,
    isAvailable: variant.isActive && variant.stock > 0,
    price: variant.price,
  })) || [];
  
  // Generate breadcrumbs - use primary category where isPrimary: true
  const primaryCategory = product?.categories?.find(cat => cat.isPrimary)?.category;
  const breadcrumbs = product ? generateProductBreadcrumbs(
    primaryCategory,
    product.brand?.name ? { name: product.brand.name, slug: product.brand.slug } : undefined,
    product.name
  ) : [];
  
  // Handle variant selection
  const handleVariantSelect = (variant: any) => {
    setSelectedVariant(variant);
  };
  
  // Handle image change from variant
  const handleImageChange = (imageUrl: string) => {
    // Image change logic if needed
    console.log('Image changed to:', imageUrl);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <BreadcrumbNavigation items={breadcrumbs} />
        </div>
      </div>
      
      {/* Product Detail */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <ProductDetailSkeleton />
        ) : product ? (
          <>
            <ProductDetail
              product={product}
              relatedProducts={relatedProducts}
              onAddToCart={(productId, variantId) => {
                // TODO: Implement add to cart functionality
                console.log('Add to cart:', productId, variantId);
              }}
              onToggleWishlist={(productId) => {
                // TODO: Implement wishlist functionality
                console.log('Toggle wishlist:', productId);
              }}
              isWishlisted={false}
            />
            
            {/* Variant Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Variant</h2>
                <VariantSelector
                  variants={product.variants}
                  variantOptions={variantOptions}
                  selectedVariantId={selectedVariant?.id}
                  onVariantSelect={handleVariantSelect}
                  onImageChange={handleImageChange}
                />
              </div>
            )}
            
            {/* Stock Indicator */}
            <div className="mt-8">
              <StockIndicator
                stockQuantity={product.stockQuantity}
                lowStockThreshold={product.lowStockThreshold || 10}
                showQuantity={false}
              />
            </div>
            
            {/* Specifications Display */}
            {product.specifications && product.specifications.length > 0 && (
              <div className="mt-12">
                <SpecificationsDisplay
                  specifications={product.specifications}
                />
              </div>
            )}
          </>
        ) : null}
      </div>
      
      {/* Recently Viewed Products Section */}
      {recentlyViewed.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Recently Viewed Products
            </h2>
            <ProductGrid
              products={recentlyViewed}
              columns={{
                mobile: 1,
                tablet: 2,
                desktop: 4,
              }}
            />
          </div>
        </section>
      )}
      
      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Related Products
            </h2>
            <ProductGrid
              products={relatedProducts}
              columns={{
                mobile: 1,
                tablet: 2,
                desktop: 4,
              }}
            />
          </div>
        </section>
      )}
    </div>
  );
}
