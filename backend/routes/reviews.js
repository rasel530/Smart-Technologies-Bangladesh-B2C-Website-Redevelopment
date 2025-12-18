const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
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

// Get all reviews (with filtering)
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('productId').optional().isUUID(),
  query('userId').optional().isUUID(),
  query('rating').optional().isInt({ min: 1, max: 5 }),
  query('isApproved').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      productId,
      userId,
      rating,
      isApproved = true
    } = req.query;

    const skip = (page - 1) * limit;

    const where = {};
    if (productId) where.productId = productId;
    if (userId) where.userId = userId;
    if (rating) where.rating = parseInt(rating);
    where.isApproved = isApproved === 'true';

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true }
          },
          product: {
            select: { id: true, name: true, sku: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.review.count({ where })
    ]);

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      error: 'Failed to fetch reviews',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get review by ID
router.get('/:id', [
  param('id').isUUID()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        product: {
          select: { id: true, name: true, sku: true },
          include: {
            images: {
              where: { sortOrder: 0 },
              take: 1,
              select: { id: true, url: true, alt: true }
            }
          }
        }
      }
    });

    if (!review) {
      return res.status(404).json({
        error: 'Review not found'
      });
    }

    res.json({ review });

  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({
      error: 'Failed to fetch review',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create review
router.post('/', [
  body('productId').isUUID(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('title').notEmpty().trim(),
  body('comment').optional().isString().trim()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  // Use authenticated user's ID
  req.body.userId = req.userId;
  try {
    const { productId, userId, rating, title, comment } = req.body;

    // Validate product and user exist
    const [product, user] = await Promise.all([
      prisma.product.findUnique({ where: { id: productId } }),
      prisma.user.findUnique({ where: { id: userId } })
    ]);

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        productId,
        userId
      }
    });

    if (existingReview) {
      return res.status(409).json({
        error: 'You have already reviewed this product'
      });
    }

    const review = await prisma.review.create({
      data: {
        productId,
        userId,
        rating: parseInt(rating),
        title,
        comment,
        isVerified: true, // Auto-verify if user purchased the product
        isApproved: false // Requires admin approval
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true }
        },
        product: {
          select: { id: true, name: true, sku: true }
        }
      }
    });

    res.status(201).json({
      message: 'Review created successfully',
      review
    });

  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      error: 'Failed to create review',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update review
router.put('/:id', [
  param('id').isUUID(),
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('title').optional().notEmpty().trim(),
  body('comment').optional().isString().trim()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  // Get review first to check ownership
  const review = await prisma.review.findUnique({
    where: { id: req.params.id },
    select: { userId: true }
  });
  
  if (!review) {
    return res.status(404).json({
      error: 'Review not found'
    });
  }
  
  // Check if user is admin or review owner
  if (req.userRole !== 'ADMIN' && review.userId !== req.userId) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'You can only update your own reviews'
    });
  }
  try {
    const { id } = req.params;
    const { rating, title, comment } = req.body;

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id }
    });

    if (!review) {
      return res.status(404).json({
        error: 'Review not found'
      });
    }

    const updateData = {};
    if (rating !== undefined) updateData.rating = parseInt(rating);
    if (title !== undefined) updateData.title = title;
    if (comment !== undefined) updateData.comment = comment;

    const updatedReview = await prisma.review.update({
      where: { id },
      data: updateData
    });

    res.json({
      message: 'Review updated successfully',
      review: updatedReview
    });

  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      error: 'Failed to update review',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Approve review (admin only)
router.put('/:id/approve', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.update({
      where: { id },
      data: { isApproved: true }
    });

    if (!review) {
      return res.status(404).json({
        error: 'Review not found'
      });
    }

    res.json({
      message: 'Review approved successfully',
      review
    });

  } catch (error) {
    console.error('Approve review error:', error);
    res.status(500).json({
      error: 'Failed to approve review',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete review
router.delete('/:id', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  // Get review first to check ownership
  const review = await prisma.review.findUnique({
    where: { id: req.params.id },
    select: { userId: true }
  });
  
  if (!review) {
    return res.status(404).json({
      error: 'Review not found'
    });
  }
  
  // Check if user is admin or review owner
  if (req.userRole !== 'ADMIN' && review.userId !== req.userId) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'You can only delete your own reviews'
    });
  }
  try {
    const { id } = req.params;

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id }
    });

    if (!review) {
      return res.status(404).json({
        error: 'Review not found'
      });
    }

    await prisma.review.delete({
      where: { id }
    });

    res.json({
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      error: 'Failed to delete review',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;