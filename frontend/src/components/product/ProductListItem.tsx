/**
 * ProductListItem Component
 * 
 * A horizontal list item component for displaying products in list view.
 * Features include:
 * - Horizontal layout for list view
 * - Product image on left, details on right
 * - Compact but informative display
 * - Add to cart and compare buttons
 * - Rating and price display
 * - Responsive design
 * 
 * @component
 */

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ProductWithRelations } from '@/types/product';
import { ProductPrice } from './ProductPrice';
import { CompareButton } from './CompareButton';
import { getImageUrl } from '@/lib/api/product-images';

interface ProductListItemProps {
  product: ProductWithRelations;
  onAddToCart?: (productId: string, variantId?: string) => void;
  onToggleWishlist?: (productId: string) => void;
  isWishlisted?: boolean;
  showAddToCart?: boolean;
  showWishlist?: boolean;
  showCompare?: boolean;
  className?: string;
}

/**
 * ProductListItem Component
 * 
 * @param {ProductListItemProps} props - Component props
 * @returns {JSX.Element} Product list item component
 */
export const ProductListItem: React.FC<ProductListItemProps> = ({
  product,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
  showAddToCart = true,
  showWishlist = true,
  showCompare = true,
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  const router = useRouter();

  // Get primary image or fallback
  const primaryImage = product.images?.[0];
  const imageUrl = primaryImage ? getImageUrl(primaryImage, 'medium') : '';
  const imageAlt = primaryImage?.altTextEn || product.name || 'Product image';

  // Calculate discount percentage
  const discountPercentage = product.salePrice && product.regularPrice
    ? Math.round(((product.regularPrice - product.salePrice) / product.regularPrice) * 100)
    : null;

  // Determine stock status
  const isOutOfStock = product.status === 'out_of_stock' || product.stockQuantity === 0;
  const isLowStock = !isOutOfStock && product.stockQuantity <= product.lowStockThreshold;

  // Status badges
  const statusBadges = [];
  if (isOutOfStock) statusBadges.push({ label: 'Out of Stock', color: 'bg-red-500' });
  else if (isLowStock) statusBadges.push({ label: 'Low Stock', color: 'bg-orange-500' });
  if (product.isNewArrival) statusBadges.push({ label: 'New', color: 'bg-green-500' });
  if (product.isFeatured) statusBadges.push({ label: 'Featured', color: 'bg-blue-500' });
  if (product.isBestSeller) statusBadges.push({ label: 'Best Seller', color: 'bg-purple-500' });

  // Handle add to cart
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock && onAddToCart) {
      onAddToCart(product.id);
    }
  };

  // Handle wishlist toggle
  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist(product.id);
    }
  };

  // Handle click navigation
  const handleClick = () => {
    router.push(`/products/${product.slug}`);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={`
        group relative bg-white rounded-lg shadow-sm hover:shadow-lg
        transition-all duration-300 overflow-hidden flex cursor-pointer
        ${isOutOfStock ? 'opacity-75' : ''}
        ${className}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View ${product.name} product details`}
    >
      {/* Product Image */}
      <div className="relative w-48 flex-shrink-0 bg-gray-100">
        {!imageError && imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <svg
              className="w-16 h-16 text-gray-400"
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
        {statusBadges.length > 0 && (
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
            {statusBadges.map((badge, index) => (
              <span
                key={index}
                className={`
                  ${badge.color} text-white text-xs font-semibold px-2 py-1 rounded
                  shadow-sm
                `}
              >
                {badge.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 p-4 flex flex-col">
        <div className="flex-1">
          {/* Brand Name */}
          {product.brand && (
            <p className="text-xs text-gray-500 mb-1">{product.brand.name}</p>
          )}

          {/* Product Name */}
          <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          {product.avgRating !== undefined && product.avgRating > 0 && (
            <div className="flex items-center gap-1 mb-2">
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
              <span className="text-xs text-gray-500">
                ({product._count?.reviews || 0})
              </span>
            </div>
          )}

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {product.shortDescription}
            </p>
          )}

          {/* Price */}
          <ProductPrice
            regularPrice={product.regularPrice}
            salePrice={product.salePrice}
            discountPercentage={discountPercentage}
          />

          {/* Out of Stock Message */}
          {isOutOfStock && (
            <p className="text-sm text-red-500 font-medium mt-2">Out of Stock</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-4">
          {showAddToCart && !isOutOfStock && (
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              aria-label={`Add ${product.name} to cart`}
            >
              Add to Cart
            </button>
          )}

          {showWishlist && (
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
              <svg className="w-5 h-5" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          )}

          {showCompare && (
            <CompareButton product={product} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductListItem;
