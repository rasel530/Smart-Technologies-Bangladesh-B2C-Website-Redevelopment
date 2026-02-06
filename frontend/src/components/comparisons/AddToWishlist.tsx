/**
 * Add to Wishlist Component
 *
 * Component for adding comparison or individual products to wishlist.
 * Allows creating a new wishlist from comparison.
 */

'use client';

import { useState } from 'react';
import { Heart, Plus, Check, X, ShoppingBag } from 'lucide-react';
import { ProductWithRelations } from '@/types/product';
// BUG-MED-003: Mock data in AddToWishlist.tsx - Import real API client
import { getWishlists, createWishlist, addProductsToWishlist, type Wishlist } from '@/lib/api/wishlist';

interface AddToWishlistProps {
  comparisonProducts: ProductWithRelations[];
  comparisonName: string;
  onAdded?: (wishlistId: string) => void;
  className?: string;
}

export function AddToWishlist({
  comparisonProducts,
  comparisonName,
  onAdded,
  className = '',
}: AddToWishlistProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [selectedWishlist, setSelectedWishlist] = useState<string | null>(null);
  const [showNewWishlist, setShowNewWishlist] = useState(false);
  const [newWishlistName, setNewWishlistName] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  // Initialize all products as selected
  useState(() => {
    const allSelected = new Set<string>();
    comparisonProducts.forEach((p) => allSelected.add(p.id));
    setSelectedProducts(allSelected);
  });

  const handleOpen = () => {
    setIsOpen(true);
    fetchWishlists();
  };

  const handleClose = () => {
    setIsOpen(false);
    setError(null);
    setShowNewWishlist(false);
    setNewWishlistName('');
    setSelectedWishlist(null);
  };

  const fetchWishlists = async () => {
    setLoading(true);
    setError(null);

    try {
      // BUG-MED-003: Mock data in AddToWishlist.tsx - Use real API call
      const response = await getWishlists();
      setWishlists(response.wishlists);
    } catch (err: any) {
      setError(err?.message || 'Failed to load wishlists');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewWishlist = async () => {
    if (!newWishlistName.trim()) {
      setError('Please enter a wishlist name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // BUG-MED-003: Mock data in AddToWishlist.tsx - Use real API call
      const response = await createWishlist({
        name: newWishlistName,
        productIds: Array.from(selectedProducts),
      });

      onAdded?.(response.wishlist.id);
      handleClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToExisting = async (wishlistId: string) => {
    setLoading(true);
    setError(null);

    try {
      // BUG-MED-003: Mock data in AddToWishlist.tsx - Use real API call
      await addProductsToWishlist(wishlistId, Array.from(selectedProducts));

      onAdded?.(wishlistId);
      handleClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to add products to wishlist');
    } finally {
      setLoading(false);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const selectAllProducts = () => {
    const allSelected = new Set<string>();
    comparisonProducts.forEach((p) => allSelected.add(p.id));
    setSelectedProducts(allSelected);
  };

  const deselectAllProducts = () => {
    setSelectedProducts(new Set());
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className={`flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors ${className}`}
        aria-label="Add to wishlist"
      >
        <Heart className="w-4 h-4" />
        <span>Add to Wishlist</span>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
              Add to Wishlist
            </h2>
            <p className="text-sm text-gray-600">
              {comparisonName} • {selectedProducts.size} of {comparisonProducts.length} products selected
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Error Message */}
          {error && (
            <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {!showNewWishlist ? (
            <>
              {/* Product Selection */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Select Products</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllProducts}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAllProducts}
                      className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                  {comparisonProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => toggleProductSelection(product.id)}
                      className={`relative p-2 border-2 rounded-lg transition-colors ${
                        selectedProducts.has(product.id)
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      aria-label={`Select ${product.name}`}
                    >
                        {selectedProducts.has(product.id) && (
                          <div className="absolute top-1 right-1 p-1 bg-pink-600 rounded-full">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className="aspect-square bg-gray-100 rounded overflow-hidden mb-2">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0].optimizedUrl || product.images[0].originalUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-900 line-clamp-2">
                          {product.name}
                        </p>
                      </button>
                  ))}
                </div>
              </div>

              {/* Wishlist Selection */}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Choose Wishlist
                </h3>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading wishlists...</p>
                  </div>
                ) : wishlists.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-4">No wishlists yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {wishlists.map((wishlist) => (
                      <button
                        key={wishlist.id}
                        onClick={() => handleAddToExisting(wishlist.id)}
                        disabled={selectedProducts.size === 0}
                        className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-pink-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Add to ${wishlist.name}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-pink-100 rounded-lg">
                            <Heart className="w-5 h-5 text-pink-600" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-900">{wishlist.name}</p>
                            <p className="text-sm text-gray-600">{wishlist.itemCount} items</p>
                          </div>
                        </div>
                        <Plus className="w-5 h-5 text-gray-400" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Create New Wishlist Button */}
                <button
                  onClick={() => setShowNewWishlist(true)}
                  className="w-full mt-4 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-colors"
                  aria-label="Create new wishlist"
                >
                  <Plus className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-700">Create New Wishlist</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Create New Wishlist Form */}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Create New Wishlist
                </h3>

                <div className="mb-4">
                  <label htmlFor="wishlist-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Wishlist Name
                  </label>
                  <input
                    id="wishlist-name"
                    type="text"
                    placeholder="e.g., Tech Wishlist"
                    value={newWishlistName}
                    onChange={(e) => setNewWishlistName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    aria-label="Wishlist name"
                    autoFocus
                  />
                </div>

                <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-pink-800">
                    <strong>Note:</strong> This wishlist will be created with {selectedProducts.size}{' '}
                    {selectedProducts.size === 1 ? 'product' : 'products'} from this comparison.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowNewWishlist(false)}
                    disabled={loading}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreateNewWishlist}
                    disabled={loading || !newWishlistName.trim() || selectedProducts.size === 0}
                    className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create & Add'}
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

export default AddToWishlist;
