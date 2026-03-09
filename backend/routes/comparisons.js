const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { ComparisonService } = require('../services/comparison.service');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const winston = require('winston');

const router = express.Router();
const prisma = new PrismaClient();
const comparisonService = new ComparisonService();

// BUG-HIGH-001: No rate limiting on any endpoints
// Configure rate limiting for comparison routes
const comparisonRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Please try again later'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,
});

const writeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 write requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// BUG-HIGH-004: No CSRF protection
// Initialize CSRF protection (disabled for now as it requires session/cookie setup)
// const csrfProtection = csrf({ cookie: true });

// BUG-HIGH-008: No proper error logging
// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/comparisons-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/comparisons-combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

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

// Share token validation middleware - BUG-CRIT-002: No validation that share tokens exist
const validateShareToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Check if token exists and is not expired
    const shareToken = await prisma.comparisonShareToken.findUnique({
      where: { token },
      include: {
        comparison: {
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
        }
      }
    });

    if (!shareToken) {
      return res.status(404).json({
        error: 'Share link not found or expired'
      });
    }

    // Check if token has expired
    if (shareToken.expiresAt < new Date()) {
      return res.status(410).json({
        error: 'Share link has expired'
      });
    }

    // Check if comparison has expired
    if (shareToken.comparison.expiresAt && shareToken.comparison.expiresAt < new Date()) {
      return res.status(410).json({
        error: 'Comparison has expired'
      });
    }

    // Attach comparison to request
    req.sharedComparison = shareToken.comparison;
    next();
  } catch (error) {
    console.error('Share token validation error:', error);
    res.status(500).json({
      error: 'Failed to validate share token',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ============================================
// COMPARISON MANAGEMENT ENDPOINTS
// ============================================

// POST /api/v1/comparisons - Create new comparison
router.post('/', [
  body('name').optional().isString().trim(),
  body('productIds').isArray().withMessage('Product IDs must be an array'),
  body('productIds.*').isUUID().withMessage('Each product ID must be a valid UUID'),
  body('sessionId').optional().isString()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { name, productIds, sessionId } = req.body;
    const userId = req.user.id;

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

    // Create comparison
    const comparison = await prisma.product_comparisons.create({
      data: {
        userId,
        name: name || `Comparison ${new Date().toLocaleDateString()}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
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

    // Create history entry
    await comparisonService.createHistoryEntry(userId, comparison.id, 'created', {
      productCount: productIds.length
    });

    res.status(201).json({
      message: 'Comparison created successfully',
      comparison: serializeComparison(comparison)
    });

  } catch (error) {
    console.error('Create comparison error:', error);
    res.status(500).json({
      error: 'Failed to create comparison',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/comparisons - Get user's comparisons
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('includeExpired').optional().isBoolean()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      includeExpired = false
    } = req.query;

    const userId = req.user.id;
    const skip = (page - 1) * limit;

    const where = { userId };
    if (!includeExpired) {
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ];
    }

    const [comparisons, total] = await Promise.all([
      prisma.product_comparisons.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
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
            },
            orderBy: { addedAt: 'asc' }
          },
          _count: {
            select: { items: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product_comparisons.count({ where })
    ]);

    res.json({
      comparisons: comparisons.map(serializeComparison),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get comparisons error:', error);
    res.status(500).json({
      error: 'Failed to fetch comparisons',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/comparisons/:id - Get specific comparison
router.get('/:id', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const comparison = await prisma.product_comparisons.findUnique({
      where: { id },
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
        error: 'Comparison not found'
      });
    }

    // Check ownership
    if (comparison.userId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own comparisons'
      });
    }

    // Create history entry
    await comparisonService.createHistoryEntry(userId, id, 'viewed');

    res.json({
      comparison: serializeComparison(comparison)
    });

  } catch (error) {
    console.error('Get comparison error:', error);
    res.status(500).json({
      error: 'Failed to fetch comparison',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /api/v1/comparisons/:id - Update comparison details
router.put('/:id', [
  param('id').isUUID(),
  body('name').optional().isString().trim()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user.id;

    // Check if comparison exists and belongs to user
    const comparison = await prisma.product_comparisons.findUnique({
      where: { id }
    });

    if (!comparison) {
      return res.status(404).json({
        error: 'Comparison not found'
      });
    }

    if (comparison.userId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only update your own comparisons'
      });
    }

    const updatedComparison = await prisma.product_comparisons.update({
      where: { id },
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

    // Create history entry
    await comparisonService.createHistoryEntry(userId, id, 'updated', { name });

    res.json({
      message: 'Comparison updated successfully',
      comparison: serializeComparison(updatedComparison)
    });

  } catch (error) {
    console.error('Update comparison error:', error);
    res.status(500).json({
      error: 'Failed to update comparison',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/v1/comparisons/:id - Delete comparison
router.delete('/:id', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if comparison exists and belongs to user
    const comparison = await prisma.product_comparisons.findUnique({
      where: { id }
    });

    if (!comparison) {
      return res.status(404).json({
        error: 'Comparison not found'
      });
    }

    if (comparison.userId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only delete your own comparisons'
      });
    }

    await prisma.product_comparisons.delete({
      where: { id }
    });

    // Create history entry (this will be the last one before deletion)
    await comparisonService.createHistoryEntry(userId, id, 'deleted');

    res.json({
      message: 'Comparison deleted successfully'
    });

  } catch (error) {
    console.error('Delete comparison error:', error);
    res.status(500).json({
      error: 'Failed to delete comparison',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/v1/comparisons/:id/items - Add product to comparison
router.post('/:id/items', [
  param('id').isUUID(),
  body('productId').isUUID().withMessage('Product ID must be a valid UUID'),
  body('notes').optional().isString()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { productId, notes } = req.body;
    const userId = req.user.id;

    // Check if comparison exists and belongs to user
    const comparison = await prisma.product_comparisons.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!comparison) {
      return res.status(404).json({
        error: 'Comparison not found'
      });
    }

    if (comparison.userId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only modify your own comparisons'
      });
    }

    // Check if product already in comparison
    const existingItem = comparison.items.find(item => item.productId === productId);
    if (existingItem) {
      return res.status(409).json({
        error: 'Product already in comparison'
      });
    }

    // Check if product exists and is available
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, status: true, visibility: true }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    if (product.status !== 'active' || product.visibility !== 'public') {
      return res.status(400).json({
        error: 'Product is not available for comparison'
      });
    }

    // Add product to comparison
    const item = await prisma.product_comparison_items.create({
      data: {
        comparisonId: id,
        productId,
        notes
      },
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
    });

    // Create history entry
    await comparisonService.createHistoryEntry(userId, id, 'item_added', { productId, notes });

    res.status(201).json({
      message: 'Product added to comparison successfully',
      item
    });

  } catch (error) {
    console.error('Add product to comparison error:', error);
    res.status(500).json({
      error: 'Failed to add product to comparison',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/v1/comparisons/:id/items/:itemId - Remove product from comparison
router.delete('/:id/items/:itemId', [
  param('id').isUUID(),
  param('itemId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const userId = req.user.id;

    // Check if comparison exists and belongs to user
    const comparison = await prisma.product_comparisons.findUnique({
      where: { id }
    });

    if (!comparison) {
      return res.status(404).json({
        error: 'Comparison not found'
      });
    }

    if (comparison.userId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only modify your own comparisons'
      });
    }

    // Check if item exists and belongs to comparison
    const item = await prisma.product_comparison_items.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      return res.status(404).json({
        error: 'Comparison item not found'
      });
    }

    if (item.comparisonId !== id) {
      return res.status(403).json({
        error: 'Item does not belong to this comparison'
      });
    }

    await prisma.product_comparison_items.delete({
      where: { id: itemId }
    });

    // Create history entry
    await comparisonService.createHistoryEntry(userId, id, 'item_removed', { itemId, productId: item.productId });

    res.json({
      message: 'Product removed from comparison successfully'
    });

  } catch (error) {
    console.error('Remove product from comparison error:', error);
    res.status(500).json({
      error: 'Failed to remove product from comparison',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/comparisons/:id/compare - Get comparison data
router.get('/:id/compare', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if comparison exists and belongs to user
    const comparison = await prisma.product_comparisons.findUnique({
      where: { id }
    });

    if (!comparison) {
      return res.status(404).json({
        error: 'Comparison not found'
      });
    }

    if (comparison.userId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own comparisons'
      });
    }

    // Generate comparison data
    const comparisonData = await comparisonService.generateComparison(id);

    // Create history entry
    await comparisonService.createHistoryEntry(userId, id, 'compared');

    res.json(comparisonData);

  } catch (error) {
    console.error('Get comparison data error:', error);
    res.status(500).json({
      error: 'Failed to generate comparison data',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/v1/comparisons/:id/share - Share comparison
router.post('/:id/share', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if comparison exists and belongs to user
    const comparison = await prisma.product_comparisons.findUnique({
      where: { id }
    });

    if (!comparison) {
      return res.status(404).json({
        error: 'Comparison not found'
      });
    }

    if (comparison.userId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only share your own comparisons'
      });
    }

    // Generate share token
    const shareToken = crypto.randomBytes(32).toString('hex');

    // BUG-CRIT-001: Share tokens generated but not stored in database
    // Store share token in database
    await prisma.comparisonShareToken.create({
      data: {
        comparisonId: id,
        token: shareToken,
        expiresAt: comparison.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days default
      }
    });

    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/compare/shared/${shareToken}`;

    // Create history entry
    await comparisonService.createHistoryEntry(userId, id, 'shared', { shareToken });

    res.json({
      message: 'Comparison share link generated successfully',
      shareUrl,
      shareToken,
      expiresAt: comparison.expiresAt
    });

  } catch (error) {
    console.error('Share comparison error:', error);
    res.status(500).json({
      error: 'Failed to share comparison',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/v1/comparisons/:id/export - Export comparison
// BUG-CRIT-003: Export format mismatch - Fixed to match frontend expectations
router.post('/:id/export', [
  param('id').isUUID(),
  body('format').optional().isIn(['pdf', 'excel', 'csv'])
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'csv', includeImages = true, includeSpecs = true, includePrices = true } = req.body;
    const userId = req.user.id;

    // Check if comparison exists and belongs to user
    const comparison = await prisma.product_comparisons.findUnique({
      where: { id }
    });

    if (!comparison) {
      return res.status(404).json({
        error: 'Comparison not found'
      });
    }

    if (comparison.userId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only export your own comparisons'
      });
    }

    // Generate comparison data
    const comparisonData = await comparisonService.generateComparison(id);

    // Create history entry
    await comparisonService.createHistoryEntry(userId, id, 'exported', { format });

    // BUG-CRIT-003: Export format mismatch - Handle all expected formats
    if (format === 'pdf' || format === 'excel') {
      // PDF and Excel formats are not yet implemented
      // Return a response indicating this
      return res.status(501).json({
        error: 'Export format not yet implemented',
        message: `${format.toUpperCase()} export is not yet supported. Please use CSV format instead.`,
        supportedFormats: ['csv']
      });
    }

    if (format === 'csv') {
      // Generate CSV
      const csvHeader = ['Product Name', 'Regular Price', 'Sale Price', 'Brand'];
      const allSpecNames = new Set();

      comparisonData.specifications.forEach(spec => {
        spec.specifications.forEach(s => allSpecNames.add(s.name));
      });

      csvHeader.push(...Array.from(allSpecNames));

      const csvRows = comparisonData.products.map(product => {
        const productSpecs = comparisonData.specifications.find(s => s.productId === product.id);
        const specValues = {};

        if (productSpecs) {
          productSpecs.specifications.forEach(spec => {
            specValues[spec.name] = spec.value;
          });
        }

        return [
          product.nameEn || product.name,
          product.regularPrice,
          product.salePrice || '',
          product.brand?.name || '',
          ...Array.from(allSpecNames).map(name => specValues[name] || 'N/A')
        ].map(field => {
          const fieldStr = String(field);
          if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
            return `"${fieldStr.replace(/"/g, '""')}"`;
          }
          return fieldStr;
        }).join(',');
      });

      const csvContent = [
        csvHeader.join(','),
        ...csvRows
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="comparison-${id}-${Date.now()}.csv"`);
      return res.send(csvContent);
    }

    // Default to CSV if format is not recognized
    res.status(400).json({
      error: 'Invalid export format',
      message: 'Supported formats are: csv'
    });

  } catch (error) {
    console.error('Export comparison error:', error);
    res.status(500).json({
      error: 'Failed to export comparison',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// COMPARISON ANALYSIS ENDPOINTS
// ============================================

// GET /api/v1/comparisons/:id/specifications - Get specification comparison
router.get('/:id/specifications', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if comparison exists and belongs to user
    const comparison = await prisma.product_comparisons.findUnique({
      where: { id }
    });

    if (!comparison) {
      return res.status(404).json({
        error: 'Comparison not found'
      });
    }

    if (comparison.userId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own comparisons'
      });
    }

    const specComparison = await comparisonService.getSpecificationComparison(id);

    res.json(specComparison);

  } catch (error) {
    console.error('Get specification comparison error:', error);
    res.status(500).json({
      error: 'Failed to get specification comparison',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/comparisons/:id/prices - Get price comparison
router.get('/:id/prices', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if comparison exists and belongs to user
    const comparison = await prisma.product_comparisons.findUnique({
      where: { id }
    });

    if (!comparison) {
      return res.status(404).json({
        error: 'Comparison not found'
      });
    }

    if (comparison.userId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own comparisons'
      });
    }

    const priceComparison = await comparisonService.getPriceComparison(id);

    res.json(priceComparison);

  } catch (error) {
    console.error('Get price comparison error:', error);
    res.status(500).json({
      error: 'Failed to get price comparison',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/comparisons/:id/images - Get image comparison
router.get('/:id/images', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if comparison exists and belongs to user
    const comparison = await prisma.product_comparisons.findUnique({
      where: { id }
    });

    if (!comparison) {
      return res.status(404).json({
        error: 'Comparison not found'
      });
    }

    if (comparison.userId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own comparisons'
      });
    }

    const imageComparison = await comparisonService.getImageComparison(id);

    res.json(imageComparison);

  } catch (error) {
    console.error('Get image comparison error:', error);
    res.status(500).json({
      error: 'Failed to get image comparison',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/comparisons/:id/differences - Highlight differences
router.get('/:id/differences', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if comparison exists and belongs to user
    const comparison = await prisma.product_comparisons.findUnique({
      where: { id }
    });

    if (!comparison) {
      return res.status(404).json({
        error: 'Comparison not found'
      });
    }

    if (comparison.userId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own comparisons'
      });
    }

    const differences = await comparisonService.getDifferencesHighlight(id);

    res.json(differences);

  } catch (error) {
    console.error('Get differences highlight error:', error);
    res.status(500).json({
      error: 'Failed to get differences highlight',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// SHARED COMPARISON ENDPOINTS
// ============================================

// GET /api/v1/comparisons/shared/:token - Get shared comparison by token
// BUG-CRIT-002: No validation that share tokens exist - Uses validateShareToken middleware
router.get('/shared/:token', validateShareToken, async (req, res) => {
  try {
    // Comparison is already attached to req.sharedComparison by validateShareToken middleware
    res.json({
      comparison: serializeComparison(req.sharedComparison)
    });
  } catch (error) {
    console.error('Get shared comparison error:', error);
    res.status(500).json({
      error: 'Failed to fetch shared comparison',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/comparisons/shared/:token/compare - Get shared comparison data
router.get('/shared/:token/compare', validateShareToken, async (req, res) => {
  try {
    const comparisonId = req.sharedComparison.id;

    // Generate comparison data
    const comparisonData = await comparisonService.generateComparison(comparisonId);

    res.json(comparisonData);
  } catch (error) {
    console.error('Get shared comparison data error:', error);
    res.status(500).json({
      error: 'Failed to generate shared comparison data',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// HISTORY ENDPOINTS
// ============================================

// BUG-HIGH-005: History entries created but never viewed
// GET /api/v1/comparisons/:id/history - Get comparison history
router.get('/:id/history', [
  param('id').isUUID(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    const skip = (page - 1) * limit;

    // Check if comparison exists and belongs to user
    const comparison = await prisma.product_comparisons.findUnique({
      where: { id }
    });

    if (!comparison) {
      return res.status(404).json({
        error: 'Comparison not found'
      });
    }

    if (comparison.userId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own comparisons'
      });
    }

    const [history, total] = await Promise.all([
      prisma.comparisonHistory.findMany({
        where: {
          comparisonId: id,
          userId
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.comparisonHistory.count({
        where: {
          comparisonId: id,
          userId
        }
      })
    ]);

    res.json({
      history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get comparison history error:', error);
    res.status(500).json({
      error: 'Failed to fetch comparison history',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
