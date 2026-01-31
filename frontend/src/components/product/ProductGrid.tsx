'use client';

/**
 * Product Grid Component
 * 
 * Client component for displaying products in a responsive grid layout.
 * Features include:
 * - Responsive grid layout
 * - Configurable columns for different screen sizes
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
 * Displays products in a responsive grid with configurable columns
 */
export function ProductGrid({
  products,
  wishlistedProducts = new Set(),
  columns = {
    mobile: 1,
    tablet: 2,
    desktop: 4,
  },
  loading = false,
  viewMode = 'grid',
}: ProductGridProps) {
  // Show loading skeleton
  if (loading) {
    return (
      <div
        className="grid gap-6"
        style={{
          gridTemplateColumns: `repeat(${columns.mobile}, 1fr)`,
        }}
      >
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-4">
            <div className="h-48 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          </div>
        ))}
        <style jsx>{`
          @media (min-width: 640px) {
            div {
              grid-template-columns: repeat(${columns.tablet}, 1fr) !important;
            }
          }
          @media (min-width: 1024px) {
            div {
              grid-template-columns: repeat(${columns.desktop}, 1fr) !important;
            }
          }
        `}</style>
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

  return (
    <div
      className="grid gap-6"
      style={{
        gridTemplateColumns: `repeat(${columns.mobile}, 1fr)`,
      }}
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isWishlisted={wishlistedProducts.has(product.id)}
        />
      ))}
      <style jsx>{`
        @media (min-width: 640px) {
          div {
            grid-template-columns: repeat(${columns.tablet}, 1fr) !important;
          }
        }
        @media (min-width: 1024px) {
          div {
            grid-template-columns: repeat(${columns.desktop}, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
