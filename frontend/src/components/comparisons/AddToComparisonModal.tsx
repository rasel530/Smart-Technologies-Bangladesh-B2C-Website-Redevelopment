/**
 * Add to Comparison Modal Component
 *
 * Modal for adding a product to a comparison.
 * Allows users to select an existing comparison or create a new one.
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Check, Search } from 'lucide-react';
import { ProductWithRelations } from '@/types/product';
import { Comparison } from '@/types/comparison';
import { getComparisons, createComparison, addProductToComparison } from '@/lib/api/comparisons';

interface AddToComparisonModalProps {
  product: ProductWithRelations;
  isOpen: boolean;
  onClose: () => void;
  onAdded?: (comparisonId: string) => void;
}

export function AddToComparisonModal({
  product,
  isOpen,
  onClose,
  onAdded,
}: AddToComparisonModalProps) {
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComparison, setSelectedComparison] = useState<string | null>(null);
  const [showNewComparison, setShowNewComparison] = useState(false);
  const [newComparisonName, setNewComparisonName] = useState('');
  const [adding, setAdding] = useState(false);

  // Fetch comparisons when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchComparisons();
    }
  }, [isOpen]);

  const fetchComparisons = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getComparisons({ status: 'active', limit: 20 });
      setComparisons(response.comparisons);
    } catch (err: any) {
      setError(err?.message || 'Failed to load comparisons');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    if (!newComparisonName.trim()) {
      setError('Please enter a comparison name');
      return;
    }

    setAdding(true);
    setError(null);

    try {
      // Create new comparison
      const newComparison = await createComparison({
        name: newComparisonName,
        productIds: [product.id],
      });

      // Close modal and notify
      onAdded?.(newComparison.id);
      handleClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create comparison');
    } finally {
      setAdding(false);
    }
  };

  const handleAddToExisting = async (comparisonId: string) => {
    setAdding(true);
    setError(null);

    try {
      await addProductToComparison(comparisonId, { productId: product.id });
      onAdded?.(comparisonId);
      handleClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to add product to comparison');
    } finally {
      setAdding(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedComparison(null);
    setShowNewComparison(false);
    setNewComparisonName('');
    setError(null);
    onClose();
  };

  // Filter comparisons based on search query
  const filteredComparisons = comparisons.filter((comp) =>
    comp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
            Add to Comparison
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0].optimizedUrl || product.images[0].originalUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
              <p className="text-sm text-gray-600">
                ৳{product.salePrice || product.regularPrice.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {!showNewComparison ? (
            <>
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search comparisons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Search comparisons"
                />
              </div>

              {/* Existing Comparisons */}
              <div className="space-y-2">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading comparisons...</p>
                  </div>
                ) : filteredComparisons.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">
                      {searchQuery ? 'No comparisons found' : 'No comparisons yet'}
                    </p>
                  </div>
                ) : (
                  filteredComparisons.map((comparison) => (
                    <button
                      key={comparison.id}
                      onClick={() => handleAddToExisting(comparison.id)}
                      disabled={adding}
                      className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={`Add to ${comparison.name}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{comparison.name}</p>
                          <p className="text-sm text-gray-600">{comparison.itemCount} products</p>
                        </div>
                      </div>
                      <Check className="w-5 h-5 text-gray-400" />
                    </button>
                  ))
                )}
              </div>

              {/* Create New Button */}
              <button
                onClick={() => setShowNewComparison(true)}
                className="w-full mt-4 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Plus className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-700">Create New Comparison</span>
              </button>
            </>
          ) : (
            <>
              {/* Create New Comparison Form */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="comparison-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Comparison Name
                  </label>
                  <input
                    id="comparison-name"
                    type="text"
                    placeholder="e.g., Smartphones Comparison"
                    value={newComparisonName}
                    onChange={(e) => setNewComparisonName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-label="Comparison name"
                    autoFocus
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> This comparison will be created with the current product included.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowNewComparison(false)}
                    disabled={adding}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreateNew}
                    disabled={adding || !newComparisonName.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {adding ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddToComparisonModal;
