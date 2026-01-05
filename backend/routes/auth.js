const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { emailService } = require('../services/emailService');
const { smsService } = require('../services/smsService');
const { otpService } = require('../services/otpService');
const { authMiddleware } = require('../middleware/auth');
const { sessionMiddleware } = require('../middleware/session');
const { sessionService } = require('../services/sessionService');
const { passwordService } = require('../services/passwordService');
const { phoneValidationService } = require('../services/phoneValidationService');
const { configService } = require('../services/config');
const { loggerService } = require('../services/logger');
const { loginSecurityService } = require('../services/loginSecurityService');
const { loginSecurityMiddleware } = require('../middleware/loginSecurity');

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

// Register endpoint
// Standardized property names: firstName, lastName, phone (matching frontend convention)
router.post('/register', [
  body('email').optional().trim().isEmail().withMessage('Invalid email format').normalizeEmail().withMessage('Email format is invalid'),
  body('password').isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters'),
  body('firstName').optional().notEmpty().trim().withMessage('First name is required'),
  body('lastName').optional().notEmpty().trim().withMessage('Last name is required'),
  body('phone').optional().notEmpty().trim().withMessage('Phone number is required'),
  body('confirmPassword').notEmpty().trim().withMessage('Password confirmation is required'),
  body('dateOfBirth').optional().isISO8601().withMessage('Invalid date format'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('nationalId').optional().trim(),
  body('division').optional().trim(),
  body('district').optional().trim(),
  body('upazila').optional().trim(),
  body('addressLine1').optional().trim(),
  body('addressLine2').optional().trim(),
  body('postalCode').optional().trim()
], handleValidationErrors, async (req, res) => {
  try {
  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    confirmPassword,
    dateOfBirth,
    gender,
    nationalId,
    division,
    district,
    upazila,
    addressLine1,
    addressLine2,
    postalCode,
    preferredLanguage,
    marketingConsent,
    termsAccepted
  } = req.body;
  
  // Validate that at least email or phone is provided
  if (!email && !phone) {
    return res.status(400).json({
      error: 'Email or phone required',
      message: 'Please provide either email or phone number for registration',
      messageBn: 'অনুগ্রহ ইমেল বা ফোন নম্বর দিন'
    });
  }
  
  // Validate confirm password matches
  if (password !== confirmPassword) {
    return res.status(400).json({
      error: 'Passwords do not match',
      message: 'Password and confirm password must match',
      messageBn: 'পাসওয়ার্ড এবং নিশ্চিত পাসওয়ার্ড মিলতে হবে'
    });
  }


  // Validate password strength
  const userInfo = { firstName, lastName, email, phone };
  const passwordValidation = passwordService.validatePasswordStrength(password, userInfo);
  
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      error: 'Password does not meet requirements',
      message: 'Password is too weak or does not meet security requirements',
      messageBn: 'পাসওয়ার্ড খুবই বা নিরাপত্তিগিয় পূর্ব',
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

    // Validate email if provided
    if (email) {
      if (!emailService.validateEmail(email)) {
        return res.status(400).json({
          error: 'Invalid email format',
          message: 'Please provide a valid email address',
          messageBn: 'অনুগ্রহ ইমেল ঠিকানা দিন'
        });
      }

      if (emailService.isDisposableEmail(email)) {
        return res.status(400).json({
          error: 'Disposable email not allowed',
          message: 'Please use a permanent email address for registration',
          messageBn: 'নিবন্ধন ইমেল ব্যবহার করুন, অনুগ্রহ ইমেল ব্যবহার করুন'
        });
      }
    }

    // Validate phone if provided
    let phoneValidation = null;
    if (phone) {
      phoneValidation = phoneValidationService.validateForUseCase(phone, 'registration');
      if (!phoneValidation.isValid) {
        return res.status(400).json({
          error: 'Invalid phone format',
          message: phoneValidation.error,
          messageBn: phoneValidation.errorBn,
          code: phoneValidation.code
        });
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phoneValidation?.isValid ? [{ phone: phoneValidation.normalizedPhone }] : [])
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email or phone number already exists',
        messageBn: 'এই ইমেল বা ফোন নম্বর দিয়ে একাউন্ট বিদ্যমান রয়েছে',
        field: existingUser.email === email ? 'email' : 'phone'
      });
    }

    // Hash password using password service
    const hashedPassword = await passwordService.hashPassword(password);

    // Create user with PENDING status
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phoneValidation?.normalizedPhone || phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        role: 'CUSTOMER',
        status: 'PENDING'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true
      }
    });

    // Create address if address information is provided
    if (addressLine1 && division && district) {
      try {
        await prisma.address.create({
          data: {
            userId: user.id,
            type: 'SHIPPING',
            firstName,
            lastName,
            phone: phoneValidation?.normalizedPhone || phone,
            address: addressLine1,
            addressLine2,
            city: district,
            district,
            division: division.toUpperCase(),
            upazila: upazila,
            postalCode,
            isDefault: true
          }
        });
      } catch (addressError) {
        console.error('Failed to create address:', addressError);
        // Don't fail registration if address creation fails
      }
    }

    // Save password to history
    await passwordService.savePasswordToHistory(user.id, hashedPassword);

    // Check if testing mode is enabled
    const isTestingMode = configService.isTestingMode();
    const isEmailVerificationDisabled = configService.isEmailVerificationDisabled();
    const isPhoneVerificationDisabled = configService.isPhoneVerificationDisabled();

    // Handle verification based on what's provided and testing mode
    if (email && !isEmailVerificationDisabled) {
      // Email verification flow
      const verificationToken = emailService.generateVerificationToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Save verification token to database
      try {
        await prisma.emailVerificationToken.create({
          data: {
            userId: user.id,
            token: verificationToken,
            expiresAt
          }
        });
      } catch (dbError) {
        console.error('Failed to create email verification token:', dbError);
        // Cleanup user if token creation fails
        await prisma.user.delete({
          where: { id: user.id }
        });
        
        return res.status(500).json({
          error: 'Registration failed',
          message: 'Failed to create verification token. Please try again.',
          messageBn: 'যাচাই টোকেন তৈরি করতে ব্যর্থ হয়েছে। অনুগ্রহ চেষ্টা করুন।',
          timestamp: new Date().toISOString()
        });
      }

      // Send verification email
      try {
        const emailResult = await emailService.sendVerificationEmail(
          email,
          `${firstName} ${lastName}`,
          verificationToken
        );

        // Check if email was sent in fallback mode (testing mode)
        if (!emailResult.success && !emailResult.fallback) {
          // If email fails and not in fallback mode, delete user and token for cleanup
          await prisma.emailVerificationToken.delete({
            where: { userId: user.id }
          });
          await prisma.user.delete({
            where: { id: user.id }
          });

          return res.status(500).json({
            error: 'Registration failed',
            message: 'Failed to send verification email. Please try again later.',
            messageBn: 'যাচাই ইমেল পাঠানো ব্যর্থ হয়েছে। অনুগ্রহ চেষ্টা করুন।',
            timestamp: new Date().toISOString()
          });
        }

        // Email sent successfully (or in fallback mode)
        res.setHeader('Content-Type', 'application/json');
        res.status(201).json({
          message: emailResult.fallback
            ? 'Registration successful. (Email verification skipped in testing mode)'
            : 'Registration successful. Please check your email to verify your account.',
          messageBn: emailResult.fallback
            ? 'নিবন্ধন সফল। (টেস্টিং মোডে ইমেল যাচাই এড়িয়ে হয়েছে)'
            : 'নিবন্ধন সফল। আপনার অ্যাকাউন্ট যাচাই করার জন্য ইমেল চেক করুন।',
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.status
          },
          requiresEmailVerification: true,
          fallbackMode: emailResult.fallback || false,
          timestamp: new Date().toISOString()
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        
        // In testing mode, allow registration to proceed even if email fails
        if (isTestingMode) {
          console.warn('Email failed but continuing in testing mode');
          res.setHeader('Content-Type', 'application/json');
          return res.status(201).json({
            message: 'Registration successful in testing mode. Email verification skipped.',
            messageBn: 'টেস্টিং মোডে নিবন্ধন সফল। ইমেল যাচাই এড়িয়ে হয়েছে।',
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
              status: user.status
            },
            requiresEmailVerification: false,
            testingMode: true,
            timestamp: new Date().toISOString()
          });
        }
        
        // If not in testing mode and email fails, cleanup and return error
        await prisma.emailVerificationToken.delete({
          where: { userId: user.id }
        });
        await prisma.user.delete({
          where: { id: user.id }
        });

        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({
          error: 'Registration failed',
          message: 'Failed to send verification email. Please try again later.',
          messageBn: 'যাচাই ইমেল পাঠানো ব্যর্থ হয়েছে। অনুগ্রহ চেষ্টা করুন।',
          timestamp: new Date().toISOString()
        });
      }

    } else if (phoneValidation?.isValid && !isPhoneVerificationDisabled) {
      // Phone verification flow
      try {
        const otpResult = await otpService.generatePhoneOTP(phoneValidation.normalizedPhone, user.id);

        if (!otpResult.success) {
          // If OTP fails, delete user for cleanup
          await prisma.user.delete({
            where: { id: user.id }
          });

          res.setHeader('Content-Type', 'application/json');
          return res.status(500).json({
            error: 'Registration failed',
            message: otpResult.error || 'Failed to send OTP. Please try again later.',
            messageBn: otpResult.errorBn || 'OTP পাঠানো ব্যর্থ হয়েছে। অনুগ্রহ চেষ্টা করুন।',
            timestamp: new Date().toISOString()
          });
        }

        res.setHeader('Content-Type', 'application/json');
        res.status(201).json({
          message: 'Registration successful. Please check your phone for OTP verification.',
          messageBn: 'নিবন্ধন সফল। আপনার ফোনে OTP যাচাই করার জন্য চেক করুন।',
          user: {
            id: user.id,
            phone: user.phone,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.status
          },
          requiresPhoneVerification: true,
          phone: phoneValidation.normalizedPhone,
          operator: phoneValidation.operator,
          operatorDetails: phoneValidation.operatorDetails,
          timestamp: new Date().toISOString()
        });
      } catch (otpError) {
        console.error('OTP generation failed:', otpError);
        
        // Cleanup user if OTP generation fails
        await prisma.user.delete({
          where: { id: user.id }
        });

        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({
          error: 'Registration failed',
          message: 'Failed to generate OTP. Please try again later.',
          messageBn: 'OTP তৈরি করতে ব্যর্থ হয়েছে। অনুগ্রহ চেষ্টা করুন।',
          timestamp: new Date().toISOString()
        });
      }

    } else {
      // Skip verification - activate account immediately (testing mode or verification disabled)
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          status: 'ACTIVE',
          emailVerified: email ? new Date() : null,
          phoneVerified: phoneValidation?.isValid ? new Date() : null
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          emailVerified: true,
          phoneVerified: true
        }
      });

      res.status(201).json({
        message: isTestingMode
          ? 'Registration successful in testing mode. Account is automatically activated.'
          : 'Registration successful. Account is activated without verification.',
        messageBn: isTestingMode
          ? 'টেস্টিং মোডে নিবন্ধন সফল। অ্যাকাউন্ট স্বয়ংক্রিয় সক্রিয় করা হয়েছে।'
          : 'নিবন্ধন সফল। যাচাই ছাড়া অ্যাকাউন্ট সক্রিয় করা হয়েছে।',
        user: updatedUser,
        testingMode: isTestingMode,
        verificationSkipped: true
      });
    }

  } catch (error) {
    console.error('Registration error:', error);
    console.error('Registration error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });
    
    // Ensure we always return JSON, even in case of unexpected errors
    const errorResponse = {
      error: 'Registration failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'নিবন্ধন ব্যর্থ হয়েছে',
      timestamp: new Date().toISOString()
    };
    
    // Add development details if available
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = {
        name: error.name,
        code: error.code,
        stack: error.stack
      };
    }
    
    // Set proper content type to ensure JSON response
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json(errorResponse);
  }
});

