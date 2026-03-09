/**
 * Payment Entity Type Definitions for Admin Panel
 *
 * This file contains all TypeScript interfaces and types related to Payment Management
 * including PaymentTransaction, GatewaySettings, Analytics, and related request/response types.
 */

/**
 * Payment Status Enum
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  CANCELLED = 'cancelled'
}

/**
 * Payment Method Enum
 */
export enum PaymentMethod {
  SSLCOMMERZ = 'sslcommerz',
  BKASH = 'bkash',
  NAGAD = 'nagad',
  COD = 'cod'
}

/**
 * Gateway Type Enum
 */
export enum GatewayType {
  SSLCOMMERZ = 'sslcommerz',
  BKASH = 'bkash',
  NAGAD = 'nagad'
}

/**
 * Payment Transaction Interface
 */
export interface PaymentTransaction {
  id: string;
  orderId: string;
  transactionId: string;
  userId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  gatewayType: GatewayType;
  gatewayTransactionId?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  cardLastFour?: string;
  cardBrand?: string;
  ipAddress?: string;
  userAgent?: string;
  fraudScore?: number;
  fraudFlags?: string[];
  metadata?: Record<string, any>;
  gatewayResponse?: any;
  callbackData?: any;
  refundedAmount?: number;
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payment Query Parameters
 */
export interface PaymentQueryParams {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Payment Transactions Response
 */
export interface PaymentTransactionsResponse {
  data: PaymentTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Refund Request Interface
 */
export interface RefundRequest {
  amount: number;
  reason: string;
  fullRefund?: boolean;
}

/**
 * Refund Response Interface
 */
export interface RefundResponse {
  success: boolean;
  refundId: string;
  refundAmount: number;
  refundStatus: string;
  message?: string;
}

/**
 * Gateway Settings Interface
 */
export interface GatewaySettings {
  gateway: GatewayType;
  isActive: boolean;
  isTestMode: boolean;
  config: {
    storeId?: string;
    storePassword?: string;
    sessionId?: string;
    appKey?: string;
    appSecret?: string;
    username?: string;
    password?: string;
    merchantId?: string;
    isSandbox?: boolean;
    [key: string]: any;
  };
  webhookUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Gateway Settings Response
 */
export interface GatewaySettingsResponse {
  data: GatewaySettings[];
}

/**
 * Analytics Query Parameters
 */
export interface AnalyticsQueryParams {
  startDate?: string;
  endDate?: string;
  gateway?: GatewayType;
}

/**
 * Payment Analytics Interface
 */
export interface PaymentAnalytics {
  totalTransactions: number;
  totalRevenue: number;
  successRate: number;
  failureRate: number;
  averageTransactionValue: number;
  refundedAmount: number;
  refundRate: number;
  gatewayStats: GatewayStats[];
  paymentMethodDistribution: PaymentMethodDistribution[];
  transactionVolume: TransactionVolumeData[];
  failedPayments: FailedPaymentAnalysis[];
  peakTransactionTimes: PeakTransactionTime[];
  fraudStats: FraudStats;
}

/**
 * Gateway Statistics
 */
export interface GatewayStats {
  gateway: GatewayType;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  successRate: number;
  totalRevenue: number;
  averageTransactionValue: number;
}

/**
 * Payment Method Distribution
 */
export interface PaymentMethodDistribution {
  method: PaymentMethod;
  count: number;
  percentage: number;
  totalAmount: number;
}

/**
 * Transaction Volume Data
 */
export interface TransactionVolumeData {
  date: string;
  count: number;
  amount: number;
  successful: number;
  failed: number;
}

/**
 * Failed Payment Analysis
 */
export interface FailedPaymentAnalysis {
  reason: string;
  count: number;
  percentage: number;
  gateway?: GatewayType;
}

/**
 * Peak Transaction Time
 */
export interface PeakTransactionTime {
  hour: number;
  dayOfWeek: string;
  count: number;
  averageAmount: number;
}

/**
 * Fraud Statistics
 */
export interface FraudStats {
  totalFlagged: number;
  blockedTransactions: number;
  averageFraudScore: number;
  highRiskTransactions: number;
  mediumRiskTransactions: number;
  lowRiskTransactions: number;
}

/**
 * Log Event Type
 */
export enum LogEventType {
  PAYMENT_INITIATED = 'payment_initiated',
  PAYMENT_PROCESSING = 'payment_processing',
  PAYMENT_COMPLETED = 'payment_completed',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_REFUNDED = 'payment_refunded',
  PAYMENT_CANCELLED = 'payment_cancelled',
  GATEWAY_CALLBACK = 'gateway_callback',
  FRAUD_DETECTED = 'fraud_detected',
  SECURITY_EVENT = 'security_event',
  ERROR = 'error'
}

/**
 * Log Query Parameters
 */
export interface LogQueryParams {
  transactionId?: string;
  orderId?: string;
  eventType?: LogEventType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Payment Log Entry
 */
export interface PaymentLog {
  id: string;
  transactionId?: string;
  orderId?: string;
  userId?: string;
  eventType: LogEventType;
  eventLevel: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  isSecurityEvent: boolean;
  isSuspicious: boolean;
  createdAt: string;
}

/**
 * Payment Logs Response
 */
export interface PaymentLogsResponse {
  data: PaymentLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Transaction Timeline Entry
 */
export interface TransactionTimeline {
  id: string;
  eventType: string;
  status: PaymentStatus;
  message: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

/**
 * Security Event
 */
export interface SecurityEvent {
  id: string;
  transactionId?: string;
  orderId?: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

/**
 * Payment Configuration Constants
 */
export const PAYMENT_CONSTANTS = {
  CURRENCY: 'BDT',
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DATE_FORMAT: 'YYYY-MM-DD',
  DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
  GATEWAY_NAMES: {
    [GatewayType.SSLCOMMERZ]: 'SSLCommerz',
    [GatewayType.BKASH]: 'bKash',
    [GatewayType.NAGAD]: 'Nagad'
  },
  PAYMENT_METHOD_NAMES: {
    [PaymentMethod.SSLCOMMERZ]: 'SSLCommerz',
    [PaymentMethod.BKASH]: 'bKash',
    [PaymentMethod.NAGAD]: 'Nagad',
    [PaymentMethod.COD]: 'Cash on Delivery'
  },
  STATUS_COLORS: {
    [PaymentStatus.PENDING]: 'warning',
    [PaymentStatus.PROCESSING]: 'info',
    [PaymentStatus.COMPLETED]: 'success',
    [PaymentStatus.FAILED]: 'error',
    [PaymentStatus.REFUNDED]: 'secondary',
    [PaymentStatus.PARTIALLY_REFUNDED]: 'secondary',
    [PaymentStatus.CANCELLED]: 'error'
  },
  FRAUD_SCORE_THRESHOLDS: {
    LOW_RISK: 30,
    MEDIUM_RISK: 60,
    HIGH_RISK: 80
  }
} as const;

/**
 * Export CSV Data Interface
 */
export interface ExportData {
  transactions: PaymentTransaction[];
  format: 'csv' | 'excel';
  includeSensitive?: boolean;
}
