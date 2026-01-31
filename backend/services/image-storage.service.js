/**
 * Image Storage Service
 * 
 * Handles file storage operations for product images including
 * directory management, file operations, and cleanup of orphaned files.
 */

const fs = require('fs');
const path = require('path');

/**
 * Custom error class for Image Storage Service
 */
class ImageStorageServiceError extends Error {
  constructor(message, statusCode = 500, field = null) {
    super(message);
    this.name = 'ImageStorageServiceError';
    this.statusCode = statusCode;
    this.field = field;
  }
}

/**
 * Image Storage Service Class
 */
class ImageStorageService {
  constructor() {
    this.baseUploadDir = path.join(__dirname, '../uploads/products');
    this.ensureUploadDirectory();
    // Use BACKEND_URL if set, otherwise construct from HOST and PORT
    // In Docker, use the public URL that frontend can access
    this.backendUrl = process.env.BACKEND_URL || (() => {
      const host = process.env.HOST || 'localhost';
      const port = process.env.PORT || 3001;
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      return `${protocol}://${host}:${port}`;
    })();
    
    // Log the backend URL for debugging
    console.log(`[ImageStorage] Backend URL configured as: ${this.backendUrl}`);
  }

  /**
   * Ensure upload directory exists
   */
  ensureUploadDirectory() {
    if (!fs.existsSync(this.baseUploadDir)) {
      fs.mkdirSync(this.baseUploadDir, { recursive: true });
      console.log(`[ImageStorage] Created upload directory: ${this.baseUploadDir}`);
    }
  }

  /**
   * Get upload directory for a specific product
   * 
   * @param {string} productId - The product ID
   * @returns {string} Product upload directory path
   */
  getProductUploadDir(productId) {
    const productDir = path.join(this.baseUploadDir, productId);
    
    if (!fs.existsSync(productDir)) {
      fs.mkdirSync(productDir, { recursive: true });
      console.log(`[ImageStorage] Created product directory: ${productDir}`);
    }
    
    return productDir;
  }

  /**
   * Save uploaded file to product directory
   * 
   * @param {Object} file - The uploaded file object from multer
   * @param {string} productId - The product ID
   * @param {number} index - Index for multiple files
   * @returns {Promise<Object>} File information with path and URL
   */
  async saveUploadedFile(file, productId, index = 0) {
    try {
      const productDir = this.getProductUploadDir(productId);
      const ext = path.extname(file.originalname || file.name);
      const baseName = path.basename(file.originalname || file.name, ext);
      
      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.round(Math.random() * 1E9);
      const filename = `${timestamp}_${random}_${index}_${baseName}${ext}`;
      
      const filePath = path.join(productDir, filename);
      
      // Move file from temp location to permanent location
      await this.moveFile(file.path, filePath);
      
      const absoluteUrl = `${this.backendUrl}/uploads/products/${productId}/${filename}`;
      
      console.log(`[ImageStorage] Saved file: ${filePath}`);
      
      return {
        success: true,
        filePath,
        filename,
        url: absoluteUrl,
        originalName: file.originalname || file.name,
        size: file.size,
        mimeType: file.mimetype
      };
    } catch (error) {
      console.error('[ImageStorage] Error saving uploaded file:', error);
      throw new ImageStorageServiceError(
        `Failed to save uploaded file: ${error.message}`,
        500,
        'file'
      );
    }
  }

  /**
   * Move file from source to destination
   * Handles concurrent file operations safely
   * 
   * @param {string} sourcePath - Source file path
   * @param {string} destPath - Destination file path
   * @returns {Promise<void>}
   */
  async moveFile(sourcePath, destPath) {
    return new Promise((resolve, reject) => {
      // Use a unique temp file to handle concurrent operations
      const tempDestPath = `${destPath}.tmp`;
      
      const readStream = fs.createReadStream(sourcePath);
      const writeStream = fs.createWriteStream(tempDestPath);
      
      readStream.pipe(writeStream);
      
      writeStream.on('finish', () => {
        // Rename temp file to final destination
        fs.rename(tempDestPath, destPath, (renameError) => {
          if (renameError) {
            // Clean up temp file if rename fails
            if (fs.existsSync(tempDestPath)) {
              fs.unlinkSync(tempDestPath);
            }
            reject(renameError);
          } else {
            // Clean up source file
            if (fs.existsSync(sourcePath)) {
              fs.unlinkSync(sourcePath);
            }
            resolve();
          }
        });
      });
      
      writeStream.on('error', (error) => {
        reject(error);
      });
      
      readStream.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Delete file from storage
   * 
   * @param {string} filePath - The file path to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        console.log(`[ImageStorage] Deleted file: ${filePath}`);
        return true;
      }
      console.log(`[ImageStorage] File not found, skipping deletion: ${filePath}`);
      return false;
    } catch (error) {
      console.error('[ImageStorage] Error deleting file:', error);
      throw new ImageStorageServiceError(
        `Failed to delete file: ${error.message}`,
        500,
        'filePath'
      );
    }
  }

