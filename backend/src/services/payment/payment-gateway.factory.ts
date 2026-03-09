/**
 * Payment Gateway Factory
 * 
 * This factory provides a unified interface for instantiating payment gateway
 * services based on the payment method. It manages gateway configuration
 * and provides a single point of access to all payment gateways.
 */

import { PaymentMethod } from '@prisma/client';
import {
  PaymentGateway,
  PaymentGatewayError,
  PaymentErrorType,
  GatewayConfig
} from './payment-gateway.interface';
import {
  SSLCommerzService,
  SSLCommerzConfig,
  createSSLCommerzService
} from './sslcommerz.service';
import {
  BkashService,
  BkashConfig,
  createBkashService
} from './bkash.service';
import {
  NagadService,
  NagadConfig,
  createNagadService
} from './nagad.service';

/**
 * Gateway Configuration Map
 */
export interface GatewayConfiguration {
  sslcommerz?: SSLCommerzConfig;
  bkash?: BkashConfig;
  nagad?: NagadConfig;
}

/**
 * Payment Gateway Factory Class
 */
export class PaymentGatewayFactory {
  private static instance: PaymentGatewayFactory;
  private gateways: Map<string, PaymentGateway>;
  private config: GatewayConfiguration;

  private constructor(config: GatewayConfiguration = {}) {
    this.config = config;
    this.gateways = new Map();
    this.initializeGateways();
  }

  /**
   * Get singleton instance of PaymentGatewayFactory
   * @param config - Gateway configuration
   * @returns PaymentGatewayFactory instance
   */
  static getInstance(config?: GatewayConfiguration): PaymentGatewayFactory {
    if (!PaymentGatewayFactory.instance) {
      PaymentGatewayFactory.instance = new PaymentGatewayFactory(config);
    }
    return PaymentGatewayFactory.instance;
  }

  /**
   * Initialize payment gateways
   */
  private initializeGateways(): void {
    // Initialize SSLCommerz if configured
    if (this.config.sslcommerz) {
      try {
        const sslcommerzGateway = createSSLCommerzService(
          this.config.sslcommerz
        );
        this.gateways.set('sslcommerz', sslcommerzGateway);
        this.gateways.set('credit_card', sslcommerzGateway);
      } catch (error) {
        console.error('Failed to initialize SSLCommerz gateway:', error);
      }
    }

    // Initialize bKash if configured
    if (this.config.bkash) {
      try {
        const bkashGateway = createBkashService(this.config.bkash);
        this.gateways.set('bkash', bkashGateway);
      } catch (error) {
        console.error('Failed to initialize bKash gateway:', error);
      }
    }

    // Initialize Nagad if configured
    if (this.config.nagad) {
      try {
        const nagadGateway = createNagadService(this.config.nagad);
        this.gateways.set('nagad', nagadGateway);
      } catch (error) {
        console.error('Failed to initialize Nagad gateway:', error);
      }
    }
  }

  /**
   * Get payment gateway by payment method
   * @param paymentMethod - The payment method
   * @returns Payment gateway instance
   * @throws PaymentGatewayError if gateway not found
   */
  getGateway(paymentMethod: PaymentMethod): PaymentGateway {
    const gatewayKey = this.mapPaymentMethodToGateway(paymentMethod);
    const gateway = this.gateways.get(gatewayKey);

    if (!gateway) {
      throw new PaymentGatewayError(
        `Payment gateway not configured for payment method: ${paymentMethod}`,
        PaymentErrorType.INVALID_REQUEST,
        404
      );
    }

    return gateway;
  }

  /**
   * Get payment gateway by name
   * @param gatewayName - The gateway name
   * @returns Payment gateway instance
   * @throws PaymentGatewayError if gateway not found
   */
  getGatewayByName(gatewayName: string): PaymentGateway {
    const gateway = this.gateways.get(gatewayName.toLowerCase());

    if (!gateway) {
      throw new PaymentGatewayError(
        `Payment gateway not found: ${gatewayName}`,
        PaymentErrorType.INVALID_REQUEST,
        404
      );
    }

    return gateway;
  }

  /**
   * Check if gateway is available
   * @param paymentMethod - The payment method
   * @returns Whether gateway is available
   */
  isGatewayAvailable(paymentMethod: PaymentMethod): boolean {
    try {
      const gatewayKey = this.mapPaymentMethodToGateway(paymentMethod);
      return this.gateways.has(gatewayKey);
    } catch {
      return false;
    }
  }

  /**
   * Get all available gateways
   * @returns Array of available gateway names
   */
  getAvailableGateways(): string[] {
    return Array.from(this.gateways.keys());
  }

