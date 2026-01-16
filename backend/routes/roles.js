const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { roleBasedAccessMiddleware } = require('../middleware/roleBasedAccess');
const { roleService } = require('../services/roleService');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      data: {
        details: errors.array()
      }
    });
  }
  next();
};

// Get all available roles
router.get('/list', authMiddleware.authenticate(), async (req, res) => {
  try {
    const roles = await roleService.getAllRoles();
    
    res.json({
      success: true,
      message: 'Roles retrieved successfully',
      data: roles,
      count: roles.length
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      error: 'Failed to fetch roles',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get role hierarchy
router.get('/hierarchy', authMiddleware.authenticate(), async (req, res) => {
  try {
    const hierarchy = await roleService.getRoleHierarchy();
    
    res.json({
      success: true,
      message: 'Role hierarchy retrieved successfully',
      data: hierarchy,
      count: hierarchy.length
    });
  } catch (error) {
    console.error('Get role hierarchy error:', error);
    res.status(500).json({
      error: 'Failed to fetch role hierarchy',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get all permissions
router.get('/permissions', authMiddleware.authenticate(), async (req, res) => {
  try {
    const { category } = req.query;
    
    let permissions;
    if (category) {
      permissions = await roleService.getPermissionsByCategory(category);
    } else {
      permissions = await roleService.getAllPermissions();
    }
    
    res.json({
      success: true,
      message: 'Permissions retrieved successfully',
      data: permissions,
      count: permissions.length
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({
      error: 'Failed to fetch permissions',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get permission categories
router.get('/permissions/categories', authMiddleware.authenticate(), async (req, res) => {
  try {
    const categories = await roleService.getPermissionCategories();
    
    res.json({
      success: true,
      message: 'Permission categories retrieved successfully',
      data: categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Get permission categories error:', error);
    res.status(500).json({
      error: 'Failed to fetch permission categories',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get permissions for a specific role
router.get('/:role/permissions', [
  param('role').isIn(['CUSTOMER', 'ADMIN', 'MANAGER', 'SUPER_ADMIN', 'SUPPORT', 'CORPORATE'])
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { role } = req.params;
    
    const permissions = await roleService.getRolePermissions(role);
    
    res.json({
      success: true,
      message: 'Role permissions retrieved successfully',
      data: {
        role,
        permissions
      },
      count: permissions.length
    });
  } catch (error) {
    console.error('Get role permissions error:', error);
    res.status(500).json({
      error: 'Failed to fetch role permissions',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get user's permissions
router.get('/user/permissions', authMiddleware.authenticate(), async (req, res) => {
  try {
    const permissions = await roleService.getUserPermissions(req.user.id);
    
    res.json({
      success: true,
      message: 'User permissions retrieved successfully',
      data: {
        userId: req.user.id,
        role: req.user.role,
        permissions
      },
      count: permissions.length
    });
  } catch (error) {
    console.error('Get user permissions error:', error);
    res.status(500).json({
      error: 'Failed to fetch user permissions',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get user's roles
router.get('/users/:userId/roles', [
  param('userId').isUUID().withMessage('Invalid user ID')
], handleValidationErrors, authMiddleware.authenticate(), roleBasedAccessMiddleware.requireMinimumRole('ADMIN'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userRoles = await roleService.getUserRoles(userId);
    
    res.json({
      success: true,
      message: 'User roles retrieved successfully',
      data: {
        userId,
        roles: userRoles
      },
      count: userRoles.length
    });
  } catch (error) {
    console.error('Get user roles error:', error);
    res.status(500).json({
      error: 'Failed to fetch user roles',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Check if user has specific permission
router.post('/user/check-permission', [
  body('permission').notEmpty().trim()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { permission } = req.body;
    
    const hasPermission = await roleService.checkUserPermission(req.user.id, permission);
    
    res.json({
      success: true,
      message: 'Permission check completed successfully',
      data: {
        userId: req.user.id,
        role: req.user.role,
        permission,
        hasPermission
      }
    });
  } catch (error) {
    console.error('Check permission error:', error);
    res.status(500).json({
      error: 'Failed to check permission',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Check if user has permission for specific resource and action
router.get('/permissions/check', [
  query('resource').notEmpty().withMessage('Resource parameter is required'),
  query('action').notEmpty().withMessage('Action parameter is required')
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { resource, action } = req.query;
    const permission = `${resource}:${action}`;
    
    const hasPermission = await roleService.checkUserPermission(req.user.id, permission);
    
    res.json({
      success: true,
      message: 'Permission check completed successfully',
      data: {
        userId: req.user.id,
        role: req.user.role,
        resource,
        action,
        permission,
        hasPermission
      }
    });
  } catch (error) {
    console.error('Check permission error:', error);
    res.status(500).json({
      error: 'Failed to check permission',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Assign permission to role (Admin only)
router.post('/:role/permissions/:permissionId', [
  param('role').isIn(['CUSTOMER', 'ADMIN', 'MANAGER', 'SUPER_ADMIN', 'SUPPORT', 'CORPORATE']),
  param('permissionId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), roleBasedAccessMiddleware.requirePermission('user:assign_role'), async (req, res) => {
  try {
    const { role, permissionId } = req.params;
    const grantedBy = req.user.id;
    
    const rolePermission = await roleService.assignPermissionToRole(role, permissionId, grantedBy);
    
    res.status(201).json({
      success: true,
      message: 'Permission assigned to role successfully',
      data: rolePermission
    });
  } catch (error) {
    console.error('Assign permission error:', error);
    
    if (error.message === 'Permission already assigned to this role') {
      return res.status(409).json({
        error: 'Conflict',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Failed to assign permission',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Remove permission from role (Admin only)
router.delete('/:role/permissions/:permissionId', [
  param('role').isIn(['CUSTOMER', 'ADMIN', 'MANAGER', 'SUPER_ADMIN', 'SUPPORT', 'CORPORATE']),
  param('permissionId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), roleBasedAccessMiddleware.requirePermission('user:assign_role'), async (req, res) => {
  try {
    const { role, permissionId } = req.params;
    
    await roleService.removePermissionFromRole(role, permissionId);
    
    res.json({
      success: true,
      message: 'Permission removed from role successfully',
      data: { role, permissionId }
    });
  } catch (error) {
    console.error('Remove permission error:', error);
    res.status(500).json({
      error: 'Failed to remove permission',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Assign multiple permissions to role (Admin only)
router.post('/:role/permissions/bulk', [
  param('role').isIn(['CUSTOMER', 'ADMIN', 'MANAGER', 'SUPER_ADMIN', 'SUPPORT', 'CORPORATE']),
  body('permissionIds').isArray({ min: 1 }),
  body('permissionIds.*').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), roleBasedAccessMiddleware.requirePermission('user:assign_role'), async (req, res) => {
  try {
    const { role } = req.params;
    const { permissionIds } = req.body;
    const grantedBy = req.user.id;
    
    const assignments = await roleService.assignPermissionsToRole(role, permissionIds, grantedBy);
    
    res.status(201).json({
      success: true,
      message: 'Permissions assigned to role successfully',
      data: {
        count: assignments.length,
        assignments
      }
    });
  } catch (error) {
    console.error('Bulk assign permissions error:', error);
    res.status(500).json({
      error: 'Failed to assign permissions',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update user role (Admin only)
router.put('/users/:userId/role', [
  param('userId').isUUID(),
  body('role').isIn(['CUSTOMER', 'ADMIN', 'MANAGER', 'SUPER_ADMIN', 'SUPPORT', 'CORPORATE'])
], handleValidationErrors, authMiddleware.authenticate(), roleBasedAccessMiddleware.requirePermission('user:assign_role'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const updatedBy = req.user.id;
    
    // Prevent users from changing their own role
    if (userId === updatedBy) {
      return res.status(400).json({
        error: 'Invalid operation',
        message: 'You cannot change your own role'
      });
    }
    
    const updatedUser = await roleService.updateUserRole(userId, role, updatedBy);
    
    res.json({
      success: true,
      message: 'User role updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user role error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        error: 'Not found',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Failed to update user role',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get role statistics (Admin only)
router.get('/statistics', authMiddleware.authenticate(), roleBasedAccessMiddleware.requireMinimumRole('ADMIN'), async (req, res) => {
  try {
    const stats = await roleService.getRoleStatistics();
    
    res.json({
      success: true,
      message: 'Role statistics retrieved successfully',
      data: {
        statistics: stats
      }
    });
  } catch (error) {
    console.error('Get role statistics error:', error);
    res.status(500).json({
      error: 'Failed to fetch role statistics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get users by role (Admin only)
router.get('/:role/users', [
  param('role').isIn(['CUSTOMER', 'ADMIN', 'MANAGER', 'SUPER_ADMIN', 'SUPPORT', 'CORPORATE']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, authMiddleware.authenticate(), roleBasedAccessMiddleware.requireMinimumRole('ADMIN'), async (req, res) => {
  try {
    const { role } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const result = await roleService.getUsersByRole(role, parseInt(page), parseInt(limit));
    
    res.json({
      success: true,
      message: 'Users by role retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
