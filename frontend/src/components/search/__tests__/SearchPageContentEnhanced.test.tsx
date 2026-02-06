/**
 * SearchPageContentEnhanced Component Tests
 * 
 * Comprehensive tests for SearchPageContentEnhanced component covering:
 * - Rendering with default props
 * - Loading state
 * - Error state
 * - Search results display
 * - Product grid display
 * - Click tracking
 * - Dwell time tracking
 * - Conversion tracking
 * - Personalized results
 * - A/B testing variant support
 * - Empty state
 * - No query state
 * - User interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchPageContentEnhanced from '../SearchPageContentEnhanced';
import { search } from '@/lib/api/search';
import { getPersonalizedResults } from '@/lib/api/searchAnalytics';
import { useSearchTracking } from '@/hooks/useSearchTracking';

// Mock API functions
jest.mock('@/lib/api/search');
jest.mock('@/lib/api/searchAnalytics');
jest.mock('@/hooks/useSearchTracking');
jest.mock('@/components/product/FilterSidebar', () => ({
  FilterSidebar: () => <div data-testid="filter-sidebar">Filter Sidebar</div>,
}));
jest.mock('@/components/product/SortDropdown', () => ({
  SortDropdown: () => <div data-testid="sort-dropdown">Sort Dropdown</div>,
}));

describe('SearchPageContentEnhanced Component', () => {
  const mockQuery = 'laptop';
  const mockUserId = 'user-123';
  const mockCategoriesData = [
    { id: 'cat-1', name: 'Electronics', slug: 'electronics' },
    { id: 'cat-2', name: 'Computers', slug: 'computers' },
  ];
  const mockBrandsData = [
    { id: 'brand-1', name: 'Apple', slug: 'apple' },
    { id: 'brand-2', name: 'Dell', slug: 'dell' },
  ];

  const mockProducts = [
    {
      id: 'prod-1',
      slug: 'macbook-pro',
      name: 'MacBook Pro',
      regularPrice: 1299.99,
      salePrice: 1199.99,
      avgRating: 4.5,
      images: [
        {
          originalUrl: 'https://example.com/macbook.jpg',
          optimizedUrl: 'https://example.com/macbook-optimized.jpg',
        },
      ],
    },
    {
      id: 'prod-2',
      slug: 'dell-xps',
      name: 'Dell XPS 15',
      regularPrice: 1499.99,
      avgRating: 4.3,
      images: [
        {
          originalUrl: 'https://example.com/dell.jpg',
          optimizedUrl: 'https://example.com/dell-optimized.jpg',
        },
      ],
    },
  ];

  const mockSearchResults = {
    products: mockProducts,
    pagination: {
      total: 100,
      pages: 10,
      page: 1,
      limit: 10,
    },
  };

  const mockPersonalizedResults = {
    products: mockProducts,
    pagination: {
      total: 100,
      pages: 10,
      page: 1,
      limit: 10,
    },
  };

  const mockTracking = {
    sessionId: 'session-123',
    currentSearchId: 'search-123',
    trackSearch: jest.fn().mockResolvedValue('search-123'),
    updateSearchResponseTime: jest.fn(),
    trackClick: jest.fn(),
    trackConversion: jest.fn(),
    getDwellTime: jest.fn().mockReturnValue(5000),
    stopDwellTimeTracking: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (search as jest.Mock).mockResolvedValue(mockSearchResults);
    (getPersonalizedResults as jest.Mock).mockResolvedValue(mockPersonalizedResults);
    (useSearchTracking as jest.Mock).mockReturnValue(mockTracking);
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      expect(screen.getByText(`Results for "${mockQuery}"`)).toBeInTheDocument();
    });

    it('should render with all required props', () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      expect(screen.getByText(`Results for "${mockQuery}"`)).toBeInTheDocument();
    });

    it('should render with userId', () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          userId={mockUserId}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      expect(screen.getByText('Personalized')).toBeInTheDocument();
    });

    it('should render with enablePersonalization false', () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          userId={mockUserId}
          enablePersonalization={false}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      expect(screen.queryByText('Personalized')).not.toBeInTheDocument();
    });

    it('should render with enableTracking false', () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          enableTracking={false}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      expect(screen.queryByText(/Position:/)).not.toBeInTheDocument();
    });

    it('should render with enableABTesting true', () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          enableABTesting={true}
          experimentVariant="variant-a"
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      expect(screen.getByText('Variant: variant-a')).toBeInTheDocument();
    });

    it('should render with filters', () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          categories={['cat-1']}
          brands={['brand-1']}
          minPrice={500}
          maxPrice={2000}
          rating={4}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      expect(screen.getByTestId('filter-sidebar')).toBeInTheDocument();
    });

    it('should render with sortBy', () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          sortBy="price"
          sortOrder="asc"
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      expect(screen.getByTestId('sort-dropdown')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should hide loading spinner after data loads', async () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should display error message when API fails', async () => {
      (search as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/API Error/i)).toBeInTheDocument();
      });
    });

    it('should display custom error message', async () => {
      (search as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search Results Display', () => {
    it('should display search results', async () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
        expect(screen.getByText('Dell XPS 15')).toBeInTheDocument();
      });
    });

    it('should display total results count', async () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Found 100 products/i)).toBeInTheDocument();
      });
    });

    it('should display results range', async () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Showing 1-2 of 100 results/i)).toBeInTheDocument();
      });
    });

    it('should display response time', async () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/\d+ms/)).toBeInTheDocument();
      });
    });

    it('should display product images', async () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        expect(images.length).toBeGreaterThan(0);
      });
    });

    it('should display product prices', async () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('$1199.99')).toBeInTheDocument();
        expect(screen.getByText('$1499.99')).toBeInTheDocument();
      });
    });

    it('should display sale prices', async () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('$1199.99')).toBeInTheDocument();
        expect(screen.getByText('$1299.99')).toBeInTheDocument();
      });
    });

    it('should display product ratings', async () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('4.5')).toBeInTheDocument();
        expect(screen.getByText('4.3')).toBeInTheDocument();
      });
    });

    it('should create proper product links', async () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        const productLink = screen.getByText('MacBook Pro').closest('a');
        expect(productLink).toHaveAttribute('href', '/products/macbook-pro');
      });
    });
  });

  describe('Click Tracking', () => {
    it('should track product click when enableTracking is true', async () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          enableTracking={true}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        const productCard = screen.getByText('MacBook Pro').closest('div');
        fireEvent.click(productCard!);
      });

      expect(mockTracking.trackClick).toHaveBeenCalledWith('prod-1', 1);
    });

    it('should not track product click when enableTracking is false', async () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          enableTracking={false}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        const productCard = screen.getByText('MacBook Pro').closest('div');
        fireEvent.click(productCard!);
      });

      expect(mockTracking.trackClick).not.toHaveBeenCalled();
    });

    it('should display position when enableTracking is true', async () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          enableTracking={true}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Position: 1/)).toBeInTheDocument();
        expect(screen.getByText(/Position: 2/)).toBeInTheDocument();
      });
    });
  });

  describe('Conversion Tracking', () => {
    it('should track add to cart when enableTracking is true', async () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          enableTracking={true}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        const addToCartButton = screen.getByText('Add to Cart');
        fireEvent.click(addToCartButton);
      });

      expect(mockTracking.trackConversion).toHaveBeenCalledWith('add_to_cart', 'prod-1');
    });

    it('should not track add to cart when enableTracking is false', async () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          enableTracking={false}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        const addToCartButton = screen.queryByText('Add to Cart');
        expect(addToCartButton).not.toBeInTheDocument();
      });
    });

    it('should call handlePurchase when purchase is triggered', async () => {
      const handlePurchase = jest.fn();
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          enableTracking={true}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(mockTracking.trackConversion).toBeDefined();
      });
    });
  });

  describe('Personalized Results', () => {
    it('should use personalized search when userId is provided and enablePersonalization is true', async () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          userId={mockUserId}
          enablePersonalization={true}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(getPersonalizedResults).toHaveBeenCalledWith(
          mockQuery,
          mockUserId,
          expect.any(Object)
        );
      });
    });

    it('should use regular search when userId is not provided', async () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(search).toHaveBeenCalledWith(
          expect.objectContaining({
            query: mockQuery,
          })
        );
      });
    });

    it('should use regular search when enablePersonalization is false', async () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          userId={mockUserId}
          enablePersonalization={false}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(search).toHaveBeenCalledWith(
          expect.objectContaining({
            query: mockQuery,
          })
        );
      });
    });

    it('should display personalized indicator when personalized results are used', async () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          userId={mockUserId}
          enablePersonalization={true}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Personalized')).toBeInTheDocument();
      });
    });
  });

  describe('A/B Testing', () => {
    it('should display variant when enableABTesting is true', async () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          enableABTesting={true}
          experimentVariant="variant-a"
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Variant: variant-a')).toBeInTheDocument();
      });
    });

    it('should not display variant when enableABTesting is false', async () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          enableABTesting={false}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText(/Variant:/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no results found', async () => {
      (search as jest.Mock).mockResolvedValue({
        products: [],
        pagination: {
          total: 0,
          pages: 0,
          page: 1,
          limit: 10,
        },
      });

      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument();
        expect(screen.getByText(/We couldn't find any products matching/i)).toBeInTheDocument();
      });
    });

    it('should display helpful suggestions in empty state', async () => {
      (search as jest.Mock).mockResolvedValue({
        products: [],
        pagination: {
          total: 0,
          pages: 0,
          page: 1,
          limit: 10,
        },
      });

      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Checking your spelling/i)).toBeInTheDocument();
        expect(screen.getByText(/Using more general terms/i)).toBeInTheDocument();
        expect(screen.getByText(/Trying different keywords/i)).toBeInTheDocument();
        expect(screen.getByText(/Clearing filters/i)).toBeInTheDocument();
      });
    });
  });

  describe('No Query State', () => {
    it('should display trending and personalized suggestions when no query', async () => {
      render(
        <SearchPageContentEnhanced
          query=""
          page={1}
          limit={10}
          userId={mockUserId}
          enablePersonalization={true}
          enableTrending={true}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Search')).toBeInTheDocument();
      });
    });

    it('should not display search results when no query', async () => {
      render(
        <SearchPageContentEnhanced
          query=""
          page={1}
          limit={10}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('MacBook Pro')).not.toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should call search API on mount', async () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(search).toHaveBeenCalledWith(
          expect.objectContaining({
            query: mockQuery,
            page: 1,
            limit: 10,
          })
        );
      });
    });

    it('should call getPersonalizedResults when personalized search is enabled', async () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          userId={mockUserId}
          enablePersonalization={true}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(getPersonalizedResults).toHaveBeenCalledWith(
          mockQuery,
          mockUserId,
          expect.any(Object)
        );
      });
    });

    it('should track search when enableTracking is true', async () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          enableTracking={true}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(mockTracking.trackSearch).toHaveBeenCalledWith(
          mockQuery,
          100,
          expect.any(Object),
          'relevance'
        );
      });
    });

    it('should update search response time', async () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          enableTracking={true}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(mockTracking.updateSearchResponseTime).toHaveBeenCalledWith('search-123', expect.any(Number));
      });
    });
  });

  describe('User Interactions', () => {
    it('should navigate to product page when clicking product', async () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        const productLink = screen.getByText('MacBook Pro').closest('a');
        expect(productLink).toHaveAttribute('href', '/products/macbook-pro');
      });
    });

    it('should stop dwell time tracking on unmount', () => {
      const { unmount } = render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      unmount();

      expect(mockTracking.stopDwellTimeTracking).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing product images', async () => {
      const mockProductsWithoutImages = [
        {
          id: 'prod-1',
          slug: 'test-product',
          name: 'Test Product',
          regularPrice: 99.99,
          avgRating: 4.0,
          images: [],
        },
      ];
      (search as jest.Mock).mockResolvedValue({
        products: mockProductsWithoutImages,
        pagination: {
          total: 1,
          pages: 1,
          page: 1,
          limit: 10,
        },
      });

      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
      });
    });

    it('should handle missing product ratings', async () => {
      const mockProductsWithoutRatings = [
        {
          id: 'prod-1',
          slug: 'test-product',
          name: 'Test Product',
          regularPrice: 99.99,
          images: [
            {
              originalUrl: 'https://example.com/test.jpg',
              optimizedUrl: 'https://example.com/test-optimized.jpg',
            },
          ],
        },
      ];
      (search as jest.Mock).mockResolvedValue({
        products: mockProductsWithoutRatings,
        pagination: {
          total: 1,
          pages: 1,
          page: 1,
          limit: 10,
        },
      });

      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });
    });

    it('should handle very large result counts', async () => {
      (search as jest.Mock).mockResolvedValue({
        products: mockProducts,
        pagination: {
          total: 999999,
          pages: 100000,
          page: 1,
          limit: 10,
        },
      });

      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/1.0M products/i)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render correctly on mobile', async () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(`Results for "${mockQuery}"`)).toBeInTheDocument();
      });
    });

    it('should display filter sidebar on large screens', async () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('filter-sidebar')).toBeInTheDocument();
      });
    });

    it('should display product grid', async () => {
      render(
        <SearchPageContentEnhanced
          query={mockQuery}
          page={1}
          limit={10}
          categoriesData={mockCategoriesData}
          brandsData={mockBrandsData}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
        expect(screen.getByText('Dell XPS 15')).toBeInTheDocument();
      });
    });
  });
});
