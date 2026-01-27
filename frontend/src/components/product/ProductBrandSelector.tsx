'use client';

import React, { useState, useEffect } from 'react';
import { Search, Building2, Check } from 'lucide-react';
import { Brand } from '@/types/brand';

interface ProductBrandSelectorProps {
  brands: Brand[];
  selectedBrandId?: string;
  onBrandSelect: (brandId: string) => void;
  className?: string;
}

export const ProductBrandSelector: React.FC<ProductBrandSelectorProps> = ({
  brands,
  selectedBrandId,
  onBrandSelect,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>(brands);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredBrands(brands);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = brands.filter(brand => 
      brand.name.toLowerCase().includes(query) ||
      brand.nameEn?.toLowerCase().includes(query) ||
      brand.nameBn?.includes(query)
    );
    setFilteredBrands(filtered);
  }, [searchQuery, brands]);

  const getBrandLogoUrl = (brand: Brand) => {
    if (brand.logoUrl) {
      return brand.logoUrl;
    }
    return null;
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Brand List */}
      <div className="max-h-80 overflow-y-auto">
        {filteredBrands.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No brands found matching "{searchQuery}"
          </div>
        ) : (
          <div className="p-2 grid grid-cols-1 gap-2">
            {filteredBrands.map(brand => {
              const isSelected = selectedBrandId === brand.id;
              const logoUrl = getBrandLogoUrl(brand);
              
              return (
                <button
                  key={brand.id}
                  onClick={() => onBrandSelect(brand.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  {/* Brand Logo */}
                  <div className="w-12 h-12 flex-shrink-0 bg-white rounded-md border border-gray-200 flex items-center justify-center overflow-hidden">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={brand.name}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <Building2 className="w-6 h-6 text-gray-400" />
                    )}
                  </div>

                  {/* Brand Info */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${
                        isSelected ? 'text-blue-700' : 'text-gray-900'
                      }`}>
                        {brand.name}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    {brand.nameEn && (
                      <div className="text-sm text-gray-500">
                        {brand.nameEn}
                      </div>
                    )}
                    {brand.websiteUrl && (
                      <a
                        href={brand.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Visit website
                      </a>
                    )}
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Brand Info */}
      {selectedBrandId && (
        <div className="p-3 bg-gray-50 border-t border-gray-200">
          {(() => {
            const selectedBrand = brands.find(b => b.id === selectedBrandId);
            if (!selectedBrand) return null;
            
            return (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Building2 className="w-4 h-4" />
                <span>
                  Selected: <strong>{selectedBrand.name}</strong>
                </span>
                {selectedBrand.description && (
                  <span className="text-gray-500">
                    - {selectedBrand.description.substring(0, 100)}
                    {selectedBrand.description.length > 100 ? '...' : ''}
                  </span>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default ProductBrandSelector;
