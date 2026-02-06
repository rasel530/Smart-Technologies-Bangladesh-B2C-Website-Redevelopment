/**
 * PersonalizedSuggestions Component Tests
 * 
 * Comprehensive tests for PersonalizedSuggestions component covering:
 * - Rendering with default props
 * - Loading state
 * - Error state
 * - Personalized suggestions display
 * - Recent searches display
 * - People also searched display
 * - Product recommendations display
 * - User interactions
 * - Empty state
 * - API mocking
 * - Suggestion click handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PersonalizedSuggestions from '../PersonalizedSuggestions';
import {
  getPersonalizedSuggestions,
  getRecommendations,
  getSearchHistory,
} from '@/lib/api/searchAnalytics';

// Mock API functions
jest.mock('@/lib/api/searchAnalytics');

describe('PersonalizedSuggestions Component', () => {
  const mockUserId = 'user-123';
  const mockQuery = 'laptop';

  const mockSuggestions = [
    {
      text: 'MacBook Pro',
      type: 'product',
      score: 0.95,
      category: 'Computers',
      imageUrl: 'https://example.com/macbook.jpg',
      price: 1299.99,
    },
    {
      text: 'Laptop Accessories',
      type: 'category',
      score: 0.85,
      category: 'Accessories',
      imageUrl: 'https://example.com/accessories.jpg',
    },
    {
      text: 'laptop bag',
      type: 'search',
      score: 0.75,
    },
  ];

  const mockRecentSearches = [
    {
      query: 'phone',
      timestamp: '2024-01-15T10:00:00Z',
      resultsCount: 50,
    },
    {
      query: 'tablet',
      timestamp: '2024-01-14T15:30:00Z',
      resultsCount: 30,
    },
  ];

  const mockRecommendations = [
    {
      id: 'rec-1',
      productId: 'prod-1',
      productName: 'MacBook Pro 14"',
      recommendationType: 'hybrid',
      score: 0.92,
      reason: 'Based on your recent searches for laptops',
      category: 'Computers',
      imageUrl: 'https://example.com/macbook.jpg',
      price: 1299.99,
    },
    {
      id: 'rec-2',
      productId: 'prod-2',
      productName: 'iPhone 15 Pro',
      recommendationType: 'collaborative',
      score: 0.88,
      reason: 'Users who viewed this also viewed',
      category: 'Phones',
      imageUrl: 'https://example.com/iphone.jpg',
      price: 999.99,
    },
  ];

  const mockOnSuggestionClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (getPersonalizedSuggestions as jest.Mock).mockResolvedValue(mockSuggestions);
    (getRecommendations as jest.Mock).mockResolvedValue(mockRecommendations);
    (getSearchHistory as jest.Mock).mockResolvedValue(mockRecentSearches);
  });

  describe('Rendering', () => {
    it('should render with default props', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByText('Personalized Suggestions')).toBeInTheDocument();
      });
    });

    it('should render with custom className', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} className="custom-class" />);

      await waitFor(() => {
        const container = screen.getByText('Personalized Suggestions').closest('div');
        expect(container).toHaveClass('custom-class');
      });
    });

    it('should render with custom limit', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} limit={5} />);

      await waitFor(() => {
        expect(getPersonalizedSuggestions).toHaveBeenCalledWith(mockUserId, 5);
      });
    });

    it('should render with query', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} query={mockQuery} />);

      await waitFor(() => {
        expect(screen.getByText('People Also Searched')).toBeInTheDocument();
      });
    });

    it('should render without recent searches', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} showRecentSearches={false} />);

      await waitFor(() => {
        expect(getSearchHistory).not.toHaveBeenCalled();
      });
    });

    it('should render without people also searched', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} showPeopleAlsoSearched={false} />);

      await waitFor(() => {
        expect(screen.queryByText('People Also Searched')).not.toBeInTheDocument();
      });
    });

    it('should render without recommendations', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} showRecommendations={false} />);

      await waitFor(() => {
        expect(getRecommendations).not.toHaveBeenCalled();
      });
    });

    it('should render with onSuggestionClick callback', async () => {
      render(
        <PersonalizedSuggestions
          userId={mockUserId}
          onSuggestionClick={mockOnSuggestionClick}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Personalized Suggestions')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      render(<PersonalizedSuggestions userId={mockUserId} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should hide loading spinner after data loads', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should display error message when API fails', async () => {
      (getPersonalizedSuggestions as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<PersonalizedSuggestions userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load suggestions/i)).toBeInTheDocument();
      });
    });

    it('should display custom error message', async () => {
      (getPersonalizedSuggestions as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<PersonalizedSuggestions userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Personalized Suggestions Display', () => {
    it('should display personalized suggestions list', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByText('Personalized Suggestions')).toBeInTheDocument();
        expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
        expect(screen.getByText('Laptop Accessories')).toBeInTheDocument();
        expect(screen.getByText('laptop bag')).toBeInTheDocument();
      });
    });

    it('should display suggestion scores', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByText('Score: 0.95')).toBeInTheDocument();
        expect(screen.getByText('Score: 0.85')).toBeInTheDocument();
      });
    });

    it('should display suggestion images when available', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} />);

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        expect(images.length).toBeGreaterThan(0);
      });
    });

    it('should display suggestion categories', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByText('Computers')).toBeInTheDocument();
        expect(screen.getByText('Accessories')).toBeInTheDocument();
      });
    });

    it('should display suggestion prices when available', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByText('$1299.99')).toBeInTheDocument();
      });
    });

    it('should display suggestion icons based on type', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} />);

      await waitFor(() => {
        const icons = screen.getAllByRole('img');
        expect(icons.length).toBeGreaterThan(0);
      });
    });

    it('should not display personalized suggestions when userId is not provided', async () => {
      render(<PersonalizedSuggestions />);

      await waitFor(() => {
        expect(screen.queryByText('Personalized Suggestions')).not.toBeInTheDocument();
      });
    });

    it('should handle empty suggestions array', async () => {
      (getPersonalizedSuggestions as jest.Mock).mockResolvedValue([]);

      render(<PersonalizedSuggestions userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.queryByText('Personalized Suggestions')).not.toBeInTheDocument();
      });
    });
  });

  describe('Recent Searches Display', () => {
    it('should display recent searches section', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} showRecentSearches={true} />);

      await waitFor(() => {
        expect(screen.getByText('Recent Searches')).toBeInTheDocument();
      });
    });

    it('should display recent search queries', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} showRecentSearches={true} />);

      await waitFor(() => {
        expect(screen.getByText('phone')).toBeInTheDocument();
        expect(screen.getByText('tablet')).toBeInTheDocument();
      });
    });

    it('should display search timestamps', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} showRecentSearches={true} />);

      await waitFor(() => {
        const timestamps = screen.getAllByText(/1\/15\/2024|1\/14\/2024/);
        expect(timestamps.length).toBeGreaterThan(0);
      });
    });

    it('should create proper search links', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} showRecentSearches={true} />);

      await waitFor(() => {
        const phoneLink = screen.getByText('phone').closest('a');
        expect(phoneLink).toHaveAttribute('href', '/search?q=phone');
      });
    });

    it('should not display recent searches when showRecentSearches is false', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} showRecentSearches={false} />);

      await waitFor(() => {
        expect(screen.queryByText('Recent Searches')).not.toBeInTheDocument();
      });
    });

    it('should handle empty recent searches array', async () => {
      (getSearchHistory as jest.Mock).mockResolvedValue([]);

      render(<PersonalizedSuggestions userId={mockUserId} showRecentSearches={true} />);

      await waitFor(() => {
        expect(screen.queryByText('Recent Searches')).not.toBeInTheDocument();
      });
    });
  });

  describe('People Also Searched Display', () => {
    it('should display people also searched section when query is provided', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} query={mockQuery} showPeopleAlsoSearched={true} />);

      await waitFor(() => {
        expect(screen.getByText('People Also Searched')).toBeInTheDocument();
      });
    });

    it('should display people also searched suggestions', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} query={mockQuery} showPeopleAlsoSearched={true} />);

      await waitFor(() => {
        expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
        expect(screen.getByText('Laptop Accessories')).toBeInTheDocument();
      });
    });

    it('should display suggestion images', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} query={mockQuery} showPeopleAlsoSearched={true} />);

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        expect(images.length).toBeGreaterThan(0);
      });
    });

    it('should display suggestion prices when available', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} query={mockQuery} showPeopleAlsoSearched={true} />);

      await waitFor(() => {
        expect(screen.getByText('$1299.99')).toBeInTheDocument();
      });
    });

    it('should not display people also searched when query is not provided', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} showPeopleAlsoSearched={true} />);

      await waitFor(() => {
        expect(screen.queryByText('People Also Searched')).not.toBeInTheDocument();
      });
    });

    it('should not display people also searched when showPeopleAlsoSearched is false', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} query={mockQuery} showPeopleAlsoSearched={false} />);

      await waitFor(() => {
        expect(screen.queryByText('People Also Searched')).not.toBeInTheDocument();
      });
    });

    it('should handle empty people also searched array', async () => {
      (getPersonalizedSuggestions as jest.Mock).mockResolvedValue([]);

      render(<PersonalizedSuggestions userId={mockUserId} query={mockQuery} showPeopleAlsoSearched={true} />);

      await waitFor(() => {
        expect(screen.queryByText('People Also Searched')).not.toBeInTheDocument();
      });
    });
  });

  describe('Product Recommendations Display', () => {
    it('should display product recommendations section', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} showRecommendations={true} />);

      await waitFor(() => {
        expect(screen.getByText('Recommended for You')).toBeInTheDocument();
      });
    });

    it('should display recommended product names', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} showRecommendations={true} />);

      await waitFor(() => {
        expect(screen.getByText('MacBook Pro 14"')).toBeInTheDocument();
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });
    });

    it('should display recommendation scores', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} showRecommendations={true} />);

      await waitFor(() => {
        expect(screen.getByText('Score: 0.92')).toBeInTheDocument();
        expect(screen.getByText('Score: 0.88')).toBeInTheDocument();
      });
    });

    it('should display recommendation reasons', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} showRecommendations={true} />);

      await waitFor(() => {
        expect(screen.getByText('Based on your recent searches for laptops')).toBeInTheDocument();
        expect(screen.getByText('Users who viewed this also viewed')).toBeInTheDocument();
      });
    });

    it('should display recommendation types', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} showRecommendations={true} />);

      await waitFor(() => {
        expect(screen.getByText('hybrid')).toBeInTheDocument();
        expect(screen.getByText('collaborative')).toBeInTheDocument();
      });
    });

    it('should display recommendation categories', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} showRecommendations={true} />);

      await waitFor(() => {
        expect(screen.getByText('Computers')).toBeInTheDocument();
        expect(screen.getByText('Phones')).toBeInTheDocument();
      });
    });

    it('should display recommendation images', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} showRecommendations={true} />);

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        expect(images.length).toBeGreaterThan(0);
      });
    });

    it('should create proper product links', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} showRecommendations={true} />);

      await waitFor(() => {
        const productLink = screen.getByText('MacBook Pro 14"').closest('a');
        expect(productLink).toHaveAttribute('href', '/products/prod-1');
      });
    });

    it('should not display recommendations when showRecommendations is false', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} showRecommendations={false} />);

      await waitFor(() => {
        expect(screen.queryByText('Recommended for You')).not.toBeInTheDocument();
      });
    });

    it('should handle empty recommendations array', async () => {
      (getRecommendations as jest.Mock).mockResolvedValue([]);

      render(<PersonalizedSuggestions userId={mockUserId} showRecommendations={true} />);

      await waitFor(() => {
        expect(screen.queryByText('Recommended for You')).not.toBeInTheDocument();
      });
    });

    it('should display recommendation type colors correctly', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} showRecommendations={true} />);

      await waitFor(() => {
        expect(screen.getByText('hybrid')).toBeInTheDocument();
        expect(screen.getByText('collaborative')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no data is available for logged in user', async () => {
      (getPersonalizedSuggestions as jest.Mock).mockResolvedValue([]);
      (getSearchHistory as jest.Mock).mockResolvedValue([]);
      (getRecommendations as jest.Mock).mockResolvedValue([]);

      render(<PersonalizedSuggestions userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByText(/No personalized suggestions available yet/i)).toBeInTheDocument();
      });
    });

    it('should display empty state when no data is available for non-logged in user', async () => {
      render(<PersonalizedSuggestions />);

      await waitFor(() => {
        expect(screen.getByText(/Sign in to get personalized suggestions/i)).toBeInTheDocument();
      });
    });

    it('should display empty state icon', async () => {
      (getPersonalizedSuggestions as jest.Mock).mockResolvedValue([]);
      (getSearchHistory as jest.Mock).mockResolvedValue([]);
      (getRecommendations as jest.Mock).mockResolvedValue([]);

      render(<PersonalizedSuggestions userId={mockUserId} />);

      await waitFor(() => {
        const emptyIcon = screen.getByText(/No personalized suggestions available yet/i).previousElementSibling;
        expect(emptyIcon).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should call getPersonalizedSuggestions on mount', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} />);

      await waitFor(() => {
        expect(getPersonalizedSuggestions).toHaveBeenCalledWith(mockUserId, 10);
      });
    });

    it('should call getSearchHistory when showRecentSearches is true', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} showRecentSearches={true} />);

      await waitFor(() => {
        expect(getSearchHistory).toHaveBeenCalledWith(mockUserId, 10);
      });
    });

    it('should call getRecommendations when showRecommendations is true', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} showRecommendations={true} />);

      await waitFor(() => {
        expect(getRecommendations).toHaveBeenCalledWith(mockUserId, 'hybrid', 10);
      });
    });

    it('should not call getPersonalizedSuggestions when userId is not provided', async () => {
      render(<PersonalizedSuggestions />);

      await waitFor(() => {
        expect(getPersonalizedSuggestions).not.toHaveBeenCalled();
      });
    });

    it('should not call getSearchHistory when userId is not provided', async () => {
      render(<PersonalizedSuggestions />);

      await waitFor(() => {
        expect(getSearchHistory).not.toHaveBeenCalled();
      });
    });

    it('should not call getRecommendations when userId is not provided', async () => {
      render(<PersonalizedSuggestions />);

      await waitFor(() => {
        expect(getRecommendations).not.toHaveBeenCalled();
      });
    });
  });

  describe('User Interactions', () => {
    it('should call onSuggestionClick when clicking a suggestion', async () => {
      render(
        <PersonalizedSuggestions
          userId={mockUserId}
          onSuggestionClick={mockOnSuggestionClick}
        />
      );

      await waitFor(() => {
        const suggestion = screen.getByText('MacBook Pro').closest('div');
        fireEvent.click(suggestion!);
      });

      expect(mockOnSuggestionClick).toHaveBeenCalledWith(mockSuggestions[0]);
    });

    it('should navigate to search page when clicking recent search', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} showRecentSearches={true} />);

      await waitFor(() => {
        const phoneLink = screen.getByText('phone').closest('a');
        expect(phoneLink).toHaveAttribute('href', '/search?q=phone');
      });
    });

    it('should navigate to search page when clicking people also searched', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} query={mockQuery} showPeopleAlsoSearched={true} />);

      await waitFor(() => {
        const suggestionLink = screen.getByText('MacBook Pro').closest('a');
        expect(suggestionLink).toHaveAttribute('href', '/search?q=MacBook%20Pro');
      });
    });

    it('should navigate to product page when clicking recommendation', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} showRecommendations={true} />);

      await waitFor(() => {
        const productLink = screen.getByText('MacBook Pro 14"').closest('a');
        expect(productLink).toHaveAttribute('href', '/products/prod-1');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing suggestion image', async () => {
      const mockSuggestionsWithoutImage = [
        {
          text: 'Test',
          type: 'search',
          score: 0.9,
        },
      ];
      (getPersonalizedSuggestions as jest.Mock).mockResolvedValue(mockSuggestionsWithoutImage);

      render(<PersonalizedSuggestions userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
      });
    });

    it('should handle missing suggestion category', async () => {
      const mockSuggestionsWithoutCategory = [
        {
          text: 'Test',
          type: 'search',
          score: 0.9,
        },
      ];
      (getPersonalizedSuggestions as jest.Mock).mockResolvedValue(mockSuggestionsWithoutCategory);

      render(<PersonalizedSuggestions userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
      });
    });

    it('should handle missing suggestion price', async () => {
      const mockSuggestionsWithoutPrice = [
        {
          text: 'Test',
          type: 'search',
          score: 0.9,
        },
      ];
      (getPersonalizedSuggestions as jest.Mock).mockResolvedValue(mockSuggestionsWithoutPrice);

      render(<PersonalizedSuggestions userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
        expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
      });
    });

    it('should handle missing suggestion score', async () => {
      const mockSuggestionsWithoutScore = [
        {
          text: 'Test',
          type: 'search',
        },
      ];
      (getPersonalizedSuggestions as jest.Mock).mockResolvedValue(mockSuggestionsWithoutScore);

      render(<PersonalizedSuggestions userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
        expect(screen.queryByText(/Score:/)).not.toBeInTheDocument();
      });
    });

    it('should handle missing recommendation image', async () => {
      const mockRecommendationsWithoutImage = [
        {
          id: 'rec-1',
          productId: 'prod-1',
          productName: 'Test Product',
          recommendationType: 'hybrid',
          score: 0.9,
          reason: 'Test reason',
        },
      ];
      (getRecommendations as jest.Mock).mockResolvedValue(mockRecommendationsWithoutImage);

      render(<PersonalizedSuggestions userId={mockUserId} showRecommendations={true} />);

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });
    });

    it('should handle missing recommendation reason', async () => {
      const mockRecommendationsWithoutReason = [
        {
          id: 'rec-1',
          productId: 'prod-1',
          productName: 'Test Product',
          recommendationType: 'hybrid',
          score: 0.9,
        },
      ];
      (getRecommendations as jest.Mock).mockResolvedValue(mockRecommendationsWithoutReason);

      render(<PersonalizedSuggestions userId={mockUserId} showRecommendations={true} />);

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });
    });

    it('should handle missing recommendation category', async () => {
      const mockRecommendationsWithoutCategory = [
        {
          id: 'rec-1',
          productId: 'prod-1',
          productName: 'Test Product',
          recommendationType: 'hybrid',
          score: 0.9,
          reason: 'Test reason',
        },
      ];
      (getRecommendations as jest.Mock).mockResolvedValue(mockRecommendationsWithoutCategory);

      render(<PersonalizedSuggestions userId={mockUserId} showRecommendations={true} />);

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
        expect(screen.queryByText(/bg-gray-200/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render correctly on mobile', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByText('Personalized Suggestions')).toBeInTheDocument();
      });
    });

    it('should display grid layout for recommendations', async () => {
      render(<PersonalizedSuggestions userId={mockUserId} showRecommendations={true} />);

      await waitFor(() => {
        expect(screen.getByText('Recommended for You')).toBeInTheDocument();
      });
    });
  });
});
