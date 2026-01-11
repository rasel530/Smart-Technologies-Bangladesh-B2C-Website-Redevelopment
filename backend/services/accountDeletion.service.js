const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('./logger');
const { emailService } = require('./emailService');
const crypto = require('crypto');

const prisma = new PrismaClient();

/**
 * Account Deletion Service
 * Handles account deletion requests, confirmation, and cancellation
 */
class AccountDeletionService {
  constructor() {
    this.prisma = prisma;
    this.logger = loggerService;
    this.emailService = emailService;
  }

  /**
   * Request account deletion
   * @param {string} userId - User ID
   * @param {string} reason - Deletion reason
   * @returns {Promise<Object>} Deletion request details
   */
  async requestAccountDeletion(userId, reason = null) {
    try {
      // Check if there's already a pending deletion request
      const existingRequest = await this.prisma.accountDeletionRequests.findFirst({
        where: {
          userId,
          status: 'pending'
        }
      });

      if (existingRequest) {
        throw new Error('You already have a pending deletion request');
      }

      // Check if user has active orders
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          orders: {
            where: {
              status: {
                notIn: ['DELIVERED', 'CANCELLED', 'REFUNDED']
              }
            }
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.orders && user.orders.length > 0) {
        throw new Error('Cannot delete account with active orders');
      }

      // Generate deletion token
      const deletionToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      const scheduledDeletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      // Create deletion request
      const deletionRequest = await this.prisma.accountDeletionRequests.create({
        data: {
          userId,
          deletionToken,
          reason,
          status: 'pending',
          requestedAt: new Date(),
          expiresAt
        }
      });

      // Update user account status
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          accountStatus: 'pending_deletion',
          deletionRequestedAt: new Date()
        }
      });

      // Send confirmation email
      await this.sendDeletionConfirmationEmail(user, deletionToken, expiresAt);

      // Log deletion request for audit
      this.logger.info('Account deletion requested', {
        userId,
        email: user.email,
        reason,
        deletionToken,
        expiresAt,
        timestamp: new Date().toISOString()
      });

      return {
        deletionToken,
        expiresAt,
        scheduledDeletionDate
      };
    } catch (error) {
      this.logger.error('Error requesting account deletion', error);
      throw error;
    }
  }

  /**
   * Confirm account deletion with token
   * @param {string} userId - User ID
   * @param {string} deletionToken - Deletion token
   * @returns {Promise<boolean>} Success status
   */
  async confirmAccountDeletion(userId, deletionToken) {
    try {
      // Find deletion request
      const deletionRequest = await this.prisma.accountDeletionRequests.findUnique({
        where: { deletionToken }
      });

      if (!deletionRequest) {
        throw new Error('Invalid deletion token');
      }

      // Verify token belongs to user
      if (deletionRequest.userId !== userId) {
        throw new Error('Invalid deletion token');
      }

      // Check if token has expired
      if (deletionRequest.expiresAt < new Date()) {
        throw new Error('Deletion token has expired');
      }

      // Check if already confirmed
      if (deletionRequest.status !== 'pending') {
        throw new Error('Deletion request has already been processed');
      }

      // Update deletion request status
      await this.prisma.accountDeletionRequests.update({
        where: { id: deletionRequest.id },
        data: {
          status: 'confirmed',
          confirmedAt: new Date()
        }
      });

      // Update user account status
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          accountStatus: 'deleted',
          deletedAt: new Date(),
          deletionReason: deletionRequest.reason
        }
      });

      // Clean up related data (cascade delete handled by database)
      // Delete user sessions
      await this.prisma.userSession.deleteMany({
        where: { userId }
      });

      // Delete user preferences
      await this.prisma.userPreferences.deleteMany({
        where: { userId }
      });

      // Delete addresses
      await this.prisma.address.deleteMany({
        where: { userId }
      });

      // Delete cart
      await this.prisma.cart.deleteMany({
        where: { userId }
      });

      // Delete wishlist
      await this.prisma.wishlist.deleteMany({
        where: { userId }
      });

      // Delete email verification tokens
      await this.prisma.emailVerificationToken.deleteMany({
        where: { userId }
      });

      // Delete phone OTPs
      await this.prisma.phoneOTP.deleteMany({
        where: { userId }
      });

      // Delete password history
      await this.prisma.passwordHistory.deleteMany({
        where: { userId }
      });

      // Delete social accounts
      await this.prisma.userSocialAccount.deleteMany({
        where: { userId }
      });

      // Delete data exports
      await this.prisma.userDataExports.deleteMany({
        where: { userId }
      });

      // Log deletion completion for audit
      this.logger.info('Account deletion confirmed', {
        userId,
        deletionToken,
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      this.logger.error('Error confirming account deletion', error);
      throw error;
    }
  }

  /**
   * Cancel pending deletion request
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async cancelAccountDeletion(userId) {
    try {
      // Find pending deletion request
      const deletionRequest = await this.prisma.accountDeletionRequests.findFirst({
        where: {
          userId,
          status: 'pending'
        }
      });

      if (!deletionRequest) {
        throw new Error('No pending deletion request found');
      }

      // Update deletion request status
      await this.prisma.accountDeletionRequests.update({
        where: { id: deletionRequest.id },
        data: {
          status: 'cancelled'
        }
      });

      // Update user account status
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          accountStatus: 'active',
          deletionRequestedAt: null
        }
      });

      // Log cancellation for audit
      this.logger.info('Account deletion cancelled', {
        userId,
        deletionToken: deletionRequest.deletionToken,
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      this.logger.error('Error cancelling account deletion', error);
      throw error;
    }
  }

  /**
   * Get deletion status for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deletion status
   */
  async getDeletionStatus(userId) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          accountStatus: true,
          deletionRequestedAt: true,
          deletedAt: true,
          deletionReason: true,
          orders: {
            where: {
              status: {
                notIn: ['DELIVERED', 'CANCELLED', 'REFUNDED']
              }
            },
            select: {
              id: true,
              orderNumber: true,
              status: true
            }
          },
          accountDeletionRequests: {
            where: {
              status: 'pending'
            },
            orderBy: {
              requestedAt: 'desc'
            },
            take: 1,
            select: {
              id: true,
              deletionToken: true,
              expiresAt: true,
              reason: true,
              requestedAt: true,
              status: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const pendingRequest = user.accountDeletionRequests[0];

      return {
        accountStatus: user.accountStatus,
        deletionRequestedAt: user.deletionRequestedAt,
        deletedAt: user.deletedAt,
        deletionReason: user.deletionReason,
        hasPendingDeletion: !!pendingRequest,
        pendingDeletionRequest: pendingRequest ? {
          deletionToken: pendingRequest.deletionToken,
          expiresAt: pendingRequest.expiresAt,
          reason: pendingRequest.reason,
          requestedAt: pendingRequest.requestedAt
        } : null,
        hasActiveOrders: user.orders.length > 0,
        activeOrdersCount: user.orders.length,
        activeOrders: user.orders
      };
    } catch (error) {
      this.logger.error('Error getting deletion status', error);
      throw error;
    }
  }

  /**
   * Process expired deletion requests (scheduled job)
   * This should be called by a scheduled job
   */
  async processExpiredDeletions() {
    try {
      // Find confirmed deletion requests that haven't been completed
      const pendingDeletions = await this.prisma.accountDeletionRequests.findMany({
        where: {
          status: 'confirmed',
          completedAt: null
        }
      });

      for (const deletion of pendingDeletions) {
        // Check if user still exists and is in pending_deletion status
        const user = await this.prisma.user.findUnique({
          where: { id: deletion.userId }
        });

        if (user && user.accountStatus === 'pending_deletion') {
          // Perform final deletion
          await this.performFinalDeletion(deletion.userId);
        }

        // Mark deletion request as completed
        await this.prisma.accountDeletionRequests.update({
          where: { id: deletion.id },
          data: {
            status: 'completed',
            completedAt: new Date()
          }
        });
      }

      this.logger.info(`Processed ${pendingDeletions.length} expired deletion requests`);
    } catch (error) {
      this.logger.error('Error processing expired deletions', error);
    }
  }

  /**
   * Perform final account deletion (cascade delete)
   * @param {string} userId - User ID
   */
  async performFinalDeletion(userId) {
    try {
      // Anonymize user data
      const anonymizedEmail = `deleted_${userId}@deleted.local`;
      const anonymizedPhone = `deleted_${userId}`;

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          email: anonymizedEmail,
          phone: anonymizedPhone,
          firstName: 'Deleted',
          lastName: 'User',
          accountStatus: 'deleted',
          deletedAt: new Date()
        }
      });

      this.logger.info('Final deletion performed', { userId });
    } catch (error) {
      this.logger.error('Error performing final deletion', error);
      throw error;
    }
  }

  /**
   * Send deletion confirmation email
   * @param {Object} user - User object
   * @param {string} deletionToken - Deletion token
   * @param {Date} expiresAt - Expiration date
   */
  async sendDeletionConfirmationEmail(user, deletionToken, expiresAt) {
    try {
      const subject = 'Confirm Your Account Deletion';
      const htmlContent = `
        <h2>Account Deletion Request</h2>
        <p>Hello ${user.firstName},</p>
        <p>We received a request to delete your account.</p>
        <p><strong>Important:</strong> This action cannot be undone.</p>
        <p>To confirm deletion, please use the following token:</p>
        <p><strong>Deletion Token:</strong> ${deletionToken}</p>
        <p>This token will expire on: ${expiresAt.toISOString()}</p>
        <p>If you did not request this deletion, please ignore this email.</p>
      `;

      // For now, just log the email content
      // In production, integrate with emailService
      this.logger.info('Deletion confirmation email would be sent', {
        userId: user.id,
        email: user.email,
        deletionToken,
        expiresAt
      });
    } catch (error) {
      this.logger.error('Error sending deletion confirmation email', error);
    }
  }

  /**
   * Clean up expired deletion requests
   * This should be called by a scheduled job
   */
  async cleanupExpiredRequests() {
    try {
      const expiredRequests = await this.prisma.accountDeletionRequests.findMany({
        where: {
          expiresAt: {
            lt: new Date()
          },
          status: 'pending'
        }
      });

      if (expiredRequests.length > 0) {
        await this.prisma.accountDeletionRequests.updateMany({
          where: {
            id: {
              in: expiredRequests.map(r => r.id)
            }
          },
          data: {
            status: 'cancelled'
          }
        });

        // Reset user account status for expired requests
        const userIds = expiredRequests.map(r => r.userId);
        await this.prisma.user.updateMany({
          where: {
            id: {
              in: userIds
            },
            accountStatus: 'pending_deletion'
          },
          data: {
            accountStatus: 'active',
            deletionRequestedAt: null
          }
        });

        this.logger.info(`Cleaned up ${expiredRequests.length} expired deletion requests`);
      }
    } catch (error) {
      this.logger.error('Error cleaning up expired requests', error);
    }
  }
}

// Singleton instance
const accountDeletionService = new AccountDeletionService();

module.exports = {
  AccountDeletionService,
  accountDeletionService
};
