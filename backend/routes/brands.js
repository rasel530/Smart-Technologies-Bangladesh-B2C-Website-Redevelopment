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

// Get all brands
router.get('/', [
  query('includeInactive').optional().isBoolean(),
  query('search').optional().isString().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const { includeInactive = false, search } = req.query;

    const where = includeInactive ? {} : { isActive: true };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const brands = await prisma.brand.findMany({
      where,
      include: {
        _count: {
          products: true
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ brands });

  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({
      error: 'Failed to fetch brands',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get brand by ID
router.get('/:id', [
  param('id').isUUID()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        _count: {
          products: true
        },
        products: {
          where: { status: 'ACTIVE' },
          take: 10,
          include: {
            images: {
              where: { sortOrder: 0 },
              take: 1,
              select: { id: true, url: true, alt: true }
            },
            _count: {
              reviews: true
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!brand) {
      return res.status(404).json({
        error: 'Brand not found'
      });
    }

    res.json({ brand });

  } catch (error) {
    console.error('Get brand error:', error);
    res.status(500).json({
      error: 'Failed to fetch brand',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create brand (admin only)
router.post('/', [
  body('name').notEmpty().trim(),
  body('slug').isSlug(),
  body('description').optional().isString(),
  body('website').optional().isURL(),
  body('isActive').optional().isBoolean()
], handleValidationErrors, authMiddleware.adminOnly(), async (req, res) => {
  try {
    const brandData = req.body;

    // Check if slug already exists
    const existingBrand = await prisma.brand.findUnique({
      where: { slug: brandData.slug }
    });

    if (existingBrand) {
      return res.status(409).json({
        error: 'Brand with this slug already exists'
      });
    }

    const brand = await prisma.brand.create({
      data: {
        ...brandData,
        isActive: brandData.isActive !== undefined ? brandData.isActive : true
      }
    });

    res.status(201).json({
      message: 'Brand created successfully',
      brand
    });

  } catch (error) {
    console.error('Create brand error:', error);
    res.status(500).json({
      error: 'Failed to create brand',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update brand (admin only)
router.put('/:id', [
  param('id').isUUID(),
  body('name').optional().notEmpty().trim(),
  body('slug').optional().isSlug(),
  body('description').optional().isString(),
  body('website').optional().isURL(),
  body('isActive').optional().isBoolean()
], handleValidationErrors, authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if brand exists
    const existingBrand = await prisma.brand.findUnique({
      where: { id }
    });

    if (!existingBrand) {
      return res.status(404).json({
        error: 'Brand not found'
      });
    }

    // Check if slug conflicts with another brand
    if (updateData.slug && updateData.slug !== existingBrand.slug) {
      const slugConflict = await prisma.brand.findFirst({
        where: { slug: updateData.slug, NOT: { id } }
      });

      if (slugConflict) {
        return res.status(409).json({
          error: 'Brand with this slug already exists'
        });
      }
    }

    const updatedBrand = await prisma.brand.update({
      where: { id },
      data: updateData
    });

    res.json({
      message: 'Brand updated successfully',
      brand: updatedBrand
    });

  } catch (error) {
    console.error('Update brand error:', error);
    res.status(500).json({
      error: 'Failed to update brand',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete brand (admin only)
router.delete('/:id', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if brand exists
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    if (!brand) {
      return res.status(404).json({
        error: 'Brand not found'
      });
    }

    // Check if brand has products
    if (brand._count.products > 0) {
      return res.status(400).json({
        error: 'Cannot delete brand with existing products',
        suggestion: 'Consider deactivating the brand instead'
      });
    }

    await prisma.brand.delete({
      where: { id }
    });

    res.json({
      message: 'Brand deleted successfully'
    });

  } catch (error) {
    console.error('Delete brand error:', error);
    res.status(500).json({
      error: 'Failed to delete brand',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;