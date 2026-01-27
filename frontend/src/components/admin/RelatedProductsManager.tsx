'use client';

import React, { useState, useEffect } from 'react';
import { Search, Grid, Plus, Trash2, GripVertical } from 'lucide-react';
import { RelatedProduct } from '@/types/product';

interface RelatedProductsManagerProps {
  productId: string;
  availableProducts: Array<{ id: string; name: string; sku: string; regularPrice: number; salePrice: number | null }>;
  relatedProducts: RelatedProduct[];
  onAddRelated: (relatedProductId: string, displayOrder?: number) => Promise<void>;
  onRemoveRelated: (relatedProductId: string) => Promise<void>;
  onReorderRelated: (orders: Array<{ relatedProductId: string; displayOrder: number }>) => Promise<void>;
  className?: string;
}

export const RelatedProductsManager: React.FC<RelatedProductsManagerProps> = ({
  productId,
  availableProducts,
  relatedProducts,
  onAddRelated,
  onRemoveRelated,
  onReorderRelated,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(availableProducts);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredProducts(availableProducts);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = availableProducts.filter(product => 
      product.name.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query)
    );
    setFilteredProducts(filtered);
  }, [searchQuery, availableProducts]);

  const handleAddRelated = async (relatedProductId: string) => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const maxOrder = Math.max(...relatedProducts.map(p => p.displayOrder), -1);
      await onAddRelated(relatedProductId, maxOrder + 1);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (relatedProductId: string) => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      await onRemoveRelated(relatedProductId);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newOrder = relatedProducts.map((item, index) => ({
      relatedProductId: item.relatedProductId,
      displayOrder: index
    }));

    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);

    setIsSaving(true);
    try {
      await onReorderRelated(newOrder);
    } finally {
      setIsSaving(false);
      setDraggedIndex(null);
    }
  };

  const getDisplayPrice = (regularPrice: number, salePrice: number | null) => {
    if (salePrice && salePrice < regularPrice) {
      return {
        current: salePrice,
        original: regularPrice,
        hasDiscount: true
      };
    }
    return {
      current: regularPrice,
      original: null,
      hasDiscount: false
    };
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">
              Related Products
            </h3>
          </div>
          <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200">
            {relatedProducts.length} configured
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Similar products you might also like
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Search and Add Section */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Add Related Product
          </h4>
          <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products to add..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Available Products */}
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-2">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No products found matching "{searchQuery}"
                </div>
              ) : (
                filteredProducts.map(product => {
                  const isAlreadyAdded = relatedProducts.some(rp => rp.relatedProductId === product.id);
                  const price = getDisplayPrice(product.regularPrice, product.salePrice);

                  return (
                    <button
                      key={product.id}
                      onClick={() => handleAddRelated(product.id)}
                      disabled={isSaving || isAlreadyAdded}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                        isAlreadyAdded
                          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                        <Grid className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          SKU: {product.sku}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-gray-900">
                          ৳{price.current.toFixed(2)}
                        </div>
                        {isAlreadyAdded && (
                          <span className="text-xs text-green-600 font-medium">
                            Added
                          </span>
                        )}
                        {!isAlreadyAdded && (
                          <Plus className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Configured Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Grid className="w-4 h-4 text-blue-600" />
              Configured Related Products ({relatedProducts.length})
            </h4>
            <div className="space-y-2">
              {relatedProducts.map((item, index) => {
                const product = item.relatedProduct;
                const price = getDisplayPrice(product.regularPrice, product.salePrice);

                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 border-2 rounded-lg transition-all ${
                      draggedIndex === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <div className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center flex-shrink-0 cursor-move">
                      <GripVertical className="w-3 h-3 text-gray-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {product.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          Order: {item.displayOrder}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        SKU: {product.sku}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold text-gray-900">
                        ৳{price.current.toFixed(2)}
                      </div>
                      {price.hasDiscount && (
                        <span className="text-xs text-red-600">
                          ৳{price.original?.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemove(product.id)}
                      disabled={isSaving}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Related Products Message */}
        {relatedProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Grid className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-medium text-gray-700">
              No related products configured
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Add similar products to help customers discover alternatives
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Add products</span>
            </div>
            <div className="flex items-center gap-1">
              <GripVertical className="w-4 h-4 text-gray-500" />
              <span>Drag to reorder</span>
            </div>
            <div className="flex items-center gap-1">
              <Trash2 className="w-4 h-4 text-red-600" />
              <span>Click trash to remove</span>
            </div>
          </div>
          {isSaving && (
            <div className="text-blue-600 font-medium">
              Saving...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RelatedProductsManager;
