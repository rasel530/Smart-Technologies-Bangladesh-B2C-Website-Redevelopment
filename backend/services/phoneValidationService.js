const loggerService = require('./logger');

class PhoneValidationService {
  constructor() {
    this.logger = loggerService;
    
    // Bangladesh mobile operator prefixes
    this.mobileOperators = {
      '013': {
        name: 'Teletalk',
        network: '2G/3G',
        color: '#8B4513',
        logo: '/assets/operators/teletalk.png'
      },
      '014': {
        name: 'Banglalink',
        network: '2G/3G/4G',
        color: '#FF6B35',
        logo: '/assets/operators/banglalink.png'
      },
      '015': {
        name: 'Teletalk',
        network: '2G/3G',
        color: '#8B4513',
        logo: '/assets/operators/teletalk.png'
      },
      '016': {
        name: 'Airtel',
        network: '2G/3G/4G',
        color: '#ED1C24',
        logo: '/assets/operators/airtel.png'
      },
      '017': {
        name: 'Grameenphone',
        network: '2G/3G/4G/5G',
        color: '#00BCD4',
        logo: '/assets/operators/grameenphone.png'
      },
      '018': {
        name: 'Robi',
        network: '2G/3G/4G',
        color: '#E91E63',
        logo: '/assets/operators/robi.png'
      },
      '019': {
        name: 'Banglalink',
        network: '2G/3G/4G',
        color: '#FF6B35',
        logo: '/assets/operators/banglalink.png'
      }
    };

    // Bangladesh landline area codes
    this.landlineAreaCodes = {
      '02': { area: 'Dhaka', region: 'Central' },
      '031': { area: 'Chittagong', region: 'Southeast' },
      '041': { area: 'Khulna', region: 'Southwest' },
      '051': { area: 'Rajshahi', region: 'Northwest' },
      '061': { area: 'Sylhet', region: 'Northeast' },
      '071': { area: 'Barisal', region: 'South' },
      '081': { area: 'Rangpur', region: 'North' },
      '091': { area: 'Mymensingh', region: 'North-central' }
    };

    // Special number patterns
    this.specialNumbers = {
      emergency: {
        patterns: [/^999$/, /^100$/, /^101$/, /^102$/],
        description: 'Emergency Services',
        examples: ['999', '100', '101', '102']
      },
      tollFree: {
        patterns: [/^800\d{7}$/],
        description: 'Toll-Free Numbers',
        examples: ['8001234567']
      },
      premium: {
        patterns: [/^900\d{7}$/],
        description: 'Premium Rate Numbers',
        examples: ['9001234567']
      },
      corporate: {
        patterns: [/^1\d{8}$/],
        description: 'Corporate Numbers',
        examples: ['123456789']
      }
    };
  }

  /**
   * Comprehensive Bangladesh phone number validation
   * @param {string} phone - Phone number to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result with detailed information
   */
  validateBangladeshPhoneNumber(phone, options = {}) {
    const {
      allowLandline = true,
      allowMobile = true,
      allowSpecial = false,
      requireNormalized = false
    } = options;

    if (!phone || typeof phone !== 'string') {
      return {
        isValid: false,
        error: 'Phone number is required and must be a string',
        errorBn: 'ফোন নম্বর প্রয়োজনীয় এবং এটি একটি স্ট্রিং হতে হবে',
        code: 'INVALID_INPUT'
      };
    }

    // Remove all non-digit characters except +
    const cleanPhone = phone.replace(/[^\d+]/g, '').trim();

    if (!cleanPhone) {
      return {
        isValid: false,
        error: 'Phone number cannot be empty',
        errorBn: 'ফোন নম্বর খালি হতে পারে না',
        code: 'EMPTY_PHONE'
      };
    }

    // Check special numbers first
    if (allowSpecial) {
      const specialValidation = this.validateSpecialNumbers(cleanPhone);
      if (specialValidation.isValid) {
        return {
          ...specialValidation,
          originalPhone: phone,
          normalizedPhone: cleanPhone
        };
      }
    }

    // Validate mobile numbers
    if (allowMobile) {
      const mobileValidation = this.validateMobileNumber(cleanPhone);
      if (mobileValidation.isValid) {
        return {
          ...mobileValidation,
          originalPhone: phone,
          normalizedPhone: mobileValidation.normalizedPhone
        };
      }
    }

    // Validate landline numbers
    if (allowLandline) {
      const landlineValidation = this.validateLandlineNumber(cleanPhone);
      if (landlineValidation.isValid) {
        return {
          ...landlineValidation,
          originalPhone: phone,
          normalizedPhone: landlineValidation.normalizedPhone
        };
      }
    }

    // If we reach here, the number is invalid
    return {
      isValid: false,
      error: 'Invalid Bangladesh phone number format',
      errorBn: 'অবৈধ বাংলাদেশ ফোন নম্বর ফরম্যাট',
      code: 'INVALID_FORMAT',
      suggestions: this.getFormatSuggestions(),
      examples: this.getValidExamples()
    };
  }

