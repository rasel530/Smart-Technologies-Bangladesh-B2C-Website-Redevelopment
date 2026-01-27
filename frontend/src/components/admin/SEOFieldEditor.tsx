'use client';

import React, { useState } from 'react';
import { Product } from '@/types/product';
import productsApi from '@/lib/api/products';

interface SEOFieldEditorProps {
  product: Product;
  onUpdate: () => void;
}

const SEOFieldEditor: React.FC<SEOFieldEditorProps> = ({ product, onUpdate }) => {
  const [seoData, setSeoData] = useState({
    metaTitle: product.metaTitle || '',
    metaDescription: product.metaDescription || '',
    metaKeywords: product.metaKeywords || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await productsApi.updateSEO(product.id, seoData);
      onUpdate();
    } catch (error) {
      console.error('Error saving SEO:', error);
      alert('Failed to save SEO fields');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof typeof seoData, value: string) => {
    setSeoData(prev => ({ ...prev, [field]: value }));
  };

  const getPreview = () => {
    const title = seoData.metaTitle || product.name;
    const description = seoData.metaDescription || product.shortDescription || product.description || '';
    const url = `https://smarttech.com/products/${product.slug}`;
    
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <p className="text-sm text-gray-500 mb-2">Google Search Preview</p>
        <div className="space-y-2">
          <div>
            <p className="text-blue-600 text-lg font-medium hover:underline cursor-pointer">
              {title}
            </p>
            <p className="text-green-700 text-sm">{url}</p>
          </div>
          {description && (
            <p className="text-gray-700 text-sm line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">SEO Settings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SEO Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Title
            </label>
            <input
              type="text"
              value={seoData.metaTitle}
              onChange={(e) => handleChange('metaTitle', e.target.value)}
              maxLength={60}
              placeholder="Product name for SEO"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                {seoData.metaTitle.length}/60 characters
              </p>
              <p className={`text-xs ${
                seoData.metaTitle.length > 50 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {seoData.metaTitle.length > 50 ? 'Getting long' : 'Good length'}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Description
            </label>
            <textarea
              value={seoData.metaDescription}
              onChange={(e) => handleChange('metaDescription', e.target.value)}
              rows={3}
              maxLength={160}
              placeholder="Brief description of the product for search engines"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                {seoData.metaDescription.length}/160 characters
              </p>
              <p className={`text-xs ${
                seoData.metaDescription.length > 140 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {seoData.metaDescription.length > 140 ? 'Getting long' : 'Good length'}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Keywords
            </label>
            <input
              type="text"
              value={seoData.metaKeywords}
              onChange={(e) => handleChange('metaKeywords', e.target.value)}
              placeholder="keyword1, keyword2, keyword3"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate keywords with commas
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save SEO'}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          {getPreview()}

          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <p className="text-sm font-medium text-gray-700 mb-3">SEO Tips</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Use unique, descriptive titles (50-60 characters)</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Write compelling descriptions (140-160 characters)</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Include relevant keywords naturally</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Avoid keyword stuffing</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Make it unique for each product</span>
              </li>
            </ul>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <p className="text-sm font-medium text-gray-700 mb-3">Current Values</p>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Product Slug:</span>
                <p className="text-gray-900 font-mono">{product.slug}</p>
              </div>
              <div>
                <span className="text-gray-500">Canonical URL:</span>
                <p className="text-gray-900 font-mono text-xs break-all">
                  https://smarttech.com/products/{product.slug}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SEOFieldEditor;
