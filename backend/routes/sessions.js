const express = require('express');
const { body, validationResult } = require('express-validator');
const { sessionService } = require('../services/sessionService');
const { sessionMiddleware } = require('../middleware/session');
const { authMiddleware } = require('../middleware/auth');
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

// Create new session (login)
router.post('/create', [
  body('userId').notEmpty().isUUID(),
  body('loginType').optional().isIn(['password', 'social', 'otp']),
  body('rememberMe').optional().isBoolean(),
  body('maxAge').optional().isInt({ min: 300000, max: 30 * 24 * 60 * 60 * 1000 }) // 5 min to 30 days
], handleValidationErrors, async (req, res) => {
  try {
    const { userId, loginType, rememberMe, maxAge } = req.body;

    // Create new session
    const sessionResult = await sessionService.createSession(userId, req, {
      loginType,
      rememberMe,
      maxAge
    });

    if (!sessionResult.sessionId) {
      return res.status(500).json({
        error: 'Session creation failed',
        message: 'Unable to create session at this time'
      });
    }

    // Set session cookie
    sessionMiddleware.setSessionCookie(res, sessionResult.sessionId, {
      maxAge: sessionResult.maxAge
    });

    // Add session headers
    const sessionHeaders = sessionMiddleware.sessionHeaders(sessionResult);
    Object.keys(sessionHeaders).forEach(key => {
      res.set(key, sessionHeaders[key]);
    });

    res.status(201).json({
      message: 'Session created successfully',
      sessionId: sessionResult.sessionId,
      expiresAt: sessionResult.expiresAt,
      maxAge: sessionResult.maxAge,
      userId
    });

  } catch (error) {
    loggerService.error('Session creation error', error.message);
    res.status(500).json({
      error: 'Session creation failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Validate session
router.get('/validate', sessionMiddleware.required(), async (req, res) => {
  try {
    res.json({
      message: 'Session is valid',
      valid: true,
      session: {
        sessionId: req.sessionId,
        userId: req.userId,
        createdAt: req.session.createdAt,
        lastActivity: req.session.lastActivity,
        expiresAt: req.session.expiresAt,
        loginType: req.session.loginType,
        securityLevel: req.session.securityLevel
      }
    });

  } catch (error) {
    loggerService.error('Session validation error', error.message);
    res.status(500).json({
      error: 'Session validation failed',
      message: 'Unable to validate session at this time'
    });
  }
});

// Refresh session
router.post('/refresh', [
  body('sessionId').optional().isUUID(),
  body('maxAge').optional().isInt({ min: 300000, max: 30 * 24 * 60 * 60 * 1000 })
], handleValidationErrors, async (req, res) => {
  try {
    // Get session ID from body or current session
    const sessionId = req.body.sessionId || req.sessionId;
    
    if (!sessionId) {
      return res.status(400).json({
        error: 'Session ID required',
        message: 'Session ID is required to refresh session'
      });
    }

    const refreshResult = await sessionService.refreshSession(sessionId, req, {
      maxAge: req.body.maxAge
    });

    if (!refreshResult.success) {
      return res.status(401).json({
        error: 'Session refresh failed',
        message: refreshResult.reason
      });
    }

    // Update session cookie if this is current session
    if (!req.body.sessionId && req.sessionId === sessionId) {
      sessionMiddleware.setSessionCookie(res, sessionId, {
        maxAge: refreshResult.maxAge
      });
    }

    // Add updated session headers
    const sessionHeaders = sessionMiddleware.sessionHeaders(refreshResult);
    Object.keys(sessionHeaders).forEach(key => {
      res.set(key, sessionHeaders[key]);
    });

    res.json({
      message: 'Session refreshed successfully',
      sessionId: refreshResult.sessionId,
      expiresAt: refreshResult.expiresAt,
      maxAge: refreshResult.maxAge
    });

  } catch (error) {
    loggerService.error('Session refresh error', error.message);
    res.status(500).json({
      error: 'Session refresh failed',
      message: 'Unable to refresh session at this time'
    });
  }
});

// Destroy session (logout)
router.post('/destroy', [
  body('sessionId').optional().isUUID(),
  body('allDevices').optional().isBoolean()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { sessionId, allDevices } = req.body;
    const userId = req.userId;

    if (allDevices) {
      // Destroy all sessions for this user
      const result = await sessionService.destroyAllUserSessions(userId, sessionId);
      
      if (!result.success) {
        return res.status(500).json({
          error: 'Session destruction failed',
          message: result.reason
        });
      }

      // Clear session cookie
      sessionMiddleware.clearSessionCookie(res);

      res.json({
        message: 'All sessions destroyed successfully',
        destroyedCount: result.destroyedCount,
        allDevices: true
      });

    } else {
      // Destroy specific session
      const targetSessionId = sessionId || req.sessionId;
      
      if (!targetSessionId) {
        return res.status(400).json({
          error: 'Session ID required',
          message: 'Session ID is required to destroy session'
        });
      }

      const result = await sessionService.destroySession(targetSessionId, 'user_logout');
      
      if (!result.success) {
        return res.status(500).json({
          error: 'Session destruction failed',
          message: result.reason
        });
      }

      // Clear session cookie if destroying current session
      if (targetSessionId === req.sessionId) {
        sessionMiddleware.clearSessionCookie(res);
      }

      res.json({
        message: 'Session destroyed successfully',
        sessionId: targetSessionId,
        allDevices: false
      });
    }

  } catch (error) {
    loggerService.error('Session destruction error', error.message);
    res.status(500).json({
      error: 'Session destruction failed',
      message: 'Unable to destroy session at this time'
    });
  }
});

// Get user sessions
router.get('/user', authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.userId;
    const result = await sessionService.getUserSessions(userId);

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to retrieve sessions',
        message: result.reason
      });
    }

    // Mark current session
    const sessionsWithCurrent = result.sessions.map(session => ({
      ...session,
      isCurrent: session.sessionId === req.sessionId
    }));

    res.json({
      message: 'User sessions retrieved successfully',
      sessions: sessionsWithCurrent,
      totalSessions: sessionsWithCurrent.length,
      activeSessions: sessionsWithCurrent.filter(s => s.isActive).length
    });

  } catch (error) {
    loggerService.error('Get user sessions error', error.message);
    res.status(500).json({
      error: 'Failed to retrieve sessions',
      message: 'Unable to retrieve sessions at this time'
    });
  }
});

