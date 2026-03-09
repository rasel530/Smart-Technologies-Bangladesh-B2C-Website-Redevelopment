"use strict";
/**
 * Payment Gateway Interface
 *
 * This file defines the common interface that all payment gateway services must implement.
 * It provides a unified API for interacting with different payment providers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityEventType = exports.PaymentEventType = exports.PaymentGatewayError = exports.PaymentErrorType = void 0;
/**
 * Payment Error Types
 */
var PaymentErrorType;
(function (PaymentErrorType) {
    PaymentErrorType["INITIATION_FAILED"] = "INITIATION_FAILED";
    PaymentErrorType["VERIFICATION_FAILED"] = "VERIFICATION_FAILED";
    PaymentErrorType["REFUND_FAILED"] = "REFUND_FAILED";
    PaymentErrorType["CALLBACK_FAILED"] = "CALLBACK_FAILED";
    PaymentErrorType["NETWORK_ERROR"] = "NETWORK_ERROR";
    PaymentErrorType["INVALID_REQUEST"] = "INVALID_REQUEST";
    PaymentErrorType["GATEWAY_ERROR"] = "GATEWAY_ERROR";
    PaymentErrorType["AUTHENTICATION_FAILED"] = "AUTHENTICATION_FAILED";
    PaymentErrorType["INSUFFICIENT_FUNDS"] = "INSUFFICIENT_FUNDS";
    PaymentErrorType["TRANSACTION_NOT_FOUND"] = "TRANSACTION_NOT_FOUND";
    PaymentErrorType["FRAUD_DETECTION_FAILED"] = "FRAUD_DETECTION_FAILED";
    PaymentErrorType["BLOCK_USER_FAILED"] = "BLOCK_USER_FAILED";
    PaymentErrorType["UNBLOCK_USER_FAILED"] = "UNBLOCK_USER_FAILED";
    PaymentErrorType["ENCRYPTION_FAILED"] = "ENCRYPTION_FAILED";
    PaymentErrorType["DECRYPTION_FAILED"] = "DECRYPTION_FAILED";
    PaymentErrorType["TOKENIZATION_DISABLED"] = "TOKENIZATION_DISABLED";
    PaymentErrorType["TOKENIZATION_FAILED"] = "TOKENIZATION_FAILED";
    PaymentErrorType["INVALID_TOKEN"] = "INVALID_TOKEN";
    PaymentErrorType["DETOKENIZATION_FAILED"] = "DETOKENIZATION_FAILED";
    PaymentErrorType["TOKEN_GENERATION_FAILED"] = "TOKEN_GENERATION_FAILED";
    PaymentErrorType["HASHING_FAILED"] = "HASHING_FAILED";
    PaymentErrorType["INVALID_CARD_NUMBER"] = "INVALID_CARD_NUMBER";
    PaymentErrorType["INVALID_EXPIRY_DATE"] = "INVALID_EXPIRY_DATE";
    PaymentErrorType["CARD_EXPIRED"] = "CARD_EXPIRED";
    PaymentErrorType["INVALID_CVV"] = "INVALID_CVV";
    PaymentErrorType["SIGNATURE_GENERATION_FAILED"] = "SIGNATURE_GENERATION_FAILED";
    PaymentErrorType["RANDOM_GENERATION_FAILED"] = "RANDOM_GENERATION_FAILED";
})(PaymentErrorType || (exports.PaymentErrorType = PaymentErrorType = {}));
/**
 * Payment Error
 */
class PaymentGatewayError extends Error {
    constructor(message, type, statusCode = 500, gatewayResponse) {
        super(message);
        this.type = type;
        this.statusCode = statusCode;
        this.gatewayResponse = gatewayResponse;
        this.name = 'PaymentGatewayError';
    }
}
exports.PaymentGatewayError = PaymentGatewayError;
/**
 * Payment Event Types for Logging
 */
var PaymentEventType;
(function (PaymentEventType) {
    PaymentEventType["INITIATION"] = "PAYMENT_INITIATION";
    PaymentEventType["VERIFICATION"] = "PAYMENT_VERIFICATION";
    PaymentEventType["CALLBACK"] = "PAYMENT_CALLBACK";
    PaymentEventType["REFUND"] = "PAYMENT_REFUND";
    PaymentEventType["SUCCESS"] = "PAYMENT_SUCCESS";
    PaymentEventType["FAILURE"] = "PAYMENT_FAILURE";
    PaymentEventType["CANCEL"] = "PAYMENT_CANCEL";
})(PaymentEventType || (exports.PaymentEventType = PaymentEventType = {}));
/**
 * Security Event Types for Logging
 */
var SecurityEventType;
(function (SecurityEventType) {
    SecurityEventType["FRAUD_DETECTED"] = "FRAUD_DETECTED";
    SecurityEventType["HIGH_RISK_TRANSACTION"] = "HIGH_RISK_TRANSACTION";
    SecurityEventType["VELOCITY_LIMIT_EXCEEDED"] = "VELOCITY_LIMIT_EXCEEDED";
    SecurityEventType["SUSPICIOUS_IP"] = "SUSPICIOUS_IP";
    SecurityEventType["SUSPICIOUS_AMOUNT"] = "SUSPICIOUS_AMOUNT";
    SecurityEventType["SUSPICIOUS_TIME"] = "SUSPICIOUS_TIME";
    SecurityEventType["BLOCKED_USER"] = "BLOCKED_USER";
    SecurityEventType["UNBLOCKED_USER"] = "UNBLOCKED_USER";
    SecurityEventType["WEBHOOK_SIGNATURE_INVALID"] = "WEBHOOK_SIGNATURE_INVALID";
    SecurityEventType["PCI_DSS_VIOLATION"] = "PCI_DSS_VIOLATION";
    SecurityEventType["ENCRYPTION_FAILED"] = "ENCRYPTION_FAILED";
    SecurityEventType["DECRYPTION_FAILED"] = "DECRYPTION_FAILED";
    SecurityEventType["TOKENIZATION_FAILED"] = "TOKENIZATION_FAILED";
    SecurityEventType["SANITIZATION_ERROR"] = "SANITIZATION_ERROR";
})(SecurityEventType || (exports.SecurityEventType = SecurityEventType = {}));
