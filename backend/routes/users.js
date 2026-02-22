const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const addressService = require('../services/addressService');

const router = express.Router();
const prisma = new PrismaClient();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('[VALIDATION ERROR] Request body:', JSON.stringify(req.body, null, 2));
    console.log('[VALIDATION ERROR] Validation errors:', JSON.stringify(errors.array(), null, 2));
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
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
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
  body('phone').optional().custom((value) => {
    // Custom validation for Bangladesh phone numbers
    if (!value) return true; // Optional field
    // Accept formats: +8801XXXXXXXXX, 01XXXXXXXXX, or landline
    const bdPhoneRegex = /^(\+880|0)?1[3-9]\d{8}$/;
    const landlineRegex = /^(\+880|0)?[2-9]\d{8,9}$/;
    return bdPhoneRegex.test(value.replace(/\s/g, '')) || landlineRegex.test(value.replace(/\s/g, ''));
  }).withMessage('Please enter a valid Bangladesh phone number'),
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
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
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
        suggestion: 'Consider deactivating user instead'
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

// Update existing address
router.put('/:id/addresses/:addressId', [
  param('id').isUUID(),
  param('addressId').isUUID(),
  (req, res, next) => {
    console.log('[ADDRESS UPDATE] ===== UPDATE ADDRESS DEBUG =====');
    console.log('[ADDRESS UPDATE] Request params:', req.params);
    console.log('[ADDRESS UPDATE] Request body:', JSON.stringify(req.body, null, 2));
    console.log('[ADDRESS UPDATE] Request body type:', typeof req.body);
    
    // Normalize enum values to lowercase to match database schema
    if (req.body.type) {
      req.body.type = req.body.type.toLowerCase();
    }
    if (req.body.division) {
      req.body.division = req.body.division.toLowerCase();
    }
    
    next();
  },
  body('type').optional().isIn(['shipping', 'billing', 'home', 'work', 'other']),
  body('firstName').optional().notEmpty().trim(),
  body('lastName').optional().notEmpty().trim(),
  body('phone').optional().custom((value) => {
    // Custom validation for Bangladesh phone numbers
    if (!value) return true; // Optional field
    // Accept formats: +8801XXXXXXXXX, 01XXXXXXXXX, or landline
    const bdPhoneRegex = /^(\+880|0)?1[3-9]\d{8}$/;
    const landlineRegex = /^(\+880|0)?[2-9]\d{8,9}$/;
    return bdPhoneRegex.test(value.replace(/\s/g, '')) || landlineRegex.test(value.replace(/\s/g, ''));
  }).withMessage('Please enter a valid Bangladesh phone number'),
  body('address').optional().notEmpty().trim(),
  body('addressLine2').optional().trim(),
  body('city').optional().notEmpty().trim(),
  body('district').optional().notEmpty().trim(),
  body('division').optional().isIn(['dhaka', 'chittagong', 'rajshahi', 'sylhet', 'khulna', 'barishal', 'rangpur', 'mymensingh']),
  body('upazila').optional().notEmpty().trim(),
  body('postalCode').optional().matches(/^\d{4}$/).withMessage('Postal code must be 4 digits'),
  body('isDefault').optional().isBoolean()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    console.log('[ADDRESS UPDATE] ===== UPDATE ADDRESS DEBUG =====');
    console.log('[ADDRESS UPDATE] Request params:', req.params);
    console.log('[ADDRESS UPDATE] Request body:', JSON.stringify(req.body, null, 2));
    console.log('[ADDRESS UPDATE] Request body type:', typeof req.body);
    
    const { id, addressId } = req.params;
    const { type, firstName, lastName, phone, address, addressLine2, city, district, division, upazila, postalCode, isDefault } = req.body;
    
    console.log('[ADDRESS UPDATE] Parsed values:', { id, addressId, type, firstName, lastName, phone, address, addressLine2, city, district, division, upazila, postalCode, isDefault });

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

// ==================== Address Management Integration Endpoints ====================

/**
 * GET /api/v1/users/:id/addresses/checkout/:type
 * Get addresses for checkout by type
 */
router.get('/:id/addresses/checkout/:type', [
  param('id').isUUID(),
  param('type').isIn(['shipping', 'billing', 'home', 'work', 'other'])
], handleValidationErrors, authMiddleware.authenticate(), (req, res, next) => {
  const userId = req.params.id;
  return authMiddleware.selfOrAdmin(userId)(req, res, next);
}, async (req, res) => {
  try {
    const { id, type } = req.params;

    const addresses = await addressService.getAddressesForCheckout(id, type);

    // Add cache control headers to prevent caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.json({
      addresses,
      type,
      count: addresses.length
    });

  } catch (error) {
    console.error('Get addresses for checkout error:', error);
    if (error.message === 'Invalid address type') {
      return res.status(400).json({
        error: 'Invalid address type',
        message: error.message
      });
    }
    res.status(500).json({
      error: 'Failed to fetch addresses for checkout',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/v1/users/:id/addresses/checkout
 * Create address during checkout
 */
router.post('/:id/addresses/checkout', [
  param('id').isUUID(),
  (req, res, next) => {
    // Normalize enum values to lowercase
    if (req.body.type) {
      req.body.type = req.body.type.toLowerCase();
    }
    if (req.body.division) {
      req.body.division = req.body.division.toLowerCase();
    }
    next();
  },
  body('type').optional().isIn(['shipping', 'billing', 'home', 'work', 'other']),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('phone').optional().trim(),
  body('address').notEmpty().trim(),
  body('addressLine2').optional().trim(),
  body('city').notEmpty().trim(),
  body('district').notEmpty().trim(),
  body('division').optional().trim(),
  body('upazila').optional().trim(),
  body('postalCode').optional().trim(),
  body('isDefault').optional().isBoolean()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const addressData = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const newAddress = await addressService.createAddressForCheckout(id, addressData);

    res.status(201).json({
      message: 'Address created successfully',
      address: newAddress
    });

  } catch (error) {
    console.error('Create address for checkout error:', error);
    if (error.validationErrors) {
      return res.status(400).json({
        error: 'Address validation failed',
        details: error.validationErrors
      });
    }
    res.status(500).json({
      error: 'Failed to create address',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * PUT /api/v1/users/:id/addresses/:addressId/checkout
 * Update address during checkout
 */
router.put('/:id/addresses/:addressId/checkout', [
  param('id').isUUID(),
  param('addressId').isUUID(),
  (req, res, next) => {
    // Normalize enum values to lowercase
    if (req.body.type) {
      req.body.type = req.body.type.toLowerCase();
    }
    if (req.body.division) {
      req.body.division = req.body.division.toLowerCase();
    }
    next();
  },
  body('type').optional().isIn(['shipping', 'billing', 'home', 'work', 'other']),
  body('firstName').optional().notEmpty().trim(),
  body('lastName').optional().notEmpty().trim(),
  body('phone').optional().trim(),
  body('address').optional().notEmpty().trim(),
  body('addressLine2').optional().trim(),
  body('city').optional().notEmpty().trim(),
  body('district').optional().notEmpty().trim(),
  body('division').optional().trim(),
  body('upazila').optional().trim(),
  body('postalCode').optional().trim(),
  body('isDefault').optional().isBoolean()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id, addressId } = req.params;
    const addressData = req.body;

    const updatedAddress = await addressService.updateAddressForCheckout(id, addressId, addressData);

    res.json({
      message: 'Address updated successfully',
      address: updatedAddress
    });

  } catch (error) {
    console.error('Update address for checkout error:', error);
    if (error.message === 'Address not found') {
      return res.status(404).json({
        error: 'Address not found'
      });
    }
    if (error.message === 'Access denied') {
      return res.status(403).json({
        error: 'Access denied'
      });
    }
    if (error.validationErrors) {
      return res.status(400).json({
        error: 'Address validation failed',
        details: error.validationErrors
      });
    }
    res.status(500).json({
      error: 'Failed to update address',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * PUT /api/v1/users/:id/addresses/:addressId/default/:type
 * Set default address by type
 */
router.put('/:id/addresses/:addressId/default/:type', [
  param('id').isUUID(),
  param('addressId').isUUID(),
  param('type').isIn(['shipping', 'billing', 'home', 'work', 'other'])
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id, addressId, type } = req.params;

    const updatedAddress = await addressService.setDefaultAddress(id, addressId, type);

    res.json({
      message: 'Default address set successfully',
      address: updatedAddress
    });

  } catch (error) {
    console.error('Set default address by type error:', error);
    if (error.message === 'Address not found') {
      return res.status(404).json({
        error: 'Address not found'
      });
    }
    if (error.message === 'Access denied') {
      return res.status(403).json({
        error: 'Access denied'
      });
    }
    if (error.message === 'Invalid address type') {
      return res.status(400).json({
        error: 'Invalid address type',
        message: error.message
      });
    }
    res.status(500).json({
      error: 'Failed to set default address',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/v1/addresses/validate
 * Validate address data (supports both authenticated and guest users)
 */
router.get('/addresses/validate', [
  query('type').optional().isIn(['shipping', 'billing', 'home', 'work', 'other']),
  query('firstName').optional().notEmpty().trim(),
  query('lastName').optional().notEmpty().trim(),
  query('phone').optional().trim(),
  query('address').optional().notEmpty().trim(),
  query('addressLine2').optional().trim(),
  query('city').optional().notEmpty().trim(),
  query('district').optional().notEmpty().trim(),
  query('division').optional().trim(),
  query('upazila').optional().trim(),
  query('postalCode').optional().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const addressData = req.query;

    // Validate address using service
    const validation = addressService.validateBangladeshAddress(addressData);

    if (validation.isValid) {
      res.json({
        isValid: true,
        message: 'Address is valid',
        messageBn: 'ঠিকানাটি সঠিক আছে',
        validatedAddress: validation.validatedAddress
      });
    } else {
      res.status(400).json({
        isValid: false,
        message: 'Address validation failed',
        messageBn: 'ঠিকানা যাচাই ব্যর্থ হয়েছে',
        errors: validation.errors
      });
    }

  } catch (error) {
    console.error('Validate address error:', error);
    res.status(500).json({
      error: 'Failed to validate address',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/v1/addresses/validate
 * Validate address data via POST (supports both authenticated and guest users)
 */
router.post('/addresses/validate', [
  body('type').optional().isIn(['shipping', 'billing', 'home', 'work', 'other']),
  body('firstName').optional().notEmpty().trim(),
  body('lastName').optional().notEmpty().trim(),
  body('phone').optional().trim(),
  body('address').optional().notEmpty().trim(),
  body('addressLine2').optional().trim(),
  body('city').optional().notEmpty().trim(),
  body('district').optional().notEmpty().trim(),
  body('division').optional().trim(),
  body('upazila').optional().trim(),
  body('postalCode').optional().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const addressData = req.body;

    // Normalize enum values to lowercase
    if (addressData.type) {
      addressData.type = addressData.type.toLowerCase();
    }
    if (addressData.division) {
      addressData.division = addressData.division.toLowerCase();
    }

    // Validate address using service
    const validation = addressService.validateBangladeshAddress(addressData);

    if (validation.isValid) {
      res.json({
        isValid: true,
        message: 'Address is valid',
        messageBn: 'ঠিকানাটি সঠিক আছে',
        validatedAddress: validation.validatedAddress
      });
    } else {
      res.status(400).json({
        isValid: false,
        message: 'Address validation failed',
        messageBn: 'ঠিকানা যাচাই ব্যর্থ হয়েছে',
        errors: validation.errors
      });
    }

  } catch (error) {
    console.error('Validate address error:', error);
    res.status(500).json({
      error: 'Failed to validate address',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ==================== Enhanced Address Endpoints ====================

/**
 * Enhanced GET /api/v1/users/:id/addresses
 * Get user addresses with filtering and pagination
 */
router.get('/:id/addresses', [
  param('id').isUUID(),
  query('type').optional().isIn(['shipping', 'billing', 'home', 'work', 'other']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, authMiddleware.authenticate(), (req, res, next) => {
  const userId = req.params.id;
  return authMiddleware.selfOrAdmin(userId)(req, res, next);
}, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, page, limit } = req.query;

    const result = await addressService.getUserAddresses(id, { type, page, limit });

    // Add cache control headers to prevent caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.json(result);

  } catch (error) {
    console.error('Get user addresses error:', error);
    if (error.message === 'Invalid address type') {
      return res.status(400).json({
        error: 'Invalid address type',
        message: error.message
      });
    }
    res.status(500).json({
      error: 'Failed to fetch addresses',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ==================== RBAC User Management Endpoints ====================

/**
 * Create admin user (SUPER_ADMIN only)
 * Creates a new admin user with both legacy role and RBAC ADMIN role
 */
router.post('/create-admin', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').notEmpty().trim().withMessage('First name is required'),
  body('lastName').notEmpty().trim().withMessage('Last name is required')
], handleValidationErrors, authMiddleware.authenticate(), async (req, res, next) => {
  try {
    // Check if user has SUPER_ADMIN RBAC role
    if (!req.user.rbacRoles || !req.user.rbacRoles.some(r => r.role_name === 'SUPER_ADMIN')) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'SUPER_ADMIN role is required to create admin users'
      });
    }

    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this email already exists'
      });
    }

    // Check if RBAC ADMIN role exists
    const adminRole = await prisma.roles.findUnique({
      where: { name: 'ADMIN' }
    });

    if (!adminRole) {
      return res.status(500).json({
        error: 'RBAC configuration error',
        message: 'ADMIN role not found in RBAC system'
      });
    }

    // Hash password
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with legacy admin role
    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        firstName,
        lastName,
        role: 'admin',
        status: 'active',
        emailVerified: new Date(),
        phoneVerified: null
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true
      }
    });

    // Assign RBAC ADMIN role
    const userRole = await prisma.user_roles.create({
      data: {
        user_id: user.id,
        role_id: adminRole.id,
        assigned_by: req.user.id,
        is_active: true
      }
    });

    // Log role assignment for audit trail
    console.log('[ADMIN CREATION] Admin user created:', {
      createdBy: req.user.email,
      newUserEmail: email,
      newUserId: user.id,
      rbacRoleId: adminRole.id,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      message: 'Admin user created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
      },
      rbacRole: {
        id: userRole.id,
        role: 'ADMIN',
        assignedBy: req.user.email,
        assignedAt: userRole.assigned_at
      }
    });

  } catch (error) {
    console.error('Create admin user error:', error);
    res.status(500).json({
      error: 'Failed to create admin user',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Assign RBAC role to user (ADMIN or SUPER_ADMIN only)
 * Assigns an RBAC role to an existing user
 */
router.post('/:userId/roles', [
  param('userId').isUUID().withMessage('Invalid user ID'),
  body('role').notEmpty().withMessage('Role is required'),
  body('role').isIn(['CUSTOMER', 'ADMIN', 'SUPER_ADMIN', 'SUPPORT', 'MANAGER']).withMessage('Invalid role'),
  body('expiresAt').optional().isISO8601().withMessage('Invalid expiration date format')
], handleValidationErrors, authMiddleware.authenticate(), async (req, res, next) => {
  try {
    // Check if user has ADMIN or SUPER_ADMIN RBAC role
    if (!req.user.rbacRoles || !req.user.rbacRoles.some(r => r.role_name === 'ADMIN' || r.role_name === 'SUPER_ADMIN')) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'ADMIN or SUPER_ADMIN role is required to assign roles'
      });
    }

    const { userId } = req.params;
    const { role, expiresAt } = req.body;

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    if (!targetUser) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The specified user does not exist'
      });
    }

    // Check if RBAC role exists
    const targetRole = await prisma.roles.findUnique({
      where: { name: role }
    });

    if (!targetRole) {
      return res.status(404).json({
        error: 'Role not found',
        message: `RBAC role '${role}' not found`
      });
    }

    // Check if assigner has sufficient hierarchy level
    const assignerMaxLevel = req.user.rbacRoleLevel || 0;
    if (assignerMaxLevel <= targetRole.hierarchy_level) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You cannot assign a role with equal or higher level than your own'
      });
    }

    // Check if role assignment already exists
    const existingUserRole = await prisma.user_roles.findFirst({
      where: {
        user_id: userId,
        role_id: targetRole.id,
        is_active: true
      }
    });

    if (existingUserRole) {
      return res.status(409).json({
        error: 'Role already assigned',
        message: 'This role is already assigned to the user'
      });
    }

    // Parse expiration date
    let expiresAtDate = null;
    if (expiresAt) {
      expiresAtDate = new Date(expiresAt);
      if (isNaN(expiresAtDate.getTime())) {
        return res.status(400).json({
          error: 'Invalid date',
          message: 'Expiration date must be a valid ISO 8601 date'
        });
      }

      if (expiresAtDate <= new Date()) {
        return res.status(400).json({
          error: 'Invalid date',
          message: 'Expiration date must be in the future'
        });
      }
    }

    // Assign RBAC role
    const userRole = await prisma.user_roles.create({
      data: {
        user_id: userId,
        role_id: targetRole.id,
        assigned_by: req.user.id,
        expires_at: expiresAtDate,
        is_active: true
      }
    });

    // Log role assignment for audit trail
    console.log('[ROLE ASSIGNMENT] RBAC role assigned:', {
      assignedBy: req.user.email,
      assignedTo: targetUser.email,
      role: role,
      roleId: targetRole.id,
      expiresAt: expiresAtDate ? expiresAtDate.toISOString() : null,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      message: 'Role assigned successfully',
      userRole: {
        id: userRole.id,
        userId: userId,
        roleId: targetRole.id,
        roleName: role,
        assignedBy: req.user.email,
        assignedAt: userRole.assigned_at,
        expiresAt: userRole.expires_at,
        isActive: userRole.is_active
      }
    });

  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({
      error: 'Failed to assign role',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Remove RBAC role from user (ADMIN or SUPER_ADMIN only)
 * Removes an RBAC role assignment from a user
 */
router.delete('/:userId/roles/:roleId', [
  param('userId').isUUID().withMessage('Invalid user ID'),
  param('roleId').isUUID().withMessage('Invalid role ID')
], handleValidationErrors, authMiddleware.authenticate(), async (req, res, next) => {
  try {
    // Check if user has ADMIN or SUPER_ADMIN RBAC role
    if (!req.user.rbacRoles || !req.user.rbacRoles.some(r => r.role_name === 'ADMIN' || r.role_name === 'SUPER_ADMIN')) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'ADMIN or SUPER_ADMIN role is required to remove roles'
      });
    }

    const { userId, roleId } = req.params;

    // Check if user role assignment exists
    const userRole = await prisma.user_roles.findFirst({
      where: {
        id: roleId,
        user_id: userId
      },
      include: {
        roles: true,
        users: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!userRole) {
      return res.status(404).json({
        error: 'Role assignment not found',
        message: 'The specified role assignment does not exist'
      });
    }

    // Check if assigner has sufficient hierarchy level
    const assignerMaxLevel = req.user.rbacRoleLevel || 0;
    if (assignerMaxLevel <= userRole.roles.hierarchy_level) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You cannot remove a role with equal or higher level than your own'
      });
    }

    // Deactivate role instead of deleting (for audit trail)
    const deactivatedRole = await prisma.user_roles.update({
      where: { id: roleId },
      data: {
        is_active: false
      },
      select: {
        id: true,
        user_id: true,
        role_id: true,
        assigned_by: true,
        assigned_at: true,
        is_active: true
      }
    });

    // Log role removal for audit trail
    console.log('[ROLE REMOVAL] RBAC role deactivated:', {
      removedBy: req.user.email,
      removedFrom: userRole.users.email,
      roleId: roleId,
      roleName: userRole.roles.name,
      timestamp: new Date().toISOString()
    });

    res.json({
      message: 'Role removed successfully',
      userRole: {
        id: deactivatedRole.id,
        userId: deactivatedRole.user_id,
        roleId: deactivatedRole.role_id,
        roleName: userRole.roles.name,
        removedBy: req.user.email,
        isActive: deactivatedRole.is_active
      }
    });

  } catch (error) {
    console.error('Remove role error:', error);
    res.status(500).json({
      error: 'Failed to remove role',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
