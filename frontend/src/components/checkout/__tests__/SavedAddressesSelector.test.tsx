/**
 * SavedAddressesSelector Component - Comprehensive Test Suite
 * 
 * This test suite verifies the SavedAddressesSelector component.
 * Features tested:
 * - Rendering with addresses
 * - Loading state
 * - Error state
 * - Empty state
 * - Address selection
 * - Address type filtering
 * - Action buttons (edit, delete, add new)
 * - Keyboard navigation
 * - Accessibility
 * 
 * Files Tested:
 * - frontend/src/components/checkout/SavedAddressesSelector.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SavedAddressesSelector } from '@/components/checkout/SavedAddressesSelector';
import { Address } from '@/lib/api/profile';
import { getDistrictById } from '@/data/bangladesh-data';

// Mock getDistrictById
jest.mock('@/data/bangladesh-data', () => ({
  getDistrictById: jest.fn((id: string) => {
    const districts: Record<string, { name: string; nameBn: string }> = {
      '1': { name: 'Dhaka', nameBn: 'ঢাকা' },
      '2': { name: 'Chittagong', nameBn: 'চট্টগ্রাম' },
    };
    return districts[id] || { name: id, nameBn: id };
  }),
}));

// Mock window.confirm
global.confirm = jest.fn(() => true);

describe('SavedAddressesSelector Component', () => {
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
      type: 'BILLING',
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

  const defaultProps = {
    addresses: mockAddresses,
    selectedAddressId: null,
    onSelect: jest.fn(),
    onAddNew: jest.fn(),
    language: 'en' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering with Addresses', () => {
    it('should render the component with addresses', () => {
      render(<SavedAddressesSelector {...defaultProps} />);

      expect(screen.getByText('Saved Addresses')).toBeInTheDocument();
      expect(screen.getByText('(2)')).toBeInTheDocument();
    });

    it('should render address cards for each address', () => {
      render(<SavedAddressesSelector {...defaultProps} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('123 Main Street')).toBeInTheDocument();
      expect(screen.getByText('456 Oak Avenue')).toBeInTheDocument();
    });

    it('should display address type badges', () => {
      render(<SavedAddressesSelector {...defaultProps} />);

      expect(screen.getByText('Shipping')).toBeInTheDocument();
      expect(screen.getByText('Billing')).toBeInTheDocument();
    });

    it('should display default badge for default address', () => {
      render(<SavedAddressesSelector {...defaultProps} />);

      expect(screen.getByText('Default')).toBeInTheDocument();
    });

    it('should display phone numbers', () => {
      render(<SavedAddressesSelector {...defaultProps} />);

      expect(screen.getByText('01712345678')).toBeInTheDocument();
      expect(screen.getByText('01812345678')).toBeInTheDocument();
    });

    it('should display postal codes', () => {
      render(<SavedAddressesSelector {...defaultProps} />);

      expect(screen.getByText('Postal Code: 1000')).toBeInTheDocument();
      expect(screen.getByText('Postal Code: 2000')).toBeInTheDocument();
    });

    it('should render add new button in header', () => {
      render(<SavedAddressesSelector {...defaultProps} />);

      expect(screen.getByText('+ Add New')).toBeInTheDocument();
    });

    it('should render add new button at bottom when below maxVisible', () => {
      render(<SavedAddressesSelector {...defaultProps} maxVisible={5} />);

      expect(screen.getByText('Add New Address')).toBeInTheDocument();
    });

    it('should not render add new button at bottom when at maxVisible', () => {
      render(<SavedAddressesSelector {...defaultProps} maxVisible={2} />);

      expect(screen.queryByText('Add New Address')).not.toBeInTheDocument();
    });
  });

  describe('Address Selection', () => {
    it('should call onSelect when clicking an address', () => {
      const onSelect = jest.fn();
      render(<SavedAddressesSelector {...defaultProps} onSelect={onSelect} />);

      const addressCard = screen.getByText('John Doe').closest('[role="option"]');
      fireEvent.click(addressCard!);

      expect(onSelect).toHaveBeenCalledWith(mockAddresses[0]);
    });

    it('should highlight selected address', () => {
      render(<SavedAddressesSelector {...defaultProps} selectedAddressId="addr-1" />);

      const addressCard = screen.getByText('John Doe').closest('[role="option"]');
      expect(addressCard).toHaveClass('border-blue-500');
      expect(addressCard).toHaveClass('bg-blue-50');
    });

    it('should not highlight unselected address', () => {
      render(<SavedAddressesSelector {...defaultProps} selectedAddressId="addr-2" />);

      const addressCard = screen.getByText('John Doe').closest('[role="option"]');
      expect(addressCard).not.toHaveClass('border-blue-500');
      expect(addressCard).not.toHaveClass('bg-blue-50');
    });

    it('should be keyboard navigable', () => {
      const onSelect = jest.fn();
      render(<SavedAddressesSelector {...defaultProps} onSelect={onSelect} />);

      const addressCard = screen.getByText('John Doe').closest('[role="option"]');
      fireEvent.keyDown(addressCard!, { key: 'Enter' });

      expect(onSelect).toHaveBeenCalledWith(mockAddresses[0]);
    });

    it('should be keyboard navigable with space key', () => {
      const onSelect = jest.fn();
      render(<SavedAddressesSelector {...defaultProps} onSelect={onSelect} />);

      const addressCard = screen.getByText('John Doe').closest('[role="option"]');
      fireEvent.keyDown(addressCard!, { key: ' ' });

      expect(onSelect).toHaveBeenCalledWith(mockAddresses[0]);
    });

    it('should have proper ARIA attributes', () => {
      render(<SavedAddressesSelector {...defaultProps} selectedAddressId="addr-1" />);

      const addressCard = screen.getByText('John Doe').closest('[role="option"]');
      expect(addressCard).toHaveAttribute('role', 'option');
      expect(addressCard).toHaveAttribute('aria-selected', 'true');
      expect(addressCard).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Loading State', () => {
    it('should render loading state when isLoading is true', () => {
      render(<SavedAddressesSelector {...defaultProps} isLoading={true} />);

      expect(screen.getByText('Loading addresses...')).toBeInTheDocument();
    });

    it('should render Bengali loading text', () => {
      render(<SavedAddressesSelector {...defaultProps} isLoading={true} language="bn" />);

      expect(screen.getByText('ঠিকানা লোড হচ্ছে...')).toBeInTheDocument();
    });

    it('should not render addresses when loading', () => {
      render(<SavedAddressesSelector {...defaultProps} isLoading={true} />);

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Saved Addresses')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should render error state when error is provided', () => {
      render(<SavedAddressesSelector {...defaultProps} error="Failed to load addresses" />);

      expect(screen.getByText('Failed to load addresses')).toBeInTheDocument();
    });

    it('should render error message with helpful text', () => {
      render(<SavedAddressesSelector {...defaultProps} error="Failed to load addresses" />);

      expect(screen.getByText('You can enter your address manually below.')).toBeInTheDocument();
    });

    it('should render Bengali error text', () => {
      render(<SavedAddressesSelector {...defaultProps} error="Failed to load addresses" language="bn" />);

      expect(screen.getByText(/আপনি নিচে আপনার ঠিকানা ম্যানুয়ালি লিখতে পারেন/)).toBeInTheDocument();
    });

    it('should not render addresses when in error state', () => {
      render(<SavedAddressesSelector {...defaultProps} error="Failed to load addresses" />);

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render empty state when no addresses', () => {
      render(<SavedAddressesSelector {...defaultProps} addresses={[]} />);

      expect(screen.getByText('No saved addresses')).toBeInTheDocument();
    });

    it('should render empty state with helpful message', () => {
      render(<SavedAddressesSelector {...defaultProps} addresses={[]} />);

      expect(screen.getByText(/Save an address to check out faster next time/)).toBeInTheDocument();
    });

    it('should render Bengali empty state text', () => {
      render(<SavedAddressesSelector {...defaultProps} addresses={[]} language="bn" />);

      expect(screen.getByText('কোনো সংরক্ষিত ঠিকানা নেই')).toBeInTheDocument();
    });

    it('should render add new address button in empty state', () => {
      const onAddNew = jest.fn();
      render(<SavedAddressesSelector {...defaultProps} addresses={[]} onAddNew={onAddNew} />);

      const addButton = screen.getByText('Add New Address');
      fireEvent.click(addButton);

      expect(onAddNew).toHaveBeenCalled();
    });
  });

  describe('Address Type Filtering', () => {
    it('should filter addresses by SHIPPING type', () => {
      render(<SavedAddressesSelector {...defaultProps} addressType="SHIPPING" />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('should filter addresses by BILLING type', () => {
      render(<SavedAddressesSelector {...defaultProps} addressType="BILLING" />);

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should show all addresses when no type filter', () => {
      render(<SavedAddressesSelector {...defaultProps} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should update count when filtering', () => {
      const { rerender } = render(<SavedAddressesSelector {...defaultProps} addressType="SHIPPING" />);

      expect(screen.getByText('(1)')).toBeInTheDocument();

      rerender(<SavedAddressesSelector {...defaultProps} addressType={undefined} />);

      expect(screen.getByText('(2)')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should render action buttons when showActions is true', () => {
      const onEdit = jest.fn();
      const onDelete = jest.fn();
      const onSetDefault = jest.fn();

      render(
        <SavedAddressesSelector
          {...defaultProps}
          showActions={true}
          onEdit={onEdit}
          onDelete={onDelete}
          onSetDefault={onSetDefault}
        />
      );

      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should not render action buttons when showActions is false', () => {
      render(<SavedAddressesSelector {...defaultProps} showActions={false} />);

      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    it('should call onEdit when edit button is clicked', () => {
      const onEdit = jest.fn();
      render(
        <SavedAddressesSelector
          {...defaultProps}
          showActions={true}
          onEdit={onEdit}
        />
      );

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      expect(onEdit).toHaveBeenCalledWith(mockAddresses[0]);
    });

    it('should call onDelete when delete button is clicked and confirmed', () => {
      const onDelete = jest.fn();
      render(
        <SavedAddressesSelector
          {...defaultProps}
          showActions={true}
          onDelete={onDelete}
        />
      );

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      expect(global.confirm).toHaveBeenCalled();
      expect(onDelete).toHaveBeenCalledWith('addr-1');
    });

    it('should not call onDelete when delete is cancelled', () => {
      (global.confirm as jest.Mock).mockReturnValueOnce(false);
      const onDelete = jest.fn();
      render(
        <SavedAddressesSelector
          {...defaultProps}
          showActions={true}
          onDelete={onDelete}
        />
      );

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      expect(onDelete).not.toHaveBeenCalled();
    });

    it('should call onSetDefault when set default button is clicked', () => {
      const onSetDefault = jest.fn();
      render(
        <SavedAddressesSelector
          {...defaultProps}
          showActions={true}
          onSetDefault={onSetDefault}
        />
      );

      const setDefaultButton = screen.getByText('Set Default');
      fireEvent.click(setDefaultButton);

      expect(onSetDefault).toHaveBeenCalledWith('addr-2');
    });

    it('should not show set default button for default address', () => {
      render(
        <SavedAddressesSelector
          {...defaultProps}
          showActions={true}
          onSetDefault={jest.fn()}
        />
      );

      const setDefaultButtons = screen.queryAllByText('Set Default');
      expect(setDefaultButtons).toHaveLength(1); // Only for non-default address
    });
  });

  describe('Add New Button', () => {
    it('should call onAddNew when add new button in header is clicked', () => {
      const onAddNew = jest.fn();
      render(<SavedAddressesSelector {...defaultProps} onAddNew={onAddNew} />);

      const addButton = screen.getByText('+ Add New');
      fireEvent.click(addButton);

      expect(onAddNew).toHaveBeenCalled();
    });

    it('should call onAddNew when add new button at bottom is clicked', () => {
      const onAddNew = jest.fn();
      render(<SavedAddressesSelector {...defaultProps} onAddNew={onAddNew} maxVisible={5} />);

      const addButton = screen.getByText('Add New Address');
      fireEvent.click(addButton);

      expect(onAddNew).toHaveBeenCalled();
    });
  });

  describe('Bilingual Support', () => {
    it('should render English text when language is en', () => {
      render(<SavedAddressesSelector {...defaultProps} language="en" addresses={[]} />);

      expect(screen.getByText('No saved addresses')).toBeInTheDocument();
      expect(screen.getByText('Add New Address')).toBeInTheDocument();
    });

    it('should render Bengali text when language is bn', () => {
      render(<SavedAddressesSelector {...defaultProps} language="bn" addresses={[]} />);

      expect(screen.getByText('কোনো সংরক্ষিত ঠিকানা নেই')).toBeInTheDocument();
      expect(screen.getByText('নতুন ঠিকানা যোগ করুন')).toBeInTheDocument();
    });

    it('should render Bengali address type labels', () => {
      render(<SavedAddressesSelector {...defaultProps} language="bn" />);

      expect(screen.getByText('শিপিং')).toBeInTheDocument();
      expect(screen.getByText('বিলিং')).toBeInTheDocument();
    });

    it('should render Bengali default label', () => {
      render(<SavedAddressesSelector {...defaultProps} language="bn" />);

      expect(screen.getByText('ডিফল্ট')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<SavedAddressesSelector {...defaultProps} />);

      const listContainer = screen.getByRole('listbox');
      expect(listContainer).toHaveAttribute('aria-label', 'Saved addresses');
    });

    it('should be keyboard accessible', () => {
      const onSelect = jest.fn();
      render(<SavedAddressesSelector {...defaultProps} onSelect={onSelect} />);

      const addressCards = screen.getAllByRole('option');
      addressCards.forEach(card => {
        expect(card).toHaveAttribute('tabIndex', '0');
      });
    });

    it('should have proper button labels', () => {
      render(<SavedAddressesSelector {...defaultProps} />);

      const addButton = screen.getByText('+ Add New');
      expect(addButton).toHaveAttribute('aria-label', 'Add new address');
    });
  });

  describe('Edge Cases', () => {
    it('should handle addresses without phone numbers', () => {
      const addressesWithoutPhone: Address[] = [
        {
          ...mockAddresses[0],
          phone: undefined,
        },
      ];

      render(<SavedAddressesSelector {...defaultProps} addresses={addressesWithoutPhone} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('01712345678')).not.toBeInTheDocument();
    });

    it('should handle addresses without postal codes', () => {
      const addressesWithoutPostal: Address[] = [
        {
          ...mockAddresses[0],
          postalCode: undefined,
        },
      ];

      render(<SavedAddressesSelector {...defaultProps} addresses={addressesWithoutPostal} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Postal Code:')).not.toBeInTheDocument();
    });

    it('should handle addresses without addressLine2', () => {
      const addressesWithoutLine2: Address[] = [
        {
          ...mockAddresses[0],
          addressLine2: undefined,
        },
      ];

      render(<SavedAddressesSelector {...defaultProps} addresses={addressesWithoutLine2} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Apt 4B')).not.toBeInTheDocument();
    });

    it('should handle very long address text', () => {
      const longAddress = 'This is a very long address line that might contain a lot of information about the location including building name street name and other details';
      const addressesWithLongAddress: Address[] = [
        {
          ...mockAddresses[0],
          address: longAddress,
        },
      ];

      render(<SavedAddressesSelector {...defaultProps} addresses={addressesWithLongAddress} />);

      expect(screen.getByText(/This is a very long address line/)).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <SavedAddressesSelector {...defaultProps} className="custom-class" />
      );

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('should apply maxVisible scroll behavior', () => {
      const { container } = render(
        <SavedAddressesSelector {...defaultProps} maxVisible={2} />
      );

      const listContainer = container.querySelector('.space-y-3');
      expect(listContainer).toHaveStyle({ maxHeight: '320px' }); // 2 * 160px
    });
  });
});
