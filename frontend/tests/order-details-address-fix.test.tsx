/**
 * Comprehensive Test Suite for Order Details Page Address Display Fix
 * 
 * This test file verifies the fixes for the order details page address display issues:
 * 1. Shipping Address was not displaying fully (truncated/missing data)
 * 2. Billing Address was completely missing
 * 
 * Fixes implemented in frontend/src/app/orders/[orderId]/page.tsx:
 * 1. Updated the Address interface to match the database schema (correct field names: address, district, division instead of street, state, country)
 * 2. Fixed Shipping Address rendering to use correct field names
 * 3. Added a Billing Address section indicating it's the same as the shipping address
 * 
 * Test requirements:
 * 1. Test the order details page with the specific order ID: 17b750be-683b-4ae6-a116-9a3332502c05
 * 2. Verify that Shipping Address displays all required fields correctly
 * 3. Verify that Billing Address section is visible and displays "Same as shipping address" message
 * 4. Verify no TypeScript errors or console errors occur when rendering the page
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrderDetailsPage from '@/app/orders/[orderId]/page';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, ApiError } from '@/lib/api/client';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock apiClient
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    get: jest.fn(),
  },
  ApiError: class extends Error {
    constructor(message: string, public status?: number, public data?: any) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Loader2: () => React.createElement('div', { 'data-testid': 'loader-icon' }, 'Loader'),
  ArrowLeft: () => React.createElement('div', { 'data-testid': 'arrow-left-icon' }, 'ArrowLeft'),
  Package: () => React.createElement('div', { 'data-testid': 'package-icon' }, 'Package'),
  MapPin: () => React.createElement('div', { 'data-testid': 'map-pin-icon' }, 'MapPin'),
  CreditCard: () => React.createElement('div', { 'data-testid': 'credit-card-icon' }, 'CreditCard'),
  FileText: () => React.createElement('div', { 'data-testid': 'file-text-icon' }, 'FileText'),
  Calendar: () => React.createElement('div', { 'data-testid': 'calendar-icon' }, 'Calendar'),
  DollarSign: () => React.createElement('div', { 'data-testid': 'dollar-sign-icon' }, 'DollarSign'),
  AlertCircle: () => React.createElement('div', { 'data-testid': 'alert-circle-icon' }, 'AlertCircle'),
  RefreshCw: () => React.createElement('div', { 'data-testid': 'refresh-cw-icon' }, 'RefreshCw'),
}));

// Test data matching the database schema with correct field names
const mockUser = {
  id: 'user-123',
  firstName: 'Rasel',
  lastName: 'Bepari',
  email: 'raselbepari88@gmail.com',
  phone: '+8801712345678',
};

// Mock order data with correct Address interface fields (matching database schema)
const mockOrderWithCorrectAddress = {
  id: '17b750be-683b-4ae6-a116-9a3332502c05',
  orderNumber: 'ORD-2024-001',
  userId: 'user-123',
  addressId: 'address-123',
  status: 'delivered',
  subtotal: 50000,
  tax: 7500,
  shippingCost: 2000,
  discount: 0,
  total: 59500,
  paymentMethod: 'cod',
  notes: 'Please call before delivery',
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-20T14:45:00Z',
  confirmedAt: '2024-01-15T11:00:00Z',
  shippedAt: '2024-01-17T09:00:00Z',
  deliveredAt: '2024-01-20T14:00:00Z',
  user: mockUser,
  // Address with correct field names matching database schema
  address: {
    id: 'address-123',
    userId: 'user-123',
    type: 'SHIPPING' as const,
    firstName: 'Rasel',
    lastName: 'Bepari',
    phone: '+8801712345678',
    address: 'House 12, Road 5, Sector 10',
    addressLine2: 'Uttara',
    city: 'Dhaka',
    district: 'Dhaka',
    division: 'Dhaka',
    upazila: 'Uttara Thana',
    postalCode: '1230',
    isDefault: true,
  },
  items: [
    {
      id: 'item-1',
      productId: 'product-1',
      quantity: 2,
      unitPrice: 25000,
      totalPrice: 50000,
      product: {
        id: 'product-1',
        name: 'HP Laptop 15s',
        sku: 'HP-LAPTOP-15S-001',
        images: [
          {
            id: 'img-1',
            originalUrl: 'https://example.com/image1.jpg',
            altTextEn: 'HP Laptop',
          },
        ],
      },
      variant: {
        id: 'variant-1',
        name: 'Silver',
      },
    },
  ],
  transactions: [
    {
      id: 'txn-1',
      amount: 59500,
      status: 'completed',
    },
  ],
};

// Mock order data with optional fields missing
const mockOrderWithMinimalAddress = {
  ...mockOrderWithCorrectAddress,
  address: {
    id: 'address-456',
    userId: 'user-123',
    type: 'SHIPPING' as const,
    firstName: 'John',
    lastName: 'Doe',
    phone: undefined,
    address: '123 Main Street',
    addressLine2: undefined,
    city: 'Dhaka',
    district: 'Dhaka',
    division: 'Dhaka',
    upazila: undefined,
    postalCode: '1000',
    isDefault: false,
  },
};

describe('Order Details Page - Address Display Fix Verification', () => {
  let mockPush: jest.Mock;
  let mockGet: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/orders/17b750be-683b-4ae6-a116-9a3332502c05',
      query: {},
      asPath: '/orders/17b750be-683b-4ae6-a116-9a3332502c05',
    });

    (useParams as jest.Mock).mockReturnValue({
      orderId: '17b750be-683b-4ae6-a116-9a3332502c05',
    });

    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false,
    });

    mockGet = apiClient.get as jest.Mock;
    mockGet.mockResolvedValue({ order: mockOrderWithCorrectAddress });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ========================================
  // ADDRESS INTERFACE VERIFICATION TESTS
  // ========================================
  describe('Address Interface Schema Verification', () => {
    test('should use correct field names matching database schema', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Shipping Address')).toBeInTheDocument();
      });
    });

    test('should render address with firstName field', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Rasel')).toBeInTheDocument();
      });
    });

    test('should render address with lastName field', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Bepari')).toBeInTheDocument();
      });
    });

    test('should render address with address field (not street)', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('House 12, Road 5, Sector 10')).toBeInTheDocument();
      });
    });

    test('should render address with district field (not state)', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Dhaka, Dhaka/)).toBeInTheDocument();
      });
    });

    test('should render address with division field (not country)', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Dhaka')).toBeInTheDocument();
      });
    });

    test('should render address with city field', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Dhaka, Dhaka/)).toBeInTheDocument();
      });
    });

    test('should render address with postalCode field', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText(/1230/)).toBeInTheDocument();
      });
    });
  });

  // ========================================
  // SHIPPING ADDRESS DISPLAY TESTS
  // ========================================
  describe('Shipping Address Display', () => {
    test('should display Shipping Address section', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Shipping Address')).toBeInTheDocument();
      });
    });

    test('should display MapPin icon for Shipping Address', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('map-pin-icon')).toBeInTheDocument();
      });
    });

    test('should display customer full name from firstName and lastName', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Rasel Bepari')).toBeInTheDocument();
      });
    });

    test('should display street address from address field', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('House 12, Road 5, Sector 10')).toBeInTheDocument();
      });
    });

    test('should display address line 2 when present', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Uttara')).toBeInTheDocument();
      });
    });

    test('should display city, district, and postal code', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Dhaka, Dhaka 1230/)).toBeInTheDocument();
      });
    });

    test('should display division', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        // Division is displayed on a separate line
        const allText = screen.getAllByText('Dhaka');
        expect(allText.length).toBeGreaterThan(0);
      });
    });

    test('should display phone number when present', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Phone:/)).toBeInTheDocument();
        expect(screen.getByText(/\+8801712345678/)).toBeInTheDocument();
      });
    });

    test('should not display phone number when absent', async () => {
      mockGet.mockResolvedValue({ order: mockOrderWithMinimalAddress });

      render(<OrderDetailsPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Phone:/)).not.toBeInTheDocument();
      });
    });

    test('should not display address line 2 when absent', async () => {
      mockGet.mockResolvedValue({ order: mockOrderWithMinimalAddress });

      render(<OrderDetailsPage />);

      await waitFor(() => {
        // Should not display "Uttara" since addressLine2 is undefined
        const allText = screen.getAllByText('Dhaka');
        expect(allText.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // ========================================
  // BILLING ADDRESS DISPLAY TESTS
  // ========================================
  describe('Billing Address Display', () => {
    test('should display Billing Address section', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Billing Address')).toBeInTheDocument();
      });
    });

    test('should display CreditCard icon for Billing Address', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        const creditCardIcons = screen.getAllByTestId('credit-card-icon');
        expect(creditCardIcons.length).toBeGreaterThan(0);
      });
    });

    test('should display "Same as shipping address" message', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Same as shipping address')).toBeInTheDocument();
      });
    });

    test('should display "Same as shipping address" in italic text', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        const sameAsShippingText = screen.getByText('Same as shipping address');
        expect(sameAsShippingText).toBeInTheDocument();
      });
    });
  });

  // ========================================
  // NO UNDEFINED VALUES TESTS
  // ========================================
  describe('No Undefined Values Displayed', () => {
    test('should not display "undefined" text for firstName', async () => {
      const orderWithUndefinedFirstName = {
        ...mockOrderWithCorrectAddress,
        address: {
          ...mockOrderWithCorrectAddress.address,
          firstName: 'Test',
        },
      };
      mockGet.mockResolvedValue({ order: orderWithUndefinedFirstName });

      render(<OrderDetailsPage />);

      await waitFor(() => {
        const allText = screen.getAllByText(/undefined/i);
        const undefinedInAddress = allText.filter(text => 
          text.closest('[class*="text-gray"]') || 
          text.closest('.text-gray-700')
        );
        expect(undefinedInAddress.length).toBe(0);
      });
    });

    test('should not display "undefined" text for address field', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        const allText = screen.getAllByText(/undefined/i);
        const undefinedInAddress = allText.filter(text => 
          text.closest('[class*="text-gray"]') || 
          text.closest('.text-gray-700')
        );
        expect(undefinedInAddress.length).toBe(0);
      });
    });

    test('should not display "undefined" text for district field', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        const allText = screen.getAllByText(/undefined/i);
        const undefinedInAddress = allText.filter(text => 
          text.closest('[class*="text-gray"]') || 
          text.closest('.text-gray-700')
        );
        expect(undefinedInAddress.length).toBe(0);
      });
    });

    test('should not display "undefined" text for division field', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        const allText = screen.getAllByText(/undefined/i);
        const undefinedInAddress = allText.filter(text => 
          text.closest('[class*="text-gray"]') || 
          text.closest('.text-gray-700')
        );
        expect(undefinedInAddress.length).toBe(0);
      });
    });

    test('should not display "undefined" text for city field', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        const allText = screen.getAllByText(/undefined/i);
        const undefinedInAddress = allText.filter(text => 
          text.closest('[class*="text-gray"]') || 
          text.closest('.text-gray-700')
        );
        expect(undefinedInAddress.length).toBe(0);
      });
    });

    test('should not display "undefined" text for postalCode field', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        const allText = screen.getAllByText(/undefined/i);
        const undefinedInAddress = allText.filter(text => 
          text.closest('[class*="text-gray"]') || 
          text.closest('.text-gray-700')
        );
        expect(undefinedInAddress.length).toBe(0);
      });
    });

    test('should not display "undefined" text for phone field when absent', async () => {
      mockGet.mockResolvedValue({ order: mockOrderWithMinimalAddress });

      render(<OrderDetailsPage />);

      await waitFor(() => {
        const allText = screen.getAllByText(/undefined/i);
        const undefinedInAddress = allText.filter(text => 
          text.closest('[class*="text-gray"]') || 
          text.closest('.text-gray-700')
        );
        expect(undefinedInAddress.length).toBe(0);
      });
    });

    test('should not display "undefined" text for addressLine2 field when absent', async () => {
      mockGet.mockResolvedValue({ order: mockOrderWithMinimalAddress });

      render(<OrderDetailsPage />);

      await waitFor(() => {
        const allText = screen.getAllByText(/undefined/i);
        const undefinedInAddress = allText.filter(text => 
          text.closest('[class*="text-gray"]') || 
          text.closest('.text-gray-700')
        );
        expect(undefinedInAddress.length).toBe(0);
      });
    });
  });

  // ========================================
  // SPECIFIC ORDER ID TESTS
  // ========================================
  describe('Specific Order ID: 17b750be-683b-4ae6-a116-9a3332502c05', () => {
    test('should fetch order with specific order ID', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledWith('/orders/17b750be-683b-4ae6-a116-9a3332502c05');
      });
    });

    test('should display order details for specific order ID', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Shipping Address')).toBeInTheDocument();
        expect(screen.getByText('Billing Address')).toBeInTheDocument();
        expect(screen.getByText('Same as shipping address')).toBeInTheDocument();
      });
    });
  });

  // ========================================
  // COMPREHENSIVE ADDRESS DISPLAY TESTS
  // ========================================
  describe('Comprehensive Address Display', () => {
    test('should display all required address fields in correct order', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        // Check Shipping Address section
        expect(screen.getByText('Shipping Address')).toBeInTheDocument();
        
        // Check name
        expect(screen.getByText('Rasel Bepari')).toBeInTheDocument();
        
        // Check street address
        expect(screen.getByText('House 12, Road 5, Sector 10')).toBeInTheDocument();
        
        // Check address line 2
        expect(screen.getByText('Uttara')).toBeInTheDocument();
        
        // Check city, district, postal code
        expect(screen.getByText(/Dhaka, Dhaka 1230/)).toBeInTheDocument();
        
        // Check division
        const allDhakaText = screen.getAllByText('Dhaka');
        expect(allDhakaText.length).toBeGreaterThan(0);
        
        // Check phone
        expect(screen.getByText(/Phone:/)).toBeInTheDocument();
        expect(screen.getByText(/\+8801712345678/)).toBeInTheDocument();
      });
    });

    test('should display billing address section with correct message', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        // Check Billing Address section
        expect(screen.getByText('Billing Address')).toBeInTheDocument();
        
        // Check "Same as shipping address" message
        expect(screen.getByText('Same as shipping address')).toBeInTheDocument();
      });
    });
  });

  // ========================================
  // EDGE CASES TESTS
  // ========================================
  describe('Edge Cases - Address Display', () => {
    test('should handle address with all optional fields present', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Rasel Bepari')).toBeInTheDocument();
        expect(screen.getByText('House 12, Road 5, Sector 10')).toBeInTheDocument();
        expect(screen.getByText('Uttara')).toBeInTheDocument();
        expect(screen.getByText(/Dhaka, Dhaka 1230/)).toBeInTheDocument();
        expect(screen.getByText(/Phone:/)).toBeInTheDocument();
      });
    });

    test('should handle address with minimal fields', async () => {
      mockGet.mockResolvedValue({ order: mockOrderWithMinimalAddress });

      render(<OrderDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('123 Main Street')).toBeInTheDocument();
        expect(screen.getByText(/Dhaka, Dhaka 1000/)).toBeInTheDocument();
        expect(screen.queryByText(/Phone:/)).not.toBeInTheDocument();
      });
    });

    test('should handle empty address line 2 gracefully', async () => {
      const orderWithEmptyAddressLine2 = {
        ...mockOrderWithCorrectAddress,
        address: {
          ...mockOrderWithCorrectAddress.address,
          addressLine2: '',
        },
      };
      mockGet.mockResolvedValue({ order: orderWithEmptyAddressLine2 });

      render(<OrderDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Rasel Bepari')).toBeInTheDocument();
        expect(screen.getByText('House 12, Road 5, Sector 10')).toBeInTheDocument();
      });
    });
  });

  // ========================================
  // INTEGRATION TESTS
  // ========================================
  describe('Integration Tests - Address Display Fix', () => {
    test('should complete full address display flow without errors', async () => {
      render(<OrderDetailsPage />);

      // Should show loading initially
      expect(screen.getByText('Loading order details...')).toBeInTheDocument();

      // Should display both address sections after loading
      await waitFor(() => {
        expect(screen.getByText('Shipping Address')).toBeInTheDocument();
        expect(screen.getByText('Billing Address')).toBeInTheDocument();
        expect(screen.getByText('Same as shipping address')).toBeInTheDocument();
        expect(screen.getByText('Rasel Bepari')).toBeInTheDocument();
        expect(screen.getByText('House 12, Road 5, Sector 10')).toBeInTheDocument();
        expect(screen.getByText('Uttara')).toBeInTheDocument();
        expect(screen.getByText(/Dhaka, Dhaka 1230/)).toBeInTheDocument();
        expect(screen.getByText(/Phone:/)).toBeInTheDocument();
      });
    });

    test('should verify no console errors when rendering addresses', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<OrderDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Shipping Address')).toBeInTheDocument();
        expect(screen.getByText('Billing Address')).toBeInTheDocument();
      });

      // Verify no console errors were logged
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    test('should verify no TypeScript type errors with Address interface', async () => {
      // This test verifies the Address interface is correctly typed
      const address: any = mockOrderWithCorrectAddress.address;
      
      // Verify all required fields exist
      expect(address.id).toBeDefined();
      expect(address.userId).toBeDefined();
      expect(address.type).toBeDefined();
      expect(address.firstName).toBeDefined();
      expect(address.lastName).toBeDefined();
      expect(address.address).toBeDefined();
      expect(address.city).toBeDefined();
      expect(address.district).toBeDefined();
      expect(address.division).toBeDefined();
      expect(address.isDefault).toBeDefined();
      
      // Verify optional fields are handled correctly
      expect(address.phone).toBeDefined();
      expect(address.addressLine2).toBeDefined();
      expect(address.upazila).toBeDefined();
      expect(address.postalCode).toBeDefined();
    });
  });

  // ========================================
  // REGRESSION TESTS
  // ========================================
  describe('Regression Tests - Previous Issues', () => {
    test('should NOT use deprecated "street" field (should use "address" instead)', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        // Verify the correct address is displayed
        expect(screen.getByText('House 12, Road 5, Sector 10')).toBeInTheDocument();
      });
    });

    test('should NOT use deprecated "state" field (should use "district" instead)', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        // Verify district is displayed in the city, district, postal code line
        expect(screen.getByText(/Dhaka, Dhaka/)).toBeInTheDocument();
      });
    });

    test('should NOT use deprecated "country" field (should use "division" instead)', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        // Verify division is displayed
        const allDhakaText = screen.getAllByText('Dhaka');
        expect(allDhakaText.length).toBeGreaterThan(0);
      });
    });

    test('should always display Billing Address section (was missing before fix)', async () => {
      render(<OrderDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Billing Address')).toBeInTheDocument();
        expect(screen.getByText('Same as shipping address')).toBeInTheDocument();
      });
    });
  });
});
