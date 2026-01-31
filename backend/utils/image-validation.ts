/**
 * Image Validation Utilities
 * 
 * Comprehensive validation for image uploads including MIME type,
 * file extension, magic number, file size, and dimension validation.
 */

import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  ImageValidationResult,
  ImageMetadata
} from '../types/product-image.types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Magic numbers (file signatures) for common image formats
 */
const IMAGE_MAGIC_NUMBERS = {
  'image/jpeg': [
    Buffer.from([0xFF, 0xD8, 0xFF]), // JPEG SOI
  ],
  'image/jpg': [
    Buffer.from([0xFF, 0xD8, 0xFF]), // JPEG SOI
  ],
  'image/png': [
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), // PNG signature
  ],
  'image/webp': [
    Buffer.from([0x52, 0x49, 0x46, 0x46]), // RIFF
    Buffer.from([0x57, 0x45, 0x42, 0x50]), // WEBP
  ]
};

/**
 * File extensions for allowed MIME types
 */
const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

/**
 * Validate image MIME type
 * 
 * @param mimeType - The MIME type to validate
 * @returns Validation result
 */
export function validateMimeType(mimeType: string): ImageValidationResult {
  if (!mimeType) {
    return {
      isValid: false,
      error: 'MIME type is required',
      field: 'mimeType'
    };
  }

  const normalizedMime = mimeType.toLowerCase().trim();
  
  if (!ALLOWED_MIME_TYPES.includes(normalizedMime)) {
    return {
      isValid: false,
      error: `Invalid MIME type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      field: 'mimeType'
    };
  }

  return { isValid: true };
}

/**
 * Validate file extension
 * 
 * @param fileName - The file name to validate
 * @returns Validation result
 */
export function validateFileExtension(fileName: string): ImageValidationResult {
  if (!fileName) {
    return {
      isValid: false,
      error: 'File name is required',
      field: 'fileName'
    };
  }

  const ext = path.extname(fileName).toLowerCase();
  const allowedExtensions = Object.values(MIME_TO_EXTENSION);

  if (!allowedExtensions.includes(ext)) {
    return {
      isValid: false,
      error: `Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}`,
      field: 'fileName'
    };
  }

  return { isValid: true };
}

/**
 * Validate file using magic number (binary signature)
 * This prevents file extension spoofing
 * 
 * @param filePath - The path to the file
 * @param mimeType - The expected MIME type
 * @returns Validation result
 */
export function validateMagicNumber(
  filePath: string,
  mimeType: string
): ImageValidationResult {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const magicNumbers = IMAGE_MAGIC_NUMBERS[mimeType.toLowerCase()];

    if (!magicNumbers) {
      return {
        isValid: false,
        error: 'Unsupported MIME type for magic number validation',
        field: 'mimeType'
      };
    }

    // Check if file starts with expected magic number
    for (const magic of magicNumbers) {
      if (fileBuffer.subarray(0, magic.length).equals(magic)) {
        return { isValid: true };
      }
    }

    return {
      isValid: false,
      error: 'File signature does not match the declared MIME type',
      field: 'file'
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to read file for magic number validation',
      field: 'file'
    };
  }
}

/**
 * Validate file size
 * 
 * @param fileSizeBytes - The file size in bytes
 * @returns Validation result
 */
export function validateFileSize(fileSizeBytes: number): ImageValidationResult {
  if (typeof fileSizeBytes !== 'number' || fileSizeBytes < 0) {
    return {
      isValid: false,
      error: 'Invalid file size',
      field: 'fileSize'
    };
  }

  if (fileSizeBytes > MAX_FILE_SIZE) {
    const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      error: `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
      field: 'fileSize'
    };
  }

  return { isValid: true };
}

/**
 * Validate image dimensions
 * 
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @returns Validation result
 */
export function validateImageDimensions(
  width: number,
  height: number
): ImageValidationResult {
  if (typeof width !== 'number' || typeof height !== 'number') {
    return {
      isValid: false,
      error: 'Invalid dimensions type',
      field: 'dimensions'
    };
  }

  if (width <= 0 || height <= 0) {
    return {
      isValid: false,
      error: 'Image dimensions must be greater than 0',
      field: 'dimensions'
    };
  }

  // Maximum reasonable dimensions (e.g., 10000x10000)
  if (width > 10000 || height > 10000) {
    return {
      isValid: false,
      error: 'Image dimensions exceed maximum allowed size (10000x10000)',
      field: 'dimensions'
    };
  }

  return { isValid: true };
}

