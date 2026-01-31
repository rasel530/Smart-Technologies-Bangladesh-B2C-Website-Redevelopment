/**
 * Product Comparison Bar Component
 * 
 * Fixed bar that appears when products are added to comparison.
 * Allows users to view and manage the comparison.
 */

'use client';

import { useCompare } from './CompareContext';
import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from '@/lib/api/product-images';

interface CompareBarProps {
  onCompare?: () => void;
}

export function CompareBar({ onCompare }: CompareBarProps) {
  const { products, removeProduct, clearAll, maxProducts, isFull } = useCompare();

  if (products.length === 0) {
    return null;
  }

  const handleCompare = () => {
    if (onCompare) {
      onCompare();
    } else {
      // Navigate to comparison page by default
      window.location.href = '/products/compare';
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          {/* Product Thumbnails */}
          <div className="flex items-center gap-3 overflow-x-auto">
            {products.map((product) => (
              <div
                key={product.id}
                className="relative flex-shrink-0 group"
              >
                <div className="relative w-16 h-16 border border-gray-200 rounded-lg overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={getImageUrl(product.images[0], 'thumbnail')}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => removeProduct(product.id)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Remove ${product.name} from comparison`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <p className="text-xs text-gray-600 mt-1 truncate max-w-[64px]">
                  {product.name}
                </p>
              </div>
            ))}

            {/* Empty Slots */}
            {Array.from({ length: maxProducts - products.length }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="flex-shrink-0 w-16 h-16 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center"
              >
                <span className="text-gray-400 text-xs">{products.length + index + 1}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 ml-4">
            <span className="text-sm text-gray-600 hidden sm:block">
              {products.length} of {maxProducts} products selected
            </span>
            
            <button
              onClick={clearAll}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear All
            </button>
            
            <button
              onClick={handleCompare}
              disabled={products.length < 2}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                products.length >= 2
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Compare Products
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompareBar;
