'use client';

import React from 'react';
import { DollarSign, Package, Check, X } from 'lucide-react';
import { ProductVariant } from '@/types/product';

const getSafePrice = (price: number | string | null | undefined, defaultValue: number = 0): number => {
  if (price === null || price === undefined) return defaultValue;
  const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
  return isNaN(numPrice) ? defaultValue : numPrice;
};

interface ProductVariantComparisonProps {
  variants: ProductVariant[];
  basePrice?: number;
  className?: string;
}

export const ProductVariantComparison: React.FC<ProductVariantComparisonProps> = ({
  variants,
  basePrice,
  className = ''
}) => {
  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-50' };
    if (stock <= 5) return { text: 'Low Stock', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { text: 'In Stock', color: 'text-green-600', bg: 'bg-green-50' };
  };

  const getPriceDifference = (price: number) => {
    if (!basePrice) return null;
    const diff = price - basePrice;
    const percentage = ((diff / basePrice) * 100).toFixed(1);
    return { diff, percentage };
  };

  if (variants.length === 0) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 text-center ${className}`}>
        <Package className="w-12 h-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600">No variants available</p>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Variant Comparison
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Compare prices and availability across {variants.length} variant{variants.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Variant
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Price
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Compare Price
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {variants.map((variant, index) => {
              const stockStatus = getStockStatus(variant.stock);
              const priceDiff = getPriceDifference(variant.price);
              
              return (
                <tr
                  key={variant.id}
                  className={`border-b border-gray-200 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  {/* Variant Name */}
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {variant.name}
                    </div>
                  </td>

                  {/* SKU */}
                  <td className="px-6 py-4">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">
                      {variant.sku}
                    </code>
                  </td>

                  {/* Price */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold text-gray-900">
                        {getSafePrice(variant.price).toFixed(2)}
                      </span>
                      {priceDiff && (
                        <span className={`text-xs font-medium ${
                          priceDiff.diff > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          ({priceDiff.diff > 0 ? '+' : ''}{priceDiff.percentage}%)
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Compare Price */}
                  <td className="px-6 py-4">
                    {variant.comparePrice ? (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500 line-through">
                          {getSafePrice(variant.comparePrice)?.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  {/* Stock */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900">
                        {variant.stock}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                      {variant.isActive ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      {stockStatus.text}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Check className="w-4 h-4 text-green-600" />
              <span>Active variants</span>
            </div>
            <div className="flex items-center gap-1">
              <X className="w-4 h-4 text-red-600" />
              <span>Inactive variants</span>
            </div>
          </div>
          <div>
            Total variants: <strong>{variants.length}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductVariantComparison;
