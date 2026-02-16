const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('../services/logger');

// Create Prisma client instance at module level to avoid 'this' context issues
const prisma = new PrismaClient();

class AdminCartController {
  constructor() {
    this.prisma = prisma;
    this.logger = loggerService;
  }

  /**
   * Get all carts with pagination and filters
   * GET /api/v1/admin/carts
   */
  async getAllCarts(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        userId,
        search,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      // Build where clause
      const where = {};

      // Filter by status
      if (status) {
        where.status = status;
      }

      // Filter by user ID
      if (userId) {
        where.userId = userId;
      }

      // Search by cart ID or user email
      if (search) {
        where.OR = [
          { id: { contains: search } },
          { user: { email: { contains: search, mode: 'insensitive' } } }
        ];
      }

      // Filter by date range
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate);
        }
      }

      // Get carts with pagination
      const [carts, total] = await Promise.all([
        prisma.cart.findMany({
          where,
          skip,
          take,
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
                    sku: true
                  }
                }
              }
            },
            _count: {
              select: { items: true }
            }
          },
          orderBy: {
            [sortBy]: sortOrder
          }
        }),
        prisma.cart.count({ where })
      ]);

      const totalPages = Math.ceil(total / take);

      res.json({
        success: true,
        message: 'Carts retrieved successfully',
        messageBn: 'কার্ট সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: {
          carts,
          pagination: {
            page: parseInt(page),
            limit: take,
            total,
            pages: totalPages,
            hasNext: parseInt(page) < totalPages,
            hasPrev: parseInt(page) > 1
          }
        }
      });
    } catch (error) {
      loggerService.error('Error in getAllCarts controller', {
        error: error.message,
        stack: error.stack,
        code: error.code,
        meta: error.meta
      });

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve carts',
        message: error.message || 'Failed to retrieve carts',
        messageBn: 'কার্ট পুনরুদ্ধার করতে ব্যর্থ হয়েছে',
        ...(process.env.NODE_ENV === 'development' && {
          details: {
            code: error.code,
            meta: error.meta,
            stack: error.stack
          }
        })
      });
    }
  }

  /**
   * Get cart details by ID
   * GET /api/v1/admin/carts/:id
   */
  async getCartById(req, res) {
    try {
      const { id } = req.params;

      const cart = await prisma.cart.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true
            }
          },
          items: {
            include: {
              product: {
                include: {
                  images: {
                    where: { displayOrder: 0 },
                    take: 1,
                    select: { id: true, originalUrl: true, altTextEn: true, altTextBn: true }
                  }
                }
              }
            },
            orderBy: { addedAt: 'desc' }
          },
          analytics: true
        }
      });

      if (!cart) {
        return res.status(404).json({
          success: false,
          error: 'Cart not found',
          message: 'Cart not found',
          messageBn: 'কার্ট পাওয়া যায়নি'
        });
      }

      res.json({
        success: true,
        message: 'Cart retrieved successfully',
        messageBn: 'কার্ট সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: cart
      });
    } catch (error) {
      loggerService.error('Error in getCartById controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve cart',
        message: 'Failed to retrieve cart',
        messageBn: 'কার্ট পুনরুদ্ধার করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Get cart items
   * GET /api/v1/admin/carts/:id/items
   */
  async getCartItems(req, res) {
    try {
      const { id } = req.params;

      const cart = await prisma.cart.findUnique({
        where: { id },
        select: { id: true }
      });

      if (!cart) {
        return res.status(404).json({
          success: false,
          error: 'Cart not found',
          message: 'Cart not found',
          messageBn: 'কার্ট পাওয়া যায়নি'
        });
      }

      const items = await prisma.cartItem.findMany({
        where: { cartId: id },
        include: {
          product: {
            include: {
              images: {
                where: { displayOrder: 0 },
                take: 1,
                select: { id: true, originalUrl: true, altTextEn: true, altTextBn: true }
              }
            }
          }
        },
        orderBy: { addedAt: 'desc' }
      });

      res.json({
        success: true,
        message: 'Cart items retrieved successfully',
        messageBn: 'কার্ট আইটেম সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: items
      });
    } catch (error) {
      loggerService.error('Error in getCartItems controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve cart items',
        message: 'Failed to retrieve cart items',
        messageBn: 'কার্ট আইটেম পুনরুদ্ধার করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Update cart item (admin override)
   * PUT /api/v1/admin/carts/:id/items/:itemId
   */
  async updateCartItem(req, res) {
    try {
      const { id, itemId } = req.params;
      const { quantity, price } = req.body;

      // Validate cart exists
      const cart = await prisma.cart.findUnique({
        where: { id }
      });

      if (!cart) {
        return res.status(404).json({
          success: false,
          error: 'Cart not found',
          message: 'Cart not found',
          messageBn: 'কার্ট পাওয়া যায়নি'
        });
      }

      // Validate cart item exists
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: itemId },
        include: {
          product: true,
          variant: true
        }
      });

      if (!cartItem) {
        return res.status(404).json({
          success: false,
          error: 'Cart item not found',
          message: 'Cart item not found',
          messageBn: 'কার্ট আইটেম পাওয়া যায়নি'
        });
      }

      // Update data
      const updateData = {};
      if (quantity !== undefined) {
        if (quantity < 1) {
          return res.status(400).json({
            success: false,
            error: 'Invalid quantity',
            message: 'Quantity must be at least 1',
            messageBn: 'পরিমাণ অবশ্যই কমপক্ষে 1 হতে হবে'
          });
        }
        updateData.quantity = quantity;
      }

      if (price !== undefined) {
        if (price < 0) {
          return res.status(400).json({
            success: false,
            error: 'Invalid price',
            message: 'Price must be non-negative',
            messageBn: 'দাম অবশ্যই অ-নেতিবাচক হতে হবে'
          });
        }
        updateData.price = parseFloat(price);
        updateData.subtotal = parseFloat(price) * (quantity || cartItem.quantity);
      } else if (quantity !== undefined) {
        updateData.subtotal = parseFloat(cartItem.price) * quantity;
      }

      const updatedItem = await prisma.cartItem.update({
        where: { id: itemId },
        data: updateData,
        include: {
          product: true,
          variant: true
        }
      });

      // Recalculate cart totals
      await this.recalculateCartTotals(id);

      res.json({
        success: true,
        message: 'Cart item updated successfully',
        messageBn: 'কার্ট আইটেম সফলভাবে আপডেট করা হয়েছে',
        data: updatedItem
      });
    } catch (error) {
      loggerService.error('Error in updateCartItem controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to update cart item',
        message: 'Failed to update cart item',
        messageBn: 'কার্ট আইটেম আপডেট করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Remove cart item (admin override)
   * DELETE /api/v1/admin/carts/:id/items/:itemId
   */
  async removeCartItem(req, res) {
    try {
      const { id, itemId } = req.params;

      // Validate cart exists
      const cart = await prisma.cart.findUnique({
        where: { id }
      });

      if (!cart) {
        return res.status(404).json({
          success: false,
          error: 'Cart not found',
          message: 'Cart not found',
          messageBn: 'কার্ট পাওয়া যায়নি'
        });
      }

      // Validate cart item exists
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: itemId }
      });

      if (!cartItem) {
        return res.status(404).json({
          success: false,
          error: 'Cart item not found',
          message: 'Cart item not found',
          messageBn: 'কার্ট আইটেম পাওয়া যায়নি'
        });
      }

      // Delete cart item
      await prisma.cartItem.delete({
        where: { id: itemId }
      });

      // Recalculate cart totals
      await this.recalculateCartTotals(id);

      res.json({
        success: true,
        message: 'Cart item removed successfully',
        messageBn: 'কার্ট আইটেম সফলভাবে সরানো হয়েছে',
        data: { success: true }
      });
    } catch (error) {
      loggerService.error('Error in removeCartItem controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to remove cart item',
        message: 'Failed to remove cart item',
        messageBn: 'কার্ট আইটেম সরাতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Clear cart (admin override)
   * DELETE /api/v1/admin/carts/:id
   */
  async clearCart(req, res) {
    try {
      const { id } = req.params;

      // Validate cart exists
      const cart = await prisma.cart.findUnique({
        where: { id }
      });

      if (!cart) {
        return res.status(404).json({
          success: false,
          error: 'Cart not found',
          message: 'Cart not found',
          messageBn: 'কার্ট পাওয়া যায়নি'
        });
      }

      // Delete all cart items
      await prisma.cartItem.deleteMany({
        where: { cartId: id }
      });

      // Reset cart totals
      await prisma.cart.update({
        where: { id },
        data: {
          subtotal: 0,
          tax: 0,
          shippingCost: 0,
          discount: 0,
          total: 0
        }
      });

      res.json({
        success: true,
        message: 'Cart cleared successfully',
        messageBn: 'কার্ট সফলভাবে সাফ করা হয়েছে',
        data: { success: true }
      });
    } catch (error) {
      loggerService.error('Error in clearCart controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to clear cart',
        message: 'Failed to clear cart',
        messageBn: 'কার্ট সাফ করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
    * Get cart analytics with optimized queries
    * GET /api/v1/admin/cart-analytics
    */
  async getCartAnalytics(req, res) {
    try {
      const { startDate, endDate } = req.query;

      // Build date filter
      const dateFilter = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) {
          dateFilter.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          dateFilter.createdAt.lte = new Date(endDate);
        }
      }

      // Use database aggregation instead of fetching all data
      // Get cart statistics counts
      const [
        totalCarts,
        activeCarts,
        expiredCarts,
        abandonedCarts,
        convertedCarts
      ] = await Promise.all([
        prisma.cart.count({ where: dateFilter }),
        prisma.cart.count({ where: { ...dateFilter, status: 'active' } }),
        prisma.cart.count({ where: { ...dateFilter, status: 'expired' } }),
        prisma.cart.count({ where: { ...dateFilter, status: 'abandoned' } }),
        prisma.cart.count({ where: { ...dateFilter, status: 'converted' } })
      ]);

      // Calculate conversion rate
      const conversionRate = totalCarts > 0 ? (convertedCarts / totalCarts) * 100 : 0;

      // Use aggregation for average cart value - much more efficient
      const cartAggregations = await prisma.cart.aggregate({
        where: dateFilter,
        _avg: {
          total: true
        },
        _sum: {
          total: true
        }
      });

      const averageCartValue = cartAggregations._avg.total || 0;
      const totalValue = cartAggregations._sum.total || 0;

      // Use aggregation for average items per cart
      const itemAggregations = await prisma.cartItem.groupBy({
        by: ['cartId'],
        where: {
          cart: {
            ...dateFilter
          }
        },
        _count: {
          id: true
        }
      });

      const totalItems = itemAggregations.reduce((sum, item) => sum + item._count.id, 0);
      const averageItemsPerCart = totalCarts > 0 ? totalItems / totalCarts : 0;

      // Get top abandoned products using aggregation - optimized query
      const topAbandonedProducts = await prisma.cartItem.groupBy({
        by: ['productId'],
        where: {
          cart: {
            ...dateFilter,
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
      const products = await prisma.product.findMany({
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
      const cartSizeDistribution = await prisma.cartItem.groupBy({
        by: ['cartId'],
        where: {
          cart: {
            ...dateFilter
          }
        },
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

      // Get time in cart distribution - optimized query
      const cartsForTimeDistribution = await prisma.cart.findMany({
        where: dateFilter,
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

      res.json({
        success: true,
        message: 'Cart analytics retrieved successfully',
        messageBn: 'কার্ট বিশ্লেষণ সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: {
          totalCarts,
          activeCarts,
          expiredCarts,
          abandonedCarts,
          conversionRate: parseFloat((isNaN(conversionRate) ? 0 : conversionRate).toFixed(2)),
          averageCartValue: parseFloat((averageCartValue === null || averageCartValue === undefined || isNaN(averageCartValue) ? 0 : averageCartValue).toFixed(2)),
          averageItemsPerCart: parseFloat((isNaN(averageItemsPerCart) ? 0 : averageItemsPerCart).toFixed(2)),
          topAbandonedProducts: topAbandonedProductsWithNames,
          cartSizeDistribution: Object.values(sizeDistributionMap),
          timeInCartDistribution: Object.values(timeInCartDistribution)
        }
      });
    } catch (error) {
      loggerService.error('Error in getCartAnalytics controller', {
        error: error.message,
        stack: error.stack,
        code: error.code,
        meta: error.meta
      });

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve cart analytics',
        message: error.message || 'Failed to retrieve cart analytics',
        messageBn: 'কার্ট বিশ্লেষণ পুনরুদ্ধার করতে ব্যর্থ হয়েছে',
        ...(process.env.NODE_ENV === 'development' && {
          details: {
            code: error.code,
            meta: error.meta,
            stack: error.stack
          }
        })
      });
    }
  }

  /**
    * Get cart conversion rates (BE-HIGH-002: Analytics endpoints)
    * GET /api/v1/admin/cart-analytics/conversion
    */
  async getCartConversionRates(req, res) {
    try {
      const { startDate, endDate } = req.query;

      // Build date filter
      const dateFilter = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) {
          dateFilter.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          dateFilter.createdAt.lte = new Date(endDate);
        }
      }

      // Get cart statistics by status
      const [totalCarts, convertedCarts, abandonedCarts] = await Promise.all([
        prisma.cart.count({ where: dateFilter }),
        prisma.cart.count({ where: { ...dateFilter, status: 'converted' } }),
        prisma.cart.count({ where: { ...dateFilter, status: 'abandoned' } })
      ]);

      // Calculate rates
      const conversionRate = totalCarts > 0 ? (convertedCarts / totalCarts) * 100 : 0;
      const abandonmentRate = totalCarts > 0 ? (abandonedCarts / totalCarts) * 100 : 0;

      // Get daily conversion trends
      const dailyTrends = await prisma.cart.groupBy({
        by: ['createdAt'],
        where: dateFilter,
        _count: {
          id: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      res.json({
        success: true,
        message: 'Cart conversion rates retrieved successfully',
        messageBn: 'কার্ট রূপান্তর হার সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: {
          totalCarts,
          convertedCarts,
          abandonedCarts,
          conversionRate: parseFloat((isNaN(conversionRate) ? 0 : conversionRate).toFixed(2)),
          abandonmentRate: parseFloat((isNaN(abandonmentRate) ? 0 : abandonmentRate).toFixed(2)),
          dailyTrends: dailyTrends.map(trend => ({
            date: trend.createdAt.toISOString().split('T')[0],
            cartCount: trend._count.id
          }))
        }
      });
    } catch (error) {
      loggerService.error('Error in getCartConversionRates controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve conversion rates',
        message: 'Failed to retrieve conversion rates',
        messageBn: 'রূপান্তর হার পুনরুদ্ধার করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
    * Get average cart value (BE-HIGH-002: Analytics endpoints)
    * GET /api/v1/admin/cart-analytics/average-value
    */
  async getAverageCartValue(req, res) {
    try {
      const { startDate, endDate } = req.query;

      // Build date filter
      const dateFilter = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) {
          dateFilter.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          dateFilter.createdAt.lte = new Date(endDate);
        }
      }

      // Get cart value aggregations
      const aggregations = await prisma.cart.aggregate({
        where: dateFilter,
        _avg: {
          total: true,
          subtotal: true,
          tax: true,
          shippingCost: true
        },
        _sum: {
          total: true
        },
        _min: {
          total: true
        },
        _max: {
          total: true
        }
      });

      res.json({
        success: true,
        message: 'Average cart value retrieved successfully',
        messageBn: 'গড় কার্ট মান সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: {
          averageCartValue: parseFloat((aggregations._avg.total === null || aggregations._avg.total === undefined || isNaN(aggregations._avg.total) ? 0 : aggregations._avg.total).toFixed(2)),
          averageSubtotal: parseFloat((aggregations._avg.subtotal === null || aggregations._avg.subtotal === undefined || isNaN(aggregations._avg.subtotal) ? 0 : aggregations._avg.subtotal).toFixed(2)),
          averageTax: parseFloat((aggregations._avg.tax === null || aggregations._avg.tax === undefined || isNaN(aggregations._avg.tax) ? 0 : aggregations._avg.tax).toFixed(2)),
          averageShippingCost: parseFloat((aggregations._avg.shippingCost === null || aggregations._avg.shippingCost === undefined || isNaN(aggregations._avg.shippingCost) ? 0 : aggregations._avg.shippingCost).toFixed(2)),
          totalCartValue: parseFloat((aggregations._sum.total === null || aggregations._sum.total === undefined || isNaN(aggregations._sum.total) ? 0 : aggregations._sum.total).toFixed(2)),
          minCartValue: parseFloat((aggregations._min.total === null || aggregations._min.total === undefined || isNaN(aggregations._min.total) ? 0 : aggregations._min.total).toFixed(2)),
          maxCartValue: parseFloat((aggregations._max.total === null || aggregations._max.total === undefined || isNaN(aggregations._max.total) ? 0 : aggregations._max.total).toFixed(2))
        }
      });
    } catch (error) {
      loggerService.error('Error in getAverageCartValue controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve average cart value',
        message: 'Failed to retrieve average cart value',
        messageBn: 'গড় কার্ট মান পুনরুদ্ধার করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
    * Get cart abandonment rates (BE-HIGH-002: Analytics endpoints)
    * GET /api/v1/admin/cart-analytics/abandonment
    */
  async getCartAbandonmentRates(req, res) {
    try {
      const { startDate, endDate } = req.query;

      // Build date filter
      const dateFilter = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) {
          dateFilter.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          dateFilter.createdAt.lte = new Date(endDate);
        }
      }

      // Get abandonment statistics
      const [totalCarts, abandonedCarts, expiredCarts] = await Promise.all([
        prisma.cart.count({ where: dateFilter }),
        prisma.cart.count({ where: { ...dateFilter, status: 'abandoned' } }),
        prisma.cart.count({ where: { ...dateFilter, status: 'expired' } })
      ]);

      // Calculate abandonment rate
      const totalAbandoned = abandonedCarts + expiredCarts;
      const abandonmentRate = totalCarts > 0 ? (totalAbandoned / totalCarts) * 100 : 0;

      // Get abandonment reasons from cart events
      const abandonedCartsWithEvents = await prisma.cart.findMany({
        where: {
          ...dateFilter,
          status: { in: ['abandoned', 'expired'] }
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        take: 20
      });

      res.json({
        success: true,
        message: 'Cart abandonment rates retrieved successfully',
        messageBn: 'কার্ট পরিত্যাগ হার সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: {
          totalCarts,
          abandonedCarts,
          expiredCarts,
          totalAbandoned,
          abandonmentRate: parseFloat((isNaN(abandonmentRate) ? 0 : abandonmentRate).toFixed(2)),
          recentAbandonedCarts: abandonedCartsWithEvents.map(cart => ({
            cartId: cart.id,
            itemCount: cart.items.length,
            totalValue: parseFloat((cart.total === null || cart.total === undefined || isNaN(cart.total) ? 0 : cart.total)),
            items: cart.items.map(item => ({
              productId: item.productId,
              productName: item.product.name,
              quantity: item.quantity
            }))
          }))
        }
      });
    } catch (error) {
      loggerService.error('Error in getCartAbandonmentRates controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve abandonment rates',
        message: 'Failed to retrieve abandonment rates',
        messageBn: 'পরিত্যাগ হার পুনরুদ্ধার করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
    * Get popular products in carts (BE-HIGH-002: Analytics endpoints)
    * GET /api/v1/admin/cart-analytics/popular-products
    */
  async getPopularProductsInCarts(req, res) {
    try {
      const { startDate, endDate, limit = 20 } = req.query;

      // Build date filter
      const dateFilter = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) {
          dateFilter.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          dateFilter.createdAt.lte = new Date(endDate);
        }
      }

      // Get popular products using aggregation
      const popularProducts = await prisma.cartItem.groupBy({
        by: ['productId'],
        where: {
          cart: {
            ...dateFilter
          }
        },
        _count: {
          id: true
        },
        _sum: {
          quantity: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: parseInt(limit)
      });

      // Get product details
      const productIds = popularProducts.map(item => item.productId);
      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds }
        },
        select: {
          id: true,
          name: true,
          sku: true,
          regularPrice: true,
          salePrice: true
        }
      });

      const productMap = new Map(products.map(p => [p.id, p]));
      const popularProductsWithDetails = popularProducts.map(item => ({
        productId: item.productId,
        productName: productMap.get(item.productId)?.name || 'Unknown',
        productSku: productMap.get(item.productId)?.sku || 'Unknown',
        regularPrice: parseFloat((productMap.get(item.productId)?.regularPrice === null || productMap.get(item.productId)?.regularPrice === undefined || isNaN(productMap.get(item.productId)?.regularPrice) ? 0 : productMap.get(item.productId)?.regularPrice)),
        salePrice: productMap.get(item.productId)?.salePrice ? parseFloat((productMap.get(item.productId).salePrice === null || productMap.get(item.productId).salePrice === undefined || isNaN(productMap.get(item.productId).salePrice) ? 0 : productMap.get(item.productId).salePrice)) : null,
        cartCount: item._count.id,
        totalQuantity: item._sum.quantity
      }));

      res.json({
        success: true,
        message: 'Popular products retrieved successfully',
        messageBn: 'জনপ্রিয় পণ্য সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: {
          popularProducts: popularProductsWithDetails
        }
      });
    } catch (error) {
      loggerService.error('Error in getPopularProductsInCarts controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve popular products',
        message: 'Failed to retrieve popular products',
        messageBn: 'জনপ্রিয় পণ্য পুনরুদ্ধার করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
    * Get time in cart statistics (BE-HIGH-002: Analytics endpoints)
    * GET /api/v1/admin/cart-analytics/time-in-cart
    */
  async getTimeInCartStatistics(req, res) {
    try {
      const { startDate, endDate } = req.query;

      // Build date filter
      const dateFilter = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) {
          dateFilter.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          dateFilter.createdAt.lte = new Date(endDate);
        }
      }

      // Get carts with creation time
      const carts = await prisma.cart.findMany({
        where: dateFilter,
        select: {
          id: true,
          createdAt: true,
          status: true,
          updatedAt: true
        }
      });

      // Calculate time in cart for each cart
      const timeInCartData = carts.map(cart => {
        const timeInCart = Date.now() - new Date(cart.createdAt).getTime();
        const hours = Math.floor(timeInCart / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

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

        return {
          cartId: cart.id,
          status: cart.status,
          timeInCartHours: hours,
          timeInCartDays: days,
          timeRange
        };
      });

      // Calculate statistics
      const totalHours = timeInCartData.reduce((sum, item) => sum + item.timeInCartHours, 0);
      const averageHours = timeInCartData.length > 0 ? totalHours / timeInCartData.length : 0;
      const averageDays = averageHours / 24;

      // Get distribution by time range
      const timeRangeDistribution = {};
      timeInCartData.forEach(item => {
        if (!timeRangeDistribution[item.timeRange]) {
          timeRangeDistribution[item.timeRange] = {
            timeRange: item.timeRange,
            cartCount: 0
          };
        }
        timeRangeDistribution[item.timeRange].cartCount++;
      });

      res.json({
        success: true,
        message: 'Time in cart statistics retrieved successfully',
        messageBn: 'কার্টে সময় পরিসংখ্যান সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: {
          totalCarts: timeInCartData.length,
          averageTimeInCartHours: parseFloat((isNaN(averageHours) ? 0 : averageHours).toFixed(2)),
          averageTimeInCartDays: parseFloat((isNaN(averageDays) ? 0 : averageDays).toFixed(2)),
          timeRangeDistribution: Object.values(timeRangeDistribution)
        }
      });
    } catch (error) {
      loggerService.error('Error in getTimeInCartStatistics controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve time in cart statistics',
        message: 'Failed to retrieve time in cart statistics',
        messageBn: 'কার্টে সময় পরিসংখ্যান পুনরুদ্ধার করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Export carts to CSV (AP-HIGH-001: Export functionality)
   * GET /api/v1/admin/carts/export
   */
  async exportCarts(req, res) {
    try {
      const {
        status,
        userId,
        search,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build where clause
      const where = {};

      // Filter by status
      if (status) {
        where.status = status;
      }

      // Filter by user ID
      if (userId) {
        where.userId = userId;
      }

      // Search by cart ID or user email
      if (search) {
        where.OR = [
          { id: { contains: search } },
          { user: { email: { contains: search, mode: 'insensitive' } } }
        ];
      }

      // Filter by date range
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate);
        }
      }

      // Get carts with all required data
      const carts = await prisma.cart.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true
                }
              },
              variant: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        take: 10000 // Limit to 10,000 carts for performance
      });

      // Generate CSV content
      const csvHeader = 'Cart ID,User ID,User Email,User Name,Status,Items Count,Subtotal,Tax,Shipping,Discount,Total,Created At,Updated At,Expires At,Product Names,Product Quantities\n';
      
      const csvRows = carts.map(cart => {
        const productNames = cart.items.map(item => item.product?.name || 'Unknown').join('; ');
        const productQuantities = cart.items.map(item => `${item.product?.name || 'Unknown'}: ${item.quantity}`).join('; ');
        
        return [
          cart.id,
          cart.userId || 'Guest',
          cart.user?.email || 'N/A',
          cart.user ? `${cart.user.firstName || ''} ${cart.user.lastName || ''}`.trim() : 'Guest',
          cart.status,
          cart.items.length,
          (cart.subtotal === null || cart.subtotal === undefined || isNaN(cart.subtotal) ? 0 : cart.subtotal).toFixed(2),
          (cart.tax === null || cart.tax === undefined || isNaN(cart.tax) ? 0 : cart.tax).toFixed(2),
          (cart.shippingCost === null || cart.shippingCost === undefined || isNaN(cart.shippingCost) ? 0 : cart.shippingCost).toFixed(2),
          (cart.discount === null || cart.discount === undefined || isNaN(cart.discount) ? 0 : cart.discount).toFixed(2),
          (cart.total === null || cart.total === undefined || isNaN(cart.total) ? 0 : cart.total).toFixed(2),
          cart.createdAt.toISOString(),
          cart.updatedAt.toISOString(),
          cart.expiresAt ? cart.expiresAt.toISOString() : 'N/A',
          `"${productNames.replace(/"/g, '""')}"`,
          `"${productQuantities.replace(/"/g, '""')}"`
        ].join(',');
      });

      const csvContent = csvHeader + csvRows.join('\n');

      // Set response headers for CSV download
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=carts_export_${new Date().toISOString().split('T')[0]}.csv`);

      loggerService.info('Carts exported successfully', {
        count: carts.length,
        filters: { status, userId, search, startDate, endDate }
      });

      res.send(csvContent);
    } catch (error) {
      loggerService.error('Error in exportCarts controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to export carts',
        message: 'Failed to export carts',
        messageBn: 'কার্ট রপ্তানি করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Export single cart to CSV (AP-HIGH-001: Export functionality)
   * GET /api/v1/admin/carts/:id/export
   */
  async exportCartById(req, res) {
    try {
      const { id } = req.params;

      const cart = await prisma.cart.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true
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
                  sku: true
                }
              },
              variant: {
                select: {
                  id: true,
                  name: true
                }
              }
            },
            orderBy: { addedAt: 'desc' }
          }
        }
      });

      if (!cart) {
        return res.status(404).json({
          success: false,
          error: 'Cart not found',
          message: 'Cart not found',
          messageBn: 'কার্ট পাওয়া যায়নি'
        });
      }

      // Generate CSV content for single cart
      const csvHeader = 'Cart Information\nCart ID,User ID,User Email,User Name,User Phone,Status,Subtotal,Tax,Shipping,Discount,Total,Created At,Updated At,Expires At\n';
      
      const cartInfo = [
        cart.id,
        cart.userId || 'Guest',
        cart.user?.email || 'N/A',
        cart.user ? `${cart.user.firstName || ''} ${cart.user.lastName || ''}`.trim() : 'Guest',
        cart.user?.phone || 'N/A',
        cart.status,
        (cart.subtotal === null || cart.subtotal === undefined || isNaN(cart.subtotal) ? 0 : cart.subtotal).toFixed(2),
        (cart.tax === null || cart.tax === undefined || isNaN(cart.tax) ? 0 : cart.tax).toFixed(2),
        (cart.shippingCost === null || cart.shippingCost === undefined || isNaN(cart.shippingCost) ? 0 : cart.shippingCost).toFixed(2),
        (cart.discount === null || cart.discount === undefined || isNaN(cart.discount) ? 0 : cart.discount).toFixed(2),
        (cart.total === null || cart.total === undefined || isNaN(cart.total) ? 0 : cart.total).toFixed(2),
        cart.createdAt.toISOString(),
        cart.updatedAt.toISOString(),
        cart.expiresAt ? cart.expiresAt.toISOString() : 'N/A'
      ].join(',');

      const itemsHeader = '\n\nCart Items\nItem ID,Product ID,Product Name (EN),Product Name (BN),SKU,Variant,Quantity,Price,Subtotal,Added At\n';
      
      const itemsData = cart.items.map(item => [
        item.id,
        item.productId,
        `"${(item.product?.nameEn || item.product?.name || 'Unknown').replace(/"/g, '""')}"`,
        `"${(item.product?.nameBn || 'Unknown').replace(/"/g, '""')}"`,
        item.product?.sku || 'N/A',
        item.variant?.name || 'N/A',
        item.quantity,
        (item.price === null || item.price === undefined || isNaN(item.price) ? 0 : item.price).toFixed(2),
        (item.subtotal === null || item.subtotal === undefined || isNaN(item.subtotal) ? 0 : item.subtotal).toFixed(2),
        item.addedAt.toISOString()
      ].join(',')).join('\n');

      const csvContent = csvHeader + cartInfo + itemsHeader + itemsData;

      // Set response headers for CSV download
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=cart_${id}_${new Date().toISOString().split('T')[0]}.csv`);

      loggerService.info('Single cart exported successfully', {
        cartId: id,
        itemCount: cart.items.length
      });

      res.send(csvContent);
    } catch (error) {
      loggerService.error('Error in exportCartById controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to export cart',
        message: 'Failed to export cart',
        messageBn: 'কার্ট রপ্তানি করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Bulk delete carts (AP-HIGH-002: Bulk actions)
   * DELETE /api/v1/admin/carts/bulk
   */
  async bulkDeleteCarts(req, res) {
    try {
      const { cartIds } = req.body;

      if (!cartIds || !Array.isArray(cartIds) || cartIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid cart IDs',
          message: 'Cart IDs array is required',
          messageBn: 'কার্ট আইডি অ্যারে প্রয়োজন'
        });
      }

      if (cartIds.length > 100) {
        return res.status(400).json({
          success: false,
          error: 'Too many carts',
          message: 'Cannot delete more than 100 carts at once',
          messageBn: 'একবারে ১০০টির বেশি কার্ট মুছে ফেলা যাবে না'
        });
      }

      // Verify all carts exist
      const carts = await prisma.cart.findMany({
        where: {
          id: { in: cartIds }
        },
        include: {
          items: true
        }
      });

      if (carts.length !== cartIds.length) {
        return res.status(404).json({
          success: false,
          error: 'Some carts not found',
          message: 'One or more carts not found',
          messageBn: 'এক বা একাধিক কার্ট পাওয়া যায়নি'
        });
      }

      // Delete all cart items, analytics, and carts
      let deletedCount = 0;
      for (const cart of carts) {
        // Delete cart items
        await prisma.cartItem.deleteMany({
          where: { cartId: cart.id }
        });

        // Delete cart analytics
        await prisma.cartAnalytics.deleteMany({
          where: { cartId: cart.id }
        });

        // Delete cart
        await prisma.cart.delete({
          where: { id: cart.id }
        });

        deletedCount++;
      }

      loggerService.info('Bulk cart deletion completed', {
        count: deletedCount,
        cartIds
      });

      res.json({
        success: true,
        message: `${deletedCount} carts deleted successfully`,
        messageBn: `${deletedCount}টি কার্ট সফলভাবে মুছে ফেলা হয়েছে`,
        data: {
          deletedCount,
          deletedCartIds: cartIds
        }
      });
    } catch (error) {
      loggerService.error('Error in bulkDeleteCarts controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to bulk delete carts',
        message: 'Failed to bulk delete carts',
        messageBn: 'কার্ট বাল্ক মুছে ফেলতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Bulk clear carts (AP-HIGH-002: Bulk actions)
   * DELETE /api/v1/admin/carts/bulk/clear
   */
  async bulkClearCarts(req, res) {
    try {
      const { cartIds } = req.body;

      if (!cartIds || !Array.isArray(cartIds) || cartIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid cart IDs',
          message: 'Cart IDs array is required',
          messageBn: 'কার্ট আইডি অ্যারে প্রয়োজন'
        });
      }

      if (cartIds.length > 100) {
        return res.status(400).json({
          success: false,
          error: 'Too many carts',
          message: 'Cannot clear more than 100 carts at once',
          messageBn: 'একবারে ১০০টির বেশি কার্ট সাফ করা যাবে না'
        });
      }

      // Verify all carts exist
      const carts = await prisma.cart.findMany({
        where: {
          id: { in: cartIds }
        }
      });

      if (carts.length !== cartIds.length) {
        return res.status(404).json({
          success: false,
          error: 'Some carts not found',
          message: 'One or more carts not found',
          messageBn: 'এক বা একাধিক কার্ট পাওয়া যায়নি'
        });
      }

      // Clear all carts (delete items, reset totals)
      let clearedCount = 0;
      for (const cartId of cartIds) {
        // Delete all cart items
        await prisma.cartItem.deleteMany({
          where: { cartId }
        });

        // Reset cart totals
        await prisma.cart.update({
          where: { id: cartId },
          data: {
            subtotal: 0,
            tax: 0,
            shippingCost: 0,
            discount: 0,
            total: 0
          }
        });

        clearedCount++;
      }

      loggerService.info('Bulk cart clearing completed', {
        count: clearedCount,
        cartIds
      });

      res.json({
        success: true,
        message: `${clearedCount} carts cleared successfully`,
        messageBn: `${clearedCount}টি কার্ট সফলভাবে সাফ করা হয়েছে`,
        data: {
          clearedCount,
          clearedCartIds: cartIds
        }
      });
    } catch (error) {
      loggerService.error('Error in bulkClearCarts controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to bulk clear carts',
        message: 'Failed to bulk clear carts',
        messageBn: 'কার্ট বাল্ক সাফ করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Bulk update cart status (AP-HIGH-002: Bulk actions)
   * PUT /api/v1/admin/carts/bulk/status
   */
  async bulkUpdateCartStatus(req, res) {
    try {
      const { cartIds, status } = req.body;

      if (!cartIds || !Array.isArray(cartIds) || cartIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid cart IDs',
          message: 'Cart IDs array is required',
          messageBn: 'কার্ট আইডি অ্যারে প্রয়োজন'
        });
      }

      if (!status || !['active', 'abandoned', 'converted', 'expired'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status',
          message: 'Status must be one of: active, abandoned, converted, expired',
          messageBn: 'স্ট্যাটাস অবশ্যই নিম্নলিখিত একটি হতে হবে: active, abandoned, converted, expired'
        });
      }

      if (cartIds.length > 100) {
        return res.status(400).json({
          success: false,
          error: 'Too many carts',
          message: 'Cannot update more than 100 carts at once',
          messageBn: 'একবারে ১০০টির বেশি কার্ট আপডেট করা যাবে না'
        });
      }

      // Verify all carts exist
      const carts = await prisma.cart.findMany({
        where: {
          id: { in: cartIds }
        }
      });

      if (carts.length !== cartIds.length) {
        return res.status(404).json({
          success: false,
          error: 'Some carts not found',
          message: 'One or more carts not found',
          messageBn: 'এক বা একাধিক কার্ট পাওয়া যায়নি'
        });
      }

      // Update all cart statuses
      const result = await prisma.cart.updateMany({
        where: {
          id: { in: cartIds }
        },
        data: {
          status
        }
      });

      loggerService.info('Bulk cart status update completed', {
        count: result.count,
        status,
        cartIds
      });

      res.json({
        success: true,
        message: `${result.count} carts updated to ${status} successfully`,
        messageBn: `${result.count}টি কার্ট সফলভাবে ${status}-এ আপডেট করা হয়েছে`,
        data: {
          updatedCount: result.count,
          updatedCartIds: cartIds,
          status
        }
      });
    } catch (error) {
      loggerService.error('Error in bulkUpdateCartStatus controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to bulk update cart status',
        message: 'Failed to bulk update cart status',
        messageBn: 'কার্ট বাল্ক স্ট্যাটাস আপডেট করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Clean up expired carts
   * DELETE /api/v1/admin/carts/expired
   */
  async cleanupExpiredCarts(req, res) {
    try {
      const now = new Date();
      const expiredCarts = await prisma.cart.findMany({
        where: {
          expiresAt: {
            lte: now
          }
        },
        include: {
          items: true
        }
      });

      let deletedCount = 0;
      for (const cart of expiredCarts) {
        // Delete cart items
        await prisma.cartItem.deleteMany({
          where: { cartId: cart.id }
        });

        // Delete cart analytics
        await prisma.cartAnalytics.deleteMany({
          where: { cartId: cart.id }
        });

        // Delete cart
        await prisma.cart.delete({
          where: { id: cart.id }
        });

        deletedCount++;
      }

      loggerService.info('Expired carts cleanup completed', {
        count: deletedCount
      });

      res.json({
        success: true,
        message: `${deletedCount} expired carts cleaned up successfully`,
        messageBn: `${deletedCount} মেয়াদোত্তীর্ণ কার্ট সফলভাবে পরিষ্কার করা হয়েছে`,
        data: {
          deletedCount,
          expiredCarts: expiredCarts.map(c => c.id)
        }
      });
    } catch (error) {
      loggerService.error('Error in cleanupExpiredCarts controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to cleanup expired carts',
        message: 'Failed to cleanup expired carts',
        messageBn: 'মেয়াদোত্তীর্ণ কার্ট পরিষ্কার করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Helper method to recalculate cart totals
   */
  async recalculateCartTotals(cartId) {
    try {
      const items = await prisma.cartItem.findMany({
        where: { cartId }
      });

      // Use environment variables with fallback defaults
      const taxRate = parseFloat(process.env.CART_TAX_RATE) || 0.15; // 15% tax
      const shippingCost = parseFloat(process.env.CART_SHIPPING_COST) || 100; // Fixed shipping cost

      const subtotal = items.reduce((sum, item) => sum + (item.subtotal === null || item.subtotal === undefined || isNaN(item.subtotal) ? 0 : parseFloat(item.subtotal)), 0);
      // Tax rate is stored as percentage (e.g., 10 for 10%), so divide by 100 to get decimal
      const tax = subtotal * (taxRate / 100);
      const total = subtotal + tax + shippingCost;

      await prisma.cart.update({
        where: { id: cartId },
        data: {
          subtotal: parseFloat((isNaN(subtotal) ? 0 : subtotal).toFixed(2)),
          tax: parseFloat((isNaN(tax) ? 0 : tax).toFixed(2)),
          shippingCost: parseFloat((isNaN(shippingCost) ? 0 : shippingCost).toFixed(2)),
          total: parseFloat((isNaN(total) ? 0 : total).toFixed(2))
        }
      });
    } catch (error) {
      loggerService.error('Error recalculating cart totals', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }
}

// Singleton instance
const adminCartController = new AdminCartController();

module.exports = {
  AdminCartController,
  adminCartController
};
