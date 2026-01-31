/**
 * Product Detail Page Metadata
 * 
 * Server-side metadata generation for SEO.
 * This file must be separate from the page component since metadata
 * generation requires server-side execution.
 */

import { Metadata } from 'next';
import { getBySlug } from '@/lib/api/products';

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

    if (!product) {
      return {
        title: 'Product Not Found - Smart Technologies Bangladesh',
      };
    }

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
        images: product.images?.[0]?.originalUrl ? [
          {
            url: product.images[0].originalUrl,
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
        images: product.images?.[0]?.originalUrl ? [product.images[0].originalUrl] : undefined,
      },
      alternates: {
        canonical: `/products/${product.slug}`,
      },
    };
  } catch (error) {
    console.error('Error generating product metadata:', error);
    return {
      title: 'Product Not Found - Smart Technologies Bangladesh',
    };
  }
}
