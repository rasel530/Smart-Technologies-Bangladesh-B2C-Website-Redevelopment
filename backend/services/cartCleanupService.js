/**
 * Cart Cleanup Service
 * 
 * Handles automated cleanup of expired carts, reservations, and abandoned carts.
 * Provides scheduled and on-demand cleanup operations for cart management.
 * 
 * Features:
 * - Expired cart cleanup (past TTL)
 * - Expired reservation cleanup
 * - Abandoned cart detection and cleanup
 * - Recovery reminder email sending
 * - Cleanup statistics and audit logging
 */

const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('./logger');
const emailService = require('./emailService');
const { inventoryReservationService, RESERVATION_STATUS } = require('./inventoryReservationService');

// Configuration constants
const CART_TTL = parseInt(process.env.CART_TTL) || (30 * 24 * 60 * 60 * 1000); // 30 days in ms
const RESERVATION_TTL = parseInt(process.env.RESERVATION_TTL) || (30 * 60 * 1000); // 30 minutes in ms
const ABANDONED_CART_THRESHOLD = parseInt(process.env.ABANDONED_CART_THRESHOLD_DAYS) || 7; // 7 days
const RECOVERY_REMINDER_THRESHOLD = parseInt(process.env.RECOVERY_REMINDER_THRESHOLD_DAYS) || 3; // 3 days
const CLEANUP_BATCH_SIZE = parseInt(process.env.CLEANUP_BATCH_SIZE) || 1000;

class CartCleanupService {
  constructor() {
    this.prisma = new PrismaClient();
    this.logger = loggerService;
    this.cleanupStats = {
      cartsExpired: 0,
      reservationsReleased: 0,
      abandonedCleaned: 0,
      remindersSent: 0,
      lastRun: null
    };
  }

  /**
   * Get current cleanup statistics
   * @returns {Object} Current cleanup stats
   */
  getCleanupStats() {
    return {
      ...this.cleanupStats,
      config: {
        cartTTL: CART_TTL,
        reservationTTL: RESERVATION_TTL,
        abandonedCartThreshold: ABANDONED_CART_THRESHOLD,
        recoveryReminderThreshold: RECOVERY_REMINDER_THRESHOLD,
        batchSize: CLEANUP_BATCH_SIZE
      }
    };
  }

  /**
   * Reset cleanup stats (for new cleanup run tracking)
   */
  resetCleanupStats() {
    this.cleanupStats = {
      cartsExpired: 0,
      reservationsReleased: 0,
      abandonedCleaned: 0,
      remindersSent: 0,
      lastRun: new Date()
    };
  }