  /**
   * Validate mobile phone numbers
   * @param {string} phone - Clean phone number
   * @returns {Object} Mobile validation result
   */
  validateMobileNumber(phone) {
    // Mobile number patterns
    const mobilePatterns = [
      /^\+8801[3-9]\d{8}$/, // International format: +8801XXXXXXXXX
      /^8801[3-9]\d{8}$/, // Without +: 8801XXXXXXXXX
      /^01[3-9]\d{8}$/, // Local format: 01XXXXXXXXX
    ];

    if (!mobilePatterns.some(pattern => pattern.test(phone))) {
      return {
        isValid: false,
        error: 'Invalid mobile number format',
        errorBn: 'অবৈধ মোবাইল নম্বর ফরম্যাট',
        code: 'INVALID_MOBILE_FORMAT'
      };
    }

    // Normalize to international format
    let normalizedPhone = phone;
    if (phone.startsWith('01')) {
      normalizedPhone = `+880${phone}`;
    } else if (phone.startsWith('880')) {
      normalizedPhone = `+${phone}`;
    }

    // Extract operator prefix
    const prefix = normalizedPhone.substring(3, 6);
    const operator = this.mobileOperators[prefix];

    if (!operator) {
      return {
        isValid: false,
        error: 'Unsupported mobile operator',
        errorBn: 'অসমর্থিত মোবাইল অপারেটর',
        code: 'UNSUPPORTED_OPERATOR',
        supportedOperators: Object.keys(this.mobileOperators).map(p => this.mobileOperators[p].name)
      };
    }

    return {
      isValid: true,
      type: 'mobile',
      format: this.detectFormat(phone),
      normalizedPhone,
      operator: operator.name,
      operatorDetails: {
        prefix,
        ...operator
      },
      network: operator.network,
      isPorted: false, // TODO: Implement portability check if needed
      metadata: {
        length: normalizedPhone.length,
        countryCode: '+880',
        numberWithoutCountry: normalizedPhone.substring(3)
      }
    };
  }

  /**
   * Validate landline numbers
   * @param {string} phone - Clean phone number
   * @returns {Object} Landline validation result
   */
  validateLandlineNumber(phone) {
    // Landline patterns
    const landlinePatterns = [
      /^\+8802[1-9]\d{7}$/, // International: +8802XXXXXXXX
      /^8802[1-9]\d{7}$/, // Without +: 8802XXXXXXXX
      /^02[1-9]\d{7}$/, // Local: 02XXXXXXXX
    ];

    if (!landlinePatterns.some(pattern => pattern.test(phone))) {
      return {
        isValid: false,
        error: 'Invalid landline number format',
        errorBn: 'অবৈধ ল্যান্ডলাইন নম্বর ফরম্যাট',
        code: 'INVALID_LANDLINE_FORMAT'
      };
    }

    // Normalize to international format
    let normalizedPhone = phone;
    if (phone.startsWith('02')) {
      normalizedPhone = `+880${phone}`;
    } else if (phone.startsWith('8802')) {
      normalizedPhone = `+${phone}`;
    }

    // Extract area code
    let areaCode;
    if (normalizedPhone.startsWith('+8802')) {
      areaCode = normalizedPhone.substring(3, 5);
    }

    const areaInfo = this.landlineAreaCodes[areaCode];

    return {
      isValid: true,
      type: 'landline',
      format: this.detectFormat(phone),
      normalizedPhone,
      areaCode,
      areaInfo: areaInfo || {
        area: 'Unknown',
        region: 'Unknown'
      },
      metadata: {
        length: normalizedPhone.length,
        countryCode: '+880',
        numberWithoutCountry: normalizedPhone.substring(3)
      }
    };
  }

