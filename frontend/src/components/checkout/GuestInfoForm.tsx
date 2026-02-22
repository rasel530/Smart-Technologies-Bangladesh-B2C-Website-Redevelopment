'use client';

import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { GuestInfo, GuestInfoFormProps } from '@/types/guestCheckout';

/**
 * Guest Info Form Component
 *
 * Collects guest information during checkout including:
 * - Name fields (first name, last name)
 * - Email field with validation
 * - Phone field with Bangladesh validation
 * - Optional account creation checkbox
 * - Password fields (if creating account)
 * - Real-time validation
 * - Mobile-optimized layout
 *
 * @example
 * ```tsx
 * <GuestInfoForm
 *   onSubmit={(data) => console.log('Guest info:', data)}
 *   language="en"
 *   showAccountCreation={true}
 * />
 * ```
 */

export const GuestInfoForm: React.FC<GuestInfoFormProps> = ({
  onSubmit,
  initialData,
  isLoading = false,
  language = 'en',
  className = '',
  showAccountCreation = true,
}) => {
  const [formData, setFormData] = useState<GuestInfo>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    createAccount: initialData?.createAccount || false,
    password: initialData?.password || '',
    confirmPassword: initialData?.confirmPassword || '',
    agreeToTerms: initialData?.agreeToTerms || false,
    agreeToPrivacy: initialData?.agreeToPrivacy || false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof GuestInfo, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Validate email format
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Validate Bangladesh phone number format
   */
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^01[3-9]\d{8}$/;
    return phoneRegex.test(phone);
  };

  /**
   * Validate password strength
   */
  const validatePassword = (password: string): { isValid: boolean; message?: string } => {
    if (!formData.createAccount) {
      return { isValid: true };
    }

    if (password.length < 8) {
      return { isValid: false, message: language === 'bn' ? 'পাসওয়ার্ড কমপক্ষ ৮ অক্ষর হতে হবে' : 'Password must be at least 8 characters' };
    }

    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: language === 'bn' ? 'পাসওয়ার্ডে কমপক্ষ একটি বড় হাতের অক্ষর থাকতে হবে' : 'Password must contain at least one uppercase letter' };
    }

    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: language === 'bn' ? 'পাসওয়ার্ডে কমপক্ষ একটি ছোট হাতের অক্ষর থাকতে হবে' : 'Password must contain at least one lowercase letter' };
    }

    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: language === 'bn' ? 'পাসওয়ার্ডে কমপক্ষ একটি সংখ্যা থাকতে হবে' : 'Password must contain at least one number' };
    }

    return { isValid: true };
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof GuestInfo, string>> = {};

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = language === 'bn' ? 'নাম প্রয়োজন' : 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = language === 'bn' ? 'নাম কমপক্ষ ২ অক্ষর হতে হবে' : 'First name must be at least 2 characters';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = language === 'bn' ? 'নাম প্রয়োজন' : 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = language === 'bn' ? 'নাম কমপক্ষ ২ অক্ষর হতে হবে' : 'Last name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = language === 'bn' ? 'ইমেল প্রয়োজন' : 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = language === 'bn' ? 'অবৈধ ইমেল ফরম্যাট' : 'Invalid email format';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = language === 'bn' ? 'ফোন নম্বর প্রয়োজন' : 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = language === 'bn' ? 'অবৈধ ফোন নম্বর ফরম্যাট (01XXXXXXXXX)' : 'Invalid phone number format (01XXXXXXXXX)';
    }

    // Password validation (if creating account)
    if (formData.createAccount) {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.message;
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = language === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন প্রয়োজন' : 'Confirm password is required';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = language === 'bn' ? 'পাসওয়ার্ড মিলছে না' : 'Passwords do not match';
      }
    }

    // Terms and privacy validation (if creating account)
    if (formData.createAccount) {
      if (!formData.agreeToTerms) {
        newErrors.agreeToTerms = language === 'bn' ? 'শর্তাবলী মেনে নিতে হবে' : 'You must agree to the terms';
      }

      if (!formData.agreeToPrivacy) {
        newErrors.agreeToPrivacy = language === 'bn' ? 'গোপনীয়তা নীতিমালা মেনে নিতে হবে' : 'You must agree to the privacy policy';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form field change
   */
  const handleFieldChange = (field: keyof GuestInfo, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Auto-fill shipping address name when name fields change
    if (field === 'firstName' || field === 'lastName') {
      // This will be handled by parent component
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(language === 'bn' ? 'অনুগ্রহ করে সকল ত্রুটি সংশোধন করুন' : 'Please fix all errors');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Guest info form submission error:', error);
      toast.error(language === 'bn' ? 'ফর্ম জমা দিতে ব্যর্থ' : 'Failed to submit form');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('guest-info-form space-y-6', className)}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <User className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            {language === 'bn' ? 'আপনার তথ্য প্রদান করুন' : 'Provide Your Information'}
          </h2>
        </div>
        <p className="text-sm text-gray-600">
          {language === 'bn' 
            ? 'চেকআউট সম্পন্ন করতে আপনার তথ্য প্রদান করুন' 
            : 'Provide your information to complete checkout'}
        </p>
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* First Name */}
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            {language === 'bn' ? 'নাম (প্রথম)' : 'First Name'} *
          </label>
          <div className="relative">
            <input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleFieldChange('firstName', e.target.value)}
              className={cn(
                'w-full px-4 py-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors',
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              )}
              placeholder={language === 'bn' ? 'নাম লিখুন' : 'Enter first name'}
              disabled={isSubmitting || isLoading}
            />
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.firstName}
            </p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            {language === 'bn' ? 'নাম (শেষ)' : 'Last Name'} *
          </label>
          <div className="relative">
            <input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => handleFieldChange('lastName', e.target.value)}
              className={cn(
                'w-full px-4 py-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors',
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              )}
              placeholder={language === 'bn' ? '�াম লিখুন' : 'Enter last name'}
              disabled={isSubmitting || isLoading}
            />
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.lastName}
            </p>
          )}
        </div>
      </div>

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          {language === 'bn' ? 'ইমেল' : 'Email'} *
        </label>
        <div className="relative">
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            className={cn(
              'w-full px-4 py-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors',
              errors.email ? 'border-red-500' : 'border-gray-300'
            )}
            placeholder={language === 'bn' ? 'ইমেল লিখুন' : 'Enter email address'}
            disabled={isSubmitting || isLoading}
          />
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        {errors.email && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.email}
          </p>
        )}
      </div>

      {/* Phone Field */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          {language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'} *
        </label>
        <div className="relative">
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
            maxLength={11}
            className={cn(
              'w-full px-4 py-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors',
              errors.phone ? 'border-red-500' : 'border-gray-300'
            )}
            placeholder="01XXXXXXXXX"
            disabled={isSubmitting || isLoading}
          />
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.phone}
          </p>
        )}
      </div>

      {/* Account Creation Section */}
      {showAccountCreation && (
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-start gap-3 mb-4">
            <input
              id="createAccount"
              type="checkbox"
              checked={formData.createAccount}
              onChange={(e) => handleFieldChange('createAccount', e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting || isLoading}
            />
            <label htmlFor="createAccount" className="text-sm text-gray-700 cursor-pointer">
              {language === 'bn' 
                ? 'একটি অ্যাকাউন্ট তৈরি করুন (ঐচ্ছিক)' 
                : 'Create an account (optional)'}
            </label>
          </div>

          {formData.createAccount && (
            <div className="space-y-4 pl-7 animate-in fade-in slide-in-from-top-2">
              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'} *
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
                    className={cn(
                      'w-full px-4 py-3 pl-10 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors',
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    )}
                    placeholder={language === 'bn' ? 'পাসওয়ার্ড লিখুন' : 'Enter password'}
                    disabled={isSubmitting || isLoading}
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'} *
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                    className={cn(
                      'w-full px-4 py-3 pl-10 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors',
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    )}
                    placeholder={language === 'bn' ? 'পাসওয়ার্ড আবার লিখুন' : 'Confirm password'}
                    disabled={isSubmitting || isLoading}
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.confirmPassword}
                  </p>
                )}
                {formData.confirmPassword && !errors.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {language === 'bn' ? 'পাসওয়ার্ড মিলেছে' : 'Passwords match'}
                  </p>
                )}
              </div>

              {/* Terms and Privacy */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    id="agreeToTerms"
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={(e) => handleFieldChange('agreeToTerms', e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:border-transparent"
                    disabled={isSubmitting || isLoading}
                  />
                  <label htmlFor="agreeToTerms" className="text-sm text-gray-700 cursor-pointer">
                    {language === 'bn' 
                      ? 'আমি স্বীকার করি যে আমি ' 
                      : 'I agree to the '}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      {language === 'bn' ? 'শর্তাবলী' : 'Terms of Service'}
                    </a>
                  </label>
                </div>
                {errors.agreeToTerms && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1 pl-7">
                    <AlertCircle className="w-3 h-3" />
                    {errors.agreeToTerms}
                  </p>
                )}

                <div className="flex items-start gap-3">
                  <input
                    id="agreeToPrivacy"
                    type="checkbox"
                    checked={formData.agreeToPrivacy}
                    onChange={(e) => handleFieldChange('agreeToPrivacy', e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:border-transparent"
                    disabled={isSubmitting || isLoading}
                  />
                  <label htmlFor="agreeToPrivacy" className="text-sm text-gray-700 cursor-pointer">
                    {language === 'bn' 
                      ? 'আমি স্বীকার করি যে আমি ' 
                      : 'I agree to the '}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      {language === 'bn' ? 'গোপনীয়তা নীতিমালা' : 'Privacy Policy'}
                    </a>
                  </label>
                </div>
                {errors.agreeToPrivacy && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1 pl-7">
                    <AlertCircle className="w-3 h-3" />
                    {errors.agreeToPrivacy}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200',
            'bg-blue-600 text-white',
            'hover:bg-blue-700',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'active:scale-95'
          )}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-t-2 border-white"></div>
              <span>
                {language === 'bn' ? 'প্রক্রিয়া চলছে...' : 'Processing...'}
              </span>
            </>
          ) : (
            <>
              <span>
                {language === 'bn' ? 'চালিয়ে যান' : 'Continue'}
              </span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default GuestInfoForm;