// Login endpoint
router.post('/login', [
  body('identifier').notEmpty().trim(),
  body('password').notEmpty().trim(),
  body('rememberMe').optional().isBoolean(),
  body('captcha').optional().isString(),
  body('deviceFingerprint').optional().isString()
], handleValidationErrors,
  loginSecurityMiddleware.enforce(),
  async (req, res) => {
  const { identifier, password, rememberMe, captcha, deviceFingerprint } = req.body;

  try {

    // Determine if identifier is email or phone
    const isEmail = identifier.includes('@');
    let user;
    let loginType;

    if (isEmail) {
      // Validate email format
      if (!emailService.validateEmail(identifier)) {
        return res.status(400).json({
          error: 'Invalid email format',
          message: 'Please provide a valid email address',
          messageBn: 'অনুগ্রহ ইমেল ঠিকানা দিন'
        });
      }
      
      // Find user by email
      user = await prisma.user.findUnique({
        where: { email: identifier }
      });
      loginType = 'email';
    } else {
      // Validate phone number
      const phoneValidation = phoneValidationService.validateForUseCase(identifier, 'login');
      if (!phoneValidation.isValid) {
        return res.status(400).json({
          error: 'Invalid phone format',
          message: phoneValidation.error,
          messageBn: phoneValidation.errorBn,
          code: phoneValidation.code
        });
      }
      
      // Find user by phone
      user = await prisma.user.findUnique({
        where: { phone: phoneValidation.normalizedPhone }
      });
      loginType = 'phone';
    }

    if (!user || !user.password) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: `Invalid ${loginType} or password`,
        messageBn: loginType === 'email' ? 'অবৈধ ইমেল বা পাসওয়ার্ড' : 'অবৈধ ফোন বা পাসওয়ার্ড'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: `Invalid ${loginType} or password`,
        messageBn: loginType === 'email' ? 'অবৈধ ইমেল বা পাসওয়ার্ড' : 'অবৈধ ফোন বা পাসওয়ার্ড'
      });
    }

    // Check if user is verified (skip if testing mode or verification disabled)
    const isTestingMode = configService.isTestingMode();
    const isEmailVerificationDisabled = configService.isEmailVerificationDisabled();
    const isPhoneVerificationDisabled = configService.isPhoneVerificationDisabled();
    
    const requiresVerification =
      (loginType === 'email' && !isEmailVerificationDisabled) ||
      (loginType === 'phone' && !isPhoneVerificationDisabled);
    
    if (user.status === 'PENDING' && requiresVerification && !isTestingMode) {
      const verificationMessage = loginType === 'email'
        ? 'Please verify your email address before logging in'
        : 'Please verify your phone number before logging in';
      const verificationMessageBn = loginType === 'email'
        ? 'লগিন করার আগে ইমেল যাচাই করুন'
        : 'লগিন করার আগে ফোন নম্বর যাচাই করুন';
      
      return res.status(403).json({
        error: 'Account not verified',
        message: verificationMessage,
        messageBn: verificationMessageBn,
        requiresVerification: true,
        verificationType: loginType
      });
    }
    
    // Auto-activate pending users in testing mode or when verification is disabled
    if (user.status === 'PENDING' && (isTestingMode || !requiresVerification)) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          status: 'ACTIVE',
          emailVerified: loginType === 'email' ? new Date() : user.emailVerified,
          phoneVerified: loginType === 'phone' ? new Date() : user.phoneVerified
        }
      });
      
      // Refresh user data after update
      user = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          emailVerified: true,
          phoneVerified: true
        }
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Create secure session instead of JWT token
    const sessionResult = await sessionService.createSession(user.id, req, {
      loginType,
      rememberMe: rememberMe || false,
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 7 days if remember me, 24 hours default
    });

    if (!sessionResult.sessionId) {
      return res.status(500).json({
        error: 'Login failed',
        message: 'Unable to create session',
        messageBn: 'লগিন ব্যর্থ হয়েছে'
      });
    }

    // Set session cookie with remember me options
    sessionMiddleware.setSessionCookie(res, sessionResult.sessionId, {
      maxAge: sessionResult.maxAge,
      rememberMe: rememberMe || false
    });

    // Add session headers
    const sessionHeaders = sessionMiddleware.sessionHeaders(sessionResult);
    Object.keys(sessionHeaders).forEach(key => {
      res.set(key, sessionHeaders[key]);
    });

    // Generate JWT token for API compatibility (shorter expiry)
    const jwtSecretLogin = process.env.JWT_SECRET;
    if (!jwtSecretLogin) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        sessionId: sessionResult.sessionId
      },
      jwtSecretLogin,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } // Shorter expiry for JWT, session manages long-term auth
    );


    // Record successful login and clear failed attempts
    return loginSecurityMiddleware.recordSuccessfulLogin(req, { id: user.id }, (req, res) => {
      res.json({
        message: 'Login successful',
        messageBn: 'লগিন সফল',
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status
        },
        token, // For API compatibility
        sessionId: sessionResult.sessionId,
        expiresAt: sessionResult.expiresAt,
        maxAge: sessionResult.maxAge,
        loginType,
        rememberMe: rememberMe || false,
        securityContext: req.securityContext
      });
    });

  } catch (error) {
    console.error('Login error:', error);
    console.error('Login error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Record failed attempt due to system error
    req.authError = 'system_error';
    return loginSecurityMiddleware.recordFailedLogin()(req, res, () => {
      res.status(500).json({
        error: 'Login failed',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        messageBn: 'লগিন ব্যর্থ হয়েছে'
      });
    });
  }
});

