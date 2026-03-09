/**
 * Cart Analytics Service
 * 
 * Provides comprehensive cart analytics functionality including:
 * - Event tracking (add, remove, view, checkout)
 * - Abandonment rate calculation
 * - Conversion funnel metrics
 * - Average cart value calculation
 * - Popular products in carts
 * - Optimization recommendations
 * - Realtime analytics
 * - Trends and dashboard data
 */

const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('./logger');

class CartAnalyticsService {
  constructor() {
    this.prisma = new PrismaClient();
    this.logger = loggerService;
  }

  /**
   * Track a generic cart event
   * @param {string} cartId - Cart ID
   * @param {string} userId - User ID (optional)
   * @param {string} eventType - Type of event (add, remove, update, view, checkout_initiated, checkout_completed)
   * @param {Object} data - Additional event data
   * @returns {Promise<Object>} Created event
   */
  async trackCartEvent(cartId, userId, eventType, data = {}) {
    try {
      const eventData = {
        cart: { connect: { id: cartId } },
        eventType,
        data: JSON.stringify(data || {})
      };
      
      if (userId) {
        eventData.user = { connect: { id: userId } };
      }
      
      const event = await this.prisma.cart_events.create({
        data: eventData
      });

      this.logger.info('Cart event tracked', { cartId, userId, eventType });
      return event;
    } catch (error) {
      this.logger.error('Error tracking cart event', {
        cartId,
        userId,
        eventType,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Track add to cart event
   */
  async trackAddToCart(cartId, userId, productId, quantity, price) {
    return this.trackCartEvent(cartId, userId, 'add', {
      productId,
      quantity,
      price
    });
  }

  /**
   * Track remove from cart event
   */
  async trackRemoveFromCart(cartId, userId, productId, quantity, price) {
    return this.trackCartEvent(cartId, userId, 'remove', {
      productId,
      quantity,
      price
    });
  }

  /**
   * Track cart view event
   */
  async trackCartView(cartId, userId) {
    return this.trackCartEvent(cartId, userId, 'view');
  }

  /**
   * Track checkout initiated event
   */
  async trackCheckoutInitiated(cartId, userId) {
    return this.trackCartEvent(cartId, userId, 'checkout_initiated');
  }

  /**
   * Track checkout completed event
   */
  async trackCheckoutCompleted(cartId, userId, orderId) {
    return this.trackCartEvent(cartId, userId, 'checkout_completed', { orderId });
  }

  /**
   * Update cart analytics
   */
  async updateCartAnalytics(cartId, eventType, data) {
    try {
      const analytics = await this.prisma.cart_analytics.findUnique({
        where: { cartId }
      });

      if (!analytics) {
        analytics = await this.prisma.cart_analytics.create({
          data: {
            cart: { connect: { id: cartId } }
          }
        });

        this.logger.info('Cart analytics created', { cartId });
      }

      const events = analytics.events || [];
      events.push({
        eventType,
        timestamp: new Date().toISOString(),
        data: JSON.stringify(data || {})
      });

      await this.prisma.cart_analytics.update({
        where: { cartId },
        data: { events }
      });

      this.logger.info('Cart analytics updated', { cartId, eventType });
    } catch (error) {
      this.logger.error('Error updating cart analytics', {
        cartId,
        eventType,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get cart events with filters
   */
  async getCartEvents(filters = {}) {
    try {
      const {
        cartId,
        userId,
        eventType,
        startDate,
        endDate,
        limit,
        offset
      } = filters;

      const where = {};
      if (cartId) where.cartId = cartId;
      if (userId) where.user = { id: userId };
      if (eventType) where.eventType = eventType;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      const [events, total] = await Promise.all([
        this.prisma.cart_events.count({
          where
        }),
        this.prisma.cart_events.findMany({
          where,
          include: {
            cart: {
              select: {
                id: true,
                userId: true,
                status: true
              }
            },
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                regularPrice: true,
                salePrice: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: limit || 100,
          skip: offset || 0
        })
      ]);

      return {
        events,
        pagination: {
          total,
          limit: limit || 100,
          offset: offset || 0
        }
      };
    } catch (error) {
      this.logger.error('Error getting cart events', {
        filters,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Calculate cart abandonment rate
   */
  async getCartAbandonmentRate(startDate, endDate) {
    try {
      const [abandonedCarts, convertedCarts] = await Promise.all([
        this.prisma.carts.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            },
            status: 'abandoned'
          }
        }),
        this.prisma.carts.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            },
            status: 'converted'
          }
        })
      ]);

      const abandonmentRate = abandonedCarts > 0
        ? (convertedCarts / abandonedCarts) * 100
        : 0;

      return {
        abandonedCarts,
        convertedCarts,
        abandonmentRate: parseFloat(abandonmentRate.toFixed(2))
      };
    } catch (error) {
      this.logger.error('Error calculating abandonment rate', {
        startDate,
        endDate,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get cart abandonment trend
   */
  async getAbandonmentTrend(days = 30) {
    try {
      const trend = [];
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      for (let i = 0; i < days; i++) {
        const dayStart = new Date(startDate);
        dayStart.setDate(dayStart.getDate() + i);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const [abandoned, converted] = await Promise.all([
          this.prisma.carts.count({
            where: {
              createdAt: {
                gte: dayStart,
                lte: dayEnd
              },
              status: 'abandoned'
            }
          }),
          this.prisma.carts.count({
            where: {
              createdAt: {
                gte: dayStart,
                lte: dayEnd
              },
              status: 'converted'
            }
          })
        ]);

        const abandonmentRate = abandoned > 0
          ? (converted / abandoned) * 100
          : 0;

        trend.push({
          date: dayStart.toISOString().split('T')[0],
          abandoned,
          converted,
          abandonmentRate: parseFloat(abandonmentRate.toFixed(2))
        });
      }

      return trend;
    } catch (error) {
      this.logger.error('Error getting abandonment trend', {
        days,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get conversion funnel
   */
  async getConversionFunnel(startDate, endDate) {
    try {
      const [
        totalCarts,
        cartsWithItems,
        cartsWithCheckoutInitiated,
        cartsWithCheckoutCompleted,
        convertedCarts
      ] = await Promise.all([
        this.prisma.carts.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),
        this.prisma.carts.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            },
            items: {
              some: {}
            }
          }
        }),
        this.prisma.carts.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            },
            checkoutInitiated: true
          }
        }),
        this.prisma.carts.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            },
            checkoutCompleted: true
          }
        })
      ]);

      const conversionRate = totalCarts > 0
        ? (convertedCarts / totalCarts) * 100
        : 0;

      const dropOffPoints = [
        { stage: 'Total Carts', count: totalCarts, percentage: 100 },
        { stage: 'With Items', count: cartsWithItems, percentage: totalCarts > 0 ? (cartsWithItems / totalCarts) * 100 : 0 },
        { stage: 'Checkout Initiated', count: cartsWithCheckoutInitiated, percentage: totalCarts > 0 ? (cartsWithCheckoutInitiated / totalCarts) * 100 : 0 },
        { stage: 'Checkout Completed', count: cartsWithCheckoutCompleted, percentage: conversionRate }
      ];

      return {
        totalCarts,
        conversionFunnel: dropOffPoints
      };
    } catch (error) {
      this.logger.error('Error getting conversion funnel', {
        startDate,
        endDate,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get average cart value
   */
  async getAverageCartValue(startDate, endDate) {
    try {
      const convertedCarts = await this.prisma.carts.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          status: 'converted'
        },
        include: {
          items: {
            select: {
              product: {
                select: {
                  regularPrice: true,
                  salePrice: true
                }
              }
            }
          }
        }
      });

      const activeCarts = await this.prisma.carts.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          status: 'active'
        },
        include: {
          items: {
            select: {
              product: {
                select: {
                  regularPrice: true,
                  salePrice: true
                }
              }
            }
          }
        }
      });

