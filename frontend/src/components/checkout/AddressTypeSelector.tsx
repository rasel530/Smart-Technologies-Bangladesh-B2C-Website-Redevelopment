'use client';

import React from 'react';
import { Home, Briefcase, MapPin, CreditCard, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AddressType } from '@/hooks/useAddressManagement';

interface AddressTypeSelectorProps {
  /** Currently selected address type */
  selectedType: AddressType;
  
  /** Callback when address type is selected */
  onSelect: (type: AddressType) => void;
  
  /** Current language preference */
  language: 'en' | 'bn';
  
  /** CSS class for custom styling */
  className?: string;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Show validation hints */
  showValidationHints?: boolean;
  
  /** Available address types (optional, defaults to all) */
  availableTypes?: AddressType[];
}

/**
 * Address type configuration with icons and labels
 */
const ADDRESS_TYPES: Record<
  AddressType,
  {
    icon: React.ReactNode;
    label: { en: string; bn: string };
    description: { en: string; bn: string };
    color: string;
  }
> = {
  SHIPPING: {
    icon: <MapPin className="h-5 w-5" />,
    label: { en: 'Shipping', bn: 'শিপিং' },
    description: { en: 'Delivery address for orders', bn: 'অর্ডারের জন্য ডেলিভারি ঠিকানা' },
    color: 'blue',
  },
  BILLING: {
    icon: <CreditCard className="h-5 w-5" />,
    label: { en: 'Billing', bn: 'বিলিং' },
    description: { en: 'Address for invoices and receipts', bn: 'ইনভয়েস এবং রসিদের জন্য ঠিকানা' },
    color: 'purple',
  },
  HOME: {
    icon: <Home className="h-5 w-5" />,
    label: { en: 'Home', bn: 'বাসা' },
    description: { en: 'Your home address', bn: 'আপনার বাড়ির ঠিকানা' },
    color: 'green',
  },
  WORK: {
    icon: <Briefcase className="h-5 w-5" />,
    label: { en: 'Work', bn: 'কাজ' },
    description: { en: 'Your work address', bn: 'আপনার কর্মস্থলের ঠিকানা' },
    color: 'orange',
  },
  OTHER: {
    icon: <MoreHorizontal className="h-5 w-5" />,
    label: { en: 'Other', bn: 'অন্যান্য' },
    description: { en: 'Any other address type', bn: 'অন্য কোনো ঠিকানার ধরন' },
    color: 'gray',
  },
};

/**
 * Color classes for each address type
 */
const COLOR_CLASSES: Record<string, { bg: string; border: string; text: string; hover: string }> = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    hover: 'hover:border-blue-300 hover:bg-blue-100',
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-800',
    hover: 'hover:border-purple-300 hover:bg-purple-100',
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    hover: 'hover:border-green-300 hover:bg-green-100',
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-800',
    hover: 'hover:border-orange-300 hover:bg-orange-100',
  },
  gray: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-800',
    hover: 'hover:border-gray-300 hover:bg-gray-100',
  },
};

/**
 * AddressTypeSelector Component
 *
 * Allows users to select an address type from available options.
 * Features:
 * - Icon-based selection for each address type
 * - Bilingual support (English/Bangla)
 * - Mobile-friendly with touch-friendly controls
 * - Visual feedback for selected state
 * - Optional validation hints
 *
 * @example
 * ```tsx
 * <AddressTypeSelector
 *   selectedType="SHIPPING"
 *   onSelect={(type) => setAddressType(type)}
 *   language="en"
 * />
 * ```
 */
export const AddressTypeSelector: React.FC<AddressTypeSelectorProps> = ({
  selectedType,
  onSelect,
  language,
  className = '',
  disabled = false,
  showValidationHints = false,
  availableTypes,
}) => {
  // Use all address types if not specified
  const types = availableTypes || Object.keys(ADDRESS_TYPES) as AddressType[];

  return (
    <div className={cn('address-type-selector', className)}>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        {language === 'en' ? 'Address Type' : 'ঠিকানার ধরন'}
      </label>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {types.map((type) => {
          const config = ADDRESS_TYPES[type];
          const colors = COLOR_CLASSES[config.color];
          const isSelected = selectedType === type;
          
          return (
            <button
              key={type}
              type="button"
              onClick={() => !disabled && onSelect(type)}
              disabled={disabled}
              className={cn(
                'relative flex items-start gap-3 p-4 border-2 rounded-lg transition-all duration-200',
                'min-h-[88px]', // Touch-friendly height (44px minimum tap target)
                'text-left',
                isSelected
                  ? `${colors.bg} ${colors.border} ${colors.text} ring-2 ring-offset-2 ring-${config.color}-500`
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300',
                disabled && 'opacity-50 cursor-not-allowed',
                !disabled && !isSelected && colors.hover
              )}
              aria-pressed={isSelected}
              aria-label={`${config.label[language]} - ${config.description[language]}`}
            >
              {/* Icon */}
              <div className={cn(
                'flex-shrink-0 p-2 rounded-lg',
                isSelected ? colors.bg : 'bg-gray-100'
              )}>
                <span className={cn(
                  'transition-colors',
                  isSelected ? colors.text : 'text-gray-600'
                )}>
                  {config.icon}
                </span>
              </div>
              
              {/* Label and Description */}
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-semibold">
                  {config.label[language]}
                </span>
                <span className="block text-xs mt-0.5 opacity-80">
                  {config.description[language]}
                </span>
              </div>
              
              {/* Selection indicator */}
              {isSelected && (
                <div className={cn(
                  'absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center',
                  colors.bg,
                  colors.text
                )}>
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Validation hints */}
      {showValidationHints && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            {language === 'en'
              ? 'Select the type of address you want to save. This helps you organize your addresses for different purposes.'
              : 'আপনি যে ধরনের ঠিকানা সংরক্ষণ করতে চান তা নির্বাচন করুন। এটি আপনাকে বিভিন্ন উদ্দেশ্যে আপনার ঠিকানাগুলি সংগঠিত করতে সাহায্য করে।'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AddressTypeSelector;
