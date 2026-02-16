/**
 * Cart Recovery Service
 * Handles cart recovery operations for abandoned carts
 * 
 * Features:
 * - Generate recovery tokens for abandoned carts
 * - Validate recovery tokens
 * - Recover abandoned carts to active state
 * - Share carts with customers
 * - Bulk recovery operations
 * - Recovery statistics
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const { loggerService } = require('./logger');
const emailService = require('./emailService');

class CartRecoveryService {
  constructor() {
    this.prisma = new PrismaClient();
    this.logger = loggerService;
    // Default token expiration: 7 days
    this.defaultTokenExpiryDays = 7;
    // Maximum recovery attempts per cart
    this.maxRecoveryAttempts = 5;
  }

  /**
   * Generate a unique recovery token for a cart
   * @param {string} cartId - The cart ID
   * @returns {Promise<Object>} - Recovery token details
   */
  async generateRecoveryToken(cartId) {
    try {
      // Validate cart exists
      const cart = await this.prisma.cart.findUnique({
        where: { id: cartId }
      });

      if (!cart) {
        throw new Error('Cart not found');
      }

      // Generate unique token
      const token = this.generateSecureToken();
      
      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.defaultTokenExpiryDays);

      // Store recovery token in cart record
      const updatedCart = await this.prisma.cart.update({
        where: { id: cartId },
        data: {
          recoveryToken: token,
          recoveryTokenExpires: expiresAt
        }
      });

      this.logger.info('Recovery token generated', {
        cartId,
        tokenId: updatedCart.id,
        expiresAt
      });

      return {
        token,
        expiresAt,
        cartId,
        shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cart/recover/${token}`
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
   * Validate a recovery token
   * @param {string} token - The recovery token
   * @returns {Promise<Object>} - Cart details if valid
   */
  async validateRecoveryToken(token) {
    try {
      // Find cart with valid recovery token
      const cart = await this.prisma.cart.findFirst({
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
              lastName: true
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
          },
          analytics: true
        }
      });

      if (!cart) {
        return {
          valid: false,
          reason: 'Invalid or expired recovery token'
        };
      }

      // Check if cart is already active
      if (cart.status === 'active') {
        return {
          valid: true,
          cart,
          alreadyActive: true,
          message: 'Cart is already active'
        };
      }

      return {
        valid: true,
        cart,
        alreadyActive: false
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
   * Recover an abandoned cart to active state
   * @param {string} cartId - The cart ID to recover
   * @param {string} adminId - The admin performing the recovery
   * @param {Object} options - Recovery options
   * @returns {Promise<Object>} - Recovery result
   */
  async recoverCart(cartId, adminId, options = {}) {
    try {
      const { notifyUser = false, emailTemplate = 'cart_recovery', notes = null } = options;

      // Validate cart exists and is abandoned
      const cart = await this.prisma.cart.findUnique({
        where: { id: cartId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!cart) {
        throw new Error('Cart not found');
      }

      if (cart.status !== 'abandoned') {
        throw new Error(`Cannot recover cart with status: ${cart.status}. Only abandoned carts can be recovered.`);
      }

      // Check recovery count limit
      if (cart.recoveryCount >= this.maxRecoveryAttempts) {
        throw new Error(`Cart has exceeded maximum recovery attempts (${this.maxRecoveryAttempts})`);
      }

      // Get the admin user for audit log
      const admin = await this.prisma.user.findUnique({
        where: { id: adminId },
        select: { email: true, firstName: true, lastName: true }
      });

      // Update cart to active status
      const updatedCart = await this.prisma.cart.update({
        where: { id: cartId },
        data: {
          status: 'active',
          recoveryCount: { increment: 1 },
          lastRecoveryAt: new Date(),
          recoveryNotes: notes || cart.recoveryNotes,
          recoveryToken: null, // Clear the recovery token after successful recovery
          recoveryTokenExpires: null
        }
      });

      // Create audit log entry
      await this.prisma.cartEvent.create({
        data: {
          cartId,
          userId: adminId,
          eventType: 'cart_recovered',
          timestamp: new Date(),
          cart: {
            connect: { id: cartId }
          },
          user: {
            connect: { id: adminId }
          }
        }
      });

      // Track analytics event
      await this.trackRecoveryAnalytics(cartId, adminId, notes);

      // Notify user if requested
      let notificationResult = null;
      if (notifyUser && cart.user?.email) {
        try {
          notificationResult = await this.sendRecoveryNotification(
            cart.user.email,
            cart.user.firstName,
            cartId,
            emailTemplate
          );
        } catch (emailError) {
          this.logger.warn('Failed to send recovery notification', {
            cartId,
            email: cart.user.email,
            error: emailError.message
          });
        }
      }

      // Recalculate cart totals
      await this.recalculateCartTotals(cartId);

      this.logger.info('Cart recovered successfully', {
        cartId,
        adminId: adminId,
        adminEmail: admin?.email,
        recoveryCount: updatedCart.recoveryCount,
        notificationSent: !!notificationResult
      });

      return {
        success: true,
        cart: updatedCart,
        recoveryCount: updatedCart.recoveryCount,
        lastRecoveryAt: updatedCart.lastRecoveryAt,
        notificationSent: !!notificationResult
      };
    } catch (error) {
      this.logger.error('Error recovering cart', {
        cartId,
        adminId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Share a cart with a customer via email
   * @param {string} cartId - The cart ID to share
   * @param {Object} options - Share options
   * @returns {Promise<Object>} - Share result
   */
  async shareCart(cartId, options = {}) {
    try {
      const { expiresInDays = 7, sendEmail = false, recipientEmail = null, customMessage = null } = options;

      // Validate cart exists
      const cart = await this.prisma.cart.findUnique({
        where: { id: cartId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
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
            }
          }
        }
      });

      if (!cart) {
        throw new Error('Cart not found');
      }

      // Generate share token
      const token = this.generateSecureToken();
      
      // Calculate expiration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      // Store share token
      const shareToken = await this.prisma.cartShareToken.create({
        data: {
          cartId,
          token,
          expiresAt
        }
      });

      // Create share URL
      const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cart/shared/${token}`;

      // Send email if requested
      let emailResult = null;
      if (sendEmail && recipientEmail) {
        try {
          emailResult = await this.sendShareNotification(
            recipientEmail,
            cart.user?.firstName || 'Customer',
            shareUrl,
            customMessage,
            cart.items,
            cart.total
          );
        } catch (emailError) {
          this.logger.warn('Failed to send share notification', {
            cartId,
            recipientEmail,
            error: emailError.message
          });
        }
      }

      // Track analytics
      await this.trackShareAnalytics(cartId, recipientEmail, sendEmail);

      this.logger.info('Cart shared successfully', {
        cartId,
        shareTokenId: shareToken.id,
        expiresAt,
        emailSent: sendEmail,
        recipientEmail
      });

      return {
        success: true,
        shareToken,
        shareUrl,
        expiresAt,
        emailSent: sendEmail,
        emailResult
      };
    } catch (error) {
      this.logger.error('Error sharing cart', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get recovery statistics for a date range
   * @param {Object} dateRange - Date range options
   * @returns {Promise<Object>} - Recovery statistics
   */
  async getRecoveryStats(dateRange = {}) {
    try {
      const { startDate, endDate } = dateRange;

      // Build date filter
      const dateFilter = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.lte = new Date(endDate);
      }

      // Get total carts
      const totalCarts = await this.prisma.cart.count({
        where: dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {}
      });

      // Get carts by status
      const [abandonedCarts, recoveredCarts, activeCarts, convertedCarts] = await Promise.all([
        this.prisma.cart.count({
          where: {
            ...(dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {}),
            status: 'abandoned'
          }
        }),
        this.prisma.cart.count({
          where: {
            ...(dateFilter.gte || dateFilter.lte ? { lastRecoveryAt: dateFilter } : {}),
            recoveryCount: { gt: 0 }
          }
        }),
        this.prisma.cart.count({
          where: {
            ...(dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {}),
            status: 'active'
          }
        }),
        this.prisma.cart.count({
          where: {
            ...(dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {}),
            status: 'converted'
          }
        })
      ]);

      // Get recovery rate
      const recoveryRate = abandonedCarts > 0 ? (recoveredCarts / abandonedCarts) * 100 : 0;

      // Get average recovery time
      const recoveredCartsData = await this.prisma.cart.findMany({
        where: {
          ...(dateFilter.gte || dateFilter.lte ? { lastRecoveryAt: dateFilter } : {}),
          recoveryCount: { gt: 0 }
        },
        select: {
          createdAt: true,
          lastRecoveryAt: true,
          recoveryCount: true
        }
      });

      const avgRecoveryTime = recoveredCartsData.length > 0
        ? recoveredCartsData.reduce((sum, cart) => {
            const recoveryTime = new Date(cart.lastRecoveryAt) - new Date(cart.createdAt);
            return sum + recoveryTime;
          }, 0) / recoveredCartsData.length
        : 0;

      // Get recent recovered carts
      const recentRecovered = await this.prisma.cart.findMany({
        where: {
          lastRecoveryAt: dateFilter.gte || dateFilter.lte ? dateFilter : undefined,
          recoveryCount: { gt: 0 }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { lastRecoveryAt: 'desc' },
        take: 10
      });

      // Get trends (daily recovery counts for last 7 days)
      const trends = await this.getRecoveryTrends();

      return {
        totalCarts,
        abandonedCarts,
        recoveredCarts,
        activeCarts,
        convertedCarts,
        recoveryRate: parseFloat(recoveryRate.toFixed(2)),
        avgRecoveryTimeHours: parseFloat((avgRecoveryTime / (1000 * 60 * 60)).toFixed(2)),
        recentRecovered: recentRecovered.map(cart => ({
          cartId: cart.id,
          userEmail: cart.user?.email || 'Guest',
          userName: cart.user ? `${cart.user.firstName} ${cart.user.lastName}` : 'Guest',
          recoveredAt: cart.lastRecoveryAt,
          recoveryCount: cart.recoveryCount
        })),
        trends
      };
    } catch (error) {
      this.logger.error('Error getting recovery stats', {
        dateRange,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get recovery trends for the last N days
   * @param {number} days - Number of days to analyze
   * @returns {Promise<Array>} - Daily trends
   */
  async getRecoveryTrends(days = 7) {
    try {
      const trends = [];
      const now = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const recovered = await this.prisma.cart.count({
          where: {
            lastRecoveryAt: {
              gte: date,
              lt: nextDate
            }
          }
        });

        const abandoned = await this.prisma.cart.count({
          where: {
            status: 'abandoned',
            createdAt: {
              gte: date,
              lt: nextDate
            }
          }
        });

        trends.push({
          date: date.toISOString().split('T')[0],
          recovered,
          abandoned,
          rate: abandoned > 0 ? parseFloat((recovered / abandoned * 100).toFixed(2)) : 0
        });
      }

      return trends;
    } catch (error) {
      this.logger.error('Error getting recovery trends', {
        days,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Bulk recover multiple carts
   * @param {Array<string>} cartIds - Array of cart IDs to recover
   * @param {string} adminId - The admin performing the recovery
   * @param {Object} options - Recovery options
   * @returns {Promise<Object>} - Bulk recovery result
   */
  async bulkRecoverCarts(cartIds, adminId, options = {}) {
    try {
      const { notifyUsers = false, notes = null } = options;

      if (!Array.isArray(cartIds) || cartIds.length === 0) {
        throw new Error('Cart IDs array is required');
      }

      if (cartIds.length > 100) {
        throw new Error('Cannot recover more than 100 carts at once');
      }

      // Validate all carts exist and are abandoned
      const carts = await this.prisma.cart.findMany({
        where: { id: { in: cartIds } },
        select: {
          id: true,
          status: true,
          recoveryCount: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true
            }
          }
        }
      });

      const validCarts = carts.filter(cart => cart.status === 'abandoned');
      const invalidCarts = carts.filter(cart => cart.status !== 'abandoned');

      if (validCarts.length === 0) {
        throw new Error('No valid abandoned carts found to recover');
      }

      // Recover each cart
      const results = {
        recovered: [],
        failed: [],
        skipped: invalidCarts.map(c => ({
          cartId: c.id,
          reason: `Cart status is: ${c.status}`
        }))
      };

      for (const cart of validCarts) {
        try {
          const result = await this.recoverCart(cart.id, adminId, {
            notifyUser: notifyUsers,
            notes
          });
          results.recovered.push({
            cartId: cart.id,
            userEmail: cart.user?.email || null,
            success: true
          });
        } catch (error) {
          results.failed.push({
            cartId: cart.id,
            userEmail: cart.user?.email || null,
            reason: error.message
          });
        }
      }

      this.logger.info('Bulk cart recovery completed', {
        adminId,
        totalRequested: cartIds.length,
        recovered: results.recovered.length,
        failed: results.failed.length,
        skipped: results.skipped.length
      });

      return {
        success: true,
        ...results,
        summary: {
          total: cartIds.length,
          recovered: results.recovered.length,
          failed: results.failed.length,
          skipped: results.skipped.length
        }
      };
    } catch (error) {
      this.logger.error('Error in bulk cart recovery', {
        cartIds,
        adminId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get recovery history for a specific cart
   * @param {string} cartId - The cart ID
   * @returns {Promise<Array>} - Recovery history
   */
  async getRecoveryHistory(cartId) {
    try {
      // Get cart events related to recovery
      const events = await this.prisma.cartEvent.findMany({
        where: {
          cartId,
          eventType: { in: ['cart_recovered', 'cart_abandoned', 'recovery_token_generated', 'cart_shared'] }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { timestamp: 'desc' }
      });

      // Get recovery-specific data from cart
      const cart = await this.prisma.cart.findUnique({
        where: { id: cartId },
        select: {
          recoveryCount: true,
          lastRecoveryAt: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return {
        cartId,
        recoveryCount: cart?.recoveryCount || 0,
        lastRecoveryAt: cart?.lastRecoveryAt,
        history: events.map(event => ({
          id: event.id,
          type: event.eventType,
          timestamp: event.timestamp,
          adminId: event.userId,
          adminEmail: event.user?.email || null,
          adminName: event.user ? `${event.user.firstName} ${event.user.lastName}` : null
        }))
      };
    } catch (error) {
      this.logger.error('Error getting recovery history', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Invalidate a recovery token
   * @param {string} cartId - The cart ID
   * @returns {Promise<Object>} - Result
   */
  async invalidateRecoveryToken(cartId) {
    try {
      await this.prisma.cart.update({
        where: { id: cartId },
        data: {
          recoveryToken: null,
          recoveryTokenExpires: null
        }
      });

      this.logger.info('Recovery token invalidated', { cartId });

      return { success: true };
    } catch (error) {
      this.logger.error('Error invalidating recovery token', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Generate a secure token
   * @param {number} length - Token length
   * @returns {string} - Generated token
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Recalculate cart totals
   * @param {string} cartId - The cart ID
   */
  async recalculateCartTotals(cartId) {
    try {
      const items = await this.prisma.cartItem.findMany({
        where: { cartId }
      });

      const subtotal = items.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);
      const taxRate = parseFloat(process.env.CART_TAX_RATE) || 0.15;
      const shippingCost = parseFloat(process.env.CART_SHIPPING_COST) || 100;

      // Tax rate is stored as percentage (e.g., 10 for 10%), so divide by 100 to get decimal
      const tax = subtotal * (taxRate / 100);
      const total = subtotal + tax + shippingCost;

      await this.prisma.cart.update({
        where: { id: cartId },
        data: {
          subtotal: parseFloat(subtotal.toFixed(2)),
          tax: parseFloat(tax.toFixed(2)),
          shippingCost: parseFloat(shippingCost.toFixed(2)),
          total: parseFloat(total.toFixed(2))
        }
      });
    } catch (error) {
      this.logger.warn('Error recalculating cart totals', {
        cartId,
        error: error.message
      });
    }
  }

  /**
   * Track recovery analytics event
   * @param {string} cartId - The cart ID
   * @param {string} adminId - The admin ID
   * @param {string} notes - Recovery notes
   */
  async trackRecoveryAnalytics(cartId, adminId, notes) {
    try {
      const analytics = await this.prisma.cartAnalytics.findUnique({
        where: { cartId }
      });

      if (analytics) {
        const events = analytics.events || {};
        events[`recovery_${Date.now()}`] = {
          timestamp: new Date().toISOString(),
          type: 'cart_recovered',
          adminId,
          notes
        };

        await this.prisma.cartAnalytics.update({
          where: { cartId },
          data: { events }
        });
      }
    } catch (error) {
      this.logger.warn('Error tracking recovery analytics', {
        cartId,
        error: error.message
      });
    }
  }

  /**
   * Track share analytics event
   * @param {string} cartId - The cart ID
   * @param {string} recipientEmail - Recipient email
   * @param {boolean} emailSent - Whether email was sent
   */
  async trackShareAnalytics(cartId, recipientEmail, emailSent) {
    try {
      const analytics = await this.prisma.cartAnalytics.findUnique({
        where: { cartId }
      });

      if (analytics) {
        const events = analytics.events || {};
        events[`share_${Date.now()}`] = {
          timestamp: new Date().toISOString(),
          type: 'cart_shared',
          recipientEmail,
          emailSent
        };

        await this.prisma.cartAnalytics.update({
          where: { cartId },
          data: { events }
        });
      }
    } catch (error) {
      this.logger.warn('Error tracking share analytics', {
        cartId,
        error: error.message
      });
    }
  }

  /**
   * Send recovery notification email
   * @param {string} email - Recipient email
   * @param {string} firstName - Recipient first name
   * @param {string} cartId - Cart ID
   * @param {string} template - Email template name
   * @returns {Promise<Object>} - Email send result
   */
  async sendRecoveryNotification(email, firstName, cartId, template) {
    try {
      // Generate recovery link
      const recoveryToken = await this.generateRecoveryToken(cartId);
      const recoveryUrl = recoveryToken.shareUrl;

      const subject = 'Your shopping cart is waiting!';
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Hi ${firstName || 'there'},</h2>
          <p>We noticed you left some items in your shopping cart. Don't worry, we've saved it for you!</p>
          <p>Click the button below to complete your purchase:</p>
          <a href="${recoveryUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
            Complete Your Purchase
          </a>
          <p>This link will expire in 7 days.</p>
          <p style="color: #666; font-size: 12px;">
            If you didn't leave items in your cart, you can safely ignore this email.
          </p>
        </div>
      `;

      const textContent = `
        Hi ${firstName || 'there'},
        
        We noticed you left some items in your shopping cart. Don't worry, we've saved it for you!
        
        Click the link below to complete your purchase:
        ${recoveryUrl}
        
        This link will expire in 7 days.
        
        If you didn't leave items in your cart, you can safely ignore this email.
      `;

      const result = await emailService.sendEmail({
        to: email,
        subject,
        html: htmlContent,
        text: textContent
      });

      this.logger.info('Recovery notification sent', {
        email,
        cartId,
        messageId: result.messageId
      });

      return result;
    } catch (error) {
      this.logger.error('Error sending recovery notification', {
        email,
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send share notification email
   * @param {string} email - Recipient email
   * @param {string} senderName - Sender's name
   * @param {string} shareUrl - Share URL
   * @param {string} customMessage - Custom message
   * @param {Array} items - Cart items
   * @param {number} total - Cart total
   * @returns {Promise<Object>} - Email send result
   */
  async sendShareNotification(email, senderName, shareUrl, customMessage, items, total) {
    try {
      const subject = `${senderName} shared a shopping cart with you!`;
      
      const itemsList = items.slice(0, 5).map(item => 
        `<li>${item.product.name} - Qty: ${item.quantity} - ${parseFloat(item.price).toFixed(2)}</li>`
      ).join('');

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Hi there,</h2>
          <p>${senderName} shared a shopping cart with you!</p>
          ${customMessage ? `<p><em>"${customMessage}"</em></p>` : ''}
          <div style="background-color: #f5f5f5; padding: 16px; border-radius: 4px; margin: 16px 0;">
            <h3 style="margin-top: 0;">Cart Contents</h3>
            <ul>${itemsList}</ul>
            ${items.length > 5 ? `<li>...and ${items.length - 5} more items</li>` : ''}
            <p><strong>Total: ${parseFloat(total).toFixed(2)} BDT</strong></p>
          </div>
          <a href="${shareUrl}" style="display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
            View Cart
          </a>
          <p style="color: #666; font-size: 12px;">
            This shared cart link will expire in 7 days.
          </p>
        </div>
      `;

      const result = await emailService.sendEmail({
        to: email,
        subject,
        html: htmlContent
      });

      this.logger.info('Share notification sent', {
        email,
        senderName,
        messageId: result.messageId
      });

      return result;
    } catch (error) {
      this.logger.error('Error sending share notification', {
        email,
        error: error.message
      });
      throw error;
    }
  }
}

// Singleton instance
const cartRecoveryService = new CartRecoveryService();

module.exports = {
  CartRecoveryService,
  cartRecoveryService
};
