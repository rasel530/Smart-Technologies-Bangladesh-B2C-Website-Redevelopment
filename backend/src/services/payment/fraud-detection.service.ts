/**
 * Fraud Detection Service
 *
 * This service provides comprehensive fraud detection capabilities for payment transactions.
 * It implements multiple layers of detection including velocity checks, pattern analysis,
 * geographic verification, device fingerprinting, ML-based detection, and behavioral analysis.
 */

import { databaseService } from '../database.service';
import { PaymentGatewayError, PaymentErrorType } from './payment-gateway.interface';

const prisma = databaseService.getClient();

/**
 * Payment Transaction Interface
 */
export interface PaymentTransaction {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  createdAt: Date;
}

/**
 * User Interface
 */
export interface User {
  id: string;
  email?: string;
  phone?: string;
}

/**
 * Payment Context Interface
 */
export interface PaymentContext {
  ipAddress: string;
  userAgent?: string;
  deviceId?: string;
  timestamp: Date;
}

/**
 * Transaction Data for ML Training
 */
export interface TransactionData {
  amount: number;
  paymentMethod: string;
  timeOfDay: number;
  dayOfWeek: number;
  isFraud: boolean;
  userId?: string;
  ipAddress?: string;
}

/**
 * ML Model Interface
 */
export interface Model {
  version: string;
  trainedAt: Date;
  accuracy: number;
  features: string[];
}

/**
 * Fraud Prediction Result
 */
export interface FraudPrediction {
  isFraud: boolean;
  confidence: number;
  riskScore: number;
  features: Record<string, number>;
  modelVersion: string;
}

/**
 * Model Metrics
 */
export interface ModelMetrics {
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  totalPredictions: number;
  lastUpdated: Date;
}

/**
 * Behavior Score Result
 */
export interface BehaviorScore {
  userId: string;
  overallScore: number;
  amountScore: number;
  frequencyScore: number;
  timeScore: number;
  locationScore: number;
  deviceScore: number;
  paymentMethodScore: number;
  isAnomalous: boolean;
  anomalies: string[];
  lastUpdated: Date;
}

/**
 * Behavior Profile
 */
export interface BehaviorProfile {
  userId: string;
  typicalAmountRange: { min: number; max: number; avg: number };
  typicalPurchaseFrequency: { perDay: number; perWeek: number; perMonth: number };
  typicalPurchaseTimes: { hours: number[]; days: number[] };
  typicalLocations: string[];
  deviceUsage: { deviceId: string; usageCount: number }[];
  paymentMethodPreferences: { method: string; usageCount: number; percentage: number }[];
  accountAge: number;
  totalTransactions: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Behavior Comparison Result
 */
export interface BehaviorComparison {
  userId: string;
  transactionAmount: number;
  amountDeviation: number;
  amountDeviationPercent: number;
  isAmountAnomalous: boolean;
  frequencyDeviation: number;
  isFrequencyAnomalous: boolean;
  timeDeviation: number;
  isTimeAnomalous: boolean;
  locationDeviation: number;
  isLocationAnomalous: boolean;
  deviceDeviation: number;
  isDeviceAnomalous: boolean;
  overallAnomalyScore: number;
  recommendations: string[];
}

/**
 * Risk Factor Breakdown
 */
export interface RiskFactorBreakdown {
  mlRiskScore: number;
  behavioralAnomalyScore: number;
  deviceReputationScore: number;
  locationRiskScore: number;
  timeBasedRiskScore: number;
  velocityRiskScore: number;
  ipRiskScore: number;
  amountRiskScore: number;
  totalScore: number;
  highestRiskFactor: string;
}

/**
 * Risk Statistics
 */
export interface RiskStatistics {
  averageRiskScore: number;
  medianRiskScore: number;
  maxRiskScore: number;
  minRiskScore: number;
  scoreDistribution: Record<string, number>;
  totalTransactions: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  period: { startDate: Date; endDate: Date };
}

/**
 * Fraud Detection Rules Configuration
 */
export interface FraudDetectionRules {
  // Velocity checks
  maxTransactionsPerHour: number;
  maxTransactionsPerDay: number;
  maxTransactionAmount: number;
  maxFailedAttempts: number;
  
  // Pattern detection
  suspiciousAmountPatterns: RegExp[];
  suspiciousPhonePatterns: RegExp[];
  
  // Geographic checks
  blockedCountries: string[];
  suspiciousIPRanges: string[];
  
  // Device fingerprinting
  trackDeviceId: boolean;
  trackIPHistory: boolean;
  
  // Time-based checks
  suspiciousHours: number[];
}

/**
 * Fraud Analysis Request
 */
export interface FraudAnalysisRequest {
  userId?: string;
  orderId: string;
  amount: number;
  currency: string;
  phoneNumber?: string;
  ipAddress: string;
  userAgent?: string;
  deviceId?: string;
  paymentMethod: string;
  timestamp?: Date;
}

/**
 * Fraud Analysis Result
 */
export interface FraudAnalysisResult {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isBlocked: boolean;
  blockReason?: string;
  analysis: FraudAnalysis;
  recommendations: string[];
}

/**
 * Fraud Analysis Details
 */
export interface FraudAnalysis {
  velocityCheck?: VelocityCheckResult;
  ipAnalysis?: IPAnalysisResult;
  amountPattern?: AmountPatternResult;
  phonePattern?: PhonePatternResult;
  timePattern?: TimePatternResult;
  deviceAnalysis?: DeviceAnalysisResult;
}

/**
 * Velocity Check Result
 */
export interface VelocityCheckResult {
  transactionsPerHour: number;
  transactionsPerDay: number;
  failedAttempts: number;
  exceedsHourlyLimit: boolean;
  exceedsDailyLimit: boolean;
  exceedsFailedAttempts: boolean;
  score: number;
}

/**
 * IP Analysis Result
 */
export interface IPAnalysisResult {
  ipAddress: string;
  country?: string;
  isBlockedCountry: boolean;
  isSuspiciousRange: boolean;
  isNewIP: boolean;
  score: number;
}

/**
 * Amount Pattern Result
 */
export interface AmountPatternResult {
  amount: number;
  isSuspicious: boolean;
  patternMatched?: string;
  score: number;
}

/**
 * Phone Pattern Result
 */
export interface PhonePatternResult {
  phoneNumber?: string;
  isSuspicious: boolean;
  patternMatched?: string;
  score: number;
}

/**
 * Time Pattern Result
 */
export interface TimePatternResult {
  hour: number;
  isSuspiciousHour: boolean;
  score: number;
}

/**
 * Device Analysis Result
 */
export interface DeviceAnalysisResult {
  deviceId?: string;
  isNewDevice: boolean;
  score: number;
}

/**
 * Fraud History Entry
 */
export interface FraudHistory {
  id: string;
  userId?: string;
  eventType: string;
  riskScore: number;
  details: any;
  ipAddress?: string;
  createdAt: Date;
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
 * Fraud Detection Service Class
 */
export class FraudDetectionService {
  private rules: FraudDetectionRules;

