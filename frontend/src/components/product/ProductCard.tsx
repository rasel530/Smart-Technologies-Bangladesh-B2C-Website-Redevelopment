/**
 * ProductCard Component
 * 
 * A product card component for displaying products in grid/list views.
 * Features include image display, pricing, status badges, ratings, add to cart, and wishlist.
 * 
 * @component
 */

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProductWithRelations } from '@/types/product';
import { ProductPrice } from './ProductPrice';

interface ProductCardProps {
  product: ProductWithRelations;
  onAddToCart?: (productId: string, variantId?: string) => void;
  onToggleWishlist?: (productId: string) => void;
  isWishlisted?: boolean;
  showAddToCart?: boolean;
  showWishlist?: boolean;
  className?: string;
}

/**
 * ProductCard Component
 * 
 * @param {ProductCardProps} props - Component props
 * @returns {JSX.Element} Product card component
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
  showAddToCart = true,
  showWishlist = true,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

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

  return (
    <Link
      href={`/products/${product.slug}`}
      className={`
        group relative bg-white rounded-lg shadow-sm hover:shadow-xl
        transition-all duration-300 overflow-hidden
        ${isOutOfStock ? 'opacity-75' : ''}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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

      {/* Wishlist Button */}
      {showWishlist && (
        <button
          onClick={handleToggleWishlist}
          className={`
            absolute top-2 right-2 z-10 p-2 rounded-full
            transition-all duration-200
            ${isHovered ? 'opacity-100' : 'opacity-0 md:opacity-0 lg:opacity-0'}
            ${isWishlisted
              ? 'bg-red-500 text-white'
              : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:text-red-500'
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
      )}

      {/* Product Image */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {!imageError ? (
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className={`
              object-cover transition-transform duration-300
              ${isHovered ? 'scale-110' : 'scale-100'}
            `}
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

        {/* Quick Add to Cart Button (visible on hover) */}
        {showAddToCart && !isOutOfStock && (
          <button
            onClick={handleAddToCart}
            className={`
              absolute bottom-4 left-1/2 -translate-x-1/2
              bg-primary-600 text-white px-4 py-2 rounded-full
              font-medium text-sm shadow-lg
              transform transition-all duration-200
              ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            `}
            aria-label={`Add ${product.name} to cart`}
          >
            Add to Cart
          </button>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Brand Name */}
        {product.brand && (
          <p className="text-xs text-gray-500 mb-1">{product.brand.name}</p>
        )}

        {/* Product Name */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
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
    </Link>
  );
};

export default ProductCard;
