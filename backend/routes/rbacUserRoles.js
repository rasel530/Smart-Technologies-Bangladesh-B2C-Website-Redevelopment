const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { rbacAuthMiddleware } = require('../middleware/rbacAuth');
const { rbacUtils } = require('../utils/rbacUtils');
const { loggerService } = require('../services/logger');
const UserRole = require('../models/UserRole');
const Role = require('../models/Role');

const router = express.Router();
const userRoleModel = new UserRole();
const roleModel = new Role();

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
 * @route   GET /api/rbac/users/:userId/roles
 * @desc    Get user roles
 * @access  Authenticated
 */
router.get('/:userId/roles', [
  param('userId').isUUID().withMessage('Invalid user ID')
], handleValidationErrors, rbacAuthMiddleware.authenticate(), async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user is requesting their own roles or has admin access
    const isOwnProfile = req.user.id === userId;
    const hasAdminAccess = await rbacUtils.userHasRole(req.user.id, 'ADMIN') ||
                          await rbacUtils.userHasRole(req.user.id, 'SUPER_ADMIN');
    
    if (!isOwnProfile && !hasAdminAccess) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only view your own roles'
      });
    }
    
    const userRoles = await userRoleModel.findByUserId(userId);
    
    res.json({
      success: true,
      message: 'User roles retrieved successfully',
      data: userRoles,
      userId,
      count: userRoles.length
    });
  } catch (error) {
    loggerService.error('Get user roles error', error);
    res.status(500).json({
      error: 'Failed to fetch user roles',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/rbac/users/:userId/roles/:roleId
 * @desc    Assign role to user
 * @access  Admin/Super Admin only
 */
router.post('/:userId/roles/:roleId', [
  param('userId').isUUID().withMessage('Invalid user ID'),
  param('roleId').isUUID().withMessage('Invalid role ID'),
  body('expires_at').optional().isISO8601().withMessage('Invalid expiration date format')
], handleValidationErrors, rbacAuthMiddleware.authenticate(),
rbacAuthMiddleware.requirePermission('user:assign_role'), async (req, res) => {
  try {
    const { userId, roleId } = req.params;
    const { expires_at } = req.body;
    
    // Check if role exists
    const role = await roleModel.findById(roleId);
    if (!role) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Role not found'
      });
    }
    
    // Check if assigner can assign this role
    const canAssign = await rbacUtils.canAssignRole(req.user.id, role.name);
    if (!canAssign) {
      return res.status(403).json({
        error: 'Access denied',
        message: `You do not have permission to assign the ${role.name} role`
      });
    }
    
    // Prevent users from assigning roles to themselves
    if (userId === req.user.id) {
      return res.status(400).json({
        error: 'Invalid operation',
        message: 'You cannot assign roles to yourself'
      });
    }
    
    // Check if user already has this role
    const existingRoles = await userRoleModel.findByUserId(userId);
    const alreadyHasRole = existingRoles.some(ur => ur.role_id === roleId && ur.is_active);
    
    if (alreadyHasRole) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'User already has this role'
      });
    }
    
    // Assign role to user
    const userRole = await userRoleModel.assign({
      user_id: userId,
      role_id: roleId,
      assigned_by: req.user.id,
      expires_at: expires_at || null
    });
    
    // Log role assignment
    await rbacUtils.logRoleChange(userId, 'assign_role', {
      userId,
      roleId,
      roleName: role.name,
      assignedBy: req.user.id,
      expiresAt: expires_at,
      ip: req.ip
    });
    
    res.status(201).json({
      success: true,
      message: 'Role assigned to user successfully',
      data: userRole
    });
  } catch (error) {
    loggerService.error('Assign role to user error', error);
    res.status(500).json({
      error: 'Failed to assign role',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   DELETE /api/rbac/users/:userId/roles/:roleId
 * @desc    Remove role from user
 * @access  Admin/Super Admin only
 */
router.delete('/:userId/roles/:roleId', [
  param('userId').isUUID().withMessage('Invalid user ID'),
  param('roleId').isUUID().withMessage('Invalid role ID')
], handleValidationErrors, rbacAuthMiddleware.authenticate(),
rbacAuthMiddleware.requirePermission('user:assign_role'), async (req, res) => {
  try {
    const { userId, roleId } = req.params;
    
    // Check if role exists
    const role = await roleModel.findById(roleId);
    if (!role) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Role not found'
      });
    }
    
    // Check if assigner can assign this role
    const canAssign = await rbacUtils.canAssignRole(req.user.id, role.name);
    if (!canAssign) {
      return res.status(403).json({
        error: 'Access denied',
        message: `You do not have permission to remove the ${role.name} role`
      });
    }
    
    // Prevent users from removing their own roles
    if (userId === req.user.id) {
      return res.status(400).json({
        error: 'Invalid operation',
        message: 'You cannot remove your own roles'
      });
    }
    
    // Find user role record
    const userRoles = await userRoleModel.findByUserId(userId);
    const userRoleRecord = userRoles.find(ur => ur.role_id === roleId);
    
    if (!userRoleRecord) {
      return res.status(404).json({
        error: 'Not found',
        message: 'User does not have this role'
      });
    }
    
    // Remove role from user
    await userRoleModel.remove(userRoleRecord.id);
    
    // Log role removal
    await rbacUtils.logRoleChange(userId, 'remove_role', {
      userId,
      roleId,
      roleName: role.name,
      performedBy: req.user.id,
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: 'Role removed from user successfully'
    });
  } catch (error) {
    loggerService.error('Remove role from user error', error);
    res.status(500).json({
      error: 'Failed to remove role',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   PUT /api/rbac/users/:userId/roles/:roleId
 * @desc    Update user role (escalate/downgrade)
 * @access  Admin/Super Admin only
 */
router.put('/:userId/roles/:roleId', [
  param('userId').isUUID().withMessage('Invalid user ID'),
  param('roleId').isUUID().withMessage('Invalid role ID'),
  body('expires_at').optional().isISO8601().withMessage('Invalid expiration date format')
], handleValidationErrors, rbacAuthMiddleware.authenticate(),
rbacAuthMiddleware.requirePermission('user:assign_role'), async (req, res) => {
  try {
    const { userId, roleId } = req.params;
    const { expires_at } = req.body;
    
    // Check if role exists
    const role = await roleModel.findById(roleId);
    if (!role) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Role not found'
      });
    }
    
    // Check if assigner can assign this role
    const canAssign = await rbacUtils.canAssignRole(req.user.id, role.name);
    if (!canAssign) {
      return res.status(403).json({
        error: 'Access denied',
        message: `You do not have permission to update to the ${role.name} role`
      });
    }
    
    // Prevent users from updating their own roles
    if (userId === req.user.id) {
      return res.status(400).json({
        error: 'Invalid operation',
        message: 'You cannot update your own roles'
      });
    }
    
    // Find user role record
    const userRoles = await userRoleModel.findByUserId(userId);
    const userRoleRecord = userRoles.find(ur => ur.role_id === roleId);
    
    if (!userRoleRecord) {
      return res.status(404).json({
        error: 'Not found',
        message: 'User does not have this role'
      });
    }
    
    // Update user role
    const updatedUserRole = await userRoleModel.update(userRoleRecord.id, {
      role_id: roleId,
      assigned_by: req.user.id,
      expires_at: expires_at || null,
      is_active: true
    });
    
    // Log role update
    await rbacUtils.logRoleChange(userId, 'update_role', {
      userId,
      roleId,
      roleName: role.name,
      performedBy: req.user.id,
      expiresAt: expires_at,
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: 'User role updated successfully',
      data: updatedUserRole
    });
  } catch (error) {
    loggerService.error('Update user role error', error);
    res.status(500).json({
      error: 'Failed to update user role',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