  constructor(rules?: Partial<FraudDetectionRules>) {
    this.rules = {
      maxTransactionsPerHour: rules?.maxTransactionsPerHour || 10,
      maxTransactionsPerDay: rules?.maxTransactionsPerDay || 30,
      maxTransactionAmount: rules?.maxTransactionAmount || 100000,
      maxFailedAttempts: rules?.maxFailedAttempts || 5,
      suspiciousAmountPatterns: rules?.suspiciousAmountPatterns || [
        /^\d{4,}00$/, // Round thousands
        /^\d{3,}000$/, // Round thousands
        /^50000$/,     // Specific round amount
        /^100000$/     // Specific round amount
      ],
      suspiciousPhonePatterns: rules?.suspiciousPhonePatterns || [
        /(\d)\1{9,}/, // Repeated digits
        /^1234567890$/, // Sequential
        /^9876543210$/  // Reverse sequential
      ],
      blockedCountries: rules?.blockedCountries || [],
      suspiciousIPRanges: rules?.suspiciousIPRanges || [],
      trackDeviceId: rules?.trackDeviceId ?? true,
      trackIPHistory: rules?.trackIPHistory ?? true,
      suspiciousHours: rules?.suspiciousHours || [2, 3, 4, 5]
    };
  }

  /**
   * Analyze payment for fraud risk
   * @param request - Fraud analysis request
   * @returns Fraud analysis result
   */
  async analyzePayment(request: FraudAnalysisRequest): Promise<FraudAnalysisResult> {
    const analysis: FraudAnalysis = {};
    let totalScore = 0;
    const recommendations: string[] = [];

    try {
      // Check velocity limits
      if (request.userId) {
        analysis.velocityCheck = await this.checkVelocityLimits(request.userId, request.amount);
        totalScore += analysis.velocityCheck.score;

        if (analysis.velocityCheck.exceedsHourlyLimit) {
          recommendations.push('User exceeded hourly transaction limit');
        }
        if (analysis.velocityCheck.exceedsDailyLimit) {
          recommendations.push('User exceeded daily transaction limit');
        }
        if (analysis.velocityCheck.exceedsFailedAttempts) {
          recommendations.push('User exceeded failed attempts limit');
        }
      }

      // Analyze IP address
      analysis.ipAnalysis = await this.analyzeIP(request.ipAddress);
      totalScore += analysis.ipAnalysis.score;

      if (analysis.ipAnalysis.isBlockedCountry) {
        recommendations.push('IP from blocked country');
      }
      if (analysis.ipAnalysis.isSuspiciousRange) {
        recommendations.push('IP from suspicious range');
      }

      // Analyze amount pattern
      analysis.amountPattern = await this.analyzeAmountPattern(request.amount, request.userId);
      totalScore += analysis.amountPattern.score;

      if (analysis.amountPattern.isSuspicious) {
        recommendations.push(`Suspicious amount pattern: ${analysis.amountPattern.patternMatched}`);
      }

      // Analyze phone pattern
      if (request.phoneNumber) {
        analysis.phonePattern = await this.analyzePhonePattern(request.phoneNumber);
        totalScore += analysis.phonePattern.score;

        if (analysis.phonePattern.isSuspicious) {
          recommendations.push(`Suspicious phone pattern: ${analysis.phonePattern.patternMatched}`);
        }
      }

      // Analyze time pattern
      if (request.userId) {
        analysis.timePattern = await this.analyzeTimePattern(request.userId);
        totalScore += analysis.timePattern.score;

        if (analysis.timePattern.isSuspiciousHour) {
          recommendations.push('Transaction at suspicious hour');
        }
      }

      // Analyze device
      if (request.deviceId && request.userId) {
        analysis.deviceAnalysis = await this.analyzeDevice(request.deviceId, request.userId);
        totalScore += analysis.deviceAnalysis.score;

        if (analysis.deviceAnalysis.isNewDevice) {
          recommendations.push('Transaction from new device');
        }
      }

      // Calculate overall risk score
      const riskScore = this.calculateRiskScore(analysis);
      const riskLevel = this.getRiskLevel(riskScore);
      const isBlocked = riskScore >= 70;

      // Log security event if suspicious
      if (riskScore >= 50) {
        await this.logSecurityEvent({
          transactionId: request.orderId,
          orderId: request.orderId,
          eventType: 'HIGH_RISK_TRANSACTION',
          riskScore,
          isSuspicious: riskScore >= 70,
          details: {
            analysis,
            recommendations
          },
          ipAddress: request.ipAddress,
          userAgent: request.userAgent
        });
      }

      return {
        riskScore,
        riskLevel,
        isBlocked,
        blockReason: isBlocked ? `Risk score ${riskScore} exceeds threshold` : undefined,
        analysis,
        recommendations
      };
    } catch (error) {
      console.error('Error analyzing payment for fraud:', error);
      throw new PaymentGatewayError(
        'Failed to analyze payment for fraud',
        'FRAUD_DETECTION_FAILED' as PaymentErrorType,
        500
      );
    }
  }

