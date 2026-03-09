"use strict";
/**
 * SSLCommerz Payment Gateway Service
 *
 * This service handles all interactions with the SSLCommerz payment gateway
 * for card payments in Bangladesh.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSLCommerzService = void 0;
exports.createSSLCommerzService = createSSLCommerzService;
const axios_1 = __importDefault(require("axios"));
const payment_gateway_interface_1 = require("./payment-gateway.interface");
/**
 * SSLCommerz Service Class
 */
class SSLCommerzService {
    constructor(config) {
        this.name = 'SSLCommerz';
        this.type = 'CARD';
        this.config = config;
        this.baseUrl = config.isLive
            ? 'https://securepay.sslcommerz.com'
            : 'https://sandbox.sslcommerz.com';
        this.apiClient = axios_1.default.create({
            baseURL: this.baseUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
    }
    /**
     * Initialize SSLCommerz payment
     * @param order - The order to process payment for
     * @returns Payment initiation result
     */
    async initiatePayment(order) {
        try {
            // Validate order
            this.validateOrder(order);
            // Generate transaction ID
            const transactionId = this.generateTransactionId(order);
            // Prepare payment request
            const paymentRequest = {
                store_id: this.config.storeId,
                store_passwd: this.config.storePassword,
                total_amount: order.total.toString(),
                currency: order.currency,
                tran_id: transactionId,
                success_url: `${this.config.returnUrl}/sslcommerz/success`,
                fail_url: `${this.config.returnUrl}/sslcommerz/fail`,
                cancel_url: `${this.config.returnUrl}/sslcommerz/cancel`,
                ipn_url: `${this.config.webhookUrl}/sslcommerz/ipn`,
                cus_name: this.getCustomerName(order),
                cus_email: this.getCustomerEmail(order),
                cus_phone: this.getCustomerPhone(order),
                cus_add1: this.getCustomerAddress(order),
                cus_city: this.getCustomerCity(order),
                cus_country: 'Bangladesh',
                shipping_method: 'NO',
                product_name: `Order ${order.orderNumber}`,
                product_category: 'E-commerce',
                product_profile: 'general',
                multi_card_name: '',
                value_a: order.id,
                value_b: order.orderNumber,
                value_c: order.userId || 'guest',
                value_d: order.addressId
            };
            // Make API request
            const response = await this.apiClient.post('/gwprocess/v4/api.php', new URLSearchParams(paymentRequest).toString());
            // Handle response
            if (response.data.status === 'FAILED' || response.data.failedreason) {
                throw new payment_gateway_interface_1.PaymentGatewayError(response.data.failedreason || 'Payment initiation failed', payment_gateway_interface_1.PaymentErrorType.INITIATION_FAILED, 400, response.data);
            }
            if (!response.data.GatewayPageURL) {
                throw new payment_gateway_interface_1.PaymentGatewayError('Payment URL not received from gateway', payment_gateway_interface_1.PaymentErrorType.GATEWAY_ERROR, 500, response.data);
            }
            return {
                success: true,
                transactionId,
                paymentUrl: response.data.GatewayPageURL,
                gatewayResponse: response.data
            };
        }
        catch (error) {
            if (error instanceof payment_gateway_interface_1.PaymentGatewayError) {
                throw error;
            }
            if (axios_1.default.isAxiosError(error)) {
                throw new payment_gateway_interface_1.PaymentGatewayError('Network error while initiating payment', payment_gateway_interface_1.PaymentErrorType.NETWORK_ERROR, 503, error.response?.data);
            }
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to initiate payment', payment_gateway_interface_1.PaymentErrorType.INITIATION_FAILED, 500);
        }
    }
    /**
     * Validate payment via IPN
     * @param valId - The validation ID from SSLCommerz
     * @returns Payment status
     */
    async validatePayment(valId) {
        try {
            const validationRequest = {
                store_id: this.config.storeId,
                store_passwd: this.config.storePassword,
                val_id: valId,
                format: 'json'
            };
            const response = await this.apiClient.post('/gwprocess/v4/api.php', new URLSearchParams(validationRequest).toString());
            if (!response.data || response.data.status === 'FAILED') {
                throw new payment_gateway_interface_1.PaymentGatewayError(response.data?.failedreason || 'Payment validation failed', payment_gateway_interface_1.PaymentErrorType.VERIFICATION_FAILED, 400, response.data);
            }
            return this.mapGatewayStatus(response.data.status || 'PENDING');
        }
        catch (error) {
            if (error instanceof payment_gateway_interface_1.PaymentGatewayError) {
                throw error;
            }
            if (axios_1.default.isAxiosError(error)) {
                throw new payment_gateway_interface_1.PaymentGatewayError('Network error while validating payment', payment_gateway_interface_1.PaymentErrorType.NETWORK_ERROR, 503, error.response?.data);
            }
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to validate payment', payment_gateway_interface_1.PaymentErrorType.VERIFICATION_FAILED, 500);
        }
    }
    /**
     * Verify a payment
     * @param transactionId - The transaction ID to verify
     * @returns Payment verification result
     */
    async verifyPayment(transactionId) {
        try {
            const validationRequest = {
                store_id: this.config.storeId,
                store_passwd: this.config.storePassword,
                tran_id: transactionId,
                format: 'json'
            };
            const response = await this.apiClient.post('/gwprocess/v4/api.php', new URLSearchParams(validationRequest).toString());
            if (!response.data || response.data.status === 'FAILED') {
                return {
                    success: false,
                    status: 'failed',
                    amount: 0,
                    currency: 'BDT',
                    gatewayResponse: response.data
                };
            }
            return {
                success: true,
                status: this.mapGatewayStatus(response.data.status || 'PENDING'),
                amount: parseFloat(response.data.amount || '0'),
                currency: response.data.currency || 'BDT',
                customerInfo: {
                    name: this.getCustomerNameFromResponse(response.data),
                    email: this.getCustomerEmailFromResponse(response.data),
                    phone: this.getCustomerPhoneFromResponse(response.data)
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
            const refundRequest = {
                store_id: this.config.storeId,
                store_passwd: this.config.storePassword,
                refund_amount: amount.toString(),
                refund_remarks: `Refund for transaction ${transactionId}`,
                tran_id: transactionId,
                bank_tran_id: '',
                refund_reason: 'Customer request'
            };
            const response = await this.apiClient.post('/gwprocess/v4/api.php', new URLSearchParams(refundRequest).toString());
            if (response.data.status === 'FAILED') {
                throw new payment_gateway_interface_1.PaymentGatewayError(response.data.failedreason || 'Refund failed', payment_gateway_interface_1.PaymentErrorType.REFUND_FAILED, 400, response.data);
            }
            return {
                success: true,
                refundId: response.data.tran_id,
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
     * Handle callback from SSLCommerz
     * @param response - Callback response from SSLCommerz
     * @returns Callback handling result
     */
    async handleCallback(response) {
        try {
            // Validate callback
            if (!response.val_id || !response.tran_id) {
                throw new payment_gateway_interface_1.PaymentGatewayError('Invalid callback data', payment_gateway_interface_1.PaymentErrorType.CALLBACK_FAILED, 400);
            }
            // Verify payment status
            const status = await this.validatePayment(response.val_id);
            return {
                success: status === 'completed',
                transactionId: response.tran_id,
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
        return `SSL_${order.orderNumber}_${timestamp}_${random}`;
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
     * Get customer name from order
     * @param order - The order
     * @returns Customer name
     */
    getCustomerName(order) {
        // This would typically come from the order's user or address
        return 'Customer'; // Placeholder - should be implemented based on actual order structure
    }
    /**
     * Get customer email from order
     * @param order - The order
     * @returns Customer email
     */
    getCustomerEmail(order) {
        // This would typically come from the order's user
        return 'customer@example.com'; // Placeholder
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
     * Get customer address from order
     * @param order - The order
     * @returns Customer address
     */
    getCustomerAddress(order) {
        // This would typically come from the order's address
        return 'Dhaka, Bangladesh'; // Placeholder
    }
    /**
     * Get customer city from order
     * @param order - The order
     * @returns Customer city
     */
    getCustomerCity(order) {
        // This would typically come from the order's address
        return 'Dhaka'; // Placeholder
    }
    /**
     * Get customer name from SSLCommerz response
     * @param response - SSLCommerz API response
     * @returns Customer name
     */
    getCustomerNameFromResponse(response) {
        return 'Customer'; // Would be extracted from response if available
    }
    /**
     * Get customer email from SSLCommerz response
     * @param response - SSLCommerz API response
     * @returns Customer email
     */
    getCustomerEmailFromResponse(response) {
        return ''; // Would be extracted from response if available
    }
    /**
     * Get customer phone from SSLCommerz response
     * @param response - SSLCommerz API response
     * @returns Customer phone
     */
    getCustomerPhoneFromResponse(response) {
        return ''; // Would be extracted from response if available
    }
    /**
     * Map gateway status to PaymentStatus enum
     * @param gatewayStatus - SSLCommerz status
     * @returns PaymentStatus
     */
    mapGatewayStatus(gatewayStatus) {
        const statusMap = {
            'VALID': 'completed',
            'VALIDATED': 'completed',
            'PENDING': 'pending',
            'FAILED': 'failed',
            'CANCELLED': 'cancelled'
        };
        return statusMap[gatewayStatus] || 'pending';
    }
    /**
     * Verify IPN signature
     * @param data - IPN data
     * @returns Whether signature is valid
     */
    verifyIPNSignature(data) {
        // Implement signature verification if required by SSLCommerz
        // This would verify that the IPN is actually from SSLCommerz
        return true;
    }
}
exports.SSLCommerzService = SSLCommerzService;
/**
 * Create SSLCommerz service instance
 * @param config - SSLCommerz configuration
 * @returns SSLCommerz service instance
 */
function createSSLCommerzService(config) {
    return new SSLCommerzService(config);
}