  /**
   * Validate special numbers (emergency, toll-free, etc.)
   * @param {string} phone - Clean phone number
   * @returns {Object} Special number validation result
   */
  validateSpecialNumbers(phone) {
    for (const [type, info] of Object.entries(this.specialNumbers)) {
      for (const pattern of info.patterns) {
        if (pattern.test(phone)) {
          return {
            isValid: true,
            type: 'special',
            specialType: type,
            description: info.description,
            normalizedPhone: phone,
            examples: info.examples,
            metadata: {
              length: phone.length,
              category: type
            }
          };
        }
      }
    }

    return {
      isValid: false,
      error: 'Not a recognized special number',
        errorBn: 'স্বীকৃত বিশেষ নম্বর নয়',
      code: 'INVALID_SPECIAL_FORMAT'
    };
  }

  /**
   * Detect phone number format
   * @param {string} phone - Phone number
   * @returns {string} Format type
   */
  detectFormat(phone) {
    if (phone.startsWith('+880')) return 'international';
    if (phone.startsWith('880')) return 'country_code';
    if (phone.startsWith('01')) return 'local';
    return 'unknown';
  }

  /**
   * Get format suggestions for invalid numbers
   * @returns {Array} Format suggestions
   */
  getFormatSuggestions() {
    return [
      '+8801XXXXXXXXX (International format)',
      '01XXXXXXXXX (Local format)',
      '+8802XXXXXXXX (Landline international)',
      '02XXXXXXXX (Landline local)'
    ];
  }

  /**
   * Get valid examples
   * @returns {Array} Valid examples
   */
  getValidExamples() {
    return {
      mobile: [
        '+8801712345678',
        '01712345678',
        '+8801812345678',
        '01812345678'
      ],
      landline: [
        '+880212345678',
        '0212345678',
        '+880311234567',
        '0311234567'
      ]
    };
  }

  /**
   * Normalize phone number to international format
   * @param {string} phone - Phone number to normalize
   * @returns {string|null} Normalized phone number or null if invalid
   */
  normalizePhoneNumber(phone) {
    const validation = this.validateBangladeshPhoneNumber(phone);
    if (!validation.isValid) {
      return null;
    }
    return validation.normalizedPhone;
  }

  /**
   * Format phone number for display
   * @param {string} phone - Phone number to format
   * @param {string} format - Desired format ('international', 'local', 'display')
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phone, format = 'display') {
    const validation = this.validateBangladeshPhoneNumber(phone);
    if (!validation.isValid) {
      return phone;
    }

    const normalized = validation.normalizedPhone;
    
    switch (format) {
      case 'international':
        return normalized;
      
      case 'local':
        if (normalized.startsWith('+880')) {
          return normalized.substring(3);
        }
        return normalized;
      
      case 'display':
        if (validation.type === 'mobile') {
          if (normalized.startsWith('+880')) {
            const rest = normalized.substring(4);
            return `+880 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6, 10)}`;
          }
        } else if (validation.type === 'landline') {
          if (normalized.startsWith('+880')) {
            const rest = normalized.substring(4);
            return `+880 ${rest.slice(0, 2)} ${rest.slice(2, 6)} ${rest.slice(6, 10)}`;
          }
        }
        return normalized;
      
      default:
        return normalized;
    }
  }

  /**
   * Get operator information
   * @param {string} phone - Phone number
   * @returns {Object|null} Operator information
   */
  getOperatorInfo(phone) {
    const validation = this.validateBangladeshPhoneNumber(phone);
    if (!validation.isValid || validation.type !== 'mobile') {
      return null;
    }

    return {
      operator: validation.operator,
      prefix: validation.operatorDetails.prefix,
      network: validation.network,
      color: validation.operatorDetails.color,
      logo: validation.operatorDetails.logo,
      isPorted: validation.isPorted
    };
  }

