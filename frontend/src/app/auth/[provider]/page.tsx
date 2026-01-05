'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { handleOAuthCallback, OAuthProfile } from '@/lib/api/oauth';

export default function OAuthCallbackPage({
  params
}: {
  params: { provider: string };
}) {
  const searchParams = useSearchParams();
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = React.useState<string>('');

  useEffect(() => {
    handleOAuth();
  }, []);

  const handleOAuth = async () => {
    try {
      setStatus('loading');

      // Check if we have OAuth data in URL params (for server-side OAuth flow)
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (code && state) {
        // Server-side OAuth flow - exchange code for token
        // This would call the backend to exchange the code
        // For now, we'll use client-side flow
        console.log('OAuth code received:', code);
      }

      // Client-side OAuth flow - get profile from localStorage (set by popup)
      const profileData = localStorage.getItem('oauth_profile');
      
      if (!profileData) {
        throw new Error('No OAuth profile data found');
      }

      const profile: OAuthProfile = JSON.parse(profileData);
      const response = await handleOAuthCallback(params.provider, profile);

      // Store auth data
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      // Clean up
      localStorage.removeItem('oauth_profile');

      // Notify parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'OAUTH_SUCCESS',
          profile,
          provider: params.provider
        }, '*');
      }

      setStatus('success');
      
      // Redirect after short delay
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } catch (err: any) {
      console.error('OAuth callback error:', err);
      setError(err.message || 'Authentication failed');
      setStatus('error');

      // Notify parent window of error
      if (window.opener) {
        window.opener.postMessage({
          type: 'OAUTH_ERROR',
          error: err.message || 'Authentication failed'
        }, '*');
      }

      // Redirect after short delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">
            Authenticating...
          </h2>
          <p className="mt-2 text-gray-600">
            Please wait while we complete your sign in
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 2.502-3.215V6.215c0-1.548-1.962-3.215-2.502-3.215H4.062c-1.54 0-2.502 1.667-2.502 3.215v10.57c0 1.548 1.962 3.215 2.502 3.215h13.856z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Authentication Failed
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'An error occurred during authentication. Please try again.'}
          </p>
          <a
            href="/login"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center p-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Authentication Successful
        </h2>
        <p className="text-gray-600 mb-6">
          You have been successfully signed in. Redirecting to dashboard...
        </p>
        <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
}
