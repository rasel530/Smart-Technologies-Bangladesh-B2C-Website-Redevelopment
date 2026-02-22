'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, Clock, RefreshCw } from 'lucide-react';
import { CodLimitWarningProps, CodLimitCheckResult, COD_CONSTANTS } from '@/types/cod';
import { checkCodLimit } from '@/lib/api/cod';
import { cn } from '@/lib/utils';

/**
 * CodLimitWarning Component
 * Displays COD limit warnings for a user
 */
const CodLimitWarning: React.FC<CodLimitWarningProps> = ({
  userId,
  language = 'en',
  className,
  showDailyLimit = true,
  showWeeklyLimit = true
}) => {
  const [limitCheck, setLimitCheck] = useState<CodLimitCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch COD limit check when userId changes
  useEffect(() => {
    const fetchLimitCheck = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        setError(null);
        
        const response = await checkCodLimit(userId);
        
        if (response.success && response.data) {
          setLimitCheck(response.data);
        } else {
          setError('Failed to check COD limit');
        }
      } catch (err) {
        console.error('[CodLimitWarning] Error checking COD limit:', err);
        setError('Failed to check COD limit');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLimitCheck();
  }, [userId]);

  const handleRefresh = () => {
    const fetchLimitCheck = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        setError(null);
        
        const response = await checkCodLimit(userId);
        
        if (response.success && response.data) {
          setLimitCheck(response.data);
        } else {
          setError('Failed to check COD limit');
        }
      } catch (err) {
        console.error('[CodLimitWarning] Error checking COD limit:', err);
        setError('Failed to check COD limit');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLimitCheck();
  };

  const getProgressColor = (used: number, total: number): string => {
    const percentage = (used / total) * 100;
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getProgressWidth = (used: number, total: number): number => {
    return Math.min((used / total) * 100, 100);
  };

  if (!userId) {
    return null;
  }

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            {language === 'bn' ? 'ক্যাশ অন ডেলিভারি সীমা' : 'COD Order Limits'}
          </h2>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <RefreshCw className={cn('w-5 h-5', isLoading && 'animate-spin')} />
        </button>
      </div>

      {/* Loading State */}
      {isLoading && !limitCheck && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-blue-600 border-t-transparent border-opacity-25"></div>
          <p className="text-sm text-gray-600 mt-2">
            {language === 'bn' ? 'সীমা পরীক্ষা করা হচ্ছে...' : 'Checking limits...'}
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 m-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">
              {language === 'bn' ? 'ত্রুটি' : 'Error'}
            </p>
          </div>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Limit Check Result */}
      {!isLoading && !error && limitCheck && (
        <div className="p-4">
          {/* Limit Reached */}
          {!limitCheck.withinLimit && limitCheck.reason && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900 mb-2">
                    {language === 'bn' ? 'সীমা অতিক্রম হয়েছে' : 'Limit Exceeded'}
                  </p>
                  <p className="text-sm text-red-700">
                    {limitCheck.reason}
                  </p>
                  <p className="text-sm text-red-700 mt-2">
                    {language === 'bn' 
                      ? 'আপনি এখন ক্যাশ অন ডেলিভারি ব্যবহার করতে পারবেন না। অন্য পেমেন্ট পদ্ধতি ব্যবহার করুন।'
                      : 'You cannot use Cash on Delivery payment at this time. Please use alternative payment methods.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Daily Limit */}
          {showDailyLimit && (
            <div className={cn(
              'border rounded-md p-4 mb-4',
              limitCheck.dailyOrders >= limitCheck.dailyLimit
                ? 'border-red-200 bg-red-50'
                : 'border-gray-200 bg-white'
            )}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">
                    {language === 'bn' ? 'দৈনিক সীমা' : 'Daily Limit'}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {limitCheck.dailyOrders} / {limitCheck.dailyLimit}
                  </p>
                  <p className="text-xs text-gray-500">
                    {language === 'bn' ? 'অর্ডার' : 'orders'}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div
                  className={cn('h-2 rounded-full transition-all duration-300', getProgressColor(limitCheck.dailyOrders, limitCheck.dailyLimit))}
                  style={{ width: `${getProgressWidth(limitCheck.dailyOrders, limitCheck.dailyLimit)}%` }}
                ></div>
              </div>

              {/* Remaining */}
              <div className="flex items-center gap-2 text-sm">
                <Info className="w-4 h-4 text-gray-600" />
                <p className="text-gray-700">
                  {language === 'bn' 
                    ? `অবশিষ্ট: ${limitCheck.dailyLimit - limitCheck.dailyOrders} অর্ডার`
                    : `Remaining: ${limitCheck.dailyLimit - limitCheck.dailyOrders} orders`
                  }
                </p>
              </div>
            </div>
          )}

          {/* Weekly Limit */}
          {showWeeklyLimit && (
            <div className={cn(
              'border rounded-md p-4 mb-4',
              limitCheck.weeklyOrders >= limitCheck.weeklyLimit
                ? 'border-red-200 bg-red-50'
                : 'border-gray-200 bg-white'
            )}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">
                    {language === 'bn' ? 'সাপ্তাহিক সীমা' : 'Weekly Limit'}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {limitCheck.weeklyOrders} / {limitCheck.weeklyLimit}
                  </p>
                  <p className="text-xs text-gray-500">
                    {language === 'bn' ? 'অর্ডার' : 'orders'}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div
                  className={cn('h-2 rounded-full transition-all duration-300', getProgressColor(limitCheck.weeklyOrders, limitCheck.weeklyLimit))}
                  style={{ width: `${getProgressWidth(limitCheck.weeklyOrders, limitCheck.weeklyLimit)}%` }}
                ></div>
              </div>

              {/* Remaining */}
              <div className="flex items-center gap-2 text-sm">
                <Info className="w-4 h-4 text-gray-600" />
                <p className="text-gray-700">
                  {language === 'bn' 
                    ? `অবশিষ্ট: ${limitCheck.weeklyLimit - limitCheck.weeklyOrders} অর্ডার`
                    : `Remaining: ${limitCheck.weeklyLimit - limitCheck.weeklyOrders} orders`
                  }
                </p>
              </div>
            </div>
          )}

          {/* Warnings */}
          {limitCheck.warnings && limitCheck.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-900">
                  {language === 'bn' ? 'সতর্কতা' : 'Warnings'}
                </h3>
              </div>
              <div className="space-y-2">
                {limitCheck.warnings.map((warning, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 mt-2 rounded-full bg-yellow-600 flex-shrink-0"></div>
                    <p className="text-sm text-yellow-800">
                      {warning}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reset Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-900 font-semibold mb-1">
                  {language === 'bn' ? 'সীমা রিসেট তথ্য' : 'Limit Reset Information'}
                </p>
                <p className="text-sm text-blue-700">
                  {language === 'bn' 
                    ? 'দৈনিক সীমা প্রতি দিন মধ্যরাতে রিসেট হয় এবং সাপ্তাহিক সীমা প্রতি রবিবার রিসেট হয়।'
                    : 'Daily limits reset at midnight every day and weekly limits reset every Sunday.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodLimitWarning;