  /**
   * Main cleanup function for expired carts
   * Finds carts past TTL and marks them as expired
   * 
   * @param {Object} options - Cleanup options
   * @param {boolean} options.dryRun - If true, only count without making changes
   * @param {number} options.batchSize - Number of carts to process per batch
   * @returns {Object} Cleanup summary
   */
  async cleanupExpiredCarts(options = {}) {
    const { dryRun = false, batchSize = CLEANUP_BATCH_SIZE } = options;
    const startTime = Date.now();
    let cleaned = 0;
    let errors = [];

    try {
      this.logger.info('Starting expired cart cleanup', { dryRun, batchSize });

      // Calculate cutoff date based on CART_TTL
      const cutoffDate = new Date(Date.now() - CART_TTL);
      
      // Find carts that are past TTL and still active
      // Carts are considered expired if:
      // 1. Status is 'active' or 'abandoned'
      // 2. UpdatedAt is past the TTL threshold
      // 3. For guest carts (no userId), also check expiresAt if set
      const whereClause = {
        status: { in: ['active', 'abandoned'] },
        updatedAt: { lt: cutoffDate },
        OR: [
          { userId: null }, // Guest carts
          { 
            userId: { not: null },
            expiresAt: { lt: new Date() } // User carts with explicit expiration
          }
        ]
      };

      if (dryRun) {
        // Just count for dry run
        const count = await this.prisma.cart.count({ where: whereClause });
        return {
          success: true,
          cleaned: count,
          errors: [],
          duration: Date.now() - startTime,
          dryRun: true,
          message: `Found ${count} carts that would be expired`
        };
      }

      // Process in batches
      let hasMore = true;
      while (hasMore) {
        const carts = await this.prisma.cart.findMany({
          where: whereClause,
          take: batchSize,
          select: { id: true, userId: true, sessionId: true }
        });

        if (carts.length === 0) {
          hasMore = false;
          break;
        }

        for (const cart of carts) {
          try {
            // Update cart status to expired
            await this.prisma.cart.update({
              where: { id: cart.id },
              data: {
                status: 'expired',
                expiredAt: new Date()
              }
            });

            // Create audit log entry
            await this.createCleanupAuditLog({
              type: 'CART_EXPIRED',
              cartId: cart.id,
              userId: cart.userId,
              sessionId: cart.sessionId,
              details: { reason: 'TTL expiration', cutoffDate: cutoffDate.toISOString() }
            });

            // Release any reservations for this cart
            try {
              await inventoryReservationService.releaseCartReservations(
                cart.id,
                'system',
                'Cart expired - releasing reservations'
              );
              this.cleanupStats.reservationsReleased++;
            } catch (resError) {
              this.logger.warn('Failed to release cart reservations', {
                cartId: cart.id,
                error: resError.message
              });
            }

            cleaned++;
          } catch (error) {
            errors.push({
              cartId: cart.id,
              error: error.message
            });
            this.logger.error('Error expiring cart', {
              cartId: cart.id,
              error: error.message
            });
          }
        }

        // Check if we processed fewer than batch size (last batch)
        if (carts.length < batchSize) {
          hasMore = false;
        }
      }

      this.cleanupStats.cartsExpired = cleaned;
      this.cleanupStats.lastRun = new Date();

      const duration = Date.now() - startTime;
      this.logger.info('Expired cart cleanup completed', {
        cleaned,
        errors: errors.length,
        duration
      });

      return {
        success: true,
        cleaned,
        errors,
        duration,
        message: `Expired ${cleaned} carts successfully`
      };
    } catch (error) {
      this.logger.error('Error during expired cart cleanup', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        cleaned,
        errors: [...errors, { error: error.message }],
        duration: Date.now() - startTime,
        message: `Cleanup failed: ${error.message}`
      };
    }
  }

  /**
   * Cleanup expired reservations
   * Releases reserved stock from reservations past their expiry
   * 
   * @returns {Object} Cleanup summary
   */
  async cleanupExpiredReservations() {
    const startTime = Date.now();
    let released = 0;
    let errors = [];

    try {
      this.logger.info('Starting expired reservation cleanup');

      // Use the existing inventory reservation service cleanup
      const result = await inventoryReservationService.cleanupExpiredReservations();

      if (result.success) {
        released = result.data?.cleanedCount || 0;
        this.cleanupStats.reservationsReleased = released;
        this.cleanupStats.lastRun = new Date();
      }

      const duration = Date.now() - startTime;
      this.logger.info('Expired reservation cleanup completed', {
        released,
        errors: errors.length,
        duration
      });

      return {
        success: true,
        released,
        errors,
        duration,
        message: `Released ${released} expired reservations`
      };
    } catch (error) {
      this.logger.error('Error during expired reservation cleanup', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        released,
        errors: [{ error: error.message }],
        duration: Date.now() - startTime,
        message: `Reservation cleanup failed: ${error.message}`
      };
    }
  }

