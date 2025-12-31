export interface LoginData {
  emailOrPhone: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginFormProps {
  onSubmit: (data: LoginData) => void | Promise<void>;
  onLanguageChange?: (lang: 'en' | 'bn') => void;
  initialLanguage?: 'en' | 'bn';
  className?: string;
}

export interface RegistrationData {
  // Basic Information
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  
  // Personal Details
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  nationalId?: string; // NID/Passport
  
  // Address Information
  division?: string;
  district?: string;
  upazila?: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode?: string;
  
  // Preferences
  preferredLanguage?: 'en' | 'bn';
  marketingConsent?: boolean;
  termsAccepted: boolean;
}

export interface RegistrationStep {
  id: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  fields: string[];
}

export interface FormField {
  name: keyof RegistrationData;
  label: string;
  labelBn: string;
  type: 'text' | 'email' | 'tel' | 'password' | 'date' | 'select' | 'checkbox' | 'radio';
  required?: boolean;
  placeholder?: string;
  placeholderBn?: string;
  options?: Array<{ value: string; label: string; labelBn: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: string;
  };
}

export interface ValidationError {
  field: string;
  message: string;
  messageBn: string;
}

export interface FormState {
  data: Partial<RegistrationData>;
  errors: ValidationError[];
  isValid: boolean;
  isSubmitting: boolean;
  currentStep: number;
}

export interface ValidationStats {
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
    unknown: number;
  };
}

export interface PasswordStrength {
  score: number;
  level: 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
  feedbackBn: string[];
}

export interface PhoneValidation {
  isValid: boolean;
  operator?: string;
  operatorBn?: string;
  type?: 'mobile' | 'landline' | 'special';
  format?: 'international' | 'local' | 'country_code' | 'unknown';
  normalizedPhone?: string;
  areaCode?: string;
  areaInfo?: {
    area: string;
    areaBn: string;
    region: string;
    regionBn: string;
  };
  operatorDetails?: {
    prefix: string;
    name: string;
    nameBn: string;
    network: string;
    color: string;
    logo: string;
  };
  network?: string;
  isPorted?: boolean;
  specialType?: string;
  description?: string;
  descriptionBn?: string;
  examples?: string[];
  metadata?: {
    length: number;
    countryCode: string;
    numberWithoutCountry: string;
    category?: string;
  };
  canReceiveSMS?: boolean;
  canReceiveOTP?: boolean;
  requiresVerification?: boolean;
  isVerifiable?: boolean;
  error?: string;
  errorBn?: string;
  code?: string;
  suggestions?: string[];
  supportedOperators?: string[];
}

export interface BangladeshPhoneValidation extends PhoneValidation {
  originalPhone?: string;
}

export interface EmailValidation {
  isValid: boolean;
  isAvailable?: boolean;
  message?: string;
  messageBn?: string;
}

export interface AddressValidation {
  isValid: boolean;
  message?: string;
  messageBn?: string;
}

export interface RegistrationResponse {
  success: boolean;
  message: string;
  messageBn: string;
  data?: {
    userId?: string;
    email?: string;
    phone?: string;
    requiresVerification?: 'email' | 'phone' | 'both';
  };
}

export interface VerificationData {
  method: 'email' | 'phone';
  identifier: string; // email or phone
  code: string;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
  messageBn: string;
  isVerified: boolean;
}

// Language context type
export interface LanguageContextType {
  language: 'en' | 'bn';
  setLanguage: (lang: 'en' | 'bn') => void;
  t: (key: string) => string;
}

// Theme context type
export interface ThemeContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  messageBn?: string;
  data?: T;
  errors?: ValidationError[];
}

// User type for authenticated state
export interface User {
  id: string;
  email?: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  preferredLanguage: 'en' | 'bn';
  createdAt: string;
  updatedAt: string;
}

// Auth context type
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (emailOrPhone: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: RegistrationData) => Promise<void>;
  logout: () => void;
  verifyEmail: (email: string, code: string) => Promise<void>;
  verifyPhone: (phone: string, code: string) => Promise<void>;
  sendEmailVerification: (email: string) => Promise<void>;
  sendPhoneVerification: (phone: string) => Promise<void>;
  forgotPassword: (identifier: string) => Promise<void>;
  resetPassword: (token: string, password: string, confirmPassword: string) => Promise<void>;
  clearError: () => void;
  extendSession: () => Promise<void>;
  sessionTimeout: number | null;
}