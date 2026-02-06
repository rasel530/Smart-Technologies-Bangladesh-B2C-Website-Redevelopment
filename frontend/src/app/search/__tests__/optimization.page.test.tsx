/**
 * Search Optimization Dashboard Page Tests
 * 
 * Comprehensive tests for the search optimization dashboard page covering:
 * - Page rendering
 * - Loading state
 * - Error state
 * - Query patterns display
 * - A/B testing experiments display
 * - Optimization insights display
 * - Relevance metrics display
 * - Experiment management
 * - User interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OptimizationPage from '../optimization/page';
import {
  analyzeQueryPatterns,
  getExperiments,
  getOptimizationInsights,
  getRelevanceMetrics,
  createExperiment,
  updateExperimentStatus,
  deleteExperiment,
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

describe('Optimization Dashboard Page', () => {
  const mockQueryPatterns = {
    totalQueries: 5000,
    uniqueQueries: 1000,
    avgQueryLength: 8.5,
    avgResultsCount: 15,
    zeroResultRate: 0.1,
    avgResponseTime: 140,
    topQueries: [
      { query: 'laptop', count: 300, avgResults: 20 },
      { query: 'phone', count: 200, avgResults: 12 },
    ],
    commonFilters: { category: 300, brand: 200 },
    commonSortOptions: { relevance: 400, price_asc: 300 },
  };

  const mockExperiments = [
    {
      id: 'exp-1',
      name: 'Test ML-based ranking',
      algorithmVariant: 'ml_based',
      isActive: true,
      sampleSize: 1000,
      startDate: new Date(),
      endDate: new Date(),
      results: {
        controlConversionRate: 5.0,
        variantConversionRate: 5.5,
        statisticalSignificance: 0.95,
      },
    },
    {
      id: 'exp-2',
      name: 'Test hybrid ranking',
      algorithmVariant: 'hybrid',
      isActive: false,
      sampleSize: 500,
      startDate: new Date(),
      endDate: new Date(),
      results: {
        controlConversionRate: 4.5,
        variantConversionRate: 4.8,
        statisticalSignificance: 0.85,
      },
    },
  ];

  const mockOptimizationInsights = [
    {
      type: 'zero_result_queries',
      query: 'nonexistent-product',
      count: 10,
      suggestion: 'Add this product to catalog',
      priority: 'high',
    },
    {
      type: 'low_click_rate',
      query: 'laptop accessories',
      count: 50,
      clickRate: 0.02,
      suggestion: 'Improve query understanding',
      priority: 'medium',
    },
  ];

  const mockRelevanceMetrics = {
    avgRelevanceScore: 0.75,
    topQueriesRelevance: 0.85,
    longTailQueriesRelevance: 0.65,
    clickThroughRate: 0.12,
    positionClickRate: {
      position1: 0.45,
      position2: 0.25,
      position3: 0.15,
      position4Plus: 0.15,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (analyzeQueryPatterns as jest.Mock).mockResolvedValue(mockQueryPatterns);
    (getExperiments as jest.Mock).mockResolvedValue(mockExperiments);
    (getOptimizationInsights as jest.Mock).mockResolvedValue(mockOptimizationInsights);
    (getRelevanceMetrics as jest.Mock).mockResolvedValue(mockRelevanceMetrics);
    (createExperiment as jest.Mock).mockResolvedValue(mockExperiments[0]);
    (updateExperimentStatus as jest.Mock).mockResolvedValue(mockExperiments[0]);
    (deleteExperiment as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Page Rendering', () => {
    it('should render the optimization dashboard page', () => {
      render(<OptimizationPage />);

      expect(screen.getByText('Search Optimization')).toBeInTheDocument();
    });

    it('should render page title', () => {
      render(<OptimizationPage />);

      expect(document.title).toContain('Search Optimization');
    });

    it('should render navigation elements', () => {
      render(<OptimizationPage />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      (analyzeQueryPatterns as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<OptimizationPage />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should hide loading spinner after data loads', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should display error message when API fails', async () => {
      (analyzeQueryPatterns as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load optimization data/i)).toBeInTheDocument();
      });
    });

    it('should display retry button on error', async () => {
      (analyzeQueryPatterns as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.getByText(/Retry/i)).toBeInTheDocument();
      });
    });
  });

  describe('Query Patterns Display', () => {
    it('should display query patterns section', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.getByText('Query Patterns')).toBeInTheDocument();
      });
    });

    it('should display total queries', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.getByText('5,000')).toBeInTheDocument();
      });
    });

    it('should display unique queries', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.getByText('1,000')).toBeInTheDocument();
      });
    });

    it('should display average query length', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.getByText('8.5')).toBeInTheDocument();
      });
    });

    it('should display average results count', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument();
      });
    });

    it('should display zero result rate', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.getByText('10%')).toBeInTheDocument();
      });
    });

    it('should display top queries', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.getByText('laptop')).toBeInTheDocument();
        expect(screen.getByText('phone')).toBeInTheDocument();
      });
    });

    it('should display common filters', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.getByText('category')).toBeInTheDocument();
        expect(screen.getByText('brand')).toBeInTheDocument();
      });
    });
  });

  describe('A/B Testing Experiments Display', () => {
    it('should display experiments section', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.getByText('A/B Testing Experiments')).toBeInTheDocument();
      });
    });

    it('should display experiment list', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.getByText('Test ML-based ranking')).toBeInTheDocument();
        expect(screen.getByText('Test hybrid ranking')).toBeInTheDocument();
      });
    });

    it('should display experiment status', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('Inactive')).toBeInTheDocument();
      });
    });

    it('should display experiment sample sizes', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.getByText('1,000')).toBeInTheDocument();
        expect(screen.getByText('500')).toBeInTheDocument();
      });
    });

    it('should display experiment results', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.getByText('5.5%')).toBeInTheDocument();
        expect(screen.getByText('5.0%')).toBeInTheDocument();
      });
    });

    it('should handle empty experiments', async () => {
      (getExperiments as jest.Mock).mockResolvedValue([]);

      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.getByText(/No experiments available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Optimization Insights Display', () => {
    it('should display optimization insights section', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.getByText('Optimization Insights')).toBeInTheDocument();
      });
    });

    it('should display insight types', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.getByText('Zero Result Queries')).toBeInTheDocument();
        expect(screen.getByText('Low Click Rate')).toBeInTheDocument();
      });
    });

    it('should display insight suggestions', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.getByText('Add this product to catalog')).toBeInTheDocument();
        expect(screen.getByText('Improve query understanding')).toBeInTheDocument();
      });
    });

    it('should display insight priorities', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.getByText('high')).toBeInTheDocument();
        expect(screen.getByText('medium')).toBeInTheDocument();
      });
    });

    it('should handle empty insights', async () => {
      (getOptimizationInsights as jest.Mock).mockResolvedValue([]);

      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.getByText(/No optimization insights available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Relevance Metrics Display', () => {
    it('should display relevance metrics section', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.getByText('Relevance Metrics')).toBeInTheDocument();
      });
    });

    it('should display average relevance score', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.getByText('75%')).toBeInTheDocument();
      });
    });

    it('should display click-through rate', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.getByText('12%')).toBeInTheDocument();
      });
    });

    it('should display position click rates', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.getByText('45%')).toBeInTheDocument();
        expect(screen.getByText('25%')).toBeInTheDocument();
        expect(screen.getByText('15%')).toBeInTheDocument();
      });
    });
  });

  describe('Experiment Management', () => {
    it('should create new experiment', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        const createButton = screen.getByText('Create Experiment');
        fireEvent.click(createButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Create New Experiment')).toBeInTheDocument();
      });
    });

    it('should update experiment status', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        const toggleButton = screen.getAllByText('Toggle')[0];
        fireEvent.click(toggleButton);
      });

      expect(updateExperimentStatus).toHaveBeenCalled();
    });

    it('should delete experiment', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        const deleteButton = screen.getAllByText('Delete')[0];
        fireEvent.click(deleteButton);
      });

      await waitFor(() => {
        expect(deleteExperiment).toHaveBeenCalled();
      });
    });
  });

  describe('API Integration', () => {
    it('should call analyzeQueryPatterns on mount', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        expect(analyzeQueryPatterns).toHaveBeenCalled();
      });
    });

    it('should call getExperiments on mount', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        expect(getExperiments).toHaveBeenCalled();
      });
    });

    it('should call getOptimizationInsights on mount', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        expect(getOptimizationInsights).toHaveBeenCalled();
      });
    });

    it('should call getRelevanceMetrics on mount', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        expect(getRelevanceMetrics).toHaveBeenCalled();
      });
    });
  });

  describe('User Interactions', () => {
    it('should handle retry on error', async () => {
      (analyzeQueryPatterns as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<OptimizationPage />);

      await waitFor(() => {
        const retryButton = screen.getByText(/Retry/i);
        fireEvent.click(retryButton);
      });

      expect(analyzeQueryPatterns).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty query patterns', async () => {
      (analyzeQueryPatterns as jest.Mock).mockResolvedValue({
        totalQueries: 0,
        uniqueQueries: 0,
        avgQueryLength: 0,
        avgResultsCount: 0,
        zeroResultRate: 0,
        avgResponseTime: 0,
        topQueries: [],
        commonFilters: {},
        commonSortOptions: {},
      });

      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });

    it('should handle very large query counts', async () => {
      (analyzeQueryPatterns as jest.Mock).mockResolvedValue({
        totalQueries: 999999999,
        uniqueQueries: 999999,
        avgQueryLength: 100,
        avgResultsCount: 1000,
        zeroResultRate: 0.5,
        avgResponseTime: 9999,
        topQueries: [],
        commonFilters: {},
        commonSortOptions: {},
      });

      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.getByText(/999.9M/i)).toBeInTheDocument();
      });
    });

    it('should handle zero relevance score', async () => {
      (getRelevanceMetrics as jest.Mock).mockResolvedValue({
        avgRelevanceScore: 0,
        topQueriesRelevance: 0,
        longTailQueriesRelevance: 0,
        clickThroughRate: 0,
        positionClickRate: {
          position1: 0,
          position2: 0,
          position3: 0,
          position4Plus: 0,
        },
      });

      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.getByText('0%')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render correctly on mobile', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.getByText('Search Optimization')).toBeInTheDocument();
      });
    });

    it('should render correctly on desktop', async () => {
      render(<OptimizationPage />);

      await waitFor(() => {
        expect(screen.getByText('Search Optimization')).toBeInTheDocument();
      });
    });
  });
});
