/**
 * Address Utility Functions
 * 
 * This module provides utility functions for converting between different address formats
 * used in the checkout flow and profile management.
 * 
 * Key conversions:
 * - Address (from profile) -> ShippingAddress (checkout form)
 * - ShippingAddress (checkout form) -> Address (for saving)
 */

import { Address } from '@/lib/api/profile';
import { getDistrictById } from '@/data/bangladesh-data';

/**
 * Shipping Address interface used in checkout form
 */
export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  postalCode: string;
}

/**
 * Convert a saved Address to ShippingAddress format for checkout form
 * 
 * This handles the field name differences:
 * - firstName + lastName -> fullName
 * - address -> addressLine1
 * - district (ID) -> district (name)
 * 
 * @param savedAddress - The address from the user's saved addresses
 * @returns ShippingAddress formatted for the checkout form
 */
export function addressToShippingAddress(savedAddress: Address): ShippingAddress {
  // Get district name from ID
  const districtData = getDistrictById(savedAddress.district);
  
  // If district data not found, try to use the ID as-is (it might already be a name)
  let districtName = districtData?.name;
  
  // If still no district name, try to look up by name
  if (!districtName && savedAddress.district) {
    // The district field might already be a name, not an ID
    districtName = savedAddress.district;
  }

  return {
    fullName: `${savedAddress.firstName || ''} ${savedAddress.lastName || ''}`.trim(),
    phone: savedAddress.phone?.trim() || '',
    addressLine1: savedAddress.address?.trim() || '',
    addressLine2: savedAddress.addressLine2?.trim() || '',
    city: savedAddress.city?.trim() || '',
    district: districtName?.trim() || '',  // Ensure it's never undefined
    postalCode: savedAddress.postalCode?.trim() || '',
  };
}

/**
 * Convert a ShippingAddress to Address format for saving to profile
 * 
 * This handles the field name differences:
 * - fullName -> firstName + lastName (split on space)
 * - addressLine1 -> address
 * - district (name) -> district (ID) - requires external lookup
 * 
 * @param shippingAddress - The address from the checkout form
 * @param divisionId - The division ID (required for saving)
 * @param districtId - The district ID (required for saving)
 * @returns Partial<Address> formatted for saving
 */
export function shippingAddressToAddress(
  shippingAddress: ShippingAddress,
  divisionId: string,
  districtId: string
): Partial<Address> {
  // Split fullName into firstName and lastName
  const nameParts = shippingAddress.fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return {
    firstName,
    lastName,
    phone: shippingAddress.phone || undefined,
    address: shippingAddress.addressLine1,
    addressLine2: shippingAddress.addressLine2 || undefined,
    city: shippingAddress.city,
    district: districtId,
    division: divisionId,
    postalCode: shippingAddress.postalCode || undefined,
  };
}

/**
 * Validate a shipping address for completeness
 * 
 * @param address - The shipping address to validate
 * @returns Object with isValid flag and errors object
 */
export function validateShippingAddress(address: ShippingAddress): {
  isValid: boolean;
  errors: Partial<ShippingAddress>;
} {
  const errors: Partial<ShippingAddress> = {};

  if (!address.fullName.trim()) {
    errors.fullName = 'Full name is required';
  }

  if (!address.phone.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!/^01[3-9]\d{8}$/.test(address.phone)) {
    errors.phone = 'Invalid phone number format';
  }

  if (!address.addressLine1.trim()) {
    errors.addressLine1 = 'Address is required';
  }

  if (!address.city.trim()) {
    errors.city = 'City is required';
  }

  if (!address.district.trim()) {
    errors.district = 'District is required';
  }

  if (!address.postalCode.trim()) {
    errors.postalCode = 'Postal code is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate a saved Address for completeness
 * 
 * @param address - The address to validate
 * @returns Object with isValid flag and errors object
 */
export function validateAddress(address: Partial<Address>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!address.firstName?.trim()) {
    errors.firstName = 'First name is required';
  }

  if (!address.lastName?.trim()) {
    errors.lastName = 'Last name is required';
  }

  if (!address.address?.trim()) {
    errors.address = 'Address is required';
  }

  if (!address.city?.trim()) {
    errors.city = 'City is required';
  }

  if (!address.district?.trim()) {
    errors.district = 'District is required';
  }

  if (!address.division?.trim()) {
    errors.division = 'Division is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Format address for display
 * 
 * @param address - The address to format
 * @returns Formatted address string
 */
export function formatAddressForDisplay(address: Address | ShippingAddress): string {
  let parts: string[] = [];

  if ('firstName' in address && 'lastName' in address) {
    // Address type
    parts.push(`${address.firstName} ${address.lastName}`);
  } else if ('fullName' in address) {
    // ShippingAddress type
    parts.push(address.fullName);
  }

  if ('address' in address) {
    parts.push(address.address);
  } else if ('addressLine1' in address) {
    parts.push(address.addressLine1);
  }

  if (address.addressLine2) {
    parts.push(address.addressLine2);
  }

  parts.push(address.city);
  parts.push(address.district);

  if (address.postalCode) {
    parts.push(address.postalCode);
  }

  if (address.phone) {
    parts.push(address.phone);
  }

  return parts.join(', ');
}

/**
 * Check if two addresses are the same (ignoring ID and metadata)
 * 
 * @param address1 - First address to compare
 * @param address2 - Second address to compare
 * @returns True if addresses have the same values
 */
export function areAddressesEqual(
  address1: Partial<Address>,
  address2: Partial<Address>
): boolean {
  const fieldsToCompare: (keyof Address)[] = [
    'firstName',
    'lastName',
    'phone',
    'address',
    'addressLine2',
    'city',
    'district',
    'division',
    'postalCode',
  ];

  return fieldsToCompare.every(field => {
    const val1 = address1[field];
    const val2 = address2[field];
    
    // Handle undefined/null comparisons
    if (val1 === undefined || val1 === null) {
      return val2 === undefined || val2 === null;
    }
    if (val2 === undefined || val2 === null) {
      return false;
    }
    
    // Compare as strings (trim and lowercase for consistency)
    return String(val1).trim().toLowerCase() === String(val2).trim().toLowerCase();
  });
}

/**
 * Get a display label for address type
 * 
 * @param type - The address type
 * @param language - Language preference ('en' | 'bn')
 * @returns Display label for the address type
 */
export function getAddressTypeLabel(
  type: 'SHIPPING' | 'BILLING' | 'HOME' | 'WORK' | 'OTHER',
  language: 'en' | 'bn'
): string {
  const labels: Record<string, { en: string; bn: string }> = {
    SHIPPING: { en: 'Shipping', bn: 'শিপিং' },
    BILLING: { en: 'Billing', bn: 'বিলিং' },
    HOME: { en: 'Home', bn: 'বাসা' },
    WORK: { en: 'Work', bn: 'কাজ' },
    OTHER: { en: 'Other', bn: 'অন্যান্য' },
  };
  
  return labels[type]?.[language] || type;
}
