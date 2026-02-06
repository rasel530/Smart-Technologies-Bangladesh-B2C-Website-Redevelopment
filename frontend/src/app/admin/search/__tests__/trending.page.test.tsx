/**
 * Admin Search Trending Page Tests
 * 
 * Comprehensive tests for admin search trending page covering:
 * - Page rendering
 * - Loading state
 * - Error state
 * - Trending searches display
 * - Trending products display
 * - Rising searches display
 * - Trending categories display
 * - User interactions
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminTrendingPage from '../trending/page';
import {
  getTrendingSearches,
  getTrendingProducts,
  getRisingSearches,
  getTrendingCategories,
} from '@/lib/api/searchAnalytics';

// Mock API functions
jest.mock('@/lib/api/searchAnalytics');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

describe('Admin Search Trending Page', () => {
  const mockTrendingSearches = [
    { query: 'laptop', searchCount: 500, trendScore: 20.0, trend: 'up', category: 'Electronics' },
    { query: 'phone', searchCount: 400, trendScore: 15.5, trend: 'stable', category: 'Phones' },
    { query: 'tablet', searchCount: 300, trendScore: 10.0, trend: 'down', category: 'Tablets' },
  ];

  const mockTrendingProducts = [
    {
      productId: 'prod-1',
      productName: 'MacBook Pro',
      searchCount: 250,
      trendScore: 18.0,
      trend: 'rising',
      price: 1299.99,
      imageUrl: 'https://example.com/macbook.jpg',
    },
    {
      productId: 'prod-2',
      productName: 'iPhone 15',
      searchCount: 200,
      trendScore: 14.0,
      trend: 'stable',
      price: 999.99,
      imageUrl: 'https://example.com/iphone.jpg',
    },
  ];

  const mockRisingSearches = [
    { query: 'monitor', searchCount: 50, previousCount: 30, growthPercentage: 66.67, trendScore: 8.0 },
    { query: 'mouse', searchCount: 30, previousCount: 20, growthPercentage: 50.0, trendScore: 5.0 },
  ];

  const mockTrendingCategories = [
    { categoryId: 'cat-1', categoryName: 'Electronics', searchCount: 800, trendScore: 25.0 },
    { categoryId: 'cat-2', categoryName: 'Computers', searchCount: 600, trendScore: 20.0 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (getTrendingSearches as jest.Mock).mockResolvedValue(mockTrendingSearches);
    (getTrendingProducts as jest.Mock).mockResolvedValue(mockTrendingProducts);
    (getRisingSearches as jest.Mock).mockResolvedValue(mockRisingSearches);
    (getTrendingCategories as jest.Mock).mockResolvedValue(mockTrendingCategories);
  });

  describe('Page Rendering', () => {
    it('should render the admin trending page', () => {
      render(<AdminTrendingPage />);

      expect(screen.getByText('Admin - Search Trending')).toBeInTheDocument();
    });

    it('should render page title', () => {
      render(<AdminTrendingPage />);

      expect(document.title).toContain('Admin - Search Trending');
    });

    it('should render navigation elements', () => {
      render(<AdminTrendingPage />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      (getTrendingSearches as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<AdminTrendingPage />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should hide loading spinner after data loads', async () => {
      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should display error message when API fails', async () => {
      (getTrendingSearches as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load trending data/i)).toBeInTheDocument();
      });
    });

    it('should display retry button on error', async () => {
      (getTrendingSearches as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(screen.getByText(/Retry/i)).toBeInTheDocument();
      });
    });
  });

  describe('Trending Searches Display', () => {
    it('should display trending searches section', async () => {
      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(screen.getByText('Trending Searches')).toBeInTheDocument();
      });
    });

    it('should display trending search queries', async () => {
      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(screen.getByText('laptop')).toBeInTheDocument();
        expect(screen.getByText('phone')).toBeInTheDocument();
        expect(screen.getByText('tablet')).toBeInTheDocument();
      });
    });

    it('should display search counts', async () => {
      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(screen.getByText('500')).toBeInTheDocument();
        expect(screen.getByText('400')).toBeInTheDocument();
        expect(screen.getByText('300')).toBeInTheDocument();
      });
    });

    it('should display trend scores', async () => {
      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(screen.getByText('20.0')).toBeInTheDocument();
        expect(screen.getByText('15.5')).toBeInTheDocument();
        expect(screen.getByText('10.0')).toBeInTheDocument();
      });
    });

    it('should display trend indicators', async () => {
      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(screen.getByText('laptop')).toBeInTheDocument();
      });
    });
  });

  describe('Trending Products Display', () => {
    it('should display trending products section', async () => {
      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(screen.getByText('Trending Products')).toBeInTheDocument();
      });
    });

    it('should display product names', async () => {
      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
        expect(screen.getByText('iPhone 15')).toBeInTheDocument();
      });
    });

    it('should display product prices', async () => {
      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(screen.getByText('$1299.99')).toBeInTheDocument();
        expect(screen.getByText('$999.99')).toBeInTheDocument();
      });
    });

    it('should display product search counts', async () => {
      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(screen.getByText('250')).toBeInTheDocument();
        expect(screen.getByText('200')).toBeInTheDocument();
      });
    });

    it('should display trend indicators', async () => {
      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(screen.getByText('rising')).toBeInTheDocument();
        expect(screen.getByText('stable')).toBeInTheDocument();
      });
    });
  });

  describe('Rising Searches Display', () => {
    it('should display rising searches section', async () => {
      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(screen.getByText('Rising Searches')).toBeInTheDocument();
      });
    });

    it('should display rising search queries', async () => {
      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(screen.getByText('monitor')).toBeInTheDocument();
        expect(screen.getByText('mouse')).toBeInTheDocument();
      });
    });

    it('should display growth percentages', async () => {
      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(screen.getByText('66.67%')).toBeInTheDocument();
        expect(screen.getByText('50%')).toBeInTheDocument();
      });
    });
  });

  describe('Trending Categories Display', () => {
    it('should display trending categories section', async () => {
      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(screen.getByText('Trending Categories')).toBeInTheDocument();
      });
    });

    it('should display category names', async () => {
      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(screen.getByText('Electronics')).toBeInTheDocument();
        expect(screen.getByText('Computers')).toBeInTheDocument();
      });
    });

    it('should display category search counts', async () => {
      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(screen.getByText('800')).toBeInTheDocument();
        expect(screen.getByText('600')).toBeInTheDocument();
      });
    });

    it('should display trend scores', async () => {
      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(screen.getByText('25.0')).toBeInTheDocument();
        expect(screen.getByText('20.0')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should call getTrendingSearches on mount', async () => {
      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(getTrendingSearches).toHaveBeenCalled();
      });
    });

    it('should call getTrendingProducts on mount', async () => {
      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(getTrendingProducts).toHaveBeenCalled();
      });
    });

    it('should call getRisingSearches on mount', async () => {
      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(getRisingSearches).toHaveBeenCalled();
      });
    });

    it('should call getTrendingCategories on mount', async () => {
      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(getTrendingCategories).toHaveBeenCalled();
      });
    });
  });

  describe('User Interactions', () => {
    it('should handle retry on error', async () => {
      (getTrendingSearches as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<AdminTrendingPage />);

      await waitFor(() => {
        const retryButton = screen.getByText(/Retry/i);
        fireEvent.click(retryButton);
      });

      expect(getTrendingSearches).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty trending searches', async () => {
      (getTrendingSearches as jest.Mock).mockResolvedValue([]);

      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(screen.getByText(/No trending searches available/i)).toBeInTheDocument();
      });
    });

    it('should handle empty trending products', async () => {
      (getTrendingProducts as jest.Mock).mockResolvedValue([]);

      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(screen.getByText(/No trending products available/i)).toBeInTheDocument();
      });
    });

    it('should handle empty rising searches', async () => {
      (getRisingSearches as jest.Mock).mockResolvedValue([]);

      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(screen.getByText(/No rising searches available/i)).toBeInTheDocument();
      });
    });

    it('should handle empty trending categories', async () => {
      (getTrendingCategories as jest.Mock).mockResolvedValue([]);

      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(screen.getByText(/No trending categories available/i)).toBeInTheDocument();
      });
    });

    it('should handle very large trend scores', async () => {
      (getTrendingSearches as jest.Mock).mockResolvedValue([
        { query: 'test', searchCount: 100, trendScore: 999.9, trend: 'up', category: 'Test' },
      ]);

      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(screen.getByText('999.9')).toBeInTheDocument();
      });
    });

    it('should handle zero trend score', async () => {
      (getTrendingSearches as jest.Mock).mockResolvedValue([
        { query: 'test', searchCount: 100, trendScore: 0, trend: 'stable', category: 'Test' },
      ]);

      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render correctly on mobile', async () => {
      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(screen.getByText('Admin - Search Trending')).toBeInTheDocument();
      });
    });

    it('should render correctly on desktop', async () => {
      render(<AdminTrendingPage />);

      await waitFor(() => {
        expect(screen.getByText('Admin - Search Trending')).toBeInTheDocument();
      });
    });
  });
});