/**
 * Validate alt text length
 * 
 * @param altText - The alt text to validate
 * @param maxLength - Maximum allowed length (default 250)
 * @returns Validation result
 */
export function validateAltText(
  altText: string | null | undefined,
  maxLength: number = 250
): ImageValidationResult {
  if (altText === null || altText === undefined) {
    return { isValid: true }; // Alt text is optional
  }

  if (typeof altText !== 'string') {
    return {
      isValid: false,
      error: 'Alt text must be a string',
      field: 'altText'
    };
  }

  if (altText.trim().length > maxLength) {
    return {
      isValid: false,
      error: `Alt text cannot exceed ${maxLength} characters`,
      field: 'altText'
    };
  }

  return { isValid: true };
}

/**
 * Validate display order
 * 
 * @param displayOrder - The display order to validate
 * @returns Validation result
 */
export function validateDisplayOrder(displayOrder: number): ImageValidationResult {
  if (typeof displayOrder !== 'number') {
    return {
      isValid: false,
      error: 'Display order must be a number',
      field: 'displayOrder'
    };
  }

  if (!Number.isInteger(displayOrder)) {
    return {
      isValid: false,
      error: 'Display order must be an integer',
      field: 'displayOrder'
    };
  }

  if (displayOrder < 0) {
    return {
      isValid: false,
      error: 'Display order must be 0 or greater',
      field: 'displayOrder'
    };
  }

  return { isValid: true };
}

/**
 * Comprehensive image validation
 * Validates MIME type, extension, magic number, and file size
 * 
 * @param filePath - The path to the file
 * @param fileName - The file name
 * @param mimeType - The MIME type
 * @param fileSizeBytes - The file size in bytes
 * @returns Validation result with all errors
 */
export function validateImage(
  filePath: string,
  fileName: string,
  mimeType: string,
  fileSizeBytes: number
): ImageValidationResult {
  // Validate MIME type
  const mimeValidation = validateMimeType(mimeType);
  if (!mimeValidation.isValid) {
    return mimeValidation;
  }

  // Validate file extension
  const extValidation = validateFileExtension(fileName);
  if (!extValidation.isValid) {
    return extValidation;
  }

  // Validate file size
  const sizeValidation = validateFileSize(fileSizeBytes);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }

  // Validate magic number (binary signature)
  const magicValidation = validateMagicNumber(filePath, mimeType);
  if (!magicValidation.isValid) {
    return magicValidation;
  }

  return { isValid: true };
}

/**
 * Get image metadata from file
 * Uses image-size library to extract dimensions
 * 
 * @param filePath - The path to the image file
 * @returns Image metadata
 */
export async function getImageMetadata(
  filePath: string
): Promise<ImageMetadata> {
  try {
    // Dynamically import image-size to avoid issues if not installed
    const imageSize = await import('image-size');
    const metadata = imageSize.default(filePath);

    return {
      width: metadata.width,
      height: metadata.height,
      fileSizeBytes: fs.statSync(filePath).size,
      mimeType: getMimeTypeFromExtension(filePath),
      format: metadata.type || 'unknown'
    };
  } catch (error) {
    throw new Error(`Failed to extract image metadata: ${error}`);
  }
}

/**
 * Get MIME type from file extension
 * 
 * @param filePath - The file path
 * @returns MIME type or null
 */
export function getMimeTypeFromExtension(filePath: string): string | null {
  const ext = path.extname(filePath).toLowerCase();
  const extToMime: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp'
  };

  return extToMime[ext] || null;
}

/**
 * Validate product image count
 * 
 * @param currentCount - Current number of images
 * @param newCount - Number of new images to add
 * @returns Validation result
 */
export function validateImageCount(
  currentCount: number,
  newCount: number = 0
): ImageValidationResult {
  const totalCount = currentCount + newCount;

  if (totalCount > 10) {
    return {
      isValid: false,
      error: 'Maximum of 10 images allowed per product',
      field: 'imageCount'
    };
  }

  if (totalCount > 0 && totalCount < 5) {
    // Warning: minimum not enforced, just informational
    return {
      isValid: true,
      error: 'Warning: Minimum of 5 images recommended per product'
    };
  }

  return { isValid: true };
}

