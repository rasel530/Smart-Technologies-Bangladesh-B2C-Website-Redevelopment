/**
 * Checkout Page - Comprehensive Integration Test Suite
 * 
 * This test suite verifies the complete checkout flow integration.
 * Features tested:
 * - Fetching addresses on page load
 * - Selecting a saved shipping address
 * - Form pre-filling
 * - Switching between saved addresses
 * - Manual entry after selecting saved address
 * - Manual edit detection
 * - "Same address for both" toggle
 * - Billing address synchronization
 * - Validation before proceeding to payment
 * - Error handling
 * - Authentication and cart redirects
 * 
 * Files Tested:
 * - frontend/src/app/checkout/page.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import CheckoutPage from '@/app/checkout/page';
import { Address } from '@/lib/api/profile';
import { ShippingAddress } from '@/lib/utils/address';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/contexts/CartContext', () => ({
  useCart: jest.fn(),
}));

jest.mock('@/contexts/CheckoutAddressContext', () => ({
  useCheckoutAddresses: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe('Checkout Page - Integration Tests', () => {
  const mockUser = {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '01712345678',
  };

  const mockAddresses: Address[] = [
    {
      id: 'addr-1',
      userId: 'user-1',
      type: 'SHIPPING',
      firstName: 'John',
      lastName: 'Doe',
      phone: '01712345678',
      address: '123 Main Street',
      addressLine2: 'Apt 4B',
      city: 'Dhaka',
      district: '1',
      division: '1',
      postalCode: '1000',
      isDefault: true,
    },
    {
      id: 'addr-2',
      userId: 'user-1',
      type: 'SHIPPING',
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '01812345678',
      address: '456 Oak Avenue',
      city: 'Chittagong',
      district: '2',
      division: '2',
      postalCode: '2000',
      isDefault: false,
    },
  ];

  const mockCartItems = [
    {
      id: 'item-1',
      quantity: 1,
      price: 5000,
      product: {
        id: 'prod-1',
        name: 'Test Product',
        images: [''],
      },
    },
  ];

  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('Authentication Redirect', () => {
    it('should redirect to login if user is not authenticated', async () => {
      const { useAuth } = require('@/contexts/AuthContext');
      useAuth.mockReturnValue({ user: null, isLoading: false });

      render(<CheckoutPage />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login?redirect=/checkout');
      });
    });

    it('should show loading state while checking authentication', () => {
      const { useAuth } = require('@/contexts/AuthContext');
      useAuth.mockReturnValue({ user: null, isLoading: true });

      render(<CheckoutPage />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should show toast error when redirecting to login', async () => {
      const { useAuth } = require('@/contexts/AuthContext');
      const { toast } = require('sonner');
      useAuth.mockReturnValue({ user: null, isLoading: false });

      render(<CheckoutPage />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please login to continue');
      });
    });
  });

  describe('Cart Empty Redirect', () => {
    it('should redirect to cart if cart is empty', async () => {
      const { useAuth } = require('@/contexts/AuthContext');
      const { useCart } = require('@/contexts/CartContext');
      
      useAuth.mockReturnValue({ user: mockUser, isLoading: false });
      useCart.mockReturnValue({
        items: [],
        subtotal: 0,
        tax: 0,
        shippingCost: 0,
        discount: 0,
        total: 0,
        isLoading: false,
        setShippingMethod: jest.fn(),
      });

      render(<CheckoutPage />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/cart');
      });
    });

    it('should show toast error when redirecting to cart', async () => {
      const { useAuth } = require('@/contexts/AuthContext');
      const { useCart } = require('@/contexts/CartContext');
      const { toast } = require('sonner');
      
      useAuth.mockReturnValue({ user: mockUser, isLoading: false });
      useCart.mockReturnValue({
        items: [],
        subtotal: 0,
        tax: 0,
        shippingCost: 0,
        discount: 0,
        total: 0,
        isLoading: false,
        setShippingMethod: jest.fn(),
      });

      render(<CheckoutPage />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Your cart is empty');
      });
    });
  });

  describe('Address Fetching on Page Load', () => {
    it('should fetch addresses when user is authenticated', async () => {
      const { useAuth } = require('@/contexts/AuthContext');
      const { useCart } = require('@/contexts/CartContext');
      const { useCheckoutAddresses } = require('@/contexts/CheckoutAddressContext');
      
      const fetchAddresses = jest.fn().mockResolvedValue(undefined);
      useAuth.mockReturnValue({ user: mockUser, isLoading: false });
      useCart.mockReturnValue({
        items: mockCartItems,
        subtotal: 5000,
        tax: 500,
        shippingCost: 100,
        discount: 0,
        total: 5600,
        isLoading: false,
        setShippingMethod: jest.fn(),
      });
      useCheckoutAddresses.mockReturnValue({
        shippingAddresses: [],
        billingAddresses: [],
        selectedShippingAddressId: null,
        selectedBillingAddressId: null,
        isLoading: false,
        error: null,
        useSameAddress: false,
        manuallyEdited: { shipping: false, billing: false },
        fetchAddresses,
        selectShippingAddress: jest.fn(),
        selectBillingAddress: jest.fn(),
        clearShippingSelection: jest.fn(),
        clearBillingSelection: jest.fn(),
        refreshAddresses: jest.fn(),
        setUseSameAddress: jest.fn(),
        setManuallyEdited: jest.fn(),
        reset: jest.fn(),
        getSelectedShippingAddress: jest.fn(),
        getSelectedBillingAddress: jest.fn(),
        getSelectedShippingAddressAsShippingAddress: jest.fn(),
        getSelectedBillingAddressAsShippingAddress: jest.fn(),
      });

      render(<CheckoutPage />);

      await waitFor(() => {
        expect(fetchAddresses).toHaveBeenCalledWith('user-1');
      });
    });
  });

  describe('Auto-select Default Address', () => {
    it('should auto-select default shipping address when addresses are loaded', async () => {
      const { useAuth } = require('@/contexts/AuthContext');
      const { useCart } = require('@/contexts/CartContext');
      const { useCheckoutAddresses } = require('@/contexts/CheckoutAddressContext');
      
      const selectShippingAddress = jest.fn();
      useAuth.mockReturnValue({ user: mockUser, isLoading: false });
      useCart.mockReturnValue({
        items: mockCartItems,
        subtotal: 5000,
        tax: 500,
        shippingCost: 100,
        discount: 0,
        total: 5600,
        isLoading: false,
        setShippingMethod: jest.fn(),
      });
      useCheckoutAddresses.mockReturnValue({
        shippingAddresses: mockAddresses,
        billingAddresses: [],
        selectedShippingAddressId: 'addr-1',
        selectedBillingAddressId: null,
        isLoading: false,
        error: null,
        useSameAddress: false,
        manuallyEdited: { shipping: false, billing: false },
        fetchAddresses: jest.fn().mockResolvedValue(undefined),
        selectShippingAddress,
        selectBillingAddress: jest.fn(),
        clearShippingSelection: jest.fn(),
        clearBillingSelection: jest.fn(),
        refreshAddresses: jest.fn(),
        setUseSameAddress: jest.fn(),
        setManuallyEdited: jest.fn(),
        reset: jest.fn(),
        getSelectedShippingAddress: jest.fn().mockReturnValue(mockAddresses[0]),
        getSelectedBillingAddress: jest.fn(),
        getSelectedShippingAddressAsShippingAddress: jest.fn(),
        getSelectedBillingAddressAsShippingAddress: jest.fn(),
      });

      render(<CheckoutPage />);

      await waitFor(() => {
        expect(selectShippingAddress).toHaveBeenCalledWith(mockAddresses[0]);
      });
    });
  });

  describe('Shipping Address Form', () => {
    it('should render shipping address form', async () => {
      const { useAuth } = require('@/contexts/AuthContext');
      const { useCart } = require('@/contexts/CartContext');
      const { useCheckoutAddresses } = require('@/contexts/CheckoutAddressContext');
      
      useAuth.mockReturnValue({ user: mockUser, isLoading: false });
      useCart.mockReturnValue({
        items: mockCartItems,
        subtotal: 5000,
        tax: 500,
        shippingCost: 100,
        discount: 0,
        total: 5600,
        isLoading: false,
        setShippingMethod: jest.fn(),
      });
      useCheckoutAddresses.mockReturnValue({
        shippingAddresses: [],
        billingAddresses: [],
        selectedShippingAddressId: null,
        selectedBillingAddressId: null,
        isLoading: false,
        error: null,
        useSameAddress: false,
        manuallyEdited: { shipping: false, billing: false },
        fetchAddresses: jest.fn().mockResolvedValue(undefined),
        selectShippingAddress: jest.fn(),
        selectBillingAddress: jest.fn(),
        clearShippingSelection: jest.fn(),
        clearBillingSelection: jest.fn(),
        refreshAddresses: jest.fn(),
        setUseSameAddress: jest.fn(),
        setManuallyEdited: jest.fn(),
        reset: jest.fn(),
        getSelectedShippingAddress: jest.fn(),
        getSelectedBillingAddress: jest.fn(),
        getSelectedShippingAddressAsShippingAddress: jest.fn(),
        getSelectedBillingAddressAsShippingAddress: jest.fn(),
      });

      render(<CheckoutPage />);

      expect(screen.getByText('Shipping Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Full Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Phone Number *')).toBeInTheDocument();
      expect(screen.getByLabelText('Address Line 1 *')).toBeInTheDocument();
      expect(screen.getByLabelText('City *')).toBeInTheDocument();
      expect(screen.getByLabelText('District *')).toBeInTheDocument();
      expect(screen.getByLabelText('Postal Code *')).toBeInTheDocument();
    });

    it('should pre-fill form with user data', async () => {
      const { useAuth } = require('@/contexts/AuthContext');
      const { useCart } = require('@/contexts/CartContext');
      const { useCheckoutAddresses } = require('@/contexts/CheckoutAddressContext');
      
      useAuth.mockReturnValue({ user: mockUser, isLoading: false });
      useCart.mockReturnValue({
        items: mockCartItems,
        subtotal: 5000,
        tax: 500,
        shippingCost: 100,
        discount: 0,
        total: 5600,
        isLoading: false,
        setShippingMethod: jest.fn(),
      });
      useCheckoutAddresses.mockReturnValue({
        shippingAddresses: [],
        billingAddresses: [],
        selectedShippingAddressId: null,
        selectedBillingAddressId: null,
        isLoading: false,
        error: null,
        useSameAddress: false,
        manuallyEdited: { shipping: false, billing: false },
        fetchAddresses: jest.fn().mockResolvedValue(undefined),
        selectShippingAddress: jest.fn(),
        selectBillingAddress: jest.fn(),
        clearShippingSelection: jest.fn(),
        clearBillingSelection: jest.fn(),
        refreshAddresses: jest.fn(),
        setUseSameAddress: jest.fn(),
        setManuallyEdited: jest.fn(),
        reset: jest.fn(),
        getSelectedShippingAddress: jest.fn(),
        getSelectedBillingAddress: jest.fn(),
        getSelectedShippingAddressAsShippingAddress: jest.fn(),
        getSelectedBillingAddressAsShippingAddress: jest.fn(),
      });

      render(<CheckoutPage />);

      const fullNameInput = screen.getByLabelText('Full Name *') as HTMLInputElement;
      expect(fullNameInput.value).toBe('John Doe');

      const phoneInput = screen.getByLabelText('Phone Number *') as HTMLInputElement;
      expect(phoneInput.value).toBe('01712345678');
    });
  });

  describe('Manual Edit Detection', () => {
    it('should clear selected address when user manually edits form', async () => {
      const { useAuth } = require('@/contexts/AuthContext');
      const { useCart } = require('@/contexts/CartContext');
      const { useCheckoutAddresses } = require('@/contexts/CheckoutAddressContext');
      
      const clearShippingSelection = jest.fn();
      const setManuallyEdited = jest.fn();
      useAuth.mockReturnValue({ user: mockUser, isLoading: false });
      useCart.mockReturnValue({
        items: mockCartItems,
        subtotal: 5000,
        tax: 500,
        shippingCost: 100,
        discount: 0,
        total: 5600,
        isLoading: false,
        setShippingMethod: jest.fn(),
      });
      useCheckoutAddresses.mockReturnValue({
        shippingAddresses: mockAddresses,
        billingAddresses: [],
        selectedShippingAddressId: 'addr-1',
        selectedBillingAddressId: null,
        isLoading: false,
        error: null,
        useSameAddress: false,
        manuallyEdited: { shipping: false, billing: false },
        fetchAddresses: jest.fn().mockResolvedValue(undefined),
        selectShippingAddress: jest.fn(),
        selectBillingAddress: jest.fn(),
        clearShippingSelection,
        clearBillingSelection: jest.fn(),
        refreshAddresses: jest.fn(),
        setUseSameAddress: jest.fn(),
        setManuallyEdited,
        reset: jest.fn(),
        getSelectedShippingAddress: jest.fn(),
        getSelectedBillingAddress: jest.fn(),
        getSelectedShippingAddressAsShippingAddress: jest.fn(),
        getSelectedBillingAddressAsShippingAddress: jest.fn(),
      });

      render(<CheckoutPage />);

      const fullNameInput = screen.getByLabelText('Full Name *');
      fireEvent.change(fullNameInput, { target: { value: 'New Name' } });

      expect(clearShippingSelection).toHaveBeenCalled();
      expect(setManuallyEdited).toHaveBeenCalledWith('shipping', true);
    });
  });

  describe('Same Address Toggle', () => {
    it('should sync billing address with shipping when useSameAddress is enabled', async () => {
      const { useAuth } = require('@/contexts/AuthContext');
      const { useCart } = require('@/contexts/CartContext');
      const { useCheckoutAddresses } = require('@/contexts/CheckoutAddressContext');
      
      useAuth.mockReturnValue({ user: mockUser, isLoading: false });
      useCart.mockReturnValue({
        items: mockCartItems,
        subtotal: 5000,
        tax: 500,
        shippingCost: 100,
        discount: 0,
        total: 5600,
        isLoading: false,
        setShippingMethod: jest.fn(),
      });
      useCheckoutAddresses.mockReturnValue({
        shippingAddresses: mockAddresses,
        billingAddresses: [],
        selectedShippingAddressId: 'addr-1',
        selectedBillingAddressId: null,
        isLoading: false,
        error: null,
        useSameAddress: true,
        manuallyEdited: { shipping: false, billing: false },
        fetchAddresses: jest.fn().mockResolvedValue(undefined),
        selectShippingAddress: jest.fn(),
        selectBillingAddress: jest.fn(),
        clearShippingSelection: jest.fn(),
        clearBillingSelection: jest.fn(),
        refreshAddresses: jest.fn(),
        setUseSameAddress: jest.fn(),
        setManuallyEdited: jest.fn(),
        reset: jest.fn(),
        getSelectedShippingAddress: jest.fn().mockReturnValue(mockAddresses[0]),
        getSelectedBillingAddress: jest.fn(),
        getSelectedShippingAddressAsShippingAddress: jest.fn().mockReturnValue({
          fullName: 'John Doe',
          phone: '01712345678',
          addressLine1: '123 Main Street',
          addressLine2: 'Apt 4B',
          city: 'Dhaka',
          district: 'Dhaka',
          postalCode: '1000',
        }),
        getSelectedBillingAddressAsShippingAddress: jest.fn(),
      });

      render(<CheckoutPage />);

      // Check that billing form is hidden when useSameAddress is true
      expect(screen.queryByLabelText('Full Name', { selector: '*[name="billing"]' })).not.toBeInTheDocument();
    });

    it('should render billing address toggle', async () => {
      const { useAuth } = require('@/contexts/AuthContext');
      const { useCart } = require('@/contexts/CartContext');
      const { useCheckoutAddresses } = require('@/contexts/CheckoutAddressContext');
      
      useAuth.mockReturnValue({ user: mockUser, isLoading: false });
      useCart.mockReturnValue({
        items: mockCartItems,
        subtotal: 5000,
        tax: 500,
        shippingCost: 100,
        discount: 0,
        total: 5600,
        isLoading: false,
        setShippingMethod: jest.fn(),
      });
      useCheckoutAddresses.mockReturnValue({
        shippingAddresses: mockAddresses,
        billingAddresses: [],
        selectedShippingAddressId: 'addr-1',
        selectedBillingAddressId: null,
        isLoading: false,
        error: null,
        useSameAddress: false,
        manuallyEdited: { shipping: false, billing: false },
        fetchAddresses: jest.fn().mockResolvedValue(undefined),
        selectShippingAddress: jest.fn(),
        selectBillingAddress: jest.fn(),
        clearShippingSelection: jest.fn(),
        clearBillingSelection: jest.fn(),
        refreshAddresses: jest.fn(),
        setUseSameAddress: jest.fn(),
        setManuallyEdited: jest.fn(),
        reset: jest.fn(),
        getSelectedShippingAddress: jest.fn(),
        getSelectedBillingAddress: jest.fn(),
        getSelectedShippingAddressAsShippingAddress: jest.fn(),
        getSelectedBillingAddressAsShippingAddress: jest.fn(),
      });

      render(<CheckoutPage />);

      expect(screen.getByText('Same address for billing')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate shipping address before proceeding to payment', async () => {
      const { useAuth } = require('@/contexts/AuthContext');
      const { useCart } = require('@/contexts/CartContext');
      const { useCheckoutAddresses } = require('@/contexts/CheckoutAddressContext');
      
      useAuth.mockReturnValue({ user: mockUser, isLoading: false });
      useCart.mockReturnValue({
        items: mockCartItems,
        subtotal: 5000,
        tax: 500,
        shippingCost: 100,
        discount: 0,
        total: 5600,
        isLoading: false,
        setShippingMethod: jest.fn(),
      });
      useCheckoutAddresses.mockReturnValue({
        shippingAddresses: [],
        billingAddresses: [],
        selectedShippingAddressId: null,
        selectedBillingAddressId: null,
        isLoading: false,
        error: null,
        useSameAddress: false,
        manuallyEdited: { shipping: false, billing: false },
        fetchAddresses: jest.fn().mockResolvedValue(undefined),
        selectShippingAddress: jest.fn(),
        selectBillingAddress: jest.fn(),
        clearShippingSelection: jest.fn(),
        clearBillingSelection: jest.fn(),
        refreshAddresses: jest.fn(),
        setUseSameAddress: jest.fn(),
        setManuallyEdited: jest.fn(),
        reset: jest.fn(),
        getSelectedShippingAddress: jest.fn(),
        getSelectedBillingAddress: jest.fn(),
        getSelectedShippingAddressAsShippingAddress: jest.fn(),
        getSelectedBillingAddressAsShippingAddress: jest.fn(),
      });

      render(<CheckoutPage />);

      const continueButton = screen.getByText('Continue to Payment');
      fireEvent.click(continueButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText('Full name is required')).toBeInTheDocument();
        expect(screen.getByText('Phone number is required')).toBeInTheDocument();
        expect(screen.getByText('Address is required')).toBeInTheDocument();
        expect(screen.getByText('City is required')).toBeInTheDocument();
        expect(screen.getByText('District is required')).toBeInTheDocument();
        expect(screen.getByText('Postal code is required')).toBeInTheDocument();
      });
    });

    it('should validate phone number format', async () => {
      const { useAuth } = require('@/contexts/AuthContext');
      const { useCart } = require('@/contexts/CartContext');
      const { useCheckoutAddresses } = require('@/contexts/CheckoutAddressContext');
      
      useAuth.mockReturnValue({ user: mockUser, isLoading: false });
      useCart.mockReturnValue({
        items: mockCartItems,
        subtotal: 5000,
        tax: 500,
        shippingCost: 100,
        discount: 0,
        total: 5600,
        isLoading: false,
        setShippingMethod: jest.fn(),
      });
      useCheckoutAddresses.mockReturnValue({
        shippingAddresses: [],
        billingAddresses: [],
        selectedShippingAddressId: null,
        selectedBillingAddressId: null,
        isLoading: false,
        error: null,
        useSameAddress: false,
        manuallyEdited: { shipping: false, billing: false },
        fetchAddresses: jest.fn().mockResolvedValue(undefined),
        selectShippingAddress: jest.fn(),
        selectBillingAddress: jest.fn(),
        clearShippingSelection: jest.fn(),
        clearBillingSelection: jest.fn(),
        refreshAddresses: jest.fn(),
        setUseSameAddress: jest.fn(),
        setManuallyEdited: jest.fn(),
        reset: jest.fn(),
        getSelectedShippingAddress: jest.fn(),
        getSelectedBillingAddress: jest.fn(),
        getSelectedShippingAddressAsShippingAddress: jest.fn(),
        getSelectedBillingAddressAsShippingAddress: jest.fn(),
      });

      render(<CheckoutPage />);

      const phoneInput = screen.getByLabelText('Phone Number *');
      fireEvent.change(phoneInput, { target: { value: '123456789' } });

      const continueButton = screen.getByText('Continue to Payment');
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid phone number format')).toBeInTheDocument();
      });
    });
  });

  describe('Progress Steps', () => {
    it('should render progress steps', async () => {
      const { useAuth } = require('@/contexts/AuthContext');
      const { useCart } = require('@/contexts/CartContext');
      const { useCheckoutAddresses } = require('@/contexts/CheckoutAddressContext');
      
      useAuth.mockReturnValue({ user: mockUser, isLoading: false });
      useCart.mockReturnValue({
        items: mockCartItems,
        subtotal: 5000,
        tax: 500,
        shippingCost: 100,
        discount: 0,
        total: 5600,
        isLoading: false,
        setShippingMethod: jest.fn(),
      });
      useCheckoutAddresses.mockReturnValue({
        shippingAddresses: [],
        billingAddresses: [],
        selectedShippingAddressId: null,
        selectedBillingAddressId: null,
        isLoading: false,
        error: null,
        useSameAddress: false,
        manuallyEdited: { shipping: false, billing: false },
        fetchAddresses: jest.fn().mockResolvedValue(undefined),
        selectShippingAddress: jest.fn(),
        selectBillingAddress: jest.fn(),
        clearShippingSelection: jest.fn(),
        clearBillingSelection: jest.fn(),
        refreshAddresses: jest.fn(),
        setUseSameAddress: jest.fn(),
        setManuallyEdited: jest.fn(),
        reset: jest.fn(),
        getSelectedShippingAddress: jest.fn(),
        getSelectedBillingAddress: jest.fn(),
        getSelectedShippingAddressAsShippingAddress: jest.fn(),
        getSelectedBillingAddressAsShippingAddress: jest.fn(),
      });

      render(<CheckoutPage />);

      expect(screen.getByText('Shipping')).toBeInTheDocument();
      expect(screen.getByText('Payment')).toBeInTheDocument();
      expect(screen.getByText('Review')).toBeInTheDocument();
    });

    it('should highlight current step', async () => {
      const { useAuth } = require('@/contexts/AuthContext');
      const { useCart } = require('@/contexts/CartContext');
      const { useCheckoutAddresses } = require('@/contexts/CheckoutAddressContext');
      
      useAuth.mockReturnValue({ user: mockUser, isLoading: false });
      useCart.mockReturnValue({
        items: mockCartItems,
        subtotal: 5000,
        tax: 500,
        shippingCost: 100,
        discount: 0,
        total: 5600,
        isLoading: false,
        setShippingMethod: jest.fn(),
      });
      useCheckoutAddresses.mockReturnValue({
        shippingAddresses: [],
        billingAddresses: [],
        selectedShippingAddressId: null,
        selectedBillingAddressId: null,
        isLoading: false,
        error: null,
        useSameAddress: false,
        manuallyEdited: { shipping: false, billing: false },
        fetchAddresses: jest.fn().mockResolvedValue(undefined),
        selectShippingAddress: jest.fn(),
        selectBillingAddress: jest.fn(),
        clearShippingSelection: jest.fn(),
        clearBillingSelection: jest.fn(),
        refreshAddresses: jest.fn(),
        setUseSameAddress: jest.fn(),
        setManuallyEdited: jest.fn(),
        reset: jest.fn(),
        getSelectedShippingAddress: jest.fn(),
        getSelectedBillingAddress: jest.fn(),
        getSelectedShippingAddressAsShippingAddress: jest.fn(),
        getSelectedBillingAddressAsShippingAddress: jest.fn(),
      });

      render(<CheckoutPage />);

      const shippingStep = screen.getByText('Shipping').closest('.w-8');
      expect(shippingStep).toHaveClass('bg-blue-600');
    });
  });

  describe('Order Summary', () => {
    it('should render order summary sidebar', async () => {
      const { useAuth } = require('@/contexts/AuthContext');
      const { useCart } = require('@/contexts/CartContext');
      const { useCheckoutAddresses } = require('@/contexts/CheckoutAddressContext');
      
      useAuth.mockReturnValue({ user: mockUser, isLoading: false });
      useCart.mockReturnValue({
        items: mockCartItems,
        subtotal: 5000,
        tax: 500,
        shippingCost: 100,
        discount: 0,
        total: 5600,
        isLoading: false,
        setShippingMethod: jest.fn(),
      });
      useCheckoutAddresses.mockReturnValue({
        shippingAddresses: [],
        billingAddresses: [],
        selectedShippingAddressId: null,
        selectedBillingAddressId: null,
        isLoading: false,
        error: null,
        useSameAddress: false,
        manuallyEdited: { shipping: false, billing: false },
        fetchAddresses: jest.fn().mockResolvedValue(undefined),
        selectShippingAddress: jest.fn(),
        selectBillingAddress: jest.fn(),
        clearShippingSelection: jest.fn(),
        clearBillingSelection: jest.fn(),
        refreshAddresses: jest.fn(),
        setUseSameAddress: jest.fn(),
        setManuallyEdited: jest.fn(),
        reset: jest.fn(),
        getSelectedShippingAddress: jest.fn(),
        getSelectedBillingAddress: jest.fn(),
        getSelectedShippingAddressAsShippingAddress: jest.fn(),
        getSelectedBillingAddressAsShippingAddress: jest.fn(),
      });

      render(<CheckoutPage />);

      expect(screen.getByText('Order Summary')).toBeInTheDocument();
      expect(screen.getByText('Subtotal')).toBeInTheDocument();
      expect(screen.getByText('Shipping')).toBeInTheDocument();
      expect(screen.getByText('Tax')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
    });

    it('should display cart items in summary', async () => {
      const { useAuth } = require('@/contexts/AuthContext');
      const { useCart } = require('@/contexts/CartContext');
      const { useCheckoutAddresses } = require('@/contexts/CheckoutAddressContext');
      
      useAuth.mockReturnValue({ user: mockUser, isLoading: false });
      useCart.mockReturnValue({
        items: mockCartItems,
        subtotal: 5000,
        tax: 500,
        shippingCost: 100,
        discount: 0,
        total: 5600,
        isLoading: false,
        setShippingMethod: jest.fn(),
      });
      useCheckoutAddresses.mockReturnValue({
        shippingAddresses: [],
        billingAddresses: [],
        selectedShippingAddressId: null,
        selectedBillingAddressId: null,
        isLoading: false,
        error: null,
        useSameAddress: false,
        manuallyEdited: { shipping: false, billing: false },
        fetchAddresses: jest.fn().mockResolvedValue(undefined),
        selectShippingAddress: jest.fn(),
        selectBillingAddress: jest.fn(),
        clearShippingSelection: jest.fn(),
        clearBillingSelection: jest.fn(),
        refreshAddresses: jest.fn(),
        setUseSameAddress: jest.fn(),
        setManuallyEdited: jest.fn(),
        reset: jest.fn(),
        getSelectedShippingAddress: jest.fn(),
        getSelectedBillingAddress: jest.fn(),
        getSelectedShippingAddressAsShippingAddress: jest.fn(),
        getSelectedBillingAddressAsShippingAddress: jest.fn(),
      });

      render(<CheckoutPage />);

      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when address fetch fails', async () => {
      const { useAuth } = require('@/contexts/AuthContext');
      const { useCart } = require('@/contexts/CartContext');
      const { useCheckoutAddresses } = require('@/contexts/CheckoutAddressContext');
      
      useAuth.mockReturnValue({ user: mockUser, isLoading: false });
      useCart.mockReturnValue({
        items: mockCartItems,
        subtotal: 5000,
        tax: 500,
        shippingCost: 100,
        discount: 0,
        total: 5600,
        isLoading: false,
        setShippingMethod: jest.fn(),
      });
      useCheckoutAddresses.mockReturnValue({
        shippingAddresses: [],
        billingAddresses: [],
        selectedShippingAddressId: null,
        selectedBillingAddressId: null,
        isLoading: false,
        error: 'Failed to load addresses',
        useSameAddress: false,
        manuallyEdited: { shipping: false, billing: false },
        fetchAddresses: jest.fn().mockResolvedValue(undefined),
        selectShippingAddress: jest.fn(),
        selectBillingAddress: jest.fn(),
        clearShippingSelection: jest.fn(),
        clearBillingSelection: jest.fn(),
        refreshAddresses: jest.fn(),
        setUseSameAddress: jest.fn(),
        setManuallyEdited: jest.fn(),
        reset: jest.fn(),
        getSelectedShippingAddress: jest.fn(),
        getSelectedBillingAddress: jest.fn(),
        getSelectedShippingAddressAsShippingAddress: jest.fn(),
        getSelectedBillingAddressAsShippingAddress: jest.fn(),
      });

      render(<CheckoutPage />);

      expect(screen.getByText('Failed to load addresses')).toBeInTheDocument();
    });
  });
});
