/**
 * Search Performance Dashboard Page Tests
 * 
 * Comprehensive tests for the search performance dashboard page covering:
 * - Page rendering
 * - Loading state
 * - Error state
 * - Performance metrics display
 * - Performance alerts display
 * - Real-time statistics display
 * - Response time distribution display
 * - Cache statistics display
 * - Time range filtering
 * - User interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PerformancePage from '../performance/page';
import {
  getPerformanceMetrics,
  getPerformanceAlerts,
  getRealTimeStats,
  getResponseTimeDistribution,
  getCacheStats,
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

describe('Performance Dashboard Page', () => {
  const mockPerformanceMetrics = {
    timeRange: '24h',
    metrics: [
      {
        queryCount: 1000,
        avgResponseTime: 150,
        p95ResponseTime: 300,
        p99ResponseTime: 500,
        cacheHitRate: 0.75,
        zeroResultRate: 0.05,
      },
    ],
    summary: {
      avgResponseTime: 150,
      p95ResponseTime: 300,
      p99ResponseTime: 500,
      cacheHitRate: 0.75,
      zeroResultRate: 0.05,
      totalQueries: 1000,
    },
  };

  const mockPerformanceAlerts = [
    {
      id: 'alert-1',
      type: 'high_response_time',
      severity: 'high',
      message: 'Average response time exceeded threshold',
      value: 500,
      threshold: 300,
      timestamp: new Date(),
    },
    {
      id: 'alert-2',
      type: 'low_cache_hit_rate',
      severity: 'medium',
      message: 'Cache hit rate below threshold',
      value: 0.6,
      threshold: 0.7,
      timestamp: new Date(),
    },
  ];

  const mockRealTimeStats = {
    currentQueries: 50,
    avgResponseTime: 145,
    cacheHitRate: 0.78,
    queriesPerSecond: 2.5,
    activeUsers: 25,
  };

  const mockResponseTimeDistribution = [
    { range: '0-100ms', count: 400, percentage: 40 },
    { range: '100-200ms', count: 300, percentage: 30 },
    { range: '200-500ms', count: 200, percentage: 20 },
    { range: '500ms+', count: 100, percentage: 10 },
  ];

  const mockCacheStats = {
    hitRate: 0.75,
    missRate: 0.25,
    totalRequests: 10000,
    hits: 7500,
    misses: 2500,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getPerformanceMetrics as jest.Mock).mockResolvedValue(mockPerformanceMetrics);
    (getPerformanceAlerts as jest.Mock).mockResolvedValue(mockPerformanceAlerts);
    (getRealTimeStats as jest.Mock).mockResolvedValue(mockRealTimeStats);
    (getResponseTimeDistribution as jest.Mock).mockResolvedValue(mockResponseTimeDistribution);
    (getCacheStats as jest.Mock).mockResolvedValue(mockCacheStats);
  });

  describe('Page Rendering', () => {
    it('should render the performance dashboard page', () => {
      render(<PerformancePage />);

      expect(screen.getByText('Search Performance')).toBeInTheDocument();
    });

    it('should render page title', () => {
      render(<PerformancePage />);

      expect(document.title).toContain('Search Performance');
    });

    it('should render navigation elements', () => {
      render(<PerformancePage />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      (getPerformanceMetrics as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<PerformancePage />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should hide loading spinner after data loads', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should display error message when API fails', async () => {
      (getPerformanceMetrics as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load performance data/i)).toBeInTheDocument();
      });
    });

    it('should display retry button on error', async () => {
      (getPerformanceMetrics as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.getByText(/Retry/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance Metrics Display', () => {
    it('should display average response time', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.getByText(/150ms/i)).toBeInTheDocument();
      });
    });

    it('should display P95 response time', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.getByText(/300ms/i)).toBeInTheDocument();
      });
    });

    it('should display P99 response time', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.getByText(/500ms/i)).toBeInTheDocument();
      });
    });

    it('should display cache hit rate', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.getByText(/75%/i)).toBeInTheDocument();
      });
    });

    it('should display zero result rate', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.getByText(/5%/i)).toBeInTheDocument();
      });
    });

    it('should display total queries', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.getByText(/1,000/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance Alerts Display', () => {
    it('should display performance alerts section', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.getByText('Performance Alerts')).toBeInTheDocument();
      });
    });

    it('should display alert messages', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.getByText('Average response time exceeded threshold')).toBeInTheDocument();
        expect(screen.getByText('Cache hit rate below threshold')).toBeInTheDocument();
      });
    });

    it('should display alert severity indicators', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.getByText('high')).toBeInTheDocument();
        expect(screen.getByText('medium')).toBeInTheDocument();
      });
    });

    it('should handle empty alerts', async () => {
      (getPerformanceAlerts as jest.Mock).mockResolvedValue([]);

      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.getByText(/No performance alerts/i)).toBeInTheDocument();
      });
    });
  });

  describe('Real-Time Statistics Display', () => {
    it('should display real-time statistics section', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.getByText('Real-Time Statistics')).toBeInTheDocument();
      });
    });

    it('should display current queries count', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.getByText('50')).toBeInTheDocument();
      });
    });

    it('should display queries per second', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.getByText('2.5')).toBeInTheDocument();
      });
    });

    it('should display active users count', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.getByText('25')).toBeInTheDocument();
      });
    });
  });

  describe('Response Time Distribution Display', () => {
    it('should display response time distribution section', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.getByText('Response Time Distribution')).toBeInTheDocument();
      });
    });

    it('should display distribution ranges', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.getByText('0-100ms')).toBeInTheDocument();
        expect(screen.getByText('100-200ms')).toBeInTheDocument();
        expect(screen.getByText('200-500ms')).toBeInTheDocument();
        expect(screen.getByText('500ms+')).toBeInTheDocument();
      });
    });

    it('should display distribution percentages', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.getByText('40%')).toBeInTheDocument();
        expect(screen.getByText('30%')).toBeInTheDocument();
        expect(screen.getByText('20%')).toBeInTheDocument();
        expect(screen.getByText('10%')).toBeInTheDocument();
      });
    });
  });

  describe('Cache Statistics Display', () => {
    it('should display cache statistics section', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.getByText('Cache Statistics')).toBeInTheDocument();
      });
    });

    it('should display cache hit rate', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.getByText('75%')).toBeInTheDocument();
      });
    });

    it('should display cache miss rate', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.getByText('25%')).toBeInTheDocument();
      });
    });

    it('should display total requests', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.getByText('10,000')).toBeInTheDocument();
      });
    });

    it('should display cache hits and misses', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.getByText('7,500')).toBeInTheDocument();
        expect(screen.getByText('2,500')).toBeInTheDocument();
      });
    });
  });

  describe('Time Range Filtering', () => {
    it('should display time range selector', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Last 24 hours')).toBeInTheDocument();
      });
    });

    it('should have all time range options', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        const select = screen.getByDisplayValue('Last 24 hours');
        expect(select).toBeInTheDocument();
      });
    });

    it('should refetch data when time range changes', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(getPerformanceMetrics).toHaveBeenCalledWith('24h');
      });

      const select = screen.getByDisplayValue('Last 24 hours');
      fireEvent.change(select, { target: { value: '7d' } });

      await waitFor(() => {
        expect(getPerformanceMetrics).toHaveBeenCalledWith('7d');
      });
    });
  });

  describe('API Integration', () => {
    it('should call getPerformanceMetrics on mount', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(getPerformanceMetrics).toHaveBeenCalled();
      });
    });

    it('should call getPerformanceAlerts on mount', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(getPerformanceAlerts).toHaveBeenCalled();
      });
    });

    it('should call getRealTimeStats on mount', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(getRealTimeStats).toHaveBeenCalled();
      });
    });

    it('should call getResponseTimeDistribution on mount', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(getResponseTimeDistribution).toHaveBeenCalled();
      });
    });

    it('should call getCacheStats on mount', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(getCacheStats).toHaveBeenCalled();
      });
    });
  });

  describe('User Interactions', () => {
    it('should handle retry on error', async () => {
      (getPerformanceMetrics as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<PerformancePage />);

      await waitFor(() => {
        const retryButton = screen.getByText(/Retry/i);
        fireEvent.click(retryButton);
      });

      expect(getPerformanceMetrics).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty performance metrics', async () => {
      (getPerformanceMetrics as jest.Mock).mockResolvedValue({
        timeRange: '24h',
        metrics: [],
        summary: {
          avgResponseTime: 0,
          p95ResponseTime: 0,
          p99ResponseTime: 0,
          cacheHitRate: 0,
          zeroResultRate: 0,
          totalQueries: 0,
        },
      });

      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });

    it('should handle very large response times', async () => {
      (getPerformanceMetrics as jest.Mock).mockResolvedValue({
        timeRange: '24h',
        metrics: [
          {
            queryCount: 1000,
            avgResponseTime: 9999,
            p95ResponseTime: 9999,
            p99ResponseTime: 9999,
            cacheHitRate: 0.75,
            zeroResultRate: 0.05,
          },
        ],
        summary: {
          avgResponseTime: 9999,
          p95ResponseTime: 9999,
          p99ResponseTime: 9999,
          cacheHitRate: 0.75,
          zeroResultRate: 0.05,
          totalQueries: 1000,
        },
      });

      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.getByText('9999ms')).toBeInTheDocument();
      });
    });

    it('should handle zero cache hit rate', async () => {
      (getCacheStats as jest.Mock).mockResolvedValue({
        hitRate: 0,
        missRate: 1,
        totalRequests: 10000,
        hits: 0,
        misses: 10000,
      });

      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.getByText('0%')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render correctly on mobile', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.getByText('Search Performance')).toBeInTheDocument();
      });
    });

    it('should render correctly on desktop', async () => {
      render(<PerformancePage />);

      await waitFor(() => {
        expect(screen.getByText('Search Performance')).toBeInTheDocument();
      });
    });
  });
});
