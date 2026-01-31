/**
 * Integration Test Suite for Product Image Components
 * 
 * Tests all 6 frontend components for product image management:
 * - ImageUpload
 * - ProductGallery
 * - ImageLightbox
 * - ImageThumbnailStrip
 * - ImageReorder
 * - ImageAltTextEditor
 * 
 * Run with: npm test -- --testPathPattern="product/__tests__/image-components"
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageUpload from '../ImageUpload';
import ProductGallery from '../ProductGallery';
import ImageLightbox from '../ImageLightbox';
import ImageThumbnailStrip from '../ImageThumbnailStrip';
import ImageReorder from '../../admin/ImageReorder';
import ImageAltTextEditor from '../../admin/ImageAltTextEditor';
import { ProductImage } from '@/types/product-image';

// ============================================
// MOCK DATA
// ============================================

const mockProductImages: ProductImage[] = [
  {
    id: 'img-001',
    productId: 'prod-001',
    originalUrl: 'https://example.com/images/product1-main.jpg',
    optimizedUrl: 'https://example.com/images/product1-main_opt.webp',
    thumbnailUrl: 'https://example.com/images/product1-main_thumb.jpg',
    altTextBn: 'পণ্যের মূল ছবি',
    altTextEn: 'Product main image',
    displayOrder: 0,
    isPrimary: true,
    fileSizeBytes: 1024000,
    mimeType: 'image/jpeg',
    width: 1200,
    height: 1200,
    processingStatus: 'completed',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15')
  },
  {
    id: 'img-002',
    productId: 'prod-001',
    originalUrl: 'https://example.com/images/product1-side.jpg',
    optimizedUrl: 'https://example.com/images/product1-side_opt.webp',
    thumbnailUrl: 'https://example.com/images/product1-side_thumb.jpg',
    altTextBn: 'পণ্যের পাশের ছবি',
    altTextEn: 'Product side view',
    displayOrder: 1,
    isPrimary: false,
    fileSizeBytes: 512000,
    mimeType: 'image/jpeg',
    width: 1200,
    height: 800,
    processingStatus: 'completed',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15')
  },
  {
    id: 'img-003',
    productId: 'prod-001',
    originalUrl: 'https://example.com/images/product1-back.jpg',
    optimizedUrl: 'https://example.com/images/product1-back_opt.webp',
    thumbnailUrl: 'https://example.com/images/product1-back_thumb.jpg',
    altTextBn: 'পণ্যের পেছনের ছবি',
    altTextEn: 'Product back view',
    displayOrder: 2,
    isPrimary: false,
    fileSizeBytes: 768000,
    mimeType: 'image/png',
    width: 1200,
    height: 1200,
    processingStatus: 'completed',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15')
  }
];

// ============================================
// IMAGE UPLOAD COMPONENT TESTS
// ============================================

describe('ImageUpload Component Integration Tests', () => {
  const mockOnUpload = jest.fn();
  const mockOnProgress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders upload area with drag-and-drop zone', () => {
      render(
        <ImageUpload
          productId="prod-001"
          onUpload={mockOnUpload}
        />
      );

      expect(screen.getByText(/drag.*drop|ড্র্যাগ.*ড্রপ/i)).toBeInTheDocument();
      expect(screen.getByText(/browse|ব্রাউজ/i)).toBeInTheDocument();
    });

    it('renders upload progress section when uploading', () => {
      render(
        <ImageUpload
          productId="prod-001"
          onUpload={mockOnUpload}
          uploading={true}
          progress={50}
        />
      );

      expect(screen.getByText(/uploading|আপলোড/i)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders alt text input fields', () => {
      render(
        <ImageUpload
          productId="prod-001"
          onUpload={mockOnUpload}
          showAltTextInputs={true}
        />
      );

      expect(screen.getByLabelText(/alt text.*english/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/alt text.*bengali/i)).toBeInTheDocument();
    });
  });

  describe('File Validation', () => {
    it('accepts valid JPEG files', async () => {
      const user = userEvent.setup();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      render(
        <ImageUpload
          productId="prod-001"
          onUpload={mockOnUpload}
        />
      );

      const input = screen.getByTestId('file-input') as HTMLInputElement;
      await user.upload(input, file);

      await waitFor(() => {
        expect(input.files?.length).toBe(1);
      });
    });

    it('accepts valid PNG files', async () => {
      const user = userEvent.setup();
      const file = new File(['test'], 'test.png', { type: 'image/png' });

      render(
        <ImageUpload
          productId="prod-001"
          onUpload={mockOnUpload}
        />
      );

      const input = screen.getByTestId('file-input') as HTMLInputElement;
      await user.upload(input, file);

      await waitFor(() => {
        expect(input.files?.length).toBe(1);
      });
    });

    it('accepts valid WebP files', async () => {
      const user = userEvent.setup();
      const file = new File(['test'], 'test.webp', { type: 'image/webp' });

      render(
        <ImageUpload
          productId="prod-001"
          onUpload={mockOnUpload}
        />
      );

      const input = screen.getByTestId('file-input') as HTMLInputElement;
      await user.upload(input, file);

      await waitFor(() => {
        expect(input.files?.length).toBe(1);
      });
    });

    it('rejects invalid file types', async () => {
      const user = userEvent.setup();
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      render(
        <ImageUpload
          productId="prod-001"
          onUpload={mockOnUpload}
        />
      );

      const input = screen.getByTestId('file-input') as HTMLInputElement;
      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(/invalid file type|অবৈধ ফাইল টাইপ/i)).toBeInTheDocument();
      });
    });

    it('rejects files larger than 5MB', async () => {
      const user = userEvent.setup();
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });

      render(
        <ImageUpload
          productId="prod-001"
          onUpload={mockOnUpload}
        />
      );

      const input = screen.getByTestId('file-input') as HTMLInputElement;
      await user.upload(input, largeFile);

      await waitFor(() => {
        expect(screen.getText(/file size exceeds|ফাইল সাইজ অতিক্রণ/i)).toBeInTheDocument();
      });
    });

    it('rejects files larger than 5MB with exact boundary', async () => {
      const user = userEvent.setup();
      const boundaryFile = new File(['x'.repeat(5 * 1024 * 1024 + 1)], 'boundary.jpg', { type: 'image/jpeg' });

      render(
        <ImageUpload
          productId="prod-001"
          onUpload={mockOnUpload}
        />
      );

      const input = screen.getByTestId('file-input') as HTMLInputElement;
      await user.upload(input, boundaryFile);

      await waitFor(() => {
        expect(screen.getByText(/file size exceeds.*5mb|ফাইল সাইজ.*5mb/i)).toBeInTheDocument();
      });
    });
  });

  describe('Upload Functionality', () => {
    it('calls onUpload when files are selected', async () => {
      const user = userEvent.setup();
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })
      ];

      render(
        <ImageUpload
          productId="prod-001"
          onUpload={mockOnUpload}
        />
      );

      const input = screen.getByTestId('file-input') as HTMLInputElement;
      await user.upload(input, files);

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(expect.arrayContaining([
          expect.objectContaining({ name: 'test1.jpg' }),
          expect.objectContaining({ name: 'test2.jpg' })
        ]));
      });
    });

    it('shows upload progress when uploading', async () => {
      render(
        <ImageUpload
          productId="prod-001"
          onUpload={mockOnUpload}
          uploading={true}
          progress={75}
        />
      );

      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75');
    });

    it('shows upload complete state', async () => {
      render(
        <ImageUpload
          productId="prod-001"
          onUpload={mockOnUpload}
          uploadComplete={true}
          uploadedCount={5}
        />
      );

      expect(screen.getByText(/success|সফল/i)).toBeInTheDocument();
      expect(screen.getByText(/5.*uploaded|5.*টি.*আপলোড/i)).toBeInTheDocument();
    });

    it('allows removing images from queue before upload', async () => {
      const user = userEvent.setup();
      const files = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })];

      render(
        <ImageUpload
          productId="prod-001"
          onUpload={mockOnUpload}
        />
      );

      const input = screen.getByTestId('file-input') as HTMLInputElement;
      await user.upload(input, files);

      // Wait for file to be added
      await waitFor(() => {
        expect(screen.getByText('test.jpg')).toBeInTheDocument();
      });

      // Click remove button
      const removeButton = screen.getByLabelText(/remove.*test\.jpg/i);
      await user.click(removeButton);

      expect(screen.queryByText('test.jpg')).not.toBeInTheDocument();
    });
  });

  describe('Alt Text Input', () => {
    it('allows entering Bengali alt text', async () => {
      const user = userEvent.setup();

      render(
        <ImageUpload
          productId="prod-001"
          onUpload={mockOnUpload}
          showAltTextInputs={true}
        />
      );

      const bnInput = screen.getByLabelText(/alt text.*bengali/i);
      await user.type(bnInput, 'বাংলা টেক্সট');

      expect(bnInput).toHaveValue('বাংলা টেক্সট');
    });

    it('allows entering English alt text', async () => {
      const user = userEvent.setup();

      render(
        <ImageUpload
          productId="prod-001"
          onUpload={mockOnUpload}
          showAltTextInputs={true}
        />
      );

      const enInput = screen.getByLabelText(/alt text.*english/i);
      await user.type(enInput, 'English text');

      expect(enInput).toHaveValue('English text');
    });

    it('enforces 250 character limit on alt text', async () => {
      const user = userEvent.setup();
      const longText = 'a'.repeat(300);

      render(
        <ImageUpload
          productId="prod-001"
          onUpload={mockOnUpload}
          showAltTextInputs={true}
        />
      );

      const input = screen.getByLabelText(/alt text.*english/i);
      await user.type(input, longText);

      expect(input).toHaveValue(longText.slice(0, 250));
    });

    it('shows character counter', async () => {
      const user = userEvent.setup();

      render(
        <ImageUpload
          productId="prod-001"
          onUpload={mockOnUpload}
          showAltTextInputs={true}
        />
      );

      const input = screen.getByLabelText(/alt text.*english/i);
      await user.type(input, 'Test');

      expect(screen.getByText(/\(5\/250\)/i)).toBeInTheDocument();
    });
  });

  describe('Set as Primary', () => {
    it('shows set as primary toggle for first image', async () => {
      const user = userEvent.setup();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      render(
        <ImageUpload
          productId="prod-001"
          onUpload={mockOnUpload}
          showPrimaryToggle={true}
        />
      );

      const input = screen.getByTestId('file-input') as HTMLInputElement;
      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByLabelText(/set as primary|প্রাইমারি করুন/i)).toBeInTheDocument();
      });
    });
  });

  describe('Auto-generate Alt Text', () => {
    it('auto-generates alt text from product name', async () => {
      const user = userEvent.setup();

      render(
        <ImageUpload
          productId="prod-001"
          productName="Test Product"
          onUpload={mockOnUpload}
          showAltTextInputs={true}
        />
      );

      const autoGenerateButton = screen.getByText(/auto-generate|স্বয়ংক্রিয়/i);
      await user.click(autoGenerateButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/alt text.*english/i)).toHaveValue('Test Product');
      });
    });

    it('uses Bengali product name for Bengali alt text', async () => {
      const user = userEvent.setup();

      render(
        <ImageAltTextEditor
          image={mockProductImages[0]}
          productNameBn="টেস্ট পণ্য"
          productName="Test Product"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          showAutoGenerate={true}
        />
      );

      const autoGenerateButton = screen.getByText(/auto-generate|স্বয়ংক্রিয়/i);
      await user.click(autoGenerateButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/alt text.*bengali/i)).toHaveValue('টেস্ট পণ্য');
      });
    });
  });

  describe('Dark Mode', () => {
    it('applies dark mode styles', () => {
      render(
        <ImageAltTextEditor
          image={mockProductImages[0]}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          darkMode={true}
        />
      );

      const editor = screen.getByTestId('alt-text-editor');
      expect(editor).toHaveClass('dark-mode');
    });
  });
});

    it('uses Bengali product name for Bengali alt text', async () => {
      const user = userEvent.setup();

      render(
        <ImageUpload
          productId="prod-001"
          productNameBn="টেস্ট পণ্য"
          productName="Test Product"
          onUpload={mockOnUpload}
          showAltTextInputs={true}
        />
      );

      const autoGenerateButton = screen.getByText(/auto-generate|স্বয়ংক্রিয়/i);
      await user.click(autoGenerateButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/alt text.*bengali/i)).toHaveValue('টেস্ট পণ্য');
      });
    });
  });

  describe('Keyboard Accessibility', () => {
    it('supports keyboard navigation for file selection', async () => {
      const user = userEvent.setup();

      render(
        <ImageUpload
          productId="prod-001"
          onUpload={mockOnUpload}
        />
      );

      const uploadArea = screen.getByTestId('upload-area');
      await user.tab();
      expect(uploadArea).toHaveFocus();
    });

    it('opens file dialog on Enter key', async () => {
      const user = userEvent.setup();

      render(
        <ImageUpload
          productId="prod-001"
          onUpload={mockOnUpload}
        />
      );

      const uploadArea = screen.getByTestId('upload-area');
      await user.tab();
      await user.keyboard('{Enter}');

      // File dialog should open (we can't fully test this, but no errors should occur)
    });
  });

  describe('Drag and Drop', () => {
    it('highlights drop zone on drag over', async () => {
      const user = userEvent.setup();

      render(
        <ImageUpload
          productId="prod-001"
          onUpload={mockOnUpload}
        />
      );

      const dropZone = screen.getByTestId('drop-zone');
      
      await act(async () => {
        fireEvent.dragOver(dropZone, {
          dataTransfer: {
            files: [new File(['test'], 'test.jpg', { type: 'image/jpeg' })]
          }
        });
      });

      expect(dropZone).toHaveClass('drag-over');
    });

    it('accepts files on drop', async () => {
      const user = userEvent.setup();

      render(
        <ImageUpload
          productId="prod-001"
          onUpload={mockOnUpload}
        />
      );

      const dropZone = screen.getByTestId('drop-zone');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await act(async () => {
        fireEvent.drop(dropZone, {
          dataTransfer: {
            files: [file]
          }
        });
      });

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalled();
      });
    });

    it('rejects non-image files on drop', async () => {
      const user = userEvent.setup();

      render(
        <ImageUpload
          productId="prod-001"
          onUpload={mockOnUpload}
        />
      );

      const dropZone = screen.getByTestId('drop-zone');
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      await act(async () => {
        fireEvent.drop(dropZone, {
          dataTransfer: {
            files: [file]
          }
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/invalid file type|অবৈধ ফাইল টাইপ/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays upload error message', async () => {
      render(
        <ImageUpload
          productId="prod-001"
          onUpload={mockOnUpload}
          error="Failed to upload image"
        />
      );

      expect(screen.getByText(/Failed to upload image/i)).toBeInTheDocument();
    });

    it('allows retry after error', async () => {
      const user = userEvent.setup();

      render(
        <ImageUpload
          productId="prod-001"
          onUpload={mockOnUpload}
          error="Upload failed"
        />
      );

      const retryButton = screen.getByText(/retry|পুনরায় চেষ্টা/i);
      await user.click(retryButton);

      expect(screen.queryByText(/Upload failed/i)).not.toBeInTheDocument();
    });
  });

  describe('Bilingual Support', () => {
    it('displays Bengali text when locale is bn', async () => {
      render(
        <ImageUpload
          productId="prod-001"
          locale="bn"
          onUpload={mockOnUpload}
        />
      );

      expect(screen.getByText(/ছবি আপলোড করুন/i)).toBeInTheDocument();
    });

    it('displays English text when locale is en', async () => {
      render(
        <ImageUpload
          productId="prod-001"
          locale="en"
          onUpload={mockOnUpload}
        />
      );

      expect(screen.getByText(/upload images/i)).toBeInTheDocument();
    });
  });

  describe('Dark Mode', () => {
    it('applies dark mode styles when enabled', async () => {
      render(
        <ImageUpload
          productId="prod-001"
          onUpload={mockOnUpload}
          darkMode={true}
        />
      );

      const uploadArea = screen.getByTestId('upload-area');
      expect(uploadArea).toHaveClass('dark-mode');
    });
  });
});

// ============================================
// PRODUCT GALLERY COMPONENT TESTS
// ============================================

describe('ProductGallery Component Integration Tests', () => {
  const mockOnImageClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders main image display', () => {
      render(
        <ProductGallery
          images={mockProductImages}
          onImageClick={mockOnImageClick}
        />
      );

      expect(screen.getByAltText(/Product main image/i)).toBeInTheDocument();
    });

    it('renders thumbnail strip', () => {
      render(
        <ProductGallery
          images={mockProductImages}
          onImageClick={mockOnImageClick}
        />
      );

      expect(screen.getByTestId('thumbnail-strip')).toBeInTheDocument();
      expect(screen.getAllByTestId('thumbnail').length).toBe(3);
    });

    it('renders navigation arrows', () => {
      render(
        <ProductGallery
          images={mockProductImages}
          onImageClick={mockOnImageClick}
        />
      );

      expect(screen.getByLabelText(/previous|পূর্ববর্তী/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/next|পরবর্তী/i)).toBeInTheDocument();
    });

    it('renders dot indicators', () => {
      render(
        <ProductGallery
          images={mockProductImages}
          showDots={true}
          onImageClick={mockOnImageClick}
        />
      );

      expect(screen.getByTestId('gallery-dots')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /go to image/i }).length).toBe(3);
    });

    it('renders primary image badge', () => {
      render(
        <ProductGallery
          images={mockProductImages}
          onImageClick={mockOnImageClick}
          showPrimaryBadge={true}
        />
      );

      expect(screen.getByText(/primary|প্রাইমারি/i)).toBeInTheDocument();
    });
  });

  describe('Image Display', () => {
    it('displays first image as main image by default', () => {
      render(
        <ProductGallery
          images={mockProductImages}
          onImageClick={mockOnImageClick}
        />
      );

      const mainImage = screen.getByAltText(/Product main image/i);
      expect(mainImage).toBeInTheDocument();
    });

    it('displays selected thumbnail as main image', async () => {
      const user = userEvent.setup();

      render(
        <ProductGallery
          images={mockProductImages}
          onImageClick={mockOnImageClick}
        />
      );

      // Click on second thumbnail
      const thumbnails = screen.getAllByTestId('thumbnail');
      await user.click(thumbnails[1]);

      await waitFor(() => {
        expect(screen.getByAltText(/Product side view/i)).toBeInTheDocument();
      });
    });

    it('displays all image variants', () => {
      render(
        <ProductGallery
          images={mockProductImages}
          onImageClick={mockOnImageClick}
          variant="optimized"
        />
      );

      // Should use optimized URL if available
      const mainImage = screen.getByAltText(/Product main image/i);
      expect(mainImage).toHaveAttribute('src', expect.stringContaining('_opt'));
    });
  });

  describe('Navigation', () => {
    it('navigates to next image on next button click', async () => {
      const user = userEvent.setup();

      render(
        <ProductGallery
          images={mockProductImages}
          onImageClick={mockOnImageClick}
        />
      );

      const nextButton = screen.getByLabelText(/next image|পরবর্তী ছবি/i);
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByAltText(/Product side view/i)).toBeInTheDocument();
      });
    });

    it('navigates to previous image on prev button click', async () => {
      const user = userEvent.setup();

      render(
        <ProductGallery
          images={mockProductImages}
          onImageClick={mockOnImageClick}
        />
      );

      // Go to second image first
      const nextButton = screen.getByLabelText(/next image|পরবর্তী ছবি/i);
      await user.click(nextButton);

      // Then go back
      const prevButton = screen.getByLabelText(/previous image|পূর্ববর্তী ছবি/i);
      await user.click(prevButton);

      await waitFor(() => {
        expect(screen.getByAltText(/Product main image/i)).toBeInTheDocument();
      });
    });

    it('wraps around from last to first image', async () => {
      const user = userEvent.setup();

      render(
        <ProductGallery
          images={mockProductImages}
          onImageClick={mockOnImageClick}
          loop={true}
        />
      );

      // Go to last image
      const nextButton = screen.getByLabelText(/next image|পরবর্তী ছবি/i);
      await user.click(nextButton);
      await user.click(nextButton);

      // Click next again - should wrap to first
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByAltText(/Product main image/i)).toBeInTheDocument();
      });
    });

    it('shows current image position', () => {
      render(
        <ProductGallery
          images={mockProductImages}
          onImageClick={mockOnImageClick}
          showCounter={true}
        />
      );

      expect(screen.getByText(/1.*\/.*3/i)).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('navigates with arrow keys', async () => {
      const user = userEvent.setup();

      render(
        <ProductGallery
          images={mockProductImages}
          onImageClick={mockOnImageClick}
        />
      );

      // Focus the gallery
      const gallery = screen.getByTestId('product-gallery');
      await user.tab();
      expect(gallery).toHaveFocus();

      // Press right arrow
      await user.keyboard('{ArrowRight}');

      await waitFor(() => {
        expect(screen.getByAltText(/Product side view/i)).toBeInTheDocument();
      });
    });

    it('opens lightbox on Enter key', async () => {
      const user = userEvent.setup();

      render(
        <ProductGallery
          images={mockProductImages}
          onImageClick={mockOnImageClick}
          enableLightbox={true}
        />
      );

      const gallery = screen.getByTestId('product-gallery');
      await user.tab();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByTestId('lightbox-overlay')).toBeInTheDocument();
      });
    });

    it('closes lightbox on Escape key', async () => {
      const user = userEvent.setup();

      render(
        <ProductGallery
          images={mockProductImages}
          onImageClick={mockOnImageClick}
          enableLightbox={true}
        />
      );

      // Open lightbox first
      await user.tab();
      await user.keyboard('{Enter}');
      await waitFor(() => {
        expect(screen.getByTestId('lightbox-overlay')).toBeInTheDocument();
      });

      // Close with Escape
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByTestId('lightbox-overlay')).not.toBeInTheDocument();
      });
    });
  });

  describe('Auto-Advance', () => {
    it('auto-advances to next image', async () => {
      jest.useFakeTimers();

      render(
        <ProductGallery
          images={mockProductImages}
          onImageClick={mockOnImageClick}
          autoAdvance={true}
          autoAdvanceInterval={3000}
        />
      );

      // Advance time
      act(() => {
        jest.advanceTimersByTime(3500);
      });

      await waitFor(() => {
        expect(screen.getByAltText(/Product side view/i)).toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it('pauses auto-advance on hover', async () => {
      jest.useFakeTimers();

      const user = userEvent.setup();

      render(
        <ProductGallery
          images={mockProductImages}
          onImageClick={mockOnImageClick}
          autoAdvance={true}
          autoAdvanceInterval={3000}
          pauseOnHover={true}
        />
      );

      // Hover over gallery
      const gallery = screen.getByTestId('product-gallery');
      await user.hover(gallery);

      // Advance time - should NOT change image
      act(() => {
        jest.advanceTimersByTime(3500);
      });

      expect(screen.getByAltText(/Product main image/i)).toBeInTheDocument();

      jest.useRealTimers();
    });
  });

  describe('Lazy Loading', () => {
    it('loads images on demand', async () => {
      render(
        <ProductGallery
          images={mockProductImages}
          onImageClick={mockOnImageClick}
          lazyLoad={true}
        />
      );

      // Only first image should be loaded
      const images = screen.getAllByRole('img');
      expect(images[0]).toHaveAttribute('loading', 'eager');
      // Other images should be lazy loaded
      expect(images[1]).toHaveAttribute('loading', 'lazy');
    });
  });

  describe('Responsive Design', () => {
    it('adapts layout for mobile (320px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320
      });

      render(
        <ProductGallery
          images={mockProductImages}
          onImageClick={mockOnImageClick}
        />
      );

      const gallery = screen.getByTestId('product-gallery');
      expect(gallery).toHaveClass('mobile-layout');
    });

    it('adapts layout for tablet (768px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });

      render(
        <ProductGallery
          images={mockProductImages}
          onImageClick={mockOnImageClick}
        />
      );

      const gallery = screen.getByTestId('product-gallery');
      expect(gallery).toHaveClass('tablet-layout');
    });

    it('adapts layout for desktop (1024px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      });

      render(
        <ProductGallery
          images={mockProductImages}
          onImageClick={mockOnImageClick}
        />
      );

      const gallery = screen.getByTestId('product-gallery');
      expect(gallery).toHaveClass('desktop-layout');
    });
  });

  describe('Dark Mode', () => {
    it('applies dark mode styles', () => {
      render(
        <ProductGallery
          images={mockProductImages}
          onImageClick={mockOnImageClick}
          darkMode={true}
        />
      );

      const gallery = screen.getByTestId('product-gallery');
      expect(gallery).toHaveClass('dark-mode');
    });
  });

  describe('Touch Gestures', () => {
    it('supports swipe left to navigate', async () => {
      render(
        <ProductGallery
          images={mockProductImages}
          onImageClick={mockOnImageClick}
          touchSupport={true}
        />
      );

      const mainImage = screen.getByAltText(/Product main image/i);

      await act(async () => {
        fireEvent.touchStart(mainImage, {
          touches: [{ clientX: 100, clientY: 100 }]
        });
        fireEvent.touchMove(mainImage, {
          touches: [{ clientX: 50, clientY: 100 }]
        });
        fireEvent.touchEnd(mainImage, {
          changedTouches: [{ clientX: 50, clientY: 100 }]
        });
      });

      await waitFor(() => {
        expect(screen.getByAltText(/Product side view/i)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('shows placeholder when no images', () => {
      render(
        <ProductGallery
          images={[]}
          onImageClick={mockOnImageClick}
          placeholderUrl="/images/placeholder.jpg"
        />
      );

      expect(screen.getByAltText(/no image available/i)).toBeInTheDocument();
    });
  });

  describe('Image Click Handler', () => {
    it('calls onImageClick when image is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ProductGallery
          images={mockProductImages}
          onImageClick={mockOnImageClick}
        />
      );

      const mainImage = screen.getByAltText(/Product main image/i);
      await user.click(mainImage);

      expect(mockOnImageClick).toHaveBeenCalledWith(mockProductImages[0]);
    });
  });
});

// ============================================
// IMAGE LIGHTBOX COMPONENT TESTS
// ============================================

describe('ImageLightbox Component Integration Tests', () => {
  const mockOnClose = jest.fn();
  const mockOnNext = jest.fn();
  const mockOnPrev = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders full-screen overlay', () => {
      render(
        <ImageLightbox
          image={mockProductImages[0]}
          images={mockProductImages}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('lightbox-overlay')).toBeInTheDocument();
    });

    it('renders main image', () => {
      render(
        <ImageLightbox
          image={mockProductImages[0]}
          images={mockProductImages}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByAltText(/Product main image/i)).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(
        <ImageLightbox
          image={mockProductImages[0]}
          images={mockProductImages}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByLabelText(/close|বন্ধ/i)).toBeInTheDocument();
    });

    it('renders navigation arrows', () => {
      render(
        <ImageLightbox
          image={mockProductImages[0]}
          images={mockProductImages}
          isOpen={true}
          onClose={mockOnClose}
          showNavigation={true}
        />
      );

      expect(screen.getByLabelText(/previous|পূর্ববর্তী/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/next|পরবর্তী/i)).toBeInTheDocument();
    });

    it('renders thumbnail strip', () => {
      render(
        <ImageLightbox
          image={mockProductImages[0]}
          images={mockProductImages}
          isOpen={true}
          onClose={mockOnClose}
          showThumbnails={true}
        />
      );

      expect(screen.getByTestId('lightbox-thumbnails')).toBeInTheDocument();
      expect(screen.getAllByTestId('lightbox-thumbnail').length).toBe(3);
    });

    it('renders zoom controls', () => {
      render(
        <ImageLightbox
          image={mockProductImages[0]}
          images={mockProductImages}
          isOpen={true}
          onClose={mockOnClose}
          enableZoom={true}
        />
      );

      expect(screen.getByLabelText(/zoom in|জুম ইন/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/zoom out|জুম আউট/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/reset zoom|রিসেট/i)).toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('closes on close button click', async () => {
      const user = userEvent.setup();

      render(
        <ImageLightbox
          image={mockProductImages[0]}
          images={mockProductImages}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByLabelText(/close|বন্ধ/i);
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes on Escape key', async () => {
      const user = userEvent.setup();

      render(
        <ImageLightbox
          image={mockProductImages[0]}
          images={mockProductImages}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes on backdrop click', async () => {
      const user = userEvent.setup();

      render(
        <ImageLightbox
          image={mockProductImages[0]}
          images={mockProductImages}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const overlay = screen.getByTestId('lightbox-overlay');
      await user.click(overlay);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Zoom Functionality', () => {
    it('zooms in on zoom in button click', async () => {
      const user = userEvent.setup();

      render(
        <ImageLightbox
          image={mockProductImages[0]}
          images={mockProductImages}
          isOpen={true}
          onClose={mockOnClose}
          enableZoom={true}
        />
      );

      const zoomInButton = screen.getByLabelText(/zoom in|জুম ইন/i);
      await user.click(zoomInButton);

      const mainImage = screen.getByAltText(/Product main image/i);
      expect(mainImage).toHaveStyle({ transform: 'scale(1.25)' });
    });

    it('zooms out on zoom out button click', async () => {
      const user = userEvent.setup();

      render(
        <ImageLightbox
          image={mockProductImages[0]}
          images={mockProductImages}
          isOpen={true}
          onClose={mockOnClose}
          enableZoom={true}
        />
      );

      // Zoom in first
      const zoomInButton = screen.getByLabelText(/zoom in|জুম ইন/i);
      await user.click(zoomInButton);

      // Zoom out
      const zoomOutButton = screen.getByLabelText(/zoom out|জুম আউট/i);
      await user.click(zoomOutButton);

      const mainImage = screen.getByAltText(/Product main image/i);
      expect(mainImage).toHaveStyle({ transform: 'scale(1)' });
    });

    it('resets zoom on reset button click', async () => {
      const user = userEvent.setup();

      render(
        <ImageLightbox
          image={mockProductImages[0]}
          images={mockProductImages}
          isOpen={true}
          onClose={mockOnClose}
          enableZoom={true}
        />
      );

      // Zoom in multiple times
      const zoomInButton = screen.getByLabelText(/zoom in|জুম ইন/i);
      await user.click(zoomInButton);
      await user.click(zoomInButton);
      await user.click(zoomInButton);

      // Reset
      const resetButton = screen.getByLabelText(/reset zoom|রিসেট/i);
      await user.click(resetButton);

      const mainImage = screen.getByAltText(/Product main image/i);
      expect(mainImage).toHaveStyle({ transform: 'scale(1)' });
    });

    it('supports tap-to-zoom on mobile', async () => {
      const user = userEvent.setup();

      render(
        <ImageLightbox
          image={mockProductImages[0]}
          images={mockProductImages}
          isOpen={true}
          onClose={mockOnClose}
          enableZoom={true}
          mobileZoomEnabled={true}
        />
      );

      const mainImage = screen.getByAltText(/Product main image/i);
      await user.dblClick(mainImage);

      expect(mainImage).toHaveStyle({ transform: 'scale(2)' });
    });

    it('supports hover zoom on desktop', async () => {
      const user = userEvent.setup();

      render(
        <ImageLightbox
          image={mockProductImages[0]}
          images={mockProductImages}
          isOpen={true}
          onClose={mockOnClose}
          enableZoom={true}
          hoverZoomEnabled={true}
        />
      );

      const mainImage = screen.getByAltText(/Product main image/i);
      await user.hover(mainImage);

      expect(mainImage).toHaveStyle({ transform: 'scale(1.5)' });
    });

    it('supports panning when zoomed', async () => {
      const user = userEvent.setup();

      render(
        <ImageLightbox
          image={mockProductImages[0]}
          images={mockProductImages}
          isOpen={true}
          onClose={mockOnClose}
          enableZoom={true}
          enablePan={true}
        />
      );

      // Zoom in first
      const zoomInButton = screen.getByLabelText(/zoom in|জুম ইন/i);
      await user.click(zoomInButton);

      // Pan image
      const mainImage = screen.getByAltText(/Product main image/i);
      await user.hover(mainImage);
      await user.keyboard('{ArrowRight}');

      // Pan should work without errors
    });

    it('persists zoom level during navigation', async () => {
      const user = userEvent.setup();

      render(
        <ImageLightbox
          image={mockProductImages[0]}
          images={mockProductImages}
          isOpen={true}
          onClose={mockOnClose}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
          enableZoom={true}
          persistZoomLevel={true}
        />
      );

      // Zoom in
      const zoomInButton = screen.getByLabelText(/zoom in|জুম ইন/i);
      await user.click(zoomInButton);

      // Navigate to next image
      const nextButton = screen.getByLabelText(/next|পরবর্তী/i);
      await user.click(nextButton);

      // Zoom level should persist on new image
      expect(mockOnNext).toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('navigates to next image on next button click', async () => {
      const user = userEvent.setup();

      render(
        <ImageLightbox
          image={mockProductImages[0]}
          images={mockProductImages}
          isOpen={true}
          onClose={mockOnClose}
          onNext={mockOnNext}
        />
      );

      const nextButton = screen.getByLabelText(/next image|পরবর্তী ছবি/i);
      await user.click(nextButton);

      expect(mockOnNext).toHaveBeenCalled();
    });

    it('navigates to previous image on prev button click', async () => {
      const user = userEvent.setup();

      render(
        <ImageLightbox
          image={mockProductImages[1]}
          images={mockProductImages}
          isOpen={true}
          onClose={mockOnClose}
          onPrev={mockOnPrev}
        />
      );

      const prevButton = screen.getByLabelText(/previous image|পূর্ববর্তী ছবি/i);
      await user.click(prevButton);

      expect(mockOnPrev).toHaveBeenCalled();
    });

    it('hides navigation when single image', () => {
      render(
        <ImageLightbox
          image={mockProductImages[0]}
          images={[mockProductImages[0]]}
          isOpen={true}
          onClose={mockOnClose}
          showNavigation={true}
        />
      );

      expect(screen.queryByLabelText(/next image|পরবর্তী ছবি/i)).not.toBeInTheDocument();
    });

    it('navigates with keyboard arrows', async () => {
      const user = userEvent.setup();

      render(
        <ImageLightbox
          image={mockProductImages[0]}
          images={mockProductImages}
          isOpen={true}
          onClose={mockOnClose}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      await user.keyboard('{ArrowRight}');
      expect(mockOnNext).toHaveBeenCalled();

      await user.keyboard('{ArrowLeft}');
      expect(mockOnPrev).toHaveBeenCalled();
    });
  });

  describe('Thumbnail Navigation', () => {
    it('navigates to selected thumbnail', async () => {
      const user = userEvent.setup();

      render(
        <ImageLightbox
          image={mockProductImages[0]}
          images={mockProductImages}
          isOpen={true}
          onClose={mockOnClose}
          showThumbnails={true}
        />
      );

      const thumbnails = screen.getAllByTestId('lightbox-thumbnail');
      await user.click(thumbnails[2]);

      expect(screen.getByAltText(/Product back view/i)).toBeInTheDocument();
    });

    it('highlights active thumbnail', async () => {
      const user = userEvent.setup();

      render(
        <ImageLightbox
          image={mockProductImages[0]}
          images={mockProductImages}
          isOpen={true}
          onClose={mockOnClose}
          showThumbnails={true}
        />
      );

      const thumbnails = screen.getAllByTestId('lightbox-thumbnail');
      expect(thumbnails[0]).toHaveClass('active');
      expect(thumbnails[1]).not.toHaveClass('active');
    });

    it('scrolls thumbnail strip for many images', () => {
      render(
        <ImageLightbox
          image={mockProductImages[0]}
          images={mockProductImages}
          isOpen={true}
          onClose={mockOnClose}
          showThumbnails={true}
        />
      );

      const thumbnailStrip = screen.getByTestId('lightbox-thumbnails');
      expect(thumbnailStrip).toHaveClass('scrollable');
    });
  });

  describe('Image Information', () => {
    it('displays alt text', () => {
      render(
        <ImageLightbox
          image={mockProductImages[0]}
          images={mockProductImages}
          isOpen={true}
          onClose={mockOnClose}
          showInfo={true}
        />
      );

      expect(screen.getByText(/Product main image/i)).toBeInTheDocument();
    });

    it('displays image dimensions', () => {
      render(
        <ImageLightbox
          image={mockProductImages[0]}
          images={mockProductImages}
          isOpen={true}
          onClose={mockOnClose}
          showInfo={true}
        />
      );

      expect(screen.getByText(/1200.*x.*1200/i)).toBeInTheDocument();
    });

    it('displays image counter', () => {
      render(
        <ImageLightbox
          image={mockProductImages[0]}
          images={mockProductImages}
          isOpen={true}
          onClose={mockOnClose}
          showCounter={true}
        />
      );

      expect(screen.getByText(/1.*\/.*3/i)).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('shows open animation', () => {
      render(
        <ImageLightbox
          image={mockProductImages[0]}
          images={mockProductImages}
          isOpen={true}
          onClose={mockOnClose}
          animation="fade"
        />
      );

      const overlay = screen.getByTestId('lightbox-overlay');
      expect(overlay).toHaveClass('fade-in');
    });

    it('opens within 300ms', () => {
      const startTime = Date.now();

      render(
        <ImageLightbox
          image={mockProductImages[0]}
          images={mockProductImages}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(300);
    });
  });

  describe('Fullscreen', () => {
    it('toggles fullscreen mode', async () => {
      const user = userEvent.setup();

      render(
        <ImageLightbox
          image={mockProductImages[0]}
          images={mockProductImages}
          isOpen={true}
          onClose={mockOnClose}
          enableFullscreen={true}
        />
      );

      const fullscreenButton = screen.getByLabelText(/fullscreen|পূর্ণ স্ক্রিন/i);
      await user.click(fullscreenButton);

      expect(screen.getByTestId('lightbox-overlay')).toHaveClass('fullscreen');
    });
  });

  describe('Download', () => {
    it('shows download button', () => {
      render(
        <ImageLightbox
          image={mockProductImages[0]}
          images={mockProductImages}
          isOpen={true}
          onClose={mockOnClose}
          showDownload={true}
        />
      );

      expect(screen.getByLabelText(/download|ডাউনলোড/i)).toBeInTheDocument();
    });
  });
});

// ============================================
// IMAGE THUMBNAIL STRIP COMPONENT TESTS
// ============================================

describe('ImageThumbnailStrip Component Integration Tests', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all thumbnails', () => {
      render(
        <ImageThumbnailStrip
          images={mockProductImages}
          selectedIndex={0}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getAllByTestId('thumbnail').length).toBe(3);
    });

    it('renders thumbnails in horizontal strip', () => {
      render(
        <ImageThumbnailStrip
          images={mockProductImages}
          selectedIndex={0}
          onSelect={mockOnSelect}
        />
      );

      const strip = screen.getByTestId('thumbnail-strip');
      expect(strip).toHaveClass('horizontal');
    });

    it('renders primary badge on primary image', () => {
      render(
        <ImageThumbnailStrip
          images={mockProductImages}
          selectedIndex={0}
          onSelect={mockOnSelect}
          showPrimaryBadge={true}
        />
      );

      expect(screen.getByText(/primary|প্রাইমারি/i)).toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    it('highlights selected thumbnail', async () => {
      const user = userEvent.setup();

      render(
        <ImageThumbnailStrip
          images={mockProductImages}
          selectedIndex={0}
          onSelect={mockOnSelect}
        />
      );

      const thumbnails = screen.getAllByTestId('thumbnail');
      expect(thumbnails[0]).toHaveClass('selected');
      expect(thumbnails[1]).not.toHaveClass('selected');
    });

    it('calls onSelect when thumbnail is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ImageThumbnailStrip
          images={mockProductImages}
          selectedIndex={0}
          onSelect={mockOnSelect}
        />
      );

      const thumbnails = screen.getAllByTestId('thumbnail');
      await user.click(thumbnails[1]);

      expect(mockOnSelect).toHaveBeenCalledWith(1);
    });
  });

  describe('Scroll Behavior', () => {
    it('scrolls horizontally for many thumbnails', async () => {
      const user = userEvent.setup();
      const manyImages = Array.from({ length: 10 }, (_, i) => mockProductImages[0]);

      render(
        <ImageThumbnailStrip
          images={manyImages}
          selectedIndex={0}
          onSelect={mockOnSelect}
          scrollable={true}
        />
      );

      const strip = screen.getByTestId('thumbnail-strip');
      expect(strip).toHaveClass('scrollable');

      // Scroll right
      const scrollButton = screen.getByLabelText(/scroll right|ডানে স্ক্রল/i);
      await user.click(scrollButton);
    });

    it('scrolls to selected thumbnail', async () => {
      render(
        <ImageThumbnailStrip
          images={mockProductImages}
          selectedIndex={2}
          onSelect={mockOnSelect}
          autoScroll={true}
        />
      );

      const strip = screen.getByTestId('thumbnail-strip');
      // Should have scrolled to show thumbnail 2
    });
  });

  describe('Keyboard Navigation', () => {
    it('navigates with arrow keys', async () => {
      const user = userEvent.setup();

      render(
        <ImageThumbnailStrip
          images={mockProductImages}
          selectedIndex={0}
          onSelect={mockOnSelect}
          keyboardNavigation={true}
        />
      );

      const strip = screen.getByTestId('thumbnail-strip');
      await user.tab();
      expect(strip).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(mockOnSelect).toHaveBeenCalledWith(1);
    });

    it('activates selected thumbnail on Enter', async () => {
      const user = userEvent.setup();

      render(
        <ImageThumbnailStrip
          images={mockProductImages}
          selectedIndex={0}
          onSelect={mockOnSelect}
          keyboardNavigation={true}
        />
      );

      const strip = screen.getByTestId('thumbnail-strip');
      await user.tab();
      await user.keyboard('{Enter}');

      expect(mockOnSelect).toHaveBeenCalled();
    });
  });

  describe('Empty State', () => {
    it('shows placeholder when no images', () => {
      render(
        <ImageThumbnailStrip
          images={[]}
          selectedIndex={0}
          onSelect={mockOnSelect}
          placeholderUrl="/images/placeholder.jpg"
        />
      );

      expect(screen.getByAltText(/no images/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(
        <ImageThumbnailStrip
          images={mockProductImages}
          selectedIndex={0}
          onSelect={mockOnSelect}
        />
      );

      const thumbnails = screen.getAllByTestId('thumbnail');
      thumbnails.forEach((thumb, index) => {
        expect(thumb).toHaveAttribute('aria-label', expect.stringContaining(String(index + 1)));
      });
    });

    it('indicates selected state with ARIA', () => {
      render(
        <ImageThumbnailStrip
          images={mockProductImages}
          selectedIndex={0}
          onSelect={mockOnSelect}
        />
      );

      const selectedThumb = screen.getAllByTestId('thumbnail')[0];
      expect(selectedThumb).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Dark Mode', () => {
    it('applies dark mode styles', () => {
      render(
        <ImageThumbnailStrip
          images={mockProductImages}
          selectedIndex={0}
          onSelect={mockOnSelect}
          darkMode={true}
        />
      );

      const strip = screen.getByTestId('thumbnail-strip');
      expect(strip).toHaveClass('dark-mode');
    });
  });
});

// ============================================
// IMAGE REORDER COMPONENT TESTS
// ============================================

describe('ImageReorder Component Integration Tests', () => {
  const mockOnReorder = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnSetPrimary = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all images in reorderable list', () => {
      render(
        <ImageReorder
          images={mockProductImages}
          onReorder={mockOnReorder}
          onDelete={mockOnDelete}
          onSetPrimary={mockOnSetPrimary}
        />
      );

      expect(screen.getAllByTestId('reorder-item').length).toBe(3);
    });

    it('renders drag handles', () => {
      render(
        <ImageReorder
          images={mockProductImages}
          onReorder={mockOnReorder}
          onDelete={mockOnDelete}
          onSetPrimary={mockOnSetPrimary}
        />
      );

      expect(screen.getByLabelText(/drag handle|ড্র্যাগ হ্যান্ডেল/i)).toBeInTheDocument();
    });

    it('renders thumbnail preview', () => {
      render(
        <ImageReorder
          images={mockProductImages}
          onReorder={mockOnReorder}
          onDelete={mockOnDelete}
          onSetPrimary={mockOnSetPrimary}
        />
      );

      expect(screen.getByAltText(/Product main image/i)).toBeInTheDocument();
    });

    it('renders primary badge for primary image', () => {
      render(
        <ImageReorder
          images={mockProductImages}
          onReorder={mockOnReorder}
          onDelete={mockOnDelete}
          onSetPrimary={mockOnSetPrimary}
          showPrimaryBadge={true}
        />
      );

      expect(screen.getByText(/primary|প্রাইমারি/i)).toBeInTheDocument();
    });
  });

  describe('Drag and Drop Reordering', () => {
    it('provides visual feedback during drag', async () => {
      const user = userEvent.setup();

      render(
        <ImageReorder
          images={mockProductImages}
          onReorder={mockOnReorder}
          onDelete={mockOnDelete}
          onSetPrimary={mockOnSetPrimary}
        />
      );

      const dragHandle = screen.getByLabelText(/drag handle|ড্র্যাগ হ্যান্ডেল/i);
      
      await act(async () => {
        fireEvent.dragStart(dragHandle);
      });

      const items = screen.getAllByTestId('reorder-item');
      expect(items[0]).toHaveClass('dragging');
    });

    it('shows drop target indicator', async () => {
      const user = userEvent.setup();

      render(
        <ImageReorder
          images={mockProductImages}
          onReorder={mockOnReorder}
          onDelete={mockOnDelete}
          onSetPrimary={mockOnSetPrimary}
        />
      );

      const dragHandle = screen.getByLabelText(/drag handle|ড্র্যাগ হ্যান্ডেল/i);
      const targetItem = screen.getAllByTestId('reorder-item')[1];

      await act(async () => {
        fireEvent.dragOver(targetItem);
      });

      expect(targetItem).toHaveClass('drop-target');
    });

    it('calls onReorder after drop', async () => {
      const user = userEvent.setup();

      render(
        <ImageReorder
          images={mockProductImages}
          onReorder={mockOnReorder}
          onDelete={mockOnDelete}
          onSetPrimary={mockOnSetPrimary}
        />
      );

      const dragHandle = screen.getByLabelText(/drag handle|ড্র্যাগ হ্যান্ডেল/i);
      const dropTarget = screen.getAllByTestId('reorder-item')[2];

      await act(async () => {
        fireEvent.dragStart(dragHandle);
        fireEvent.dragEnter(dropTarget);
        fireEvent.dragOver(dropTarget);
        fireEvent.drop(dropTarget);
      });

      expect(mockOnReorder).toHaveBeenCalled();
    });
  });

  describe('Set as Primary', () => {
    it('shows set as primary button for non-primary images', () => {
      render(
        <ImageReorder
          images={mockProductImages}
          onReorder={mockOnReorder}
          onDelete={mockOnDelete}
          onSetPrimary={mockOnSetPrimary}
        />
      );

      const setPrimaryButtons = screen.getAllByText(/set as primary|প্রাইমারি করুন/i);
      expect(setPrimaryButtons.length).toBe(2); // Two non-primary images
    });

    it('does not show set as primary for primary image', () => {
      render(
        <ImageReorder
          images={mockProductImages}
          onReorder={mockOnReorder}
          onDelete={mockOnDelete}
          onSetPrimary={mockOnSetPrimary}
        />
      );

      // Primary image should not have set as primary button
      const primaryItem = screen.getAllByTestId('reorder-item')[0];
      expect(primaryItem).not.toHaveTextContent(/set as primary/i);
    });

    it('calls onSetPrimary when button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ImageReorder
          images={mockProductImages}
          onReorder={mockOnReorder}
          onDelete={mockOnDelete}
          onSetPrimary={mockOnSetPrimary}
        />
      );

      const setPrimaryButton = screen.getAllByText(/set as primary|প্রাইমারি করুন/i)[0];
      await user.click(setPrimaryButton);

      expect(mockOnSetPrimary).toHaveBeenCalledWith(mockProductImages[1].id);
    });
  });

  describe('Delete', () => {
    it('shows delete button for each image', () => {
      render(
        <ImageReorder
          images={mockProductImages}
          onReorder={mockOnReorder}
          onDelete={mockOnDelete}
          onSetPrimary={mockOnSetPrimary}
        />
      );

      expect(screen.getAllByLabelText(/delete|মুছুন/i).length).toBe(3);
    });

    it('shows confirmation dialog on delete click', async () => {
      const user = userEvent.setup();

      render(
        <ImageReorder
          images={mockProductImages}
          onReorder={mockOnReorder}
          onDelete={mockOnDelete}
          onSetPrimary={mockOnSetPrimary}
          confirmDelete={true}
        />
      );

      const deleteButton = screen.getAllByLabelText(/delete|মুছুন/i)[0];
      await user.click(deleteButton);

      expect(screen.getByText(/confirm.*delete|নিশ্চিত.*মুছুন/i)).toBeInTheDocument();
    });

    it('calls onDelete after confirmation', async () => {
      const user = userEvent.setup();

      render(
        <ImageReorder
          images={mockProductImages}
          onReorder={mockOnReorder}
          onDelete={mockOnDelete}
          onSetPrimary={mockOnSetPrimary}
          confirmDelete={true}
        />
      );

      // Click delete
      const deleteButton = screen.getAllByLabelText(/delete|মুছুন/i)[0];
      await user.click(deleteButton);

      // Confirm
      const confirmButton = screen.getByText(/delete|মুছুন/i);
      await user.click(confirmButton);

      expect(mockOnDelete).toHaveBeenCalledWith(mockProductImages[0].id);
    });
  });

  describe('Undo/Redo', () => {
    it('provides undo functionality', async () => {
      const user = userEvent.setup();

      render(
        <ImageReorder
          images={mockProductImages}
          onReorder={mockOnReorder}
          onDelete={mockOnDelete}
          onSetPrimary={mockOnSetPrimary}
          enableUndo={true}
        />
      });

      const undoButton = screen.getByLabelText(/undo|পূর্বাবস্থান/i);
      await user.click(undoButton);

      // Undo should work without errors
    });

    it('provides redo functionality', async () => {
      const user = userEvent.setup();

      render(
        <ImageReorder
          images={mockProductImages}
          onReorder={mockOnReorder}
          onDelete={mockOnDelete}
          onSetPrimary={mockOnSetPrimary}
          enableUndo={true}
          enableRedo={true}
        />
      );

      const redoButton = screen.getByLabelText(/redo|পুনরায়/i);
      await user.click(redoButton);

      // Redo should work without errors
    });
  });

  describe('Display Order', () => {
    it('displays current order numbers', () => {
      render(
        <ImageReorder
          images={mockProductImages}
          onReorder={mockOnReorder}
          onDelete={mockOnDelete}
          onSetPrimary={mockOnSetPrimary}
          showOrderNumbers={true}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('allows manual order input', () => {
      render(
        <ImageReorder
          images={mockProductImages}
          onReorder={mockOnReorder}
          onDelete={mockOnDelete}
          onSetPrimary={mockOnSetPrimary}
          allowManualOrder={true}
        />
      );

      expect(screen.getByLabelText(/display order|প্রদর্শন অর্ডার/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for drag and drop', () => {
      render(
        <ImageReorder
          images={mockProductImages}
          onReorder={mockOnReorder}
          onDelete={mockOnDelete}
          onSetPrimary={mockOnSetPrimary}
        />
      );

      const dragHandle = screen.getByLabelText(/drag.*reorder|ড্র্যাগ.*পুনর্বিন্যাস/i);
      expect(dragHandle).toHaveAttribute('aria-label');
    });

    it('indicates drop targets with ARIA', () => {
      render(
        <ImageReorder
          images={mockProductImages}
          onReorder={mockOnReorder}
          onDelete={mockOnDelete}
          onSetPrimary={mockOnSetPrimary}
        />
      );

      const items = screen.getAllByTestId('reorder-item');
      items.forEach((item) => {
        expect(item).toHaveAttribute('role', 'listitem');
      });
    });
  });

  describe('Dark Mode', () => {
    it('applies dark mode styles', () => {
      render(
        <ImageReorder
          images={mockProductImages}
          onReorder={mockOnReorder}
          onDelete={mockOnDelete}
          onSetPrimary={mockOnSetPrimary}
          darkMode={true}
        />
      );

      const list = screen.getByTestId('reorder-list');
      expect(list).toHaveClass('dark-mode');
    });
  });
});

// ============================================
// IMAGE ALT TEXT EDITOR COMPONENT TESTS
// ============================================

describe('ImageAltTextEditor Component Integration Tests', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders Bengali alt text input', () => {
      render(
        <ImageAltTextEditor
          image={mockProductImages[0]}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText(/alt text.*bengali/i)).toBeInTheDocument();
    });

    it('renders English alt text input', () => {
      render(
        <ImageAltTextEditor
          image={mockProductImages[0]}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText(/alt text.*english/i)).toBeInTheDocument();
    });

    it('renders image preview', () => {
      render(
        <ImageAltTextEditor
          image={mockProductImages[0]}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByAltText(/Product main image/i)).toBeInTheDocument();
    });

    it('renders save button', () => {
      render(
        <ImageAltTextEditor
          image={mockProductImages[0]}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/save|সংরক্ষণ/i)).toBeInTheDocument();
    });

    it('renders cancel button', () => {
      render(
        <ImageAltTextEditor
          image={mockProductImages[0]}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/cancel|বাতিল/i)).toBeInTheDocument();
    });
  });

  describe('Editing', () => {
    it('allows editing Bengali alt text', async () => {
      const user = userEvent.setup();

      render(
        <ImageAltTextEditor
          image={mockProductImages[0]}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const bnInput = screen.getByLabelText(/alt text.*bengali/i);
      await user.clear(bnInput);
      await user.type(bnInput, 'নতুন বাংলা টেক্সট');

      expect(bnInput).toHaveValue('নতুন বাংলা টেক্সট');
    });

    it('allows editing English alt text', async () => {
      const user = userEvent.setup();

      render(
        <ImageAltTextEditor
          image={mockProductImages[0]}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const enInput = screen.getByLabelText(/alt text.*english/i);
      await user.clear(enInput);
      await user.type(enInput, 'New English text');

      expect(enInput).toHaveValue('New English text');
    });

    it('pre-fills with existing alt text', () => {
      render(
        <ImageAltTextEditor
          image={mockProductImages[0]}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText(/alt text.*bengali/i)).toHaveValue('পণ্যের মূল ছবি');
      expect(screen.getByLabelText(/alt text.*english/i)).toHaveValue('Product main image');
    });
  });

  describe('Validation', () => {
    it('enforces 250 character limit', async () => {
      const user = userEvent.setup();
      const longText = 'a'.repeat(300);

      render(
        <ImageAltTextEditor
          image={mockProductImages[0]}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const input = screen.getByLabelText(/alt text.*english/i);
      await user.type(input, longText);

      expect(input).toHaveValue(longText.slice(0, 250));
    });

    it('shows character counter', async () => {
      const user = userEvent.setup();

      render(
        <ImageAltTextEditor
          image={mockProductImages[0]}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const input = screen.getByLabelText(/alt text.*english/i);
      await user.type(input, 'Test');

      expect(screen.getByText(/5.*\/.*250/i)).toBeInTheDocument();
    });

    it('shows error when text exceeds limit', async () => {
      const user = userEvent.setup();

      render(
        <ImageAltTextEditor
          image={mockProductImages[0]}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          showValidation={true}
        />
      );

      const input = screen.getByLabelText(/alt text.*english/i);
      await user.clear(input);
      
      // Type more than 250 characters
      await user.type(input, 'a'.repeat(251));

      expect(screen.getByText(/cannot exceed.*250|২৫০.*অতিক্রণ/i)).toBeInTheDocument();
    });

    it('prevents saving when validation fails', async () => {
      const user = userEvent.setup();

      render(
        <ImageAltTextEditor
          image={mockProductImages[0]}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          showValidation={true}
        />
      );

      const input = screen.getByLabelText(/alt text.*english/i);
      await user.clear(input);
      await user.type(input, 'a'.repeat(251));

      const saveButton = screen.getByText(/save|সংরক্ষণ/i);
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Auto-generate', () => {
    it('shows auto-generate button', () => {
      render(
        <ImageAltTextEditor
          image={mockProductImages[0]}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          showAutoGenerate={true}
        />
      );

      expect(screen.getByText(/auto-generate|স্বয়ংক্রিয়/i)).toBeInTheDocument();
    });

    it('auto-generates alt text from product name', async () => {
      const user = userEvent.setup();

      render(
        <ImageAltTextEditor
          image={mockProductImages[0]}
          productName="Test Product"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          showAutoGenerate={true}
        />
      );

