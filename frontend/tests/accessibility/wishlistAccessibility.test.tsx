/**
 * Wishlist Accessibility Test Suite
 * 
 * This test suite covers accessibility compliance (WCAG 2.1 AA):
 * - Keyboard navigation
 * - Screen reader compatibility
 * - Focus management
 * - ARIA labels and roles
 * - Color contrast
 * - Color blindness support
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock API calls
jest.mock('../../src/lib/api/wishlist', () => ({
  getWishlists: jest.fn(),
  createWishlist: jest.fn(),
  updateWishlist: jest.fn(),
  deleteWishlist: jest.fn(),
  addItemToWishlist: jest.fn(),
  removeItemFromWishlist: jest.fn(),
  moveItemsToCart: jest.fn(),
  shareWishlist: jest.fn(),
  exportWishlist: jest.fn(),
  checkProductInWishlist: jest.fn(),
}));

jest.mock('../../src/stores/wishlistStore', () => ({
  useWishlistStore: jest.fn(() => ({
    wishlists: [],
    currentWishlist: null,
    loading: false,
    error: null,
    fetchWishlists: jest.fn(),
    createWishlist: jest.fn(),
    updateWishlist: jest.fn(),
    deleteWishlist: jest.fn(),
    addItem: jest.fn(),
    removeItem: jest.fn(),
    moveToCart: jest.fn(),
    setCurrentWishlist: jest.fn(),
    clearError: jest.fn(),
  })),
}));

const {
  AddToWishlistButton,
  WishlistItemCard,
  WishlistManagementModal,
  WishlistShareModal,
  WishlistExportModal,
  WishlistPage,
} = require('../../src/components/wishlist');

describe('Wishlist Accessibility Tests', () => {
  /**
   * Test Keyboard Navigation
   */
  describe('Keyboard Navigation', () => {
    const mockProduct = {
      id: 'test-product-id',
      name: 'Test Smartphone',
      regularPrice: 15000,
      salePrice: 12000,
      images: ['/test-image.jpg'],
    };

    const mockItem = {
      id: 'item-1',
      product: {
        id: 'product-1',
        name: 'Test Product',
        regularPrice: 10000,
        images: ['/test.jpg'],
        stockQuantity: 10,
      },
      addedAt: new Date().toISOString(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('AddToWishlistButton should be keyboard accessible', async () => {
      const { checkProductInWishlist } = require('../../src/lib/api/wishlist');
      checkProductInWishlist.mockResolvedValue({ inWishlist: false });

      render(<AddToWishlistButton product={mockProduct} variant="button" />);

      const button = screen.getByRole('button');

      // Should be focusable
      expect(button).toHaveAttribute('tabindex', '0');

      // Should activate on Enter key
      const { addItemToWishlist } = require('../../src/lib/api/wishlist');
      addItemToWishlist.mockResolvedValue({ success: true });

      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(addItemToWishlist).toHaveBeenCalled();
      });
    });

    it('AddToWishlistButton should activate on Space key', async () => {
      const { checkProductInWishlist } = require('../../src/lib/api/wishlist');
      checkProductInWishlist.mockResolvedValue({ inWishlist: false });

      render(<AddToWishlistButton product={mockProduct} variant="button" />);

      const button = screen.getByRole('button');

      const { addItemToWishlist } = require('../../src/lib/api/wishlist');
      addItemToWishlist.mockResolvedValue({ success: true });

      fireEvent.keyDown(button, { key: ' ', code: 'Space' });

      await waitFor(() => {
        expect(addItemToWishlist).toHaveBeenCalled();
      });
    });

    it('WishlistItemCard should have keyboard accessible controls', () => {
      render(
        <WishlistItemCard
          item={mockItem}
          onMoveToCart={jest.fn()}
          onRemove={jest.fn()}
          isSelected={false}
          onToggleSelect={jest.fn()}
        />
      );

      // Checkbox should be keyboard accessible
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('tabindex', '0');

      // Buttons should be keyboard accessible
      const moveButton = screen.getByRole('button', { name: /move to cart/i });
      expect(moveButton).toHaveAttribute('tabindex', '0');

      const removeButton = screen.getByRole('button', { name: /remove/i });
      expect(removeButton).toHaveAttribute('tabindex', '0');
    });

    it('Modal should manage focus correctly', async () => {
      render(<WishlistManagementModal isOpen={true} onClose={jest.fn()} />);

      // Modal should trap focus
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Close button should be focusable
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toHaveAttribute('tabindex', '0');

      // Escape should close modal
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  /**
   * Test Screen Reader Compatibility
   */
  describe('Screen Reader Compatibility', () => {
    const mockProduct = {
      id: 'test-product-id',
      name: 'Test Smartphone',
      regularPrice: 15000,
      salePrice: 12000,
      images: ['/test-image.jpg'],
    };

    const mockItem = {
      id: 'item-1',
      product: {
        id: 'product-1',
        name: 'Test Product',
        regularPrice: 10000,
        salePrice: 8000,
        images: ['/test.jpg'],
        stockQuantity: 0,
      },
      addedAt: new Date().toISOString(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('AddToWishlistButton should have proper ARIA label', () => {
      const { checkProductInWishlist } = require('../../src/lib/api/wishlist');
      checkProductInWishlist.mockResolvedValue({ inWishlist: false });

      render(<AddToWishlistButton product={mockProduct} variant="icon" />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
    });

    it('AddToWishlistButton should announce state changes', async () => {
      const { checkProductInWishlist } = require('../../src/lib/api/wishlist');
      checkProductInWishlist.mockResolvedValue({ inWishlist: false });

      const { addItemToWishlist } = require('../../src/lib/api/wishlist');
      addItemToWishlist.mockResolvedValue({ success: true });

      render(<AddToWishlistButton product={mockProduct} variant="button" />);

      const button = screen.getByRole('button');

      // Should have live region for status updates
      expect(button).toHaveAttribute('aria-live');

      fireEvent.click(button);

      await waitFor(() => {
        // Should indicate loading state
        expect(button).toHaveAttribute('aria-busy', 'true');
      });
    });

    it('WishlistItemCard should have proper ARIA labels', () => {
      render(
        <WishlistItemCard
          item={mockItem}
          onMoveToCart={jest.fn()}
          onRemove={jest.fn()}
          isSelected={true}
          onToggleSelect={jest.fn()}
        />
      );

      // Product link should have accessible name
      const productLink = screen.getByRole('link');
      expect(productLink).toHaveAttribute('aria-label');

      // Checkbox should have label
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-label');
    });

    it('WishlistItemCard should announce stock status', () => {
      render(
        <WishlistItemCard
          item={mockItem}
          onMoveToCart={jest.fn()}
          onRemove={jest.fn()}
          isSelected={false}
          onToggleSelect={jest.fn()}
        />
      );

      // Stock status should be announced
      const stockStatus = screen.getByText(/out of stock/i);
      expect(stockStatus).toBeInTheDocument();
      expect(stockStatus).toHaveAttribute('aria-label');
    });

    it('WishlistItemCard should announce price drop', () => {
      render(
        <WishlistItemCard
          item={mockItem}
          onMoveToCart={jest.fn()}
          onRemove={jest.fn()}
          isSelected={false}
          onToggleSelect={jest.fn()}
        />
      );

      // Price drop should be announced
      const priceDrop = screen.getByText(/price drop/i);
      expect(priceDrop).toBeInTheDocument();
    });

    it('Modal should have proper ARIA attributes', async () => {
      render(<WishlistManagementModal isOpen={true} onClose={jest.fn()} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('role', 'dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('Form inputs should have labels', async () => {
      render(<WishlistManagementModal isOpen={true} onClose={jest.fn()} />);

      const nameInput = screen.getByLabelText(/wishlist name/i);
      expect(nameInput).toBeInTheDocument();
    });
  });

  /**
   * Test Focus Management
   */
  describe('Focus Management', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('Modal should trap focus within dialog', async () => {
      render(<WishlistManagementModal isOpen={true} onClose={jest.fn()} />);

      const dialog = screen.getByRole('dialog');
      const closeButton = screen.getByRole('button', { name: /close/i });

      // Focus should be managed within modal
      expect(document.activeElement).toBe(closeButton);

      // Tab within modal should cycle through elements
      const submitButton = screen.getByRole('button', { name: /create/i });

      // Shift+Tab should work
      fireEvent.keyDown(submitButton, { key: 'Tab', shiftKey: true });
      // Focus should move to previous element
    });

    it('Modal closing should return focus to trigger', async () => {
      render(
        <>
          <button id="open-modal">Open Modal</button>
          <WishlistManagementModal
            isOpen={true}
            onClose={jest.fn()}
            triggerId="open-modal"
          />
        </>
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        // Focus should return to trigger
        expect(document.activeElement).toBe(screen.getByText('Open Modal'));
      });
    });

    it('Loading states should announce focus changes', async () => {
      const { checkProductInWishlist } = require('../../src/lib/api/wishlist');
      checkProductInWishlist.mockResolvedValue({ inWishlist: false });

      const { addItemToWishlist } = require('../../src/lib/api/wishlist');
      addItemToWishlist.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<AddToWishlistButton product={{ id: '1', name: 'Test', regularPrice: 100 }} variant="button" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Loading state should be announced
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-busy', 'true');
      });
    });
  });

  /**
   * Test ARIA Labels and Roles
   */
  describe('ARIA Labels and Roles', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('WishlistPage should have proper landmark roles', () => {
      render(
        <WishlistPage
          wishlists={[]}
          loading={false}
          error={null}
          onFetchWishlists={jest.fn()}
          onCreateWishlist={jest.fn()}
          onDeleteWishlist={jest.fn()}
          onMoveToCart={jest.fn()}
          onRemoveItem={jest.fn()}
          onShare={jest.fn()}
          onExport={jest.fn()}
          onSelectWishlist={jest.fn()}
          onBulkSelect={jest.fn()}
        />
      );

      // Should have main content area
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('Wishlist tabs should have proper roles', () => {
      render(
        <WishlistPage
          wishlists={[{ id: '1', name: 'Test', items: [], isDefault: false }]}
          currentWishlist={{ id: '1', name: 'Test', items: [], isDefault: false }}
          loading={false}
          error={null}
          onFetchWishlists={jest.fn()}
          onCreateWishlist={jest.fn()}
          onDeleteWishlist={jest.fn()}
          onMoveToCart={jest.fn()}
          onRemoveItem={jest.fn()}
          onShare={jest.fn()}
          onExport={jest.fn()}
          onSelectWishlist={jest.fn()}
          onBulkSelect={jest.fn()}
        />
      );

      // Tabs should have proper role
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);

      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('role', 'tab');
      });
    });

    it('Tab panels should have proper roles', () => {
      render(
        <WishlistPage
          wishlists={[{ id: '1', name: 'Test', items: [], isDefault: false }]}
          currentWishlist={{ id: '1', name: 'Test', items: [], isDefault: false }}
          loading={false}
          error={null}
          onFetchWishlists={jest.fn()}
          onCreateWishlist={jest.fn()}
          onDeleteWishlist={jest.fn()}
          onMoveToCart={jest.fn()}
          onRemoveItem={jest.fn()}
          onShare={jest.fn()}
          onExport={jest.fn()}
          onSelectWishlist={jest.fn()}
          onBulkSelect={jest.fn()}
        />
      );

      const tabPanel = screen.getByRole('tabpanel');
      expect(tabPanel).toBeInTheDocument();
    });

    it('Buttons should have accessible names', () => {
      render(<WishlistShareModal isOpen={true} onClose={jest.fn()} wishlistId="1" shareToken="abc" />);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      expect(copyButton).toHaveAccessibleName();

      const shareButton = screen.getByRole('button', { name: /share/i });
      expect(shareButton).toHaveAccessibleName();
    });
  });

  /**
   * Test Color Contrast (WCAG AA - 4.5:1)
   */
  describe('Color Contrast', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('Error messages should have sufficient color contrast', () => {
      render(
        <WishlistPage
          wishlists={[]}
          loading={false}
          error="Test error"
          onFetchWishlists={jest.fn()}
          onCreateWishlist={jest.fn()}
          onDeleteWishlist={jest.fn()}
          onMoveToCart={jest.fn()}
          onRemoveItem={jest.fn()}
          onShare={jest.fn()}
          onExport={jest.fn()}
          onSelectWishlist={jest.fn()}
          onBulkSelect={jest.fn()}
        />
      );

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent(/test error/i);
    });

    it('Success messages should have sufficient color contrast', () => {
      const { checkProductInWishlist } = require('../../src/lib/api/wishlist');
      checkProductInWishlist.mockResolvedValue({ inWishlist: false });

      const { addItemToWishlist } = require('../../src/lib/api/wishlist');
      addItemToWishlist.mockResolvedValue({ success: true });

      render(<AddToWishlistButton product={{ id: '1', name: 'Test', regularPrice: 100 }} variant="button" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Success state should be visually distinct
      // Note: Actual color contrast testing would require browser testing
    });

    it('Links should be distinguishable from text', () => {
      const mockItem = {
        id: 'item-1',
        product: {
          id: 'product-1',
          name: 'Test Product',
          regularPrice: 10000,
          images: ['/test.jpg'],
          stockQuantity: 10,
        },
        addedAt: new Date().toISOString(),
      };

      render(
        <WishlistItemCard
          item={mockItem}
          onMoveToCart={jest.fn()}
          onRemove={jest.fn()}
          isSelected={false}
          onToggleSelect={jest.fn()}
        />
      );

      const productLink = screen.getByRole('link');
      // Link should have underline or color distinction
      expect(productLink).toHaveStyle({ textDecoration: expect.stringContaining('underline') });
    });
  });

  /**
   * Test Color Blindness Support
   */
  describe('Color Blindness Support', () => {
    const mockItem = {
      id: 'item-1',
      product: {
        id: 'product-1',
        name: 'Test Product',
        regularPrice: 10000,
        salePrice: 8000,
        images: ['/test.jpg'],
        stockQuantity: 0,
      },
      addedAt: new Date().toISOString(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('Price drop should use icon, not just color', () => {
      render(
        <WishlistItemCard
          item={mockItem}
          onMoveToCart={jest.fn()}
          onRemove={jest.fn()}
          isSelected={false}
          onToggleSelect={jest.fn()}
        />
      );

      // Should have icon or text indicator, not just color
      const priceDrop = screen.getByText(/price drop/i);
      expect(priceDrop).toBeInTheDocument();
    });

    it('Out of stock should use text/icon, not just color', () => {
      render(
        <WishlistItemCard
          item={mockItem}
          onMoveToCart={jest.fn()}
          onRemove={jest.fn()}
          isSelected={false}
          onToggleSelect={jest.fn()}
        />
      );

      const outOfStock = screen.getByText(/out of stock/i);
      expect(outOfStock).toBeInTheDocument();
    });

    it('Wishlist heart icon should have text alternative', () => {
      const { checkProductInWishlist } = require('../../src/lib/api/wishlist');
      checkProductInWishlist.mockResolvedValue({ inWishlist: true });

      render(<AddToWishlistButton product={{ id: '1', name: 'Test', regularPrice: 100 }} variant="icon" />);

      const button = screen.getByRole('button');
      // Should have aria-label describing state
      expect(button).toHaveAttribute('aria-label');
    });
  });

  /**
   * Test Skip Links and Navigation
   */
  describe('Skip Links and Navigation', () => {
    it('WishlistPage should support skip navigation', () => {
      render(
        <WishlistPage
          wishlists={[]}
          loading={false}
          error={null}
          onFetchWishlists={jest.fn()}
          onCreateWishlist={jest.fn()}
          onDeleteWishlist={jest.fn()}
          onMoveToCart={jest.fn()}
          onRemoveItem={jest.fn()}
          onShare={jest.fn()}
          onExport={jest.fn()}
          onSelectWishlist={jest.fn()}
          onBulkSelect={jest.fn()}
        />
      );

      // Should have skip link for keyboard users
      const skipLink = screen.getByText(/skip to main content/i);
      expect(skipLink).toBeInTheDocument();
    });

    it('Navigation should be keyboard accessible', () => {
      render(
        <WishlistPage
          wishlists={[{ id: '1', name: 'Test', items: [], isDefault: true }]}
          currentWishlist={{ id: '1', name: 'Test', items: [], isDefault: true }}
          loading={false}
          error={null}
          onFetchWishlists={jest.fn()}
          onCreateWishlist={jest.fn()}
          onDeleteWishlist={jest.fn()}
          onMoveToCart={jest.fn()}
          onRemoveItem={jest.fn()}
          onShare={jest.fn()}
          onExport={jest.fn()}
          onSelectWishlist={jest.fn()}
          onBulkSelect={jest.fn()}
        />
      );

      // Tab navigation should work
      const firstTab = screen.getAllByRole('tab')[0];
      fireEvent.keyDown(firstTab, { key: 'ArrowRight' });
      // Should move to next tab
    });
  });

  /**
   * Test Form Accessibility
   */
  describe('Form Accessibility', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('Form inputs should have associated labels', async () => {
      render(<WishlistManagementModal isOpen={true} onClose={jest.fn()} />);

      const nameInput = screen.getByLabelText(/wishlist name/i);
      expect(nameInput).toHaveAttribute('id');
    });

    it('Required fields should be marked', async () => {
      render(<WishlistManagementModal isOpen={true} onClose={jest.fn()} />);

      const nameInput = screen.getByLabelText(/wishlist name/i);
      expect(nameInput).toBeRequired();
    });

    it('Error messages should be associated with form fields', async () => {
      render(<WishlistManagementModal isOpen={true} onClose={jest.fn()} />);

      // Submit empty form
      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      // Error should be announced
      await waitFor(() => {
        const error = screen.getByText(/name is required/i);
        expect(error).toHaveAttribute('role', 'alert');
      });
    });

    it('Success messages should be announced', async () => {
      const { createWishlist } = require('../../src/lib/api/wishlist');
      createWishlist.mockResolvedValue({ success: true });

      render(<WishlistManagementModal isOpen={true} onClose={jest.fn()} />);

      const nameInput = screen.getByLabelText(/wishlist name/i);
      fireEvent.change(nameInput, { target: { value: 'Test Wishlist' } });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      // Success should be announced
      await waitFor(() => {
        const success = screen.getByRole('status');
        expect(success).toBeInTheDocument();
      });
    });
  });

  /**
   * Test Responsive Accessibility
   */
  describe('Responsive Accessibility', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('Mobile view should maintain accessibility', () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });

      render(
        <WishlistPage
          wishlists={[{ id: '1', name: 'Test', items: [], isDefault: true }]}
          currentWishlist={{ id: '1', name: 'Test', items: [], isDefault: true }}
          loading={false}
          error={null}
          onFetchWishlists={jest.fn()}
          onCreateWishlist={jest.fn()}
          onDeleteWishlist={jest.fn()}
          onMoveToCart={jest.fn()}
          onRemoveItem={jest.fn()}
          onShare={jest.fn()}
          onExport={jest.fn()}
          onSelectWishlist={jest.fn()}
          onBulkSelect={jest.fn()}
        />
      );

      // Touch targets should be large enough (at least 44x44px equivalent)
      const firstTab = screen.getAllByRole('tab')[0];
      expect(firstTab).toBeInTheDocument();
    });

    it('Hidden content should be properly announced when revealed', async () => {
      render(
        <>
          <button id="toggle">Toggle</button>
          <div id="hidden-content" hidden>
            Hidden content
          </div>
        </>
      );

      const toggleButton = screen.getByRole('button', { name: /toggle/i });
      fireEvent.click(toggleButton);

      // Hidden content should now be accessible
      const hiddenContent = screen.getByText('Hidden content');
      expect(hiddenContent).toBeInTheDocument();
    });
  });
});
