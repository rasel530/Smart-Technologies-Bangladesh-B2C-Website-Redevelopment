'use client';

/**
 * Social Login Buttons Component
 * Provides Google and Facebook OAuth login buttons
 */

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface SocialLoginButtonsProps {
  isLoading?: boolean;
  onSocialLoginStart?: (provider: string) => void;
}

/**
 * Social login buttons with loading states
 */
export function SocialLoginButtons({ isLoading = false, onSocialLoginStart }: SocialLoginButtonsProps) {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);

  /**
   * Handle Google sign in
   */
  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      onSocialLoginStart?.('google');
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (error) {
      console.error('Google sign in error:', error);
      setGoogleLoading(false);
    }
  };

  /**
   * Handle Facebook sign in
   */
  const handleFacebookSignIn = async () => {
    try {
      setFacebookLoading(true);
      onSocialLoginStart?.('facebook');
      await signIn('facebook', { callbackUrl: '/dashboard' });
    } catch (error) {
      console.error('Facebook sign in error:', error);
      setFacebookLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Google Login Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading || googleLoading || facebookLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {googleLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
        ) : (
          <>
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="text-gray-700 font-medium">Continue with Google</span>
          </>
        )}
      </button>

      {/* Facebook Login Button */}
      <button
        type="button"
        onClick={handleFacebookSignIn}
        disabled={isLoading || googleLoading || facebookLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-[#1877F2] hover:bg-[#166FE5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {facebookLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-white" />
        ) : (
          <>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="white">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.937 9.938 11.937v-8.438H7.069v-3.5h2.869V9.356c0-2.831 1.686-4.394 4.262-4.394 1.234 0 2.522.219 2.522.219v2.778h-1.421c-1.4 0-1.837.869-1.837 1.76v2.125h3.069l-.49 3.5h-2.579v8.438C19.612 23.01 24 18.063 24 12.073z"/>
            </svg>
            <span className="text-white font-medium">Continue with Facebook</span>
          </>
        )}
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <span className="relative bg-white px-2 text-sm text-gray-500">or</span>
      </div>
    </div>
  );
}
