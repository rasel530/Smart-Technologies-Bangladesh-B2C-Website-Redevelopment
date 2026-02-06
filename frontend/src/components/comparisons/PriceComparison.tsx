/**
 * Price Comparison Component
 *
 * Component for comparing product prices side-by-side.
 * Shows price differences, cheapest/most expensive highlights, and savings calculation.
 */

'use client';

import { TrendingDown, TrendingUp, DollarSign, Award } from 'lucide-react';
import { ComparisonPriceData } from '@/types/comparison';

interface PriceComparisonProps {
  prices: ComparisonPriceData;
  productNames: { [productId: string]: string };
  className?: string;
}

export function PriceComparison({
  prices,
  productNames,
  className = '',
}: PriceComparisonProps) {
  const { products, priceRange, savings } = prices;

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">Price Comparison</h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <DollarSign className="w-4 h-4" />
          <span>All prices in BDT (৳)</span>
        </div>
      </div>

      {/* Price Range Summary */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-600 mb-1">Lowest Price</p>
            <p className="text-lg font-bold text-green-600">৳{priceRange.min.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Average Price</p>
            <p className="text-lg font-bold text-blue-600">৳{priceRange.average.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Highest Price</p>
            <p className="text-lg font-bold text-red-600">৳{priceRange.max.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Savings Banner */}
      {savings && (
        <div className="p-4 bg-green-50 border-b border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">Best Savings</p>
                <p className="text-xs text-green-600">
                  Save ৳{savings.amount.toLocaleString()} ({savings.percentage}%) by choosing{' '}
                  {productNames[savings.cheapestProductId] || 'the cheapest option'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Price Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200 min-w-[200px]">
                Product
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200 min-w-[120px]">
                Regular Price
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200 min-w-[120px]">
                Sale Price
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200 min-w-[120px]">
                Final Price
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200 min-w-[100px]">
                Discount
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200 min-w-[100px]">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr
                key={product.productId}
                className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b border-gray-200">
                  {productNames[product.productId] || `Product ${product.productId}`}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                  ৳{product.regularPrice.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                  {product.salePrice ? (
                    <span>৳{product.salePrice.toLocaleString()}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900 border-b border-gray-200">
                  ৳{product.finalPrice.toLocaleString()}
                </td>
                <td className="px-4 py-3 border-b border-gray-200">
                  {product.discountPercentage ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded">
                      -{product.discountPercentage}%
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 border-b border-gray-200">
                  {product.isCheapest ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded">
                      <TrendingDown className="w-3 h-3" />
                      Lowest
                    </span>
                  ) : product.isMostExpensive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded">
                      <TrendingUp className="w-3 h-3" />
                      Highest
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                      Mid-range
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Price Difference Bar */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-sm font-medium text-gray-700 mb-3">Price Difference Visualization</p>
        <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
            style={{
              width: `${((priceRange.min - priceRange.min) / (priceRange.max - priceRange.min || 1)) * 100}%`,
            }}
          ></div>
          {products.map((product, index) => {
            const position = ((product.finalPrice - priceRange.min) / (priceRange.max - priceRange.min || 1)) * 100;
            return (
              <div
                key={product.productId}
                className="absolute top-0 h-full w-1 bg-gray-600"
                style={{ left: `${position}%` }}
                title={`${productNames[product.productId]}: ৳${product.finalPrice.toLocaleString()}`}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-700 whitespace-nowrap">
                  {productNames[product.productId]?.split(' ')[0] || `P${index + 1}`}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span>৳{priceRange.min.toLocaleString()}</span>
          <span>৳{priceRange.max.toLocaleString()}</span>
        </div>
      </div>

      {/* Price Analysis Tips */}
      <div className="p-4 border-t border-gray-200 bg-blue-50">
        <p className="text-sm font-medium text-blue-900 mb-2">Price Analysis Tips:</p>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Look for products with the highest discount percentages for best value</li>
          <li>• Compare final prices including any applicable discounts</li>
          <li>• Consider the price range to understand the market positioning</li>
          {savings && (
            <li>• You could save up to ৳{savings.amount.toLocaleString()} by choosing the cheapest option</li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default PriceComparison;