// Basic captcha validation function (integrate with actual captcha service)
async function validateCaptcha(captcha, ip) {
  // This is a placeholder - integrate with reCAPTCHA, hCaptcha, or similar
  // For now, we'll accept any captcha if security doesn't require it
  return true;
}

// Logout endpoint
router.post('/logout', [
  body('allDevices').optional().isBoolean()
], async (req, res) => {
  try {
    const { allDevices } = req.body;
    const sessionId = sessionMiddleware.getSessionId(req);

    if (!sessionId) {
      return res.status(400).json({
        error: 'No session found',
        message: 'No active session to logout',
        messageBn: 'লগআউট করার জন্য কোনো সেশন পাওয়া যায়নি'
      });
    }

    // Validate session to get user ID
    const validation = await sessionService.validateSession(sessionId, req);
    
    if (!validation.valid) {
      // Clear session cookie anyway
      sessionMiddleware.clearSessionCookie(res);
      
      return res.json({
        message: 'Logout successful',
        messageBn: 'লগআউট সফল',
        sessionExpired: true
      });
    }

    let result;
    if (allDevices) {
      // Destroy all sessions for this user
      result = await sessionService.destroyAllUserSessions(validation.userId, sessionId);
    } else {
      // Destroy current session only
      result = await sessionService.destroySession(sessionId, 'user_logout');
    }

    if (!result.success) {
      return res.status(500).json({
        error: 'Logout failed',
        message: result.reason,
        messageBn: 'লগআউট ব্যর্থ হয়েছে'
      });
    }

    // Clear session cookie
    sessionMiddleware.clearSessionCookie(res);

    res.json({
      message: 'Logout successful',
      messageBn: 'লগআউট সফল',
      allDevices: allDevices || false,
      destroyedCount: allDevices ? result.destroyedCount : 1
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'লগআউট ব্যর্থ হয়েছে'
    });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({
        error: 'Token required',
        messageBn: 'টোকেন প্রয়োজন'
      });
    }

    // Verify token
    const jwtSecretRefresh = process.env.JWT_SECRET;
    if (!jwtSecretRefresh) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    
    const decoded = jwt.verify(token, jwtSecretRefresh);
    
    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        messageBn: 'ব্যবহার্টার পাওয়া যায়নি'
      });
    }

    // Generate new token
    const jwtSecretNew = process.env.JWT_SECRET;
    if (!jwtSecretNew) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    
    const newToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      jwtSecretNew,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Token refreshed successfully',
      messageBn: 'টোকেন সফল হয়েছে',
      user,
      token: newToken
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      error: 'Invalid token',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Token expired or invalid',
      messageBn: 'টোকেন মেয়াদীপূর্ণ বা অবৈধ'
    });
  }
});

