/**
 * WishlistManagementModal Component
 *
 * Modal for creating and editing wishlists
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { wishlistMessages, type CreateWishlistRequest } from '@/types/wishlist';
import type { WishlistManagementModalProps } from '@/types/wishlist';

export const WishlistManagementModal: React.FC<WishlistManagementModalProps> = ({
  isOpen,
  onClose,
  mode,
  wishlist,
  onSuccess,
  language = 'en',
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messages = wishlistMessages[language];
  
  // Initialize form with wishlist data when editing
  useEffect(() => {
    if (mode === 'edit' && wishlist) {
      setName(wishlist.name);
      setDescription(wishlist.description || '');
      setIsPublic(wishlist.isPublic);
    } else {
      setName('');
      setDescription('');
      setIsPublic(false);
    }
    setError(null);
  }, [mode, wishlist, isOpen]);
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Wishlist name is required');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const wishlistData = {
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic,
        isDefault: false,
      };
      
      await onSuccess(wishlistData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save wishlist');
    } finally {
      setIsLoading(false);
    }
  }, [name, description, isPublic, onSuccess, onClose]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {mode === 'create' ? messages.createWishlist : messages.editWishlist}
          </h2>
          <button
            onClick={onClose}
            className="close-button"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="error-message">{error}</div>
          )}
          
          <div className="form-group">
            <label htmlFor="wishlist-name">
              Name <span className="required">*</span>
            </label>
            <input
              id="wishlist-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Wishlist"
              maxLength={100}
              required
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="wishlist-description">
              Description
            </label>
            <textarea
              id="wishlist-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for your wishlist"
              rows={3}
              maxLength={500}
            />
          </div>
          
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <span>Make this wishlist public</span>
            </label>
            <p className="help-text">
              Public wishlists can be shared with others via a link
            </p>
          </div>
          
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="button button-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? (
                <span className="loading-spinner" />
              ) : mode === 'create' ? (
                messages.createWishlist
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WishlistManagementModal;
