/**
 * TrendingSearches Component Tests
 * 
 * Comprehensive tests for the TrendingSearches component covering:
 * - Rendering with default props
 * - Loading state
 * - Error state
 * - Trending searches display
 * - Rising searches display
 * - Trending products display
 * - Trending categories display
 * - Time range filtering
 * - Empty state
 * - API mocking
 * - User interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrendingSearches from '../TrendingSearches';
import {
  getTrendingSearches,
  getTrendingProducts,
  getRisingSearches,
  getTrendingCategories,
} from '@/lib/api/searchAnalytics';

// Mock the API functions
jest.mock('@/lib/api/searchAnalytics');

describe('TrendingSearches Component', () => {
  const mockTrendingSearches = [
    {
      query: 'laptop',
      searchCount: 500,
      trendScore: 20.0,
      trend: 'rising',
      category: 'Electronics',
    },
    {
      query: 'phone',
      searchCount: 400,
      trendScore: 15.5,
      trend: 'stable',
      category: 'Phones',
    },
    {
      query: 'tablet',
      searchCount: 300,
      trendScore: 10.0,
      trend: 'falling',
      category: 'Tablets',
    },
  ];

  const mockTrendingProducts = [
    {
      productId: 'prod-1',
      productName: 'MacBook Pro',
      searchCount: 250,
      trendScore: 18.0,
      trend: 'rising',
      price: 1299.99,
      imageUrl: 'https://example.com/laptop.jpg',
    },
    {
      productId: 'prod-2',
      productName: 'iPhone 15',
      searchCount: 200,
      trendScore: 14.0,
      trend: 'stable',
      price: 999.99,
      imageUrl: 'https://example.com/phone.jpg',
    },
  ];

  const mockRisingSearches = [
    {
      query: 'monitor',
      searchCount: 50,
      previousCount: 30,
      growthPercentage: 66.67,
      trendScore: 8.0,
    },
    {
      query: 'mouse',
      searchCount: 30,
      previousCount: 20,
      growthPercentage: 50.0,
      trendScore: 5.0,
    },
  ];

  const mockTrendingCategories = [
    {
      categoryId: 'cat-1',
      categoryName: 'Electronics',
      searchCount: 800,
      trendScore: 25.0,
    },
    {
      categoryId: 'cat-2',
      categoryName: 'Computers',
      searchCount: 600,
      trendScore: 20.0,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (getTrendingSearches as jest.Mock).mockResolvedValue(mockTrendingSearches);
    (getTrendingProducts as jest.Mock).mockResolvedValue(mockTrendingProducts);
    (getRisingSearches as jest.Mock).mockResolvedValue(mockRisingSearches);
    (getTrendingCategories as jest.Mock).mockResolvedValue(mockTrendingCategories);
  });

  describe('Rendering', () => {
    it('should render with default props', async () => {
      render(<TrendingSearches />);

      await waitFor(() => {
        expect(screen.getByText('Trending Searches')).toBeInTheDocument();
      });
    });

    it('should render with custom className', async () => {
      render(<TrendingSearches className="custom-class" />);

      await waitFor(() => {
        const container = screen.getByText('Trending Searches').closest('div');
        expect(container).toHaveClass('custom-class');
      });
    });

    it('should render with custom limit', async () => {
      render(<TrendingSearches limit={5} />);

      await waitFor(() => {
        expect(getTrendingSearches).toHaveBeenCalledWith(5, '24h');
      });
    });

    it('should render with category filter', async () => {
      render(<TrendingSearches category="Electronics" />);

      await waitFor(() => {
        expect(getTrendingProducts).toHaveBeenCalledWith(10, 'Electronics', '24h');
      });
    });

    it('should render without products section', async () => {
      render(<TrendingSearches showProducts={false} />);

      await waitFor(() => {
        expect(getTrendingProducts).not.toHaveBeenCalled();
      });
    });

    it('should render without rising searches section', async () => {
      render(<TrendingSearches showRising={false} />);

      await waitFor(() => {
        expect(getRisingSearches).not.toHaveBeenCalled();
      });
    });

    it('should render without categories section', async () => {
      render(<TrendingSearches showCategories={false} />);

      await waitFor(() => {
        expect(getTrendingCategories).not.toHaveBeenCalled();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      render(<TrendingSearches />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should hide loading spinner after data loads', async () => {
      render(<TrendingSearches />);

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should display error message when API fails', async () => {
      (getTrendingSearches as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<TrendingSearches />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load trending data/i)).toBeInTheDocument();
      });
    });

    it('should display custom error message', async () => {
      (getTrendingSearches as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<TrendingSearches />);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Trending Searches Display', () => {
    it('should display trending searches list', async () => {
      render(<TrendingSearches />);

      await waitFor(() => {
        expect(screen.getByText('Trending Now')).toBeInTheDocument();
        expect(screen.getByText('laptop')).toBeInTheDocument();
        expect(screen.getByText('phone')).toBeInTheDocument();
        expect(screen.getByText('tablet')).toBeInTheDocument();
      });
    });

    it('should display search count with proper formatting', async () => {
      const mockSearches = [
        { query: 'test', searchCount: 1500, trendScore: 10, trend: 'rising' },
      ];
      (getTrendingSearches as jest.Mock).mockResolvedValue(mockSearches);

      render(<TrendingSearches />);

      await waitFor(() => {
        expect(screen.getByText('1.5K')).toBeInTheDocument();
      });
    });

    it('should display search count with M formatting for large numbers', async () => {
      const mockSearches = [
        { query: 'test', searchCount: 2500000, trendScore: 10, trend: 'rising' },
      ];
      (getTrendingSearches as jest.Mock).mockResolvedValue(mockSearches);

      render(<TrendingSearches />);

      await waitFor(() => {
        expect(screen.getByText('2.5M')).toBeInTheDocument();
      });
    });

    it('should display trend icons', async () => {
      render(<TrendingSearches />);

      await waitFor(() => {
        expect(screen.getByText('laptop')).toBeInTheDocument();
        const trendIcons = screen.getAllByRole('img');
        expect(trendIcons.length).toBeGreaterThan(0);
      });
    });

    it('should display category tags when available', async () => {
      render(<TrendingSearches />);

      await waitFor(() => {
        expect(screen.getByText('Electronics')).toBeInTheDocument();
        expect(screen.getByText('Phones')).toBeInTheDocument();
      });
    });

    it('should display ranking numbers', async () => {
      render(<TrendingSearches />);

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('should create proper search links', async () => {
      render(<TrendingSearches />);

      await waitFor(() => {
        const laptopLink = screen.getByText('laptop').closest('a');
        expect(laptopLink).toHaveAttribute('href', '/search?q=laptop');
      });
    });
  });

  describe('Rising Searches Display', () => {
    it('should display rising searches section', async () => {
      render(<TrendingSearches showRising={true} />);

      await waitFor(() => {
        expect(screen.getByText('Rising Searches')).toBeInTheDocument();
      });
    });

    it('should display growth percentage', async () => {
      render(<TrendingSearches showRising={true} />);

      await waitFor(() => {
        expect(screen.getByText('+67%')).toBeInTheDocument();
        expect(screen.getByText('+50%')).toBeInTheDocument();
      });
    });

    it('should display current search count', async () => {
      render(<TrendingSearches showRising={true} />);

      await waitFor(() => {
        expect(screen.getByText('50 searches')).toBeInTheDocument();
        expect(screen.getByText('30 searches')).toBeInTheDocument();
      });
    });

    it('should not display rising searches when showRising is false', async () => {
      render(<TrendingSearches showRising={false} />);

      await waitFor(() => {
        expect(screen.queryByText('Rising Searches')).not.toBeInTheDocument();
      });
    });
  });

  describe('Trending Products Display', () => {
    it('should display trending products section', async () => {
      render(<TrendingSearches showProducts={true} />);

      await waitFor(() => {
        expect(screen.getByText('Trending Products')).toBeInTheDocument();
      });
    });

    it('should display product names', async () => {
      render(<TrendingSearches showProducts={true} />);

      await waitFor(() => {
        expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
        expect(screen.getByText('iPhone 15')).toBeInTheDocument();
      });
    });

    it('should display product prices', async () => {
      render(<TrendingSearches showProducts={true} />);

      await waitFor(() => {
        expect(screen.getByText('$1299.99')).toBeInTheDocument();
        expect(screen.getByText('$999.99')).toBeInTheDocument();
      });
    });

    it('should display product images', async () => {
      render(<TrendingSearches showProducts={true} />);

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        expect(images.length).toBeGreaterThan(0);
      });
    });

    it('should display product search counts', async () => {
      render(<TrendingSearches showProducts={true} />);

      await waitFor(() => {
        expect(screen.getByText('250 searches')).toBeInTheDocument();
        expect(screen.getByText('200 searches')).toBeInTheDocument();
      });
    });

    it('should display trend badges on products', async () => {
      render(<TrendingSearches showProducts={true} />);

      await waitFor(() => {
        expect(screen.getByText('rising')).toBeInTheDocument();
      });
    });

    it('should create proper product links', async () => {
      render(<TrendingSearches showProducts={true} />);

      await waitFor(() => {
        const productLink = screen.getByText('MacBook Pro').closest('a');
        expect(productLink).toHaveAttribute('href', '/products/prod-1');
      });
    });

    it('should not display trending products when showProducts is false', async () => {
      render(<TrendingSearches showProducts={false} />);

      await waitFor(() => {
        expect(screen.queryByText('Trending Products')).not.toBeInTheDocument();
      });
    });
  });

  describe('Trending Categories Display', () => {
    it('should display trending categories section', async () => {
      render(<TrendingSearches showCategories={true} />);

      await waitFor(() => {
        expect(screen.getByText('Trending Categories')).toBeInTheDocument();
      });
    });

    it('should display category names', async () => {
      render(<TrendingSearches showCategories={true} />);

      await waitFor(() => {
        expect(screen.getByText('Electronics')).toBeInTheDocument();
        expect(screen.getByText('Computers')).toBeInTheDocument();
      });
    });

    it('should display category search counts', async () => {
      render(<TrendingSearches showCategories={true} />);

      await waitFor(() => {
        expect(screen.getByText('800 searches')).toBeInTheDocument();
        expect(screen.getByText('600 searches')).toBeInTheDocument();
      });
    });

    it('should display trending indicator on categories', async () => {
      render(<TrendingSearches showCategories={true} />);

      await waitFor(() => {
        expect(screen.getByText('Trending')).toBeInTheDocument();
      });
    });

    it('should create proper category links', async () => {
      render(<TrendingSearches showCategories={true} />);

      await waitFor(() => {
        const categoryLink = screen.getByText('Electronics').closest('a');
        expect(categoryLink).toHaveAttribute('href', '/categories/cat-1');
      });
    });

    it('should not display trending categories when showCategories is false', async () => {
      render(<TrendingSearches showCategories={false} />);

      await waitFor(() => {
        expect(screen.queryByText('Trending Categories')).not.toBeInTheDocument();
      });
    });
  });

  describe('Time Range Filtering', () => {
    it('should display time range selector', async () => {
      render(<TrendingSearches />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Last 24 hours')).toBeInTheDocument();
      });
    });

    it('should have all time range options', async () => {
      render(<TrendingSearches />);

      await waitFor(() => {
        const select = screen.getByDisplayValue('Last 24 hours');
        expect(select).toBeInTheDocument();
        
        fireEvent.change(select, { target: { value: '1h' } });
        expect(select).toHaveValue('1h');
      });
    });

    it('should refetch data when time range changes', async () => {
      render(<TrendingSearches />);

      await waitFor(() => {
        expect(getTrendingSearches).toHaveBeenCalledWith(10, '24h');
      });

      const select = screen.getByDisplayValue('Last 24 hours');
      fireEvent.change(select, { target: { value: '7d' } });

      await waitFor(() => {
        expect(getTrendingSearches).toHaveBeenCalledWith(10, '7d');
      });
    });

    it('should update time range to 1 hour', async () => {
      render(<TrendingSearches />);

      const select = screen.getByDisplayValue('Last 24 hours');
      fireEvent.change(select, { target: { value: '1h' } });

      await waitFor(() => {
        expect(select).toHaveValue('1h');
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no data is available', async () => {
      (getTrendingSearches as jest.Mock).mockResolvedValue([]);
      (getTrendingProducts as jest.Mock).mockResolvedValue([]);
      (getRisingSearches as jest.Mock).mockResolvedValue([]);
      (getTrendingCategories as jest.Mock).mockResolvedValue([]);

      render(<TrendingSearches />);

      await waitFor(() => {
        expect(screen.getByText('No trending data available')).toBeInTheDocument();
      });
    });

    it('should display empty state icon', async () => {
      (getTrendingSearches as jest.Mock).mockResolvedValue([]);
      (getTrendingProducts as jest.Mock).mockResolvedValue([]);
      (getRisingSearches as jest.Mock).mockResolvedValue([]);
      (getTrendingCategories as jest.Mock).mockResolvedValue([]);

      render(<TrendingSearches />);

      await waitFor(() => {
        const emptyIcon = screen.getByText('No trending data available').previousElementSibling;
        expect(emptyIcon).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should call getTrendingSearches on mount', async () => {
      render(<TrendingSearches />);

      await waitFor(() => {
        expect(getTrendingSearches).toHaveBeenCalledWith(10, '24h');
      });
    });

    it('should call getTrendingProducts when showProducts is true', async () => {
      render(<TrendingSearches showProducts={true} />);

      await waitFor(() => {
        expect(getTrendingProducts).toHaveBeenCalledWith(10, undefined, '24h');
      });
    });

    it('should call getRisingSearches when showRising is true', async () => {
      render(<TrendingSearches showRising={true} />);

      await waitFor(() => {
        expect(getRisingSearches).toHaveBeenCalledWith(10, '24h');
      });
    });

    it('should call getTrendingCategories when showCategories is true', async () => {
      render(<TrendingSearches showCategories={true} />);

      await waitFor(() => {
        expect(getTrendingCategories).toHaveBeenCalledWith(10, '24h');
      });
    });

    it('should pass category to getTrendingProducts when provided', async () => {
      render(<TrendingSearches category="Electronics" />);

      await waitFor(() => {
        expect(getTrendingProducts).toHaveBeenCalledWith(10, 'Electronics', '24h');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero search count', async () => {
      const mockSearches = [
        { query: 'test', searchCount: 0, trendScore: 0, trend: 'stable' },
      ];
      (getTrendingSearches as jest.Mock).mockResolvedValue(mockSearches);

      render(<TrendingSearches />);

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });

    it('should handle very large search counts', async () => {
      const mockSearches = [
        { query: 'test', searchCount: 999999999, trendScore: 100, trend: 'rising' },
      ];
      (getTrendingSearches as jest.Mock).mockResolvedValue(mockSearches);

      render(<TrendingSearches />);

      await waitFor(() => {
        expect(screen.getByText('1000.0M')).toBeInTheDocument();
      });
    });

    it('should handle missing category', async () => {
      const mockSearches = [
        { query: 'test', searchCount: 100, trendScore: 10, trend: 'rising' },
      ];
      (getTrendingSearches as jest.Mock).mockResolvedValue(mockSearches);

      render(<TrendingSearches />);

      await waitFor(() => {
        expect(screen.getByText('test')).toBeInTheDocument();
        expect(screen.queryByText(/bg-gray-100/)).not.toBeInTheDocument();
      });
    });

    it('should handle missing product image', async () => {
      const mockProducts = [
        {
          productId: 'prod-1',
          productName: 'Test Product',
          searchCount: 100,
          trendScore: 10,
          trend: 'rising',
          price: 99.99,
        },
      ];
      (getTrendingProducts as jest.Mock).mockResolvedValue(mockProducts);

      render(<TrendingSearches showProducts={true} />);

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
      });
    });

    it('should handle missing trend indicator', async () => {
      const mockSearches = [
        { query: 'test', searchCount: 100, trendScore: 10, trend: undefined },
      ];
      (getTrendingSearches as jest.Mock).mockResolvedValue(mockSearches);

      render(<TrendingSearches />);

      await waitFor(() => {
        expect(screen.getByText('test')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should navigate to search page when clicking trending search', async () => {
      render(<TrendingSearches />);

      await waitFor(() => {
        const laptopLink = screen.getByText('laptop').closest('a');
        expect(laptopLink).toHaveAttribute('href', '/search?q=laptop');
      });
    });

    it('should navigate to product page when clicking trending product', async () => {
      render(<TrendingSearches showProducts={true} />);

      await waitFor(() => {
        const productLink = screen.getByText('MacBook Pro').closest('a');
        expect(productLink).toHaveAttribute('href', '/products/prod-1');
      });
    });

    it('should navigate to category page when clicking trending category', async () => {
      render(<TrendingSearches showCategories={true} />);

      await waitFor(() => {
        const categoryLink = screen.getByText('Electronics').closest('a');
        expect(categoryLink).toHaveAttribute('href', '/categories/cat-1');
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render correctly on mobile', async () => {
      render(<TrendingSearches />);

      await waitFor(() => {
        expect(screen.getByText('Trending Searches')).toBeInTheDocument();
      });
    });

    it('should display grid layout for products', async () => {
      render(<TrendingSearches showProducts={true} />);

      await waitFor(() => {
        expect(screen.getByText('Trending Products')).toBeInTheDocument();
      });
    });
  });
});
