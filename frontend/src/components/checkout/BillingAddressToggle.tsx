'use client';

import React from 'react';
import { CreditCard, MapPin } from 'lucide-react';
import { ShippingAddress } from '@/lib/utils/address';

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
}

export const BillingAddressToggle: React.FC<BillingAddressToggleProps> = ({
  isSameAsShipping,
  onToggle,
  shippingAddress,
  language = 'en',
  className = '',
  isDisabled = false,
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
