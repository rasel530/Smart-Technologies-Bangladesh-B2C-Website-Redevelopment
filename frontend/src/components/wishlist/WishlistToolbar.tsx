/**
 * WishlistToolbar Component
 *
 * Toolbar with search, sort, filter, and bulk actions
 */

'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { wishlistMessages } from '@/types/wishlist';
import { CartWishlistSyncIndicator } from '@/components/cartWishlist/CartWishlistSyncIndicator';
import type { WishlistToolbarProps } from '@/types/wishlist';

export const WishlistToolbar: React.FC<WishlistToolbarProps> = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  filterBy,
  onFilterChange,
  selectedCount,
  onMoveSelectedToCart,
  onRemoveSelected,
  onSelectAll,
  onClearSelection,
  isAllSelected,
  totalItems,
  isBulkMoving = false,
  isBulkRemoving = false,
  language = 'en',
}) => {
  const messages = wishlistMessages[language];
  
  const handleSelectAll = () => {
    if (isAllSelected) {
      // Deselect all items
      onClearSelection();
    } else {
      onSelectAll();
    }
  };
  
  return (
    <div className="wishlist-toolbar">
      <div className="toolbar-left">
        {/* Sync Status Indicator */}
        <CartWishlistSyncIndicator language={language} />
        <div className="search-box">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={messages.searchPlaceholder}
            className="search-input"
            aria-label="Search wishlist items"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <div className="filter-group">
          <select
            value={filterBy}
            onChange={(e) => onFilterChange(e.target.value)}
            className="filter-select"
            aria-label="Filter items"
          >
            <option value="all">{messages.allItems}</option>
            <option value="inStock">{messages.inStock}</option>
            <option value="outOfStock">{messages.outOfStock}</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="sort-select"
            aria-label="Sort items"
          >
            <option value="addedAt-desc">
              {messages.addedDate} (Newest)
            </option>
            <option value="addedAt-asc">
              {messages.addedDate} (Oldest)
            </option>
            <option value="name-asc">{messages.name} (A-Z)</option>
            <option value="name-desc">{messages.name} (Z-A)</option>
            <option value="price-asc">{messages.price} (Low to High)</option>
            <option value="price-desc">{messages.price} (High to Low)</option>
          </select>
        </div>
      </div>
      
      <div className="toolbar-right">
        {selectedCount > 0 && (
          <>
            <div className="selection-info">
              <button
                onClick={handleSelectAll}
                className="select-all-button"
                aria-label={isAllSelected ? 'Deselect all' : 'Select all'}
                aria-pressed={isAllSelected}
                role="checkbox"
              >
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  readOnly
                  aria-hidden="true"
                />
                <span className="selection-count">
                  {isAllSelected
                    ? `${totalItems} ${messages.itemsSelected}`
                    : `${selectedCount} ${selectedCount === 1 ? messages.itemSelected : messages.itemsSelected}`
                  }
                </span>
              </button>
            </div>
            
            <button
              onClick={onMoveSelectedToCart}
              className="toolbar-button move-to-cart-button"
              title={messages.moveToCart}
              disabled={isBulkMoving}
              aria-label={messages.moveToCart}
              aria-busy={isBulkMoving}
            >
              {isBulkMoving ? (
                <span className="loading-spinner-small" />
              ) : (
                <>
                  <span className="button-icon">🛒</span>
                  <span className="button-text">{messages.moveToCart}</span>
                </>
              )}
            </button>
            
            <button
              onClick={onRemoveSelected}
              className="toolbar-button remove-button"
              title={messages.removeFromWishlist}
              disabled={isBulkRemoving}
              aria-label={messages.removeFromWishlist}
              aria-busy={isBulkRemoving}
            >
              {isBulkRemoving ? (
                <span className="loading-spinner-small" />
              ) : (
                <>
                  <span className="button-icon">🗑️</span>
                  <span className="button-text">Remove</span>
                </>
              )}
            </button>
          </>
        )}
        
        {selectedCount === 0 && totalItems > 0 && (
          <button
            onClick={onSelectAll}
            className="toolbar-button select-all-toolbar-button"
            title={messages.selectAll}
          >
            <input
              type="checkbox"
              checked={false}
              readOnly
            />
            <span className="button-text">{messages.selectAll}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default WishlistToolbar;
