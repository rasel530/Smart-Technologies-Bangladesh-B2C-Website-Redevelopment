import { z } from 'zod';
import { RegistrationData, PasswordStrength, PhoneValidation, EmailValidation } from '@/types/auth';
import { 
  validateBangladeshPhone, 
  normalizePhoneNumber, 
  formatPhoneNumber,
  getOperatorInfo,
  getOperatorColor,
  isOperator,
  getSupportedOperators,
  getSupportedLandlineAreas,
  validateForUseCase,
  createPhoneValidator,
  formatPhoneInput,
  MOBILE_OPERATORS,
  LANDLINE_AREA_CODES,
  SPECIAL_NUMBERS
} from './phoneValidation';

// NID pattern (10 or 13 digits)
const NID_PATTERN = /^\d{10}(\d{3})?$/;

// Passport pattern (alphanumeric with specific format)
const PASSPORT_PATTERN = /^[A-Za-z0-9]{6,9}$/;

// Postal code pattern (4 digits for Bangladesh)
const POSTAL_CODE_PATTERN = /^\d{4}$/;

// Name patterns (supporting Bengali characters)
const NAME_PATTERN = /^[A-Za-z\u0980-\u09FF\s'-]+$/;

// Password strength calculation
export const calculatePasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  const feedback: string[] = [];
  const feedbackBn: string[] = [];

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Password should be at least 8 characters long');
    feedbackBn.push('পাসওয়ার্ড অন্তত ৮ অক্ষরের হওয়া উচিত');
  }

  if (password.length >= 12) score += 1;

  // Character variety checks
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include lowercase letters');
    feedbackBn.push('ছোট হাতের অক্ষর অন্তর্ভুক করুন');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include uppercase letters');
    feedbackBn.push('বড় হাতের অক্ষর অন্তর্ভুক করুন');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include numbers');
    feedbackBn.push('সংখ্যা অন্তর্ভুক করুন');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include special characters');
    feedbackBn.push('বিশেষ অক্ষর অন্তর্ভুক করুন');
  }

  // Common patterns penalty
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('Avoid repeated characters');
    feedbackBn.push('পুনরাবৃত্তি অক্ষর এড়িয়ে চলুন');
  }

  if (/123|abc|qwe|password/i.test(password)) {
    score -= 1;
    feedback.push('Avoid common patterns');
    feedbackBn.push('সাধারণ প্যাটার্ন এড়িয়ে চলুন');
  }

  let level: 'weak' | 'fair' | 'good' | 'strong';
  if (score < 2) level = 'weak';
  else if (score < 4) level = 'fair';
  else if (score < 6) level = 'good';
  else level = 'strong';

  return { score: Math.max(0, Math.min(6, score)), level, feedback, feedbackBn };
};

// Email validation
export const validateEmail = (email: string): EmailValidation => {
  if (!email) {
    return {
      isValid: false,
      message: 'Email is required',
      messageBn: 'ইমেল প্রয়োজনীয়'
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      message: 'Invalid email format',
      messageBn: 'অবৈধ ইমেল ফরম্যাট'
    };
  }

  return {
    isValid: true
  };
};

// NID validation
export const validateNationalId = (nationalId: string) => {
  if (!nationalId) return { isValid: true }; // Optional field

  if (NID_PATTERN.test(nationalId)) {
    return { isValid: true };
  }

  return {
    isValid: false,
    message: 'National ID must be 10 or 13 digits',
    messageBn: 'জাতীয় পরিচয়পত্র অবশ্যই ১০ বা ১৩ সংখ্যার হতে হবে'
  };
};

// Address validation
export const validateAddress = (division: string, district: string, upazila: string, addressLine1: string) => {
  if (!addressLine1) {
    return {
      isValid: false,
      message: 'Address line 1 is required',
      messageBn: 'ঠিকানার লাইন ১ প্রয়োজনীয়'
    };
  }

  if (addressLine1.length < 10) {
    return {
      isValid: false,
      message: 'Address must be at least 10 characters long',
      messageBn: 'ঠিকানা অবশ্যই ১০ অক্ষরের হতে হবে'
    };
  }

  return { isValid: true };
};

