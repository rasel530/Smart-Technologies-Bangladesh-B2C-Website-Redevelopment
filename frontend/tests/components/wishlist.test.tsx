/**
 * Wishlist Frontend Component Tests
 * 
 * This test suite covers all wishlist React components:
 * - AddToWishlistButton
 * - WishlistItemCard
 * - WishlistManagementModal
 * - WishlistShareModal
 * - WishlistExportModal
 * - WishlistPage
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Create mock functions for API calls
const mockGetWishlists = jest.fn();
const mockGetWishlistById = jest.fn();
const mockCreateWishlist = jest.fn();
const mockUpdateWishlist = jest.fn();
const mockDeleteWishlist = jest.fn();
const mockAddItemToWishlist = jest.fn();
const mockRemoveItemFromWishlist = jest.fn();
const mockMoveItemsToCart = jest.fn();
const mockShareWishlist = jest.fn();
const mockGetSharedWishlist = jest.fn();
const mockExportWishlist = jest.fn();
const mockCheckProductInWishlist = jest.fn();

// Mock the API module
jest.mock('../../src/lib/api/wishlist', () => ({
  getWishlists: (...args) => mockGetWishlists(...args),
  getWishlistById: (...args) => mockGetWishlistById(...args),
  createWishlist: (...args) => mockCreateWishlist(...args),
  updateWishlist: (...args) => mockUpdateWishlist(...args),
  deleteWishlist: (...args) => mockDeleteWishlist(...args),
  addItemToWishlist: (...args) => mockAddItemToWishlist(...args),
  removeItemFromWishlist: (...args) => mockRemoveItemFromWishlist(...args),
  moveItemsToCart: (...args) => mockMoveItemsToCart(...args),
  shareWishlist: (...args) => mockShareWishlist(...args),
  getSharedWishlist: (...args) => mockGetSharedWishlist(...args),
  exportWishlist: (...args) => mockExportWishlist(...args),
  checkProductInWishlist: (...args) => mockCheckProductInWishlist(...args),
}));

// Mock the store
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

// Import components after mocking
const {
  AddToWishlistButton,
  WishlistItemCard,
  WishlistManagementModal,
  WishlistShareModal,
  WishlistExportModal,
  WishlistPage,
} = require('../../src/components/wishlist');

describe('AddToWishlistButton Component', () => {
  const mockProduct = {
    id: 'test-product-id',
    name: 'Test Smartphone',
    regularPrice: 15000,
    salePrice: 12000,
    images: ['/test-image.jpg'],
  };

  const defaultProps = {
    product: mockProduct,
    variant: 'icon',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty heart when product is not in wishlist', async () => {
    mockCheckProductInWishlist.mockResolvedValue({ inWishlist: false });

    render(<AddToWishlistButton {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  it('adds product to wishlist on click when not in wishlist', async () => {
    mockCheckProductInWishlist.mockResolvedValue({ inWishlist: false });
    mockAddItemToWishlist.mockResolvedValue({ success: true });

    render(<AddToWishlistButton {...defaultProps} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockAddItemToWishlist).toHaveBeenCalled();
    });
  });

  it('shows loading state during API call', async () => {
    mockCheckProductInWishlist.mockResolvedValue({ inWishlist: false });
    mockAddItemToWishlist.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<AddToWishlistButton {...defaultProps} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });
});

describe('WishlistItemCard Component', () => {
  const mockItem = {
    id: 'item-1',
    product: {
      id: 'product-1',
      name: 'Test Smartphone',
      regularPrice: 15000,
      salePrice: 12000,
      images: ['/test.jpg'],
      stockQuantity: 10,
    },
    addedAt: new Date().toISOString(),
  };

  const defaultProps = {
    item: mockItem,
    onMoveToCart: jest.fn(),
    onRemove: jest.fn(),
    isSelected: false,
    onToggleSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays product information correctly', () => {
    render(<WishlistItemCard {...defaultProps} />);

    expect(screen.getByText('Test Smartphone')).toBeInTheDocument();
    expect(screen.getByText('৳12,000')).toBeInTheDocument();
  });

  it('shows in stock badge when quantity > 0', () => {
    render(<WishlistItemCard {...defaultProps} />);
    expect(screen.getByText('In Stock')).toBeInTheDocument();
  });

  it('shows out of stock badge when quantity is 0', () => {
    const outOfStockItem = {
      ...mockItem,
      product: { ...mockItem.product, stockQuantity: 0 },
    };
    render(<WishlistItemCard {...defaultProps} item={outOfStockItem} />);
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  it('calls onMoveToCart when button is clicked', () => {
    render(<WishlistItemCard {...defaultProps} />);

    const moveButton = screen.getByRole('button', { name: /move to cart/i });
    fireEvent.click(moveButton);

    expect(defaultProps.onMoveToCart).toHaveBeenCalledWith(mockItem.id);
  });

  it('toggles selection when checkbox is clicked', () => {
    render(<WishlistItemCard {...defaultProps} />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(defaultProps.onToggleSelect).toHaveBeenCalled();
  });
});

describe('WishlistManagementModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    wishlist: null,
    onSave: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens and closes correctly', () => {
    const { rerender } = render(<WishlistManagementModal {...defaultProps} isOpen={true} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    rerender(<WishlistManagementModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('creates new wishlist with valid data', async () => {
    render(<WishlistManagementModal {...defaultProps} />);

    const nameInput = screen.getByLabelText(/wishlist name/i);
    fireEvent.change(nameInput, { target: { value: 'My New Wishlist' } });

    const submitButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledWith({
        name: 'My New Wishlist',
        isPrivate: false,
        isDefault: false,
      });
    });
  });

  it('validates name is required', async () => {
    render(<WishlistManagementModal {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
  });

  it('edits existing wishlist when provided', async () => {
    const existingWishlist = {
      id: 'wishlist-1',
      name: 'Existing Wishlist',
      isPrivate: true,
      isDefault: false,
    };

    render(<WishlistManagementModal {...defaultProps} wishlist={existingWishlist} />);

    expect(screen.getByDisplayValue('Existing Wishlist')).toBeInTheDocument();
  });

  it('closes on Escape key press', () => {
    render(<WishlistManagementModal {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});

describe('WishlistShareModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    wishlistId: 'wishlist-1',
    shareToken: 'abc123',
    onGenerateNew: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generates share URL correctly', () => {
    render(<WishlistShareModal {...defaultProps} />);

    expect(screen.getByDisplayValue(/abc123/)).toBeInTheDocument();
  });

  it('copies URL to clipboard', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(true),
      },
    });

    render(<WishlistShareModal {...defaultProps} />);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('toggles privacy settings', () => {
    render(<WishlistShareModal {...defaultProps} />);

    const privateCheckbox = screen.getByLabelText(/private/i);
    fireEvent.click(privateCheckbox);

    expect(privateCheckbox).toBeChecked();
  });
});

describe('WishlistExportModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    wishlistId: 'wishlist-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('selects export format', () => {
    render(<WishlistExportModal {...defaultProps} />);

    const csvOption = screen.getByRole('radio', { name: /csv/i });
    const pdfOption = screen.getByRole('radio', { name: /pdf/i });

    expect(csvOption).toBeChecked();

    fireEvent.click(pdfOption);
    expect(pdfOption).toBeChecked();
  });

  it('downloads CSV file correctly', async () => {
    const mockBlob = new Blob(['csv,data\ntest,value'], { type: 'text/csv' });
    mockExportWishlist.mockResolvedValue(mockBlob);

    render(<WishlistExportModal {...defaultProps} />);

    const downloadButton = screen.getByRole('button', { name: /download csv/i });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(mockExportWishlist).toHaveBeenCalled();
    });
  });

  it('shows download progress', async () => {
    mockExportWishlist.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<WishlistExportModal {...defaultProps} />);

    const downloadButton = screen.getByRole('button', { name: /download/i });
    fireEvent.click(downloadButton);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });
});

describe('WishlistPage Component', () => {
  const mockWishlists = [
    {
      id: 'wishlist-1',
      name: 'Birthday Wishlist',
      isDefault: true,
      items: [
        {
          id: 'item-1',
          product: {
            id: 'product-1',
            name: 'Test Product',
            regularPrice: 10000,
            images: ['/test.jpg'],
          },
          addedAt: new Date().toISOString(),
        },
      ],
    },
    {
      id: 'wishlist-2',
      name: 'Holiday Wishlist',
      isDefault: false,
      items: [],
    },
  ];

  const defaultProps = {
    wishlists: mockWishlists,
    currentWishlist: mockWishlists[0],
    loading: false,
    error: null,
    onFetchWishlists: jest.fn(),
    onCreateWishlist: jest.fn(),
    onDeleteWishlist: jest.fn(),
    onMoveToCart: jest.fn(),
    onRemoveItem: jest.fn(),
    onShare: jest.fn(),
    onExport: jest.fn(),
    onSelectWishlist: jest.fn(),
    onBulkSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays all user wishlists', () => {
    render(<WishlistPage {...defaultProps} />);

    expect(screen.getByText('Birthday Wishlist')).toBeInTheDocument();
    expect(screen.getByText('Holiday Wishlist')).toBeInTheDocument();
  });

  it('switches between wishlists', () => {
    render(<WishlistPage {...defaultProps} />);

    const holidayTab = screen.getByRole('button', { name: /holiday wishlist/i });
    fireEvent.click(holidayTab);

    expect(defaultProps.onSelectWishlist).toHaveBeenCalledWith(mockWishlists[1].id);
  });

  it('creates new wishlist', async () => {
    render(<WishlistPage {...defaultProps} />);

    const createButton = screen.getByRole('button', { name: /create wishlist/i });
    fireEvent.click(createButton);

    const modal = await screen.findByRole('dialog');
    expect(modal).toBeInTheDocument();
  });

  it('toggles grid/list view', () => {
    render(<WishlistPage {...defaultProps} />);

    const listViewButton = screen.getByRole('button', { name: /list view/i });
    fireEvent.click(listViewButton);

    expect(screen.getByTestId('wishlist-container')).toHaveAttribute('data-view', 'list');
  });

  it('shows empty state when no wishlists', () => {
    render(<WishlistPage {...defaultProps} wishlists={[]} />);

    expect(screen.getByText(/no wishlists yet/i)).toBeInTheDocument();
  });

  it('shows empty state for wishlist with no items', () => {
    render(<WishlistPage {...defaultProps} currentWishlist={mockWishlists[1]} />);

    expect(screen.getByText(/no items in this wishlist/i)).toBeInTheDocument();
  });

  it('shows loading skeleton', () => {
    render(<WishlistPage {...defaultProps} loading={true} />);

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('shows error state with retry', () => {
    render(<WishlistPage {...defaultProps} error="Failed to load wishlists" />);

    expect(screen.getByText(/failed to load wishlists/i)).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);

    expect(defaultProps.onFetchWishlists).toHaveBeenCalled();
  });
});