  /**
   * Delete all files for a product
   * 
   * @param {string} productId - The product ID
   * @returns {Promise<number>} Number of deleted files
   */
  async deleteProductFiles(productId) {
    try {
      const productDir = this.getProductUploadDir(productId);
      
      if (!fs.existsSync(productDir)) {
        const files = fs.readdirSync(productDir);
        let deletedCount = 0;
        
        for (const file of files) {
          const filePath = path.join(productDir, file);
          await fs.promises.unlink(filePath);
          deletedCount++;
        }
        
        // Remove empty directory
        fs.rmdirSync(productDir);
        
        console.log(`[ImageStorage] Deleted ${deletedCount} files for product ${productId}`);
        return deletedCount;
      }
      
      return 0;
    } catch (error) {
      console.error('[ImageStorage] Error deleting product files:', error);
      throw new ImageStorageServiceError(
        `Failed to delete product files: ${error.message}`,
        500,
        'productId'
      );
    }
  }

  /**
   * Soft delete file (mark for recovery)
   * Moves file to deleted directory with timestamp
   * 
   * @param {string} filePath - The file path to soft delete
   * @param {number} recoveryDays - Recovery window in days (default 30)
   * @returns {Promise<string>} Path to deleted file
   */
  async softDeleteFile(filePath, recoveryDays = 30) {
    try {
      if (!fs.existsSync(filePath)) {
        const deletedDir = path.join(this.baseUploadDir, '.deleted');
        
        // Ensure deleted directory exists
        if (!fs.existsSync(deletedDir)) {
          fs.mkdirSync(deletedDir, { recursive: true });
        }
        
        // Calculate deletion timestamp
        const timestamp = Date.now();
        const expiryTimestamp = timestamp + (recoveryDays * 24 * 60 * 60 * 1000);
        const filename = path.basename(filePath);
        const deletedFilename = `${timestamp}_${filename}`;
        const deletedPath = path.join(deletedDir, deletedFilename);
        
        // Move file to deleted directory
        await this.moveFile(filePath, deletedPath);
        
        // Create metadata file for recovery info
        const metadata = {
          originalPath: filePath,
          deletedAt: new Date(timestamp).toISOString(),
          expiresAt: new Date(expiryTimestamp).toISOString(),
          recoveryDays
        };
        const metadataPath = `${deletedPath}.meta.json`;
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        
        console.log(`[ImageStorage] Soft deleted file: ${filePath} -> ${deletedPath}`);
        return deletedPath;
      }
      
      return null;
    } catch (error) {
      console.error('[ImageStorage] Error soft deleting file:', error);
      throw new ImageStorageServiceError(
        `Failed to soft delete file: ${error.message}`,
        500,
        'filePath'
      );
    }
  }

