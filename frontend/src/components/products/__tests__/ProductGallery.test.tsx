/**
 * Unit Tests for ProductGallery Component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductGallery from '../ProductGallery';
import { ProductImage } from '@/types/product-image';

// Mock product image data
const mockProductImages: ProductImage[] = [
  {
    id: '1',
    productId: 'product-1',
    originalUrl: '/images/test1.jpg',
    optimizedUrl: '/images/test1_opt.jpg',
    thumbnailUrl: '/images/test1_thumb.jpg',
    altTextBn: 'পরীক্ষ পণড',
    altTextEn: 'Test product image 1',
    displayOrder: 0,
    isPrimary: true,
    fileSizeBytes: 1024000,
    mimeType: 'image/jpeg',
    width: 800,
    height: 800,
    processingStatus: 'completed',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    productId: 'product-1',
    originalUrl: '/images/test2.jpg',
    optimizedUrl: '/images/test2_opt.jpg',
    thumbnailUrl: '/images/test2_thumb.jpg',
    altTextBn: 'পরীক্ষ পণড',
    altTextEn: 'Test product image 2',
    displayOrder: 1,
    isPrimary: false,
    fileSizeBytes: 1024000,
    mimeType: 'image/jpeg',
    width: 800,
    height: 800,
    processingStatus: 'completed',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    productId: 'product-1',
    originalUrl: '/images/test3.jpg',
    optimizedUrl: '/images/test3_opt.jpg',
    thumbnailUrl: '/images/test3_thumb.jpg',
    altTextBn: 'পরীক্ষ পণড',
    altTextEn: 'Test product image 3',
    displayOrder: 2,
    isPrimary: false,
    fileSizeBytes: 1024000,
    mimeType: 'image/jpeg',
    width: 800,
    height: 800,
    processingStatus: 'completed',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

describe('ProductGallery Component', () => {
  const mockProductName = 'Test Product';
  const mockOnImageSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders main image', () => {
    render(
      <ProductGallery
        images={mockProductImages}
        productName={mockProductName}
        onImageSelect={mockOnImageSelect}
      />
    );

    const mainImage = screen.getByRole('img');
    expect(mainImage).toBeInTheDocument();
    expect(mainImage).toHaveAttribute('src', mockProductImages[0].originalUrl);
  });

  test('renders thumbnails when multiple images', () => {
    render(
      <ProductGallery
        images={mockProductImages}
        productName={mockProductName}
        onImageSelect={mockOnImageSelect}
      />
    );

    const thumbnails = screen.getAllByRole('button', { name: /View image/i });
    expect(thumbnails).toHaveLength(mockProductImages.length);
  });

  test('shows image counter', () => {
    render(
      <ProductGallery
        images={mockProductImages}
        productName={mockProductName}
        onImageSelect={mockOnImageSelect}
      />
    );

    const counter = screen.getByText(/1 \/ 3/);
    expect(counter).toBeInTheDocument();
  });

  test('navigates to next image on arrow right', () => {
    render(
      <ProductGallery
        images={mockProductImages}
        productName={mockProductName}
        onImageSelect={mockOnImageSelect}
      />
    );

    const nextButton = screen.getByLabelText('Next image');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(mockOnImageSelect).toHaveBeenCalledWith(mockProductImages[1]);
    });
  });

  test('navigates to previous image on arrow left', () => {
    render(
      <ProductGallery
        images={mockProductImages}
        productName={mockProductName}
        onImageSelect={mockOnImageSelect}
      />
    );

    const prevButton = screen.getByLabelText('Previous image');
    fireEvent.click(prevButton);

    await waitFor(() => {
      expect(mockOnImageSelect).toHaveBeenCalledWith(mockProductImages[0]);
    });
  });

  test('opens lightbox on main image click', () => {
    render(
      <ProductGallery
        images={mockProductImages}
        productName={mockProductName}
        onImageSelect={mockOnImageSelect}
      />
    );

    const mainImage = screen.getByRole('img');
    fireEvent.click(mainImage);

    await waitFor(() => {
      const lightbox = screen.getByRole('dialog');
      expect(lightbox).toBeInTheDocument();
    });
  });

  test('closes lightbox on escape key', () => {
    render(
      <ProductGallery
        images={mockProductImages}
        productName={mockProductName}
        onImageSelect={mockOnImageSelect}
      />
    );

    // Open lightbox first
    const mainImage = screen.getByRole('img');
    fireEvent.click(mainImage);

    await waitFor(() => {
      const lightbox = screen.getByRole('dialog');
      expect(lightbox).toBeInTheDocument();
    });

    // Press escape
    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      const lightbox = screen.queryByRole('dialog');
      expect(lightbox).not.toBeInTheDocument();
    });
  });

  test('displays placeholder when no images', () => {
    render(
      <ProductGallery
        images={[]}
        productName={mockProductName}
        onImageSelect={mockOnImageSelect}
      />
    );

    const placeholder = screen.getByRole('img');
    expect(placeholder).toHaveAttribute('src', '/images/placeholder-product.jpg');
  });
});
