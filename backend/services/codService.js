const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('./logger');

/**
 * COD Service
 * Handles Cash on Delivery (COD) settings and validation
 * for Bangladesh-specific payment options
 */
class CodService {
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
        this.logger.info('[CodService] Database connection established successfully');
      })
      .catch((error) => {
        this.logger.error('[CodService] Failed to connect to database', {
          error: error.message,
          code: error.code
        });
      });
    
    this.logger = loggerService;
    
    // Bangladesh-specific divisions
    this.divisions = [
      'dhaka',
      'chittagong',
      'khulna',
      'rajshahi',
      'sylhet',
      'barishal',
      'rangpur',
      'mymensingh'
    ];
  }

  /**
   * Get COD settings
   * @returns {Promise<Object>} COD settings
   */
  async getCodSettings() {
    try {
      const settings = await this.prisma.cod_settings.findFirst();

      if (!settings) {
        this.logger.warn('[getCodSettings] No COD settings found, returning defaults');
        return this.getDefaultSettings();
      }

      // Convert snake_case database fields to camelCase for frontend
      const camelCaseSettings = {
        id: settings.id,
        isEnabled: settings.is_enabled,
        minAmount: settings.min_amount,
        maxAmount: settings.max_amount,
        availableDivisions: settings.available_divisions,
        unavailableDivisions: settings.unavailable_divisions,
        additionalFee: settings.additional_fee,
        freeAboveAmount: settings.free_above_amount,
        requirePhoneVerification: settings.require_phone_verification,
        requireAddressVerification: settings.require_address_verification,
        maxDailyOrders: settings.max_daily_orders,
        maxWeeklyOrders: settings.max_weekly_orders,
        deliveryDays: settings.delivery_days,
        notes: settings.notes,
        createdAt: settings.created_at,
        updatedAt: settings.updated_at
      };

      this.logger.info('[getCodSettings] COD settings retrieved', {
        id: camelCaseSettings.id,
        isEnabled: camelCaseSettings.isEnabled
      });

      return camelCaseSettings;
    } catch (error) {
      this.logger.error('[getCodSettings] Error fetching COD settings', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Check if COD is available for address and amount
   * @param {Object} address - Address object with division
   * @param {number} amount - Order amount
   * @returns {Promise<Object>} COD availability result
   */
  async isCodAvailable(address, amount) {
    try {
      const settings = await this.getCodSettings();
      const amountValue = parseFloat(amount);

      const result = {
        available: false,
        reason: null,
        fee: 0,
        deliveryDays: 0,
        requiresVerification: {
          phone: false,
          address: false
        }
      };

      // Check if COD is enabled
      if (!settings.isEnabled) {
        result.reason = 'COD payment is currently disabled';
        return result;
      }

      // Check amount limits
      if (amountValue < settings.minAmount) {
        result.reason = `Minimum amount for COD is BDT ${settings.minAmount.toLocaleString()}`;
        return result;
      }

      if (amountValue > settings.maxAmount) {
        result.reason = `Maximum amount for COD is BDT ${settings.maxAmount.toLocaleString()}`;
        return result;
      }

      // Check division availability
      if (address && address.division) {
        const division = address.division.toLowerCase();

        // Check if division is in unavailable list
        if (settings.unavailableDivisions && settings.unavailableDivisions.includes(division)) {
          result.reason = `COD is not available for ${address.division} division`;
          return result;
        }

        // Check if division is in available list (if specified)
        if (settings.availableDivisions && settings.availableDivisions.length > 0) {
          if (!settings.availableDivisions.includes(division)) {
            result.reason = `COD is not available for ${address.division} division`;
            return result;
          }
        }
      }

      // All checks passed - COD is available
      result.available = true;
      result.fee = this.calculateCodFee(amountValue, settings);
      result.deliveryDays = settings.deliveryDays;
      result.requiresVerification = {
        phone: settings.requirePhoneVerification,
        address: settings.requireAddressVerification
      };

      this.logger.info('[isCodAvailable] COD availability checked', {
        available: result.available,
        amount: amountValue,
        division: address?.division
      });

      return result;
    } catch (error) {
      this.logger.error('[isCodAvailable] Error checking COD availability', {
        address,
        amount,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Calculate COD fee
   * @param {number} amount - Order amount
   * @param {Object} settings - COD settings (optional, will fetch if not provided)
   * @returns {Promise<number>} COD fee
   */
  async calculateCodFee(amount, settings = null) {
    try {
      const amountValue = parseFloat(amount);

      if (!settings) {
        settings = await this.getCodSettings();
      }

      let fee = 0;

      // If amount is above free threshold, fee is 0
      if (settings.freeAboveAmount && amountValue >= settings.freeAboveAmount) {
        fee = 0;
      } else {
        // Otherwise, apply additional fee
        fee = parseFloat(settings.additionalFee || 0);
      }

      this.logger.info('[calculateCodFee] COD fee calculated', {
        amount: amountValue,
        fee,
        freeAboveAmount: settings.freeAboveAmount
      });

      return fee;
    } catch (error) {
      this.logger.error('[calculateCodFee] Error calculating COD fee', {
        amount,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Validate COD order
   * @param {string} userId - User ID
   * @param {Object} address - Address object
   * @param {number} amount - Order amount
   * @returns {Promise<Object>} Validation result
   */
  async validateCodOrder(userId, address, amount) {
    try {
      const settings = await this.getCodSettings();
      const amountValue = parseFloat(amount);

      const result = {
        valid: false,
        reason: null,
        fee: 0,
        deliveryDays: 0,
        requiresVerification: {
          phone: false,
          address: false
        },
        warnings: []
      };

      // Check if COD is enabled
      if (!settings.isEnabled) {
        result.reason = 'COD payment is currently disabled';
        return result;
      }

      // Check amount limits
      if (amountValue < settings.minAmount) {
        result.reason = `Minimum amount for COD is BDT ${settings.minAmount.toLocaleString()}`;
        return result;
      }

      if (amountValue > settings.maxAmount) {
        result.reason = `Maximum amount for COD is BDT ${settings.maxAmount.toLocaleString()}`;
        return result;
      }

      // Check division availability
      if (address && address.division) {
        const division = address.division.toLowerCase();

        if (settings.unavailableDivisions && settings.unavailableDivisions.includes(division)) {
          result.reason = `COD is not available for ${address.division} division`;
          return result;
        }

        if (settings.availableDivisions && settings.availableDivisions.length > 0) {
          if (!settings.availableDivisions.includes(division)) {
            result.reason = `COD is not available for ${address.division} division`;
            return result;
          }
        }
      }

      // Check COD order limits
      if (userId) {
        const limitCheck = await this.checkCodLimit(userId);
        
        if (!limitCheck.withinLimit) {
          result.reason = limitCheck.reason;
          return result;
        }

        if (limitCheck.warnings && limitCheck.warnings.length > 0) {
          result.warnings = limitCheck.warnings;
        }
      }

      // All checks passed
      result.valid = true;
      result.fee = this.calculateCodFee(amountValue, settings);
      result.deliveryDays = settings.deliveryDays;
      result.requiresVerification = {
        phone: settings.requirePhoneVerification,
        address: settings.requireAddressVerification
      };

      // Add warning for high-value orders
      if (amountValue >= 5000 && !settings.requirePhoneVerification) {
        result.warnings.push('Phone verification is recommended for orders above BDT 5,000');
      }

      this.logger.info('[validateCodOrder] COD order validated', {
        userId,
        valid: result.valid,
        amount: amountValue
      });

      return result;
    } catch (error) {
      this.logger.error('[validateCodOrder] Error validating COD order', {
        userId,
        address,
        amount,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Check if user has reached COD order limits
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Limit check result
   */
  async checkCodLimit(userId) {
    try {
      const settings = await this.getCodSettings();

      const result = {
        withinLimit: true,
        reason: null,
        dailyOrders: 0,
        weeklyOrders: 0,
        dailyLimit: settings.maxDailyOrders,
        weeklyLimit: settings.maxWeeklyOrders,
        warnings: []
      };

      if (!userId) {
        return result;
      }

      // Get current time
      const now = new Date();
      
      // Calculate start of day (midnight)
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      
      // Calculate start of week (Sunday)
      const startOfWeek = new Date(now);
      const dayOfWeek = now.getDay();
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);

      // Count COD orders today
      const dailyOrders = await this.prisma.orders.count({
        where: {
          userId: userId,
          paymentMethod: 'cash_on_delivery',
          createdAt: {
            gte: startOfDay
          }
        }
      });

      // Count COD orders this week
      const weeklyOrders = await this.prisma.orders.count({
        where: {
          userId: userId,
          paymentMethod: 'cash_on_delivery',
          createdAt: {
            gte: startOfWeek
          }
        }
      });

      result.dailyOrders = dailyOrders;
      result.weeklyOrders = weeklyOrders;

      // Check daily limit
      if (dailyOrders >= settings.maxDailyOrders) {
        result.withinLimit = false;
        result.reason = `You have reached your daily COD order limit of ${settings.maxDailyOrders} orders`;
        return result;
      }

      // Check weekly limit
      if (weeklyOrders >= settings.maxWeeklyOrders) {
        result.withinLimit = false;
        result.reason = `You have reached your weekly COD order limit of ${settings.maxWeeklyOrders} orders`;
        return result;
      }

      // Add warnings if approaching limits
      const dailyRemaining = settings.maxDailyOrders - dailyOrders;
      const weeklyRemaining = settings.maxWeeklyOrders - weeklyOrders;

      if (dailyRemaining <= 1) {
        result.warnings.push(`You have only ${dailyRemaining} daily COD order(s) remaining`);
      }

      if (weeklyRemaining <= 2) {
        result.warnings.push(`You have only ${weeklyRemaining} weekly COD order(s) remaining`);
      }

      this.logger.info('[checkCodLimit] COD limit checked', {
        userId,
        dailyOrders,
        weeklyOrders,
        withinLimit: result.withinLimit
      });

      return result;
    } catch (error) {
      this.logger.error('[checkCodLimit] Error checking COD limit', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update COD settings
   * @param {Object} settingsData - New COD settings
   * @returns {Promise<Object>} Updated COD settings
   */
  async updateCodSettings(settingsData) {
    try {
      // Normalize division names to lowercase before saving
      if (settingsData.availableDivisions) {
        settingsData.availableDivisions = settingsData.availableDivisions.map(d => d.toLowerCase());
      }
      if (settingsData.unavailableDivisions) {
        settingsData.unavailableDivisions = settingsData.unavailableDivisions.map(d => d.toLowerCase());
      }

      // Get existing settings
      const existingSettings = await this.prisma.cod_settings.findFirst();

      let updatedSettings;

      if (existingSettings) {
        // Update existing settings
        updatedSettings = await this.prisma.cod_settings.update({
          where: {
            id: existingSettings.id
          },
          data: {
            is_enabled: settingsData.isEnabled !== undefined ? settingsData.isEnabled : existingSettings.isEnabled,
            min_amount: settingsData.minAmount !== undefined ? settingsData.minAmount : existingSettings.minAmount,
            max_amount: settingsData.maxAmount !== undefined ? settingsData.maxAmount : existingSettings.maxAmount,
            available_divisions: settingsData.availableDivisions !== undefined ? settingsData.availableDivisions : existingSettings.availableDivisions,
            unavailable_divisions: settingsData.unavailableDivisions !== undefined ? settingsData.unavailableDivisions : existingSettings.unavailableDivisions,
            additional_fee: settingsData.additionalFee !== undefined ? settingsData.additionalFee : existingSettings.additionalFee,
            free_above_amount: settingsData.freeAboveAmount !== undefined ? settingsData.freeAboveAmount : existingSettings.freeAboveAmount,
            require_phone_verification: settingsData.requirePhoneVerification !== undefined ? settingsData.requirePhoneVerification : existingSettings.requirePhoneVerification,
            require_address_verification: settingsData.requireAddressVerification !== undefined ? settingsData.requireAddressVerification : existingSettings.requireAddressVerification,
            max_daily_orders: settingsData.maxDailyOrders !== undefined ? settingsData.maxDailyOrders : existingSettings.maxDailyOrders,
            max_weekly_orders: settingsData.maxWeeklyOrders !== undefined ? settingsData.maxWeeklyOrders : existingSettings.maxWeeklyOrders,
            delivery_days: settingsData.deliveryDays !== undefined ? settingsData.deliveryDays : existingSettings.deliveryDays,
            notes: settingsData.notes !== undefined ? settingsData.notes : existingSettings.notes
          }
        });
      } else {
        // Create new settings
        updatedSettings = await this.prisma.cod_settings.create({
          data: {
            id: settingsData.id || 'default-cod-settings',
            is_enabled: settingsData.isEnabled !== undefined ? settingsData.isEnabled : true,
            min_amount: settingsData.minAmount !== undefined ? settingsData.minAmount : 0,
            max_amount: settingsData.maxAmount !== undefined ? settingsData.maxAmount : 100000,
            available_divisions: settingsData.availableDivisions !== undefined ? settingsData.availableDivisions : this.divisions,
            unavailable_divisions: settingsData.unavailableDivisions !== undefined ? settingsData.unavailableDivisions : [],
            additional_fee: settingsData.additionalFee !== undefined ? settingsData.additionalFee : 0,
            free_above_amount: settingsData.freeAboveAmount !== undefined ? settingsData.freeAboveAmount : 0,
            require_phone_verification: settingsData.requirePhoneVerification !== undefined ? settingsData.requirePhoneVerification : false,
            require_address_verification: settingsData.requireAddressVerification !== undefined ? settingsData.requireAddressVerification : false,
            max_daily_orders: settingsData.maxDailyOrders !== undefined ? settingsData.maxDailyOrders : 5,
            max_weekly_orders: settingsData.maxWeeklyOrders !== undefined ? settingsData.maxWeeklyOrders : 10,
            delivery_days: settingsData.deliveryDays !== undefined ? settingsData.deliveryDays : 3,
            notes: settingsData.notes !== undefined ? settingsData.notes : null
          }
        });
      }

      this.logger.info('[updateCodSettings] COD settings updated', {
        id: updatedSettings.id,
        isEnabled: updatedSettings.is_enabled
      });

      // Before returning, convert snake_case to camelCase
      const camelCaseSettings = {
        id: updatedSettings.id,
        isEnabled: updatedSettings.is_enabled,
        minAmount: updatedSettings.min_amount,
        maxAmount: updatedSettings.max_amount,
        availableDivisions: updatedSettings.available_divisions,
        unavailableDivisions: updatedSettings.unavailable_divisions,
        additionalFee: updatedSettings.additional_fee,
        freeAboveAmount: updatedSettings.free_above_amount,
        requirePhoneVerification: updatedSettings.require_phone_verification,
        requireAddressVerification: updatedSettings.require_address_verification,
        maxDailyOrders: updatedSettings.max_daily_orders,
        maxWeeklyOrders: updatedSettings.max_weekly_orders,
        deliveryDays: updatedSettings.delivery_days,
        notes: updatedSettings.notes,
        createdAt: updatedSettings.created_at,
        updatedAt: updatedSettings.updated_at
      };

      return camelCaseSettings;
    } catch (error) {
      this.logger.error('[updateCodSettings] Error updating COD settings', {
        settingsData,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get default COD settings
   * @returns {Object} Default COD settings
   */
  getDefaultSettings() {
    return {
      id: 'default-cod-settings',
      isEnabled: true,
      minAmount: 0,
      maxAmount: 50000,
      availableDivisions: this.divisions,
      unavailableDivisions: [],
      additionalFee: 0,
      freeAboveAmount: 0,
      requirePhoneVerification: true,
      requireAddressVerification: true,
      maxDailyOrders: 5,
      maxWeeklyOrders: 15,
      deliveryDays: 3,
      notes: ''
    };
  }

  /**
   * Get COD configuration (for frontend display)
   * @returns {Promise<Object>} COD configuration
   */
  async getCodConfiguration() {
    try {
      const settings = await this.getCodSettings();

      const configuration = {
        isEnabled: settings.isEnabled,
        minAmount: settings.minAmount,
        maxAmount: settings.maxAmount,
        availableDivisions: settings.availableDivisions,
        unavailableDivisions: settings.unavailableDivisions,
        additionalFee: settings.additionalFee,
        freeAboveAmount: settings.freeAboveAmount,
        requirePhoneVerification: settings.requirePhoneVerification,
        requireAddressVerification: settings.requireAddressVerification,
        maxDailyOrders: settings.maxDailyOrders,
        maxWeeklyOrders: settings.maxWeeklyOrders,
        deliveryDays: settings.deliveryDays,
        notes: settings.notes,
        divisions: this.divisions.map(division => ({
          value: division,
          label: this.formatDivisionName(division),
          available: settings.availableDivisions.includes(division)
        }))
      };

      this.logger.info('[getCodConfiguration] COD configuration retrieved');

      return configuration;
    } catch (error) {
      this.logger.error('[getCodConfiguration] Error getting COD configuration', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Format division name for display
   * @param {string} division - Division code
   * @returns {string} Formatted division name
   */
  formatDivisionName(division) {
    const divisionNames = {
      dhaka: 'Dhaka',
      chittagong: 'Chittagong',
      khulna: 'Khulna',
      rajshahi: 'Rajshahi',
      sylhet: 'Sylhet',
      barishal: 'Barishal',
      rangpur: 'Rangpur',
      mymensingh: 'Mymensingh'
    };

    return divisionNames[division] || division;
  }
}

// Singleton instance
const codService = new CodService();

module.exports = {
  CodService,
  codService
};
