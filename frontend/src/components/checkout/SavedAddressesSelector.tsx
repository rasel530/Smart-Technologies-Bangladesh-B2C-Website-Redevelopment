'use client';

import React from 'react';
import { MapPin, Plus, Loader2, AlertCircle, Star } from 'lucide-react';
import { Address } from '@/lib/api/profile';
import { getDistrictById } from '@/data/bangladesh-data';
import { getAddressTypeLabel } from '@/lib/utils/address';
import { cn } from '@/lib/utils';

interface SavedAddressesSelectorProps {
  /** List of available addresses to display */
  addresses: Address[];
  
  /** Currently selected address ID */
  selectedAddressId: string | null;
  
  /** Callback when an address is selected */
  onSelect: (address: Address) => void;
  
  /** Callback when user wants to add a new address */
  onAddNew: () => void;
  
  /** Callback when user wants to edit an address */
  onEdit?: (address: Address) => void;
  
  /** Callback when user wants to delete an address */
  onDelete?: (addressId: string) => void;
  
  /** Callback when user wants to set an address as default */
  onSetDefault?: (addressId: string) => void;
  
  /** Current language preference */
  language: 'en' | 'bn';
  
  /** Address type to filter (optional) */
  addressType?: 'SHIPPING' | 'BILLING';
  
  /** Loading state */
  isLoading?: boolean;
  
  /** Error message to display */
  error?: string | null;
  
  /** Maximum number of addresses to display before scrolling */
  maxVisible?: number;
  
  /** CSS class for custom styling */
  className?: string;
  
  /** Show/Hide action buttons (edit, delete, set default) */
  showActions?: boolean;
}

/**
 * SavedAddressesSelector Component
 * 
 * Displays a list of saved addresses that users can select from during checkout.
 * Features:
 * - Clickable address cards with selection indicators
 * - Loading, error, and empty states
 * - Optional action buttons for editing/deleting addresses
 * - Address type filtering
 * - Bilingual support
 */
