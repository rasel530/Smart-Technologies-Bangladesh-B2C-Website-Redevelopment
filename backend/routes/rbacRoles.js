const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { rbacAuthMiddleware } = require('../middleware/rbacAuth');
const { rbacUtils } = require('../utils/rbacUtils');
const { loggerService } = require('../services/logger');
const Role = require('../models/Role');

const router = express.Router();
const roleModel = new Role();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // DIAGNOSTIC LOGGING - Remove after fixing issue
    loggerService.error('[Role Creation] Validation failed:', {
      body: req.body,
      validationErrors: errors.array(),
      timestamp: new Date().toISOString()
    });
    
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Middleware to normalize role name to uppercase before validation
const normalizeRoleName = (req, res, next) => {
  if (req.body.name) {
    req.body.name = req.body.name.trim().toUpperCase();
  }
  next();
};

/**
 * @route   GET /api/rbac/roles
 * @desc    Get all roles
 * @access  Public (or authenticated based on requirements)
 */
router.get('/', rbacAuthMiddleware.authenticate(), async (req, res) => {
  try {
    // DIAGNOSTIC LOGGING - Check authentication status
    console.log('[RBAC ROLES GET] Request received');
    console.log('[RBAC ROLES GET] User authenticated:', !!req.user);
    console.log('[RBAC ROLES GET] User ID:', req.user?.id);
    console.log('[RBAC ROLES GET] User roles:', req.user?.roles);
    
    const roles = await roleModel.findAll();
    
    // DIAGNOSTIC LOGGING - Log query results
    console.log('[RBAC ROLES GET] Roles found:', roles);
    console.log('[RBAC ROLES GET] Roles count:', roles?.length);
    console.log('[RBAC ROLES GET] First role:', roles?.[0]);
    
    res.json({
      success: true,
      message: 'Roles retrieved successfully',
      data: roles,
      count: roles.length
    });
  } catch (error) {
    console.error('[RBAC ROLES GET] Error:', error);
    loggerService.error('Get roles error', error);
    res.status(500).json({
      error: 'Failed to fetch roles',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/rbac/roles/hierarchy
 * @desc    Get role hierarchy
 * @access  Authenticated
 */
router.get('/hierarchy', rbacAuthMiddleware.authenticate(), async (req, res) => {
  try {
    const hierarchy = await rbacUtils.getRoleHierarchy();
    
    res.json({
      success: true,
      message: 'Role hierarchy retrieved successfully',
      data: hierarchy,
      count: hierarchy.length
    });
  } catch (error) {
    loggerService.error('Get role hierarchy error', error);
    res.status(500).json({
      error: 'Failed to fetch role hierarchy',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/rbac/roles/:id
 * @desc    Get role details
 * @access  Public (or authenticated based on requirements)
 */
router.get('/:id', [
  param('id').isUUID().withMessage('Invalid role ID')
], handleValidationErrors, rbacAuthMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const role = await roleModel.findById(id);
    
    if (!role) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Role not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Role retrieved successfully',
      data: role
    });
  } catch (error) {
    loggerService.error('Get role error', error);
    res.status(500).json({
      error: 'Failed to fetch role',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/rbac/roles
 * @desc    Create new role
 * @access  Admin/Super Admin only
 */
router.post('/', [
  normalizeRoleName,
  body('name').trim().notEmpty().withMessage('Role name is required')
    .isIn(['CUSTOMER', 'SUPPORT', 'CORPORATE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'])
    .withMessage('Invalid role name'),
  body('description').optional().trim(),
  body('hierarchy_level').isInt({ min: 0, max: 100 })
    .withMessage('Hierarchy level must be between 0 and 100')
], handleValidationErrors, rbacAuthMiddleware.authenticate(),
rbacAuthMiddleware.requireAdmin(), async (req, res) => {
  try {
    const { name, description, hierarchy_level } = req.body;
    
    // Check if role already exists
    const existingRole = await roleModel.findByName(name);
    if (existingRole) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Role with this name already exists'
      });
    }
    
    const role = await roleModel.create({
      name,
      description,
      hierarchy_level
    });
    
    // Log role creation
    await rbacUtils.logRoleChange(req.user.id, 'create_role', {
      roleName: name,
      hierarchyLevel: hierarchy_level,
      performedBy: req.user.id,
      ip: req.ip
    });
    
    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: role
    });
  } catch (error) {
    loggerService.error('Create role error', error);
    res.status(500).json({
      error: 'Failed to create role',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   PUT /api/rbac/roles/:id
 * @desc    Update role
 * @access  Admin/Super Admin only
 */
router.put('/:id', [
  normalizeRoleName,
  param('id').isUUID().withMessage('Invalid role ID'),
  body('name').trim().notEmpty().withMessage('Role name is required')
    .isIn(['CUSTOMER', 'SUPPORT', 'CORPORATE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'])
    .withMessage('Invalid role name'),
  body('description').optional().trim(),
  body('hierarchy_level').isInt({ min: 0, max: 100 })
    .withMessage('Hierarchy level must be between 0 and 100')
], handleValidationErrors, rbacAuthMiddleware.authenticate(),
rbacAuthMiddleware.requireAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, hierarchy_level } = req.body;
    
    // Check if role exists
    const existingRole = await roleModel.findById(id);
    if (!existingRole) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Role not found'
      });
    }
    
    // Check if new name conflicts with another role
    const nameConflict = await roleModel.findByName(name);
    if (nameConflict && nameConflict.id !== id) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Role with this name already exists'
      });
    }
    
    const role = await roleModel.update(id, {
      name,
      description,
      hierarchy_level
    });
    
    // Log role update
    await rbacUtils.logRoleChange(req.user.id, 'update_role', {
      roleId: id,
      oldName: existingRole.name,
      newName: name,
      performedBy: req.user.id,
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: 'Role updated successfully',
      data: role
    });
  } catch (error) {
    loggerService.error('Update role error', error);
    res.status(500).json({
      error: 'Failed to update role',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   DELETE /api/rbac/roles/:id
 * @desc    Delete role
 * @access  Super Admin only
 */
router.delete('/:id', [
  param('id').isUUID().withMessage('Invalid role ID')
], handleValidationErrors, rbacAuthMiddleware.authenticate(),
rbacAuthMiddleware.requireSuperAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if role exists
    const existingRole = await roleModel.findById(id);
    if (!existingRole) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Role not found'
      });
    }
    
    // Prevent deletion of critical roles
    if (['CUSTOMER', 'ADMIN', 'SUPER_ADMIN'].includes(existingRole.name)) {
      return res.status(400).json({
        error: 'Invalid operation',
        message: 'Cannot delete critical system roles'
      });
    }
    
    const role = await roleModel.delete(id);
    
    // Log role deletion
    await rbacUtils.logRoleChange(req.user.id, 'delete_role', {
      roleId: id,
      roleName: existingRole.name,
      performedBy: req.user.id,
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: 'Role deleted successfully',
      data: role
    });
  } catch (error) {
    loggerService.error('Delete role error', error);
    res.status(500).json({
      error: 'Failed to delete role',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
