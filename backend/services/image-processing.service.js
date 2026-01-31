/**
 * Image Processing Service
 * 
 * Handles image processing operations including WebP conversion,
 * multiple size variants generation, EXIF removal, and color profile standardization.
 */

const sharp = require('sharp');
const path = require('path');

/**
 * Default image size variants
 */
const DEFAULT_IMAGE_VARIANTS = [
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
 * Custom error class for Image Processing Service
 */
class ImageProcessingServiceError extends Error {
  constructor(message, statusCode = 500, field = null) {
    super(message);
    this.name = 'ImageProcessingServiceError';
    this.statusCode = statusCode;
    this.field = field;
  }
}

/**
 * Image Processing Service Class
 */
class ImageProcessingService {
  constructor() {
    this.defaultVariants = DEFAULT_IMAGE_VARIANTS;
  }

  /**
   * Process uploaded image
   * Creates optimized, thumbnail, and size variants
   * 
   * @param {string} inputPath - Path to uploaded image
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processing result with all variants
   */
  async processImage(inputPath, options = {}) {
    try {
      const {
        generateWebP = true,
        generateVariants = true,
        removeExif = true,
        standardizeColorProfile = true,
        quality = 75,
        customVariants = null
      } = options;

      console.log(`[ImageProcessing] Processing image: ${inputPath}`);

      // Get image metadata
      const metadata = await this.getImageMetadata(inputPath);
      
      // Start processing pipeline
      let pipeline = sharp(inputPath);
      
      // Remove EXIF data and standardize color profile
      if (removeExif || standardizeColorProfile) {
        pipeline = pipeline
          .rotate() // Auto-rotate based on EXIF orientation
          .withMetadata({ orientation: undefined }); // Remove orientation metadata
      }
      
      // Standardize color profile to sRGB
      if (standardizeColorProfile) {
        pipeline = pipeline.toColorspace('srgb');
      }
      
      // Generate WebP version
      let webPPath = null;
      let webPUrl = null;
      if (generateWebP) {
        const webPResult = await this.generateWebP(pipeline, inputPath, quality);
        webPPath = webPResult.path;
        webPUrl = webPResult.url;
      }
      
      // Generate size variants
      const variants = [];
      if (generateVariants) {
        const variantConfigs = customVariants || this.defaultVariants;
        
        for (const variantConfig of variantConfigs) {
          const variant = await this.generateVariant(
            pipeline,
            inputPath,
            variantConfig
          );
          variants.push(variant);
        }
      }
      
      // Extract thumbnail from variants
      const thumbnailVariant = variants.find(v => v.type === 'thumbnail');
      const thumbnailPath = thumbnailVariant ? thumbnailVariant.path : null;
      const thumbnailUrl = thumbnailVariant ? thumbnailVariant.url : null;
      
      // Extract optimized from variants (use large as optimized)
      const optimizedVariant = variants.find(v => v.type === 'large');
      const optimizedPath = optimizedVariant ? optimizedVariant.path : null;
      const optimizedUrl = optimizedVariant ? optimizedVariant.url : null;
      
      const result = {
        success: true,
        originalPath: inputPath,
        originalUrl: this.getRelativePath(inputPath),
        optimizedPath,
        optimizedUrl,
        thumbnailPath,
        thumbnailUrl,
        variants,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          fileSizeBytes: metadata.size,
          mimeType: metadata.format,
          format: metadata.format
        }
      };
      
      console.log(`[ImageProcessing] Image processed successfully:`, {
        webP: !!webPPath,
        variantsCount: variants.length,
        dimensions: `${metadata.width}x${metadata.height}`
      });
      
      return result;
    } catch (error) {
      console.error('[ImageProcessing] Error processing image:', error);
      throw new ImageProcessingServiceError(
        `Failed to process image: ${error.message}`,
        500,
        'image'
      );
    }
  }

  /**
   * Generate WebP version of image
   * 
   * @param {Object} pipeline - Sharp pipeline
   * @param {string} inputPath - Original image path
   * @param {number} quality - Compression quality (default 75)
   * @returns {Promise<Object>} WebP file information
   */
  async generateWebP(pipeline, inputPath, quality = 75) {
    try {
      const ext = path.extname(inputPath);
      const baseName = path.basename(inputPath, ext);
      const webPPath = ext ? inputPath.replace(ext, '.webp') : `${inputPath}.webp`;
      
      await pipeline
        .webp({ quality })
        .toFile(webPPath);
      
      const stats = require('fs').statSync(webPPath);
      
      console.log(`[ImageProcessing] Generated WebP: ${webPPath} (${stats.size} bytes)`);
      
      return {
        path: webPPath,
        url: this.getRelativePath(webPPath),
        size: stats.size,
        quality
      };
    } catch (error) {
      console.error('[ImageProcessing] Error generating WebP:', error);
      throw new ImageProcessingServiceError(
        `Failed to generate WebP: ${error.message}`,
        500,
        'webp'
      );
    }
  }

  /**
   * Generate size variant of image
   * 
   * @param {Object} pipeline - Sharp pipeline
   * @param {string} inputPath - Original image path
   * @param {Object} variantConfig - Variant configuration
   * @returns {Promise<Object>} Variant file information
   */
  async generateVariant(pipeline, inputPath, variantConfig) {
    try {
      const ext = path.extname(inputPath);
      const baseName = path.basename(inputPath, ext);
      const variantPath = inputPath.replace(ext, `${variantConfig.suffix}${ext}`);
      
      // Resize maintaining aspect ratio
      await pipeline
        .resize(variantConfig.maxWidth, variantConfig.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .toFile(variantPath);
      
      const stats = require('fs').statSync(variantPath);
      const metadata = await sharp(variantPath).metadata();
      
      console.log(`[ImageProcessing] Generated variant ${variantConfig.name}: ${variantPath} (${stats.size} bytes, ${metadata.width}x${metadata.height})`);
      
      return {
        type: variantConfig.name,
        path: variantPath,
        url: this.getRelativePath(variantPath),
        width: metadata.width,
        height: metadata.height,
        fileSizeBytes: stats.size,
        quality: variantConfig.quality,
        suffix: variantConfig.suffix
      };
    } catch (error) {
      console.error(`[ImageProcessing] Error generating variant ${variantConfig.name}:`, error);
      throw new ImageProcessingServiceError(
        `Failed to generate variant ${variantConfig.name}: ${error.message}`,
        500,
        'variant'
      );
    }
  }

  /**
   * Get image metadata
   * 
   * @param {string} imagePath - Path to image file
   * @returns {Promise<Object>} Image metadata
   */
  async getImageMetadata(imagePath) {
    try {
      const metadata = await sharp(imagePath).metadata();
      const fs = require('fs');
      const stats = fs.statSync(imagePath);
      
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: stats.size,
        mimeType: `image/${metadata.format.toLowerCase()}`,
        hasAlpha: metadata.hasAlpha,
        density: metadata.density,
        orientation: metadata.orientation
      };
    } catch (error) {
      console.error('[ImageProcessing] Error getting image metadata:', error);
      throw new ImageProcessingServiceError(
        `Failed to get image metadata: ${error.message}`,
        500,
        'metadata'
      );
    }
  }

  /**
   * Get relative path from absolute path
   * 
   * @param {string} absolutePath - Absolute file path
   * @returns {string} Relative path
   */
  getRelativePath(absolutePath) {
    const uploadsDir = path.join(__dirname, '../uploads');
    const relativePath = path.relative(uploadsDir, absolutePath);
    return relativePath.replace(/\\/g, '/');
  }

  /**
   * Remove EXIF data from image
   * 
   * @param {string} inputPath - Path to input image
   * @param {string} outputPath - Path to output image
   * @returns {Promise<void>}
   */
  async removeExifData(inputPath, outputPath) {
    try {
      await sharp(inputPath)
        .rotate() // Auto-rotate based on EXIF
        .withMetadata({ orientation: undefined }) // Remove orientation
        .toFile(outputPath);
      
      console.log(`[ImageProcessing] Removed EXIF data: ${outputPath}`);
    } catch (error) {
      console.error('[ImageProcessing] Error removing EXIF data:', error);
      throw new ImageProcessingServiceError(
        `Failed to remove EXIF data: ${error.message}`,
        500,
        'exif'
      );
    }
  }

  /**
   * Standardize color profile to sRGB
   * 
   * @param {string} inputPath - Path to input image
   * @param {string} outputPath - Path to output image
   * @returns {Promise<void>}
   */
  async standardizeColorProfile(inputPath, outputPath) {
    try {
      await sharp(inputPath)
        .toColorspace('srgb')
        .toFile(outputPath);
      
      console.log(`[ImageProcessing] Standardized color profile: ${outputPath}`);
    } catch (error) {
      console.error('[ImageProcessing] Error standardizing color profile:', error);
      throw new ImageProcessingServiceError(
        `Failed to standardize color profile: ${error.message}`,
        500,
        'colorProfile'
      );
    }
  }

  /**
   * Batch process multiple images
   * 
   * @param {Array<string>} inputPaths - Array of image paths
   * @param {Object} options - Processing options
   * @returns {Promise<Array>} Array of processing results
   */
  async batchProcessImages(inputPaths, options = {}) {
    const results = [];
    const errors = [];
    
    for (let i = 0; i < inputPaths.length; i++) {
      try {
        const result = await this.processImage(inputPaths[i], options);
        results.push(result);
      } catch (error) {
        console.error(`[ImageProcessing] Error processing image ${i + 1}/${inputPaths.length}:`, error);
        errors.push({
          index: i,
          path: inputPaths[i],
          error: error.message
        });
      }
    }
    
    return {
      total: inputPaths.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors
    };
  }

  /**
   * Optimize image for web (reduce file size)
   * 
   * @param {string} inputPath - Path to input image
   * @param {number} quality - Compression quality (default 75)
   * @returns {Promise<Object>} Optimization result
   */
  async optimizeImage(inputPath, quality = 75) {
    try {
      const ext = path.extname(inputPath);
      const outputPath = inputPath.replace(ext, `_optimized${ext}`);
      
      const fs = require('fs');
      const inputStats = fs.statSync(inputPath);
      
      await sharp(inputPath)
        .toColorspace('srgb')
        .jpeg({ quality, progressive: true, mozjpeg: true })
        .toFile(outputPath);
      
      const outputStats = fs.statSync(outputPath);
      const compressionRatio = ((1 - (outputStats.size / inputStats.size)) * 100).toFixed(2);
      
      console.log(`[ImageProcessing] Optimized image: ${outputPath} (${inputStats.size} -> ${outputStats.size} bytes, ${compressionRatio}% reduction)`);
      
      return {
        success: true,
        inputPath,
        outputPath,
        inputSize: inputStats.size,
        outputSize: outputStats.size,
        compressionRatio: parseFloat(compressionRatio),
        url: this.getRelativePath(outputPath)
      };
    } catch (error) {
      console.error('[ImageProcessing] Error optimizing image:', error);
      throw new ImageProcessingServiceError(
        `Failed to optimize image: ${error.message}`,
        500,
        'optimization'
      );
    }
  }

  /**
   * Generate thumbnail from image
   * 
   * @param {string} inputPath - Path to input image
   * @param {number} size - Thumbnail size (default 50)
   * @param {number} quality - Compression quality (default 70)
   * @returns {Promise<Object>} Thumbnail information
   */
  async generateThumbnail(inputPath, size = 50, quality = 70) {
    try {
      const ext = path.extname(inputPath);
      const baseName = path.basename(inputPath, ext);
      const thumbnailPath = inputPath.replace(ext, `_thumb${ext}`);
      
      await sharp(inputPath)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality })
        .toFile(thumbnailPath);
      
      const stats = require('fs').statSync(thumbnailPath);
      const metadata = await sharp(thumbnailPath).metadata();
      
      console.log(`[ImageProcessing] Generated thumbnail: ${thumbnailPath} (${stats.size} bytes, ${metadata.width}x${metadata.height})`);
      
      return {
        path: thumbnailPath,
        url: this.getRelativePath(thumbnailPath),
        width: metadata.width,
        height: metadata.height,
        fileSizeBytes: stats.size,
        quality
      };
    } catch (error) {
      console.error('[ImageProcessing] Error generating thumbnail:', error);
      throw new ImageProcessingServiceError(
        `Failed to generate thumbnail: ${error.message}`,
        500,
        'thumbnail'
      );
    }
  }

  /**
   * Validate image before processing
   * 
   * @param {string} imagePath - Path to image file
   * @returns {Promise<Object>} Validation result
   */
  async validateImage(imagePath) {
    try {
      const metadata = await sharp(imagePath).metadata();
      const errors = [];
      
      // Check if image is too small
      if (metadata.width < 50 || metadata.height < 50) {
        errors.push('Image dimensions too small (minimum 50x50)');
      }
      
      // Check if image is too large
      if (metadata.width > 10000 || metadata.height > 10000) {
        errors.push('Image dimensions too large (maximum 10000x10000)');
      }
      
      // Check format
      const validFormats = ['jpeg', 'png', 'webp', 'gif', 'svg'];
      if (!validFormats.includes(metadata.format.toLowerCase())) {
        errors.push(`Unsupported image format: ${metadata.format}`);
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: metadata.size
        }
      };
    } catch (error) {
      console.error('[ImageProcessing] Error validating image:', error);
      return {
        isValid: false,
        errors: [`Failed to validate image: ${error.message}`]
      };
    }
  }

  /**
   * Convert image to different format
   * 
   * @param {string} inputPath - Path to input image
   * @param {string} outputFormat - Output format (jpeg, png, webp)
   * @param {number} quality - Compression quality
   * @returns {Promise<Object>} Conversion result
   */
  async convertImage(inputPath, outputFormat, quality = 75) {
    try {
      const ext = path.extname(inputPath);
      const outputPath = inputPath.replace(ext, `.${outputFormat}`);
      
      const fs = require('fs');
      const inputStats = fs.statSync(inputPath);
      
      let pipeline = sharp(inputPath).toColorspace('srgb');
      
      // Apply format-specific options
      if (outputFormat === 'jpeg' || outputFormat === 'jpg') {
        pipeline = pipeline.jpeg({ quality, progressive: true });
      } else if (outputFormat === 'png') {
        pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
      } else if (outputFormat === 'webp') {
        pipeline = pipeline.webp({ quality });
      }
      
      await pipeline.toFile(outputPath);
      
      const outputStats = fs.statSync(outputPath);
      const compressionRatio = ((1 - (outputStats.size / inputStats.size)) * 100).toFixed(2);
      
      console.log(`[ImageProcessing] Converted image: ${inputPath} -> ${outputPath} (${inputStats.size} -> ${outputStats.size} bytes, ${compressionRatio}% change)`);
      
      return {
        success: true,
        inputPath,
        outputPath,
        inputSize: inputStats.size,
        outputSize: outputStats.size,
        compressionRatio: parseFloat(compressionRatio),
        url: this.getRelativePath(outputPath),
        format: outputFormat
      };
    } catch (error) {
      console.error('[ImageProcessing] Error converting image:', error);
      throw new ImageProcessingServiceError(
        `Failed to convert image: ${error.message}`,
        500,
        'conversion'
      );
    }
  }

  /**
   * Get processing status for an image
   * 
   * @param {string} imagePath - Path to image file
   * @returns {Promise<Object>} Processing status
   */
  async getProcessingStatus(imagePath) {
    try {
      const fs = require('fs');
      
      // Check for various output files
      const baseName = path.basename(imagePath, path.extname(imagePath));
      const dir = path.dirname(imagePath);
      const files = fs.readdirSync(dir);
      
      const hasOptimized = files.some(f => f.includes('_optimized'));
      const hasWebP = files.some(f => f.includes('.webp'));
      const hasThumbnail = files.some(f => f.includes('_thumb'));
      const hasVariants = files.some(f => 
        f.includes('_large') || 
        f.includes('_medium') || 
        f.includes('_small')
      );
      
      return {
        imagePath,
        hasOriginal: true,
        hasOptimized,
        hasWebP,
        hasThumbnail,
        hasVariants,
        isFullyProcessed: hasOptimized && hasThumbnail && hasVariants,
        totalFiles: files.length
      };
    } catch (error) {
      console.error('[ImageProcessing] Error getting processing status:', error);
      throw new ImageProcessingServiceError(
        `Failed to get processing status: ${error.message}`,
        500,
        'status'
      );
    }
  }

  /**
   * Clean up temporary files
   * 
   * @param {string} basePath - Base path to clean
   * @returns {Promise<number>} Number of files cleaned up
   */
  async cleanupTempFiles(basePath) {
    try {
      const fs = require('fs');
      const dir = path.dirname(basePath);
      const files = fs.readdirSync(dir);
      
      let cleanedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        
        // Only clean up temp files (ending with .tmp)
        if (file.endsWith('.tmp')) {
          await fs.promises.unlink(filePath);
          cleanedCount++;
          console.log(`[ImageProcessing] Cleaned up temp file: ${filePath}`);
        }
      }
      
      return cleanedCount;
    } catch (error) {
      console.error('[ImageProcessing] Error cleaning up temp files:', error);
      throw new ImageProcessingServiceError(
        `Failed to cleanup temp files: ${error.message}`,
        500,
        'cleanup'
      );
    }
  }
}

// Export singleton instance
const imageProcessingService = new ImageProcessingService();

module.exports = {
  ImageProcessingService,
  ImageProcessingServiceError,
  imageProcessingService,
  DEFAULT_IMAGE_VARIANTS
};
