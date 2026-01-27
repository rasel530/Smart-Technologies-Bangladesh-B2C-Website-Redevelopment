/**
 * ProductVariants Component
 * 
 * A variant selection component for products with multiple variants.
 * Features include variant selection UI, price updates, and stock availability.
 * 
 * @component
 */

'use client';

import React, { useState, useMemo } from 'react';
import { ProductVariant } from '@/types/product';
import { ProductPrice } from './ProductPrice';

interface ProductVariantsProps {
  variants: ProductVariant[];
  regularPrice: number;
  salePrice: number | null;
  onVariantSelect?: (variant: ProductVariant) => void;
  selectedVariantId?: string;
  className?: string;
}

/**
 * ProductVariants Component
 * 
 * @param {ProductVariantsProps} props - Component props
 * @returns {JSX.Element} Product variants component
 */
export const ProductVariants: React.FC<ProductVariantsProps> = ({
  variants,
  regularPrice,
  salePrice,
  onVariantSelect,
  selectedVariantId,
  className = ''
}) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    selectedVariantId ? variants.find((v) => v.id === selectedVariantId) || null : null
  );

  // Filter active variants
  const activeVariants = useMemo(
    () => variants.filter((variant) => variant.isActive),
    [variants]
  );

  // Determine if variant is out of stock
  const isOutOfStock = (variant: ProductVariant) => variant.stock === 0;

  // Handle variant selection
  const handleVariantSelect = (variant: ProductVariant) => {
    if (isOutOfStock(variant)) return;
    
    setSelectedVariant(variant);
    if (onVariantSelect) {
      onVariantSelect(variant);
    }
  };

  // Calculate discount percentage
  const calculateDiscount = (price: number, comparePrice: number | null) => {
    if (!comparePrice) return null;
    return Math.round(((comparePrice - price) / comparePrice) * 100);
  };

  // Display price
  const displayPrice = selectedVariant?.price || regularPrice;
  const displaySalePrice = selectedVariant?.comparePrice || salePrice;
  const discountPercentage = calculateDiscount(displayPrice, displaySalePrice);

  // If no active variants, return null
  if (activeVariants.length === 0) {
    return null;
  }

  // If only one variant and it's the default, just show price
  if (activeVariants.length === 1 && !activeVariants[0].comparePrice) {
    return (
      <div className={className}>
        <ProductPrice
          regularPrice={regularPrice}
          salePrice={salePrice}
          discountPercentage={discountPercentage}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Price Display */}
      <div className="mb-4">
        <ProductPrice
          regularPrice={selectedVariant?.price || regularPrice}
          salePrice={selectedVariant?.comparePrice || salePrice}
          discountPercentage={discountPercentage}
        />
      </div>

      {/* Variant Selection */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          {activeVariants.length > 1 ? 'Select Variant' : 'Variant'}
        </h3>

        <div className="flex flex-wrap gap-2">
          {activeVariants.map((variant) => {
            const isSelected = selectedVariant?.id === variant.id;
            const outOfStock = isOutOfStock(variant);

            return (
              <button
                key={variant.id}
                onClick={() => handleVariantSelect(variant)}
                disabled={outOfStock}
                className={`
                  relative px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                  ${isSelected
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }
                  ${outOfStock
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                  }
                `}
                aria-label={`Select ${variant.name}${outOfStock ? ' (out of stock)' : ''}`}
                aria-pressed={isSelected}
              >
                {variant.name}
                
                {/* Out of Stock Badge */}
                {outOfStock && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    Out of Stock
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Stock Information */}
        {selectedVariant && (
          <div className="mt-3">
            {isOutOfStock(selectedVariant) ? (
              <p className="text-sm text-red-600 font-medium">
                This variant is out of stock
              </p>
            ) : selectedVariant.stock <= 5 ? (
              <p className="text-sm text-orange-600">
                Only {selectedVariant.stock} left in stock
              </p>
            ) : (
              <p className="text-sm text-green-600">
                In stock ({selectedVariant.stock} available)
              </p>
            )}
          </div>
        )}

        {/* SKU Display */}
        {selectedVariant && (
          <p className="mt-2 text-xs text-gray-500">
            SKU: {selectedVariant.sku}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductVariants;
