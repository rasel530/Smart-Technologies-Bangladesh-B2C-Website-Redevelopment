const express = require('express');
const { param, validationResult } = require('express-validator');
const { rbacAuthMiddleware } = require('../middleware/rbacAuth');
const { rbacUtils } = require('../utils/rbacUtils');
const { loggerService } = require('../services/logger');
const Role = require('../models/Role');
const Permission = require('../models/Permission');

const router = express.Router();
const roleModel = new Role();
const permissionModel = new Permission();

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
 * @route   GET /api/rbac/roles/:roleId/permissions
 * @desc    Get role permissions
 * @access  Authenticated
 */
router.get('/:roleId/permissions', [
  param('roleId').isUUID().withMessage('Invalid role ID')
], handleValidationErrors, rbacAuthMiddleware.authenticate(), async (req, res) => {
  try {
    const { roleId } = req.params;
    
    // Check if role exists
    const role = await roleModel.findById(roleId);
    if (!role) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Role not found'
      });
    }
    
    const permissions = await roleModel.getPermissions(roleId);
    
    res.json({
      success: true,
      message: 'Role permissions retrieved successfully',
      data: {
        roleId,
        roleName: role.name,
        permissions
      },
      count: permissions.length
    });
  } catch (error) {
    loggerService.error('Get role permissions error', error);
    res.status(500).json({
      error: 'Failed to fetch role permissions',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/rbac/roles/:roleId/permissions/:permissionId
 * @desc    Assign permission to role
 * @access  Admin/Super Admin only
 */
router.post('/:roleId/permissions/:permissionId', [
  param('roleId').isUUID().withMessage('Invalid role ID'),
  param('permissionId').isUUID().withMessage('Invalid permission ID')
], handleValidationErrors, rbacAuthMiddleware.authenticate(),
rbacAuthMiddleware.requirePermission('user:assign_role'), async (req, res) => {
  try {
    const { roleId, permissionId } = req.params;
    
    // Check if role exists
    const role = await roleModel.findById(roleId);
    if (!role) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Role not found'
      });
    }
    
    // Check if permission exists
    const permission = await permissionModel.findById(permissionId);
    if (!permission) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Permission not found'
      });
    }
    
    // Check if assigner can assign to this role level
    const canAssign = await rbacUtils.canAssignRole(req.user.id, role.name);
    if (!canAssign) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to assign permissions to this role'
      });
    }
    
    // Check if permission already assigned to role
    const existingPermissions = await roleModel.getPermissions(roleId);
    const alreadyAssigned = existingPermissions.some(p => p.id === permissionId);
    
    if (alreadyAssigned) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Permission already assigned to this role'
      });
    }
    
    // Assign permission to role
    await roleModel.getClient().$queryRaw`
      INSERT INTO role_permissions (role_id, permission_id, granted_by)
      VALUES (${roleId}, ${permissionId}, ${req.user.id})
      RETURNING id, role_id, permission_id, granted_at, granted_by
    `;
    
    // Log permission assignment
    await rbacUtils.logRoleChange(req.user.id, 'assign_permission_to_role', {
      roleId,
      roleName: role.name,
      permissionId,
      permissionName: permission.name,
      performedBy: req.user.id,
      ip: req.ip
    });
    
    res.status(201).json({
      success: true,
      message: 'Permission assigned to role successfully',
      data: {
        roleId,
        permissionId
      }
    });
  } catch (error) {
    loggerService.error('Assign permission to role error', error);
    res.status(500).json({
      error: 'Failed to assign permission',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   DELETE /api/rbac/roles/:roleId/permissions/:permissionId
 * @desc    Remove permission from role
 * @access  Admin/Super Admin only
 */
router.delete('/:roleId/permissions/:permissionId', [
  param('roleId').isUUID().withMessage('Invalid role ID'),
  param('permissionId').isUUID().withMessage('Invalid permission ID')
], handleValidationErrors, rbacAuthMiddleware.authenticate(),
rbacAuthMiddleware.requirePermission('user:assign_role'), async (req, res) => {
  try {
    const { roleId, permissionId } = req.params;
    
    // Check if role exists
    const role = await roleModel.findById(roleId);
    if (!role) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Role not found'
      });
    }
    
    // Check if permission exists
    const permission = await permissionModel.findById(permissionId);
    if (!permission) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Permission not found'
      });
    }
    
    // Check if assigner can assign to this role level
    const canAssign = await rbacUtils.canAssignRole(req.user.id, role.name);
    if (!canAssign) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to remove permissions from this role'
      });
    }
    
    // Remove permission from role
    const result = await roleModel.getClient().$queryRaw`
      DELETE FROM role_permissions
      WHERE role_id = ${roleId} AND permission_id = ${permissionId}
      RETURNING role_id, permission_id
    `;
    
    if (result.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Permission not assigned to this role'
      });
    }
    
    // Log permission removal
    await rbacUtils.logRoleChange(req.user.id, 'remove_permission_from_role', {
      roleId,
      roleName: role.name,
      permissionId,
      permissionName: permission.name,
      performedBy: req.user.id,
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: 'Permission removed from role successfully',
      data: {
        roleId,
        permissionId
      }
    });
  } catch (error) {
    loggerService.error('Remove permission from role error', error);
    res.status(500).json({
      error: 'Failed to remove permission',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
