import { BangladeshPhoneValidation } from '@/types/auth';

// Bangladesh mobile operator information
export const MOBILE_OPERATORS: Record<string, {
  name: string;
  nameBn: string;
  network: string;
  color: string;
  logo: string;
}> = {
  '013': {
    name: 'Teletalk',
    nameBn: 'টেলেটক',
    network: '2G/3G',
    color: '#8B4513',
    logo: '/assets/operators/teletalk.png'
  },
  '014': {
    name: 'Banglalink',
    nameBn: 'বাংলালিংক',
    network: '2G/3G/4G',
    color: '#FF6B35',
    logo: '/assets/operators/banglalink.png'
  },
  '015': {
    name: 'Teletalk',
    nameBn: 'টেলেটক',
    network: '2G/3G',
    color: '#8B4513',
    logo: '/assets/operators/teletalk.png'
  },
  '016': {
    name: 'Airtel',
    nameBn: 'এয়র্টেল',
    network: '2G/3G/4G',
    color: '#ED1C24',
    logo: '/assets/operators/airtel.png'
  },
  '017': {
    name: 'Grameenphone',
    nameBn: 'গ্রামিনফোন',
    network: '2G/3G/4G/5G',
    color: '#00BCD4',
    logo: '/assets/operators/grameenphone.png'
  },
  '018': {
    name: 'Robi',
    nameBn: 'রবি',
    network: '2G/3G/4G',
    color: '#E91E63',
    logo: '/assets/operators/robi.png'
  },
  '019': {
    name: 'Banglalink',
    nameBn: 'বাংলালিংক',
    network: '2G/3G/4G',
    color: '#FF6B35',
    logo: '/assets/operators/banglalink.png'
  }
};

// Bangladesh landline area codes
export const LANDLINE_AREA_CODES: Record<string, {
  area: string;
  areaBn: string;
  region: string;
  regionBn: string;
}> = {
  '02': { area: 'Dhaka', areaBn: 'ঢাকা', region: 'Central', regionBn: 'কেন্দ্রপ' },
  '031': { area: 'Chittagong', areaBn: 'চট্টগ্রাম', region: 'Southeast', regionBn: 'দক্ষিণ-পূর্ব' },
  '041': { area: 'Khulna', areaBn: 'খুলনা', region: 'Southwest', regionBn: 'দক্ষিণ-পশ্চিম' },
  '051': { area: 'Rajshahi', areaBn: 'রাজশাহী', region: 'Northwest', regionBn: 'উত্তর-পশ্চিম' },
  '061': { area: 'Sylhet', areaBn: 'সিলেট', region: 'Northeast', regionBn: 'উত্তর-পূর্ব' },
  '071': { area: 'Barisal', areaBn: 'বরিশাল', region: 'South', regionBn: 'দক্ষিণ' },
  '081': { area: 'Rangpur', areaBn: 'রংপুর', region: 'North', regionBn: 'উত্তর' },
  '091': { area: 'Mymensingh', areaBn: 'ময়মেনসিং', region: 'North-central', regionBn: 'উত্তর-কেন্দ্রপ' }
};

// Special number patterns
export const SPECIAL_NUMBERS: Record<string, {
  patterns: RegExp[];
  description: string;
  descriptionBn: string;
  examples: string[];
}> = {
  emergency: {
    patterns: [/^999$/, /^100$/, /^101$/, /^102$/],
    description: 'Emergency Services',
    descriptionBn: 'জরুরি সেবা',
    examples: ['999', '100', '101', '102']
  },
  tollFree: {
    patterns: [/^800\d{7}$/],
    description: 'Toll-Free Numbers',
    descriptionBn: 'টোল-ফ্রি নম্বর',
    examples: ['8001234567']
  },
  premium: {
    patterns: [/^900\d{7}$/],
    description: 'Premium Rate Numbers',
    descriptionBn: 'প্রিমিয়াম নম্বর',
    examples: ['9001234567']
  },
  corporate: {
    patterns: [/^1\d{8}$/],
    description: 'Corporate Numbers',
    descriptionBn: 'কর্পোরেট নম্বর',
    examples: ['123456789']
  }
};

/**
 * Comprehensive Bangladesh phone number validation
 */