  /**
   * Recover soft-deleted file
   * 
   * @param {string} deletedPath - The path to deleted file
   * @returns {Promise<string>} Recovered file path
   */
  async recoverFile(deletedPath) {
    try {
      if (!fs.existsSync(deletedPath)) {
        const metadataPath = `${deletedPath}.meta.json`;
        
        // Read metadata
        let metadata = {};
        if (fs.existsSync(metadataPath)) {
          const metadataContent = fs.readFileSync(metadataPath, 'utf8');
          metadata = JSON.parse(metadataContent);
        }
        
        const originalPath = metadata.originalPath;
        const originalDir = path.dirname(originalPath);
        
        // Ensure original directory exists
        if (!fs.existsSync(originalDir)) {
          fs.mkdirSync(originalDir, { recursive: true });
        }
        
        // Move file back to original location
        await this.moveFile(deletedPath, originalPath);
        
        // Delete metadata file
        if (fs.existsSync(metadataPath)) {
          fs.unlinkSync(metadataPath);
        }
        
        console.log(`[ImageStorage] Recovered file: ${deletedPath} -> ${originalPath}`);
        return originalPath;
      }
      
      throw new ImageStorageServiceError(
        'Deleted file not found',
        404,
        'deletedPath'
      );
    } catch (error) {
      console.error('[ImageStorage] Error recovering file:', error);
      throw new ImageStorageServiceError(
        `Failed to recover file: ${error.message}`,
        500,
        'deletedPath'
      );
    }
  }

