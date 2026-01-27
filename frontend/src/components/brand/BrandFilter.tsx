'use client';

import React, { useState, useEffect } from 'react';
import { BrandWithRelations } from '@/types/brand';
import brandsApi from '@/lib/api/brands';

interface BrandFilterProps {
  onBrandChange?: (brandId: string | null) => void;
  onFeaturedChange?: (isFeatured: boolean | null) => void;
  selectedBrandId?: string | null;
  selectedFeatured?: boolean | null;
  showFeaturedFilter?: boolean;
  showAllOption?: boolean;
  className?: string;
}

/**
 * BrandFilter Component
 * 
 * Provides brand-based product filtering UI with:
 * - Brand selection dropdown
 * - Search functionality
 * - Featured brands filter
 */
export default function BrandFilter({
  onBrandChange,
  onFeaturedChange,
  selectedBrandId,
  selectedFeatured,
  showFeaturedFilter = true,
  showAllOption = true,
  className = ''
}: BrandFilterProps) {
  const [brands, setBrands] = useState<BrandWithRelations[]>([]);
  const [featuredBrands, setFeaturedBrands] = useState<BrandWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'featured'>('all');

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      
      const [allBrands, featured] = await Promise.all([
        brandsApi.getBrands({ limit: 100, status: 'active' }),
        brandsApi.getFeaturedBrands()
      ]);

      setBrands(allBrands.brands);
      setFeaturedBrands(featured.brands);
    } catch (err) {
      console.error('Error fetching brands:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBrands = filterMode === 'featured' ? featuredBrands : brands;

  const displayedBrands = searchTerm
    ? filteredBrands.filter(brand =>
        brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (brand.nameEn && brand.nameEn.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (brand.nameBn && brand.nameBn.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : filteredBrands;

  const handleBrandSelect = (brandId: string | null) => {
    if (onBrandChange) {
      onBrandChange(brandId);
    }
    setIsOpen(false);
  };

  const handleFeaturedToggle = (isFeatured: boolean) => {
    if (onFeaturedChange) {
      onFeaturedChange(isFeatured);
    }
  };

  const selectedBrand = brands.find(b => b.id === selectedBrandId);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Featured Filter Toggle */}
      {showFeaturedFilter && onFeaturedChange && (
        <div className="flex gap-2">
          <button
            onClick={() => {
              handleFeaturedToggle(false);
              setFilterMode('all');
            }}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
              selectedFeatured === false
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-300 hover:shadow-md'
            }`}
          >
            All Brands
          </button>
          <button
            onClick={() => {
              handleFeaturedToggle(true);
              setFilterMode('featured');
            }}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center ${
              selectedFeatured === true
                ? 'bg-yellow-500 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-yellow-300 hover:shadow-md'
            }`}
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Featured
          </button>
        </div>
      )}

      {/* Brand Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        >
          <div className="flex items-center flex-1 min-w-0">
            {selectedBrand ? (
              <>
                {selectedBrand.logoUrl && (
                  <img
                    src={selectedBrand.logoUrl}
                    alt={selectedBrand.name}
                    className="w-8 h-8 object-contain mr-3 flex-shrink-0"
                  />
                )}
                <span className="truncate font-medium">{selectedBrand.name}</span>
                {selectedBrand.isFeatured && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex-shrink-0">
                    Featured
                  </span>
                )}
              </>
            ) : (
              <span className="text-gray-500">
                {showAllOption ? 'All Brands' : 'Select a brand...'}
              </span>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Content */}
            <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-xl max-h-96 overflow-hidden flex flex-col">
              {/* Search */}
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search brands..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Brand List */}
              <div className="overflow-y-auto flex-1">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : displayedBrands.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No brands found
                  </div>
                ) : (
                  <>
                    {showAllOption && (
                      <button
                        onClick={() => handleBrandSelect(null)}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center ${
                          selectedBrandId === null ? 'bg-blue-50' : ''
                        }`}
                      >
                        <span className="font-medium">All Brands</span>
                      </button>
                    )}
                    {displayedBrands.map((brand) => (
                      <button
                        key={brand.id}
                        onClick={() => handleBrandSelect(brand.id)}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center ${
                          selectedBrandId === brand.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        {brand.logoUrl && (
                          <img
                            src={brand.logoUrl}
                            alt={brand.name}
                            className="w-8 h-8 object-contain mr-3 flex-shrink-0"
                          />
                        )}
                        <span className="truncate font-medium flex-1">{brand.name}</span>
                        {brand.isFeatured && (
                          <svg className="w-4 h-4 text-yellow-500 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Selected Brand Info */}
      {selectedBrand && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            {selectedBrand.logoUrl && (
              <img
                src={selectedBrand.logoUrl}
                alt={selectedBrand.name}
                className="w-12 h-12 object-contain mr-3 flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{selectedBrand.name}</p>
              {selectedBrand.description && (
                <p className="text-sm text-gray-600 truncate mt-1">
                  {selectedBrand.description}
                </p>
              )}
              {selectedBrand._count && (
                <p className="text-sm text-blue-600 mt-1">
                  {selectedBrand._count.products} {selectedBrand._count.products === 1 ? 'product' : 'products'}
                </p>
              )}
            </div>
            <button
              onClick={() => handleBrandSelect(null)}
              className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0 ml-2"
              aria-label="Clear brand selection"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
