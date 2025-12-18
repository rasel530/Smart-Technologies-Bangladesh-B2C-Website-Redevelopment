const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Get user's wishlists
router.get('/user/:userId', [
  param('userId').isUUID()
], handleValidationErrors, (req, res, next) => {
  // Extract userId from params and use it for selfOrAdmin middleware
  const userId = req.params.userId;
  return authMiddleware.selfOrAdmin(userId)(req, res, next);
}, async (req, res) => {
  try {
    const { userId } = req.params;

    const wishlists = await prisma.wishlist.findMany({
      where: { userId },
      include: {
        _count: {
          items: true
        },
        items: {
          take: 5,
          include: {
            product: {
              include: {
                images: {
                  where: { sortOrder: 0 },
                  take: 1,
                  select: { id: true, url: true, alt: true }
                }
              }
            }
          },
          orderBy: { addedAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ wishlists });

  } catch (error) {
    console.error('Get wishlists error:', error);
    res.status(500).json({
      error: 'Failed to fetch wishlists',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get wishlist by ID
router.get('/:id', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  // Get wishlist first to check ownership
  const wishlist = await prisma.wishlist.findUnique({
    where: { id: req.params.id },
    select: { userId: true }
  });
  
  if (!wishlist) {
    return res.status(404).json({
      error: 'Wishlist not found'
    });
  }
  
  // Check if user is admin or wishlist owner
  if (req.userRole !== 'ADMIN' && wishlist.userId !== req.userId) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'You can only access your own wishlists'
    });
  }
  try {
    const { id } = req.params;

    const wishlist = await prisma.wishlist.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true }
        },
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { sortOrder: 0 },
                  take: 1,
                  select: { id: true, url: true, alt: true }
                }
              }
            }
          },
          orderBy: { addedAt: 'desc' }
        },
        _count: {
          items: true
        }
      }
    });

    if (!wishlist) {
      return res.status(404).json({
        error: 'Wishlist not found'
      });
    }

    res.json({ wishlist });

  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      error: 'Failed to fetch wishlist',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create wishlist
router.post('/', [
  body('name').optional().isString().trim(),
  body('isPrivate').optional().isBoolean()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  // Use authenticated user's ID
  req.body.userId = req.userId;
  try {
    const { userId, name, isPrivate } = req.body;

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const wishlist = await prisma.wishlist.create({
      data: {
        userId,
        name: name || 'My Wishlist',
        isPrivate: isPrivate !== undefined ? isPrivate : false
      }
    });

    res.status(201).json({
      message: 'Wishlist created successfully',
      wishlist
    });

  } catch (error) {
    console.error('Create wishlist error:', error);
    res.status(500).json({
      error: 'Failed to create wishlist',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Add item to wishlist
router.post('/:id/items', [
  param('id').isUUID(),
  body('productId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { productId } = req.body;

    // Validate wishlist exists
    const wishlist = await prisma.wishlist.findUnique({
      where: { id }
    });

    if (!wishlist) {
      return res.status(404).json({
        error: 'Wishlist not found'
      });
    }

    // Validate product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    // Check if item already exists
    const existingItem = await prisma.wishlistItem.findFirst({
      where: {
        wishlistId: id,
        productId
      }
    });

    if (existingItem) {
      return res.status(409).json({
        error: 'Product already in wishlist'
      });
    }

    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        wishlistId: id,
        productId
      },
      include: {
        product: true
      }
    });

    res.status(201).json({
      message: 'Item added to wishlist',
      item: wishlistItem
    });

  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      error: 'Failed to add item to wishlist',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Remove item from wishlist
router.delete('/:wishlistId/items/:itemId', [
  param('wishlistId').isUUID(),
  param('itemId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { wishlistId, itemId } = req.params;

    // Check if item exists
    const wishlistItem = await prisma.wishlistItem.findFirst({
      where: { id: itemId, wishlistId }
    });

    if (!wishlistItem) {
      return res.status(404).json({
        error: 'Wishlist item not found'
      });
    }

    await prisma.wishlistItem.delete({
      where: { id: itemId }
    });

    res.json({
      message: 'Item removed from wishlist'
    });

  } catch (error) {
    console.error('Remove wishlist item error:', error);
    res.status(500).json({
      error: 'Failed to remove item from wishlist',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete wishlist
router.delete('/:id', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if wishlist exists
    const wishlist = await prisma.wishlist.findUnique({
      where: { id }
    });

    if (!wishlist) {
      return res.status(404).json({
        error: 'Wishlist not found'
      });
    }

    await prisma.wishlist.delete({
      where: { id }
    });

    res.json({
      message: 'Wishlist deleted successfully'
    });

  } catch (error) {
    console.error('Delete wishlist error:', error);
    res.status(500).json({
      error: 'Failed to delete wishlist',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;