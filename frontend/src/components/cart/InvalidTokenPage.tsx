'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home, ShoppingBag, RefreshCw } from 'lucide-react';

interface InvalidTokenPageProps {
  error?: string;
  errorCode?: string | null;
}

export function InvalidTokenPage({ error, errorCode }: InvalidTokenPageProps) {
  const getErrorMessage = () => {
    switch (errorCode) {
      case 'NO_TOKEN':
        return {
          en: 'No recovery token was provided.',
          bn: 'কোনো রিকভারি টোকেন প্রদান করা হয়নি।',
        };
      case 'INVALID_TOKEN':
        return {
          en: 'This recovery link is invalid or has expired.',
          bn: 'এই রিকভারি লিঙ্কটি অবৈধ বা মেয়াদ শেষ হয়ে গেছে।',
        };
      case 'VALIDATION_ERROR':
        return {
          en: 'We encountered an error while validating your recovery link.',
          bn: 'আপনার রিকভারি লিঙ্ক যাচাই করতে সমস্যা হয়েছে।',
        };
      default:
        return {
          en: error || 'This recovery link is invalid or has expired.',
          bn: 'এই রিকভারি লিঙ্কটি অবৈধ বা মেয়াদ শেষ হয়ে গেছে।',
        };
    }
  };

  const message = getErrorMessage();

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
      {/* Error Icon */}
      <div className="mb-8">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-12 h-12 text-red-600" />
        </div>
      </div>

      {/* Error Message */}
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Link Invalid or Expired
      </h1>
      <p className="text-lg text-gray-600 mb-2">
        {message.en}
      </p>
      <p className="text-base text-gray-500 mb-8">
        {message.bn}
      </p>

      {/* Explanation */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left max-w-lg mx-auto">
        <h3 className="font-semibold text-gray-800 mb-3">
          Possible reasons:
        </h3>
        <ul className="space-y-2 text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-1">•</span>
            <span>The link has expired (links are valid for 30 days)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-1">•</span>
            <span>The cart has already been recovered</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-1">•</span>
            <span>The cart has been deleted or converted to an order</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-1">•</span>
            <span>The link was copied incorrectly</span>
          </li>
        </ul>

        <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
          <p>সম্ভাব্য কারণ:</p>
          <ul className="mt-1 space-y-1">
            <li>• লিঙ্কের মেয়াদ শেষ হয়ে গেছে (৩০ দিনের মেয়াদ)</li>
            <li>• কার্ট ইতিমধ্যে পুনরুদ্ধার করা হয়েছে</li>
            <li>• কার্ট মুছে ফেলা হয়েছে বা অর্ডারে রূপান্তরিত হয়েছে</li>
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/">
          <Button size="lg" className="bg-[#006a4e] hover:bg-[#005a3e] min-w-[200px]">
            <Home className="mr-2 w-4 h-4" />
            Return Home
          </Button>
        </Link>
        <Link href="/products">
          <Button size="lg" variant="outline" className="min-w-[200px]">
            <ShoppingBag className="mr-2 w-4 h-4" />
            Continue Shopping
          </Button>
        </Link>
      </div>

      {/* Help Section */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <p className="text-gray-600 mb-2">
          Need help recovering your cart?
        </p>
        <p className="text-sm text-gray-500 mb-4">
          আপনার কার্ট পুনরুদ্ধারে সাহায্য প্রয়োজন?
        </p>
        <Link href="/contact">
          <Button variant="ghost" className="text-[#006a4e]">
            <RefreshCw className="mr-2 w-4 h-4" />
            Contact Support
          </Button>
        </Link>
      </div>
    </div>
  );
}
