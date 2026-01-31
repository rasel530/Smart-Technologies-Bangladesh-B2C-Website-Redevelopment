/**
 * Product Detail Page Static Params
 * 
 * Server-side static params generation for static rendering.
 * This file must be separate from the page component since static params
 * generation requires server-side execution.
 */

import { getAll } from '@/lib/api/products';

/**
 * Generate static params for static generation (optional)
 * 
 * In production, you might want to generate static params for popular products
 * For now, we'll return empty array to use dynamic rendering
 */
export async function generateStaticParams() {
  try {
    // In production, fetch popular products for static generation
    const result = await getAll({
      status: 'active',
      limit: 100, // Generate static pages for first 100 products
    });

    return result.products.map((product) => ({
      slug: product.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    // Fall back to dynamic rendering if static params generation fails
    return [];
  }
}