  /**
   * Clean up expired soft-deleted files
   * 
   * @returns {Promise<number>} Number of cleaned up files
   */
  async cleanupExpiredFiles() {
    try {
      const deletedDir = path.join(this.baseUploadDir, '.deleted');
      
      if (!fs.existsSync(deletedDir)) {
        return 0;
      }
      
      const now = Date.now();
      const files = fs.readdirSync(deletedDir);
      let cleanedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(deletedDir, file);
        
        // Check for metadata file
        if (file.endsWith('.meta.json')) {
          const metadataContent = fs.readFileSync(filePath, 'utf8');
          const metadata = JSON.parse(metadataContent);
          
          // Check if expired
          const expiresAt = new Date(metadata.expiresAt).getTime();
          if (now > expiresAt) {
            // Delete both metadata and associated file
            const baseFile = file.replace('.meta.json', '');
            const baseFilePath = path.join(deletedDir, baseFile);
            
            if (fs.existsSync(baseFilePath)) {
              fs.unlinkSync(baseFilePath);
            }
            fs.unlinkSync(filePath);
            cleanedCount++;
          }
        }
      }
      
      console.log(`[ImageStorage] Cleaned up ${cleanedCount} expired files`);
      return cleanedCount;
    } catch (error) {
      console.error('[ImageStorage] Error cleaning up expired files:', error);
      throw new ImageStorageServiceError(
        `Failed to cleanup expired files: ${error.message}`,
        500
      );
    }
  }

  /**
   * Find and clean up orphaned files
   * Files that exist on disk but have no database record
   * 
   * @param {Array} dbFilePaths - Array of file paths from database
   * @returns {Promise<number>} Number of cleaned up orphaned files
   */
  async cleanupOrphanedFiles(dbFilePaths) {
    try {
      let cleanedCount = 0;
      
      // Get all files in uploads directory recursively
      const getAllFiles = (dir, fileList = []) => {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            getAllFiles(filePath, fileList);
          } else {
            fileList.push(filePath);
          }
        }
        
        return fileList;
      };
      
      const allFiles = getAllFiles(this.baseUploadDir);
      
      // Find orphaned files
      for (const filePath of allFiles) {
        // Skip deleted directory
        if (filePath.includes('.deleted')) {
          continue;
        }
        
        // Check if file exists in database
        const isOrphaned = !dbFilePaths.some(dbPath => {
          // Normalize paths for comparison
          const normalizedDbPath = dbPath.replace(/\\/g, '/');
          const normalizedFilePath = filePath.replace(/\\/g, '/');
          return normalizedFilePath.endsWith(normalizedDbPath) || 
                 normalizedDbPath.endsWith(normalizedFilePath);
        });
        
        if (isOrphaned) {
          await fs.promises.unlink(filePath);
          cleanedCount++;
          console.log(`[ImageStorage] Cleaned up orphaned file: ${filePath}`);
        }
      }
      
      console.log(`[ImageStorage] Cleaned up ${cleanedCount} orphaned files`);
      return cleanedCount;
    } catch (error) {
      console.error('[ImageStorage] Error cleaning up orphaned files:', error);
      throw new ImageStorageServiceError(
        `Failed to cleanup orphaned files: ${error.message}`,
        500
      );
    }
  }

  /**
   * Get total storage used by a product
   * 
   * @param {string} productId - The product ID
   * @returns {Promise<number>} Total storage in bytes
   */
  async getProductStorageUsage(productId) {
    try {
      const productDir = this.getProductUploadDir(productId);
      
      if (!fs.existsSync(productDir)) {
        return 0;
      }
      
      const files = fs.readdirSync(productDir);
      let totalBytes = 0;
      
      for (const file of files) {
        const filePath = path.join(productDir, file);
        const stat = fs.statSync(filePath);
        
        if (!stat.isDirectory()) {
          totalBytes += stat.size;
        }
      }
      
      return totalBytes;
    } catch (error) {
      console.error('[ImageStorage] Error calculating storage usage:', error);
      throw new ImageStorageServiceError(
        `Failed to calculate storage usage: ${error.message}`,
        500,
        'productId'
      );
    }
  }

  /**
   * Check if storage quota is exceeded for a product
   * 
   * @param {string} productId - The product ID
   * @param {number} additionalBytes - Additional bytes to add
   * @param {number} maxQuotaBytes - Maximum quota in bytes (default 50MB)
   * @returns {Promise<Object>} Quota check result
   */
  async checkStorageQuota(productId, additionalBytes, maxQuotaBytes = 50 * 1024 * 1024) {
    try {
      const currentUsage = await this.getProductStorageUsage(productId);
      const newUsage = currentUsage + additionalBytes;
      const isExceeded = newUsage > maxQuotaBytes;
      
      return {
        currentUsage,
        additionalBytes,
        newUsage,
        maxQuotaBytes,
        isExceeded,
        availableBytes: Math.max(0, maxQuotaBytes - currentUsage),
        usagePercentage: ((currentUsage / maxQuotaBytes) * 100).toFixed(2)
      };
    } catch (error) {
      console.error('[ImageStorage] Error checking storage quota:', error);
      throw new ImageStorageServiceError(
        `Failed to check storage quota: ${error.message}`,
        500,
        'productId'
      );
    }
  }

  /**
   * Get file information
   * 
   * @param {string} filePath - The file path
   * @returns {Object|null} File information or null if not found
   */
  getFileInfo(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }
      
      const stat = fs.statSync(filePath);
      return {
        path: filePath,
        size: stat.size,
        created: stat.birthtime,
        modified: stat.mtime,
        isDirectory: stat.isDirectory(),
        isFile: stat.isFile()
      };
    } catch (error) {
      console.error('[ImageStorage] Error getting file info:', error);
      return null;
    }
  }

  /**
   * Copy file to new location
   * 
   * @param {string} sourcePath - Source file path
   * @param {string} destPath - Destination file path
   * @returns {Promise<boolean>} Success status
   */
  async copyFile(sourcePath, destPath) {
    try {
      // Ensure destination directory exists
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      await fs.promises.copyFile(sourcePath, destPath);
      console.log(`[ImageStorage] Copied file: ${sourcePath} -> ${destPath}`);
      return true;
    } catch (error) {
      console.error('[ImageStorage] Error copying file:', error);
      throw new ImageStorageServiceError(
        `Failed to copy file: ${error.message}`,
        500,
        'filePath'
      );
    }
  }

  /**
   * Get all files for a product
   * 
   * @param {string} productId - The product ID
   * @returns {Promise<Array>} Array of file information
   */
  async getProductFiles(productId) {
    try {
      const productDir = this.getProductUploadDir(productId);
      
      if (!fs.existsSync(productDir)) {
        return [];
      }
      
      const files = fs.readdirSync(productDir);
      const fileInfos = [];
      
      for (const file of files) {
        const filePath = path.join(productDir, file);
        const stat = fs.statSync(filePath);
        
        if (!stat.isDirectory()) {
          fileInfos.push({
            filename: file,
            path: filePath,
            url: `${this.backendUrl}/uploads/products/${productId}/${file}`,
            size: stat.size,
            created: stat.birthtime,
            modified: stat.mtime
          });
        }
      }
      
      return fileInfos;
    } catch (error) {
      console.error('[ImageStorage] Error getting product files:', error);
      throw new ImageStorageServiceError(
        `Failed to get product files: ${error.message}`,
        500,
        'productId'
      );
    }
  }
}

// Export singleton instance
const imageStorageService = new ImageStorageService();

module.exports = {
  ImageStorageService,
  ImageStorageServiceError,
  imageStorageService
};
