const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { rbacAuthMiddleware } = require('../middleware/rbacAuth');
const { authMiddleware } = require('../middleware/auth');
const { rbacUtils } = require('../utils/rbacUtils');
const { loggerService } = require('../services/logger');
const { passwordService } = require('../services/passwordService');
const { phoneValidationService } = require('../services/phoneValidationService');
const { emailService } = require('../services/emailService');
const { PrismaClient } = require('@prisma/client');
const UserRole = require('../models/UserRole');
const Role = require('../models/Role');

const router = express.Router();
const userRoleModel = new UserRole();
const roleModel = new Role();
const prisma = new PrismaClient();

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
 * @route   GET /api/rbac/users/:userId/roles
 * @desc    Get user roles
 * @access  Authenticated
 */
router.get('/:userId/roles', [
  param('userId').isUUID().withMessage('Invalid user ID')
], handleValidationErrors, rbacReadRateLimit, rbacAuthMiddleware.authenticate(), async (req, res) => {
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
  body('expires_at')
    .custom((value) => {
      // Allow null, undefined, and empty string
      if (value === null || value === undefined || value === '') {
        return true;
      }
      // Validate ISO8601 format
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})?$/.test(value)) {
        throw new Error('Invalid expiration date format');
      }
      return true;
    })
    .withMessage('Invalid expiration date format')
], handleValidationErrors, rbacWriteRateLimit, rbacAuthMiddleware.authenticate(),
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
    // SECURITY FIX: Wrap role assignment in transaction to prevent race conditions
    const db = require('../services/database').databaseService;
    
    let userRole;
    
    await db.getClient().$transaction(async (tx) => {
      // Assign role to user
      userRole = await tx.user_roles.create({
        data: {
          user_id: userId,
          role_id: roleId,
          assigned_by: req.user.id,
          expires_at: expires_at || null,
          is_active: true
        }
      });
    });
    
    // Log role assignment outside transaction to prevent transaction rollback
    try {
      await rbacUtils.logRoleChange(userId, 'assign_role', {
        userId,
        roleId,
        roleName: role.name,
        assignedBy: req.user.id,
        expiresAt: expires_at,
        ip: req.ip
      });
    } catch (auditError) {
      // Don't fail the main operation if audit logging fails
      loggerService.warn('Failed to log role assignment', auditError);
    }
    
    res.status(201).json({
      success: true,
      message: 'Role assigned to user successfully',
      data: userRole
    });
  } catch (error) {
    loggerService.error('Assign role to user error', error);
    
    // Distinguish between different types of errors
    if (error.message === 'Role not found') {
      return res.status(404).json({
        error: 'Not found',
        message: 'Role not found'
      });
    }
    if (error.message === 'User already has this role') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'User already has this role'
      });
    }
    
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
], handleValidationErrors, rbacWriteRateLimit, rbacAuthMiddleware.authenticate(),
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
    
    // Remove role from user
    // SECURITY FIX: Wrap role removal in transaction to prevent race conditions
    const db = require('../services/database').databaseService;
    
    await db.getClient().$transaction(async (tx) => {
      // Find user role record
      const userRoles = await tx.user_roles.findMany({
        where: {
          user_id: userId,
          role_id: roleId,
          is_active: true
        }
      });
      
      if (userRoles.length === 0) {
        throw new Error('User does not have this role');
      }
      
      const userRoleRecord = userRoles[0];
      
      // Remove role from user
      await tx.user_roles.delete({
        where: { id: userRoleRecord.id }
      });
      
      // Log role removal
      await rbacUtils.logRoleChange(userId, 'remove_role', {
        userId,
        roleId,
        roleName: role.name,
        performedBy: req.user.id,
        ip: req.ip
      });
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
  body('expires_at')
    .custom((value) => {
      // Allow null, undefined, and empty string
      if (value === null || value === undefined || value === '') {
        return true;
      }
      // Validate ISO8601 format
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})?$/.test(value)) {
        throw new Error('Invalid expiration date format');
      }
      return true;
    })
    .withMessage('Invalid expiration date format')
], handleValidationErrors, rbacWriteRateLimit, rbacAuthMiddleware.authenticate(),
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

/**
 * @route   POST /api/rbac/users
 * @desc    Create a new user with role assignment
 * @access  Admin/Super Admin only
 */
