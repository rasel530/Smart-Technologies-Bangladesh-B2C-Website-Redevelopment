'use client';

import React from 'react';

interface BrandSEO {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
}

interface BrandSEOEditorProps {
  brandId?: string;
  initialSEO: BrandSEO;
  onSEOChange: (seo: Partial<BrandSEO>) => void;
}

/**
 * BrandSEOEditor Component
 * 
 * Inline SEO editor for brands with:
 * - Meta title with character counter (60 max)
 * - Meta description with character counter (160 max)
 * - Meta keywords input
 * - Live character count
 * - SEO guidelines
 */
export const BrandSEOEditor: React.FC<BrandSEOEditorProps> = ({
  brandId,
  initialSEO,
  onSEOChange
}) => {
  const handleMetaTitleChange = (value: string) => {
    onSEOChange({ metaTitle: value });
  };

  const handleMetaDescriptionChange = (value: string) => {
    onSEOChange({ metaDescription: value });
  };

  const handleMetaKeywordsChange = (value: string) => {
    onSEOChange({ metaKeywords: value });
  };

  const getCharacterCountColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage > 100) return 'text-red-600';
    if (percentage > 90) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">
        SEO Settings
      </h2>

      <div className="space-y-6">
        {/* Meta Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meta Title
            <span className="text-gray-400 font-normal ml-1">(Recommended: 50-60 characters)</span>
          </label>
          <input
            type="text"
            value={initialSEO.metaTitle || ''}
            onChange={(e) => handleMetaTitleChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Brand name - Your Store"
            maxLength={60}
          />
          <div className="flex justify-between mt-1">
            <p className={`text-xs ${getCharacterCountColor(initialSEO.metaTitle.length, 60)}`}>
              {initialSEO.metaTitle.length}/60 characters
            </p>
            {initialSEO.metaTitle.length > 60 && (
              <p className="text-xs text-red-600">Too long - may be truncated in search results</p>
            )}
          </div>
        </div>

        {/* Meta Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meta Description
            <span className="text-gray-400 font-normal ml-1">(Recommended: 150-160 characters)</span>
          </label>
          <textarea
            value={initialSEO.metaDescription || ''}
            onChange={(e) => handleMetaDescriptionChange(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Brief description of the brand and what it offers..."
            maxLength={160}
          />
          <div className="flex justify-between mt-1">
            <p className={`text-xs ${getCharacterCountColor(initialSEO.metaDescription.length, 160)}`}>
              {initialSEO.metaDescription.length}/160 characters
            </p>
            {initialSEO.metaDescription.length > 160 && (
              <p className="text-xs text-red-600">Too long - may be truncated in search results</p>
            )}
          </div>
        </div>

        {/* Meta Keywords */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meta Keywords
            <span className="text-gray-400 font-normal ml-1">(Comma-separated)</span>
          </label>
          <input
            type="text"
            value={initialSEO.metaKeywords || ''}
            onChange={(e) => handleMetaKeywordsChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="brand, electronics, technology, quality"
          />
          <p className="text-xs text-gray-500 mt-1">
            Separate keywords with commas (e.g., brand, category, product)
          </p>
        </div>

        {/* SEO Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">SEO Tips</h3>
          <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
            <li>Include the brand name in the meta title</li>
            <li>Write a compelling meta description that encourages clicks</li>
            <li>Use relevant keywords naturally</li>
            <li>Keep titles under 60 characters and descriptions under 160</li>
            <li>Make descriptions unique for each brand</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
