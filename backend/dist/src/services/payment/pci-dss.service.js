"use strict";
/**
 * PCI-DSS Compliance Service
 *
 * This service provides PCI-DSS compliance capabilities including encryption,
 * tokenization, data sanitization, and secure handling of payment data.
 *
 * IMPORTANT: This service follows PCI-DSS requirements:
 * - Never store full card numbers, CVV, or PINs
 * - Encrypt all sensitive payment data at rest and in transit
 * - Use strong encryption algorithms (AES-256)
 * - Implement proper key management
 * - Sanitize all sensitive data before logging
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.pciDssComplianceService = exports.PciDssComplianceService = void 0;
const crypto = __importStar(require("crypto"));
const payment_gateway_interface_1 = require("./payment-gateway.interface");
/**
 * PCI-DSS Compliance Service Class
 */
class PciDssComplianceService {
    constructor(encryptionKey) {
        this.algorithm = 'aes-256-cbc';
        this.hashingAlgorithm = 'sha256';
        // Use provided key or generate one from environment
        const key = encryptionKey || process.env.PCI_ENCRYPTION_KEY || 'default-key-change-in-production';
        // Ensure key is 32 bytes for AES-256
        this.encryptionKey = crypto.createHash('sha256').update(key).digest();
        this.tokenizationEnabled = process.env.TOKENIZATION_ENABLED !== 'false';
    }
    /**
     * Encrypt sensitive payment data
     * @param data - Data to encrypt
     * @returns Encrypted data (Base64 encoded)
     */
    encryptPaymentData(data) {
        try {
            // Generate random initialization vector
            const iv = crypto.randomBytes(16);
            // Create cipher
            const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
            // Encrypt data
            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            // Combine IV and encrypted data
            const combined = iv.toString('hex') + ':' + encrypted;
            // Return Base64 encoded
            return Buffer.from(combined).toString('base64');
        }
        catch (error) {
            console.error('Error encrypting payment data:', error);
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to encrypt payment data', 'ENCRYPTION_FAILED', 500);
        }
    }
    /**
     * Decrypt sensitive payment data
     * @param encryptedData - Encrypted data (Base64 encoded)
     * @returns Decrypted data
     */
    decryptPaymentData(encryptedData) {
        try {
            // Decode Base64
            const combined = Buffer.from(encryptedData, 'base64').toString('utf8');
            // Split IV and encrypted data
            const parts = combined.split(':');
            if (parts.length !== 2) {
                throw new Error('Invalid encrypted data format');
            }
            const iv = Buffer.from(parts[0], 'hex');
            const encrypted = parts[1];
            // Create decipher
            const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
            // Decrypt data
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            console.error('Error decrypting payment data:', error);
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to decrypt payment data', 'DECRYPTION_FAILED', 500);
        }
    }
    /**
     * Tokenize card data
     * @param cardData - Card data to tokenize
     * @returns Token string
     */
    async tokenizeCardData(cardData) {
        if (!this.tokenizationEnabled) {
            throw new payment_gateway_interface_1.PaymentGatewayError('Tokenization is disabled', 'TOKENIZATION_DISABLED', 400);
        }
        try {
            // Validate card data
            this.validateCardData(cardData);
            // Create token from card data hash
            const cardString = `${cardData.cardNumber}|${cardData.expiryMonth}|${cardData.expiryYear}`;
            const hash = this.hashSensitiveData(cardString);
            // Generate secure token
            const timestamp = Date.now().toString();
            const randomPart = crypto.randomBytes(16).toString('hex');
            const token = `tok_${hash.substring(0, 16)}_${timestamp}_${randomPart}`;
            return token;
        }
        catch (error) {
            if (error instanceof payment_gateway_interface_1.PaymentGatewayError) {
                throw error;
            }
            console.error('Error tokenizing card data:', error);
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to tokenize card data', 'TOKENIZATION_FAILED', 500);
        }
    }
    /**
     * Detokenize card data (returns only safe data, never full card number)
     * @param token - Token to detokenize
     * @returns Tokenized card data (without full card number)
     */
    async detokenizeCardData(token) {
        try {
            // Validate token format
            if (!token.startsWith('tok_')) {
                throw new payment_gateway_interface_1.PaymentGatewayError('Invalid token format', 'INVALID_TOKEN', 400);
            }
            // In production, you would look up the token in a secure token vault
            // For now, return a mock response
            const parts = token.split('_');
            const hashPart = parts[1];
            // Extract last 4 digits from hash (in production, this would come from token vault)
            const lastFour = hashPart.substring(hashPart.length - 4);
            return {
                token,
                lastFour,
                cardHolderName: 'Card Holder', // In production, retrieve from token vault
                expiryMonth: '12',
                expiryYear: '25',
                cardType: 'visa'
            };
        }
        catch (error) {
            if (error instanceof payment_gateway_interface_1.PaymentGatewayError) {
                throw error;
            }
            console.error('Error detokenizing card data:', error);
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to detokenize card data', 'DETOKENIZATION_FAILED', 500);
        }
    }
    /**
     * Sanitize payment data for logging
     * Removes sensitive information while preserving useful data
     * @param data - Data to sanitize
     * @returns Sanitized data
     */
    sanitizePaymentData(data) {
        if (!data || typeof data !== 'object') {
            return data;
        }
        const sanitized = { ...data };
        // Remove or mask sensitive fields
        const sensitiveFields = [
            'cardNumber',
            'card_no',
            'card_no',
            'pan',
            'cvv',
            'cvc',
            'cvv2',
            'pin',
            'password',
            'bankAccountNumber',
            'bank_account_number',
            'accountNumber',
            'account_number'
        ];
        for (const key of Object.keys(sanitized)) {
            const lowerKey = key.toLowerCase();
            // Check if this is a sensitive field
            if (sensitiveFields.some(field => lowerKey.includes(field))) {
                // Handle card numbers specially (show last 4)
                if (lowerKey.includes('card') || lowerKey.includes('pan')) {
                    const value = String(sanitized[key]);
                    if (value.length >= 4) {
                        sanitized[key] = '************' + value.substring(value.length - 4);
                    }
                    else {
                        sanitized[key] = '****';
                    }
                }
                else {
                    // Remove completely
                    sanitized[key] = '[REDACTED]';
                }
            }
            // Mask email addresses
            if (lowerKey.includes('email')) {
                const email = String(sanitized[key]);
                const [local, domain] = email.split('@');
                if (local && domain) {
                    const maskedLocal = local.substring(0, 2) + '***' + local.substring(local.length - 1);
                    sanitized[key] = maskedLocal + '@' + domain;
                }
            }
            // Mask phone numbers
            if (lowerKey.includes('phone') || lowerKey.includes('mobile') || lowerKey.includes('msisdn')) {
                const phone = String(sanitized[key]);
                if (phone.length >= 4) {
                    sanitized[key] = phone.substring(0, 3) + '***' + phone.substring(phone.length - 2);
                }
            }
        }
        // Recursively sanitize nested objects
        for (const key of Object.keys(sanitized)) {
            if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
                sanitized[key] = this.sanitizePaymentData(sanitized[key]);
            }
        }
        return sanitized;
    }
    /**
     * Validate PCI-DSS compliance
     * @returns Compliance check result
     */
    validateCompliance() {
        const violations = [];
        const warnings = [];
        let score = 100;
        // Check encryption key
        if (!process.env.PCI_ENCRYPTION_KEY || process.env.PCI_ENCRYPTION_KEY === 'default-key-change-in-production') {
            violations.push('PCI_ENCRYPTION_KEY not set or using default value');
            score -= 30;
        }
        // Check tokenization
        if (!this.tokenizationEnabled) {
            warnings.push('Tokenization is disabled');
            score -= 10;
        }
        // Check environment
        if (process.env.NODE_ENV === 'production') {
            // Additional production checks
            if (process.env.PCI_ENCRYPTION_KEY && process.env.PCI_ENCRYPTION_KEY.length < 32) {
                violations.push('PCI_ENCRYPTION_KEY too short for production');
                score -= 20;
            }
        }
        else {
            warnings.push('Running in non-production environment');
        }
        // Check HTTPS enforcement
        if (process.env.ENFORCE_HTTPS !== 'true') {
            warnings.push('HTTPS enforcement not enabled');
            score -= 5;
        }
        return {
            isCompliant: violations.length === 0,
            violations,
            warnings,
            score
        };
    }
    /**
     * Generate secure random token
     * @returns Secure random token
     */
    generateSecureToken() {
        try {
            const bytes = crypto.randomBytes(32);
            return bytes.toString('hex');
        }
        catch (error) {
            console.error('Error generating secure token:', error);
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to generate secure token', 'TOKEN_GENERATION_FAILED', 500);
        }
    }
    /**
     * Hash sensitive data
     * @param data - Data to hash
     * @returns Hashed data (hex string)
     */
    hashSensitiveData(data) {
        try {
            return crypto
                .createHash(this.hashingAlgorithm)
                .update(data)
                .digest('hex');
        }
        catch (error) {
            console.error('Error hashing sensitive data:', error);
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to hash sensitive data', 'HASHING_FAILED', 500);
        }
    }
    /**
     * Verify data integrity
     * @param data - Data to verify
     * @param hash - Expected hash
     * @returns True if data integrity is valid
     */
    verifyDataIntegrity(data, hash) {
        try {
            const computedHash = this.hashSensitiveData(data);
            return computedHash === hash;
        }
        catch (error) {
            console.error('Error verifying data integrity:', error);
            return false;
        }
    }
    /**
     * Mask card number (show only last 4 digits)
     * @param cardNumber - Card number to mask
     * @returns Masked card number
     */
    maskCardNumber(cardNumber) {
        const cleaned = cardNumber.replace(/\D/g, '');
        if (cleaned.length < 4) {
            return '****';
        }
        return '************' + cleaned.substring(cleaned.length - 4);
    }
    /**
     * Validate card data
     * @param cardData - Card data to validate
     * @throws PaymentGatewayError if validation fails
     */
    validateCardData(cardData) {
        if (!cardData.cardNumber || cardData.cardNumber.length < 13) {
            throw new payment_gateway_interface_1.PaymentGatewayError('Invalid card number', 'INVALID_CARD_NUMBER', 400);
        }
        if (!cardData.expiryMonth || !cardData.expiryYear) {
            throw new payment_gateway_interface_1.PaymentGatewayError('Card expiry date is required', 'INVALID_EXPIRY_DATE', 400);
        }
        // Validate expiry date is in the future
        const now = new Date();
        const expiry = new Date(parseInt(cardData.expiryYear), parseInt(cardData.expiryMonth) - 1, 1);
        if (expiry < now) {
            throw new payment_gateway_interface_1.PaymentGatewayError('Card has expired', 'CARD_EXPIRED', 400);
        }
        // Validate CVV if provided
        if (cardData.cvv && (cardData.cvv.length < 3 || cardData.cvv.length > 4)) {
            throw new payment_gateway_interface_1.PaymentGatewayError('Invalid CVV', 'INVALID_CVV', 400);
        }
    }
    /**
     * Generate HMAC signature for webhook verification
     * @param payload - Payload to sign
     * @param secret - Secret key
     * @returns HMAC signature
     */
    generateHMACSignature(payload, secret) {
        try {
            return crypto
                .createHmac('sha256', secret)
                .update(payload)
                .digest('hex');
        }
        catch (error) {
            console.error('Error generating HMAC signature:', error);
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to generate HMAC signature', 'SIGNATURE_GENERATION_FAILED', 500);
        }
    }
    /**
     * Verify HMAC signature
     * @param payload - Payload to verify
     * @param signature - Signature to verify
     * @param secret - Secret key
     * @returns True if signature is valid
     */
    verifyHMACSignature(payload, signature, secret) {
        try {
            const computedSignature = this.generateHMACSignature(payload, secret);
            return crypto.timingSafeEqual(Buffer.from(computedSignature), Buffer.from(signature));
        }
        catch (error) {
            console.error('Error verifying HMAC signature:', error);
            return false;
        }
    }
    /**
     * Generate secure random number
     * @param min - Minimum value
     * @param max - Maximum value
     * @returns Random number
     */
    generateSecureRandomNumber(min, max) {
        try {
            const range = max - min + 1;
            const bytes = crypto.randomBytes(4);
            const randomInt = bytes.readUInt32BE(0);
            return min + (randomInt % range);
        }
        catch (error) {
            console.error('Error generating secure random number:', error);
            throw new payment_gateway_interface_1.PaymentGatewayError('Failed to generate secure random number', 'RANDOM_GENERATION_FAILED', 500);
        }
    }
}
exports.PciDssComplianceService = PciDssComplianceService;
// Export singleton instance
exports.pciDssComplianceService = new PciDssComplianceService();