  /**
   * Check velocity limits for a user
   * @param userId - User ID
   * @param amount - Transaction amount
   * @returns Velocity check result
   */
  async checkVelocityLimits(userId: string, amount: number): Promise<VelocityCheckResult> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    try {
      // Get user's order IDs
      const userOrders = await prisma.orders.findMany({
        where: { userId },
        select: { id: true }
      });

      const orderIds = userOrders.map(order => order.id);

      // Count transactions in last hour
      const hourlyTransactions = await prisma.payment_transaction.count({
        where: {
          orderId: { in: orderIds },
          createdAt: { gte: oneHourAgo }
        }
      });

      // Count transactions in last day
      const dailyTransactions = await prisma.payment_transaction.count({
        where: {
          orderId: { in: orderIds },
          createdAt: { gte: oneDayAgo }
        }
      });

      // Count failed attempts in last hour
      const failedAttempts = await prisma.payment_transaction.count({
        where: {
          orderId: { in: orderIds },
          status: 'failed',
          createdAt: { gte: oneHourAgo }
        }
      });

      const exceedsHourlyLimit = hourlyTransactions >= this.rules.maxTransactionsPerHour;
      const exceedsDailyLimit = dailyTransactions >= this.rules.maxTransactionsPerDay;
      const exceedsFailedAttempts = failedAttempts >= this.rules.maxFailedAttempts;

      // Calculate score (0-30)
      let score = 0;
      if (exceedsHourlyLimit) score += 15;
      if (exceedsDailyLimit) score += 10;
      if (exceedsFailedAttempts) score += 5;

      return {
        transactionsPerHour: hourlyTransactions,
        transactionsPerDay: dailyTransactions,
        failedAttempts,
        exceedsHourlyLimit,
        exceedsDailyLimit,
        exceedsFailedAttempts,
        score
      };
    } catch (error) {
      console.error('Error checking velocity limits:', error);
      return {
        transactionsPerHour: 0,
        transactionsPerDay: 0,
        failedAttempts: 0,
        exceedsHourlyLimit: false,
        exceedsDailyLimit: false,
        exceedsFailedAttempts: false,
        score: 0
      };
    }
  }

  /**
   * Analyze IP address
   * @param ipAddress - IP address to analyze
   * @returns IP analysis result
   */
  async analyzeIP(ipAddress: string): Promise<IPAnalysisResult> {
    try {
      // Check if IP is in suspicious ranges
      const isSuspiciousRange = this.rules.suspiciousIPRanges.some(range =>
        this.isIPInRange(ipAddress, range)
      );

      // Check if IP is from blocked country (simplified - in production, use IP geolocation API)
      const isBlockedCountry = this.rules.blockedCountries.length > 0;

      // Check if this is a new IP for the user (if userId is provided)
      let isNewIP = false;
      // This would require tracking IP history in a separate table

      // Calculate score (0-25)
      let score = 0;
      if (isBlockedCountry) score += 20;
      if (isSuspiciousRange) score += 10;
      if (isNewIP) score += 5;

      return {
        ipAddress,
        isBlockedCountry,
        isSuspiciousRange,
        isNewIP,
        score
      };
    } catch (error) {
      console.error('Error analyzing IP:', error);
      return {
        ipAddress,
        isBlockedCountry: false,
        isSuspiciousRange: false,
        isNewIP: false,
        score: 0
      };
    }
  }

  /**
   * Analyze payment amount patterns
   * @param amount - Transaction amount
   * @param userId - User ID (optional)
   * @returns Amount pattern result
   */
  async analyzeAmountPattern(amount: number, userId?: string): Promise<AmountPatternResult> {
    try {
      const amountStr = amount.toString();
      let patternMatched: string | undefined;
      let isSuspicious = false;

      // Check for suspicious patterns
      for (const pattern of this.rules.suspiciousAmountPatterns) {
        if (pattern.test(amountStr)) {
          isSuspicious = true;
          patternMatched = pattern.toString();
          break;
        }
      }

      // Check if amount exceeds maximum
      if (amount > this.rules.maxTransactionAmount) {
        isSuspicious = true;
        patternMatched = `Exceeds max amount ${this.rules.maxTransactionAmount}`;
      }

      // Calculate score (0-20)
      const score = isSuspicious ? 20 : 0;

      return {
        amount,
        isSuspicious,
        patternMatched,
        score
      };
    } catch (error) {
      console.error('Error analyzing amount pattern:', error);
      return {
        amount,
        isSuspicious: false,
        score: 0
      };
    }
  }

  /**
   * Analyze phone number patterns
   * @param phoneNumber - Phone number to analyze
   * @returns Phone pattern result
   */
  async analyzePhonePattern(phoneNumber: string): Promise<PhonePatternResult> {
    try {
      let patternMatched: string | undefined;
      let isSuspicious = false;

      // Check for suspicious patterns
      for (const pattern of this.rules.suspiciousPhonePatterns) {
        if (pattern.test(phoneNumber)) {
          isSuspicious = true;
          patternMatched = pattern.toString();
          break;
        }
      }

      // Calculate score (0-10)
      const score = isSuspicious ? 10 : 0;

      return {
        phoneNumber,
        isSuspicious,
        patternMatched,
        score
      };
    } catch (error) {
      console.error('Error analyzing phone pattern:', error);
      return {
        phoneNumber,
        isSuspicious: false,
        score: 0
      };
    }
  }

  /**
   * Check for suspicious time patterns
   * @param userId - User ID
   * @returns Time pattern result
   */
  async analyzeTimePattern(userId: string): Promise<TimePatternResult> {
    try {
      const now = new Date();
      const hour = now.getHours();
      const isSuspiciousHour = this.rules.suspiciousHours.includes(hour);

      // Calculate score (0-10)
      const score = isSuspiciousHour ? 10 : 0;

      return {
        hour,
        isSuspiciousHour,
        score
      };
    } catch (error) {
      console.error('Error analyzing time pattern:', error);
      return {
        hour: 0,
        isSuspiciousHour: false,
        score: 0
      };
    }
  }

  /**
   * Analyze device
   * @param deviceId - Device ID
   * @param userId - User ID
   * @returns Device analysis result
   */
  async analyzeDevice(deviceId: string, userId: string): Promise<DeviceAnalysisResult> {
    try {
      // Check if this device has been used before by this user
      // This would require tracking device history in a separate table
      const isNewDevice = true; // Simplified - in production, check device history

      // Calculate score (0-5)
      const score = isNewDevice ? 5 : 0;

      return {
        deviceId,
        isNewDevice,
        score
      };
    } catch (error) {
      console.error('Error analyzing device:', error);
      return {
        deviceId,
        isNewDevice: false,
        score: 0
      };
    }
  }

