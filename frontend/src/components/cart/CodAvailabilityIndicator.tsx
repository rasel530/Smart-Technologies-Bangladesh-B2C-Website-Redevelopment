'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Truck, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { CodAvailabilityResult, CodAddress, COD_CONSTANTS } from '@/types/cod';
import { checkCodAvailability } from '@/lib/api/cod';
import { cn } from '@/lib/utils';

/**
 * CodAvailabilityIndicator Component
 * Show COD availability in cart
 * Features:
 * - Check COD availability for user's address
 * - Display availability status (available/unavailable)
 * - Show reason if unavailable
 * - Display COD fee if applicable
 */
interface CodAvailabilityIndicatorProps {
  address?: CodAddress;
  amount: number;
  onAvailabilityChange?: (result: CodAvailabilityResult) => void;
  language?: 'en' | 'bn';
  className?: string;
  showDeliveryInfo?: boolean;
  autoCheck?: boolean;
}

const CodAvailabilityIndicator: React.FC<CodAvailabilityIndicatorProps> = ({
  address,
  amount,
  onAvailabilityChange,
  language = 'en',
  className,
  showDeliveryInfo = true,
  autoCheck = true
}) => {
  const [availability, setAvailability] = useState<CodAvailabilityResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch COD availability when address or amount changes
  useEffect(() => {
    if (!autoCheck) return;
    
    const fetchAvailability = async () => {
      try {
        console.log('[CodAvailabilityIndicator] Checking COD availability - address:', address, 'amount:', amount);
        setIsLoading(true);
        setError(null);
        
        const response = await checkCodAvailability(address, amount);
        
        console.log('[CodAvailabilityIndicator] COD API response:', JSON.stringify(response, null, 2));
        
        if (response.success && response.data) {
          console.log('[CodAvailabilityIndicator] COD availability set successfully:', response.data);
          setAvailability(response.data);
          onAvailabilityChange?.(response.data);
        } else {
          console.error('[CodAvailabilityIndicator] Invalid COD API response:', response);
          setError('Failed to check COD availability');
        }
      } catch (err) {
        console.error('[CodAvailabilityIndicator] Error checking COD availability:', err);
        setError('Failed to check COD availability');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [address, amount, autoCheck]);

  const formatCurrency = (value: number): string => {
    return `৳${value.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
  };

  const getDivisionName = (division: string): string => {
    if (language === 'bn') {
      return COD_CONSTANTS.DIVISION_NAMES_BN[division as keyof typeof COD_CONSTANTS.DIVISION_NAMES_BN] || division;
    }
    return COD_CONSTANTS.DIVISION_NAMES[division as keyof typeof COD_CONSTANTS.DIVISION_NAMES] || division;
  };

  const handleRetry = () => {
    if (autoCheck) {
      // Trigger re-fetch
      const fetchAvailability = async () => {
        try {
          setIsLoading(true);
          setError(null);
          
          const response = await checkCodAvailability(address, amount);
          
          if (response.success && response.data) {
            setAvailability(response.data);
            onAvailabilityChange?.(response.data);
          } else {
            setError('Failed to check COD availability');
          }
        } catch (err) {
          console.error('[CodAvailabilityIndicator] Error checking COD availability:', err);
          setError('Failed to check COD availability');
        } finally {
          setIsLoading(false);
        }
      };

      fetchAvailability();
    }
  };

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-200">
        <Truck className="w-5 h-5 text-blue-600" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-gray-900">
          {language === 'bn' ? 'ক্যাশ অন ডেলিভারি উপলব্ধতা' : 'COD Availability'}
        </h2>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" aria-hidden="true" />
          <p className="text-sm text-gray-600 mt-2 ml-2">
            {language === 'bn' ? 'উপলব্ধতা পরীক্ষা করা হচ্ছে...' : 'Checking availability...'}
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

      {/* No Data */}
      {!isLoading && !error && !availability && !autoCheck && (
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-gray-500">
            {language === 'bn' ? 'উপলব্ধতা পরীক্ষা করতে ঠিকানা নির্বাচন করুন' : 'Select an address to check availability'}
          </p>
        </div>
      )}

      {/* COD Available */}
      {!isLoading && !error && availability && availability.available && (
        <div className="p-4">
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-semibold text-green-900">
                  {language === 'bn' ? 'ক্যাশ অন ডেলিভারি উপলব্ধ!' : 'Cash on Delivery Available!'}
                </p>
                <p className="text-sm text-green-700 mt-1">
                  {language === 'bn' 
                    ? 'আপনি এই অর্ডারের জন্য ক্যাশ অন ডেলিভারি পেমেন্ট ব্যবহার করতে পারবেন।'
                    : 'You can use Cash on Delivery payment for this order.'}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          {showDeliveryInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-blue-600" aria-hidden="true" />
                <h3 className="font-semibold text-blue-900">
                  {language === 'bn' ? 'ডেলিভারি তথ্য' : 'Delivery Information'}
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">
                    {language === 'bn' ? 'আনুমানিক ডেলিভারি সময়' : 'Estimated Delivery'}
                  </span>
                  <span className="text-sm font-semibold text-blue-900">
                    {availability.deliveryDays} {language === 'bn' ? 'দিন' : 'days'}
                  </span>
                </div>
                {address?.division && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-700">
                      {language === 'bn' ? 'বিভাগ' : 'Division'}
                    </span>
                    <span className="text-sm font-semibold text-blue-900">
                      {getDivisionName(address.division)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Verification Requirements */}
          {(availability.requiresVerification.phone || availability.requiresVerification.address) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-yellow-600" aria-hidden="true" />
                <h3 className="font-semibold text-yellow-900">
                  {language === 'bn' ? 'যাচাইকরণ প্রয়োজন' : 'Verification Required'}
                </h3>
              </div>
              <div className="space-y-2">
                {availability.requiresVerification.phone && (
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 mt-2 rounded-full bg-yellow-600 flex-shrink-0" aria-hidden="true"></div>
                    <p className="text-sm text-yellow-800">
                      {language === 'bn' 
                        ? 'ফোন নম্বর যাচাই প্রয়োজন'
                        : 'Phone number verification required'}
                    </p>
                  </div>
                )}
                {availability.requiresVerification.address && (
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 mt-2 rounded-full bg-yellow-600 flex-shrink-0" aria-hidden="true"></div>
                    <p className="text-sm text-yellow-800">
                      {language === 'bn' 
                        ? 'ঠিকানা যাচাই প্রয়োজন'
                        : 'Address verification required'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COD Fee */}
          {availability.fee > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">
                  {language === 'bn' ? 'ক্যাশ অন ডেলিভারি ফি' : 'COD Fee'}
                </span>
                <span className="text-lg font-semibold text-gray-900">
                  {formatCurrency(availability.fee)}
                </span>
              </div>
            </div>
          )}

          {/* Free COD */}
          {availability.fee === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" aria-hidden="true" />
                <span className="text-sm font-medium text-green-800">
                  {language === 'bn' ? 'বিনামূল্যে ক্যাশ অন ডেলিভারি!' : 'Free Cash on Delivery!'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* COD Not Available */}
      {!isLoading && !error && availability && !availability.available && (
        <div className="p-4">
          {/* Unavailable Message */}
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-semibold text-red-900">
                  {language === 'bn' ? 'ক্যাশ অন ডেলিভারি উপলব্ধ নয়' : 'Cash on Delivery Not Available'}
                </p>
                {availability.reason && (
                  <p className="text-sm text-red-700 mt-1">
                    {availability.reason}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Alternative Payment Methods */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <p className="text-sm text-gray-700">
              {language === 'bn' 
                ? 'অন্য পেমেন্ট পদ্ধতি ব্যবহার করুন যেমন বিকাশ, নগদ, রকেট, বা ব্যাংক ট্রান্সফার।'
                : 'Please use alternative payment methods such as bKash, Nagad, Rocket, or bank transfer.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodAvailabilityIndicator;
