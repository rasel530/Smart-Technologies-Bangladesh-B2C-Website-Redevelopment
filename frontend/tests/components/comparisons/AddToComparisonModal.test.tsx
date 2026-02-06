/**
 * Unit Tests for AddToComparisonModal Component
 * 
 * Tests for the AddToComparisonModal component including:
 * - Component rendering
 * - Comparison fetching
 * - Creating new comparison
 * - Adding to existing comparison
 * - Error handling
 * - Loading states
 * - Search functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { AddToComparisonModal } from '@/components/comparisons/AddToComparisonModal';
import * as comparisonsApi from '@/lib/api/comparisons';

// Mock the API
jest.mock('@/lib/api/comparisons', () => ({
  getComparisons: jest.fn(),
  createComparison: jest.fn(),
  addProductToComparison: jest.fn(),
}));

const mockProduct = {
  id: 'product-1',
  name: 'Test Product',
  nameEn: 'Test Product',
  slug: 'test-product',
  regularPrice: 1000,
  salePrice: 900,
  images: [
    {
      id: 'image-1',
      originalUrl: 'https://example.com/image1.jpg',
      optimizedUrl: 'https://example.com/image1-optimized.jpg',
      isPrimary: true,
    },
  ],
  brand: {
    id: 'brand-1',
    name: 'Test Brand',
    slug: 'test-brand',
  },
} as any;

describe('AddToComparisonModal', () => {
  const mockOnAdded = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('should not render when isOpen is false', () => {
      render(
        <AddToComparisonModal
          product={mockProduct}
          isOpen={false}
          onClose={mockOnClose}
          onAdded={mockOnAdded}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('should render when isOpen is true', () => {
      render(
        <AddToComparisonModal
          product={mockProduct}
          isOpen={true}
          onClose={mockOnClose}
          onAdded={mockOnAdded}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Add to Comparison')).toBeInTheDocument();
    });

    test('should display product information', () => {
      render(
        <AddToComparisonModal
          product={mockProduct}
          isOpen={true}
          onClose={mockOnClose}
          onAdded={mockOnAdded}
        />
      );

      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('৳900')).toBeInTheDocument();
    });

    test('should display product image', () => {
      render(
        <AddToComparisonModal
          product={mockProduct}
          isOpen={true}
          onClose={mockOnClose}
          onAdded={mockOnAdded}
        />
      );

      const productImage = screen.getByAltText('Test Product');
      expect(productImage).toBeInTheDocument();
    });

    test('should display placeholder when no images', () => {
      const productWithoutImages = {
        ...mockProduct,
        images: [],
      };

      render(
        <AddToComparisonModal
          product={productWithoutImages}
          isOpen={true}
          onClose={mockOnClose}
          onAdded={mockOnAdded}
        />
      );

      // Check for placeholder SVG icon
      const placeholderIcon = screen.queryByRole('img', { hidden: true });
      expect(placeholderIcon).toBeInTheDocument();
    });
  });

  describe('Comparison Fetching', () => {
    test('should fetch comparisons when modal opens', async () => {
      const mockComparisons = [
        {
          id: 'comparison-1',
          name: 'Comparison 1',
          itemCount: 2,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'comparison-2',
          name: 'Comparison 2',
          itemCount: 3,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.mocked(comparisonsApi).getComparisons.mockResolvedValue({
        comparisons: mockComparisons,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          pages: 1,
        },
      });

      render(
        <AddToComparisonModal
          product={mockProduct}
          isOpen={true}
          onClose={mockOnClose}
          onAdded={mockOnAdded}
        />
      );

      await waitFor(() => {
        expect(jest.mocked(comparisonsApi).getComparisons).toHaveBeenCalledWith({
          status: 'active',
          limit: 20,
        });
      });

      expect(screen.getByText('Comparison 1')).toBeInTheDocument();
      expect(screen.getByText('Comparison 2')).toBeInTheDocument();
    });

    test('should show loading state while fetching', async () => {
      jest.mocked(comparisonsApi).getComparisons.mockImplementation(
        () => new Promise(() => {})
      );

      render(
        <AddToComparisonModal
          product={mockProduct}
          isOpen={true}
          onClose={mockOnClose}
          onAdded={mockOnAdded}
        />
      );

      expect(screen.getByText('Loading comparisons...')).toBeInTheDocument();
    });

    test('should show error message on fetch failure', async () => {
      jest.mocked(comparisonsApi).getComparisons.mockRejectedValue(
        new Error('Failed to fetch comparisons')
      );

      render(
        <AddToComparisonModal
          product={mockProduct}
          isOpen={true}
          onClose={mockOnClose}
          onAdded={mockOnAdded}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load comparisons')).toBeInTheDocument();
      });
    });

    test('should show no comparisons message', async () => {
      jest.mocked(comparisonsApi).getComparisons.mockResolvedValue({
        comparisons: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
      });

      render(
        <AddToComparisonModal
          product={mockProduct}
          isOpen={true}
          onClose={mockOnClose}
          onAdded={mockOnAdded}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('No comparisons yet')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    test('should filter comparisons by search query', async () => {
      const mockComparisons = [
        {
          id: 'comparison-1',
          name: 'Smartphones',
          itemCount: 2,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'comparison-2',
          name: 'Laptops',
          itemCount: 3,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.mocked(comparisonsApi).getComparisons.mockResolvedValue({
        comparisons: mockComparisons,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          pages: 1,
        },
      });

      render(
        <AddToComparisonModal
          product={mockProduct}
          isOpen={true}
          onClose={mockOnClose}
          onAdded={mockOnAdded}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Smartphones')).toBeInTheDocument();
        expect(screen.getByText('Laptops')).toBeInTheDocument();
      });

      // Search for "Smartphones"
      const searchInput = screen.getByPlaceholderText('Search comparisons...');
      fireEvent.change(searchInput, 'Smartphones');

      await waitFor(() => {
        expect(screen.getByText('Smartphones')).toBeInTheDocument();
        expect(screen.queryByText('Laptops')).not.toBeInTheDocument();
      });
    });

    test('should show no results message when search matches nothing', async () => {
      const mockComparisons = [
        {
          id: 'comparison-1',
          name: 'Smartphones',
          itemCount: 2,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.mocked(comparisonsApi).getComparisons.mockResolvedValue({
        comparisons: mockComparisons,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1,
        },
      });

      render(
        <AddToComparisonModal
          product={mockProduct}
          isOpen={true}
          onClose={mockOnClose}
          onAdded={mockOnAdded}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Smartphones')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search comparisons...');
      fireEvent.change(searchInput, 'NonExistent');

      await waitFor(() => {
        expect(screen.getByText('No comparisons found')).toBeInTheDocument();
      });
    });
  });

  describe('Create New Comparison', () => {
    test('should show create new comparison form', async () => {
      const mockComparisons = [
        {
          id: 'comparison-1',
          name: 'Comparison 1',
          itemCount: 2,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.mocked(comparisonsApi).getComparisons.mockResolvedValue({
        comparisons: mockComparisons,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1,
        },
      });

      render(
        <AddToComparisonModal
          product={mockProduct}
          isOpen={true}
          onClose={mockOnClose}
          onAdded={mockOnAdded}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Create New Comparison')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Create New Comparison'));

      expect(screen.getByPlaceholderText('e.g., Smartphones Comparison')).toBeInTheDocument();
      expect(screen.getByText('Note: This comparison will be created with current product included.')).toBeInTheDocument();
    });

    test('should create new comparison successfully', async () => {
      const mockComparisons = [
        {
          id: 'comparison-1',
          name: 'Comparison 1',
          itemCount: 2,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockNewComparison = {
        id: 'comparison-2',
        name: 'New Comparison',
        itemCount: 1,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.mocked(comparisonsApi).getComparisons.mockResolvedValue({
        comparisons: mockComparisons,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1,
        },
      });

      jest.mocked(comparisonsApi).createComparison.mockResolvedValue(mockNewComparison);

      render(
        <AddToComparisonModal
          product={mockProduct}
          isOpen={true}
          onClose={mockOnClose}
          onAdded={mockOnAdded}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Create New Comparison')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Create New Comparison'));

      const nameInput = screen.getByPlaceholderText('e.g., Smartphones Comparison');
      fireEvent.change(nameInput, 'New Comparison');

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(jest.mocked(comparisonsApi).createComparison).toHaveBeenCalledWith({
          name: 'New Comparison',
          productIds: ['product-1'],
        });
        expect(mockOnAdded).toHaveBeenCalledWith('comparison-2');
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    test('should show validation error when name is empty', async () => {
      const mockComparisons = [
        {
          id: 'comparison-1',
          name: 'Comparison 1',
          itemCount: 2,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.mocked(comparisonsApi).getComparisons.mockResolvedValue({
        comparisons: mockComparisons,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1,
        },
      });

      render(
        <AddToComparisonModal
          product={mockProduct}
          isOpen={true}
          onClose={mockOnClose}
          onAdded={mockOnAdded}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Create New Comparison')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Create New Comparison'));

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a comparison name')).toBeInTheDocument();
      });
    });

    test('should handle create comparison error', async () => {
      const mockComparisons = [
        {
          id: 'comparison-1',
          name: 'Comparison 1',
          itemCount: 2,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.mocked(comparisonsApi).getComparisons.mockResolvedValue({
        comparisons: mockComparisons,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1,
        },
      });

      jest.mocked(comparisonsApi).createComparison.mockRejectedValue(
        new Error('Failed to create comparison')
      );

      render(
        <AddToComparisonModal
          product={mockProduct}
          isOpen={true}
          onClose={mockOnClose}
          onAdded={mockOnAdded}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Create New Comparison')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Create New Comparison'));

      const nameInput = screen.getByPlaceholderText('e.g., Smartphones Comparison');
      fireEvent.change(nameInput, 'New Comparison');

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to create comparison')).toBeInTheDocument();
      });
    });
  });

  describe('Add to Existing Comparison', () => {
    test('should add product to existing comparison', async () => {
      const mockComparisons = [
        {
          id: 'comparison-1',
          name: 'Comparison 1',
          itemCount: 2,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockUpdatedComparison = {
        ...mockComparisons[0],
        itemCount: 3,
      };

      jest.mocked(comparisonsApi).getComparisons.mockResolvedValue({
        comparisons: mockComparisons,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1,
        },
      });

      jest.mocked(comparisonsApi).addProductToComparison.mockResolvedValue(mockUpdatedComparison);

      render(
        <AddToComparisonModal
          product={mockProduct}
          isOpen={true}
          onClose={mockOnClose}
          onAdded={mockOnAdded}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Comparison 1')).toBeInTheDocument();
      });

      const comparisonButton = screen.getByText('Comparison 1');
      fireEvent.click(comparisonButton);

      await waitFor(() => {
        expect(jest.mocked(comparisonsApi).addProductToComparison).toHaveBeenCalledWith('comparison-1', {
          productId: 'product-1',
        });
        expect(mockOnAdded).toHaveBeenCalledWith('comparison-1');
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    test('should handle add to comparison error', async () => {
      const mockComparisons = [
        {
          id: 'comparison-1',
          name: 'Comparison 1',
          itemCount: 2,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.mocked(comparisonsApi).getComparisons.mockResolvedValue({
        comparisons: mockComparisons,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1,
        },
      });

      jest.mocked(comparisonsApi).addProductToComparison.mockRejectedValue(
        new Error('Failed to add product to comparison')
      );

      render(
        <AddToComparisonModal
          product={mockProduct}
          isOpen={true}
          onClose={mockOnClose}
          onAdded={mockOnAdded}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Comparison 1')).toBeInTheDocument();
      });

      const comparisonButton = screen.getByText('Comparison 1');
      fireEvent.click(comparisonButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to add product to comparison')).toBeInTheDocument();
      });
    });
  });

  describe('Modal Closing', () => {
    test('should close modal when close button is clicked', () => {
      render(
        <AddToComparisonModal
          product={mockProduct}
          isOpen={true}
          onClose={mockOnClose}
          onAdded={mockOnAdded}
        />
      );

      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('should close modal when backdrop is clicked', () => {
      render(
        <AddToComparisonModal
          product={mockProduct}
          isOpen={true}
          onClose={mockOnClose}
          onAdded={mockOnAdded}
        />
      );

      const backdrop = screen.getByRole('dialog').parentElement;
      fireEvent.click(backdrop);

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('should reset state when modal closes', () => {
      const { rerender } = render(
        <AddToComparisonModal
          product={mockProduct}
          isOpen={true}
          onClose={mockOnClose}
          onAdded={mockOnAdded}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search comparisons...');
      fireEvent.change(searchInput, 'Test Search');

      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);

      rerender(
        <AddToComparisonModal
          product={mockProduct}
          isOpen={false}
          onClose={mockOnClose}
          onAdded={mockOnAdded}
        />
      );

      // Modal should be closed
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA attributes', () => {
      render(
        <AddToComparisonModal
          product={mockProduct}
          isOpen={true}
          onClose={mockOnClose}
          onAdded={mockOnAdded}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    test('should have proper labels on interactive elements', () => {
      render(
        <AddToComparisonModal
          product={mockProduct}
          isOpen={true}
          onClose={mockOnClose}
          onAdded={mockOnAdded}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search comparisons...');
      expect(searchInput).toHaveAttribute('aria-label', 'Search comparisons');

      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toHaveAttribute('aria-label', 'Close modal');
    });
  });
});
