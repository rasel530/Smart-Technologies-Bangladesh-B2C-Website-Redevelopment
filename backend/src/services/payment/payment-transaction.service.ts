/**
 * Payment Transaction Service
 * 
 * This service manages payment transactions, including creating records,
 * updating status, logging events, and handling state transitions.
 */

import { PrismaClient, PaymentMethod, PaymentStatus } from '@prisma/client';
import {
  PaymentEventType,
  PaymentErrorType,
  PaymentGatewayError
} from './payment-gateway.interface';
import { fraudDetectionService } from './fraud-detection.service';
import { securityAuditService } from './security-audit.service';
import { fraudDetectionRulesService } from './fraud-detection-rules.service';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

/**
 * Create Payment Transaction Request
 */
export interface CreatePaymentTransactionRequest {
  orderId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  currency: string;
  transactionId?: string;
  gatewayTransactionId?: string;
  paymentId?: string;
  merchantInvoiceNumber?: string;
  customerMsisdn?: string;
  gatewayResponse?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Update Payment Status Request
 */
export interface UpdatePaymentStatusRequest {
  transactionId: string;
  status: PaymentStatus;
  gatewayTransactionId?: string;
  gatewayResponse?: any;
  callbackResponse?: any;
  failureReason?: string;
  refundAmount?: number;
}

/**
 * Payment Log Request
 */
export interface PaymentLogRequest {
  transactionId?: string;
  orderId?: string;
  eventType: PaymentEventType;
  eventData: any;
  ipAddress?: string;
  userAgent?: string;
  riskScore?: number;
  isSuspicious?: boolean;
}

/**
 * Security Event Log Request
 */
export interface SecurityEventLogRequest {
  transactionId?: string;
  orderId: string;
  eventType: string;
  riskScore: number;
  isSuspicious: boolean;
  details: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Payment Transaction Service Class
 */
export class PaymentTransactionService {
  /**
   * Create a payment transaction record
   * @param request - Payment transaction creation request
   * @returns Created payment transaction
   */
  async createPaymentTransaction(
    request: CreatePaymentTransactionRequest
  ) {
    try {
      // Validate request
      this.validateCreateRequest(request);

      // Create payment transaction
      const transaction = await prisma.payment_transaction.create({
        data: {
          id: randomUUID(),
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
        eventType: PaymentEventType.INITIATION,
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
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }

      console.error('Error creating payment transaction:', error);
      throw new PaymentGatewayError(
        'Failed to create payment transaction',
        PaymentErrorType.INITIATION_FAILED,
        500
      );
    }
  }

  /**
   * Update payment status
   * @param request - Payment status update request
   * @returns Updated payment transaction
   */
  async updatePaymentStatus(
    request: UpdatePaymentStatusRequest
  ) {
    try {
      // Validate request
      this.validateUpdateRequest(request);

      // Find transaction
      const existingTransaction = await prisma.payment_transaction.findUnique({
        where: { transactionId: request.transactionId }
      });

      if (!existingTransaction) {
        throw new PaymentGatewayError(
          'Payment transaction not found',
          PaymentErrorType.TRANSACTION_NOT_FOUND,
          404
        );
      }

      // Validate status transition
      this.validateStatusTransition(
        existingTransaction.status,
        request.status
      );

      // Prepare update data
      const updateData: any = {
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
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }

      console.error('Error updating payment status:', error);
      throw new PaymentGatewayError(
        'Failed to update payment status',
        PaymentErrorType.VERIFICATION_FAILED,
        500
      );
    }
  }

  /**
   * Get payment transaction by ID
   * @param transactionId - The transaction ID
   * @returns Payment transaction or null
   */
  async getPaymentTransaction(transactionId: string) {
    try {
      const transaction = await prisma.payment_transaction.findUnique({
        where: { transactionId }
      });

      return transaction;
    } catch (error) {
      console.error('Error fetching payment transaction:', error);
      throw new PaymentGatewayError(
        'Failed to fetch payment transaction',
        PaymentErrorType.VERIFICATION_FAILED,
        500
      );
    }
  }

  /**
   * Get payment transactions by order ID
   * @param orderId - The order ID
   * @returns Array of payment transactions
   */
  async getPaymentTransactionsByOrderId(orderId: string) {
    try {
      const transactions = await prisma.payment_transaction.findMany({
        where: { orderId },
        orderBy: { createdAt: 'desc' }
      });

      return transactions;
    } catch (error) {
      console.error('Error fetching payment transactions:', error);
      throw new PaymentGatewayError(
        'Failed to fetch payment transactions',
        PaymentErrorType.VERIFICATION_FAILED,
        500
      );
    }
  }

  /**
   * Log payment event
   * @param request - Payment log request
   * @returns Created payment log
   */
  async logPaymentEvent(request: PaymentLogRequest) {
    try {
      // Sanitize event data to remove sensitive information
      const sanitizedEventData = this.sanitizeEventData(request.eventData);

      // Create payment log
      const log = await prisma.payment_log.create({
        data: {
          id: randomUUID(),
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
    } catch (error) {
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
  async getPaymentLogsByTransactionId(transactionId: string) {
    try {
      const logs = await prisma.payment_log.findMany({
        where: { transactionId },
        orderBy: { createdAt: 'desc' }
      });

      return logs;
    } catch (error) {
      console.error('Error fetching payment logs:', error);
      throw new PaymentGatewayError(
        'Failed to fetch payment logs',
        PaymentErrorType.VERIFICATION_FAILED,
        500
      );
    }
  }

  /**
   * Get payment logs by order ID
   * @param orderId - The order ID
   * @returns Array of payment logs
   */
  async getPaymentLogsByOrderId(orderId: string) {
    try {
      const logs = await prisma.payment_log.findMany({
        where: { orderId },
        orderBy: { createdAt: 'desc' }
      });

      return logs;
    } catch (error) {
      console.error('Error fetching payment logs:', error);
      throw new PaymentGatewayError(
        'Failed to fetch payment logs',
        PaymentErrorType.VERIFICATION_FAILED,
        500
      );
    }
  }

  /**
   * Validate create payment transaction request
   * @param request - The request to validate
   * @throws PaymentGatewayError if validation fails
   */
  private validateCreateRequest(request: CreatePaymentTransactionRequest): void {
    if (!request.orderId) {
      throw new PaymentGatewayError(
        'Order ID is required',
        PaymentErrorType.INVALID_REQUEST,
        400
      );
    }

    if (!request.paymentMethod) {
      throw new PaymentGatewayError(
        'Payment method is required',
        PaymentErrorType.INVALID_REQUEST,
        400
      );
    }

    if (request.amount <= 0) {
      throw new PaymentGatewayError(
        'Amount must be greater than 0',
        PaymentErrorType.INVALID_REQUEST,
        400
      );
    }

    if (!request.currency) {
      throw new PaymentGatewayError(
        'Currency is required',
        PaymentErrorType.INVALID_REQUEST,
        400
      );
    }
  }

  /**
   * Validate update payment status request
   * @param request - The request to validate
   * @throws PaymentGatewayError if validation fails
   */
  private validateUpdateRequest(request: UpdatePaymentStatusRequest): void {
    if (!request.transactionId) {
      throw new PaymentGatewayError(
        'Transaction ID is required',
        PaymentErrorType.INVALID_REQUEST,
        400
      );
    }

    if (!request.status) {
      throw new PaymentGatewayError(
        'Status is required',
        PaymentErrorType.INVALID_REQUEST,
        400
      );
    }

    const validStatuses: PaymentStatus[] = [
      'pending',
      'processing',
      'completed',
      'failed',
      'cancelled',
      'refunded'
    ];

    if (!validStatuses.includes(request.status)) {
      throw new PaymentGatewayError(
        'Invalid payment status',
        PaymentErrorType.INVALID_REQUEST,
        400
      );
    }
  }

  /**
   * Validate status transition
   * @param currentStatus - Current status
   * @param newStatus - New status
   * @throws PaymentGatewayError if transition is invalid
   */
  private validateStatusTransition(
    currentStatus: PaymentStatus,
    newStatus: PaymentStatus
  ): void {
    const validTransitions: Record<PaymentStatus, PaymentStatus[]> = {
      pending: ['processing', 'completed', 'failed', 'cancelled'],
      processing: ['completed', 'failed', 'cancelled'],
      completed: ['refunded'],
      failed: [],
      cancelled: [],
      refunded: []
    };

    const allowedTransitions = validTransitions[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      throw new PaymentGatewayError(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
        PaymentErrorType.INVALID_REQUEST,
        400
      );
    }
  }

  /**
   * Get event type for payment status
   * @param status - Payment status
   * @returns Payment event type
   */
  private getEventTypeForStatus(status: PaymentStatus): PaymentEventType {
    const eventTypeMap: Record<PaymentStatus, PaymentEventType> = {
      pending: PaymentEventType.INITIATION,
      processing: PaymentEventType.VERIFICATION,
      completed: PaymentEventType.SUCCESS,
      failed: PaymentEventType.FAILURE,
      cancelled: PaymentEventType.CANCEL,
      refunded: PaymentEventType.REFUND
    };

    return eventTypeMap[status] || PaymentEventType.VERIFICATION;
  }

  /**
   * Sanitize event data to remove sensitive information
   * @param eventData - Event data to sanitize
   * @returns Sanitized event data
   */
  private sanitizeEventData(eventData: any): any {
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
      if (sensitiveKeys.some(sensitiveKey =>
        key.toLowerCase().includes(sensitiveKey.toLowerCase())
      )) {
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
  async logSecurityEvent(request: SecurityEventLogRequest): Promise<void> {
    try {
      // Sanitize event data to remove sensitive information
      const sanitizedEventData = this.sanitizeEventData(request.details);

      // Create payment log for security event
      await prisma.payment_log.create({
        data: {
          id: randomUUID(),
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
    } catch (error) {
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
  async createSecurePaymentTransaction(
    request: CreatePaymentTransactionRequest,
    userId?: string
  ) {
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
            mlRiskScore = await fraudDetectionService.calculateMLRiskScore(
              {
                id: request.transactionId || request.orderId,
                orderId: request.orderId,
                paymentMethod: request.paymentMethod,
                amount: request.amount,
                currency: request.currency,
                status: 'pending',
                createdAt: new Date()
              },
              user,
              {
                ipAddress: request.ipAddress || '',
                userAgent: request.userAgent,
                timestamp: new Date()
              }
            );

            // Predict fraud
            const fraudPrediction = await fraudDetectionService.predictFraud({
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
              await securityAuditService.logSecurityEvent(
                'FRAUD_DETECTED',
                mlRiskScore > 70 ? 'CRITICAL' : mlRiskScore > 50 ? 'WARNING' : 'INFO',
                `ML-based fraud detection identified potential fraud`,
                {
                  userId,
                  orderId: request.orderId,
                  transactionId: request.transactionId,
                  riskScore: mlRiskScore,
                  isFraudulent,
                  prediction: fraudPrediction
                }
              );
            }
          }
        }
      } catch (error) {
        console.error('Error in ML fraud detection:', error);
        // Continue with payment even if ML detection fails
      }

      // Perform behavioral analysis
      let behaviorScore = 0;
      let isAnomalous = false;
      try {
        if (userId) {
          // Analyze user behavior
          const behaviorAnalysis = await fraudDetectionService.analyzeUserBehavior(
            userId,
            {
              id: request.transactionId || request.orderId,
              orderId: request.orderId,
              paymentMethod: request.paymentMethod,
              amount: request.amount,
              currency: request.currency,
              status: 'pending',
              createdAt: new Date()
            }
          );

          behaviorScore = behaviorAnalysis.overallScore;
          isAnomalous = await fraudDetectionService.detectAnomalousBehavior(
            userId,
            {
              id: request.transactionId || request.orderId,
              orderId: request.orderId,
              paymentMethod: request.paymentMethod,
              amount: request.amount,
              currency: request.currency,
              status: 'pending',
              createdAt: new Date()
            }
          );

          // Update user behavior profile
          await fraudDetectionService.updateBehaviorProfile(
            userId,
            {
              id: request.transactionId || request.orderId,
              orderId: request.orderId,
              paymentMethod: request.paymentMethod,
              amount: request.amount,
              currency: request.currency,
              status: 'pending',
              createdAt: new Date()
            }
          );

          // Log behavioral analysis result
          if (isAnomalous || behaviorScore > 50) {
            await securityAuditService.logSecurityEvent(
              'SUSPICIOUS_BEHAVIOR',
              behaviorScore > 70 ? 'CRITICAL' : behaviorScore > 50 ? 'WARNING' : 'INFO',
              `Behavioral analysis detected anomalous user behavior`,
              {
                userId,
                orderId: request.orderId,
                transactionId: request.transactionId,
                behaviorScore,
                isAnomalous
              }
            );
          }
        }
      } catch (error) {
        console.error('Error in behavioral analysis:', error);
        // Continue with payment even if behavioral analysis fails
      }

      // Evaluate fraud rules
      let fraudRulesResult = null;
      try {
        fraudRulesResult = await fraudDetectionRulesService.evaluateFraudRules({
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
      } catch (error) {
        console.error('Error evaluating fraud rules:', error);
        // Continue with payment even if rule evaluation fails
      }

      // Calculate overall risk score from available data
      const overallRiskScore = mlRiskScore + (behaviorScore > 0 ? behaviorScore / 2 : 0) + (fraudRulesResult ? fraudRulesResult.riskScore / 4 : 0);

      // Determine risk level
      let riskLevel = 'LOW';
      if (overallRiskScore >= 80) {
        riskLevel = 'CRITICAL';
      } else if (overallRiskScore >= 60) {
        riskLevel = 'HIGH';
      } else if (overallRiskScore >= 40) {
        riskLevel = 'MEDIUM';
      }

      // Block high-risk transactions
      if (overallRiskScore >= 80) {
        // Create fraud detection record
        await prisma.fraud_detection.create({
          data: {
            id: randomUUID(),
            user_id: userId || null,
            transaction_id: randomUUID(), // Will be updated when transaction is created
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
        await securityAuditService.logSecurityEvent(
          'BLOCKED_TRANSACTION',
          'CRITICAL',
          `Transaction blocked due to high risk score (${overallRiskScore})`,
          {
            userId,
            orderId: request.orderId,
            transactionId: request.transactionId,
            riskScore: overallRiskScore,
            riskLevel,
            mlRiskScore,
            behaviorScore,
            fraudRulesResult
          }
        );

        throw new PaymentGatewayError(
          'Transaction blocked due to security concerns',
          PaymentErrorType.FRAUD_DETECTION_FAILED,
          403
        );
      }

      // Create payment transaction
      const transaction = await prisma.payment_transaction.create({
        data: {
          id: randomUUID(),
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
            id: randomUUID(),
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
        await securityAuditService.logSecurityEvent(
          'HIGH_RISK_TRANSACTION',
          overallRiskScore >= 60 ? 'WARNING' : 'INFO',
          `Transaction flagged for manual review due to risk score (${overallRiskScore})`,
          {
            userId,
            orderId: request.orderId,
            transactionId: transaction.id,
            riskScore: overallRiskScore,
            riskLevel
          }
        );
      }

      // Log payment initiation event with security context
      await this.logPaymentEvent({
        transactionId: transaction.id,
        orderId: request.orderId,
        eventType: PaymentEventType.INITIATION,
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
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }

      console.error('Error creating secure payment transaction:', error);
      throw new PaymentGatewayError(
        'Failed to create payment transaction',
        PaymentErrorType.INITIATION_FAILED,
        500
      );
    }
  }
}

// Export singleton instance
export const paymentTransactionService = new PaymentTransactionService();