// Email verification endpoint
router.post('/verify-email', [
  body('token').notEmpty().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Token required',
        message: 'Verification token is required',
        messageBn: 'যাচাই টোকেন প্রয়োজন'
      });
    }

    // Find verification token
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: {
        user: true
      }
    });

    if (!verificationToken) {
      return res.status(400).json({
        error: 'Invalid token',
        message: 'Verification token is invalid or has been used',
        messageBn: 'যাচাই টোকেন অবৈধ বা ব্যবহার হয়েছে'
      });
    }

    // Check if token has expired
    if (verificationToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id }
      });

      return res.status(400).json({
        error: 'Token expired',
        message: 'Verification token has expired. Please request a new one.',
        messageBn: 'যাচাই টোকেন মেয়াদীপূর্ণ হয়েছে। নতুন একটি অনুরোধ করুন।'
      });
    }

    // Check if user is already verified
    if (verificationToken.user.emailVerified) {
      return res.status(400).json({
        error: 'Already verified',
        message: 'Email has already been verified',
        messageBn: 'ইমেল আগেই যাচাই হয়েছে'
      });
    }

    // Update user status and email verification timestamp
    const updatedUser = await prisma.user.update({
      where: { id: verificationToken.userId },
      data: {
        status: 'ACTIVE',
        emailVerified: new Date()
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        emailVerified: true
      }
    });

    // Delete verification token
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id }
    });

    // Send welcome email
    await emailService.sendWelcomeEmail(
      verificationToken.user.email,
      `${verificationToken.user.firstName} ${verificationToken.user.lastName}`
    );

    res.json({
      message: 'Email verified successfully',
      messageBn: 'ইমেল সফল যাচাই হয়েছে',
      user: updatedUser
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      error: 'Verification failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'যাচাই ব্যর্থ হয়েছে'
    });
  }
});

