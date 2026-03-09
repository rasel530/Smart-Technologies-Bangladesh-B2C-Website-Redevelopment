"use strict";
/**
 * Payment Security Middleware
 *
 * This module provides middleware functions for securing payment-related endpoints.
 * It includes encryption, fraud detection, PCI-DSS compliance, and security logging.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSecurityHeaders = exports.logPaymentRequest = exports.validateHttps = exports.sanitizeRequestData = exports.rateLimitPaymentAttempts = exports.verifyWebhookSignature = exports.logSecurityEvent = exports.checkFraudRisk = exports.validatePciDssCompliance = exports.sanitizeResponseData = exports.decryptRequestBody = exports.encryptRequestBody = void 0;
const fraud_detection_service_1 = require("../../services/payment/fraud-detection.service");
const pci_dss_service_1 = require("../../services/payment/pci-dss.service");
/**
 * Encrypt request body for sensitive endpoints
 * Encrypts sensitive payment data in request body
 */
const encryptRequestBody = (req, res, next) => {
    try {
        // Check if request body contains sensitive payment data
        const sensitiveFields = ['cardNumber', 'card_no', 'cvv', 'pin', 'bankAccountNumber'];
        for (const field of sensitiveFields) {
            if (req.body[field]) {
                // Encrypt the sensitive field
                req.body[field] = pci_dss_service_1.pciDssComplianceService.encryptPaymentData(req.body[field]);
            }
        }
        next()();
    }
    catch (error) {
        console.error('Error encrypting request body:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to encrypt request data'
        });
    }
};
exports.encryptRequestBody = encryptRequestBody;
/**
 * Decrypt request body
 * Decrypts encrypted payment data in request body
 */
const decryptRequestBody = (req, res, next) => {
    try {
        // Check if request body contains encrypted data
        const encryptedFields = ['encryptedCardNumber', 'encryptedCVV', 'encryptedPin'];
        for (const field of encryptedFields) {
            if (req.body[field]) {
                // Decrypt the field
                const decryptedField = field.replace('encrypted', '').toLowerCase();
                req.body[decryptedField] = pci_dss_service_1.pciDssComplianceService.decryptPaymentData(req.body[field]);
                delete req.body[field];
            }
        }
        next()()();
    }
    catch (error) {
        console.error('Error decrypting request body:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to decrypt request data'
        });
    }
};
exports.decryptRequestBody = decryptRequestBody;
/**
 * Sanitize response data
 * Sanitizes sensitive data before sending response
 */
const sanitizeResponseData = (req, res, next) => {
    const originalSend = res.json.bind(res);
    res.json = (data) => {
        try {
            // Sanitize the response data
            const sanitizedData = pci_dss_service_1.pciDssComplianceService.sanitizePaymentData(data);
            return originalSend(sanitizedData);
        }
        catch (error) {
            console.error('Error sanitizing response data:', error);
            return originalSend(data);
        }
    };
    next();
};
exports.sanitizeResponseData = sanitizeResponseData;
/**
 * Validate PCI-DSS compliance
 * Validates request meets PCI-DSS requirements
 */
const validatePciDssCompliance = (req, res, next) => {
    try {
        // Check compliance
        const compliance = pci_dss_service_1.pciDssComplianceService.validateCompliance();
        if (!compliance.isCompliant) {
            console.error('PCI-DSS compliance violations:', compliance.violations);
            // In production, you might want to block the request
            // For now, just log a warning
            if (process.env.NODE_ENV === 'production') {
                return res.status(500).json({
                    success: false,
                    error: 'PCI-DSS compliance violations detected',
                    violations: compliance.violations
                });
            }
        }
        // Add compliance info to request for logging
        req.pciCompliance = compliance;
        next()()();
    }
    catch (error) {
        console.error('Error validating PCI-DSS compliance:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to validate PCI-DSS compliance'
        });
    }
};
exports.validatePciDssCompliance = validatePciDssCompliance;
/**
 * Check fraud risk
 * Analyzes payment for fraud risk and blocks if risk score exceeds threshold
 */
