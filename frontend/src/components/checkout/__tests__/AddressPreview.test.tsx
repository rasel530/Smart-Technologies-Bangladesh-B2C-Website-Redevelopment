/**
 * AddressPreview Component - Comprehensive Test Suite
 * 
 * This test suite verifies the AddressPreview component.
 * Features tested:
 * - Rendering with address
 * - Empty state
 * - Edit and change buttons
 * - Shipping vs billing variants
 * - Bilingual support
 * - Accessibility
 * 
 * Files Tested:
 * - frontend/src/components/checkout/AddressPreview.tsx
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddressPreview } from '@/components/checkout/AddressPreview';
import { Address } from '@/lib/api/profile';
import { ShippingAddress } from '@/lib/utils/address';

describe('AddressPreview Component', () => {
  const mockAddress: Address = {
    id: 'addr-1',
    userId: 'user-1',
    type: 'SHIPPING',
    firstName: 'John',
    lastName: 'Doe',
    phone: '01712345678',
    address: '123 Main Street',
    addressLine2: 'Apt 4B',
    city: 'Dhaka',
    district: 'Dhaka',
    division: '1',
    postalCode: '1000',
    isDefault: true,
  };

  const mockShippingAddress: ShippingAddress = {
    fullName: 'Jane Smith',
    phone: '01812345678',
    addressLine1: '456 Oak Avenue',
    addressLine2: 'Suite 100',
    city: 'Chittagong',
    district: 'Chittagong',
    postalCode: '2000',
  };

  const defaultProps = {
    address: mockAddress,
    onChange: jest.fn(),
    language: 'en' as const,
    type: 'shipping' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering with Address (saved address)', () => {
    it('should render the component with an Address', () => {
      render(<AddressPreview {...defaultProps} />);

      expect(screen.getByText('Shipping Address')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should display all address fields', () => {
      render(<AddressPreview {...defaultProps} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('123 Main Street')).toBeInTheDocument();
      expect(screen.getByText('Apt 4B')).toBeInTheDocument();
      expect(screen.getByText('Dhaka, Dhaka 1000')).toBeInTheDocument();
      expect(screen.getByText('01712345678')).toBeInTheDocument();
    });

    it('should render truck icon for shipping type', () => {
      render(<AddressPreview {...defaultProps} type="shipping" />);

      const iconContainer = screen.getByText('Shipping Address').parentElement;
      expect(iconContainer?.querySelector('svg')).toBeInTheDocument();
    });

    it('should render credit card icon for billing type', () => {
      render(<AddressPreview {...defaultProps} type="billing" address={mockAddress} />);

      expect(screen.getByText('Billing Address')).toBeInTheDocument();
    });

    it('should render change button', () => {
      render(<AddressPreview {...defaultProps} />);

      expect(screen.getByText('Change')).toBeInTheDocument();
    });

    it('should render edit button when showEditButton is true', () => {
      const onEdit = jest.fn();
      render(<AddressPreview {...defaultProps} onEdit={onEdit} showEditButton={true} />);

      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('should not render edit button when showEditButton is false', () => {
      render(<AddressPreview {...defaultProps} showEditButton={false} />);

      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    it('should not render edit button when onEdit is not provided', () => {
      render(<AddressPreview {...defaultProps} showEditButton={true} />);

      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });
  });

  describe('Rendering with ShippingAddress (checkout form)', () => {
    it('should render the component with a ShippingAddress', () => {
      render(<AddressPreview {...defaultProps} address={mockShippingAddress} />);

      expect(screen.getByText('Shipping Address')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should display all ShippingAddress fields', () => {
      render(<AddressPreview {...defaultProps} address={mockShippingAddress} />);

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('456 Oak Avenue')).toBeInTheDocument();
      expect(screen.getByText('Suite 100')).toBeInTheDocument();
      expect(screen.getByText('Chittagong, Chittagong 2000')).toBeInTheDocument();
      expect(screen.getByText('01812345678')).toBeInTheDocument();
    });
  });

  describe('Empty State (no address selected)', () => {
    it('should render empty state when address is null', () => {
      render(<AddressPreview {...defaultProps} address={null} />);

      expect(screen.getByText('Shipping Address')).toBeInTheDocument();
      expect(screen.getByText('No address selected. Please select an address from your saved addresses or enter a new one.')).toBeInTheDocument();
    });

    it('should render select button in empty state', () => {
      render(<AddressPreview {...defaultProps} address={null} />);

      expect(screen.getByText('Select')).toBeInTheDocument();
    });

    it('should call onChange when select button is clicked', () => {
      const onChange = jest.fn();
      render(<AddressPreview {...defaultProps} address={null} onChange={onChange} />);

      const selectButton = screen.getByText('Select');
      fireEvent.click(selectButton);

      expect(onChange).toHaveBeenCalled();
    });

    it('should render empty state with dashed border', () => {
      render(<AddressPreview {...defaultProps} address={null} />);

      const emptyContainer = screen.getByText('No address selected').closest('.bg-gray-50');
      expect(emptyContainer).toHaveClass('border-dashed');
    });
  });

  describe('Change Button', () => {
    it('should call onChange when change button is clicked', () => {
      const onChange = jest.fn();
      render(<AddressPreview {...defaultProps} onChange={onChange} />);

      const changeButton = screen.getByText('Change');
      fireEvent.click(changeButton);

      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('Edit Button', () => {
    it('should call onEdit when edit button is clicked', () => {
      const onEdit = jest.fn();
      render(<AddressPreview {...defaultProps} onEdit={onEdit} showEditButton={true} />);

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      expect(onEdit).toHaveBeenCalled();
    });

    it('should render edit icon', () => {
      render(<AddressPreview {...defaultProps} onEdit={jest.fn()} showEditButton={true} />);

      const editButton = screen.getByText('Edit').parentElement;
      expect(editButton?.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Address Type Variants', () => {
    it('should display correct title for shipping type', () => {
      render(<AddressPreview {...defaultProps} type="shipping" address={mockAddress} />);

      expect(screen.getByText('Shipping Address')).toBeInTheDocument();
    });

    it('should display correct title for billing type', () => {
      render(<AddressPreview {...defaultProps} type="billing" address={mockAddress} />);

      expect(screen.getByText('Billing Address')).toBeInTheDocument();
    });

    it('should use truck icon for shipping type', () => {
      render(<AddressPreview {...defaultProps} type="shipping" address={mockAddress} />);

      const titleContainer = screen.getByText('Shipping Address').parentElement;
      expect(titleContainer?.querySelector('svg')).toBeInTheDocument();
    });

    it('should use credit card icon for billing type', () => {
      render(<AddressPreview {...defaultProps} type="billing" address={mockAddress} />);

      const titleContainer = screen.getByText('Billing Address').parentElement;
      expect(titleContainer?.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Bilingual Support', () => {
    it('should render English text when language is en', () => {
      render(<AddressPreview {...defaultProps} language="en" address={null} />);

      expect(screen.getByText('Shipping Address')).toBeInTheDocument();
      expect(screen.getByText('Select')).toBeInTheDocument();
      expect(screen.getByText('Change')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('should render Bengali text when language is bn', () => {
      render(<AddressPreview {...defaultProps} language="bn" address={null} />);

      expect(screen.getByText('শিপিং ঠিকানা')).toBeInTheDocument();
      expect(screen.getByText('নির্বাচন করুন')).toBeInTheDocument();
      expect(screen.getByText('পরিবর্তন করুন')).toBeInTheDocument();
      expect(screen.getByText('সম্পাদনা')).toBeInTheDocument();
    });

    it('should render Bengali shipping title', () => {
      render(<AddressPreview {...defaultProps} language="bn" type="shipping" address={mockAddress} />);

      expect(screen.getByText('শিপিং ঠিকানা')).toBeInTheDocument();
    });

    it('should render Bengali billing title', () => {
      render(<AddressPreview {...defaultProps} language="bn" type="billing" address={mockAddress} />);

      expect(screen.getByText('বিলিং ঠিকানা')).toBeInTheDocument();
    });
  });

  describe('Address Display Formatting', () => {
    it('should format address with all fields', () => {
      render(<AddressPreview {...defaultProps} address={mockAddress} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('123 Main Street')).toBeInTheDocument();
      expect(screen.getByText('Apt 4B')).toBeInTheDocument();
      expect(screen.getByText('Dhaka, Dhaka 1000')).toBeInTheDocument();
      expect(screen.getByText('01712345678')).toBeInTheDocument();
    });

    it('should format address without optional fields', () => {
      const addressWithoutOptional: Address = {
        ...mockAddress,
        addressLine2: undefined,
        postalCode: undefined,
      };

      render(<AddressPreview {...defaultProps} address={addressWithoutOptional} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('123 Main Street')).toBeInTheDocument();
      expect(screen.queryByText('Apt 4B')).not.toBeInTheDocument();
      expect(screen.getByText('Dhaka, Dhaka')).toBeInTheDocument();
      expect(screen.getByText('01712345678')).toBeInTheDocument();
    });

    it('should format ShippingAddress correctly', () => {
      render(<AddressPreview {...defaultProps} address={mockShippingAddress} />);

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('456 Oak Avenue')).toBeInTheDocument();
      expect(screen.getByText('Suite 100')).toBeInTheDocument();
      expect(screen.getByText('Chittagong, Chittagong 2000')).toBeInTheDocument();
      expect(screen.getByText('01812345678')).toBeInTheDocument();
    });

    it('should handle address without phone', () => {
      const addressWithoutPhone: Address = {
        ...mockAddress,
        phone: undefined,
      };

      render(<AddressPreview {...defaultProps} address={addressWithoutPhone} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('01712345678')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button labels', () => {
      render(<AddressPreview {...defaultProps} />);

      const changeButton = screen.getByText('Change');
      expect(changeButton.tagName).toBe('BUTTON');
    });

    it('should have proper button for edit', () => {
      render(<AddressPreview {...defaultProps} onEdit={jest.fn()} showEditButton={true} />);

      const editButton = screen.getByText('Edit');
      expect(editButton.tagName).toBe('BUTTON');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long address lines', () => {
      const longAddress = 'This is a very long address line that might contain a lot of information about the location including building name street name and other details';
      const addressWithLongLine: Address = {
        ...mockAddress,
        address: longAddress,
      };

      render(<AddressPreview {...defaultProps} address={addressWithLongLine} />);

      expect(screen.getByText(/This is a very long address line/)).toBeInTheDocument();
    });

    it('should handle address with special characters', () => {
      const addressWithSpecialChars: Address = {
        ...mockAddress,
        firstName: 'José',
        lastName: 'Martínez',
        address: 'Calle Principal #123',
      };

      render(<AddressPreview {...defaultProps} address={addressWithSpecialChars} />);

      expect(screen.getByText('José Martínez')).toBeInTheDocument();
      expect(screen.getByText('Calle Principal #123')).toBeInTheDocument();
    });

    it('should handle empty name', () => {
      const addressWithEmptyName: Address = {
        ...mockAddress,
        firstName: '',
        lastName: '',
      };

      render(<AddressPreview {...defaultProps} address={addressWithEmptyName} />);

      expect(screen.getByText('Dhaka, Dhaka 1000')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <AddressPreview {...defaultProps} className="custom-class" />
      );

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });
});
