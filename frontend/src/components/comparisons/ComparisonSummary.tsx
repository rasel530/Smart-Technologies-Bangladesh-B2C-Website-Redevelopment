/**
 * Comparison Summary Component
 *
 * Component for displaying a summary of the comparison.
 * Shows total products, price range, common specs, key differences, and best value recommendation.
 */

'use client';

import { Award, TrendingUp, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { ComparisonData } from '@/types/comparison';

interface ComparisonSummaryProps {
  comparisonData: ComparisonData;
  className?: string;
}

export function ComparisonSummary({
  comparisonData,
  className = '',
}: ComparisonSummaryProps) {
  const { comparison, prices, differences } = comparisonData;

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{comparison.name}</h3>
          <p className="text-sm text-gray-600">
            Created on {new Date(comparison.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">{comparison.itemCount}</p>
          <p className="text-sm text-gray-600">Products</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Price Range */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <p className="text-xs font-medium text-gray-600">Price Range</p>
          </div>
          <p className="text-lg font-bold text-gray-900">
            ৳{prices.priceRange.min.toLocaleString()} - ৳{prices.priceRange.max.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">Avg: ৳{prices.priceRange.average.toLocaleString()}</p>
        </div>

        {/* Common Specs */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-xs font-medium text-gray-600">Common Specs</p>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {differences.summary.commonSpecs}
          </p>
          <p className="text-xs text-gray-500 mt-1">Shared features</p>
        </div>

        {/* Different Specs */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            <p className="text-xs font-medium text-gray-600">Differences</p>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {differences.summary.differentSpecs}
          </p>
          <p className="text-xs text-gray-500 mt-1">Unique features</p>
        </div>

        {/* Unique Specs */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-purple-600" />
            <p className="text-xs font-medium text-gray-600">Unique Specs</p>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {differences.summary.uniqueSpecs}
          </p>
          <p className="text-xs text-gray-500 mt-1">Exclusive features</p>
        </div>
      </div>

      {/* Best Value Recommendation */}
      {differences.bestValueRecommendation && (
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-b border-green-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-full flex-shrink-0">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-green-900 mb-1">
                Best Value Recommendation
              </h4>
              <p className="text-base font-medium text-green-800 mb-2">
                {differences.bestValueRecommendation.productName}
              </p>
              <ul className="text-xs text-green-700 space-y-1">
                {differences.bestValueRecommendation.reasons.map((reason, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Key Differences */}
      {differences.keyDifferences.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Key Differences</h4>
          <div className="space-y-3">
            {differences.keyDifferences.slice(0, 3).map((diff, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-gray-600 bg-gray-200 px-2 py-0.5 rounded">
                    {diff.category}
                  </span>
                  <p className="text-sm font-medium text-gray-900">{diff.name}</p>
                </div>
                <p className="text-xs text-gray-600 mb-2">{diff.description}</p>
                <div className="space-y-1">
                  {diff.products.map((product) => (
                    <div
                      key={product.productId}
                      className={`flex items-center justify-between text-xs p-1.5 rounded ${
                        product.isBetter ? 'bg-green-50' : 'bg-white'
                      }`}
                    >
                      <span className="font-medium text-gray-700 truncate flex-1">
                        {product.productName}
                      </span>
                      <span
                        className={`font-semibold ${
                          product.isBetter ? 'text-green-700' : 'text-gray-900'
                        }`}
                      >
                        {product.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {differences.keyDifferences.length > 3 && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              +{differences.keyDifferences.length - 3} more differences
            </p>
          )}
        </div>
      )}

      {/* Price Analysis */}
      <div className="p-4 border-t border-gray-200 bg-blue-50">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Price Analysis</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-blue-700 mb-1">Cheapest Option</p>
            <p className="text-sm font-semibold text-blue-900">
              {prices.products.find((p) => p.isCheapest)?.productName || 'N/A'}
            </p>
            <p className="text-xs text-blue-700">
              ৳{prices.products.find((p) => p.isCheapest)?.finalPrice.toLocaleString() || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-blue-700 mb-1">Most Expensive Option</p>
            <p className="text-sm font-semibold text-blue-900">
              {prices.products.find((p) => p.isMostExpensive)?.productName || 'N/A'}
            </p>
            <p className="text-xs text-blue-700">
              ৳{prices.products.find((p) => p.isMostExpensive)?.finalPrice.toLocaleString() || 0}
            </p>
          </div>
        </div>
        {prices.savings && (
          <div className="mt-3 p-2 bg-green-100 rounded-lg">
            <p className="text-xs font-medium text-green-800">
              💡 You could save ৳{prices.savings.amount.toLocaleString()} (
              {prices.savings.percentage}%) by choosing the cheapest option
            </p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Comparison Tips</h4>
        <ul className="text-xs text-gray-700 space-y-1">
          <li>• Focus on specifications that matter most to your needs</li>
          <li>• Consider the price-to-performance ratio</li>
          <li>• Check warranty and after-sales service</li>
          <li>• Read customer reviews for real-world performance</li>
          <li>• Look for additional features that provide extra value</li>
        </ul>
      </div>
    </div>
  );
}

export default ComparisonSummary;
