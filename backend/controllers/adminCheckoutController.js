/**
 * Admin Checkout Controller
 * 
 * This controller handles admin operations for checkout management including:
 * - Viewing and managing checkout sessions
 * - Tracking checkout abandonment
 * - Managing guest checkout sessions
 * - Providing checkout analytics
 * - Configuring checkout settings
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');

/**
 * Get all checkout sessions with filtering and pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCheckoutSessions = async (req, res) => {
  try {
    const {
      status,
      userType,
      step,
      search,
      limit = 20,
      offset = 0
    } = req.query;

    // Build where clause
    const where = {};

    if (status) {
      where.status = status;
    }

    if (userType) {
      where.userType = userType;
    }

    if (step) {
      where.currentStep = step;
    }

    if (search) {
      where.OR = [
        { sessionId: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get sessions with pagination
    const [sessions, total] = await Promise.all([
      prisma.checkoutSession.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
        include: {
          cart: {
            include: {
              items: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      price: true,
                      images: true
                    }
                  }
                }
              }
            }
          },
          shippingAddress: true,
          billingAddress: true
        }
      }),
      prisma.checkoutSession.count({ where })
    ]);

    logger.info(`Admin retrieved ${sessions.length} checkout sessions`, {
      adminId: req.user?.id,
      filters: { status, userType, step }
    });

    res.json({
      success: true,
      data: sessions,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching checkout sessions', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch checkout sessions',
      message: error.message
    });
  }
};

/**
 * Get detailed checkout session information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCheckoutSessionDetails = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.checkoutSession.findUnique({
      where: { sessionId },
      include: {
        cart: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    images: true,
                    stock: true,
                    category: {
                      select: {
                        id: true,
                        name: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        shippingAddress: true,
        billingAddress: true,
        abandonment: true,
        guestSession: true
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Checkout session not found'
      });
    }

    logger.info(`Admin viewed checkout session details`, {
      adminId: req.user?.id,
      sessionId
    });

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    logger.error('Error fetching checkout session details', { 
      error: error.message,
      sessionId: req.params.sessionId 
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch checkout session details',
      message: error.message
    });
  }
};

/**
 * Cancel/abandon a checkout session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const cancelCheckoutSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason = 'Admin cancelled' } = req.body;

    const session = await prisma.checkoutSession.findUnique({
      where: { sessionId }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Checkout session not found'
      });
    }

    // Update session status to abandoned
    const updatedSession = await prisma.checkoutSession.update({
      where: { sessionId },
      data: {
        status: 'abandoned',
        completedAt: new Date()
      }
    });

    // Create abandonment record if it doesn't exist
    const existingAbandonment = await prisma.checkoutAbandonment.findFirst({
      where: { sessionId }
    });

    if (!existingAbandonment) {
      await prisma.checkoutAbandonment.create({
        data: {
          sessionId,
          step: session.currentStep,
          reason,
          cartValue: session.cartValue || 0,
          recovered: false,
          recoveryAttempts: 0
        }
      });
    }

    logger.info(`Admin cancelled checkout session`, {
      adminId: req.user?.id,
      sessionId,
      reason
    });

    res.json({
      success: true,
      data: updatedSession,
      message: 'Checkout session cancelled successfully'
    });
  } catch (error) {
    logger.error('Error cancelling checkout session', { 
      error: error.message,
      sessionId: req.params.sessionId 
    });
    res.status(500).json({
      success: false,
      error: 'Failed to cancel checkout session',
      message: error.message
    });
  }
};

/**
 * Get abandoned checkout sessions with filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAbandonedCheckouts = async (req, res) => {
  try {
    const {
      step,
      reason,
      recovered,
      limit = 20,
      offset = 0
    } = req.query;

    // Build where clause
    const where = {};

    if (step) {
      where.step = step;
    }

    if (reason) {
      where.reason = { contains: reason, mode: 'insensitive' };
    }

    if (recovered !== undefined) {
      where.recovered = recovered === 'true';
    }

    // Get abandoned checkouts with pagination
    const [abandonments, total] = await Promise.all([
      prisma.checkoutAbandonment.findMany({
        where,
        orderBy: { abandonedAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
        include: {
          session: {
            include: {
              cart: {
                include: {
                  items: {
                    include: {
                      product: {
                        select: {
                          id: true,
                          name: true,
                          price: true,
                          images: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }),
      prisma.checkoutAbandonment.count({ where })
    ]);

    logger.info(`Admin retrieved ${abandonments.length} abandoned checkouts`, {
      adminId: req.user?.id,
      filters: { step, reason, recovered }
    });

    res.json({
      success: true,
      data: abandonments,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching abandoned checkouts', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch abandoned checkouts',
      message: error.message
    });
  }
};

/**
 * Send recovery email for abandoned checkout
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendRecoveryEmail = async (req, res) => {
  try {
    const { id } = req.params;

    const abandonment = await prisma.checkoutAbandonment.findUnique({
      where: { id: parseInt(id) },
      include: {
        session: true
      }
    });

    if (!abandonment) {
      return res.status(404).json({
        success: false,
        error: 'Abandoned checkout not found'
      });
    }

    if (abandonment.recovered) {
      return res.status(400).json({
        success: false,
        error: 'This checkout has already been recovered'
      });
    }

    // Increment recovery attempts
    const updatedAbandonment = await prisma.checkoutAbandonment.update({
      where: { id: parseInt(id) },
      data: {
        recoveryAttempts: abandonment.recoveryAttempts + 1,
        lastRecoveryAttempt: new Date()
      }
    });

    // TODO: Implement actual email sending logic
    // This would integrate with your email service
    // For now, we'll just log it
    logger.info(`Recovery email sent for abandoned checkout`, {
      adminId: req.user?.id,
      abandonmentId: id,
      sessionId: abandonment.sessionId,
      email: abandonment.session?.email
    });

    res.json({
      success: true,
      data: updatedAbandonment,
      message: 'Recovery email sent successfully'
    });
  } catch (error) {
    logger.error('Error sending recovery email', { 
      error: error.message,
      abandonmentId: req.params.id 
    });
    res.status(500).json({
      success: false,
      error: 'Failed to send recovery email',
      message: error.message
    });
  }
};

/**
 * Get guest checkout sessions with filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getGuestCheckoutSessions = async (req, res) => {
  try {
    const {
      converted,
      status,
      search,
      limit = 20,
      offset = 0
    } = req.query;

    // Build where clause
    const where = {};

    if (converted !== undefined) {
      where.converted = converted === 'true';
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { sessionId: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get guest sessions with pagination
    const [guestSessions, total] = await Promise.all([
      prisma.guestSession.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
        include: {
          checkoutSession: {
            include: {
              cart: {
                include: {
                  items: {
                    include: {
                      product: {
                        select: {
                          id: true,
                          name: true,
                          price: true,
                          images: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }),
      prisma.guestSession.count({ where })
    ]);

    logger.info(`Admin retrieved ${guestSessions.length} guest checkout sessions`, {
      adminId: req.user?.id,
      filters: { converted, status }
    });

    res.json({
      success: true,
      data: guestSessions,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching guest checkout sessions', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch guest checkout sessions',
      message: error.message
    });
  }
};

/**
 * Get comprehensive checkout analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCheckoutAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    }

    // Get all sessions in date range
    const sessions = await prisma.checkoutSession.findMany({
      where: dateFilter,
      include: {
        abandonment: true,
        guestSession: true
      }
    });

    // Calculate metrics
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const abandonedSessions = sessions.filter(s => s.status === 'abandoned').length;
    const activeSessions = sessions.filter(s => s.status === 'active').length;
    const expiredSessions = sessions.filter(s => s.status === 'expired').length;

    const conversionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
    const abandonmentRate = totalSessions > 0 ? (abandonedSessions / totalSessions) * 100 : 0;

    // Guest vs Authenticated
    const guestSessions = sessions.filter(s => s.userType === 'guest');
    const authenticatedSessions = sessions.filter(s => s.userType === 'authenticated');
    
    const guestCompleted = guestSessions.filter(s => s.status === 'completed').length;
    const authenticatedCompleted = authenticatedSessions.filter(s => s.status === 'completed').length;

    const guestConversionRate = guestSessions.length > 0 ? (guestCompleted / guestSessions.length) * 100 : 0;
    const authenticatedConversionRate = authenticatedSessions.length > 0 ? (authenticatedCompleted / authenticatedSessions.length) * 100 : 0;

    // Abandonment by step
    const abandonmentByStep = {};
    sessions.filter(s => s.abandonment).forEach(session => {
      const step = session.abandonment.step;
      abandonmentByStep[step] = (abandonmentByStep[step] || 0) + 1;
    });

    // Recovery rate
    const recoveredAbandonments = sessions.filter(s => s.abandonment?.recovered).length;
    const recoveryRate = abandonedSessions > 0 ? (recoveredAbandonments / abandonedSessions) * 100 : 0;

    // Average cart value
    const completedCartValues = sessions
      .filter(s => s.status === 'completed' && s.cartValue)
      .map(s => s.cartValue);
    const avgCartValue = completedCartValues.length > 0 
      ? completedCartValues.reduce((a, b) => a + b, 0) / completedCartValues.length 
      : 0;

    // Mobile vs Desktop (if device info is stored)
    const mobileSessions = sessions.filter(s => s.deviceType === 'mobile').length;
    const desktopSessions = sessions.filter(s => s.deviceType === 'desktop').length;

    // Step-by-step analytics
    const steps = ['cart', 'shipping', 'billing', 'payment', 'review', 'confirmation'];
    const stepAnalytics = {};
    
    steps.forEach(step => {
      const sessionsAtStep = sessions.filter(s => s.currentStep === step);
      const completedAtStep = sessionsAtStep.filter(s => s.status === 'completed').length;
      
      stepAnalytics[step] = {
        total: sessionsAtStep.length,
        completed: completedAtStep,
        abandoned: sessionsAtStep.filter(s => s.status === 'abandoned').length,
        conversionRate: sessionsAtStep.length > 0 ? (completedAtStep / sessionsAtStep.length) * 100 : 0
      };
    });

    // Time spent in checkout (if tracking is implemented)
    const avgTimeToComplete = 0; // Placeholder - would need actual time tracking

    logger.info(`Admin retrieved checkout analytics`, {
      adminId: req.user?.id,
      dateRange: { startDate, endDate }
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalSessions,
          completedSessions,
          abandonedSessions,
          activeSessions,
          expiredSessions,
          conversionRate: Math.round(conversionRate * 100) / 100,
          abandonmentRate: Math.round(abandonmentRate * 100) / 100,
          recoveryRate: Math.round(recoveryRate * 100) / 100,
          avgCartValue: Math.round(avgCartValue * 100) / 100,
          avgTimeToComplete
        },
        userTypeComparison: {
          guest: {
            total: guestSessions.length,
            completed: guestCompleted,
            conversionRate: Math.round(guestConversionRate * 100) / 100
          },
          authenticated: {
            total: authenticatedSessions.length,
            completed: authenticatedCompleted,
            conversionRate: Math.round(authenticatedConversionRate * 100) / 100
          }
        },
        abandonmentByStep,
        stepAnalytics,
        deviceType: {
          mobile: mobileSessions,
          desktop: desktopSessions
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching checkout analytics', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch checkout analytics',
      message: error.message
    });
  }
};

/**
 * Get checkout settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCheckoutSettings = async (req, res) => {
  try {
    // For now, return default settings
    // In production, these would be stored in a settings table or config file
    const settings = {
      sessionTimeout: 1800, // 30 minutes in seconds
      abandonmentDetection: {
        enabled: true,
        timeoutMinutes: 30,
        checkIntervalMinutes: 5
      },
      recoveryEmail: {
        enabled: true,
        sendAfterMinutes: 30,
        maxAttempts: 3
      },
      guestCheckout: {
        enabled: true,
        requireEmail: true,
        requirePhone: false,
        maxSessionDuration: 3600, // 1 hour in seconds
        allowAccountCreation: true
      },
      security: {
        requireAuthForHighValue: true,
        highValueThreshold: 1000,
        enableFraudDetection: false
      },
      mobile: {
        enabled: true,
        optimizeForMobile: true,
        showMobileOptimizedUI: true
      },
      steps: {
        cart: { enabled: true, required: true },
        shipping: { enabled: true, required: true },
        billing: { enabled: true, required: true },
        payment: { enabled: true, required: true },
        review: { enabled: true, required: false },
        confirmation: { enabled: true, required: true }
      }
    };

    logger.info(`Admin retrieved checkout settings`, {
      adminId: req.user?.id
    });

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    logger.error('Error fetching checkout settings', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch checkout settings',
      message: error.message
    });
  }
};

/**
 * Update checkout settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateCheckoutSettings = async (req, res) => {
  try {
    const settings = req.body;

    // Validate settings structure
    const allowedKeys = [
      'sessionTimeout',
      'abandonmentDetection',
      'recoveryEmail',
      'guestCheckout',
      'security',
      'mobile',
      'steps'
    ];

    const invalidKeys = Object.keys(settings).filter(key => !allowedKeys.includes(key));
    if (invalidKeys.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid settings keys: ${invalidKeys.join(', ')}`
      });
    }

    // TODO: Store settings in database or config file
    // For now, we'll just return success
    logger.info(`Admin updated checkout settings`, {
      adminId: req.user?.id,
      settings
    });

    res.json({
      success: true,
      data: settings,
      message: 'Checkout settings updated successfully'
    });
  } catch (error) {
    logger.error('Error updating checkout settings', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to update checkout settings',
      message: error.message
    });
  }
};

module.exports = {
  getCheckoutSessions,
  getCheckoutSessionDetails,
  cancelCheckoutSession,
  getAbandonedCheckouts,
  sendRecoveryEmail,
  getGuestCheckoutSessions,
  getCheckoutAnalytics,
  getCheckoutSettings,
  updateCheckoutSettings
};
