"use strict";
/**
 * Nagad Payment Gateway Service
 *
 * This service handles all interactions with the Nagad payment gateway
 * for mobile wallet payments in Bangladesh.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NagadService = void 0;
exports.createNagadService = createNagadService;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const payment_gateway_interface_1 = require("./payment-gateway.interface");
/**
 * Nagad Service Class
 */
class NagadService {
    constructor(config) {
        this.name = 'Nagad';
        this.type = 'MOBILE_WALLET';
        this.config = config;
        this.apiClient = axios_1.default.create({
            baseURL: config.baseUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
    }
    /**
     * Create Nagad payment
     * @param order - The order to process payment for
     * @returns Payment initiation result
     */
    async initiatePayment(order) {
        try {
            // Validate order
            this.validateOrder(order);
            // Generate payment reference ID
            const paymentRefId = this.generatePaymentRefId(order);
            // Generate merchant invoice number
            const merchantInvoiceNumber = order.orderNumber;
            // Prepare payment request
            const paymentRequest = {
                merchantId: this.config.merchantId,
                merchantOrderId: order.id,
                dateTime: this.getCurrentDateTime(),
                amount: order.total.toString(),
                currency: order.currency,
                invoiceNo: merchantInvoiceNumber,
                paymentRefId: paymentRefId,
                merchantCallbackURL: `${this.config.webhookUrl}/nagad/callback`,
                additionalMerchantInfo: {
                    orderInfo: `Order ${order.orderNumber}`,
                    customerInfo: this.getCustomerInfo(order)
                }
            };
            // Sign the request
            const signature = this.signRequest(paymentRequest);
            // Make API request
            const response = await this.apiClient.post('/api/checkout/create', paymentRequest, {
                headers: {
                    'X-KM-IPN-Verification': signature,
                    'X-KM-Api-Version': 'v-4.0'
                }
            });
            if (!response.data.url || response.data.status === 'FAILED') {
                throw new payment_gateway_interface_1.PaymentGatewayError(response.data.message || 'Payment creation failed', payment_gateway_interface_1.PaymentErrorType.INITIATION_FAILED, 400, response.data);
            }
            return {
                success: true,
                transactionId: paymentRefId,
                paymentUrl: response.data.url,
                gatewayResponse: response.data
            };
        }
        catch (error) {
            if (error instanceof payment_gateway_interface_1.PaymentGatewayError) {
                throw error;
            }
            if (axios_1.default.isAxiosError(error)) {
                throw new payment_gateway_interface_1.PaymentGatewayError('Network error while creating payment', payment_gateway_interface_1.PaymentErrorType.NETWORK_ERROR, 503, error.response?.data);
            }
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to create payment', payment_gateway_interface_1.PaymentErrorType.INITIATION_FAILED, 500);
        }
    }
    /**
     * Verify payment completion
     * @param paymentRefId - The payment reference ID
     * @returns Payment status
     */
    async verifyPayment(paymentRefId) {
        try {
            // Prepare verification request
            const verifyRequest = {
                paymentRefId: paymentRefId,
                merchantId: this.config.merchantId
            };
            // Sign the request
            const signature = this.signRequest(verifyRequest);
            // Make API request
            const response = await this.apiClient.post('/api/checkout/verify', verifyRequest, {
                headers: {
                    'X-KM-IPN-Verification': signature,
                    'X-KM-Api-Version': 'v-4.0'
                }
            });
            const status = this.mapGatewayStatus(response.data.status || 'PENDING');
            return {
                success: status === 'completed',
                status,
                amount: parseFloat(response.data.amount || '0'),
                currency: response.data.currency || 'BDT',
                customerInfo: {
                    name: 'Nagad User',
                    phone: response.data.issuerPaymentRefNo
                },
                gatewayResponse: response.data
            };
        }
        catch (error) {
            if (error instanceof payment_gateway_interface_1.PaymentGatewayError) {
                throw error;
            }
            if (axios_1.default.isAxiosError(error)) {
                throw new payment_gateway_interface_1.PaymentGatewayError('Network error while verifying payment', payment_gateway_interface_1.PaymentErrorType.NETWORK_ERROR, 503, error.response?.data);
            }
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to verify payment', payment_gateway_interface_1.PaymentErrorType.VERIFICATION_FAILED, 500);
        }
    }
    /**
     * Process refund
     * @param transactionId - The transaction ID to refund
     * @param amount - The amount to refund
     * @returns Refund result
     */
    async refundPayment(transactionId, amount) {
        try {
            if (amount <= 0) {
                throw new payment_gateway_interface_1.PaymentGatewayError('Refund amount must be greater than 0', payment_gateway_interface_1.PaymentErrorType.INVALID_REQUEST, 400);
            }
            // Generate refund reference ID
            const refundRefId = this.generateRefundRefId(transactionId);
            // Prepare refund request
            const refundRequest = {
                paymentRefId: transactionId,
                refundRefId: refundRefId,
                amount: amount.toString(),
                currency: 'BDT',
                reason: 'Customer request',
                merchantId: this.config.merchantId,
                dateTime: this.getCurrentDateTime()
            };
            // Sign the request
            const signature = this.signRequest(refundRequest);
            // Make API request
            const response = await this.apiClient.post('/api/checkout/refund', refundRequest, {
                headers: {
                    'X-KM-IPN-Verification': signature,
                    'X-KM-Api-Version': 'v-4.0'
                }
            });
            if (response.data.status === 'FAILED') {
                throw new payment_gateway_interface_1.PaymentGatewayError(response.data.message || 'Refund failed', payment_gateway_interface_1.PaymentErrorType.REFUND_FAILED, 400, response.data);
            }
            return {
                success: true,
                refundId: refundRefId,
                amount,
                currency: 'BDT',
                gatewayResponse: response.data
            };
        }
        catch (error) {
            if (error instanceof payment_gateway_interface_1.PaymentGatewayError) {
                throw error;
            }
            if (axios_1.default.isAxiosError(error)) {
                throw new payment_gateway_interface_1.PaymentGatewayError('Network error while processing refund', payment_gateway_interface_1.PaymentErrorType.NETWORK_ERROR, 503, error.response?.data);
            }
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to process refund', payment_gateway_interface_1.PaymentErrorType.REFUND_FAILED, 500);
        }
    }
    /**
     * Handle callback from Nagad
     * @param response - Callback response from Nagad
     * @returns Callback handling result
     */
    async handleCallback(response) {
        try {
            // Validate callback
            if (!response.paymentRefId) {
                throw new payment_gateway_interface_1.PaymentGatewayError('Invalid callback data: missing payment reference ID', payment_gateway_interface_1.PaymentErrorType.CALLBACK_FAILED, 400);
            }
            // Verify payment status
            const verificationResult = await this.verifyPayment(response.paymentRefId);
            return {
                success: verificationResult.success,
                transactionId: response.paymentRefId,
                status: verificationResult.status,
                gatewayResponse: response
            };
        }
        catch (error) {
            if (error instanceof payment_gateway_interface_1.PaymentGatewayError) {
                throw error;
            }
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to handle callback', payment_gateway_interface_1.PaymentErrorType.CALLBACK_FAILED, 500);
        }
    }
    /**
     * Generate payment reference ID
     * @param order - The order
     * @returns Payment reference ID
     */
    generatePaymentRefId(order) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `NAGAD_${order.orderNumber}_${timestamp}_${random}`;
    }
    /**
     * Generate refund reference ID
     * @param transactionId - The transaction ID
     * @returns Refund reference ID
     */
    generateRefundRefId(transactionId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `REFUND_${transactionId}_${timestamp}_${random}`;
    }
    /**
     * Validate order
     * @param order - The order to validate
     * @throws PaymentGatewayError if validation fails
     */
    validateOrder(order) {
        if (!order.id || !order.orderNumber) {
            throw new payment_gateway_interface_1.PaymentGatewayError('Invalid order: missing ID or order number', payment_gateway_interface_1.PaymentErrorType.INVALID_REQUEST, 400);
        }
        if (order.total <= 0) {
            throw new payment_gateway_interface_1.PaymentGatewayError('Invalid order: total amount must be greater than 0', payment_gateway_interface_1.PaymentErrorType.INVALID_REQUEST, 400);
        }
        if (!order.currency) {
            throw new payment_gateway_interface_1.PaymentGatewayError('Invalid order: currency is required', payment_gateway_interface_1.PaymentErrorType.INVALID_REQUEST, 400);
        }
    }
    /**
     * Get customer info from order
     * @param order - The order
     * @returns Customer info
     */
    getCustomerInfo(order) {
        // This would typically come from the order's user or address
        return {
            name: 'Customer',
            phone: '01800000000',
            email: 'customer@example.com'
        };
    }
    /**
     * Get current date time in Nagad format
     * @returns Date time string
     */
    getCurrentDateTime() {
        const now = new Date();
        return now.toISOString().replace('T', ' ').substring(0, 19);
    }
    /**
     * Sign request with private key
     * @param data - Request data
     * @returns Signature
     */
    signRequest(data) {
        try {
            // Convert data to string
            const dataString = JSON.stringify(data);
            // Create signature using private key
            const sign = crypto_1.default.createSign('SHA256');
            sign.update(dataString);
            sign.end();
            const signature = sign.sign(this.config.privateKey, 'base64');
            return signature;
        }
        catch (error) {
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to sign request', payment_gateway_interface_1.PaymentErrorType.AUTHENTICATION_FAILED, 500);
        }
    }
    /**
     * Verify callback signature
     * @param data - Callback data
     * @param signature - Signature to verify
     * @returns Whether signature is valid
     */
    verifyCallbackSignature(data, signature) {
        try {
            // Convert data to string
            const dataString = JSON.stringify(data);
            // Verify signature using public key
            const verify = crypto_1.default.createVerify('SHA256');
            verify.update(dataString);
            verify.end();
            const isValid = verify.verify(this.config.publicKey, signature, 'base64');
            return isValid;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Map gateway status to PaymentStatus enum
     * @param gatewayStatus - Nagad status
     * @returns PaymentStatus
     */
    mapGatewayStatus(gatewayStatus) {
        const statusMap = {
            'SUCCESS': 'completed',
            'COMPLETED': 'completed',
            'PENDING': 'pending',
            'PROCESSING': 'processing',
            'FAILED': 'failed',
            'CANCELLED': 'cancelled',
            'REFUNDED': 'refunded'
        };
        return statusMap[gatewayStatus] || 'pending';
    }
}
exports.NagadService = NagadService;
/**
 * Create Nagad service instance
 * @param config - Nagad configuration
 * @returns Nagad service instance
 */
function createNagadService(config) {
    return new NagadService(config);
}
