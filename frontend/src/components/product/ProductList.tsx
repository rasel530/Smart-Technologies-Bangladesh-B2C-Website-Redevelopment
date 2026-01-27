/**
 * ProductList Component
 * 
 * A list layout component for displaying products with detailed information.
 * Features include loading states, empty states, and pagination controls.
 * 
 * @component
 */

'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProductWithRelations, SearchResult } from '@/types/product';
import { ProductPrice } from './ProductPrice';
import { Pagination } from './Pagination';

interface ProductListProps {
  products: ProductWithRelations[];
  loading?: boolean;
  error?: string | null;
  pagination?: SearchResult['pagination'];
  onPageChange?: (page: number) => void;
  onAddToCart?: (productId: string, variantId?: string) => void;
  onToggleWishlist?: (productId: string) => void;
  wishlistedProducts?: Set<string>;
  className?: string;
}

/**
 * Loading Skeleton Component
 */
const ProductListSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden flex">
    <div className="w-32 h-32 sm:w-48 sm:h-48 bg-gray-200 animate-pulse flex-shrink-0" />
    <div className="p-4 flex-1 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
      <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
      <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
      <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
      <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
    </div>
  </div>
);

/**
 * Empty State Component
 */
const EmptyState: React.FC<{ message?: string }> = ({ message = 'No products found' }) => (
  <div className="py-16 text-center">
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
  <div className="py-16 text-center">
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
 * ProductListItem Component
 */
interface ProductListItemProps {
  product: ProductWithRelations;
  onAddToCart?: (productId: string, variantId?: string) => void;
  onToggleWishlist?: (productId: string) => void;
  isWishlisted?: boolean;
}

const ProductListItem: React.FC<ProductListItemProps> = ({
  product,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false
}) => {
  const [imageError, setImageError] = React.useState(false);

  // Get primary image or fallback
  const primaryImage = product.images?.[0];
  const imageUrl = primaryImage?.url || '/images/placeholder-product.png';
  const imageAlt = primaryImage?.alt || product.name || 'Product image';

  // Calculate discount percentage
  const discountPercentage = product.salePrice && product.regularPrice
    ? Math.round(((product.regularPrice - product.salePrice) / product.regularPrice) * 100)
    : null;

  // Determine stock status
  const isOutOfStock = product.status === 'out_of_stock' || product.stockQuantity === 0;
  const isLowStock = !isOutOfStock && product.stockQuantity <= product.lowStockThreshold;

  // Handle add to cart
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isOutOfStock && onAddToCart) {
      onAddToCart(product.id);
    }
  };

  // Handle wishlist toggle
  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onToggleWishlist) {
      onToggleWishlist(product.id);
    }
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col sm:flex-row"
    >
      {/* Product Image */}
      <div className="relative w-full sm:w-32 sm:h-32 md:w-48 md:h-48 bg-gray-100 flex-shrink-0">
        {!imageError ? (
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Status Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isOutOfStock && (
            <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
              Out of Stock
            </span>
          )}
          {isLowStock && !isOutOfStock && (
            <span className="bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded">
              Low Stock
            </span>
          )}
          {product.isNewArrival && (
            <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded">
              New
            </span>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex-1">
          {/* Brand Name */}
          {product.brand && (
            <p className="text-xs text-gray-500 mb-1">{product.brand.name}</p>
          )}

          {/* Product Name */}
          <h3 className="font-semibold text-gray-900 text-lg mb-2 hover:text-primary-600 transition-colors">
            {product.name}
          </h3>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {product.shortDescription}
            </p>
          )}

          {/* Rating */}
          {product.avgRating !== undefined && product.avgRating > 0 && (
            <div className="flex items-center gap-1 mb-3">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`
                      w-4 h-4
                      ${i < Math.floor(product.avgRating!) ? 'text-yellow-400' : 'text-gray-300'}
                    `}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-500">
                ({product._count?.reviews || 0} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <ProductPrice
            regularPrice={product.regularPrice}
            salePrice={product.salePrice}
            discountPercentage={discountPercentage}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
          {/* Add to Cart Button */}
          {!isOutOfStock && (
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
              aria-label={`Add ${product.name} to cart`}
            >
              Add to Cart
            </button>
          )}

          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            className={`
              p-2 rounded-lg border transition-colors
              ${isWishlisted
                ? 'border-red-200 bg-red-50 text-red-500'
                : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500'
              }
            `}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <svg
              className="w-5 h-5"
              fill={isWishlisted ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
};

/**
 * ProductList Component
 * 
 * @param {ProductListProps} props - Component props
 * @returns {JSX.Element} Product list component
 */
export const ProductList: React.FC<ProductListProps> = ({
  products,
  loading = false,
  error = null,
  pagination,
  onPageChange,
  onAddToCart,
  onToggleWishlist,
  wishlistedProducts = new Set(),
  className = ''
}) => {
  // Show loading skeleton
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(5)].map((_, index) => (
          <ProductListSkeleton key={index} />
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
      {/* Product List */}
      <div className="space-y-4">
        {products.map((product) => (
          <ProductListItem
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

export default ProductList;
