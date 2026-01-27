/**
 * Product Detail Page
 * 
 * Server component for individual product details.
 * Features include:
 * - Server-side data fetching for SEO
 * - Structured data (JSON-LD) for products
 * - Breadcrumb navigation
 * - Related products section
 * - SEO metadata with Open Graph tags
 * - Canonical URL
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBySlug, getAll } from '@/lib/api/products';
import { ProductDetail } from '@/components/product/ProductDetail';
import { ProductCard } from '@/components/product/ProductCard';

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const product = await getBySlug(params.slug);

    const title = product.metaTitle || product.name;
    const description = product.metaDescription || product.shortDescription || product.description || '';
    const keywords = product.metaKeywords || `${product.name}, ${product.brand?.name}, ${product.categories?.[0]?.category?.name || ''}, technology, electronics, Bangladesh`;

    return {
      title: `${title} - Smart Technologies Bangladesh`,
      description,
      keywords,
      openGraph: {
        title: `${product.name} - Smart Technologies Bangladesh`,
        description,
        images: product.images?.[0]?.url ? [
          {
            url: product.images[0].url,
            width: 1200,
            height: 630,
            alt: product.name,
          }
        ] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${product.name} - Smart Technologies Bangladesh`,
        description,
        images: product.images?.[0]?.url ? [product.images[0].url] : undefined,
      },
      alternates: {
        canonical: `/products/${product.slug}`,
      },
    };
  } catch (error) {
    return {
      title: 'Product Not Found - Smart Technologies Bangladesh',
    };
  }
}

/**
 * Generate static params for static generation (optional)
 */
export async function generateStaticParams() {
  // In production, you might want to generate static params for popular products
  // For now, we'll return empty array to use dynamic rendering
  return [];
}

/**
 * Product Detail Page Component
 */
export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  let product;
  let relatedProducts = [];

  try {
    // Fetch product by slug
    product = await getBySlug(params.slug);

    // Fetch related products from same category
    if (product.categories && product.categories.length > 0) {
      const relatedData = await getAll({
        category: product.categories[0].categoryId,
        limit: 8,
        status: 'active',
      });
      // Filter out current product
      relatedProducts = relatedData.products.filter(p => p.id !== product.id).slice(0, 4);
    }
  } catch (error) {
    notFound();
  }

  // Generate structured data (JSON-LD)
  const structuredData = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: product.images?.map(img => img.url) || [],
    description: product.description || product.shortDescription || '',
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brand?.name,
    },
    category: product.categories?.[0]?.category?.name,
    offers: {
      '@type': 'Offer',
      price: product.salePrice || product.regularPrice,
      priceCurrency: 'BDT',
      availability: product.status === 'active' && product.stockQuantity > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    aggregateRating: product.avgRating ? {
      '@type': 'AggregateRating',
      ratingValue: product.avgRating,
      reviewCount: product._count?.reviews || 0,
    } : undefined,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Product Detail */}
      <div className="container mx-auto px-4 py-8">
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
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Related Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                  onAddToCart={(productId) => {
                    // TODO: Implement add to cart functionality
                    console.log('Add to cart:', productId);
                  }}
                  onToggleWishlist={(productId) => {
                    // TODO: Implement wishlist functionality
                    console.log('Toggle wishlist:', productId);
                  }}
                  isWishlisted={false}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