  /**
   * Cleanup abandoned carts (softer than expired)
   * Finds carts abandoned beyond threshold and optionally sends recovery emails first
   * 
   * @param {Object} options - Cleanup options
   * @param {number} options.thresholdDays - Days of inactivity before considered abandoned
   * @param {boolean} options.sendReminders - Whether to send recovery reminder emails first
   * @param {boolean} options.dryRun - If true, only count without making changes
   * @returns {Object} Cleanup summary
   */
  async cleanupAbandonedCarts(options = {}) {
    const {
      thresholdDays = ABANDONED_CART_THRESHOLD,
      sendReminders = false,
      dryRun = false
    } = options;

    const startTime = Date.now();
    let cleaned = 0;
    let remindersSent = 0;
    let errors = [];

    try {
      this.logger.info('Starting abandoned cart cleanup', {
        thresholdDays,
        sendReminders,
        dryRun
      });

      // Calculate cutoff date based on threshold
      const cutoffDate = new Date(Date.now() - (thresholdDays * 24 * 60 * 60 * 1000));

      // Find carts that are considered abandoned:
      // 1. Status is 'active'
      // 2. Not been updated since cutoff date
      // 3. Have items in them
      const whereClause = {
        status: 'active',
        updatedAt: { lt: cutoffDate },
        items: {
          some: {} // Cart has at least one item
        }
      };

      if (dryRun) {
        const count = await this.prisma.cart.count({
          where: whereClause,
          include: { user: { select: { id: true, email: true, firstName: true } } }
        });
        
        // Also count carts eligible for reminders
        const reminderCutoff = new Date(Date.now() - (RECOVERY_REMINDER_THRESHOLD * 24 * 60 * 60 * 1000));
        const reminderWhere = {
          status: 'active',
          updatedAt: { lt: reminderCutoff, gte: cutoffDate },
          items: { some: {} },
          userId: { not: null }
        };
        
        const reminderCount = await this.prisma.cart.count({
          where: reminderWhere,
          include: { user: { select: { id: true, email: true } } }
        });

        return {
          success: true,
          cleaned: count,
          remindersSent: sendReminders ? reminderCount : 0,
          errors: [],
          duration: Date.now() - startTime,
          dryRun: true,
          message: `Found ${count} carts to be marked abandoned, ${reminderCount} eligible for reminders`
        };
      }

      // Send recovery reminders first if requested
      if (sendReminders) {
        const reminderResult = await this.sendRecoveryReminders({
          thresholdDays: RECOVERY_REMINDER_THRESHOLD
        });
        remindersSent = reminderResult.sent || 0;
        errors = [...errors, ...(reminderResult.errors || [])];
      }

      // Find carts to mark as abandoned
      const carts = await this.prisma.cart.findMany({
        where: whereClause,
        take: CLEANUP_BATCH_SIZE,
        include: {
          user: { select: { id: true, email: true, firstName: true } }
        }
      });

      for (const cart of carts) {
        try {
          // Update cart status to abandoned
          await this.prisma.cart.update({
            where: { id: cart.id },
            data: {
              status: 'abandoned',
              abandonedAt: new Date()
            }
          });

          // Create audit log entry
          await this.createCleanupAuditLog({
            type: 'CART_ABANDONED',
            cartId: cart.id,
            userId: cart.userId,
            details: {
              reason: 'Inactivity threshold',
              thresholdDays,
              cutoffDate: cutoffDate.toISOString()
            }
          });

          cleaned++;
        } catch (error) {
          errors.push({
            cartId: cart.id,
            error: error.message
          });
          this.logger.error('Error abandoning cart', {
            cartId: cart.id,
            error: error.message
          });
        }
      }

      this.cleanupStats.abandonedCleaned = cleaned;
      this.cleanupStats.remindersSent = remindersSent;
      this.cleanupStats.lastRun = new Date();

      const duration = Date.now() - startTime;
      this.logger.info('Abandoned cart cleanup completed', {
        cleaned,
        remindersSent,
        errors: errors.length,
        duration
      });

      return {
        success: true,
        cleaned,
        remindersSent,
        errors,
        duration,
        message: `Marked ${cleaned} carts as abandoned, sent ${remindersSent} reminders`
      };
    } catch (error) {
      this.logger.error('Error during abandoned cart cleanup', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        cleaned,
        remindersSent,
        errors: [...errors, { error: error.message }],
        duration: Date.now() - startTime,
        message: `Abandoned cart cleanup failed: ${error.message}`
      };
    }
  }

