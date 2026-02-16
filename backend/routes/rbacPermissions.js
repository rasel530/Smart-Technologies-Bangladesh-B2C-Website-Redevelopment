const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { rbacAuthMiddleware } = require('../middleware/rbacAuth');
const { authMiddleware } = require('../middleware/auth');
const { rbacUtils } = require('../utils/rbacUtils');
const { loggerService } = require('../services/logger');
const Permission = require('../models/Permission');

const router = express.Router();
const permissionModel = new Permission();

// SECURITY FIX: Add rate limiting to RBAC endpoints to prevent brute force attacks
const rbacReadRateLimit = authMiddleware.rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute for read operations
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

const rbacWriteRateLimit = authMiddleware.rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute for write operations
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
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

/**
 * @route   GET /api/rbac/permissions
 * @desc    Get all permissions
 * @access  Public (or authenticated based on requirements)
 */
router.get('/', rbacReadRateLimit, rbacAuthMiddleware.authenticate(), rbacAuthMiddleware.requireAdmin(), async (req, res) => {
  try {
    const { resource } = req.query;
    
    let permissions;
    if (resource) {
      permissions = await permissionModel.findByResource(resource);
    } else {
      permissions = await permissionModel.findAll();
    }
    
    res.json({
      success: true,
      message: 'Permissions retrieved successfully',
      data: permissions,
      count: permissions.length
    });
  } catch (error) {
    loggerService.error('Get permissions error', error);
    res.status(500).json({
      error: 'Failed to fetch permissions',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/rbac/permissions/resources
 * @desc    Get all unique resource categories
 * @access  Authenticated
 */
router.get('/resources', rbacReadRateLimit, rbacAuthMiddleware.authenticate(), async (req, res) => {
  try {
    const resources = await rbacUtils.getPermissionCategories();
    
    res.json({
      success: true,
      message: 'Resource categories retrieved successfully',
      data: resources,
      count: resources.length
    });
  } catch (error) {
    loggerService.error('Get resources error', error);
    res.status(500).json({
      error: 'Failed to fetch resources',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/rbac/permissions/:id
 * @desc    Get permission details
 * @access  Public (or authenticated based on requirements)
 */
router.get('/:id', [
  param('id').isUUID().withMessage('Invalid permission ID')
], handleValidationErrors, rbacReadRateLimit, rbacAuthMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const permission = await permissionModel.findById(id);
    
    if (!permission) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Permission not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Permission retrieved successfully',
      data: permission
    });
  } catch (error) {
    loggerService.error('Get permission error', error);
    res.status(500).json({
      error: 'Failed to fetch permission',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/rbac/permissions
 * @desc    Create new permission
 * @access  Admin/Super Admin only
 */
router.post('/', [
  body('name').trim().notEmpty().withMessage('Permission name is required')
    .matches(/^[a-z_]+:[a-z_]+$/).withMessage('Invalid permission name format (use resource:action format)'),
  body('resource').trim().notEmpty().withMessage('Resource is required'),
  body('action').trim().notEmpty().withMessage('Action is required'),
  body('description').optional().trim()
], handleValidationErrors, rbacWriteRateLimit, rbacAuthMiddleware.authenticate(),
rbacAuthMiddleware.requireAdmin(), async (req, res) => {
  try {
    const { name, resource, action, description } = req.body;
    
    // Check if permission already exists
    const existingPermission = await permissionModel.findByName(name);
    if (existingPermission) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Permission with this name already exists'
      });
    }
    
    const permission = await permissionModel.create({
      name,
      resource,
      action,
      description
    });
    
    // Log permission creation
    await rbacUtils.logRoleChange(req.user.id, 'create_permission', {
      permissionName: name,
      resource,
      action,
      performedBy: req.user.id,
      ip: req.ip
    });
    
    res.status(201).json({
      success: true,
      message: 'Permission created successfully',
      data: permission
    });
  } catch (error) {
    loggerService.error('Create permission error', error);
    res.status(500).json({
      error: 'Failed to create permission',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   PUT /api/rbac/permissions/:id
 * @desc    Update permission
 * @access  Admin/Super Admin only
 */
router.put('/:id', [
  param('id').isUUID().withMessage('Invalid permission ID'),
  body('name').trim().notEmpty().withMessage('Permission name is required')
    .matches(/^[a-z_]+:[a-z_]+$/).withMessage('Invalid permission name format (use resource:action format)'),
  body('resource').trim().notEmpty().withMessage('Resource is required'),
  body('action').trim().notEmpty().withMessage('Action is required'),
  body('description').optional().trim()
], handleValidationErrors, rbacWriteRateLimit, rbacAuthMiddleware.authenticate(),
rbacAuthMiddleware.requireAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, resource, action, description } = req.body;
    
    // Check if permission exists
    const existingPermission = await permissionModel.findById(id);
    if (!existingPermission) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Permission not found'
      });
    }
    
    // Check if new name conflicts with another permission
    const nameConflict = await permissionModel.findByName(name);
    if (nameConflict && nameConflict.id !== id) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Permission with this name already exists'
      });
    }
    
    const permission = await permissionModel.update(id, {
      name,
      resource,
      action,
      description
    });
    
    // Log permission update
    await rbacUtils.logRoleChange(req.user.id, 'update_permission', {
      permissionId: id,
      oldName: existingPermission.name,
      newName: name,
      performedBy: req.user.id,
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: 'Permission updated successfully',
      data: permission
    });
  } catch (error) {
    loggerService.error('Update permission error', error);
    res.status(500).json({
      error: 'Failed to update permission',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   DELETE /api/rbac/permissions/:id
 * @desc    Delete permission
 * @access  Super Admin only
 */
router.delete('/:id', [
  param('id').isUUID().withMessage('Invalid permission ID')
], handleValidationErrors, rbacWriteRateLimit, rbacAuthMiddleware.authenticate(),
rbacAuthMiddleware.requireSuperAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if permission exists
    const existingPermission = await permissionModel.findById(id);
    if (!existingPermission) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Permission not found'
      });
    }
    
    const permission = await permissionModel.delete(id);
    
    // Log permission deletion
    await rbacUtils.logRoleChange(req.user.id, 'delete_permission', {
      permissionId: id,
      permissionName: existingPermission.name,
      performedBy: req.user.id,
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: 'Permission deleted successfully',
      data: permission
    });
  } catch (error) {
    loggerService.error('Delete permission error', error);
    res.status(500).json({
      error: 'Failed to delete permission',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
