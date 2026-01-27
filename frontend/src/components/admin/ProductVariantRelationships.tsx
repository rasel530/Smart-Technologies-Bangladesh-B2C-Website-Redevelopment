'use client';

import React, { useState } from 'react';
import { GitBranch, Plus, Trash2, GripVertical } from 'lucide-react';
import { ProductVariant } from '@/types/product';

interface ProductVariantRelationshipsProps {
  productId: string;
  variants: ProductVariant[];
  onSetVariantParent?: (variantId: string, parentId: string | null) => Promise<void>;
  className?: string;
}

export const ProductVariantRelationships: React.FC<ProductVariantRelationshipsProps> = ({
  productId,
  variants,
  onSetVariantParent,
  className = ''
}) => {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSetParent = async (variantId: string, parentId: string | null) => {
    if (!onSetVariantParent) return;

    setIsSaving(true);
    try {
      await onSetVariantParent(variantId, parentId);
    } finally {
      setIsSaving(false);
    }
  };

  // Note: Parent-child variant relationships require schema updates to add parentId field to ProductVariant
  // This component currently displays all variants without parent-child relationships
  const activeVariants = variants.filter(v => v.isActive);
  const inactiveVariants = variants.filter(v => !v.isActive);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">
              Variant Relationships
            </h3>
          </div>
          <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200">
            {variants.length} variant{variants.length !== 1 ? 's' : ''}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Manage parent-child relationships between product variants
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Active Variants */}
        {activeVariants.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-green-500" />
              Active Variants ({activeVariants.length})
            </h4>
            <div className="space-y-2">
              {activeVariants.map(variant => (
                <div
                  key={variant.id}
                  className={`flex items-center justify-between p-3 border-2 rounded-lg transition-all ${
                    selectedVariantId === variant.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center">
                      <GripVertical className="w-3 h-3 text-gray-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900">
                        {variant.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        SKU: {variant.sku} • Stock: {variant.stock}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      ৳{variant.price.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inactive Variants */}
        {inactiveVariants.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-gray-500" />
              Inactive Variants ({inactiveVariants.length})
            </h4>
            <div className="space-y-2">
              {inactiveVariants.map(variant => (
                <div
                  key={variant.id}
                  className={`flex items-center justify-between p-3 border-2 rounded-lg transition-all ${
                    selectedVariantId === variant.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center">
                      <GripVertical className="w-3 h-3 text-gray-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900">
                        {variant.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        SKU: {variant.sku} • Stock: {variant.stock}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      ৳{variant.price.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Variants Message */}
        {variants.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <GitBranch className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-medium text-gray-700">
              No variant relationships configured
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Parent-child variant relationships help organize product options
            </p>
          </div>
        )}

        {/* Info Message */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <GitBranch className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">
                Parent-child variant relationships require schema updates
              </p>
              <p>
                To enable variant parent-child relationships, add a <code className="bg-yellow-100 px-1 rounded">parentId</code> field to the ProductVariant model and update the database schema.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <GitBranch className="w-4 h-4 text-gray-500" />
              <span>Active variants shown in green</span>
            </div>
            <div className="flex items-center gap-1">
              <GitBranch className="w-4 h-4 text-gray-400" />
              <span>Inactive variants shown in gray</span>
            </div>
          </div>
          <div>
            Total: <strong>{variants.length}</strong> variant{variants.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductVariantRelationships;
