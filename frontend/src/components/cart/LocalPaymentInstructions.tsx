'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, AlertCircle, Loader2, Copy, Check } from 'lucide-react';
import { PaymentInstruction } from '@/types/localPayment';
import { getPaymentInstructions } from '@/lib/api/localPayment';
import { cn } from '@/lib/utils';

/**
 * LocalPaymentInstructions Component
 * Display payment instructions for selected method
 * Features:
 * - Display payment instructions for selected method
 * - Support bilingual (English/Bengali)
 * - Show step-by-step payment process
 */
interface LocalPaymentInstructionsProps {
  methodCode: string;
  language?: 'en' | 'bn';
  className?: string;
  autoLoad?: boolean;
}

const LocalPaymentInstructions: React.FC<LocalPaymentInstructionsProps> = ({
  methodCode,
  language = 'en',
  className,
  autoLoad = true
}) => {
  const [instructions, setInstructions] = useState<PaymentInstruction[]>([]);
  const [methodName, setMethodName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  // Fetch payment instructions when method code changes
  useEffect(() => {
    if (!autoLoad || !methodCode) return;

    const fetchInstructions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await getPaymentInstructions(methodCode, language);
        
        if (response.success && response.data) {
          setMethodName(response.data.paymentMethod.displayName);
          // Map API response to PaymentInstruction type
          const mappedInstructions: PaymentInstruction[] = response.data.instructions.map((inst: any) => ({
            step: inst.step,
            title_en: inst.title_en || inst.title,
            title_bn: inst.title_bn || inst.title,
            description_en: inst.description_en || inst.description,
            description_bn: inst.description_bn || inst.description
          }));
          setInstructions(mappedInstructions);
        } else {
          setError('Failed to load payment instructions');
        }
      } catch (err) {
        console.error('[LocalPaymentInstructions] Error fetching payment instructions:', err);
        setError('Failed to load payment instructions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstructions();
  }, [methodCode, language, autoLoad]);

  const handleCopyStep = (step: PaymentInstruction, index: number) => {
    const text = language === 'bn' 
      ? `${step.step}. ${step.title_bn}\n${step.description_bn}`
      : `${step.step}. ${step.title_en}\n${step.description_en}`;
    
    navigator.clipboard.writeText(text).then(() => {
      setCopiedStep(index);
      setTimeout(() => setCopiedStep(null), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  const handleRetry = () => {
    const fetchInstructions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await getPaymentInstructions(methodCode, language);
        
        if (response.success && response.data) {
          setMethodName(response.data.paymentMethod.displayName);
          // Map API response to PaymentInstruction type
          const mappedInstructions: PaymentInstruction[] = response.data.instructions.map((inst: any) => ({
            step: inst.step,
            title_en: inst.title_en || inst.title,
            title_bn: inst.title_bn || inst.title,
            description_en: inst.description_en || inst.description,
            description_bn: inst.description_bn || inst.description
          }));
          setInstructions(mappedInstructions);
        } else {
          setError('Failed to load payment instructions');
        }
      } catch (err) {
        console.error('[LocalPaymentInstructions] Error fetching payment instructions:', err);
        setError('Failed to load payment instructions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstructions();
  };

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-200">
        <BookOpen className="w-5 h-5 text-blue-600" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-gray-900">
          {language === 'bn' ? 'পেমেন্ট নির্দেশাবলী' : 'Payment Instructions'}
        </h2>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" aria-hidden="true" />
          <p className="text-sm text-gray-600 mt-2 ml-2">
            {language === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 m-4" role="alert">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" aria-hidden="true" />
            <p className="text-sm text-red-800 font-medium">
              {language === 'bn' ? 'ত্রুটি' : 'Error'}
            </p>
          </div>
          <p className="text-sm text-red-700 mb-3">{error}</p>
          <button
            onClick={handleRetry}
            className="text-sm text-red-700 hover:text-red-900 font-medium underline focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {language === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Try Again'}
          </button>
        </div>
      )}

      {/* Instructions */}
      {!isLoading && !error && instructions.length > 0 && (
        <div className="p-4">
          {/* Method Name */}
          {methodName && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">
                  {language === 'bn' ? 'পেমেন্ট পদ্ধতি:' : 'Payment Method:'}
                </span>{' '}
                {methodName}
              </p>
            </div>
          )}

          {/* Steps */}
          <div className="space-y-4">
            {instructions.map((instruction, index) => (
              <div key={instruction.step} className="relative">
                {/* Step Number */}
                <div className="absolute left-0 top-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {instruction.step}
                </div>

                {/* Step Content */}
                <div className="ml-12 p-4 bg-gray-50 border border-gray-200 rounded-md">
                  {/* Step Title */}
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {language === 'bn' ? instruction.title_bn : instruction.title_en}
                  </h3>

                  {/* Step Description */}
                  <p className="text-sm text-gray-700 mb-3">
                    {language === 'bn' ? instruction.description_bn : instruction.description_en}
                  </p>

                  {/* Copy Button */}
                  <button
                    onClick={() => handleCopyStep(instruction, index)}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={language === 'bn' ? 'ধাপ কপি করুন' : 'Copy step'}
                  >
                    {copiedStep === index ? (
                      <>
                        <Check className="w-4 h-4" aria-hidden="true" />
                        <span>{language === 'bn' ? 'কপি হয়েছে' : 'Copied'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" aria-hidden="true" />
                        <span>{language === 'bn' ? 'কপি করুন' : 'Copy'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Connector Line (except for last step) */}
                {index < instructions.length - 1 && (
                  <div className="absolute left-4 top-16 w-0.5 h-8 bg-gray-300" aria-hidden="true"></div>
                )}
              </div>
            ))}
          </div>

          {/* Important Notes */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="font-semibold text-yellow-900 mb-2">
              {language === 'bn' ? 'গুরুত্বপূর্ণ নোট' : 'Important Notes'}
            </h3>
            <ul className="space-y-2 text-sm text-yellow-800">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-600 flex-shrink-0 mt-2" aria-hidden="true"></span>
                <span>
                  {language === 'bn' 
                    ? 'পেমেন্ট সম্পন্ন হওয়ার পর ট্রানজ্যাকশন আইডি সংরক্ষণ করুন।'
                    : 'Keep the transaction ID safe after payment completion.'
                  }
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-600 flex-shrink-0 mt-2" aria-hidden="true"></span>
                <span>
                  {language === 'bn' 
                    ? 'পেমেন্ট নিশ্চিত করতে আপনার ফোন নম্বর এবং পিন প্রয়োজন হতে পারে।'
                    : 'Your phone number and PIN may be required to confirm payment.'
                  }
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-600 flex-shrink-0 mt-2" aria-hidden="true"></span>
                <span>
                  {language === 'bn' 
                    ? 'পেমেন্ট সমস্যার জন্য সহায়তার জন্য আমাদের সাথে যোগাযোগ করুন।'
                    : 'Contact us for assistance with payment issues.'
                  }
                </span>
              </li>
            </ul>
          </div>

          {/* Support Contact */}
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <h3 className="font-semibold text-gray-900 mb-2">
              {language === 'bn' ? 'সহায়তা প্রয়োজন?' : 'Need Help?'}
            </h3>
            <p className="text-sm text-gray-700">
              {language === 'bn' 
                ? 'পেমেন্ট সম্পর্কিত যেকোনো সমস্যার জন্য, আমাদের কাস্টমার সাপোর্টে যোগাযোগ করুন।'
                : 'For any payment-related issues, please contact our customer support.'
              }
            </p>
          </div>
        </div>
      )}

      {/* No Instructions */}
      {!isLoading && !error && instructions.length === 0 && methodCode && (
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-gray-500">
            {language === 'bn' ? 'কোনো নির্দেশাবলী পাওয়া যায়নি' : 'No instructions available'}
          </p>
        </div>
      )}

      {/* No Method Selected */}
      {!isLoading && !error && !methodCode && (
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-gray-500">
            {language === 'bn' ? 'নির্দেশাবলী দেখতে পেমেন্ট পদ্ধতি নির্বাচন করুন' : 'Select a payment method to view instructions'}
          </p>
        </div>
      )}
    </div>
  );
};

export default LocalPaymentInstructions;
