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

// Get all users (admin only)
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString().trim()
], handleValidationErrors, authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            orders: true,
            reviews: true
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get user by ID
router.get('/:id', [
  param('id').isUUID()
], handleValidationErrors, (req, res, next) => {
  // Extract id from params and use it for selfOrAdmin middleware
  const userId = req.params.id;
  return authMiddleware.selfOrAdmin(userId)(req, res, next);
}, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        role: true,
        status: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        addresses: true,
        _count: {
          orders: true,
          reviews: true
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to fetch user',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update user profile
router.put('/:id', [
  param('id').isUUID(),
  body('firstName').optional().notEmpty().trim(),
  body('lastName').optional().notEmpty().trim(),
  body('phone').optional().isMobilePhone('any'),
  body('dateOfBirth').optional().isISO8601().toDate(),
  body('gender').optional().isIn(['MALE', 'FEMALE', 'OTHER'])
], handleValidationErrors, (req, res, next) => {
  // Extract id from params and use it for selfOrAdmin middleware
  const userId = req.params.id;
  return authMiddleware.selfOrAdmin(userId)(req, res, next);
}, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, dateOfBirth, gender } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Check if phone is already used by another user
    if (phone && phone !== existingUser.phone) {
      const phoneUser = await prisma.user.findFirst({
        where: { phone, NOT: { id } }
      });

      if (phoneUser) {
        return res.status(409).json({
          error: 'Phone number already exists'
        });
      }
    }

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (gender !== undefined) updateData.gender = gender;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        role: true,
        status: true,
        image: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: 'Failed to update user',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete user (admin only)
router.delete('/:id', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
            reviews: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Check if user has orders (prevent deletion if they do)
    if (user._count.orders > 0) {
      return res.status(400).json({
        error: 'Cannot delete user with existing orders',
        suggestion: 'Consider deactivating the user instead'
      });
    }

    await prisma.user.delete({
      where: { id }
    });

    res.json({
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get user addresses
router.get('/:id/addresses', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), (req, res, next) => {
  // Extract id from params and use it for selfOrAdmin middleware
  const userId = req.params.id;
  return authMiddleware.selfOrAdmin(userId)(req, res, next);
}, async (req, res) => {
  try {
    const { id } = req.params;

    const addresses = await prisma.address.findMany({
      where: { userId: id },
      orderBy: { isDefault: 'desc' }
    });

    res.json({ addresses });

  } catch (error) {
    console.error('Get user addresses error:', error);
    res.status(500).json({
      error: 'Failed to fetch addresses',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create new address
router.post('/:id/addresses', [
  param('id').isUUID(),
  body('type').optional().isIn(['SHIPPING', 'BILLING']),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('phone').optional().isMobilePhone('any'),
  body('address').notEmpty().trim(),
  body('addressLine2').optional().trim(),
  body('city').notEmpty().trim(),
  body('district').notEmpty().trim(),
  body('division').isIn(['DHAKA', 'CHITTAGONG', 'RAJSHAHI', 'SYLHET', 'KHULNA', 'BARISHAL', 'RANGPUR', 'MYMENSINGH']),
  body('upazila').optional().trim(),
  body('postalCode').optional().matches(/^\d{4}$/).withMessage('Postal code must be 4 digits'),
  body('isDefault').optional().isBoolean()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { type, firstName, lastName, phone, address, addressLine2, city, district, division, upazila, postalCode, isDefault } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // If isDefault is true, set all other addresses to false
    if (isDefault === true) {
      await prisma.address.updateMany({
        where: { userId: id },
        data: { isDefault: false }
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: id,
        type: type || 'SHIPPING',
        firstName,
        lastName,
        phone,
        address,
        addressLine2,
        city,
        district,
        division,
        upazila,
        postalCode,
        isDefault: isDefault || false
      }
    });

    res.status(201).json({
      message: 'Address created successfully',
      address: newAddress
    });

  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({
      error: 'Failed to create address',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update existing address
router.put('/:id/addresses/:addressId', [
  param('id').isUUID(),
  param('addressId').isUUID(),
  body('type').optional().isIn(['SHIPPING', 'BILLING']),
  body('firstName').optional().notEmpty().trim(),
  body('lastName').optional().notEmpty().trim(),
  body('phone').optional().isMobilePhone('any'),
  body('address').optional().notEmpty().trim(),
  body('addressLine2').optional().trim(),
  body('city').optional().notEmpty().trim(),
  body('district').optional().notEmpty().trim(),
  body('division').optional().isIn(['DHAKA', 'CHITTAGONG', 'RAJSHAHI', 'SYLHET', 'KHULNA', 'BARISHAL', 'RANGPUR', 'MYMENSINGH']),
  body('upazila').optional().trim(),
  body('postalCode').optional().matches(/^\d{4}$/).withMessage('Postal code must be 4 digits'),
  body('isDefault').optional().isBoolean()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id, addressId } = req.params;
    const { type, firstName, lastName, phone, address, addressLine2, city, district, division, upazila, postalCode, isDefault } = req.body;

    // Check if address exists and belongs to user
    const existingAddress = await prisma.address.findUnique({
      where: { id: addressId }
    });

    if (!existingAddress) {
      return res.status(404).json({
        error: 'Address not found'
      });
    }

    if (existingAddress.userId !== id) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    // If isDefault is true, set all other addresses to false
    if (isDefault === true) {
      await prisma.address.updateMany({
        where: { userId: id, NOT: { id: addressId } },
        data: { isDefault: false }
      });
    }

    const updateData = {};
    if (type !== undefined) updateData.type = type;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (addressLine2 !== undefined) updateData.addressLine2 = addressLine2;
    if (city !== undefined) updateData.city = city;
    if (district !== undefined) updateData.district = district;
    if (division !== undefined) updateData.division = division;
    if (upazila !== undefined) updateData.upazila = upazila;
    if (postalCode !== undefined) updateData.postalCode = postalCode;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: updateData
    });

    res.json({
      message: 'Address updated successfully',
      address: updatedAddress
    });

  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      error: 'Failed to update address',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete address
router.delete('/:id/addresses/:addressId', [
  param('id').isUUID(),
  param('addressId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id, addressId } = req.params;

    // Check if address exists and belongs to user
    const existingAddress = await prisma.address.findUnique({
      where: { id: addressId },
      include: {
        _count: {
          select: {
            orders: true
          }
        }
      }
    });

    if (!existingAddress) {
      return res.status(404).json({
        error: 'Address not found'
      });
    }

    if (existingAddress.userId !== id) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    // Check if address is used in orders
    if (existingAddress._count.orders > 0) {
      return res.status(400).json({
        error: 'Cannot delete address that is used in orders',
        suggestion: 'This address is referenced by existing orders and cannot be deleted'
      });
    }

    await prisma.address.delete({
      where: { id: addressId }
    });

    res.json({
      message: 'Address deleted successfully'
    });

  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      error: 'Failed to delete address',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Set default address
router.put('/:id/addresses/:addressId/default', [
  param('id').isUUID(),
  param('addressId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id, addressId } = req.params;

    // Check if address exists and belongs to user
    const existingAddress = await prisma.address.findUnique({
      where: { id: addressId }
    });

    if (!existingAddress) {
      return res.status(404).json({
        error: 'Address not found'
      });
    }

    if (existingAddress.userId !== id) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    // Set all other addresses to false and this one to true
    await prisma.$transaction([
      prisma.address.updateMany({
        where: { userId: id, NOT: { id: addressId } },
        data: { isDefault: false }
      }),
      prisma.address.update({
        where: { id: addressId },
        data: { isDefault: true }
      })
    ]);

    const updatedAddress = await prisma.address.findUnique({
      where: { id: addressId }
    });

    res.json({
      message: 'Default address set successfully',
      address: updatedAddress
    });

  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({
      error: 'Failed to set default address',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;