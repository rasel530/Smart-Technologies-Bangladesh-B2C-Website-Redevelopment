/**
 * ProductPrice Component
 * 
 * A reusable price display component for products.
 * Handles regular price, sale price, discount percentage, and tax information.
 * 
 * @component
 */

'use client';

import React from 'react';

interface ProductPriceProps {
  regularPrice: number;
  salePrice: number | null;
  discountPercentage: number | null;
  showTax?: boolean;
  taxRate?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Format price in BDT currency
 */
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

/**
 * Calculate tax amount
 */
const calculateTax = (price: number, taxRate: number): number => {
  return price * (taxRate / 100);
};

/**
 * ProductPrice Component
 * 
 * @param {ProductPriceProps} props - Component props
 * @returns {JSX.Element} Price display component
 */
export const ProductPrice: React.FC<ProductPriceProps> = ({
  regularPrice,
  salePrice,
  discountPercentage,
  showTax = false,
  taxRate = 0,
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const finalPrice = salePrice || regularPrice;
  const hasDiscount = salePrice !== null && salePrice < regularPrice;
  const taxAmount = calculateTax(finalPrice, taxRate);
  const totalPrice = finalPrice + taxAmount;

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Price Display */}
      <div className={`flex items-baseline gap-2 ${sizeClasses[size]}`}>
        {/* Final Price */}
        <span className="font-bold text-gray-900">
          {formatPrice(finalPrice)}
        </span>

        {/* Regular Price (if discounted) */}
        {hasDiscount && (
          <span className="text-sm text-gray-400 line-through">
            {formatPrice(regularPrice)}
          </span>
        )}

        {/* Discount Badge */}
        {discountPercentage && discountPercentage > 0 && (
          <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">
            -{discountPercentage}%
          </span>
        )}
      </div>

      {/* Tax Information */}
      {showTax && taxRate > 0 && (
        <div className="mt-1 text-xs text-gray-500">
          <span>incl. tax ({taxRate}%): {formatPrice(taxAmount)}</span>
          {hasDiscount && (
            <span className="ml-2">
              Total: <span className="font-medium">{formatPrice(totalPrice)}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductPrice;
