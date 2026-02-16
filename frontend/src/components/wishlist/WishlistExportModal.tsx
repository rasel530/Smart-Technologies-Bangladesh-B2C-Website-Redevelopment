/**
 * WishlistExportModal Component
 *
 * Modal for exporting wishlists to CSV or PDF
 */

'use client';

import React, { useState, useCallback } from 'react';
import { wishlistMessages, type ExportOptions } from '@/types/wishlist';
import type { WishlistExportModalProps } from '@/types/wishlist';

export const WishlistExportModal: React.FC<WishlistExportModalProps> = ({
  isOpen,
  onClose,
  wishlistId,
  onExport,
  language = 'en',
}) => {
  const [format, setFormat] = useState<'csv' | 'pdf'>('csv');
  const [options, setOptions] = useState<ExportOptions>({
    includeImages: true,
    includeDescriptions: true,
    includePrices: true,
    includeStockStatus: true,
  });
  const [isExporting, setIsExporting] = useState(false);
  
  const messages = wishlistMessages[language];
  
  const handleOptionChange = useCallback((key: keyof ExportOptions) => {
    setOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);
  
  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true);
      await onExport(format, options);
      onClose();
    } finally {
      setIsExporting(false);
    }
  }, [format, options, onExport, onClose]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="modal-content export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{messages.exportWishlist}</h2>
          <button
            onClick={onClose}
            className="close-button"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div className="export-formats">
            <h3>Export Format</h3>
            <div className="format-options">
              <label className="format-option">
                <input
                  type="radio"
                  name="export-format"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={(e) => setFormat(e.target.value as 'csv' | 'pdf')}
                />
                <div className="format-info">
                  <span className="format-name">CSV</span>
                  <span className="format-description">
                    Spreadsheet compatible format
                  </span>
                </div>
              </label>
              
              <label className="format-option">
                <input
                  type="radio"
                  name="export-format"
                  value="pdf"
                  checked={format === 'pdf'}
                  onChange={(e) => setFormat(e.target.value as 'csv' | 'pdf')}
                />
                <div className="format-info">
                  <span className="format-name">PDF</span>
                  <span className="format-description">
                    Printable document format
                  </span>
                </div>
              </label>
            </div>
          </div>
          
          <div className="export-options">
            <h3>Include in Export</h3>
            <div className="option-list">
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={options.includeImages}
                  onChange={() => handleOptionChange('includeImages')}
                />
                <span>Product Images</span>
              </label>
              
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={options.includeDescriptions}
                  onChange={() => handleOptionChange('includeDescriptions')}
                />
                <span>Product Descriptions</span>
              </label>
              
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={options.includePrices}
                  onChange={() => handleOptionChange('includePrices')}
                />
                <span>Prices</span>
              </label>
              
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={options.includeStockStatus}
                  onChange={() => handleOptionChange('includeStockStatus')}
                />
                <span>Stock Status</span>
              </label>
            </div>
          </div>
          
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="button button-secondary"
              disabled={isExporting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="button button-primary"
              disabled={isExporting}
            >
              {isExporting ? (
                <span className="loading-spinner" />
              ) : (
                `Export as ${format.toUpperCase()}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WishlistExportModal;
