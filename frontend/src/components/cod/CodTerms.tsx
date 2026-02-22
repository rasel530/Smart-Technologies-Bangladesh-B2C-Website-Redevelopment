'use client';

import React from 'react';
import { FileText, Check, Clock, Shield, AlertTriangle } from 'lucide-react';
import { CodTermsProps, COD_CONSTANTS, CodTermsText } from '@/types/cod';
import { cn } from '@/lib/utils';

/**
 * CodTerms Component
 * Displays COD terms and conditions
 */
const CodTerms: React.FC<CodTermsProps> = ({
  settings,
  language = 'en',
  className,
  showDeliveryInfo = true,
  showLimitInfo = true
}) => {
  const formatCurrency = (value: number): string => {
    return `৳${value.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
  };

  const termsText: CodTermsText = {
    title: language === 'bn' ? 'ক্যাশ অন ডেলিভারি শর্তাবলী' : 'Cash on Delivery Terms & Conditions',
    titleBn: 'ক্যাশ অন ডেলিভারি শর্তাবলী',
    description: language === 'bn' 
      ? 'ক্যাশ অন ডেলিভারি (COD) পেমেন্ট ব্যবহার করার জন্য নিম্নলিখিত শর্তাবলী প্রয়োজনীয়:'
      : 'Please read the following terms and conditions before using Cash on Delivery (COD) payment:',
    descriptionBn: 'ক্যাশ অন ডেলিভারি (COD) পেমেন্ট ব্যবহার করার জন্য নিম্নলিখিত শর্তাবলী প্রয়োজনীয়:',
    points: [
      {
        text: 'Payment must be made in cash upon delivery of the order',
        textBn: 'অর্ডার ডেলিভারির সময় নগদে পেমেন্ট করতে হবে'
      },
      {
        text: 'Ensure someone is available at the delivery address to receive the order and make payment',
        textBn: 'অর্ডার গ্রহণ করতে এবং পেমেন্ট করতে ডেলিভারি ঠিকানায় কাউকে উপস্থিত থাকতে হবে'
      },
      {
        text: 'Delivery person will not wait for more than 10 minutes if no one is available',
        textBn: 'কেউ উপস্থিত না থাকলে ডেলিভারি ব্যক্তি ১০ মিনিটের বেশি অপেক্ষা করবেন না'
      },
      {
        text: 'If payment is refused, the order will be returned to our warehouse',
        textBn: 'পেমেন্ট প্রত্যাখ্যান করলে অর্ডারটি আমাদের গুদামে ফেরত পাঠানো হবে'
      },
      {
        text: 'COD fee may apply for orders below certain amount',
        textBn: 'নির্দিষ্ট পরিমাণের নিচে অর্ডারের জন্য COD ফি প্রয়োজন হতে পারে'
      },
      {
        text: 'COD availability varies by division and delivery location',
        textBn: 'COD উপলব্ধতা বিভাগ এবং ডেলিভারি অবস্থান অনুযায়ী পরিবর্তন হয়'
      },
      {
        text: 'Daily and weekly COD order limits may apply',
        textBn: 'দৈনিক এবং সাপ্তাহিক COD অর্ডার সীমা প্রয়োজন হতে পারে'
      },
      {
        text: 'Phone or address verification may be required for high-value orders',
        textBn: 'উচ্চ মূল্যের অর্ডারের জন্য ফোন বা ঠিকানা যাচাই প্রয়োজন হতে পারে'
      },
      {
        text: 'Delivery time may vary based on location and order volume',
        textBn: 'ডেলিভারি সময় অবস্থান এবং অর্ডার পরিমাণ অনুযায়ী পরিবর্তন হতে পারে'
      },
      {
        text: 'For any issues with COD delivery, contact customer support',
        textBn: 'COD ডেলিভারি সম্পর্কিত কোনো সমস্যা থাকলে গ্রাহক সমর্থনের সাথে যোগাযোগ করুন'
      }
    ]
  };

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-200">
        <FileText className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">
          {termsText.title}
        </h2>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Description */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
          <p className="text-sm text-blue-900">
            {termsText.description}
          </p>
        </div>

        {/* Delivery Info */}
        {showDeliveryInfo && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-900">
                {language === 'bn' ? 'ডেলিভারি তথ্য' : 'Delivery Information'}
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">
                  {language === 'bn' 
                    ? `আনুমানিত ডেলিভারি সময়: ${settings?.deliveryDays || COD_CONSTANTS.DEFAULT_DELIVERY_DAYS} দিন`
                    : `Estimated delivery time: ${settings?.deliveryDays || COD_CONSTANTS.DEFAULT_DELIVERY_DAYS} days`
                  }
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">
                  {language === 'bn' 
                    ? 'ডেলিভারি সময়: সকাল ৯:০০ - সন্ধ্যা ৮:০০'
                    : 'Delivery hours: 9:00 AM - 8:00 PM'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Limit Info */}
        {showLimitInfo && settings && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-900">
                {language === 'bn' ? 'অর্ডার সীমা' : 'Order Limits'}
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-yellow-700">
                  {language === 'bn' ? 'দৈনিক সীমা' : 'Daily Limit'}
                </span>
                <span className="text-sm font-semibold text-yellow-900">
                  {settings.maxDailyOrders} {language === 'bn' ? 'অর্ডার' : 'orders'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-yellow-700">
                  {language === 'bn' ? 'সাপ্তাহিক সীমা' : 'Weekly Limit'}
                </span>
                <span className="text-sm font-semibold text-yellow-900">
                  {settings.maxWeeklyOrders} {language === 'bn' ? 'অর্ডার' : 'orders'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-yellow-700">
                  {language === 'bn' ? 'সর্বনিম্ন পরিমাণ' : 'Minimum Amount'}
                </span>
                <span className="text-sm font-semibold text-yellow-900">
                  {formatCurrency(settings.minAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-yellow-700">
                  {language === 'bn' ? 'সর্বোচ্চ পরিমাণ' : 'Maximum Amount'}
                </span>
                <span className="text-sm font-semibold text-yellow-900">
                  {formatCurrency(settings.maxAmount)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Fee Info */}
        {settings && (
          <div className="bg-purple-50 border border-purple-200 rounded-md p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-purple-900">
                {language === 'bn' ? 'ফি তথ্য' : 'Fee Information'}
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-700">
                  {language === 'bn' ? 'অতিরিক্ত ফি' : 'Additional Fee'}
                </span>
                <span className="text-sm font-semibold text-purple-900">
                  {formatCurrency(settings.additionalFee)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-700">
                  {language === 'bn' ? 'বিনামূল্যে উপরে' : 'Free Above'}
                </span>
                <span className="text-sm font-semibold text-purple-900">
                  {formatCurrency(settings.freeAboveAmount)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Terms & Conditions */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 mb-3">
            {language === 'bn' ? 'শর্তাবলী' : 'Terms & Conditions'}
          </h3>
          {termsText.points.map((point, index) => (
            <div key={index} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">
                {language === 'bn' ? point.textBn : point.text}
              </p>
            </div>
          ))}
        </div>

        {/* Notes */}
        {settings?.notes && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-sm text-gray-700">
              <strong>{language === 'bn' ? 'নোট:' : 'Note:'}</strong> {settings.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodTerms;
