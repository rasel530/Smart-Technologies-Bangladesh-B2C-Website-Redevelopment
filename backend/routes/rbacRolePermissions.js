const express = require('express');
const { param, body, validationResult } = require('express-validator');
const { rbacAuthMiddleware } = require('../middleware/rbacAuth');
const { authMiddleware } = require('../middleware/auth');
const { rbacUtils } = require('../utils/rbacUtils');
const { loggerService } = require('../services/logger');
const Role = require('../models/Role');
const Permission = require('../models/Permission');

const router = express.Router();
const roleModel = new Role();
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
 * @route   GET /api/rbac/roles/:roleId/permissions
 * @desc    Get role permissions
 * @access  Authenticated
 */
router.get('/:roleId/permissions', [
  param('roleId').isUUID().withMessage('Invalid role ID')
], handleValidationErrors, rbacReadRateLimit, rbacAuthMiddleware.authenticate(), async (req, res) => {
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
 * @route   PUT /api/rbac/roles/:roleId/permissions
 * @desc    Bulk update role permissions
 * @access  Admin/Super Admin only
 */
router.put('/:roleId/permissions', [
  param('roleId').isUUID().withMessage('Invalid role ID'),
  body('permissions').isArray({ min: 0 }).withMessage('Permissions must be an array'),
  body('permissions.*').isUUID().withMessage('All permission IDs must be valid UUIDs')
], handleValidationErrors, rbacWriteRateLimit, rbacAuthMiddleware.authenticate(),
rbacAuthMiddleware.requirePermission('user:assign_role'), async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissions } = req.body;
    
    // Check if role exists
    const role = await roleModel.findById(roleId);
    if (!role) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Role not found'
      });
    }
    
    // Check if assigner can assign to this role level
    const canAssign = await rbacUtils.canAssignRole(req.user.id, role.name);
    if (!canAssign) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to update permissions for this role'
      });
    }
    
    // Validate that all permission IDs exist
    const db = require('../services/database').databaseService;
    
    // Get existing permissions for the role
    const existingPermissions = await roleModel.getPermissions(roleId);
    const existingPermissionIds = existingPermissions.map(p => p.id);
    
    // Calculate permissions to add and remove
    const permissionsToAdd = permissions.filter(p => !existingPermissionIds.includes(p));
    const permissionsToRemove = existingPermissionIds.filter(p => !permissions.includes(p));
    
    // Validate that all new permission IDs exist
    if (permissionsToAdd.length > 0) {
      const validPermissions = await db.getClient().permissions.findMany({
        where: {
          id: { in: permissionsToAdd }
        },
        select: { id: true }
      });
      
      const validPermissionIds = validPermissions.map(p => p.id);
      const invalidPermissionIds = permissionsToAdd.filter(p => !validPermissionIds.includes(p));
      
      if (invalidPermissionIds.length > 0) {
        return res.status(400).json({
          error: 'Invalid permission IDs',
          message: 'One or more permission IDs do not exist',
          invalidIds: invalidPermissionIds
        });
      }
    }
    
    // Perform bulk update in transaction
    await db.getClient().$transaction(async (tx) => {
      // Remove permissions that are no longer in the new set
      if (permissionsToRemove.length > 0) {
        await tx.role_permissions.deleteMany({
          where: {
            role_id: roleId,
            permission_id: { in: permissionsToRemove }
          }
        });
      }
      
      // Add new permissions
      if (permissionsToAdd.length > 0) {
        await tx.role_permissions.createMany({
          data: permissionsToAdd.map(permissionId => ({
            role_id: roleId,
            permission_id: permissionId,
            granted_by: req.user.id
          })),
          skipDuplicates: true
        });
      }
      
      // Log the permission changes
      await rbacUtils.logRoleChange(req.user.id, 'bulk_update_role_permissions', {
        roleId,
        roleName: role.name,
        addedPermissions: permissionsToAdd,
        removedPermissions: permissionsToRemove,
        finalPermissions: permissions,
        addedCount: permissionsToAdd.length,
        removedCount: permissionsToRemove.length,
        performedBy: req.user.id,
        ip: req.ip
      });
    });
    
    // Get updated permissions
    const updatedPermissions = await roleModel.getPermissions(roleId);
    
    res.json({
      success: true,
      message: 'Role permissions updated successfully',
      data: {
        roleId,
        roleName: role.name,
        permissions: updatedPermissions,
        addedCount: permissionsToAdd.length,
        removedCount: permissionsToRemove.length
      }
    });
  } catch (error) {
    loggerService.error('Bulk update role permissions error', error);
    res.status(500).json({
      error: 'Failed to update role permissions',
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
], handleValidationErrors, rbacWriteRateLimit, rbacAuthMiddleware.authenticate(),
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
    
    // Assign permission to role
    // SECURITY FIX: Wrap permission assignment in transaction to prevent race conditions
    // SECURITY FIX: Replace $queryRaw with Prisma ORM to prevent SQL injection
    const db = require('../services/database').databaseService;
    
    await db.getClient().$transaction(async (tx) => {
      // Check if permission already assigned to role
      const existingPermission = await tx.role_permissions.findFirst({
        where: {
          role_id: roleId,
          permission_id: permissionId
        }
      });
      
      if (existingPermission) {
        throw new Error('Permission already assigned to this role');
      }
      
      // Assign permission to role using Prisma ORM
      await tx.role_permissions.create({
        data: {
          role_id: roleId,
          permission_id: permissionId,
          granted_by: req.user.id
        }
      });
      
      // Log permission assignment
      await rbacUtils.logRoleChange(req.user.id, 'assign_permission_to_role', {
        roleId,
        roleName: role.name,
        permissionId,
        permissionName: permission.name,
        performedBy: req.user.id,
        ip: req.ip
      });
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
], handleValidationErrors, rbacWriteRateLimit, rbacAuthMiddleware.authenticate(),
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
    // SECURITY FIX: Wrap permission removal in transaction to prevent race conditions
    // SECURITY FIX: Replace $queryRaw with Prisma ORM to prevent SQL injection
    const db = require('../services/database').databaseService;
    
    await db.getClient().$transaction(async (tx) => {
      // Find the role_permission record
      const existingPermission = await tx.role_permissions.findFirst({
        where: {
          role_id: roleId,
          permission_id: permissionId
        }
      });
      
      if (!existingPermission) {
        throw new Error('Permission not assigned to this role');
      }
      
      // Remove permission from role using Prisma ORM
      await tx.role_permissions.delete({
        where: { id: existingPermission.id }
      });
      
      // Log permission removal
      await rbacUtils.logRoleChange(req.user.id, 'remove_permission_from_role', {
        roleId,
        roleName: role.name,
        permissionId,
        permissionName: permission.name,
        performedBy: req.user.id,
        ip: req.ip
      });
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
