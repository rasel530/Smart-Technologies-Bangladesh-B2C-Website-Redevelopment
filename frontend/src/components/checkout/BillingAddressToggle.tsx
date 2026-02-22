'use client';

import React from 'react';
import { CreditCard, MapPin } from 'lucide-react';
import { ShippingAddress } from '@/lib/utils/address';
import { cn } from '@/lib/utils';

interface BillingAddressToggleProps {
  /** Current toggle state */
  isSameAsShipping: boolean;
  
  /** Callback when toggle changes */
  onToggle: (isSame: boolean) => void;
  
  /** Shipping address data (for display) */
  shippingAddress: ShippingAddress;
  
  /** Current language */
  language?: 'en' | 'bn';
  
  /** CSS class for custom styling */
  className?: string;
  
  /** Disabled state */
  isDisabled?: boolean;
  
  /** Address type for context */
  addressType?: 'SHIPPING' | 'BILLING' | 'HOME' | 'WORK' | 'OTHER';
}

export const BillingAddressToggle: React.FC<BillingAddressToggleProps> = ({
  isSameAsShipping,
  onToggle,
  shippingAddress,
  language = 'en',
  className = '',
  isDisabled = false,
  addressType,
}) => {
  const texts = {
    en: {
      sameAddress: 'Same address for billing',
      sameAddressDescription: 'Your billing address will be the same as your shipping address',
      billingAddress: 'Billing Address',
      shippingAddress: 'Shipping Address',
      sameAsShipping: 'Same as shipping',
    },
    bn: {
      sameAddress: 'বিলিংয়ের জন্য একই ঠিকানা',
      sameAddressDescription: 'আপনার বিলিং ঠিকানা আপনার শিপিং ঠিকানার মতোই হবে',
      billingAddress: 'বিলিং ঠিকানা',
      shippingAddress: 'শিপিং ঠিকানা',
      sameAsShipping: 'শিপিং এর মতোই',
    },
  };

  const t = texts[language];

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

  return (
    <div className={`billing-address-toggle ${className}`}>
      {/* Toggle checkbox */}
      <label 
        className={`
          flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors
          ${isSameAsShipping ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-300'}
        `}
      >
        <input
          type="checkbox"
          checked={isSameAsShipping}
          onChange={(e) => !isDisabled && onToggle(e.target.checked)}
          disabled={isDisabled}
          className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-offset-0"
          aria-label={t.sameAddress}
        />
        <div className="flex-1">
          <span className="font-medium text-gray-900">
            {t.sameAddress}
          </span>
          <p className="text-sm text-gray-500 mt-1">
            {t.sameAddressDescription}
          </p>
        </div>
      </label>
      
      {/* Address preview when same as shipping */}
      {isSameAsShipping && (
        <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {t.shippingAddress}
                </span>
                {addressType && (
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded',
                    addressType === 'SHIPPING' ? 'bg-blue-100 text-blue-800' :
                    addressType === 'BILLING' ? 'bg-purple-100 text-purple-800' :
                    addressType === 'HOME' ? 'bg-green-100 text-green-800' :
                    addressType === 'WORK' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  )}>
                    {getAddressTypeLabel(addressType)}
                  </span>
                )}
                <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded">
                  {t.sameAsShipping}
                </span>
              </div>
              <p className="text-sm text-gray-900 font-medium">
                {shippingAddress.fullName}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {shippingAddress.addressLine1}
                {shippingAddress.addressLine2 && `, ${shippingAddress.addressLine2}`}
              </p>
              <p className="text-sm text-gray-600">
                {shippingAddress.city}, {shippingAddress.district} {shippingAddress.postalCode}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {shippingAddress.phone}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingAddressToggle;
