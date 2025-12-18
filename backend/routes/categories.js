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

// Get all categories
router.get('/', [
  query('includeInactive').optional().isBoolean(),
  query('parentOnly').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const { includeInactive = false, parentOnly = false } = req.query;

    const where = includeInactive ? {} : { isActive: true };
    
    if (parentOnly === 'true') {
      where.parentId = null;
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        parentCategory: {
          select: { id: true, name: true, slug: true }
        },
        subcategories: {
          where: includeInactive ? {} : { isActive: true },
          select: { id: true, name: true, slug: true, isActive: true }
        },
        _count: {
          products: true,
          subcategories: true
        }
      },
      orderBy: { sortOrder: 'asc', name: 'asc' }
    });

    res.json({ categories });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: 'Failed to fetch categories',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get category by ID
router.get('/:id', [
  param('id').isUUID()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parentCategory: {
          select: { id: true, name: true, slug: true }
        },
        subcategories: {
          where: { isActive: true },
          include: {
            _count: {
              products: true
            }
          },
          orderBy: { sortOrder: 'asc', name: 'asc' }
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
        },
        _count: {
          products: true,
          subcategories: true
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        error: 'Category not found'
      });
    }

    res.json({ category });

  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      error: 'Failed to fetch category',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get category tree
router.get('/tree/all', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        subcategories: {
          where: { isActive: true },
          include: {
            subcategories: {
              where: { isActive: true },
              include: {
                _count: {
                  products: true
                }
              }
            }
          }
        },
        _count: {
          products: true,
          subcategories: true
        }
      },
      orderBy: { sortOrder: 'asc', name: 'asc' }
    });

    // Build tree structure
    const buildTree = (categories, parentId = null) => {
      return categories
        .filter(cat => cat.parentId === parentId)
        .map(cat => ({
          ...cat,
          children: buildTree(categories, cat.id)
        }));
    };

    const tree = buildTree(categories);

    res.json({ categories: tree });

  } catch (error) {
    console.error('Get category tree error:', error);
    res.status(500).json({
      error: 'Failed to fetch category tree',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create category (admin only)
router.post('/', [
  body('name').notEmpty().trim(),
  body('slug').isSlug(),
  body('description').optional().isString(),
  body('parentId').optional().isUUID(),
  body('sortOrder').optional().isInt({ min: 0 }),
  body('bannerImage').optional().isURL(),
  body('icon').optional().isURL()
], handleValidationErrors, authMiddleware.adminOnly(), async (req, res) => {
  try {
    const categoryData = req.body;

    // Check if slug already exists
    const existingCategory = await prisma.category.findUnique({
      where: { slug: categoryData.slug }
    });

    if (existingCategory) {
      return res.status(409).json({
        error: 'Category with this slug already exists'
      });
    }

    // Validate parent category if provided
    if (categoryData.parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: categoryData.parentId }
      });

      if (!parentCategory) {
        return res.status(400).json({
          error: 'Parent category not found'
        });
      }
    }

    const category = await prisma.category.create({
      data: {
        ...categoryData,
        sortOrder: categoryData.sortOrder || 0
      }
    });

    res.status(201).json({
      message: 'Category created successfully',
      category
    });

  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      error: 'Failed to create category',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update category (admin only)
router.put('/:id', [
  param('id').isUUID(),
  body('name').optional().notEmpty().trim(),
  body('slug').optional().isSlug(),
  body('description').optional().isString(),
  body('parentId').optional().isUUID(),
  body('sortOrder').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean()
], handleValidationErrors, authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      return res.status(404).json({
        error: 'Category not found'
      });
    }

    // Check if slug conflicts with another category
    if (updateData.slug && updateData.slug !== existingCategory.slug) {
      const slugConflict = await prisma.category.findFirst({
        where: { slug: updateData.slug, NOT: { id } }
      });

      if (slugConflict) {
        return res.status(409).json({
          error: 'Category with this slug already exists'
        });
      }
    }

    // Validate parent category if provided
    if (updateData.parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: updateData.parentId }
      });

      if (!parentCategory) {
        return res.status(400).json({
          error: 'Parent category not found'
        });
      }

      // Prevent circular reference
      if (updateData.parentId === id) {
        return res.status(400).json({
          error: 'Category cannot be its own parent'
        });
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: updateData
    });

    res.json({
      message: 'Category updated successfully',
      category: updatedCategory
    });

  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      error: 'Failed to update category',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete category (admin only)
router.delete('/:id', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            subcategories: true
          }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        error: 'Category not found'
      });
    }

    // Check if category has products or subcategories
    if (category._count.products > 0 || category._count.subcategories > 0) {
      return res.status(400).json({
        error: 'Cannot delete category with existing products or subcategories',
        suggestion: 'Consider deactivating the category instead'
      });
    }

    await prisma.category.delete({
      where: { id }
    });

    res.json({
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      error: 'Failed to delete category',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;