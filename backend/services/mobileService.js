const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('./logger');
const { smsService } = require('./smsService');
const { cartService } = require('./cartService');

class MobileService {
  constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });

    this.prisma.$connect()
      .then(() => {
        this.logger.info('[MobileService] Database connection established successfully');
      })
      .catch((error) => {
        this.logger.error('[MobileService] Failed to connect to database', {
          error: error.message,
          code: error.code
        });
      });

    this.logger = loggerService;
  }

  // ============================================================================
  // Offline Sync Functions
  // ============================================================================

  /**
   * Sync offline cart changes to server
   * @param {string} userId - User ID
   * @param {Object} offlineCartData - Offline cart data
   * @param {Array} conflicts - List of conflicts to resolve
   * @returns {Promise<Object>} Sync result with merged cart
   */
  async syncOfflineCart(userId, offlineCartData, conflicts = []) {
    try {
      this.logger.info('Syncing offline cart', {
        userId,
        itemsCount: offlineCartData.items?.length || 0,
        version: offlineCartData.version,
        lastSyncAt: offlineCartData.lastSyncAt
      });

      // Get the server cart
      const serverCart = await this.prisma.cart.findFirst({
        where: {
          userId: userId,
          status: 'active'
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  nameEn: true,
                  nameBn: true,
                  price: true,
                  stockQuantity: true,
                  images: {
                    select: {
                      thumbnailUrl: true,
                      optimizedUrl: true,
                      originalUrl: true
                    },
                    orderBy: { sortOrder: 'asc' },
                    take: 1
                  }
                }
              },
              variant: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  stock: true
                }
              }
            }
          }
        }
      });

      if (!serverCart) {
        // Create new cart from offline data
        const newCart = await this.createCartFromOfflineData(userId, offlineCartData);
        return {
          mergedCart: newCart,
          conflictsResolved: [],
          syncTimestamp: new Date().toISOString(),
          action: 'created'
        };
      }

      // Resolve conflicts if any
      let resolvedConflicts = [];
      if (conflicts.length > 0) {
        resolvedConflicts = await this.resolveSyncConflicts(userId, offlineCartData, serverCart);
      }

      // Merge offline cart with server cart
      const mergedCart = await this.mergeCarts(userId, offlineCartData, serverCart);

      // Update sync status
      await this.updateSyncStatus(userId, {
        lastSyncAt: new Date(),
        version: offlineCartData.version,
        syncedItemsCount: offlineCartData.items?.length || 0,
        conflictsResolved: resolvedConflicts.length
      });

      this.logger.info('Offline cart synced successfully', {
        userId,
        cartId: mergedCart.id,
        itemsCount: mergedCart.items.length,
        conflictsResolved: resolvedConflicts.length
      });

      return {
        mergedCart: this.optimizeCartForMobile(mergedCart),
        conflictsResolved: resolvedConflicts,
        syncTimestamp: new Date().toISOString(),
        action: 'merged'
      };
    } catch (error) {
      this.logger.error('Error syncing offline cart', {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get sync status for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Sync status
   */
  async getSyncStatus(userId) {
    try {
      const syncRecord = await this.prisma.cartOfflineSync.findFirst({
        where: { userId },
        orderBy: { lastSyncAt: 'desc' }
      });

      const pendingChanges = await this.prisma.offlineCartChange.count({
        where: {
          userId,
          isSynced: false
        }
      });

      return {
        userId,
        lastSyncAt: syncRecord?.lastSyncAt || null,
        version: syncRecord?.version || 0,
        pendingChanges: pendingChanges,
        status: syncRecord?.syncStatus || 'idle',
        lastError: syncRecord?.lastError || null,
        conflictsResolved: syncRecord?.conflictsResolved || 0
      };
    } catch (error) {
      this.logger.error('Error getting sync status', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Resolve conflicts between local and server cart
   * @param {string} userId - User ID
   * @param {Object} localCart - Local cart data
   * @param {Object} serverCart - Server cart data
   * @returns {Promise<Array>} List of resolved conflicts
   */
  async resolveSyncConflicts(userId, localCart, serverCart) {
    try {
      const resolvedConflicts = [];
      const serverItemsMap = new Map();
      const localItemsMap = new Map();

      // Build maps for quick lookup
      serverCart.items.forEach(item => {
        const key = `${item.productId}_${item.variantId || 'default'}`;
        serverItemsMap.set(key, item);
      });

      localCart.items.forEach(item => {
        const key = `${item.productId}_${item.variantId || 'default'}`;
        localItemsMap.set(key, item);
      });

      // Find conflicts
      for (const [key, localItem] of localItemsMap) {
        const serverItem = serverItemsMap.get(key);

        if (serverItem) {
          // Item exists on both sides - check for conflicts
          if (localItem.quantity !== serverItem.quantity) {
            // Quantity conflict - use the higher quantity
            const resolvedQuantity = Math.max(localItem.quantity, serverItem.quantity);
            
            resolvedConflicts.push({
              type: 'quantity',
              productId: localItem.productId,
              variantId: localItem.variantId,
              localQuantity: localItem.quantity,
              serverQuantity: serverItem.quantity,
              resolvedQuantity: resolvedQuantity,
              resolution: 'max'
            });

            // Update server cart with resolved quantity
            await this.prisma.cartItem.update({
              where: { id: serverItem.id },
              data: { quantity: resolvedQuantity }
            });
          }
        } else {
          // Item only exists locally - add to server
          await this.addItemToCart(userId, localItem);
          
          resolvedConflicts.push({
            type: 'added',
            productId: localItem.productId,
            variantId: localItem.variantId,
            quantity: localItem.quantity,
            resolution: 'added_to_server'
          });
        }
      }

      // Log resolved conflicts
      this.logger.info('Sync conflicts resolved', {
        userId,
        conflictsCount: resolvedConflicts.length
      });

      return resolvedConflicts;
    } catch (error) {
      this.logger.error('Error resolving sync conflicts', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  // ============================================================================
  // Mobile Cart Functions
  // ============================================================================

  /**
   * Get lightweight cart summary (minimal payload)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Cart summary
   */
  async getMobileCartSummary(userId) {
    try {
      const cart = await this.prisma.cart.findFirst({
        where: {
          userId: userId,
          status: 'active'
        },
        include: {
          items: {
            select: {
              quantity: true,
              price: true,
              subtotal: true
            }
          }
        }
      });

      if (!cart) {
        return {
          totalItems: 0,
          totalAmount: 0,
          subtotal: 0,
          shipping: 0,
          tax: 0,
          emiAvailable: false,
          codAvailable: true,
          lastUpdatedAt: new Date().toISOString()
        };
      }

      const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      const subtotal = parseFloat(cart.subtotal || 0);
      const shipping = parseFloat(cart.shippingCost || 0);
      const tax = parseFloat(cart.tax || 0);
      const totalAmount = subtotal + shipping + tax;

      // Check EMI eligibility (amount > 5000 BDT)
      const emiAvailable = totalAmount >= 5000;
      const codAvailable = totalAmount <= 50000; // COD limit

      return {
        totalItems,
        totalAmount,
        subtotal,
        shipping,
        tax,
        emiAvailable,
        codAvailable,
        lastUpdatedAt: cart.updatedAt.toISOString()
      };
    } catch (error) {
      this.logger.error('Error getting mobile cart summary', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get paginated cart items (optimized for mobile)
   * @param {string} userId - User ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Paginated cart items
   */
  async getMobileCartItems(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const [items, totalCount] = await Promise.all([
        this.prisma.cartItem.findMany({
          where: {
            cart: {
              userId: userId,
              status: 'active'
            }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            productId: true,
            variantId: true,
            quantity: true,
            price: true,
            subtotal: true,
            product: {
              select: {
                id: true,
                name: true,
                nameEn: true,
                nameBn: true,
                images: {
                  select: {
                    thumbnailUrl: true,
                    optimizedUrl: true,
                    originalUrl: true
                  },
                  orderBy: { sortOrder: 'asc' },
                  take: 1
                }
              }
            },
            variant: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }),
        this.prisma.cartItem.count({
          where: {
            cart: {
              userId: userId,
              status: 'active'
            }
          }
        })
      ]);

      const optimizedItems = items.map(item => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.product?.name || '',
        productNameEn: item.product?.nameEn || '',
        productNameBn: item.product?.nameBn || '',
        quantity: item.quantity,
        price: parseFloat(item.price),
        subtotal: parseFloat(item.subtotal),
        image: item.product?.images?.[0]?.thumbnailUrl ||
                item.product?.images?.[0]?.optimizedUrl ||
                item.product?.images?.[0]?.originalUrl || null,
        variantName: item.variant?.name || null
      }));

      return {
        items: optimizedItems,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      this.logger.error('Error getting mobile cart items', {
        userId,
        page,
        limit,
        error: error.message
      });
      throw error;
    }
  }

  // ============================================================================
  // SMS Notification Functions
  // ============================================================================

  /**
   * Subscribe user to cart SMS notifications
   * @param {string} userId - User ID
   * @param {string} phoneNumber - Phone number
   * @param {Array} events - Events to subscribe to
   * @returns {Promise<Object>} Subscription result
   */
  async subscribeToCartSmsNotifications(userId, phoneNumber, events) {
    try {
      // Validate phone number
      const phoneValidation = smsService.validateBangladeshPhoneNumber(phoneNumber);
      if (!phoneValidation.isValid) {
        throw new Error(phoneValidation.error);
      }

      // Check if user already has a subscription
      const existingSubscription = await this.prisma.cartSmsSubscription.findFirst({
        where: { userId }
      });

      if (existingSubscription) {
        // Update existing subscription
        const updatedSubscription = await this.prisma.cartSmsSubscription.update({
          where: { id: existingSubscription.id },
          data: {
            phoneNumber: phoneValidation.normalizedPhone,
            events: events,
            isActive: true,
            updatedAt: new Date()
          }
        });

        this.logger.info('SMS subscription updated', {
          userId,
          phoneNumber: phoneValidation.normalizedPhone,
          events
        });

        return {
          subscriptionId: updatedSubscription.id,
          userId,
          phoneNumber: phoneValidation.normalizedPhone,
          events,
          isActive: true,
          message: 'Subscription updated successfully'
        };
      }

      // Create new subscription
      const subscription = await this.prisma.cartSmsSubscription.create({
        data: {
          userId,
          phoneNumber: phoneValidation.normalizedPhone,
          events: events,
          isActive: true
        }
      });

      // Send confirmation SMS
      await this.sendCartUpdateSms(userId, {
        type: 'subscription_confirmation',
        events: events
      });

      this.logger.info('SMS subscription created', {
        userId,
        phoneNumber: phoneValidation.normalizedPhone,
        events
      });

      return {
        subscriptionId: subscription.id,
        userId,
        phoneNumber: phoneValidation.normalizedPhone,
        events,
        isActive: true,
        message: 'Subscription created successfully'
      };
    } catch (error) {
      this.logger.error('Error subscribing to cart SMS notifications', {
        userId,
        phoneNumber,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Unsubscribe user from cart SMS notifications
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Unsubscription result
   */
  async unsubscribeFromCartSmsNotifications(userId) {
    try {
      const subscription = await this.prisma.cartSmsSubscription.findFirst({
        where: { userId }
      });

      if (!subscription) {
        return {
          userId,
          isActive: false,
          message: 'No active subscription found'
        };
      }

      await this.prisma.cartSmsSubscription.update({
        where: { id: subscription.id },
        data: {
          isActive: false,
          unsubscribedAt: new Date(),
          updatedAt: new Date()
        }
      });

      this.logger.info('SMS subscription cancelled', {
        userId,
        subscriptionId: subscription.id
      });

      return {
        subscriptionId: subscription.id,
        userId,
        isActive: false,
        message: 'Unsubscribed successfully'
      };
    } catch (error) {
      this.logger.error('Error unsubscribing from cart SMS notifications', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get SMS subscription status
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Subscription status
   */
  async getSmsNotificationStatus(userId) {
    try {
      const subscription = await this.prisma.cartSmsSubscription.findFirst({
        where: { userId }
      });

      if (!subscription) {
        return {
          userId,
          isSubscribed: false,
          isActive: false,
          phoneNumber: null,
          events: [],
          subscribedAt: null
        };
      }

      return {
        userId,
        isSubscribed: true,
        isActive: subscription.isActive,
        phoneNumber: subscription.phoneNumber,
        events: subscription.events,
        subscribedAt: subscription.createdAt,
        unsubscribedAt: subscription.unsubscribedAt
      };
    } catch (error) {
      this.logger.error('Error getting SMS notification status', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send SMS notification for cart updates
   * @param {string} userId - User ID
   * @param {Object} cartData - Cart data for the notification
   * @returns {Promise<Object>} SMS send result
   */
  async sendCartUpdateSms(userId, cartData) {
    try {
      const subscription = await this.prisma.cartSmsSubscription.findFirst({
        where: {
          userId,
          isActive: true
        }
      });

      if (!subscription) {
        this.logger.info('No active SMS subscription for user', { userId });
        return { sent: false, reason: 'no_subscription' };
      }

      // Check if event type is subscribed
      if (cartData.type && !subscription.events.includes(cartData.type)) {
        this.logger.info('Event type not subscribed', {
          userId,
          eventType: cartData.type,
          subscribedEvents: subscription.events
        });
        return { sent: false, reason: 'event_not_subscribed' };
      }

      // Generate SMS message based on event type
      let message = '';
      switch (cartData.type) {
        case 'item_added':
          message = `স্মার্ট টেকনোলজিস বাংলাদেশ: আপনার কার্টে একটি নতুন আইটেম যোগ করা হয়েছে। চেকআউট করতে অ্যাপে যান।\n\nSmart Technologies Bangladesh: An item has been added to your cart. Visit the app to checkout.`;
          break;
        case 'item_removed':
          message = `স্মার্ট টেকনোলজিস বাংলাদেশ: আপনার কার্ট থেকে একটি আইটেম সরানো হয়েছে।\n\nSmart Technologies Bangladesh: An item has been removed from your cart.`;
          break;
        case 'price_changed':
          message = `স্মার্ট টেকনোলজিস বাংলাদেশ: আপনার কার্টে একটি আইটেমের দাম পরিবর্তন হয়েছে। চেক করতে অ্যাপে যান।\n\nSmart Technologies Bangladesh: The price of an item in your cart has changed. Visit the app to check.`;
          break;
        case 'cart_abandoned':
          message = `স্মার্ট টেকনোলজিস বাংলাদেশ: আপনার কার্টে ${cartData.itemCount || 0}টি আইটেম আছে। চেকআউট সম্পন্ন করতে অ্যাপে যান।\n\nSmart Technologies Bangladesh: You have ${cartData.itemCount || 0} items in your cart. Visit the app to complete checkout.`;
          break;
        case 'subscription_confirmation':
          message = `স্মার্ট টেকনোলজিস বাংলাদেশ: আপনি কার্ট আপডেট SMS নোটিফিকেশনে সফলভাবে সাবস্ক্রাইব করেছেন।\n\nSmart Technologies Bangladesh: You have successfully subscribed to cart update SMS notifications.`;
          break;
        default:
          message = `স্মার্ট টেকনোলজিস বাংলাদেশ: আপনার কার্টে একটি আপডেট আছে। চেক করতে অ্যাপে যান।\n\nSmart Technologies Bangladesh: You have a cart update. Visit the app to check.`;
      }

      // Send SMS
      const result = await smsService.sendSMS(subscription.phoneNumber, message);

      // Log SMS sent
      await this.prisma.cartSmsLog.create({
        data: {
          userId,
          subscriptionId: subscription.id,
          eventType: cartData.type,
          phoneNumber: subscription.phoneNumber,
          messageId: result.messageId,
          status: result.success ? 'sent' : 'failed',
          errorMessage: result.error || null
        }
      });

      this.logger.info('Cart update SMS sent', {
        userId,
        eventType: cartData.type,
        messageId: result.messageId,
        success: result.success
      });

      return {
        sent: result.success,
        messageId: result.messageId,
        fallback: result.fallback
      };
    } catch (error) {
      this.logger.error('Error sending cart update SMS', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Create cart from offline data
   * @private
   * @param {string} userId - User ID
   * @param {Object} offlineCartData - Offline cart data
   * @returns {Promise<Object>} Created cart
   */
  async createCartFromOfflineData(userId, offlineCartData) {
    try {
      const cart = await this.prisma.cart.create({
        data: {
          userId,
          status: 'active',
          subtotal: 0,
          tax: 0,
          shippingCost: 0,
          discount: 0,
          total: 0,
          itemCount: offlineCartData.items?.length || 0,
          totalItems: offlineCartData.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
        }
      });

      // Add items to cart
      for (const item of offlineCartData.items || []) {
        await this.addItemToCart(userId, item, cart.id);
      }

      // Recalculate totals
      await this.recalculateCartTotals(cart.id);

      return await this.prisma.cart.findUnique({
        where: { id: cart.id },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  nameEn: true,
                  nameBn: true,
                  price: true,
                  images: {
                    select: {
                      thumbnailUrl: true,
                      optimizedUrl: true,
                      originalUrl: true
                    },
                    orderBy: { sortOrder: 'asc' },
                    take: 1
                  }
                }
              },
              variant: {
                select: {
                  id: true,
                  name: true,
                  price: true
                }
              }
            }
          }
        }
      });
    } catch (error) {
      this.logger.error('Error creating cart from offline data', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Merge local and server carts
   * @private
   * @param {string} userId - User ID
   * @param {Object} localCart - Local cart data
   * @param {Object} serverCart - Server cart data
   * @returns {Promise<Object>} Merged cart
   */
  async mergeCarts(userId, localCart, serverCart) {
    try {
      const serverItemsMap = new Map();
      const localItemsMap = new Map();

      // Build maps
      serverCart.items.forEach(item => {
        const key = `${item.productId}_${item.variantId || 'default'}`;
        serverItemsMap.set(key, item);
      });

      localCart.items.forEach(item => {
        const key = `${item.productId}_${item.variantId || 'default'}`;
        localItemsMap.set(key, item);
      });

      // Merge items
      for (const [key, localItem] of localItemsMap) {
        const serverItem = serverItemsMap.get(key);

        if (serverItem) {
          // Item exists on both - update quantity if different
          if (localItem.quantity !== serverItem.quantity) {
            await this.prisma.cartItem.update({
              where: { id: serverItem.id },
              data: { quantity: localItem.quantity }
            });
          }
        } else {
          // Item only exists locally - add to server
          await this.addItemToCart(userId, localItem, serverCart.id);
        }
      }

      // Recalculate totals
      await this.recalculateCartTotals(serverCart.id);

      return await this.prisma.cart.findUnique({
        where: { id: serverCart.id },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  nameEn: true,
                  nameBn: true,
                  price: true,
                  images: {
                    select: {
                      thumbnailUrl: true,
                      optimizedUrl: true,
                      originalUrl: true
                    },
                    orderBy: { sortOrder: 'asc' },
                    take: 1
                  }
                }
              },
              variant: {
                select: {
                  id: true,
                  name: true,
                  price: true
                }
              }
            }
          }
        }
      });
    } catch (error) {
      this.logger.error('Error merging carts', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Add item to cart
   * @private
   * @param {string} userId - User ID
   * @param {Object} item - Item data
   * @param {string} cartId - Cart ID (optional)
   * @returns {Promise<Object>} Created cart item
   */
  async addItemToCart(userId, item, cartId = null) {
    try {
      // Get cart ID if not provided
      if (!cartId) {
        const cart = await this.prisma.cart.findFirst({
          where: {
            userId: userId,
            status: 'active'
          }
        });
        cartId = cart?.id;
      }

      if (!cartId) {
        throw new Error('Cart not found');
      }

      // Get product and variant details
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        select: {
          id: true,
          price: true
        }
      });

      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      let price = product.price;
      if (item.variantId) {
        const variant = await this.prisma.productVariant.findUnique({
          where: { id: item.variantId },
          select: { price: true }
        });
        if (variant) {
          price = variant.price;
        }
      }

      // Check if item already exists in cart
      const existingItem = await this.prisma.cartItem.findFirst({
        where: {
          cartId,
          productId: item.productId,
          variantId: item.variantId || null
        }
      });

      if (existingItem) {
        // Update quantity
        await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: item.quantity,
            price: price,
            subtotal: price * item.quantity
          }
        });
      } else {
        // Create new item
        await this.prisma.cartItem.create({
          data: {
            cartId,
            productId: item.productId,
            variantId: item.variantId || null,
            quantity: item.quantity,
            price: price,
            subtotal: price * item.quantity
          }
        });
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Error adding item to cart', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Recalculate cart totals
   * @private
   * @param {string} cartId - Cart ID
   * @returns {Promise<void>}
   */
  async recalculateCartTotals(cartId) {
    try {
      const items = await this.prisma.cartItem.findMany({
        where: { cartId }
      });

      const subtotal = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

      await this.prisma.cart.update({
        where: { id: cartId },
        data: {
          subtotal,
          total: subtotal, // Will be updated with shipping and tax later
          itemCount: items.length,
          totalItems
        }
      });
    } catch (error) {
      this.logger.error('Error recalculating cart totals', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update sync status
   * @private
   * @param {string} userId - User ID
   * @param {Object} statusData - Status data
   * @returns {Promise<void>}
   */
  async updateSyncStatus(userId, statusData) {
    try {
      const existingRecord = await this.prisma.cartOfflineSync.findFirst({
        where: { userId }
      });

      if (existingRecord) {
        await this.prisma.cartOfflineSync.update({
          where: { id: existingRecord.id },
          data: {
            lastSyncAt: statusData.lastSyncAt,
            version: statusData.version,
            syncedItemsCount: statusData.syncedItemsCount,
            conflictsResolved: statusData.conflictsResolved,
            syncStatus: 'completed',
            lastError: null,
            updatedAt: new Date()
          }
        });
      } else {
        await this.prisma.cartOfflineSync.create({
          data: {
            userId,
            lastSyncAt: statusData.lastSyncAt,
            version: statusData.version,
            syncedItemsCount: statusData.syncedItemsCount,
            conflictsResolved: statusData.conflictsResolved,
            syncStatus: 'completed'
          }
        });
      }
    } catch (error) {
      this.logger.error('Error updating sync status', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Optimize cart data for mobile
   * @private
   * @param {Object} cart - Cart data
   * @returns {Object} Optimized cart
   */
  optimizeCartForMobile(cart) {
    return {
      id: cart.id,
      userId: cart.userId,
      items: cart.items.map(item => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.product?.name || '',
        productNameEn: item.product?.nameEn || '',
        productNameBn: item.product?.nameBn || '',
        quantity: item.quantity,
        price: parseFloat(item.price),
        subtotal: parseFloat(item.subtotal),
        image: item.product?.images?.[0]?.thumbnailUrl ||
                item.product?.images?.[0]?.optimizedUrl ||
                item.product?.images?.[0]?.originalUrl || null,
        variantName: item.variant?.name || null
      })),
      totals: {
        subtotal: parseFloat(cart.subtotal || 0),
        tax: parseFloat(cart.tax || 0),
        shippingCost: parseFloat(cart.shippingCost || 0),
        discount: parseFloat(cart.discount || 0),
        total: parseFloat(cart.total || 0)
      },
      itemCount: cart.itemCount || 0,
      totalItems: cart.totalItems || 0,
      status: cart.status,
      updatedAt: cart.updatedAt
    };
  }
}

// Singleton instance
const mobileService = new MobileService();

module.exports = {
  MobileService,
  mobileService
};
