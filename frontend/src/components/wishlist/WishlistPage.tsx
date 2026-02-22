/**
 * WishlistPage Component
 *
 * Main wishlist page component with all functionality
 * Features: sticky header, responsive grid, toast notifications, mobile CTA
 */

'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import './WishlistPage.css';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { WishlistHeader } from './WishlistHeader';
import { WishlistToolbar } from './WishlistToolbar';
import { WishlistGrid } from './WishlistGrid';
import { WishlistEmptyState } from './WishlistEmptyState';
import { WishlistManagementModal } from './WishlistManagementModal';
import { WishlistShareModal } from './WishlistShareModal';
import { WishlistExportModal } from './WishlistExportModal';
import { CartWishlistSyncIndicator } from '@/components/cartWishlist/CartWishlistSyncIndicator';
import { useCartWishlistStore } from '@/store/cartWishlistStore';
import type { WishlistPageProps } from '@/types/wishlist';

export const WishlistPage: React.FC<WishlistPageProps> = ({
  initialWishlistId,
  language = 'en',
}) => {
  const router = useRouter();
  const {
    wishlists,
    currentWishlist,
    currentWishlistItems,
    isLoading,
    error,
    selectedItems,
    isPrivateWishlistError,
    privateWishlistId,
    loadWishlists,
    setCurrentWishlist,
    createWishlist,
    deleteWishlist,
    shareWishlist,
    exportWishlist,
    setSelectedItems,
    clearSelection,
    selectAll,
    clearError,
    makeWishlistPublic,
    moveToCart,
    removeFromWishlist,
  } = useWishlistContext();

  // Get cart context for refreshing cart after move operations
  const { loadCart } = useCart();

  // Get sync status from store
  const offlineQueue = useCartWishlistStore((state) => state.offlineQueue);
  
  // Local state for UI
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('addedAt-desc');
  const [filterBy, setFilterBy] = useState('all');
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isBulkMoving, setIsBulkMoving] = useState(false);
  const [isBulkRemoving, setIsBulkRemoving] = useState(false);
  const [isMobileCtaVisible, setIsMobileCtaVisible] = useState(true);
  const [isMakingPublic, setIsMakingPublic] = useState(false);
  
  // Handler to make wishlist public
  const handleMakePublic = useCallback(async () => {
    if (!privateWishlistId) return;
    
    setIsMakingPublic(true);
    try {
      await makeWishlistPublic(privateWishlistId);
      toast.success('Wishlist is now public');
    } catch (error) {
      toast.error('Failed to make wishlist public');
    } finally {
      setIsMakingPublic(false);
    }
  }, [privateWishlistId, makeWishlistPublic]);

  // Ref for deduplication of initial wishlist setting
  const hasSetInitialWishlist = useRef(false);
  
  // Set initial wishlist only once - either from props or default wishlist
  useEffect(() => {
    // Skip if already set or still loading
    if (hasSetInitialWishlist.current || isLoading) return;
    
    if (initialWishlistId && wishlists.length > 0) {
      // Use initialWishlistId if provided and exists
      const exists = wishlists.find((w) => w.id === initialWishlistId);
      if (exists) {
        setCurrentWishlist(initialWishlistId);
        hasSetInitialWishlist.current = true;
      }
    } else if (!currentWishlist && wishlists.length > 0) {
      // Auto-select default wishlist if no wishlist is selected
      const defaultWishlist = wishlists.find((w) => w.isDefault);
      if (defaultWishlist) {
        setCurrentWishlist(defaultWishlist.id);
      } else {
        // Fallback to first wishlist
        setCurrentWishlist(wishlists[0].id);
      }
      hasSetInitialWishlist.current = true;
    }
  }, [initialWishlistId, wishlists, currentWishlist, setCurrentWishlist, isLoading]);
  
  // Filter and sort items
  const filteredItems = useMemo(() => {
    let items = [...currentWishlistItems];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.product.name.toLowerCase().includes(query) ||
          item.product.sku.toLowerCase().includes(query)
      );
    }
    
    if (filterBy === 'inStock') {
      items = items.filter((item) => item.product.stockQuantity > 0);
    } else if (filterBy === 'outOfStock') {
      items = items.filter((item) => item.product.stockQuantity === 0);
    }
    
    switch (sortBy) {
      case 'name-asc':
        items.sort((a, b) => a.product.name.localeCompare(b.product.name));
        break;
      case 'name-desc':
        items.sort((a, b) => b.product.name.localeCompare(a.product.name));
        break;
      case 'price-asc':
        items.sort((a, b) => a.product.regularPrice - b.product.regularPrice);
        break;
      case 'price-desc':
        items.sort((a, b) => b.product.regularPrice - a.product.regularPrice);
        break;
      default:
        items.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    }
    
    return items;
  }, [currentWishlistItems, searchQuery, sortBy, filterBy]);
  
  const handleSelectWishlist = useCallback(
    async (id: string) => {
      await setCurrentWishlist(id);
      clearSelection();
    },
    [setCurrentWishlist, clearSelection]
  );
  
  const handleShareWishlist = useCallback(async () => {
    if (!currentWishlist) return;
    try {
      const url = await shareWishlist(currentWishlist.id);
      setShareUrl(url);
      setIsShareModalOpen(true);
      toast.success('Share link generated successfully');
    } catch (error) {
      toast.error('Failed to generate share link');
    }
  }, [currentWishlist, shareWishlist]);
  
  const handleCreateWishlist = useCallback(async () => {
    setIsManagementModalOpen(true);
  }, []);
  
  const handleExportWishlist = useCallback(() => {
    setIsExportModalOpen(true);
  }, []);
  
  const handleSelectItem = useCallback((itemId: string) => {
    setSelectedItems(
      selectedItems.includes(itemId)
        ? selectedItems.filter((id) => id !== itemId)
        : [...selectedItems, itemId]
    );
  }, [selectedItems, setSelectedItems]);
  
  const handleRemoveItem = useCallback(async (itemId: string) => {
    const item = currentWishlistItems.find((i) => i.id === itemId);
    if (!item) return;

    try {
      await removeFromWishlist(itemId);
      toast.success(`Removed "${item.product.name}" from wishlist`);
    } catch (error) {
      toast.error('Failed to remove item from wishlist');
    }
  }, [currentWishlistItems, removeFromWishlist]);
  
  const handleMoveToCart = useCallback(async (itemId: string) => {
    const item = currentWishlistItems.find((i) => i.id === itemId);
    if (!item) return;

    // Check stock first
    if (item.product.stockQuantity === 0) {
      toast.error('This item is out of stock');
      return;
    }

    try {
      await moveToCart([itemId]);
      // Refresh cart state to update prices and totals
      await loadCart();
      toast.success(`Added "${item.product.name}" to cart`);
    } catch (error) {
      toast.error('Failed to add item to cart');
    }
  }, [currentWishlistItems, moveToCart, loadCart]);
  
  const handleMoveSelectedToCart = useCallback(async () => {
    if (selectedItems.length === 0) return;

    // Check stock for all selected items
    const outOfStockItems = selectedItems.filter((itemId) => {
      const item = currentWishlistItems.find((i) => i.id === itemId);
      return item && item.product.stockQuantity === 0;
    });

    if (outOfStockItems.length > 0) {
      toast.error('Some items are out of stock');
      return;
    }

    try {
      setIsBulkMoving(true);
      await moveToCart(selectedItems);
      // Refresh cart state to update prices and totals
      await loadCart();
      toast.success(`Moved ${selectedItems.length} items to cart`);
      clearSelection();
    } catch (error) {
      toast.error('Failed to move items to cart');
    } finally {
      setIsBulkMoving(false);
    }
  }, [selectedItems, currentWishlistItems, moveToCart, clearSelection, loadCart]);
  
  const handleRemoveSelected = useCallback(async () => {
    if (selectedItems.length === 0) return;

    try {
      setIsBulkRemoving(true);
      for (const itemId of selectedItems) {
        const item = currentWishlistItems.find((i) => i.id === itemId);
        if (item) {
          await removeFromWishlist(itemId);
        }
      }
      toast.success(`Removed ${selectedItems.length} items from wishlist`);
      clearSelection();
    } catch (error) {
      toast.error('Failed to remove items from wishlist');
    } finally {
      setIsBulkRemoving(false);
    }
  }, [selectedItems, currentWishlistItems, clearSelection, removeFromWishlist]);
  
  const isAllSelected =
    filteredItems.length > 0 &&
    filteredItems.every((item) => selectedItems.includes(item.id));
  
  // Display error if present
  if (error) {
    return (
      <div className="wishlist-page error-state">
        <div className="error-content">
          <h2>Error Loading Wishlist</h2>
          <p>{error}</p>
          {isPrivateWishlistError ? (
            <div className="private-wishlist-actions">
              <p className="private-wishlist-info">
                This appears to be your private wishlist. Would you like to make it public to view it?
              </p>
              <button 
                onClick={handleMakePublic} 
                className="make-public-button"
                disabled={isMakingPublic}
              >
                {isMakingPublic ? 'Making Public...' : 'Make Public'}
              </button>
              <button onClick={clearError} className="cancel-button">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={clearError} className="retry-button">
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="wishlist-page">
      {/* Sticky Header */}
      <header className="wishlist-page-header">
        <div className="flex items-start justify-between flex-wrap gap-4 w-full">
          <div className="flex-1">
            <WishlistHeader
              wishlists={wishlists}
              currentWishlist={currentWishlist}
              onSelectWishlist={handleSelectWishlist}
              onCreateWishlist={handleCreateWishlist}
              onShareWishlist={handleShareWishlist}
              onExportWishlist={handleExportWishlist}
              isLoading={isLoading}
              language={language}
            />
          </div>
          {/* Sync Status Indicator */}
          <CartWishlistSyncIndicator language={language} />
        </div>
      </header>
      
      {/* Main Content */}
      <main className="wishlist-main-content">
        {currentWishlist && (
          <WishlistToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            filterBy={filterBy}
            onFilterChange={setFilterBy}
            selectedCount={selectedItems.length}
            onMoveSelectedToCart={handleMoveSelectedToCart}
            onRemoveSelected={handleRemoveSelected}
            onSelectAll={selectAll}
            onClearSelection={clearSelection}
            isAllSelected={isAllSelected}
            totalItems={currentWishlistItems.length}
            isBulkMoving={isBulkMoving}
            isBulkRemoving={isBulkRemoving}
            language={language}
          />
        )}
        
        {isLoading ? (
          <div className="wishlist-loading">
            <div className="loading-spinner" />
            <p>Loading wishlist...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <WishlistEmptyState
            hasFilters={searchQuery !== '' || filterBy !== 'all'}
            onClearFilters={() => {
              setSearchQuery('');
              setFilterBy('all');
            }}
            language={language}
          />
        ) : (
          <WishlistGrid
            items={filteredItems}
            selectedItems={selectedItems}
            onSelectItem={handleSelectItem}
            onRemoveItem={handleRemoveItem}
            onMoveToCart={handleMoveToCart}
            onViewProduct={(productSlug) => {
              router.push(`/products/${productSlug}`);
            }}
            isLoading={isLoading}
            language={language}
          />
        )}
      </main>
      
      {/* Mobile Sticky CTA Bar */}
      {selectedItems.length > 0 && isMobileCtaVisible && (
        <div className="mobile-sticky-cta" role="region" aria-label="Bulk actions for selected items">
          <div className="cta-content">
            <span className="selected-count">
              {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'} selected
            </span>
            <div className="cta-actions">
              <button
                onClick={handleMoveSelectedToCart}
                className="cta-button cta-primary"
                aria-label="Move selected items to cart"
                disabled={isBulkMoving}
              >
                {isBulkMoving ? (
                  <span className="loading-spinner-small" />
                ) : (
                  'Move to Cart'
                )}
              </button>
              <button
                onClick={handleRemoveSelected}
                className="cta-button cta-secondary"
                aria-label="Remove selected items"
                disabled={isBulkRemoving}
              >
                {isBulkRemoving ? (
                  <span className="loading-spinner-small" />
                ) : (
                  'Remove'
                )}
              </button>
            </div>
            <button
              onClick={() => setIsMobileCtaVisible(false)}
              className="cta-close-button"
              aria-label="Close bulk actions"
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Modals */}
      <WishlistManagementModal
        isOpen={isManagementModalOpen}
        onClose={() => setIsManagementModalOpen(false)}
        mode="create"
        onSuccess={async (data) => {
          try {
            await createWishlist(data.name, data.isPublic);
            toast.success('Wishlist created successfully');
          } catch (error) {
            toast.error('Failed to create wishlist');
          }
        }}
        language={language}
      />
      
      <WishlistShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        wishlist={currentWishlist!}
        shareUrl={shareUrl}
        onGenerateShare={handleShareWishlist}
        onCopyLink={() => {
          if (shareUrl) {
            navigator.clipboard.writeText(shareUrl);
            toast.success('Link copied to clipboard');
          }
        }}
        language={language}
      />
      
      <WishlistExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        wishlistId={currentWishlist?.id || ''}
        onExport={async (format, options) => {
          if (currentWishlist) {
            try {
              await exportWishlist(format, options);
              toast.success('Wishlist exported successfully');
            } catch (error) {
              toast.error('Failed to export wishlist');
            }
          }
        }}
        language={language}
      />
    </div>
  );
};

export default WishlistPage;
