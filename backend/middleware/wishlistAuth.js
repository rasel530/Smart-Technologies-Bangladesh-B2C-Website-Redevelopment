const { wishlistService } = require('../services/wishlistService');
const { loggerService } = require('../services/logger');

/**
 * Wishlist Auth Middleware
 * 
 * Authorization middleware for wishlist operations
 */

/**
 * Verify that the user owns the wishlist
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyWishlistOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'You must be authenticated to access this resource',
        messageBn: 'আপনাকে প্রমাণীকরণ করতে হবে'
      });
    }

    const isOwner = await wishlistService.verifyOwnership(id, userId);

    if (!isOwner) {
      loggerService.warn('Wishlist ownership verification failed', {
        wishlistId: id,
        userId
      });

      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to access this wishlist',
        messageBn: 'আপনার এই উইশলিস্ট অ্যাক্সেস করার অনুমতি নেই'
      });
    }

    next();
  } catch (error) {
    loggerService.error('Error in wishlist ownership verification', {
      wishlistId: req.params.id,
      error: error.message
    });

    return res.status(500).json({
      success: false,
      error: 'Error verifying ownership',
      message: 'An error occurred while verifying ownership',
      messageBn: 'মালিকানা যাচাই করতে সমস্যা হয়েছে'
    });
  }
};

/**
 * Verify that the user owns the wishlist or is an admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyWishlistOwnershipOrAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'You must be authenticated to access this resource',
        messageBn: 'আপনাকে প্রমাণীকরণ করতে হবে'
      });
    }

    // Check if user is admin
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      return next();
    }

    const isOwner = await wishlistService.verifyOwnership(id, userId);

    if (!isOwner) {
      loggerService.warn('Wishlist ownership verification failed', {
        wishlistId: id,
        userId,
        userRole
      });

      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to access this wishlist',
        messageBn: 'আপনার এই উইশলিস্ট অ্যাক্সেস করার অনুমতি নেই'
      });
    }

    next();
  } catch (error) {
    loggerService.error('Error in wishlist ownership verification', {
      wishlistId: req.params.id,
      error: error.message
    });

    return res.status(500).json({
      success: false,
      error: 'Error verifying ownership',
      message: 'An error occurred while verifying ownership',
      messageBn: 'মালিকানা যাচাই করতে সমস্যা হয়েছে'
    });
  }
};

/**
 * Verify admin access for analytics endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyAdminAccess = (req, res, next) => {
  try {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'You must be authenticated to access this resource',
        messageBn: 'আপনাকে প্রমাণীকরণ করতে হবে'
      });
    }

    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      loggerService.warn('Admin access verification failed', {
        userId: req.user?.id,
        userRole
      });

      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Admin access required',
        messageBn: 'অ্যাডমিন অ্যাক্সেস প্রয়োজন'
      });
    }

    next();
  } catch (error) {
    loggerService.error('Error in admin access verification', {
      userId: req.user?.id,
      error: error.message
    });

    return res.status(500).json({
      success: false,
      error: 'Error verifying admin access',
      message: 'An error occurred while verifying admin access',
      messageBn: 'অ্যাডমিন অ্যাক্সেস যাচাই করতে সমস্যা হয়েছে'
    });
  }
};

/**
 * Check if wishlist is public or user owns it
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyPublicAccessOrOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const shareToken = req.query.shareToken;

    // If share token is provided, allow public access
    if (shareToken) {
      return next();
    }

    // If no user, check if wishlist is public
    if (!userId) {
      const wishlist = await wishlistService.getWishlistById(id, false);

      if (!wishlist) {
        return res.status(404).json({
          success: false,
          error: 'Wishlist not found',
          message: 'The requested wishlist was not found',
          messageBn: 'অনুরোধ করা উইশলিস্ট পাওয়া যায়নি'
        });
      }

      if (!wishlist.isPublic) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'This wishlist is private',
          messageBn: 'এই উইশলিস্টটি ব্যক্তিগত'
        });
      }

      return next();
    }

    // Verify ownership for authenticated users
    const isOwner = await wishlistService.verifyOwnership(id, userId);

    if (!isOwner) {
      const wishlist = await wishlistService.getWishlistById(id, false);

      if (!wishlist || !wishlist.isPublic) {
        loggerService.warn('Wishlist access denied', {
          wishlistId: id,
          userId
        });

        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You do not have permission to access this wishlist',
          messageBn: 'আপনার এই উইশলিস্ট অ্যাক্সেস করার অনুমতি নেই'
        });
      }
    }

    next();
  } catch (error) {
    loggerService.error('Error in public access verification', {
      wishlistId: req.params.id,
      error: error.message
    });

    return res.status(500).json({
      success: false,
      error: 'Error verifying access',
      message: 'An error occurred while verifying access',
      messageBn: 'অ্যাক্সেস যাচাই করতে সমস্যা হয়েছে'
    });
  }
};

module.exports = {
  verifyWishlistOwnership,
  verifyWishlistOwnershipOrAdmin,
  verifyAdminAccess,
  verifyPublicAccessOrOwnership
};