      const calculateCartValue = (items) => {
        return items.reduce((sum, item) => {
          // Use salePrice if available and valid, otherwise use regularPrice
          const product = item.product;
          const hasValidSalePrice = product?.salePrice &&
                                        parseFloat(product.salePrice) > 0 &&
                                        parseFloat(product.salePrice) < parseFloat(product.regularPrice);
          const itemPrice = hasValidSalePrice ? parseFloat(product.salePrice) : parseFloat(product.regularPrice);
          return sum + (itemPrice * item.quantity);
        }, 0);
      };

      const convertedCartValue = convertedCarts.reduce((sum, cart) => sum + calculateCartValue(cart.items), 0);
      const activeCartValue = activeCarts.reduce((sum, cart) => sum + calculateCartValue(cart.items), 0);

      return {
        convertedCarts: {
          total: convertedCarts.length,
          averageValue: convertedCarts.length > 0 ? convertedCartValue / convertedCarts.length : 0,
          totalValue: convertedCartValue
        },
        activeCarts: {
          total: activeCarts.length,
          averageValue: activeCarts.length > 0 ? activeCartValue / activeCarts.length : 0,
          totalValue: activeCartValue
        },
        overall: {
          totalCarts: convertedCarts.length + activeCarts.length,
          averageValue: (convertedCartValue + activeCartValue) / (convertedCarts.length + activeCarts.length)
        }
      };
    } catch (error) {
      this.logger.error('Error calculating average cart value', {
        startDate,
        endDate,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get popular products in carts
   */
  async getPopularProductsInCarts(limit = 10, startDate, endDate) {
    try {
      const cartItems = await this.prisma.cart_items.groupBy({
        by: ['productId'],
        where: {
          cart: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        },
        _count: {
          productId: true
        },
        orderBy: {
          _count: {
            id: true
          }
        },
        take: limit
      });

      const productIds = cartItems.map(item => item.productId).filter(id => id);
      const products = await this.prisma.products.findMany({
        where: {
          id: {
            in: productIds
          }
        },
        select: {
          id: true,
          name: true,
          slug: true,
          regularPrice: true,
          salePrice: true,
          images: {
            select: {
              url: true,
              isPrimary: true
            },
            take: 1
          }
        }
      });

      const productsWithCount = products.map(product => ({
        ...product,
        cartCount: cartItems.find(item => item.productId === product.id)?._count?.productId || 0
      }));

      return productsWithCount;
    } catch (error) {
      this.logger.error('Error getting popular products in carts', {
        limit,
        startDate,
        endDate,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generate optimization recommendations
   */
  async generateOptimizationRecommendations() {
    try {
      const [
        abandonedCarts,
        lowStockProducts,
        staleCarts
      ] = await Promise.all([
        this.prisma.carts.count({
          where: {
            status: 'abandoned',
            updatedAt: {
              lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
            }
          }
        }),
        this.prisma.products.findMany({
          where: {
            stockQuantity: {
              lt: 10
            }
          },
          take: 20
        }),
        this.prisma.carts.findMany({
          where: {
            status: 'active',
            updatedAt: {
              lt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
            }
          },
          take: 50
        })
      ]);

      const recommendations = [];

      // High abandonment rate recommendation
      if (abandonedCarts > 100) {
        const abandonmentRate = (abandonedCarts / (abandonedCarts + 50)) * 100; // Assuming 50 active carts
        if (abandonmentRate > 30) {
          recommendations.push({
            type: 'abandonment_rate',
            priority: 'high',
            title: 'High Cart Abandonment Rate',
            message: `${abandonmentRate.toFixed(1)}% of carts are being abandoned. Consider sending recovery emails.`,
            metrics: {
              abandonmentRate: abandonmentRate,
              totalAbandoned: abandonedCarts
            }
          });
        }
      }

      // Low stock products
      if (lowStockProducts.length > 0) {
        recommendations.push({
          type: 'low_stock',
          priority: 'medium',
          title: 'Low Stock Products',
          message: `${lowStockProducts.length} products have low stock (<10 units). Consider restocking.`,
          metrics: {
            productCount: lowStockProducts.length
          }
        });
      }

      // Stale carts
      if (staleCarts.length > 0) {
        const staleCartIds = staleCarts.map(cart => cart.id);
        recommendations.push({
          type: 'stale_carts',
          priority: 'low',
          title: 'Stale Active Carts',
          message: `${staleCarts.length} carts have been inactive for over 2 hours. Consider sending reminder emails.`,
          metrics: {
            staleCartCount: staleCarts.length,
            cartIds: staleCartIds
          }
        });
      }

      return recommendations;
    } catch (error) {
      this.logger.error('Error generating optimization recommendations', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get realtime analytics
   */
  async getRealtimeAnalytics() {
    try {
      const [
        totalCarts,
        totalEvents,
        checkoutInitiated,
        checkoutCompleted
      ] = await Promise.all([
        this.prisma.carts.count(),
        this.prisma.cart_events.count(),
        this.prisma.cart_events.count({
          where: {
            eventType: 'checkout_initiated'
          }
        }),
        this.prisma.cart_events.count({
          where: {
            eventType: 'checkout_completed'
          }
        })
      ]);

      const conversionRate = totalCarts > 0
        ? ((checkoutCompleted / totalCarts) * 100).toFixed(2)
        : 0;

      return {
        totalCarts,
        totalEvents,
        checkoutInitiated,
        checkoutCompleted,
        conversionRate: totalCarts > 0
          ? ((checkoutCompleted / totalCarts) * 100).toFixed(2)
          : 0
      };
    } catch (error) {
      this.logger.error('Error getting realtime analytics', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get trends
   */
  async getTrends(days = 30) {
    try {
      const trends = [];
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      for (let i = 0; i < days; i++) {
        const dayStart = new Date(startDate);
        dayStart.setDate(dayStart.getDate() + i);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const [totalCarts, abandoned, converted] = await Promise.all([
          this.prisma.carts.count({
            where: {
              createdAt: {
                gte: dayStart,
                lte: dayEnd
              }
            }
          }),
          this.prisma.carts.count({
            where: {
              createdAt: {
                gte: dayStart,
                lte: dayEnd
              },
              status: 'abandoned'
            }
          }),
          this.prisma.carts.count({
            where: {
              createdAt: {
                gte: dayStart,
                lte: dayEnd
              },
              status: 'converted'
            }
          })
        ]);

        const abandonmentRate = abandoned > 0
          ? (converted / abandoned) * 100
          : 0;

        trends.push({
          date: dayStart.toISOString().split('T')[0],
          totalCarts,
          abandoned,
          converted,
          abandonmentRate: parseFloat(abandonmentRate.toFixed(2))
        });
      }

      return trends;
    } catch (error) {
      this.logger.error('Error getting trends', {
        days,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get dashboard data
   */
  async getDashboardData() {
    try {
      const [
        totalCarts,
        activeCarts,
        expiredCarts,
        abandonedCarts,
        convertedCarts
      ] = await Promise.all([
        this.prisma.carts.count(),
        this.prisma.carts.count({
          where: {
            status: 'active'
          }
        }),
        this.prisma.carts.count({
          where: {
            status: 'expired'
          }
        }),
        this.prisma.carts.count({
          where: {
            status: 'abandoned'
          }
        }),
        this.prisma.carts.count({
          where: {
            status: 'converted'
          }
        })
      ]);

      const conversionRate = totalCarts > 0
        ? ((convertedCarts / totalCarts) * 100).toFixed(2)
        : 0;

      // Calculate average cart value using aggregation
      const cartAggregations = await this.prisma.carts.aggregate({
        _avg: {
          total: true
        }
      });

      const averageCartValue = cartAggregations._avg.total || 0;

      // Calculate average items per cart using aggregation
      const itemAggregations = await this.prisma.cart_items.groupBy({
        by: ['cartId'],
        _count: {
          id: true
        }
      });

      const totalItems = itemAggregations.reduce((sum, item) => sum + item._count.id, 0);
      const averageItemsPerCart = totalCarts > 0 ? totalItems / totalCarts : 0;

      // Get top abandoned products using aggregation
      const topAbandonedProducts = await this.prisma.cart_items.groupBy({
        by: ['productId'],
        where: {
          cart: {
            status: { in: ['abandoned', 'expired'] }
          }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 10
      });

      // Get product names for top abandoned products
      const productIds = topAbandonedProducts.map(item => item.productId);
      const products = await this.prisma.products.findMany({
        where: {
          id: { in: productIds }
        },
        select: {
          id: true,
          name: true
        }
      });

      const productMap = new Map(products.map(p => [p.id, p.name]));
      const topAbandonedProductsWithNames = topAbandonedProducts.map(item => ({
        productId: item.productId,
        productName: productMap.get(item.productId) || 'Unknown',
        abandonmentCount: item._count.id
      }));

      // Get cart size distribution using aggregation
      const cartSizeDistribution = await this.prisma.cart_items.groupBy({
        by: ['cartId'],
        _count: {
          id: true
        }
      });

      const sizeDistributionMap = {};
      cartSizeDistribution.forEach(item => {
        const itemCount = item._count.id;
        const key = itemCount.toString();
        if (!sizeDistributionMap[key]) {
          sizeDistributionMap[key] = {
            itemCount: itemCount,
            cartCount: 0
          };
        }
        sizeDistributionMap[key].cartCount++;
      });

      // Get time in cart distribution
      const cartsForTimeDistribution = await this.prisma.carts.findMany({
        select: {
          id: true,
          createdAt: true
        }
      });

      const timeInCartDistribution = {};
      cartsForTimeDistribution.forEach(cart => {
        const timeInCart = Date.now() - new Date(cart.createdAt).getTime();
        const hours = Math.floor(timeInCart / (1000 * 60 * 60));
        let timeRange;
        if (hours < 1) {
          timeRange = '0-1 hour';
        } else if (hours < 24) {
          timeRange = '1-24 hours';
        } else if (hours < 168) {
          timeRange = '1-7 days';
        } else if (hours < 720) {
          timeRange = '7-30 days';
        } else {
          timeRange = '30+ days';
        }

        if (!timeInCartDistribution[timeRange]) {
          timeInCartDistribution[timeRange] = {
            timeRange,
            cartCount: 0
          };
        }
        timeInCartDistribution[timeRange].cartCount++;
      });

      return {
        totalCarts,
        activeCarts,
        expiredCarts,
        abandonedCarts,
        conversionRate: parseFloat(conversionRate),
        averageCartValue: parseFloat(averageCartValue.toFixed(2)),
        averageItemsPerCart: parseFloat(averageItemsPerCart.toFixed(2)),
        topAbandonedProducts: topAbandonedProductsWithNames,
        cartSizeDistribution: Object.values(sizeDistributionMap),
        timeInCartDistribution: Object.values(timeInCartDistribution)
      };
    } catch (error) {
      this.logger.error('Error getting dashboard data', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Record abandonment reason
   */
  async recordAbandonmentReason(cartId, reason) {
    try {
      const analytics = await this.prisma.cart_analytics.findUnique({
        where: { cartId }
      });

      if (analytics) {
        const reasons = analytics.abandonmentReasons || [];
        reasons.push({
          reason,
          recordedAt: new Date().toISOString()
        });

        await this.prisma.cart_analytics.update({
          where: { cartId },
          data: { abandonmentReasons: reasons }
        });
      }

      this.logger.info('Abandonment reason recorded', { cartId, reason });
    } catch (error) {
      this.logger.warn('Error recording abandonment reason', {
        cartId,
        reason,
        error: error.message
      });
    }
  }

  /**
   * Get cart recovery statistics
   * @param {number} days - Number of days to look back
   * @returns {Promise<Object>} Recovery statistics
   */
  async getRecoveryStatistics(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get filtered recovery events first
      const filteredRecoveryEvents = await this.prisma.cart_recovery_events.findMany({
        where: {
          createdAt: { gte: startDate }
        },
        select: {
          eventType: true
        }
      });
      
      // Group by eventType in JavaScript
      const recoveryEvents = filteredRecoveryEvents.reduce((acc, event) => {
        const key = event.eventType;
        if (!acc[key]) {
          acc[key] = { _count: { id: 0 } };
        }
        acc[key]._count.id++;
        return acc;
      }, {});
      
      // Get cart statistics and recovered revenue
      const [
        totalAbandoned,
        totalRecovered,
        totalPending,
        recoveredRevenue
      ] = await Promise.all([
        // Total abandoned carts in period
        this.prisma.carts.count({
          where: {
            abandonedAt: { gte: startDate }
          }
        }),
        // Total recovered carts
        this.prisma.carts.count({
          where: {
            abandonedAt: { gte: startDate },
            recoveredAt: { not: null }
          }
        }),
        // Total pending recovery
        this.prisma.carts.count({
          where: {
            abandonedAt: { gte: startDate },
            recoveredAt: null
          }
        }),
        // Recovered revenue
        this.prisma.carts.aggregate({
          where: {
            recoveredAt: { gte: startDate }
          },
          _sum: { total: true }
        })
      ]);

      const emailEvents = {
        sent: recoveryEvents['email_sent']?._count?.id || 0,
        opened: recoveryEvents['email_opened']?._count?.id || 0,
        clicked: recoveryEvents['link_clicked']?._count?.id || 0,
        recovered: recoveryEvents['cart_recovered']?._count?.id || 0
      };

      const recoveryRate = totalAbandoned > 0
        ? (totalRecovered / totalAbandoned) * 100
        : 0;

      return {
        summary: {
          totalAbandoned,
          totalRecovered,
          totalPending,
          recoveryRate: parseFloat(recoveryRate.toFixed(2)),
          totalRecoveredRevenue: recoveredRevenue._sum?.total || 0,
          averageOrderValue: totalRecovered > 0
            ? (recoveredRevenue._sum?.total || 0) / totalRecovered
            : 0
        },
        emailEvents,
        recoveryEvents
      };
    } catch (error) {
      this.logger.error('Error getting recovery statistics', {
        days,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get daily recovery stats
   */
  async getDailyRecoveryStats(days = 30) {
    try {
      const dailyStats = [];
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      for (let i = 0; i < days; i++) {
        const dayStart = new Date(startDate);
        dayStart.setDate(dayStart.getDate() + i);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const [abandoned, recovered, emails] = await Promise.all([
          this.prisma.carts.count({
            where: {
              abandonedAt: {
                gte: dayStart,
                lte: dayEnd
              }
            }
          }),
          this.prisma.carts.count({
            where: {
              abandonedAt: { gte: dayStart },
              recoveredAt: { not: null },
              abandonedAt: { not: null }
            }
          }),
          this.prisma.cart_recovery_events.groupBy({
            by: ['eventType'],
            where: {
              createdAt: {
                gte: dayStart,
                lte: dayEnd
              }
            },
            _count: { id: true }
          })
        ]);

        const revenue = await this.prisma.carts.aggregate({
          where: {
            recoveredAt: { gte: dayStart }
          },
          _sum: { total: true }
        });

        dailyStats.push({
          date: dayStart.toISOString().split('T')[0],
          abandoned,
          recovered,
          emails: emails.find(e => e.eventType === 'email_sent')?._count?.id || 0,
          revenue: revenue._sum?.total || 0
        });
      }

      return dailyStats;
    } catch (error) {
      this.logger.error('Error getting daily recovery stats', {
        days,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get template stats
   */
  async getTemplateStats(days = 30) {
    try {
      const events = await this.prisma.cart_recovery_events.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          cart: {
            select: {
              id: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 1000
      });

      const templateStatsObj = events.reduce((acc, event) => {
        const template = event.email || 'unknown';
        if (!acc[template]) {
          acc[template] = {
            sent: 0,
            opened: 0,
            clicked: 0,
            recovered: 0
          };
        }

        if (event.email) {
          acc[event.email].sent++;
        }

        if (event.eventType === 'email_opened') {
          acc[event.email].opened++;
        }

        if (event.eventType === 'link_clicked') {
          acc[event.email].clicked++;
        }

        if (event.eventType === 'cart_recovered') {
          acc[event.email].recovered++;
        }

        return acc;
      }, {});

      // Convert object to array format expected by frontend
      const templateStats = Object.entries(templateStatsObj).map(([template, stats]) => ({
        template,
        sent: stats.sent,
        opened: stats.opened,
        clicked: stats.clicked,
        recovered: stats.recovered,
        revenue: 0, // Would need to calculate from cart data if available
        openRate: stats.sent > 0 ? (stats.opened / stats.sent) * 100 : 0,
        clickRate: stats.sent > 0 ? (stats.clicked / stats.sent) * 100 : 0,
        recoveryRate: stats.sent > 0 ? (stats.recovered / stats.sent) * 100 : 0
      }));

      return templateStats;
    } catch (error) {
      this.logger.error('Error getting template stats', {
        days,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get discount stats
   */
  async getDiscountStats(days = 30) {
    try {
      const recoveredCarts = await this.prisma.carts.findMany({
        where: {
          recoveredAt: {
            gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          id: true,
          total: true,
          items: {
            select: {
              id: true,
              quantity: true,
              price: true,
              subtotal: true
            }
          }
        }
      });

      // Since CartItem model doesn't have discountAmount field yet,
      // return default structure with zero values
      // This functionality would need to be implemented if discount tracking is required
      return {
        withDiscount: {
          count: 0,
          revenue: 0
        },
        withoutDiscount: {
          count: recoveredCarts.length,
          revenue: recoveredCarts.reduce((sum, cart) => sum + (cart.total || 0), 0)
        }
      };
    } catch (error) {
      this.logger.error('Error getting discount stats', {
        days,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get hourly stats
   */
  async getHourlyStats(days = 30) {
    try {
      const events = await this.prisma.cart_recovery_events.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          eventType: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'asc'
        },
        take: 1000
      });

      const hourlyStats = [];

      for (let hour = 0; hour < 24; hour++) {
        const hourEvents = events.filter(e => {
          const eventHour = new Date(e.createdAt).getHours();
          return eventHour === hour;
        });

        const sent = hourEvents.filter(e => e.eventType === 'email_sent').length;
        const opened = hourEvents.filter(e => e.eventType === 'email_opened').length;
        const clicked = hourEvents.filter(e => e.eventType === 'link_clicked').length;
        const recovered = hourEvents.filter(e => e.eventType === 'cart_recovered').length;

        hourlyStats.push({
          hour,
          sent,
          opened,
          clicked,
          recovered
        });
      }

      return hourlyStats;
    } catch (error) {
      this.logger.error('Error getting hourly stats', {
        days,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new CartAnalyticsService();
