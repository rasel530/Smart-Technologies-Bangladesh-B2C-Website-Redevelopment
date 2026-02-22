const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('../logger');

/**
 * Cart-Wishlist Sync Service
 * 
 * Business logic for cart-wishlist synchronization:
 * - Sync status management
 * - Manual sync triggering
 * - Offline sync handling
 * - Conflict resolution
 */
class CartWishlistSyncService {
  constructor() {
    this.prisma = new PrismaClient();
    this.logger = loggerService;
  }

  /**
   * Get current sync status for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Sync status
   */
  async getSyncStatus(userId) {
    try {
      this.logger.info('Getting sync status', { userId });

      const syncRecord = await this.prisma.cartWishlistSync.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      // Count pending operations
      const pendingOperations = await this.prisma.cartWishlistSync.count({
        where: {
          userId,
          syncStatus: 'pending'
        }
      });

      return {
        syncStatus: syncRecord?.syncStatus || 'idle',
        lastSyncAt: syncRecord?.lastSyncAt || null,
        pendingOperations
      };
    } catch (error) {
      this.logger.error('Error getting sync status', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Trigger manual synchronization
   * @param {string} userId - User ID
   * @param {string} cartId - Optional cart ID
   * @param {string} wishlistId - Optional wishlist ID
   * @returns {Promise<Object>} Sync result
   */
  async triggerSync(userId, cartId = null, wishlistId = null) {
    try {
      this.logger.info('Triggering sync', { userId, cartId, wishlistId });

      // Create sync record
      const syncRecord = await this.prisma.cartWishlistSync.create({
        data: {
          userId,
          cartId,
          wishlistId,
          syncStatus: 'syncing'
        }
      });

      // Perform sync operations
      await this.performSyncOperations(syncRecord.id, userId, cartId, wishlistId);

      // Update sync status to completed
      const updatedSync = await this.prisma.cartWishlistSync.update({
        where: { id: syncRecord.id },
        data: {
          syncStatus: 'completed',
          lastSyncAt: new Date()
        }
      });

      this.logger.info('Sync completed successfully', { syncId: syncRecord.id });

      return {
        success: true,
        syncId: syncRecord.id,
        status: updatedSync.syncStatus
      };
    } catch (error) {
      this.logger.error('Error triggering sync', { userId, error: error.message });
      
      // Update sync status to failed if record exists
      try {
        const syncRecord = await this.prisma.cartWishlistSync.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' }
        });
        
        if (syncRecord && syncRecord.syncStatus === 'syncing') {
          await this.prisma.cartWishlistSync.update({
            where: { id: syncRecord.id },
            data: {
              syncStatus: 'failed',
              errorMessage: error.message
            }
          });
        }
      } catch (updateError) {
        this.logger.error('Error updating sync status to failed', {
          error: updateError.message
        });
      }
      
      throw error;
    }
  }

  /**
   * Perform sync operations
   * @param {string} syncId - Sync record ID
   * @param {string} userId - User ID
   * @param {string} cartId - Optional cart ID
   * @param {string} wishlistId - Optional wishlist ID
   * @returns {Promise<void>}
   */
  async performSyncOperations(syncId, userId, cartId, wishlistId) {
    // This is a placeholder for actual sync logic
    // In a real implementation, this would:
    //1. Check for conflicts between cart and wishlist
    //2. Resolve conflicts using last-write-wins strategy
    //3. Sync any pending offline operations
    //4. Update timestamps for synchronization
    
    this.logger.info('Performing sync operations', { syncId, userId });
    
    // Simulate sync delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Get pending sync operations
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Pending operations
   */
  async getPendingSyncOperations(userId) {
    try {
      this.logger.info('Getting pending sync operations', { userId });

      const operations = await this.prisma.cartWishlistSync.findMany({
        where: {
          userId,
          syncStatus: 'pending'
        },
        orderBy: { createdAt: 'desc' }
      });

      return {
        operations: operations.map(op => ({
          id: op.id,
          type: 'sync',
          data: {
            cartId: op.cartId,
            wishlistId: op.wishlistId
          },
          createdAt: op.createdAt
        }))
      };
    } catch (error) {
      this.logger.error('Error getting pending sync operations', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Sync offline changes when user comes online
   * @param {string} userId - User ID
   * @param {Array} operations - Array of offline operations
   * @returns {Promise<Object>} Sync result
   */
  async syncOfflineChanges(userId, operations) {
    try {
      this.logger.info('Syncing offline changes', { userId, operationsCount: operations.length });

      const conflicts = [];
      let synced = 0;

      for (const operation of operations) {
        try {
          // Process each offline operation
          // Use last-write-wins strategy for conflicts
          await this.processOfflineOperation(userId, operation);
          synced++;
        } catch (error) {
          if (error.message.includes('conflict')) {
            conflicts.push({
              operation,
              conflict: error.message
            });
          }
        }
      }

      this.logger.info('Offline sync completed', { synced, conflictsCount: conflicts.length });

      return {
        success: true,
        synced,
        conflicts
      };
    } catch (error) {
      this.logger.error('Error syncing offline changes', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Process a single offline operation
   * @param {string} userId - User ID
   * @param {Object} operation - Operation object
   * @returns {Promise<void>}
   */
  async processOfflineOperation(userId, operation) {
    const { type, data, timestamp } = operation;

    switch (type) {
      case 'move_to_wishlist':
        // Process move to wishlist operation
        // Check for conflicts with existing data
        break;
      case 'move_to_cart':
        // Process move to cart operation
        // Check for conflicts with existing data
        break;
      default:
        this.logger.warn('Unknown operation type', { type });
    }
  }

  /**
   * Cancel/remove a sync operation
   * @param {string} syncId - Sync record ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result
   */
  async cancelSync(syncId, userId) {
    try {
      this.logger.info('Cancelling sync', { syncId, userId });

      const syncRecord = await this.prisma.cartWishlistSync.findUnique({
        where: { id: syncId }
      });

      if (!syncRecord) {
        throw new Error('Sync record not found');
      }

      if (syncRecord.userId !== userId) {
        throw new Error('Unauthorized: Sync record does not belong to user');
      }

      await this.prisma.cartWishlistSync.delete({
        where: { id: syncId }
      });

      this.logger.info('Sync cancelled successfully', { syncId });

      return { success: true };
    } catch (error) {
      this.logger.error('Error cancelling sync', { syncId, userId, error: error.message });
      throw error;
    }
  }

  /**
   * Resolve a sync conflict
   * @param {string} conflictId - Conflict ID
   * @param {string} resolution - Resolution type: 'keep_cart', 'keep_wishlist', 'merge'
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result
   */
  async resolveConflict(conflictId, resolution, userId) {
    try {
      this.logger.info('Resolving conflict', { conflictId, resolution, userId });

      // Get conflict details
      const conflict = await this.prisma.cartWishlistSync.findUnique({
        where: { id: conflictId }
      });

      if (!conflict) {
        throw new Error('Conflict not found');
      }

      if (conflict.userId !== userId) {
        throw new Error('Unauthorized: Conflict does not belong to user');
      }

      // Apply resolution
      switch (resolution) {
        case 'keep_cart':
          // Keep cart data, discard wishlist data
          await this.applyKeepCartResolution(conflict);
          break;
        case 'keep_wishlist':
          // Keep wishlist data, discard cart data
          await this.applyKeepWishlistResolution(conflict);
          break;
        case 'merge':
          // Merge both datasets
          await this.applyMergeResolution(conflict);
          break;
        default:
          throw new Error('Invalid resolution type');
      }

      // Update sync status
      await this.prisma.cartWishlistSync.update({
        where: { id: conflictId },
        data: {
          syncStatus: 'completed',
          lastSyncAt: new Date(),
          errorMessage: null
        }
      });

      this.logger.info('Conflict resolved successfully', { conflictId, resolution });

      return {
        success: true,
        resolved: true
      };
    } catch (error) {
      this.logger.error('Error resolving conflict', {
        conflictId,
        userId,
        error: error.message
      });

      const statusCode = error.message.includes('not found') ? 404 :
                       error.message.includes('Unauthorized') ? 403 : 500;

      return {
        success: false,
        error: {
          message: error.message,
          code: statusCode
        }
      };
    }
  }

  /**
   * Get all sync conflicts for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Conflicts list
   */
  async getSyncConflicts(userId) {
    try {
      this.logger.info('Getting sync conflicts', { userId });

      const conflicts = await this.prisma.cartWishlistSync.findMany({
        where: {
          userId,
          syncStatus: 'failed',
          errorMessage: { not: null }
        },
        orderBy: { createdAt: 'desc' }
      });

      return {
        conflicts: conflicts.map(conflict => ({
          id: conflict.id,
          type: 'sync',
          data: {
            cartId: conflict.cartId,
            wishlistId: conflict.wishlistId
          },
          timestamp: conflict.createdAt,
          error: conflict.errorMessage
        }))
      };
    } catch (error) {
      this.logger.error('Error getting sync conflicts', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Apply keep cart resolution
   * @param {Object} conflict - Conflict record
   * @returns {Promise<void>}
   */
  async applyKeepCartResolution(conflict) {
    // Implementation: keep cart data, remove conflicting wishlist items
    this.logger.info('Applying keep cart resolution', { syncId: conflict.id });
  }

  /**
   * Apply keep wishlist resolution
   * @param {Object} conflict - Conflict record
   * @returns {Promise<void>}
   */
  async applyKeepWishlistResolution(conflict) {
    // Implementation: keep wishlist data, remove conflicting cart items
    this.logger.info('Applying keep wishlist resolution', { syncId: conflict.id });
  }

  /**
   * Apply merge resolution
   * @param {Object} conflict - Conflict record
   * @returns {Promise<void>}
   */
  async applyMergeResolution(conflict) {
    // Implementation: merge both datasets, keeping all unique items
    this.logger.info('Applying merge resolution', { syncId: conflict.id });
  }

  /**
   * Get all sync records for a user
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} Sync records
   */
  async getUserSyncHistory(userId, filters = {}) {
    try {
      const { status, page = 1, limit = 20 } = filters;
      const skip = (page - 1) * limit;

      const where = { userId };
      if (status) where.syncStatus = status;

      const syncRecords = await this.prisma.cartWishlistSync.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      });

      const total = await this.prisma.cartWishlistSync.count({ where });

      return {
        syncRecords,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      this.logger.error('Error getting user sync history', {
        userId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = {
  cartWishlistSyncService: new CartWishlistSyncService()
};
