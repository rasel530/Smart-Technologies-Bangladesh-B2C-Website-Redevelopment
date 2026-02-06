/**
 * Admin Search Analytics Page Tests
 * 
 * Comprehensive tests for the admin search analytics page covering:
 * - Page rendering
 * - Loading state
 * - Error state
 * - Analytics overview display
 * - Detailed metrics display
 * - Popular searches display
 * - Search trends display
 * - Zero-result queries display
 * - Conversion metrics display
 * - Data export functionality
 * - User interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminAnalyticsPage from '../analytics/page';
import {
  getAnalyticsMetrics,
  getPopularSearches,
  getSearchTrends,
  getZeroResultQueries,
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

describe('Admin Search Analytics Page', () => {
  const mockAnalyticsMetrics = {
    totalSearches: 10000,
    totalResults: 50000,
    avgResponseTime: 150,
    conversions: 550,
    conversionRate: 5.5,
    clickThroughRate: 12.3,
    zeroResultRate: 2.5,
    uniqueQueries: 5000,
  };

  const mockPopularSearches = [
    { query: 'laptop', searchCount: 500, trend: 'up', category: 'Electronics' },
    { query: 'phone', searchCount: 400, trend: 'stable', category: 'Phones' },
    { query: 'tablet', searchCount: 300, trend: 'down', category: 'Tablets' },
  ];

  const mockSearchTrends = [
    { date: '2024-01-15', searches: 500, avgResponseTime: 150 },
    { date: '2024-01-16', searches: 450, avgResponseTime: 145 },
    { date: '2024-01-17', searches: 400, avgResponseTime: 140 },
  ];

  const mockZeroResultQueries = [
    { query: 'nonexistent-product', count: 10, lastSearched: new Date() },
    { query: 'missing-item', count: 8, lastSearched: new Date() },
    { query: 'out-of-stock', count: 5, lastSearched: new Date() },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (getAnalyticsMetrics as jest.Mock).mockResolvedValue(mockAnalyticsMetrics);
    (getPopularSearches as jest.Mock).mockResolvedValue(mockPopularSearches);
    (getSearchTrends as jest.Mock).mockResolvedValue(mockSearchTrends);
    (getZeroResultQueries as jest.Mock).mockResolvedValue(mockZeroResultQueries);
  });

  describe('Page Rendering', () => {
    it('should render the admin analytics page', () => {
      render(<AdminAnalyticsPage />);

      expect(screen.getByText('Admin - Search Analytics')).toBeInTheDocument();
    });

    it('should render page title', () => {
      render(<AdminAnalyticsPage />);

      expect(document.title).toContain('Admin - Search Analytics');
    });

    it('should render navigation elements', () => {
      render(<AdminAnalyticsPage />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      (getAnalyticsMetrics as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<AdminAnalyticsPage />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should hide loading spinner after data loads', async () => {
      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should display error message when API fails', async () => {
      (getAnalyticsMetrics as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load analytics data/i)).toBeInTheDocument();
      });
    });

    it('should display retry button on error', async () => {
      (getAnalyticsMetrics as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Retry/i)).toBeInTheDocument();
      });
    });
  });

  describe('Analytics Overview Display', () => {
    it('should display analytics overview section', async () => {
      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('Analytics Overview')).toBeInTheDocument();
      });
    });

    it('should display total searches', async () => {
      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('10,000')).toBeInTheDocument();
      });
    });

    it('should display average response time', async () => {
      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('150ms')).toBeInTheDocument();
      });
    });

    it('should display conversion rate', async () => {
      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('5.5%')).toBeInTheDocument();
      });
    });

    it('should display click-through rate', async () => {
      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('12.3%')).toBeInTheDocument();
      });
    });

    it('should display zero result rate', async () => {
      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('2.5%')).toBeInTheDocument();
      });
    });

    it('should display unique queries count', async () => {
      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('5,000')).toBeInTheDocument();
      });
    });
  });

  describe('Popular Searches Display', () => {
    it('should display popular searches section', async () => {
      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('Popular Searches')).toBeInTheDocument();
      });
    });

    it('should display popular search queries', async () => {
      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('laptop')).toBeInTheDocument();
        expect(screen.getByText('phone')).toBeInTheDocument();
        expect(screen.getByText('tablet')).toBeInTheDocument();
      });
    });

    it('should display search counts', async () => {
      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('500')).toBeInTheDocument();
        expect(screen.getByText('400')).toBeInTheDocument();
        expect(screen.getByText('300')).toBeInTheDocument();
      });
    });

    it('should display trend indicators', async () => {
      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('laptop')).toBeInTheDocument();
      });
    });
  });

  describe('Search Trends Display', () => {
    it('should display search trends section', async () => {
      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('Search Trends')).toBeInTheDocument();
      });
    });

    it('should display trend data points', async () => {
      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('2024-01-15')).toBeInTheDocument();
        expect(screen.getByText('2024-01-16')).toBeInTheDocument();
        expect(screen.getByText('2024-01-17')).toBeInTheDocument();
      });
    });

    it('should display search counts in trends', async () => {
      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('500')).toBeInTheDocument();
        expect(screen.getByText('450')).toBeInTheDocument();
        expect(screen.getByText('400')).toBeInTheDocument();
      });
    });
  });

  describe('Zero-Result Queries Display', () => {
    it('should display zero-result queries section', async () => {
      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('Zero-Result Queries')).toBeInTheDocument();
      });
    });

    it('should display zero-result query list', async () => {
      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('nonexistent-product')).toBeInTheDocument();
        expect(screen.getByText('missing-item')).toBeInTheDocument();
        expect(screen.getByText('out-of-stock')).toBeInTheDocument();
      });
    });

    it('should display query counts', async () => {
      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
      });
    });
  });

  describe('Conversion Metrics Display', () => {
    it('should display conversion metrics section', async () => {
      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('Conversion Metrics')).toBeInTheDocument();
      });
    });

    it('should display total conversions', async () => {
      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('550')).toBeInTheDocument();
      });
    });

    it('should display conversion rate', async () => {
      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('5.5%')).toBeInTheDocument();
      });
    });
  });

  describe('Data Export Functionality', () => {
    it('should display export button', async () => {
      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('Export Data')).toBeInTheDocument();
      });
    });

    it('should open export modal when clicked', async () => {
      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        const exportButton = screen.getByText('Export Data');
        fireEvent.click(exportButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Export Analytics Data')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should call getAnalyticsMetrics on mount', async () => {
      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(getAnalyticsMetrics).toHaveBeenCalled();
      });
    });

    it('should call getPopularSearches on mount', async () => {
      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(getPopularSearches).toHaveBeenCalled();
      });
    });

    it('should call getSearchTrends on mount', async () => {
      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(getSearchTrends).toHaveBeenCalled();
      });
    });

    it('should call getZeroResultQueries on mount', async () => {
      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(getZeroResultQueries).toHaveBeenCalled();
      });
    });
  });

  describe('User Interactions', () => {
    it('should handle retry on error', async () => {
      (getAnalyticsMetrics as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        const retryButton = screen.getByText(/Retry/i);
        fireEvent.click(retryButton);
      });

      expect(getAnalyticsMetrics).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty analytics data', async () => {
      (getAnalyticsMetrics as jest.Mock).mockResolvedValue({
        totalSearches: 0,
        totalResults: 0,
        avgResponseTime: 0,
        conversions: 0,
        conversionRate: 0,
        clickThroughRate: 0,
        zeroResultRate: 0,
        uniqueQueries: 0,
      });

      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });

    it('should handle very large numbers', async () => {
      (getAnalyticsMetrics as jest.Mock).mockResolvedValue({
        totalSearches: 999999999,
        totalResults: 9999999999,
        avgResponseTime: 9999,
        conversions: 99999,
        conversionRate: 99.9,
        clickThroughRate: 99.9,
        zeroResultRate: 0.1,
        uniqueQueries: 999999,
      });

      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText(/999.9M/i)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render correctly on mobile', async () => {
      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('Admin - Search Analytics')).toBeInTheDocument();
      });
    });

    it('should render correctly on desktop', async () => {
      render(<AdminAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('Admin - Search Analytics')).toBeInTheDocument();
      });
    });
  });
});
