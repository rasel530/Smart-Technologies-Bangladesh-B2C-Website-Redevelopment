/**
 * useAddressManagement Hook
 *
 * Custom hook for managing user addresses with support for multiple address types.
 * Provides CRUD operations, validation, and address type management for checkout and profile.
 *
 * Features:
 * - Fetch addresses by type (Shipping, Billing, Home, Work, Other)
 * - Create, update, delete addresses
 * - Set default address by type
 * - Real-time validation with Bangladesh-specific rules
 * - Integration with address API
 *
 * @example
 * ```tsx
 * const {
 *   addresses,
 *   shippingAddresses,
 *   billingAddresses,
 *   homeAddresses,
 *   isLoading,
 *   error,
 *   createAddress,
 *   updateAddress,
 *   deleteAddress,
 *   setDefaultAddress,
 *   validateAddress,
 * } = useAddressManagement();
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Address, AddressAPI, CreateAddressRequest, UpdateAddressRequest } from '@/lib/api/profile';

/**
 * Address type enum for type-safe address type handling
 */
export type AddressType = 'SHIPPING' | 'BILLING' | 'HOME' | 'WORK' | 'OTHER';

/**
 * Validation result interface
 */
export interface AddressValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  errorsBn: Record<string, string>;
}

/**
 * Address validation rules for Bangladesh
 */
export interface AddressValidationRules {
  phone: {
    pattern: RegExp;
    message: string;
    messageBn: string;
  };
  postalCode: {
    pattern: RegExp;
    message: string;
    messageBn: string;
  };
  addressLine1: {
    minLength: number;
    maxLength: number;
    message: string;
    messageBn: string;
  };
  addressLine2: {
    maxLength: number;
    message: string;
    messageBn: string;
  };
}

/**
 * Bangladesh address validation rules
 */
const BANGLADESH_VALIDATION_RULES: AddressValidationRules = {
  phone: {
    pattern: /^(?:\+880|0)?1[3-9]\d{8}$/,
    message: 'Invalid phone number format. Use: +8801XXXXXXXXX or 01XXXXXXXXX',
    messageBn: 'অবৈধ ফোন নম্বর ফরম্যাট। ব্যবহার করুন: +8801XXXXXXXXX বা 01XXXXXXXXX',
  },
  postalCode: {
    pattern: /^\d{4}$/,
    message: 'Postal code must be 4 digits',
    messageBn: 'পোস্টাল কোড ৪ সংখ্যার হতে হবে',
  },
  addressLine1: {
    minLength: 3,
    maxLength: 100,
    message: 'Address must be between 3 and 100 characters',
    messageBn: 'ঠিকানা ৩ থেকে ১০০ অক্ষরের মধ্যে হতে হবে',
  },
  addressLine2: {
    maxLength: 100,
    message: 'Address line 2 must not exceed 100 characters',
    messageBn: 'ঠিকানা লাইন ২ ১০০ অক্ষরের বেশি হতে পারবে না',
  },
};

/**
 * Extended address type with validation status
 */
export interface AddressWithValidation extends Address {
  validationStatus?: 'valid' | 'warning' | 'error';
  validationErrors?: string[];
}

/**
 * Hook state interface
 */
interface UseAddressManagementState {
  addresses: Address[];
  isLoading: boolean;
  error: string | null;
  operationLoading: {
    create: boolean;
    update: string | null;
    delete: string | null;
    setDefault: string | null;
  };
}

/**
 * Hook return type
 */
export interface UseAddressManagementReturn extends UseAddressManagementState {
  // Filtered addresses by type
  shippingAddresses: Address[];
  billingAddresses: Address[];
  homeAddresses: Address[];
  workAddresses: Address[];
  otherAddresses: Address[];
  defaultShippingAddress: Address | null;
  defaultBillingAddress: Address | null;
  defaultHomeAddress: Address | null;
  defaultWorkAddress: Address | null;
  