router.post('/', [
  body('email').isEmail().withMessage('Invalid email format').normalizeEmail().withMessage('Email format is invalid'),
  body('phone').optional().notEmpty().trim().withMessage('Phone number is required'),
  body('password').isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters'),
  body('first_name').notEmpty().trim().withMessage('First name is required'),
  body('last_name').notEmpty().trim().withMessage('Last name is required'),
  body('role_ids').isArray({ min: 1 }).withMessage('At least one role ID must be provided'),
  body('role_ids.*').isUUID().withMessage('Invalid role ID format')
], handleValidationErrors, rbacWriteRateLimit, rbacAuthMiddleware.authenticate(),
rbacAuthMiddleware.requirePermission('user:assign_role'), async (req, res) => {
  try {
    const { email, phone, password, first_name, last_name, role_ids } = req.body;
    
    // Validate email format
    if (!emailService.validateEmail(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        message: 'Please provide a valid email address'
      });
    }
    
    // Validate phone format if provided
    let normalizedPhone = phone;
    if (phone) {
      const phoneValidation = phoneValidationService.validateForUseCase(phone, 'registration');
      if (!phoneValidation.isValid) {
        return res.status(400).json({
          error: 'Invalid phone format',
          message: phoneValidation.error,
          code: phoneValidation.code
        });
      }
      normalizedPhone = phoneValidation.normalizedPhone;
    }
    
    // Validate password strength
    const userInfo = { firstName: first_name, lastName: last_name, email, phone: normalizedPhone };
    const passwordValidation = passwordService.validatePasswordStrength(password, userInfo);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Password does not meet requirements',
        message: 'Password is too weak or does not meet security requirements',
        details: {
          strength: passwordValidation.strength,
          score: passwordValidation.score,
          feedback: passwordValidation.feedback,
          warnings: passwordValidation.warnings,
          suggestions: passwordValidation.suggestions,
          passwordPolicy: passwordService.getPasswordPolicy()
        }
      });
    }
    
    // Use database transaction for atomicity
    const db = require('../services/database').databaseService;
    
    const result = await db.getClient().$transaction(async (tx) => {
      // Check if email already exists
      const existingEmailUser = await tx.user.findUnique({
        where: { email }
      });
      if (existingEmailUser) {
        throw new Error('EMAIL_EXISTS');
      }
      
      // Check if phone already exists
      if (normalizedPhone) {
        const existingPhoneUser = await tx.user.findUnique({
          where: { phone: normalizedPhone }
        });
        if (existingPhoneUser) {
          throw new Error('PHONE_EXISTS');
        }
      }
      
      // Verify all role IDs exist
      const roles = await tx.roles.findMany({
        where: { id: { in: role_ids } }
      });
      if (roles.length !== role_ids.length) {
        throw new Error('INVALID_ROLE_IDS');
      }
      
      // Check if user can assign all the specified roles
      for (const role of roles) {
        const canAssign = await rbacUtils.canAssignRole(req.user.id, role.name);
        if (!canAssign) {
          throw new Error(`CANNOT_ASSIGN_ROLE_${role.name}`);
        }
      }
      
      // Hash password
      const hashedPassword = await passwordService.hashPassword(password);
      
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          phone: normalizedPhone || null,
          password: hashedPassword,
          firstName: first_name,
          lastName: last_name,
          status: 'active'
        },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          status: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      // Assign roles to user
      const userRoles = await Promise.all(role_ids.map(role_id =>
        tx.user_roles.create({
          data: {
            user_id: user.id,
            role_id,
            assigned_by: req.user.id,
            assigned_at: new Date(),
            is_active: true
          }
        })
      ));
      
      // FIX 1: Update legacy role field to match the highest hierarchy level role
      const maxHierarchyRole = userRoles.reduce((max, ur) => {
        // Get the role hierarchy level from the assigned roles
        const role = roles.find(r => r.id === ur.role_id);
        return role && role.hierarchy_level > max ? role.hierarchy_level : max;
      }, 0);

      // Map hierarchy level to role name
      const roleMap = {
        0: 'customer',
        1: 'support',
        2: 'corporate',
        3: 'manager',
        4: 'admin',
        5: 'super_admin'
      };

      const legacyRoleName = roleMap[maxHierarchyRole] || 'customer';

      // Update the user's legacy role field
      await tx.user.update({
        where: { id: user.id },
        data: { role: legacyRoleName }
      });
      
      // Get role details for response
      const assignedRoles = await tx.user_roles.findMany({
        where: {
          user_id: user.id,
          role_id: { in: role_ids }
        },
        include: {
          roles: {
            select: {
              id: true,
              name: true,
              description: true,
              hierarchy_level: true
            }
          }
        }
      });
      
      // Log user creation with role assignment
      await rbacUtils.logRoleChange(user.id, 'create_user_with_roles', {
        userId: user.id,
        email: user.email,
        phone: user.phone,
        roleIds: role_ids,
        roleNames: assignedRoles.map(ur => ur.roles.name),
        createdBy: req.user.id,
        ip: req.ip
      });
      
      // Save password to history
      try {
        await tx.passwordHistory.create({
          data: {
            userId: user.id,
            passwordHash: hashedPassword
          }
        });
      } catch (historyError) {
        // Don't fail if password history save fails
        loggerService.warn('Failed to save password to history for new user', historyError);
      }
      
      return {
        user,
        roles: assignedRoles.map(ur => ({
          id: ur.roles.id,
          name: ur.roles.name,
          description: ur.roles.description,
          hierarchy_level: ur.roles.hierarchy_level
        }))
      };
    });
    
    // FIX 3: Calculate maxRoleLevel for the created user
    const maxRoleLevel = result.roles.length > 0
      ? Math.max(...result.roles.map(r => r.hierarchy_level))
      : 0;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          ...result.user,
          maxRoleLevel
        },
        roles: result.roles
      }
    });
  } catch (error) {
    loggerService.error('Create user with roles error', error);
    
    // Handle specific errors
    if (error.message === 'EMAIL_EXISTS') {
      return res.status(409).json({
        error: 'Email already exists',
        message: 'An account with this email address already exists'
      });
    }
    if (error.message === 'PHONE_EXISTS') {
      return res.status(409).json({
        error: 'Phone already exists',
        message: 'An account with this phone number already exists'
      });
    }
    if (error.message === 'INVALID_ROLE_IDS') {
      return res.status(400).json({
        error: 'Invalid role IDs',
        message: 'One or more role IDs are invalid'
      });
    }
    if (error.message.startsWith('CANNOT_ASSIGN_ROLE_')) {
      const roleName = error.message.replace('CANNOT_ASSIGN_ROLE_', '');
      return res.status(403).json({
        error: 'Access denied',
        message: `You do not have permission to assign the ${roleName} role`
      });
    }
    
    res.status(500).json({
      error: 'Failed to create user',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/rbac/users
 * @desc    List users with their roles (paginated)
 * @access  Admin/Super Admin only
 */
router.get('/', [
  rbacAuthMiddleware.authenticate(),
  rbacAuthMiddleware.requirePermission('user:read')
], rbacReadRateLimit, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    // Build where clause
    const where = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Only show non-deleted users
    where.deletedAt = null;
    
    // Get users with their roles
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          status: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          user_roles: {
            where: { is_active: true },
            select: {
              id: true,
              role_id: true,
              assigned_at: true,
              roles: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  hierarchy_level: true
                }
              }
            },
            orderBy: { assigned_at: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.user.count({ where })
    ]);
    
    // FIX 2: Transform users to match expected format with maxRoleLevel
    const transformedUsers = users.map(user => {
      const maxRoleLevel = user.user_roles.length > 0
        ? Math.max(...user.user_roles.map(ur => ur.roles.hierarchy_level))
        : 0;

      return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        first_name: user.firstName,
        last_name: user.lastName,
        status: user.status,
        maxRoleLevel,
        roles: user.user_roles.map(ur => ({
          id: ur.roles.id,
          name: ur.roles.name,
          description: ur.roles.description,
          hierarchy_level: ur.roles.hierarchy_level,
          assigned_at: ur.assigned_at
        })),
        created_at: user.createdAt,
        updated_at: user.updatedAt
      };
    });
    
    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: transformedUsers,
      pagination: {
        page: parseInt(page),
        limit: take,
        total: totalCount,
        totalPages: Math.ceil(totalCount / take)
      }
    });
  } catch (error) {
    loggerService.error('List users error', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   DELETE /api/rbac/users/:userId
 * @desc    Delete user (Admin/Super Admin only)
 * @access  Admin/Super Admin only
 */
router.delete('/:userId', [
  param('userId').isUUID().withMessage('Invalid user ID')
], handleValidationErrors, rbacWriteRateLimit, rbacAuthMiddleware.authenticate(),
rbacAuthMiddleware.requirePermission('user:delete'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        error: 'User not found',
        message: 'The specified user does not exist'
      });
    }
    
    // SECURITY: Prevent deletion of users with SUPER_ADMIN role
    const userRoles = await userRoleModel.findByUserId(userId);
    const hasSuperAdminRole = userRoles.some(ur => {
      return ur.roles && ur.roles.name === 'SUPER_ADMIN';
    });
    
    if (hasSuperAdminRole) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Cannot delete users with SUPER_ADMIN role'
      });
    }
    
    // SECURITY: Prevent deletion of the current user
    if (userId === req.user.id) {
      return res.status(400).json({
        error: 'Invalid operation',
        message: 'You cannot delete your own account'
      });
    }
    
    // Check if user has orders (prevent deletion if they do)
    if (user._count.orders > 0) {
      return res.status(400).json({
        error: 'Cannot delete user with existing orders',
        message: 'This user has existing orders and cannot be deleted',
        suggestion: 'Consider deactivating the user instead'
      });
    }
    
    // Check if user is already deleted
    if (user.deletedAt !== null) {
      return res.status(400).json({
        error: 'User already deleted',
        message: 'This user has already been deleted'
      });
    }
    
    // Perform soft delete (recommended for audit trail)
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        status: 'inactive'
      }
    });
    
    // Clean up related data
    await prisma.userSession.deleteMany({
      where: { userId }
    });
    
    await prisma.user_roles.deleteMany({
      where: { user_id: userId }
    });
    
    // Log deletion for audit trail
    await rbacUtils.logRoleChange(userId, 'delete_user', {
      userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      deletedBy: req.user.id,
      deletedAt: new Date(),
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    loggerService.error('Delete user error', error);
    res.status(500).json({
      error: 'Failed to delete user',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