// Resend verification email endpoint
router.post('/resend-verification', [
  body('email').isEmail().normalizeEmail()
], handleValidationErrors, async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        emailVerificationTokens: {
          where: {
            expiresAt: {
              gt: new Date()
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No account found with this email address',
        messageBn: 'এই ইমেল ঠিকানা কোনো ব্যবহার্টার পাওয়া যায়নি'
      });
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return res.status(400).json({
        error: 'Already verified',
        message: 'Email has already been verified',
        messageBn: 'ইমেল আগেই যাচাই হয়েছে'
      });
    }

    // Check if there's already a recent verification token (within 5 minutes)
    const recentToken = user.emailVerificationTokens[0];
    if (recentToken && (Date.now() - recentToken.createdAt.getTime()) < 5 * 60 * 1000) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Please wait before requesting another verification email',
        messageBn: 'অন্য যাচাই ইমেল অনুরোধ করার জন্য অপেক্ষা করুন'
      });
    }

    // Delete any existing tokens for this user
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id }
    });

    // Generate new verification token
    const verificationToken = emailService.generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save new verification token
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt
      }
    });

    // Send verification email
    const emailResult = await emailService.sendVerificationEmail(
      email,
      `${user.firstName} ${user.lastName}`,
      verificationToken
    );

    if (!emailResult.success) {
      return res.status(500).json({
        error: 'Failed to send email',
        message: 'Unable to send verification email. Please try again later.',
        messageBn: 'যাচাই ইমেল পাঠানো ব্যর্থ হয়েছে। অনুগ্রহ চেষ্টা করুন।'
      });
    }

    res.json({
      message: 'Verification email sent successfully',
      messageBn: 'যাচাই ইমেল সফল পাঠানো হয়েছে',
      email: email
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      error: 'Failed to resend verification',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'যাচাই পুনরায়া পাঠানো ব্যর্থ হয়েছে'
    });
  }
});

// Send OTP endpoint
router.post('/send-otp', [
  body('phone').notEmpty().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const { phone } = req.body;

    // Validate phone number with enhanced service
    const phoneValidation = phoneValidationService.validateForUseCase(phone, 'otp');
    if (!phoneValidation.isValid) {
      return res.status(400).json({
        error: 'Invalid phone format',
        message: phoneValidation.error,
        messageBn: phoneValidation.errorBn,
        code: phoneValidation.code
      });
    }

    const normalizedPhone = phoneValidation.normalizedPhone;

    // Check if phone is already verified
    const isVerified = await otpService.isPhoneVerified(normalizedPhone);
    if (isVerified) {
      return res.status(400).json({
        error: 'Phone already verified',
        message: 'This phone number is already registered and verified',
        messageBn: 'এই ফোন নম্বর আগেই নিবন্ধন ও যাচাই হয়েছে'
      });
    }

    // Generate and send OTP
    const otpResult = await otpService.generatePhoneOTP(normalizedPhone);

    if (!otpResult.success) {
      return res.status(400).json({
        error: 'Failed to send OTP',
        message: otpResult.error,
        messageBn: otpResult.errorBn,
        code: otpResult.code
      });
    }

    res.json({
      message: 'OTP sent successfully',
      messageBn: 'OTP সফল পাঠানো হয়েছে',
      phone: normalizedPhone,
      operator: otpResult.operator,
      operatorDetails: otpResult.operatorDetails,
      expiresAt: otpResult.expiresAt,
      mock: otpResult.mock || false
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      error: 'Failed to send OTP',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'OTP পাঠানো ব্যর্থ হয়েছে'
    });
  }
});

