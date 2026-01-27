'use client';

import React from 'react';
import { TrendingUp, Star, Award, Check } from 'lucide-react';
import { UpSellProduct } from '@/types/product';

interface UpSellProductsProps {
  upSellProducts: UpSellProduct[];
  onAddToCart?: (productId: string) => void;
  className?: string;
}

export const UpSellProducts: React.FC<UpSellProductsProps> = ({
  upSellProducts,
  onAddToCart,
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

  if (upSellProducts.length === 0) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 border border-purple-200 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">
                Upgrade Your Experience
              </h3>
              <p className="text-purple-100 text-sm mt-1">
                Discover premium alternatives with enhanced features
              </p>
            </div>
          </div>
          <div className="bg-white/20 px-4 py-2 rounded-full">
            <span className="text-sm font-semibold">
              {upSellProducts.length} upgrade{upSellProducts.length !== 1 ? 's' : ''} available
            </span>
          </div>
        </div>
      </div>

      {/* Product List */}
      <div className="p-6 space-y-4">
        {upSellProducts.map(item => {
          const product = item.relatedProduct;
          const price = getDisplayPrice(product.regularPrice, product.salePrice);
          const imageUrl = product.images?.[0]?.url;

          return (
            <div
              key={item.id}
              className="bg-white border-2 border-purple-200 rounded-xl p-5 hover:shadow-xl hover:border-purple-400 transition-all group"
            >
              <div className="flex gap-5">
                {/* Product Image */}
                <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <TrendingUp className="w-10 h-10" />
                    </div>
                  )}
                  
                  {/* Premium Badge */}
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    PREMIUM
                  </div>
                </div>

                {/* Product Details */}
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-lg font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                        {product.name}
                      </h4>
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-semibold">UPGRADE</span>
                      </div>
                    </div>
                    {product.nameEn && (
                      <p className="text-sm text-gray-600 mt-1">
                        {product.nameEn}
                      </p>
                    )}
                  </div>

                  {/* Price Comparison */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Current Price:</span>
                        <span className="text-lg font-bold text-gray-900 line-through">
                          ৳{price.current.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Upgrade to:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-purple-700">
                            ৳{(price.current * 1.2).toFixed(2)}
                          </span>
                          {price.hasDiscount && (
                            <span className="text-sm text-green-600 line-through">
                              ৳{(price.original! * 1.2).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      {price.hasDiscount && (
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <Award className="w-4 h-4" />
                          <span className="text-sm font-semibold">
                            Save {price.discount}% on upgrade
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>Enhanced performance</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>Premium quality materials</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>Extended warranty options</span>
                    </div>
                  </div>

                  {/* SKU */}
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">SKU:</span> {product.sku}
                  </div>

                  {/* Upgrade Button */}
                  {onAddToCart && (
                    <button
                      onClick={() => onAddToCart(product.id)}
                      className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      <TrendingUp className="w-5 h-5" />
                      Upgrade Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-purple-200 px-6 py-4">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <Award className="w-4 h-4 text-purple-600" />
          <span>
            All premium products come with <strong>extended warranty</strong> and <strong>priority support</strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default UpSellProducts;
