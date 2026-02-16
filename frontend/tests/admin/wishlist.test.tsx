/**
 * Wishlist Admin Panel Test Suite
 * 
 * This test suite covers all admin panel wishlist functionality:
 * - Admin Overview Dashboard
 * - User Wishlist Management
 * - Wishlist Analytics
 * - Product Wishlist Analytics
 * - Wishlist Settings
 * - Moderation Queue
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock admin API calls
jest.mock('../../src/lib/api/admin', () => ({
  getWishlistStats: jest.fn(),
  getAllWishlists: jest.fn(),
  getUserWishlists: jest.fn(),
  deleteWishlist: jest.fn(),
  exportUserWishlist: jest.fn(),
  getWishlistAnalytics: jest.fn(),
  getProductWishlistStats: jest.fn(),
  updateWishlistSettings: jest.fn(),
  getModerationQueue: jest.fn(),
  approveWishlist: jest.fn(),
  rejectWishlist: jest.fn(),
}));

jest.mock('../../src/stores/adminStore', () => ({
  useAdminStore: jest.fn(() => ({
    stats: null,
    wishlists: [],
    analytics: null,
    settings: null,
    moderationQueue: [],
    loading: false,
    error: null,
  })),
}));

const {
  AdminOverviewDashboard,
  UserWishlistManagement,
  WishlistAnalytics,
  ProductWishlistAnalytics,
  WishlistSettings,
  ModerationQueue,
} = require('../../src/components/admin/WishlistAdmin');

describe('AdminOverviewDashboard Component', () => {
  const mockStats = {
    totalWishlists: 150,
    totalItems: 2500,
    averageItemsPerWishlist: 16.7,
    totalShares: 45,
    topProducts: [
      { id: 'p1', name: 'Product 1', wishlistCount: 150 },
      { id: 'p2', name: 'Product 2', wishlistCount: 120 },
    ],
    recentWishlists: [
      { id: 'w1', name: 'Recent 1', user: { email: 'user1@test.com' }, createdAt: new Date() },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays statistics correctly', async () => {
    const { getWishlistStats } = require('../../src/lib/api/admin');
    getWishlistStats.mockResolvedValue(mockStats);

    render(<AdminOverviewDashboard />);

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('2,500')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
    });
  });

  it('filters by date range', async () => {
    const { getWishlistStats } = require('../../src/lib/api/admin');
    getWishlistStats.mockResolvedValue(mockStats);

    render(<AdminOverviewDashboard />);

    const dateInput = screen.getByLabelText(/start date/i);
    fireEvent.change(dateInput, { target: { value: '2024-01-01' } });

    const filterButton = screen.getByRole('button', { name: /apply filter/i });
    fireEvent.click(filterButton);

    await waitFor(() => {
      expect(getWishlistStats).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: '2024-01-01' })
      );
    });
  });

  it('displays recent wishlists table', async () => {
    const { getWishlistStats } = require('../../src/lib/api/admin');
    getWishlistStats.mockResolvedValue(mockStats);

    render(<AdminOverviewDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Recent 1')).toBeInTheDocument();
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    const { useAdminStore } = require('../../src/stores/adminStore');
    useAdminStore.mockReturnValue({
      stats: null,
      loading: true,
      error: null,
    });

    render(<AdminOverviewDashboard />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('shows error state', () => {
    const { useAdminStore } = require('../../src/stores/adminStore');
    useAdminStore.mockReturnValue({
      stats: null,
      loading: false,
      error: 'Failed to load stats',
    });

    render(<AdminOverviewDashboard />);

    expect(screen.getByText(/failed to load stats/i)).toBeInTheDocument();
  });
});

describe('UserWishlistManagement Component', () => {
  const defaultProps = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('searches users by email', async () => {
    const { getAllWishlists } = require('../../src/lib/api/admin');
    getAllWishlists.mockResolvedValue([
      { id: 'w1', name: 'Test', user: { email: 'test@example.com' } },
    ]);

    render(<UserWishlistManagement {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/search users/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(getAllWishlists).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'test' })
      );
    });
  });

  it('views user wishlists in modal', async () => {
    const { getUserWishlists } = require('../../src/lib/api/admin');
    getUserWishlists.mockResolvedValue({
      user: { email: 'user@test.com' },
      wishlists: [{ id: 'w1', name: 'Test Wishlist' }],
    });

    render(<UserWishlistManagement {...defaultProps} />);

    const viewButton = screen.getByRole('button', { name: /view/i });
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByText('Test Wishlist')).toBeInTheDocument();
    });
  });

  it('deletes user wishlists', async () => {
    const { deleteWishlist } = require('../../src/lib/api/admin');
    deleteWishlist.mockResolvedValue({ success: true });

    const { getAllWishlists } = require('../../src/lib/api/admin');
    getAllWishlists.mockResolvedValue([
      { id: 'w1', name: 'To Delete', user: { email: 'test@test.com' } },
    ]);

    render(<UserWishlistManagement {...defaultProps} />);

    await waitFor(() => {
      const deleteButton = screen.getByRole('button', { name: /delete/i });
      fireEvent.click(deleteButton);
    });

    expect(deleteWishlist).toHaveBeenCalledWith('w1');
  });

  it('exports user wishlist data', async () => {
    const { exportUserWishlist } = require('../../src/lib/api/admin');
    const mockBlob = new Blob(['csv,data'], { type: 'text/csv' });
    exportUserWishlist.mockResolvedValue(mockBlob);

    render(<UserWishlistManagement {...defaultProps} />);

    const exportButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(exportUserWishlist).toHaveBeenCalled();
    });
  });
});

describe('WishlistAnalytics Component', () => {
  const mockAnalytics = {
    totalWishlists: 500,
    totalItems: 10000,
    averageItemsPerWishlist: 20,
    totalShares: 150,
    shareConversion: 0.3,
    topWishlists: [
      { id: 'w1', name: 'Top 1', itemCount: 150 },
    ],
    dailyActivity: [
      { date: '2024-01-01', views: 100, shares: 10 },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays all metrics', async () => {
    const { getWishlistAnalytics } = require('../../src/lib/api/admin');
    getWishlistAnalytics.mockResolvedValue(mockAnalytics);

    render(<WishlistAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('500')).toBeInTheDocument();
      expect(screen.getByText('10,000')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });
  });

  it('groups data by day/week/month', async () => {
    const { getWishlistAnalytics } = require('../../src/lib/api/admin');
    getWishlistAnalytics.mockResolvedValue(mockAnalytics);

    render(<WishlistAnalytics />);

    const weekButton = screen.getByRole('button', { name: /week/i });
    fireEvent.click(weekButton);

    await waitFor(() => {
      expect(getWishlistAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({ groupBy: 'week' })
      );
    });
  });

  it('exports analytics as JSON', async () => {
    const { getWishlistAnalytics } = require('../../src/lib/api/admin');
    getWishlistAnalytics.mockResolvedValue(mockAnalytics);

    const mockBlob = new Blob([JSON.stringify(mockAnalytics)], { type: 'application/json' });
    const mockUrl = 'blob:http://localhost/mock-url';
    global.URL.createObjectURL = jest.fn().mockReturnValue(mockUrl);
    global.URL.revokeObjectURL = jest.fn();

    render(<WishlistAnalytics />);

    const exportButton = screen.getByRole('button', { name: /export json/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(screen.getByText(/exported successfully/i)).toBeInTheDocument();
    });
  });
});

describe('ProductWishlistAnalytics Component', () => {
  const mockProductStats = {
    products: [
      { id: 'p1', name: 'Product 1', wishlistCount: 150, price: 10000, category: 'Electronics' },
      { id: 'p2', name: 'Product 2', wishlistCount: 120, price: 20000, category: 'Clothing' },
    ],
    totalProducts: 50,
    averageWishlistCount: 50,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists products with wishlist counts', async () => {
    const { getProductWishlistStats } = require('../../src/lib/api/admin');
    getProductWishlistStats.mockResolvedValue(mockProductStats);

    render(<ProductWishlistAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });
  });

  it('sorts by count or price', async () => {
    const { getProductWishlistStats } = require('../../src/lib/api/admin');
    getProductWishlistStats.mockResolvedValue(mockProductStats);

    render(<ProductWishlistAnalytics />);

    const sortSelect = screen.getByLabelText(/sort by/i);
    fireEvent.change(sortSelect, { target: { value: 'price' } });

    await waitFor(() => {
      expect(getProductWishlistStats).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'price' })
      );
    });
  });

  it('filters by category', async () => {
    const { getProductWishlistStats } = require('../../src/lib/api/admin');
    getProductWishlistStats.mockResolvedValue(mockProductStats);

    render(<ProductWishlistAnalytics />);

    const categorySelect = screen.getByLabelText(/category/i);
    fireEvent.change(categorySelect, { target: { value: 'Electronics' } });

    await waitFor(() => {
      expect(getProductWishlistStats).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'Electronics' })
      );
    });
  });

  it('filters by price range', async () => {
    const { getProductWishlistStats } = require('../../src/lib/api/admin');
    getProductWishlistStats.mockResolvedValue(mockProductStats);

    render(<ProductWishlistAnalytics />);

    const minInput = screen.getByLabelText(/min price/i);
    fireEvent.change(minInput, { target: { value: '5000' } });

    const maxInput = screen.getByLabelText(/max price/i);
    fireEvent.change(maxInput, { target: { value: '15000' } });

    await waitFor(() => {
      expect(getProductWishlistStats).toHaveBeenCalledWith(
        expect.objectContaining({ priceMin: 5000, priceMax: 15000 })
      );
    });
  });
});

describe('WishlistSettings Component', () => {
  const mockSettings = {
    maxWishlistsPerUser: 10,
    maxItemsPerWishlist: 100,
    defaultPrivacy: 'private',
    shareTokenExpiration: 30,
    sharingEnabled: true,
    exportEnabled: true,
    analyticsRetentionDays: 365,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates maximum wishlists per user', async () => {
    const { updateWishlistSettings } = require('../../src/lib/api/admin');
    updateWishlistSettings.mockResolvedValue({ success: true });

    render(<WishlistSettings initialSettings={mockSettings} />);

    const input = screen.getByLabelText(/max wishlists per user/i);
    fireEvent.change(input, { target: { value: '20' } });

    const saveButton = screen.getByRole('button', { name: /save settings/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateWishlistSettings).toHaveBeenCalledWith(
        expect.objectContaining({ maxWishlistsPerUser: 20 })
      );
    });
  });

  it('updates maximum items per wishlist', async () => {
    const { updateWishlistSettings } = require('../../src/lib/api/admin');
    updateWishlistSettings.mockResolvedValue({ success: true });

    render(<WishlistSettings initialSettings={mockSettings} />);

    const input = screen.getByLabelText(/max items per wishlist/i);
    fireEvent.change(input, { target: { value: '200' } });

    const saveButton = screen.getByRole('button', { name: /save settings/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateWishlistSettings).toHaveBeenCalledWith(
        expect.objectContaining({ maxItemsPerWishlist: 200 })
      );
    });
  });

  it('toggles sharing feature', async () => {
    const { updateWishlistSettings } = require('../../src/lib/api/admin');
    updateWishlistSettings.mockResolvedValue({ success: true });

    render(<WishlistSettings initialSettings={mockSettings} />);

    const toggle = screen.getByLabelText(/enable sharing/i);
    fireEvent.click(toggle);

    const saveButton = screen.getByRole('button', { name: /save settings/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateWishlistSettings).toHaveBeenCalledWith(
        expect.objectContaining({ sharingEnabled: false })
      );
    });
  });

  it('toggles export feature', async () => {
    const { updateWishlistSettings } = require('../../src/lib/api/admin');
    updateWishlistSettings.mockResolvedValue({ success: true });

    render(<WishlistSettings initialSettings={mockSettings} />);

    const toggle = screen.getByLabelText(/enable export/i);
    fireEvent.click(toggle);

    const saveButton = screen.getByRole('button', { name: /save settings/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateWishlistSettings).toHaveBeenCalledWith(
        expect.objectContaining({ exportEnabled: false })
      );
    });
  });

  it('updates analytics retention period', async () => {
    const { updateWishlistSettings } = require('../../src/lib/api/admin');
    updateWishlistSettings.mockResolvedValue({ success: true });

    render(<WishlistSettings initialSettings={mockSettings} />);

    const input = screen.getByLabelText(/analytics retention/i);
    fireEvent.change(input, { target: { value: '180' } });

    const saveButton = screen.getByRole('button', { name: /save settings/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateWishlistSettings).toHaveBeenCalledWith(
        expect.objectContaining({ analyticsRetentionDays: 180 })
      );
    });
  });
});

describe('ModerationQueue Component', () => {
  const mockQueue = [
    {
      id: 'w1',
      name: 'Flagged Wishlist 1',
      user: { email: 'user1@test.com' },
      flaggedReason: 'Inappropriate content',
      flaggedAt: new Date(),
      status: 'pending',
    },
    {
      id: 'w2',
      name: 'Flagged Wishlist 2',
      user: { email: 'user2@test.com' },
      flaggedReason: 'Spam',
      flaggedAt: new Date(),
      status: 'pending',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays flagged wishlists', async () => {
    const { getModerationQueue } = require('../../src/lib/api/admin');
    getModerationQueue.mockResolvedValue(mockQueue);

    render(<ModerationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Flagged Wishlist 1')).toBeInTheDocument();
      expect(screen.getByText('Flagged Wishlist 2')).toBeInTheDocument();
    });
  });

  it('filters by status', async () => {
    const { getModerationQueue } = require('../../src/lib/api/admin');
    getModerationQueue.mockResolvedValue(mockQueue);

    render(<ModerationQueue />);

    const filterSelect = screen.getByLabelText(/filter by status/i);
    fireEvent.change(filterSelect, { target: { value: 'approved' } });

    await waitFor(() => {
      expect(getModerationQueue).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'approved' })
      );
    });
  });

  it('approves wishlist with reason', async () => {
    const { approveWishlist } = require('../../src/lib/api/admin');
    approveWishlist.mockResolvedValue({ success: true });
    const { getModerationQueue } = require('../../src/lib/api/admin');
    getModerationQueue.mockResolvedValue(mockQueue);

    render(<ModerationQueue />);

    await waitFor(() => {
      const approveButton = screen.getByRole('button', { name: /approve/i });
      fireEvent.click(approveButton);
    });

    const reasonInput = screen.getByLabelText(/approval reason/i);
    fireEvent.change(reasonInput, { target: { value: 'Content is acceptable' } });

    const confirmButton = screen.getByRole('button', { name: /confirm approval/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(approveWishlist).toHaveBeenCalledWith('w1', expect.any(String));
    });
  });

  it('rejects wishlist with reason', async () => {
    const { rejectWishlist } = require('../../src/lib/api/admin');
    rejectWishlist.mockResolvedValue({ success: true });
    const { getModerationQueue } = require('../../src/lib/api/admin');
    getModerationQueue.mockResolvedValue(mockQueue);

    render(<ModerationQueue />);

    await waitFor(() => {
      const rejectButton = screen.getByRole('button', { name: /reject/i });
      fireEvent.click(rejectButton);
    });

    const reasonInput = screen.getByLabelText(/rejection reason/i);
    fireEvent.change(reasonInput, { target: { value: 'Violates terms of service' } });

    const confirmButton = screen.getByRole('button', { name: /confirm rejection/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(rejectWishlist).toHaveBeenCalledWith('w1', expect.any(String));
    });
  });

  it('deletes inappropriate wishlist', async () => {
    const { deleteWishlist } = require('../../src/lib/api/admin');
    deleteWishlist.mockResolvedValue({ success: true });
    const { getModerationQueue } = require('../../src/lib/api/admin');
    getModerationQueue.mockResolvedValue(mockQueue);

    render(<ModerationQueue />);

    await waitFor(() => {
      const deleteButton = screen.getByRole('button', { name: /delete permanently/i });
      fireEvent.click(deleteButton);
    });

    expect(deleteWishlist).toHaveBeenCalledWith('w1');
  });
});
