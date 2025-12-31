import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Progress from '@radix-ui/react-progress';
import * as Tabs from '@radix-ui/react-tabs';
import { ChevronLeft, ChevronRight, Check, AlertCircle, Eye, EyeOff, User, Mail, Lock, Calendar, Map, Globe, Shield } from 'lucide-react';
import { 
  RegistrationData, 
  FormState, 
  RegistrationStep, 
  PasswordStrength,
  PhoneValidation,
  EmailValidation 
} from '@/types/auth';
import { registrationSchema, validateStep, calculatePasswordStrength, validateBangladeshPhone, validateEmail } from '@/lib/validation';
import { FormInput } from '@/components/ui/FormInput';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { PasswordStrengthIndicator } from '@/components/ui/PasswordStrengthIndicator';
import { BangladeshAddress } from '@/components/ui/BangladeshAddress';
import { cn } from '@/lib/utils';

interface RegistrationFormProps {
  onSubmit: (data: Partial<RegistrationData>) => Promise<void>;
  language?: 'en' | 'bn';
  onLanguageChange?: (language: 'en' | 'bn') => void;
  initialLanguage?: 'en' | 'bn';
  className?: string;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onSubmit,
  onLanguageChange,
  initialLanguage = 'en',
  className
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [language, setLanguage] = useState<'en' | 'bn'>(initialLanguage);
  const [emailValidation, setEmailValidation] = useState<EmailValidation | null>(null);
  const [phoneValidation, setPhoneValidation] = useState<PhoneValidation | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    level: 'weak',
    feedback: [],
    feedbackBn: []
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    trigger,
    formState: { errors, isValid }
  } = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      dateOfBirth: undefined,
      gender: undefined,
      nationalId: '',
      division: '',
      district: '',
      upazila: '',
      addressLine1: '',
      addressLine2: '',
      postalCode: '',
      preferredLanguage: initialLanguage,
      marketingConsent: false,
      termsAccepted: false
    }
  });

  // Watch form values
  const watchedValues = watch();
  const password = watch('password');
  const confirmPassword = watch('confirmPassword');
  const email = watch('email');
  const phone = watch('phone');

  // Update language when it changes
  useEffect(() => {
    if (language) {
      setValue('preferredLanguage', language);
      onLanguageChange?.(language);
    }
  }, [language, setValue, onLanguageChange]);

  // Password strength calculation
  useEffect(() => {
    if (password) {
      setPasswordStrength(calculatePasswordStrength(password));
    } else {
      setPasswordStrength({
        score: 0,
        level: 'weak',
        feedback: [],
        feedbackBn: []
      });
    }
  }, [password]);

  // Email validation
  const validateEmailField = useCallback(async (email: string) => {
    if (!email) {
      setEmailValidation(null);
      return;
    }

    const basicValidation = validateEmail(email);
    if (!basicValidation.isValid) {
      setEmailValidation(basicValidation);
      return;
    }

    // Simulate API call for email availability
    try {
      // const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
      // const data = await response.json();
      
      // For demo, simulate validation
      setTimeout(() => {
        setEmailValidation({
          isValid: true,
          isAvailable: true
        });
      }, 500);
    } catch (error) {
      setEmailValidation({
        isValid: false,
        message: 'Failed to validate email'
      });
    }
  }, []);

  // Phone validation
  const validatePhoneField = useCallback((phone: string) => {
    const validation = validateBangladeshPhone(phone);
    setPhoneValidation(validation);
  }, []);

  // Registration steps
  const steps: RegistrationStep[] = [
    {
      id: 'basic',
      title: 'Basic Information',
      titleBn: 'মৌলিক তথ্য',
      description: 'Enter your basic personal information',
      descriptionBn: 'আপনার মৌলিক তথ্য তথ্য করুন',
      fields: ['firstName', 'lastName', 'email', 'phone', 'password', 'confirmPassword']
    },
    {
      id: 'personal',
      title: 'Personal Details',
      titleBn: 'ব্যক্তিগত বিবরণ',
      description: 'Additional personal information',
      descriptionBn: 'অতিরিক্ত ব্যক্তিগত তথ্য',
      fields: ['dateOfBirth', 'gender', 'nationalId']
    },
    {
      id: 'address',
      title: 'Address Information',
      titleBn: 'ঠিকানার তথ্য',
      description: 'Enter your address details',
      descriptionBn: 'আপনার ঠিকানার তথ্য তথ্য করুন',
      fields: ['division', 'district', 'upazila', 'addressLine1', 'addressLine2', 'postalCode']
    },
    {
      id: 'preferences',
      title: 'Preferences',
      titleBn: 'পছণ্ড',
      description: 'Set your preferences and accept terms',
      descriptionBn: 'আপনার পছণ্ড নির্বাচন এবং শর্তব মেনে গ্রহণ করুন',
      fields: ['preferredLanguage', 'marketingConsent', 'termsAccepted']
    }
  ];

  const currentStepData = steps[currentStep - 1];
  const progressPercentage = (currentStep / steps.length) * 100;

  const handleNext = async () => {
    const currentFields = currentStepData.fields;
    const validationResult = validateStep(currentStep, getValues());
    
    if (!validationResult.success) {
      // Trigger validation for current step fields
      await Promise.all(
        currentFields.map(field => trigger(field as keyof RegistrationData))
      );
      return;
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepNumber: number) => {
    // Only allow navigation to completed steps or previous steps
    if (stepNumber <= currentStep) {
      setCurrentStep(stepNumber);
    }
  };

  const onFormSubmit = async (data: Partial<RegistrationData>) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepIcon = (stepId: string) => {
    switch (stepId) {
      case 'basic':
        return <User className="w-4 h-4" />;
      case 'personal':
        return <Calendar className="w-4 h-4" />;
      case 'address':
        return <Map className="w-4 h-4" />;
      case 'preferences':
        return <Globe className="w-4 h-4" />;
      default:
        return <div className="w-4 h-4" />;
    }
  };

  const isStepCompleted = (stepNumber: number) => {
    const stepFields = steps[stepNumber - 1].fields;
    const stepValues = getValues();
    
    return stepFields.every(field => {
      const value = stepValues[field as keyof RegistrationData];
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      if (typeof value === 'boolean') {
        return value === true;
      }
      return value !== undefined && value !== null;
    });
  };

  return (
    <div className={cn('w-full max-w-2xl mx-auto', className)}>
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-secondary-900">
            {language === 'bn' ? 'নিবন্ধন প্রক্রিয়া' : 'Registration Progress'}
          </h2>
          <span className="text-sm text-secondary-600">
            {currentStep} / {steps.length}
          </span>
        </div>
        
        <Progress.Root className="h-2 bg-secondary-200 rounded-full overflow-hidden" value={progressPercentage}>
          <Progress.Indicator 
            className="h-full bg-primary-600 rounded-full transition-all duration-300" 
            style={{ width: `${progressPercentage}%` }}
          />
        </Progress.Root>
        
        <div className="flex justify-between mt-4">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = isStepCompleted(stepNumber);
            
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleStepClick(stepNumber)}
                disabled={stepNumber > currentStep}
                className={cn(
                  'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                  {
                    'bg-primary-600 text-white': isActive,
                    'bg-green-100 text-green-700': isCompleted && !isActive,
                    'bg-secondary-100 text-secondary-600': !isCompleted && !isActive,
                    'cursor-not-allowed opacity-50': stepNumber > currentStep
                  }
                )}
                aria-label={`Step ${stepNumber}: ${language === 'bn' ? step.titleBn : step.title}`}
                aria-current={isActive ? 'step' : undefined}
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  {
                    'bg-primary-600 text-white': isActive,
                    'bg-green-500 text-white': isCompleted && !isActive,
                    'bg-secondary-300 text-secondary-600': !isCompleted && !isActive
                  }
                )}>
                  {isCompleted && !isActive ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    getStepIcon(step.id)
                  )}
                </div>
                <div className="text-left">
                  <div className="font-medium">
                    {language === 'bn' ? step.titleBn : step.title}
                  </div>
                  <div className="text-xs opacity-75">
                    {language === 'bn' ? step.descriptionBn : step.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-6">
              {language === 'bn' ? 'মৌলিক তথ্য' : 'Basic Information'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <FormInput
                    {...field}
                    label={language === 'bn' ? 'প্রথম নাম' : 'First Name'}
                    labelBn="প্রথম নাম"
                    error={errors.firstName?.message}
                    errorBn={errors.firstName?.message}
                    required
                    language={language}
                    placeholder={language === 'bn' ? 'আপনার প্রথম নাম' : 'Enter your first name'}
                  />
                )}
              />

              <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                  <FormInput
                    {...field}
                    label={language === 'bn' ? 'শেষনাম' : 'Last Name'}
                    labelBn="শেষনাম"
                    error={errors.lastName?.message}
                    errorBn={errors.lastName?.message}
                    required
                    language={language}
                    placeholder={language === 'bn' ? 'আপনার শেষনাম' : 'Enter your last name'}
                  />
                )}
              />
            </div>

            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <FormInput
                    {...field}
                    type="email"
                    label={language === 'bn' ? 'ইমেল' : 'Email Address'}
                    labelBn="ইমেল"
                    error={errors.email?.message}
                    errorBn={errors.email?.message}
                    language={language}
                    placeholder={language === 'bn' ? 'আপনার ইমেল ঠিকানা' : 'Enter your email address'}
                    helperText={emailValidation?.isAvailable === false 
                      ? (language === 'bn' ? 'এই ইমেল ইতিমাডে়ে আছে' : 'This email is already registered')
                      : emailValidation?.isValid
                      ? (language === 'bn' ? 'ইমেল ঠিকানা বৈধ' : 'Email format is valid')
                      : ''
                    }
                    helperTextBn={emailValidation?.isAvailable === false 
                      ? 'এই ইমেল ইতিমাডে়ে আছে'
                      : emailValidation?.isValid
                      ? 'ইমেল ঠিকানা বৈধ'
                      : ''
                    }
                  />
                  
                  {emailValidation && (
                    <div className="flex items-center space-x-2 text-sm">
                      {emailValidation.isValid ? (
                        <div className="flex items-center text-green-600">
                          <Check className="w-4 h-4" />
                          <span>{language === 'bn' ? 'ইমেল পাওয়ায়োজনীয়' : 'Email available for registration'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          <span>{emailValidation.message}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            />

            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <PhoneInput
                  {...field}
                  label={language === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'}
                  labelBn="মোবাইল নম্বর"
                  error={errors.phone?.message}
                  errorBn={errors.phone?.message}
                  required={false}
                  language={language}
                  showValidation={true}
                />
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <FormInput
                      {...field}
                      type={showPassword ? 'text' : 'password'}
                      label={language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                      labelBn="পাসওয়ার্ড"
                      error={errors.password?.message}
                      errorBn={errors.password?.message}
                      required
                      language={language}
                      placeholder={language === 'bn' ? 'আপনার পাসওয়ার্ড' : 'Enter your password'}
                    />
                    
                    <PasswordStrengthIndicator 
                      password={field.value || ''} 
                      language={language}
                    />
                  </div>
                )}
              />

              <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <div className="relative">
                      <FormInput
                        {...field}
                        type={showConfirmPassword ? 'text' : 'password'}
                        label={language === 'bn' ? 'পাসওয়ার্ড নিশ্চায়ন করুন' : 'Confirm Password'}
                        labelBn="পাসওয়ার্ড নিশ্চায়ন করুন"
                        error={errors.confirmPassword?.message}
                        errorBn={errors.confirmPassword?.message}
                        required
                        language={language}
                        placeholder={language === 'bn' ? 'আবার পাসওয়ার্ড লিখুন' : 'Confirm your password'}
                      />
                      
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-600"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              />
            </div>
          </div>
        )}

        {/* Step 2: Personal Details */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-6">
              {language === 'bn' ? 'ব্যক্তিগত বিবরণ' : 'Personal Details'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="dateOfBirth"
                control={control}
                render={({ field }) => (
                  <FormInput
                    {...field}
                    type="date"
                    value={field.value ? field.value.toISOString().split('T')[0] : ''}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                    label={language === 'bn' ? 'জন্ম তারিখ' : 'Date of Birth'}
                    labelBn="জন্ম তারিখ"
                    error={errors.dateOfBirth?.message}
                    errorBn={errors.dateOfBirth?.message}
                    language={language}
                  />
                )}
              />

              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      {language === 'bn' ? 'লিঙ্গ' : 'Gender'}
                    </label>
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                      aria-label={language === 'bn' ? 'লিঙ্গ নির্বাচন করুন' : 'Select gender'}
                    >
                      <option value="">{language === 'bn' ? 'নির্বাচন করুন' : 'Select gender'}</option>
                      <option value="male">{language === 'bn' ? 'পুরুষ' : 'Male'}</option>
                      <option value="female">{language === 'bn' ? 'মহিলা' : 'Female'}</option>
                      <option value="other">{language === 'bn' ? 'অন্যান্য' : 'Other'}</option>
                    </select>
                    {errors.gender?.message && (
                      <p className="text-sm text-red-600 mt-1" role="alert">
                        {errors.gender.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            <Controller
              name="nationalId"
              control={control}
              render={({ field }) => (
                <FormInput
                  {...field}
                  label={language === 'bn' ? 'জাতীয় পরিচয়পত্র নম্বর' : 'National ID / Passport'}
                  labelBn="জাতীয় পরিচয়পত্র নম্বর"
                  error={errors.nationalId?.message}
                  errorBn={errors.nationalId?.message}
                  language={language}
                  placeholder={language === 'bn' ? 'জাতীয় পরিচয়পত্র নম্বর নম্বর লিখুন' : 'Enter your National ID or Passport number'}
                  helperText={language === 'bn' ? 'ঐচ্ছিক্তভুক্ত (১০ বা ১৩ সংখ্যা)' : 'Optional (10 or 13 digits)'}
                  helperTextBn="ঐচ্ছিক্তভুক্ত (১০ বা ১৩ সংখ্যা)"
                />
              )}
            />
          </div>
        )}

        {/* Step 3: Address Information */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-6">
              {language === 'bn' ? 'ঠিকানার তথ্য' : 'Address Information'}
            </h3>
            
            <Controller
              name="division"
              control={control}
              render={({ field }) => (
                <BangladeshAddress
                  key={`address-${language}`}
                  division={field.value || ''}
                  district={watchedValues.district || ''}
                  upazila={watchedValues.upazila || ''}
                  onDivisionChange={(value) => setValue('division', value)}
                  onDistrictChange={(value) => setValue('district', value)}
                  onUpazilaChange={(value) => setValue('upazila', value)}
                  errors={{
                    division: errors.division?.message,
                    district: errors.district?.message,
                    upazila: errors.upazila?.message
                  }}
                  errorsBn={{
                    division: errors.division?.message,
                    district: errors.district?.message,
                    upazila: errors.upazila?.message
                  }}
                  language={language}
                />
              )}
            />

            <div className="space-y-4 mt-6">
              <Controller
                name="addressLine1"
                control={control}
                render={({ field }) => (
                  <FormInput
                    {...field}
                    label={language === 'bn' ? 'ঠিকানার লাইন ১' : 'Address Line 1'}
                    labelBn="ঠিকানার লাইন ১"
                    error={errors.addressLine1?.message}
                    errorBn={errors.addressLine1?.message}
                    required
                    language={language}
                    placeholder={language === 'bn' ? 'আপনার রাস্তার ঠিকানা লিখুন' : 'Enter your street address'}
                  />
                )}
              />

              <Controller
                name="addressLine2"
                control={control}
                render={({ field }) => (
                  <FormInput
                    {...field}
                    label={language === 'bn' ? 'ঠিকানার লাইন ২' : 'Address Line 2'}
                    labelBn="ঠিকানার লাইন ২"
                    error={errors.addressLine2?.message}
                    errorBn={errors.addressLine2?.message}
                    language={language}
                    placeholder={language === 'bn' ? 'এলাকা, ফ্ল্যাট, অ্যাপার্টমেন্ট ইত্যাদি' : 'Apartment, suite, unit, etc. (optional)'}
                  />
                )}
              />

              <Controller
                name="postalCode"
                control={control}
                render={({ field }) => (
                  <FormInput
                    {...field}
                    label={language === 'bn' ? 'পোস্টাল কোড' : 'Postal Code'}
                    labelBn="পোস্টাল কোড"
                    error={errors.postalCode?.message}
                    errorBn={errors.postalCode?.message}
                    language={language}
                    placeholder={language === 'bn' ? '৪ সংখ্যার পোস্টাল কোড' : '4-digit postal code'}
                    helperText={language === 'bn' ? 'ঐচ্ছিক্তভুক্ত' : 'Optional'}
                    helperTextBn="ঐচ্ছিক্তভুক্ত"
                  />
                )}
              />
            </div>
          </div>
        )}

        {/* Step 4: Preferences */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-6">
              {language === 'bn' ? 'পছণ্ড' : 'Preferences'}
            </h3>
            
            <Controller
              name="preferredLanguage"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    {language === 'bn' ? 'পছণ্ডমত ভাষা' : 'Preferred Language'}
                  </label>
                  <select
                    {...field}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                    aria-label={language === 'bn' ? 'পছণ্ডমত ভাষা নির্বাচন করুন' : 'Select preferred language'}
                  >
                    <option value="en">English</option>
                    <option value="bn">বাংলা</option>
                  </select>
                  {errors.preferredLanguage?.message && (
                    <p className="text-sm text-red-600 mt-1" role="alert">
                      {errors.preferredLanguage.message}
                    </p>
                  )}
                </div>
              )}
            />

            <Controller
              name="marketingConsent"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                      aria-describedby="marketing-consent-description"
                    />
                    <span className="text-sm text-secondary-700">
                      {language === 'bn' ? 'মার্কেটিং যোগাচাইপ নিউজের ইমেল পাঠানোর জন্য গ্রহণ করতে সম্মতি করি' : 'Send me marketing emails and notifications'}
                    </span>
                  </label>
                  <p id="marketing-consent-description" className="text-xs text-secondary-500 mt-1">
                    {language === 'bn' ? 'আমরা আপনাকে পণ্য়ের, অফার এবং বিশেষ অফার সম্পর্ক সম্পর্ক করব। আপনি যেকোনো ইচ্ছা পরিবর্তন করতে পারেন।' : 'We\'ll send you updates about products, services, and offers. You can unsubscribe at any time.'}
                  </p>
                  {errors.marketingConsent?.message && (
                    <p className="text-sm text-red-600 mt-1" role="alert">
                      {errors.marketingConsent.message}
                    </p>
                  )}
                </div>
              )}
            />

            <Controller
              name="termsAccepted"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <label className="flex items-start space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500 mt-1"
                      aria-describedby="terms-conditions-description"
                      required
                    />
                    <span className="text-sm text-secondary-700">
                      {language === 'bn' ? 'আমি ' : 'I agree to the '}
                      <a 
                        href="/terms" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 underline"
                      >
                        {language === 'bn' ? 'শর্তব মেনে গ্রহণ' : 'Terms and Conditions'}
                      </a>
                      {language === 'bn' ? ' এবং গোপনীয়তি নীতিমান্ট মেনে গ্রহণ করতে সম্মতি করি' : ' and Privacy Policy'}
                    </span>
                  </label>
                  <p id="terms-conditions-description" className="text-xs text-secondary-500 mt-1">
                    {language === 'bn' ? 'আমাদের ব্যবহারবহার সুরক্ষা অনুযায়ী করতে পারেন।' : 'Please read our terms carefully before proceeding.'}
                  </p>
                  {errors.termsAccepted?.message && (
                    <p className="text-sm text-red-600 mt-1" role="alert">
                      {errors.termsAccepted.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={cn(
              'flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200',
              {
                'bg-secondary-200 text-secondary-700 hover:bg-secondary-300': currentStep > 1,
                'bg-gray-100 text-gray-400 cursor-not-allowed': currentStep === 1
              }
            )}
            aria-label={language === 'bn' ? 'আগের ধাপ' : 'Previous step'}
          >
            <ChevronLeft className="w-4 h-4" />
            {language === 'bn' ? 'আগের ধাপ' : 'Previous'}
          </button>

          <button
            type={currentStep === steps.length ? 'submit' : 'button'}
            onClick={currentStep === steps.length ? undefined : handleNext}
            disabled={isSubmitting || (currentStep === steps.length && !isValid)}
            className={cn(
              'flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200',
              {
                'bg-primary-600 text-white hover:bg-primary-700': !isSubmitting,
                'bg-primary-400 text-white cursor-not-allowed': isSubmitting
              }
            )}
            aria-label={currentStep === steps.length 
              ? (language === 'bn' ? 'নিবন্ধন সম্পন করুন' : 'Complete registration')
              : (language === 'bn' ? 'পরবর্তী ধাপ' : 'Next step')
            }
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" />
            ) : currentStep === steps.length ? (
              <Shield className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            
            {currentStep === steps.length 
              ? (language === 'bn' ? 'নিবন্ধন সম্পন করুন' : 'Complete Registration')
              : (language === 'bn' ? 'পরবর্তী ধাপ' : 'Next')
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export { RegistrationForm };