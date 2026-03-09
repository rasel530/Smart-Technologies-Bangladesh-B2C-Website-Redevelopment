"use strict";
/**
 * bKash Payment Gateway Service
 *
 * This service handles all interactions with the bKash payment gateway
 * for mobile wallet payments in Bangladesh.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BkashService = void 0;
exports.createBkashService = createBkashService;
const axios_1 = __importDefault(require("axios"));
const payment_gateway_interface_1 = require("./payment-gateway.interface");
/**
 * bKash Service Class
 */
class BkashService {
    constructor(config) {
        this.name = 'bKash';
        this.type = 'MOBILE_WALLET';
        this.accessToken = null;
        this.tokenExpiry = 0;
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
     * Get OAuth access token
     * @returns Access token
     */
    async getAccessToken() {
        try {
            // Check if token is still valid
            if (this.accessToken && Date.now() < this.tokenExpiry) {
                return this.accessToken;
            }
            // Generate app key and app secret
            const appKey = this.config.apiKey;
            const appSecret = this.config.apiSecret;
            const authString = Buffer.from(`${appKey}:${appSecret}`).toString('base64');
            // Request token
            const response = await this.apiClient.post('/tokenized/checkout/token/grant', {
                app_key: appKey,
                app_secret: appSecret
            }, {
                headers: {
                    'Authorization': `Basic ${authString}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.data.id_token) {
                throw new payment_gateway_interface_1.PaymentGatewayError(response.data.statusMessage || 'Failed to get access token', payment_gateway_interface_1.PaymentErrorType.AUTHENTICATION_FAILED, 401, response.data);
            }
            // Store token and expiry
            this.accessToken = response.data.id_token;
            this.tokenExpiry = Date.now() + ((response.data.expires_in || 3600) * 1000);
            return this.accessToken;
        }
        catch (error) {
            if (error instanceof payment_gateway_interface_1.PaymentGatewayError) {
                throw error;
            }
            if (axios_1.default.isAxiosError(error)) {
                throw new payment_gateway_interface_1.PaymentGatewayError('Network error while getting access token', payment_gateway_interface_1.PaymentErrorType.NETWORK_ERROR, 503, error.response?.data);
            }
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to get access token', payment_gateway_interface_1.PaymentErrorType.AUTHENTICATION_FAILED, 500);
        }
    }
    /**
     * Create bKash payment
     * @param order - The order to process payment for
     * @returns Payment initiation result
     */
    async initiatePayment(order) {
        try {
            // Validate order
            this.validateOrder(order);
            // Get access token
            const token = await this.getAccessToken();
            // Generate transaction ID
            const transactionId = this.generateTransactionId(order);
            // Prepare payment request
            const paymentRequest = {
                mode: '0011',
                payerReference: this.getCustomerPhone(order),
                callbackURL: `${this.config.webhookUrl}/bkash/callback`,
                amount: order.total.toString(),
                currency: order.currency,
                intent: 'sale',
                merchantInvoiceNumber: order.orderNumber,
                merchantAssociationInfo: `Order_${order.id}`
            };
            // Make API request
            const response = await this.apiClient.post('/tokenized/checkout/create', paymentRequest, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-APP-Key': this.config.apiKey
                }
            });
            if (!response.data.paymentID || response.data.transactionStatus === 'InitiationFailed') {
                throw new payment_gateway_interface_1.PaymentGatewayError(response.data.statusMessage || 'Payment creation failed', payment_gateway_interface_1.PaymentErrorType.INITIATION_FAILED, 400, response.data);
            }
            return {
                success: true,
                transactionId: response.data.paymentID,
                paymentUrl: `bkash://payment?paymentID=${response.data.paymentID}`,
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
     * Execute payment after user authorization
     * @param paymentId - The payment ID
     * @returns Payment execution result
     */
    async executePayment(paymentId) {
        try {
            // Get access token
            const token = await this.getAccessToken();
            // Prepare execution request
            const executeRequest = {
                paymentID: paymentId,
                walletType: 'bKash'
            };
            // Make API request
            const response = await this.apiClient.post('/tokenized/checkout/execute', executeRequest, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-APP-Key': this.config.apiKey
                }
            });
            if (response.data.transactionStatus === 'InitiationFailed' ||
                response.data.transactionStatus === 'TransactionFailed') {
                throw new payment_gateway_interface_1.PaymentGatewayError(response.data.statusMessage || 'Payment execution failed', payment_gateway_interface_1.PaymentErrorType.INITIATION_FAILED, 400, response.data);
            }
            return {
                success: true,
                transactionId: paymentId,
                gatewayResponse: response.data
            };
        }
        catch (error) {
            if (error instanceof payment_gateway_interface_1.PaymentGatewayError) {
                throw error;
            }
            if (axios_1.default.isAxiosError(error)) {
                throw new payment_gateway_interface_1.PaymentGatewayError('Network error while executing payment', payment_gateway_interface_1.PaymentErrorType.NETWORK_ERROR, 503, error.response?.data);
            }
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to execute payment', payment_gateway_interface_1.PaymentErrorType.INITIATION_FAILED, 500);
        }
    }
    /**
     * Query payment status
     * @param paymentId - The payment ID
     * @returns Payment status
     */
    async queryPayment(paymentId) {
        try {
            // Get access token
            const token = await this.getAccessToken();
            // Prepare query request
            const queryRequest = {
                paymentID: paymentId
            };
            // Make API request
            const response = await this.apiClient.post('/tokenized/checkout/payment/status', queryRequest, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-APP-Key': this.config.apiKey
                }
            });
            return this.mapGatewayStatus(response.data.transactionStatus || 'Initiated');
        }
        catch (error) {
            if (error instanceof payment_gateway_interface_1.PaymentGatewayError) {
                throw error;
            }
            if (axios_1.default.isAxiosError(error)) {
                throw new payment_gateway_interface_1.PaymentGatewayError('Network error while querying payment', payment_gateway_interface_1.PaymentErrorType.NETWORK_ERROR, 503, error.response?.data);
            }
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to query payment', payment_gateway_interface_1.PaymentErrorType.VERIFICATION_FAILED, 500);
        }
    }
    /**
     * Verify a payment
     * @param transactionId - The transaction ID to verify
     * @returns Payment verification result
     */
    async verifyPayment(transactionId) {
        try {
            // Get access token
            const token = await this.getAccessToken();
            // Prepare query request
            const queryRequest = {
                paymentID: transactionId
            };
            // Make API request
            const response = await this.apiClient.post('/tokenized/checkout/payment/status', queryRequest, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-APP-Key': this.config.apiKey
                }
            });
            const status = this.mapGatewayStatus(response.data.transactionStatus || 'Initiated');
            return {
                success: status === 'completed',
                status,
                amount: parseFloat(response.data.amount || '0'),
                currency: response.data.currency || 'BDT',
                customerInfo: {
                    name: 'bKash User',
                    phone: response.data.customerMsisdn
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
            // Get access token
            const token = await this.getAccessToken();
            // Prepare refund request
            const refundRequest = {
                paymentID: transactionId,
                amount: amount.toString(),
                currency: 'BDT',
                reason: 'Customer request',
                sku: 'refund'
            };
            // Make API request
            const response = await this.apiClient.post('/tokenized/checkout/refund', refundRequest, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-APP-Key': this.config.apiKey
                }
            });
            if (response.data.transactionStatus === 'RefundFailed') {
                throw new payment_gateway_interface_1.PaymentGatewayError(response.data.statusMessage || 'Refund failed', payment_gateway_interface_1.PaymentErrorType.REFUND_FAILED, 400, response.data);
            }
            return {
                success: true,
                refundId: response.data.refundTransactionId,
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
     * Handle callback from bKash
     * @param response - Callback response from bKash
     * @returns Callback handling result
     */
    async handleCallback(response) {
        try {
            // Validate callback
            if (!response.paymentID) {
                throw new payment_gateway_interface_1.PaymentGatewayError('Invalid callback data: missing payment ID', payment_gateway_interface_1.PaymentErrorType.CALLBACK_FAILED, 400);
            }
            // Query payment status
            const status = await this.queryPayment(response.paymentID);
            return {
                success: status === 'completed',
                transactionId: response.paymentID,
                status,
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
     * Generate transaction ID
     * @param order - The order
     * @returns Transaction ID
     */
    generateTransactionId(order) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `BKASH_${order.orderNumber}_${timestamp}_${random}`;
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
     * Get customer phone from order
     * @param order - The order
     * @returns Customer phone
     */
    getCustomerPhone(order) {
        // This would typically come from the order's address
        return '01700000000'; // Placeholder
    }
    /**
     * Map gateway status to PaymentStatus enum
     * @param gatewayStatus - bKash status
     * @returns PaymentStatus
     */
    mapGatewayStatus(gatewayStatus) {
        const statusMap = {
            'Completed': 'completed',
            'Authorized': 'processing',
            'Pending': 'pending',
            'Initiated': 'pending',
            'InitiationFailed': 'failed',
            'TransactionFailed': 'failed',
            'Cancelled': 'cancelled',
            'Refunded': 'refunded'
        };
        return statusMap[gatewayStatus] || 'pending';
    }
    /**
     * Verify callback signature
     * @param data - Callback data
     * @returns Whether signature is valid
     */
    verifyCallbackSignature(data) {
        // Implement signature verification if required by bKash
        // This would verify that the callback is actually from bKash
        return true;
    }
}
exports.BkashService = BkashService;
/**
 * Create bKash service instance
 * @param config - bKash configuration
 * @returns bKash service instance
 */
function createBkashService(config) {
    return new BkashService(config);
}
