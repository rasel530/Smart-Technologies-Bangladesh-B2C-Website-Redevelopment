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

// Multer configuration for product image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/products');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + ext);
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
// PRODUCT CRUD ENDPOINTS
// ============================================

// GET /api/v1/products - List all products with filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 1000 }),
  query('status').optional().isIn(['active', 'inactive', 'draft', 'published', 'archived', 'out_of_stock', 'discontinued']),
  query('visibility').optional().isIn(['public', 'private', 'restricted']),
  query('categoryId').optional().isUUID(),
  query('brandId').optional().isUUID(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('search').optional().isString().trim(),
  query('isFeatured').optional().isBoolean(),
  query('isNewArrival').optional().isBoolean(),
  query('isBestSeller').optional().isBoolean(),
  query('sortBy').optional().isIn(['price', 'name', 'createdAt', 'rating', 'popularity']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], handleValidationErrors, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      visibility,
      categoryId,
      brandId,
      minPrice,
      maxPrice,
      search,
      isFeatured,
      isNewArrival,
      isBestSeller,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const where = {};

    if (status) where.status = status; else where.status = 'active';
    if (visibility) where.visibility = visibility;
    if (categoryId) {
      where.categories = {
        some: {
          categoryId: categoryId
        }
      };
    }
    if (brandId) where.brandId = brandId;
    if (isFeatured !== undefined) where.isFeatured = isFeatured === 'true';
    if (isNewArrival !== undefined) where.isNewArrival = isNewArrival === 'true';
    if (isBestSeller !== undefined) where.isBestSeller = isBestSeller === 'true';

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { nameBn: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.regularPrice = {};
      if (minPrice !== undefined) where.regularPrice.gte = parseFloat(minPrice);
      if (maxPrice !== undefined) where.regularPrice.lte = parseFloat(maxPrice);
    }

    const skip = (page - 1) * limit;

    let [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          categories: {
            include: {
              category: {
                select: { id: true, name: true, slug: true }
              }
            }
          },
          brand: {
            select: { id: true, name: true, slug: true }
          },
          images: {
            where: {
              processingStatus: {
                not: 'deleted'
              }
            },
            orderBy: { displayOrder: 'asc' }
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
    products = products.map(serializeProduct);

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

// GET /api/v1/products/featured - Get featured products
router.get('/featured', async (req, res) => {
  try {
    let products = await prisma.product.findMany({
      where: {
        status: 'active',
        visibility: 'public',
        isFeatured: true
      },
      include: {
        categories: {
          include: {
            category: {
              select: { id: true, name: true, slug: true }
            }
          }
        },
        brand: {
          select: { id: true, name: true, slug: true }
        },
        images: {
          where: {
            processingStatus: {
              not: 'deleted'
            }
          },
          orderBy: { displayOrder: 'asc' }
        },
        _count: {
          select: { reviews: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Serialize Decimal values to numbers
    products = products.map(serializeProduct);

    res.json({
      products,
      total: products.length
    });

  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      error: 'Failed to fetch featured products',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/products/new-arrivals - Get new arrivals
router.get('/new-arrivals', async (req, res) => {
  try {
    let products = await prisma.product.findMany({
      where: {
        status: 'active',
        visibility: 'public',
        isNewArrival: true
      },
      include: {
        categories: {
          include: {
            category: {
              select: { id: true, name: true, slug: true }
            }
          }
        },
        brand: {
          select: { id: true, name: true, slug: true }
        },
        images: {
          where: {
            processingStatus: {
              not: 'deleted'
            }
          },
          orderBy: { displayOrder: 'asc' }
        },
        _count: {
          select: { reviews: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Serialize Decimal values to numbers
    products = products.map(serializeProduct);

    res.json({
      products,
      total: products.length
    });

  } catch (error) {
    console.error('Get new arrivals error:', error);
    res.status(500).json({
      error: 'Failed to fetch new arrivals',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/products/best-sellers - Get best sellers
router.get('/best-sellers', async (req, res) => {
  try {
    let products = await prisma.product.findMany({
      where: {
        status: 'active',
        visibility: 'public',
        isBestSeller: true
      },
      include: {
        categories: {
          include: {
            category: {
              select: { id: true, name: true, slug: true }
            }
          }
        },
        brand: {
          select: { id: true, name: true, slug: true }
        },
        images: {
          where: {
            processingStatus: {
              not: 'deleted'
            }
          },
          orderBy: { displayOrder: 'asc' }
        },
        _count: {
          select: { reviews: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Serialize Decimal values to numbers
    products = products.map(serializeProduct);

    res.json({
      products,
      total: products.length
    });

  } catch (error) {
    console.error('Get best sellers error:', error);
    res.status(500).json({
      error: 'Failed to fetch best sellers',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/products/slug/:slug - Get product by slug
router.get('/slug/:slug', [
  param('slug').isSlug()
], handleValidationErrors, async (req, res) => {
  try {
    const { slug } = req.params;

    let product = await prisma.product.findUnique({
      where: { slug },
      include: {
        categories: {
          include: {
            category: {
              select: { id: true, name: true, slug: true }
            }
          }
        },
        brand: {
          select: { id: true, name: true, slug: true }
        },
        images: {
          where: {
            processingStatus: {
              not: 'deleted'
            }
          },
          orderBy: { displayOrder: 'asc' }
        },
        specifications: {
          orderBy: { sortOrder: 'asc' }
        },
        variants: {
          where: { isActive: true }
        },
        variantTypes: {
          include: {
            values: {
              orderBy: { value: 'asc' }
            }
          },
          orderBy: { name: 'asc' }
        },
        crossSellProducts: {
          include: {
            relatedProduct: {
              select: {
                id: true,
                name: true,
                nameEn: true,
                slug: true,
                regularPrice: true,
                salePrice: true,
                images: {
                  take: 1,
                  where: {
                    processingStatus: {
                      not: 'deleted'
                    }
                  },
                  orderBy: { displayOrder: 'asc' }
                }
              }
            }
          },
          orderBy: { displayOrder: 'asc' }
        },
        upSellProducts: {
          include: {
            relatedProduct: {
              select: {
                id: true,
                name: true,
                nameEn: true,
                slug: true,
                regularPrice: true,
                salePrice: true,
                images: {
                  take: 1,
                  where: {
                    processingStatus: {
                      not: 'deleted'
                    }
                  },
                  orderBy: { displayOrder: 'asc' }
                }
              }
            }
          },
          orderBy: { displayOrder: 'asc' }
        },
        relatedProducts: {
          include: {
            relatedProduct: {
              select: {
                id: true,
                name: true,
                nameEn: true,
                slug: true,
                regularPrice: true,
                salePrice: true,
                images: {
                  take: 1,
                  where: {
                    processingStatus: {
                      not: 'deleted'
                    }
                  },
                  orderBy: { displayOrder: 'asc' }
                }
              }
            }
          },
          orderBy: { displayOrder: 'asc' }
        },
        _count: {
          select: { reviews: true }
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    // Serialize Decimal values to numbers
    product = serializeProduct(product);

    res.json({ product });

  } catch (error) {
    console.error('Get product by slug error:', error);
    res.status(500).json({
      error: 'Failed to fetch product',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/products/:id - Get product by ID
router.get('/:id', [
  param('id').isUUID()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    let product = await prisma.product.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            category: {
              select: { id: true, name: true, slug: true }
            }
          }
        },
        brand: {
          select: { id: true, name: true, slug: true }
        },
        images: {
          where: {
            processingStatus: {
              not: 'deleted'
            }
          },
          orderBy: { displayOrder: 'asc' }
        },
        specifications: {
          orderBy: { sortOrder: 'asc' }
        },
        variants: {
          where: { isActive: true }
        },
        variantTypes: {
          include: {
            values: {
              orderBy: { value: 'asc' }
            }
          },
          orderBy: { name: 'asc' }
        },
        crossSellProducts: {
          include: {
            relatedProduct: {
              select: {
                id: true,
                name: true,
                nameEn: true,
                slug: true,
                regularPrice: true,
                salePrice: true,
                images: {
                  take: 1,
                  where: {
                    processingStatus: {
                      not: 'deleted'
                    }
                  },
                  orderBy: { displayOrder: 'asc' }
                }
              }
            }
          },
          orderBy: { displayOrder: 'asc' }
        },
        upSellProducts: {
          include: {
            relatedProduct: {
              select: {
                id: true,
                name: true,
                nameEn: true,
                slug: true,
                regularPrice: true,
                salePrice: true,
                images: {
                  take: 1,
                  where: {
                    processingStatus: {
                      not: 'deleted'
                    }
                  },
                  orderBy: { displayOrder: 'asc' }
                }
              }
            }
          },
          orderBy: { displayOrder: 'asc' }
        },
        relatedProducts: {
          include: {
            relatedProduct: {
              select: {
                id: true,
                name: true,
                nameEn: true,
                slug: true,
                regularPrice: true,
                salePrice: true,
                images: {
                  take: 1,
                  where: {
                    processingStatus: {
                      not: 'deleted'
                    }
                  },
                  orderBy: { displayOrder: 'asc' }
                }
              }
            }
          },
          orderBy: { displayOrder: 'asc' }
        },
        _count: {
          select: { reviews: true }
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    // Serialize Decimal values to numbers
    product = serializeProduct(product);

    // Serialize nested related products to convert Decimal values to numbers
    if (product.crossSellProducts && product.crossSellProducts.length > 0) {
      product.crossSellProducts = product.crossSellProducts.map(item => ({
        ...item,
        relatedProduct: serializeProduct(item.relatedProduct)
      }));
    }

    if (product.upSellProducts && product.upSellProducts.length > 0) {
      product.upSellProducts = product.upSellProducts.map(item => ({
        ...item,
        relatedProduct: serializeProduct(item.relatedProduct)
      }));
    }

    if (product.relatedProducts && product.relatedProducts.length > 0) {
      product.relatedProducts = product.relatedProducts.map(item => ({
        ...item,
        relatedProduct: serializeProduct(item.relatedProduct)
      }));
    }

    res.json({ product });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      error: 'Failed to fetch product',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/v1/products - Create product (admin only)
router.post('/', [
  body('sku').notEmpty().trim(),
  body('name').notEmpty().trim(),
  body('nameEn').notEmpty().trim(),
  body('slug').isSlug(),
  body('shortDescription').optional().isString(),
  body('description').optional().isString(),
  body('categories').isArray().withMessage('Categories must be an array'),
  body('brandId').isUUID(),
  body('regularPrice').isFloat({ min: 0 }),
  body('salePrice').optional().isFloat({ min: 0 }),
  body('costPrice').isFloat({ min: 0 }),
  body('taxRate').optional().isFloat({ min: 0 }),
  body('stockQuantity').optional().isInt({ min: 0 }),
  body('lowStockThreshold').optional().isInt({ min: 0 }),
  body('status').optional().isIn(['active', 'inactive', 'draft', 'published', 'archived', 'out_of_stock', 'discontinued']),
  body('visibility').optional().isIn(['public', 'private', 'restricted']),
  body('metaTitle').optional().isString().trim(),
  body('metaDescription').optional().isString(),
  body('metaKeywords').optional().isString(),
  body('isFeatured').optional().isBoolean(),
  body('isNewArrival').optional().isBoolean(),
  body('isBestSeller').optional().isBoolean(),
  body('warrantyPeriod').optional().isInt({ min: 0 }),
  body('warrantyType').optional().isString()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const productData = req.body;
    
    console.log('[PRODUCT CREATION] Request received:', {
      sku: productData.sku,
      name: productData.name,
      nameEn: productData.nameEn,
      slug: productData.slug,
      categories: productData.categories,
      brandId: productData.brandId,
      regularPrice: productData.regularPrice,
      salePrice: productData.salePrice,
      costPrice: productData.costPrice,
      stockQuantity: productData.stockQuantity,
      status: productData.status,
      visibility: productData.visibility
    });

    // Check if SKU already exists
    const existingSku = await prisma.product.findUnique({
      where: { sku: productData.sku }
    });

    if (existingSku) {
      console.log('[PRODUCT CREATION] SKU already exists:', productData.sku);
      return res.status(409).json({
        error: 'Product with this SKU already exists'
      });
    }

    // Check if slug already exists
    const existingSlug = await prisma.product.findUnique({
      where: { slug: productData.slug }
    });

    if (existingSlug) {
      console.log('[PRODUCT CREATION] Slug already exists:', productData.slug);
      return res.status(409).json({
        error: 'Product with this slug already exists'
      });
    }

    // Validate categories array
    if (!productData.categories || productData.categories.length === 0) {
      console.log('[PRODUCT CREATION] Categories validation failed: empty or missing');
      return res.status(400).json({
        error: 'At least one category is required'
      });
    }

    // Check if all categories exist
    console.log('[PRODUCT CREATION] Checking categories:', productData.categories);
    const categories = await prisma.category.findMany({
      where: { id: { in: productData.categories } }
    });

    console.log('[PRODUCT CREATION] Found categories:', categories.length, 'out of', productData.categories.length);

    if (categories.length !== productData.categories.length) {
      console.log('[PRODUCT CREATION] Categories not found:', productData.categories.filter(id => !categories.find(c => c.id === id)));
      return res.status(404).json({
        error: 'One or more categories not found'
      });
    }

    // Check if brand exists
    console.log('[PRODUCT CREATION] Checking brand:', productData.brandId);
    const brand = await prisma.brand.findUnique({
      where: { id: productData.brandId }
    });

    if (!brand) {
      console.log('[PRODUCT CREATION] Brand not found:', productData.brandId);
      return res.status(404).json({
        error: 'Brand not found'
      });
    }

    console.log('[PRODUCT CREATION] All validations passed, creating product...');

    try {
      // Create product with categories
      const product = await prisma.product.create({
        data: {
          sku: productData.sku,
          name: productData.name,
          nameEn: productData.nameEn,
          nameBn: productData.nameBn || null,
          slug: productData.slug,
          shortDescription: productData.shortDescription || null,
          description: productData.description || null,
          brandId: productData.brandId,
          regularPrice: parseFloat(productData.regularPrice),
          salePrice: productData.salePrice ? parseFloat(productData.salePrice) : null,
          costPrice: parseFloat(productData.costPrice),
          taxRate: productData.taxRate ? parseFloat(productData.taxRate) : 0,
          stockQuantity: productData.stockQuantity || 0,
          lowStockThreshold: productData.lowStockThreshold || 10,
          status: productData.status || 'active',
          visibility: productData.visibility || 'public',
          metaTitle: productData.metaTitle || null,
          metaDescription: productData.metaDescription || null,
          metaKeywords: productData.metaKeywords || null,
          isFeatured: productData.isFeatured || false,
          isNewArrival: productData.isNewArrival || false,
          isBestSeller: productData.isBestSeller || false,
          warrantyPeriod: productData.warrantyPeriod || null,
          warrantyType: productData.warrantyType || null,
          publishedAt: productData.status === 'published' ? new Date() : null,
          categories: {
            create: productData.categories.map((categoryId, index) => ({
              categoryId,
              isPrimary: index === 0 // First category is primary
            }))
          }
        },
        include: {
          categories: {
            include: {
              category: true
            }
          },
          brand: true,
          images: true
        }
      });

      console.log('[PRODUCT CREATION] Product created successfully:', product.id);

      // Index product in Elasticsearch (non-blocking)
      if (elasticsearchConfig.isAvailable()) {
        productIndexingService.indexProduct(product.id)
          .catch(error => {
            console.error('[PRODUCT CREATION] Failed to index product in Elasticsearch:', error);
          });
      }

      res.status(201).json({
        message: 'Product created successfully',
        product
      });

    } catch (error) {
      console.error('[PRODUCT CREATION] ERROR:', error);
      console.error('[PRODUCT CREATION] Error details:', {
        message: error.message,
        code: error.code,
        meta: error.meta,
        stack: error.stack
      });

      res.status(500).json({
        error: 'Failed to create product',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }

    // Index product in Elasticsearch (non-blocking)
    if (elasticsearchConfig.isAvailable()) {
      productIndexingService.indexProduct(product.id)
        .catch(error => {
          console.error('Failed to index product in Elasticsearch:', error);
        });
    }

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

// PUT /api/v1/products/:id - Update product (admin only)
router.put('/:id', [
  param('id').isUUID(),
  body('sku').optional().notEmpty().trim(),
  body('name').optional().notEmpty().trim(),
  body('nameEn').optional().notEmpty().trim(),
  body('slug').optional().isSlug(),
  body('shortDescription').optional().isString(),
  body('description').optional().isString(),
  body('categories').optional().isArray().withMessage('Categories must be an array'),
  body('brandId').optional({ checkFalsy: true }).isUUID(),
  body('regularPrice').optional().isFloat({ min: 0 }),
  body('salePrice').optional().isFloat({ min: 0 }),
  body('costPrice').optional().isFloat({ min: 0 }),
  body('taxRate').optional().isFloat({ min: 0 }),
  body('stockQuantity').optional().isInt({ min: 0 }),
  body('lowStockThreshold').optional().isInt({ min: 0 }),
  body('status').optional().isIn(['active', 'inactive', 'draft', 'published', 'archived', 'out_of_stock', 'discontinued']),
  body('visibility').optional().isIn(['public', 'private', 'restricted']),
  body('metaTitle').optional().isString().trim(),
  body('metaDescription').optional().isString(),
  body('metaKeywords').optional().isString(),
  body('isFeatured').optional().isBoolean(),
  body('isNewArrival').optional().isBoolean(),
  body('isBestSeller').optional().isBoolean(),
  body('warrantyPeriod').optional().isInt({ min: 0 }),
  body('warrantyType').optional().isString()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        categories: true
      }
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

    // If categories are provided, validate them
    if (updateData.categories !== undefined) {
      if (updateData.categories.length === 0) {
        return res.status(400).json({
          error: 'At least one category is required'
        });
      }

      // Check if all categories exist
      const categories = await prisma.category.findMany({
        where: { id: { in: updateData.categories } }
      });

      if (categories.length !== updateData.categories.length) {
        return res.status(404).json({
          error: 'One or more categories not found'
        });
      }

      // Delete existing category associations
      await prisma.productCategory.deleteMany({
        where: { productId: id }
      });

      // Create new category associations
      await prisma.productCategory.createMany({
        data: updateData.categories.map((categoryId, index) => ({
          productId: id,
          categoryId,
          isPrimary: index === 0 // First category is primary
        }))
      });

      // Remove categories from updateData to prevent Prisma error
      delete updateData.categories;
    }

    // If brandId is provided, check if brand exists
    if (updateData.brandId) {
      const brand = await prisma.brand.findUnique({
        where: { id: updateData.brandId }
      });

      if (!brand) {
        return res.status(404).json({
          error: 'Brand not found'
        });
      }
    }

    // Update publishedAt if status changes to published
    if (updateData.status === 'published' && existingProduct.status !== 'published') {
      updateData.publishedAt = new Date();
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        categories: {
          include: {
            category: true
          }
        },
        brand: true,
        images: true
      }
    });

    // Reindex product in Elasticsearch (non-blocking)
    if (elasticsearchConfig.isAvailable()) {
      productIndexingService.updateProduct(id)
        .catch(error => {
          console.error('Failed to reindex product in Elasticsearch:', error);
        });
    }

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

// DELETE /api/v1/products/:id - Delete product (admin only)
router.delete('/:id', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
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
            reviews: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    // Delete product images from filesystem
    if (product.images.length > 0) {
      for (const image of product.images) {
        const sanitizedUrl = path.basename(image.originalUrl);
        const imagePath = path.join(__dirname, '..', sanitizedUrl);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    }

    await prisma.product.delete({
      where: { id }
    });

    // Remove product from Elasticsearch (non-blocking)
    if (elasticsearchConfig.isAvailable()) {
      productIndexingService.deleteProduct(id)
        .catch(error => {
          console.error('Failed to delete product from Elasticsearch:', error);
        });
    }

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

// ============================================
// PRODUCT STATUS MANAGEMENT ENDPOINT
// ============================================

// PATCH /api/v1/products/:id/status - Update product status
router.patch('/:id/status', [
  param('id').isUUID(),
  body('status').isIn(['active', 'inactive', 'draft', 'published', 'archived', 'out_of_stock', 'discontinued'])
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    const updateData = { status };

    // Update publishedAt if status changes to published
    if (status === 'published' && product.status !== 'published') {
      updateData.publishedAt = new Date();
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData
    });

    // Reindex product in Elasticsearch (non-blocking)
    if (elasticsearchConfig.isAvailable()) {
      productIndexingService.updateProduct(id)
        .catch(error => {
          console.error('Failed to reindex product in Elasticsearch:', error);
        });
    }

    res.json({
      message: 'Product status updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Update product status error:', error);
    res.status(500).json({
      error: 'Failed to update product status',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// PRODUCT FEATURED/NEW ARRIVAL/BEST SELLER MANAGEMENT
// ============================================

// PATCH /api/v1/products/:id/featured - Toggle featured status
router.patch('/:id/featured', [
  param('id').isUUID(),
  body('isFeatured').isBoolean()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const { isFeatured } = req.body;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { isFeatured }
    });

    // Reindex product in Elasticsearch (non-blocking)
    if (elasticsearchConfig.isAvailable()) {
      productIndexingService.updateProduct(id)
        .catch(error => {
          console.error('Failed to reindex product in Elasticsearch:', error);
        });
    }

    res.json({
      message: 'Product featured status updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Toggle product featured error:', error);
    res.status(500).json({
      error: 'Failed to toggle product featured status',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PATCH /api/v1/products/:id/new-arrival - Toggle new arrival status
router.patch('/:id/new-arrival', [
  param('id').isUUID(),
  body('isNewArrival').isBoolean()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const { isNewArrival } = req.body;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { isNewArrival }
    });

    // Reindex product in Elasticsearch (non-blocking)
    if (elasticsearchConfig.isAvailable()) {
      productIndexingService.updateProduct(id)
        .catch(error => {
          console.error('Failed to reindex product in Elasticsearch:', error);
        });
    }

    res.json({
      message: 'Product new arrival status updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Toggle product new arrival error:', error);
    res.status(500).json({
      error: 'Failed to toggle product new arrival status',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PATCH /api/v1/products/:id/best-seller - Toggle best seller status
router.patch('/:id/best-seller', [
  param('id').isUUID(),
  body('isBestSeller').isBoolean()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const { isBestSeller } = req.body;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { isBestSeller }
    });

    // Reindex product in Elasticsearch (non-blocking)
    if (elasticsearchConfig.isAvailable()) {
      productIndexingService.updateProduct(id)
        .catch(error => {
          console.error('Failed to reindex product in Elasticsearch:', error);
        });
    }

    res.json({
      message: 'Product best seller status updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Toggle product best seller error:', error);
    res.status(500).json({
      error: 'Failed to toggle product best seller status',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /api/v1/products/:productId/images/:imageId - Update product image
router.put('/:productId/images/:imageId', [
  param('productId').isUUID(),
  param('imageId').isUUID(),
  body('altTextEn').optional().isString(),
  body('altTextBn').optional().isString(),
  body('displayOrder').optional().isInt({ min: 0 }),
  body('isPrimary').optional().isBoolean()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { productId, imageId } = req.params;
    const { altTextEn, altTextBn, displayOrder, isPrimary } = req.body;

    // Check if image exists using Prisma ORM
    const image = await prisma.productImage.findUnique({
      where: { id: imageId }
    });

    if (!image) {
      return res.status(404).json({
        error: 'Image not found'
      });
    }

    // Verify image belongs to product
    if (image.productId !== productId) {
      return res.status(403).json({
        error: 'Image does not belong to this product'
      });
    }

    const updateData = {};
    if (altTextEn !== undefined) updateData.altTextEn = altTextEn;
    if (altTextBn !== undefined) updateData.altTextBn = altTextBn;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    if (isPrimary !== undefined) updateData.isPrimary = isPrimary;

    const updatedImage = await prisma.productImage.update({
      where: { id: imageId },
      data: updateData
    });

    res.json({
      message: 'Product image updated successfully',
      image: updatedImage
    });

  } catch (error) {
    console.error('Update product image error:', error);
    res.status(500).json({
      error: 'Failed to update product image',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/v1/products/:productId/images/:imageId - Delete product image
router.delete('/:productId/images/:imageId', [
  param('productId').isUUID(),
  param('imageId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { productId, imageId } = req.params;

    // Check if image exists
    const image = await prisma.productImage.findUnique({
      where: { id: imageId }
    });

    if (!image) {
      return res.status(404).json({
        error: 'Image not found'
      });
    }

    // Verify image belongs to product
    if (image.productId !== productId) {
      return res.status(403).json({
        error: 'Image does not belong to this product'
      });
    }

    // Delete file from filesystem
    const imagePath = path.join(__dirname, '..', image.originalUrl);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await prisma.productImage.delete({
      where: { id: imageId }
    });

    res.json({
      message: 'Product image deleted successfully'
    });

  } catch (error) {
    console.error('Delete product image error:', error);
    res.status(500).json({
      error: 'Failed to delete product image',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// PRODUCT SPECIFICATION MANAGEMENT ENDPOINTS
// ============================================

// POST /api/v1/products/:id/specifications - Add product specification
router.post('/:id/specifications', [
  param('id').isUUID(),
  body('name').notEmpty().trim(),
  body('value').notEmpty().trim(),
  body('sortOrder').optional().isInt({ min: 0 })
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, value, sortOrder } = req.body;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    const specification = await prisma.productSpecification.create({
      data: {
        productId: id,
        name,
        value,
        sortOrder: sortOrder || 0
      }
    });

    res.status(201).json({
      message: 'Product specification added successfully',
      specification
    });

  } catch (error) {
    console.error('Add product specification error:', error);
    res.status(500).json({
      error: 'Failed to add product specification',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /api/v1/products/:productId/specifications/:specId - Update product specification
router.put('/:productId/specifications/:specId', [
  param('productId').isUUID(),
  param('specId').isUUID(),
  body('name').optional().notEmpty().trim(),
  body('value').optional().notEmpty().trim(),
  body('sortOrder').optional().isInt({ min: 0 })
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { productId, specId } = req.params;
    const { name, value, sortOrder } = req.body;

    // Check if specification exists
    const specification = await prisma.productSpecification.findUnique({
      where: { id: specId }
    });

    if (!specification) {
      return res.status(404).json({
        error: 'Specification not found'
      });
    }

    // Verify specification belongs to product
    if (specification.productId !== productId) {
      return res.status(403).json({
        error: 'Specification does not belong to this product'
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (value !== undefined) updateData.value = value;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const updatedSpecification = await prisma.productSpecification.update({
      where: { id: specId },
      data: updateData
    });

    res.json({
      message: 'Product specification updated successfully',
      specification: updatedSpecification
    });

  } catch (error) {
    console.error('Update product specification error:', error);
    res.status(500).json({
      error: 'Failed to update product specification',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/v1/products/:productId/specifications/:specId - Delete product specification
router.delete('/:productId/specifications/:specId', [
  param('productId').isUUID(),
  param('specId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { productId, specId } = req.params;

    // Check if specification exists
    const specification = await prisma.productSpecification.findUnique({
      where: { id: specId }
    });

    if (!specification) {
      return res.status(404).json({
        error: 'Specification not found'
      });
    }

    // Verify specification belongs to product
    if (specification.productId !== productId) {
      return res.status(403).json({
        error: 'Specification does not belong to this product'
      });
    }

    await prisma.productSpecification.delete({
      where: { id: specId }
    });

    res.json({
      message: 'Product specification deleted successfully'
    });

  } catch (error) {
    console.error('Delete product specification error:', error);
    res.status(500).json({
      error: 'Failed to delete product specification',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// PRODUCT STOCK MANAGEMENT ENDPOINT
// ============================================

// PATCH /api/v1/products/:id/stock - Update product stock
router.patch('/:id/stock', [
  param('id').isUUID(),
  body('stockQuantity').isInt({ min: 0 }),
  body('lowStockThreshold').optional().isInt({ min: 0 })
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const { stockQuantity, lowStockThreshold } = req.body;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    const updateData = { stockQuantity: parseInt(stockQuantity) };
    if (lowStockThreshold !== undefined) {
      updateData.lowStockThreshold = parseInt(lowStockThreshold);
    }

    // Update status based on stock
    if (stockQuantity === 0) {
      updateData.status = 'out_of_stock';
    } else if (stockQuantity <= (lowStockThreshold || 10)) {
      // Keep current status but could add low stock notification
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData
    });

    // Reindex product in Elasticsearch (non-blocking)
    if (elasticsearchConfig.isAvailable()) {
      productIndexingService.updateProduct(id)
        .catch(error => {
          console.error('Failed to reindex product in Elasticsearch:', error);
        });
    }

    res.json({
      message: 'Product stock updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Update product stock error:', error);
    res.status(500).json({
      error: 'Failed to update product stock',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// PRODUCT SEO MANAGEMENT ENDPOINT
// ============================================

// PATCH /api/v1/products/:id/seo - Update SEO fields
router.patch('/:id/seo', [
  param('id').isUUID(),
  body('metaTitle').optional().isString().trim(),
  body('metaDescription').optional().isString(),
  body('metaKeywords').optional().isString()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const { metaTitle, metaDescription, metaKeywords } = req.body;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    const updateData = {};
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    if (metaKeywords !== undefined) updateData.metaKeywords = metaKeywords;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData
    });

    // Reindex product in Elasticsearch (non-blocking)
    if (elasticsearchConfig.isAvailable()) {
      productIndexingService.updateProduct(id)
        .catch(error => {
          console.error('Failed to reindex product in Elasticsearch:', error);
        });
    }

    res.json({
      message: 'SEO fields updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Update product SEO error:', error);
    res.status(500).json({
      error: 'Failed to update SEO fields',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// PRODUCT-CATEGORY MANAGEMENT ENDPOINTS
// ============================================

// POST /api/v1/products/:id/categories - Assign categories to product
router.post('/:id/categories', [
  param('id').isUUID(),
  body('categoryIds').isArray().withMessage('categoryIds must be an array'),
  body('primaryCategoryId').optional({ checkFalsy: true }).isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryIds, primaryCategoryId } = req.body;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    // Validate categories
    if (!categoryIds || categoryIds.length === 0) {
      return res.status(400).json({
        error: 'At least one category is required'
      });
    }

    // Check if all categories exist
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } }
    });

    if (categories.length !== categoryIds.length) {
      return res.status(404).json({
        error: 'One or more categories not found'
      });
    }

    // If primaryCategoryId is provided, check if it exists in the list
    if (primaryCategoryId && !categoryIds.includes(primaryCategoryId)) {
      return res.status(400).json({
        error: 'Primary category must be in the categories list'
      });
    }

    // Delete existing category associations
    await prisma.productCategory.deleteMany({
      where: { productId: id }
    });

    // Create new category associations
    const associations = await prisma.productCategory.createMany({
      data: categoryIds.map((categoryId, index) => ({
        productId: id,
        categoryId,
        isPrimary: categoryId === primaryCategoryId || index === 0
      }))
    });

    res.status(201).json({
      message: 'Categories assigned successfully',
      associations
    });

  } catch (error) {
    console.error('Assign categories error:', error);
    res.status(500).json({
      error: 'Failed to assign categories',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/v1/products/:id/categories/:categoryId - Remove category from product
router.delete('/:id/categories/:categoryId', [
  param('id').isUUID(),
  param('categoryId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id, categoryId } = req.params;

    // Check if association exists
    const association = await prisma.productCategory.findUnique({
      where: {
        productId_categoryId: {
          productId: id,
          categoryId: categoryId
        }
      }
    });

    if (!association) {
      return res.status(404).json({
        error: 'Product-category association not found'
      });
    }

    // Delete the association
    await prisma.productCategory.delete({
      where: {
        productId_categoryId: {
          productId: id,
          categoryId: categoryId
        }
      }
    });

    res.json({
      message: 'Category removed successfully'
    });

  } catch (error) {
    console.error('Remove category error:', error);
    res.status(500).json({
      error: 'Failed to remove category',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PATCH /api/v1/products/:id/categories/:categoryId/primary - Set primary category
router.patch('/:id/categories/:categoryId/primary', [
  param('id').isUUID(),
  param('categoryId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id, categoryId } = req.params;

    // Check if association exists
    const association = await prisma.productCategory.findUnique({
      where: {
        productId_categoryId: {
          productId: id,
          categoryId: categoryId
        }
      }
    });

    if (!association) {
      return res.status(404).json({
        error: 'Product-category association not found'
      });
    }

    // Set all other categories for this product as non-primary
    await prisma.productCategory.updateMany({
      where: {
        productId: id,
        NOT: {
          categoryId: categoryId
        }
      },
      data: {
        isPrimary: false
      }
    });

    // Set the specified category as primary
    const updatedAssociation = await prisma.productCategory.update({
      where: {
        productId_categoryId: {
          productId: id,
          categoryId: categoryId
        }
      },
      data: {
        isPrimary: true
      }
    });

    res.json({
      message: 'Primary category set successfully',
      association: updatedAssociation
    });

  } catch (error) {
    console.error('Set primary category error:', error);
    res.status(500).json({
      error: 'Failed to set primary category',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// PRODUCT VARIANT MANAGEMENT ENDPOINTS
// ============================================

// POST /api/v1/products/:id/variants - Create product variant
router.post('/:id/variants', [
  param('id').isUUID(),
  body('name').notEmpty().trim(),
  body('sku').notEmpty().trim(),
  body('price').isFloat({ min: 0 }),
  body('comparePrice').optional().isFloat({ min: 0 }),
  body('stock').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sku, price, comparePrice, stock, isActive } = req.body;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    // Check if SKU already exists for this product
    const existingSku = await prisma.productVariant.findFirst({
      where: { sku, productId: id }
    });

    if (existingSku) {
      return res.status(409).json({
        error: 'Variant with this SKU already exists for this product'
      });
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId: id,
        name,
        sku,
        price: parseFloat(price),
        comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        stock: stock || 0,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.status(201).json({
      message: 'Product variant created successfully',
      variant
    });

  } catch (error) {
    console.error('Create product variant error:', error);
    res.status(500).json({
      error: 'Failed to create product variant',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /api/v1/products/:id/variants/:variantId - Update product variant
router.put('/:id/variants/:variantId', [
  param('id').isUUID(),
  param('variantId').isUUID(),
  body('name').optional().notEmpty().trim(),
  body('sku').optional().notEmpty().trim(),
  body('price').optional().isFloat({ min: 0 }),
  body('comparePrice').optional().isFloat({ min: 0 }),
  body('stock').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id, variantId } = req.params;
    const { name, sku, price, comparePrice, stock, isActive } = req.body;

    // Check if variant exists
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId }
    });

    if (!variant) {
      return res.status(404).json({
        error: 'Variant not found'
      });
    }

    // Verify variant belongs to product
    if (variant.productId !== id) {
      return res.status(403).json({
        error: 'Variant does not belong to this product'
      });
    }

    // Check if SKU conflicts with another variant
    if (sku && sku !== variant.sku) {
      const skuConflict = await prisma.productVariant.findFirst({
        where: { sku, productId: id, NOT: { id: variantId } }
      });

      if (skuConflict) {
        return res.status(409).json({
          error: 'Variant with this SKU already exists for this product'
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (sku !== undefined) updateData.sku = sku;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (comparePrice !== undefined) updateData.comparePrice = parseFloat(comparePrice);
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedVariant = await prisma.productVariant.update({
      where: { id: variantId },
      data: updateData
    });

    res.json({
      message: 'Product variant updated successfully',
      variant: updatedVariant
    });

  } catch (error) {
    console.error('Update product variant error:', error);
    res.status(500).json({
      error: 'Failed to update product variant',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/v1/products/:id/variants/:variantId - Delete product variant
router.delete('/:id/variants/:variantId', [
  param('id').isUUID(),
  param('variantId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id, variantId } = req.params;

    // Check if variant exists
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        _count: {
          select: {
            orderItems: true,
            cartItems: true
          }
        }
      }
    });

    if (!variant) {
      return res.status(404).json({
        error: 'Variant not found'
      });
    }

    // Verify variant belongs to product
    if (variant.productId !== id) {
      return res.status(403).json({
        error: 'Variant does not belong to this product'
      });
    }

    // Check if variant is used in orders or cart
    if (variant._count.orderItems > 0 || variant._count.cartItems > 0) {
      return res.status(400).json({
        error: 'Cannot delete variant that is used in orders or cart items'
      });
    }

    await prisma.productVariant.delete({
      where: { id: variantId }
    });

    res.json({
      message: 'Product variant deleted successfully'
    });

  } catch (error) {
    console.error('Delete product variant error:', error);
    res.status(500).json({
      error: 'Failed to delete product variant',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PATCH /api/v1/products/:id/variants/:variantId/status - Toggle variant active/inactive
router.patch('/:id/variants/:variantId/status', [
  param('id').isUUID(),
  param('variantId').isUUID(),
  body('isActive').isBoolean()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id, variantId } = req.params;
    const { isActive } = req.body;

    // Check if variant exists
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId }
    });

    if (!variant) {
      return res.status(404).json({
        error: 'Variant not found'
      });
    }

    // Verify variant belongs to product
    if (variant.productId !== id) {
      return res.status(403).json({
        error: 'Variant does not belong to this product'
      });
    }

    const updatedVariant = await prisma.productVariant.update({
      where: { id: variantId },
      data: { isActive }
    });

    res.json({
      message: 'Variant status updated successfully',
      variant: updatedVariant
    });

  } catch (error) {
    console.error('Update variant status error:', error);
    res.status(500).json({
      error: 'Failed to update variant status',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// VARIANT TYPE MANAGEMENT ENDPOINTS
// ============================================

// POST /api/v1/products/:id/variant-types - Create variant type
router.post('/:id/variant-types', [
  param('id').isUUID(),
  body('name').notEmpty().trim()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    // Check if variant type with this name already exists for this product
    const existingType = await prisma.variantType.findFirst({
      where: { name, productId: id }
    });

    if (existingType) {
      return res.status(409).json({
        error: 'Variant type with this name already exists for this product'
      });
    }

    const variantType = await prisma.variantType.create({
      data: {
        productId: id,
        name
      },
      include: {
        values: true
      }
    });

    res.status(201).json({
      message: 'Variant type created successfully',
      variantType
    });

  } catch (error) {
    console.error('Create variant type error:', error);
    res.status(500).json({
      error: 'Failed to create variant type',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /api/v1/products/:id/variant-types/:typeId - Update variant type
router.put('/:id/variant-types/:typeId', [
  param('id').isUUID(),
  param('typeId').isUUID(),
  body('name').optional().notEmpty().trim()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id, typeId } = req.params;
    const { name } = req.body;

    // Check if variant type exists
    const variantType = await prisma.variantType.findUnique({
      where: { id: typeId }
    });

    if (!variantType) {
      return res.status(404).json({
        error: 'Variant type not found'
      });
    }

    // Verify variant type belongs to product
    if (variantType.productId !== id) {
      return res.status(403).json({
        error: 'Variant type does not belong to this product'
      });
    }

    // Check if name conflicts with another variant type
    if (name && name !== variantType.name) {
      const nameConflict = await prisma.variantType.findFirst({
        where: { name, productId: id, NOT: { id: typeId } }
      });

      if (nameConflict) {
        return res.status(409).json({
          error: 'Variant type with this name already exists for this product'
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;

    const updatedVariantType = await prisma.variantType.update({
      where: { id: typeId },
      data: updateData,
      include: {
        values: true
      }
    });

    res.json({
      message: 'Variant type updated successfully',
      variantType: updatedVariantType
    });

  } catch (error) {
    console.error('Update variant type error:', error);
    res.status(500).json({
      error: 'Failed to update variant type',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/v1/products/:id/variant-types/:typeId - Delete variant type
router.delete('/:id/variant-types/:typeId', [
  param('id').isUUID(),
  param('typeId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id, typeId } = req.params;

    // Check if variant type exists
    const variantType = await prisma.variantType.findUnique({
      where: { id: typeId },
      include: {
        values: true
      }
    });

    if (!variantType) {
      return res.status(404).json({
        error: 'Variant type not found'
      });
    }

    // Verify variant type belongs to product
    if (variantType.productId !== id) {
      return res.status(403).json({
        error: 'Variant type does not belong to this product'
      });
    }

    // Check if variant type has values (cascade delete will handle this)
    if (variantType.values.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete variant type that has values. Delete the values first.'
      });
    }

    await prisma.variantType.delete({
      where: { id: typeId }
    });

    res.json({
      message: 'Variant type deleted successfully'
    });

  } catch (error) {
    console.error('Delete variant type error:', error);
    res.status(500).json({
      error: 'Failed to delete variant type',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// VARIANT VALUE MANAGEMENT ENDPOINTS
// ============================================

// POST /api/v1/products/:id/variant-types/:typeId/values - Create variant value
router.post('/:id/variant-types/:typeId/values', [
  param('id').isUUID(),
  param('typeId').isUUID(),
  body('value').notEmpty().trim()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id, typeId } = req.params;
    const { value } = req.body;

    // Check if variant type exists
    const variantType = await prisma.variantType.findUnique({
      where: { id: typeId }
    });

    if (!variantType) {
      return res.status(404).json({
        error: 'Variant type not found'
      });
    }

    // Verify variant type belongs to product
    if (variantType.productId !== id) {
      return res.status(403).json({
        error: 'Variant type does not belong to this product'
      });
    }

    // Check if value already exists for this variant type
    const existingValue = await prisma.variantValue.findFirst({
      where: { value, variantTypeId: typeId }
    });

    if (existingValue) {
      return res.status(409).json({
        error: 'Variant value with this name already exists for this variant type'
      });
    }

    const variantValue = await prisma.variantValue.create({
      data: {
        variantTypeId: typeId,
        value
      }
    });

    res.status(201).json({
      message: 'Variant value created successfully',
      variantValue
    });

  } catch (error) {
    console.error('Create variant value error:', error);
    res.status(500).json({
      error: 'Failed to create variant value',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /api/v1/products/:id/variant-types/:typeId/values/:valueId - Update variant value
router.put('/:id/variant-types/:typeId/values/:valueId', [
  param('id').isUUID(),
  param('typeId').isUUID(),
  param('valueId').isUUID(),
  body('value').optional().notEmpty().trim()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id, typeId, valueId } = req.params;
    const { value } = req.body;

    // Check if variant value exists
    const variantValue = await prisma.variantValue.findUnique({
      where: { id: valueId }
    });

    if (!variantValue) {
      return res.status(404).json({
        error: 'Variant value not found'
      });
    }

    // Verify variant value belongs to variant type
    if (variantValue.variantTypeId !== typeId) {
      return res.status(403).json({
        error: 'Variant value does not belong to this variant type'
      });
    }

    // Verify variant type belongs to product
    const variantType = await prisma.variantType.findUnique({
      where: { id: typeId }
    });

    if (!variantType || variantType.productId !== id) {
      return res.status(403).json({
        error: 'Variant type does not belong to this product'
      });
    }

    // Check if value conflicts with another variant value
    if (value && value !== variantValue.value) {
      const valueConflict = await prisma.variantValue.findFirst({
        where: { value, variantTypeId: typeId, NOT: { id: valueId } }
      });

      if (valueConflict) {
        return res.status(409).json({
          error: 'Variant value with this name already exists for this variant type'
        });
      }
    }

    const updateData = {};
    if (value !== undefined) updateData.value = value;

    const updatedVariantValue = await prisma.variantValue.update({
      where: { id: valueId },
      data: updateData
    });

    res.json({
      message: 'Variant value updated successfully',
      variantValue: updatedVariantValue
    });

  } catch (error) {
    console.error('Update variant value error:', error);
    res.status(500).json({
      error: 'Failed to update variant value',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/v1/products/:id/variant-types/:typeId/values/:valueId - Delete variant value
router.delete('/:id/variant-types/:typeId/values/:valueId', [
  param('id').isUUID(),
  param('typeId').isUUID(),
  param('valueId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id, typeId, valueId } = req.params;

    // Check if variant value exists
    const variantValue = await prisma.variantValue.findUnique({
      where: { id: valueId }
    });

    if (!variantValue) {
      return res.status(404).json({
        error: 'Variant value not found'
      });
    }

    // Verify variant value belongs to variant type
    if (variantValue.variantTypeId !== typeId) {
      return res.status(403).json({
        error: 'Variant value does not belong to this variant type'
      });
    }

    // Verify variant type belongs to product
    const variantType = await prisma.variantType.findUnique({
      where: { id: typeId }
    });

    if (!variantType || variantType.productId !== id) {
      return res.status(403).json({
        error: 'Variant type does not belong to this product'
      });
    }

    await prisma.variantValue.delete({
      where: { id: valueId }
    });

    res.json({
      message: 'Variant value deleted successfully'
    });

  } catch (error) {
    console.error('Delete variant value error:', error);
    res.status(500).json({
      error: 'Failed to delete variant value',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// PRODUCT CROSS-SELL RELATIONSHIP ENDPOINTS
// ============================================

// POST /api/v1/products/:id/cross-sell - Add cross-sell product
router.post('/:id/cross-sell', [
  param('id').isUUID(),
  body('relatedProductId').isUUID().withMessage('Related product ID must be a valid UUID'),
  body('displayOrder').optional().isInt({ min: 0 })
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const { relatedProductId, displayOrder } = req.body;

    // Check if source product exists
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    // Check if related product exists
    const relatedProduct = await prisma.product.findUnique({
      where: { id: relatedProductId }
    });

    if (!relatedProduct) {
      return res.status(404).json({
        error: 'Related product not found'
      });
    }

    // Prevent self-referencing
    if (id === relatedProductId) {
      return res.status(400).json({
        error: 'Cannot add a product as its own cross-sell'
      });
    }

    // Check if relationship already exists
    const existingRelation = await prisma.crossSellProduct.findUnique({
      where: {
        productId_relatedProductId: {
          productId: id,
          relatedProductId: relatedProductId
        }
      }
    });

    if (existingRelation) {
      return res.status(409).json({
        error: 'Cross-sell relationship already exists'
      });
    }

    // Get the highest display order if not provided
    let finalDisplayOrder = displayOrder;
    if (displayOrder === undefined) {
      const maxOrder = await prisma.crossSellProduct.findFirst({
        where: { productId: id },
        orderBy: { displayOrder: 'desc' }
      });
      finalDisplayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;
    }

    // Create cross-sell relationship
    const crossSell = await prisma.crossSellProduct.create({
      data: {
        productId: id,
        relatedProductId: relatedProductId,
        displayOrder: finalDisplayOrder
      },
      include: {
        relatedProduct: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            slug: true,
            regularPrice: true,
            salePrice: true,
            images: {
              take: 1,
              where: {
                processingStatus: {
                  not: 'deleted'
                }
              },
              orderBy: { displayOrder: 'asc' }
            }
          }
        }
      }
    });

    res.status(201).json({
      message: 'Cross-sell product added successfully',
      crossSell
    });

  } catch (error) {
    console.error('Add cross-sell product error:', error);
    res.status(500).json({
      error: 'Failed to add cross-sell product',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/v1/products/:id/cross-sell/:relatedProductId - Remove cross-sell product
router.delete('/:id/cross-sell/:relatedProductId', [
  param('id').isUUID(),
  param('relatedProductId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id, relatedProductId } = req.params;

    // Check if relationship exists
    const relation = await prisma.crossSellProduct.findUnique({
      where: {
        productId_relatedProductId: {
          productId: id,
          relatedProductId: relatedProductId
        }
      }
    });

    if (!relation) {
      return res.status(404).json({
        error: 'Cross-sell relationship not found'
      });
    }

    // Delete the relationship
    await prisma.crossSellProduct.delete({
      where: {
        productId_relatedProductId: {
          productId: id,
          relatedProductId: relatedProductId
        }
      }
    });

    res.json({
      message: 'Cross-sell product removed successfully'
    });

  } catch (error) {
    console.error('Remove cross-sell product error:', error);
    res.status(500).json({
      error: 'Failed to remove cross-sell product',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PATCH /api/v1/products/:id/cross-sell/reorder - Reorder cross-sell products
router.patch('/:id/cross-sell/reorder', [
  param('id').isUUID(),
  body('orders').isArray().withMessage('Orders must be an array'),
  body('orders.*.relatedProductId').isUUID(),
  body('orders.*.displayOrder').isInt({ min: 0 })
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const { orders } = req.body;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    // Update display orders in a transaction
    await prisma.$transaction(
      orders.map(({ relatedProductId, displayOrder }) =>
        prisma.crossSellProduct.updateMany({
          where: {
            productId: id,
            relatedProductId: relatedProductId
          },
          data: { displayOrder }
        })
      )
    );

    // Fetch updated cross-sell products
    const crossSellProducts = await prisma.crossSellProduct.findMany({
      where: { productId: id },
      include: {
        relatedProduct: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            slug: true,
            regularPrice: true,
            salePrice: true,
            images: {
              take: 1,
              where: {
                processingStatus: {
                  not: 'deleted'
                }
              },
              orderBy: { displayOrder: 'asc' }
            }
          }
        }
      },
      orderBy: { displayOrder: 'asc' }
    });

    res.json({
      message: 'Cross-sell products reordered successfully',
      crossSellProducts
    });

  } catch (error) {
    console.error('Reorder cross-sell products error:', error);
    res.status(500).json({
      error: 'Failed to reorder cross-sell products',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// PRODUCT UP-SELL RELATIONSHIP ENDPOINTS
// ============================================

// POST /api/v1/products/:id/up-sell - Add up-sell product
router.post('/:id/up-sell', [
  param('id').isUUID(),
  body('relatedProductId').isUUID().withMessage('Related product ID must be a valid UUID'),
  body('displayOrder').optional().isInt({ min: 0 })
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const { relatedProductId, displayOrder } = req.body;

    // Check if source product exists
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    // Check if related product exists
    const relatedProduct = await prisma.product.findUnique({
      where: { id: relatedProductId }
    });

    if (!relatedProduct) {
      return res.status(404).json({
        error: 'Related product not found'
      });
    }

    // Prevent self-referencing
    if (id === relatedProductId) {
      return res.status(400).json({
        error: 'Cannot add a product as its own up-sell'
      });
    }

    // Check if relationship already exists
    const existingRelation = await prisma.upSellProduct.findUnique({
      where: {
        productId_relatedProductId: {
          productId: id,
          relatedProductId: relatedProductId
        }
      }
    });

    if (existingRelation) {
      return res.status(409).json({
        error: 'Up-sell relationship already exists'
      });
    }

    // Get the highest display order if not provided
    let finalDisplayOrder = displayOrder;
    if (displayOrder === undefined) {
      const maxOrder = await prisma.upSellProduct.findFirst({
        where: { productId: id },
        orderBy: { displayOrder: 'desc' }
      });
      finalDisplayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;
    }

    // Create up-sell relationship
    const upSell = await prisma.upSellProduct.create({
      data: {
        productId: id,
        relatedProductId: relatedProductId,
        displayOrder: finalDisplayOrder
      },
      include: {
        relatedProduct: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            slug: true,
            regularPrice: true,
            salePrice: true,
            images: {
              take: 1,
              where: {
                processingStatus: {
                  not: 'deleted'
                }
              },
              orderBy: { displayOrder: 'asc' }
            }
          }
        }
      }
    });

    res.status(201).json({
      message: 'Up-sell product added successfully',
      upSell
    });

  } catch (error) {
    console.error('Add up-sell product error:', error);
    res.status(500).json({
      error: 'Failed to add up-sell product',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/v1/products/:id/up-sell/:relatedProductId - Remove up-sell product
router.delete('/:id/up-sell/:relatedProductId', [
  param('id').isUUID(),
  param('relatedProductId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id, relatedProductId } = req.params;

    // Check if relationship exists
    const relation = await prisma.upSellProduct.findUnique({
      where: {
        productId_relatedProductId: {
          productId: id,
          relatedProductId: relatedProductId
        }
      }
    });

    if (!relation) {
      return res.status(404).json({
        error: 'Up-sell relationship not found'
      });
    }

    // Delete the relationship
    await prisma.upSellProduct.delete({
      where: {
        productId_relatedProductId: {
          productId: id,
          relatedProductId: relatedProductId
        }
      }
    });

    res.json({
      message: 'Up-sell product removed successfully'
    });

  } catch (error) {
    console.error('Remove up-sell product error:', error);
    res.status(500).json({
      error: 'Failed to remove up-sell product',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PATCH /api/v1/products/:id/up-sell/reorder - Reorder up-sell products
router.patch('/:id/up-sell/reorder', [
  param('id').isUUID(),
  body('orders').isArray().withMessage('Orders must be an array'),
  body('orders.*.relatedProductId').isUUID(),
  body('orders.*.displayOrder').isInt({ min: 0 })
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const { orders } = req.body;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    // Update display orders in a transaction
    await prisma.$transaction(
      orders.map(({ relatedProductId, displayOrder }) =>
        prisma.upSellProduct.updateMany({
          where: {
            productId: id,
            relatedProductId: relatedProductId
          },
          data: { displayOrder }
        })
      )
    );

    // Fetch updated up-sell products
    const upSellProducts = await prisma.upSellProduct.findMany({
      where: { productId: id },
      include: {
        relatedProduct: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            slug: true,
            regularPrice: true,
            salePrice: true,
            images: {
              take: 1,
              where: {
                processingStatus: {
                  not: 'deleted'
                }
              },
              orderBy: { displayOrder: 'asc' }
            }
          }
        }
      },
      orderBy: { displayOrder: 'asc' }
    });

    res.json({
      message: 'Up-sell products reordered successfully',
      upSellProducts
    });

  } catch (error) {
    console.error('Reorder up-sell products error:', error);
    res.status(500).json({
      error: 'Failed to reorder up-sell products',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// BULK PRODUCT OPERATIONS ENDPOINTS
// ============================================

// POST /api/v1/products/bulk - Batch create products (admin only)
router.post('/bulk', [
  body('products').isArray({ min: 1, max: 100 }).withMessage('Products array must contain 1-100 items'),
  body('products.*.sku').notEmpty().trim(),
  body('products.*.name').notEmpty().trim(),
  body('products.*.nameEn').notEmpty().trim(),
  body('products.*.slug').isSlug(),
  body('products.*.categories').isArray().withMessage('Categories must be an array'),
  body('products.*.brandId').isUUID(),
  body('products.*.regularPrice').isFloat({ min: 0 }),
  body('products.*.costPrice').isFloat({ min: 0 }),
  body('products.*.status').optional().isIn(['active', 'inactive', 'draft', 'published', 'archived', 'out_of_stock', 'discontinued']),
  body('products.*.visibility').optional().isIn(['public', 'private', 'restricted'])
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { products } = req.body;

    // Validate all products before creation
    const validationResults = [];
    const validProducts = [];
    const skus = products.map(p => p.sku);
    const slugs = products.map(p => p.slug);
    const categoryIds = [...new Set(products.flatMap(p => p.categories))];
    const brandIds = [...new Set(products.map(p => p.brandId))];

    // Check for duplicate SKUs in the batch
    const duplicateSkus = skus.filter((sku, index) => skus.indexOf(sku) !== index);
    if (duplicateSkus.length > 0) {
      return res.status(400).json({
        error: 'Duplicate SKUs in batch',
        duplicates: duplicateSkus
      });
    }

    // Check for duplicate slugs in the batch
    const duplicateSlugs = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
    if (duplicateSlugs.length > 0) {
      return res.status(400).json({
        error: 'Duplicate slugs in batch',
        duplicates: duplicateSlugs
      });
    }

    // Check if SKUs already exist in database
    const existingSkus = await prisma.product.findMany({
      where: { sku: { in: skus } },
      select: { sku: true }
    });

    if (existingSkus.length > 0) {
      return res.status(409).json({
        error: 'Some SKUs already exist',
        existingSkus: existingSkus.map(s => s.sku)
      });
    }

    // Check if slugs already exist in database
    const existingSlugs = await prisma.product.findMany({
      where: { slug: { in: slugs } },
      select: { slug: true }
    });

    if (existingSlugs.length > 0) {
      return res.status(409).json({
        error: 'Some slugs already exist',
        existingSlugs: existingSlugs.map(s => s.slug)
      });
    }

    // Check if all categories exist
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true }
    });

    if (categories.length !== categoryIds.length) {
      const missingCategories = categoryIds.filter(id => !categories.find(c => c.id === id));
      return res.status(404).json({
        error: 'Some categories not found',
        missingCategories
      });
    }

    // Check if all brands exist
    const brands = await prisma.brand.findMany({
      where: { id: { in: brandIds } },
      select: { id: true }
    });

    if (brands.length !== brandIds.length) {
      const missingBrands = brandIds.filter(id => !brands.find(b => b.id === id));
      return res.status(404).json({
        error: 'Some brands not found',
        missingBrands
      });
    }

    // Create products in a transaction
    const createdProducts = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const productData of products) {
        const product = await tx.product.create({
          data: {
            sku: productData.sku,
            name: productData.name,
            nameEn: productData.nameEn,
            nameBn: productData.nameBn || null,
            slug: productData.slug,
            shortDescription: productData.shortDescription || null,
            description: productData.description || null,
            brandId: productData.brandId,
            regularPrice: parseFloat(productData.regularPrice),
            salePrice: productData.salePrice ? parseFloat(productData.salePrice) : null,
            costPrice: parseFloat(productData.costPrice),
            taxRate: productData.taxRate ? parseFloat(productData.taxRate) : 0,
            stockQuantity: productData.stockQuantity || 0,
            lowStockThreshold: productData.lowStockThreshold || 10,
            status: productData.status || 'active',
            visibility: productData.visibility || 'public',
            metaTitle: productData.metaTitle || null,
            metaDescription: productData.metaDescription || null,
            metaKeywords: productData.metaKeywords || null,
            isFeatured: productData.isFeatured || false,
            isNewArrival: productData.isNewArrival || false,
            isBestSeller: productData.isBestSeller || false,
            warrantyPeriod: productData.warrantyPeriod || null,
            warrantyType: productData.warrantyType || null,
            publishedAt: productData.status === 'published' ? new Date() : null,
            categories: {
              create: productData.categories.map((categoryId, index) => ({
                categoryId,
                isPrimary: index === 0
              }))
            }
          },
          include: {
            categories: {
              include: {
                category: true
              }
            },
            brand: true
          }
        });
        results.push(product);
      }
      return results;
    });

    // Index products in Elasticsearch (non-blocking)
    if (elasticsearchConfig.isAvailable()) {
      const productIds = createdProducts.map(p => p.id);
      productIndexingService.indexProducts(productIds)
        .catch(error => {
          console.error('Failed to index products in Elasticsearch:', error);
        });
    }

    res.status(201).json({
      success: true,
      created: createdProducts.length,
      failed: 0,
      results: createdProducts.map(product => ({
        product,
        status: 'created'
      }))
    });

  } catch (error) {
    console.error('Bulk create products error:', error);
    res.status(500).json({
      error: 'Failed to create products in bulk',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /api/v1/products/bulk - Batch update products (admin only)
router.put('/bulk', [
  body('products').isArray({ min: 1, max: 100 }).withMessage('Products array must contain 1-100 items'),
  body('products.*.id').isUUID(),
  body('products.*.sku').optional().notEmpty().trim(),
  body('products.*.name').optional().notEmpty().trim(),
  body('products.*.nameEn').optional().notEmpty().trim(),
  body('products.*.slug').optional().isSlug(),
  body('products.*.categories').optional().isArray().withMessage('Categories must be an array'),
  body('products.*.brandId').optional({ checkFalsy: true }).isUUID(),
  body('products.*.regularPrice').optional().isFloat({ min: 0 }),
  body('products.*.salePrice').optional().isFloat({ min: 0 }),
  body('products.*.costPrice').optional().isFloat({ min: 0 }),
  body('products.*.status').optional().isIn(['active', 'inactive', 'draft', 'published', 'archived', 'out_of_stock', 'discontinued']),
  body('products.*.visibility').optional().isIn(['public', 'private', 'restricted'])
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { products } = req.body;

    const productIds = products.map(p => p.id);

    // Check if all products exist
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, sku: true, slug: true }
    });

    if (existingProducts.length !== productIds.length) {
      const missingIds = productIds.filter(id => !existingProducts.find(p => p.id === id));
      return res.status(404).json({
        error: 'Some products not found',
        missingIds
      });
    }

    // Check for SKU conflicts
    const skusToUpdate = products.filter(p => p.sku).map(p => ({ sku: p.sku, id: p.id }));
    if (skusToUpdate.length > 0) {
      const skuConflicts = await prisma.product.findMany({
        where: {
          sku: { in: skusToUpdate.map(s => s.sku) },
          NOT: { id: { in: productIds } }
        },
        select: { sku: true }
      });

      if (skuConflicts.length > 0) {
        return res.status(409).json({
          error: 'Some SKUs conflict with existing products',
          conflicts: skuConflicts.map(s => s.sku)
        });
      }
    }

    // Check for slug conflicts
    const slugsToUpdate = products.filter(p => p.slug).map(p => ({ slug: p.slug, id: p.id }));
    if (slugsToUpdate.length > 0) {
      const slugConflicts = await prisma.product.findMany({
        where: {
          slug: { in: slugsToUpdate.map(s => s.slug) },
          NOT: { id: { in: productIds } }
        },
        select: { slug: true }
      });

      if (slugConflicts.length > 0) {
        return res.status(409).json({
          error: 'Some slugs conflict with existing products',
          conflicts: slugConflicts.map(s => s.slug)
        });
      }
    }

    // Update products in a transaction
    const updatedProducts = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const productData of products) {
        const updateData = { ...productData };
        delete updateData.id;
        delete updateData.categories;

        // Handle categories if provided
        if (productData.categories !== undefined) {
          if (productData.categories.length === 0) {
            return res.status(400).json({
              error: 'At least one category is required'
            });
          }

          // Delete existing category associations
          await tx.productCategory.deleteMany({
            where: { productId: productData.id }
          });

          // Create new category associations
          await tx.productCategory.createMany({
            data: productData.categories.map((categoryId, index) => ({
              productId: productData.id,
              categoryId,
              isPrimary: index === 0
            }))
          });
        }

        // Update publishedAt if status changes to published
        if (updateData.status === 'published') {
          const existingProduct = existingProducts.find(p => p.id === productData.id);
          if (existingProduct && existingProduct.status !== 'published') {
            updateData.publishedAt = new Date();
          }
        }

        const product = await tx.product.update({
          where: { id: productData.id },
          data: updateData,
          include: {
            categories: {
              include: {
                category: true
              }
            },
            brand: true
          }
        });
        results.push(product);
      }
      return results;
    });

    // Reindex products in Elasticsearch (non-blocking)
    if (elasticsearchConfig.isAvailable()) {
      productIndexingService.indexProducts(productIds)
        .catch(error => {
          console.error('Failed to reindex products in Elasticsearch:', error);
        });
    }

    res.json({
      success: true,
      updated: updatedProducts.length,
      failed: 0,
      results: updatedProducts.map(product => ({
        product,
        status: 'updated'
      }))
    });

  } catch (error) {
    console.error('Bulk update products error:', error);
    res.status(500).json({
      error: 'Failed to update products in bulk',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/v1/products/bulk - Batch delete products (admin only)
router.delete('/bulk', [
  body('productIds').isArray({ min: 1, max: 100 }).withMessage('Product IDs array must contain 1-100 items'),
  body('productIds.*').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { productIds } = req.body;

    // Check if all products exist
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        images: true
      }
    });

    if (products.length !== productIds.length) {
      const missingIds = productIds.filter(id => !products.find(p => p.id === id));
      return res.status(404).json({
        error: 'Some products not found',
        missingIds
      });
    }

    // Delete products in a transaction
    const deletedProductIds = await prisma.$transaction(async (tx) => {
      // Delete product images from filesystem
      for (const product of products) {
        if (product.images.length > 0) {
          for (const image of product.images) {
            const imagePath = path.join(__dirname, '..', image.originalUrl);
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
            }
          }
        }
      }

      // Delete products (cascade will handle related records)
      await tx.product.deleteMany({
        where: { id: { in: productIds } }
      });

      return productIds;
    });

    // Remove products from Elasticsearch (non-blocking)
    if (elasticsearchConfig.isAvailable()) {
      for (const productId of deletedProductIds) {
        productIndexingService.deleteProduct(productId)
          .catch(error => {
            console.error('Failed to delete product from Elasticsearch:', error);
          });
      }
    }

    res.json({
      success: true,
      deleted: deletedProductIds.length,
      failed: 0,
      results: deletedProductIds.map(productId => ({
        productId,
        status: 'deleted'
      }))
    });

  } catch (error) {
    console.error('Bulk delete products error:', error);
    res.status(500).json({
      error: 'Failed to delete products in bulk',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PATCH /api/v1/products/bulk/status - Batch update product status (admin only)
router.patch('/bulk/status', [
  body('productIds').isArray({ min: 1, max: 100 }).withMessage('Product IDs array must contain 1-100 items'),
  body('productIds.*').isUUID(),
  body('status').isIn(['active', 'inactive', 'draft', 'published', 'archived', 'out_of_stock', 'discontinued'])
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { productIds, status } = req.body;

    // Check if all products exist
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, status: true }
    });

    if (existingProducts.length !== productIds.length) {
      const missingIds = productIds.filter(id => !existingProducts.find(p => p.id === id));
      return res.status(404).json({
        error: 'Some products not found',
        missingIds
      });
    }

    // Update products in a transaction
    const updatedProducts = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const productId of productIds) {
        const existingProduct = existingProducts.find(p => p.id === productId);
        const updateData = { status };

        // Update publishedAt if status changes to published
        if (status === 'published' && existingProduct.status !== 'published') {
          updateData.publishedAt = new Date();
        }

        const product = await tx.product.update({
          where: { id: productId },
          data: updateData
        });
        results.push(product);
      }
      return results;
    });

    // Reindex products in Elasticsearch (non-blocking)
    if (elasticsearchConfig.isAvailable()) {
      productIndexingService.indexProducts(productIds)
        .catch(error => {
          console.error('Failed to reindex products in Elasticsearch:', error);
        });
    }

    res.json({
      success: true,
      updated: updatedProducts.length,
      failed: 0
    });

  } catch (error) {
    console.error('Bulk update product status error:', error);
    res.status(500).json({
      error: 'Failed to update product status in bulk',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// CSV IMPORT/EXPORT ENDPOINTS
// ============================================

// POST /api/v1/products/import - Import products from CSV (admin only)
router.post('/import', [
  upload.single('file')
], authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No CSV file provided'
      });
    }

    // Check file type
    if (!req.file.mimetype.includes('csv') && !req.file.originalname.endsWith('.csv')) {
      return res.status(400).json({
        error: 'File must be a CSV'
      });
    }

    const csv = require('csv-parser');
    const fs = require('fs');
    const results = [];
    const errors = [];

    // Parse CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('error', reject)
        .on('end', resolve);
    });

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    if (results.length === 0) {
      return res.status(400).json({
        error: 'CSV file is empty'
      });
    }

    // Validate and import products
    const importedProducts = [];
    const failedRows = [];

    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      const rowNumber = i + 2; // +2 for header and 0-based index

      try {
        // Validate required fields
        if (!row.nameEn || !row.slug || !row.sku || !row.basePrice || !row.categoryId || !row.brandId) {
          failedRows.push({
            row: rowNumber,
            error: 'Missing required fields (nameEn, slug, sku, basePrice, categoryId, brandId)'
          });
          continue;
        }

        // Validate price
        const basePrice = parseFloat(row.basePrice);
        if (isNaN(basePrice) || basePrice < 0) {
          failedRows.push({
            row: rowNumber,
            error: 'Invalid basePrice'
          });
          continue;
        }

        // Validate discount price if provided
        let discountPrice = null;
        if (row.discountPrice) {
          discountPrice = parseFloat(row.discountPrice);
          if (isNaN(discountPrice) || discountPrice < 0) {
            failedRows.push({
              row: rowNumber,
              error: 'Invalid discountPrice'
            });
            continue;
          }
        }

        // Validate status
        const validStatuses = ['active', 'inactive', 'draft', 'published', 'archived', 'out_of_stock', 'discontinued'];
        const status = row.status || 'active';
        if (!validStatuses.includes(status)) {
          failedRows.push({
            row: rowNumber,
            error: 'Invalid status'
          });
          continue;
        }

        // Validate visibility
        const validVisibilities = ['public', 'private', 'restricted'];
        const visibility = row.visibility || 'public';
        if (!validVisibilities.includes(visibility)) {
          failedRows.push({
            row: rowNumber,
            error: 'Invalid visibility'
          });
          continue;
        }

        // Check if category exists
        const category = await prisma.category.findUnique({
          where: { id: row.categoryId }
        });

        if (!category) {
          failedRows.push({
            row: rowNumber,
            error: 'Category not found'
          });
          continue;
        }

        // Check if brand exists
        const brand = await prisma.brand.findUnique({
          where: { id: row.brandId }
        });

        if (!brand) {
          failedRows.push({
            row: rowNumber,
            error: 'Brand not found'
          });
          continue;
        }

        // Check if SKU already exists
        const existingSku = await prisma.product.findUnique({
          where: { sku: row.sku }
        });

        if (existingSku) {
          failedRows.push({
            row: rowNumber,
            error: 'SKU already exists'
          });
          continue;
        }

        // Check if slug already exists
        const existingSlug = await prisma.product.findUnique({
          where: { slug: row.slug }
        });

        if (existingSlug) {
          failedRows.push({
            row: rowNumber,
            error: 'Slug already exists'
          });
          continue;
        }

        // Create product
        const product = await prisma.product.create({
          data: {
            sku: row.sku,
            name: row.nameEn,
            nameEn: row.nameEn,
            nameBn: row.nameBn || null,
            slug: row.slug,
            shortDescription: row.shortDescription || null,
            description: row.descriptionEn || null,
            brandId: row.brandId,
            regularPrice: basePrice,
            salePrice: discountPrice,
            costPrice: basePrice * 0.7, // Default cost price as 70% of base price
            taxRate: row.taxRate ? parseFloat(row.taxRate) : 0,
            stockQuantity: row.stockQuantity ? parseInt(row.stockQuantity) : 0,
            lowStockThreshold: row.lowStockThreshold ? parseInt(row.lowStockThreshold) : 10,
            status,
            visibility,
            metaTitle: row.metaTitle || null,
            metaDescription: row.metaDescription || null,
            metaKeywords: row.metaKeywords || null,
            isFeatured: row.isFeatured === 'true' || row.isFeatured === true,
            isNewArrival: row.isNewArrival === 'true' || row.isNewArrival === true,
            isBestSeller: row.isBestSeller === 'true' || row.isBestSeller === true,
            warrantyPeriod: row.warrantyPeriod ? parseInt(row.warrantyPeriod) : null,
            warrantyType: row.warrantyType || null,
            publishedAt: status === 'published' ? new Date() : null,
            categories: {
              create: [
                {
                  categoryId: row.categoryId,
                  isPrimary: true
                }
              ]
            }
          }
        });

        importedProducts.push(product);

      } catch (error) {
        console.error(`Error importing row ${rowNumber}:`, error);
        failedRows.push({
          row: rowNumber,
          error: error.message
        });
      }
    }

    // Index imported products in Elasticsearch (non-blocking)
    if (elasticsearchConfig.isAvailable() && importedProducts.length > 0) {
      const productIds = importedProducts.map(p => p.id);
      productIndexingService.indexProducts(productIds)
        .catch(error => {
          console.error('Failed to index imported products in Elasticsearch:', error);
        });
    }

    res.json({
      success: true,
      imported: importedProducts.length,
      failed: failedRows.length,
      total: results.length,
      errors: failedRows
    });

  } catch (error) {
    console.error('Import products error:', error);
    res.status(500).json({
      error: 'Failed to import products',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/products/export - Export products to CSV (admin only)
router.get('/export', [
  query('categoryId').optional().isUUID(),
  query('brandId').optional().isUUID(),
  query('status').optional().isIn(['active', 'inactive', 'draft', 'published', 'archived', 'out_of_stock', 'discontinued']),
  query('limit').optional().isInt({ min: 1, max: 10000 })
], authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const {
      categoryId,
      brandId,
      status,
      limit = 1000
    } = req.query;

    const where = {};
    if (status) where.status = status;
    if (brandId) where.brandId = brandId;
    if (categoryId) {
      where.categories = {
        some: {
          categoryId: categoryId
        }
      };
    }

    const products = await prisma.product.findMany({
      where,
      take: parseInt(limit),
      include: {
        categories: {
          include: {
            category: {
              select: { id: true, name: true }
            }
          },
          where: { isPrimary: true },
          take: 1
        },
        brand: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Generate CSV
    const csvHeader = [
      'nameEn',
      'nameBn',
      'slug',
      'shortDescription',
      'descriptionEn',
      'descriptionBn',
      'basePrice',
      'discountPrice',
      'categoryId',
      'categoryName',
      'brandId',
      'brandName',
      'sku',
      'status',
      'visibility',
      'isFeatured',
      'isNewArrival',
      'isBestSeller',
      'stockQuantity',
      'lowStockThreshold',
      'taxRate',
      'warrantyPeriod',
      'warrantyType',
      'metaTitle',
      'metaDescription',
      'metaKeywords'
    ];

    const csvRows = products.map(product => {
      const primaryCategory = product.categories[0]?.category || {};
      return [
        product.nameEn || '',
        product.nameBn || '',
        product.slug || '',
        product.shortDescription || '',
        product.description || '',
        '',
        product.regularPrice || 0,
        product.salePrice || '',
        primaryCategory.id || '',
        primaryCategory.name || '',
        product.brandId || '',
        product.brand?.name || '',
        product.sku || '',
        product.status || '',
        product.visibility || '',
        product.isFeatured ? 'true' : 'false',
        product.isNewArrival ? 'true' : 'false',
        product.isBestSeller ? 'true' : 'false',
        product.stockQuantity || 0,
        product.lowStockThreshold || 10,
        product.taxRate || 0,
        product.warrantyPeriod || '',
        product.warrantyType || '',
        product.metaTitle || '',
        product.metaDescription || '',
        product.metaKeywords || ''
      ].map(field => {
        // Escape quotes and wrap in quotes if contains comma or quote
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

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="products-export-${Date.now()}.csv"`);

    res.send(csvContent);

  } catch (error) {
    console.error('Export products error:', error);
    res.status(500).json({
      error: 'Failed to export products',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// PRODUCT RELATED PRODUCTS ENDPOINTS
// ============================================

// POST /api/v1/products/:id/related - Add related product
router.post('/:id/related', [
  param('id').isUUID(),
  body('relatedProductId').isUUID().withMessage('Related product ID must be a valid UUID'),
  body('displayOrder').optional().isInt({ min: 0 })
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const { relatedProductId, displayOrder } = req.body;

    // Check if source product exists
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    // Check if related product exists
    const relatedProduct = await prisma.product.findUnique({
      where: { id: relatedProductId }
    });

    if (!relatedProduct) {
      return res.status(404).json({
        error: 'Related product not found'
      });
    }

    // Prevent self-referencing
    if (id === relatedProductId) {
      return res.status(400).json({
        error: 'Cannot add a product as its own related product'
      });
    }

    // Check if relationship already exists
    const existingRelation = await prisma.relatedProduct.findUnique({
      where: {
        productId_relatedProductId: {
          productId: id,
          relatedProductId: relatedProductId
        }
      }
    });

    if (existingRelation) {
      return res.status(409).json({
        error: 'Related product relationship already exists'
      });
    }

    // Get the highest display order if not provided
    let finalDisplayOrder = displayOrder;
    if (displayOrder === undefined) {
      const maxOrder = await prisma.relatedProduct.findFirst({
        where: { productId: id },
        orderBy: { displayOrder: 'desc' }
      });
      finalDisplayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;
    }

    // Create related product relationship
    const related = await prisma.relatedProduct.create({
      data: {
        productId: id,
        relatedProductId: relatedProductId,
        displayOrder: finalDisplayOrder
      },
      include: {
        relatedProduct: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            slug: true,
            regularPrice: true,
            salePrice: true,
            images: {
              take: 1,
              where: {
                processingStatus: {
                  not: 'deleted'
                }
              },
              orderBy: { displayOrder: 'asc' }
            }
          }
        }
      }
    });

    res.status(201).json({
      message: 'Related product added successfully',
      related
    });

  } catch (error) {
    console.error('Add related product error:', error);
    res.status(500).json({
      error: 'Failed to add related product',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/v1/products/:id/related/:relatedProductId - Remove related product
router.delete('/:id/related/:relatedProductId', [
  param('id').isUUID(),
  param('relatedProductId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id, relatedProductId } = req.params;

    // Check if relationship exists
    const relation = await prisma.relatedProduct.findUnique({
      where: {
        productId_relatedProductId: {
          productId: id,
          relatedProductId: relatedProductId
        }
      }
    });

    if (!relation) {
      return res.status(404).json({
        error: 'Related product relationship not found'
      });
    }

    // Delete the relationship
    await prisma.relatedProduct.delete({
      where: {
        productId_relatedProductId: {
          productId: id,
          relatedProductId: relatedProductId
        }
      }
    });

    res.json({
      message: 'Related product removed successfully'
    });

  } catch (error) {
    console.error('Remove related product error:', error);
    res.status(500).json({
      error: 'Failed to remove related product',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PATCH /api/v1/products/:id/reorder-related - Reorder related products
router.patch('/:id/reorder-related', [
  param('id').isUUID(),
  body('orders').isArray().withMessage('Orders must be an array'),
  body('orders.*.relatedProductId').isUUID(),
  body('orders.*.displayOrder').isInt({ min: 0 })
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const { orders } = req.body;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    // Update display orders in a transaction
    await prisma.$transaction(
      orders.map(({ relatedProductId, displayOrder }) =>
        prisma.relatedProduct.updateMany({
          where: {
            productId: id,
            relatedProductId: relatedProductId
          },
          data: { displayOrder }
        })
      )
    );

    // Fetch updated related products
    const relatedProducts = await prisma.relatedProduct.findMany({
      where: { productId: id },
      include: {
        relatedProduct: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            slug: true,
            regularPrice: true,
            salePrice: true,
            images: {
              take: 1,
              where: {
                processingStatus: {
                  not: 'deleted'
                }
              },
              orderBy: { displayOrder: 'asc' }
            }
          }
        }
      },
      orderBy: { displayOrder: 'asc' }
    });

    res.json({
      message: 'Related products reordered successfully',
      relatedProducts
    });

  } catch (error) {
    console.error('Reorder related products error:', error);
    res.status(500).json({
      error: 'Failed to reorder related products',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
