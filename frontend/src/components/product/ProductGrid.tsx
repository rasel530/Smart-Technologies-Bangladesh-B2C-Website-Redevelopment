'use client';

/**
 * Product Grid Component
 *
 * Client component for displaying products in a responsive grid layout.
 * Features include:
 * - Responsive grid layout (1 col mobile, 2 cols sm, 3 cols md, 4 cols lg, 5 cols xl)
 * - Wishlist integration
 * - Product card rendering
 * - Loading state
 * - View mode support (grid/list)
 */

import { ProductWithRelations } from '@/types/product';
import { ProductCard } from '@/components/product/ProductCard';

interface ProductGridProps {
  products: ProductWithRelations[];
  wishlistedProducts?: Set<string>;
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  loading?: boolean;
  viewMode?: 'grid' | 'list';
}

/**
 * Product Grid Component
 * Displays products in a responsive grid with configurable columns.
 * Note: The 'columns' prop is deprecated - responsive grid is now handled via Tailwind classes.
 * Responsive breakpoints: 1 col (mobile), 2 cols (sm), 3 cols (md), 4 cols (lg), 5 cols (xl)
 */
export function ProductGrid({
  products,
  wishlistedProducts = new Set(),
  columns = {
    mobile: 1,
    tablet: 2,
    desktop: 5,
  },
  loading = false,
  viewMode = 'grid',
}: ProductGridProps) {
  // Show loading skeleton
  if (loading) {
    if (viewMode === 'list') {
      return (
        <div className="flex flex-col gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4 flex gap-4">
              <div className="w-48 h-32 bg-gray-200 rounded animate-pulse flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-4">
            <div className="h-48 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No products found</p>
      </div>
    );
  }

  // List view: single column with full-width cards
  if (viewMode === 'list') {
    return (
      <div className="flex flex-col gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isWishlisted={wishlistedProducts.has(product.id)}
            viewMode="list"
          />
        ))}
      </div>
    );
  }

  // Grid view: responsive multi-column layout
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isWishlisted={wishlistedProducts.has(product.id)}
          viewMode="grid"
        />
      ))}
    </div>
  );
}
