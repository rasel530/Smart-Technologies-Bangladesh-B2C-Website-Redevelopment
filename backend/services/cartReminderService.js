/**
 * Cart Reminder Service
 * 
 * Handles scheduled reminders for abandoned carts:
 * - First reminder: 24 hours after abandonment
 * - Second reminder: 72 hours after abandonment
 * - Final reminder: 7 days after abandonment
 * 
 * Integrates with cartSchedulerService for automated execution
 */

const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('./logger');
const { cartRecoveryService } = require('./cartRecoveryService');

class CartReminderService {
  constructor() {
    this.prisma = new PrismaClient();
    this.logger = loggerService;
    
    // Reminder intervals in hours
    this.REMINDER_INTERVALS = {
      FIRST: 24,   // 24 hours
      SECOND: 72,  // 72 hours (3 days)
      FINAL: 168   // 168 hours (7 days)
    };

    // Maximum reminders to send per cart
    this.MAX_REMINDERS = 3;
  }

  /**
   * Schedule first reminder (24 hours after abandonment)
   * @param {string} cartId - The cart ID
   * @returns {Promise<Object>} - Scheduled reminder details
   */
  async scheduleFirstReminder(cartId) {
    try {
      const cart = await this.prisma.cart.findUnique({
        where: { id: cartId },
        include: {
          user: { select: { id: true, email: true, firstName: true } }
        }
      });

      if (!cart) {
        throw new Error('Cart not found');
      }

      if (!cart.user?.email) {
        throw new Error('Cart has no associated email');
      }

      // Calculate scheduled time
      const abandonedAt = cart.abandonedAt || cart.updatedAt;
      const scheduledTime = new Date(abandonedAt.getTime() + this.REMINDER_INTERVALS.FIRST * 60 * 60 * 1000);

      // Check if we should send immediately (if already past the time)
      const now = new Date();
      if (scheduledTime <= now) {
        // Send immediately
        return await this.sendFirstReminder(cartId);
      }

      // Store scheduled reminder in cart analytics
      await this.storeScheduledReminder(cartId, 'first', scheduledTime);

      this.logger.info('First reminder scheduled', {
        cartId,
        scheduledTime,
        email: cart.user.email
      });

      return {
        success: true,
        cartId,
        type: 'first',
        scheduledTime,
        status: 'scheduled'
      };
    } catch (error) {
      this.logger.error('Error scheduling first reminder', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Schedule second reminder (72 hours after abandonment)
   * @param {string} cartId - The cart ID
   * @returns {Promise<Object>} - Scheduled reminder details
   */
  async scheduleSecondReminder(cartId) {
    try {
      const cart = await this.prisma.cart.findUnique({
        where: { id: cartId },
        include: {
          user: { select: { id: true, email: true, firstName: true } }
        }
      });

      if (!cart) {
        throw new Error('Cart not found');
      }

      // Calculate scheduled time
      const abandonedAt = cart.abandonedAt || cart.updatedAt;
      const scheduledTime = new Date(abandonedAt.getTime() + this.REMINDER_INTERVALS.SECOND * 60 * 60 * 1000);

      // Check if we should send immediately
      const now = new Date();
      if (scheduledTime <= now) {
        return await this.sendSecondReminder(cartId);
      }

      await this.storeScheduledReminder(cartId, 'second', scheduledTime);

      this.logger.info('Second reminder scheduled', {
        cartId,
        scheduledTime,
        email: cart.user?.email
      });

      return {
        success: true,
        cartId,
        type: 'second',
        scheduledTime,
        status: 'scheduled'
      };
    } catch (error) {
      this.logger.error('Error scheduling second reminder', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Schedule final reminder (7 days after abandonment)
   * @param {string} cartId - The cart ID
   * @returns {Promise<Object>} - Scheduled reminder details
   */
  async scheduleFinalReminder(cartId) {
    try {
      const cart = await this.prisma.cart.findUnique({
        where: { id: cartId },
        include: {
          user: { select: { id: true, email: true, firstName: true } }
        }
      });

      if (!cart) {
        throw new Error('Cart not found');
      }

      // Calculate scheduled time
      const abandonedAt = cart.abandonedAt || cart.updatedAt;
      const scheduledTime = new Date(abandonedAt.getTime() + this.REMINDER_INTERVALS.FINAL * 60 * 60 * 1000);

      // Check if we should send immediately
      const now = new Date();
      if (scheduledTime <= now) {
        return await this.sendFinalReminder(cartId);
      }

      await this.storeScheduledReminder(cartId, 'final', scheduledTime);

      this.logger.info('Final reminder scheduled', {
        cartId,
        scheduledTime,
        email: cart.user?.email
      });

      return {
        success: true,
        cartId,
        type: 'final',
        scheduledTime,
        status: 'scheduled'
      };
    } catch (error) {
      this.logger.error('Error scheduling final reminder', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send first reminder email
   * @param {string} cartId - The cart ID
   * @returns {Promise<Object>} - Send result
   */
  async sendFirstReminder(cartId) {
    try {
      const cart = await this.validateCartForReminder(cartId, 'first');
      if (!cart.valid) {
        return { success: false, reason: cart.reason };
      }

      // Generate a small discount for first reminder (5%)
      const discountCode = await this.generateDiscountCode(cartId, 5);

      const result = await cartRecoveryService.sendRecoveryEmail(cartId, 'reminder', {
        discountCode,
        discountAmount: this.calculateDiscountAmount(cart.data, 5)
      });

      await this.updateReminderCount(cartId, 'first');

      this.logger.info('First reminder sent', {
        cartId,
        email: result.email,
        discountCode
      });

      return {
        success: true,
        type: 'first',
        ...result
      };
    } catch (error) {
      this.logger.error('Error sending first reminder', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send second reminder email
   * @param {string} cartId - The cart ID
   * @returns {Promise<Object>} - Send result
   */
  async sendSecondReminder(cartId) {
    try {
      const cart = await this.validateCartForReminder(cartId, 'second');
      if (!cart.valid) {
        return { success: false, reason: cart.reason };
      }

      // Generate better discount for second reminder (10%)
      const discountCode = await this.generateDiscountCode(cartId, 10);

      const result = await cartRecoveryService.sendRecoveryEmail(cartId, 'reminder', {
        discountCode,
        discountAmount: this.calculateDiscountAmount(cart.data, 10)
      });

      await this.updateReminderCount(cartId, 'second');

      this.logger.info('Second reminder sent', {
        cartId,
        email: result.email,
        discountCode
      });

      return {
        success: true,
        type: 'second',
        ...result
      };
    } catch (error) {
      this.logger.error('Error sending second reminder', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send final reminder email
   * @param {string} cartId - The cart ID
   * @returns {Promise<Object>} - Send result
   */
  async sendFinalReminder(cartId) {
    try {
      const cart = await this.validateCartForReminder(cartId, 'final');
      if (!cart.valid) {
        return { success: false, reason: cart.reason };
      }

      // Generate best discount for final reminder (15%)
      const discountCode = await this.generateDiscountCode(cartId, 15);

      const result = await cartRecoveryService.sendRecoveryEmail(cartId, 'final', {
        discountCode,
        discountAmount: this.calculateDiscountAmount(cart.data, 15)
      });

      await this.updateReminderCount(cartId, 'final');

      this.logger.info('Final reminder sent', {
        cartId,
        email: result.email,
        discountCode
      });

      return {
        success: true,
        type: 'final',
        ...result
      };
    } catch (error) {
      this.logger.error('Error sending final reminder', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Cancel all reminders for a cart
   * @param {string} cartId - The cart ID
   * @returns {Promise<Object>} - Cancel result
   */
  async cancelReminders(cartId) {
    try {
      const cart = await this.prisma.cart.findUnique({
        where: { id: cartId }
      });

      if (!cart) {
        throw new Error('Cart not found');
      }

      // Update cart analytics to mark reminders as cancelled
      const analytics = await this.prisma.cartAnalytics.findUnique({
        where: { cartId }
      });

      if (analytics) {
        const events = analytics.events || {};
        
        // Cancel all scheduled reminders
        ['first', 'second', 'final'].forEach(type => {
          if (events[`${type}Reminder`]) {
            events[`${type}Reminder`].status = 'cancelled';
            events[`${type}Reminder`].cancelledAt = new Date().toISOString();
          }
        });

        await this.prisma.cartAnalytics.update({
          where: { cartId },
          data: { events }
        });
      }

      // Use recovery service to track cancellation
      await cartRecoveryService.cancelReminders(cartId);

      this.logger.info('All reminders cancelled for cart', { cartId });

      return {
        success: true,
        cartId,
        message: 'All reminders cancelled'
      };
    } catch (error) {
      this.logger.error('Error cancelling reminders', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Process due reminders (called by scheduler)
   * @returns {Promise<Object>} - Processing results
   */
  async processDueReminders() {
    try {
      const now = new Date();
      const results = {
        processed: 0,
        sent: 0,
        skipped: 0,
        failed: 0,
        details: []
      };

      // Find all abandoned carts that need reminders
      const abandonedCarts = await this.prisma.cart.findMany({
        where: {
          status: 'abandoned',
          userId: { not: null }, // Only for registered users
          reminderCount: { lt: this.MAX_REMINDERS },
          items: { some: {} } // Must have items
        },
        include: {
          user: { select: { email: true } }
        }
      });

      for (const cart of abandonedCarts) {
        try {
          const abandonedAt = cart.abandonedAt || cart.updatedAt;
          const hoursSinceAbandonment = (now - abandonedAt) / (1000 * 60 * 60);
          const reminderCount = cart.reminderCount || 0;

          let shouldSend = false;
          let reminderType = null;

          // Determine which reminder to send
          if (reminderCount === 0 && hoursSinceAbandonment >= this.REMINDER_INTERVALS.FIRST) {
            shouldSend = true;
            reminderType = 'first';
          } else if (reminderCount === 1 && hoursSinceAbandonment >= this.REMINDER_INTERVALS.SECOND) {
            shouldSend = true;
            reminderType = 'second';
          } else if (reminderCount === 2 && hoursSinceAbandonment >= this.REMINDER_INTERVALS.FINAL) {
            shouldSend = true;
            reminderType = 'final';
          }

          if (shouldSend && reminderType) {
            const sendMethod = reminderType === 'first' ? this.sendFirstReminder :
                              reminderType === 'second' ? this.sendSecondReminder :
                              this.sendFinalReminder;

            const result = await sendMethod.call(this, cart.id);

            if (result.success) {
              results.sent++;
            } else {
              results.skipped++;
            }

            results.details.push({
              cartId: cart.id,
              type: reminderType,
              success: result.success,
              reason: result.reason
            });
          }

          results.processed++;
        } catch (error) {
          results.failed++;
          results.details.push({
            cartId: cart.id,
            success: false,
            error: error.message
          });
        }
      }

      this.logger.info('Due reminders processed', {
        processed: results.processed,
        sent: results.sent,
        skipped: results.skipped,
        failed: results.failed
      });

      return results;
    } catch (error) {
      this.logger.error('Error processing due reminders', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get reminder statistics
   * @param {Object} dateRange - Date range
   * @returns {Promise<Object>} - Statistics
   */
  async getReminderStatistics(dateRange = {}) {
    try {
      const { startDate, endDate } = dateRange;
      const dateFilter = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);

      const stats = await this.prisma.cart.groupBy({
        by: ['reminderCount'],
        where: {
          ...(Object.keys(dateFilter).length > 0 && { lastReminderAt: dateFilter }),
          reminderCount: { gt: 0 }
        },
        _count: { reminderCount: true }
      });

      const totalSent = stats.reduce((sum, s) => sum + s._count.reminderCount, 0);

      return {
        totalRemindersSent: totalSent,
        breakdown: stats.map(s => ({
          reminderNumber: s.reminderCount,
          count: s._count.reminderCount
        })),
        conversionRates: await this.calculateConversionRates()
      };
    } catch (error) {
      this.logger.error('Error getting reminder statistics', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Validate cart for sending reminder
   * @private
   */
  async validateCartForReminder(cartId, type) {
    try {
      const cart = await this.prisma.cart.findUnique({
        where: { id: cartId },
        include: {
          user: { select: { email: true } },
          items: true
        }
      });

      if (!cart) {
        return { valid: false, reason: 'Cart not found' };
      }

      if (cart.status !== 'abandoned') {
        return { valid: false, reason: `Cart status is ${cart.status}` };
      }

      if (!cart.user?.email) {
        return { valid: false, reason: 'No email associated' };
      }

      if (cart.items.length === 0) {
        return { valid: false, reason: 'Cart is empty' };
      }

      if (cart.reminderCount >= this.MAX_REMINDERS) {
        return { valid: false, reason: 'Max reminders reached' };
      }

      return { valid: true, data: cart };
    } catch (error) {
      return { valid: false, reason: error.message };
    }
  }

  /**
   * Store scheduled reminder in analytics
   * @private
   */
  async storeScheduledReminder(cartId, type, scheduledTime) {
    try {
      const analytics = await this.prisma.cartAnalytics.findUnique({
        where: { cartId }
      });

      const reminderData = {
        scheduledTime: scheduledTime.toISOString(),
        status: 'scheduled',
        createdAt: new Date().toISOString()
      };

      if (analytics) {
        const events = analytics.events || {};
        events[`${type}Reminder`] = reminderData;

        await this.prisma.cartAnalytics.update({
          where: { cartId },
          data: { events }
        });
      } else {
        await this.prisma.cartAnalytics.create({
          data: {
            cartId,
            events: { [`${type}Reminder`]: reminderData },
            conversionFunnel: {},
            abandonmentReasons: []
          }
        });
      }
    } catch (error) {
      this.logger.warn('Error storing scheduled reminder', { error: error.message });
    }
  }

  /**
   * Update reminder count after sending
   * @private
   */
  async updateReminderCount(cartId, type) {
    try {
      await this.prisma.cart.update({
        where: { id: cartId },
        data: {
          reminderCount: { increment: 1 },
          lastReminderAt: new Date()
        }
      });

      // Update analytics
      const analytics = await this.prisma.cartAnalytics.findUnique({
        where: { cartId }
      });

      if (analytics) {
        const events = analytics.events || {};
        if (events[`${type}Reminder`]) {
          events[`${type}Reminder`].status = 'sent';
          events[`${type}Reminder`].sentAt = new Date().toISOString();

          await this.prisma.cartAnalytics.update({
            where: { cartId },
            data: { events }
          });
        }
      }
    } catch (error) {
      this.logger.warn('Error updating reminder count', { error: error.message });
    }
  }

  /**
   * Generate discount code for recovery
   * @private
   */
  async generateDiscountCode(cartId, percentage) {
    try {
      const prefix = 'RECOVER';
      const timestamp = Date.now().toString(36).toUpperCase();
      const suffix = cartId.substring(0, 4).toUpperCase();
      return `${prefix}${percentage}${suffix}${timestamp}`;
    } catch (error) {
      this.logger.warn('Error generating discount code', { error: error.message });
      return `RECOVER${percentage}${Date.now()}`;
    }
  }

  /**
   * Calculate discount amount
   * @private
   */
  calculateDiscountAmount(cart, percentage) {
    const subtotal = parseFloat(cart.subtotal) || 0;
    return (subtotal * percentage / 100).toFixed(2);
  }

  /**
   * Calculate conversion rates by reminder
   * @private
   */
  async calculateConversionRates() {
    try {
      const rates = [];

      for (let i = 1; i <= 3; i++) {
        const [sent, converted] = await Promise.all([
          this.prisma.cart.count({
            where: { reminderCount: { gte: i } }
          }),
          this.prisma.cart.count({
            where: {
              reminderCount: { gte: i },
              status: 'converted'
            }
          })
        ]);

        rates.push({
          reminderNumber: i,
          sent,
          converted,
          rate: sent > 0 ? parseFloat(((converted / sent) * 100).toFixed(2)) : 0
        });
      }

      return rates;
    } catch (error) {
      this.logger.warn('Error calculating conversion rates', { error: error.message });
      return [];
    }
  }
}

// Singleton instance
const cartReminderService = new CartReminderService();

module.exports = {
  CartReminderService,
  cartReminderService
};