export const SavedAddressesSelector: React.FC<SavedAddressesSelectorProps> = ({
  addresses,
  selectedAddressId,
  onSelect,
  onAddNew,
  onEdit,
  onDelete,
  onSetDefault,
  language,
  addressType,
  isLoading = false,
  error = null,
  maxVisible = 3,
  className = '',
  showActions = false,
}) => {
  // Filter addresses by type if provided
  const filteredAddresses = React.useMemo(() => {
    let result = addresses;
    if (addressType) {
      result = result.filter(addr => addr.type === addressType || addr.type === 'SHIPPING');
    }
    return result;
  }, [addresses, addressType]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('saved-addresses-selector', className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-600">
            {language === 'en' ? 'Loading addresses...' : 'ঠিকানা লোড হচ্ছে...'}
          </span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('saved-addresses-selector', className)}>
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800">{error}</p>
            <p className="text-xs text-red-600 mt-1">
              {language === 'en' 
                ? 'You can enter your address manually below.' 
                : 'আপনি নিচে আপনার ঠিকানা ম্যানুয়ালি লিখতে পারেন।'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (filteredAddresses.length === 0) {
    return (
      <div className={cn('saved-addresses-selector', className)}>
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <MapPin className="h-8 w-8 text-gray-400" />
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {language === 'en' ? 'No saved addresses' : 'কোনো সংরক্ষিত ঠিকানা নেই'}
          </h3>
          
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            {language === 'en'
              ? 'Save an address to check out faster next time. For now, you can enter your address manually.'
              : 'পরবর্তীবার দ্রুত চেকআউট করতে একটি ঠিকানা সংরক্ষণ করুন। এখন আপনি আপনার ঠিকানা ম্যানুয়ালি লিখতে পারেন।'}
          </p>
          
          <button
            onClick={onAddNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>{language === 'en' ? 'Add New Address' : 'নতুন ঠিকানা যোগ করুন'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn('saved-addresses-selector', className)}
      role="listbox"
      aria-label={language === 'en' ? 'Saved addresses' : 'সংরক্ষিত ঠিকানা'}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {language === 'en' ? 'Saved Addresses' : 'সংরক্ষিত ঠিকানা'}
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({filteredAddresses.length})
          </span>
        </h3>
        <button
          onClick={onAddNew}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          aria-label={language === 'en' ? 'Add new address' : 'নতুন ঠিকানা যোগ করুন'}
        >
          + {language === 'en' ? 'Add New' : 'নতুন যোগ করুন'}
        </button>
      </div>

      {/* Address list */}
      <div 
        className="space-y-3"
        style={{ maxHeight: maxVisible ? `${maxVisible * 160}px` : 'none', overflowY: maxVisible ? 'auto' : 'visible' }}
      >
        {filteredAddresses.map((address) => {
          const district = getDistrictById(address.district);
          const isSelected = address.id === selectedAddressId;
          
          return (
            <div
              key={address.id}
              onClick={() => onSelect(address)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(address);
                }
              }}
              tabIndex={0}
              role="option"
              aria-selected={isSelected}
              className={cn(
                'border rounded-lg p-4 cursor-pointer transition-all duration-200',
                isSelected
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              )}
            >
              {/* Header with type and default badge */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'px-2 py-1 text-xs font-medium rounded',
                    address.type === 'SHIPPING'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  )}>
                    {getAddressTypeLabel(address.type, language)}
                  </span>
                  {address.isDefault && (
                    <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                      <Star className="h-3 w-3 fill-current" />
                      <span>{language === 'en' ? 'Default' : 'ডিফল্ট'}</span>
                    </span>
                  )}
                </div>
                
                {/* Selection indicator */}
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                  isSelected ? 'border-blue-600' : 'border-gray-300'
                )}>
                  {isSelected && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  )}
                </div>
              </div>

              {/* Address Details */}
              <div className="space-y-1">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {address.firstName} {address.lastName}
                    </p>
                    {address.phone && (
                      <p className="text-xs text-gray-600">
                        {address.phone}
                      </p>
                    )}
                    <p className="text-sm text-gray-700">
                      {address.address}
                    </p>
                    {address.addressLine2 && (
                      <p className="text-sm text-gray-700">
                        {address.addressLine2}
                      </p>
                    )}
                    <p className="text-sm text-gray-700">
                      {address.city}
                    </p>
                    <p className="text-sm text-gray-700">
                      {district && (language === 'bn' ? district.nameBn : district.name)}
                    </p>
                    {address.postalCode && (
                      <p className="text-xs text-gray-600">
                        {language === 'en' ? 'Postal Code' : 'পোস্টাল কোড'}: {address.postalCode}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {showActions && (
                <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-gray-100">
                  {!address.isDefault && onSetDefault && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetDefault(address.id);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title={language === 'en' ? 'Set as default address' : 'ডিফল্ট ঠিকানা হিসেবে সেট করুন'}
                    >
                      <Star className="h-3.5 w-3.5" />
                      <span>{language === 'en' ? 'Set Default' : 'ডিফল্ট সেট করুন'}</span>
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(address);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      title={language === 'en' ? 'Edit address' : 'ঠিকানা সম্পাদনা করুন'}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{language === 'en' ? 'Edit' : 'সম্পাদনা'}</span>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(
                          language === 'en'
                            ? 'Are you sure you want to delete this address?'
                            : 'আপনি কি এই ঠিকানাটি মুছে ফেলতে চান?'
                        )) {
                          onDelete(address.id);
                        }
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title={language === 'en' ? 'Delete address' : 'ঠিকানা মুছে ফেলুন'}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{language === 'en' ? 'Delete' : 'মুছে ফেলুন'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add new address button (if not in header) */}
      {filteredAddresses.length < maxVisible && (
        <button
          onClick={onAddNew}
          className="w-full mt-4 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" />
          <span>{language === 'en' ? 'Add New Address' : 'নতুন ঠিকানা যোগ করুন'}</span>
        </button>
      )}
    </div>
  );
};

export default SavedAddressesSelector;
