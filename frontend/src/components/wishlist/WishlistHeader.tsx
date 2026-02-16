/**
 * WishlistHeader Component
 *
 * Header component for wishlist page with navigation
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { wishlistMessages } from '@/types/wishlist';
import type { WishlistHeaderProps } from '@/types/wishlist';

export const WishlistHeader: React.FC<WishlistHeaderProps> = ({
  wishlists,
  currentWishlist,
  onSelectWishlist,
  onCreateWishlist,
  onShareWishlist,
  onExportWishlist,
  isLoading,
  language = 'en',
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const messages = wishlistMessages[language];
  
  const handleSelectWishlist = async (id: string) => {
    setIsDropdownOpen(false);
    await onSelectWishlist(id);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    // Close dropdown on Escape key
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isDropdownOpen) {
        setIsDropdownOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isDropdownOpen]);
  
  return (
    <div className="wishlist-header">
      <div className="header-left">
        <h1 className="page-title">{messages.title}</h1>
        
        {wishlists.length > 0 && (
          <div className="wishlist-selector" ref={dropdownRef}>
            <button
              ref={buttonRef}
              className="selector-button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-expanded={isDropdownOpen}
              aria-haspopup="listbox"
              aria-controls="wishlist-dropdown-list"
              id="wishlist-selector-button"
            >
              <span className="selected-wishlist-name">
                {currentWishlist?.name || 'Select Wishlist'}
              </span>
              <span className="dropdown-arrow" aria-hidden="true">▼</span>
            </button>
            
            {isDropdownOpen && (
              <div 
                className="wishlist-dropdown open"
                id="wishlist-dropdown-list"
                role="listbox"
                aria-labelledby="wishlist-selector-button"
              >
                <ul role="listbox">
                  {wishlists.map((wishlist) => (
                    <li
                      key={wishlist.id}
                      role="option"
                      aria-selected={currentWishlist?.id === wishlist.id}
                      tabIndex={currentWishlist?.id === wishlist.id ? 0 : -1}
                      onClick={() => handleSelectWishlist(wishlist.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectWishlist(wishlist.id);
                        }
                      }}
                      className={`wishlist-option ${
                        currentWishlist?.id === wishlist.id ? 'selected' : ''
                      }`}
                    >
                      <span className="wishlist-name">{wishlist.name}</span>
                      <span className="wishlist-count">
                        {wishlist.itemCount} items
                      </span>
                      {wishlist.isDefault && (
                        <span className="default-badge">Default</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="header-right">
        {currentWishlist && (
          <>
            <button
              onClick={onShareWishlist}
              className="header-button share-button"
              title={messages.shareWishlist}
              disabled={isLoading}
            >
              <span className="button-icon">🔗</span>
              <span className="button-text">{messages.shareWishlist}</span>
            </button>
            
            <button
              onClick={onExportWishlist}
              className="header-button export-button"
              title={messages.exportWishlist}
              disabled={isLoading}
            >
              <span className="button-icon">📥</span>
              <span className="button-text">{messages.exportWishlist}</span>
            </button>
          </>
        )}
        
        <button
          onClick={onCreateWishlist}
          className="header-button create-button"
          title={messages.createWishlist}
          disabled={isLoading}
        >
          <span className="button-icon">+</span>
          <span className="button-text">{messages.createWishlist}</span>
        </button>
      </div>
    </div>
  );
};

export default WishlistHeader;
