/**
 * BillingAddressToggle Component - Comprehensive Test Suite
 * 
 * This test suite verifies the BillingAddressToggle component.
 * Features tested:
 * - Rendering with toggle off
 * - Rendering with toggle on
 * - Address preview when enabled
 * - Toggle on/off
 * - Bilingual support
 * - Disabled state
 * - Accessibility
 * 
 * Files Tested:
 * - frontend/src/components/checkout/BillingAddressToggle.tsx
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BillingAddressToggle } from '@/components/checkout/BillingAddressToggle';
import { ShippingAddress } from '@/lib/utils/address';

describe('BillingAddressToggle Component', () => {
  const mockShippingAddress: ShippingAddress = {
    fullName: 'John Doe',
    phone: '01712345678',
    addressLine1: '123 Main Street',
    addressLine2: 'Apt 4B',
    city: 'Dhaka',
    district: 'Dhaka',
    postalCode: '1000',
  };

  const defaultProps = {
    isSameAsShipping: false,
    onToggle: jest.fn(),
    shippingAddress: mockShippingAddress,
    language: 'en' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering with Toggle Off', () => {
    it('should render the component with toggle off', () => {
      render(<BillingAddressToggle {...defaultProps} />);

      expect(screen.getByText('Same address for billing')).toBeInTheDocument();
      expect(screen.getByText('Your billing address will be the same as your shipping address')).toBeInTheDocument();
    });

    it('should not render address preview when toggle is off', () => {
      render(<BillingAddressToggle {...defaultProps} isSameAsShipping={false} />);

      expect(screen.queryByText('Shipping Address')).not.toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('should render checkbox unchecked when toggle is off', () => {
      render(<BillingAddressToggle {...defaultProps} isSameAsShipping={false} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('Rendering with Toggle On', () => {
    it('should render the component with toggle on', () => {
      render(<BillingAddressToggle {...defaultProps} isSameAsShipping={true} />);

      expect(screen.getByText('Same address for billing')).toBeInTheDocument();
      expect(screen.getByText('Your billing address will be the same as your shipping address')).toBeInTheDocument();
    });

    it('should render address preview when toggle is on', () => {
      render(<BillingAddressToggle {...defaultProps} isSameAsShipping={true} />);

      expect(screen.getByText('Shipping Address')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('123 Main Street, Apt 4B')).toBeInTheDocument();
      expect(screen.getByText('Dhaka, Dhaka 1000')).toBeInTheDocument();
      expect(screen.getByText('01712345678')).toBeInTheDocument();
    });

    it('should render checkbox checked when toggle is on', () => {
      render(<BillingAddressToggle {...defaultProps} isSameAsShipping={true} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    it('should display "Same as shipping" badge', () => {
      render(<BillingAddressToggle {...defaultProps} isSameAsShipping={true} />);

      expect(screen.getByText('Same as shipping')).toBeInTheDocument();
    });

    it('should render map pin icon', () => {
      render(<BillingAddressToggle {...defaultProps} isSameAsShipping={true} />);

      const iconContainer = screen.getByText('Shipping Address').parentElement;
      expect(iconContainer?.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Toggle Behavior', () => {
    it('should call onToggle when checkbox is clicked', () => {
      const onToggle = jest.fn();
      render(<BillingAddressToggle {...defaultProps} onToggle={onToggle} />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(onToggle).toHaveBeenCalledWith(true);
    });

    it('should toggle from off to on', () => {
      const onToggle = jest.fn();
      render(<BillingAddressToggle {...defaultProps} onToggle={onToggle} isSameAsShipping={false} />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(onToggle).toHaveBeenCalledWith(true);
    });

    it('should toggle from on to off', () => {
      const onToggle = jest.fn();
      render(<BillingAddressToggle {...defaultProps} onToggle={onToggle} isSameAsShipping={true} />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(onToggle).toHaveBeenCalledWith(false);
    });

    it('should update UI when toggle changes', () => {
      const { rerender } = render(<BillingAddressToggle {...defaultProps} isSameAsShipping={false} />);

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();

      rerender(<BillingAddressToggle {...defaultProps} isSameAsShipping={true} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('Address Preview', () => {
    it('should display shipping address details when enabled', () => {
      render(<BillingAddressToggle {...defaultProps} isSameAsShipping={true} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('123 Main Street')).toBeInTheDocument();
      expect(screen.getByText('Apt 4B')).toBeInTheDocument();
      expect(screen.getByText('Dhaka, Dhaka 1000')).toBeInTheDocument();
      expect(screen.getByText('01712345678')).toBeInTheDocument();
    });

    it('should handle address without addressLine2', () => {
      const addressWithoutLine2: ShippingAddress = {
        ...mockShippingAddress,
        addressLine2: '',
      };

      render(<BillingAddressToggle {...defaultProps} shippingAddress={addressWithoutLine2} isSameAsShipping={true} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('123 Main Street')).toBeInTheDocument();
      expect(screen.queryByText('Apt 4B')).not.toBeInTheDocument();
    });

    it('should handle address without postal code', () => {
      const addressWithoutPostal: ShippingAddress = {
        ...mockShippingAddress,
        postalCode: '',
      };

      render(<BillingAddressToggle {...defaultProps} shippingAddress={addressWithoutPostal} isSameAsShipping={true} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('123 Main Street, Apt 4B')).toBeInTheDocument();
      expect(screen.getByText('Dhaka, Dhaka')).toBeInTheDocument();
    });
  });

  describe('Bilingual Support', () => {
    it('should render English text when language is en', () => {
      render(<BillingAddressToggle {...defaultProps} language="en" />);

      expect(screen.getByText('Same address for billing')).toBeInTheDocument();
      expect(screen.getByText('Your billing address will be the same as your shipping address')).toBeInTheDocument();
      expect(screen.getByText('Billing Address')).toBeInTheDocument();
      expect(screen.getByText('Shipping Address')).toBeInTheDocument();
      expect(screen.getByText('Same as shipping')).toBeInTheDocument();
    });

    it('should render Bengali text when language is bn', () => {
      render(<BillingAddressToggle {...defaultProps} language="bn" />);

      expect(screen.getByText('বিলিংয়র জন্য একই ঠিকানা')).toBeInTheDocument();
      expect(screen.getByText('আপনার বিলিং ঠিকানা আপনার শিপিং ঠিকানার মতোই হবে')).toBeInTheDocument();
      expect(screen.getByText('বিলিং ঠিকানা')).toBeInTheDocument();
      expect(screen.getByText('শিপিং ঠিকানা')).toBeInTheDocument();
      expect(screen.getByText('শিপিং এর মতোই')).toBeInTheDocument();
    });

    it('should render Bengali address preview', () => {
      render(<BillingAddressToggle {...defaultProps} language="bn" isSameAsShipping={true} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('123 Main Street, Apt 4B')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should render checkbox as disabled when isDisabled is true', () => {
      render(<BillingAddressToggle {...defaultProps} isDisabled={true} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
    });

    it('should not call onToggle when checkbox is disabled and clicked', () => {
      const onToggle = jest.fn();
      render(<BillingAddressToggle {...defaultProps} onToggle={onToggle} isDisabled={true} />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(onToggle).not.toHaveBeenCalled();
    });

    it('should apply opacity styling when disabled', () => {
      render(<BillingAddressToggle {...defaultProps} isDisabled={true} />);

      const container = screen.getByRole('checkbox').closest('.opacity-50');
      expect(container).toBeInTheDocument();
    });

    it('should apply cursor-not-allowed when disabled', () => {
      render(<BillingAddressToggle {...defaultProps} isDisabled={true} />);

      const container = screen.getByRole('checkbox').closest('.cursor-not-allowed');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper checkbox label', () => {
      render(<BillingAddressToggle {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-label', 'Same address for billing');
    });

    it('should have proper checkbox type', () => {
      render(<BillingAddressToggle {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('type', 'checkbox');
    });
  });

  describe('Styling', () => {
    it('should apply blue styling when toggle is on', () => {
      render(<BillingAddressToggle {...defaultProps} isSameAsShipping={true} />);

      const container = screen.getByRole('checkbox').closest('.bg-blue-50');
      expect(container).toBeInTheDocument();
    });

    it('should apply blue border when toggle is on', () => {
      render(<BillingAddressToggle {...defaultProps} isSameAsShipping={true} />);

      const container = screen.getByRole('checkbox').closest('.border-blue-200');
      expect(container).toBeInTheDocument();
    });

    it('should apply white styling when toggle is off', () => {
      render(<BillingAddressToggle {...defaultProps} isSameAsShipping={false} />);

      const container = screen.getByRole('checkbox').closest('.bg-white');
      expect(container).toBeInTheDocument();
    });

    it('should apply gray border when toggle is off', () => {
      render(<BillingAddressToggle {...defaultProps} isSameAsShipping={false} />);

      const container = screen.getByRole('checkbox').closest('.border-gray-200');
      expect(container).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <BillingAddressToggle {...defaultProps} className="custom-class" />
      );

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long address', () => {
      const longAddress = 'This is a very long address line that might contain a lot of information about the location including building name street name and other details';
      const addressWithLongLine: ShippingAddress = {
        ...mockShippingAddress,
        addressLine1: longAddress,
      };

      render(<BillingAddressToggle {...defaultProps} shippingAddress={addressWithLongLine} isSameAsShipping={true} />);

      expect(screen.getByText(/This is a very long address line/)).toBeInTheDocument();
    });

    it('should handle address with special characters', () => {
      const addressWithSpecialChars: ShippingAddress = {
        ...mockShippingAddress,
        fullName: 'José Martínez',
        addressLine1: 'Calle Principal #123',
      };

      render(<BillingAddressToggle {...defaultProps} shippingAddress={addressWithSpecialChars} isSameAsShipping={true} />);

      expect(screen.getByText('José Martínez')).toBeInTheDocument();
      expect(screen.getByText('Calle Principal #123')).toBeInTheDocument();
    });

    it('should handle empty phone number', () => {
      const addressWithoutPhone: ShippingAddress = {
        ...mockShippingAddress,
        phone: '',
      };

      render(<BillingAddressToggle {...defaultProps} shippingAddress={addressWithoutPhone} isSameAsShipping={true} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('01712345678')).not.toBeInTheDocument();
    });
  });
});
