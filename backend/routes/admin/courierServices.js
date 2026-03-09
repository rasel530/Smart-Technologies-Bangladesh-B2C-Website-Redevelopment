/**
 * Courier Service Management Routes
 * CRUD operations for courier services
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../../middleware/auth');
const { transformCourierService, transformPaginatedResponse, transformSingleResponse, transformErrorResponse } = require('../../utils/dataTransformers');

const router = express.Router();
const prisma = new PrismaClient();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * GET /api/v1/admin/courier-services
 * Get all courier services with filters and pagination
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('isActive').optional().isBoolean(),
  query('search').optional().isString()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      isActive, 
      search 
    } = req.query;

    const where = {};
    
    // Filter by active status
    if (isActive !== undefined) {
      where.is_active = isActive === 'true' || isActive === true;
    }

    // Search by name or code
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get courier services
    const [courierServices, total] = await Promise.all([
      prisma.courier_services.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { created_at: 'desc' }
      }),
      prisma.courier_services.count({ where })
    ]);

    // Transform response
    const response = transformPaginatedResponse(
      courierServices,
      { page, limit, total },
      transformCourierService
    );

    res.json(response);

  } catch (error) {
    console.error('[Courier Services] Get all error:', error);
    const errorResponse = transformErrorResponse(
      'Failed to fetch courier services',
      error.message,
      500
    );
    res.status(500).json(errorResponse);
  }
});

/**
 * GET /api/v1/admin/courier-services/:id
 * Get a single courier service by ID
 */
router.get('/:id', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;

    const courierService = await prisma.courier_services.findUnique({
      where: { id }
    });

    if (!courierService) {
      const errorResponse = transformErrorResponse(
        'Courier service not found',
        null,
        404
      );
      return res.status(404).json(errorResponse);
    }

    // Transform response
    const response = transformSingleResponse(courierService, transformCourierService);
    res.json(response);

  } catch (error) {
    console.error('[Courier Services] Get by ID error:', error);
    const errorResponse = transformErrorResponse(
      'Failed to fetch courier service',
      error.message,
      500
    );
    res.status(500).json(errorResponse);
  }
});

/**
 * POST /api/v1/admin/courier-services
 * Create a new courier service
 */
router.post('/', [
  body('name').isString().trim().notEmpty(),
  body('code').isString().trim().notEmpty(),
  body('description').optional().isString(),
  body('website').optional().isURL(),
  body('trackingUrl').optional().isURL(),
  body('isActive').optional().isBoolean(),
  body('deliveryTime').optional().isString(),
  body('baseRate').optional().isNumeric(),
  body('ratePerKg').optional().isNumeric(),
  body('contactEmail').optional().isEmail(),
  body('contactPhone').optional().isString()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { 
      name, 
      code, 
      description, 
      website, 
      trackingUrl, 
      isActive = true, 
      deliveryTime, 
      baseRate, 
      ratePerKg, 
      contactEmail, 
      contactPhone 
    } = req.body;

    // Check if courier service with same code already exists
    const existing = await prisma.courier_services.findUnique({
      where: { code }
    });

    if (existing) {
      const errorResponse = transformErrorResponse(
        'Courier service with this code already exists',
        null,
        400
      );
      return res.status(400).json(errorResponse);
    }

    // Create courier service
    const courierService = await prisma.courier_services.create({
      data: {
        name,
        code,
        description,
        website,
        trackingUrl,
        is_active: isActive,
        deliveryTime,
        baseRate: baseRate ? parseFloat(baseRate) : null,
        ratePerKg: ratePerKg ? parseFloat(ratePerKg) : null,
        contactEmail,
        contactPhone
      }
    });

    // Transform response
    const response = transformSingleResponse(courierService, transformCourierService);
    res.status(201).json(response);

  } catch (error) {
    console.error('[Courier Services] Create error:', error);
    const errorResponse = transformErrorResponse(
      'Failed to create courier service',
      error.message,
      500
    );
    res.status(500).json(errorResponse);
  }
});

/**
 * PUT /api/v1/admin/courier-services/:id
 * Update an existing courier service
 */
