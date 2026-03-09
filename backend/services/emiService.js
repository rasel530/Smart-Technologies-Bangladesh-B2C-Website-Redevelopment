const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('./logger');

/**
 * EMI Service
 * Handles EMI (Equated Monthly Installment) calculations and plan management
 * for Bangladesh-specific payment options
 */
class EmiService {
  constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
    
    this.prisma.$connect()
      .then(() => {
        this.logger.info('[EmiService] Database connection established successfully');
      })
      .catch((error) => {
        this.logger.error('[EmiService] Failed to connect to database', {
          error: error.message,
          code: error.code
        });
      });
    
    this.logger = loggerService;
    
    // Bangladesh-specific EMI configuration
    this.minAmount = 5000; // BDT 5,000 minimum
    this.maxAmount = 500000; // BDT 500,000 maximum
    this.defaultDurations = [3, 6, 9, 12, 18, 24]; // Default durations in months
  }

  /**
   * Get all EMI providers with optional filtering
   * @param {Object} filters - Optional filters { search, isActive }
   * @returns {Promise<Array>} List of EMI providers
   */
  async getEmiProviders(filters = {}) {
    try {
      const { search, isActive } = filters;
      this.logger.info('[getEmiProviders] Attempting to fetch EMI providers', { filters });

      // Build where clause
      const where = {};

      // Filter by active status
      if (isActive !== undefined) {
        where.isActive = isActive;
      } else {
        // Default to active only if no filter specified
        where.isActive = true;
      }

      // Filter by search query (search in provider name)
      if (search && search.trim()) {
        const searchTerm = search.trim();
        
      // If we have other filters, combine with AND
      if (where.isActive !== undefined) {
        where.AND = [
          { isActive: where.isActive },
          { name: { contains: searchTerm, mode: 'insensitive' } }
        ];
        delete where.isActive;
      } else {
        // No other filters, just use search
        where.OR = [
          { name: { contains: searchTerm, mode: 'insensitive' } }
        ];
      }
      }

      this.logger.info('[getEmiProviders] Prisma where clause', { where });

      const providers = await this.prisma.emi_providers.findMany({
        where,
        orderBy: {
          name: 'asc'
        },
        include: {
          emiPlans: {
            where: {
              isActive: true
            },
            orderBy: [
              { displayOrder: 'asc' },
              { duration: 'asc' }
            ]
          }
        }
      });

      this.logger.info('[getEmiProviders] Fetched EMI providers successfully', {
        count: providers.length,
        filters
      });

      return providers;
    } catch (error) {
      this.logger.error('[getEmiProviders] Error fetching EMI providers', {
        error: error.message,
        code: error.code,
        meta: error.meta,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get all EMI plans with optional filtering
   * @param {Object} filters - Optional filters { search, isActive, providerId }
   * @returns {Promise<Array>} List of EMI plans with provider info
   */
  async getEmiPlans(filters = {}) {
    try {
      const { search, isActive, providerId } = filters;
      this.logger.info('[getEmiPlans] Attempting to fetch EMI plans', { filters });

      // Build where clause
      const where = {};

      // Filter by active status
      if (isActive !== undefined) {
        where.isActive = isActive;
      } else {
        // Default to active only if no filter specified
        where.isActive = true;
      }

      // Filter by provider ID
      if (providerId) {
        where.providerId = providerId;
      }

      // Filter by search query (search in plan name or provider name)
      if (search && search.trim()) {
        const searchTerm = search.trim();
        const searchCondition = {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { provider: { name: { contains: searchTerm, mode: 'insensitive' } } }
          ]
        };
        
        // If we have other filters, combine with AND
        if (where.isActive !== undefined || where.providerId !== undefined) {
          const andConditions = [];
          if (where.isActive !== undefined) {
            andConditions.push({ isActive: where.isActive });
            delete where.isActive;
          }
          if (where.providerId !== undefined) {
            andConditions.push({ providerId: where.providerId });
            delete where.providerId;
          }
          andConditions.push(searchCondition);
          where.AND = andConditions;
        } else {
          // No other filters, just use search - spread the OR condition directly
          where.OR = searchCondition.OR;
        }
      }

      const plans = await this.prisma.emi_plans.findMany({
        where,
        orderBy: [
          { displayOrder: 'asc' },
          { duration: 'asc' }
        ],
        include: {
          provider: true
        }
      });

      this.logger.info('[getEmiPlans] Fetched EMI plans successfully', {
        count: plans.length,
        filters
      });

      return plans;
    } catch (error) {
      this.logger.error('[getEmiPlans] Error fetching EMI plans', {
        error: error.message,
        code: error.code,
        meta: error.meta,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get EMI plans available for a given amount
   * @param {number} amount - The amount to check EMI eligibility for
   * @returns {Promise<Array>} List of eligible EMI plans
   */
  async getAvailableEmiPlans(amount) {
    try {
      const amountValue = parseFloat(amount);
      
      // Validate amount is within global limits
      if (amountValue < this.minAmount || amountValue > this.maxAmount) {
        this.logger.info('[getAvailableEmiPlans] Amount outside EMI range', {
          amount: amountValue,
          minAmount: this.minAmount,
          maxAmount: this.maxAmount
        });
        return [];
      }

      // Get all active plans that support the amount
      const plans = await this.prisma.emi_plans.findMany({
        where: {
          isActive: true,
          minAmount: {
            lte: amountValue
          },
          maxAmount: {
            gte: amountValue
          }
        },
        orderBy: [
          { displayOrder: 'asc' },
          { duration: 'asc' }
        ],
        include: {
          provider: true
        }
      });

      this.logger.info('[getAvailableEmiPlans] Fetched available EMI plans', {
        amount: amountValue,
        count: plans.length
      });

      return plans;
    } catch (error) {
      this.logger.error('[getAvailableEmiPlans] Error fetching available EMI plans', {
        amount,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Calculate EMI amount using the standard EMI formula
   * EMI = [P x R x (1+R)^N]/[(1+R)^N-1]
   * Where:
   * P = Principal amount
   * R = Monthly interest rate (annual rate / 12 / 100)
   * N = Number of months
   * Total Payable = EMI * N + Processing Fee
   * 
   * @param {number} principal - Principal amount
   * @param {number} interestRate - Annual interest rate (e.g., 12 for 12%)
   * @param {number} duration - Duration in months
   * @param {number} processingFee - Processing fee amount
   * @returns {Object} EMI calculation result
   */
  calculateEmi(principal, interestRate, duration, processingFee = 0) {
    try {
      const principalValue = parseFloat(principal);
      const interestRateValue = parseFloat(interestRate);
      const durationValue = parseInt(duration);
      const processingFeeValue = parseFloat(processingFee);

      // Validate inputs
      if (principalValue <= 0) {
        throw new Error('Principal amount must be greater than 0');
      }
      if (durationValue <= 0) {
        throw new Error('Duration must be greater than 0');
      }
      if (interestRateValue < 0) {
        throw new Error('Interest rate cannot be negative');
      }

      let emiAmount;
      let totalInterest = 0;

      if (interestRateValue === 0) {
        // 0% interest - just divide principal by duration
        emiAmount = principalValue / durationValue;
        totalInterest = 0;
      } else {
        // Calculate monthly interest rate
        const monthlyRate = interestRateValue / 12 / 100;

        // Calculate EMI using the formula
        // EMI = [P x R x (1+R)^N]/[(1+R)^N-1]
        const numerator = principalValue * monthlyRate * Math.pow(1 + monthlyRate, durationValue);
        const denominator = Math.pow(1 + monthlyRate, durationValue) - 1;
        emiAmount = numerator / denominator;

        // Calculate total interest
        const totalPayable = emiAmount * durationValue;
        totalInterest = totalPayable - principalValue;
      }

      // Calculate total payable amount (including processing fee)
      const totalPayable = (emiAmount * durationValue) + processingFeeValue;
      const totalAmount = principalValue + totalInterest + processingFeeValue;

      const result = {
        principal: principalValue,
        emiAmount: parseFloat(emiAmount.toFixed(2)),
        totalInterest: parseFloat(totalInterest.toFixed(2)),
        processingFee: processingFeeValue,
        totalPayable: parseFloat(totalPayable.toFixed(2)),
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        duration: durationValue,
        interestRate: interestRateValue,
        monthlyRate: parseFloat((interestRateValue / 12).toFixed(2))
      };

      this.logger.info('[calculateEmi] EMI calculated successfully', {
        principal: principalValue,
        emiAmount: result.emiAmount,
        duration: durationValue,
        interestRate: interestRateValue
      });

      return result;
    } catch (error) {
      this.logger.error('[calculateEmi] Error calculating EMI', {
        principal,
        interestRate,
        duration,
        processingFee,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get detailed EMI breakdown for a specific plan and amount
   * @param {string} planId - The EMI plan ID
   * @param {number} amount - The amount to calculate EMI for
   * @returns {Promise<Object>} Detailed EMI breakdown
   */
  async getEmiDetails(planId, amount) {
    try {
      const amountValue = parseFloat(amount);

      // Get the plan details
      const plan = await this.prisma.emi_plans.findUnique({
        where: {
          id: planId
        },
        include: {
          provider: true
        }
      });

      if (!plan) {
        throw new Error('EMI plan not found');
      }

      // Check if plan is active
      if (!plan.isActive) {
        throw new Error('EMI plan is not active');
      }

      // Check if plan supports the amount
      if (amountValue < plan.minAmount || amountValue > plan.maxAmount) {
        throw new Error(`Amount must be between ${plan.minAmount} and ${plan.maxAmount} for this plan`);
      }

      // Calculate EMI
      const calculation = this.calculateEmi(
        amountValue,
        plan.interestRate,
        plan.duration,
        plan.processingFee
      );

      const result = {
        planId: plan.id,
        planName: plan.name,
        provider: {
          id: plan.provider.id,
          name: plan.provider.name,
          logoUrl: plan.provider.logoUrl,
          website: plan.provider.website
        },
        duration: plan.duration,
        interestRate: plan.interestRate,
        minAmount: plan.minAmount,
        maxAmount: plan.maxAmount,
        processingFee: plan.processingFee,
        downPayment: plan.downPayment,
        ...calculation
      };

      this.logger.info('[getEmiDetails] EMI details retrieved successfully', {
        planId,
        amount: amountValue
      });

      return result;
    } catch (error) {
      this.logger.error('[getEmiDetails] Error getting EMI details', {
        planId,
        amount,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Validate if amount qualifies for EMI
   * @param {number} amount - The amount to validate
   * @param {string} planId - Optional plan ID to validate against
   * @returns {Promise<Object>} Validation result
   */
  async validateEmiEligibility(amount, planId = null) {
    try {
      const amountValue = parseFloat(amount);
      const result = {
        eligible: false,
        reason: null,
        availablePlans: [],
        minAmount: this.minAmount,
        maxAmount: this.maxAmount
      };

      // Check if amount is within global limits
      if (amountValue < this.minAmount) {
        result.reason = `Minimum amount for EMI is BDT ${this.minAmount.toLocaleString()}`;
        return result;
      }

      if (amountValue > this.maxAmount) {
        result.reason = `Maximum amount for EMI is BDT ${this.maxAmount.toLocaleString()}`;
        return result;
      }

      // If planId is provided, validate against specific plan
      if (planId) {
        const plan = await this.prisma.emi_plans.findUnique({
          where: { id: planId }
        });

        if (!plan) {
          result.reason = 'EMI plan not found';
          return result;
        }

        if (!plan.isActive) {
          result.reason = 'EMI plan is not active';
          return result;
        }

        if (amountValue < plan.minAmount || amountValue > plan.maxAmount) {
          result.reason = `Amount must be between BDT ${plan.minAmount.toLocaleString()} and BDT ${plan.maxAmount.toLocaleString()} for this plan`;
          return result;
        }

        result.eligible = true;
        return result;
      }

      // Get all available plans for the amount
      const availablePlans = await this.getAvailableEmiPlans(amountValue);
      result.availablePlans = availablePlans;
      result.eligible = availablePlans.length > 0;

      if (!result.eligible) {
        result.reason = 'No EMI plans available for this amount';
      }

      this.logger.info('[validateEmiEligibility] EMI eligibility validated', {
        amount: amountValue,
        eligible: result.eligible,
        availablePlansCount: availablePlans.length
      });

      return result;
    } catch (error) {
      this.logger.error('[validateEmiEligibility] Error validating EMI eligibility', {
        amount,
        planId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get EMI plan by ID
   * @param {string} planId - The EMI plan ID
   * @returns {Promise<Object>} EMI plan details
   */
  async getEmiPlanById(planId) {
    try {
      this.logger.info('[getEmiPlanById] Attempting to fetch EMI plan', {
        planId
      });

      const plan = await this.prisma.emi_plans.findUnique({
        where: { id: planId },
        include: {
          provider: true
        }
      });

      if (!plan) {
        this.logger.warn('[getEmiPlanById] EMI plan not found', {
          planId
        });
        throw new Error('EMI plan not found');
      }

      this.logger.info('[getEmiPlanById] EMI plan retrieved successfully', {
        planId
      });

      return plan;
    } catch (error) {
      this.logger.error('[getEmiPlanById] Error getting EMI plan', {
        planId,
        error: error.message,
        code: error.code,
        meta: error.meta,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get EMI provider by ID
   * @param {string} providerId - The EMI provider ID
   * @returns {Promise<Object>} EMI provider details
   */
  async getEmiProviderById(providerId) {
    try {
      this.logger.info('[getEmiProviderById] Attempting to fetch EMI provider', {
        providerId
      });

      const provider = await this.prisma.emi_providers.findUnique({
        where: { id: providerId },
        include: {
          emiPlans: {
            where: {
              isActive: true
            },
            orderBy: [
              { displayOrder: 'asc' },
              { duration: 'asc' }
            ]
          }
        }
      });

      if (!provider) {
        this.logger.warn('[getEmiProviderById] EMI provider not found', {
          providerId
        });
        throw new Error('EMI provider not found');
      }

      this.logger.info('[getEmiProviderById] EMI provider retrieved successfully', {
        providerId
      });

      return provider;
    } catch (error) {
      this.logger.error('[getEmiProviderById] Error getting EMI provider', {
        providerId,
        error: error.message,
        code: error.code,
        meta: error.meta,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get EMI configuration (for frontend display)
   * @returns {Promise<Object>} EMI configuration
   */
  async getEmiConfiguration() {
    try {
      const providers = await this.getEmiProviders();
      
      const configuration = {
        minAmount: this.minAmount,
        maxAmount: this.maxAmount,
        defaultDurations: this.defaultDurations,
        providers: providers.map(provider => ({
          id: provider.id,
          name: provider.name,
          logoUrl: provider.logoUrl,
          website: provider.website,
          plans: provider.emiPlans.map(plan => ({
            id: plan.id,
            name: plan.name,
            duration: plan.duration,
            interestRate: plan.interestRate,
            minAmount: plan.minAmount,
            maxAmount: plan.maxAmount,
            processingFee: plan.processingFee,
            downPayment: plan.downPayment
          }))
        }))
      };

      this.logger.info('[getEmiConfiguration] EMI configuration retrieved', {
        providersCount: providers.length,
        totalPlans: configuration.providers.reduce((sum, p) => sum + p.plans.length, 0)
      });

      return configuration;
    } catch (error) {
      this.logger.error('[getEmiConfiguration] Error getting EMI configuration', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create a new EMI provider
   * @param {Object} providerData - Provider data
   * @returns {Promise<Object>} Created EMI provider
   */
  async createEmiProvider(providerData) {
    try {
      const {
        name,
        logoUrl,
        website,
        minAmount = this.minAmount,
        maxAmount = this.maxAmount,
        processingFee = 0,
        interestRate = 0,
        isActive = true
      } = providerData;

      // Validate required fields
      if (!name || name.trim() === '') {
        throw new Error('Provider name is required');
      }

      // Validate amounts
      const minAmountValue = parseFloat(minAmount);
      const maxAmountValue = parseFloat(maxAmount);
      const processingFeeValue = parseFloat(processingFee);
      const interestRateValue = parseFloat(interestRate);

      if (minAmountValue < 0) {
        throw new Error('Minimum amount cannot be negative');
      }
      if (maxAmountValue < 0) {
        throw new Error('Maximum amount cannot be negative');
      }
      if (minAmountValue >= maxAmountValue) {
        throw new Error('Minimum amount must be less than maximum amount');
      }
      if (processingFeeValue < 0) {
        throw new Error('Processing fee cannot be negative');
      }
      if (interestRateValue < 0) {
        throw new Error('Interest rate cannot be negative');
      }

      const provider = await this.prisma.emi_providers.create({
        data: {
          name: name.trim(),
          logoUrl,
          website,
          minAmount: minAmountValue,
          maxAmount: maxAmountValue,
          processingFee: processingFeeValue,
          interestRate: interestRateValue,
          isActive
        }
      });

      this.logger.info('[createEmiProvider] EMI provider created successfully', {
        providerId: provider.id,
        name: provider.name
      });

      return provider;
    } catch (error) {
      this.logger.error('[createEmiProvider] Error creating EMI provider', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update an existing EMI provider
   * @param {string} providerId - Provider ID
   * @param {Object} providerData - Updated provider data
   * @returns {Promise<Object>} Updated EMI provider
   */
  async updateEmiProvider(providerId, providerData) {
    try {
      // Check if provider exists
      const existingProvider = await this.prisma.emi_providers.findUnique({
        where: { id: providerId }
      });

      if (!existingProvider) {
        throw new Error('EMI provider not found');
      }

      const {
        name,
        logoUrl,
        website,
        minAmount,
        maxAmount,
        processingFee,
        interestRate,
        isActive
      } = providerData;

      // Build update data object
      const updateData = {};
      if (name !== undefined) {
        if (name.trim() === '') {
          throw new Error('Provider name cannot be empty');
        }
        updateData.name = name.trim();
      }
      if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
      if (website !== undefined) updateData.website = website;
      if (isActive !== undefined) updateData.isActive = isActive;

      // Validate and update amounts if provided
      if (minAmount !== undefined) {
        const minAmountValue = parseFloat(minAmount);
        if (minAmountValue < 0) {
          throw new Error('Minimum amount cannot be negative');
        }
        updateData.minAmount = minAmountValue;
      }
      if (maxAmount !== undefined) {
        const maxAmountValue = parseFloat(maxAmount);
        if (maxAmountValue < 0) {
          throw new Error('Maximum amount cannot be negative');
        }
        updateData.maxAmount = maxAmountValue;
      }
      if (processingFee !== undefined) {
        const processingFeeValue = parseFloat(processingFee);
        if (processingFeeValue < 0) {
          throw new Error('Processing fee cannot be negative');
        }
        updateData.processingFee = processingFeeValue;
      }
      if (interestRate !== undefined) {
        const interestRateValue = parseFloat(interestRate);
        if (interestRateValue < 0) {
          throw new Error('Interest rate cannot be negative');
        }
        updateData.interestRate = interestRateValue;
      }

      // Validate minAmount < maxAmount if both are being updated
      const finalMinAmount = minAmount !== undefined ? parseFloat(minAmount) : existingProvider.minAmount;
      const finalMaxAmount = maxAmount !== undefined ? parseFloat(maxAmount) : existingProvider.maxAmount;
      
      if (finalMinAmount >= finalMaxAmount) {
        throw new Error('Minimum amount must be less than maximum amount');
      }

      const provider = await this.prisma.emi_providers.update({
        where: { id: providerId },
        data: updateData,
        include: {
          emiPlans: {
            where: {
              isActive: true
            },
            orderBy: [
              { displayOrder: 'asc' },
              { duration: 'asc' }
            ]
          }
        }
      });

      this.logger.info('[updateEmiProvider] EMI provider updated successfully', {
        providerId,
        name: provider.name
      });

      return provider;
    } catch (error) {
      this.logger.error('[updateEmiProvider] Error updating EMI provider', {
        providerId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Delete an EMI provider
   * @param {string} providerId - Provider ID
   * @returns {Promise<Object>} Deleted EMI provider
   */
  async deleteEmiProvider(providerId) {
    try {
      // Check if provider exists
      const existingProvider = await this.prisma.emi_providers.findUnique({
        where: { id: providerId },
        include: {
          emiPlans: true
        }
      });

      if (!existingProvider) {
        throw new Error('EMI provider not found');
      }

      // Delete provider (cascade will delete associated plans)
      const provider = await this.prisma.emi_providers.delete({
        where: { id: providerId }
      });

      this.logger.info('[deleteEmiProvider] EMI provider deleted successfully', {
        providerId,
        name: provider.name,
        plansDeleted: existingProvider.emiPlans.length
      });

      return provider;
    } catch (error) {
      this.logger.error('[deleteEmiProvider] Error deleting EMI provider', {
        providerId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create a new EMI plan
   * @param {Object} planData - Plan data
   * @returns {Promise<Object>} Created EMI plan
   */
  async createEmiPlan(planData) {
    try {
      const {
        providerId,
        name,
        duration,
        interestRate,
        minAmount,
        maxAmount,
        processingFee = 0,
        downPayment = 0,
        isActive = true,
        displayOrder = 0
      } = planData;

      // Validate required fields
      if (!providerId || providerId.trim() === '') {
        throw new Error('Provider ID is required');
      }
      if (!name || name.trim() === '') {
        throw new Error('Plan name is required');
      }
      if (!duration || duration <= 0) {
        throw new Error('Duration must be greater than 0');
      }
      if (minAmount === undefined || minAmount === null) {
        throw new Error('Minimum amount is required');
      }
      if (maxAmount === undefined || maxAmount === null) {
        throw new Error('Maximum amount is required');
      }
      if (interestRate === undefined || interestRate === null) {
        throw new Error('Interest rate is required');
      }

      // Validate amounts
      const minAmountValue = parseFloat(minAmount);
      const maxAmountValue = parseFloat(maxAmount);
      const processingFeeValue = parseFloat(processingFee);
      const downPaymentValue = parseFloat(downPayment);
      const interestRateValue = parseFloat(interestRate);
      const durationValue = parseInt(duration);
      const displayOrderValue = parseInt(displayOrder);

      if (minAmountValue < 0) {
        throw new Error('Minimum amount cannot be negative');
      }
      if (maxAmountValue < 0) {
        throw new Error('Maximum amount cannot be negative');
      }
      if (minAmountValue >= maxAmountValue) {
        throw new Error('Minimum amount must be less than maximum amount');
      }
      if (processingFeeValue < 0) {
        throw new Error('Processing fee cannot be negative');
      }
      if (downPaymentValue < 0) {
        throw new Error('Down payment cannot be negative');
      }
      if (interestRateValue < 0) {
        throw new Error('Interest rate cannot be negative');
      }

      // Check if provider exists
      const provider = await this.prisma.emiProvider.findUnique({
        where: { id: providerId }
      });

      if (!provider) {
        throw new Error('EMI provider not found');
      }

      const plan = await this.prisma.emi_plans.create({
        data: {
          providerId,
          name: name.trim(),
          duration: durationValue,
          interestRate: interestRateValue,
          minAmount: minAmountValue,
          maxAmount: maxAmountValue,
          processingFee: processingFeeValue,
          downPayment: downPaymentValue,
          isActive,
          displayOrder: displayOrderValue
        },
        include: {
          provider: true
        }
      });

      this.logger.info('[createEmiPlan] EMI plan created successfully', {
        planId: plan.id,
        name: plan.name,
        providerId: plan.providerId
      });

      return plan;
    } catch (error) {
      this.logger.error('[createEmiPlan] Error creating EMI plan', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update an existing EMI plan
   * @param {string} planId - Plan ID
   * @param {Object} planData - Updated plan data
   * @returns {Promise<Object>} Updated EMI plan
   */
  async updateEmiPlan(planId, planData) {
    try {
      // Check if plan exists
      const existingPlan = await this.prisma.emi_plans.findUnique({
        where: { id: planId }
      });

      if (!existingPlan) {
        throw new Error('EMI plan not found');
      }

      const {
        name,
        duration,
        interestRate,
        minAmount,
        maxAmount,
        processingFee,
        downPayment,
        isActive,
        displayOrder
      } = planData;

      // Build update data object
      const updateData = {};
      if (name !== undefined) {
        if (name.trim() === '') {
          throw new Error('Plan name cannot be empty');
        }
        updateData.name = name.trim();
      }
      if (isActive !== undefined) updateData.isActive = isActive;
      if (displayOrder !== undefined) {
        updateData.displayOrder = parseInt(displayOrder);
      }

      // Validate and update duration if provided
      if (duration !== undefined) {
        const durationValue = parseInt(duration);
        if (durationValue <= 0) {
          throw new Error('Duration must be greater than 0');
        }
        updateData.duration = durationValue;
      }

      // Validate and update amounts if provided
      if (minAmount !== undefined) {
        const minAmountValue = parseFloat(minAmount);
        if (minAmountValue < 0) {
          throw new Error('Minimum amount cannot be negative');
        }
        updateData.minAmount = minAmountValue;
      }
      if (maxAmount !== undefined) {
        const maxAmountValue = parseFloat(maxAmount);
        if (maxAmountValue < 0) {
          throw new Error('Maximum amount cannot be negative');
        }
        updateData.maxAmount = maxAmountValue;
      }
      if (processingFee !== undefined) {
        const processingFeeValue = parseFloat(processingFee);
        if (processingFeeValue < 0) {
          throw new Error('Processing fee cannot be negative');
        }
        updateData.processingFee = processingFeeValue;
      }
      if (downPayment !== undefined) {
        const downPaymentValue = parseFloat(downPayment);
        if (downPaymentValue < 0) {
          throw new Error('Down payment cannot be negative');
        }
        updateData.downPayment = downPaymentValue;
      }
      if (interestRate !== undefined) {
        const interestRateValue = parseFloat(interestRate);
        if (interestRateValue < 0) {
          throw new Error('Interest rate cannot be negative');
        }
        updateData.interestRate = interestRateValue;
      }

      // Validate minAmount < maxAmount if both are being updated
      const finalMinAmount = minAmount !== undefined ? parseFloat(minAmount) : existingPlan.minAmount;
      const finalMaxAmount = maxAmount !== undefined ? parseFloat(maxAmount) : existingPlan.maxAmount;
      
      if (finalMinAmount >= finalMaxAmount) {
        throw new Error('Minimum amount must be less than maximum amount');
      }

      const plan = await this.prisma.emi_plans.update({
        where: { id: planId },
        data: updateData,
        include: {
          provider: true
        }
      });

      this.logger.info('[updateEmiPlan] EMI plan updated successfully', {
        planId,
        name: plan.name
      });

      return plan;
    } catch (error) {
      this.logger.error('[updateEmiPlan] Error updating EMI plan', {
        planId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Delete an EMI plan
   * @param {string} planId - Plan ID
   * @returns {Promise<Object>} Deleted EMI plan
   */
  async deleteEmiPlan(planId) {
    try {
      // Check if plan exists
      const existingPlan = await this.prisma.emi_plans.findUnique({
        where: { id: planId }
      });

      if (!existingPlan) {
        throw new Error('EMI plan not found');
      }

      const plan = await this.prisma.emi_plans.delete({
        where: { id: planId }
      });

      this.logger.info('[deleteEmiPlan] EMI plan deleted successfully', {
        planId,
        name: plan.name
      });

      return plan;
    } catch (error) {
      this.logger.error('[deleteEmiPlan] Error deleting EMI plan', {
        planId,
        error: error.message
      });
      throw error;
    }
  }
}

// Singleton instance
const emiService = new EmiService();

module.exports = {
  EmiService,
  emiService
};
