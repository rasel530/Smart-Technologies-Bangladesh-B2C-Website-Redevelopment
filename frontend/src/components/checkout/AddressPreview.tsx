'use client';

import React from 'react';
import { Truck, CreditCard, Edit2, ArrowRight } from 'lucide-react';
import { Address } from '@/lib/api/profile';
import { ShippingAddress } from '@/lib/utils/address';
import { cn } from '@/lib/utils';

interface AddressPreviewProps {
  /** Address to display */
  address: ShippingAddress | Address | null;
  
  /** Callback when user wants to change address */
  onChange: () => void;
  
  /** Callback when user wants to edit the address */
  onEdit?: () => void;
  
  /** Current language */
  language: 'en' | 'bn';
  
  /** Variant/Type of address */
  type?: 'shipping' | 'billing';
  
  /** Address type label (optional) */
  addressType?: 'SHIPPING' | 'BILLING' | 'HOME' | 'WORK' | 'OTHER';
  
  /** CSS class for custom styling */
  className?: string;
  
  /** Show edit button */
  showEditButton?: boolean;
  
  /** Show validation status */
  validationStatus?: 'valid' | 'warning' | 'error' | 'none';
}

/**
 * AddressPreview Component
 * 
 * Displays a preview of the selected address with edit/change buttons.
 * Handles both ShippingAddress (checkout form) and Address (saved address) formats.
 * 
 * Features:
 * - Bilingual support
 * - Icon based on address type (shipping/billing)
 * - Edit and change buttons
 * - Handles null address state
 */
export const AddressPreview: React.FC<AddressPreviewProps> = ({
  address,
  onChange,
  onEdit,
  language,
  type = 'shipping',
  addressType,
  className = '',
  showEditButton = true,
  validationStatus,
}) => {
  // Normalize address format for display
  const displayAddress = React.useMemo(() => {
    if (!address) return null;

    if ('firstName' in address && 'lastName' in address) {
      // Address type (from saved addresses)
      return {
        name: `${address.firstName} ${address.lastName}`,
        phone: address.phone,
        line1: address.address,
        line2: address.addressLine2,
        city: address.city,
        district: address.district,
        postalCode: address.postalCode,
      };
    } else if ('fullName' in address) {
      // ShippingAddress type (from checkout form)
      return {
        name: address.fullName,
        phone: address.phone,
        line1: address.addressLine1,
        line2: address.addressLine2,
        city: address.city,
        district: address.district,
        postalCode: address.postalCode,
      };
    }
    return null;
  }, [address]);

  // Get address type label
  const getAddressTypeLabel = (type?: string): string => {
    if (!type) return '';
    const labels: Record<string, { en: string; bn: string }> = {
      SHIPPING: { en: 'Shipping', bn: 'শিপিং' },
      BILLING: { en: 'Billing', bn: 'বিলিং' },
      HOME: { en: 'Home', bn: 'বাসা' },
      WORK: { en: 'Work', bn: 'কাজ' },
      OTHER: { en: 'Other', bn: 'অন্যান্য' },
    };
    return labels[type]?.[language] || type;
  };

  // Get validation status color
  const getValidationStatusColor = (status?: string): string => {
    if (!status) return 'hidden';
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'hidden';
    }
  };

  // No address selected state
  if (!displayAddress) {
    return (
      <div className={cn('address-preview', className)}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {type === 'shipping' ? (
              <Truck className="h-5 w-5 text-gray-400" />
            ) : (
              <CreditCard className="h-5 w-5 text-gray-400" />
            )}
            <h4 className="font-medium text-gray-900">
              {type === 'shipping' 
                ? (language === 'en' ? 'Shipping Address' : 'শিপিং ঠিকানা')
                : (language === 'en' ? 'Billing Address' : 'বিলিং ঠিকানা')}
            </h4>
          </div>
          
          <button
            onClick={onChange}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            {language === 'en' ? 'Select' : 'নির্বাচন করুন'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        
        <div className="mt-3 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            {language === 'en' 
              ? 'No address selected. Please select an address from your saved addresses or enter a new one.'
              : 'কোনো ঠিকানা নির্বাচিত হয়নি। অনুগ্রহ করে আপনার সংরক্ষিত ঠিকানা থেকে একটি ঠিকানা নির্বাচন করুন বা একটি নতুন ঠিকানা লিখুন।'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('address-preview', className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {type === 'shipping' ? (
            <Truck className="h-5 w-5 text-blue-600" />
          ) : (
            <CreditCard className="h-5 w-5 text-purple-600" />
          )}
          <h4 className="font-medium text-gray-900">
            {type === 'shipping' 
              ? (language === 'en' ? 'Shipping Address' : 'শিপিং ঠিকানা')
              : (language === 'en' ? 'Billing Address' : 'বিলিং ঠিকানা')}
          </h4>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onChange}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {language === 'en' ? 'Change' : 'পরিবর্তন করুন'}
          </button>
          {showEditButton && onEdit && (
            <button
              onClick={onEdit}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>{language === 'en' ? 'Edit' : 'সম্পাদনা'}</span>
            </button>
          )}
        </div>
      </div>
      
      <div className="mt-3 p-4 bg-gray-50 rounded-lg">
        {/* Address type label */}
        {addressType && (
          <span className={cn(
            'inline-block px-2 py-1 text-xs font-medium rounded mb-2',
            addressType === 'SHIPPING' ? 'bg-blue-100 text-blue-800' :
            addressType === 'BILLING' ? 'bg-purple-100 text-purple-800' :
            addressType === 'HOME' ? 'bg-green-100 text-green-800' :
            addressType === 'WORK' ? 'bg-orange-100 text-orange-800' :
            'bg-gray-100 text-gray-800'
          )}>
            {getAddressTypeLabel(addressType)}
          </span>
        )}
        
        {/* Validation status */}
        {validationStatus && validationStatus !== 'none' && (
          <span className={cn(
            'inline-block px-2 py-1 text-xs font-medium rounded ml-2',
            getValidationStatusColor(validationStatus)
          )}>
            {language === 'en' ? validationStatus : (validationStatus === 'valid' ? 'বৈধ' : validationStatus === 'warning' ? 'সতর্কতা' : 'অবৈধ')}
          </span>
        )}
        
        <p className="font-medium text-gray-900">{displayAddress.name}</p>
        <p className="text-gray-600 mt-1">{displayAddress.line1}</p>
        {displayAddress.line2 && (
          <p className="text-gray-600">{displayAddress.line2}</p>
        )}
        <p className="text-gray-600">
          {displayAddress.city}, {displayAddress.district} {displayAddress.postalCode}
        </p>
        {displayAddress.phone && (
          <p className="text-gray-600 mt-1">{displayAddress.phone}</p>
        )}
      </div>
    </div>
  );
};

export default AddressPreview;
