/**
 * Cart Recovery Service
 * Handles cart recovery operations for abandoned carts
 * 
 * Features:
 * - Generate recovery tokens for abandoned carts
 * - Validate recovery tokens
 * - Recover abandoned carts to active state
 * - Send recovery emails with cart items
 * - Schedule recovery reminders (24h, 72h, 7 days)
 * - Track recovery statistics
 * - AI-based optimal send time calculation
 * - Bulk recovery operations
 * - Share carts with customers
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { loggerService } = require('./logger');
const emailService = require('./emailService');
const cartAnalyticsService = require('./cartAnalyticsService');

class CartRecoveryService {
  constructor() {
    this.prisma = new PrismaClient();
    this.logger = loggerService;
    // Default token expiration: 30 days (as per requirements)
    this.defaultTokenExpiryDays = 30;
    // Maximum recovery attempts per cart
    this.maxRecoveryAttempts = 5;
    // Reminder intervals in hours
    this.reminderIntervals = {
      first: 24,    // 24 hours
      second: 72,   // 72 hours
      final: 168    // 7 days
    };
    // Email templates directory
    this.templatesDir = path.join(__dirname, '../templates/emails');
  }

  /**
   * Generate a unique recovery token for a cart
   * @param {string} cartId - The cart ID
   * @returns {Promise<Object>} - Recovery token details
   */
  async generateRecoveryToken(cartId) {
    try {
      // Validate cart exists
      const cart = await this.prisma.carts.findUnique({
        where: { id: cartId },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true, preferredLanguage: true }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  nameEn: true,
                  nameBn: true,
                  sku: true,
                  regularPrice: true,
                  salePrice: true,
                  images: {
                    where: { displayOrder: 0 },
                    take: 1,
                    select: { originalUrl: true, optimizedUrl: true, thumbnailUrl: true }
                  }
                }
              },
              variant: true
            }
          }
        }
      });

      if (!cart) {
        throw new Error('Cart not found');
      }

      // Generate unique token
      const token = this.generateSecureToken();
      
      // Calculate expiration date (30 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.defaultTokenExpiryDays);

      // Store recovery token in cart record
      const updatedCart = await this.prisma.carts.update({
        where: { id: cartId },
        data: {
          recoveryToken: token,
          recoveryTokenExpires: expiresAt,
          recoveryAttempts: { increment: 1 },
          lastRecoveryAt: new Date()
        }
      });

      // Track recovery event
      await this.trackRecoveryEvent(cartId, 'token_generated', { token });

      this.logger.info('Recovery token generated', {
        cartId,
        tokenId: updatedCart.id,
        expiresAt,
        attempts: updatedCart.recoveryAttempts
      });

      return {
        token,
        expiresAt,
        cartId,
        shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cart/recover/${token}`,
        cart: updatedCart
      };
    } catch (error) {
      this.logger.error('Error generating recovery token', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send recovery email with cart items
   * @param {string} cartId - The cart ID
   * @param {string} template - Email template type ('recovery', 'reminder', 'final')
 * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Email send result
   */
  async sendRecoveryEmail(cartId, template = 'recovery', options = {}) {
    try {
      const { discountCode = null, discountAmount = null, customMessage = null } = options;

      // Get cart with full details
      const cart = await this.prisma.carts.findUnique({
        where: { id: cartId },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true, preferredLanguage: true }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  nameEn: true,
                  nameBn: true,
                  sku: true,
                  regularPrice: true,
                  salePrice: true,
                  images: {
                    where: { displayOrder: 0 },
                    take: 1,
                    select: { originalUrl: true, optimizedUrl: true, thumbnailUrl: true }
                  }
                }
              },
              variant: true
            }
          }
        }
      });

      if (!cart) {
        throw new Error('Cart not found');
      }

      if (!cart.user?.email) {
        throw new Error('Cart has no associated user email');
      }

      // Generate or reuse recovery token
      let recoveryToken = cart.recoveryToken;
      let recoveryUrl;
      
      if (!recoveryToken || (cart.recoveryTokenExpires && new Date(cart.recoveryTokenExpires) < new Date())) {
        const tokenData = await this.generateRecoveryToken(cartId);
        recoveryToken = tokenData.token;
        recoveryUrl = tokenData.shareUrl;
      } else {
        recoveryUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cart/recover/${recoveryToken}`;
      }

      // Update discount code if provided
      if (discountCode) {
        await this.prisma.carts.update({
          where: { id: cartId },
          data: { 
            discountCode,
            discountAmount: discountAmount ? parseFloat(discountAmount) : null
          }
        });
      }

      // Prepare email data
      const emailData = await this.prepareEmailData(cart, recoveryUrl, template, {
        discountCode,
        discountAmount,
        customMessage
      });

      // Load and process email template
      const emailHtml = await this.loadEmailTemplate(template, emailData);

      // Send email
      const result = await emailService.sendEmail({
        to: cart.user.email,
        subject: this.getEmailSubject(template, cart.user.preferredLanguage),
        html: emailHtml,
        text: this.generatePlainText(emailData, template)
      });

      // Update cart with email sent timestamp
      await this.prisma.carts.update({
        where: { id: cartId },
        data: { 
          recoveryEmailSentAt: new Date(),
          reminderCount: { increment: 1 },
          lastReminderAt: new Date()
        }
      });

      // Track recovery event
      await this.trackRecoveryEvent(cartId, 'email_sent', { 
        template, 
        email: cart.user.email,
        discountCode 
      });

      this.logger.info('Recovery email sent', {
        cartId,
        email: cart.user.email,
        template,
        messageId: result.messageId
      });

      return {
        success: true,
        cartId,
        email: cart.user.email,
        template,
        messageId: result.messageId,
        recoveryUrl,
        sentAt: new Date()
      };
    } catch (error) {
      this.logger.error('Error sending recovery email', {
        cartId,
        template,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Schedule recovery reminder sequence
   * @param {string} cartId - The cart ID
   * @returns {Promise<Object>} - Scheduled reminders
   */
  async scheduleRecoveryReminders(cartId) {
    try {
      const cart = await this.prisma.carts.findUnique({
        where: { id: cartId },
        include: { user: { select: { email: true } } }
      });

      if (!cart) {
        throw new Error('Cart not found');
      }

      // Calculate scheduled times
      const now = new Date();
      const firstReminder = new Date(now.getTime() + this.reminderIntervals.first * 60 * 60 * 1000);
      const secondReminder = new Date(now.getTime() + this.reminderIntervals.second * 60 * 60 * 1000);
      const finalReminder = new Date(now.getTime() + this.reminderIntervals.final * 60 * 60 * 1000);

      // Store schedule in cart analytics
      const analytics = await this.prisma.cart_analytics.findUnique({
        where: { cartId }
      });

      const recoverySchedule = {
        firstReminder: firstReminder.toISOString(),
        secondReminder: secondReminder.toISOString(),
        finalReminder: finalReminder.toISOString(),
        scheduledAt: now.toISOString(),
        status: 'scheduled'
      };

      if (analytics) {
        const events = analytics.events || {};
        events.recoverySchedule = recoverySchedule;
        
        await this.prisma.cart_analytics.update({
          where: { cartId },
          data: { events }
        });
      }

      this.logger.info('Recovery reminders scheduled', {
        cartId,
        firstReminder,
        secondReminder,
        finalReminder
      });

      return {
        success: true,
        cartId,
        schedule: {
          first: firstReminder,
          second: secondReminder,
          final: finalReminder
        }
      };
    } catch (error) {
      this.logger.error('Error scheduling recovery reminders', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Process abandoned carts and send recovery emails
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - Processing results
   */
  async processAbandonedCarts(options = {}) {
    try {
      const { 
        minAgeHours = 1,      // Minimum age to consider abandoned
        maxAgeHours = 72,     // Maximum age to process
        batchSize = 50,       // Process in batches
        sendEmails = true,    // Whether to send emails
        includeGuests = false // Whether to include guest carts
      } = options;

      const now = new Date();
      const minAge = new Date(now.getTime() - minAgeHours * 60 * 60 * 1000);
      const maxAge = new Date(now.getTime() - maxAgeHours * 60 * 60 * 1000);

      // Find abandoned carts
      const where = {
        status: 'active', // Active but not updated recently
        updatedAt: {
          lt: minAge,
          gte: maxAge
        },
        items: { some: {} }, // Must have items
        recoveryAttempts: { lt: this.maxRecoveryAttempts }
      };

      if (!includeGuests) {
        where.userId = { not: null };
      }

      const abandonedCarts = await this.prisma.carts.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true, preferredLanguage: true }
          },
          items: {
            include: {
              product: {
                select: { id: true, name: true, regularPrice: true, salePrice: true }
              }
            }
          }
        },
        take: batchSize
      });

      const results = {
        processed: 0,
        emailsSent: 0,
        failed: 0,
        carts: []
      };

      for (const cart of abandonedCarts) {
        try {
          // Mark cart as abandoned
          await this.markCartAsAbandoned(cart.id, 'user_inactivity');

          if (sendEmails && cart.user?.email) {
            // Calculate optimal send time
            const optimalTime = await this.calculateOptimalSendTime(cart.userId);
            
            // Check if we should send now or schedule
            const shouldSendNow = !optimalTime || optimalTime <= now;

            if (shouldSendNow) {
              // Send first recovery email
              await this.sendRecoveryEmail(cart.id, 'recovery');
              results.emailsSent++;
            }

            // Schedule reminders
            await this.scheduleRecoveryReminders(cart.id);
          }

          results.processed++;
          results.carts.push({
            cartId: cart.id,
            userEmail: cart.user?.email,
            itemCount: cart.items.length,
            total: cart.total
          });
        } catch (error) {
          results.failed++;
          this.logger.error('Error processing abandoned cart', {
            cartId: cart.id,
            error: error.message
          });
        }
      }

      this.logger.info('Abandoned carts processed', {
        processed: results.processed,
        emailsSent: results.emailsSent,
        failed: results.failed
      });

      return results;
    } catch (error) {
      this.logger.error('Error processing abandoned carts', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get recovery statistics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} - Recovery statistics
   */
  async getRecoveryStatistics(startDate, endDate) {
    try {
      const dateFilter = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);

      // Get base stats
      const [
        totalAbandoned,
        totalRecovered,
        totalEmailsSent,
        totalConversions
      ] = await Promise.all([
        this.prisma.cart.count({
          where: {
            status: 'abandoned',
            ...(Object.keys(dateFilter).length > 0 && { abandonedAt: dateFilter })
          }
        }),
        this.prisma.cart.count({
          where: {
            recoveryAttempts: { gt: 0 },
            ...(Object.keys(dateFilter).length > 0 && { recoveredAt: dateFilter })
          }
        }),
        this.prisma.cart.count({
          where: {
            reminderCount: { gt: 0 },
            ...(Object.keys(dateFilter).length > 0 && { recoveryEmailSentAt: dateFilter })
          }
        }),
        this.prisma.cart.count({
          where: {
            status: 'converted',
            ...(Object.keys(dateFilter).length > 0 && { recoveredAt: dateFilter })
          }
        })
      ]);

      // Calculate rates
      const recoveryRate = totalAbandoned > 0 ? (totalRecovered / totalAbandoned) * 100 : 0;
      const conversionRate = totalRecovered > 0 ? (totalConversions / totalRecovered) * 100 : 0;

      // Get recovery events
      const recoveryEvents = await this.prisma.cart_recovery_events.groupBy({
        by: ['eventType'],
        where: {
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
        },
        _count: { eventType: true }
      });

      // Get revenue from recovered carts
      const recoveredRevenue = await this.prisma.carts.aggregate({
        where: {
          recoveryAttempts: { gt: 0 },
          status: 'converted',
          ...(Object.keys(dateFilter).length > 0 && { recoveredAt: dateFilter })
        },
        _sum: { total: true }
      });

      // Get daily breakdown
      const dailyStats = await this.getDailyRecoveryStats(startDate, endDate);

      return {
        summary: {
          totalAbandoned,
          totalRecovered,
          totalEmailsSent,
          totalConversions,
          recoveryRate: parseFloat(recoveryRate.toFixed(2)),
          conversionRate: parseFloat(conversionRate.toFixed(2)),
          recoveredRevenue: recoveredRevenue._sum.total || 0
        },
        events: recoveryEvents.reduce((acc, event) => {
          acc[event.eventType] = event._count.eventType;
          return acc;
        }, {}),
        dailyBreakdown: dailyStats
      };
    } catch (error) {
      this.logger.error('Error getting recovery statistics', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Mark cart as abandoned
   * @param {string} cartId - The cart ID
   * @param {string} reason - Abandonment reason
   * @returns {Promise<Object>} - Updated cart
   */
  async markCartAsAbandoned(cartId, reason = 'user_inactivity') {
    try {
      const updatedCart = await this.prisma.carts.update({
        where: { id: cartId },
        data: {
          status: 'abandoned',
          abandonedAt: new Date(),
          abandonmentReason: reason
        }
      });

      // Create cart event
      await this.prisma.cart_events.create({
        data: {
          cartId,
          eventType: 'cart_abandoned',
          timestamp: new Date()
        }
      });

      // Track analytics
      await this.trackRecoveryEvent(cartId, 'cart_abandoned', { reason });

      this.logger.info('Cart marked as abandoned', {
        cartId,
        reason
      });

      return updatedCart;
    } catch (error) {
      this.logger.error('Error marking cart as abandoned', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Recover cart via token (from email link)
   * @param {string} token - Recovery token
   * @param {Object} options - Recovery options
   * @returns {Promise<Object>} - Recovery result
   */
  async recoverCartViaToken(token, options = {}) {
    try {
      const { sessionId = null, userId = null } = options;

      // Validate token
      const validation = await this.validateRecoveryToken(token);
      
      if (!validation.valid) {
        return {
          success: false,
          error: validation.reason,
          errorCode: 'INVALID_TOKEN'
        };
      }

      const { cart } = validation;

      // Check if already recovered
      if (cart.status === 'active' && !cart.abandonedAt) {
        return {
          success: false,
          error: 'Cart is already active',
          errorCode: 'ALREADY_ACTIVE',
          cart
        };
      }

      // Check if already converted to order
      if (cart.status === 'converted') {
        return {
          success: false,
          error: 'Cart has already been converted to an order',
          errorCode: 'ALREADY_CONVERTED',
          cart
        };
      }

      // Update cart to active
      const updatedCart = await this.prisma.carts.update({
        where: { id: cart.id },
        data: {
          status: 'active',
          recoveredAt: new Date(),
          recoveryToken: null,
          recoveryTokenExpires: null,
          ...(sessionId && { sessionId }),
          ...(userId && { userId })
        }
      });

      // Create recovery event
      await this.prisma.cart_events.create({
        data: {
          cartId: cart.id,
          userId: userId || cart.userId,
          eventType: 'cart_recovered_via_token',
          timestamp: new Date()
        }
      });

      // Track recovery event
      await this.trackRecoveryEvent(cart.id, 'cart_recovered', { 
        method: 'token',
        token 
      });

      // Track analytics
      await cartAnalyticsService.trackCartEvent(cart.id, userId || cart.userId, 'cart_recovered', {
        recoveryMethod: 'token',
        previousStatus: cart.status
      });

      this.logger.info('Cart recovered via token', {
        cartId: cart.id,
        token,
        userId: userId || cart.userId
      });

      return {
        success: true,
        cart: updatedCart,
        message: 'Cart recovered successfully'
      };
    } catch (error) {
      this.logger.error('Error recovering cart via token', {
        token,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Calculate optimal send time based on user behavior
   * @param {string} userId - User ID
   * @returns {Promise<Date|null>} - Optimal send time
   */
  async calculateOptimalSendTime(userId) {
    try {
      if (!userId) return null;

      // Get user's order history
      const orders = await this.prisma.orders.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      if (orders.length === 0) {
        // No history - use default (next business hour)
        return this.getDefaultOptimalTime();
      }

      // Calculate average order hour
      const orderHours = orders.map(order => new Date(order.createdAt).getHours());
      const avgHour = Math.round(orderHours.reduce((a, b) => a + b, 0) / orderHours.length);

      // Get user's timezone (default to Asia/Dhaka)
      const now = new Date();
      const optimalTime = new Date(now);
      optimalTime.setHours(avgHour, 0, 0, 0);

      // If time has passed for today, schedule for tomorrow
      if (optimalTime <= now) {
        optimalTime.setDate(optimalTime.getDate() + 1);
      }

      // Avoid late night hours (11 PM - 7 AM)
      if (avgHour < 7 || avgHour > 22) {
        optimalTime.setHours(10, 0, 0, 0);
      }

      return optimalTime;
    } catch (error) {
      this.logger.warn('Error calculating optimal send time', {
        userId,
        error: error.message
      });
      return this.getDefaultOptimalTime();
    }
  }

  /**
   * Validate a recovery token
   * @param {string} token - The recovery token
   * @returns {Promise<Object>} - Cart details if valid
   */
  async validateRecoveryToken(token) {
    try {
      // Find cart with valid recovery token
      const cart = await this.prisma.carts.findFirst({
        where: {
          recoveryToken: token,
          recoveryTokenExpires: {
            gt: new Date() // Token not expired
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              preferredLanguage: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  nameEn: true,
                  nameBn: true,
                  sku: true,
                  regularPrice: true,
                  salePrice: true,
                  images: {
                    where: { displayOrder: 0 },
                    take: 1,
                    select: { id: true, originalUrl: true, optimizedUrl: true, thumbnailUrl: true }
                  }
                }
              },
              variant: true
            },
            orderBy: { addedAt: 'desc' }
          }
        }
      });

      if (!cart) {
        return {
          valid: false,
          reason: 'Invalid or expired recovery token'
        };
      }

      // Check if cart is already converted
      if (cart.status === 'converted') {
        return {
          valid: false,
          reason: 'Cart has already been converted to an order'
        };
      }

      return {
        valid: true,
        cart
      };
    } catch (error) {
      this.logger.error('Error validating recovery token', {
        token,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Cancel scheduled reminders for a cart
   * @param {string} cartId - The cart ID
   * @returns {Promise<Object>} - Cancel result
   */
  async cancelReminders(cartId) {
    try {
      // Update cart analytics to mark reminders as cancelled
      const analytics = await this.prisma.cart_analytics.findUnique({
        where: { cartId }
      });

      if (analytics) {
        const events = analytics.events || {};
        if (events.recoverySchedule) {
          events.recoverySchedule.status = 'cancelled';
          events.recoverySchedule.cancelledAt = new Date().toISOString();

          await this.prisma.cart_analytics.update({
            where: { cartId },
            data: { events }
          });
        }
      }

      // Track event
      await this.trackRecoveryEvent(cartId, 'reminders_cancelled', {});

      this.logger.info('Reminders cancelled for cart', { cartId });

      return { success: true, cartId };
    } catch (error) {
      this.logger.error('Error cancelling reminders', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Track recovery email open
   * @param {string} token - Recovery token
   * @param {Object} metadata - Tracking metadata
   */
  async trackEmailOpen(token, metadata = {}) {
    try {
      const cart = await this.prisma.carts.findFirst({
        where: { recoveryToken: token }
      });

      if (cart) {
        await this.trackRecoveryEvent(cart.id, 'email_opened', metadata);
      }
    } catch (error) {
      this.logger.warn('Error tracking email open', { error: error.message });
    }
  }

  /**
   * Track recovery link click
   * @param {string} token - Recovery token
   * @param {Object} metadata - Tracking metadata
   */
  async trackLinkClick(token, metadata = {}) {
    try {
      const cart = await this.prisma.carts.findFirst({
        where: { recoveryToken: token }
      });

      if (cart) {
        await this.trackRecoveryEvent(cart.id, 'link_clicked', metadata);
      }
    } catch (error) {
      this.logger.warn('Error tracking link click', { error: error.message });
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Prepare email data for template
   * @private
   */
  async prepareEmailData(cart, recoveryUrl, template, options = {}) {
    const { discountCode, discountAmount, customMessage } = options;
    const user = cart.user;
    const items = cart.items.map(item => ({
      name: item.product.name,
      nameBn: item.product.nameBn || item.product.name,
      quantity: item.quantity,
      price: `BDT ${parseFloat(item.subtotal).toFixed(2)}`,
      imageUrl: item.product.images[0]?.thumbnailUrl || item.product.images[0]?.optimizedUrl || ''
    }));

    const subtotal = parseFloat(cart.subtotal);
    const shipping = parseFloat(cart.shippingCost);
    const tax = parseFloat(cart.tax);
    const discount = discountAmount ? parseFloat(discountAmount) : 0;
    const total = subtotal + shipping + tax - discount;

    const expiryDate = cart.recoveryTokenExpires 
      ? new Date(cart.recoveryTokenExpires).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'N/A';

    return {
      customerName: user?.firstName || 'Valued Customer',
      items,
      subtotal: `BDT ${subtotal.toFixed(2)}`,
      shipping: `BDT ${shipping.toFixed(2)}`,
      tax: `BDT ${tax.toFixed(2)}`,
      discount: discount > 0 ? `BDT ${discount.toFixed(2)}` : null,
      total: `BDT ${total.toFixed(2)}`,
      recoveryUrl,
      viewCartUrl: recoveryUrl,
      discountCode,
      discountAmount: discount > 0 ? `BDT ${discount.toFixed(2)}` : null,
      customMessage,
      expiryDate,
      year: new Date().getFullYear(),
      storeUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      contactUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/contact`,
      faqUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/faq`,
      supportUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/support`,
      unsubscribeUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe`,
      facebookUrl: 'https://facebook.com/smarttechnologiesbd',
      instagramUrl: 'https://instagram.com/smarttechnologiesbd',
      youtubeUrl: 'https://youtube.com/smarttechnologiesbd',
      hours: 23,
      minutes: 59,
      seconds: 59,
      saveForLaterUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/wishlist/add`,
      moveToWishlistUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/wishlist/move`
    };
  }

  /**
   * Load and process email template
   * @private
   */
  async loadEmailTemplate(template, data) {
    try {
      const templateFile = template === 'recovery' ? 'cart-recovery.html' :
                           template === 'reminder' ? 'cart-recovery-reminder.html' :
                           template === 'final' ? 'cart-recovery-final.html' :
                           'cart-recovery.html';

      const templatePath = path.join(this.templatesDir, templateFile);
      let html = await fs.readFile(templatePath, 'utf-8');

      // Simple template variable replacement
      html = html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] !== undefined ? data[key] : match;
      });

      // Handle conditional blocks
      html = html.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
        return data[key] ? content : '';
      });

      // Handle loops (simplified)
      html = html.replace(/\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, key, content) => {
        const items = data[key] || [];
        return items.map(item => {
          return content.replace(/\{\{(\w+)\}\}/g, (m, k) => item[k] !== undefined ? item[k] : m);
        }).join('');
      });

      return html;
    } catch (error) {
      this.logger.error('Error loading email template', { error: error.message });
      // Return simple fallback template
      return this.getFallbackTemplate(data);
    }
  }

  /**
   * Get email subject based on template and language
   * @private
   */
  getEmailSubject(template, language = 'en') {
    const subjects = {
      recovery: {
        en: 'Your cart is waiting! Complete your purchase at Smart Technologies Bangladesh',
        bn: 'আপনার কার্ট অপেক্ষা করছে! Smart Technologies Bangladesh-এ কেনাকাটা সম্পূর্ণ করুন'
      },
      reminder: {
        en: 'Reminder: Your items are still in your cart',
        bn: 'অনুস্মারক: আপনার আইটেমগুলো এখনও কার্টে আছে'
      },
      final: {
        en: 'Final reminder: Your cart expires soon!',
        bn: 'চূড়ান্ত অনুস্মারক: আপনার কার্ট শীঘ্রই মেয়াদ শেষ হবে!'
      }
    };

    return subjects[template]?.[language] || subjects[template]?.en || subjects.recovery.en;
  }

  /**
   * Generate plain text version of email
   * @private
   */
  generatePlainText(data, template) {
    return `
Hi ${data.customerName},

We noticed you left items in your cart at Smart Technologies Bangladesh.

Cart Total: ${data.total}

Complete your purchase: ${data.recoveryUrl}

This link will expire on ${data.expiryDate}.

If you didn't leave items in your cart, you can safely ignore this email.

Smart Technologies Bangladesh
House #15, Road #12, Sector #4, Uttara, Dhaka-1230
Email: support@smarttechnologiesbd.com
    `.trim();
  }

  /**
   * Get fallback template
   * @private
   */
  getFallbackTemplate(data) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi ${data.customerName},</h2>
        <p>We noticed you left some items in your shopping cart. Don't worry, we've saved them for you!</p>
        <p><strong>Cart Total: ${data.total}</strong></p>
        <a href="${data.recoveryUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          Complete Your Purchase
        </a>
        <p>This link will expire on ${data.expiryDate}.</p>
      </div>
    `;
  }

  /**
   * Track recovery event
   * @private
   */
  async trackRecoveryEvent(cartId, eventType, metadata = {}) {
    try {
      await this.prisma.cart_recovery_events.create({
        data: {
          cartId,
          eventType,
          metadata,
          createdAt: new Date()
        }
      });
    } catch (error) {
      this.logger.warn('Error tracking recovery event', { error: error.message });
    }
  }

  /**
   * Get default optimal time (next business day 10 AM)
   * @private
   */
  getDefaultOptimalTime() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow;
  }

  /**
   * Get daily recovery stats
   * @private
   */
  async getDailyRecoveryStats(startDate, endDate) {
    try {
      const days = [];
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayStart = new Date(d);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(d);
        dayEnd.setHours(23, 59, 59, 999);

        const [abandoned, recovered, emailsSent] = await Promise.all([
          this.prisma.carts.count({
            where: {
              status: 'abandoned',
              abandonedAt: { gte: dayStart, lte: dayEnd }
            }
          }),
          this.prisma.carts.count({
            where: {
              recoveredAt: { gte: dayStart, lte: dayEnd }
            }
          }),
          this.prisma.carts.count({
            where: {
              recoveryEmailSentAt: { gte: dayStart, lte: dayEnd }
            }
          })
        ]);

        days.push({
          date: dayStart.toISOString().split('T')[0],
          abandoned,
          recovered,
          emailsSent,
          recoveryRate: abandoned > 0 ? parseFloat(((recovered / abandoned) * 100).toFixed(2)) : 0
        });
      }

      return days;
    } catch (error) {
      this.logger.error('Error getting daily recovery stats', { error: error.message });
      return [];
    }
  }

  /**
   * Generate a secure token
   * @private
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
}

// Singleton instance
const cartRecoveryService = new CartRecoveryService();

module.exports = {
  CartRecoveryService,
  cartRecoveryService
};
