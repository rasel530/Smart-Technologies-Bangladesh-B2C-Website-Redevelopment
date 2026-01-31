/**
 * Unit tests for ImageStorageQuota component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageStorageQuota } from '../ImageStorageQuota';
import { ProductImage } from '@/types/product-image';

// Mock product images
const mockImages: ProductImage[] = [
  {
    id: '1',
    productId: 'prod-1',
    originalUrl: 'https://example.com/image1.jpg',
    optimizedUrl: 'https://example.com/image1_opt.jpg',
    thumbnailUrl: 'https://example.com/image1_thumb.jpg',
    altTextBn: 'পণডাক্ট ইমেজ',
    altTextEn: 'Product image',
    displayOrder: 0,
    isPrimary: true,
    fileSizeBytes: 1024 * 1024, // 1MB
    mimeType: 'image/jpeg',
    width: 1200,
    height: 1200,
    processingStatus: 'completed',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    productId: 'prod-1',
    originalUrl: 'https://example.com/image2.jpg',
    optimizedUrl: 'https://example.com/image2_opt.jpg',
    thumbnailUrl: 'https://example.com/image2_thumb.jpg',
    altTextBn: 'পণডাক্ট ইমেজ ২',
    altTextEn: 'Product image 2',
    displayOrder: 1,
    isPrimary: false,
    fileSizeBytes: 2 * 1024 * 1024, // 2MB
    mimeType: 'image/png',
    width: 800,
    height: 800,
    processingStatus: 'completed',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

describe('ImageStorageQuota', () => {
  it('renders storage quota component', () => {
    render(<ImageStorageQuota images={mockImages} productId="prod-1" />);
    
    expect(screen.getByText('Storage Quota')).toBeInTheDocument();
  });

  it('displays total images count', () => {
    render(<ImageStorageQuota images={mockImages} productId="prod-1" />);
    
    expect(screen.getByText('Total Images')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('displays average image size', () => {
    render(<ImageStorageQuota images={mockImages} productId="prod-1" />);
    
    expect(screen.getByText('Average Size')).toBeInTheDocument();
  });

  it('shows warning when approaching quota limit', () => {
    const largeImages = Array(10).fill(null).map((_, i) => ({
      ...mockImages[0],
      id: String(i),
      fileSizeBytes: 5 * 1024 * 1024 // 5MB each
    }));

    render(<ImageStorageQuota images={largeImages} productId="prod-1" />);
    
    expect(screen.getByText(/Approaching storage quota limit/i)).toBeInTheDocument();
  });

  it('shows alert when quota exceeded', () => {
    const largeImages = Array(15).fill(null).map((_, i) => ({
      ...mockImages[0],
      id: String(i),
      fileSizeBytes: 4 * 1024 * 1024 // 4MB each, total 60MB > 50MB
    }));

    render(<ImageStorageQuota images={largeImages} productId="prod-1" />);
    
    expect(screen.getByText(/Storage quota exceeded/i)).toBeInTheDocument();
  });

  it('displays image size breakdown', () => {
    render(<ImageStorageQuota images={mockImages} productId="prod-1" />);
    
    expect(screen.getByText('Image Size Breakdown')).toBeInTheDocument();
  });

  it('calls onOptimize when button is clicked', () => {
    const onOptimize = jest.fn();
    render(<ImageStorageQuota images={mockImages} productId="prod-1" onOptimize={onOptimize} />);
    
    const optimizeButton = screen.getByText('Optimize Images');
    fireEvent.click(optimizeButton);
    
    expect(onOptimize).toHaveBeenCalledTimes(1);
  });
});
