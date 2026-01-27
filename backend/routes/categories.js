const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const prisma = new PrismaClient();

// Multer configuration for category image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/categories');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
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
router.get('/slug/:slug', [
  param('slug').isSlug()
], handleValidationErrors, async (req, res) => {
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
  query('limit').optional().isInt({ min: 1, max: 100 }),
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

// POST /api/v1/categories - Create category (admin only)
router.post('/', [
  body('name').notEmpty().trim(),
  body('slug').isSlug(),
  body('nameEn').optional().isString().trim(),
  body('nameBn').optional().isString().trim(),
  body('description').optional().isString(),
  body('parentId').optional().isUUID(),
  body('displayOrder').optional().isInt({ min: 0 }),
  body('sortOrder').optional().isInt({ min: 0 }),
  body('status').optional().isIn(['active', 'inactive']),
  body('metaTitle').optional().isString().trim(),
  body('metaDescription').optional().isString(),
  body('metaKeywords').optional().isString()
], handleValidationErrors, authMiddleware.adminOnly(), async (req, res) => {
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
  body('parentId').optional().isUUID(),
  body('displayOrder').optional().isInt({ min: 0 }),
  body('sortOrder').optional().isInt({ min: 0 }),
  body('status').optional().isIn(['active', 'inactive']),
  body('metaTitle').optional().isString().trim(),
  body('metaDescription').optional().isString(),
  body('metaKeywords').optional().isString()
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
], handleValidationErrors, authMiddleware.adminOnly(), async (req, res) => {
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
], handleValidationErrors, authMiddleware.adminOnly(), async (req, res) => {
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
  body('parentId').optional().isUUID()
], handleValidationErrors, authMiddleware.adminOnly(), async (req, res) => {
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
], handleValidationErrors, authMiddleware.adminOnly(), async (req, res) => {
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
], handleValidationErrors, authMiddleware.adminOnly(), async (req, res) => {
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
      productCategories: {
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

    res.json({
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        imageUrl: category.imageUrl
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
router.post('/:id/image', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.adminOnly(), upload.single('image'), async (req, res) => {
  try {
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
router.post('/:id/icon', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.adminOnly(), upload.single('icon'), async (req, res) => {
  try {
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
], handleValidationErrors, authMiddleware.adminOnly(), async (req, res) => {
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
], handleValidationErrors, authMiddleware.adminOnly(), async (req, res) => {
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
// CATEGORY SEO MANAGEMENT ENDPOINT
// ============================================

// PATCH /api/v1/categories/:id/seo - Update SEO fields
router.patch('/:id/seo', [
  param('id').isUUID(),
  body('metaTitle').optional().isString().trim(),
  body('metaDescription').optional().isString(),
  body('metaKeywords').optional().isString()
], handleValidationErrors, authMiddleware.adminOnly(), async (req, res) => {
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
