/**
 * Image Validation Utilities
 * 
 * Comprehensive validation for image uploads including MIME type,
 * file extension, magic number, file size, and dimension validation.
 */

const fs = require('fs');
const path = require('path');

/**
 * Magic numbers (file signatures) for common image formats
 */
const IMAGE_MAGIC_NUMBERS = {
  'image/jpeg': Buffer.from([0xFF, 0xD8, 0xFF]), // JPEG SOI
  'image/jpg': Buffer.from([0xFF, 0xD8, 0xFF]), // JPEG SOI
  'image/png': Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), // PNG signature
  'image/webp': [
    Buffer.from([0x52, 0x49, 0x46, 0x46]), // RIFF
    Buffer.from([0x57, 0x45, 0x42, 0x50]) // WEBP
  ]
};

/**
 * File extensions for allowed MIME types
 */
const MIME_TO_EXTENSION = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

/**
 * Allowed MIME types for image upload
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

/**
 * Maximum file size in bytes (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Minimum images per product
 */
const MIN_IMAGES_PER_PRODUCT = 5;

/**
 * Maximum images per product
 */
const MAX_IMAGES_PER_PRODUCT = 10;

/**
 * Maximum storage quota per product in bytes (50MB)
 */
const MAX_STORAGE_QUOTA_PER_PRODUCT = 50 * 1024 * 1024;

/**
 * Validate image MIME type
 * 
 * @param {string} mimeType - The MIME type to validate
 * @returns {Object} Validation result
 */
function validateMimeType(mimeType) {
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
 * @param {string} fileName - The file name to validate
 * @returns {Object} Validation result
 */
function validateFileExtension(fileName) {
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
 * @param {string} filePath - The path to file
 * @param {string} mimeType - The expected MIME type
 * @returns {Object} Validation result
 */
function validateMagicNumber(filePath, mimeType) {
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
    const magicArray = Array.isArray(magicNumbers) ? magicNumbers : [magicNumbers];
    for (const magic of magicArray) {
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
 * @param {number} fileSizeBytes - The file size in bytes
 * @returns {Object} Validation result
 */
function validateFileSize(fileSizeBytes) {
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
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @returns {Object} Validation result
 */
function validateImageDimensions(width, height) {
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
 * @param {string|null} altText - The alt text to validate
 * @param {number} maxLength - Maximum allowed length (default 250)
 * @returns {Object} Validation result
 */
function validateAltText(altText, maxLength = 250) {
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
 * @param {number} displayOrder - The display order to validate
 * @returns {Object} Validation result
 */
function validateDisplayOrder(displayOrder) {
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
 * @param {string} filePath - The path to file
 * @param {string} fileName - The file name
 * @param {string} mimeType - The MIME type
 * @param {number} fileSizeBytes - The file size in bytes
 * @returns {Object} Validation result with all errors
 */
function validateImage(filePath, fileName, mimeType, fileSizeBytes) {
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
 * @param {string} filePath - The path to image file
 * @returns {Promise<Object>} Image metadata
 */
async function getImageMetadata(filePath) {
  try {
    const imageSize = require('image-size');
    const metadata = imageSize(filePath);
    const stats = fs.statSync(filePath);

    return {
      width: metadata.width,
      height: metadata.height,
      fileSizeBytes: stats.size,
      mimeType: getMimeTypeFromExtension(filePath),
      format: metadata.type || 'unknown'
    };
  } catch (error) {
    throw new Error(`Failed to extract image metadata: ${error.message}`);
  }
}

/**
 * Get MIME type from file extension
 * 
 * @param {string} filePath - The file path
 * @returns {string|null} MIME type or null
 */
function getMimeTypeFromExtension(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const extToMime = {
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
 * @param {number} currentCount - Current number of images
 * @param {number} newCount - Number of new images to add
 * @returns {Object} Validation result
 */
function validateImageCount(currentCount, newCount = 0) {
  const totalCount = currentCount + newCount;

  if (totalCount > MAX_IMAGES_PER_PRODUCT) {
    return {
      isValid: false,
      error: `Maximum of ${MAX_IMAGES_PER_PRODUCT} images allowed per product`,
      field: 'imageCount'
    };
  }

  if (totalCount > 0 && totalCount < MIN_IMAGES_PER_PRODUCT) {
    // Warning: minimum not enforced, just informational
    return {
      isValid: true,
      error: `Warning: Minimum of ${MIN_IMAGES_PER_PRODUCT} images recommended per product`
    };
  }

  return { isValid: true };
}

/**
 * Validate storage quota for product
 * 
 * @param {number} currentTotalBytes - Current total storage in bytes
 * @param {number} newImageBytes - Size of new image in bytes
 * @param {number} maxQuotaBytes - Maximum allowed quota in bytes
 * @returns {Object} Validation result
 */
function validateStorageQuota(currentTotalBytes, newImageBytes, maxQuotaBytes = MAX_STORAGE_QUOTA_PER_PRODUCT) {
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
 * @param {string} fileName - The file name to validate
 * @returns {Object} Validation result
 */
function validateFileName(fileName) {
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
 * @param {string} fileName - The original file name
 * @returns {string} Sanitized file name
 */
function sanitizeFileName(fileName) {
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
 * @param {string} originalName - The original file name
 * @param {number} index - Index for multiple files (optional)
 * @returns {string} Unique filename with timestamp and random suffix
 */
function generateUniqueFilename(originalName, index) {
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
 * @param {Object} file - The uploaded file object
 * @param {string} productId - The product ID
 * @param {number} currentImageCount - Current number of images for product
 * @returns {Promise<Object>} Validation result with all errors
 */
async function validateImageUpload(file, productId, currentImageCount = 0) {
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
  if (!countValidation.isValid && countValidation.error && !countValidation.error.includes('Warning')) {
    return countValidation;
  }

  return { isValid: true };
}

module.exports = {
  validateMimeType,
  validateFileExtension,
  validateMagicNumber,
  validateFileSize,
  validateImageDimensions,
  validateAltText,
  validateDisplayOrder,
  validateImage,
  getImageMetadata,
  getMimeTypeFromExtension,
  validateImageCount,
  validateStorageQuota,
  validateFileName,
  sanitizeFileName,
  generateUniqueFilename,
  validateImageUpload,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  MIN_IMAGES_PER_PRODUCT,
  MAX_IMAGES_PER_PRODUCT,
  MAX_STORAGE_QUOTA_PER_PRODUCT
};