export const validateBangladeshPhone = (
  phone: string,
  options: {
    allowLandline?: boolean;
    allowMobile?: boolean;
    allowSpecial?: boolean;
  } = {}
): BangladeshPhoneValidation => {
  const {
    allowLandline = true,
    allowMobile = true,
    allowSpecial = false
  } = options;

  if (!phone || typeof phone !== 'string') {
    return {
      isValid: false,
      error: 'Phone number is required and must be a string',
      errorBn: 'ফোন নম্বর প্রয়োজনীয় এবং এটি স্ট্রিং হতে হবে',
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
    const specialValidation = validateSpecialNumbers(cleanPhone);
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
    const mobileValidation = validateMobileNumber(cleanPhone);
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
    const landlineValidation = validateLandlineNumber(cleanPhone);
    if (landlineValidation.isValid) {
      return {
        ...landlineValidation,
        originalPhone: phone,
        normalizedPhone: landlineValidation.normalizedPhone
      };
    }
  }

  // If we reach here, number is invalid
  return {
    isValid: false,
    error: 'Invalid Bangladesh phone number format',
    errorBn: 'অবৈধ বাংলাদেশ ফোন নম্বর ফরম্যাট',
    code: 'INVALID_FORMAT',
    suggestions: getFormatSuggestions(),
    examples: getValidExamples()
  };
};

/**
 * Validate mobile phone numbers
 */
const validateMobileNumber = (phone: string): BangladeshPhoneValidation => {
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
  const operator = MOBILE_OPERATORS[prefix];

  if (!operator) {
    return {
      isValid: false,
      error: 'Unsupported mobile operator',
      errorBn: 'অসমর্থিত মোবাইল অপারেটর',
      code: 'UNSUPPORTED_OPERATOR',
      supportedOperators: Object.keys(MOBILE_OPERATORS).map(p => MOBILE_OPERATORS[p].name)
    };
  }

  return {
    isValid: true,
    type: 'mobile',
    format: detectFormat(phone),
    normalizedPhone,
    operator: operator.name,
    operatorBn: operator.nameBn,
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
};

/**
 * Validate landline numbers
 */
const validateLandlineNumber = (phone: string): BangladeshPhoneValidation => {
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
  let areaCode: string | undefined;
  if (normalizedPhone.startsWith('+8802')) {
    areaCode = normalizedPhone.substring(3, 5);
  }

  const areaInfo = areaCode ? LANDLINE_AREA_CODES[areaCode] : undefined;

  return {
    isValid: true,
    type: 'landline',
    format: detectFormat(phone),
    normalizedPhone,
    areaCode,
    areaInfo: areaInfo || {
      area: 'Unknown',
      areaBn: 'অজানা',
      region: 'Unknown',
      regionBn: 'অজানা'
    },
    metadata: {
      length: normalizedPhone.length,
      countryCode: '+880',
      numberWithoutCountry: normalizedPhone.substring(3)
    }
  };
};

/**
 * Validate special numbers (emergency, toll-free, etc.)
 */
const validateSpecialNumbers = (phone: string): BangladeshPhoneValidation => {
  for (const [type, info] of Object.entries(SPECIAL_NUMBERS)) {
    for (const pattern of info.patterns) {
      if (pattern.test(phone)) {
        return {
          isValid: true,
          type: 'special',
          specialType: type,
          description: info.description,
          descriptionBn: info.descriptionBn,
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
};

/**
 * Detect phone number format
 */
const detectFormat = (phone: string): 'international' | 'country_code' | 'local' | 'unknown' => {
  if (phone.startsWith('+880')) return 'international';
  if (phone.startsWith('880')) return 'country_code';
  if (phone.startsWith('01')) return 'local';
  return 'unknown';
};

/**
 * Get format suggestions for invalid numbers
 */
const getFormatSuggestions = (): string[] => {
  return [
    '+8801XXXXXXXXX (International format)',
    '01XXXXXXXXX (Local format)',
    '+8802XXXXXXXX (Landline international)',
    '02XXXXXXXX (Landline local)'
  ];
};

/**
 * Get valid examples
 */
const getValidExamples = () => {
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
};

/**
 * Normalize phone number to international format
 */
export const normalizePhoneNumber = (phone: string): string | null => {
  const validation = validateBangladeshPhone(phone);
  if (!validation.isValid) {
    return null;
  }
  return validation.normalizedPhone || phone;
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (
  phone: string,
  format: 'international' | 'local' | 'display' = 'display'
): string => {
  const validation = validateBangladeshPhone(phone);
  if (!validation.isValid) {
    return phone;
  }

  const normalized = validation.normalizedPhone;
  
  switch (format) {
    case 'international':
      return normalized || phone;
      
    case 'local':
      if (normalized && normalized.startsWith('+880')) {
        return normalized.substring(3);
      }
      return normalized || phone;
      
    case 'display':
      if (validation.type === 'mobile') {
        if (normalized && normalized.startsWith('+880')) {
          const rest = normalized.substring(4);
          return `+880 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6, 10)}`;
        }
      } else if (validation.type === 'landline') {
        if (normalized && normalized.startsWith('+880')) {
          const rest = normalized.substring(4);
          return `+880 ${rest.slice(0, 2)} ${rest.slice(2, 6)} ${rest.slice(6, 10)}`;
        }
      }
      return normalized || phone;
      
    default:
      return normalized || phone;
  }
};

/**
 * Get operator information
 */
export const getOperatorInfo = (phone: string) => {
  const validation = validateBangladeshPhone(phone);
  if (!validation.isValid || validation.type !== 'mobile') {
    return null;
  }

  const operator = validation.operatorDetails;
  if (!operator) return null;

  return {
    operator: validation.operator,
    operatorBn: validation.operatorBn,
    prefix: operator.prefix,
    network: operator.network,
    color: operator.color,
    logo: operator.logo,
    isPorted: validation.isPorted
  };
};

/**
 * Check if phone number is from a specific operator
 */
export const isOperator = (phone: string, operator: string): boolean => {
  const operatorInfo = getOperatorInfo(phone);
  if (!operatorInfo) return false;
  
  return operatorInfo.operator?.toLowerCase() === operator.toLowerCase();
};

/**
 * Get all supported operators
 */
export const getSupportedOperators = () => {
  return Object.entries(MOBILE_OPERATORS).map(([prefix, info]) => ({
    prefix,
    name: info.name,
    nameBn: info.nameBn,
    network: info.network,
    color: info.color,
    logo: info.logo
  }));
};

/**
 * Get all supported landline areas
 */
export const getSupportedLandlineAreas = () => {
  return Object.entries(LANDLINE_AREA_CODES).map(([code, info]) => ({
    code,
    area: info.area,
    areaBn: info.areaBn,
    region: info.region,
    regionBn: info.regionBn
  }));
};

/**
 * Validate phone number for specific use case
 */
export const validateForUseCase = (
  phone: string,
  useCase: 'registration' | 'otp' | 'sms' | 'verification'
): BangladeshPhoneValidation => {
  const baseValidation = validateBangladeshPhone(phone, {
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
};

/**
 * Generate validation statistics
 */
export const generateValidationStats = (phoneNumbers: string[]) => {
  const stats: {
    total: number;
    valid: number;
    invalid: number;
    mobile: number;
    landline: number;
    special: number;
    operators: Record<string, number>;
    areas: Record<string, number>;
    formats: {
      international: number;
      local: number;
      country_code: number;
    };
  } = {
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
    const validation = validateBangladeshPhone(phone);
    
    if (validation.isValid) {
      stats.valid++;
      if (validation.type === 'mobile') stats.mobile++;
      else if (validation.type === 'landline') stats.landline++;
      else if (validation.type === 'special') stats.special++;
      
      stats.formats[validation.format || 'unknown']++;
      
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
};

/**
 * Get operator color for UI
 */
export const getOperatorColor = (operator?: string): string => {
  if (!operator) return 'text-gray-500';
  
  const colors: Record<string, string> = {
    'Grameenphone': 'text-green-600',
    'Robi': 'text-pink-600',
    'Banglalink': 'text-orange-600',
    'Airtel': 'text-blue-600',
    'Teletalk': 'text-purple-600'
  };
  
  return colors[operator] || 'text-gray-500';
};

/**
 * Real-time phone validation with debouncing
 */
export const createPhoneValidator = (debounceMs = 300) => {
  let timeout: NodeJS.Timeout;
  
  return (phone: string, callback: (result: BangladeshPhoneValidation) => void) => {
    clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      const validation = validateBangladeshPhone(phone);
      callback(validation);
    }, debounceMs);
  };
};

/**
 * Phone number formatting for input fields
 */
export const formatPhoneInput = (value: string): string => {
  // Remove all non-digit characters except +
  let cleaned = value.replace(/[^\d+]/g, '');
  
  // Limit to 15 characters (max Bangladesh phone length)
  if (cleaned.length > 15) {
    cleaned = cleaned.substring(0, 15);
  }
  
  // Auto-format as user types
  if (cleaned.startsWith('+880') && cleaned.length === 4) {
    // User just typed +880, wait for more
    return cleaned;
  } else if (cleaned.startsWith('+880') && cleaned.length > 4) {
    // Format as +880 XXX XXX XXXX
    const rest = cleaned.substring(4);
    if (rest.length <= 3) {
      return `+880 ${rest}`;
    } else if (rest.length <= 6) {
      return `+880 ${rest.slice(0, 3)} ${rest.slice(3)}`;
    } else {
      return `+880 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6, 10)}`;
    }
  } else if (cleaned.startsWith('01') && cleaned.length <= 11) {
    // Format as 01XX XXX XXXX
    if (cleaned.length <= 4) {
      return cleaned;
    } else if (cleaned.length <= 7) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
    } else {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 11)}`;
    }
  }
  
  return cleaned;
};