const checkFraudRisk = async (req, res, next) => {
    try {
        // Skip fraud check for non-payment endpoints
        if (!req.body.orderId && !req.body.amount) {
            next()();
        }
        // Get user ID from request
        const userId = req.user?.id || req.body.userId;
        // Prepare fraud analysis request
        const fraudAnalysisRequest = {
            userId,
            orderId: req.body.orderId || '',
            amount: req.body.amount || 0,
            currency: req.body.currency || 'BDT',
            phoneNumber: req.body.phoneNumber || req.body.customerMsisdn,
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.headers['user-agent'],
            deviceId: req.headers['x-device-id'],
            paymentMethod: req.body.paymentMethod || 'unknown',
            timestamp: new Date()
        };
        // Analyze payment for fraud risk
        const analysisResult = await fraud_detection_service_1.fraudDetectionService.analyzePayment(fraudAnalysisRequest);
        // Add analysis result to request
        req.fraudAnalysis = analysisResult;
        // Block if risk score exceeds threshold
        if (analysisResult.isBlocked) {
            console.warn(`Payment blocked due to high fraud risk: ${analysisResult.riskScore}`);
            // Log security event
            await fraud_detection_service_1.fraudDetectionService.logSecurityEvent({
                transactionId: req.body.transactionId,
                orderId: req.body.orderId,
                eventType: 'FRAUD_DETECTED',
                riskScore: analysisResult.riskScore,
                isSuspicious: true,
                details: {
                    blockReason: analysisResult.blockReason,
                    analysis: analysisResult.analysis,
                    recommendations: analysisResult.recommendations
                },
                ipAddress: fraudAnalysisRequest.ipAddress,
                userAgent: fraudAnalysisRequest.userAgent
            });
            // Block user if risk is critical
            if (analysisResult.riskLevel === 'CRITICAL' && userId) {
                await fraud_detection_service_1.fraudDetectionService.blockUser(userId, analysisResult.blockReason || 'Critical fraud risk detected', 3600 // 1 hour
                );
            }
            return res.status(403).json({
                success: false,
                error: 'Payment blocked due to security concerns',
                riskScore: analysisResult.riskScore,
                riskLevel: analysisResult.riskLevel,
                recommendations: analysisResult.recommendations
            });
        }
        next()()();
    }
    catch (error) {
        console.error('Error checking fraud risk:', error);
        // Don't block payment flow on fraud detection errors
        // Log the error and continue
        next()()();
    }
};
exports.checkFraudRisk = checkFraudRisk;
/**
 * Log security events
 * Logs security-related events
 */
const logSecurityEvent = (eventType) => {
    return async (req, res, next) => {
        try {
            // Store original send function
            const originalSend = res.json.bind(res);
            // Override send to log after response
            res.json = (data) => {
                // Log security event
                fraud_detection_service_1.fraudDetectionService.logSecurityEvent({
                    transactionId: req.body.transactionId,
                    orderId: req.body.orderId,
                    eventType,
                    riskScore: req.fraudAnalysis?.riskScore || 0,
                    isSuspicious: req.fraudAnalysis?.isBlocked || false,
                    details: {
                        method: req.method,
                        path: req.path,
                        statusCode: res.statusCode,
                        response: data
                    },
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent']
                }).catch(err => {
                    console.error('Error logging security event:', err);
                });
                // Call original send
                return originalSend(data);
            };
            next()()();
        }
        catch (error) {
            console.error('Error in logSecurityEvent middleware:', error);
            next()()();
        }
    };
};
exports.logSecurityEvent = logSecurityEvent;
/**
 * Verify webhook signature
 * Verifies webhook signature based on gateway
 */
const verifyWebhookSignature = (gateway) => {
    return (req, res, next) => {
        try {
            const signature = req.headers['x-signature'];
            const payload = JSON.stringify(req.body);
            if (!signature) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing webhook signature'
                });
            }
            let secret;
            // Get secret based on gateway
            switch (gateway.toLowerCase()) {
                case 'sslcommerz':
                    secret = process.env.SSLCOMMERZ_STORE_PASSWORD || '';
                    break;
                case 'bkash':
                    secret = process.env.BKASH_APP_SECRET || '';
                    break;
                case 'nagad':
                    secret = process.env.NAGAD_MERCHANT_SECRET || '';
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        error: 'Unknown payment gateway'
                    });
            }
            if (!secret) {
                console.warn(`Webhook secret not configured for ${gateway}`);
                return res.status(500).json({
                    success: false,
                    error: 'Webhook secret not configured'
                });
            }
            // Verify signature
            const isValid = pci_dss_service_1.pciDssComplianceService.verifyHMACSignature(payload, signature, secret);
            if (!isValid) {
                console.warn(`Invalid webhook signature for ${gateway}`);
                // Log security event
                fraud_detection_service_1.fraudDetectionService.logSecurityEvent({
                    orderId: req.body.orderId || '',
                    eventType: 'WEBHOOK_SIGNATURE_INVALID',
                    riskScore: 80,
                    isSuspicious: true,
                    details: {
                        gateway,
                        signature: signature.substring(0, 10) + '...'
                    },
                    ipAddress: req.ip
                }).catch(err => {
                    console.error('Error logging security event:', err);
                });
                return res.status(401).json({
                    success: false,
                    error: 'Invalid webhook signature'
                });
            }
            next()()();
        }
        catch (error) {
            console.error('Error verifying webhook signature:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to verify webhook signature'
            });
        }
    };
};
exports.verifyWebhookSignature = verifyWebhookSignature;
/**
 * Rate limit payment attempts
 * Rate limits payment initiation attempts
 */
