const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { elasticsearchConfig } = require('../config/elasticsearch');
const { ProductIndexingService } = require('../services/elasticsearch/productIndexingService');

const router = express.Router();
const prisma = new PrismaClient();
const productIndexingService = new ProductIndexingService();

// Helper function to convert Decimal values to numbers
const serializeProduct = (product) => {
  return {
    ...product,
    regularPrice: parseFloat(product.regularPrice),
    salePrice: product.salePrice ? parseFloat(product.salePrice) : null,
    costPrice: parseFloat(product.costPrice)
  };
};

// Multer configuration for brand logo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/brands');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'brand-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'image/svg+xml';

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

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
// BRAND CRUD ENDPOINTS
// ============================================

// GET /api/v1/brands - List all brands
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 1000 }),
  query('status').optional().isIn(['active', 'inactive']),
  query('isFeatured').optional().isBoolean(),
  query('search').optional().isString().trim(),
  query('includeProducts').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      isFeatured,
      search,
      includeProducts = false
    } = req.query;

    const where = {};
    if (status) where.status = status;
    if (isFeatured !== undefined) where.isFeatured = isFeatured === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { nameBn: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [brands, total] = await Promise.all([
      prisma.brand.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          _count: includeProducts ? {
            select: { products: true }
          } : undefined
        },
        orderBy: [
          { featuredOrder: 'asc' },
          { name: 'asc' }
        ]
      }),
      prisma.brand.count({ where })
    ]);

    res.json({
      brands,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({
      error: 'Failed to fetch brands',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/brands/featured - Get featured brands
router.get('/featured', async (req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      where: {
        status: 'active',
        isFeatured: true
      },
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { featuredOrder: 'asc' }
    });

    res.json({
      brands,
      total: brands.length
    });

  } catch (error) {
    console.error('Get featured brands error:', error);
    res.status(500).json({
      error: 'Failed to fetch featured brands',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/brands/slug/:slug - Get brand by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const brand = await prisma.brand.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { products: true }
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
    console.error('Get brand by slug error:', error);
    res.status(500).json({
      error: 'Failed to fetch brand',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/brands/:id - Get brand by ID
router.get('/:id', [
  param('id').isUUID()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true }
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

// POST /api/v1/brands - Create brand (admin only)
router.post('/', [
  body('name').notEmpty().trim().withMessage('Brand name is required'),
  body('slug').matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('Slug must contain only lowercase letters, numbers, and hyphens. Cannot start or end with hyphen or have consecutive hyphens.'),
  body('nameEn').optional().isString().trim(),
  body('nameBn').optional().isString().trim(),
  body('description').optional().isString(),
  body('websiteUrl').optional().isURL(),
  body('contactEmail').optional().isEmail(),
  body('contactPhone').optional().isString().trim(),
  body('address').optional().isString(),
  body('status').optional().isIn(['active', 'inactive']),
  body('isFeatured').optional().isBoolean(),
  body('featuredOrder').optional().isInt({ min: 0 }),
  body('metaTitle').optional().isString().trim(),
  body('metaDescription').optional().isString(),
  body('metaKeywords').optional().isString()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const brandData = req.body;

    // Check if slug already exists
    const existingSlug = await prisma.brand.findUnique({
      where: { slug: brandData.slug }
    });

    if (existingSlug) {
      return res.status(409).json({
        error: 'Brand with this slug already exists'
      });
    }

    const brand = await prisma.brand.create({
      data: {
        name: brandData.name,
        slug: brandData.slug,
        nameEn: brandData.nameEn || null,
        nameBn: brandData.nameBn || null,
        description: brandData.description || null,
        websiteUrl: brandData.websiteUrl || null,
        contactEmail: brandData.contactEmail || null,
        contactPhone: brandData.contactPhone || null,
        address: brandData.address || null,
        status: brandData.status || 'active',
        isFeatured: brandData.isFeatured || false,
        featuredOrder: brandData.featuredOrder || 0,
        metaTitle: brandData.metaTitle || null,
        metaDescription: brandData.metaDescription || null,
        metaKeywords: brandData.metaKeywords || null
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

// PUT /api/v1/brands/:id - Update brand (admin only)
router.put('/:id', [
  param('id').isUUID(),
  body('name').optional().notEmpty().trim(),
  body('slug').optional().matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('Slug must contain only lowercase letters, numbers, and hyphens. Cannot start or end with hyphen or have consecutive hyphens.'),
  body('nameEn').optional().isString().trim(),
  body('nameBn').optional().isString().trim(),
  body('description').optional().isString(),
  body('websiteUrl').optional().isURL(),
  body('contactEmail').optional().isEmail(),
  body('contactPhone').optional().isString().trim(),
  body('address').optional().isString(),
  body('status').optional().isIn(['active', 'inactive']),
  body('isFeatured').optional().isBoolean(),
  body('featuredOrder').optional().isInt({ min: 0 }),
  body('metaTitle').optional().isString().trim(),
  body('metaDescription').optional().isString(),
  body('metaKeywords').optional().isString()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
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

    // Reindex all products in this brand (non-blocking)
    if (elasticsearchConfig.isAvailable()) {
      const products = await prisma.product.findMany({
        where: { brandId: id },
        select: { id: true }
      });

      const productIds = products.map(p => p.id);
      
      if (productIds.length > 0) {
        productIndexingService.indexProducts(productIds)
          .catch(error => {
            console.error('Failed to reindex brand products in Elasticsearch:', error);
          });
      }
    }

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

// DELETE /api/v1/brands/:id - Delete brand (admin only)
router.delete('/:id', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if brand exists
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true }
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
        error: 'Cannot delete brand with products',
        suggestion: 'Reassign products to another brand first'
      });
    }

    // Delete logo file if exists
    if (brand.logoUrl) {
      const logoPath = path.join(__dirname, '..', brand.logoUrl);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
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

// ============================================
// BRAND STATUS MANAGEMENT ENDPOINT
// ============================================

// PATCH /api/v1/brands/:id/status - Update brand status
router.patch('/:id/status', [
  param('id').isUUID(),
  body('status').isIn(['active', 'inactive'])
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Check if brand exists
    const brand = await prisma.brand.findUnique({
      where: { id }
    });

    if (!brand) {
      return res.status(404).json({
        error: 'Brand not found'
      });
    }

    const updatedBrand = await prisma.brand.update({
      where: { id },
      data: { status }
    });

    res.json({
      message: 'Brand status updated successfully',
      brand: updatedBrand
    });

  } catch (error) {
    console.error('Update brand status error:', error);
    res.status(500).json({
      error: 'Failed to update brand status',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// FEATURED BRAND MANAGEMENT ENDPOINTS
// ============================================

// PATCH /api/v1/brands/:id/featured - Toggle featured status
router.patch('/:id/featured', [
  param('id').isUUID(),
  body('isFeatured').isBoolean(),
  body('featuredOrder').optional().isInt({ min: 0 })
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const { isFeatured, featuredOrder } = req.body;

    // Check if brand exists
    const brand = await prisma.brand.findUnique({
      where: { id }
    });

    if (!brand) {
      return res.status(404).json({
        error: 'Brand not found'
      });
    }

    const updateData = { isFeatured };
    if (featuredOrder !== undefined) {
      updateData.featuredOrder = featuredOrder;
    }

    const updatedBrand = await prisma.brand.update({
      where: { id },
      data: updateData
    });

    res.json({
      message: 'Brand featured status updated successfully',
      brand: updatedBrand
    });

  } catch (error) {
    console.error('Toggle brand featured error:', error);
    res.status(500).json({
      error: 'Failed to toggle brand featured status',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PATCH /api/v1/brands/featured-reorder - Reorder featured brands
router.patch('/featured-reorder', [
  body('orders').isArray({ min: 1 }),
  body('orders.*.id').isUUID(),
  body('orders.*.featuredOrder').isInt({ min: 0 })
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { orders } = req.body;

    // Update all brands in a transaction
    const updates = await prisma.$transaction(
      orders.map(order =>
        prisma.brand.update({
          where: { id: order.id },
          data: { featuredOrder: order.featuredOrder }
        })
      )
    );

    res.json({
      message: 'Featured brands reordered successfully',
      brands: updates
    });

  } catch (error) {
    console.error('Reorder featured brands error:', error);
    res.status(500).json({
      error: 'Failed to reorder featured brands',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// BRAND PRODUCT LISTING ENDPOINT
// ============================================

// GET /api/v1/brands/:id/products - Get products by brand
router.get('/:id/products', [
  param('id').isUUID(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['active', 'inactive', 'draft', 'published', 'archived', 'out_of_stock', 'discontinued']),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('sortBy').optional().isIn(['price', 'name', 'createdAt']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 20,
      status,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Check if brand exists
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    if (!brand) {
      return res.status(404).json({
        error: 'Brand not found'
      });
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const where = { brandId: id };
    if (status) where.status = status;

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
            reviews: true
          }
        },
        orderBy: { [sortBy]: sortOrder }
      }),
      prisma.product.count({ where })
    ]);

    // Serialize Decimal values to numbers
    products = products.map(serializeProduct);

    res.json({
      brand: {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logoUrl: brand.logoUrl
      },
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get brand products error:', error);
    res.status(500).json({
      error: 'Failed to fetch brand products',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// BRAND LOGO UPLOAD ENDPOINTS
// ============================================

// POST /api/v1/brands/:id/logo - Upload brand logo
router.post('/:id/logo', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), upload.single('logo'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        error: 'No logo file provided'
      });
    }

    // Check if brand exists
    const brand = await prisma.brand.findUnique({
      where: { id }
    });

    if (!brand) {
      return res.status(404).json({
        error: 'Brand not found'
      });
    }

    // Delete old logo if exists
    if (brand.logoUrl) {
      const oldLogoPath = path.join(__dirname, '..', brand.logoUrl);
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }

    const logoUrl = `${process.env.BACKEND_URL || 'http://localhost:3001'}/uploads/brands/${req.file.filename}`;

    const updatedBrand = await prisma.brand.update({
      where: { id },
      data: { logoUrl }
    });

    res.json({
      message: 'Brand logo uploaded successfully',
      brand: updatedBrand
    });

  } catch (error) {
    console.error('Upload brand logo error:', error);
    res.status(500).json({
      error: 'Failed to upload brand logo',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/v1/brands/:id/logo - Delete brand logo
router.delete('/:id/logo', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if brand exists
    const brand = await prisma.brand.findUnique({
      where: { id }
    });

    if (!brand) {
      return res.status(404).json({
        error: 'Brand not found'
      });
    }

    if (!brand.logoUrl) {
      return res.status(404).json({
        error: 'Brand has no logo'
      });
    }

    // Delete file from filesystem
    const logoPath = path.join(__dirname, '..', brand.logoUrl);
    if (fs.existsSync(logoPath)) {
      fs.unlinkSync(logoPath);
    }

    const updatedBrand = await prisma.brand.update({
      where: { id },
      data: { logoUrl: null }
    });

    res.json({
      message: 'Brand logo deleted successfully',
      brand: updatedBrand
    });

  } catch (error) {
    console.error('Delete brand logo error:', error);
    res.status(500).json({
      error: 'Failed to delete brand logo',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// BULK BRAND OPERATIONS ENDPOINTS
// ============================================

// POST /api/v1/brands/bulk - Batch create brands (admin only)
router.post('/bulk', [
  body('brands').isArray({ min: 1, max: 100 }).withMessage('Brands array must contain 1-100 items'),
  body('brands.*.name').notEmpty().trim(),
  body('brands.*.slug').matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
  body('brands.*.status').optional().isIn(['active', 'inactive'])
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { brands } = req.body;

    // Validate all brands before creation
    const slugs = brands.map(b => b.slug);

    // Check for duplicate slugs in batch
    const duplicateSlugs = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
    if (duplicateSlugs.length > 0) {
      return res.status(400).json({
        error: 'Duplicate slugs in batch',
        duplicates: duplicateSlugs
      });
    }

    // Check if slugs already exist in database
    const existingSlugs = await prisma.brand.findMany({
      where: { slug: { in: slugs } },
      select: { slug: true }
    });

    if (existingSlugs.length > 0) {
      return res.status(409).json({
        error: 'Some slugs already exist',
        existingSlugs: existingSlugs.map(s => s.slug)
      });
    }

    // Create brands in a transaction
    const createdBrands = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const brandData of brands) {
        const brand = await tx.brand.create({
          data: {
            name: brandData.name,
            slug: brandData.slug,
            nameEn: brandData.nameEn || null,
            nameBn: brandData.nameBn || null,
            description: brandData.description || null,
            websiteUrl: brandData.websiteUrl || null,
            contactEmail: brandData.contactEmail || null,
            contactPhone: brandData.contactPhone || null,
            address: brandData.address || null,
            status: brandData.status || 'active',
            isFeatured: brandData.isFeatured || false,
            featuredOrder: brandData.featuredOrder || 0,
            metaTitle: brandData.metaTitle || null,
            metaDescription: brandData.metaDescription || null,
            metaKeywords: brandData.metaKeywords || null
          }
        });
        results.push(brand);
      }
      return results;
    });

    res.status(201).json({
      success: true,
      created: createdBrands.length,
      failed: 0,
      results: createdBrands.map(brand => ({
        brand,
        status: 'created'
      }))
    });

  } catch (error) {
    console.error('Bulk create brands error:', error);
    res.status(500).json({
      error: 'Failed to create brands in bulk',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /api/v1/brands/bulk - Batch update brands (admin only)
router.put('/bulk', [
  body('brands').isArray({ min: 1, max: 100 }).withMessage('Brands array must contain 1-100 items'),
  body('brands.*.id').isUUID(),
  body('brands.*.name').optional().notEmpty().trim(),
  body('brands.*.slug').optional().matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
  body('brands.*.status').optional().isIn(['active', 'inactive'])
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { brands } = req.body;

    const brandIds = brands.map(b => b.id);

    // Check if all brands exist
    const existingBrands = await prisma.brand.findMany({
      where: { id: { in: brandIds } },
      select: { id: true, slug: true }
    });

    if (existingBrands.length !== brandIds.length) {
      const missingIds = brandIds.filter(id => !existingBrands.find(b => b.id === id));
      return res.status(404).json({
        error: 'Some brands not found',
        missingIds
      });
    }

    // Check for slug conflicts
    const slugsToUpdate = brands.filter(b => b.slug).map(b => ({ slug: b.slug, id: b.id }));
    if (slugsToUpdate.length > 0) {
      const slugConflicts = await prisma.brand.findMany({
        where: {
          slug: { in: slugsToUpdate.map(s => s.slug) },
          NOT: { id: { in: brandIds } }
        },
        select: { slug: true }
      });

      if (slugConflicts.length > 0) {
        return res.status(409).json({
          error: 'Some slugs conflict with existing brands',
          conflicts: slugConflicts.map(s => s.slug)
        });
      }
    }

    // Update brands in a transaction
    const updatedBrands = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const brandData of brands) {
        const updateData = { ...brandData };
        delete updateData.id;

        const brand = await tx.brand.update({
          where: { id: brandData.id },
          data: updateData
        });
        results.push(brand);
      }
      return results;
    });

    // Reindex all products in updated brands (non-blocking)
    if (elasticsearchConfig.isAvailable()) {
      const products = await prisma.product.findMany({
        where: { brandId: { in: brandIds } },
        select: { id: true }
      });

      const productIds = products.map(p => p.id);

      if (productIds.length > 0) {
        productIndexingService.indexProducts(productIds)
          .catch(error => {
            console.error('Failed to reindex brand products in Elasticsearch:', error);
          });
      }
    }

    res.json({
      success: true,
      updated: updatedBrands.length,
      failed: 0,
      results: updatedBrands.map(brand => ({
        brand,
        status: 'updated'
      }))
    });

  } catch (error) {
    console.error('Bulk update brands error:', error);
    res.status(500).json({
      error: 'Failed to update brands in bulk',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/v1/brands/bulk - Batch delete brands (admin only)
router.delete('/bulk', [
  body('brandIds').isArray({ min: 1, max: 100 }).withMessage('Brand IDs array must contain 1-100 items'),
  body('brandIds.*').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { brandIds } = req.body;

    // Check if all brands exist
    const brands = await prisma.brand.findMany({
      where: { id: { in: brandIds } },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    if (brands.length !== brandIds.length) {
      const missingIds = brandIds.filter(id => !brands.find(b => b.id === id));
      return res.status(404).json({
        error: 'Some brands not found',
        missingIds
      });
    }

    // Check if any brand has products
    const brandsWithProducts = brands.filter(b => b._count.products > 0);
    if (brandsWithProducts.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete brands with products',
        brandsWithProducts: brandsWithProducts.map(b => b.id)
      });
    }

    // Delete brands in a transaction
    const deletedBrandIds = await prisma.$transaction(async (tx) => {
      // Delete logo files
      for (const brand of brands) {
        if (brand.logoUrl) {
          const logoPath = path.join(__dirname, '..', brand.logoUrl);
          if (fs.existsSync(logoPath)) {
            fs.unlinkSync(logoPath);
          }
        }
      }

      await tx.brand.deleteMany({
        where: { id: { in: brandIds } }
      });

      return brandIds;
    });

    res.json({
      success: true,
      deleted: deletedBrandIds.length,
      failed: 0,
      results: deletedBrandIds.map(brandId => ({
        brandId,
        status: 'deleted'
      }))
    });

  } catch (error) {
    console.error('Bulk delete brands error:', error);
    res.status(500).json({
      error: 'Failed to delete brands in bulk',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// BRAND SEO MANAGEMENT ENDPOINT
// ============================================

// PATCH /api/v1/brands/:id/seo - Update SEO fields
router.patch('/:id/seo', [
  param('id').isUUID(),
  body('metaTitle').optional().isString().trim(),
  body('metaDescription').optional().isString(),
  body('metaKeywords').optional().isString()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const { metaTitle, metaDescription, metaKeywords } = req.body;

    // Check if brand exists
    const brand = await prisma.brand.findUnique({
      where: { id }
    });

    if (!brand) {
      return res.status(404).json({
        error: 'Brand not found'
      });
    }

    const updateData = {};
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    if (metaKeywords !== undefined) updateData.metaKeywords = metaKeywords;

    const updatedBrand = await prisma.brand.update({
      where: { id },
      data: updateData
    });

    res.json({
      message: 'SEO fields updated successfully',
      brand: updatedBrand
    });

  } catch (error) {
    console.error('Update brand SEO error:', error);
    res.status(500).json({
      error: 'Failed to update SEO fields',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
