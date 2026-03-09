'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { LoginData, LoginFormProps, LoginErrorPayload } from '@/types/auth';
import { loginSchema } from '@/lib/validation';
import { FormInput } from '@/components/ui/FormInput';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import { useShowToast } from '@/components/ui/Toast';
import { useSession } from 'next-auth/react';
import GuestCartMergePrompt from '@/components/checkout/GuestCartMergePrompt';
import { apiClient } from '@/lib/api/client';
import type { GuestCart, UserCart } from '@/types/guestCheckout';

function LoginPageContent() {
  const { login, error, clearError } = useAuth();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const toast = useShowToast();

  // Guest cart merge state
  const [guestCart, setGuestCart] = useState<GuestCart | null>(null);
  const [userCart, setUserCart] = useState<UserCart | null>(null);
  const [showCartMergePrompt, setShowCartMergePrompt] = useState(false);
  const [isCheckingGuestCart, setIsCheckingGuestCart] = useState(false);

  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage && ['en', 'bn'].includes(savedLanguage)) {
      setLanguage(savedLanguage as 'en' | 'bn');
    }
  }, []);

  // Check for guest cart on component mount
  useEffect(() => {
    const checkGuestCart = async () => {
      try {
        setIsCheckingGuestCart(true);
        const guestSessionId = localStorage.getItem('guest_session_id');

        if (guestSessionId) {
          // Load guest cart
          const guestCartResponse = await apiClient.get(`/cart/guest/${guestSessionId}`);
          if (guestCartResponse.success && guestCartResponse.data?.items?.length > 0) {
            setGuestCart(guestCartResponse.data);
          }
        }
      } catch (error) {
        console.error('Error checking guest cart:', error);
      } finally {
        setIsCheckingGuestCart(false);
      }
    };

    checkGuestCart();
  }, []);

  // Load user cart after successful login
  useEffect(() => {
    const loadUserCart = async () => {
      if (status === 'authenticated' && session?.user?.id && guestCart) {
        try {
          const userCartResponse = await apiClient.get(`/cart/user/${session.user.id}`);
          if (userCartResponse.success) {
            setUserCart(userCartResponse.data);

            // Show merge prompt if both carts exist
            if (guestCart.items.length > 0 || userCartResponse.data?.items?.length > 0) {
              setShowCartMergePrompt(true);
            }
          }
        } catch (error) {
          console.error('Error loading user cart:', error);
        }
      }
    };

    loadUserCart();
  }, [status, session, guestCart]);

  // Handle role-based redirect after session is loaded
  useEffect(() => {
    console.log('[LoginPage] Session status:', status);
    console.log('[LoginPage] Session data:', session);
    console.log('[LoginPage] Session user:', session?.user);
    console.log('[LoginPage] Session user role:', session?.user?.role);

    // Check if user just logged out
    const justLoggedOut = sessionStorage.getItem('just_logged_out');
    console.log('[LoginPage] just_logged_out flag:', justLoggedOut);

    // Only redirect if authenticated, session is loaded, no cart merge prompt is shown,
    // AND user did NOT just log out
    if (status === 'authenticated' && session?.user?.role && !showCartMergePrompt && !justLoggedOut && !isRedirecting) {
      const role = session.user.role;
      console.log('[LoginPage] User role:', role);

      // Check for redirect query parameter
      const redirectTarget = searchParams.get('redirect');
      console.log('[LoginPage] Redirect query parameter:', redirectTarget);

      // Validate redirect target to prevent loops
      const safeRedirects = ['/admin', '/account', '/dashboard', '/register', '/checkout'];
      const isSafeRedirect = redirectTarget &&
        redirectTarget !== '/' &&
        redirectTarget !== '/login' &&
        safeRedirects.some(safe => redirectTarget === safe || redirectTarget.startsWith(safe + '/'));

      // Set redirecting state to prevent duplicate redirects
      setIsRedirecting(true);
      
      // Show loading overlay to prevent flash of old content
      const loadingOverlay = document.createElement('div');
      loadingOverlay.id = 'login-redirect-overlay';
      loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
      `;
      loadingOverlay.innerHTML = `
        <div class="flex flex-col items-center space-y-4">
          <div class="relative">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-blue-600"></div>
            <div class="animate-spin rounded-full h-12 w-12 border-r-2 border-blue-400 absolute top-0 left-0" style="animation-delay: 0.15s"></div>
          </div>
          <p class="text-gray-600 text-sm font-medium">Redirecting...</p>
        </div>
      `;
      document.body.appendChild(loadingOverlay);
      console.log('[LoginPage] Loading overlay added for redirect');

      // Clear page content to prevent flash during redirect
      document.body.innerHTML = '';
      document.head.innerHTML = '';

      // Use window.location.href for clean page load instead of router.replace()
      // This ensures a fresh page load without showing cached content
      const targetUrl = isSafeRedirect ? redirectTarget : (role === 'admin' || role === 'super_admin' ? '/admin' : '/account');
      console.log('[LoginPage] Redirecting to:', targetUrl);
      window.location.href = targetUrl;
    } else if (status === 'authenticated') {
      console.log('[LoginPage] Authenticated but role not available yet');
    } else if (justLoggedOut) {
      console.log('[LoginPage] User just logged out, preventing auto-redirect');
      // Clear the just_logged_out flag after checking
      sessionStorage.removeItem('just_logged_out');
    }
  }, [status, session, router, searchParams, showCartMergePrompt, isRedirecting]);

  const handleLanguageChange = (newLanguage: 'en' | 'bn') => {
    setLanguage(newLanguage);
    localStorage.setItem('preferredLanguage', newLanguage);
  };

  // Handle cart merge action
  const handleCartMerge = async (mergeOption: 'merge' | 'keep_user' | 'keep_guest') => {
    if (!session?.user?.id || !guestCart) return;

    try {
      const guestSessionId = localStorage.getItem('guest_session_id');
      if (!guestSessionId) return;

      // Call merge API
      const mergeResponse = await apiClient.post('/cart/merge', {
        guestSessionId,
        userId: session.user.id,
        mergeOption
      });

      if (mergeResponse.success) {
        toast.success(
          language === 'bn' ? 'কার্ট মার্জ সফল হয়েছে' : 'Cart merged successfully',
          language === 'bn' ? 'সফল' : 'Success'
        );

        // Clear guest session
        localStorage.removeItem('guest_session_id');

        // Close merge prompt
        setShowCartMergePrompt(false);

        // Redirect to checkout if that was the original intent
        const redirectTarget = searchParams.get('redirect');
        if (redirectTarget === '/checkout') {
          router.push('/checkout');
        }
      }
    } catch (error) {
      console.error('Error merging carts:', error);
      toast.error(
        language === 'bn' ? 'কার্ট মার্জ করতে ব্যর্থ হয়েছে' : 'Failed to merge carts',
        language === 'bn' ? 'ত্রুটি' : 'Error'
      );
    }
  };

  // Handle skip cart merge
  const handleSkipMerge = () => {
    setShowCartMergePrompt(false);

    // Redirect to checkout if that was the original intent
    const redirectTarget = searchParams.get('redirect');
    if (redirectTarget === '/checkout') {
      router.push('/checkout');
    }
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
    console.log('[LoginPage DIAGNOSTIC] === FORM SUBMIT START ===');
    console.log('[LoginPage DIAGNOSTIC] Form submitted with data:', {
      emailOrPhone: data.emailOrPhone,
      password: data.password ? '***' : 'empty',
      rememberMe: data.rememberMe
    });
    
    clearError();
    console.log('[LoginPage DIAGNOSTIC] Error cleared');
    
    setIsSubmitting(true);
    console.log('[LoginPage DIAGNOSTIC] isSubmitting set to true');
    
    // Show loading toast
    const loadingTitle = language === 'bn' ? 'লগইন করা হচ্ছে' : 'Logging In';
    const loadingMessage = language === 'bn'
      ? 'অনুগ্রহ করে অপেক্ষা করুন...'
      : 'Please wait while we log you in...';
    console.log('[LoginPage DIAGNOSTIC] Showing loading toast');
    toast.info(loadingMessage, loadingTitle);
    
    try {
      console.log('[LoginPage DIAGNOSTIC] Step 1: Calling login function...');
      const loginResult = await login(data.emailOrPhone, data.password, data.rememberMe);
      console.log('[LoginPage DIAGNOSTIC] Step 2: Login function returned:', loginResult);
      
      // Check if login failed based on the result
      if (!loginResult.success && loginResult.error) {
        console.log('[LoginPage DIAGNOSTIC] Login failed, error from AuthContext:', loginResult.error);
        
        // Show error toast
        const errorTitle = language === 'bn' ? 'লগইন ব্যর্থ' : 'Login Error';
        const errorObj = loginResult.error;
        let errorMessage: string;
        
        errorMessage = language === 'bn' 
          ? (errorObj.messageBn || errorObj.message || 'লগইন ব্যর্থ হয়েছে')
          : (errorObj.message || 'Login failed');
        
        if (errorObj.requiresVerification) {
          const verificationTypeText = errorObj.verificationType === 'email'
            ? (language === 'bn' ? 'ইমেল' : 'email')
            : (language === 'bn' ? 'ফোন' : 'phone');
          
          const verificationMessage = language === 'bn'
            ? `আপনার ${verificationTypeText} নম্বর যাচাই করা প্রয়োজন। ${errorMessage || ''}`
            : `Your ${verificationTypeText} needs verification. ${errorMessage || ''}`;
          
          toast.error(verificationMessage, errorTitle);
        } else {
          toast.error(errorMessage, errorTitle);
        }
        
        console.log('[LoginPage DIAGNOSTIC] === FORM SUBMIT ERROR (AuthContext error) ===');
        setIsSubmitting(false);
        return;
      }
      
      // Login was successful
      console.log('[LoginPage DIAGNOSTIC] Login successful, showing success toast');
      
      // Show success toast
      const successTitle = language === 'bn' ? 'লগইন সফল' : 'Login Successful';
      const successMessage = language === 'bn'
        ? 'আপনি সফলভাবে লগইন হয়েছেন'
        : 'You have successfully logged in';
      console.log('[LoginPage DIAGNOSTIC] Showing success toast');
      toast.success(successMessage, successTitle);
      
      // Client-side useEffect will handle redirect after session is loaded
      console.log('[LoginPage DIAGNOSTIC] Step 3: Waiting for session to load, useEffect will handle redirect');
      console.log('[LoginPage DIAGNOSTIC] === FORM SUBMIT SUCCESS ===');
    } catch (error: any) {
      console.error('[LoginPage DIAGNOSTIC] === FORM SUBMIT ERROR ===');
      console.error('[LoginPage DIAGNOSTIC] Error caught:', error);
      console.error('[LoginPage DIAGNOSTIC] Error type:', typeof error);
      console.error('[LoginPage DIAGNOSTIC] Error name:', error?.name);
      console.error('[LoginPage DIAGNOSTIC] Error message:', error?.message);
      
      // Show toast notification with error details
      const errorTitle = language === 'bn' ? 'লগইন ব্যর্থ' : 'Login Error';
      
      if (typeof error === 'string') {
        // Simple string error
        console.log('[LoginPage DIAGNOSTIC] Error is a string:', error);
        toast.error(error, errorTitle);
      } else if (error && typeof error === 'object') {
        // Extract specific error message from backend response
        console.log('[LoginPage DIAGNOSTIC] Error is an object:', JSON.stringify(error, null, 2));
        
        let errorMessage: string;
        
        // Use bilingual messages if available
        if (language === 'bn') {
          errorMessage = error.messageBn || error.message || 'লগইন ব্যর্থ হয়েছে';
        } else {
          errorMessage = error.message || 'Login failed';
        }
        
        console.log('[LoginPage DIAGNOSTIC] Extracted error message:', errorMessage);
        
        // Handle verification errors specifically
        if (error.requiresVerification) {
          console.log('[LoginPage DIAGNOSTIC] Error requires verification:', error.verificationType);
          const verificationTypeText = error.verificationType === 'email'
            ? (language === 'bn' ? 'ইমেল' : 'email')
            : (language === 'bn' ? 'ফোন' : 'phone');
          
          const verificationMessage = language === 'bn'
            ? `আপনার ${verificationTypeText} নম্বর যাচাই করা প্রয়োজন। ${errorMessage || ''}`
            : `Your ${verificationTypeText} needs verification. ${errorMessage || ''}`;
          
          toast.error(verificationMessage, errorTitle);
        } else {
          // Display specific error message from backend
          // The backend returns detailed messages like:
          // - "Invalid email or password" / "অবৈধ ইমেল বা পাসওয়ার্ড"
          // - "Invalid phone number or password" / "অবৈধ ফোন নম্বর বা পাসওয়ার্ড"
          // - "Please verify your email address before logging in" / "লগিন করার আগে ইমেল যাচাই করুন"
          // - "Unable to create session" / "লগিন ব্যর্থ হয়েছে"
          // - "Failed to create remember me token" / "Remember me token creation failed"
          console.log('[LoginPage DIAGNOSTIC] Showing error toast:', errorMessage);
          toast.error(errorMessage, errorTitle);
        }
      } else {
        // Fallback error for unexpected error formats
        console.log('[LoginPage DIAGNOSTIC] Error has unexpected format, using fallback');
        const fallbackMessage = language === 'bn'
          ? 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।'
          : 'An unexpected error occurred. Please try again later.';
        toast.error(fallbackMessage, errorTitle);
      }
      console.log('[LoginPage DIAGNOSTIC] === FORM SUBMIT ERROR ===');
    } finally {
      console.log('[LoginPage DIAGNOSTIC] Finally block: Setting isSubmitting to false');
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

        {/* Social Login Buttons */}
        <SocialLoginButtons isLoading={isSubmitting} />

        {/* Login Form */}
        <form
          onSubmit={(e) => {
            console.log('[LoginPage] Form onSubmit triggered');
            handleSubmit(handleLoginSubmit)(e);
          }}
          className="space-y-6"
          noValidate
          onInvalid={(e) => {
            e.preventDefault();
            // Show validation error toast
            const validationTitle = language === 'bn' ? 'যাচাইকরণ ত্রুটি' : 'Validation Error';
            const validationMessage = language === 'bn'
              ? 'অনুগ্রহ করে সকল প্রয়োজনীয় ক্ষেত্রগুলি পূরণ করুন'
              : 'Please fill in all required fields correctly';
            toast.warning(validationMessage, validationTitle);
          }}
        >
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
              disabled={isSubmitting}
              onClick={() => console.log('[LoginPage] Login button clicked, isSubmitting:', isSubmitting)}
              className={cn(
                'w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium',
                {
                  'bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500': !isSubmitting,
                  'bg-primary-400 text-gray-300 cursor-not-allowed': isSubmitting
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

        {/* Guest Cart Merge Prompt */}
        {showCartMergePrompt && guestCart && userCart && (
          <GuestCartMergePrompt
            guestCart={guestCart}
            userCart={userCart}
            onMerge={handleCartMerge}
            onSkip={handleSkipMerge}
            language={language}
          />
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
