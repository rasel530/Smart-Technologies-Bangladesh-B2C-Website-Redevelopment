/**
 * Product Comparison Card Component
 *
 * Card component for displaying a product in comparison view.
 * Shows product image, name, price, quick specs, and action buttons.
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { X, Eye, ShoppingCart, Heart } from 'lucide-react';
import { ProductWithRelations } from '@/types/product';
import { getImageUrl } from '@/lib/api/product-images';

interface ProductComparisonCardProps {
  product: ProductWithRelations;
  onRemove?: () => void;
  showRemove?: boolean;
  highlightBest?: boolean;
  isCheapest?: boolean;
  isMostExpensive?: boolean;
  className?: string;
}

export function ProductComparisonCard({
  product,
  onRemove,
  showRemove = true,
  highlightBest = false,
  isCheapest = false,
  isMostExpensive = false,
  className = '',
}: ProductComparisonCardProps) {
  // Get first 3 key specifications
  const quickSpecs = product.specifications.slice(0, 3);

  // Calculate final price
  const finalPrice = product.salePrice || product.regularPrice;
  const hasDiscount = product.salePrice && product.salePrice < product.regularPrice;
  const discountPercentage = hasDiscount
    ? Math.round(((product.regularPrice - product.salePrice) / product.regularPrice) * 100)
    : 0;

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border-2 transition-all ${
        highlightBest
          ? 'border-green-500 ring-2 ring-green-200'
          : 'border-gray-200 hover:border-blue-300'
      } ${className}`}
      role="article"
      aria-label={`Product: ${product.name}`}
    >
      {/* Best Value Badge */}
      {highlightBest && (
        <div className="absolute top-2 right-2 z-10">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Best Value
          </span>
        </div>
      )}

      {/* Remove Button */}
      {showRemove && onRemove && (
        <button
          onClick={onRemove}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onRemove();
            }
          }}
          className="absolute top-2 left-2 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-red-50 hover:text-red-600 transition-colors"
          aria-label={`Remove ${product.name} from comparison`}
          tabIndex={0}
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden rounded-t-xl bg-gray-100">
        {product.images && product.images.length > 0 ? (
          <Link href={`/products/${product.slug}`}>
            <Image
              src={getImageUrl(product.images[0], 'medium')}
              alt={product.name}
              fill
              unoptimized={true}
              className="object-cover hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </Link>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Price Badges */}
        {isCheapest && (
          <div className="absolute bottom-2 left-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded">
              Lowest Price
            </span>
          </div>
        )}
        {isMostExpensive && (
          <div className="absolute bottom-2 left-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded">
              Highest Price
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Brand */}
        <p className="text-xs font-medium text-gray-500 mb-1">{product.brand.name}</p>

        {/* Product Name */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-base font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors mb-2">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-gray-900">
              ৳{finalPrice.toLocaleString()}
            </span>
            {hasDiscount && (
              <>
                <span className="text-sm text-gray-500 line-through">
                  ৳{product.regularPrice.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                  -{discountPercentage}%
                </span>
              </>
            )}
          </div>
        </div>

        {/* Quick Specs */}
        {quickSpecs.length > 0 && (
          <div className="space-y-1.5 mb-4">
            {quickSpecs.map((spec) => (
              <div key={spec.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{spec.name}:</span>
                <span className="font-medium text-gray-900 text-right">{spec.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link
            href={`/products/${product.slug}`}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            aria-label={`View details for ${product.name}`}
            tabIndex={0}
          >
            <Eye className="w-4 h-4" />
            <span className="text-sm">View Details</span>
          </Link>
          <button
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            aria-label={`Add ${product.name} to cart`}
            tabIndex={0}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="text-sm">Add to Cart</span>
          </button>
        </div>

        {/* Wishlist Button */}
        <button
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
            }
          }}
          className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          aria-label={`Add ${product.name} to wishlist`}
          tabIndex={0}
        >
          <Heart className="w-4 h-4" />
          Add to Wishlist
        </button>
      </div>
    </div>
  );
}

export default ProductComparisonCard;
