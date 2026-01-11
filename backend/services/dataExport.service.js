const { PrismaClient } = require('@prisma/client');

// Helper function to get correct Prisma model name
function getPrismaModelName(modelName) {
  const modelMap = {
    'UserNotificationPreferences': 'userNotificationPreferences',
    'UserCommunicationPreferences': 'userCommunicationPreferences',
    'UserPrivacySettings': 'userPrivacySettings',
    'AccountDeletionRequests': 'accountDeletionRequests',
    'UserDataExports': 'userDataExports'
  };
  return modelMap[modelName] || modelName;
}
const { loggerService } = require('./logger');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const prisma = new PrismaClient();

/**
 * Data Export Service
 * Handles user data export requests and file generation
 */
class DataExportService {
  constructor() {
    this.prisma = prisma;
    this.logger = loggerService;
    this.exportDir = path.join(__dirname, '..', 'exports');
  }

  /**
   * Request data export
   * @param {string} userId - User ID
   * @param {Array} dataTypes - Types of data to export
   * @param {string} format - Export format ('json' or 'csv')
   * @returns {Promise<Object>} Export request details
   */
  async requestDataExport(userId, dataTypes, format) {
    try {
      // Validate data types
      const validDataTypes = ['profile', 'orders', 'addresses', 'wishlist'];
      const invalidTypes = dataTypes.filter(type => !validDataTypes.includes(type));
      
      if (invalidTypes.length > 0) {
        throw new Error(`Invalid data types: ${invalidTypes.join(', ')}`);
      }

      // Validate format
      if (!['json', 'csv'].includes(format)) {
        throw new Error('Invalid export format');
      }

      // Check if there's already a pending export
      const existingExport = await this.prisma.userDataExports.findFirst({
        where: {
          userId,
          status: 'processing'
        }
      });

      if (existingExport) {
        throw new Error('You already have a pending export request');
      }

      // Generate export token
      const exportToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Create export record
      const exportRecord = await this.prisma.userDataExports.create({
        data: {
          userId,
          exportToken,
          dataTypes,
          format,
          status: 'processing',
          requestedAt: new Date(),
          expiresAt
        }
      });

      // Process export asynchronously
      this.processExport(exportRecord.id, userId, dataTypes, format)
        .catch(error => {
          this.logger.error('Error processing export', error);
          this.prisma.userDataExports.update({
            where: { id: exportRecord.id },
            data: { status: 'expired' }
          });
        });

      // Log export request for audit
      this.logger.info('Data export requested', {
        userId,
        dataTypes,
        format,
        exportToken,
        timestamp: new Date().toISOString()
      });

      return {
        exportId: exportRecord.id,
        exportToken,
        status: 'processing',
        expiresAt
      };
    } catch (error) {
      this.logger.error('Error requesting data export', error);
      throw error;
    }
  }

  /**
   * Process export (gather data and generate file)
   * @param {string} exportId - Export record ID
   * @param {string} userId - User ID
   * @param {Array} dataTypes - Types of data to export
   * @param {string} format - Export format
   */
  async processExport(exportId, userId, dataTypes, format) {
    try {
      // Gather user data
      const userData = await this.gatherUserData(userId, dataTypes);

      // Generate file
      let fileUrl;
      if (format === 'json') {
        fileUrl = await this.generateJsonFile(exportId, userData);
      } else if (format === 'csv') {
        fileUrl = await this.generateCsvFile(exportId, userData);
      }

      // Update export record with file URL
      await this.prisma.userDataExports.update({
        where: { id: exportId },
        data: {
          fileUrl,
          status: 'ready',
          readyAt: new Date()
        }
      });

      this.logger.info('Export processed', {
        exportId,
        userId,
        format,
        fileUrl
      });
    } catch (error) {
      this.logger.error('Error processing export', error);
      throw error;
    }
  }

