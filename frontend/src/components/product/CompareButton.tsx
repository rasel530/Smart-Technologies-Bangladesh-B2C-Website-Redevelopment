/**
 * Product Comparison Button Component
 * 
 * Button to add/remove products from comparison.
 * Shows checkmark when product is in comparison.
 */

'use client';

import { useCompare } from './CompareContext';
import { ProductWithRelations } from '@/types/product';

interface CompareButtonProps {
  product: ProductWithRelations;
  variant?: 'icon' | 'text' | 'full';
  className?: string;
  onToggle?: (added: boolean) => void;
}

export function CompareButton({
  product,
  variant = 'icon',
  className = '',
  onToggle
}: CompareButtonProps) {
  const { addProduct, removeProduct, isComparing, isFull, maxProducts } = useCompare();
  const isInCompare = isComparing(product.id);
  const full = isFull;

  const handleToggle = () => {
    if (isInCompare) {
      removeProduct(product.id);
      onToggle?.(false);
    } else {
      const added = addProduct(product);
      if (added) {
        onToggle?.(true);
      }
    }
  };

  // Icon-only variant
  if (variant === 'icon') {
    return (
      <button
        onClick={handleToggle}
        disabled={!isInCompare && full}
        className={`p-2 rounded-full transition-all ${
          isInCompare
            ? 'bg-blue-100 text-blue-600'
            : full
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        } ${className}`}
        title={
          isInCompare
            ? `Remove ${product.name} from comparison`
            : full
            ? `Cannot add more than ${maxProducts} products`
            : `Add ${product.name} to comparison`
        }
      >
        <svg
          className="w-5 h-5"
          fill={isInCompare ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </button>
    );
  }

  // Text variant
  if (variant === 'text') {
    return (
      <button
        onClick={handleToggle}
        disabled={!isInCompare && full}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
          isInCompare
            ? 'bg-blue-100 text-blue-700'
            : full
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        } ${className}`}
      >
        <svg
          className="w-4 h-4"
          fill={isInCompare ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        {isInCompare ? 'Compared' : 'Compare'}
      </button>
    );
  }

  // Full variant with count
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <button
        onClick={handleToggle}
        disabled={!isInCompare && full}
        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
          isInCompare
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : full
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <svg
          className="w-5 h-5"
          fill={isInCompare ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        {isInCompare ? 'Added to Compare' : 'Add to Compare'}
      </button>
      
      {!isInCompare && full && (
        <p className="text-xs text-center text-gray-500">
          Maximum {maxProducts} products for comparison
        </p>
      )}
    </div>
  );
}

export default CompareButton;