// Verify OTP endpoint
router.post('/verify-otp', [
  body('phone').notEmpty().trim(),
  body('otp').notEmpty().trim().isLength({ min: 6, max: 6 })
], handleValidationErrors, async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Validate phone number with enhanced service
    const phoneValidation = phoneValidationService.validateForUseCase(phone, 'otp');
    if (!phoneValidation.isValid) {
      return res.status(400).json({
        error: 'Invalid phone format',
        message: phoneValidation.error,
        messageBn: phoneValidation.errorBn,
        code: phoneValidation.code
      });
    }

    const normalizedPhone = phoneValidation.normalizedPhone;

    // Verify OTP
    const verifyResult = await otpService.verifyPhoneOTP(normalizedPhone, otp);

    if (!verifyResult.success) {
      return res.status(400).json({
        error: 'OTP verification failed',
        message: verifyResult.error,
        messageBn: verifyResult.errorBn,
        code: verifyResult.code
      });
    }

    // If OTP was for registration, find and update user
    if (verifyResult.userId) {
      const user = await prisma.user.findUnique({
        where: { id: verifyResult.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          phoneVerified: true
        }
      });

      if (user) {
        return res.json({
          message: 'Phone verified successfully. Account is now active.',
          messageBn: 'ফোন সফল যাচাই হয়েছে। অ্যাকাউন্ট এখন সক্রিয়।',
          user,
          verifiedAt: verifyResult.verifiedAt
        });
      }
    }

    res.json({
      message: 'OTP verified successfully',
      messageBn: 'OTP সফল যাচাই হয়েছে',
      phone: normalizedPhone,
      verifiedAt: verifyResult.verifiedAt
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      error: 'OTP verification failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'OTP যাচাই ব্যর্থ হয়েছে'
    });
  }
});

// Resend OTP endpoint
router.post('/resend-otp', [
  body('phone').notEmpty().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const { phone } = req.body;

    // Validate phone number with enhanced service
    const phoneValidation = phoneValidationService.validateForUseCase(phone, 'otp');
    if (!phoneValidation.isValid) {
      return res.status(400).json({
        error: 'Invalid phone format',
        message: phoneValidation.error,
        messageBn: phoneValidation.errorBn,
        code: phoneValidation.code
      });
    }

    const normalizedPhone = phoneValidation.normalizedPhone;

    // Resend OTP
    const resendResult = await otpService.resendPhoneOTP(normalizedPhone);

    if (!resendResult.success) {
      return res.status(400).json({
        error: 'Failed to resend OTP',
        message: resendResult.error,
        messageBn: resendResult.errorBn,
        code: resendResult.code,
        waitTime: resendResult.waitTime
      });
    }

    res.json({
      message: 'OTP resent successfully',
      messageBn: 'OTP পুনরায়া পাঠানো হয়েছে',
      phone: normalizedPhone,
      operator: resendResult.operator,
      operatorDetails: resendResult.operatorDetails,
      expiresAt: resendResult.expiresAt,
      mock: resendResult.mock || false
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      error: 'Failed to resend OTP',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'OTP পুনরায়া ব্যর্থ হয়েছে'
    });
  }
});

// Change password endpoint
router.post('/change-password', [
  authMiddleware.authenticate(),
  body('currentPassword').notEmpty().trim(),
  body('newPassword').isLength({ min: 8, max: 128 }),
  body('confirmPassword').notEmpty().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: 'Passwords do not match',
        message: 'New password and confirmation password must be same',
        messageBn: 'নতুন পাসওয়ার্ড একই হবি হতে হবে'
      });
    }

    // Get user with current password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        password: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found',
        messageBn: 'ব্যবহার্টার পাওয়া যায়নি'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await passwordService.verifyPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        error: 'Invalid current password',
        message: 'The current password you entered is incorrect',
        messageBn: 'আপনি যে পাসওয়ার্ড দিয়েছেন সেটা ভুল'
      });
    }

    // Check if new password is same as current password
    const isSameAsCurrent = await passwordService.verifyPassword(newPassword, user.password);
    if (isSameAsCurrent) {
      return res.status(400).json({
        error: 'Same password',
        message: 'New password must be different from current password',
        messageBn: 'নতুন পাসওয়ার্ড বর্তমান পাসওয়ার্ড থেকে হতে হবে'
      });
    }

    // Validate new password strength
    const userInfo = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone
    };
    const passwordValidation = passwordService.validatePasswordStrength(newPassword, userInfo);
    
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Password does not meet requirements',
        message: 'New password is too weak or does not meet security requirements',
        messageBn: 'নতুন পাসওয়ার্ড খুবই বা নিরাপত্তিগিয় পূর্ব',
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

    // Check if password has been used before
    const isPasswordReused = await passwordService.isPasswordReused(userId, newPassword);
    if (isPasswordReused) {
      return res.status(400).json({
        error: 'Password already used',
        message: 'You cannot reuse a password that has been used in the last 5 changes',
        messageBn: 'আপনি শেষ 5টি পাসওয়ার্ড পরিবর্তন ব্যবহার করা পাসওয়ার্ড ব্যবহার করতে পারেন'
      });
    }

    // Hash new password
    const hashedNewPassword = await passwordService.hashPassword(newPassword);

    // Update user password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    // Save new password to history
    await passwordService.savePasswordToHistory(userId, hashedNewPassword);

    // Log password change (you might want to add proper logging here)
    console.log(`Password changed for user ${userId} at ${new Date().toISOString()}`);

    res.json({
      message: 'Password changed successfully',
      messageBn: 'পাসওয়ার্ড সফল হয়েছে',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Password change failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে'
    });
  }
});

