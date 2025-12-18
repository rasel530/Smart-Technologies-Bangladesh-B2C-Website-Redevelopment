const { phoneValidationService } = require('../services/phoneValidationService');

describe('PhoneValidationService', () => {
  describe('Basic Mobile Number Validation', () => {
    test('should validate Grameenphone numbers', () => {
      const result = phoneValidationService.validateBangladeshPhone('+8801712345678');
      
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('mobile');
      expect(result.operator).toBe('Grameenphone');
      expect(result.operatorBn).toBe('গ্রামিনফোন');
      expect(result.format).toBe('international');
      expect(result.normalizedPhone).toBe('+8801712345678');
      expect(result.operatorDetails).toBeDefined();
      expect(result.operatorDetails.prefix).toBe('017');
      expect(result.operatorDetails.network).toBe('2G/3G/4G/5G');
      expect(result.operatorDetails.color).toBe('#00BCD4');
      expect(result.metadata.length).toBe(13);
      expect(result.metadata.countryCode).toBe('+880');
      expect(result.metadata.numberWithoutCountry).toBe('712345678');
    });

    test('should validate Banglalink numbers', () => {
      const result = phoneValidationService.validateBangladeshPhone('01912345678');
      
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('mobile');
      expect(result.operator).toBe('Banglalink');
      expect(result.operatorBn).toBe('বাংলালিংক');
      expect(result.format).toBe('local');
      expect(result.normalizedPhone).toBe('+8801912345678');
    });

    test('should validate Robi numbers', () => {
      const result = phoneValidationService.validateBangladeshPhone('+8801812345678');
      
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('mobile');
      expect(result.operator).toBe('Robi');
      expect(result.operatorBn).toBe('রবি');
      expect(result.format).toBe('international');
      expect(result.operatorDetails.prefix).toBe('018');
      expect(result.operatorDetails.network).toBe('2G/3G/4G');
    });

    test('should validate Airtel numbers', () => {
      const result = phoneValidationService.validateBangladeshPhone('+8801612345678');
      
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('mobile');
      expect(result.operator).toBe('Airtel');
      expect(result.operatorBn).toBe('এয়র্টেল');
      expect(result.format).toBe('international');
      expect(result.operatorDetails.prefix).toBe('016');
      expect(result.operatorDetails.network).toBe('2G/3G/4G');
    });

    test('should validate Teletalk numbers', () => {
      const result = phoneValidationService.validateBangladeshPhone('+8801512345678');
      
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('mobile');
      expect(result.operator).toBe('Teletalk');
      expect(result.operatorBn).toBe('টেলেটক');
      expect(result.format).toBe('international');
      expect(result.operatorDetails.prefix).toBe('015');
      expect(result.operatorDetails.network).toBe('2G/3G');
    });

    test('should reject invalid mobile prefixes', () => {
      const result = phoneValidationService.validateBangladeshPhone('+8801212345678');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Unsupported mobile operator');
      expect(result.code).toBe('UNSUPPORTED_OPERATOR');
      expect(result.supportedOperators).toContain('Grameenphone');
      expect(result.supportedOperators).toContain('Banglalink');
      expect(result.supportedOperators).toContain('Robi');
      expect(result.supportedOperators).toContain('Airtel');
      expect(result.supportedOperators).toContain('Teletalk');
    });

    test('should reject invalid mobile format', () => {
      const result = phoneValidationService.validateBangladeshPhone('+88012345678');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid mobile number format');
      expect(result.code).toBe('INVALID_MOBILE_FORMAT');
    });

    test('should validate local format mobile numbers', () => {
      const result = phoneValidationService.validateBangladeshPhone('01712345678');
      
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('mobile');
      expect(result.operator).toBe('Grameenphone');
      expect(result.format).toBe('local');
      expect(result.normalizedPhone).toBe('+8801712345678');
    });

    test('should validate international format without +', () => {
      const result = phoneValidationService.validateBangladeshPhone('8801712345678');
      
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('mobile');
      expect(result.format).toBe('country_code');
      expect(result.normalizedPhone).toBe('+8801712345678');
    });
  });

  describe('Landline Number Validation', () => {
    test('should validate Dhaka landline numbers', () => {
      const result = phoneValidationService.validateBangladeshPhone('0212345678');
      
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('landline');
      expect(result.areaCode).toBe('02');
      expect(result.areaInfo.area).toBe('Dhaka');
      expect(result.areaInfo.areaBn).toBe('ঢাকা');
      expect(result.areaInfo.region).toBe('Central');
      expect(result.format).toBe('local');
      expect(result.normalizedPhone).toBe('+880212345678');
    });

    test('should validate Chittagong landline numbers', () => {
      const result = phoneValidationService.validateBangladeshPhone('0311234567');
      
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('landline');
      expect(result.areaCode).toBe('031');
      expect(result.areaInfo.area).toBe('Chittagong');
      expect(result.areaInfo.areaBn).toBe('চট্টগ্রাম');
      expect(result.areaInfo.region).toBe('Southeast');
      expect(result.format).toBe('local');
      expect(result.normalizedPhone).toBe('+880311234567');
    });

    test('should validate international landline format', () => {
      const result = phoneValidationService.validateBangladeshPhone('+880212345678');
      
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('landline');
      expect(result.format).toBe('international');
      expect(result.areaCode).toBe('02');
      expect(result.areaInfo.area).toBe('Dhaka');
      expect(result.areaInfo.areaBn).toBe('ঢাকা');
      expect(result.areaInfo.region).toBe('Central');
      expect(result.normalizedPhone).toBe('+880212345678');
    });

    test('should reject invalid landline area codes', () => {
      const result = phoneValidationService.validateBangladeshPhone('02912345678');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid landline number format');
      expect(result.code).toBe('INVALID_LANDLINE_FORMAT');
    });

    test('should reject invalid landline format', () => {
      const result = phoneValidationService.validateBangladeshPhone('0211234567');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid landline number format');
      expect(result.code).toBe('INVALID_LANDLINE_FORMAT');
    });
  });

  describe('Special Number Validation', () => {
    test('should validate emergency numbers', () => {
      const result = phoneValidationService.validateBangladeshPhone('999', { allowSpecial: true });
      
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('special');
      expect(result.specialType).toBe('emergency');
      expect(result.description).toBe('Emergency Services');
      expect(result.descriptionBn).toBe('জরুরি সেবা');
      expect(result.examples).toContain('999');
    });

    test('should validate toll-free numbers', () => {
      const result = phoneValidationService.validateBangladeshPhone('8001234567', { allowSpecial: true });
      
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('special');
      expect(result.specialType).toBe('tollFree');
      expect(result.description).toBe('Toll-Free Numbers');
      expect(result.descriptionBn).toBe('টোল-ফ্রি নম্বর');
      expect(result.examples).toContain('8001234567');
    });

    test('should validate premium numbers', () => {
      const result = phoneValidationService.validateBangladeshPhone('9001234567', { allowSpecial: true });
      
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('special');
      expect(result.specialType).toBe('premium');
      expect(result.description).toBe('Premium Rate Numbers');
      expect(result.descriptionBn).toBe('প্রিমিয়াম নম্বর');
      expect(result.examples).toContain('9001234567');
    });

    test('should validate corporate numbers', () => {
      const result = phoneValidationService.validateBangladeshPhone('123456789', { allowSpecial: true });
      
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('special');
      expect(result.specialType).toBe('corporate');
      expect(result.description).toBe('Corporate Numbers');
      expect(result.descriptionBn).toBe('কর্পোরেট নম্বর');
      expect(result.examples).toContain('123456789');
    });

    test('should reject invalid special numbers', () => {
      const result = phoneValidationService.validateBangladeshPhone('123', { allowSpecial: true });
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Not a recognized special number');
      expect(result.code).toBe('INVALID_SPECIAL_FORMAT');
    });
  });

  describe('Use Case Specific Validation', () => {
    test('should validate for registration use case', () => {
      const result = phoneValidationService.validateForUseCase('+8801712345678', 'registration');
      
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('mobile');
      expect(result.canReceiveSMS).toBe(true);
      expect(result.canReceiveOTP).toBe(true);
      expect(result.requiresVerification).toBe(true);
      expect(result.operator).toBe('Grameenphone');
    });

    test('should validate for OTP use case', () => {
      const result = phoneValidationService.validateForUseCase('+8801712345678', 'otp');
      
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('mobile');
      expect(result.canReceiveSMS).toBe(true);
      expect(result.canReceiveOTP).toBe(true);
      expect(result.operator).toBe('Grameenphone');
    });

    test('should validate for SMS use case', () => {
      const result = phoneValidationService.validateForUseCase('+8801712345678', 'sms');
      
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('mobile');
      expect(result.canReceiveSMS).toBe(true);
      expect(result.canReceiveOTP).toBe(true);
      expect(result.operator).toBe('Grameenphone');
    });

    test('should reject landline for OTP use case', () => {
      const result = phoneValidationService.validateForUseCase('0212345678', 'otp');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Only mobile numbers can receive SMS/OTP');
      expect(result.errorBn).toBe('শুধুমাত্রমাত্র মোবাইল নম্বর SMS/OTP পেতে পারে');
      expect(result.code).toBe('MOBILE_ONLY');
    });

    test('should validate for verification use case', () => {
      const result = phoneValidationService.validateForUseCase('+8801712345678', 'verification');
      
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('mobile');
      expect(result.isVerifiable).toBe(true);
      expect(result.operator).toBe('Grameenphone');
    });
  });

  describe('Phone Number Formatting', () => {
    test('should normalize to international format', () => {
      const normalized = phoneValidationService.normalizePhoneNumber('01712345678');
      expect(normalized).toBe('+8801712345678');
    });

    test('should format for display', () => {
      const formatted = phoneValidationService.formatPhoneNumber('+8801712345678', 'display');
      expect(formatted).toBe('+880 171 234 5678');
    });

    test('should format to local format', () => {
      const formatted = phoneValidationService.formatPhoneNumber('+8801712345678', 'local');
      expect(formatted).toBe('01712345678');
    });

    test('should format international to local', () => {
      const formatted = phoneValidationService.formatPhoneNumber('+8801712345678', 'local');
      expect(formatted).toBe('01712345678');
    });

    test('should format local to international', () => {
      const formatted = phoneValidationService.formatPhoneNumber('01712345678', 'international');
      expect(formatted).toBe('+8801712345678');
    });
  });

  describe('Operator Information', () => {
    test('should get Grameenphone operator info', () => {
      const info = phoneValidationService.getOperatorInfo('+8801712345678');
      
      expect(info).toBeDefined();
      expect(info.operator).toBe('Grameenphone');
      expect(info.operatorBn).toBe('গ্রামিনফোন');
      expect(info.prefix).toBe('017');
      expect(info.network).toBe('2G/3G/4G/5G');
      expect(info.color).toBe('#00BCD4');
      expect(info.logo).toBe('/assets/operators/grameenphone.png');
      expect(info.isPorted).toBe(false);
    });

    test('should get Banglalink operator info', () => {
      const info = phoneValidationService.getOperatorInfo('+8801912345678');
      
      expect(info).toBeDefined();
      expect(info.operator).toBe('Banglalink');
      expect(info.operatorBn).toBe('বাংলালিংক');
      expect(info.prefix).toBe('019');
      expect(info.network).toBe('2G/3G/4G');
      expect(info.color).toBe('#FF6B35');
    });

    test('should return null for invalid phone', () => {
      const info = phoneValidationService.getOperatorInfo('invalid');
      expect(info).toBeNull();
    });

    test('should return null for landline', () => {
      const info = phoneValidationService.getOperatorInfo('0212345678');
      expect(info).toBeNull();
    });
  });

  describe('Supported Operators and Areas', () => {
    test('should get all supported operators', () => {
      const operators = phoneValidationService.getSupportedOperators();
      
      expect(operators).toHaveLength(7);
      expect(operators.map(op => op.prefix)).toContain('013');
      expect(operators.map(op => op.prefix)).toContain('014');
      expect(operators.map(op => op.prefix)).toContain('015');
      expect(operators.map(op => op.prefix)).toContain('016');
      expect(operators.map(op => op.prefix)).toContain('017');
      expect(operators.map(op => op.prefix)).toContain('018');
      expect(operators.map(op => op.prefix)).toContain('019');
      
      // Check operator details
      const gp = operators.find(op => op.prefix === '017');
      expect(gp.name).toBe('Grameenphone');
      expect(gp.network).toBe('2G/3G/4G/5G');
      expect(gp.color).toBe('#00BCD4');
    });

    test('should get all supported landline areas', () => {
      const areas = phoneValidationService.getSupportedLandlineAreas();
      
      expect(areas).toHaveLength(8);
      expect(areas.map(area => area.code)).toContain('02');
      expect(areas.map(area => area.code)).toContain('031');
      expect(areas.map(area => area.code)).toContain('041');
      expect(areas.map(area => area.code)).toContain('051');
      expect(areas.map(area => area.code)).toContain('061');
      expect(areas.map(area => area.code)).toContain('071');
      expect(areas.map(area => area.code)).toContain('081');
      expect(areas.map(area => area.code)).toContain('091');
      
      // Check area details
      const dhaka = areas.find(area => area.code === '02');
      expect(dhaka.area).toBe('Dhaka');
      expect(dhaka.areaBn).toBe('ঢাকা');
      expect(dhaka.region).toBe('Central');
      expect(dhaka.regionBn).toBe('কেন্দ্রপ');
    });
  });

  describe('Phone Input Formatting', () => {
    test('should format phone input for +880 prefix', () => {
      const formatted = phoneValidationService.formatPhoneInput('+8801712345678');
      expect(formatted).toBe('+8801712345678');
    });

    test('should format phone input for local format', () => {
      const formatted = phoneValidationService.formatPhoneInput('01712345678');
      expect(formatted).toBe('01712345678');
    });

    test('should limit phone input to 15 characters', () => {
      const formatted = phoneValidationService.formatPhoneInput('+880171234567812345');
      expect(formatted).toBe('+8801712345678'); // Limited to 15 chars
    });
  });

  describe('Validation Statistics', () => {
    test('should generate validation statistics', () => {
      const phones = [
        '+8801712345678', // Grameenphone
        '01912345678',  // Banglalink
        '+8801812345678', // Robi
        '01612345678', // Airtel
        '01512345678', // Teletalk
        '0212345678', // Dhaka landline
        'invalid123', // Invalid mobile
        'invalid456', // Invalid format
      ];
      
      const stats = phoneValidationService.generateValidationStats(phones);
      
      expect(stats.total).toBe(8);
      expect(stats.valid).toBe(6);
      expect(stats.invalid).toBe(2);
      expect(stats.mobile).toBe(5);
      expect(stats.landline).toBe(1);
      expect(stats.special).toBe(0);
      expect(stats.operators['Grameenphone']).toBe(1);
      expect(stats.operators['Banglalink']).toBe(1);
      expect(stats.operators['Robi']).toBe(1);
      expect(stats.operators['Airtel']).toBe(1);
      expect(stats.operators['Teletalk']).toBe(1);
      expect(stats.formats.international).toBe(5);
      expect(stats.formats.local).toBe(1);
      expect(stats.areas['02']).toBe(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle null input', () => {
      const result = phoneValidationService.validateBangladeshPhone(null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Phone number is required and must be a string');
      expect(result.code).toBe('INVALID_INPUT');
    });

    test('should handle empty string', () => {
      const result = phoneValidationService.validateBangladeshPhone('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Phone number cannot be empty');
      expect(result.code).toBe('EMPTY_PHONE');
    });

    test('should handle non-string input', () => {
      const result = phoneValidationService.validateBangladeshPhone(123);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Phone number is required and must be a string');
      expect(result.code).toBe('INVALID_INPUT');
    });
  });

  describe('Edge Cases', () => {
    test('should handle maximum length phone numbers', () => {
      const result = phoneValidationService.validateBangladeshPhone('+880171234567890123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle phone with special characters', () => {
      const result = phoneValidationService.validateBangladeshPhone('+8801712345678abc');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle phone with spaces', () => {
      const result = phoneValidationService.validateBangladeshPhone('+880 171 234 5678');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Bangladesh-Specific Features', () => {
    test('should support Bengali error messages', () => {
      const result = phoneValidationService.validateBangladeshPhone('invalid');
      
      expect(result.isValid).toBe(false);
      expect(result.errorBn).toBeDefined();
      expect(result.errorBn).toContain('অবৈধ');
    });

    test('should provide format suggestions', () => {
      const result = phoneValidationService.validateBangladeshPhone('invalid');
      
      expect(result.isValid).toBe(false);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions).toContain('+8801XXXXXXXXX');
      expect(result.suggestions).toContain('01XXXXXXXXX');
    });

    test('should provide valid examples', () => {
      const result = phoneValidationService.validateBangladeshPhone('valid');
      
      expect(result.isValid).toBe(true);
      expect(result.examples).toBeDefined();
      expect(result.examples.mobile).toContain('+8801712345678');
      expect(result.examples.mobile).toContain('01712345678');
      expect(result.examples.landline).toContain('+880212345678');
    });
  });
});