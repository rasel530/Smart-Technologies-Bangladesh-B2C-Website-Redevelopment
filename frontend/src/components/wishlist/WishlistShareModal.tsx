/**
 * WishlistShareModal Component
 *
 * Modal for sharing wishlists with others
 */

'use client';

import React, { useState, useCallback } from 'react';
import { wishlistMessages } from '@/types/wishlist';
import type { WishlistShareModalProps } from '@/types/wishlist';

export const WishlistShareModal: React.FC<WishlistShareModalProps> = ({
  isOpen,
  onClose,
  wishlist,
  shareUrl,
  onGenerateShare,
  onCopyLink,
  language = 'en',
}) => {
  const [isCopying, setIsCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const messages = wishlistMessages[language];
  
  const handleCopyLink = useCallback(async () => {
    try {
      setIsCopying(true);
      await onCopyLink();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } finally {
      setIsCopying(false);
    }
  }, [onCopyLink]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="modal-content share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{messages.shareWishlist}</h2>
          <button
            onClick={onClose}
            className="close-button"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div className="share-info">
            <h3>{wishlist.name}</h3>
            <p className="share-description">
              Share this wishlist with others using the link below
            </p>
          </div>
          
          {!shareUrl ? (
            <button
              onClick={() => onGenerateShare()}
              className="button button-primary generate-link-button"
            >
              Generate Share Link
            </button>
          ) : (
            <div className="share-link-container">
              <div className="share-link-input">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="share-url-input"
                />
                <button
                  onClick={handleCopyLink}
                  disabled={isCopying}
                  className="copy-button"
                  title="Copy link to clipboard"
                >
                  {isCopying ? (
                    <span className="loading-spinner" />
                  ) : copied ? (
                    <span>✓</span>
                  ) : (
                    <span>📋</span>
                  )}
                </button>
              </div>
              
              {copied && (
                <p className="success-message">
                  {messages.success.shared}
                </p>
              )}
              
              <div className="share-options">
                <h4>Share via</h4>
                <div className="share-buttons">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-button facebook"
                    aria-label="Share on Facebook"
                  >
                    Facebook
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out my wishlist: ${wishlist.name}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-button twitter"
                    aria-label="Share on Twitter"
                  >
                    Twitter
                  </a>
                  <a
                    href={`mailto:?subject=${encodeURIComponent(`Check out my wishlist: ${wishlist.name}`)}&body=${encodeURIComponent(shareUrl)}`}
                    className="share-button email"
                    aria-label="Share via email"
                  >
                    Email
                  </a>
                </div>
              </div>
            </div>
          )}
          
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="button button-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WishlistShareModal;
