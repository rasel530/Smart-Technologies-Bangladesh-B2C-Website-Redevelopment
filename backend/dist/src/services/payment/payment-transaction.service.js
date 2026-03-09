"use strict";
/**
 * Payment Transaction Service
 *
 * This service manages payment transactions, including creating records,
 * updating status, logging events, and handling state transitions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentTransactionService = exports.PaymentTransactionService = void 0;
const client_1 = require("@prisma/client");
const payment_gateway_interface_1 = require("./payment-gateway.interface");
const fraud_detection_service_1 = require("./fraud-detection.service");
const security_audit_service_1 = require("./security-audit.service");
const fraud_detection_rules_service_1 = require("./fraud-detection-rules.service");
const crypto_1 = require("crypto");
const prisma = new client_1.PrismaClient();
/**
 * Payment Transaction Service Class
 */
class PaymentTransactionService {
    /**
     * Create a payment transaction record
     * @param request - Payment transaction creation request
     * @returns Created payment transaction
     */
    async createPaymentTransaction(request) {
        try {
            // Validate request
            this.validateCreateRequest(request);
            // Create payment transaction
            const transaction = await prisma.payment_transaction.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    orderId: request.orderId,
                    paymentMethod: request.paymentMethod,
                    amount: request.amount,
                    currency: request.currency,
                    transactionId: request.transactionId,
                    gatewayTransactionId: request.gatewayTransactionId,
                    paymentId: request.paymentId,
                    merchantInvoiceNumber: request.merchantInvoiceNumber,
                    customerMsisdn: request.customerMsisdn,
                    status: 'pending',
                    gatewayResponse: request.gatewayResponse
                }
            });
            // Log payment initiation event
            await this.logPaymentEvent({
                transactionId: transaction.id,
                orderId: request.orderId,
                eventType: payment_gateway_interface_1.PaymentEventType.INITIATION,
                eventData: {
                    paymentMethod: request.paymentMethod,
                    amount: request.amount,
                    currency: request.currency,
                    transactionId: request.transactionId
                },
                ipAddress: request.ipAddress,
                userAgent: request.userAgent
            });
            return transaction;
        }
        catch (error) {
            if (error instanceof payment_gateway_interface_1.PaymentGatewayError) {
                throw error;
            }
            console.error('Error creating payment transaction:', error);
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to create payment transaction', payment_gateway_interface_1.PaymentErrorType.INITIATION_FAILED, 500);
        }
    }
    /**
     * Update payment status
     * @param request - Payment status update request
     * @returns Updated payment transaction
     */
    async updatePaymentStatus(request) {
        try {
            // Validate request
            this.validateUpdateRequest(request);
            // Find transaction
            const existingTransaction = await prisma.payment_transaction.findUnique({
                where: { transactionId: request.transactionId }
            });
            if (!existingTransaction) {
                throw new payment_gateway_interface_1.PaymentGatewayError('Payment transaction not found', payment_gateway_interface_1.PaymentErrorType.TRANSACTION_NOT_FOUND, 404);
            }
            // Validate status transition
            this.validateStatusTransition(existingTransaction.status, request.status);
            // Prepare update data
            const updateData = {
                status: request.status
            };
            if (request.gatewayTransactionId) {
                updateData.gatewayTransactionId = request.gatewayTransactionId;
            }
            if (request.gatewayResponse) {
                updateData.gatewayResponse = request.gatewayResponse;
            }
            if (request.callbackResponse) {
                updateData.callbackResponse = request.callbackResponse;
            }
            if (request.failureReason) {
                updateData.failureReason = request.failureReason;
            }
            if (request.status === 'refunded' && request.refundAmount) {
                updateData.refundAmount = request.refundAmount;
                updateData.refundedAt = new Date();
            }
            // Update transaction
            const updatedTransaction = await prisma.payment_transaction.update({
                where: { transactionId: request.transactionId },
                data: updateData
            });
            // Log status update event
            const eventType = this.getEventTypeForStatus(request.status);
            await this.logPaymentEvent({
                transactionId: existingTransaction.id,
                orderId: existingTransaction.orderId,
                eventType,
                eventData: {
                    previousStatus: existingTransaction.status,
                    newStatus: request.status,
                    gatewayTransactionId: request.gatewayTransactionId,
                    failureReason: request.failureReason,
                    refundAmount: request.refundAmount
                }
            });
            return updatedTransaction;
        }
        catch (error) {
            if (error instanceof payment_gateway_interface_1.PaymentGatewayError) {
                throw error;
            }
            console.error('Error updating payment status:', error);
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to update payment status', payment_gateway_interface_1.PaymentErrorType.VERIFICATION_FAILED, 500);
        }
    }
    /**
     * Get payment transaction by ID
     * @param transactionId - The transaction ID
     * @returns Payment transaction or null
     */
    async getPaymentTransaction(transactionId) {
        try {
            const transaction = await prisma.payment_transaction.findUnique({
                where: { transactionId }
            });
            return transaction;
        }
        catch (error) {
            console.error('Error fetching payment transaction:', error);
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to fetch payment transaction', payment_gateway_interface_1.PaymentErrorType.VERIFICATION_FAILED, 500);
        }
    }
    /**
     * Get payment transactions by order ID
     * @param orderId - The order ID
     * @returns Array of payment transactions
     */
    async getPaymentTransactionsByOrderId(orderId) {
        try {
            const transactions = await prisma.payment_transaction.findMany({
                where: { orderId },
                orderBy: { createdAt: 'desc' }
            });
            return transactions;
        }
        catch (error) {
            console.error('Error fetching payment transactions:', error);
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to fetch payment transactions', payment_gateway_interface_1.PaymentErrorType.VERIFICATION_FAILED, 500);
        }
    }
    /**
     * Log payment event
     * @param request - Payment log request
     * @returns Created payment log
     */
    async logPaymentEvent(request) {
        try {
            // Sanitize event data to remove sensitive information
            const sanitizedEventData = this.sanitizeEventData(request.eventData);
            // Create payment log
            const log = await prisma.payment_log.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    transactionId: request.transactionId,
                    orderId: request.orderId,
                    eventType: request.eventType,
                    eventData: sanitizedEventData,
                    ipAddress: request.ipAddress,
                    userAgent: request.userAgent,
                    riskScore: request.riskScore,
                    isSuspicious: request.isSuspicious || false
                }
            });
            return log;
        }
        catch (error) {
            console.error('Error logging payment event:', error);
            // Don't throw error for logging failures to avoid disrupting payment flow
            return null;
        }
    }
    /**
     * Get payment logs by transaction ID
     * @param transactionId - The transaction ID
     * @returns Array of payment logs
     */
    async getPaymentLogsByTransactionId(transactionId) {
        try {
            const logs = await prisma.payment_log.findMany({
                where: { transactionId },
                orderBy: { createdAt: 'desc' }
            });
            return logs;
        }
        catch (error) {
            console.error('Error fetching payment logs:', error);
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to fetch payment logs', payment_gateway_interface_1.PaymentErrorType.VERIFICATION_FAILED, 500);
        }
    }
    /**
     * Get payment logs by order ID
     * @param orderId - The order ID
     * @returns Array of payment logs
     */
    async getPaymentLogsByOrderId(orderId) {
        try {
            const logs = await prisma.payment_log.findMany({
                where: { orderId },
                orderBy: { createdAt: 'desc' }
            });
            return logs;
        }
        catch (error) {
            console.error('Error fetching payment logs:', error);
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to fetch payment logs', payment_gateway_interface_1.PaymentErrorType.VERIFICATION_FAILED, 500);
        }
    }
    /**
     * Validate create payment transaction request
     * @param request - The request to validate
     * @throws PaymentGatewayError if validation fails
     */
    validateCreateRequest(request) {
        if (!request.orderId) {
            throw new payment_gateway_interface_1.PaymentGatewayError('Order ID is required', payment_gateway_interface_1.PaymentErrorType.INVALID_REQUEST, 400);
        }
        if (!request.paymentMethod) {
            throw new payment_gateway_interface_1.PaymentGatewayError('Payment method is required', payment_gateway_interface_1.PaymentErrorType.INVALID_REQUEST, 400);
        }
        if (request.amount <= 0) {
            throw new payment_gateway_interface_1.PaymentGatewayError('Amount must be greater than 0', payment_gateway_interface_1.PaymentErrorType.INVALID_REQUEST, 400);
        }
        if (!request.currency) {
            throw new payment_gateway_interface_1.PaymentGatewayError('Currency is required', payment_gateway_interface_1.PaymentErrorType.INVALID_REQUEST, 400);
        }
    }
    /**
     * Validate update payment status request
     * @param request - The request to validate
     * @throws PaymentGatewayError if validation fails
     */
    validateUpdateRequest(request) {
        if (!request.transactionId) {
            throw new payment_gateway_interface_1.PaymentGatewayError('Transaction ID is required', payment_gateway_interface_1.PaymentErrorType.INVALID_REQUEST, 400);
        }
        if (!request.status) {
            throw new payment_gateway_interface_1.PaymentGatewayError('Status is required', payment_gateway_interface_1.PaymentErrorType.INVALID_REQUEST, 400);
        }
        const validStatuses = [
            'pending',
            'processing',
            'completed',
            'failed',
            'cancelled',
            'refunded'
        ];
        if (!validStatuses.includes(request.status)) {
            throw new payment_gateway_interface_1.PaymentGatewayError('Invalid payment status', payment_gateway_interface_1.PaymentErrorType.INVALID_REQUEST, 400);
        }
    }
    /**
     * Validate status transition
     * @param currentStatus - Current status
     * @param newStatus - New status
     * @throws PaymentGatewayError if transition is invalid
     */
    validateStatusTransition(currentStatus, newStatus) {
        const validTransitions = {
            pending: ['processing', 'completed', 'failed', 'cancelled'],
            processing: ['completed', 'failed', 'cancelled'],
            completed: ['refunded'],
            failed: [],
            cancelled: [],
            refunded: []
        };
        const allowedTransitions = validTransitions[currentStatus] || [];
        if (!allowedTransitions.includes(newStatus)) {
            throw new payment_gateway_interface_1.PaymentGatewayError(`Invalid status transition from ${currentStatus} to ${newStatus}`, payment_gateway_interface_1.PaymentErrorType.INVALID_REQUEST, 400);
        }
    }
    /**
     * Get event type for payment status
     * @param status - Payment status
     * @returns Payment event type
     */
    getEventTypeForStatus(status) {
        const eventTypeMap = {
            pending: payment_gateway_interface_1.PaymentEventType.INITIATION,
            processing: payment_gateway_interface_1.PaymentEventType.VERIFICATION,
            completed: payment_gateway_interface_1.PaymentEventType.SUCCESS,
            failed: payment_gateway_interface_1.PaymentEventType.FAILURE,
            cancelled: payment_gateway_interface_1.PaymentEventType.CANCEL,
            refunded: payment_gateway_interface_1.PaymentEventType.REFUND
        };
        return eventTypeMap[status] || payment_gateway_interface_1.PaymentEventType.VERIFICATION;
    }
    /**
     * Sanitize event data to remove sensitive information
     * @param eventData - Event data to sanitize
     * @returns Sanitized event data
     */
    sanitizeEventData(eventData) {
        if (!eventData || typeof eventData !== 'object') {
            return eventData;
        }
        const sensitiveKeys = [
            'cardNumber',
            'cvv',
            'pin',
            'password',
            'card_no',
            'card_no',
            'pan'
        ];
        const sanitized = { ...eventData };
        for (const key of Object.keys(sanitized)) {
            if (sensitiveKeys.some(sensitiveKey => key.toLowerCase().includes(sensitiveKey.toLowerCase()))) {
                sanitized[key] = '[REDACTED]';
            }
        }
        return sanitized;
    }
    /**
     * Log security event
     * @param request - Security event log request
     * @returns Created payment log
     */
    async logSecurityEvent(request) {
        try {
            // Sanitize event data to remove sensitive information
            const sanitizedEventData = this.sanitizeEventData(request.details);
            // Create payment log for security event
            await prisma.payment_log.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    transactionId: request.transactionId,
                    orderId: request.orderId,
                    eventType: 'SECURITY_EVENT',
                    eventData: {
                        eventType: request.eventType,
                        riskScore: request.riskScore,
                        isSuspicious: request.isSuspicious,
                        details: sanitizedEventData,
                        timestamp: new Date().toISOString()
                    },
                    ipAddress: request.ipAddress,
                    userAgent: request.userAgent,
                    riskScore: request.riskScore,
                    isSuspicious: request.isSuspicious
                }
            });
            // Also log to console for immediate visibility
            console.log(`[SECURITY_EVENT] ${request.eventType}`, {
                orderId: request.orderId,
                transactionId: request.transactionId,
                riskScore: request.riskScore,
                isSuspicious: request.isSuspicious,
                ipAddress: request.ipAddress,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Error logging security event:', error);
            // Don't throw error for logging failures to avoid disrupting payment flow
        }
    }
    /**
     * Create a secure payment transaction with fraud detection and security checks
     * @param request - Payment transaction creation request
     * @param userId - User ID for security checks
     * @returns Created payment transaction with security assessment
     */
    async createSecurePaymentTransaction(request, userId) {
        try {
            // Validate request
            this.validateCreateRequest(request);
            // Perform ML-based fraud detection
            let mlRiskScore = 0;
            let isFraudulent = false;
            try {
                if (userId) {
                    // Get user from database
                    const user = await prisma.users.findUnique({
                        where: { id: userId }
                    });
                    if (user) {
                        // Calculate ML risk score
                        mlRiskScore = await fraud_detection_service_1.fraudDetectionService.calculateMLRiskScore({
                            id: request.transactionId || request.orderId,
                            orderId: request.orderId,
                            paymentMethod: request.paymentMethod,
                            amount: request.amount,
                            currency: request.currency,
                            status: 'pending',
                            createdAt: new Date()
                        }, user, {
                            ipAddress: request.ipAddress || '',
                            userAgent: request.userAgent,
                            timestamp: new Date()
                        });
                        // Predict fraud
                        const fraudPrediction = await fraud_detection_service_1.fraudDetectionService.predictFraud({
                            id: request.transactionId || request.orderId,
                            orderId: request.orderId,
                            paymentMethod: request.paymentMethod,
                            amount: request.amount,
                            currency: request.currency,
                            status: 'pending',
                            createdAt: new Date()
                        });
                        isFraudulent = fraudPrediction.isFraud;
                        // Log fraud detection result
                        if (isFraudulent || mlRiskScore > 50) {
                            await security_audit_service_1.securityAuditService.logSecurityEvent('FRAUD_DETECTED', mlRiskScore > 70 ? 'CRITICAL' : mlRiskScore > 50 ? 'WARNING' : 'INFO', `ML-based fraud detection identified potential fraud`, {
                                userId,
                                orderId: request.orderId,
                                transactionId: request.transactionId,
                                riskScore: mlRiskScore,
                                isFraudulent,
                                prediction: fraudPrediction
                            });
                        }
                    }
                }
            }
            catch (error) {
                console.error('Error in ML fraud detection:', error);
                // Continue with payment even if ML detection fails
            }
            // Perform behavioral analysis
            let behaviorScore = 0;
            let isAnomalous = false;
            try {
                if (userId) {
                    // Analyze user behavior
                    const behaviorAnalysis = await fraud_detection_service_1.fraudDetectionService.analyzeUserBehavior(userId, {
                        id: request.transactionId || request.orderId,
                        orderId: request.orderId,
                        paymentMethod: request.paymentMethod,
                        amount: request.amount,
                        currency: request.currency,
                        status: 'pending',
                        createdAt: new Date()
                    });
                    behaviorScore = behaviorAnalysis.overallScore;
                    isAnomalous = await fraud_detection_service_1.fraudDetectionService.detectAnomalousBehavior(userId, {
                        id: request.transactionId || request.orderId,
                        orderId: request.orderId,
                        paymentMethod: request.paymentMethod,
                        amount: request.amount,
                        currency: request.currency,
                        status: 'pending',
                        createdAt: new Date()
                    });
                    // Update user behavior profile
                    await fraud_detection_service_1.fraudDetectionService.updateBehaviorProfile(userId, {
                        id: request.transactionId || request.orderId,
                        orderId: request.orderId,
                        paymentMethod: request.paymentMethod,
                        amount: request.amount,
                        currency: request.currency,
                        status: 'pending',
                        createdAt: new Date()
                    });
                    // Log behavioral analysis result
                    if (isAnomalous || behaviorScore > 50) {
                        await security_audit_service_1.securityAuditService.logSecurityEvent('SUSPICIOUS_BEHAVIOR', behaviorScore > 70 ? 'CRITICAL' : behaviorScore > 50 ? 'WARNING' : 'INFO', `Behavioral analysis detected anomalous user behavior`, {
                            userId,
                            orderId: request.orderId,
                            transactionId: request.transactionId,
                            behaviorScore,
                            isAnomalous
                        });
                    }
                }
            }
            catch (error) {
                console.error('Error in behavioral analysis:', error);
                // Continue with payment even if behavioral analysis fails
            }
            // Evaluate fraud rules
            let fraudRulesResult = null;
            try {
                fraudRulesResult = await fraud_detection_rules_service_1.fraudDetectionRulesService.evaluateFraudRules({
                    orderId: request.orderId,
                    paymentMethod: request.paymentMethod,
                    amount: request.amount,
                    currency: request.currency,
                    transactionId: request.transactionId,
                    gatewayTransactionId: request.gatewayTransactionId,
                    paymentId: request.paymentId,
                    merchantInvoiceNumber: request.merchantInvoiceNumber,
                    customerMsisdn: request.customerMsisdn,
                    status: 'pending',
                    gatewayResponse: request.gatewayResponse
                });
            }
            catch (error) {
                console.error('Error evaluating fraud rules:', error);
                // Continue with payment even if rule evaluation fails
            }
            // Calculate overall risk score from available data
            const overallRiskScore = mlRiskScore + (behaviorScore > 0 ? behaviorScore / 2 : 0) + (fraudRulesResult ? fraudRulesResult.riskScore / 4 : 0);
            // Determine risk level
            let riskLevel = 'LOW';
            if (overallRiskScore >= 80) {
                riskLevel = 'CRITICAL';
            }
            else if (overallRiskScore >= 60) {
                riskLevel = 'HIGH';
            }
            else if (overallRiskScore >= 40) {
                riskLevel = 'MEDIUM';
            }
            // Block high-risk transactions
            if (overallRiskScore >= 80) {
                // Create fraud detection record
                await prisma.fraud_detection.create({
                    data: {
                        id: (0, crypto_1.randomUUID)(),
                        user_id: userId || null,
                        transaction_id: (0, crypto_1.randomUUID)(), // Will be updated when transaction is created
                        risk_score: overallRiskScore,
                        risk_level: riskLevel,
                        detection_rules: {
                            mlRiskScore,
                            behaviorScore,
                            fraudRulesResult,
                            isFraudulent,
                            isAnomalous
                        }
                    }
                });
                // Log blocked transaction
                await security_audit_service_1.securityAuditService.logSecurityEvent('BLOCKED_TRANSACTION', 'CRITICAL', `Transaction blocked due to high risk score (${overallRiskScore})`, {
                    userId,
                    orderId: request.orderId,
                    transactionId: request.transactionId,
                    riskScore: overallRiskScore,
                    riskLevel,
                    mlRiskScore,
                    behaviorScore,
                    fraudRulesResult
                });
                throw new payment_gateway_interface_1.PaymentGatewayError('Transaction blocked due to security concerns', payment_gateway_interface_1.PaymentErrorType.FRAUD_DETECTION_FAILED, 403);
            }
            // Create payment transaction
            const transaction = await prisma.payment_transaction.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    orderId: request.orderId,
                    paymentMethod: request.paymentMethod,
                    amount: request.amount,
                    currency: request.currency,
                    transactionId: request.transactionId,
                    gatewayTransactionId: request.gatewayTransactionId,
                    paymentId: request.paymentId,
                    merchantInvoiceNumber: request.merchantInvoiceNumber,
                    customerMsisdn: request.customerMsisdn,
                    status: overallRiskScore >= 60 ? 'processing' : 'pending', // High risk goes to processing for manual review
                    gatewayResponse: request.gatewayResponse
                }
            });
            // Store fraud detection result for medium to high risk transactions
            if (overallRiskScore >= 40) {
                await prisma.fraud_detection.create({
                    data: {
                        id: (0, crypto_1.randomUUID)(),
                        user_id: userId || null,
                        transaction_id: transaction.id,
                        risk_score: overallRiskScore,
                        risk_level: riskLevel,
                        detection_rules: {
                            mlRiskScore,
                            behaviorScore,
                            fraudRulesResult,
                            isFraudulent,
                            isAnomalous
                        }
                    }
                });
                // Log high-risk transaction
                await security_audit_service_1.securityAuditService.logSecurityEvent('HIGH_RISK_TRANSACTION', overallRiskScore >= 60 ? 'WARNING' : 'INFO', `Transaction flagged for manual review due to risk score (${overallRiskScore})`, {
                    userId,
                    orderId: request.orderId,
                    transactionId: transaction.id,
                    riskScore: overallRiskScore,
                    riskLevel
                });
            }
            // Log payment initiation event with security context
            await this.logPaymentEvent({
                transactionId: transaction.id,
                orderId: request.orderId,
                eventType: payment_gateway_interface_1.PaymentEventType.INITIATION,
                eventData: {
                    paymentMethod: request.paymentMethod,
                    amount: request.amount,
                    currency: request.currency,
                    transactionId: request.transactionId,
                    securityAssessment: {
                        overallRiskScore,
                        riskLevel,
                        mlRiskScore,
                        behaviorScore,
                        isFraudulent,
                        isAnomalous
                    }
                },
                ipAddress: request.ipAddress,
                userAgent: request.userAgent,
                riskScore: overallRiskScore,
                isSuspicious: overallRiskScore >= 40
            });
            return transaction;
        }
        catch (error) {
            if (error instanceof payment_gateway_interface_1.PaymentGatewayError) {
                throw error;
            }
            console.error('Error creating secure payment transaction:', error);
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to create payment transaction', payment_gateway_interface_1.PaymentErrorType.INITIATION_FAILED, 500);
        }
    }
}
exports.PaymentTransactionService = PaymentTransactionService;
// Export singleton instance
exports.paymentTransactionService = new PaymentTransactionService();
