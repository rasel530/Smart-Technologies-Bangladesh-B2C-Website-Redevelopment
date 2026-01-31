/**
 * ImageAltTextEditor Component (Admin)
 * 
 * Inline alt text editing for each image with Bengali and English language tabs,
 * character counter, auto-generate from product name, validation,
 * save on blur or Enter key, error messages, and bulk management.
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ProductImage } from '@/types/product-image';
import { getImageUrl, getAltText } from '@/lib/api/product-images';
import { useImageUpdate, useAltTextGenerator } from '@/hooks/useProductImages';

interface ImageAltTextEditorProps {
  image: ProductImage;
  onUpdate: (imageId: string, altTextBn: string, altTextEn: string) => void;
  productName?: string;
}

/**
 * ImageAltTextEditor Component
 * 
 * @param image - Image to edit
 * @param onUpdate - Callback on update
 * @param productName - Product name for auto-generation
 */
export const ImageAltTextEditor: React.FC<ImageAltTextEditorProps> = ({
  image,
  onUpdate,
  productName
}) => {
  const { updating, updateImage } = useImageUpdate();
  const { generateAltText } = useAltTextGenerator();
  
  const [language, setLanguage] = useState<'bn' | 'en'>('en');
  const [altTextBn, setAltTextBn] = useState(image.altTextBn || '');
  const [altTextEn, setAltTextEn] = useState(image.altTextEn || '');
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const MAX_ALT_TEXT_LENGTH = 250;

  // Reset form when image changes
  useEffect(() => {
    setAltTextBn(image.altTextBn || '');
    setAltTextEn(image.altTextEn || '');
    setError(null);
    setShowSuccess(false);
    setIsDirty(false);
  }, [image.id, image.altTextBn, image.altTextEn]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Validate alt text
  const validateAltText = useCallback((text: string): { isValid: boolean; error?: string } => {
    if (!text || text.trim().length === 0) {
      return { isValid: false, error: 'Alt text cannot be empty' };
    }

    if (text.length > MAX_ALT_TEXT_LENGTH) {
      return { isValid: false, error: `Alt text cannot exceed ${MAX_ALT_TEXT_LENGTH} characters` };
    }

    // Check for meaningful content (not just spaces or special characters)
    const meaningfulChars = text.replace(/[\s\W_]/g, '');
    if (meaningfulChars.length < 3) {
      return { isValid: false, error: 'Alt text must contain meaningful content' };
    }

    return { isValid: true };
  }, []);

  // Handle auto-generate
  const handleAutoGenerate = useCallback(() => {
    const generatedText = generateAltText(productName || 'Product', language);
    if (language === 'bn') {
      setAltTextBn(generatedText);
    } else {
      setAltTextEn(generatedText);
    }
    setIsDirty(true);
  }, [productName, language, generateAltText]);

  // Handle save
  const handleSave = useCallback(async () => {
    const currentText = language === 'bn' ? altTextBn : altTextEn;
    const validation = validateAltText(currentText);

    if (!validation.isValid) {
      setError(validation.error || 'Invalid alt text');
      return;
    }

    setError(null);
    
    const updatedImage = await updateImage(image.id, {
      altTextBn,
      altTextEn
    });

    if (updatedImage) {
      onUpdate(image.id, altTextBn, altTextEn);
      setShowSuccess(true);
      setIsDirty(false);
      
      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
    }
  }, [image.id, altTextBn, altTextEn, language, validateAltText, updateImage, onUpdate]);

  // Handle blur
  const handleBlur = useCallback(() => {
    if (isDirty) {
      handleSave();
    }
  }, [isDirty, handleSave]);

  // Handle Enter key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  }, [handleSave]);

  // Handle input change
  const handleChange = useCallback((value: string) => {
    if (language === 'bn') {
      setAltTextBn(value);
    } else {
      setAltTextEn(value);
    }
    setIsDirty(true);
    setError(null);
    setShowSuccess(false);
  }, [language]);

  const currentText = language === 'bn' ? altTextBn : altTextEn;
  const characterCount = currentText.length;
  const isOverLimit = characterCount > MAX_ALT_TEXT_LENGTH;

  return (
    <div className="space-y-4">
      {/* Image Preview */}
      <div className="relative w-32 h-32 bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <Image
          src={getImageUrl(image, 'thumbnail')}
          alt={getAltText(image) || 'Image preview'}
          fill
          className="object-cover"
          sizes="128px"
        />
        {image.isPrimary && (
          <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
            Primary
          </div>
        )}
      </div>

      {/* Language Tabs */}
      <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
        <button
          type="button"
          onClick={() => setLanguage('bn')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            language === 'bn'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          বাংলা (Bengali)
        </button>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            language === 'en'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          English
        </button>
      </div>

      {/* Alt Text Input */}
      <div className="space-y-2">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={currentText}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={`Enter alt text (${language === 'bn' ? 'বাংলা' : 'English'})`}
            maxLength={MAX_ALT_TEXT_LENGTH}
            className={`w-full px-4 py-3 border-2 rounded-lg text-sm transition-colors focus:outline-none ${
              error
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-500'
                : isOverLimit
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-500'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-blue-500 dark:focus:border-blue-500'
            } text-gray-900 dark:text-gray-100`}
            disabled={updating}
          />
          
          {/* Auto-generate Button */}
          {productName && (
            <button
              type="button"
              onClick={handleAutoGenerate}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              title="Auto-generate from product name"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7m9-11l-7 7h7v7m-7-7l-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Character Counter */}
        <div className="flex items-center justify-between">
          <span className={`text-xs ${
            isOverLimit
              ? 'text-red-600 dark:text-red-400'
              : characterCount > MAX_ALT_TEXT_LENGTH * 0.8
              ? 'text-orange-600 dark:text-orange-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {characterCount} / {MAX_ALT_TEXT_LENGTH} characters
          </span>
          
          {/* Save Status */}
          {updating && (
            <span className="text-xs text-blue-600 dark:text-blue-400">
              Saving...
            </span>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">
            {error}
          </p>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-400">
            Alt text updated successfully
          </p>
        </div>
      )}

      {/* Validation Hint */}
      {!error && !showSuccess && !isDirty && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            Press Enter or click outside to save changes
          </p>
        </div>
      )}

      {/* Alt Text Preview */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Preview:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Bengali:
            </p>
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {altTextBn || <span className="text-gray-400 italic">Not set</span>}
            </p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              English:
            </p>
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {altTextEn || <span className="text-gray-400 italic">Not set</span>}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageAltTextEditor;
