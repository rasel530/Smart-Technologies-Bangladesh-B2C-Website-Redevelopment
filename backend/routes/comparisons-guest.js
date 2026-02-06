const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { ComparisonService } = require('../services/comparison.service');
const crypto = require('crypto');

const router = express.Router();
const prisma = new PrismaClient();
const comparisonService = new ComparisonService();

// Helper function to serialize Decimal values
const serializeComparison = (comparison) => {
  return {
    ...comparison,
    items: comparison.items?.map(item => ({
      ...item,
      product: item.product ? {
        ...item.product,
        regularPrice: parseFloat(item.product.regularPrice),
        salePrice: item.product.salePrice ? parseFloat(item.product.salePrice) : null,
        costPrice: parseFloat(item.product.costPrice)
      } : null
    })) || []
  };
};

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

// ============================================
// GUEST COMPARISON ENDPOINTS
// ============================================

// POST /api/v1/comparisons/guest - Create guest comparison
router.post('/guest', [
  body('name').optional().isString().trim(),
  body('productIds').isArray().withMessage('Product IDs must be an array'),
  body('productIds.*').isUUID().withMessage('Each product ID must be a valid UUID')
], handleValidationErrors, async (req, res) => {
  try {
    const { name, productIds } = req.body;

    // Generate session ID
    const sessionId = crypto.randomBytes(32).toString('hex');

    // Validate products exist
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, status: true, visibility: true }
    });

    if (products.length !== productIds.length) {
      return res.status(404).json({
        error: 'One or more products not found'
      });
    }

    // Check if products are active and public
    const invalidProducts = products.filter(p => p.status !== 'active' || p.visibility !== 'public');
    if (invalidProducts.length > 0) {
      return res.status(400).json({
        error: 'Some products are not available for comparison'
      });
    }

    // Create guest comparison
    // BUG-HIGH-002: Guest comparisons expire after 7 days - Fixed to 30 days
    const comparison = await prisma.productComparison.create({
      data: {
        sessionId,
        name: name || `Guest Comparison ${new Date().toLocaleDateString()}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days for guests (was 7 days)
        items: {
          create: productIds.map(productId => ({
            productId
          }))
        }
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { processingStatus: { not: 'deleted' } },
                  orderBy: { displayOrder: 'asc' },
                  take: 1
                },
                brand: {
                  select: { id: true, name: true, slug: true }
                }
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      message: 'Guest comparison created successfully',
      comparison: serializeComparison(comparison),
      sessionId
    });

  } catch (error) {
    console.error('Create guest comparison error:', error);
    res.status(500).json({
      error: 'Failed to create guest comparison',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/comparisons/guest/:sessionId - Get guest comparison
router.get('/guest/:sessionId', [
  param('sessionId').isString().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const comparison = await prisma.productComparison.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { processingStatus: { not: 'deleted' } },
                  orderBy: { displayOrder: 'asc' }
                },
                specifications: {
                  orderBy: { sortOrder: 'asc' }
                },
                brand: {
                  select: { id: true, name: true, slug: true }
                },
                categories: {
                  include: {
                    category: {
                      select: { id: true, name: true, slug: true }
                    }
                  },
                  where: { isPrimary: true },
                  take: 1
                }
              }
            }
          },
          orderBy: { addedAt: 'asc' }
        }
      }
    });

    if (!comparison) {
      return res.status(404).json({
        error: 'Guest comparison not found'
      });
    }

    // Check if expired
    if (comparison.expiresAt && comparison.expiresAt < new Date()) {
      return res.status(410).json({
        error: 'Guest comparison has expired'
      });
    }

    res.json({
      comparison: serializeComparison(comparison)
    });

  } catch (error) {
    console.error('Get guest comparison error:', error);
    res.status(500).json({
      error: 'Failed to fetch guest comparison',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /api/v1/comparisons/guest/:sessionId - Update guest comparison
router.put('/guest/:sessionId', [
  param('sessionId').isString().trim(),
  body('name').optional().isString().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { name } = req.body;

    // Check if comparison exists
    const comparison = await prisma.productComparison.findUnique({
      where: { sessionId }
    });

    if (!comparison) {
      return res.status(404).json({
        error: 'Guest comparison not found'
      });
    }

    // Check if expired
    if (comparison.expiresAt && comparison.expiresAt < new Date()) {
      return res.status(410).json({
        error: 'Guest comparison has expired'
      });
    }

    const updatedComparison = await prisma.productComparison.update({
      where: { sessionId },
      data: { name },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { processingStatus: { not: 'deleted' } },
                  orderBy: { displayOrder: 'asc' },
                  take: 1
                },
                brand: {
                  select: { id: true, name: true, slug: true }
                }
              }
            }
          }
        }
      }
    });

    res.json({
      message: 'Guest comparison updated successfully',
      comparison: serializeComparison(updatedComparison)
    });

  } catch (error) {
    console.error('Update guest comparison error:', error);
    res.status(500).json({
      error: 'Failed to update guest comparison',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/v1/comparisons/guest/:sessionId/merge - Merge to user account
router.post('/guest/:sessionId/merge', [
  param('sessionId').isString().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to merge guest comparison'
      });
    }

    // Check if comparison exists
    const comparison = await prisma.productComparison.findUnique({
      where: { sessionId },
      include: {
        items: true
      }
    });

    if (!comparison) {
      return res.status(404).json({
        error: 'Guest comparison not found'
      });
    }

    // Check if expired
    if (comparison.expiresAt && comparison.expiresAt < new Date()) {
      return res.status(410).json({
        error: 'Guest comparison has expired'
      });
    }

    // Check if comparison already belongs to a user
    if (comparison.userId) {
      return res.status(400).json({
        error: 'Comparison already belongs to a user account'
      });
    }

    // Merge comparison to user account
    const updatedComparison = await prisma.productComparison.update({
      where: { id: comparison.id },
      data: {
        userId,
        sessionId: null, // Clear session ID
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Extend to 30 days
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { processingStatus: { not: 'deleted' } },
                  orderBy: { displayOrder: 'asc' },
                  take: 1
                },
                brand: {
                  select: { id: true, name: true, slug: true }
                }
              }
            }
          }
        }
      }
    });

    // Create history entry
    await comparisonService.createHistoryEntry(userId, comparison.id, 'merged_from_guest', { sessionId });

    res.json({
      message: 'Guest comparison merged successfully',
      comparison: serializeComparison(updatedComparison)
    });

  } catch (error) {
    console.error('Merge guest comparison error:', error);
    res.status(500).json({
      error: 'Failed to merge guest comparison',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
