/**
 * ProductGrid Component
 * 
 * A responsive grid layout component for displaying products.
 * Features include loading states, empty states, and pagination controls.
 * 
 * @component
 */

'use client';

import React from 'react';
import { ProductWithRelations, SearchResult } from '@/types/product';
import { ProductCard } from './ProductCard';
import { Pagination } from './Pagination';

interface ProductGridProps {
  products: ProductWithRelations[];
  loading?: boolean;
  error?: string | null;
  pagination?: SearchResult['pagination'];
  onPageChange?: (page: number) => void;
  onAddToCart?: (productId: string, variantId?: string) => void;
  onToggleWishlist?: (productId: string) => void;
  wishlistedProducts?: Set<string>;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  className?: string;
}

/**
 * Loading Skeleton Component
 */
const ProductSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
    <div className="aspect-square bg-gray-200 animate-pulse" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
      <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
    </div>
  </div>
);

/**
 * Empty State Component
 */
const EmptyState: React.FC<{ message?: string }> = ({ message = 'No products found' }) => (
  <div className="col-span-full py-16 text-center">
    <svg
      className="mx-auto h-16 w-16 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
    <h3 className="mt-4 text-lg font-medium text-gray-900">{message}</h3>
    <p className="mt-2 text-sm text-gray-500">
      Try adjusting your filters or search terms.
    </p>
  </div>
);

/**
 * Error State Component
 */
const ErrorState: React.FC<{ error: string }> = ({ error }) => (
  <div className="col-span-full py-16 text-center">
    <svg
      className="mx-auto h-16 w-16 text-red-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
    <h3 className="mt-4 text-lg font-medium text-gray-900">Error Loading Products</h3>
    <p className="mt-2 text-sm text-gray-500">{error}</p>
  </div>
);

/**
 * ProductGrid Component
 * 
 * @param {ProductGridProps} props - Component props
 * @returns {JSX.Element} Product grid component
 */
export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading = false,
  error = null,
  pagination,
  onPageChange,
  onAddToCart,
  onToggleWishlist,
  wishlistedProducts = new Set(),
  columns = {
    mobile: 1,
    tablet: 2,
    desktop: 3
  },
  className = ''
}) => {
  // Grid columns based on breakpoints
  const gridClasses = `
    grid grid-cols-${columns.mobile}
    sm:grid-cols-${columns.tablet}
    lg:grid-cols-${columns.desktop}
    xl:grid-cols-${columns.desktop + 1}
    gap-6
  `;

  // Show loading skeleton
  if (loading) {
    return (
      <div className={`${gridClasses} ${className}`}>
        {[...Array(8)].map((_, index) => (
          <ProductSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Show error state
  if (error) {
    return <ErrorState error={error} />;
  }

  // Show empty state
  if (products.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Product Grid */}
      <div className={gridClasses}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onToggleWishlist={onToggleWishlist}
            isWishlisted={wishlistedProducts.has(product.id)}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
          />
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