  /**
   * Check if phone number is from a specific operator
   * @param {string} phone - Phone number
   * @param {string} operator - Operator name
   * @returns {boolean} True if matches operator
   */
  isOperator(phone, operator) {
    const operatorInfo = this.getOperatorInfo(phone);
    if (!operatorInfo) return false;
    
    return operatorInfo.operator.toLowerCase() === operator.toLowerCase();
  }

  /**
   * Get all supported operators
   * @returns {Array} List of supported operators
   */
  getSupportedOperators() {
    return Object.entries(this.mobileOperators).map(([prefix, info]) => ({
      prefix,
      name: info.name,
      network: info.network,
      color: info.color,
      logo: info.logo
    }));
  }

  /**
   * Get all supported landline areas
   * @returns {Array} List of supported areas
   */
  getSupportedLandlineAreas() {
    return Object.entries(this.landlineAreaCodes).map(([code, info]) => ({
      code,
      area: info.area,
      region: info.region
    }));
  }

  /**
   * Validate phone number for specific use case
   * @param {string} phone - Phone number
   * @param {string} useCase - Use case ('registration', 'otp', 'sms', 'verification')
   * @returns {Object} Validation result with use-case specific rules
   */
  validateForUseCase(phone, useCase) {
    const baseValidation = this.validateBangladeshPhoneNumber(phone, {
      allowLandline: useCase !== 'otp' && useCase !== 'sms',
      allowMobile: true,
      allowSpecial: false
    });

    if (!baseValidation.isValid) {
      return baseValidation;
    }

    // Use-case specific validations
    switch (useCase) {
      case 'registration':
        return {
          ...baseValidation,
          canReceiveSMS: baseValidation.type === 'mobile',
          canReceiveOTP: baseValidation.type === 'mobile',
          requiresVerification: true
        };
      
      case 'otp':
      case 'sms':
        if (baseValidation.type !== 'mobile') {
          return {
            isValid: false,
            error: 'Only mobile numbers can receive SMS/OTP',
            errorBn: 'শুধুমাত্রমাত্র মোবাইল নম্বর SMS/OTP পেতে পারে',
            code: 'MOBILE_ONLY'
          };
        }
        return baseValidation;
      
      case 'verification':
        return {
          ...baseValidation,
          isVerifiable: true
        };
      
      default:
        return baseValidation;
    }
  }

  /**
   * Generate validation statistics
   * @param {Array} phoneNumbers - Array of phone numbers to analyze
   * @returns {Object} Statistics about phone numbers
   */
  generateValidationStats(phoneNumbers) {
    const stats = {
      total: phoneNumbers.length,
      valid: 0,
      invalid: 0,
      mobile: 0,
      landline: 0,
      special: 0,
      operators: {},
      areas: {},
      formats: {
        international: 0,
        local: 0,
        country_code: 0
      }
    };

    phoneNumbers.forEach(phone => {
      const validation = this.validateBangladeshPhoneNumber(phone);
      
      if (validation.isValid) {
        stats.valid++;
        stats[validation.type]++;
        stats.formats[validation.format]++;
        
        if (validation.operator) {
          stats.operators[validation.operator] = (stats.operators[validation.operator] || 0) + 1;
        }
        
        if (validation.areaCode) {
          stats.areas[validation.areaCode] = (stats.areas[validation.areaCode] || 0) + 1;
        }
      } else {
        stats.invalid++;
      }
    });

    return stats;
  }
}

// Singleton instance
const phoneValidationService = new PhoneValidationService();

module.exports = {
  PhoneValidationService,
  phoneValidationService
};