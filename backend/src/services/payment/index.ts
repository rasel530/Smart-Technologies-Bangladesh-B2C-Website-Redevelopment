/**
 * Payment Gateway Services
 *
 * This module exports all payment gateway services and related utilities.
 * It provides a unified interface for integrating with different payment providers.
 */

// Export interfaces and types
export {
  PaymentGateway,
  GatewayType,
  PaymentInitiationResult,
  PaymentVerificationResult,
  RefundResult,
  CallbackResult,
  GatewayPaymentStatus,
  CustomerInfo,
  GatewayConfig,
  PaymentErrorType,
  PaymentGatewayError,
  CallbackResponse,
  PaymentEventType,
  SecurityEventType
} from './payment-gateway.interface';

// Export SSLCommerz service
export {
  SSLCommerzService,
  SSLCommerzConfig,
  createSSLCommerzService
} from './sslcommerz.service';

// Export bKash service
export {
  BkashService,
  BkashConfig,
  createBkashService
} from './bkash.service';

// Export Nagad service
export {
  NagadService,
  NagadConfig,
  createNagadService
} from './nagad.service';

// Export payment transaction service
export {
  PaymentTransactionService,
  paymentTransactionService,
  CreatePaymentTransactionRequest,
  UpdatePaymentStatusRequest,
  PaymentLogRequest,
  SecurityEventLogRequest
} from './payment-transaction.service';

// Export payment gateway factory
export {
  PaymentGatewayFactory,
  paymentGatewayFactory,
  GatewayConfiguration
} from './payment-gateway.factory';

// Export fraud detection service
export {
  FraudDetectionService,
  fraudDetectionService,
  FraudDetectionRules,
  FraudAnalysisRequest,
  FraudAnalysisResult,
  FraudAnalysis,
  VelocityCheckResult,
  IPAnalysisResult,
  AmountPatternResult,
  PhonePatternResult,
  TimePatternResult,
  DeviceAnalysisResult,
  FraudHistory,
  SecurityEventLogRequest as FraudSecurityEventLogRequest
} from './fraud-detection.service';

// Export PCI-DSS compliance service
export {
  PciDssComplianceService,
  pciDssComplianceService,
  CardData,
  TokenizedCardData,
  ComplianceCheckResult
} from './pci-dss.service';

// Re-export Order interface for convenience
export type { Order } from './payment-gateway.interface';
