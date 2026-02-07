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

// Multer configuration for category image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Get upload path from environment or use default
    const uploadPathEnv = process.env.UPLOAD_PATH || 'uploads';
    
    // Normalize the path to remove any leading ./ or trailing slashes
    const normalizedUploadPath = uploadPathEnv.replace(/^\.\//, '').replace(/\/$/, '');
    
    // Construct the full upload directory path
    const uploadDir = path.join(__dirname, '..', normalizedUploadPath, 'categories');
    
    // Diagnostic logging
    console.log('[CATEGORY IMAGE UPLOAD] Path construction:', {
      __dirname,
      uploadPathEnv,
      normalizedUploadPath,
      constructedPath: uploadDir,
      pathExists: fs.existsSync(uploadDir),
      cwd: process.cwd()
    });
    
    // Create directory if it doesn't exist with error handling
    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log('[CATEGORY IMAGE UPLOAD] Directory created successfully:', uploadDir);
      } catch (mkdirError) {
        console.error('[CATEGORY IMAGE UPLOAD] Directory creation failed:', {
          path: uploadDir,
          error: mkdirError.message,
          stack: mkdirError.stack,
          code: mkdirError.code,
          errno: mkdirError.errno
        });
        return cb(mkdirError);
      }
    } else {
      console.log('[CATEGORY IMAGE UPLOAD] Directory already exists:', uploadDir);
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'category-' + uniqueSuffix + ext);
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
      const error = new multer.MulterError('INVALID_FILE_TYPE');
      error.message = 'Only image files are allowed!';
      error.fieldName = file.fieldname;
      cb(error);
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

// Helper function to build category tree
const buildCategoryTree = (categories, parentId = null) => {
  const tree = categories
    .filter(category => category.parentId === parentId)
    .map(category => ({
      ...category,
      children: buildCategoryTree(categories, category.id)
    }));
  
  return tree.sort((a, b) => a.displayOrder - b.displayOrder);
};

// Helper function to get category path
const getCategoryPath = async (categoryId) => {
  const path = [];
  let current = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, name: true, slug: true, parentId: true }
  });

  while (current) {
    path.unshift(current);
    if (!current.parentId) break;
    current = await prisma.category.findUnique({
      where: { id: current.parentId },
      select: { id: true, name: true, slug: true, parentId: true }
    });
  }

  return path;
};

// ============================================
// CATEGORY HIERARCHY MANAGEMENT ENDPOINTS
// ============================================

