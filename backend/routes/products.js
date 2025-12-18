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

// Get all products
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isUUID(),
  query('brand').optional().isUUID(),
  query('search').optional().isString().trim(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('status').optional().isIn(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']),
  query('sortBy').optional().isIn(['price', 'name', 'createdAt', 'stockQuantity']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], handleValidationErrors, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      brand,
      search,
      minPrice,
      maxPrice,
      status = 'ACTIVE',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = { status };
    
    if (category) where.categoryId = category;
    if (brand) where.brandId = brand;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { nameBn: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.regularPrice = {};
      if (minPrice !== undefined) where.regularPrice.gte = parseFloat(minPrice);
      if (maxPrice !== undefined) where.regularPrice.lte = parseFloat(maxPrice);
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          category: {
            select: { id: true, name: true, slug: true }
          },
          brand: {
            select: { id: true, name: true, slug: true }
          },
          images: {
            where: { sortOrder: 0 },
            take: 1,
            select: { id: true, url: true, alt: true }
          },
          _count: {
            reviews: true,
            cartItems: true,
            orderItems: true
          }
        },
        orderBy: { [sortBy]: sortOrder }
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      error: 'Failed to fetch products',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get product by ID
router.get('/:id', [
  param('id').isUUID()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        images: {
          orderBy: { sortOrder: 'asc' }
        },
        specifications: {
          orderBy: { sortOrder: 'asc' }
        },
        variants: {
          where: { isActive: true },
          orderBy: { name: 'asc' }
        },
        reviews: {
          where: { isApproved: true },
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          reviews: true
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    // Calculate average rating
    const avgRating = product.reviews.length > 0 
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : 0;

    res.json({
      product: {
        ...product,
        avgRating: Math.round(avgRating * 10) / 10
      }
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      error: 'Failed to fetch product',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get product by slug
router.get('/slug/:slug', [
  param('slug').isSlug()
], handleValidationErrors, async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        brand: true,
        images: {
          orderBy: { sortOrder: 'asc' }
        },
        specifications: {
          orderBy: { sortOrder: 'asc' }
        },
        variants: {
          where: { isActive: true },
          orderBy: { name: 'asc' }
        },
        reviews: {
          where: { isApproved: true },
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          reviews: true
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    // Calculate average rating
    const avgRating = product.reviews.length > 0 
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : 0;

    res.json({
      product: {
        ...product,
        avgRating: Math.round(avgRating * 10) / 10
      }
    });

  } catch (error) {
    console.error('Get product by slug error:', error);
    res.status(500).json({
      error: 'Failed to fetch product',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create product (admin only)
router.post('/', [
  body('name').notEmpty().trim(),
  body('nameEn').notEmpty().trim(),
  body('slug').isSlug(),
  body('sku').notEmpty().trim(),
  body('categoryId').isUUID(),
  body('brandId').isUUID(),
  body('regularPrice').isFloat({ min: 0 }),
  body('salePrice').optional().isFloat({ min: 0 }),
  body('costPrice').isFloat({ min: 0 }),
  body('stockQuantity').isInt({ min: 0 }),
  body('lowStockThreshold').optional().isInt({ min: 0 }),
  body('description').optional().isString(),
  body('shortDescription').optional().isString(),
  body('nameBn').optional().isString(),
  body('warrantyPeriod').optional().isInt({ min: 0 }),
  body('warrantyType').optional().isString()
], handleValidationErrors, authMiddleware.adminOnly(), async (req, res) => {
  try {
    const productData = req.body;

    // Check if SKU already exists
    const existingProduct = await prisma.product.findUnique({
      where: { sku: productData.sku }
    });

    if (existingProduct) {
      return res.status(409).json({
        error: 'Product with this SKU already exists'
      });
    }

    // Check if slug already exists
    const existingSlug = await prisma.product.findUnique({
      where: { slug: productData.slug }
    });

    if (existingSlug) {
      return res.status(409).json({
        error: 'Product with this slug already exists'
      });
    }

    const product = await prisma.product.create({
      data: {
        ...productData,
        regularPrice: parseFloat(productData.regularPrice),
        salePrice: productData.salePrice ? parseFloat(productData.salePrice) : null,
        costPrice: parseFloat(productData.costPrice),
        stockQuantity: parseInt(productData.stockQuantity),
        lowStockThreshold: productData.lowStockThreshold ? parseInt(productData.lowStockThreshold) : 10
      },
      include: {
        category: true,
        brand: true
      }
    });

    res.status(201).json({
      message: 'Product created successfully',
      product
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      error: 'Failed to create product',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update product (admin only)
router.put('/:id', [
  param('id').isUUID(),
  body('name').optional().notEmpty().trim(),
  body('nameEn').optional().notEmpty().trim(),
  body('slug').optional().isSlug(),
  body('regularPrice').optional().isFloat({ min: 0 }),
  body('salePrice').optional().isFloat({ min: 0 }),
  body('costPrice').optional().isFloat({ min: 0 }),
  body('stockQuantity').optional().isInt({ min: 0 }),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED'])
], handleValidationErrors, authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    // Check if SKU conflicts with another product
    if (updateData.sku && updateData.sku !== existingProduct.sku) {
      const skuConflict = await prisma.product.findFirst({
        where: { sku: updateData.sku, NOT: { id } }
      });

      if (skuConflict) {
        return res.status(409).json({
          error: 'Product with this SKU already exists'
        });
      }
    }

    // Check if slug conflicts with another product
    if (updateData.slug && updateData.slug !== existingProduct.slug) {
      const slugConflict = await prisma.product.findFirst({
        where: { slug: updateData.slug, NOT: { id } }
      });

      if (slugConflict) {
        return res.status(409).json({
          error: 'Product with this slug already exists'
        });
      }
    }

    // Clean update data
    const cleanUpdateData = {};
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        if (['regularPrice', 'salePrice', 'costPrice'].includes(key)) {
          cleanUpdateData[key] = parseFloat(updateData[key]);
        } else if (['stockQuantity', 'lowStockThreshold'].includes(key)) {
          cleanUpdateData[key] = parseInt(updateData[key]);
        } else {
          cleanUpdateData[key] = updateData[key];
        }
      }
    });

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: cleanUpdateData,
      include: {
        category: true,
        brand: true
      }
    });

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      error: 'Failed to update product',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete product (admin only)
router.delete('/:id', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orderItems: true,
            cartItems: true,
            wishlistItems: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    // Check if product is referenced in orders
    if (product._count.orderItems > 0) {
      return res.status(400).json({
        error: 'Cannot delete product with existing orders',
        suggestion: 'Consider discontinuing the product instead'
      });
    }

    await prisma.product.delete({
      where: { id }
    });

    res.json({
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      error: 'Failed to delete product',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get featured products
router.get('/featured/list', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { 
        isFeatured: true,
        status: 'ACTIVE'
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        },
        brand: {
          select: { id: true, name: true, slug: true }
        },
        images: {
          where: { sortOrder: 0 },
          take: 1,
          select: { id: true, url: true, alt: true }
        },
        _count: {
          reviews: true
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json({ products });

  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      error: 'Failed to fetch featured products',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;