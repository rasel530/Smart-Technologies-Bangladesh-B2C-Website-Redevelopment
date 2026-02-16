/**
 * Custom hook for using the Checkout Address Context
 *
 * This hook provides access to the checkout address state management,
 * including saved addresses, selection state, and actions for managing
 * addresses during the checkout process.
 *
 * @example
 * ```tsx
 * const {
 *   shippingAddresses,
 *   selectedShippingAddressId,
 *   selectShippingAddress,
 *   fetchAddresses,
 *   getSelectedShippingAddressAsShippingAddress,
 * } = useCheckoutAddresses();
 * ```
 */

import { useCheckoutAddresses as useCheckoutAddressesContext } from '@/contexts/CheckoutAddressContext';
import type { CheckoutAddressContextType } from '@/contexts/CheckoutAddressContext';

/**
 * Hook to access checkout address context
 *
 * Provides state and actions for managing shipping and billing addresses
 * during the checkout process.
 *
 * @throws Error if used outside of CheckoutAddressProvider
 * @returns CheckoutAddressContextType object with state and actions
 */
export const useCheckoutAddresses = (): CheckoutAddressContextType => {
  return useCheckoutAddressesContext();
};

export default useCheckoutAddresses;
