const { loggerService } = require('./logger');
const { databaseService } = require('./database');

/**
 * Local Payment Service
 * Handles Bangladesh-specific local payment methods (bKash, Nagad, Rocket, SureCash)
 * and SMS subscription management
 */
class LocalPaymentService {
  constructor() {
    // Use shared database service instance instead of creating new PrismaClient
    this.prisma = databaseService.getClient();
    
    this.logger = loggerService;
    
    // Bangladesh-specific configuration
    this.smsSubscriptionAmount = 30; // BDT 30/month for premium features
    this.smsSubscriptionDuration = 30; // 30 days
  }

  /**
   * Get all active local payment methods
   * @returns {Promise<Array>} List of active local payment methods
   */
  async getLocalPaymentMethods() {
    const maxRetries = 3;
    const initialDelay = 500; // Reduced from 1000ms to 500ms
    const queryTimeout = 5000; // 5 second timeout for database query
    
    console.log('[getLocalPaymentMethods] Starting to fetch payment methods...');
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[getLocalPaymentMethods] Attempt ${attempt}/${maxRetries}`);
        
        // Check database availability before querying
        console.log('[getLocalPaymentMethods] Checking database availability...');
        const isAvailable = await this.prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
        if (!isAvailable) {
          console.log('[getLocalPaymentMethods] Database not available');
          this.logger.warn('[getLocalPaymentMethods] Database not available, retrying...', {
            attempt,
            maxRetries
          });
          
          if (attempt < maxRetries) {
            const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
            console.log(`[getLocalPaymentMethods] Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          } else {
            throw new Error('Database not available after all retries');
          }
        }
        
        console.log('[getLocalPaymentMethods] Database available, executing query...');
        
        // Add timeout to the database query
        const queryPromise = this.prisma.localPaymentMethod.findMany({
          orderBy: {
            name: 'asc'
          }
        });
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            console.log('[getLocalPaymentMethods] Query timeout after', queryTimeout, 'ms');
            reject(new Error(`Database query timeout after ${queryTimeout}ms`));
          }, queryTimeout);
        });
        
        const methods = await Promise.race([queryPromise, timeoutPromise]);

        console.log('[getLocalPaymentMethods] Successfully fetched', methods.length, 'payment methods');

        this.logger.info('[getLocalPaymentMethods] Fetched local payment methods', {
          count: methods.length,
          attempt
        });

        return methods;
      } catch (error) {
        console.log('[getLocalPaymentMethods] Error on attempt', attempt + ':', error.message);
        
        const shouldRetry = 
          error.code === 'P1001' || // Connection timeout
          error.code === 'P1000' || // Authentication failed
          error.message.includes('timeout') || // Timeout errors
          error.message.includes('ETIMEDOUT') || // Network timeout
          error.message.includes('ECONNREFUSED') || // Connection refused
          error.message.includes('Database query timeout'); // Our custom timeout

        if (shouldRetry && attempt < maxRetries) {
          const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`[getLocalPaymentMethods] Retrying in ${delay}ms...`);
          this.logger.warn('[getLocalPaymentMethods] Retry attempt', {
            attempt,
            maxRetries,
            delay,
            error: error.message,
            code: error.code
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.log('[getLocalPaymentMethods] Giving up after', attempt, 'attempts');
          this.logger.error('[getLocalPaymentMethods] Error fetching local payment methods', {
            error: error.message,
            code: error.code,
            attempt,
            maxRetries
          });
          throw error;
        }
      }
    }
  }

  /**
   * Get payment method by code
   * @param {string} code - The payment method code (e.g., 'bkash', 'nagad')
   * @returns {Promise<Object>} Payment method details
   */
  async getPaymentMethodByCode(code) {
    const maxRetries = 3;
    const initialDelay = 1000; // 1 second
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const method = await this.prisma.local_payment_methods.findUnique({
          where: { code: code }
        });

        if (!method) {
          throw new Error(`Payment method '${code}' not found`);
        }

        this.logger.info('[getPaymentMethodByCode] Payment method retrieved', { code, attempt });
        return method;
      } catch (error) {
        const shouldRetry = 
          error.code === 'P1001' || // Connection timeout
          error.code === 'P1000' || // Authentication failed
          error.message.includes('timeout') || 
          error.message.includes('ETIMEDOUT') || 
          error.message.includes('ECONNREFUSED');

        if (shouldRetry && attempt < maxRetries) {
          const delay = initialDelay * Math.pow(2, attempt - 1);
          this.logger.warn('[getPaymentMethodByCode] Retry attempt', { attempt, delay, error: error.message });
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          this.logger.error('[getPaymentMethodByCode] Error getting payment method', { code, error: error.message });
          throw error;
        }
      }
    }
  }

  /**
   * Calculate payment fee for a given amount and method
   * Fee = (Amount × ProcessingFeePercent / 100) + ProcessingFee
   * 
   * @param {number} amount - The payment amount
   * @param {string} methodCode - The payment method code
   * @returns {Promise<Object>} Fee calculation result
   */
  async calculatePaymentFee(amount, methodCode) {
    try {
      const amountValue = parseFloat(amount);
      const method = await this.getPaymentMethodByCode(methodCode);

      // Calculate fee
      const percentageFee = (amountValue * method.processingFeePercent) / 100;
      const totalFee = percentageFee + parseFloat(method.processingFee);
      const totalAmount = amountValue + totalFee;

      const result = {
        amount: amountValue,
        processingFee: parseFloat(method.processingFee),
        processingFeePercent: parseFloat(method.processingFeePercent),
        percentageFee: parseFloat(percentageFee.toFixed(2)),
        totalFee: parseFloat(totalFee.toFixed(2)),
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        paymentMethod: {
          code: method.code,
          name: method.name,
          displayName: method.displayName
        }
      };

      this.logger.info('[calculatePaymentFee] Payment fee calculated', {
        amount: amountValue,
        methodCode,
        totalFee: result.totalFee,
        totalAmount: result.totalAmount
      });

      return result;
    } catch (error) {
      this.logger.error('[calculatePaymentFee] Error calculating payment fee', {
        amount,
        methodCode,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Validate payment method for a given amount
   * @param {string} methodCode - The payment method code
   * @param {number} amount - The payment amount
   * @returns {Promise<Object>} Validation result
   */
  async validatePaymentMethod(methodCode, amount) {
    try {
      const amountValue = parseFloat(amount);
      const method = await this.getPaymentMethodByCode(methodCode);

      const result = {
        valid: true,
        reason: null,
        paymentMethod: {
          code: method.code,
          name: method.name,
          displayName: method.displayName,
          minAmount: parseFloat(method.minAmount),
          maxAmount: parseFloat(method.maxAmount),
          requiresPhone: method.requiresPhone,
          requiresPin: method.requiresPin,
          supportedNetworks: method.supportedNetworks
        }
      };

      // Check if payment method is active
      if (!method.isActive) {
        result.valid = false;
        result.reason = 'Payment method is not currently available';
        return result;
      }

      // Check minimum amount
      if (amountValue < parseFloat(method.minAmount)) {
        result.valid = false;
        result.reason = `Minimum amount for ${method.displayName} is BDT ${parseFloat(method.minAmount).toLocaleString()}`;
        return result;
      }

      // Check maximum amount
      if (amountValue > parseFloat(method.maxAmount)) {
        result.valid = false;
        result.reason = `Maximum amount for ${method.displayName} is BDT ${parseFloat(method.maxAmount).toLocaleString()}`;
        return result;
      }

      this.logger.info('[validatePaymentMethod] Payment method validated', {
        methodCode,
        amount: amountValue,
        valid: result.valid
      });

      return result;
    } catch (error) {
      this.logger.error('[validatePaymentMethod] Error validating payment method', {
        methodCode,
        amount,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Process local payment (placeholder for actual integration)
   * This would integrate with actual payment gateway APIs
   * 
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Payment processing result
   */
  async processLocalPayment(paymentData) {
    try {
      const {
        userId,
        methodCode,
        amount,
        phoneNumber,
        pin,
        orderId
      } = paymentData;

      // Validate payment method
      const validation = await this.validatePaymentMethod(methodCode, amount);
      if (!validation.valid) {
        throw new Error(validation.reason);
      }

      // Get payment method details
      const method = await this.getPaymentMethodByCode(methodCode);

      // Calculate fee
      const feeCalculation = await this.calculatePaymentFee(amount, methodCode);

      // Placeholder: In production, this would call the actual payment gateway API
      // For now, we simulate a successful payment
      const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const result = {
        success: true,
        transactionId: transactionId,
        paymentMethod: {
          code: method.code,
          name: method.name,
          displayName: method.displayName
        },
        amount: parseFloat(amount),
        fee: feeCalculation.totalFee,
        totalAmount: feeCalculation.totalAmount,
        status: 'completed',
        userId,
        orderId,
        phoneNumber,
        processedAt: new Date().toISOString()
      };

      this.logger.info('[processLocalPayment] Local payment processed successfully', {
        userId,
        methodCode,
        amount,
        transactionId
      });

      return result;
    } catch (error) {
      this.logger.error('[processLocalPayment] Error processing local payment', {
        paymentData,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create SMS subscription for premium features
   * @param {string} userId - User ID
   * @param {string} phoneNumber - Phone number
   * @param {string} paymentMethod - Payment method code
   * @returns {Promise<Object>} SMS subscription details
   */
  async createSmsSubscription(userId, phoneNumber, paymentMethod) {
    try {
      // Validate payment method
      const method = await this.getPaymentMethodByCode(paymentMethod);
      if (!method.isActive) {
        throw new Error('Payment method is not active');
      }

      // Check if user already has an active subscription
      const existingSubscription = await this.prisma.sms_subscriptions.findUnique({
        where: {
          userId: userId
        }
      });

      if (existingSubscription && existingSubscription.isSubscribed) {
        throw new Error('User already has an active SMS subscription');
      }

      // Calculate next payment date
      const now = new Date();
      const nextPaymentAt = new Date(now);
      nextPaymentAt.setDate(nextPaymentAt.getDate() + this.smsSubscriptionDuration);

      // Create subscription
      const subscription = await this.prisma.smsSubscription.create({
        data: {
          userId: userId,
          phoneNumber: phoneNumber,
          paymentMethod: paymentMethod,
          isSubscribed: true,
          amount: this.smsSubscriptionAmount,
          status: 'active',
          lastPaymentAt: now,
          nextPaymentAt: nextPaymentAt
        }
      });

      this.logger.info('[createSmsSubscription] SMS subscription created', {
        userId,
        phoneNumber,
        paymentMethod,
        subscriptionId: subscription.id
      });

      return subscription;
    } catch (error) {
      this.logger.error('[createSmsSubscription] Error creating SMS subscription', {
        userId,
        phoneNumber,
        paymentMethod,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get SMS subscription for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} SMS subscription details
   */
  async getSmsSubscription(userId) {
    try {
      const subscription = await this.prisma.smsSubscription.findUnique({
        where: {
          userId: userId
        }
      });

      if (!subscription) {
        return null;
      }

      this.logger.info('[getSmsSubscription] SMS subscription retrieved', {
        userId,
        isSubscribed: subscription.isSubscribed
      });

      return subscription;
    } catch (error) {
      this.logger.error('[getSmsSubscription] Error getting SMS subscription', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update SMS subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated subscription details
   */
  async updateSmsSubscription(subscriptionId, data) {
    try {
      const subscription = await this.prisma.smsSubscription.update({
        where: {
          id: subscriptionId
        },
        data: data
      });

      this.logger.info('[updateSmsSubscription] SMS subscription updated', {
        subscriptionId,
        data: Object.keys(data)
      });

      return subscription;
    } catch (error) {
      this.logger.error('[updateSmsSubscription] Error updating SMS subscription', {
        subscriptionId,
        data,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Cancel SMS subscription
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Cancelled subscription details
   */
  async cancelSmsSubscription(subscriptionId) {
    try {
      const subscription = await this.prisma.smsSubscription.update({
        where: {
          id: subscriptionId
        },
        data: {
          isSubscribed: false,
          status: 'cancelled'
        }
      });

      this.logger.info('[cancelSmsSubscription] SMS subscription cancelled', {
        subscriptionId
      });

      return subscription;
    } catch (error) {
      this.logger.error('[cancelSmsSubscription] Error cancelling SMS subscription', {
        subscriptionId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get payment instructions for a method
   * @param {string} methodCode - Payment method code
   * @param {string} language - Language preference ('en' or 'bn')
   * @returns {Promise<Object>} Payment instructions
   */
  async getPaymentInstructions(methodCode, language = 'en') {
    try {
      const method = await this.getPaymentMethodByCode(methodCode);

      let instructions = [];
      if (method.instructions) {
        try {
          instructions = JSON.parse(method.instructions);
        } catch (e) {
          this.logger.warn('[getPaymentInstructions] Failed to parse instructions JSON', {
            methodCode,
            error: e.message
          });
        }
      }

      // Filter by language if specified
      const filteredInstructions = instructions.map(step => ({
        step: step.step,
        title: language === 'bn' ? step.title_bn : step.title_en,
        description: language === 'bn' ? step.description_bn : step.description_en
      }));

      this.logger.info('[getPaymentInstructions] Payment instructions retrieved', {
        methodCode,
        language,
        stepsCount: filteredInstructions.length
      });

      return {
        paymentMethod: {
          code: method.code,
          name: method.name,
          displayName: method.displayName
        },
        instructions: filteredInstructions
      };
    } catch (error) {
      this.logger.error('[getPaymentInstructions] Error getting payment instructions', {
        methodCode,
        language,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get all SMS subscriptions (admin function)
   * @returns {Promise<Array>} List of all SMS subscriptions
   */
  async getAllSmsSubscriptions() {
    try {
      const subscriptions = await this.prisma.smsSubscription.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });

      this.logger.info('[getAllSmsSubscriptions] All SMS subscriptions retrieved', {
        count: subscriptions.length
      });

      return subscriptions;
    } catch (error) {
      this.logger.error('[getAllSmsSubscriptions] Error getting all SMS subscriptions', {
        error: error.message
      });
      throw error;
    }
  }

  /**
    * Get local payment configuration (for frontend display)
    * @returns {Promise<Object>} Local payment configuration
    */
  async getLocalPaymentConfiguration() {
    try {
      const methods = await this.getLocalPaymentMethods();
      
      const configuration = {
        smsSubscriptionAmount: this.smsSubscriptionAmount,
        smsSubscriptionDuration: this.smsSubscriptionDuration,
        paymentMethods: methods.map(method => ({
          id: method.id,
          name: method.name,
          code: method.code,
          displayName: method.displayName,
          logoUrl: method.logoUrl,
          minAmount: parseFloat(method.minAmount),
          maxAmount: parseFloat(method.maxAmount),
          processingFee: parseFloat(method.processingFee),
          processingFeePercent: parseFloat(method.processingFeePercent),
          requiresPhone: method.requiresPhone,
          requiresPin: method.requiresPin,
          description: method.description,
          supportedNetworks: method.supportedNetworks
        }))
      };

      this.logger.info('[getLocalPaymentConfiguration] Local payment configuration retrieved', {
        methodsCount: methods.length
      });

      return configuration;
    } catch (error) {
      this.logger.error('[getLocalPaymentConfiguration] Error getting local payment configuration', {
        error: error.message
      });
      throw error;
    }
  }

  /**
     * Create payment method
     * @param {Object} methodData - Payment method data
     * @returns {Promise<Object>} Created payment method
     */
  async createPaymentMethod(methodData) {
    const maxRetries = 3;
    const initialDelay = 1000; // 1 second
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Ensure database is available before attempting operation
        const isAvailable = await this.prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
        if (!isAvailable) {
          this.logger.warn('[createPaymentMethod] Database not available, retrying...', {
            attempt,
            maxRetries
          });
          
          if (attempt < maxRetries) {
            const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }

        const paymentMethod = await this.prisma.localPaymentMethod.create({
          data: methodData
        });
        
        this.logger.info('[createPaymentMethod] Payment method created successfully', {
          code: paymentMethod.code,
          name: paymentMethod.name,
          attempt
        });
        
        return paymentMethod;
      } catch (error) {
        const shouldRetry = 
          error.code === 'P1001' || // Connection timeout
          error.code === 'P1000' || // Authentication failed
          error.message.includes('timeout') || // Timeout errors
          error.message.includes('ETIMEDOUT') || // Network timeout
          error.message.includes('ECONNREFUSED') || // Connection refused
          error.message.includes('deadlock') || // Database deadlock
          error.message.includes('connection'); // Connection issues

        if (shouldRetry && attempt < maxRetries) {
          const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
          this.logger.warn('[createPaymentMethod] Retry attempt', {
            attempt,
            maxRetries,
            delay,
            error: error.message,
            code: error.code
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          this.logger.error('[createPaymentMethod] Error creating payment method', { 
            error: error.message,
            code: error.code,
            attempt,
            maxRetries
          });
          throw error;
        }
      }
    }
  }

  /**
     * Update payment method
     * @param {string} methodId - Payment method ID
     * @param {Object} methodData - Updated payment method data
     * @returns {Promise<Object>} Updated payment method
     */
  async updatePaymentMethod(methodId, methodData) {
    const maxRetries = 3;
    const initialDelay = 1000; // 1 second
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Ensure database is available before attempting operation
        const isAvailable = await this.prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
        if (!isAvailable) {
          this.logger.warn('[updatePaymentMethod] Database not available, retrying...', {
            attempt,
            maxRetries
          });
          
          if (attempt < maxRetries) {
            const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }

        const paymentMethod = await this.prisma.localPaymentMethod.update({
          where: { id: methodId },
          data: methodData
        });
        
        this.logger.info('[updatePaymentMethod] Payment method updated successfully', {
          methodId,
          attempt
        });
        
        return paymentMethod;
      } catch (error) {
        const shouldRetry = 
          error.code === 'P1001' || // Connection timeout
          error.code === 'P1000' || // Authentication failed
          error.message.includes('timeout') || // Timeout errors
          error.message.includes('ETIMEDOUT') || // Network timeout
          error.message.includes('ECONNREFUSED') || // Connection refused
          error.message.includes('deadlock') || // Database deadlock
          error.message.includes('connection'); // Connection issues

        if (shouldRetry && attempt < maxRetries) {
          const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
          this.logger.warn('[updatePaymentMethod] Retry attempt', {
            attempt,
            maxRetries,
            delay,
            error: error.message,
            code: error.code
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          this.logger.error('[updatePaymentMethod] Error updating payment method', { 
            error: error.message,
            code: error.code,
            attempt,
            maxRetries
          });
          throw error;
        }
      }
    }
  }

  /**
     * Delete payment method
     * @param {string} methodId - Payment method ID
     * @returns {Promise<Object>} Deletion result
     */
  async deletePaymentMethod(methodId) {
    const maxRetries = 3;
    const initialDelay = 1000; // 1 second
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Ensure database is available before attempting operation
        const isAvailable = await this.prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
        if (!isAvailable) {
          this.logger.warn('[deletePaymentMethod] Database not available, retrying...', {
            attempt,
            maxRetries
          });
          
          if (attempt < maxRetries) {
            const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }

        await this.prisma.localPaymentMethod.delete({
          where: { id: methodId }
        });
        
        this.logger.info('[deletePaymentMethod] Payment method deleted successfully', {
          methodId,
          attempt
        });
        
        return { success: true };
      } catch (error) {
        const shouldRetry = 
          error.code === 'P1001' || // Connection timeout
          error.code === 'P1000' || // Authentication failed
          error.message.includes('timeout') || // Timeout errors
          error.message.includes('ETIMEDOUT') || // Network timeout
          error.message.includes('ECONNREFUSED') || // Connection refused
          error.message.includes('deadlock') || // Database deadlock
          error.message.includes('connection'); // Connection issues

        if (shouldRetry && attempt < maxRetries) {
          const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
          this.logger.warn('[deletePaymentMethod] Retry attempt', {
            attempt,
            maxRetries,
            delay,
            error: error.message,
            code: error.code
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          this.logger.error('[deletePaymentMethod] Error deleting payment method', { 
            error: error.message,
            code: error.code,
            attempt,
            maxRetries
          });
          throw error;
        }
      }
    }
  }
}

// Singleton instance
const localPaymentService = new LocalPaymentService();

module.exports = {
  LocalPaymentService,
  localPaymentService
};
