const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { rbacAuthMiddleware } = require('../middleware/rbacAuth');
const { authMiddleware } = require('../middleware/auth');
const { rbacUtils } = require('../utils/rbacUtils');
const { loggerService } = require('../services/logger');
const RoleEscalationRequest = require('../models/RoleEscalationRequest');
const Role = require('../models/Role');

const router = express.Router();
const escalationModel = new RoleEscalationRequest();
const roleModel = new Role();

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
 * @route   GET /api/rbac/role-escalation-requests
 * @desc    List escalation requests
 * @access  Admin/Super Admin only
 */
router.get('/', rbacReadRateLimit, rbacAuthMiddleware.authenticate(),
rbacAuthMiddleware.requireAdmin(), async (req, res) => {
  try {
    const { status, userId } = req.query;
    
    const filters = {};
    if (status) {
      filters.status = status;
    }
    if (userId) {
      filters.userId = userId;
    }
    
    const requests = await escalationModel.findAll(filters);
    
    res.json({
      success: true,
      message: 'Escalation requests retrieved successfully',
      data: requests,
      count: requests.length
    });
  } catch (error) {
    loggerService.error('Get escalation requests error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch escalation requests',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      data: null
    });
  }
});

/**
 * @route   GET /api/rbac/role-escalation-requests/pending
 * @desc    Get pending escalation requests
 * @access  Admin/Super Admin only
 */
router.get('/pending', rbacReadRateLimit, rbacAuthMiddleware.authenticate(),
rbacAuthMiddleware.requireAdmin(), async (req, res) => {
  try {
    const requests = await escalationModel.getPendingRequests();
    
    res.json({
      success: true,
      message: 'Pending escalation requests retrieved successfully',
      data: requests,
      count: requests.length
    });
  } catch (error) {
    loggerService.error('Get pending requests error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending requests',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      data: null
    });
  }
});

/**
 * @route   GET /api/rbac/role-escalation-requests/:id
 * @desc    Get escalation request details
 * @access  Authenticated
 */
router.get('/:id', [
  param('id').isUUID().withMessage('Invalid request ID')
], handleValidationErrors, rbacReadRateLimit, rbacAuthMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const request = await escalationModel.findById(id);
    
    if (!request) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Escalation request not found'
      });
    }
    
    // Check if user is requesting their own request or has admin access
    const isOwnRequest = request.user_id === req.user.id;
    const hasAdminAccess = await rbacUtils.userHasRole(req.user.id, 'ADMIN') ||
                          await rbacUtils.userHasRole(req.user.id, 'SUPER_ADMIN');
    
    if (!isOwnRequest && !hasAdminAccess) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only view your own requests'
      });
    }
    
    res.json({
      success: true,
      message: 'Escalation request retrieved successfully',
      data: request
    });
  } catch (error) {
    loggerService.error('Get escalation request error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch escalation request',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      data: null
    });
  }
});

/**
 * @route   POST /api/rbac/role-escalation-requests
 * @desc    Request role escalation
 * @access  Authenticated
 */
router.post('/', [
  body('requested_role_id').isUUID().withMessage('Invalid requested role ID'),
  body('reason').trim().notEmpty().withMessage('Reason is required')
    .isLength({ min: 10, max: 500 }).withMessage('Reason must be between 10 and 500 characters')
], handleValidationErrors, rbacWriteRateLimit, rbacAuthMiddleware.authenticate(), async (req, res) => {
  try {
    const { requested_role_id, reason } = req.body;
    const userId = req.user.id;
    
    // Check if requested role exists
    const requestedRole = await roleModel.findById(requested_role_id);
    if (!requestedRole) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Requested role not found'
      });
    }
    
    // Get user's current roles
    const currentRoles = await rbacUtils.getUserRoles(userId);
    if (currentRoles.length === 0) {
      return res.status(400).json({
        error: 'Invalid operation',
        message: 'User has no current roles'
      });
    }
    
    // Get highest current role
    const currentRole = currentRoles[0]; // Already sorted by hierarchy level descending
    
    // Check if user already has the requested role
    const alreadyHasRole = currentRoles.some(r => r.role_id === requested_role_id);
    if (alreadyHasRole) {
      return res.status(400).json({
        error: 'Invalid operation',
        message: 'You already have this role'
      });
    }
    
    // Check if user is trying to downgrade
    if (requestedRole.hierarchy_level < currentRole.hierarchy_level) {
      return res.status(400).json({
        error: 'Invalid operation',
        message: 'Cannot request role downgrade through escalation process'
      });
    }
    
    // Check if user already has a pending request
    const existingRequests = await escalationModel.findByUserId(userId);
    const hasPendingRequest = existingRequests.some(r => r.status === 'pending');
    
    if (hasPendingRequest) {
      return res.status(400).json({
        error: 'Conflict',
        message: 'You already have a pending escalation request'
      });
    }
    
    // Create escalation request
    const escalationRequest = await escalationModel.create({
      user_id: userId,
      current_role_id: currentRole.role_id,
      requested_role_id,
      requested_by: userId,
      reason
    });
    
    // Log escalation request
    await rbacUtils.logRoleChange(userId, 'request_role_escalation', {
      requestId: escalationRequest.id,
      currentRole: currentRole.role_name,
      requestedRole: requestedRole.name,
      reason,
      ip: req.ip
    });
    
    res.status(201).json({
      success: true,
      message: 'Role escalation request submitted successfully',
      data: escalationRequest
    });
  } catch (error) {
    loggerService.error('Create escalation request error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create escalation request',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      data: null
    });
  }
});