// Get session statistics
router.get('/stats', authMiddleware.authorize(['ADMIN']), async (req, res) => {
  try {
    const result = await sessionService.getSessionStats();

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to retrieve session statistics',
        message: result.reason
      });
    }

    res.json({
      message: 'Session statistics retrieved successfully',
      stats: result.stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    loggerService.error('Session stats error', error.message);
    res.status(500).json({
      error: 'Failed to retrieve session statistics',
      message: 'Unable to retrieve session statistics at this time'
    });
  }
});

// Cleanup expired sessions (admin only)
router.post('/cleanup', authMiddleware.authorize(['ADMIN']), async (req, res) => {
  try {
    const result = await sessionService.cleanupExpiredSessions();

    if (!result.success) {
      return res.status(500).json({
        error: 'Session cleanup failed',
        message: result.reason
      });
    }

    res.json({
      message: 'Session cleanup completed successfully',
      cleanedCount: result.cleanedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    loggerService.error('Session cleanup error', error.message);
    res.status(500).json({
      error: 'Session cleanup failed',
      message: 'Unable to cleanup sessions at this time'
    });
  }
});

// Check session status (without authentication)
router.get('/status', async (req, res) => {
  try {
    const sessionId = sessionMiddleware.getSessionId(req);
    
    if (!sessionId) {
      return res.json({
        message: 'No session found',
        hasSession: false,
        sessionId: null
      });
    }

    const validation = await sessionService.validateSession(sessionId, req);
    
    res.json({
      message: validation.valid ? 'Session is valid' : 'Session is invalid',
      hasSession: validation.valid,
      sessionId,
      valid: validation.valid,
      reason: validation.reason || null,
      userId: validation.valid ? validation.userId : null
    });

  } catch (error) {
    loggerService.error('Session status check error', error.message);
    res.status(500).json({
      error: 'Session status check failed',
      message: 'Unable to check session status at this time'
    });
  }
});

module.exports = router;