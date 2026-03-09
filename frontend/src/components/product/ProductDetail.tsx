/**
 * ProductDetail Component
 * 
 * A comprehensive product detail component with image gallery, specifications,
 * variants, reviews, and related products.
 * 
 * @component
 */

'use client';

import React, { useState, useContext, useEffect } from 'react';
import Link from 'next/link';
import { ProductWithRelations, ProductStatus, ProductVisibility } from '@/types/product';
import { getImageUrl } from '@/lib/utils/image';
import { ProductImageGallery } from './ProductImageGallery';
import { ProductSpecifications } from './ProductSpecifications';
import { ProductVariants } from './ProductVariants';
import { ProductPrice } from './ProductPrice';
import { ProductCard } from './ProductCard';
import { CrossSellProducts } from './CrossSellProducts';
import { UpSellProducts } from './UpSellProducts';
import { RelatedProducts } from './RelatedProducts';
import { CompareButton } from './CompareButton';
import CompareContext from './CompareContext';

interface ProductDetailProps {
  product: ProductWithRelations;
  onAddToCart?: (productId: string, variantId?: string) => void;
  onToggleWishlist?: (productId: string) => void;
  isWishlisted?: boolean;
  relatedProducts?: ProductWithRelations[];
  className?: string;
}

/**
 * Breadcrumb Component
 */
interface BreadcrumbProps {
  category?: { name: string; slug: string };
  brand?: { name: string; slug: string };
  productName: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ category, brand, productName }) => (
  <nav className="flex items-center space-x-2 text-sm mb-6" aria-label="Breadcrumb">
    <Link href="/" className="text-gray-500 hover:text-gray-700">
      Home
    </Link>
    <span className="text-gray-400">/</span>
    {category && (
      <>
        <Link href={`/categories/${category.slug}`} className="text-gray-500 hover:text-gray-700">
          {category.name}
        </Link>
        <span className="text-gray-400">/</span>
      </>
    )}
    {brand && (
      <>
        <Link href={`/brands/${brand.slug}`} className="text-gray-500 hover:text-gray-700">
          {brand.name}
        </Link>
        <span className="text-gray-400">/</span>
      </>
    )}
    <span className="text-gray-900 font-medium truncate max-w-[200px]">{productName}</span>
  </nav>
);

/**
 * Share Buttons Component
 */
