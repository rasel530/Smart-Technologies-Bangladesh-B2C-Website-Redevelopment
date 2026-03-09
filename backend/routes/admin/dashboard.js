const express = require('express');
const router = express.Router();
const { databaseService } = require('../../services/database');

/**
 * GET /api/v1/admin/dashboard
 * Get dashboard statistics
 */
router.get('/', async (req, res) => {
  try {
    const prisma = databaseService.getClient();

    // Get total users count
    const totalUsers = await prisma.users.count({
      where: { deletedAt: null }
    });

    // Get total products count
    const totalProducts = await prisma.products.count();

    // Get total orders count
    const totalOrders = await prisma.orders.count();

    // Get total revenue
    const orders = await prisma.orders.findMany({
      where: {
        status: { in: ['completed', 'delivered'] }
      },
      select: {
        total: true
      }
    });
    
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
    
    // Get recent orders
    const recentOrders = await prisma.orders.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    res.json({
      success: true,
      data: {
        statistics: {
          totalUsers,
          totalProducts,
          totalOrders,
          totalRevenue
        },
        recentOrders
      }
    });
  } catch (error) {
    console.error('[Dashboard] Error fetching dashboard data:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: error.message
    });
  }
});

module.exports = router;
