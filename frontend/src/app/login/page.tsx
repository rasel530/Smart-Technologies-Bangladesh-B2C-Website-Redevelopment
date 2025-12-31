'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, Mail, User, AlertCircle } from 'lucide-react';
import { LoginData, LoginFormProps } from '@/types/auth';
import { loginSchema } from '@/lib/validation';
import { FormInput } from '@/components/ui/FormInput';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { login, isLoading, error, clearError } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage && ['en', 'bn'].includes(savedLanguage)) {
      setLanguage(savedLanguage as 'en' | 'bn');
    }
  }, []);

  const handleLanguageChange = (newLanguage: 'en' | 'bn') => {
    setLanguage(newLanguage);
    localStorage.setItem('preferredLanguage', newLanguage);
  };

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors }
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: {
      emailOrPhone: '',
      password: '',
      rememberMe: false
    }
  });

  const emailOrPhone = watch('emailOrPhone');
  const password = watch('password');

  const handleLoginSubmit = async (data: LoginData) => {
    clearError();
    setLoginError(null);
    setIsSubmitting(true);
    
    try {
      await login(data.emailOrPhone, data.password, data.rememberMe);
      // Redirect to account page after successful login
      router.push('/account');
    } catch (error: any) {
      console.error('Login failed:', error);
      setLoginError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            {language === 'bn' ? 'লগইন করুন' : 'Login'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {language === 'bn'
              ? 'আপনার অ্যাকাউন্ট করতে লগইন করুন'
              : 'Welcome back! Please login to your account.'
            }
          </p>
        </div>

        {/* Language Toggle */}
        <div className="flex justify-center">
          <div className="bg-white rounded-lg shadow-sm p-1 flex items-center space-x-2">
            <span className="text-sm text-gray-600 mr-2">
              {language === 'bn' ? 'ভাষা:' : 'Language:'}
            </span>
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                language === 'en'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              aria-label="Switch to English"
            >
              English
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('bn')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                language === 'bn'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              aria-label="Switch to Bengali"
            >
              বাংলা
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(handleLoginSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* Email or Phone Field */}
            <Controller
              name="emailOrPhone"
              control={control}
              render={({ field }) => (
                <FormInput
                    {...field}
                    type="text"
                    label={language === 'bn' ? 'ইমেল/ফোন নম্বর ইমেল' : 'Email or Phone Number'}
                    labelBn="ইমেল/ফোন নম্বর ইমেল"
                    placeholder={language === 'bn' ? 'ইমেল বা ফোন নম্বর লিখুন' : 'Enter your email or phone number'}
                    error={errors.emailOrPhone?.message}
                    errorBn={errors.emailOrPhone?.message}
                    required
                    language={language}
                    autoComplete="username"
                    className="w-full"
                />
              )}
            />

            {/* Password Field */}
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <FormInput
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    label={language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                    labelBn="পাসওয়ার্ড"
                    placeholder={language === 'bn' ? 'আপনার পাসওয়ার্ড লিখুন' : 'Enter your password'}
                    error={errors.password?.message}
                    errorBn={errors.password?.message}
                    required
                    language={language}
                    className="w-full pr-10"
                  />
                  
                  {/* Password Visibility Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              )}
            />

            {/* Remember Me */}
            <div className="flex items-center">
              <Controller
                name="rememberMe"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remember-me"
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 focus:border-transparent"
                      checked={field.value || false}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    <label 
                      htmlFor="remember-me" 
                      className="ml-2 block text-sm text-gray-700 cursor-pointer"
                    >
                      {language === 'bn' ? 'মনে আমার রাখুন' : 'Remember me'}
                    </label>
                  </div>
                )}
              />
            </div>

            {/* Login Error */}
            {loginError && (
              <div className="rounded-md bg-red-50 border border-red-200 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {language === 'bn' ? 'লগইন ব্যর্থ' : 'Login Error'}
                    </h3>
                    <p className="text-sm text-red-700 mt-1">
                      {loginError}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="text-center">
            <a 
              href="/forgot-password" 
              className="text-sm text-primary-600 hover:text-primary-500 font-medium"
            >
              {language === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot your password?'}
            </a>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className={cn(
                'w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium',
                {
                  'bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500': !isSubmitting && !isLoading,
                  'bg-primary-400 text-gray-300 cursor-not-allowed': isSubmitting || isLoading
                }
              )}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-t-2 border-primary-600"></div>
                  <span className="ml-2">
                    {language === 'bn' ? 'লগইন হচ্ছে...' : 'Logging in...'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center">
                  <Lock className="h-4 w-4 mr-2" />
                  <span>
                    {language === 'bn' ? 'লগইন করুন' : 'Login'}
                  </span>
                </div>
              )}
            </button>
          </div>

          {/* Register Link */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              {language === 'bn' ? 'একাউন্ট নেই?' : "Don't have an account?"}{' '}
              <a 
                href="/register" 
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                {language === 'bn' ? 'নিবন্ধন করুন' : 'Sign up'}
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}