/**
 * VariantSelector Component
 * 
 * A component for selecting product variants.
 * Features include:
 * - Color variant selection with visual swatches
 * - Size variant selection with buttons
 * - Other variant types (material, etc.)
 * - Disable out-of-stock variants
 * - Show selected variant price
 * - Update product image based on variant
 * - Integration with product data structure
 * 
 * @component
 */

'use client';

import React, { useState } from 'react';
import { ProductVariant } from '@/types/product';

export type VariantType = 'color' | 'size' | 'material' | 'style' | 'other';

interface VariantOption {
  id: string;
  value: string;
  type: VariantType;
  isAvailable: boolean;
  price?: number;
  image?: string;
}

interface VariantSelectorProps {
  variants: ProductVariant[];
  variantOptions: VariantOption[];
  selectedVariantId?: string;
  onVariantSelect: (variant: ProductVariant) => void;
  onImageChange?: (imageUrl: string) => void;
  className?: string;
}

/**
 * VariantSelector Component
 * 
 * @param {VariantSelectorProps} props - Component props
 * @returns {JSX.Element} Variant selector component
 */
export const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  variantOptions,
  selectedVariantId,
  onVariantSelect,
  onImageChange,
  className = ''
}) => {
  const [selectedTypeValues, setSelectedTypeValues] = useState<Record<VariantType, string>>({
    color: '',
    size: '',
    material: '',
    style: '',
    other: '',
  });

  // Group variant options by type
  const groupedOptions: Record<VariantType, VariantOption[]> = {
    color: variantOptions.filter(opt => opt.type === 'color'),
    size: variantOptions.filter(opt => opt.type === 'size'),
    material: variantOptions.filter(opt => opt.type === 'material'),
    style: variantOptions.filter(opt => opt.type === 'style'),
    other: variantOptions.filter(opt => opt.type === 'other'),
  };

  // Handle variant option selection
  const handleOptionSelect = (option: VariantOption) => {
    setSelectedTypeValues(prev => ({
      ...prev,
      [option.type]: option.value,
    }));

    // Find matching variant
    const matchingVariant = variants.find(v => 
      v.name.toLowerCase().includes(option.value.toLowerCase())
    );

    if (matchingVariant) {
      onVariantSelect(matchingVariant);
      
      // Update image if available
      if (option.image && onImageChange) {
        onImageChange(option.image);
      }
    }
  };

  // Check if option is selected
  const isOptionSelected = (option: VariantOption) => 
    selectedTypeValues[option.type] === option.value;

  // Render color swatches
  const renderColorSwatches = (options: VariantOption[]) => (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => option.isAvailable && handleOptionSelect(option)}
          disabled={!option.isAvailable}
          className={`
            relative w-10 h-10 rounded-full border-2 transition-all
            ${isOptionSelected(option) ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-300'}
            ${!option.isAvailable ? 'opacity-40 cursor-not-allowed' : 'hover:border-blue-400 cursor-pointer'}
          `}
          style={{ backgroundColor: option.value }}
          aria-label={`Select ${option.value}`}
          aria-pressed={isOptionSelected(option)}
          title={option.value}
        >
          {isOptionSelected(option) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
          {!option.isAvailable && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </button>
      ))}
    </div>
  );

  // Render size buttons
  const renderSizeButtons = (options: VariantOption[]) => (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => option.isAvailable && handleOptionSelect(option)}
          disabled={!option.isAvailable}
          className={`
            px-4 py-2 border-2 rounded-lg font-medium transition-all
            ${isOptionSelected(option)
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-300 text-gray-700'
            }
            ${!option.isAvailable ? 'opacity-40 cursor-not-allowed' : 'hover:border-blue-400 hover:bg-gray-50 cursor-pointer'}
          `}
          aria-label={`Select size ${option.value}`}
          aria-pressed={isOptionSelected(option)}
        >
          {option.value}
        </button>
      ))}
    </div>
  );

  // Render other variant types as buttons
  const renderOtherOptions = (options: VariantOption[], typeLabel: string) => (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => option.isAvailable && handleOptionSelect(option)}
          disabled={!option.isAvailable}
          className={`
            px-3 py-1.5 border rounded-md text-sm transition-all
            ${isOptionSelected(option)
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-300 text-gray-700'
            }
            ${!option.isAvailable ? 'opacity-40 cursor-not-allowed' : 'hover:border-blue-400 hover:bg-gray-50 cursor-pointer'}
          `}
          aria-label={`Select ${typeLabel} ${option.value}`}
          aria-pressed={isOptionSelected(option)}
        >
          {option.value}
          {option.price && (
            <span className="ml-1 text-xs text-gray-500">
              (+৳{option.price})
            </span>
          )}
        </button>
      ))}
    </div>
  );

  // Get selected variant price
  const selectedVariant = variants.find(v => v.id === selectedVariantId);
  const selectedPrice = selectedVariant?.price;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Color Selection */}
      {groupedOptions.color.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Color</h3>
          {renderColorSwatches(groupedOptions.color)}
        </div>
      )}

      {/* Size Selection */}
      {groupedOptions.size.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Size</h3>
          {renderSizeButtons(groupedOptions.size)}
        </div>
      )}

      {/* Material Selection */}
      {groupedOptions.material.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Material</h3>
          {renderOtherOptions(groupedOptions.material, 'material')}
        </div>
      )}

      {/* Style Selection */}
      {groupedOptions.style.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Style</h3>
          {renderOtherOptions(groupedOptions.style, 'style')}
        </div>
      )}

      {/* Other Variants */}
      {groupedOptions.other.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Options</h3>
          {renderOtherOptions(groupedOptions.other, 'option')}
        </div>
      )}

      {/* Selected Variant Price */}
      {selectedPrice && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Selected variant price: <span className="font-semibold text-gray-900">৳{selectedPrice.toLocaleString()}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default VariantSelector;
