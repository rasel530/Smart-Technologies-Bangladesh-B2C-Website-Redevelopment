'use client';

import React from 'react';
import { ShoppingCart, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { CrossSellProduct } from '@/types/product';
import { getImageUrl } from '@/lib/api/product-images';

interface CrossSellProductsProps {
  crossSellProducts: CrossSellProduct[];
  onAddToCart?: (productId: string) => void;
  className?: string;
}

export const CrossSellProducts: React.FC<CrossSellProductsProps> = ({
  crossSellProducts,
  onAddToCart,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);

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

  React.useEffect(() => {
    if (crossSellProducts.length <= 4) return;

    const interval = setInterval(() => {
      if (!isPaused) {
        setCurrentIndex(prev => (prev + 1) % crossSellProducts.length);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [crossSellProducts.length, isPaused]);

  if (crossSellProducts.length === 0) {
    return null;
  }

  const displayProducts = crossSellProducts.length <= 4 
    ? crossSellProducts 
    : [crossSellProducts[currentIndex]];

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Frequently Bought Together
            </h3>
          </div>
          <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200">
            {crossSellProducts.length} product{crossSellProducts.length !== 1 ? 's' : ''}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Complete your purchase with these complementary items
        </p>
      </div>

      {/* Product Grid / Carousel */}
      <div className="p-6">
        {crossSellProducts.length <= 4 ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayProducts.map(item => {
              const product = item.relatedProduct;
              const price = getDisplayPrice(product.regularPrice, product.salePrice);
              const imageUrl = product.images?.[0] ? getImageUrl(product.images[0], 'medium') : undefined;

              return (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 transition-all group"
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ShoppingCart className="w-12 h-12" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h4>

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

                    {/* Add to Cart Button */}
                    {onAddToCart && (
                      <button
                        onClick={() => onAddToCart(product.id)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Carousel View */
          <div className="relative">
            {/* Navigation Buttons */}
            <button
              onClick={() => setCurrentIndex(prev => (prev - 1 + crossSellProducts.length) % crossSellProducts.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg border border-gray-200 rounded-full p-2 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={() => setCurrentIndex(prev => (prev + 1) % crossSellProducts.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg border border-gray-200 rounded-full p-2 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>

            {/* Carousel Item */}
            <div
              className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {displayProducts.map(item => {
                const product = item.relatedProduct;
                const price = getDisplayPrice(product.regularPrice, product.salePrice);
                const imageUrl = product.images?.[0] ? getImageUrl(product.images[0], 'medium') : undefined;

                return (
                  <div key={item.id} className="flex gap-6">
                    {/* Product Image */}
                    <div className="w-48 h-48 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ShoppingCart className="w-16 h-16" />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900 mb-2">
                          {product.name}
                        </h4>
                        {product.nameEn && (
                          <p className="text-sm text-gray-600">
                            {product.nameEn}
                          </p>
                        )}
                      </div>

                      {/* Price */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-gray-900">
                            ৳{price.current.toFixed(2)}
                          </span>
                          {price.hasDiscount && (
                            <span className="text-lg text-red-600 line-through">
                              ৳{price.original?.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {price.hasDiscount && (
                          <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded">
                            Save {price.discount}%
                          </span>
                        )}
                      </div>

                      {/* SKU */}
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">SKU:</span> {product.sku}
                      </div>

                      {/* Add to Cart Button */}
                      {onAddToCart && (
                        <button
                          onClick={() => onAddToCart(product.id)}
                          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <ShoppingCart className="w-5 h-5" />
                          Add to Cart
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Carousel Indicators */}
            <div className="flex justify-center gap-2 mt-4">
              {crossSellProducts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CrossSellProducts;