/**
 * @route   PUT /api/rbac/role-escalation-requests/:id/approve
 * @desc    Approve escalation request
 * @access  Admin/Super Admin only
 */
router.put('/:id/approve', [
  param('id').isUUID().withMessage('Invalid request ID'),
  body('review_notes').optional().trim()
    .isLength({ max: 500 }).withMessage('Review notes must be less than 500 characters')
], handleValidationErrors, rbacWriteRateLimit, rbacAuthMiddleware.authenticate(),
rbacAuthMiddleware.requireAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    const { review_notes } = req.body;
    
    // Check if request exists
    const request = await escalationModel.findById(id);
    if (!request) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Escalation request not found'
      });
    }
    
    // Check if request is still pending
    if (request.status !== 'pending') {
      return res.status(400).json({
        error: 'Invalid operation',
        message: `Request has already been ${request.status}`
      });
    }
    
    // Check if reviewer can assign the requested role
    const canAssign = await rbacUtils.canAssignRole(req.user.id, request.requested_role_name);
    if (!canAssign) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to approve this request'
      });
    }
    
    // Approve the request
    const approvedRequest = await escalationModel.approve(id, req.user.id, review_notes);
    
    // Log approval
    await rbacUtils.logRoleChange(request.user_id, 'approve_role_escalation', {
      requestId: id,
      currentRole: request.current_role_name,
      requestedRole: request.requested_role_name,
      reviewedBy: req.user.id,
      reviewNotes,
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: 'Role escalation request approved successfully',
      data: approvedRequest
    });
  } catch (error) {
    loggerService.error('Approve escalation request error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve escalation request',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      data: null
    });
  }
});

/**
 * @route   PUT /api/rbac/role-escalation-requests/:id/reject
 * @desc    Reject escalation request
 * @access  Admin/Super Admin only
 */
router.put('/:id/reject', [
  param('id').isUUID().withMessage('Invalid request ID'),
  body('review_notes').optional().trim()
    .isLength({ max: 500 }).withMessage('Review notes must be less than 500 characters')
], handleValidationErrors, rbacWriteRateLimit, rbacAuthMiddleware.authenticate(),
rbacAuthMiddleware.requireAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    const { review_notes } = req.body;
    
    // Check if request exists
    const request = await escalationModel.findById(id);
    if (!request) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Escalation request not found'
      });
    }
    
    // Check if request is still pending
    if (request.status !== 'pending') {
      return res.status(400).json({
        error: 'Invalid operation',
        message: `Request has already been ${request.status}`
      });
    }
    
    // Reject the request
    const rejectedRequest = await escalationModel.reject(id, req.user.id, review_notes);
    
    // Log rejection
    await rbacUtils.logRoleChange(request.user_id, 'reject_role_escalation', {
      requestId: id,
      currentRole: request.current_role_name,
      requestedRole: request.requested_role_name,
      reviewedBy: req.user.id,
      reviewNotes,
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: 'Role escalation request rejected successfully',
      data: rejectedRequest
    });
  } catch (error) {
    loggerService.error('Reject escalation request error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject escalation request',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      data: null
    });
  }
});

/**
 * @route   DELETE /api/rbac/role-escalation-requests/:id
 * @desc    Cancel escalation request
 * @access  Authenticated (own requests only)
 */
router.delete('/:id', [
  param('id').isUUID().withMessage('Invalid request ID')
], handleValidationErrors, rbacWriteRateLimit, rbacAuthMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if request exists
    const request = await escalationModel.findById(id);
    if (!request) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Escalation request not found'
      });
    }
    
    // Check if user owns this request
    if (request.user_id !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only cancel your own requests'
      });
    }
    
    // Check if request is still pending
    if (request.status !== 'pending') {
      return res.status(400).json({
        error: 'Invalid operation',
        message: `Cannot cancel ${request.status} request`
      });
    }
    
    // Cancel the request
    const cancelledRequest = await escalationModel.cancel(id);
    
    // Log cancellation
    await rbacUtils.logRoleChange(request.user_id, 'cancel_role_escalation', {
      requestId: id,
      currentRole: request.current_role_name,
      requestedRole: request.requested_role_name,
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: 'Role escalation request cancelled successfully',
      data: cancelledRequest
    });
  } catch (error) {
    loggerService.error('Cancel escalation request error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel escalation request',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      data: null
    });
  }
});

module.exports = router;
