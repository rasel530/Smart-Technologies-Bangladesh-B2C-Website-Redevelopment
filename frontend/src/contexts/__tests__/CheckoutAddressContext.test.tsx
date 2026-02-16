/**
 * Checkout Address Context - Comprehensive Test Suite
 * 
 * This test suite verifies the CheckoutAddressContext provider and reducer.
 * Functions tested:
 * - Initial state
 * - fetchAddresses() action - Test successful fetch, error handling
 * - selectShippingAddress() action - Test selection, clearing manual edits
 * - selectBillingAddress() action - Test selection
 * - clearShippingSelection() action - Test clearing
 * - clearBillingSelection() action - Test clearing
 * - refreshAddresses() action - Test refresh
 * - setUseSameAddress() action - Test toggle behavior, state synchronization
 * - setManuallyEdited() action - Test manual edit tracking
 * - reset() action - Test reset
 * - Helper functions: getSelectedShippingAddress(), getSelectedBillingAddress(), etc.
 * 
 * Files Tested:
 * - frontend/src/contexts/CheckoutAddressContext.tsx
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { CheckoutAddressProvider, useCheckoutAddresses } from '@/contexts/CheckoutAddressContext';
import { AddressAPI } from '@/lib/api/profile';
import { Address } from '@/lib/api/profile';

// Mock the AddressAPI
jest.mock('@/lib/api/profile', () => ({
  AddressAPI: {
    getAddresses: jest.fn(),
  },
}));

describe('CheckoutAddressContext - Provider and Reducer', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CheckoutAddressProvider>{children}</CheckoutAddressProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should provide initial state values', () => {
      const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

      expect(result.current.shippingAddresses).toEqual([]);
      expect(result.current.billingAddresses).toEqual([]);
      expect(result.current.selectedShippingAddressId).toBeNull();
      expect(result.current.selectedBillingAddressId).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.useSameAddress).toBe(false);
      expect(result.current.manuallyEdited).toEqual({ shipping: false, billing: false });
    });
  });

  describe('fetchAddresses() Action', () => {
    it('should fetch addresses successfully and update state', async () => {
      const mockAddresses: Address[] = [
        {
          id: 'addr-1',
          userId: 'user-1',
          type: 'SHIPPING',
          firstName: 'John',
          lastName: 'Doe',
          phone: '01712345678',
          address: '123 Main Street',
          city: 'Dhaka',
          district: '1',
          division: '1',
          isDefault: true,
        },
        {
          id: 'addr-2',
          userId: 'user-1',
          type: 'BILLING',
          firstName: 'Jane',
          lastName: 'Smith',
          phone: '01812345678',
          address: '456 Oak Avenue',
          city: 'Chittagong',
          district: '2',
          division: '2',
          isDefault: false,
        },
      ];

      (AddressAPI.getAddresses as jest.Mock).mockResolvedValue(mockAddresses);

      const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

      await act(async () => {
        await result.current.fetchAddresses('user-1');
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.shippingAddresses).toHaveLength(1);
      expect(result.current.billingAddresses).toHaveLength(1);
      expect(result.current.shippingAddresses[0].type).toBe('SHIPPING');
      expect(result.current.billingAddresses[0].type).toBe('BILLING');
      expect(AddressAPI.getAddresses).toHaveBeenCalledWith('user-1');
    });

    it('should set loading state while fetching', async () => {
      (AddressAPI.getAddresses as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

      act(() => {
        result.current.fetchAddresses('user-1');
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should handle fetch errors and set error state', async () => {
      const errorMessage = 'Failed to load addresses';
      (AddressAPI.getAddresses as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

      await act(async () => {
        await result.current.fetchAddresses('user-1');
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.shippingAddresses).toEqual([]);
      expect(result.current.billingAddresses).toEqual([]);
    });

    it('should not fetch when userId is empty', async () => {
      const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

      await act(async () => {
        await result.current.fetchAddresses('');
      });

      expect(AddressAPI.getAddresses).not.toHaveBeenCalled();
    });

    it('should not fetch when userId is null', async () => {
      const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

      await act(async () => {
        await result.current.fetchAddresses(null as any);
      });

      expect(AddressAPI.getAddresses).not.toHaveBeenCalled();
    });
  });

  describe('selectShippingAddress() Action', () => {
    it('should select a shipping address', () => {
      const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

      act(() => {
        result.current.selectShippingAddress('addr-1');
      });

      expect(result.current.selectedShippingAddressId).toBe('addr-1');
    });

    it('should clear manual edit flag when selecting shipping address', () => {
      const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

      // First set manually edited
      act(() => {
        result.current.setManuallyEdited('shipping', true);
      });
      expect(result.current.manuallyEdited.shipping).toBe(true);

      // Then select an address
      act(() => {
        result.current.selectShippingAddress('addr-1');
      });

      expect(result.current.selectedShippingAddressId).toBe('addr-1');
      expect(result.current.manuallyEdited.shipping).toBe(false);
    });

    it('should allow deselecting by passing null', () => {
      const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

      act(() => {
        result.current.selectShippingAddress('addr-1');
      });
      expect(result.current.selectedShippingAddressId).toBe('addr-1');

      act(() => {
        result.current.selectShippingAddress(null);
      });
      expect(result.current.selectedShippingAddressId).toBeNull();
    });
  });

  describe('selectBillingAddress() Action', () => {
    it('should select a billing address', () => {
      const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

      act(() => {
        result.current.selectBillingAddress('addr-2');
      });

      expect(result.current.selectedBillingAddressId).toBe('addr-2');
    });

    it('should clear manual edit flag when selecting billing address', () => {
      const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

      // First set manually edited
      act(() => {
        result.current.setManuallyEdited('billing', true);
      });
      expect(result.current.manuallyEdited.billing).toBe(true);

      // Then select an address
      act(() => {
        result.current.selectBillingAddress('addr-2');
      });

      expect(result.current.selectedBillingAddressId).toBe('addr-2');
      expect(result.current.manuallyEdited.billing).toBe(false);
    });

    it('should allow deselecting by passing null', () => {
      const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

      act(() => {
        result.current.selectBillingAddress('addr-2');
      });
      expect(result.current.selectedBillingAddressId).toBe('addr-2');

      act(() => {
        result.current.selectBillingAddress(null);
      });
      expect(result.current.selectedBillingAddressId).toBeNull();
    });
  });

  describe('clearShippingSelection() Action', () => {
    it('should clear shipping address selection', () => {
      const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

      act(() => {
        result.current.selectShippingAddress('addr-1');
      });
      expect(result.current.selectedShippingAddressId).toBe('addr-1');

      act(() => {
        result.current.clearShippingSelection();
      });
      expect(result.current.selectedShippingAddressId).toBeNull();
    });

    it('should not affect other state when clearing shipping selection', () => {
      const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

      act(() => {
        result.current.selectShippingAddress('addr-1');
        result.current.selectBillingAddress('addr-2');
        result.current.setManuallyEdited('billing', true);
      });

      act(() => {
        result.current.clearShippingSelection();
      });

      expect(result.current.selectedShippingAddressId).toBeNull();
      expect(result.current.selectedBillingAddressId).toBe('addr-2');
      expect(result.current.manuallyEdited.billing).toBe(true);
    });
  });

  describe('clearBillingSelection() Action', () => {
    it('should clear billing address selection', () => {
      const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

      act(() => {
        result.current.selectBillingAddress('addr-2');
      });
      expect(result.current.selectedBillingAddressId).toBe('addr-2');

      act(() => {
        result.current.clearBillingSelection();
      });
      expect(result.current.selectedBillingAddressId).toBeNull();
    });

    it('should not affect other state when clearing billing selection', () => {
      const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

      act(() => {
        result.current.selectShippingAddress('addr-1');
        result.current.selectBillingAddress('addr-2');
        result.current.setManuallyEdited('shipping', true);
      });

      act(() => {
        result.current.clearBillingSelection();
      });

      expect(result.current.selectedBillingAddressId).toBeNull();
      expect(result.current.selectedShippingAddressId).toBe('addr-1');
      expect(result.current.manuallyEdited.shipping).toBe(true);
    });
  });

  describe('refreshAddresses() Action', () => {
    it('should refresh addresses by calling fetchAddresses', async () => {
      const mockAddresses: Address[] = [
        {
          id: 'addr-1',
          userId: 'user-1',
          type: 'SHIPPING',
          firstName: 'John',
          lastName: 'Doe',
          phone: '01712345678',
          address: '123 Main Street',
          city: 'Dhaka',
          district: '1',
          division: '1',
          isDefault: true,
        },
      ];

      (AddressAPI.getAddresses as jest.Mock).mockResolvedValue(mockAddresses);

      const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

      await act(async () => {
        await result.current.refreshAddresses('user-1');
      });

      expect(AddressAPI.getAddresses).toHaveBeenCalledWith('user-1');
      expect(result.current.shippingAddresses).toHaveLength(1);
    });
  });

  describe('setUseSameAddress() Action', () => {
    it('should set useSameAddress to true', () => {
      const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

      act(() => {
        result.current.setUseSameAddress(true);
      });

      expect(result.current.useSameAddress).toBe(true);
    });

    it('should set useSameAddress to false', () => {
      const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

      act(() => {
        result.current.setUseSameAddress(true);
      });
      expect(result.current.useSameAddress).toBe(true);

      act(() => {
        result.current.setUseSameAddress(false);
      });
      expect(result.current.useSameAddress).toBe(false);
    });

    it('should clear billing selection when enabling useSameAddress', () => {
      const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

      act(() => {
        result.current.selectBillingAddress('addr-2');
      });
      expect(result.current.selectedBillingAddressId).toBe('addr-2');

      act(() => {
        result.current.setUseSameAddress(true);
      });

      expect(result.current.useSameAddress).toBe(true);
      expect(result.current.selectedBillingAddressId).toBeNull();
    });

    it('should clear billing manually edited flag when enabling useSameAddress', () => {
      const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

      act(() => {
        result.current.setManuallyEdited('billing', true);
        result.current.selectBillingAddress('addr-2');
      });
      expect(result.current.manuallyEdited.billing).toBe(true);

      act(() => {
        result.current.setUseSameAddress(true);
      });

      expect(result.current.useSameAddress).toBe(true);
      expect(result.current.manuallyEdited.billing).toBe(false);
    });

    it('should not clear billing selection when disabling useSameAddress', () => {
      const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

      act(() => {
        result.current.setUseSameAddress(true);
        result.current.selectBillingAddress('addr-2');
      });

      act(() => {
        result.current.setUseSameAddress(false);
      });

      expect(result.current.useSameAddress).toBe(false);
      expect(result.current.selectedBillingAddressId).toBe('addr-2');
    });
  });

  describe('setManuallyEdited() Action', () => {
    it('should set shipping manually edited flag', () => {
      const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

      act(() => {
        result.current.setManuallyEdited('shipping', true);
      });

      expect(result.current.manuallyEdited.shipping).toBe(true);
      expect(result.current.manuallyEdited.billing).toBe(false);
    });

    it('should set billing manually edited flag', () => {
      const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

      act(() => {
        result.current.setManuallyEdited('billing', true);
      });

      expect(result.current.manuallyEdited.billing).toBe(true);
      expect(result.current.manuallyEdited.shipping).toBe(false);
    });

    it('should clear shipping manually edited flag', () => {
      const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

      act(() => {
        result.current.setManuallyEdited('shipping', true);
      });
      expect(result.current.manuallyEdited.shipping).toBe(true);

      act(() => {
        result.current.setManuallyEdited('shipping', false);
      });
      expect(result.current.manuallyEdited.shipping).toBe(false);
    });

    it('should clear billing manually edited flag', () => {
      const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

      act(() => {
        result.current.setManuallyEdited('billing', true);
      });
      expect(result.current.manuallyEdited.billing).toBe(true);

      act(() => {
        result.current.setManuallyEdited('billing', false);
      });
      expect(result.current.manuallyEdited.billing).toBe(false);
    });
  });

  describe('reset() Action', () => {
    it('should reset all state to initial values', () => {
      const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

      // Set some state
      act(() => {
        result.current.selectShippingAddress('addr-1');
        result.current.selectBillingAddress('addr-2');
        result.current.setUseSameAddress(true);
        result.current.setManuallyEdited('shipping', true);
        result.current.setManuallyEdited('billing', true);
      });

      expect(result.current.selectedShippingAddressId).toBe('addr-1');
      expect(result.current.selectedBillingAddressId).toBe('addr-2');
      expect(result.current.useSameAddress).toBe(true);
      expect(result.current.manuallyEdited.shipping).toBe(true);
      expect(result.current.manuallyEdited.billing).toBe(true);

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.selectedShippingAddressId).toBeNull();
      expect(result.current.selectedBillingAddressId).toBeNull();
      expect(result.current.useSameAddress).toBe(false);
      expect(result.current.manuallyEdited.shipping).toBe(false);
      expect(result.current.manuallyEdited.billing).toBe(false);
    });
  });

  describe('Helper Functions', () => {
    describe('getSelectedShippingAddress()', () => {
      it('should return undefined when no shipping address is selected', () => {
        const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

        const selected = result.current.getSelectedShippingAddress();
        expect(selected).toBeUndefined();
      });

      it('should return the selected shipping address', async () => {
        const mockAddresses: Address[] = [
          {
            id: 'addr-1',
            userId: 'user-1',
            type: 'SHIPPING',
            firstName: 'John',
            lastName: 'Doe',
            phone: '01712345678',
            address: '123 Main Street',
            city: 'Dhaka',
            district: '1',
            division: '1',
            isDefault: true,
          },
        ];

        (AddressAPI.getAddresses as jest.Mock).mockResolvedValue(mockAddresses);

        const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

        await act(async () => {
          await result.current.fetchAddresses('user-1');
        });

        act(() => {
          result.current.selectShippingAddress('addr-1');
        });

        const selected = result.current.getSelectedShippingAddress();
        expect(selected).toBeDefined();
        expect(selected?.id).toBe('addr-1');
        expect(selected?.firstName).toBe('John');
      });

      it('should return undefined when selected ID does not exist', async () => {
        const mockAddresses: Address[] = [
          {
            id: 'addr-1',
            userId: 'user-1',
            type: 'SHIPPING',
            firstName: 'John',
            lastName: 'Doe',
            phone: '01712345678',
            address: '123 Main Street',
            city: 'Dhaka',
            district: '1',
            division: '1',
            isDefault: true,
          },
        ];

        (AddressAPI.getAddresses as jest.Mock).mockResolvedValue(mockAddresses);

        const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

        await act(async () => {
          await result.current.fetchAddresses('user-1');
        });

        act(() => {
          result.current.selectShippingAddress('non-existent-id');
        });

        const selected = result.current.getSelectedShippingAddress();
        expect(selected).toBeUndefined();
      });
    });

    describe('getSelectedBillingAddress()', () => {
      it('should return undefined when no billing address is selected', () => {
        const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

        const selected = result.current.getSelectedBillingAddress();
        expect(selected).toBeUndefined();
      });

      it('should return the selected billing address', async () => {
        const mockAddresses: Address[] = [
          {
            id: 'addr-2',
            userId: 'user-1',
            type: 'BILLING',
            firstName: 'Jane',
            lastName: 'Smith',
            phone: '01812345678',
            address: '456 Oak Avenue',
            city: 'Chittagong',
            district: '2',
            division: '2',
            isDefault: false,
          },
        ];

        (AddressAPI.getAddresses as jest.Mock).mockResolvedValue(mockAddresses);

        const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

        await act(async () => {
          await result.current.fetchAddresses('user-1');
        });

        act(() => {
          result.current.selectBillingAddress('addr-2');
        });

        const selected = result.current.getSelectedBillingAddress();
        expect(selected).toBeDefined();
        expect(selected?.id).toBe('addr-2');
        expect(selected?.firstName).toBe('Jane');
      });

      it('should return undefined when selected ID does not exist', async () => {
        const mockAddresses: Address[] = [
          {
            id: 'addr-2',
            userId: 'user-1',
            type: 'BILLING',
            firstName: 'Jane',
            lastName: 'Smith',
            phone: '01812345678',
            address: '456 Oak Avenue',
            city: 'Chittagong',
            district: '2',
            division: '2',
            isDefault: false,
          },
        ];

        (AddressAPI.getAddresses as jest.Mock).mockResolvedValue(mockAddresses);

        const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

        await act(async () => {
          await result.current.fetchAddresses('user-1');
        });

        act(() => {
          result.current.selectBillingAddress('non-existent-id');
        });

        const selected = result.current.getSelectedBillingAddress();
        expect(selected).toBeUndefined();
      });
    });

    describe('getSelectedShippingAddressAsShippingAddress()', () => {
      it('should return null when no shipping address is selected', () => {
        const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

        const selected = result.current.getSelectedShippingAddressAsShippingAddress();
        expect(selected).toBeNull();
      });

      it('should return the selected shipping address in ShippingAddress format', async () => {
        const mockAddresses: Address[] = [
          {
            id: 'addr-1',
            userId: 'user-1',
            type: 'SHIPPING',
            firstName: 'John',
            lastName: 'Doe',
            phone: '01712345678',
            address: '123 Main Street',
            city: 'Dhaka',
            district: '1',
            division: '1',
            isDefault: true,
          },
        ];

        (AddressAPI.getAddresses as jest.Mock).mockResolvedValue(mockAddresses);

        const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

        await act(async () => {
          await result.current.fetchAddresses('user-1');
        });

        act(() => {
          result.current.selectShippingAddress('addr-1');
        });

        const selected = result.current.getSelectedShippingAddressAsShippingAddress();
        expect(selected).not.toBeNull();
        expect(selected?.fullName).toBe('John Doe');
        expect(selected?.addressLine1).toBe('123 Main Street');
        expect(selected?.phone).toBe('01712345678');
      });
    });

    describe('getSelectedBillingAddressAsShippingAddress()', () => {
      it('should return null when no billing address is selected', () => {
        const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

        const selected = result.current.getSelectedBillingAddressAsShippingAddress();
        expect(selected).toBeNull();
      });

      it('should return the selected billing address in ShippingAddress format', async () => {
        const mockAddresses: Address[] = [
          {
            id: 'addr-2',
            userId: 'user-1',
            type: 'BILLING',
            firstName: 'Jane',
            lastName: 'Smith',
            phone: '01812345678',
            address: '456 Oak Avenue',
            city: 'Chittagong',
            district: '2',
            division: '2',
            isDefault: false,
          },
        ];

        (AddressAPI.getAddresses as jest.Mock).mockResolvedValue(mockAddresses);

        const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

        await act(async () => {
          await result.current.fetchAddresses('user-1');
        });

        act(() => {
          result.current.selectBillingAddress('addr-2');
        });

        const selected = result.current.getSelectedBillingAddressAsShippingAddress();
        expect(selected).not.toBeNull();
        expect(selected?.fullName).toBe('Jane Smith');
        expect(selected?.addressLine1).toBe('456 Oak Avenue');
        expect(selected?.phone).toBe('01812345678');
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete address selection workflow', async () => {
      const mockAddresses: Address[] = [
        {
          id: 'addr-1',
          userId: 'user-1',
          type: 'SHIPPING',
          firstName: 'John',
          lastName: 'Doe',
          phone: '01712345678',
          address: '123 Main Street',
          city: 'Dhaka',
          district: '1',
          division: '1',
          isDefault: true,
        },
        {
          id: 'addr-2',
          userId: 'user-1',
          type: 'BILLING',
          firstName: 'Jane',
          lastName: 'Smith',
          phone: '01812345678',
          address: '456 Oak Avenue',
          city: 'Chittagong',
          district: '2',
          division: '2',
          isDefault: false,
        },
      ];

      (AddressAPI.getAddresses as jest.Mock).mockResolvedValue(mockAddresses);

      const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

      // Fetch addresses
      await act(async () => {
        await result.current.fetchAddresses('user-1');
      });

      expect(result.current.shippingAddresses).toHaveLength(1);
      expect(result.current.billingAddresses).toHaveLength(1);

      // Select shipping address
      act(() => {
        result.current.selectShippingAddress('addr-1');
      });

      expect(result.current.selectedShippingAddressId).toBe('addr-1');
      expect(result.current.manuallyEdited.shipping).toBe(false);

      // Select billing address
      act(() => {
        result.current.selectBillingAddress('addr-2');
      });

      expect(result.current.selectedBillingAddressId).toBe('addr-2');
      expect(result.current.manuallyEdited.billing).toBe(false);

      // Enable same address
      act(() => {
        result.current.setUseSameAddress(true);
      });

      expect(result.current.useSameAddress).toBe(true);
      expect(result.current.selectedBillingAddressId).toBeNull();

      // Get selected addresses
      const shippingAddr = result.current.getSelectedShippingAddress();
      const billingAddr = result.current.getSelectedBillingAddress();

      expect(shippingAddr?.id).toBe('addr-1');
      expect(billingAddr).toBeUndefined();

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.selectedShippingAddressId).toBeNull();
      expect(result.current.selectedBillingAddressId).toBeNull();
      expect(result.current.useSameAddress).toBe(false);
    });

    it('should handle manual edit workflow', async () => {
      const mockAddresses: Address[] = [
        {
          id: 'addr-1',
          userId: 'user-1',
          type: 'SHIPPING',
          firstName: 'John',
          lastName: 'Doe',
          phone: '01712345678',
          address: '123 Main Street',
          city: 'Dhaka',
          district: '1',
          division: '1',
          isDefault: true,
        },
      ];

      (AddressAPI.getAddresses as jest.Mock).mockResolvedValue(mockAddresses);

      const { result } = renderHook(() => useCheckoutAddresses(), { wrapper });

      // Fetch and select address
      await act(async () => {
        await result.current.fetchAddresses('user-1');
      });

      act(() => {
        result.current.selectShippingAddress('addr-1');
      });

      expect(result.current.selectedShippingAddressId).toBe('addr-1');
      expect(result.current.manuallyEdited.shipping).toBe(false);

      // Simulate manual edit
      act(() => {
        result.current.setManuallyEdited('shipping', true);
      });

      expect(result.current.manuallyEdited.shipping).toBe(true);

      // Select another address should clear manual edit flag
      act(() => {
        result.current.selectShippingAddress('addr-1');
      });

      expect(result.current.manuallyEdited.shipping).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when useCheckoutAddresses is used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useCheckoutAddresses());
      }).toThrow('useCheckoutAddresses must be used within a CheckoutAddressProvider');

      console.error = originalError;
    });
  });
});
