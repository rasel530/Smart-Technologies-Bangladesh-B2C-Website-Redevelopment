'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Truck, AlertCircle, Clock } from 'lucide-react';
import { CodAvailabilityProps, CodAvailabilityResult, COD_CONSTANTS } from '@/types/cod';
import { checkCodAvailability } from '@/lib/api/cod';
import { cn } from '@/lib/utils';

/**
 * CodAvailability Component
 * Displays COD availability status for a given address and amount
 */
const CodAvailability: React.FC<CodAvailabilityProps> = ({
  address,
  amount,
  onAvailabilityChange,
  language = 'en',
  className,
  showDeliveryInfo = true
}) => {
  const [availability, setAvailability] = useState<CodAvailabilityResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch COD availability when address or amount changes
  useEffect(() => {
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
        console.error('[CodAvailability] Error checking COD availability:', err);
        setError('Failed to check COD availability');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [address, amount]);

  const formatCurrency = (value: number): string => {
    return `৳${value.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
  };

  const getDivisionName = (division: string): string => {
    if (language === 'bn') {
      return COD_CONSTANTS.DIVISION_NAMES_BN[division as keyof typeof COD_CONSTANTS.DIVISION_NAMES_BN] || division;
    }
    return COD_CONSTANTS.DIVISION_NAMES[division as keyof typeof COD_CONSTANTS.DIVISION_NAMES] || division;
  };

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-200">
        <Truck className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">
          {language === 'bn' ? 'ক্যাশ অন ডেলিভারি উপলব্ধতা' : 'COD Availability'}
        </h2>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-blue-600 border-t-transparent border-opacity-25"></div>
          <p className="text-sm text-gray-600 mt-2">
            {language === 'bn' ? 'উপলব্ধতা পরীক্ষা করা হচ্ছে...' : 'Checking availability...'}
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 m-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">
              {language === 'bn' ? 'ত্রুটি' : 'Error'}
            </p>
          </div>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* COD Available */}
      {!isLoading && !error && availability && availability.available && (
        <div className="p-4">
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
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
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">
                  {language === 'bn' ? 'ডেলিভারি তথ্য' : 'Delivery Information'}
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">
                    {language === 'bn' ? 'আনুমানিত ডেলিভারি সময়' : 'Estimated Delivery'}
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
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-900">
                  {language === 'bn' ? 'যাচাইকরণ প্রয়োজন' : 'Verification Required'}
                </h3>
              </div>
              <div className="space-y-2">
                {availability.requiresVerification.phone && (
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 mt-2 rounded-full bg-yellow-600 flex-shrink-0"></div>
                    <p className="text-sm text-yellow-800">
                      {language === 'bn' 
                        ? 'ফোন নম্বর যাচাই প্রয়োজন'
                        : 'Phone number verification required'}
                    </p>
                  </div>
                )}
                {availability.requiresVerification.address && (
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 mt-2 rounded-full bg-yellow-600 flex-shrink-0"></div>
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
        </div>
      )}

      {/* COD Not Available */}
      {!isLoading && !error && availability && !availability.available && (
        <div className="p-4">
          {/* Unavailable Message */}
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
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

export default CodAvailability;
