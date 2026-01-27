'use client';

import React, { useState, useEffect } from 'react';
import { Search, Building2, Check, X } from 'lucide-react';
import { Brand } from '@/types/brand';

interface ProductBrandManagerProps {
  productId: string;
  brands: Brand[];
  selectedBrandId?: string;
  onBrandSelect: (brandId: string) => Promise<void>;
  className?: string;
}

export const ProductBrandManager: React.FC<ProductBrandManagerProps> = ({
  productId,
  brands,
  selectedBrandId,
  onBrandSelect,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>(brands);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleBrandSelect = async (brandId: string) => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      await onBrandSelect(brandId);
    } finally {
      setIsSaving(false);
    }
  };

  const getBrandLogoUrl = (brand: Brand) => {
    if (brand.logoUrl) {
      return brand.logoUrl;
    }
    return null;
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">
              Product Brand
            </h3>
          </div>
          <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200">
            {brands.length} brand{brands.length !== 1 ? 's' : ''} available
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Select a brand for this product
        </p>
      </div>

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
      <div className="max-h-80 overflow-y-auto p-2">
        {filteredBrands.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No brands found matching "{searchQuery}"
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {filteredBrands.map(brand => {
              const isSelected = selectedBrandId === brand.id;
              const logoUrl = getBrandLogoUrl(brand);
              
              return (
                <button
                  key={brand.id}
                  onClick={() => handleBrandSelect(brand.id)}
                  disabled={isSaving}
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
                      {isSelected ? (
                        <Check className="w-4 h-4 text-blue-600" />
                      ) : (
                        <X className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    {brand.nameEn && (
                      <div className="text-sm text-gray-500">
                        {brand.nameEn}
                      </div>
                    )}
                    {brand.status === 'active' && (
                      <div className="text-xs text-green-600 font-medium">
                        Active
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Brand Info */}
      {selectedBrandId && (
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
          {(() => {
            const selectedBrand = brands.find(b => b.id === selectedBrandId);
            if (!selectedBrand) return null;
            
            return (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Building2 className="w-4 h-4" />
                  <span>
                    Selected: <strong>{selectedBrand.name}</strong>
                  </span>
                  {selectedBrand.isFeatured && (
                    <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">
                      Featured
                    </span>
                  )}
                </div>
                {selectedBrand.websiteUrl && (
                  <a
                    href={selectedBrand.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Website →
                  </a>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Footer */}
      {isSaving && (
        <div className="bg-blue-50 border-t border-blue-200 px-6 py-3 text-center">
          <div className="text-blue-600 font-medium">
            Saving brand assignment...
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductBrandManager;
