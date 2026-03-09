const express = require('express');
const router = express.Router();
const { databaseService } = require('../../services/database');

/**
 * GET /api/v1/admin/products
 * Get all products with pagination
 */
router.get('/', async (req, res) => {
  try {
    const prisma = databaseService.getClient();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get total count
    const total = await prisma.products.count();

    // Get products with pagination
    const products = await prisma.products.findMany({
      skip,
      take: limit,
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            nameBn: true
          }
        },
        brands: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('[Admin Products] Error fetching products:', error);
    res.status(500).json({
      error: 'Failed to fetch products',
      message: error.message
    });
  }
});

module.exports = router;
