const swaggerJsdoc = require('swagger-jsdoc');
const configService = require('./services/config');

/**
 * @swagger
 * /api/v1/auth:
 *   get:
 *     summary: Get authentication endpoints information
 *     description: Returns information about available authentication endpoints
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Authentication endpoints information
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Authentication endpoints available"
 *             endpoints:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["/register", "/login", "/logout", "/refresh", "/verify-email", "/resend-verification", "/send-otp", "/verify-otp", "/resend-otp", "/change-password", "/forgot-password", "/reset-password", "/password-policy", "/validate-phone", "/operators", "/validate-remember-me", "/refresh-from-remember-me", "/disable-remember-me"]
 *   post:
 *     summary: Register new user
 *     description: Create a new user account with email or phone verification
 *     tags: [Authentication]
 *     parameters:
 *       - in: body
 *         name: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - password
 *             - confirmPassword
 *           properties:
 *             email:
 *               type: string
 *               format: email
 *               description: User email address (optional if phone provided)
 *               example: "user@example.com"
 *             password:
 *               type: string
 *               minLength: 8
 *               maxLength: 128
 *               description: User password (must meet password policy requirements)
 *               example: "SecurePass123!"
 *             confirmPassword:
 *               type: string
 *               description: Password confirmation (must match password)
 *               example: "SecurePass123!"
 *             firstName:
 *               type: string
 *               description: User first name
 *               example: "John"
 *             lastName:
 *               type: string
 *               description: User last name
 *               example: "Doe"
 *             phone:
 *               type: string
 *               description: Bangladesh phone number in E.164 format (optional if email provided)
 *               example: "+8801712345678"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Registration successful. Please check your email to verify your account."
 *             messageBn:
 *               type: string
 *               example: "নিবন্ধন সফল। আপনার অ্যাকাউন্ট যাচাই করার জন্য ইমেল চেক করুন।"
 *             user:
 *               $ref: '#/definitions/User'
 *             requiresEmailVerification:
 *               type: boolean
 *               example: true
 *             requiresPhoneVerification:
 *               type: boolean
 *               example: false
 *       400:
 *         description: Validation error
 *         schema:
 *           $ref: '#/definitions/Error'
 *       409:
 *         description: User already exists
 *         schema:
 *           $ref: '#/definitions/Error'
 *       500:
 *         description: Internal server error
 *         schema:
 *           $ref: '#/definitions/Error'
 * /login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with email or phone and password
 *     tags: [Authentication]
 *     parameters:
 *       - in: body
 *         name: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - identifier
 *             - password
 *           properties:
 *             identifier:
 *               type: string
 *               description: Email address or phone number
 *               example: "user@example.com"
 *             password:
 *               type: string
 *               description: User password
 *               example: "SecurePass123!"
 *             rememberMe:
 *               type: boolean
 *               description: Keep user logged in for 7 days
 *               example: false
 *             captcha:
 *               type: string
 *               description: CAPTCHA token (if enabled)
 *             deviceFingerprint:
 *               type: string
 *               description: Device fingerprint for security tracking
 *     responses:
 *       200:
 *         description: Login successful
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Login successful"
 *             messageBn:
 *               type: string
 *               example: "লগিন সফল"
 *             user:
 *               $ref: '#/definitions/User'
 *             token:
 *               type: string
 *               description: JWT authentication token
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *             sessionId:
 *               type: string
 *               description: Session ID for cookie-based authentication
 *               example: "sess_abc123def456"
 *             expiresAt:
 *               type: string
 *               format: date-time
 *               description: Session expiration time
 *               example: "2024-01-02T06:00:00.000Z"
 *             maxAge:
 *               type: integer
 *               description: Session max age in milliseconds
 *               example: 86400000
 *             loginType:
 *               type: string
 *               enum: [email, phone]
 *               example: "email"
 *             rememberMe:
 *               type: boolean
 *               example: false
 *             securityContext:
 *               type: object
 *               description: Security context information
 *       401:
 *         description: Invalid credentials
 *         schema:
 *           $ref: '#/definitions/Error'
 *       403:
 *         description: Account not verified
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Account not verified"
 *             message:
 *               type: string
 *               example: "Please verify your email address before logging in"
 *             messageBn:
 *               type: string
 *               example: "লগিন করার আগে ইমেল যাচাই করুন"
 *             requiresVerification:
 *               type: boolean
 *               example: true
 *             verificationType:
 *               type: string
 *               enum: [email, phone]
 *               example: "email"
 *       500:
 *         description: Internal server error
 *         schema:
 *           $ref: '#/definitions/Error'
 * /logout:
 *   post:
 *     summary: User logout
 *     description: Logout user and destroy session
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth
 *     parameters:
 *       - in: body
 *         name: body
 *         schema:
 *           type: object
 *           properties:
 *             allDevices:
 *               type: boolean
 *               description: Logout from all devices or just current device
 *               example: false
 *     responses:
 *       200:
 *         description: Logout successful
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Logout successful"
 *             messageBn:
 *               type: string
 *               example: "লগআউট সফল"
 *             allDevices:
 *               type: boolean
 *               example: false
 *             destroyedCount:
 *               type: integer
 *               example: 1
 *       400:
 *         description: No session found
 *         schema:
 *           $ref: '#/definitions/Error'
 *       500:
 *         description: Internal server error
 *         schema:
 *           $ref: '#/definitions/Error'
 * /refresh:
 *   post:
 *     summary: Refresh JWT token
 *     description: Refresh expired JWT token and get new token
 *     tags: [Authentication]
 *     parameters:
 *       - in: body
 *         name: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - token
 *           properties:
 *             token:
 *               type: string
 *               description: Expired JWT token
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Token refreshed successfully"
 *             messageBn:
 *               type: string
 *               example: "টোকেন সফল হয়েছে"
 *             user:
 *               $ref: '#/definitions/User'
 *             token:
 *               type: string
 *               description: New JWT token
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Invalid or expired token
 *         schema:
 *           $ref: '#/definitions/Error'
 *       500:
 *         description: Internal server error
 *         schema:
 *           $ref: '#/definitions/Error'
 * /verify-email:
 *   post:
 *     summary: Verify email address
 *     description: Verify user email address using verification token
 *     tags: [Authentication]
 *     parameters:
 *       - in: body
 *         name: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - token
 *           properties:
 *             token:
 *               type: string
 *               description: Email verification token
 *               example: "abc123def456ghi789jkl012mno345pqr678"
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Email verified successfully"
 *             messageBn:
 *               type: string
 *               example: "ইমেল সফল যাচাই হয়েছে"
 *             user:
 *               $ref: '#/definitions/User'
 *       400:
 *         description: Invalid or expired token
 *         schema:
 *           $ref: '#/definitions/Error'
 *       500:
 *         description: Internal server error
 *         schema:
 *           $ref: '#/definitions/Error'
 * /resend-verification:
 *   post:
 *     summary: Resend verification email
 *     description: Resend email verification token to user
 *     tags: [Authentication]
 *     parameters:
 *       - in: body
 *         name: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - email
 *           properties:
 *             email:
 *               type: string
 *               format: email
 *               description: User email address
 *               example: "user@example.com"
 *     responses:
 *       200:
 *         description: Verification email sent successfully
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Verification email sent successfully"
 *             messageBn:
 *               type: string
 *               example: "যাচাই ইমেল সফল পাঠানো হয়েছে"
 *             email:
 *               type: string
 *               example: "user@example.com"
 *       400:
 *         description: Validation error or already verified
 *         schema:
 *           $ref: '#/definitions/Error'
 *       404:
 *         description: User not found
 *         schema:
 *           $ref: '#/definitions/Error'
 *       429:
 *         description: Too many requests (rate limited)
 *         schema:
 *           $ref: '#/definitions/Error'
 *       500:
 *         description: Internal server error
 *         schema:
 *           $ref: '#/definitions/Error'
 * /send-otp:
 *   post:
 *     summary: Send OTP to phone
 *     description: Send one-time password (OTP) to user's phone number for verification
 *     tags: [Authentication]
 *     parameters:
 *       - in: body
 *         name: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - phone
 *           properties:
 *             phone:
 *               type: string
 *               description: Bangladesh phone number in E.164 format
 *               example: "+8801712345678"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "OTP sent successfully"
 *             messageBn:
 *               type: string
 *               example: "OTP সফল পাঠানো হয়েছে"
 *             phone:
 *               type: string
 *               description: Normalized phone number
 *               example: "+8801712345678"
 *             operator:
 *               type: string
 *               description: Mobile operator
 *               enum: [GP, Banglalink, Robi, Airtel, Teletalk]
 *               example: "GP"
 *             operatorDetails:
 *               type: object
 *               description: Operator details
 *               properties:
 *                 name:
 *                   type: string
 *                   example: "Grameenphone"
 *                 prefix:
 *                   type: string
 *                   example: "017"
 *             expiresAt:
 *               type: string
 *               format: date-time
 *               description: OTP expiration time
 *               example: "2024-01-01T12:05:00.000Z"
 *             mock:
 *               type: boolean
 *               description: Whether OTP was sent in mock mode (testing)
 *               example: false
 *       400:
 *         description: Invalid phone format or already verified
 *         schema:
 *           $ref: '#/definitions/Error'
 *       500:
 *         description: Internal server error or SMS service unavailable
 *         schema:
 *           $ref: '#/definitions/Error'
 * /verify-otp:
 *   post:
 *     summary: Verify OTP
 *     description: Verify one-time password (OTP) sent to phone
 *     tags: [Authentication]
 *     parameters:
 *       - in: body
 *         name: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - phone
 *             - otp
 *           properties:
 *             phone:
 *               type: string
 *               description: Bangladesh phone number in E.164 format
 *               example: "+8801712345678"
 *             otp:
 *               type: string
 *               minLength: 6
 *               maxLength: 6
 *               description: One-time password received via SMS
 *               example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "OTP verified successfully"
 *             messageBn:
 *               type: string
 *               example: "OTP সফল যাচাই হয়েছে"
 *             phone:
 *               type: string
 *               example: "+8801712345678"
 *             verifiedAt:
 *               type: string
 *               format: date-time
 *               example: "2024-01-01T12:00:00.000Z"
 *       400:
 *         description: Invalid OTP or expired
 *         schema:
 *           $ref: '#/definitions/Error'
 *       500:
 *         description: Internal server error
 *         schema:
 *           $ref: '#/definitions/Error'
 * /resend-otp:
 *   post:
 *     summary: Resend OTP
 *     description: Resend one-time password (OTP) to phone number
 *     tags: [Authentication]
 *     parameters:
 *       - in: body
 *         name: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - phone
 *           properties:
 *             phone:
 *               type: string
 *               description: Bangladesh phone number in E.164 format
 *               example: "+8801712345678"
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "OTP resent successfully"
 *             messageBn:
 *               type: string
 *               example: "OTP পুনরায়া পাঠানো হয়েছে"
 *             phone:
 *               type: string
 *               example: "+8801712345678"
 *             operator:
 *               type: string
 *               example: "GP"
 *             operatorDetails:
 *               type: object
 *             expiresAt:
 *               type: string
 *               format: date-time
 *               example: "2024-01-01T12:05:00.000Z"
 *             mock:
 *               type: boolean
 *               example: false
 *       400:
 *         description: Invalid phone format or rate limited
 *         schema:
 *           $ref: '#/definitions/Error'
 *       500:
 *         description: Internal server error or SMS service unavailable
 *         schema:
 *           $ref: '#/definitions/Error'
 * /change-password:
 *   post:
 *     summary: Change password
 *     description: Change user password (requires authentication)
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth
 *     parameters:
 *       - in: body
 *         name: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - currentPassword
 *             - newPassword
 *             - confirmPassword
 *           properties:
 *             currentPassword:
 *               type: string
 *               description: Current password
 *               example: "OldPass123!"
 *             newPassword:
 *               type: string
 *               minLength: 8
 *               maxLength: 128
 *               description: New password (must meet password policy)
 *               example: "NewSecurePass456!"
 *             confirmPassword:
 *               type: string
 *               description: New password confirmation
 *               example: "NewSecurePass456!"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Password changed successfully"
 *             messageBn:
 *               type: string
 *               example: "পাসওয়ার্ড সফল হয়েছে"
 *             timestamp:
 *               type: string
 *               format: date-time
 *               example: "2024-01-01T12:00:00.000Z"
 *       400:
 *         description: Validation error or weak password
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *             message:
 *               type: string
 *             messageBn:
 *               type: string
 *             details:
 *               type: object
 *               properties:
 *                 strength:
 *                   type: string
 *                   enum: [WEAK, FAIR, GOOD, STRONG]
 *                 score:
 *                   type: integer
 *                   example: 3
 *                 feedback:
 *                   type: string
 *                 warnings:
 *                   type: array
 *                   items:
 *                     type: string
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: string
 *                 passwordPolicy:
 *                   $ref: '#/definitions/PasswordPolicy'
 *       401:
 *         description: Invalid current password
 *         schema:
 *           $ref: '#/definitions/Error'
 *       404:
 *         description: User not found
 *         schema:
 *           $ref: '#/definitions/Error'
 *       500:
 *         description: Internal server error
 *         schema:
 *           $ref: '#/definitions/Error'
 * /forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Send password reset email with temporary password
 *     tags: [Authentication]
 *     parameters:
 *       - in: body
 *         name: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - email
 *           properties:
 *             email:
 *               type: string
 *               format: email
 *               description: User email address
 *               example: "user@example.com"
 *     responses:
 *       200:
 *         description: Password reset email sent
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Password reset email sent successfully"
 *             messageBn:
 *               type: string
 *               example: "পাসওয়ার্ড রিসেট ইমেল সফল পাঠানো হয়েছে"
 *             email:
 *               type: string
 *               example: "user@example.com"
 *       400:
 *         description: Invalid email format
 *         schema:
 *           $ref: '#/definitions/Error'
 *       500:
 *         description: Internal server error or email service unavailable
 *         schema:
 *           $ref: '#/definitions/Error'
 * /reset-password:
 *   post:
 *     summary: Reset password with token
 *     description: Reset password using token received in email
 *     tags: [Authentication]
 *     parameters:
 *       - in: body
 *         name: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - token
 *             - newPassword
 *             - confirmPassword
 *           properties:
 *             token:
 *               type: string
 *               description: Password reset token from email
 *               example: "abc123def456ghi789"
 *             newPassword:
 *               type: string
 *               minLength: 8
 *               maxLength: 128
 *               description: New password (must meet password policy)
 *               example: "NewSecurePass789!"
 *             confirmPassword:
 *               type: string
 *               description: New password confirmation
 *               example: "NewSecurePass789!"
 *     responses:
 *       200:
 *         description: Password reset successful
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Password reset successfully"
 *             messageBn:
 *               type: string
 *               example: "পাসওয়ার্ড সফল হয়েছে"
 *             timestamp:
 *               type: string
 *               format: date-time
 *               example: "2024-01-01T12:00:00.000Z"
 *       400:
 *         description: Invalid token, expired token, or weak password
 *         schema:
 *           $ref: '#/definitions/Error'
 *       500:
 *         description: Internal server error
 *         schema:
 *           $ref: '#/definitions/Error'
 * /password-policy:
 *   get:
 *     summary: Get password policy
 *     description: Returns current password policy requirements
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Password policy requirements
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Current password policy requirements"
 *             messageBn:
 *               type: string
 *               example: "বর্তমান পাসওয়ার্ড নীতিমালা"
 *             policy:
 *               $ref: '#/definitions/PasswordPolicy'
 *       500:
 *         description: Internal server error
 *         schema:
 *           $ref: '#/definitions/Error'
 * /validate-phone:
 *   post:
 *     summary: Validate phone number
 *     description: Validate Bangladesh phone number format and get operator info
 *     tags: [Authentication]
 *     parameters:
 *       - in: body
 *         name: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - phone
 *           properties:
 *             phone:
 *               type: string
 *               description: Bangladesh phone number to validate
 *               example: "+8801712345678"
 *     responses:
 *       200:
 *         description: Phone validation result
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Valid phone number"
 *             messageBn:
 *               type: string
 *               example: "বৈধ ফোন নম্বর"
 *             validation:
 *               $ref: '#/definitions/PhoneValidation'
 *       500:
 *         description: Internal server error
 *         schema:
 *           $ref: '#/definitions/Error'
 * /operators:
 *   get:
 *     summary: Get supported mobile operators
 *     description: Returns list of supported Bangladesh mobile operators
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Supported operators list
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Supported mobile operators"
 *             messageBn:
 *               type: string
 *               example: "সমর্থিত মোবাইল অপারেটর"
 *             operators:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/MobileOperator'
 *       500:
 *         description: Internal server error
 *         schema:
 *           $ref: '#/definitions/Error'
 * /validate-remember-me:
 *   post:
 *     summary: Validate remember me token
 *     description: Validate remember me token and get user information
 *     tags: [Authentication]
 *     parameters:
 *       - in: body
 *         name: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - token
 *           properties:
 *             token:
 *               type: string
 *               description: Remember me token from cookie
 *               example: "remember_me_abc123def456"
 *     responses:
 *       200:
 *         description: Token is valid
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Remember me token is valid"
 *             messageBn:
 *               type: string
 *               example: "রিমেম্বার মি টোকেন বৈধ"
 *             user:
 *               $ref: '#/definitions/User'
 *             tokenValid:
 *               type: boolean
 *               example: true
 *             createdAt:
 *               type: string
 *               format: date-time
 *               example: "2024-01-01T00:00:00.000Z"
 *       400:
 *         description: Invalid or expired token
 *         schema:
 *           $ref: '#/definitions/Error'
 *       404:
 *         description: User not found
 *         schema:
 *           $ref: '#/definitions/Error'
 *       500:
 *         description: Internal server error
 *         schema:
 *           $ref: '#/definitions/Error'
 * /refresh-from-remember-me:
 *   post:
 *     summary: Refresh session from remember me token
 *     description: Create new session using remember me token
 *     tags: [Authentication]
 *     parameters:
 *       - in: body
 *         name: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - token
 *           properties:
 *             token:
 *               type: string
 *               description: Remember me token from cookie
 *               example: "remember_me_abc123def456"
 *     responses:
 *       200:
 *         description: Session refreshed successfully
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Session refreshed successfully"
 *             messageBn:
 *               type: string
 *               example: "সেশন সফল হয়েছে"
 *             user:
 *               $ref: '#/definitions/User'
 *             token:
 *               type: string
 *               description: New JWT token
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *             sessionId:
 *               type: string
 *               description: New session ID
 *               example: "sess_xyz789abc123"
 *             expiresAt:
 *               type: string
 *               format: date-time
 *               example: "2024-01-08T00:00:00.000Z"
 *             maxAge:
 *               type: integer
 *               description: Session max age in milliseconds (7 days for remember me)
 *               example: 604800000
 *             rememberMe:
 *               type: boolean
 *               example: true
 *             refreshedFrom:
 *               type: string
 *               example: "remember_me_token"
 *       400:
 *         description: Invalid or expired token
 *         schema:
 *           $ref: '#/definitions/Error'
 *       404:
 *         description: User not found
 *         schema:
 *           $ref: '#/definitions/Error'
 *       500:
 *         description: Internal server error
 *         schema:
 *           $ref: '#/definitions/Error'
 * /disable-remember-me:
 *   post:
 *     summary: Disable remember me functionality
 *     description: Disable remember me on current device or all devices
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth
 *     parameters:
 *       - in: body
 *         name: body
 *         schema:
 *           type: object
 *           properties:
 *             allDevices:
 *               type: boolean
 *               description: Disable on all devices or just current device
 *               example: false
 *     responses:
 *       200:
 *         description: Remember me disabled successfully
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Remember me disabled on current device"
 *             messageBn:
 *               type: string
 *               example: "বর্তমান ডিভাইসে রিমেম্বার মি নিষ্ক্রিয় করা হয়েছে"
 *             allDevices:
 *               type: boolean
 *               example: false
 *             destroyedCount:
 *               type: integer
 *               example: 1
 *       500:
 *         description: Internal server error
 *         schema:
 *           $ref: '#/definitions/Error'
 */