// GET /api/v1/categories/tree - Get category tree structure
router.get('/tree', async (req, res) => {
  try {
    const { status } = req.query;

    const where = status ? { status } : {};

    const categories = await prisma.category.findMany({
      where,
      include: {
        _count: {
          select: { productCategories: true }
        }
      },
      orderBy: { displayOrder: 'asc' }
    });

    const categoryTree = buildCategoryTree(categories);

    res.json({
      tree: categoryTree,
      total: categories.length
    });

  } catch (error) {
    console.error('Get category tree error:', error);
    res.status(500).json({
      error: 'Failed to fetch category tree',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/categories/slug/:slug - Get category by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        parent: {
          select: { id: true, name: true, slug: true }
        },
        children: {
          include: {
            _count: {
              select: { productCategories: true }
            }
          },
          orderBy: { displayOrder: 'asc' }
        },
        _count: {
          select: { productCategories: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        error: 'Category not found'
      });
    }

    // Get category path
    const path = await getCategoryPath(category.id);

    res.json({
      category,
      path
    });

  } catch (error) {
    console.error('Get category by slug error:', error);
    res.status(500).json({
      error: 'Failed to fetch category',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// CATEGORY CRUD ENDPOINTS
// ============================================

// GET /api/v1/categories - List all categories with hierarchy
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 1000 }),
  query('status').optional().isIn(['active', 'inactive']),
  query('parentId').optional().isUUID(),
  query('tree').optional().isBoolean(),
  query('includeProducts').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      parentId,
      tree = false,
      includeProducts = false
    } = req.query;

    const where = {};
    if (status) where.status = status;
    if (parentId) where.parentId = parentId;

    if (tree === 'true') {
      // Return tree structure
      const categories = await prisma.category.findMany({
        where,
        include: {
          children: true,
          _count: includeProducts ? {
            select: { products: true }
          } : undefined
        },
        orderBy: { displayOrder: 'asc' }
      });

      const categoryTree = buildCategoryTree(categories);

      return res.json({
        categories: categoryTree,
        total: categories.length
      });
    }

    // Paginated list
    const skip = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          parent: {
            select: { id: true, name: true, slug: true }
          },
          children: {
            select: { id: true, name: true, slug: true },
            orderBy: { displayOrder: 'asc' }
          },
          _count: includeProducts ? {
            select: { productCategories: true }
          } : undefined
        },
        orderBy: { displayOrder: 'asc' }
      }),
      prisma.category.count({ where })
    ]);

    res.json({
      categories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: 'Failed to fetch categories',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/categories/stats - Get category statistics (MUST be before /:id to avoid route conflict)
router.get('/stats', async (req, res) => {
  try {
    const [total, active, inactive] = await Promise.all([
      prisma.category.count(),
      prisma.category.count({ where: { status: 'active' } }),
      prisma.category.count({ where: { status: 'inactive' } })
    ]);

    res.json({
      total,
      active,
      inactive
    });
  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch category statistics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/categories/:id - Get category by ID with details
router.get('/:id', [
  param('id').isUUID()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, name: true, slug: true }
        },
        children: {
          include: {
            _count: {
              select: { productCategories: true }
            }
          },
          orderBy: { displayOrder: 'asc' }
        },
        _count: {
          select: { productCategories: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        error: 'Category not found'
      });
    }

    // Get category path
    const path = await getCategoryPath(id);

    res.json({
      category,
      path
    });

  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      error: 'Failed to fetch category',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/categories/stats - Get category statistics
router.get('/stats', async (req, res) => {
  try {
    const [total, active, inactive] = await Promise.all([
      prisma.category.count(),
      prisma.category.count({ where: { status: 'active' } }),
      prisma.category.count({ where: { status: 'inactive' } })
    ]);

    res.json({
      total,
      active,
      inactive
    });
  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch category statistics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/v1/categories - Create category (admin only)
router.post('/', [
  body('name').notEmpty().trim(),
  body('slug').isSlug(),
  body('nameEn').optional().isString().trim(),
  body('nameBn').optional().isString().trim(),
  body('description').optional().isString(),
  body('parentId').optional({ checkFalsy: true }).isUUID(),
  body('displayOrder').optional().isInt({ min: 0 }),
  body('sortOrder').optional().isInt({ min: 0 }),
  body('status').optional().isIn(['active', 'inactive']),
  body('metaTitle').optional().isString().trim(),
  body('metaDescription').optional().isString(),
  body('metaKeywords').optional().isString()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const categoryData = req.body;

    // Check if slug already exists
    const existingSlug = await prisma.category.findUnique({
      where: { slug: categoryData.slug }
    });

    if (existingSlug) {
      return res.status(409).json({
        error: 'Category with this slug already exists'
      });
    }

    // If parentId is provided, check if parent exists
    if (categoryData.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: categoryData.parentId }
      });

      if (!parent) {
        return res.status(404).json({
          error: 'Parent category not found'
        });
      }
    }

    const category = await prisma.category.create({
      data: {
        name: categoryData.name,
        slug: categoryData.slug,
        nameEn: categoryData.nameEn || null,
        nameBn: categoryData.nameBn || null,
        description: categoryData.description || null,
        parentId: categoryData.parentId || null,
        displayOrder: categoryData.displayOrder || 0,
        sortOrder: categoryData.sortOrder || 0,
        status: categoryData.status || 'active',
        metaTitle: categoryData.metaTitle || null,
        metaDescription: categoryData.metaDescription || null,
        metaKeywords: categoryData.metaKeywords || null
      },
      include: {
        parent: true,
        children: true
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

// PUT /api/v1/categories/:id - Update category (admin only)
router.put('/:id', [
  param('id').isUUID(),
  body('name').optional().notEmpty().trim(),
  body('slug').optional().isSlug(),
  body('nameEn').optional().isString().trim(),
  body('nameBn').optional().isString().trim(),
  body('description').optional().isString(),
  body('parentId').optional({ checkFalsy: true }).isUUID(),
  body('displayOrder').optional().isInt({ min: 0 }),
  body('sortOrder').optional().isInt({ min: 0 }),
  body('status').optional().isIn(['active', 'inactive']),
  body('metaTitle').optional().isString().trim(),
  body('metaDescription').optional().isString(),
  body('metaKeywords').optional().isString()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  const { id } = req.params;
  try {
    // Filter to only include valid Category model fields
    const updateData = {};
    const validFields = ['name', 'slug', 'nameEn', 'nameBn', 'description', 
                        'parentId', 'displayOrder', 'sortOrder', 'status', 
                        'metaTitle', 'metaDescription', 'metaKeywords'];

    for (const field of validFields) {
      if (req.body[field] !== undefined) {
        // Convert empty strings to null for foreign key fields
        if (field === 'parentId' && req.body[field] === '') {
          updateData[field] = null;
        } else {
          updateData[field] = req.body[field];
        }
      }
    }

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

    // Prevent setting category as its own parent
    if (updateData.parentId === id) {
      return res.status(400).json({
        error: 'Cannot set category as its own parent'
      });
    }

    // If parentId is provided, check if parent exists
    if (updateData.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: updateData.parentId }
      });

      if (!parent) {
        return res.status(404).json({
          error: 'Parent category not found'
        });
      }

      // Check if this would create a circular reference
      const isDescendant = await checkCircularReference(id, updateData.parentId);
      if (isDescendant) {
        return res.status(400).json({
          error: 'Cannot move category to its own descendant'
        });
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        parent: true,
        children: true
      }
    });

    // Reindex all products in this category (non-blocking)
    if (elasticsearchConfig.isAvailable()) {
      // Get all products in this category
      const productCategories = await prisma.productCategory.findMany({
        where: { categoryId: id },
        select: { productId: true }
      });

      const productIds = productCategories.map(pc => pc.productId);
      
      if (productIds.length > 0) {
        productIndexingService.indexProducts(productIds)
          .catch(error => {
            console.error('Failed to reindex category products in Elasticsearch:', error);
          });
      }
    }

    res.json({
      message: 'Category updated successfully',
      category: updatedCategory
    });

  } catch (error) {
    console.error('Update category error:', {
      categoryId: id,
      requestBody: req.body,
      errorName: error.name,
      errorMessage: error.message,
      errorCode: error.code
    });
    res.status(500).json({
      error: 'Failed to update category',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper function to check circular reference
const checkCircularReference = async (categoryId, newParentId) => {
  let current = await prisma.category.findUnique({
    where: { id: newParentId },
    select: { id: true, parentId: true }
  });

  while (current && current.parentId) {
    if (current.parentId === categoryId) {
      return true;
    }
    current = await prisma.category.findUnique({
      where: { id: current.parentId },
      select: { id: true, parentId: true }
    });
  }

  return false;
};

// DELETE /api/v1/categories/:id - Delete category (admin only)
router.delete('/:id', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            productCategories: true,
            children: true
          }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        error: 'Category not found'
      });
    }

    // Check if category has products
    if (category._count.products > 0) {
      return res.status(400).json({
        error: 'Cannot delete category with products',
        suggestion: 'Move products to another category first'
      });
    }

    // Check if category has subcategories
    if (category._count.children > 0) {
      return res.status(400).json({
        error: 'Cannot delete category with subcategories',
        suggestion: 'Delete or move subcategories first'
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

// POST /api/v1/categories/:id/subcategories - Create subcategory
router.post('/:id/subcategories', [
  param('id').isUUID(),
  body('name').notEmpty().trim(),
  body('slug').isSlug(),
  body('nameEn').optional().isString().trim(),
  body('nameBn').optional().isString().trim(),
  body('description').optional().isString(),
  body('displayOrder').optional().isInt({ min: 0 }),
  body('sortOrder').optional().isInt({ min: 0 }),
  body('status').optional().isIn(['active', 'inactive']),
  body('metaTitle').optional().isString().trim(),
  body('metaDescription').optional().isString(),
  body('metaKeywords').optional().isString()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const subcategoryData = req.body;

    // Check if parent category exists
    const parent = await prisma.category.findUnique({
      where: { id }
    });

    if (!parent) {
      return res.status(404).json({
        error: 'Parent category not found'
      });
    }

    // Check if slug already exists
    const existingSlug = await prisma.category.findUnique({
      where: { slug: subcategoryData.slug }
    });

    if (existingSlug) {
      return res.status(409).json({
        error: 'Category with this slug already exists'
      });
    }

    const subcategory = await prisma.category.create({
      data: {
        name: subcategoryData.name,
        slug: subcategoryData.slug,
        nameEn: subcategoryData.nameEn || null,
        nameBn: subcategoryData.nameBn || null,
        description: subcategoryData.description || null,
        parentId: id,
        displayOrder: subcategoryData.displayOrder || 0,
        sortOrder: subcategoryData.sortOrder || 0,
        status: subcategoryData.status || 'active',
        metaTitle: subcategoryData.metaTitle || null,
        metaDescription: subcategoryData.metaDescription || null,
        metaKeywords: subcategoryData.metaKeywords || null
      },
      include: {
        parent: true
      }
    });

    res.status(201).json({
      message: 'Subcategory created successfully',
      subcategory
    });

  } catch (error) {
    console.error('Create subcategory error:', error);
    res.status(500).json({
      error: 'Failed to create subcategory',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /api/v1/categories/:id/move - Move category to new parent
router.put('/:id/move', [
  param('id').isUUID(),
  body('parentId').optional({ checkFalsy: true }).isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const { parentId } = req.body;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      return res.status(404).json({
        error: 'Category not found'
      });
    }

    // Prevent setting category as its own parent
    if (parentId === id) {
      return res.status(400).json({
        error: 'Cannot set category as its own parent'
      });
    }

    // If parentId is provided, check if parent exists
    if (parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: parentId }
      });

      if (!parent) {
        return res.status(404).json({
          error: 'Parent category not found'
        });
      }

      // Check if this would create a circular reference
      const isDescendant = await checkCircularReference(id, parentId);
      if (isDescendant) {
        return res.status(400).json({
          error: 'Cannot move category to its own descendant'
        });
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { parentId: parentId || null },
      include: {
        parent: true,
        children: true
      }
    });

    res.json({
      message: 'Category moved successfully',
      category: updatedCategory
    });

  } catch (error) {
    console.error('Move category error:', error);
    res.status(500).json({
      error: 'Failed to move category',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// CATEGORY REORDERING ENDPOINTS
// ============================================

// PATCH /api/v1/categories/:id/reorder - Update display order
router.patch('/:id/reorder', [
  param('id').isUUID(),
  body('displayOrder').isInt({ min: 0 })
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const { displayOrder } = req.body;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      return res.status(404).json({
        error: 'Category not found'
      });
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { displayOrder: parseInt(displayOrder) }
    });

    res.json({
      message: 'Category reordered successfully',
      category: updatedCategory
    });

  } catch (error) {
    console.error('Reorder category error:', error);
    res.status(500).json({
      error: 'Failed to reorder category',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PATCH /api/v1/categories/reorder-batch - Batch reorder categories
router.patch('/reorder-batch', [
  body('orders').isArray({ min: 1 }),
  body('orders.*.id').isUUID(),
  body('orders.*.displayOrder').isInt({ min: 0 })
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { orders } = req.body;

    // Update all categories in a transaction
    const updates = await prisma.$transaction(
      orders.map(order =>
        prisma.category.update({
          where: { id: order.id },
          data: { displayOrder: order.displayOrder }
        })
      )
    );

    res.json({
      message: 'Categories reordered successfully',
      categories: updates
    });

  } catch (error) {
    console.error('Batch reorder categories error:', error);
    res.status(500).json({
      error: 'Failed to reorder categories',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// CATEGORY PRODUCT LISTING ENDPOINT
// ============================================

// GET /api/v1/categories/:id/products - Get products in category
router.get('/:id/products', [
  param('id').isUUID(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('sortBy').optional().isIn(['price', 'name', 'createdAt', 'rating']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 20,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { productCategories: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        error: 'Category not found'
      });
    }

    const skip = (page - 1) * limit;
    
    // Build where clause using ProductCategory junction table
    const where = {
      categories: {
        some: {
          categoryId: id
        }
      },
      status: 'active'
    };
    
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
          categories: {
            select: {
              category: {
                select: { id: true, name: true, slug: true }
              }
            },
            orderBy: {
              isPrimary: 'desc'
            },
            take: 1
          },
          brand: {
            select: { id: true, name: true, slug: true }
          },
          images: {
            where: { displayOrder: 0 },
            take: 1,
            select: { id: true, originalUrl: true, altTextEn: true }
          },
          _count: {
            select: { reviews: true }
          }
        },
        orderBy: { [sortBy]: sortOrder }
      }),
      prisma.product.count({ where })
    ]);

    // Serialize Decimal values to numbers
    const serializedProducts = products.map(serializeProduct);

    res.json({
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        imageUrl: category.imageUrl
      },
      products: serializedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get category products error:', error);
    res.status(500).json({
      error: 'Failed to fetch category products',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// CATEGORY IMAGE/ICON UPLOAD ENDPOINTS
// ============================================

// POST /api/v1/categories/:id/image - Upload category image
router.post('/:id/image', upload.single('image'), [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    // Add diagnostic logging
    console.log('[CATEGORY IMAGE UPLOAD] Request received:', {
      categoryId: req.params.id,
      hasFile: !!req.file,
      fileName: req.file?.filename,
      fileSize: req.file?.size
    });

    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        error: 'No image file provided'
      });
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      return res.status(404).json({
        error: 'Category not found'
      });
    }

    // Delete old image if exists
    if (category.imageUrl) {
      const oldFilePath = path.join(__dirname, '..', category.imageUrl);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    const imageUrl = `/uploads/categories/${req.file.filename}`;
    
    // Verify file was actually saved to disk
    const actualFilePath = path.join(__dirname, '..', imageUrl);
    const fileExists = fs.existsSync(actualFilePath);
    const fileStats = fileExists ? fs.statSync(actualFilePath) : null;
    
    console.log('[CATEGORY IMAGE UPLOAD] File save verification:', {
      imageUrl,
      actualFilePath,
      fileExists,
      fileStats: fileStats ? {
        size: fileStats.size,
        isFile: fileStats.isFile()
      } : null,
      uploadDirContents: fs.existsSync(path.join(__dirname, '..', 'uploads', 'categories')) 
        ? fs.readdirSync(path.join(__dirname, '..', 'uploads', 'categories'))
        : 'Directory does not exist'
    });

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { imageUrl }
    });

    res.json({
      message: 'Category image uploaded successfully',
      category: updatedCategory
    });

  } catch (error) {
    console.error('Upload category image error:', error);
    res.status(500).json({
      error: 'Failed to upload category image',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/v1/categories/:id/icon - Upload category icon
router.post('/:id/icon', upload.single('icon'), [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    // Add diagnostic logging
    console.log('[CATEGORY ICON UPLOAD] Request received:', {
      categoryId: req.params.id,
      hasFile: !!req.file,
      fileName: req.file?.filename,
      fileSize: req.file?.size
    });

    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        error: 'No icon file provided'
      });
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      return res.status(404).json({
        error: 'Category not found'
      });
    }

    // Delete old icon if exists
    if (category.iconUrl) {
      const oldFilePath = path.join(__dirname, '..', category.iconUrl);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    const iconUrl = `/uploads/categories/${req.file.filename}`;
    
    // Verify file was actually saved to disk
    const actualFilePath = path.join(__dirname, '..', iconUrl);
    const fileExists = fs.existsSync(actualFilePath);
    const fileStats = fileExists ? fs.statSync(actualFilePath) : null;
    
    console.log('[CATEGORY ICON UPLOAD] File save verification:', {
      iconUrl,
      actualFilePath,
      fileExists,
      fileStats: fileStats ? {
        size: fileStats.size,
        isFile: fileStats.isFile()
      } : null,
      uploadDirContents: fs.existsSync(path.join(__dirname, '..', 'uploads', 'categories')) 
        ? fs.readdirSync(path.join(__dirname, '..', 'uploads', 'categories'))
        : 'Directory does not exist'
    });

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { iconUrl }
    });

    res.json({
      message: 'Category icon uploaded successfully',
      category: updatedCategory
    });

  } catch (error) {
    console.error('Upload category icon error:', error);
    res.status(500).json({
      error: 'Failed to upload category icon',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/v1/categories/:id/image - Delete category image
router.delete('/:id/image', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      return res.status(404).json({
        error: 'Category not found'
      });
    }

    if (!category.imageUrl) {
      return res.status(404).json({
        error: 'Category has no image'
      });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', category.imageUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { imageUrl: null }
    });

    res.json({
      message: 'Category image deleted successfully',
      category: updatedCategory
    });

  } catch (error) {
    console.error('Delete category image error:', error);
    res.status(500).json({
      error: 'Failed to delete category image',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/v1/categories/:id/icon - Delete category icon
router.delete('/:id/icon', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      return res.status(404).json({
        error: 'Category not found'
      });
    }

    if (!category.iconUrl) {
      return res.status(404).json({
        error: 'Category has no icon'
      });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', category.iconUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { iconUrl: null }
    });

    res.json({
      message: 'Category icon deleted successfully',
      category: updatedCategory
    });

  } catch (error) {
    console.error('Delete category icon error:', error);
    res.status(500).json({
      error: 'Failed to delete category icon',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// BULK CATEGORY OPERATIONS ENDPOINTS
// ============================================

// POST /api/v1/categories/bulk - Batch create categories (admin only)
router.post('/bulk', [
  body('categories').isArray({ min: 1, max: 100 }).withMessage('Categories array must contain 1-100 items'),
  body('categories.*.name').notEmpty().trim(),
  body('categories.*.slug').isSlug(),
  body('categories.*.parentId').optional({ checkFalsy: true }).isUUID(),
  body('categories.*.status').optional().isIn(['active', 'inactive'])
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { categories } = req.body;

    // Validate all categories before creation
    const slugs = categories.map(c => c.slug);
    const parentIds = categories.filter(c => c.parentId).map(c => c.parentId);

    // Check for duplicate slugs in batch
    const duplicateSlugs = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
    if (duplicateSlugs.length > 0) {
      return res.status(400).json({
        error: 'Duplicate slugs in batch',
        duplicates: duplicateSlugs
      });
    }

    // Check if slugs already exist in database
    const existingSlugs = await prisma.category.findMany({
      where: { slug: { in: slugs } },
      select: { slug: true }
    });

    if (existingSlugs.length > 0) {
      return res.status(409).json({
        error: 'Some slugs already exist',
        existingSlugs: existingSlugs.map(s => s.slug)
      });
    }

    // Check if all parent categories exist
    if (parentIds.length > 0) {
      const existingParents = await prisma.category.findMany({
        where: { id: { in: parentIds } },
        select: { id: true }
      });

      if (existingParents.length !== parentIds.length) {
        const missingParents = parentIds.filter(id => !existingParents.find(p => p.id === id));
        return res.status(404).json({
          error: 'Some parent categories not found',
          missingParents
        });
      }
    }

    // Create categories in a transaction
    const createdCategories = await prisma.$transaction(async (tx) => {
      const results = [];
      let displayOrder = 0;

      for (const categoryData of categories) {
        const category = await tx.category.create({
          data: {
            name: categoryData.name,
            slug: categoryData.slug,
            nameEn: categoryData.nameEn || null,
            nameBn: categoryData.nameBn || null,
            description: categoryData.description || null,
            parentId: categoryData.parentId || null,
            displayOrder: categoryData.displayOrder !== undefined ? categoryData.displayOrder : displayOrder,
            sortOrder: categoryData.sortOrder || 0,
            status: categoryData.status || 'active',
            metaTitle: categoryData.metaTitle || null,
            metaDescription: categoryData.metaDescription || null,
            metaKeywords: categoryData.metaKeywords || null
          },
          include: {
            parent: true,
            children: true
          }
        });
        results.push(category);
        displayOrder++;
      }
      return results;
    });

    res.status(201).json({
      success: true,
      created: createdCategories.length,
      failed: 0,
      results: createdCategories.map(category => ({
        category,
        status: 'created'
      }))
    });

  } catch (error) {
    console.error('Bulk create categories error:', error);
    res.status(500).json({
      error: 'Failed to create categories in bulk',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /api/v1/categories/bulk - Batch update categories (admin only)
router.put('/bulk', [
  body('categories').isArray({ min: 1, max: 100 }).withMessage('Categories array must contain 1-100 items'),
  body('categories.*.id').isUUID(),
  body('categories.*.name').optional().notEmpty().trim(),
  body('categories.*.slug').optional().isSlug(),
  body('categories.*.parentId').optional({ checkFalsy: true }).isUUID(),
  body('categories.*.status').optional().isIn(['active', 'inactive'])
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { categories } = req.body;

    const categoryIds = categories.map(c => c.id);

    // Check if all categories exist
    const existingCategories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, slug: true, parentId: true }
    });

    if (existingCategories.length !== categoryIds.length) {
      const missingIds = categoryIds.filter(id => !existingCategories.find(c => c.id === id));
      return res.status(404).json({
        error: 'Some categories not found',
        missingIds
      });
    }

    // Check for slug conflicts
    const slugsToUpdate = categories.filter(c => c.slug).map(c => ({ slug: c.slug, id: c.id }));
    if (slugsToUpdate.length > 0) {
      const slugConflicts = await prisma.category.findMany({
        where: {
          slug: { in: slugsToUpdate.map(s => s.slug) },
          NOT: { id: { in: categoryIds } }
        },
        select: { slug: true }
      });

      if (slugConflicts.length > 0) {
        return res.status(409).json({
          error: 'Some slugs conflict with existing categories',
          conflicts: slugConflicts.map(s => s.slug)
        });
      }
    }

    // Validate parent relationships
    const parentIdsToUpdate = categories.filter(c => c.parentId).map(c => ({ parentId: c.parentId, id: c.id }));
    for (const { parentId, id } of parentIdsToUpdate) {
      // Prevent setting category as its own parent
      if (parentId === id) {
        return res.status(400).json({
          error: 'Cannot set category as its own parent',
          categoryId: id
        });
      }

      // Check if parent exists
      const parent = await prisma.category.findUnique({
        where: { id: parentId }
      });

      if (!parent) {
        return res.status(404).json({
          error: 'Parent category not found',
          parentId
        });
      }

      // Check if this would create a circular reference
      const isDescendant = await checkCircularReference(id, parentId);
      if (isDescendant) {
        return res.status(400).json({
          error: 'Cannot move category to its own descendant',
          categoryId: id,
          parentId
        });
      }
    }

    // Update categories in a transaction
    const updatedCategories = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const categoryData of categories) {
        const updateData = { ...categoryData };
        delete updateData.id;

        const category = await tx.category.update({
          where: { id: categoryData.id },
          data: updateData,
          include: {
            parent: true,
            children: true
          }
        });
        results.push(category);
      }
      return results;
    });

    // Reindex all products in updated categories (non-blocking)
    if (elasticsearchConfig.isAvailable()) {
      const productCategories = await prisma.productCategory.findMany({
        where: { categoryId: { in: categoryIds } },
        select: { productId: true }
      });

      const productIds = [...new Set(productCategories.map(pc => pc.productId))];

      if (productIds.length > 0) {
        productIndexingService.indexProducts(productIds)
          .catch(error => {
            console.error('Failed to reindex category products in Elasticsearch:', error);
          });
      }
    }

    res.json({
      success: true,
      updated: updatedCategories.length,
      failed: 0,
      results: updatedCategories.map(category => ({
        category,
        status: 'updated'
      }))
    });

  } catch (error) {
    console.error('Bulk update categories error:', error);
    res.status(500).json({
      error: 'Failed to update categories in bulk',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/v1/categories/bulk - Batch delete categories (admin only)
router.delete('/bulk', [
  body('categoryIds').isArray({ min: 1, max: 100 }).withMessage('Category IDs array must contain 1-100 items'),
  body('categoryIds.*').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { categoryIds } = req.body;

    // Check if all categories exist
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      include: {
        _count: {
          select: {
            productCategories: true,
            children: true
          }
        }
      }
    });

    if (categories.length !== categoryIds.length) {
      const missingIds = categoryIds.filter(id => !categories.find(c => c.id === id));
      return res.status(404).json({
        error: 'Some categories not found',
        missingIds
      });
    }

    // Check if any category has products
    const categoriesWithProducts = categories.filter(c => c._count.productCategories > 0);
    if (categoriesWithProducts.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete categories with products',
        categoriesWithProducts: categoriesWithProducts.map(c => c.id)
      });
    }

    // Check if any category has subcategories
    const categoriesWithChildren = categories.filter(c => c._count.children > 0);
    if (categoriesWithChildren.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete categories with subcategories',
        categoriesWithChildren: categoriesWithChildren.map(c => c.id)
      });
    }

    // Delete categories in a transaction
    const deletedCategoryIds = await prisma.$transaction(async (tx) => {
      await tx.category.deleteMany({
        where: { id: { in: categoryIds } }
      });
      return categoryIds;
    });

    res.json({
      success: true,
      deleted: deletedCategoryIds.length,
      failed: 0,
      results: deletedCategoryIds.map(categoryId => ({
        categoryId,
        status: 'deleted'
      }))
    });

  } catch (error) {
    console.error('Bulk delete categories error:', error);
    res.status(500).json({
      error: 'Failed to delete categories in bulk',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// CATEGORY SEO MANAGEMENT ENDPOINT
// ============================================

// PATCH /api/v1/categories/:id/seo - Update SEO fields
router.patch('/:id/seo', [
  param('id').isUUID(),
  body('metaTitle').optional().isString().trim(),
  body('metaDescription').optional().isString(),
  body('metaKeywords').optional().isString()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const { metaTitle, metaDescription, metaKeywords } = req.body;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      return res.status(404).json({
        error: 'Category not found'
      });
    }

    const updateData = {};
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    if (metaKeywords !== undefined) updateData.metaKeywords = metaKeywords;

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: updateData
    });

    res.json({
      message: 'SEO fields updated successfully',
      category: updatedCategory
    });

  } catch (error) {
    console.error('Update category SEO error:', error);
    res.status(500).json({
      error: 'Failed to update SEO fields',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