  // Actions
  fetchAddresses: () => Promise<void>;
  fetchAddressesByType: (type: AddressType) => Promise<Address[]>;
  createAddress: (data: CreateAddressRequest) => Promise<Address>;
  updateAddress: (addressId: string, data: UpdateAddressRequest) => Promise<Address>;
  deleteAddress: (addressId: string) => Promise<void>;
  setDefaultAddress: (addressId: string, type?: AddressType) => Promise<Address>;
  
  // Validation
  validateAddress: (data: Partial<CreateAddressRequest>) => AddressValidationResult;
  validateField: (field: string, value: string) => string | null;
  
  // Helpers
  getAddressById: (addressId: string) => Address | undefined;
  getDefaultAddressByType: (type: AddressType) => Address | null;
  getValidationRules: () => AddressValidationRules;
}

/**
 * useAddressManagement Hook
 *
 * Main hook for address management with full CRUD operations and validation.
 */
export const useAddressManagement = (): UseAddressManagementReturn => {
  const { user } = useAuth();
  
  const [state, setState] = useState<UseAddressManagementState>({
    addresses: [],
    isLoading: false,
    error: null,
    operationLoading: {
      create: false,
      update: null,
      delete: null,
      setDefault: null,
    },
  });

  /**
   * Fetch all addresses for the current user
   */
  const fetchAddresses = useCallback(async () => {
    if (!user?.id) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const addresses = await AddressAPI.getAddresses(user.id);
      setState(prev => ({ ...prev, addresses, isLoading: false }));
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to fetch addresses';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
    }
  }, [user?.id]);

  /**
   * Fetch addresses by type
   */
  const fetchAddressesByType = useCallback(async (type: AddressType): Promise<Address[]> => {
    if (!user?.id) return [];

    try {
      const allAddresses = await AddressAPI.getAddresses(user.id);
      return allAddresses.filter(addr => addr.type === type);
    } catch (err: any) {
      console.error(`Failed to fetch ${type} addresses:`, err);
      return [];
    }
  }, [user?.id]);

  /**
   * Create a new address
   */
  const createAddress = useCallback(async (data: CreateAddressRequest): Promise<Address> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setState(prev => ({ ...prev, operationLoading: { ...prev.operationLoading, create: true } }));

    try {
      const response = await AddressAPI.createAddress(user.id, data);
      setState(prev => ({
        ...prev,
        addresses: [...prev.addresses, response],
        operationLoading: { ...prev.operationLoading, create: false },
      }));
      return response;
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        operationLoading: { ...prev.operationLoading, create: false },
      }));
      throw err;
    }
  }, [user?.id]);

  /**
   * Update an existing address
   */
  const updateAddress = useCallback(async (
    addressId: string,
    data: UpdateAddressRequest
  ): Promise<Address> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setState(prev => ({
      ...prev,
      operationLoading: { ...prev.operationLoading, update: addressId },
    }));

    try {
      const response = await AddressAPI.updateAddress(user.id, addressId, data);
      setState(prev => ({
        ...prev,
        addresses: prev.addresses.map(addr => addr.id === addressId ? response : addr),
        operationLoading: { ...prev.operationLoading, update: null },
      }));
      return response;
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        operationLoading: { ...prev.operationLoading, update: null },
      }));
      throw err;
    }
  }, [user?.id]);

  /**
   * Delete an address
   */
  const deleteAddress = useCallback(async (addressId: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setState(prev => ({
      ...prev,
      operationLoading: { ...prev.operationLoading, delete: addressId },
    }));

    try {
      await AddressAPI.deleteAddress(user.id, addressId);
      setState(prev => ({
        ...prev,
        addresses: prev.addresses.filter(addr => addr.id !== addressId),
        operationLoading: { ...prev.operationLoading, delete: null },
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        operationLoading: { ...prev.operationLoading, delete: null },
      }));
      throw err;
    }
  }, [user?.id]);

  /**
   * Set an address as default
   */
  const setDefaultAddress = useCallback(async (
    addressId: string,
    type?: AddressType
  ): Promise<Address> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setState(prev => ({
      ...prev,
      operationLoading: { ...prev.operationLoading, setDefault: addressId },
    }));

    try {
      const response = await AddressAPI.setDefaultAddress(user.id, addressId);
      
      // Update addresses list - set isDefault to false for all, then true for selected one
      setState(prev => ({
        ...prev,
        addresses: prev.addresses.map(addr => ({
          ...addr,
          isDefault: addr.id === addressId,
        })),
        operationLoading: { ...prev.operationLoading, setDefault: null },
      }));
      
      return response;
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        operationLoading: { ...prev.operationLoading, setDefault: null },
      }));
      throw err;
    }
  }, [user?.id]);

  /**
   * Validate address data with Bangladesh-specific rules
   */
  const validateAddress = useCallback((
    data: Partial<CreateAddressRequest>
  ): AddressValidationResult => {
    const errors: Record<string, string> = {};
    const errorsBn: Record<string, string> = {};

    // Validate first name
    if (!data.firstName?.trim()) {
      errors.firstName = 'First name is required';
      errorsBn.firstName = 'প্রথম নাম প্রয়োজনীয়';
    } else if (data.firstName.length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
      errorsBn.firstName = 'প্রথম নাম কমপক্ষে ২ অক্ষর হতে হবে';
    }

    // Validate last name
    if (!data.lastName?.trim()) {
      errors.lastName = 'Last name is required';
      errorsBn.lastName = 'শেষ নাম প্রয়োজনীয়';
    } else if (data.lastName.length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
      errorsBn.lastName = 'শেষ নাম কমপক্ষে ২ অক্ষর হতে হবে';
    }

    // Validate phone number
    if (data.phone && !BANGLADESH_VALIDATION_RULES.phone.pattern.test(data.phone)) {
      errors.phone = BANGLADESH_VALIDATION_RULES.phone.message;
      errorsBn.phone = BANGLADESH_VALIDATION_RULES.phone.messageBn;
    }

    // Validate address line 1
    if (!data.address?.trim()) {
      errors.address = 'Address is required';
      errorsBn.address = 'ঠিকানা প্রয়োজনীয়';
    } else if (
      data.address.length < BANGLADESH_VALIDATION_RULES.addressLine1.minLength ||
      data.address.length > BANGLADESH_VALIDATION_RULES.addressLine1.maxLength
    ) {
      errors.address = BANGLADESH_VALIDATION_RULES.addressLine1.message;
      errorsBn.address = BANGLADESH_VALIDATION_RULES.addressLine1.messageBn;
    }

    // Validate address line 2
    if (data.addressLine2 && data.addressLine2.length > BANGLADESH_VALIDATION_RULES.addressLine2.maxLength) {
      errors.addressLine2 = BANGLADESH_VALIDATION_RULES.addressLine2.message;
      errorsBn.addressLine2 = BANGLADESH_VALIDATION_RULES.addressLine2.messageBn;
    }

    // Validate city
    if (!data.city?.trim()) {
      errors.city = 'City is required';
      errorsBn.city = 'শহর প্রয়োজনীয়';
    }

    // Validate division
    if (!data.division?.trim()) {
      errors.division = 'Division is required';
      errorsBn.division = 'বিভাগ প্রয়োজনীয়';
    }

    // Validate district
    if (!data.district?.trim()) {
      errors.district = 'District is required';
      errorsBn.district = 'জেলা প্রয়োজনীয়';
    }

    // Validate postal code
    if (data.postalCode && !BANGLADESH_VALIDATION_RULES.postalCode.pattern.test(data.postalCode)) {
      errors.postalCode = BANGLADESH_VALIDATION_RULES.postalCode.message;
      errorsBn.postalCode = BANGLADESH_VALIDATION_RULES.postalCode.messageBn;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      errorsBn,
    };
  }, []);

  /**
   * Validate a single field
   */
  const validateField = useCallback((field: string, value: string): string | null => {
    switch (field) {
      case 'firstName':
        if (!value.trim()) return 'First name is required';
        if (value.length < 2) return 'First name must be at least 2 characters';
        return null;

      case 'lastName':
        if (!value.trim()) return 'Last name is required';
        if (value.length < 2) return 'Last name must be at least 2 characters';
        return null;

      case 'phone':
        if (value && !BANGLADESH_VALIDATION_RULES.phone.pattern.test(value)) {
          return BANGLADESH_VALIDATION_RULES.phone.message;
        }
        return null;

      case 'address':
        if (!value.trim()) return 'Address is required';
        if (
          value.length < BANGLADESH_VALIDATION_RULES.addressLine1.minLength ||
          value.length > BANGLADESH_VALIDATION_RULES.addressLine1.maxLength
        ) {
          return BANGLADESH_VALIDATION_RULES.addressLine1.message;
        }
        return null;

      case 'addressLine2':
        if (value && value.length > BANGLADESH_VALIDATION_RULES.addressLine2.maxLength) {
          return BANGLADESH_VALIDATION_RULES.addressLine2.message;
        }
        return null;

      case 'city':
        if (!value.trim()) return 'City is required';
        return null;

      case 'division':
        if (!value.trim()) return 'Division is required';
        return null;

      case 'district':
        if (!value.trim()) return 'District is required';
        return null;

      case 'postalCode':
        if (value && !BANGLADESH_VALIDATION_RULES.postalCode.pattern.test(value)) {
          return BANGLADESH_VALIDATION_RULES.postalCode.message;
        }
        return null;

      default:
        return null;
    }
  }, []);

  /**
   * Get address by ID
   */
  const getAddressById = useCallback((addressId: string): Address | undefined => {
    return state.addresses.find(addr => addr.id === addressId);
  }, [state.addresses]);

  /**
   * Get default address by type
   */
  const getDefaultAddressByType = useCallback((type: AddressType): Address | null => {
    const defaultAddress = state.addresses.find(addr => addr.type === type && addr.isDefault);
    return defaultAddress || null;
  }, [state.addresses]);

  /**
   * Get validation rules
   */
  const getValidationRules = useCallback((): AddressValidationRules => {
    return BANGLADESH_VALIDATION_RULES;
  }, []);

  // Filter addresses by type
  const shippingAddresses = state.addresses.filter(addr => addr.type === 'SHIPPING');
  const billingAddresses = state.addresses.filter(addr => addr.type === 'BILLING');
  const homeAddresses = state.addresses.filter(addr => addr.type === 'HOME');
  const workAddresses = state.addresses.filter(addr => addr.type === 'WORK');
  const otherAddresses = state.addresses.filter(addr => addr.type === 'OTHER');

  // Get default addresses by type
  const defaultShippingAddress = getDefaultAddressByType('SHIPPING');
  const defaultBillingAddress = getDefaultAddressByType('BILLING');
  const defaultHomeAddress = getDefaultAddressByType('HOME');
  const defaultWorkAddress = getDefaultAddressByType('WORK');

  // Fetch addresses on mount or when user changes
  useEffect(() => {
    if (user?.id) {
      fetchAddresses();
    }
  }, [user?.id, fetchAddresses]);

  return {
    ...state,
    shippingAddresses,
    billingAddresses,
    homeAddresses,
    workAddresses,
    otherAddresses,
    defaultShippingAddress,
    defaultBillingAddress,
    defaultHomeAddress,
    defaultWorkAddress,
    fetchAddresses,
    fetchAddressesByType,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    validateAddress,
    validateField,
    getAddressById,
    getDefaultAddressByType,
    getValidationRules,
  };
};

export default useAddressManagement;