const ShareButtons: React.FC<{ productName: string; productUrl: string }> = ({
  productName,
  productUrl
}) => {
  const [copied, setCopied] = useState(false);

  const shareLinks = [
    {
      name: 'Facebook',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`
    },
    {
      name: 'Twitter',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(productName)}&url=${encodeURIComponent(productUrl)}`
    },
    {
      name: 'WhatsApp',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
      url: `https://wa.me/?text=${encodeURIComponent(productName)} ${encodeURIComponent(productUrl)}`
    }
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(productUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      {shareLinks.map((link) => (
        <a
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          aria-label={`Share on ${link.name}`}
        >
          {link.icon}
        </a>
      ))}
      <button
        onClick={handleCopyLink}
        className="p-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        aria-label="Copy link"
      >
        {copied ? (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  );
};

/**
 * ProductDetail Component
 * 
 * @param {ProductDetailProps} props - Component props
 * @returns {JSX.Element} Product detail component
 */
export const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
  relatedProducts = [],
  className = ''
}) => {
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [productUrl, setProductUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setProductUrl(window.location.href);
    }
  }, []);

  // Determine stock status
  const isOutOfStock = product.status === 'out_of_stock' || product.stockQuantity === 0;
  const isLowStock = !isOutOfStock && product.stockQuantity <= product.lowStockThreshold;

  // Calculate discount percentage
  const discountPercentage = product.salePrice && product.regularPrice
    ? Math.round(((product.regularPrice - product.salePrice) / product.regularPrice) * 100)
    : null;

  // Handle variant selection
  const handleVariantSelect = (variant: { id: string }) => {
    setSelectedVariant(variant.id);
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (!isOutOfStock && onAddToCart) {
      onAddToCart(product.id, selectedVariant);
    }
  };

  // Handle quantity change
  const handleQuantityChange = (newQuantity: number) => {
    const maxQuantity = selectedVariant
      ? product.variants.find((v) => v.id === selectedVariant)?.stock || product.stockQuantity
      : product.stockQuantity;
    
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  // Handle wishlist toggle
  const handleToggleWishlist = () => {
    if (onToggleWishlist) {
      onToggleWishlist(product.id);
    }
  };


  return (
    <div className={className}>
      {/* Breadcrumb */}
      <Breadcrumb
        category={product.categories?.[0]?.category}
        brand={product.brand}
        productName={product.name}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Column - Image Gallery */}
        <div>
          {product && product.images && product.images.length > 0 ? (
            <ProductImageGallery
              images={product.images.map(img => ({
                id: img.id,
                url: getImageUrl(img.originalUrl || img.optimizedUrl || img.thumbnailUrl) || '',
                alt: img.altTextEn || img.altTextBn || '',
                sortOrder: img.displayOrder
              }))}
              productName={product.name}
            />
          ) : null}
        </div>

        {/* Right Column - Product Info */}
        <div className="space-y-6">
          {/* Brand Section with Logo */}
          {product.brand && (
            <Link
              href={`/brands/${product.brand.slug}`}
              className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              {product.brand.logoUrl && (
                <div className="w-12 h-12 flex-shrink-0">
                  <img
                    src={getImageUrl(product.brand.logoUrl) || ''}
                    alt={product.brand.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 mb-1">Brand</p>
                <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  {product.brand.name}
                </p>
              </div>
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}

          {/* Product Name */}
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

          {/* Rating */}
          {product.avgRating !== undefined && product.avgRating > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`
                      w-5 h-5
                      ${i < Math.floor(product.avgRating!) ? 'text-yellow-400' : 'text-gray-300'}
                    `}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {product.avgRating.toFixed(1)} ({product._count?.reviews || 0} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <ProductPrice
            regularPrice={product.regularPrice}
            salePrice={product.salePrice}
            discountPercentage={discountPercentage}
            showTax
            taxRate={product.taxRate}
          />

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-gray-600">{product.shortDescription}</p>
          )}

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <ProductVariants
              variants={product.variants}
              regularPrice={product.regularPrice}
              salePrice={product.salePrice}
              onVariantSelect={handleVariantSelect}
              selectedVariantId={selectedVariant}
            />
          )}

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            {isOutOfStock ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                Low Stock ({product.stockQuantity} left)
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                In Stock
              </span>
            )}
            <span className="text-sm text-gray-500">SKU: {product.sku}</span>
          </div>

          {/* Status and Visibility */}
          {product.visibility !== 'private' && product.visibility !== 'restricted' && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {/* FIX: Added optional chaining to prevent "can't access property 'replace'" error */}
                {product.status?.replace('_', ' ').toUpperCase() || 'PUBLISHED'}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {product.visibility.toUpperCase()}
              </span>
            </div>
          )}

          {/* Quantity Selector */}
          {!isOutOfStock && (
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <div className="flex items-center">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="px-3 py-2 border border-gray-300 rounded-l-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500"
                  aria-label="Decrease quantity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  max={selectedVariant
                    ? product.variants.find((v) => v.id === selectedVariant)?.stock || product.stockQuantity
                    : product.stockQuantity
                  }
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  className="w-20 px-3 py-2 border-y border-gray-300 text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= (selectedVariant
                    ? product.variants.find((v) => v.id === selectedVariant)?.stock || product.stockQuantity
                    : product.stockQuantity
                  )}
                  className="px-3 py-2 border border-gray-300 rounded-r-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500"
                  aria-label="Increase quantity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {!isOutOfStock && (
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
              >
                Add to Cart
              </button>
            )}
            <button
              onClick={handleToggleWishlist}
              className={`
                p-3 rounded-lg border transition-colors
                ${isWishlisted
                  ? 'border-red-200 bg-red-50 text-red-500'
                  : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500'
                }
              `}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <svg className="w-6 h-6" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <CompareButton product={product} />
          </div>

          {/* Share Buttons */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">Share this product</p>
            <ShareButtons productName={product.name} productUrl={productUrl} />
          </div>

          {/* Warranty Information */}
          {(product.warrantyPeriod || product.warrantyType) && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Warranty Information</h3>
              {product.warrantyPeriod && (
                <p className="text-sm text-gray-600">
                  Warranty Period: {product.warrantyPeriod} {product.warrantyPeriod === 1 ? 'month' : 'months'}
                </p>
              )}
              {product.warrantyType && (
                <p className="text-sm text-gray-600">
                  Warranty Type: {product.warrantyType}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Full Description */}
      {product.description && (
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Description</h2>
          <div className="prose max-w-none text-gray-600">
            {product.description}
          </div>
        </div>
      )}

      {/* Specifications */}
      {product.specifications && product.specifications.length > 0 && (
        <div className="mt-12">
          <ProductSpecifications specifications={product.specifications} />
        </div>
      )}

      {/* Reviews Section */}
      {product.reviews && product.reviews.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Customer Reviews ({product._count?.reviews || 0})
          </h2>
          <div className="space-y-6">
            {product.reviews.slice(0, 5).map((review) => (
              <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">
                      {review.user.firstName} {review.user.lastName}
                    </p>
                    <div className="flex mt-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`
                            w-4 h-4
                            ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}
                          `}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">{review.title}</h4>
                {review.comment && <p className="text-gray-600">{review.comment}</p>}
                {review.isVerified && (
                  <span className="inline-flex items-center mt-2 text-xs text-green-600">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified Purchase
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cross-Sell Products */}
      {product.crossSellProducts && product.crossSellProducts.length > 0 && (
        <div className="mt-12">
          <CrossSellProducts
            crossSellProducts={product.crossSellProducts}
            onAddToCart={onAddToCart}
          />
        </div>
      )}

      {/* Up-Sell Products */}
      {product.upSellProducts && product.upSellProducts.length > 0 && (
        <div className="mt-12">
          <UpSellProducts
            upSellProducts={product.upSellProducts}
            onAddToCart={onAddToCart}
          />
        </div>
      )}

      {/* Related Products */}
      {product.relatedProducts && product.relatedProducts.length > 0 && (
        <div className="mt-12">
          <RelatedProducts
            relatedProducts={product.relatedProducts}
            onAddToCart={onAddToCart}
            onQuickView={() => {/* Quick view functionality */}}
          />
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
