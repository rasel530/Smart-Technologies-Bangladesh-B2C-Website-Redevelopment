const { PrismaClient } = require('@prisma/client');
const { cartService } = require('./cartService');
const { loggerService } = require('./logger');
const crypto = require('crypto');

/**
 * Guest Checkout Service
 * Handles guest session management, cart merging, and order tracking for guest users
 */
class GuestCheckoutService {
  constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
    });
    this.logger = loggerService;
    
    // Guest session expiration (24 hours)
    this.sessionTTL = 24 * 60 * 60 * 1000;
  }

  /**
   * Create new guest session
   * @param {string} sessionId - Unique session ID
   * @param {string} cartId - Cart ID associated with the session
   * @returns {Promise<Object>} Created guest session
   */
  async createGuestSession(sessionId, cartId) {
    try {
      this.logger.info('[createGuestSession] Creating guest session', { sessionId, cartId });

      // Validate cart exists
      const cart = await this.prisma.cart.findUnique({
        where: { id: cartId }
      });

      if (!cart) {
        throw new Error('Cart not found');
      }

      // Generate unique guest session ID
      const guestSessionId = crypto.randomUUID();

      // Create guest session
      const guestSession = await this.prisma.guestSession.create({
        data: {
          id: guestSessionId,
          sessionId,
          cartId,
          lastActivityAt: new Date(),
          expiresAt: new Date(Date.now() + this.sessionTTL),
          metadata: {
            createdAt: new Date().toISOString(),
            ipAddress: null,
            userAgent: null
          }
        }
      });

      this.logger.info('[createGuestSession] Guest session created', {
        guestSessionId,
        sessionId,
        cartId
      });

      return guestSession;
    } catch (error) {
      this.logger.error('[createGuestSession] Error creating guest session', {
        sessionId,
        cartId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Retrieve guest session
   * @param {string} sessionId - Guest session ID
   * @returns {Promise<Object>} Guest session with cart details
   */
  async getGuestSession(sessionId) {
    try {
      this.logger.info('[getGuestSession] Retrieving guest session', { sessionId });

      const guestSession = await this.prisma.guestSession.findUnique({
        where: { sessionId },
        include: {
          cart: {
            include: {
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
                        select: {
                          id: true,
                          originalUrl: true,
                          optimizedUrl: true,
                          thumbnailUrl: true,
                          altTextEn: true,
                          altTextBn: true
                        }
                      }
                    }
                  },
                  variant: true
                }
              }
            }
          }
        }
      });

      if (!guestSession) {
        throw new Error('Guest session not found');
      }

      // Check if session is expired
      if (guestSession.expiresAt < new Date()) {
        await this.expireGuestSession(sessionId);
        throw new Error('Guest session has expired');
      }

      // Check if session is already converted
      if (guestSession.convertedToUserId) {
        throw new Error('Guest session has been converted to user');
      }

      // Calculate cart totals
      const totals = await cartService.calculateCartTotals(guestSession.cartId);

      this.logger.info('[getGuestSession] Guest session retrieved', {
        sessionId,
        cartId: guestSession.cartId
      });

      return {
        ...guestSession,
        totals
      };
    } catch (error) {
      this.logger.error('[getGuestSession] Error retrieving guest session', {
        sessionId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Update guest session data
   * @param {string} sessionId - Guest session ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} Updated guest session
   */
  async updateGuestSession(sessionId, data) {
    try {
      this.logger.info('[updateGuestSession] Updating guest session', { sessionId, data });

      // Get current session
      const guestSession = await this.prisma.guestSession.findUnique({
        where: { sessionId }
      });

      if (!guestSession) {
        throw new Error('Guest session not found');
      }

      // Check if session is expired
      if (guestSession.expiresAt < new Date()) {
        await this.expireGuestSession(sessionId);
        throw new Error('Guest session has expired');
      }

      // Check if session is already converted
      if (guestSession.convertedToUserId) {
        throw new Error('Guest session has been converted to user');
      }

      // Prepare update data
      const updateData = {
        ...data,
        lastActivityAt: new Date(),
        updatedAt: new Date()
      };

      // Update guest session
      const updatedSession = await this.prisma.guestSession.update({
        where: { sessionId },
        data: updateData
      });

      this.logger.info('[updateGuestSession] Guest session updated', {
        sessionId,
        updateData
      });

      return updatedSession;
    } catch (error) {
      this.logger.error('[updateGuestSession] Error updating guest session', {
        sessionId,
        data,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Track guest activity for session timeout detection
   * @param {string} sessionId - Guest session ID
   * @returns {Promise<Object>} Updated guest session
   */
  async trackGuestActivity(sessionId) {
    try {
      this.logger.info('[trackGuestActivity] Tracking guest activity', { sessionId });

      const guestSession = await this.prisma.guestSession.findUnique({
        where: { sessionId }
      });

      if (!guestSession) {
        throw new Error('Guest session not found');
      }

      // Update last activity timestamp
      const updatedSession = await this.prisma.guestSession.update({
        where: { sessionId },
        data: {
          lastActivityAt: new Date(),
          updatedAt: new Date()
        }
      });

      this.logger.info('[trackGuestActivity] Guest activity tracked', {
        sessionId,
        lastActivityAt: updatedSession.lastActivityAt
      });

      return updatedSession;
    } catch (error) {
      this.logger.error('[trackGuestActivity] Error tracking guest activity', {
        sessionId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Convert guest session to user
   * @param {string} sessionId - Guest session ID
   * @param {string} userId - User ID to convert to
   * @returns {Promise<Object>} Conversion result
   */
  async convertGuestToUser(sessionId, userId) {
    try {
      this.logger.info('[convertGuestToUser] Converting guest to user', { sessionId, userId });

      // Validate user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get guest session
      const guestSession = await this.prisma.guestSession.findUnique({
        where: { sessionId },
        include: {
          cart: true
        }
      });

      if (!guestSession) {
        throw new Error('Guest session not found');
      }

      // Check if session is expired
      if (guestSession.expiresAt < new Date()) {
        await this.expireGuestSession(sessionId);
        throw new Error('Guest session has expired');
      }

      // Check if already converted
      if (guestSession.convertedToUserId) {
        throw new Error('Guest session already converted');
      }

      // Merge guest cart with user cart
      if (guestSession.cart) {
        await this.mergeGuestCart(guestSession.cartId, userId);
      }

      // Update guest session
      const updatedSession = await this.prisma.guestSession.update({
        where: { sessionId },
        data: {
          convertedToUserId: userId,
          convertedAt: new Date(),
          updatedAt: new Date()
        }
      });

      this.logger.info('[convertGuestToUser] Guest converted to user', {
        sessionId,
        userId,
        cartId: guestSession.cartId
      });

      return {
        success: true,
        sessionId,
        userId,
        cartId: guestSession.cartId
      };
    } catch (error) {
      this.logger.error('[convertGuestToUser] Error converting guest to user', {
        sessionId,
        userId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Mark guest session as expired
   * @param {string} sessionId - Guest session ID
   * @returns {Promise<Object>} Expired session
   */
  async expireGuestSession(sessionId) {
    try {
      this.logger.info('[expireGuestSession] Expiring guest session', { sessionId });

      const guestSession = await this.prisma.guestSession.findUnique({
        where: { sessionId }
      });

      if (!guestSession) {
        throw new Error('Guest session not found');
      }

      // Mark session as expired by setting expiresAt to past
      const expiredSession = await this.prisma.guestSession.update({
        where: { sessionId },
        data: {
          expiresAt: new Date(Date.now() - 1000),
          updatedAt: new Date()
        }
      });

      this.logger.info('[expireGuestSession] Guest session expired', { sessionId });

      return expiredSession;
    } catch (error) {
      this.logger.error('[expireGuestSession] Error expiring guest session', {
        sessionId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Merge guest cart with user cart
   * @param {string} guestCartId - Guest cart ID
   * @param {string} userCartId - User cart ID
   * @returns {Promise<Object>} Merged cart
   */
  async mergeGuestCart(guestCartId, userCartId) {
    try {
      this.logger.info('[mergeGuestCart] Merging guest cart with user cart', {
        guestCartId,
        userCartId
      });

      // Get guest cart
      const guestCart = await this.prisma.cart.findUnique({
        where: { id: guestCartId },
        include: {
          items: true
        }
      });

      if (!guestCart) {
        throw new Error('Guest cart not found');
      }

      // Get user cart
      const userCart = await this.prisma.cart.findUnique({
        where: { id: userCartId },
        include: {
          items: true
        }
      });

      if (!userCart) {
        throw new Error('User cart not found');
      }

      // Merge items: keep user cart items, add guest cart items
      // If same product exists in both, add quantities
      for (const guestItem of guestCart.items) {
        const existingItem = userCart.items.find(
          item => item.productId === guestItem.productId && 
                  item.variantId === guestItem.variantId
        );

        if (existingItem) {
          // Update quantity of existing item
          await this.prisma.cartItem.update({
            where: { id: existingItem.id },
            data: {
              quantity: existingItem.quantity + guestItem.quantity,
              subtotal: (existingItem.quantity + guestItem.quantity) * parseFloat(guestItem.price)
            }
          });
        } else {
          // Add new item to user cart
          await this.prisma.cartItem.create({
            data: {
              cartId: userCartId,
              productId: guestItem.productId,
              variantId: guestItem.variantId,
              quantity: guestItem.quantity,
              price: guestItem.price,
              subtotal: guestItem.subtotal
            }
          });
        }
      }

      // Recalculate user cart totals
      const totals = await cartService.calculateCartTotals(userCartId);

      // Update user cart totals
      await this.prisma.cart.update({
        where: { id: userCartId },
        data: {
          subtotal: totals.subtotal,
          tax: totals.tax,
          shippingCost: totals.shippingCost,
          discount: totals.discount,
          total: totals.total,
          updatedAt: new Date()
        }
      });

      // Mark guest cart as converted
      await this.prisma.cart.update({
        where: { id: guestCartId },
        data: {
          status: 'converted',
          updatedAt: new Date()
        }
      });

      this.logger.info('[mergeGuestCart] Carts merged successfully', {
        guestCartId,
        userCartId,
        mergedItemCount: guestCart.items.length
      });

      return {
        success: true,
        userCartId,
        mergedItemCount: guestCart.items.length,
        totals
      };
    } catch (error) {
      this.logger.error('[mergeGuestCart] Error merging carts', {
        guestCartId,
        userCartId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get guest orders by email or phone
   * @param {string} email - Guest email
   * @param {string} phone - Guest phone
   * @returns {Promise<Array>} Guest orders
   */
  async getGuestOrders(email, phone) {
    try {
      this.logger.info('[getGuestOrders] Getting guest orders', { email, phone });

      if (!email && !phone) {
        throw new Error('Email or phone is required');
      }

      // Find orders by guest email or phone
      const orders = await this.prisma.order.findMany({
        where: {
          OR: [
            { address: { phone: phone || undefined } },
            // Note: Email is not stored in address, so we need to check orders directly
            // This is a limitation - we might need to store guest email in order metadata
          ]
        },
        include: {
          address: true,
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  nameEn: true,
                  nameBn: true,
                  images: {
                    where: { displayOrder: 0 },
                    take: 1,
                    select: {
                      id: true,
                      originalUrl: true,
                      thumbnailUrl: true
                    }
                  }
                }
              }
            }
          },
          transactions: true
        },
        orderBy: { createdAt: 'desc' }
      });

      // Filter by email if provided (check in metadata or notes)
      let filteredOrders = orders;
      if (email) {
        filteredOrders = orders.filter(order => {
          const metadata = order.paymentDetails || {};
          return metadata.email === email || 
                 order.notes?.toLowerCase().includes(email.toLowerCase());
        });
      }

      this.logger.info('[getGuestOrders] Guest orders retrieved', {
        email,
        phone,
        orderCount: filteredOrders.length
      });

      return filteredOrders;
    } catch (error) {
      this.logger.error('[getGuestOrders] Error getting guest orders', {
        email,
        phone,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Validate guest session is active
   * @param {string} sessionId - Guest session ID
   * @returns {Promise<Object>} Validation result
   */
  async validateGuestSession(sessionId) {
    try {
      this.logger.info('[validateGuestSession] Validating guest session', { sessionId });

      const guestSession = await this.prisma.guestSession.findUnique({
        where: { sessionId }
      });

      if (!guestSession) {
        return {
          isValid: false,
          reason: 'Session not found'
        };
      }

      // Check if session is expired
      if (guestSession.expiresAt < new Date()) {
        return {
          isValid: false,
          reason: 'Session expired'
        };
      }

      // Check if session is converted
      if (guestSession.convertedToUserId) {
        return {
          isValid: false,
          reason: 'Session converted to user'
        };
      }

      this.logger.info('[validateGuestSession] Guest session validated', {
        sessionId,
        isValid: true
      });

      return {
        isValid: true,
        sessionId,
        cartId: guestSession.cartId,
        expiresAt: guestSession.expiresAt
      };
    } catch (error) {
      this.logger.error('[validateGuestSession] Error validating guest session', {
        sessionId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Clean up expired guest sessions
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupExpiredGuestSessions() {
    try {
      this.logger.info('[cleanupExpiredGuestSessions] Cleaning up expired sessions');

      const now = new Date();

      // Find all expired sessions
      const expiredSessions = await this.prisma.guestSession.findMany({
        where: {
          expiresAt: { lt: now },
          convertedToUserId: null
        }
      });

      let cleanedCount = 0;

      // Delete expired sessions
      for (const session of expiredSessions) {
        try {
          await this.prisma.guestSession.delete({
            where: { id: session.id }
          });
          cleanedCount++;
        } catch (error) {
          this.logger.warn('[cleanupExpiredGuestSessions] Failed to delete session', {
            sessionId: session.sessionId,
            error: error.message
          });
        }
      }

      this.logger.info('[cleanupExpiredGuestSessions] Cleanup completed', {
        cleanedCount,
        totalExpired: expiredSessions.length
      });

      return {
        success: true,
        cleanedCount,
        totalExpired: expiredSessions.length
      };
    } catch (error) {
      this.logger.error('[cleanupExpiredGuestSessions] Error cleaning up sessions', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone format (Bangladesh)
   * @param {string} phone - Phone number to validate
   * @returns {boolean} True if valid
   */
  validatePhone(phone) {
    const phoneRegex = /^(?:\+880|0)?1[3-9]\d{8}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
  }
}

// Singleton instance
const guestCheckoutService = new GuestCheckoutService();

module.exports = {
  GuestCheckoutService,
  guestCheckoutService
};
