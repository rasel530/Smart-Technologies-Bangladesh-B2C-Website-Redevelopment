'use client';

import React, { useState } from 'react';
import { UserPlus, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Info, Shield, FileText, User, Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { GuestAccountCreationRequest, GuestAccountCreationProps } from '@/types/guestCheckout';

/**
 * Guest Account Creation Component
 *
 * Provides account creation form from guest data including:
 * - Pre-filled with guest information
 * - Password creation
 * - Terms and conditions
 * - Privacy policy agreement
 * - Validation
 * - Mobile-optimized layout
 *
 * @example
 * ```tsx
 * <GuestAccountCreation
 *   onSubmit={(data) => console.log('Create account:', data)}
 *   initialData={{ firstName: 'John', email: 'john@example.com' }}
 *   language="en"
 * />
 * ```
 */

export const GuestAccountCreation: React.FC<GuestAccountCreationProps> = ({
  onSubmit,
  initialData,
  isLoading = false,
  language = 'en',
  className = '',
  guestId,
  guestCartId,
}) => {
  const [formData, setFormData] = useState<GuestAccountCreationRequest>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    agreeToPrivacy: false,
    guestId: guestId || initialData?.guestId || '',
    guestCartId: guestCartId || initialData?.guestCartId || '',
    mergeCart: true,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof GuestAccountCreationRequest, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);

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
  const validatePassword = (password: string): { isValid: boolean; strength: 'weak' | 'medium' | 'strong'; message?: string } => {
    if (password.length < 8) {
      return { isValid: false, strength: 'weak', message: language === 'bn' ? 'পাসওয়ার্ড কমপক্ষ ৮ অক্ষর হতে হবে' : 'Password must be at least 8 characters' };
    }

    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    let score = 0;

    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score >= 3) {
      strength = 'strong';
    } else if (score >= 2) {
      strength = 'medium';
    }

    return { isValid: true, strength };
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof GuestAccountCreationRequest, string>> = {};

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

    // Password validation
    const passwordValidation = validatePassword(formData.password);
    if (!formData.password) {
      newErrors.password = language === 'bn' ? 'পাসওয়ার্ড প্রয়োজন' : 'Password is required';
    } else if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message;
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = language === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন প্রয়োজন' : 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = language === 'bn' ? 'পাসওয়ার্ড মিলছে না' : 'Passwords do not match';
    }

    // Terms validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = language === 'bn' ? 'শর্তাবলী মেনে নিতে হবে' : 'You must agree to the terms';
    }

    // Privacy validation
    if (!formData.agreeToPrivacy) {
      newErrors.agreeToPrivacy = language === 'bn' ? 'গোপনীয়তা নীতিমালা মেনে নিতে হবে' : 'You must agree to the privacy policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form field change
   */
  const handleFieldChange = (field: keyof GuestAccountCreationRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Update password strength when password changes
    if (field === 'password' && value) {
      const validation = validatePassword(value);
      setPasswordStrength(validation.strength);
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
      console.error('Account creation error:', error);
      toast.error(language === 'bn' ? 'অ্যাকাউন্ট তৈরি করতে ব্যর্থ' : 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Get password strength color
   */
  const getPasswordStrengthColor = (strength: 'weak' | 'medium' | 'strong' | null): string => {
    switch (strength) {
      case 'weak':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'strong':
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  /**
   * Get password strength label
   */
  const getPasswordStrengthLabel = (strength: 'weak' | 'medium' | 'strong' | null): string => {
    switch (strength) {
      case 'weak':
        return language === 'bn' ? 'দুর্বল' : 'Weak';
      case 'medium':
        return language === 'bn' ? 'মাঝারি' : 'Medium';
      case 'strong':
        return language === 'bn' ? 'শক্তিশালী' : 'Strong';
      default:
        return '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('guest-account-creation space-y-6', className)}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <UserPlus className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            {language === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Your Account'}
          </h2>
        </div>
        <p className="text-sm text-gray-600">
          {language === 'bn' 
            ? 'আপনার তথ্য প্রি-ফিল করা হয়েছে। পাসওয়ার্ড তৈরি করুন।' 
            : 'Your information is pre-filled. Create a password to complete.'}
        </p>
      </div>

      {/* Pre-filled Info Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-900 font-medium mb-1">
              {language === 'bn' ? 'প্রি-ফিল তথ্য' : 'Pre-filled Information'}
            </p>
            <p className="text-sm text-blue-700">
              {language === 'bn' 
                ? 'আপনার নাম, ইমেল এবং ফোন নম্বর গেস্ট চেকআউট থেকে প্রি-ফিল করা হয়েছে।' 
                : 'Your name, email, and phone number are pre-filled from your guest checkout.'}
            </p>
          </div>
        </div>
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
              placeholder={language === 'bn' ? 'নাম লিখুন' : 'Enter last name'}
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
        
        {/* Password Strength Indicator */}
        {formData.password && !errors.password && (
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-600">
                {language === 'bn' ? 'পাসওয়ার্ড শক্তি:' : 'Password Strength:'}
              </span>
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn('h-full transition-all duration-300', getPasswordStrengthColor(passwordStrength))}
                  style={{ width: passwordStrength === 'strong' ? '100%' : passwordStrength === 'medium' ? '66%' : '33%' }}
                />
              </div>
              <span className={cn('text-xs font-medium', passwordStrength === 'strong' ? 'text-green-600' : passwordStrength === 'medium' ? 'text-yellow-600' : 'text-red-600')}>
                {getPasswordStrengthLabel(passwordStrength)}
              </span>
            </div>
            {passwordStrength === 'weak' && (
              <p className="text-xs text-gray-600">
                {language === 'bn' 
                  ? 'আরও শক্তিশাল পাসওয়ার্ড তৈরি করুন (বড় হাতের অক্ষর, ছোট হাতের অক্ষর, সংখ্যা এবং বিশেষ অক্ষর)' 
                  : 'Create a stronger password (uppercase, lowercase, numbers, and special characters)'}
              </p>
            )}
          </div>
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

      {/* Merge Cart Option */}
      <div className="flex items-start gap-3">
        <input
          id="mergeCart"
          type="checkbox"
          checked={formData.mergeCart}
          onChange={(e) => handleFieldChange('mergeCart', e.target.checked)}
          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:border-transparent"
          disabled={isSubmitting || isLoading}
        />
        <label htmlFor="mergeCart" className="text-sm text-gray-700 cursor-pointer">
          {language === 'bn' 
            ? 'গেস্ট কার্ট মার্জ করুন' 
            : 'Merge my guest cart with my account'}
        </label>
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
              className="text-blue-600 hover:text-blue-700 underline mx-1"
            >
              <FileText className="inline w-4 h-4 align-text-bottom" />
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
              className="text-blue-600 hover:text-blue-700 underline mx-1"
            >
              <Shield className="inline w-4 h-4 align-text-bottom" />
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
                {language === 'bn' ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'Creating Account...'}
              </span>
            </>
          ) : (
            <>
              <UserPlus className="w-5 h-5" />
              <span>
                {language === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account'}
              </span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default GuestAccountCreation;
