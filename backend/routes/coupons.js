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

// Get all coupons
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('isActive').optional().isBoolean(),
  query('search').optional().isString().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      isActive = true,
      search
    } = req.query;

    const skip = (page - 1) * limit;

    const where = isActive === 'false' ? {} : { isActive };
    
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.coupon.count({ where })
    ]);

    res.json({
      coupons,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({
      error: 'Failed to fetch coupons',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get coupon by ID
router.get('/:id', [
  param('id').isUUID()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        _count: {
          usedCount: true
        }
      }
    });

    if (!coupon) {
      return res.status(404).json({
        error: 'Coupon not found'
      });
    }

    res.json({ coupon });

  } catch (error) {
    console.error('Get coupon error:', error);
    res.status(500).json({
      error: 'Failed to fetch coupon',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get coupon by code
router.get('/code/:code', [
  param('code').isString().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const { code } = req.params;

    const coupon = await prisma.coupon.findUnique({
      where: { 
        code: code.toUpperCase(),
        isActive: true
      }
    });

    if (!coupon) {
      return res.status(404).json({
        error: 'Coupon not found'
      });
    }

    // Check if coupon is expired
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return res.status(400).json({
        error: 'Coupon has expired'
      });
    }

    // Check if usage limit reached
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        error: 'Coupon usage limit reached'
      });
    }

    res.json({ coupon });

  } catch (error) {
    console.error('Get coupon by code error:', error);
    res.status(500).json({
      error: 'Failed to fetch coupon',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create coupon (admin only)
router.post('/', [
  body('code').notEmpty().trim().toUpperCase(),
  body('name').notEmpty().trim(),
  body('type').isIn(['PERCENTAGE', 'FIXED_AMOUNT']),
  body('value').isFloat({ min: 0 }),
  body('minAmount').isFloat({ min: 0 }),
  body('maxDiscount').isFloat({ min: 0, max: 100 }),
  body('usageLimit').isInt({ min: 1 }),
  body('isActive').optional().isBoolean(),
  body('expiresAt').optional().isISO8601().toDate()
], handleValidationErrors, authMiddleware.adminOnly(), async (req, res) => {
  try {
    const couponData = req.body;

    // Check if code already exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: couponData.code }
    });

    if (existingCoupon) {
      return res.status(409).json({
        error: 'Coupon with this code already exists'
      });
    }

    const coupon = await prisma.coupon.create({
      data: {
        ...couponData,
        value: parseFloat(couponData.value),
        minAmount: parseFloat(couponData.minAmount),
        maxDiscount: parseFloat(couponData.maxDiscount),
        usageLimit: parseInt(couponData.usageLimit),
        isActive: couponData.isActive !== undefined ? couponData.isActive : true
      }
    });

    res.status(201).json({
      message: 'Coupon created successfully',
      coupon
    });

  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({
      error: 'Failed to create coupon',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update coupon (admin only)
router.put('/:id', [
  param('id').isUUID(),
  body('name').optional().notEmpty().trim(),
  body('type').optional().isIn(['PERCENTAGE', 'FIXED_AMOUNT']),
  body('value').optional().isFloat({ min: 0 }),
  body('minAmount').optional().isFloat({ min: 0 }),
  body('maxDiscount').optional().isFloat({ min: 0, max: 100 }),
  body('usageLimit').optional().isInt({ min: 1 }),
  body('isActive').optional().isBoolean(),
  body('expiresAt').optional().isISO8601().toDate()
], handleValidationErrors, authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if coupon exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id }
    });

    if (!existingCoupon) {
      return res.status(404).json({
        error: 'Coupon not found'
      });
    }

    // Clean update data
    const cleanUpdateData = {};
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        if (['value', 'minAmount', 'maxDiscount'].includes(key)) {
          cleanUpdateData[key] = parseFloat(updateData[key]);
        } else if (['usageLimit'].includes(key)) {
          cleanUpdateData[key] = parseInt(updateData[key]);
        } else {
          cleanUpdateData[key] = updateData[key];
        }
      }
    });

    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data: cleanUpdateData
    });

    res.json({
      message: 'Coupon updated successfully',
      coupon: updatedCoupon
    });

  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({
      error: 'Failed to update coupon',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete coupon (admin only)
router.delete('/:id', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if coupon exists
    const coupon = await prisma.coupon.findUnique({
      where: { id }
    });

    if (!coupon) {
      return res.status(404).json({
        error: 'Coupon not found'
      });
    }

    await prisma.coupon.delete({
      where: { id }
    });

    res.json({
      message: 'Coupon deleted successfully'
    });

  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({
      error: 'Failed to delete coupon',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;