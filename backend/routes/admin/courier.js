const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../../middleware/auth');

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

// GET /api/v1/admin/courier-services - Get all courier services
router.get('/', [
  query('isActive').optional().isBoolean()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { isActive } = req.query;
 
    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
 
    const courierServices = await prisma.courier_services.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
 
    res.json({
      success: true,
      data: courierServices
    });

  } catch (error) {
    console.error('Get courier services error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch courier services',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/v1/admin/courier-services - Create a new courier service
router.post('/', [
  body('name').isString().trim(),
  body('code').isString().trim(),
  body('apiEndpoint').optional().isURL(),
  body('trackingUrlTemplate').optional().isString(),
  body('isActive').optional().isBoolean(),
  body('coverageAreas').optional().isArray(),
  body('pricing').optional().isObject()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { name, code, apiEndpoint, trackingUrlTemplate, isActive, coverageAreas, pricing } = req.body;
 
    // Check if code already exists
    const existingCourier = await prisma.courier_services.findUnique({
      where: { code }
    });
 
    if (existingCourier) {
      return res.status(400).json({
        success: false,
        error: 'Courier service code already exists'
      });
    }
 
    const courierService = await prisma.courier_services.create({
      data: {
        name,
        code,
        apiEndpoint,
        trackingUrl: trackingUrlTemplate,
        isActive: isActive !== undefined ? isActive : true,
        coverageAreas: coverageAreas || [],
        baseRate: pricing?.baseRate,
        ratePerKg: pricing?.ratePerKg
      }
    });
 
    console.log(`[Courier Management] Courier service created: ${courierService.id} - ${name}`);
 
    res.status(201).json({
      success: true,
      courierServiceId: courierService.id,
      message: 'Courier service created successfully'
    });

  } catch (error) {
    console.error('Create courier service error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create courier service',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /api/v1/admin/courier-services/:id - Update courier service
router.put('/:id', [
  param('id').isUUID(),
  body('name').optional().isString().trim(),
  body('code').optional().isString().trim(),
  body('apiEndpoint').optional().isURL(),
  body('trackingUrlTemplate').optional().isString(),
  body('isActive').optional().isBoolean(),
  body('coverageAreas').optional().isArray(),
  body('pricing').optional().isObject()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, apiEndpoint, trackingUrlTemplate, isActive, coverageAreas, pricing } = req.body;

    // Check if courier service exists
    const existingCourier = await prisma.courier_services.findUnique({
      where: { id }
    });

    if (!existingCourier) {
      return res.status(404).json({
        success: false,
        error: 'Courier service not found'
      });
    }

    // Check if new code conflicts with existing
    if (code && code !== existingCourier.code) {
      const codeConflict = await prisma.courier_services.findUnique({
        where: { code }
      });

      if (codeConflict) {
        return res.status(400).json({
          success: false,
          error: 'Courier service code already exists'
        });
      }
    }

    const updatedAta = {};
    if (name !== undefined) updatedAta.name = name;
    if (code !== undefined) updatedAta.code = code;
    if (apiEndpoint !== undefined) updatedAta.apiEndpoint = apiEndpoint;
    if (trackingUrlTemplate !== undefined) updatedAta.trackingUrl = trackingUrlTemplate;
    if (isActive !== undefined) updatedAta.isActive = isActive;
    if (coverageAreas !== undefined) updatedAta.coverageAreas = coverageAreas;
    if (pricing?.baseRate !== undefined) updatedAta.baseRate = pricing.baseRate;
    if (pricing?.ratePerKg !== undefined) updatedAta.ratePerKg = pricing.ratePerKg;

    await prisma.courier_services.update({
      where: { id },
      data: updatedAta
    });

    console.log(`[Courier Management] Courier service updated: ${id}`);

    res.json({
      success: true,
      message: 'Courier service updated successfully'
    });

  } catch (error) {
    console.error('Update courier service error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update courier service',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/v1/admin/courier-services/:id - Delete courier service (soft delete)
router.delete('/:id', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if courier service exists
    const existingCourier = await prisma.courier_services.findUnique({
      where: { id }
    });

    if (!existingCourier) {
      return res.status(404).json({
        success: false,
        error: 'Courier service not found'
      });
    }

    // Soft delete by setting isActive to false
    await prisma.courier_services.update({
      where: { id },
      data: { isActive: false }
    });

    console.log(`[Courier Management] Courier service soft deleted: ${id}`);

    res.json({
      success: true,
      message: 'Courier service deleted successfully'
    });

  } catch (error) {
    console.error('Delete courier service error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete courier service',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