// Zod schema for registration
export const registrationSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .regex(NAME_PATTERN, 'First name can only contain letters, spaces, hyphens, and apostrophes')
    .refine((name) => !/^\s+$/.test(name), 'First name cannot be only spaces'),

  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .regex(NAME_PATTERN, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
    .refine((name) => !/^\s+$/.test(name), 'Last name cannot be only spaces'),

  email: z
    .string()
    .optional()
    .refine((email) => {
      if (!email) return true; // Optional field
      return validateEmail(email).isValid;
    }, 'Invalid email format'),

  phone: z
    .string()
    .optional()
    .refine((phone) => {
      if (!phone) return true; // Optional field
      return validateBangladeshPhone(phone).isValid;
    }, 'Invalid Bangladesh phone number'),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters'),

  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),

  dateOfBirth: z
    .date()
    .optional()
    .refine((date) => {
      if (!date) return true; // Optional field
      const now = new Date();
      const minDate = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
      const maxDate = new Date(now.getFullYear() - 13, now.getMonth(), now.getDate());
      return date >= minDate && date <= maxDate;
    }, 'You must be between 13 and 120 years old'),

  gender: z
    .enum(['male', 'female', 'other'])
    .optional(),

  nationalId: z
    .string()
    .optional()
    .refine((nid) => {
      if (!nid) return true; // Optional field
      return validateNationalId(nid).isValid;
    }, 'Invalid National ID format'),

  division: z
    .string()
    .optional(),

  district: z
    .string()
    .optional(),

  upazila: z
    .string()
    .optional(),

  addressLine1: z
    .string()
    .min(10, 'Address must be at least 10 characters')
    .max(200, 'Address must be less than 200 characters')
    .refine((address) => !/^\s+$/.test(address), 'Address cannot be only spaces'),

  addressLine2: z
    .string()
    .optional()
    .refine((addr) => !addr || addr.length <= 200, 'Address line 2 must be less than 200 characters'),

  postalCode: z
    .string()
    .optional()
    .refine((code) => {
      if (!code) return true; // Optional field
      return POSTAL_CODE_PATTERN.test(code);
    }, 'Postal code must be 4 digits'),

  preferredLanguage: z
    .enum(['en', 'bn'])
    .default('en'),

  marketingConsent: z
    .boolean()
    .default(false),

  termsAccepted: z
    .boolean()
    .refine((accepted) => accepted === true, 'You must accept the terms and conditions')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

// Step-specific schemas
export const basicInfoSchema = registrationSchema.pick({
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  password: true,
  confirmPassword: true
});

export const personalDetailsSchema = registrationSchema.pick({
  dateOfBirth: true,
  gender: true,
  nationalId: true
});

export const addressSchema = registrationSchema.pick({
  division: true,
  district: true,
  upazila: true,
  addressLine1: true,
  addressLine2: true,
  postalCode: true
});

export const preferencesSchema = registrationSchema.pick({
  preferredLanguage: true,
  marketingConsent: true,
  termsAccepted: true
});

// Validation helpers
export const validateStep = (step: number, data: Partial<RegistrationData>) => {
  switch (step) {
    case 1:
      return basicInfoSchema.safeParse(data);
    case 2:
      return personalDetailsSchema.safeParse(data);
    case 3:
      return addressSchema.safeParse(data);
    case 4:
      return preferencesSchema.safeParse(data);
    default:
      return { success: false, error: { issues: [{ message: 'Invalid step' }] };
  }
};

export const getRequiredFieldsForStep = (step: number): (keyof RegistrationData)[] => {
  switch (step) {
    case 1:
      return ['firstName', 'lastName', 'password', 'confirmPassword'];
    case 2:
      return [];
    case 3:
      return ['addressLine1'];
    case 4:
      return ['termsAccepted'];
    default:
      return [];
  }
};