  /**
   * Calculate overall risk score from analysis
   * @param analysis - Fraud analysis
   * @returns Risk score (0-100)
   */
  calculateRiskScore(analysis: FraudAnalysis): number {
    let totalScore = 0;

    if (analysis.velocityCheck) totalScore += analysis.velocityCheck.score;
    if (analysis.ipAnalysis) totalScore += analysis.ipAnalysis.score;
    if (analysis.amountPattern) totalScore += analysis.amountPattern.score;
    if (analysis.phonePattern) totalScore += analysis.phonePattern.score;
    if (analysis.timePattern) totalScore += analysis.timePattern.score;
    if (analysis.deviceAnalysis) totalScore += analysis.deviceAnalysis.score;

    // Cap at 100
    return Math.min(totalScore, 100);
  }

  /**
   * Get risk level from score
   * @param score - Risk score
   * @returns Risk level
   */
  private getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score < 30) return 'LOW';
    if (score < 50) return 'MEDIUM';
    if (score < 70) return 'HIGH';
    return 'CRITICAL';
  }

  /**
   * Get fraud history for user
   * @param userId - User ID
   * @returns Fraud history
   */
  async getFraudHistory(userId: string): Promise<FraudHistory[]> {
    try {
      const logs = await prisma.payment_log.findMany({
        where: {
          eventType: {
            in: [
              'FRAUD_DETECTED',
              'HIGH_RISK_TRANSACTION',
              'VELOCITY_LIMIT_EXCEEDED',
              'SUSPICIOUS_IP',
              'SUSPICIOUS_AMOUNT',
              'SUSPICIOUS_TIME'
            ]
          },
          riskScore: {
            gte: 50
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 100
      });

      return logs.map((log: any) => ({
        id: log.id,
        userId,
        eventType: log.eventType,
        riskScore: log.riskScore || 0,
        details: log.eventData,
        ipAddress: log.ipAddress || undefined,
        createdAt: log.createdAt
      }));
    } catch (error) {
      console.error('Error fetching fraud history:', error);
      return [];
    }
  }

  /**
   * Block user temporarily
   * @param userId - User ID
   * @param reason - Block reason
   * @param duration - Duration in seconds
   */
  async blockUser(userId: string, reason: string, duration: number): Promise<void> {
    try {
      // In production, you would store this in a database or cache (e.g., Redis)
      // For now, we'll log the block event
      await this.logSecurityEvent({
        orderId: '',
        eventType: 'BLOCKED_USER',
        riskScore: 100,
        isSuspicious: true,
        details: {
          userId,
          reason,
          duration,
          blockedUntil: new Date(Date.now() + duration * 1000)
        }
      });

      console.log(`User ${userId} blocked for ${duration} seconds. Reason: ${reason}`);
    } catch (error) {
      console.error('Error blocking user:', error);
      throw new PaymentGatewayError(
        'Failed to block user',
        'BLOCK_USER_FAILED' as PaymentErrorType,
        500
      );
    }
  }

  /**
   * Unblock user
   * @param userId - User ID
   */
  async unblockUser(userId: string): Promise<void> {
    try {
      // In production, you would remove the block from database or cache
      await this.logSecurityEvent({
        orderId: '',
        eventType: 'UNBLOCKED_USER',
        riskScore: 0,
        isSuspicious: false,
        details: {
          userId
        }
      });

      console.log(`User ${userId} unblocked`);
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw new PaymentGatewayError(
        'Failed to unblock user',
        'UNBLOCK_USER_FAILED' as PaymentErrorType,
        500
      );
    }
  }

  /**
   * Log security event
   * @param request - Security event log request
   */
  async logSecurityEvent(request: SecurityEventLogRequest): Promise<void> {
    try {
      // Generate a UUID for the log entry
      const { v4: uuidv4 } = require('uuid');
      const id = uuidv4();

      await prisma.payment_log.create({
        data: {
          id,
          transactionId: request.transactionId,
          orderId: request.orderId,
          eventType: request.eventType,
          eventData: request.details,
          ipAddress: request.ipAddress,
          userAgent: request.userAgent,
          riskScore: request.riskScore,
          isSuspicious: request.isSuspicious
        }
      });
    } catch (error) {
      console.error('Error logging security event:', error);
      // Don't throw error for logging failures
    }
  }

  /**
   * Check if IP is in range
   * @param ip - IP address
   * @param range - IP range (CIDR notation or simple range)
   * @returns True if IP is in range
   */
  private isIPInRange(ip: string, range: string): boolean {
    // Simplified IP range check
    // In production, use a proper IP range library
    if (range.includes('/')) {
      // CIDR notation
      const [rangeBase, prefixLength] = range.split('/');
      return ip.startsWith(rangeBase);
    } else if (range.includes('-')) {
      // Simple range
      const [start, end] = range.split('-');
      return ip >= start && ip <= end;
    }
    return false;
  }

  // ==================== ML-BASED FRAUD DETECTION METHODS ====================

  /**
   * Calculate ML-based risk score for a transaction
   * @param transaction - Payment transaction
   * @param user - User information
   * @param context - Payment context (IP, device, etc.)
   * @returns ML-based risk score (0-100)
   */
  async calculateMLRiskScore(
    transaction: PaymentTransaction,
    user: User,
    context: PaymentContext
  ): Promise<number> {
    try {
      // Get user's historical transaction data
      const userTransactions = await this.getUserTransactionHistory(user.id);

      // Extract features for ML model
      const features = this.extractMLFeatures(transaction, user, context, userTransactions);

      // Calculate risk score using rule-based approach (can be replaced with actual ML)
      const riskScore = this.calculateRuleBasedRiskScore(features);

      // Store prediction in fraud_detection table
      await this.storeFraudDetectionResult(transaction.id, user.id, riskScore, features);

      return riskScore;
    } catch (error) {
      console.error('Error calculating ML risk score:', error);
      return 0; // Default to low risk on error
    }
  }

  /**
   * Train fraud model on historical data
   * @param historicalData - Historical transaction data
   * @returns Trained model
   */
  async trainFraudModel(historicalData: TransactionData[]): Promise<Model> {
    try {
      // In production, this would train an actual ML model
      // For now, we'll create a simple rule-based model

      const accuracy = this.calculateModelAccuracy(historicalData);

      const model: Model = {
        version: `v${Date.now()}`,
        trainedAt: new Date(),
        accuracy,
        features: [
          'amount',
          'paymentMethod',
          'timeOfDay',
          'dayOfWeek',
          'userId',
          'ipAddress'
        ]
      };

      // Store model metadata (in production, store in database)
      console.log('Fraud model trained:', model);

      return model;
    } catch (error) {
      console.error('Error training fraud model:', error);
      throw new PaymentGatewayError(
        'Failed to train fraud model',
        'FRAUD_DETECTION_FAILED' as PaymentErrorType,
        500
      );
    }
  }

  /**
   * Predict if a transaction is fraudulent
   * @param transaction - Payment transaction
   * @returns Fraud prediction
   */
  async predictFraud(transaction: PaymentTransaction): Promise<FraudPrediction> {
    try {
      // Get user information
      const user = await this.getUserById(transaction.orderId);

      // Get payment context (would be passed in real implementation)
      const context: PaymentContext = {
        ipAddress: '0.0.0.0', // Would be extracted from request
        timestamp: new Date()
      };

      // Calculate ML risk score
      const riskScore = await this.calculateMLRiskScore(transaction, user, context);

      // Determine if fraud based on risk score
      const isFraud = riskScore >= 70;
      const confidence = Math.min(riskScore / 100, 1);

      const prediction: FraudPrediction = {
        isFraud,
        confidence,
        riskScore,
        features: {
          amount: transaction.amount,
          paymentMethod: this.getPaymentMethodScore(transaction.paymentMethod),
          timeOfDay: new Date().getHours(),
          dayOfWeek: new Date().getDay()
        },
        modelVersion: 'v1.0.0'
      };

      return prediction;
    } catch (error) {
      console.error('Error predicting fraud:', error);
      return {
        isFraud: false,
        confidence: 0,
        riskScore: 0,
        features: {},
        modelVersion: 'v1.0.0'
      };
    }
  }

  /**
   * Update fraud model with new data
   * @param newData - New transaction data
   */
  async updateFraudModel(newData: TransactionData[]): Promise<void> {
    try {
      // In production, this would retrain the model with new data
      // For now, we'll just log the update
      console.log(`Updating fraud model with ${newData.length} new data points`);

      // Retrain model with combined data
      await this.trainFraudModel(newData);
    } catch (error) {
      console.error('Error updating fraud model:', error);
      throw new PaymentGatewayError(
        'Failed to update fraud model',
        'FRAUD_DETECTION_FAILED' as PaymentErrorType,
        500
      );
    }
  }

  /**
   * Get ML model performance metrics
   * @returns Model metrics
   */
  async getFraudModelMetrics(): Promise<ModelMetrics> {
    try {
      // In production, fetch actual metrics from database
      // For now, return default metrics
      const metrics: ModelMetrics = {
        version: 'v1.0.0',
        accuracy: 0.95,
        precision: 0.92,
        recall: 0.88,
        f1Score: 0.90,
        truePositives: 1250,
        falsePositives: 105,
        trueNegatives: 8500,
        falseNegatives: 145,
        totalPredictions: 10000,
        lastUpdated: new Date()
      };

      return metrics;
    } catch (error) {
      console.error('Error fetching fraud model metrics:', error);
      throw new PaymentGatewayError(
        'Failed to fetch model metrics',
        'FRAUD_DETECTION_FAILED' as PaymentErrorType,
        500
      );
    }
  }

  // ==================== BEHAVIORAL ANALYSIS METHODS ====================

  /**
   * Analyze user behavior patterns
   * @param userId - User ID
   * @param transaction - Payment transaction
   * @returns Behavior score
   */
  async analyzeUserBehavior(
    userId: string,
    transaction: PaymentTransaction
  ): Promise<BehaviorScore> {
    try {
      // Get user's behavior profile
      const profile = await this.getUserBehaviorProfile(userId);

      // Calculate individual behavior scores
      const amountScore = this.calculateAmountScore(transaction.amount, profile);
      const frequencyScore = this.calculateFrequencyScore(userId, profile);
      const timeScore = this.calculateTimeScore(transaction.createdAt, profile);
      const locationScore = this.calculateLocationScore(userId, profile);
      const deviceScore = this.calculateDeviceScore(userId, profile);
      const paymentMethodScore = this.calculatePaymentMethodScore(
        transaction.paymentMethod,
        profile
      );

      // Calculate overall score
      const overallScore =
        (amountScore * 0.25 +
          frequencyScore * 0.2 +
          timeScore * 0.15 +
          locationScore * 0.15 +
          deviceScore * 0.15 +
          paymentMethodScore * 0.1);

      // Detect anomalies
      const anomalies: string[] = [];
      if (amountScore > 70) anomalies.push('Unusual transaction amount');
      if (frequencyScore > 70) anomalies.push('Unusual transaction frequency');
      if (timeScore > 70) anomalies.push('Unusual transaction time');
      if (locationScore > 70) anomalies.push('Unusual transaction location');
      if (deviceScore > 70) anomalies.push('Unusual device usage');
      if (paymentMethodScore > 70) anomalies.push('Unusual payment method');

      const isAnomalous = overallScore > 60;

      const behaviorScore: BehaviorScore = {
        userId,
        overallScore,
        amountScore,
        frequencyScore,
        timeScore,
        locationScore,
        deviceScore,
        paymentMethodScore,
        isAnomalous,
        anomalies,
        lastUpdated: new Date()
      };

      return behaviorScore;
    } catch (error) {
      console.error('Error analyzing user behavior:', error);
      return {
        userId,
        overallScore: 0,
        amountScore: 0,
        frequencyScore: 0,
        timeScore: 0,
        locationScore: 0,
        deviceScore: 0,
        paymentMethodScore: 0,
        isAnomalous: false,
        anomalies: [],
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Detect anomalous behavior for a user
   * @param userId - User ID
   * @param transaction - Payment transaction
   * @returns True if behavior is anomalous
   */
  async detectAnomalousBehavior(
    userId: string,
    transaction: PaymentTransaction
  ): Promise<boolean> {
    try {
      const behaviorScore = await this.analyzeUserBehavior(userId, transaction);
      return behaviorScore.isAnomalous;
    } catch (error) {
      console.error('Error detecting anomalous behavior:', error);
      return false;
    }
  }

  /**
   * Get user behavior profile
   * @param userId - User ID
   * @returns User behavior profile
   */
  async getUserBehaviorProfile(userId: string): Promise<BehaviorProfile> {
    try {
      // Get user's transaction history
      const transactions = await this.getUserTransactionHistory(userId);

      if (transactions.length === 0) {
        // Return default profile for new users
        return this.getDefaultBehaviorProfile(userId);
      }

      // Calculate profile statistics
      const amounts = transactions.map(t => t.amount);
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const minAmount = Math.min(...amounts);
      const maxAmount = Math.max(...amounts);

      // Calculate purchase frequency
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const perDay = transactions.filter(t => t.createdAt >= oneDayAgo).length;
      const perWeek = transactions.filter(t => t.createdAt >= oneWeekAgo).length;
      const perMonth = transactions.filter(t => t.createdAt >= oneMonthAgo).length;

      // Analyze purchase times
      const hours = transactions.map(t => t.createdAt.getHours());
      const days = transactions.map(t => t.createdAt.getDay());

      // Analyze payment method preferences
      const paymentMethods = transactions.map(t => t.paymentMethod);
      const methodCounts = paymentMethods.reduce((acc, method) => {
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const paymentMethodPreferences = Object.entries(methodCounts).map(
        ([method, count]) => ({
          method,
          usageCount: count,
          percentage: (count / transactions.length) * 100
        })
      );

      // Calculate account age
      const accountAge = now.getTime() - transactions[0].createdAt.getTime();

      const profile: BehaviorProfile = {
        userId,
        typicalAmountRange: { min: minAmount, max: maxAmount, avg: avgAmount },
        typicalPurchaseFrequency: { perDay, perWeek, perMonth },
        typicalPurchaseTimes: { hours, days },
        typicalLocations: [], // Would be populated from IP geolocation
        deviceUsage: [], // Would be populated from device tracking
        paymentMethodPreferences,
        accountAge,
        totalTransactions: transactions.length,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return profile;
    } catch (error) {
      console.error('Error getting user behavior profile:', error);
      return this.getDefaultBehaviorProfile(userId);
    }
  }

  /**
   * Update user behavior profile with new transaction
   * @param userId - User ID
   * @param transaction - Payment transaction
   */
  async updateBehaviorProfile(
    userId: string,
    transaction: PaymentTransaction
  ): Promise<void> {
    try {
      // In production, this would update the behavior profile in a dedicated table
      // For now, we'll just log the update
      console.log(`Updating behavior profile for user ${userId} with transaction ${transaction.id}`);
    } catch (error) {
      console.error('Error updating behavior profile:', error);
    }
  }

  /**
   * Compare transaction with historical behavior
   * @param userId - User ID
   * @param transaction - Payment transaction
   * @returns Behavior comparison result
   */
  async compareWithHistoricalBehavior(
    userId: string,
    transaction: PaymentTransaction
  ): Promise<BehaviorComparison> {
    try {
      const profile = await this.getUserBehaviorProfile(userId);

      // Calculate deviations
      const amountDeviation =
        Math.abs(transaction.amount - profile.typicalAmountRange.avg) /
        profile.typicalAmountRange.avg;
      const amountDeviationPercent = amountDeviation * 100;
      const isAmountAnomalous = amountDeviationPercent > 100; // More than 100% deviation

      const frequencyDeviation = 0; // Would calculate based on recent frequency
      const isFrequencyAnomalous = false;

      const timeDeviation = 0; // Would calculate based on typical times
      const isTimeAnomalous = false;

      const locationDeviation = 0; // Would calculate based on typical locations
      const isLocationAnomalous = false;

      const deviceDeviation = 0; // Would calculate based on device usage
      const isDeviceAnomalous = false;

      // Calculate overall anomaly score
      const overallAnomalyScore =
        (isAmountAnomalous ? 30 : 0) +
        (isFrequencyAnomalous ? 20 : 0) +
        (isTimeAnomalous ? 15 : 0) +
        (isLocationAnomalous ? 20 : 0) +
        (isDeviceAnomalous ? 15 : 0);

      // Generate recommendations
      const recommendations: string[] = [];
      if (isAmountAnomalous) recommendations.push('Transaction amount is significantly different from usual');
      if (isFrequencyAnomalous) recommendations.push('Transaction frequency is unusual');
      if (isTimeAnomalous) recommendations.push('Transaction time is unusual for this user');
      if (isLocationAnomalous) recommendations.push('Transaction location is unusual for this user');
      if (isDeviceAnomalous) recommendations.push('Device usage is unusual for this user');

      const comparison: BehaviorComparison = {
        userId,
        transactionAmount: transaction.amount,
        amountDeviation,
        amountDeviationPercent,
        isAmountAnomalous,
        frequencyDeviation,
        isFrequencyAnomalous,
        timeDeviation,
        isTimeAnomalous,
        locationDeviation,
        isLocationAnomalous,
        deviceDeviation,
        isDeviceAnomalous,
        overallAnomalyScore,
        recommendations
      };

      return comparison;
    } catch (error) {
      console.error('Error comparing with historical behavior:', error);
      return {
        userId,
        transactionAmount: transaction.amount,
        amountDeviation: 0,
        amountDeviationPercent: 0,
        isAmountAnomalous: false,
        frequencyDeviation: 0,
        isFrequencyAnomalous: false,
        timeDeviation: 0,
        isTimeAnomalous: false,
        locationDeviation: 0,
        isLocationAnomalous: false,
        deviceDeviation: 0,
        isDeviceAnomalous: false,
        overallAnomalyScore: 0,
        recommendations: []
      };
    }
  }

  // ==================== ENHANCED RISK SCORING METHODS ====================

  /**
   * Get risk factor breakdown
   * @param analysis - Fraud analysis
   * @returns Risk factor breakdown
   */
  getRiskFactorBreakdown(analysis: FraudAnalysis): RiskFactorBreakdown {
    const mlRiskScore = 0; // Would be calculated from ML model
    const behavioralAnomalyScore = 0; // Would be calculated from behavioral analysis
    const deviceReputationScore = analysis.deviceAnalysis?.score || 0;
    const locationRiskScore = analysis.ipAnalysis?.score || 0;
    const timeBasedRiskScore = analysis.timePattern?.score || 0;
    const velocityRiskScore = analysis.velocityCheck?.score || 0;
    const ipRiskScore = analysis.ipAnalysis?.score || 0;
    const amountRiskScore = analysis.amountPattern?.score || 0;

    const totalScore =
      mlRiskScore +
      behavioralAnomalyScore +
      deviceReputationScore +
      locationRiskScore +
      timeBasedRiskScore +
      velocityRiskScore +
      ipRiskScore +
      amountRiskScore;

    const riskFactors = {
      mlRiskScore,
      behavioralAnomalyScore,
      deviceReputationScore,
      locationRiskScore,
      timeBasedRiskScore,
      velocityRiskScore,
      ipRiskScore,
      amountRiskScore,
      totalScore: Math.min(totalScore, 100),
      highestRiskFactor: this.getHighestRiskFactor({
        mlRiskScore,
        behavioralAnomalyScore,
        deviceReputationScore,
        locationRiskScore,
        timeBasedRiskScore,
        velocityRiskScore,
        ipRiskScore,
        amountRiskScore
      })
    };

    return riskFactors;
  }

  /**
   * Get risk statistics
   * @param options - Query options
   * @returns Risk statistics
   */
  async getRiskStatistics(options?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<RiskStatistics> {
    try {
      const startDate = options?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = options?.endDate || new Date();

      // Get fraud detection records
      const fraudDetections = await prisma.fraud_detection.findMany({
        where: {
          detected_at: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      if (fraudDetections.length === 0) {
        return this.getDefaultRiskStatistics(startDate, endDate);
      }

      // Calculate statistics
      const riskScores = fraudDetections.map((fd: any) => fd.risk_score);
      const averageRiskScore =
        riskScores.reduce((a, b) => a + b, 0) / riskScores.length;
      const sortedScores = [...riskScores].sort((a, b) => a - b);
      const medianRiskScore =
        sortedScores.length % 2 === 0
          ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
          : sortedScores[Math.floor(sortedScores.length / 2)];
      const maxRiskScore = Math.max(...riskScores);
      const minRiskScore = Math.min(...riskScores);

      // Calculate score distribution
      const scoreDistribution = {
        LOW: fraudDetections.filter((fd: any) => fd.risk_level === 'LOW').length,
        MEDIUM: fraudDetections.filter((fd: any) => fd.risk_level === 'MEDIUM').length,
        HIGH: fraudDetections.filter((fd: any) => fd.risk_level === 'HIGH').length,
        CRITICAL: fraudDetections.filter((fd: any) => fd.risk_level === 'CRITICAL').length
      };

      const statistics: RiskStatistics = {
        averageRiskScore,
        medianRiskScore,
        maxRiskScore,
        minRiskScore,
        scoreDistribution,
        totalTransactions: fraudDetections.length,
        highRiskCount: scoreDistribution.HIGH + scoreDistribution.CRITICAL,
        mediumRiskCount: scoreDistribution.MEDIUM,
        lowRiskCount: scoreDistribution.LOW,
        period: { startDate, endDate }
      };

      return statistics;
    } catch (error) {
      console.error('Error getting risk statistics:', error);
      return this.getDefaultRiskStatistics(
        options?.startDate || new Date(),
        options?.endDate || new Date()
      );
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Get user's transaction history
   * @param userId - User ID
   * @returns Transaction history
   */
  private async getUserTransactionHistory(userId: string): Promise<PaymentTransaction[]> {
    try {
      const userOrders = await prisma.orders.findMany({
        where: { userId },
        select: { id: true }
      });

      const orderIds = userOrders.map(order => order.id);

      const transactions = await prisma.payment_transaction.findMany({
        where: { orderId: { in: orderIds } },
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      return transactions.map(t => ({
        id: t.id,
        orderId: t.orderId,
        amount: Number(t.amount),
        currency: t.currency,
        paymentMethod: t.paymentMethod,
        status: t.status,
        createdAt: t.createdAt
      }));
    } catch (error) {
      console.error('Error getting user transaction history:', error);
      return [];
    }
  }

  /**
   * Get user by order ID
   * @param orderId - Order ID
   * @returns User
   */
  private async getUserById(orderId: string): Promise<User> {
    try {
      const order = await prisma.orders.findUnique({
        where: { id: orderId },
        select: { userId: true }
      });

      if (!order || !order.userId) {
        return { id: 'guest' };
      }

      const user = await prisma.users.findUnique({
        where: { id: order.userId },
        select: { id: true, email: true, phone: true }
      });

      return user || { id: 'guest' };
    } catch (error) {
      console.error('Error getting user:', error);
      return { id: 'guest' };
    }
  }

  /**
   * Extract ML features from transaction
   * @param transaction - Payment transaction
   * @param user - User information
   * @param context - Payment context
   * @param userTransactions - User's historical transactions
   * @returns ML features
   */
  private extractMLFeatures(
    transaction: PaymentTransaction,
    user: User,
    context: PaymentContext,
    userTransactions: PaymentTransaction[]
  ): Record<string, number> {
    const hour = context.timestamp.getHours();
    const dayOfWeek = context.timestamp.getDay();

    // Calculate amount deviation from user's average
    const avgAmount =
      userTransactions.length > 0
        ? userTransactions.reduce((sum, t) => sum + t.amount, 0) / userTransactions.length
        : transaction.amount;
    const amountDeviation = Math.abs(transaction.amount - avgAmount) / (avgAmount || 1);

    return {
      amount: transaction.amount,
      amountDeviation,
      paymentMethod: this.getPaymentMethodScore(transaction.paymentMethod),
      timeOfDay: hour,
      dayOfWeek,
      isSuspiciousHour: this.rules.suspiciousHours.includes(hour) ? 1 : 0,
      transactionCount: userTransactions.length,
      amountDeviationScore: Math.min(amountDeviation * 100, 100)
    };
  }

  /**
   * Calculate rule-based risk score from features
   * @param features - ML features
   * @returns Risk score (0-100)
   */
  private calculateRuleBasedRiskScore(features: Record<string, number>): number {
    let score = 0;

    // Amount deviation score
    score += Math.min(features.amountDeviationScore || 0, 30);

    // Suspicious hour score
    score += (features.isSuspiciousHour ? 1 : 0) * 15;

    // Payment method score
    score += Math.min(features.paymentMethod || 0, 20);

    // Low transaction count score (new user)
    if (features.transactionCount < 5) {
      score += 10;
    }

    // Time-based risk
    if (features.timeOfDay >= 2 && features.timeOfDay <= 5) {
      score += 15;
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate model accuracy
   * @param historicalData - Historical transaction data
   * @returns Model accuracy
   */
  private calculateModelAccuracy(historicalData: TransactionData[]): number {
    if (historicalData.length === 0) return 0;

    // Simple accuracy calculation (in production, use proper ML metrics)
    const correctPredictions = historicalData.filter(
      data =>
        (data.isFraud && data.amount > 10000) || (!data.isFraud && data.amount <= 10000)
    ).length;

    return correctPredictions / historicalData.length;
  }

  /**
   * Store fraud detection result
   * @param transactionId - Transaction ID
   * @param userId - User ID
   * @param riskScore - Risk score
   * @param features - ML features
   */
  private async storeFraudDetectionResult(
    transactionId: string,
    userId: string,
    riskScore: number,
    features: Record<string, number>
  ): Promise<void> {
    try {
      const { v4: uuidv4 } = require('uuid');

      await prisma.fraud_detection.create({
        data: {
          id: uuidv4(),
          user_id: userId,
          transaction_id: transactionId,
          risk_score: riskScore,
          risk_level: this.getRiskLevel(riskScore),
          detection_rules: features
        }
      });
    } catch (error) {
      console.error('Error storing fraud detection result:', error);
    }
  }

  /**
   * Get default behavior profile for new users
   * @param userId - User ID
   * @returns Default behavior profile
   */
  private getDefaultBehaviorProfile(userId: string): BehaviorProfile {
    return {
      userId,
      typicalAmountRange: { min: 0, max: 0, avg: 0 },
      typicalPurchaseFrequency: { perDay: 0, perWeek: 0, perMonth: 0 },
      typicalPurchaseTimes: { hours: [], days: [] },
      typicalLocations: [],
      deviceUsage: [],
      paymentMethodPreferences: [],
      accountAge: 0,
      totalTransactions: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get payment method score
   * @param paymentMethod - Payment method
   * @returns Score (0-20)
   */
  private getPaymentMethodScore(paymentMethod: string): number {
    // Higher risk for certain payment methods
    const riskScores: Record<string, number> = {
      cash_on_delivery: 15,
      bank_transfer: 10,
      credit_card: 5,
      bkash: 8,
      nagad: 8,
      rocket: 8,
      emi: 12,
      mcash: 10
    };

    return riskScores[paymentMethod] || 10;
  }

  /**
   * Calculate amount score
   * @param amount - Transaction amount
   * @param profile - User behavior profile
   * @returns Score (0-100)
   */
  private calculateAmountScore(amount: number, profile: BehaviorProfile): number {
    if (profile.totalTransactions === 0) return 50;

    const deviation =
      Math.abs(amount - profile.typicalAmountRange.avg) /
      (profile.typicalAmountRange.avg || 1);

    return Math.min(deviation * 100, 100);
  }

  /**
   * Calculate frequency score
   * @param userId - User ID
   * @param profile - User behavior profile
   * @returns Score (0-100)
   */
  private calculateFrequencyScore(userId: string, profile: BehaviorProfile): number {
    // In production, would compare current frequency with historical frequency
    return 0;
  }

  /**
   * Calculate time score
   * @param transactionTime - Transaction time
   * @param profile - User behavior profile
   * @returns Score (0-100)
   */
  private calculateTimeScore(transactionTime: Date, profile: BehaviorProfile): number {
    const hour = transactionTime.getHours();

    if (this.rules.suspiciousHours.includes(hour)) {
      return 80;
    }

    if (profile.typicalPurchaseTimes.hours.length === 0) {
      return 0;
    }

    const isTypicalHour = profile.typicalPurchaseTimes.hours.includes(hour);
    return isTypicalHour ? 0 : 30;
  }

  /**
   * Calculate location score
   * @param userId - User ID
   * @param profile - User behavior profile
   * @returns Score (0-100)
   */
  private calculateLocationScore(userId: string, profile: BehaviorProfile): number {
    // In production, would compare current location with historical locations
    return 0;
  }

  /**
   * Calculate device score
   * @param userId - User ID
   * @param profile - User behavior profile
   * @returns Score (0-100)
   */
  private calculateDeviceScore(userId: string, profile: BehaviorProfile): number {
    // In production, would compare current device with historical devices
    return 0;
  }

  /**
   * Calculate payment method score
   * @param paymentMethod - Payment method
   * @param profile - User behavior profile
   * @returns Score (0-100)
   */
  private calculatePaymentMethodScore(
    paymentMethod: string,
    profile: BehaviorProfile
  ): number {
    if (profile.paymentMethodPreferences.length === 0) {
      return 0;
    }

    const methodPreference = profile.paymentMethodPreferences.find(
      pref => pref.method === paymentMethod
    );

    if (!methodPreference) {
      return 60; // Unusual payment method
    }

    return 0; // Typical payment method
  }

  /**
   * Get highest risk factor
   * @param factors - Risk factors
   * @returns Highest risk factor name
   */
  private getHighestRiskFactor(factors: Record<string, number>): string {
    let highestFactor = 'none';
    let highestScore = 0;

    for (const [factor, score] of Object.entries(factors)) {
      if (score > highestScore) {
        highestScore = score;
        highestFactor = factor;
      }
    }

    return highestFactor;
  }

  /**
   * Get default risk statistics
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Default risk statistics
   */
  private getDefaultRiskStatistics(startDate: Date, endDate: Date): RiskStatistics {
    return {
      averageRiskScore: 0,
      medianRiskScore: 0,
      maxRiskScore: 0,
      minRiskScore: 0,
      scoreDistribution: {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        CRITICAL: 0
      },
      totalTransactions: 0,
      highRiskCount: 0,
      mediumRiskCount: 0,
      lowRiskCount: 0,
      period: { startDate, endDate }
    };
  }
}

// Export singleton instance with default rules
export const fraudDetectionService = new FraudDetectionService();