const swaggerOptions = {
  definition: {
    info: {
      title: 'Smart Technologies Bangladesh B2C E-commerce API - Authentication',
      version: '1.0.0',
      description: 'Complete authentication API documentation for Smart Technologies Bangladesh. This API provides user registration, login, email/phone verification, password management, and session management.',
      contact: {
        name: 'Smart Technologies Bangladesh',
        email: 'api@smarttechnologies.bd',
        url: 'https://smarttechnologies.bd'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    host: configService.get('NODE_ENV') === 'production' 
      ? 'api.smarttechnologies.bd' 
      : 'localhost:3001',
    basePath: '/api/v1/auth',
    schemes: ['http', 'https'],
    consumes: ['application/json'],
    produces: ['application/json'],
    securityDefinitions: {
      BearerAuth: {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header',
        description: 'JWT Bearer token for authentication. Format: "Bearer {token}"'
      }
    },
    security: [],
    definitions: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique user identifier',
            example: '550e8400-e29b-41d4-a716-446655440000'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'user@example.com'
          },
          firstName: {
            type: 'string',
            description: 'User first name',
            example: 'John'
          },
          lastName: {
            type: 'string',
            description: 'User last name',
            example: 'Doe'
          },
          phone: {
            type: 'string',
            description: 'User phone number in E.164 format',
            example: '+8801712345678'
          },
          role: {
            type: 'string',
            enum: ['ADMIN', 'MANAGER', 'CUSTOMER'],
            description: 'User role in the system',
            example: 'CUSTOMER'
          },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED'],
            description: 'User account status',
            example: 'ACTIVE'
          },
          emailVerified: {
            type: 'string',
            format: 'date-time',
            description: 'Email verification timestamp',
            example: '2024-01-01T12:00:00.000Z'
          },
          phoneVerified: {
            type: 'string',
            format: 'date-time',
            description: 'Phone verification timestamp',
            example: '2024-01-01T12:00:00.000Z'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp',
            example: '2024-01-01T00:00:00.000Z'
          },
          lastLoginAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last login timestamp',
            example: '2024-01-01T12:00:00.000Z'
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error type or code',
            example: 'Validation failed'
          },
          message: {
            type: 'string',
            description: 'Human-readable error message in English',
            example: 'Please provide a valid email address'
          },
          messageBn: {
            type: 'string',
            description: 'Human-readable error message in Bengali',
            example: 'অনুগ্রহ ইমেল ঠিকানা দিন'
          },
          code: {
            type: 'string',
            description: 'Error code for programmatic handling',
            example: 'INVALID_EMAIL'
          },
          details: {
            type: 'array',
            description: 'Detailed validation errors',
            items: {
              type: 'object',
              properties: {
                field: {
                  type: 'string',
                  example: 'email'
                },
                message: {
                  type: 'string',
                  example: 'Invalid email format'
                }
              }
            }
          }
        }
      },
      PasswordPolicy: {
        type: 'object',
        properties: {
          minLength: {
            type: 'integer',
            description: 'Minimum password length',
            example: 8
          },
          maxLength: {
            type: 'integer',
            description: 'Maximum password length',
            example: 128
          },
          requireUppercase: {
            type: 'boolean',
            description: 'Require uppercase letters',
            example: true
          },
          requireLowercase: {
            type: 'boolean',
            description: 'Require lowercase letters',
            example: true
          },
          requireNumbers: {
            type: 'boolean',
            description: 'Require numbers',
            example: true
          },
          requireSpecialChars: {
            type: 'boolean',
            description: 'Require special characters',
            example: true
          },
          preventSequential: {
            type: 'boolean',
            description: 'Prevent sequential characters (e.g., 123, abc)',
            example: true
          },
          preventRepeated: {
            type: 'boolean',
            description: 'Prevent repeated characters (e.g., aaa, 111)',
            example: true
          },
          preventPersonalInfo: {
            type: 'boolean',
            description: 'Prevent personal information in password',
            example: true
          },
          bangladeshPatterns: {
            type: 'boolean',
            description: 'Prevent Bangladesh-specific patterns',
            example: true
          },
          minStrengthScore: {
            type: 'integer',
            description: 'Minimum strength score required',
            example: 2
          }
        }
      },
      PhoneValidation: {
        type: 'object',
        properties: {
          isValid: {
            type: 'boolean',
            description: 'Whether phone number is valid',
            example: true
          },
          normalizedPhone: {
            type: 'string',
            description: 'Normalized phone number in E.164 format',
            example: '+8801712345678'
          },
          operator: {
            type: 'string',
            enum: ['GP', 'Banglalink', 'Robi', 'Airtel', 'Teletalk'],
            description: 'Mobile operator',
            example: 'GP'
          },
          operatorDetails: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                example: 'Grameenphone'
              },
              prefix: {
                type: 'string',
                example: '017'
              }
            }
          },
          error: {
            type: 'string',
            description: 'Error message if invalid',
            example: 'Invalid phone format'
          },
          errorBn: {
            type: 'string',
            description: 'Error message in Bengali if invalid',
            example: 'অবৈধ ফোন নম্বর'
          },
          code: {
            type: 'string',
            description: 'Error code',
            example: 'INVALID_PHONE_FORMAT'
          }
        }
      },
      MobileOperator: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'Grameenphone'
          },
          prefix: {
            type: 'string',
            description: 'Operator prefix',
            example: '017'
          },
          prefixes: {
            type: 'array',
            description: 'All prefixes for this operator',
            items: {
              type: 'string'
            },
            example: ['017', '013']
          }
        }
      }
    }
  },
  apis: ['./routes/auth.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = swaggerSpec;