  /**
   * Gather user data based on requested types
   * @param {string} userId - User ID
   * @param {Array} dataTypes - Types of data to gather
   * @returns {Promise<Object>} User data
   */
  async gatherUserData(userId, dataTypes) {
    try {
      const userData = {
        exportDate: new Date().toISOString(),
        userId
      };

      // Gather profile data
      if (dataTypes.includes('profile')) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            gender: true,
            role: true,
            status: true,
            emailVerified: true,
            phoneVerified: true,
            preferredLanguage: true,
            createdAt: true,
            updatedAt: true
          }
        });

        if (user) {
          userData.profile = {
            id: user.id,
            email: user.email,
            phone: user.phone,
            firstName: user.firstName,
            lastName: user.lastName,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
            role: user.role,
            status: user.status,
            emailVerified: !!user.emailVerified,
            phoneVerified: !!user.phoneVerified,
            preferredLanguage: user.preferredLanguage,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          };
        }
      }

      // Gather orders data
      if (dataTypes.includes('orders')) {
        const orders = await this.prisma.order.findMany({
          where: { userId },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
            items: {
              select: {
                productId: true,
                quantity: true,
                price: true,
                product: {
                  select: {
                    name: true,
                    sku: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        userData.orders = orders.map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.total,
          createdAt: order.createdAt,
          itemCount: order.items.length,
          items: order.items.map(item => ({
            productId: item.productId,
            productName: item.product.name,
            productSku: item.product.sku,
            quantity: item.quantity,
            price: item.price
          }))
        }));
      }

      // Gather addresses data
      if (dataTypes.includes('addresses')) {
        const addresses = await this.prisma.address.findMany({
          where: { userId },
          select: {
            id: true,
            type: true,
            firstName: true,
            lastName: true,
            phone: true,
            address: true,
            addressLine2: true,
            city: true,
            district: true,
            division: true,
            upazila: true,
            postalCode: true,
            isDefault: true,
            createdAt: true
          }
        });

        userData.addresses = addresses.map(addr => ({
          id: addr.id,
          type: addr.type,
          firstName: addr.firstName,
          lastName: addr.lastName,
          phone: addr.phone,
          address: addr.address,
          addressLine2: addr.addressLine2,
          city: addr.city,
          district: addr.district,
          division: addr.division,
          upazila: addr.upazila,
          postalCode: addr.postalCode,
          isDefault: addr.isDefault,
          createdAt: addr.createdAt
        }));
      }

      // Gather wishlist data
      if (dataTypes.includes('wishlist')) {
        const wishlist = await this.prisma.wishlist.findMany({
          where: { userId },
          select: {
            id: true,
            productId: true,
            createdAt: true,
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
                description: true,
                images: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        userData.wishlist = wishlist.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          productSku: item.product.sku,
          price: item.product.price,
          description: item.product.description,
          images: item.product.images,
          addedAt: item.createdAt
        }));
      }

      return userData;
    } catch (error) {
      this.logger.error('Error gathering user data', error);
      throw error;
    }
  }

  /**
   * Generate JSON export file
   * @param {string} exportId - Export record ID
   * @param {Object} userData - User data to export
   * @returns {Promise<string>} File URL
   */
  async generateJsonFile(exportId, userData) {
    try {
      // Ensure export directory exists
      await fs.mkdir(this.exportDir, { recursive: true });

      // Generate filename
      const filename = `export_${exportId}_${Date.now()}.json`;
      const filepath = path.join(this.exportDir, filename);

      // Write JSON file
      await fs.writeFile(filepath, JSON.stringify(userData, null, 2), 'utf8');

      // Return file URL (relative path for now, in production would use S3/CloudFront)
      return `/exports/${filename}`;
    } catch (error) {
      this.logger.error('Error generating JSON file', error);
      throw error;
    }
  }

  /**
   * Generate CSV export file
   * @param {string} exportId - Export record ID
   * @param {Object} userData - User data to export
   * @returns {Promise<string>} File URL
   */
  async generateCsvFile(exportId, userData) {
    try {
      // Ensure export directory exists
      await fs.mkdir(this.exportDir, { recursive: true });

      // Generate filename
      const filename = `export_${exportId}_${Date.now()}.csv`;
      const filepath = path.join(this.exportDir, filename);

      // Build CSV content
      let csvContent = '';

      // Add profile data
      if (userData.profile) {
        csvContent += '=== PROFILE ===\n';
        csvContent += this.objectToCsvRow(userData.profile);
        csvContent += '\n';
      }

      // Add orders data
      if (userData.orders && userData.orders.length > 0) {
        csvContent += '=== ORDERS ===\n';
        csvContent += 'Order Number,Status,Total,Item Count,Created At\n';
        userData.orders.forEach(order => {
          csvContent += `${order.orderNumber},${order.status},${order.total},${order.itemCount},${order.createdAt}\n`;
        });
        csvContent += '\n';
      }

      // Add addresses data
      if (userData.addresses && userData.addresses.length > 0) {
        csvContent += '=== ADDRESSES ===\n';
        csvContent += 'Type,Name,Phone,Address,City,District,Division,Postal Code,Is Default\n';
        userData.addresses.forEach(addr => {
          const fullName = `${addr.firstName} ${addr.lastName}`;
          csvContent += `${addr.type},"${fullName}","${addr.phone}","${addr.address}","${addr.city}","${addr.district}","${addr.division}","${addr.postalCode}",${addr.isDefault}\n`;
        });
        csvContent += '\n';
      }

      // Add wishlist data
      if (userData.wishlist && userData.wishlist.length > 0) {
        csvContent += '=== WISHLIST ===\n';
        csvContent += 'Product Name,SKU,Price,Added At\n';
        userData.wishlist.forEach(item => {
          csvContent += `"${item.productName}","${item.productSku}",${item.price},${item.addedAt}\n`;
        });
      }

      // Write CSV file
      await fs.writeFile(filepath, csvContent, 'utf8');

      // Return file URL
      return `/exports/${filename}`;
    } catch (error) {
      this.logger.error('Error generating CSV file', error);
      throw error;
    }
  }

  /**
   * Convert object to CSV row
   * @param {Object} obj - Object to convert
   * @returns {string} CSV row
   */
  objectToCsvRow(obj) {
    return Object.entries(obj)
      .map(([key, value]) => {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        return `"${key}","${stringValue}"`;
      })
      .join(',');
  }

  /**
   * Get export status
   * @param {string} userId - User ID
   * @returns {Promise<Array>} List of export records
   */
  async getExportHistory(userId) {
    try {
      const exports = await this.prisma.userDataExports.findMany({
        where: { userId },
        orderBy: { requestedAt: 'desc' },
        take: 10
      });

      return exports.map(exp => ({
        id: exp.id,
        dataTypes: exp.dataTypes,
        format: exp.format,
        status: exp.status,
        requestedAt: exp.requestedAt,
        readyAt: exp.readyAt,
        expiresAt: exp.expiresAt,
        downloadUrl: exp.fileUrl
      }));
    } catch (error) {
      this.logger.error('Error getting export history', error);
      throw error;
    }
  }

  /**
   * Get export by ID
   * @param {string} exportId - Export record ID
   * @param {string} userId - User ID (for ownership check)
   * @returns {Promise<Object>} Export record
   */
  async getExportById(exportId, userId) {
    try {
      const exportRecord = await this.prisma.userDataExports.findUnique({
        where: { id: exportId }
      });

      if (!exportRecord) {
        throw new Error('Export not found');
      }

      // Verify ownership
      if (exportRecord.userId !== userId) {
        throw new Error('Access denied');
      }

      // Check if expired
      if (exportRecord.expiresAt < new Date()) {
        throw new Error('Export has expired');
      }

      return exportRecord;
    } catch (error) {
      this.logger.error('Error getting export', error);
      throw error;
    }
  }

  /**
   * Clean up expired exports
   * This should be called by a scheduled job
   */
  async cleanupExpiredExports() {
    try {
      const expiredExports = await this.prisma.userDataExports.findMany({
        where: {
          expiresAt: {
            lt: new Date()
          },
          status: 'ready'
        }
      });

      if (expiredExports.length > 0) {
        // Update status to expired
        await this.prisma.userDataExports.updateMany({
          where: {
            id: {
              in: expiredExports.map(e => e.id)
            }
          },
          data: {
            status: 'expired'
          }
        });

        // Delete files (in production, would delete from S3/CloudFront)
        for (const exp of expiredExports) {
          if (exp.fileUrl) {
            const filepath = path.join(this.exportDir, exp.fileUrl.replace('/exports/', ''));
            try {
              await fs.unlink(filepath);
            } catch (error) {
              this.logger.warn('Failed to delete export file', { filepath, error: error.message });
            }
          }
        }

        this.logger.info(`Cleaned up ${expiredExports.length} expired exports`);
      }
    } catch (error) {
      this.logger.error('Error cleaning up expired exports', error);
    }
  }
}

// Singleton instance
const dataExportService = new DataExportService();

module.exports = {
  DataExportService,
  dataExportService
};
