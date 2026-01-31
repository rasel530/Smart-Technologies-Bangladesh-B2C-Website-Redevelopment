/**
 * Product Comparison Page
 * 
 * Displays products side-by-side for comparison.
 * Features:
 * - Up to 4 products compared
 * - Attribute-by-attribute comparison
 * - Highlight differences
 * - Add to cart from comparison
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useCompare } from '@/components/product/CompareContext';
import { ProductWithRelations } from '@/types/product';
import { getImageUrl } from '@/lib/api/product-images';

// Dynamic imports to avoid SSR issues
const CompareButton = dynamic(
  () => import('@/components/product/CompareButton').then(mod => mod.CompareButton),
  { ssr: false }
);

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading comparison...</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">📊</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          No Products to Compare
        </h1>
        <p className="text-gray-600 mb-6">
          Add at least 2 products to compare them side by side.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Browse Products
        </Link>
      </div>
    </div>
  );
}

function getPrice(product: ProductWithRelations): number {
  return product.salePrice || product.regularPrice;
}

function getDiscountPercentage(product: ProductWithRelations): number {
  if (product.salePrice && product.salePrice < product.regularPrice) {
    return Math.round(((product.regularPrice - product.salePrice) / product.regularPrice) * 100);
  }
  return 0;
}

function getStockStatus(product: ProductWithRelations): { label: string; color: string } {
  if (product.stockQuantity <= 0) {
    return { label: 'Out of Stock', color: 'text-red-600' };
  } else if (product.stockQuantity <= (product.lowStockThreshold || 10)) {
    return { label: `Low Stock (${product.stockQuantity})`, color: 'text-orange-600' };
  }
  return { label: `In Stock (${product.stockQuantity})`, color: 'text-green-600' };
}

interface ComparisonRowProps {
  label: string;
  values: (string | number | null | undefined)[];
  highlight?: boolean;
}

function ComparisonRow({ label, values, highlight = false }: ComparisonRowProps) {
  const allSame = values.every(v => v === values[0]);
  
  return (
    <div className={`border-b border-gray-100 ${highlight ? 'bg-yellow-50' : ''}`}>
      <div className="py-3 px-4 font-medium text-gray-700 bg-gray-50 w-48 shrink-0">
        {label}
      </div>
      <div className="flex-1 flex">
        {values.map((value, index) => (
          <div
            key={index}
            className={`flex-1 py-3 px-4 ${
              highlight && !allSame ? 'bg-yellow-100' : ''
            } ${index !== values.length - 1 ? 'border-r border-gray-100' : ''}`}
          >
            {value !== undefined && value !== null ? String(value) : '—'}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ComparePage() {
  const { products, removeProduct, clearAll } = useCompare();
  const [showDifferencesOnly, setShowDifferencesOnly] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <LoadingSkeleton />;
  }

  if (products.length < 2) {
    return <EmptyState />;
  }

  // Filter products to max 4
  const displayProducts = products.slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Product Comparison</h1>
              <p className="text-gray-600 mt-1">
                Comparing {displayProducts.length} products
              </p>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDifferencesOnly}
                  onChange={(e) => setShowDifferencesOnly(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Show differences only</span>
              </label>
              <button
                onClick={clearAll}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {/* Product Headers */}
          <div className="flex border-b border-gray-200">
            <div className="w-48 shrink-0 p-4 bg-gray-50"></div>
            {displayProducts.map((product) => (
              <div key={product.id} className="flex-1 p-4 relative">
                <button
                  onClick={() => removeProduct(product.id)}
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label={`Remove ${product.name} from comparison`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                {/* Product Image */}
                <div className="relative w-full h-48 mb-4">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={getImageUrl(product.images[0], 'medium')}
                      alt={product.name}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Product Name */}
                <Link
                  href={`/products/${product.slug}`}
                  className="block font-medium text-gray-900 hover:text-blue-600 line-clamp-2 mb-2"
                >
                  {product.name}
                </Link>
                
                {/* Brand */}
                {product.brand && (
                  <p className="text-sm text-gray-500 mb-2">
                    {product.brand.name}
                  </p>
                )}
                
                {/* Price */}
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-xl font-bold text-gray-900">
                    ৳{getPrice(product).toLocaleString()}
                  </span>
                  {product.salePrice && product.salePrice < product.regularPrice && (
                    <>
                      <span className="text-sm text-gray-400 line-through">
                        ৳{product.regularPrice.toLocaleString()}
                      </span>
                      <span className="text-sm text-green-600 font-medium">
                        -{getDiscountPercentage(product)}%
                      </span>
                    </>
                  )}
                </div>
                
                {/* Add to Cart Button */}
                <button
                  disabled={product.stockQuantity <= 0}
                  className={`w-full py-2 rounded-lg font-medium transition-colors ${
                    product.stockQuantity > 0
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {product.stockQuantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            ))}
          </div>

          {/* Product Details Comparison */}
          <div>
            {/* Basic Information */}
            <ComparisonRow
              label="SKU"
              values={displayProducts.map(p => p.sku)}
              highlight={showDifferencesOnly}
            />
            
            <ComparisonRow
              label="Brand"
              values={displayProducts.map(p => p.brand?.name || null)}
              highlight={showDifferencesOnly}
            />
            
            <ComparisonRow
              label="Availability"
              values={displayProducts.map(p => getStockStatus(p).label)}
              highlight={showDifferencesOnly}
            />
            
            {/* Description */}
            <div className="border-b border-gray-100">
              <div className="py-3 px-4 font-medium text-gray-700 bg-gray-50 w-48 shrink-0">
                Description
              </div>
              <div className="flex">
                {displayProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className={`flex-1 py-3 px-4 text-sm text-gray-600 line-clamp-3 ${
                      index !== displayProducts.length - 1 ? 'border-r border-gray-100' : ''
                    }`}
                  >
                    {product.shortDescription || 'No description available'}
                  </div>
                ))}
              </div>
            </div>

            {/* Specifications */}
            {displayProducts[0].specifications && displayProducts[0].specifications.length > 0 && (
              <>
                <div className="bg-gray-100 py-2 px-4 font-semibold text-gray-800">
                  Specifications
                </div>
                {Array.from(
                  new Set(displayProducts.flatMap(p => p.specifications?.map(s => s.name) || []))
                ).map((specName) => {
                  const values = displayProducts.map(p => {
                    const spec = p.specifications?.find(s => s.name === specName);
                    return spec?.value;
                  });
                  
                  const allSame = values.every(v => v === values[0]);
                  if (showDifferencesOnly && allSame) {
                    return null;
                  }
                  
                  return (
                    <ComparisonRow
                      key={specName}
                      label={specName}
                      values={values}
                      highlight={showDifferencesOnly}
                    />
                  );
                })}
              </>
            )}

            {/* Variants */}
            <div className="bg-gray-100 py-2 px-4 font-semibold text-gray-800">
              Variants
            </div>
            <ComparisonRow
              label="Has Variants"
              values={displayProducts.map(p => p.variants && p.variants.length > 0 ? 'Yes' : 'No')}
              highlight={showDifferencesOnly}
            />

            {/* Features */}
            <div className="bg-gray-100 py-2 px-4 font-semibold text-gray-800">
              Features
            </div>
            <ComparisonRow
              label="Featured"
              values={displayProducts.map(p => p.isFeatured ? 'Yes' : 'No')}
              highlight={showDifferencesOnly}
            />
            <ComparisonRow
              label="New Arrival"
              values={displayProducts.map(p => p.isNewArrival ? 'Yes' : 'No')}
              highlight={showDifferencesOnly}
            />
            <ComparisonRow
              label="Best Seller"
              values={displayProducts.map(p => p.isBestSeller ? 'Yes' : 'No')}
              highlight={showDifferencesOnly}
            />

            {/* Warranty */}
            {(displayProducts.some(p => p.warrantyPeriod) || displayProducts.some(p => p.warrantyType)) && (
              <>
                <div className="bg-gray-100 py-2 px-4 font-semibold text-gray-800">
                  Warranty
                </div>
                <ComparisonRow
                  label="Warranty Period"
                  values={displayProducts.map(p => p.warrantyPeriod ? `${p.warrantyPeriod} months` : null)}
                  highlight={showDifferencesOnly}
                />
                <ComparisonRow
                  label="Warranty Type"
                  values={displayProducts.map(p => p.warrantyType || null)}
                  highlight={showDifferencesOnly}
                />
              </>
            )}
          </div>
        </div>

        {/* Continue Shopping */}
        <div className="mt-8 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
