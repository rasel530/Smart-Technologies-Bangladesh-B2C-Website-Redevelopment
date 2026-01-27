'use client';

import React from 'react';
import { Grid, Eye, ShoppingCart, Package } from 'lucide-react';
import { RelatedProduct } from '@/types/product';

interface RelatedProductsProps {
  relatedProducts: RelatedProduct[];
  onAddToCart?: (productId: string) => void;
  onQuickView?: (productId: string) => void;
  className?: string;
}

export const RelatedProducts: React.FC<RelatedProductsProps> = ({
  relatedProducts,
  onAddToCart,
  onQuickView,
  className = ''
}) => {
  const getDisplayPrice = (regularPrice: number, salePrice: number | null) => {
    if (salePrice && salePrice < regularPrice) {
      return {
        current: salePrice,
        original: regularPrice,
        hasDiscount: true,
        discount: ((regularPrice - salePrice) / regularPrice * 100).toFixed(0)
      };
    }
    return {
      current: regularPrice,
      original: null,
      hasDiscount: false,
      discount: null
    };
  };

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">
              Related Products
            </h3>
          </div>
          <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200">
            {relatedProducts.length} product{relatedProducts.length !== 1 ? 's' : ''}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Similar items you might also like
        </p>
      </div>

      {/* Product Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {relatedProducts.map(item => {
            const product = item.relatedProduct;
            const price = getDisplayPrice(product.regularPrice, product.salePrice);
            const imageUrl = product.images?.[0]?.url;

            return (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all group"
              >
                {/* Product Image */}
                <div className="aspect-square bg-gray-100 relative">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="w-12 h-12" />
                    </div>
                  )}
                  
                  {/* Quick View Button */}
                  {onQuickView && (
                    <button
                      onClick={() => onQuickView(product.id)}
                      className="absolute top-2 right-2 bg-white/90 hover:bg-white p-2 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100"
                      title="Quick View"
                    >
                      <Eye className="w-4 h-4 text-gray-700" />
                    </button>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h4>
                    {product.nameEn && (
                      <p className="text-sm text-gray-500 mt-1">
                        {product.nameEn}
                      </p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold text-gray-900">
                        ৳{price.current.toFixed(2)}
                      </span>
                      {price.hasDiscount && (
                        <span className="text-sm text-red-600 line-through">
                          ৳{price.original?.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {price.hasDiscount && (
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                        -{price.discount}%
                      </span>
                    )}
                  </div>

                  {/* SKU */}
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">SKU:</span> {product.sku}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {onAddToCart && (
                      <button
                        onClick={() => onAddToCart(product.id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </button>
                    )}
                    {onQuickView && (
                      <button
                        onClick={() => onQuickView(product.id)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Quick View
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Grid className="w-4 h-4 text-gray-500" />
              <span>Grid view</span>
            </div>
          </div>
          <div>
            Showing <strong>{relatedProducts.length}</strong> related product{relatedProducts.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelatedProducts;
