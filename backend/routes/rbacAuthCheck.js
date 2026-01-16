const express = require('express');
const { param, validationResult } = require('express-validator');
const { rbacAuthMiddleware } = require('../middleware/rbacAuth');
const { rbacUtils } = require('../utils/rbacUtils');
const { loggerService } = require('../services/logger');

const router = express.Router();

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
 * @route   GET /api/rbac/auth/permissions
 * @desc    Get current user permissions
 * @access  Authenticated
 */
router.get('/permissions', rbacAuthMiddleware.authenticate(),
rbacAuthMiddleware.attachUserPermissions(), async (req, res) => {
  try {
    const permissions = req.userPermissions || [];
    
    // Get user roles for additional context
    const userRoles = await rbacUtils.getUserRoles(req.user.id);
    
    res.json({
      success: true,
      message: 'User permissions retrieved successfully',
      data: {
        userId: req.user.id,
        email: req.user.email,
        roles: userRoles.map(r => ({
          roleId: r.role_id,
          roleName: r.role_name,
          hierarchyLevel: r.hierarchy_level,
          assignedAt: r.assigned_at,
          expiresAt: r.expires_at
        })),
        permissions
      },
      count: permissions.length
    });
  } catch (error) {
    loggerService.error('Get user permissions error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch permissions',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      data: null
    });
  }
});

/**
 * @route   GET /api/rbac/auth/roles
 * @desc    Get current user roles
 * @access  Authenticated
 */
router.get('/roles', rbacAuthMiddleware.authenticate(), async (req, res) => {
  try {
    const userRoles = await rbacUtils.getUserRoles(req.user.id);
    
    res.json({
      success: true,
      message: 'User roles retrieved successfully',
      data: {
        userId: req.user.id,
        email: req.user.email,
        roles: userRoles.map(r => ({
          roleId: r.role_id,
          roleName: r.role_name,
          roleDescription: r.role_description,
          hierarchyLevel: r.hierarchy_level,
          assignedAt: r.assigned_at,
          expiresAt: r.expires_at,
          isActive: r.is_active
        }))
      },
      count: userRoles.length
    });
  } catch (error) {
    loggerService.error('Get user roles error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch roles',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      data: null
    });
  }
});

/**
 * @route   GET /api/rbac/auth/has-permission/:permission
 * @desc    Check if user has specific permission
 * @access  Authenticated
 */
router.get('/has-permission/:permission', [
  param('permission').trim().notEmpty().withMessage('Permission name is required')
    .matches(/^[a-z_]+:[a-z_]+$/).withMessage('Invalid permission name format')
], handleValidationErrors, rbacAuthMiddleware.authenticate(), async (req, res) => {
  try {
    const { permission } = req.params;
    
    // Check if user has the permission
    const hasPermission = await rbacUtils.userHasPermission(req.user.id, permission);
    
    res.json({
      success: true,
      message: 'Permission check completed successfully',
      data: {
        userId: req.user.id,
        email: req.user.email,
        permission,
        hasPermission
      }
    });
  } catch (error) {
    loggerService.error('Check permission error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check permission',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      data: null
    });
  }
});

/**
 * @route   POST /api/rbac/auth/check-permissions
 * @desc    Check if user has multiple permissions
 * @access  Authenticated
 */
router.post('/check-permissions', [
  // Expects body: { permissions: ['user:read', 'product:create'], mode: 'any' | 'all' }
], handleValidationErrors, rbacAuthMiddleware.authenticate(), async (req, res) => {
  try {
    const { permissions, mode } = req.body;
    
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Permissions array is required'
      });
    }
    
    let hasPermissions = false;
    
    if (mode === 'all') {
      // Check if user has ALL permissions
      hasPermissions = await rbacUtils.userHasAllPermissions(req.user.id, permissions);
    } else {
      // Default mode: check if user has ANY of the permissions
      hasPermissions = await rbacUtils.userHasAnyPermission(req.user.id, permissions);
    }
    
    // Get detailed permission check results
    const permissionResults = {};
    for (const permission of permissions) {
      permissionResults[permission] = await rbacUtils.userHasPermission(req.user.id, permission);
    }
    
    res.json({
      success: true,
      message: 'Permissions check completed successfully',
      data: {
        userId: req.user.id,
        email: req.user.email,
        mode: mode || 'any',
        hasPermissions,
        permissions: permissionResults
      },
      count: permissions.length
    });
  } catch (error) {
    loggerService.error('Check permissions error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check permissions',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      data: null
    });
  }
});

/**
 * @route   GET /api/rbac/auth/can-assign-role/:role
 * @desc    Check if current user can assign specified role
 * @access  Authenticated
 */
router.get('/can-assign-role/:role', [
  param('role').trim().notEmpty().withMessage('Role name is required')
    .isIn(['CUSTOMER', 'SUPPORT', 'CORPORATE', 'ADMIN', 'SUPER_ADMIN'])
    .withMessage('Invalid role name')
], handleValidationErrors, rbacAuthMiddleware.authenticate(), async (req, res) => {
  try {
    const { role } = req.params;
    
    // Check if user can assign this role
    const canAssign = await rbacUtils.canAssignRole(req.user.id, role);
    
    // Get user's max role level for context
    const userMaxLevel = await rbacUtils.getUserMaxRoleLevel(req.user.id);
    const targetRoleLevel = await rbacUtils.userHasMinimumRoleLevel(req.user.id, role);
    
    res.json({
      success: true,
      message: 'Role assignment permission check completed successfully',
      data: {
        userId: req.user.id,
        email: req.user.email,
        targetRole: role,
        canAssign,
        userMaxLevel,
        targetRoleLevel
      }
    });
  } catch (error) {
    loggerService.error('Check role assignment permission error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check role assignment permission',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      data: null
    });
  }
});

/**
 * @route   GET /api/rbac/auth/role-level
 * @desc    Get current user's maximum role hierarchy level
 * @access  Authenticated
 */
router.get('/role-level', rbacAuthMiddleware.authenticate(), async (req, res) => {
  try {
    const maxLevel = await rbacUtils.getUserMaxRoleLevel(req.user.id);
    const userRoles = await rbacUtils.getUserRoles(req.user.id);
    
    res.json({
      success: true,
      message: 'User role level retrieved successfully',
      data: {
        userId: req.user.id,
        email: req.user.email,
        maxLevel,
        roles: userRoles.map(r => ({
          roleId: r.role_id,
          roleName: r.role_name,
          hierarchyLevel: r.hierarchy_level
        }))
      },
      count: userRoles.length
    });
  } catch (error) {
    loggerService.error('Get role level error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get role level',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      data: null
    });
  }
});

module.exports = router;