// Request password reset endpoint
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], handleValidationErrors, async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        message: 'If an account with that email exists, a password reset link has been sent',
        messageBn: 'যদি এই ইমেল ঠিকানা কোনো অ্যাকাউন্ট থাকলে, একটি পাসওয়ার্ড রিসেট লিঙ্ক পাঠানো হয়েছে'
      });
    }

    // Generate reset token (you might want to use a separate token service)
    const resetToken = emailService.generateVerificationToken();
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    // Save reset token (using email verification token table for simplicity)
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt
      }
    });

    // Generate temporary strong password
    const temporaryPassword = passwordService.generateStrongPassword(12);
    const hashedTempPassword = await passwordService.hashPassword(temporaryPassword);

    // Update user with temporary password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedTempPassword }
    });

    // Save temporary password to history
    await passwordService.savePasswordToHistory(user.id, hashedTempPassword);

    // Send reset email with temporary password
    const emailResult = await emailService.sendPasswordResetEmail(
      email,
      `${user.firstName} ${user.lastName}`,
      temporaryPassword,
      resetToken
    );

    if (!emailResult.success) {
      return res.status(500).json({
        error: 'Failed to send reset email',
        message: 'Unable to send password reset email. Please try again later.',
        messageBn: 'পাসওয়ার্ড রিসেট ইমেল পাঠানো ব্যর্থ হয়েছে। অনুগ্রহ চেষ্টা করুন।'
      });
    }

    res.json({
      message: 'Password reset email sent successfully',
      messageBn: 'পাসওয়ার্ড রিসেট ইমেল সফল পাঠানো হয়েছে',
      email: email
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Password reset failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে'
    });
  }
});

// Reset password endpoint (with token)
router.post('/reset-password', [
  body('token').notEmpty().trim(),
  body('newPassword').isLength({ min: 8, max: 128 }),
  body('confirmPassword').notEmpty().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: 'Passwords do not match',
        message: 'New password and confirmation password must be same',
        messageBn: 'নতুন পাসওয়ার্ড একই হবি হতে হবে'
      });
    }

    // Find reset token
    const resetToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: {
        user: true
      }
    });

    if (!resetToken) {
      return res.status(400).json({
        error: 'Invalid token',
        message: 'Password reset token is invalid or has been used',
        messageBn: 'পাসওয়ার্ড রিসেট টোকেন অবৈধ বা ব্যবহার হয়েছে'
      });
    }

    // Check if token has expired
    if (resetToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.emailVerificationToken.delete({
        where: { id: resetToken.id }
      });

      return res.status(400).json({
        error: 'Token expired',
        message: 'Password reset token has expired. Please request a new one.',
        messageBn: 'পাসওয়ার্ড রিসেট টোকেন মেয়াদীপূর্ণ হয়েছে। নতুন একটি অনুরোধ করুন।'
      });
    }

    // Validate new password strength
    const userInfo = {
      firstName: resetToken.user.firstName,
      lastName: resetToken.user.lastName,
      email: resetToken.user.email,
      phone: resetToken.user.phone
    };
    const passwordValidation = passwordService.validatePasswordStrength(newPassword, userInfo);
    
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Password does not meet requirements',
        message: 'New password is too weak or does not meet security requirements',
        messageBn: 'নতুন পাসওয়ার্ড খুবই বা নিরাপত্তিগিয় পূর্ব',
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

    // Check if password has been used before
    const isPasswordReused = await passwordService.isPasswordReused(resetToken.userId, newPassword);
    if (isPasswordReused) {
      return res.status(400).json({
        error: 'Password already used',
        message: 'You cannot reuse a password that has been used in the last 5 changes',
        messageBn: 'আপনি শেষ 5টি পাসওয়ার্ড পরিবর্তন ব্যবহার করা পাসওয়ার্ড ব্যবহার করতে পারেন'
      });
    }

    // Hash new password
    const hashedNewPassword = await passwordService.hashPassword(newPassword);

    // Update user password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedNewPassword }
    });

    // Save new password to history
    await passwordService.savePasswordToHistory(resetToken.userId, hashedNewPassword);

    // Delete reset token
    await prisma.emailVerificationToken.delete({
      where: { id: resetToken.id }
    });

    // Update user status to active if pending
    if (resetToken.user.status === 'PENDING') {
      await prisma.user.update({
        where: { id: resetToken.userId },
        data: { status: 'ACTIVE' }
      });
    }

    // Log password reset
    console.log(`Password reset for user ${resetToken.userId} at ${new Date().toISOString()}`);

    res.json({
      message: 'Password reset successfully',
      messageBn: 'পাসওয়ার্ড সফল হয়েছে',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: 'Password reset failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে'
    });
  }
});

// Get password policy endpoint
router.get('/password-policy', async (req, res) => {
  try {
    const policy = passwordService.getPasswordPolicy();
    
    res.json({
      policy,
      message: 'Current password policy requirements',
      messageBn: 'বর্তমান পাসওয়ার্ড নীতিমালা'
    });
  } catch (error) {
    console.error('Get password policy error:', error);
    res.status(500).json({
      error: 'Failed to get password policy',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'পাসওয়ার্ড নীতিমালা পাওতে ব্যর্থ হয়েছে'
    });
  }
});

// Get phone validation info endpoint
router.post('/validate-phone', [
  body('phone').notEmpty().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const { phone } = req.body;

    const validation = phoneValidationService.validateBangladeshPhoneNumber(phone);

    res.json({
      validation,
      message: validation.isValid ? 'Valid phone number' : 'Invalid phone number',
      messageBn: validation.isValid ? 'বৈধ ফোন নম্বর' : 'অবৈধ ফোন নম্বর'
    });

  } catch (error) {
    console.error('Phone validation error:', error);
    res.status(500).json({
      error: 'Validation failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'যাচাই ব্যর্থ হয়েছে'
    });
  }
});

