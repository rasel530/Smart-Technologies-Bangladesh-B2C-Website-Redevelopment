const { PrismaClient } = require('@prisma/client');
const { sessionService } = require('./sessionService');
const { loggerService } = require('./logger');
const { configService } = require('./config');

const prisma = new PrismaClient();

/**
 * OAuth Service
 * Handles Google and Facebook OAuth authentication
 */
class OAuthService {
  constructor() {
    this.providers = {
      google: {
        name: 'GOOGLE',
        enabled: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI || `${process.env.FRONTEND_URL}/auth/callback/google`
      },
      facebook: {
        name: 'FACEBOOK',
        enabled: process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET,
        clientId: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        redirectUri: process.env.FACEBOOK_REDIRECT_URI || `${process.env.FRONTEND_URL}/auth/callback/facebook`
      }
    };
  }

  /**
   * Check if a provider is configured and enabled
   */
  isProviderEnabled(provider) {
    const providerConfig = this.providers[provider.toLowerCase()];
    return providerConfig && providerConfig.enabled;
  }

  /**
   * Get enabled providers
   */
  getEnabledProviders() {
    return Object.entries(this.providers)
      .filter(([_, config]) => config.enabled)
      .map(([key, config]) => ({
        id: key,
        name: config.name,
        displayName: key.charAt(0).toUpperCase() + key.slice(1)
      }));
  }

  /**
   * Find or create user from OAuth profile
   */
  async findOrCreateUser(provider, profile) {
    try {
      const providerEnum = provider.toUpperCase();
      
      // Check if social account already exists
      const existingSocialAccount = await prisma.userSocialAccount.findFirst({
        where: {
          provider: providerEnum,
          providerId: profile.id
        },
        include: {
          user: true
        }
      });

      if (existingSocialAccount) {
        // Update user profile if needed
        const user = existingSocialAccount.user;
        const needsUpdate = 
          (profile.email && user.email !== profile.email) ||
          (profile.firstName && user.firstName !== profile.firstName) ||
          (profile.lastName && user.lastName !== profile.lastName) ||
          (profile.image && user.image !== profile.image);

        if (needsUpdate) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              email: profile.email || user.email,
              firstName: profile.firstName || user.firstName,
              lastName: profile.lastName || user.lastName,
              image: profile.image || user.image,
              emailVerified: profile.email ? user.emailVerified || new Date() : user.emailVerified,
              status: 'ACTIVE'
            }
          });
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });

        return { user, isNew: false };
      }

      // Check if user exists with the same email
      let user = null;
      if (profile.email) {
        user = await prisma.user.findUnique({
          where: { email: profile.email }
        });
      }

      if (user) {
        // Link social account to existing user
        await prisma.userSocialAccount.create({
          data: {
            userId: user.id,
            provider: providerEnum,
            providerId: profile.id
          }
        });

        // Update user profile
        await prisma.user.update({
          where: { id: user.id },
          data: {
            firstName: profile.firstName || user.firstName,
            lastName: profile.lastName || user.lastName,
            image: profile.image || user.image,
            emailVerified: profile.email ? user.emailVerified || new Date() : user.emailVerified,
            status: 'ACTIVE',
            lastLoginAt: new Date()
          }
        });

        return { user, isNew: false, linked: true };
      }

      // Create new user
      const newUser = await prisma.user.create({
        data: {
          email: profile.email || null,
          firstName: profile.firstName || 'User',
          lastName: profile.lastName || '',
          image: profile.image || null,
          role: 'CUSTOMER',
          status: 'ACTIVE',
          emailVerified: profile.email ? new Date() : null,
          lastLoginAt: new Date(),
          socialAccounts: {
            create: {
              provider: providerEnum,
              providerId: profile.id
            }
          }
        }
      });

      return { user: newUser, isNew: true };
    } catch (error) {
      loggerService.error('Error in findOrCreateUser:', error);
      throw error;
    }
  }

  /**
   * Create session after OAuth authentication
   */
  async createOAuthSession(userId, req, options = {}) {
    try {
      const sessionResult = await sessionService.createSession(userId, req, {
        loginType: 'oauth',
        provider: options.provider,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      return sessionResult;
    } catch (error) {
      loggerService.error('Error creating OAuth session:', error);
      throw error;
    }
  }

  /**
   * Link social account to existing user
   */
  async linkSocialAccount(userId, provider, profile) {
    try {
      const providerEnum = provider.toUpperCase();

      // Check if social account already exists
      const existingSocialAccount = await prisma.userSocialAccount.findFirst({
        where: {
          provider: providerEnum,
          providerId: profile.id
        }
      });

      if (existingSocialAccount) {
        if (existingSocialAccount.userId === userId) {
          throw new Error('This social account is already linked to your account');
        } else {
          throw new Error('This social account is already linked to another account');
        }
      }

      // Link social account
      await prisma.userSocialAccount.create({
        data: {
          userId,
          provider: providerEnum,
          providerId: profile.id
        }
      });

      // Update user profile
      await prisma.user.update({
        where: { id: userId },
        data: {
          image: profile.image,
          emailVerified: profile.email ? new Date() : null
        }
      });

      return { success: true };
    } catch (error) {
      loggerService.error('Error linking social account:', error);
      throw error;
    }
  }

  /**
   * Unlink social account
   */
  async unlinkSocialAccount(userId, provider) {
    try {
      const providerEnum = provider.toUpperCase();

      // Check if user has password
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true, email: true, phone: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check if this is the only login method
      const socialAccounts = await prisma.userSocialAccount.findMany({
        where: { userId }
      });

      if (socialAccounts.length === 1 && !user.password) {
        throw new Error('Cannot unlink the only login method. Please set a password first.');
      }

      // Delete social account
      await prisma.userSocialAccount.deleteMany({
        where: {
          userId,
          provider: providerEnum
        }
      });

      return { success: true };
    } catch (error) {
      loggerService.error('Error unlinking social account:', error);
      throw error;
    }
  }

  /**
   * Get user's linked social accounts
   */
  async getUserSocialAccounts(userId) {
    try {
      const socialAccounts = await prisma.userSocialAccount.findMany({
        where: { userId },
        select: {
          id: true,
          provider: true,
          providerId: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return socialAccounts;
    } catch (error) {
      loggerService.error('Error getting user social accounts:', error);
      throw error;
    }
  }

  /**
   * Validate OAuth token (for frontend validation)
   */
  async validateOAuthToken(provider, accessToken) {
    try {
      // This would typically validate the token with the provider
      // For now, we'll just return true if the provider is enabled
      if (!this.isProviderEnabled(provider)) {
        throw new Error(`${provider} OAuth is not configured`);
      }

      return { valid: true };
    } catch (error) {
      loggerService.error('Error validating OAuth token:', error);
      throw error;
    }
  }
}

module.exports = { oauthService: new OAuthService() };
