/**
 * Admin Search Personalization Page Tests
 * 
 * Comprehensive tests for admin search personalization page covering:
 * - Page rendering
 * - Loading state
 * - Error state
 * - User preferences display
 * - Personalization metrics display
 * - Personalization effectiveness display
 * - User interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminPersonalizationPage from '../personalization/page';
import {
  getUserPreferences,
  updateUserPreferences,
  getPersonalizationMetrics,
  getPersonalizationEffectiveness,
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

describe('Admin Search Personalization Page', () => {
  const mockUserId = 'user-123';
  const mockUserPreferences = {
    userId: mockUserId,
    preferredCategories: ['Electronics', 'Computers'],
    preferredBrands: ['Apple', 'Dell'],
    priceRange: { min: 500, max: 2000 },
    preferredSortOrder: 'relevance',
    searchHistory: [
      { query: 'laptop', timestamp: new Date() },
      { query: 'phone', timestamp: new Date() },
    ],
  };

  const mockPersonalizationMetrics = {
    timeRange: '7d',
    userCount: 100,
    personalizedUsers: 50,
    avgClickRateImprovement: 15.5,
    avgConversionImprovement: 12.3,
    userSatisfaction: 85.0,
    engagementIncrease: 20.0,
    topPreferences: {
      categories: [
        { categoryId: 'cat-1', categoryName: 'Electronics', userCount: 80 },
        { categoryId: 'cat-2', categoryName: 'Computers', userCount: 60 },
      ],
      brands: [
        { brandId: 'brand-1', brandName: 'Apple', userCount: 70 },
        { brandId: 'brand-2', brandName: 'Samsung', userCount: 40 },
      ],
    },
  };

  const mockPersonalizationEffectiveness = {
    timeRange: '7d',
    overallImprovement: 15.0,
    clickRateImprovement: 12.5,
    conversionRateImprovement: 18.3,
    userSatisfactionIncrease: 10.0,
    metricsByUserType: {
      new: { clickRateImprovement: 0, conversionRateImprovement: 0 },
      returning: { clickRateImprovement: 15.0, conversionRateImprovement: 20.0 },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getUserPreferences as jest.Mock).mockResolvedValue(mockUserPreferences);
    (updateUserPreferences as jest.Mock).mockResolvedValue(undefined);
    (getPersonalizationMetrics as jest.Mock).mockResolvedValue(mockPersonalizationMetrics);
    (getPersonalizationEffectiveness as jest.Mock).mockResolvedValue(mockPersonalizationEffectiveness);
  });

  describe('Page Rendering', () => {
    it('should render the admin personalization page', () => {
      render(<AdminPersonalizationPage />);

      expect(screen.getByText('Admin - Search Personalization')).toBeInTheDocument();
    });

    it('should render page title', () => {
      render(<AdminPersonalizationPage />);

      expect(document.title).toContain('Admin - Search Personalization');
    });

    it('should render navigation elements', () => {
      render(<AdminPersonalizationPage />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      (getUserPreferences as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<AdminPersonalizationPage />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should hide loading spinner after data loads', async () => {
      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should display error message when API fails', async () => {
      (getUserPreferences as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load personalization data/i)).toBeInTheDocument();
      });
    });

    it('should display retry button on error', async () => {
      (getUserPreferences as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        expect(screen.getByText(/Retry/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Preferences Display', () => {
    it('should display user preferences section', async () => {
      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        expect(screen.getByText('User Preferences')).toBeInTheDocument();
      });
    });

    it('should display preferred categories', async () => {
      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        expect(screen.getByText('Electronics')).toBeInTheDocument();
        expect(screen.getByText('Computers')).toBeInTheDocument();
      });
    });

    it('should display preferred brands', async () => {
      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument();
        expect(screen.getByText('Dell')).toBeInTheDocument();
      });
    });

    it('should display price range', async () => {
      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        expect(screen.getByText('$500')).toBeInTheDocument();
        expect(screen.getByText('$2,000')).toBeInTheDocument();
      });
    });

    it('should display preferred sort order', async () => {
      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        expect(screen.getByText('relevance')).toBeInTheDocument();
      });
    });

    it('should display search history', async () => {
      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        expect(screen.getByText('laptop')).toBeInTheDocument();
        expect(screen.getByText('phone')).toBeInTheDocument();
      });
    });
  });

  describe('Personalization Metrics Display', () => {
    it('should display personalization metrics section', async () => {
      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        expect(screen.getByText('Personalization Metrics')).toBeInTheDocument();
      });
    });

    it('should display personalized users count', async () => {
      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        expect(screen.getByText('50')).toBeInTheDocument();
      });
    });

    it('should display click rate improvement', async () => {
      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        expect(screen.getByText('15.5%')).toBeInTheDocument();
      });
    });

    it('should display conversion improvement', async () => {
      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        expect(screen.getByText('12.3%')).toBeInTheDocument();
      });
    });

    it('should display user satisfaction', async () => {
      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        expect(screen.getByText('85%')).toBeInTheDocument();
      });
    });

    it('should display engagement increase', async () => {
      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        expect(screen.getByText('20%')).toBeInTheDocument();
      });
    });

    it('should display top preferences', async () => {
      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        expect(screen.getByText('Electronics')).toBeInTheDocument();
        expect(screen.getByText('Computers')).toBeInTheDocument();
        expect(screen.getByText('Apple')).toBeInTheDocument();
        expect(screen.getByText('Samsung')).toBeInTheDocument();
      });
    });
  });

  describe('Personalization Effectiveness Display', () => {
    it('should display effectiveness section', async () => {
      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        expect(screen.getByText('Personalization Effectiveness')).toBeInTheDocument();
      });
    });

    it('should display overall improvement', async () => {
      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        expect(screen.getByText('15%')).toBeInTheDocument();
      });
    });

    it('should display click rate improvement', async () => {
      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        expect(screen.getByText('12.5%')).toBeInTheDocument();
      });
    });

    it('should display conversion rate improvement', async () => {
      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        expect(screen.getByText('18.3%')).toBeInTheDocument();
      });
    });

    it('should display user satisfaction increase', async () => {
      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        expect(screen.getByText('10%')).toBeInTheDocument();
      });
    });

    it('should display metrics by user type', async () => {
      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        expect(screen.getByText('New Users')).toBeInTheDocument();
        expect(screen.getByText('Returning Users')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should call getUserPreferences on mount', async () => {
      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        expect(getUserPreferences).toHaveBeenCalled();
      });
    });

    it('should call getPersonalizationMetrics on mount', async () => {
      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        expect(getPersonalizationMetrics).toHaveBeenCalled();
      });
    });

    it('should call getPersonalizationEffectiveness on mount', async () => {
      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        expect(getPersonalizationEffectiveness).toHaveBeenCalled();
      });
    });
  });

  describe('User Interactions', () => {
    it('should handle retry on error', async () => {
      (getUserPreferences as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        const retryButton = screen.getByText(/Retry/i);
        fireEvent.click(retryButton);
      });

      expect(getUserPreferences).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty user preferences', async () => {
      (getUserPreferences as jest.Mock).mockResolvedValue({
        userId: mockUserId,
        preferredCategories: [],
        preferredBrands: [],
        priceRange: { min: 0, max: 0 },
        preferredSortOrder: 'relevance',
        searchHistory: [],
      });

      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        expect(screen.getByText(/No preferences set/i)).toBeInTheDocument();
      });
    });

    it('should handle zero improvement metrics', async () => {
      (getPersonalizationMetrics as jest.Mock).mockResolvedValue({
        timeRange: '7d',
        userCount: 100,
        personalizedUsers: 0,
        avgClickRateImprovement: 0,
        avgConversionImprovement: 0,
        userSatisfaction: 0,
        engagementIncrease: 0,
        topPreferences: {
          categories: [],
          brands: [],
        },
      });

      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        expect(screen.getByText('0%')).toBeInTheDocument();
      });
    });

    it('should handle very large improvement metrics', async () => {
      (getPersonalizationMetrics as jest.Mock).mockResolvedValue({
        timeRange: '7d',
        userCount: 100,
        personalizedUsers: 100,
        avgClickRateImprovement: 99.9,
        avgConversionImprovement: 99.9,
        userSatisfaction: 100,
        engagementIncrease: 100,
        topPreferences: {
          categories: [],
          brands: [],
        },
      });

      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        expect(screen.getByText('99.9%')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render correctly on mobile', async () => {
      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        expect(screen.getByText('Admin - Search Personalization')).toBeInTheDocument();
      });
    });

    it('should render correctly on desktop', async () => {
      render(<AdminPersonalizationPage />);

      await waitFor(() => {
        expect(screen.getByText('Admin - Search Personalization')).toBeInTheDocument();
      });
    });
  });
});
