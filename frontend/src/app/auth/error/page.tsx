'use client';

/**
 * NextAuth.js Error Page
 * Displays authentication errors to users
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Error codes and their messages
 */
const errorMessages: Record<string, { title: string; description: string; titleBn: string; descriptionBn: string }> = {
  Configuration: {
    title: 'Configuration Error',
    description: 'There is a problem with the server configuration. Please contact support.',
    titleBn: 'কনফিগারেশন ত্রুটি',
    descriptionBn: 'সার্ভার কনফিগারেশনে একটি সমস্যা আছে। অনুগ্রহ সাপোর্টের সাথে যোগাযোগ করুন।',
  },
  AccessDenied: {
    title: 'Access Denied',
    description: 'You do not have permission to sign in. Please check your credentials.',
    titleBn: 'প্রবেশাস অস্বীকৃত',
    descriptionBn: 'আপনার সাইন ইন করার অনুমতি নেই। আপনার ক্রেডেনশিয়াল যাচাই করুন।',
  },
  Verification: {
    title: 'Verification Failed',
    description: 'The verification token is invalid or has expired. Please try again.',
    titleBn: 'যাচাই ব্যর্থ',
    descriptionBn: 'যাচাই টোকেন অবৈধ অথবা মেয়াদ উত্তীর্ণ হয়েছে। আবার চেষ্টা করুন।',
  },
  Default: {
    title: 'Authentication Error',
    description: 'An error occurred during authentication. Please try again.',
    titleBn: 'প্রমাণীকরণ ত্রুটি',
    descriptionBn: 'প্রমাণীকরণের সময় একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।',
  },
};

/**
 * Error page component
 */
export default function AuthErrorPage() {
  const router = useRouter();
  const searchParams = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : ''
  );
  const error = (searchParams.get('error') as string) || 'Default';

  const errorInfo = errorMessages[error] || errorMessages.Default;

  useEffect(() => {
    // Redirect to login after 5 seconds
    const timer = setTimeout(() => {
      router.push('/login');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <svg
              className="h-16 w-16 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Error Message */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {errorInfo.title}
            </h1>
            <p className="text-gray-600">
              {errorInfo.description}
            </p>
          </div>

          {/* Back Button */}
          <button
            onClick={() => router.push('/login')}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Back to Login
          </button>

          {/* Auto-redirect message */}
          <p className="mt-4 text-center text-sm text-gray-500">
            Redirecting to login page in 5 seconds...
          </p>
        </div>
      </div>
    </div>
  );
}
