'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldX, Home, Mail, ArrowLeft } from 'lucide-react';

/**
 * Unauthorized Page Content Component
 * 
 * Handles the search params logic wrapped in Suspense
 */
function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    // Get message from URL query parameter
    const messageParam = searchParams.get('message');
    if (messageParam) {
      setMessage(decodeURIComponent(messageParam));
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="bg-red-100 rounded-full p-6">
              <ShieldX className="w-16 h-16 text-red-600" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Access Denied
            </h1>
            <p className="text-xl text-gray-600">
              You don't have permission to access this page
            </p>
          </div>

          {/* Message */}
          {message && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <p className="text-red-800 text-sm">
                {message}
              </p>
            </div>
          )}

          {/* Explanation */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Why am I seeing this?
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span>Your account doesn't have the required role or permission</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span>Your session may have expired</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span>You may need to contact an administrator for access</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/"
                className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Home className="w-5 h-5 mr-2" />
                Go to Home
              </Link>
              
              <Link
                href="/admin"
                className="flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Admin
              </Link>
            </div>

            <Link
              href="/login"
              className="flex items-center justify-center px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Login with Different Account
            </Link>
          </div>

          {/* Contact Support */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-center text-gray-600">
              <Mail className="w-5 h-5 mr-2" />
              <span className="text-sm">
                Need help?{' '}
                <a
                  href="mailto:support@smarttech.com"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Contact Support
                </a>
              </span>
            </div>
          </div>

          {/* Additional Help */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>If you believe this is an error, please contact your system administrator.</p>
            <p className="mt-2">Include the URL and time of access in your message.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>© {new Date().getFullYear()} Smart Technologies Bangladesh. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Unauthorized Page
 * 
 * Displayed when user tries to access a page they don't have permission for.
 * Shows user-friendly message and provides navigation options.
 * Wrapped in Suspense to handle useSearchParams() during static generation.
 */
export default function UnauthorizedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <UnauthorizedContent />
    </Suspense>
  );
}
