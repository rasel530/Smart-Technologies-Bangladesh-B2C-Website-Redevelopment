/**
 * Product Image Types
 * 
 * TypeScript types and interfaces for product_images table
 * which manages multiple image versions (original, optimized, thumbnail)
 * with metadata for image processing and display management.
 */

/**
 * Processing status for image optimization
 */
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Product Image entity from database
 */
export interface ProductImage {
  id: string;
  productId: string;
  originalUrl: string;
  optimizedUrl: string | null;
  thumbnailUrl: string | null;
  altTextBn: string | null;
  altTextEn: string | null;
  displayOrder: number;
  isPrimary: boolean;
  fileSizeBytes: number | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  processingStatus: ProcessingStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Request to create a product image
 */
export interface CreateProductImageRequest {
  productId: string;
  originalUrl: string;
  optimizedUrl?: string;
  thumbnailUrl?: string;
  altTextBn?: string;
  altTextEn?: string;
  displayOrder?: number;
  isPrimary?: boolean;
  fileSizeBytes?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  processingStatus?: ProcessingStatus;
}

/**
 * Request to update a product image
 */
export interface UpdateProductImageRequest {
  optimizedUrl?: string;
  thumbnailUrl?: string;
  altTextBn?: string;
  altTextEn?: string;
  displayOrder?: number;
  isPrimary?: boolean;
  processingStatus?: ProcessingStatus;
}

/**
 * Request to upload multiple images for a product
 */
export interface UploadProductImagesRequest {
  productId: string;
  images: Array<{
    file: any; // Multer file object
    altTextBn?: string;
    altTextEn?: string;
    displayOrder?: number;
  }>;
}

/**
 * Request to reorder product images
 */
export interface ReorderProductImagesRequest {
  productId: string;
  imageIds: string[];
}

/**
 * Image variant information
 */
export interface ImageVariant {
  type: 'original' | 'optimized' | 'thumbnail' | 'large' | 'medium' | 'small';
  url: string;
  width: number;
  height: number;
  fileSizeBytes: number;
}

/**
 * Image processing result
 */
export interface ImageProcessingResult {
  success: boolean;
  originalPath: string;
  originalUrl: string;
  optimizedPath?: string;
  optimizedUrl?: string;
  thumbnailPath?: string;
  thumbnailUrl?: string;
  variants?: ImageVariant[];
  metadata: {
    width: number;
    height: number;
    fileSizeBytes: number;
    mimeType: string;
  };
  error?: string;
}

/**
 * Upload progress information
 */
export interface UploadProgress {
  imageId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
}

/**
 * Bulk upload result
 */
export interface BulkUploadResult {
  total: number;
  successful: number;
  failed: number;
  images: ProductImage[];
  errors: Array<{
    fileName: string;
    error: string;
  }>;
}

/**
 * Image validation result
 */
export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  field?: string;
}

/**
 * Image file metadata
 */
export interface ImageMetadata {
  width: number;
  height: number;
  fileSizeBytes: number;
  mimeType: string;
  format: string;
}

/**
 * Image size variant configuration
 */
export interface ImageSizeVariant {
  name: string;
  maxWidth: number;
  maxHeight: number;
  quality: number;
  suffix: string;
}

/**
 * Default image size variants
 */
export const DEFAULT_IMAGE_VARIANTS: ImageSizeVariant[] = [
  {
    name: 'large',
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 80,
    suffix: '_large'
  },
  {
    name: 'medium',
    maxWidth: 600,
    maxHeight: 600,
    quality: 75,
    suffix: '_medium'
  },
  {
    name: 'small',
    maxWidth: 150,
    maxHeight: 150,
    quality: 70,
    suffix: '_small'
  },
  {
    name: 'thumbnail',
    maxWidth: 50,
    maxHeight: 50,
    quality: 70,
    suffix: '_thumb'
  }
];

/**
 * Allowed MIME types for image upload
 */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

/**
 * Maximum file size in bytes (5MB)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Minimum images per product
 */
export const MIN_IMAGES_PER_PRODUCT = 5;

/**
 * Maximum images per product
 */
export const MAX_IMAGES_PER_PRODUCT = 10;

/**
 * Maximum storage quota per product in bytes (50MB)
 */
export const MAX_STORAGE_QUOTA_PER_PRODUCT = 50 * 1024 * 1024;

/**
 * Soft delete recovery window in days
 */
export const SOFT_DELETE_RECOVERY_DAYS = 30;