const rateLimitPaymentAttempts = (options) => {
    const windowMs = options?.windowMs || 15 * 60 * 1000; // 15 minutes
    const max = options?.max || 10; // 10 attempts per window
    const message = options?.message || 'Too many payment attempts, please try again later';
    // Store attempt counts in memory (in production, use Redis)
    const attempts = new Map();
    return (req, res, next) => {
        try {
            const key = req.ip || req.connection.remoteAddress || 'unknown';
            const now = Date.now();
            // Get or create attempt record
            let attempt = attempts.get(key);
            if (!attempt || now > attempt.resetTime) {
                // Create new attempt record
                attempt = {
                    count: 1,
                    resetTime: now + windowMs
                };
                attempts.set(key, attempt);
            }
            else {
                // Increment count
                attempt.count++;
                attempts.set(key, attempt);
            }
            // Check if limit exceeded
            if (attempt.count > max) {
                const resetTime = Math.ceil((attempt.resetTime - now) / 1000);
                return res.status(429).json({
                    success: false,
                    error: message,
                    retryAfter: resetTime
                });
            }
            // Add rate limit info to headers
            res.setHeader('X-RateLimit-Limit', max);
            res.setHeader('X-RateLimit-Remaining', max - attempt.count);
            res.setHeader('X-RateLimit-Reset', attempt.resetTime);
            next()()();
        }
        catch (error) {
            console.error('Error in rate limit middleware:', error);
            next()()();
        }
    };
};
exports.rateLimitPaymentAttempts = rateLimitPaymentAttempts;
/**
 * Sanitize request data
 * Removes sensitive data from request before processing
 */
const sanitizeRequestData = (req, res, next) => {
    try {
        // Sanitize request body
        if (req.body) {
            req.body = pci_dss_service_1.pciDssComplianceService.sanitizePaymentData(req.body);
        }
        // Sanitize query parameters
        if (req.query) {
            req.query = pci_dss_service_1.pciDssComplianceService.sanitizePaymentData(req.query);
        }
        next()()();
    }
    catch (error) {
        console.error('Error sanitizing request data:', error);
        next()()();
    }
};
exports.sanitizeRequestData = sanitizeRequestData;
/**
 * Validate HTTPS
 * Ensures request is made over HTTPS in production
 */
const validateHttps = (req, res, next) => {
    // Skip check in non-production environments
    if (process.env.NODE_ENV !== 'production') {
        next()();
    }
    // Check if request is secure
    if (!req.secure && req.headers['x-forwarded-proto'] !== 'https') {
        return res.status(403).json({
            success: false,
            error: 'HTTPS is required for payment processing'
        });
    }
    next();
};
exports.validateHttps = validateHttps;
/**
 * Log payment request
 * Logs payment-related requests for audit purposes
 */
const logPaymentRequest = (req, res, next) => {
    try {
        const startTime = Date.now();
        // Store original send function
        const originalSend = res.json.bind(res);
        // Override send to log after response
        res.json = (data) => {
            const duration = Date.now() - startTime;
            // Log payment request
            console.log({
                type: 'PAYMENT_REQUEST',
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                duration,
                ipAddress: req.ip,
                userId: req.user?.id,
                orderId: req.body.orderId,
                amount: req.body.amount,
                paymentMethod: req.body.paymentMethod,
                fraudRiskScore: req.fraudAnalysis?.riskScore,
                timestamp: new Date().toISOString()
            });
            // Call original send
            return originalSend(data);
        };
        next()()();
    }
    catch (error) {
        console.error('Error in logPaymentRequest middleware:', error);
        next()()();
    }
};
exports.logPaymentRequest = logPaymentRequest;
/**
 * Security headers middleware
 * Adds security-related headers to responses
 */
const addSecurityHeaders = (req, res, next) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Strict transport security (HTTPS only)
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    // Content security policy
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    next();
};
exports.addSecurityHeaders = addSecurityHeaders;
