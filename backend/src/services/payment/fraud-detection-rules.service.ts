/**
 * Fraud Detection Rules Service
 *
 * This service provides comprehensive fraud detection rule management capabilities.
 * It allows creating, updating, deleting, and evaluating fraud detection rules.
 */

import { PaymentGatewayError, PaymentErrorType } from './payment-gateway.interface';
import { databaseService } from '../database.service';

const prisma = databaseService.getClient();

/**
 * Fraud Rule Input
 */
export interface FraudRuleInput {
  name: string;
  description: string;
  ruleType: string;
  priority: number;
  weight: number;
  isActive: boolean;
  conditions: any;
  actions: any;
}

/**
 * Fraud Rule Update Input
 */
export interface FraudRuleUpdateInput {
  name?: string;
  description?: string;
  ruleType?: string;
  priority?: number;
  weight?: number;
  isActive?: boolean;
  conditions?: any;
  actions?: any;
}

/**
 * Fraud Rule Filters
 */
export interface FraudRuleFilters {
  ruleType?: string;
  isActive?: boolean;
  priority?: number;
  limit?: number;
  offset?: number;
}

/**
 * Fraud Detection Record
 */
export interface FraudDetection {
  id: string;
  userId?: string;
  transactionId: string;
  riskScore: number;
  riskLevel: string;
  detectionRules: any;
  detectedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
}

/**
 * Fraud Evaluation Result
 */
export interface FraudEvaluationResult {
  isFraud: boolean;
  riskScore: number;
  riskLevel: string;
  triggeredRules: {
    ruleId: string;
    ruleName: string;
    ruleType: string;
    score: number;
    conditions: any;
  }[];
  recommendations: string[];
  shouldBlock: boolean;
}

/**
 * Fraud Rule Statistics
 */
export interface FraudRuleStats {
  totalRules: number;
  activeRules: number;
  inactiveRules: number;
  rulesByType: Record<string, number>;
  averagePriority: number;
  averageWeight: number;
  mostTriggeredRules: {
    ruleId: string;
    ruleName: string;
    triggerCount: number;
  }[];
  leastEffectiveRules: {
    ruleId: string;
    ruleName: string;
    accuracy: number;
  }[];
}

/**
 * Fraud Detection Rules Service Class
 */
export class FraudDetectionRulesService {
  /**
   * Create a new fraud rule
   * @param rule - Fraud rule input
   * @returns Created fraud detection record
   */
  async createFraudRule(rule: FraudRuleInput): Promise<FraudDetection> {
    try {
      const { v4: uuidv4 } = require('uuid');

      const fraudDetection = await prisma.fraud_detection.create({
        data: {
          id: uuidv4(),
          user_id: null, // Rules don't have a specific user
          transaction_id: uuidv4(), // Generate a transaction ID for the rule
          risk_score: 0, // Rules don't have a risk score
          risk_level: 'LOW',
          detection_rules: {
            ...rule,
            isRule: true,
            createdAt: new Date().toISOString()
          }
        }
      });

      return {
        id: fraudDetection.id,
        userId: fraudDetection.user_id || undefined,
        transactionId: fraudDetection.transaction_id,
        riskScore: fraudDetection.risk_score,
        riskLevel: fraudDetection.risk_level,
        detectionRules: fraudDetection.detection_rules,
        detectedAt: fraudDetection.detected_at,
        resolvedAt: fraudDetection.resolved_at || undefined,
        resolvedBy: fraudDetection.resolved_by || undefined
      };
    } catch (error) {
      console.error('Error creating fraud rule:', error);
      throw new PaymentGatewayError(
        'Failed to create fraud rule',
        'FRAUD_DETECTION_FAILED' as PaymentErrorType,
        500
      );
    }
  }