  /**
   * Get all available payment methods
   * @returns Array of available payment methods
   */
  getAvailablePaymentMethods(): PaymentMethod[] {
    const availableGateways = this.getAvailableGateways();
    const paymentMethods: PaymentMethod[] = [];

    for (const gatewayKey of availableGateways) {
      const gateway = this.gateways.get(gatewayKey);
      if (gateway) {
        const paymentMethod = this.mapGatewayToPaymentMethod(gateway.name);
        if (paymentMethod) {
          paymentMethods.push(paymentMethod);
        }
      }
    }

    return paymentMethods;
  }

  /**
   * Reload gateway configuration
   * @param config - New gateway configuration
   */
  reloadConfiguration(config: GatewayConfiguration): void {
    this.config = config;
    this.gateways.clear();
    this.initializeGateways();
  }

  /**
   * Map payment method to gateway key
   * @param paymentMethod - The payment method
   * @returns Gateway key
   */
  private mapPaymentMethodToGateway(paymentMethod: PaymentMethod): string {
    const methodMap: Record<PaymentMethod, string> = {
      credit_card: 'sslcommerz',
      bkash: 'bkash',
      nagad: 'nagad',
      bank_transfer: 'sslcommerz',
      cash_on_delivery: 'sslcommerz',
      emi: 'sslcommerz',
      mcash: 'sslcommerz',
      rocket: 'sslcommerz'
    };

    return methodMap[paymentMethod] || paymentMethod;
  }

  /**
   * Map gateway name to payment method
   * @param gatewayName - The gateway name
   * @returns Payment method
   */
  private mapGatewayToPaymentMethod(gatewayName: string): PaymentMethod | null {
    const gatewayMap: Record<string, PaymentMethod> = {
      'SSLCommerz': 'credit_card',
      'bKash': 'bkash',
      'Nagad': 'nagad'
    };

    return gatewayMap[gatewayName] || null;
  }

  /**
   * Load configuration from environment variables
   * @returns Gateway configuration
   */
  static loadConfigurationFromEnv(): GatewayConfiguration {
    const config: GatewayConfiguration = {};

    // SSLCommerz configuration
    if (process.env.SSLCOMMERZ_STORE_ID && 
        process.env.SSLCOMMERZ_STORE_PASSWORD) {
      config.sslcommerz = {
        isActive: true,
        isTestMode: process.env.SSLCOMMERZ_IS_LIVE !== 'true',
        storeId: process.env.SSLCOMMERZ_STORE_ID,
        storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD,
        isLive: process.env.SSLCOMMERZ_IS_LIVE === 'true',
        webhookUrl: process.env.PAYMENT_WEBHOOK_URL || '',
        returnUrl: process.env.PAYMENT_RETURN_URL || '',
        config: {}
      };
    }

    // bKash configuration
    if (process.env.BKASH_API_KEY && 
        process.env.BKASH_API_SECRET &&
        process.env.BKASH_USERNAME &&
        process.env.BKASH_PASSWORD) {
      config.bkash = {
        isActive: true,
        isTestMode: !process.env.BKASH_BASE_URL?.includes('pay.bka.sh'),
        apiKey: process.env.BKASH_API_KEY,
        apiSecret: process.env.BKASH_API_SECRET,
        username: process.env.BKASH_USERNAME,
        password: process.env.BKASH_PASSWORD,
        baseUrl: process.env.BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh',
        webhookUrl: process.env.PAYMENT_WEBHOOK_URL || '',
        returnUrl: process.env.PAYMENT_RETURN_URL || '',
        config: {}
      };
    }

    // Nagad configuration
    if (process.env.NAGAD_API_KEY && 
        process.env.NAGAD_API_SECRET &&
        process.env.NAGAD_MERCHANT_ID &&
        process.env.NAGAD_PUBLIC_KEY &&
        process.env.NAGAD_PRIVATE_KEY) {
      config.nagad = {
        isActive: true,
        isTestMode: !process.env.NAGAD_BASE_URL?.includes('api.nagad.com'),
        apiKey: process.env.NAGAD_API_KEY,
        apiSecret: process.env.NAGAD_API_SECRET,
        merchantId: process.env.NAGAD_MERCHANT_ID,
        publicKey: process.env.NAGAD_PUBLIC_KEY,
        privateKey: process.env.NAGAD_PRIVATE_KEY,
        baseUrl: process.env.NAGAD_BASE_URL || 'https://api.sandbox.nagad.com',
        webhookUrl: process.env.PAYMENT_WEBHOOK_URL || '',
        returnUrl: process.env.PAYMENT_RETURN_URL || '',
        config: {}
      };
    }

    return config;
  }

  /**
   * Create factory instance with environment configuration
   * @returns PaymentGatewayFactory instance
   */
  static createFromEnv(): PaymentGatewayFactory {
    const config = PaymentGatewayFactory.loadConfigurationFromEnv();
    return PaymentGatewayFactory.getInstance(config);
  }
}

/**
 * Export singleton instance
 */
export const paymentGatewayFactory = PaymentGatewayFactory.createFromEnv();
