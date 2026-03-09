const express = require('express');
const router = express.Router();
const { databaseService } = require('../../services/database');

/**
 * GET /api/v1/admin/users
 * Get all users with pagination
 */
router.get('/', async (req, res) => {
  try {
    const prisma = databaseService.getClient();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get total count
    const total = await prisma.users.count({
      where: { deletedAt: null }
    });

    // Get users with pagination
    const users = await prisma.users.findMany({
      where: { deletedAt: null },
      skip,
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('[Admin Users] Error fetching users:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

module.exports = router;