  /**
   * Update a fraud rule
   * @param id - Fraud rule ID
   * @param rule - Fraud rule update input
   * @returns Updated fraud detection record
   */
  async updateFraudRule(
    id: string,
    rule: FraudRuleUpdateInput
  ): Promise<FraudDetection> {
    try {
      const existingRule = await prisma.fraud_detection.findUnique({
        where: { id }
      });

      if (!existingRule) {
        throw new PaymentGatewayError(
          'Fraud rule not found',
          'FRAUD_RULE_NOT_FOUND' as PaymentErrorType,
          404
        );
      }

      const updatedRule = await prisma.fraud_detection.update({
        where: { id },
        data: {
          detection_rules: {
            ...(existingRule.detection_rules as any),
            ...rule,
            updatedAt: new Date().toISOString()
          }
        }
      });

      return {
        id: updatedRule.id,
        userId: updatedRule.user_id || undefined,
        transactionId: updatedRule.transaction_id,
        riskScore: updatedRule.risk_score,
        riskLevel: updatedRule.risk_level,
        detectionRules: updatedRule.detection_rules,
        detectedAt: updatedRule.detected_at,
        resolvedAt: updatedRule.resolved_at || undefined,
        resolvedBy: updatedRule.resolved_by || undefined
      };
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }
      console.error('Error updating fraud rule:', error);
      throw new PaymentGatewayError(
        'Failed to update fraud rule',
        'FRAUD_DETECTION_FAILED' as PaymentErrorType,
        500
      );
    }
  }

  /**
   * Delete a fraud rule
   * @param id - Fraud rule ID
   */
  async deleteFraudRule(id: string): Promise<void> {
    try {
      await prisma.fraud_detection.delete({
        where: { id }
      });
    } catch (error) {
      console.error('Error deleting fraud rule:', error);
      throw new PaymentGatewayError(
        'Failed to delete fraud rule',
        'FRAUD_DETECTION_FAILED' as PaymentErrorType,
        500
      );
    }
  }

  /**
   * Get fraud rules with filters
   * @param filters - Fraud rule filters
   * @returns Array of fraud detection records
   */
  async getFraudRules(filters: FraudRuleFilters): Promise<FraudDetection[]> {
    try {
      const where: any = {};

      // Only get rules (not actual fraud detections)
      where.detection_rules = {
        path: ['isRule'],
        equals: true
      };

      if (filters.isActive !== undefined) {
        where.detection_rules = {
          ...where.detection_rules,
          path: ['isActive'],
          equals: filters.isActive
        };
      }

      const limit = filters.limit || 50;
      const offset = filters.offset || 0;

      const fraudDetections = await prisma.fraud_detection.findMany({
        where,
        orderBy: { detected_at: 'desc' },
        take: limit,
        skip: offset
      });

      return fraudDetections.map(fd => ({
        id: fd.id,
        userId: fd.user_id || undefined,
        transactionId: fd.transaction_id,
        riskScore: fd.risk_score,
        riskLevel: fd.risk_level,
        detectionRules: fd.detection_rules,
        detectedAt: fd.detected_at,
        resolvedAt: fd.resolved_at || undefined,
        resolvedBy: fd.resolved_by || undefined
      }));
    } catch (error) {
      console.error('Error fetching fraud rules:', error);
      throw new PaymentGatewayError(
        'Failed to fetch fraud rules',
        'FRAUD_DETECTION_FAILED' as PaymentErrorType,
        500
      );
    }
  }

  /**
   * Get fraud rule by ID
   * @param id - Fraud rule ID
   * @returns Fraud detection record
   */
  async getFraudRuleById(id: string): Promise<FraudDetection> {
    try {
      const fraudDetection = await prisma.fraud_detection.findUnique({
        where: { id }
      });

      if (!fraudDetection) {
        throw new PaymentGatewayError(
          'Fraud rule not found',
          'FRAUD_RULE_NOT_FOUND' as PaymentErrorType,
          404
        );
      }

      return {
        id: fraudDetection.id,
        userId: fraudDetection.user_id || undefined,
        transactionId: fraudDetection.transaction_id,
        riskScore: fraudDetection.risk_score,
        riskLevel: fraudDetection.risk_level,
        detectionRules: fraudDetection.detection_rules,
        detectedAt: fraudDetection.detected_at,
        resolvedAt: fraudDetection.resolved_at || undefined,
        resolvedBy: fraudDetection.resolved_by || undefined
      };
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }
      console.error('Error fetching fraud rule:', error);
      throw new PaymentGatewayError(
        'Failed to fetch fraud rule',
        'FRAUD_DETECTION_FAILED' as PaymentErrorType,
        500
      );
    }
  }

  /**
   * Activate a fraud rule
   * @param id - Fraud rule ID
   * @returns Updated fraud detection record
   */
  async activateFraudRule(id: string): Promise<FraudDetection> {
    try {
      const fraudDetection = await prisma.fraud_detection.findUnique({
        where: { id }
      });

      if (!fraudDetection) {
        throw new PaymentGatewayError(
          'Fraud rule not found',
          'FRAUD_RULE_NOT_FOUND' as PaymentErrorType,
          404
        );
      }

      const updatedRule = await prisma.fraud_detection.update({
        where: { id },
        data: {
          detection_rules: {
            ...(fraudDetection.detection_rules as any),
            isActive: true,
            updatedAt: new Date().toISOString()
          }
        }
      });

      return {
        id: updatedRule.id,
        userId: updatedRule.user_id || undefined,
        transactionId: updatedRule.transaction_id,
        riskScore: updatedRule.risk_score,
        riskLevel: updatedRule.risk_level,
        detectionRules: updatedRule.detection_rules,
        detectedAt: updatedRule.detected_at,
        resolvedAt: updatedRule.resolved_at || undefined,
        resolvedBy: updatedRule.resolved_by || undefined
      };
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }
      console.error('Error activating fraud rule:', error);
      throw new PaymentGatewayError(
        'Failed to activate fraud rule',
        'FRAUD_DETECTION_FAILED' as PaymentErrorType,
        500
      );
    }
  }

  /**
   * Deactivate a fraud rule
   * @param id - Fraud rule ID
   * @returns Updated fraud detection record
   */
  async deactivateFraudRule(id: string): Promise<FraudDetection> {
    try {
      const fraudDetection = await prisma.fraud_detection.findUnique({
        where: { id }
      });

      if (!fraudDetection) {
        throw new PaymentGatewayError(
          'Fraud rule not found',
          'FRAUD_RULE_NOT_FOUND' as PaymentErrorType,
          404
        );
      }

      const updatedRule = await prisma.fraud_detection.update({
        where: { id },
        data: {
          detection_rules: {
            ...(fraudDetection.detection_rules as any),
            isActive: false,
            updatedAt: new Date().toISOString()
          }
        }
      });

      return {
        id: updatedRule.id,
        userId: updatedRule.user_id || undefined,
        transactionId: updatedRule.transaction_id,
        riskScore: updatedRule.risk_score,
        riskLevel: updatedRule.risk_level,
        detectionRules: updatedRule.detection_rules,
        detectedAt: updatedRule.detected_at,
        resolvedAt: updatedRule.resolved_at || undefined,
        resolvedBy: updatedRule.resolved_by || undefined
      };
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }
      console.error('Error deactivating fraud rule:', error);
      throw new PaymentGatewayError(
        'Failed to deactivate fraud rule',
        'FRAUD_DETECTION_FAILED' as PaymentErrorType,
        500
      );
    }
  }

  /**
   * Evaluate all fraud rules for a transaction
   * @param transaction - Payment transaction
   * @returns Fraud evaluation result
   */
  async evaluateFraudRules(transaction: any): Promise<FraudEvaluationResult> {
    try {
      // Get all active fraud rules
      const rules = await this.getFraudRules({ isActive: true });

      const triggeredRules: FraudEvaluationResult['triggeredRules'] = [];
      let totalRiskScore = 0;

      // Evaluate each rule
      for (const rule of rules) {
        const ruleData = rule.detectionRules as any;

        // Check if rule conditions match
        if (this.evaluateRuleConditions(ruleData.conditions, transaction)) {
          const score = ruleData.weight || 10;
          totalRiskScore += score;

          triggeredRules.push({
            ruleId: rule.id,
            ruleName: ruleData.name,
            ruleType: ruleData.ruleType,
            score,
            conditions: ruleData.conditions
          });
        }
      }

      // Determine risk level
      const riskLevel = this.getRiskLevel(totalRiskScore);

      // Determine if fraud
      const isFraud = totalRiskScore >= 70;

      // Determine if should block
      const shouldBlock = totalRiskScore >= 80;

      // Generate recommendations
      const recommendations: string[] = [];
      if (totalRiskScore >= 50) {
        recommendations.push('Transaction has elevated risk score');
      }
      if (totalRiskScore >= 70) {
        recommendations.push('Consider blocking this transaction');
        recommendations.push('Manual review recommended');
      }
      if (triggeredRules.length > 0) {
        recommendations.push(`Triggered ${triggeredRules.length} fraud detection rules`);
      }

      const evaluationResult: FraudEvaluationResult = {
        isFraud,
        riskScore: Math.min(totalRiskScore, 100),
        riskLevel,
        triggeredRules,
        recommendations,
        shouldBlock
      };

      return evaluationResult;
    } catch (error) {
      console.error('Error evaluating fraud rules:', error);
      throw new PaymentGatewayError(
        'Failed to evaluate fraud rules',
        'FRAUD_DETECTION_FAILED' as PaymentErrorType,
        500
      );
    }
  }

  /**
   * Get fraud rule statistics
   * @returns Fraud rule statistics
   */
  async getFraudRuleStatistics(): Promise<FraudRuleStats> {
    try {
      // Get all fraud rules
      const rules = await this.getFraudRules({});

      const totalRules = rules.length;
      const activeRules = rules.filter(r => (r.detectionRules as any).isActive).length;
      const inactiveRules = totalRules - activeRules;

      // Count by type
      const rulesByType = rules.reduce((acc, rule) => {
        const ruleType = (rule.detectionRules as any).ruleType || 'UNKNOWN';
        acc[ruleType] = (acc[ruleType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate average priority and weight
      const priorities = rules.map(r => (r.detectionRules as any).priority || 0);
      const weights = rules.map(r => (r.detectionRules as any).weight || 0);
      const averagePriority =
        priorities.length > 0 ? priorities.reduce((a, b) => a + b, 0) / priorities.length : 0;
      const averageWeight =
        weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : 0;

      // Get most triggered rules (simplified - would need actual trigger tracking)
      const mostTriggeredRules = rules
        .slice(0, 5)
        .map(r => ({
          ruleId: r.id,
          ruleName: (r.detectionRules as any).name,
          triggerCount: 0 // Would be tracked in production
        }));

      // Get least effective rules (simplified - would need actual accuracy tracking)
      const leastEffectiveRules = rules
        .slice(0, 5)
        .map(r => ({
          ruleId: r.id,
          ruleName: (r.detectionRules as any).name,
          accuracy: 0.95 // Would be calculated in production
        }));

      const statistics: FraudRuleStats = {
        totalRules,
        activeRules,
        inactiveRules,
        rulesByType,
        averagePriority,
        averageWeight,
        mostTriggeredRules,
        leastEffectiveRules
      };

      return statistics;
    } catch (error) {
      console.error('Error fetching fraud rule statistics:', error);
      throw new PaymentGatewayError(
        'Failed to fetch fraud rule statistics',
        'FRAUD_DETECTION_FAILED' as PaymentErrorType,
        500
      );
    }
  }

  /**
   * Evaluate rule conditions against transaction
   * @param conditions - Rule conditions
   * @param transaction - Payment transaction
   * @returns True if conditions match
   */
  private evaluateRuleConditions(conditions: any, transaction: any): boolean {
    if (!conditions) return false;

    // Evaluate amount conditions
    if (conditions.amount) {
      if (conditions.amount.min && transaction.amount < conditions.amount.min) {
        return false;
      }
      if (conditions.amount.max && transaction.amount > conditions.amount.max) {
        return false;
      }
    }

    // Evaluate payment method conditions
    if (conditions.paymentMethods && conditions.paymentMethods.length > 0) {
      if (!conditions.paymentMethods.includes(transaction.paymentMethod)) {
        return false;
      }
    }

    // Evaluate time conditions
    if (conditions.time) {
      const hour = new Date().getHours();
      if (conditions.time.start && hour < conditions.time.start) {
        return false;
      }
      if (conditions.time.end && hour > conditions.time.end) {
        return false;
      }
    }

    // Evaluate velocity conditions
    if (conditions.velocity) {
      // Would check actual velocity in production
      // For now, just return true
    }

    return true;
  }

  /**
   * Get risk level from score
   * @param score - Risk score
   * @returns Risk level
   */
  private getRiskLevel(score: number): string {
    if (score < 30) return 'LOW';
    if (score < 50) return 'MEDIUM';
    if (score < 70) return 'HIGH';
    return 'CRITICAL';
  }
}

// Export singleton instance
export const fraudDetectionRulesService = new FraudDetectionRulesService();