router.put('/:id', [
  param('id').isUUID(),
  body('name').optional().isString().trim().notEmpty(),
  body('code').optional().isString().trim().notEmpty(),
  body('description').optional().isString(),
  body('website').optional().isURL(),
  body('trackingUrl').optional().isURL(),
  body('isActive').optional().isBoolean(),
  body('deliveryTime').optional().isString(),
  body('baseRate').optional().isNumeric(),
  body('ratePerKg').optional().isNumeric(),
  body('contactEmail').optional().isEmail(),
  body('contactPhone').optional().isString()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      code, 
      description, 
      website, 
      trackingUrl, 
      isActive, 
      deliveryTime, 
      baseRate, 
      ratePerKg, 
      contactEmail, 
      contactPhone 
    } = req.body;

    // Check if courier service exists
    const existing = await prisma.courier_services.findUnique({
      where: { id }
    });

    if (!existing) {
      const errorResponse = transformErrorResponse(
        'Courier service not found',
        null,
        404
      );
      return res.status(404).json(errorResponse);
    }

    // Check if new code conflicts with another courier service
    if (code && code !== existing.code) {
      const codeConflict = await prisma.courier_services.findUnique({
        where: { code }
      });

      if (codeConflict) {
        const errorResponse = transformErrorResponse(
          'Courier service with this code already exists',
          null,
          400
        );
        return res.status(400).json(errorResponse);
      }
    }

    // Build update data
    const updatedAta = {};
    if (name !== undefined) updatedAta.name = name;
    if (code !== undefined) updatedAta.code = code;
    if (description !== undefined) updatedAta.description = description;
    if (website !== undefined) updatedAta.website = website;
    if (trackingUrl !== undefined) updatedAta.trackingUrl = trackingUrl;
    if (isActive !== undefined) updatedAta.is_active = isActive;
    if (deliveryTime !== undefined) updatedAta.deliveryTime = deliveryTime;
    if (baseRate !== undefined) updatedAta.baseRate = parseFloat(baseRate);
    if (ratePerKg !== undefined) updatedAta.ratePerKg = parseFloat(ratePerKg);
    if (contactEmail !== undefined) updatedAta.contactEmail = contactEmail;
    if (contactPhone !== undefined) updatedAta.contactPhone = contactPhone;

    // Update courier service
    const courierService = await prisma.courier_services.update({
      where: { id },
      data: updatedAta
    });

    // Transform response
    const response = transformSingleResponse(courierService, transformCourierService);
    res.json(response);

  } catch (error) {
    console.error('[Courier Services] Update error:', error);
    const errorResponse = transformErrorResponse(
      'Failed to update courier service',
      error.message,
      500
    );
    res.status(500).json(errorResponse);
  }
});

/**
 * DELETE /api/v1/admin/courier-services/:id
 * Delete a courier service (soft delete by setting isActive to false)
 */
router.delete('/:id', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if courier service exists
    const existing = await prisma.courier_services.findUnique({
      where: { id }
    });

    if (!existing) {
      const errorResponse = transformErrorResponse(
        'Courier service not found',
        null,
        404
      );
      return res.status(404).json(errorResponse);
    }

    // Check if courier service is being used by any orders
    const usageCount = await prisma.order_fulfillments.count({
      where: { courierServiceId: id }
    });

    if (usageCount > 0) {
      // Soft delete instead
      await prisma.courier_services.update({
        where: { id },
        data: { is_active: false }
      });

      const response = {
        success: true,
        message: 'Courier service deactivated (cannot delete as it is in use)',
        deactivated: true
      };
      return res.json(response);
    }

    // Hard delete if not in use
    await prisma.courier_services.delete({
      where: { id }
    });

    const response = {
      success: true,
      message: 'Courier service deleted successfully'
    };
    res.json(response);

  } catch (error) {
    console.error('[Courier Services] Delete error:', error);
    const errorResponse = transformErrorResponse(
      'Failed to delete courier service',
      error.message,
      500
    );
    res.status(500).json(errorResponse);
  }
});

module.exports = router;