// Get supported operators endpoint
router.get('/operators', async (req, res) => {
  try {
    const operators = phoneValidationService.getSupportedOperators();

    res.json({
      operators,
      message: 'Supported mobile operators',
      messageBn: 'সমর্থিত মোবাইল অপারেটর'
    });

  } catch (error) {
    console.error('Get operators error:', error);
    res.status(500).json({
      error: 'Failed to get operators',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'অপারেটর পাওতে ব্যর্থ হয়েছে'
    });
  }
});

// Remember me token validation endpoint
router.post('/validate-remember-me', [
  body('token').notEmpty().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Token required',
        message: 'Remember me token is required',
        messageBn: 'রিমেম্বার মি টোকেন প্রয়োজন'
      });
    }

    // Validate remember me token
    const validation = await sessionService.validateRememberMeToken(token);
    
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid token',
        message: validation.reason || 'Remember me token is invalid or expired',
        messageBn: validation.reason || 'রিমেম্বার মি টোকেন অবৈধ বা মেয়াদীপূর্ণ'
      });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: validation.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found',
        messageBn: 'ব্যবহার্টার পাওয়া যায়নি'
      });
    }

    res.json({
      message: 'Remember me token is valid',
      messageBn: 'রিমেম্বার মি টোকেন বৈধ',
      user,
      tokenValid: true,
      createdAt: validation.createdAt
    });

  } catch (error) {
    console.error('Remember me token validation error:', error);
    res.status(500).json({
      error: 'Validation failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'যাচাই ব্যর্থ হয়েছে'
    });
  }
});

// Refresh session using remember me token
router.post('/refresh-from-remember-me', [
  body('token').notEmpty().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Token required',
        message: 'Remember me token is required',
        messageBn: 'রিমেম্বার মি টোকেন প্রয়োজন'
      });
    }

    // Refresh session using remember me token
    const refreshResult = await sessionService.refreshFromRememberMeToken(token, req);
    
    if (!refreshResult.success) {
      return res.status(400).json({
        error: 'Session refresh failed',
        message: refreshResult.reason || 'Failed to refresh session from remember me token',
        messageBn: refreshResult.reason || 'রিমেম্বার মি টোকেন থেকে সেশন রিফ্রেশ ব্যর্থ হয়েছে'
      });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: refreshResult.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found',
        messageBn: 'ব্যবহার্টার পাওয়া যায়নি'
      });
    }

    // Set session cookie
    sessionMiddleware.setSessionCookie(res, refreshResult.sessionId, {
      maxAge: refreshResult.maxAge,
      rememberMe: true
    });

    // Add session headers
    const sessionHeaders = sessionMiddleware.sessionHeaders(refreshResult);
    Object.keys(sessionHeaders).forEach(key => {
      res.set(key, sessionHeaders[key]);
    });

    // Generate JWT token for API compatibility
    const jwtSecretLogin = process.env.JWT_SECRET;
    if (!jwtSecretLogin) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    
    const jwtToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        sessionId: refreshResult.sessionId
      },
      jwtSecretLogin,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    res.json({
      message: 'Session refreshed successfully',
      messageBn: 'সেশন সফল হয়েছে',
      user,
      token: jwtToken,
      sessionId: refreshResult.sessionId,
      expiresAt: refreshResult.expiresAt,
      maxAge: refreshResult.maxAge,
      rememberMe: true,
      refreshedFrom: 'remember_me_token'
    });

  } catch (error) {
    console.error('Remember me session refresh error:', error);
    res.status(500).json({
      error: 'Session refresh failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'সেশন রিফ্রেশ ব্যর্থ হয়েছে'
    });
  }
});

// Disable remember me functionality
router.post('/disable-remember-me', [
  authMiddleware.authenticate(),
  body('allDevices').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const { allDevices } = req.body;
    const userId = req.user.id;
    const currentSessionId = req.sessionId;

    if (allDevices) {
      // Destroy all remember me sessions for this user
      const result = await sessionService.destroyAllUserSessions(userId, currentSessionId);
      
      // Clear remember me cookies
      res.clearCookie('rememberMe');
      res.clearCookie('rememberMeEnabled');

      res.json({
        message: 'Remember me disabled on all devices',
        messageBn: 'সব ডিভাইসে রিমেম্বার মি নিষ্ক্রিয় করা হয়েছে',
        allDevices: true,
        destroyedCount: result.destroyedCount
      });
    } else {
      // Destroy current session only
      const result = await sessionService.destroySession(currentSessionId, 'disable_remember_me');
      
      // Clear remember me cookies
      res.clearCookie('rememberMe');
      res.clearCookie('rememberMeEnabled');

      res.json({
        message: 'Remember me disabled on current device',
        messageBn: 'বর্তমান ডিভাইসে রিমেম্বার মি নিষ্ক্রিয় করা হয়েছে',
        allDevices: false,
        destroyedCount: 1
      });
    }

  } catch (error) {
    console.error('Disable remember me error:', error);
    res.status(500).json({
      error: 'Failed to disable remember me',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'রিমেম্বার মি নিষ্ক্রিয় করতে ব্যর্থ হয়েছে'
    });
  }
});

module.exports = router;