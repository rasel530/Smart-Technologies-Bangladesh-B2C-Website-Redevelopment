/**
 * Unit tests for BulkImageOperations component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BulkImageOperations } from '../BulkImageOperations';
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
    fileSizeBytes: 1024 * 1024,
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
    altTextBn: 'পণডাক্ট ইমেজ',
    altTextEn: 'Product image 2',
    displayOrder: 1,
    isPrimary: false,
    fileSizeBytes: 512 * 1024,
    mimeType: 'image/png',
    width: 800,
    height: 800,
    processingStatus: 'completed',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

describe('BulkImageOperations', () => {
  it('renders bulk operations component', () => {
    const onUpdate = jest.fn();
    const onSelectionChange = jest.fn();
    
    render(
      <BulkImageOperations
        productId="prod-1"
        images={mockImages}
        selectedImages={new Set()}
        onUpdate={onUpdate}
        onSelectionChange={onSelectionChange}
      />
    );
    
    expect(screen.getByText('Bulk Operations')).toBeInTheDocument();
  });

  it('displays selected images count', () => {
    const onUpdate = jest.fn();
    const onSelectionChange = jest.fn();
    
    render(
      <BulkImageOperations
        productId="prod-1"
        images={mockImages}
        selectedImages={new Set(['1', '2'])}
        onUpdate={onUpdate}
        onSelectionChange={onSelectionChange}
      />
    );
    
    expect(screen.getByText('2 images selected')).toBeInTheDocument();
  });

  it('calls select all when button is clicked', () => {
    const onUpdate = jest.fn();
    const onSelectionChange = jest.fn();
    
    render(
      <BulkImageOperations
        productId="prod-1"
        images={mockImages}
        selectedImages={new Set()}
        onUpdate={onUpdate}
        onSelectionChange={onSelectionChange}
      />
    );
    
    const selectAllButton = screen.getByText('Select All');
    fireEvent.click(selectAllButton);
    
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['1', '2']));
  });

  it('calls deselect all when button is clicked', () => {
    const onUpdate = jest.fn();
    const onSelectionChange = jest.fn();
    
    render(
      <BulkImageOperations
        productId="prod-1"
        images={mockImages}
        selectedImages={new Set(['1', '2'])}
        onUpdate={onUpdate}
        onSelectionChange={onSelectionChange}
      />
    );
    
    const deselectAllButton = screen.getByText('Deselect All');
    fireEvent.click(deselectAllButton);
    
    expect(onSelectionChange).toHaveBeenCalledWith(new Set());
  });

  it('shows delete confirmation modal when delete button is clicked', () => {
    const onUpdate = jest.fn();
    const onSelectionChange = jest.fn();
    
    render(
      <BulkImageOperations
        productId="prod-1"
        images={mockImages}
        selectedImages={new Set(['1'])}
        onUpdate={onUpdate}
        onSelectionChange={onSelectionChange}
      />
    );
    
    const deleteButton = screen.getByText('Delete Selected');
    fireEvent.click(deleteButton);
    
    expect(screen.getByText(/Delete.*Image\?/)).toBeInTheDocument();
  });

  it('shows alt text update modal when update button is clicked', () => {
    const onUpdate = jest.fn();
    const onSelectionChange = jest.fn();
    
    render(
      <BulkImageOperations
        productId="prod-1"
        images={mockImages}
        selectedImages={new Set(['1', '2'])}
        onUpdate={onUpdate}
        onSelectionChange={onSelectionChange}
      />
    );
    
    const updateButton = screen.getByText('Update Alt Text');
    fireEvent.click(updateButton);
    
    expect(screen.getByText(/Update Alt Text for.*Image/)).toBeInTheDocument();
  });
});
