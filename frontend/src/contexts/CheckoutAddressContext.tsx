'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import { Address, AddressAPI } from '@/lib/api/profile';
import { addressToShippingAddress, ShippingAddress } from '@/lib/utils/address';

// Action types for checkout address reducer
type CheckoutAddressAction =
  | { type: 'FETCH_ADDRESSES_START' }
  | { type: 'FETCH_ADDRESSES_SUCCESS'; payload: { shippingAddresses: Address[]; billingAddresses: Address[] } }
  | { type: 'FETCH_ADDRESSES_FAILURE'; payload: string }
  | { type: 'SELECT_SHIPPING_ADDRESS'; payload: string | null }
  | { type: 'SELECT_BILLING_ADDRESS'; payload: string | null }
  | { type: 'CLEAR_SHIPPING_SELECTION' }
  | { type: 'CLEAR_BILLING_SELECTION' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USE_SAME_ADDRESS'; payload: boolean }
  | { type: 'SET_MANUALLY_EDITED'; payload: { type: 'shipping' | 'billing'; edited: boolean } }
  | { type: 'RESET' };

// State interface for checkout address reducer
interface CheckoutAddressState {
  shippingAddresses: Address[];
  billingAddresses: Address[];
  selectedShippingAddressId: string | null;
  selectedBillingAddressId: string | null;
  isLoading: boolean;
  error: string | null;
  useSameAddress: boolean;
  manuallyEdited: {
    shipping: boolean;
    billing: boolean;
  };
}

// Context type
export interface CheckoutAddressContextType {
  // State
  shippingAddresses: Address[];
  billingAddresses: Address[];
  selectedShippingAddressId: string | null;
  selectedBillingAddressId: string | null;
  isLoading: boolean;
  error: string | null;
  useSameAddress: boolean;
  manuallyEdited: {
    shipping: boolean;
    billing: boolean;
  };

  // Actions
  fetchAddresses: (userId: string) => Promise<void>;
  selectShippingAddress: (addressId: string | null) => void;
  selectBillingAddress: (addressId: string | null) => void;
  clearShippingSelection: () => void;
  clearBillingSelection: () => void;
  refreshAddresses: (userId: string) => Promise<void>;
  setUseSameAddress: (useSame: boolean) => void;
  setManuallyEdited: (type: 'shipping' | 'billing', edited: boolean) => void;
  reset: () => void;

  // Helper functions
  getSelectedShippingAddress: () => Address | undefined;
  getSelectedBillingAddress: () => Address | undefined;
  getSelectedShippingAddressAsShippingAddress: () => ShippingAddress | null;
  getSelectedBillingAddressAsShippingAddress: () => ShippingAddress | null;
}

// Initial state
const initialState: CheckoutAddressState = {
  shippingAddresses: [],
  billingAddresses: [],
  selectedShippingAddressId: null,
  selectedBillingAddressId: null,
  isLoading: false,
  error: null,
  useSameAddress: false,
  manuallyEdited: {
    shipping: false,
    billing: false,
  },
};

// Checkout address reducer
const checkoutAddressReducer = (
  state: CheckoutAddressState,
  action: CheckoutAddressAction
): CheckoutAddressState => {
  switch (action.type) {
    case 'FETCH_ADDRESSES_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'FETCH_ADDRESSES_SUCCESS':
      return {
        ...state,
        shippingAddresses: action.payload.shippingAddresses,
        billingAddresses: action.payload.billingAddresses,
        isLoading: false,
        error: null,
      };

    case 'FETCH_ADDRESSES_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    case 'SELECT_SHIPPING_ADDRESS':
      return {
        ...state,
        selectedShippingAddressId: action.payload,
        manuallyEdited: {
          ...state.manuallyEdited,
          shipping: false,
        },
      };

    case 'SELECT_BILLING_ADDRESS':
      return {
        ...state,
        selectedBillingAddressId: action.payload,
        manuallyEdited: {
          ...state.manuallyEdited,
          billing: false,
        },
      };

    case 'CLEAR_SHIPPING_SELECTION':
      return {
        ...state,
        selectedShippingAddressId: null,
      };

    case 'CLEAR_BILLING_SELECTION':
      return {
        ...state,
        selectedBillingAddressId: null,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    case 'SET_USE_SAME_ADDRESS':
      // When enabling useSameAddress, clear billing selection and mark as manually edited
      // This ensures billing form will sync with shipping form
      if (action.payload === true) {
        return {
          ...state,
          useSameAddress: true,
          selectedBillingAddressId: null,
          manuallyEdited: {
            ...state.manuallyEdited,
            billing: false,
          },
        };
      }
      // When disabling useSameAddress, allow separate billing address selection
      return {
        ...state,
        useSameAddress: false,
      };

    case 'SET_MANUALLY_EDITED':
      return {
        ...state,
        manuallyEdited: {
          ...state.manuallyEdited,
          [action.payload.type]: action.payload.edited,
        },
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
};

// Create context
const CheckoutAddressContext = createContext<CheckoutAddressContextType | undefined>(undefined);

// Provider component
interface CheckoutAddressProviderProps {
  children: ReactNode;
}

export const CheckoutAddressProvider: React.FC<CheckoutAddressProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(checkoutAddressReducer, initialState);

  // Fetch addresses from API
  const fetchAddresses = useCallback(async (userId: string) => {
    if (!userId) return;

    dispatch({ type: 'FETCH_ADDRESSES_START' });

    try {
      const addresses = await AddressAPI.getAddresses(userId);

      // Separate addresses by type
      const shippingAddresses = addresses.filter(addr => addr.type === 'SHIPPING');
      const billingAddresses = addresses.filter(addr => addr.type === 'BILLING');

      dispatch({
        type: 'FETCH_ADDRESSES_SUCCESS',
        payload: { shippingAddresses, billingAddresses },
      });
    } catch (error: any) {
      console.error('[CheckoutAddressContext] Failed to fetch addresses:', error);
      dispatch({
        type: 'FETCH_ADDRESSES_FAILURE',
        payload: error.message || 'Failed to load addresses',
      });
    }
  }, []);

  // Refresh addresses from API
  const refreshAddresses = useCallback(async (userId: string) => {
    await fetchAddresses(userId);
  }, [fetchAddresses]);

  // Select shipping address
  const selectShippingAddress = useCallback((addressId: string | null) => {
    dispatch({ type: 'SELECT_SHIPPING_ADDRESS', payload: addressId });
  }, []);

  // Select billing address
  const selectBillingAddress = useCallback((addressId: string | null) => {
    dispatch({ type: 'SELECT_BILLING_ADDRESS', payload: addressId });
  }, []);

  // Clear shipping selection
  const clearShippingSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SHIPPING_SELECTION' });
  }, []);

  // Clear billing selection
  const clearBillingSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_BILLING_SELECTION' });
  }, []);

  // Set use same address toggle
  const setUseSameAddress = useCallback((useSame: boolean) => {
    dispatch({ type: 'SET_USE_SAME_ADDRESS', payload: useSame });
  }, []);

  // Set manually edited flag
  const setManuallyEdited = useCallback((type: 'shipping' | 'billing', edited: boolean) => {
    dispatch({
      type: 'SET_MANUALLY_EDITED',
      payload: { type, edited },
    });
  }, []);

  // Reset state
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // Get selected shipping address
  const getSelectedShippingAddress = useCallback((): Address | undefined => {
    if (!state.selectedShippingAddressId) return undefined;
    return state.shippingAddresses.find(addr => addr.id === state.selectedShippingAddressId);
  }, [state.selectedShippingAddressId, state.shippingAddresses]);

  // Get selected billing address
  const getSelectedBillingAddress = useCallback((): Address | undefined => {
    if (!state.selectedBillingAddressId) return undefined;
    return state.billingAddresses.find(addr => addr.id === state.selectedBillingAddressId);
  }, [state.selectedBillingAddressId, state.billingAddresses]);

  // Get selected shipping address as ShippingAddress format
  const getSelectedShippingAddressAsShippingAddress = useCallback((): ShippingAddress | null => {
    const selectedAddress = getSelectedShippingAddress();
    if (!selectedAddress) return null;
    return addressToShippingAddress(selectedAddress);
  }, [getSelectedShippingAddress]);

  // Get selected billing address as ShippingAddress format
  const getSelectedBillingAddressAsShippingAddress = useCallback((): ShippingAddress | null => {
    const selectedAddress = getSelectedBillingAddress();
    if (!selectedAddress) return null;
    return addressToShippingAddress(selectedAddress);
  }, [getSelectedBillingAddress]);

  // Context value
  const value: CheckoutAddressContextType = {
    // State
    shippingAddresses: state.shippingAddresses,
    billingAddresses: state.billingAddresses,
    selectedShippingAddressId: state.selectedShippingAddressId,
    selectedBillingAddressId: state.selectedBillingAddressId,
    isLoading: state.isLoading,
    error: state.error,
    useSameAddress: state.useSameAddress,
    manuallyEdited: state.manuallyEdited,

    // Actions
    fetchAddresses,
    selectShippingAddress,
    selectBillingAddress,
    clearShippingSelection,
    clearBillingSelection,
    refreshAddresses,
    setUseSameAddress,
    setManuallyEdited,
    reset,

    // Helper functions
    getSelectedShippingAddress,
    getSelectedBillingAddress,
    getSelectedShippingAddressAsShippingAddress,
    getSelectedBillingAddressAsShippingAddress,
  };

  return (
    <CheckoutAddressContext.Provider value={value}>
      {children}
    </CheckoutAddressContext.Provider>
  );
};

// Custom hook to use checkout address context
export const useCheckoutAddresses = (): CheckoutAddressContextType => {
  const context = useContext(CheckoutAddressContext);

  if (context === undefined) {
    throw new Error('useCheckoutAddresses must be used within a CheckoutAddressProvider');
  }

  return context;
};

export default CheckoutAddressContext;