/**
 * Validate storage quota for product
 * 
 * @param currentTotalBytes - Current total storage in bytes
 * @param newImageBytes - Size of new image in bytes
 * @param maxQuotaBytes - Maximum allowed quota in bytes
 * @returns Validation result
 */
export function validateStorageQuota(
  currentTotalBytes: number,
  newImageBytes: number,
  maxQuotaBytes: number = 50 * 1024 * 1024 // 50MB default
): ImageValidationResult {
  const newTotal = currentTotalBytes + newImageBytes;

  if (newTotal > maxQuotaBytes) {
    const currentMB = (currentTotalBytes / (1024 * 1024)).toFixed(2);
    const newMB = (newImageBytes / (1024 * 1024)).toFixed(2);
    const maxMB = (maxQuotaBytes / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      error: `Storage quota exceeded. Current: ${currentMB}MB, New: ${newMB}MB, Maximum: ${maxMB}MB`,
      field: 'storageQuota'
    };
  }

  return { isValid: true };
}

/**
 * Validate filename format
 * Ensures filename is safe and doesn't contain invalid characters
 * 
 * @param fileName - The file name to validate
 * @returns Validation result
 */
export function validateFileName(fileName: string): ImageValidationResult {
  if (!fileName || typeof fileName !== 'string') {
    return {
      isValid: false,
      error: 'Invalid file name',
      field: 'fileName'
    };
  }

  // Check for invalid characters
  const invalidChars = /[<>:"|?*\/\\]/;
  if (invalidChars.test(fileName)) {
    return {
      isValid: false,
      error: 'File name contains invalid characters',
      field: 'fileName'
    };
  }

  // Check for reserved names (Windows)
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
  if (reservedNames.test(path.basename(fileName, path.extname(fileName)))) {
    return {
      isValid: false,
      error: 'File name is reserved',
      field: 'fileName'
    };
  }

  return { isValid: true };
}

/**
 * Sanitize filename for safe storage
 * Removes or replaces potentially dangerous characters
 * 
 * @param fileName - The original file name
 * @returns Sanitized file name
 */
export function sanitizeFileName(fileName: string): string {
  // Replace spaces with underscores
  let sanitized = fileName.replace(/\s+/g, '_');
  
  // Remove invalid characters
  sanitized = sanitized.replace(/[<>:"|?*\/\\]/g, '');
  
  // Prevent directory traversal
  sanitized = sanitized.replace(/\.\./g, '.');
  
  return sanitized;
}

/**
 * Generate unique filename
 * 
 * @param originalName - The original file name
 * @param index - Index for multiple files (optional)
 * @returns Unique filename with timestamp and random suffix
 */
export function generateUniqueFilename(
  originalName: string,
  index?: number
): string {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);
  const sanitizedBase = sanitizeFileName(baseName);
  
  const indexSuffix = index !== undefined ? `_${index}` : '';
  return `${timestamp}_${random}${indexSuffix}_${sanitizedBase}${ext}`;
}

/**
 * Validate all image upload parameters
 * 
 * @param file - The uploaded file object
 * @param productId - The product ID
 * @param currentImageCount - Current number of images for product
 * @returns Validation result with all errors
 */
export async function validateImageUpload(
  file: any,
  productId: string,
  currentImageCount: number = 0
): Promise<ImageValidationResult> {
  // Validate file exists
  if (!file) {
    return {
      isValid: false,
      error: 'No file provided',
      field: 'file'
    };
  }

  // Validate file name
  const nameValidation = validateFileName(file.originalname || file.name);
  if (!nameValidation.isValid) {
    return nameValidation;
  }

  // Validate MIME type
  const mimeValidation = validateMimeType(file.mimetype);
  if (!mimeValidation.isValid) {
    return mimeValidation;
  }

  // Validate file size
  const sizeValidation = validateFileSize(file.size);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }

  // Validate image count
  const countValidation = validateImageCount(currentImageCount, 1);
  if (!countValidation.isValid && countValidation.error && !countValidation.error?.includes('Warning')) {
    return countValidation;
  }

  return { isValid: true };
}
