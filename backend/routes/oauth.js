const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { oauthService } = require('../services/oauthService');
const { sessionMiddleware } = require('../middleware/session');
const { authMiddleware } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

const router = express.Router();
const prisma = new PrismaClient();

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
 * Get enabled OAuth providers
 */
router.get('/providers', async (req, res) => {
  try {
    const providers = oauthService.getEnabledProviders();

    res.json({
      providers,
      message: 'Available OAuth providers',
      messageBn: 'উপলব্ধ OAuth প্রদানকারী'
    });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({
      error: 'Failed to get providers',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'প্রদানকারী পেতে ব্যর্থ হয়েছে'
    });
  }
});

/**
 * OAuth callback handler
 * This endpoint receives the OAuth profile data from frontend
 */
router.post('/callback/:provider', [
  body('profile').notEmpty(),
  body('profile.id').notEmpty(),
  body('profile.email').optional().isEmail(),
  body('profile.firstName').optional().isString(),
  body('profile.lastName').optional().isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { provider } = req.params;
    const { profile } = req.body;

    // Validate provider
    if (!oauthService.isProviderEnabled(provider)) {
      return res.status(400).json({
        error: 'Provider not enabled',
        message: `${provider} OAuth is not configured or enabled`,
        messageBn: `${provider} OAuth কনফিগার বা সক্রিয় নয়`
      });
    }

    // Find or create user
    const { user, isNew, linked } = await oauthService.findOrCreateUser(provider, profile);

    // Create session
    const sessionResult = await oauthService.createOAuthSession(user.id, req, {
      provider
    });

    if (!sessionResult.sessionId) {
      return res.status(500).json({
        error: 'Authentication failed',
        message: 'Unable to create session',
        messageBn: 'সেশন তৈরি করতে ব্যর্থ হয়েছে'
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

    // Generate JWT token for API compatibility
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        sessionId: sessionResult.sessionId,
        provider
      },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    res.json({
      message: isNew ? 'Account created successfully' : 'Login successful',
      messageBn: isNew ? 'অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে' : 'লগইন সফল',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        role: user.role,
        status: user.status
      },
      token,
      sessionId: sessionResult.sessionId,
      expiresAt: sessionResult.expiresAt,
      maxAge: sessionResult.maxAge,
      provider,
      isNew,
      linked
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'প্রমাণীকরণ ব্যর্থ হয়েছে'
    });
  }
});

/**
 * Link social account to authenticated user
 */
router.post('/link/:provider', [
  authMiddleware.authenticate(),
  body('profile').notEmpty(),
  body('profile.id').notEmpty()
], handleValidationErrors, async (req, res) => {
  try {
    const { provider } = req.params;
    const { profile } = req.body;
    const userId = req.user.id;

    // Validate provider
    if (!oauthService.isProviderEnabled(provider)) {
      return res.status(400).json({
        error: 'Provider not enabled',
        message: `${provider} OAuth is not configured or enabled`,
        messageBn: `${provider} OAuth কনফিগার বা সক্রিয় নয়`
      });
    }

    // Link social account
    await oauthService.linkSocialAccount(userId, provider, profile);

    res.json({
      message: 'Social account linked successfully',
      messageBn: 'সোশ্যাল অ্যাকাউন্ট সফলভাবে লিঙ্ক করা হয়েছে',
      provider
    });
  } catch (error) {
    console.error('Link social account error:', error);
    
    const errorMessage = error.message || 'Failed to link social account';
    const errorMessageBn = 'সোশ্যাল অ্যাকাউন্ট লিঙ্ক করতে ব্যর্থ হয়েছে';

    res.status(400).json({
      error: 'Link failed',
      message: errorMessage,
      messageBn: errorMessageBn
    });
  }
});

/**
 * Unlink social account
 */
router.delete('/unlink/:provider', [
  authMiddleware.authenticate()
], async (req, res) => {
  try {
    const { provider } = req.params;
    const userId = req.user.id;

    // Validate provider
    if (!oauthService.isProviderEnabled(provider)) {
      return res.status(400).json({
        error: 'Provider not enabled',
        message: `${provider} OAuth is not configured or enabled`,
        messageBn: `${provider} OAuth কনফিগার বা সক্রিয় নয়`
      });
    }

    // Unlink social account
    await oauthService.unlinkSocialAccount(userId, provider);

    res.json({
      message: 'Social account unlinked successfully',
      messageBn: 'সোশ্যাল অ্যাকাউন্ট আনলিঙ্ক সফলভাবে সম্পন্ন হয়েছে',
      provider
    });
  } catch (error) {
    console.error('Unlink social account error:', error);
    
    const errorMessage = error.message || 'Failed to unlink social account';
    const errorMessageBn = 'সোশ্যাল অ্যাকাউন্ট আনলিঙ্ক করতে ব্যর্থ হয়েছে';

    res.status(400).json({
      error: 'Unlink failed',
      message: errorMessage,
      messageBn: errorMessageBn
    });
  }
});

/**
 * Get user's linked social accounts
 */
router.get('/accounts', [
  authMiddleware.authenticate()
], async (req, res) => {
  try {
    const userId = req.user.id;
    const socialAccounts = await oauthService.getUserSocialAccounts(userId);

    res.json({
      socialAccounts,
      message: 'Social accounts retrieved successfully',
      messageBn: 'সোশ্যাল অ্যাকাউন্ট সফলভাবে পুনরুদ্ধার করা হয়েছে'
    });
  } catch (error) {
    console.error('Get social accounts error:', error);
    res.status(500).json({
      error: 'Failed to get social accounts',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'সোশ্যাল অ্যাকাউন্ট পেতে ব্যর্থ হয়েছে'
    });
  }
});

/**
 * Validate OAuth token
 */
router.post('/validate/:provider', [
  body('accessToken').notEmpty()
], handleValidationErrors, async (req, res) => {
  try {
    const { provider } = req.params;
    const { accessToken } = req.body;

    const validation = await oauthService.validateOAuthToken(provider, accessToken);

    res.json({
      valid: validation.valid,
      message: validation.valid ? 'Token is valid' : 'Token is invalid',
      messageBn: validation.valid ? 'টোকেন বৈধ' : 'টোকেন অবৈধ'
    });
  } catch (error) {
    console.error('Validate OAuth token error:', error);
    res.status(500).json({
      error: 'Validation failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'যাচাই ব্যর্থ হয়েছে'
    });
  }
});

module.exports = router;