  /**
   * Send recovery reminder emails for carts approaching abandonment
   * 
   * @param {Object} options - Options for reminder sending
   * @param {number} options.thresholdDays - Days before abandonment to send reminder
   * @param {number} options.batchSize - Number of emails to send per batch
   * @returns {Object} Summary of sent reminders
   */
  async sendRecoveryReminders(options = {}) {
    const {
      thresholdDays = RECOVERY_REMINDER_THRESHOLD,
      batchSize = 100
    } = options;

    const startTime = Date.now();
    let sent = 0;
    let errors = [];

    try {
      this.logger.info('Starting recovery reminder emails', { thresholdDays, batchSize });

      // Calculate date range for carts to send reminders to
      // Carts that haven't been updated in thresholdDays but not yet past the full abandonment threshold
      const now = Date.now();
      const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;
      const reminderStart = new Date(now - thresholdMs);
      const reminderEnd = new Date(now - ((ABANDONED_CART_THRESHOLD - thresholdDays) * 24 * 60 * 60 * 1000));

      // Find carts eligible for reminders
      const carts = await this.prisma.cart.findMany({
        where: {
          status: 'active',
          updatedAt: {
            gte: reminderStart,
            lt: reminderEnd
          },
          items: { some: {} },
          userId: { not: null },
          user: {
            email: { not: null }
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: {
                    where: { displayOrder: 0 },
                    take: 1,
                    select: { originalUrl: true, thumbnailUrl: true }
                  }
                }
              }
            },
            take: 5 // Include up to 5 items in email
          }
        },
        take: batchSize
      });

      for (const cart of carts) {
        try {
          // Send recovery reminder email
          await this.sendCartRecoveryEmail(cart);
          
          // Update cart to track that reminder was sent
          await this.prisma.cart.update({
            where: { id: cart.id },
            data: {
              lastReminderSentAt: new Date(),
              reminderCount: { increment: 1 }
            }
          });

          // Create audit log
          await this.createCleanupAuditLog({
            type: 'RECOVERY_REMINDER_SENT',
            cartId: cart.id,
            userId: cart.userId,
            details: {
              recipientEmail: cart.user.email,
              itemsCount: cart.items.length
            }
          });

          sent++;
        } catch (error) {
          errors.push({
            cartId: cart.id,
            email: cart.user.email,
            error: error.message
          });
          this.logger.error('Error sending recovery reminder', {
            cartId: cart.id,
            email: cart.user.email,
            error: error.message
          });
        }
      }

      this.cleanupStats.remindersSent = sent;
      this.cleanupStats.lastRun = new Date();

      const duration = Date.now() - startTime;
      this.logger.info('Recovery reminder emails completed', {
        sent,
        errors: errors.length,
        duration
      });

      return {
        success: true,
        sent,
        errors,
        duration,
        message: `Sent ${sent} recovery reminder emails`
      };
    } catch (error) {
      this.logger.error('Error sending recovery reminders', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        sent,
        errors: [{ error: error.message }],
        duration: Date.now() - startTime,
        message: `Recovery reminders failed: ${error.message}`
      };
    }
  }

  /**
   * Send cart recovery email
   * @param {Object} cart - Cart with user and items
   * @returns {Object} Email send result
   */
  async sendCartRecoveryEmail(cart) {
    const { user, items } = cart;
    const recoveryUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cart/recover`;

    // Build items HTML for email
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          ${item.product.name}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
          ${parseFloat(item.subtotal || 0).toFixed(2)} BDT
        </td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1a1a1a; margin: 0;">🛒 Smart Technologies</h1>
        </div>
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; color: white; text-align: center;">
          <h2 style="margin: 0 0 8px 0;">Your cart is waiting!</h2>
          <p style="margin: 0; opacity: 0.9;">You left some items in your cart. Don't miss out!</p>
        </div>

        <p style="font-size: 16px; line-height: 1.6;">
          Hi ${user.firstName || 'there'},
        </p>
        
        <p style="font-size: 16px; line-height: 1.6;">
          We noticed you left some items in your shopping cart. Your cart is still saved with all your items!
        </p>

        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px;">Your Cart Items:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #e9ecef;">
                <th style="padding: 12px; text-align: left;">Item</th>
                <th style="padding: 12px; text-align: center;">Qty</th>
                <th style="padding: 12px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${recoveryUrl}" 
             style="display: inline-block; background-color: #667eea; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
            Complete Your Purchase
          </a>
        </div>

        <p style="font-size: 14px; color: #666; text-align: center;">
          This reminder is automatic. If you've already completed your purchase, please ignore this email.
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">

        <p style="font-size: 12px; color: #999; text-align: center;">
          © ${new Date().getFullYear()} Smart Technologies Bangladesh. All rights reserved.
        </p>
      </body>
      </html>
    `;

    const textContent = `
Hi ${user.firstName || 'there'},

We noticed you left some items in your shopping cart. Your cart is still saved with all your items!

To complete your purchase, visit: ${recoveryUrl}

This is an automated reminder. If you've already completed your purchase, please ignore this email.

© ${new Date().getFullYear()} Smart Technologies Bangladesh
    `;

    return await emailService.sendEmail({
      to: user.email,
      subject: `🛒 Your cart is waiting! Complete your purchase`,
      html: htmlContent,
      text: textContent
    });
  }

  /**
   * Run all cleanup tasks
   * 
   * @param {Object} options - Cleanup options
   * @param {boolean} options.includeReservations - Include reservation cleanup
   * @param {boolean} options.includeAbandoned - Include abandoned cart cleanup
   * @param {boolean} options.sendReminders - Send recovery reminders
   * @returns {Object} Combined cleanup summary
   */
  async runFullCleanup(options = {}) {
    const {
      includeReservations = true,
      includeAbandoned = true,
      sendReminders = false
    } = options;

    const startTime = Date.now();
    this.resetCleanupStats();

    const results = {
      cartsExpired: { cleaned: 0 },
      reservationsReleased: { released: 0 },
      abandonedCleaned: { cleaned: 0, remindersSent: 0 },
      overallDuration: 0,
      errors: []
    };

    try {
      this.logger.info('Starting full cart cleanup', options);

      // Step 1: Cleanup expired carts
      const expiredResult = await this.cleanupExpiredCarts();
      results.cartsExpired = expiredResult;
      if (!expiredResult.success) {
        results.errors.push({ phase: 'expired_carts', error: expiredResult.message });
      }

      // Step 2: Cleanup expired reservations
      if (includeReservations) {
        const reservationResult = await this.cleanupExpiredReservations();
        results.reservationsReleased = reservationResult;
        if (!reservationResult.success) {
          results.errors.push({ phase: 'reservations', error: reservationResult.message });
        }
      }

      // Step 3: Cleanup abandoned carts
      if (includeAbandoned) {
        const abandonedResult = await this.cleanupAbandonedCarts({ sendReminders });
        results.abandonedCleaned = abandonedResult;
        if (!abandonedResult.success) {
          results.errors.push({ phase: 'abandoned_carts', error: abandonedResult.message });
        }
      }

      results.overallDuration = Date.now() - startTime;
      this.cleanupStats.lastRun = new Date();

      this.logger.info('Full cart cleanup completed', {
        duration: results.overallDuration,
        results
      });

      return {
        success: results.errors.length === 0,
        cartsExpired: results.cartsExpired.cleaned,
        reservationsReleased: results.reservationsReleased.released,
        abandonedCleaned: results.abandonedCleaned.cleaned,
        remindersSent: results.abandonedCleaned.remindersSent || 0,
        errors: results.errors,
        duration: results.overallDuration
      };
    } catch (error) {
      this.logger.error('Error during full cleanup', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        cartsExpired: this.cleanupStats.cartsExpired,
        reservationsReleased: this.cleanupStats.reservationsReleased,
        abandonedCleaned: this.cleanupStats.abandonedCleaned,
        remindersSent: this.cleanupStats.remindersSent,
        errors: [...results.errors, { error: error.message }],
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Get cleanup statistics for a date range
   * 
   * @param {Object} dateRange - Date range options
   * @param {string} dateRange.startDate - Start date (ISO 8601)
   * @param {string} dateRange.endDate - End date (ISO 8601)
   * @returns {Object} Statistics data
   */
  async getCleanupStats(dateRange = {}) {
    const { startDate, endDate } = dateRange;

    try {
      const dateFilter = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);

      // Get cleanup audit logs
      const auditLogs = await this.prisma.cartCleanupAudit.findMany({
        where: {
          timestamp: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
        },
        orderBy: { timestamp: 'desc' },
        take: 100
      });

      // Calculate statistics
      const stats = {
        totalCartsExpired: 0,
        totalReservationsReleased: 0,
        totalAbandonedCleaned: 0,
        totalRemindersSent: 0,
        byType: {},
        recentOperations: []
      };

      for (const log of auditLogs) {
        switch (log.type) {
          case 'CART_EXPIRED':
            stats.totalCartsExpired++;
            break;
          case 'RESERVATION_RELEASED':
            stats.totalReservationsReleased++;
            break;
          case 'CART_ABANDONED':
            stats.totalAbandonedCleaned++;
            break;
          case 'RECOVERY_REMINDER_SENT':
            stats.totalRemindersSent++;
            break;
        }

        if (!stats.byType[log.type]) {
          stats.byType[log.type] = 0;
        }
        stats.byType[log.type]++;
      }

      // Get recent operations summary
      stats.recentOperations = auditLogs.slice(0, 10).map(log => ({
        id: log.id,
        type: log.type,
        cartId: log.cartId,
        timestamp: log.timestamp,
        details: log.details
      }));

      // Get current cart counts by status
      const [activeCarts, abandonedCarts, expiredCarts, convertedCarts] = await Promise.all([
        this.prisma.cart.count({ where: { status: 'active' } }),
        this.prisma.cart.count({ where: { status: 'abandoned' } }),
        this.prisma.cart.count({ where: { status: 'expired' } }),
        this.prisma.cart.count({ where: { status: 'converted' } })
      ]);

      return {
        success: true,
        data: {
          cleanupStats: stats,
          currentCartCounts: {
            active: activeCarts,
            abandoned: abandonedCarts,
            expired: expiredCarts,
            converted: convertedCarts,
            total: activeCarts + abandonedCarts + expiredCarts + convertedCarts
          },
          dateRange: { startDate, endDate }
        }
      };
    } catch (error) {
      this.logger.error('Error getting cleanup stats', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create cleanup audit log entry
   * @param {Object} data - Audit log data
   */
  async createCleanupAuditLog(data) {
    try {
      await this.prisma.cartCleanupAudit.create({
        data: {
          type: data.type,
          cartId: data.cartId,
          userId: data.userId,
          sessionId: data.sessionId,
          details: data.details || {},
          timestamp: new Date()
        }
      });
    } catch (error) {
      this.logger.warn('Failed to create cleanup audit log', {
        error: error.message,
        data
      });
    }
  }

  /**
   * Get cleanup history
   * @param {Object} options - Query options
   * @returns {Object} Cleanup history
   */
  async getCleanupHistory(options = {}) {
    const { page = 1, limit = 50, type } = options;

    try {
      const where = {};
      if (type) where.type = type;

      const [logs, total] = await Promise.all([
        this.prisma.cartCleanupAudit.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        this.prisma.cartCleanupAudit.count({ where })
      ]);

      return {
        success: true,
        data: {
          history: logs,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      this.logger.error('Error getting cleanup history', {
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Singleton instance
const cartCleanupService = new CartCleanupService();

module.exports = {
  CartCleanupService,
  cartCleanupService,
  CART_TTL,
  RESERVATION_TTL,
  ABANDONED_CART_THRESHOLD,
  RECOVERY_REMINDER_THRESHOLD,
  CLEANUP_BATCH_SIZE
};
