/**
 * Payment Fee Display Component
 *
 * Displays payment fee information including processing fee, percentage fee,
 * and total amount for a given payment method and amount.
 */

import React, { useState, useEffect } from 'react';
import { calculatePaymentFee } from '@/lib/api/localPayment';
import { LOCAL_PAYMENT_CONSTANTS } from '@/types/localPayment';

interface PaymentFeeDisplayProps {
  amount: number;
  methodCode: string;
  language?: 'en' | 'bn';
  className?: string;
}

interface FeeBreakdown {
  amount: number;
  processingFee: number;
  processingFeePercent: number;
  percentageFee: number;
  totalFee: number;
  totalAmount: number;
}

const PaymentFeeDisplay: React.FC<PaymentFeeDisplayProps> = ({
  amount,
  methodCode,
  language = 'en',
  className = ''
}) => {
  const [feeBreakdown, setFeeBreakdown] = useState<FeeBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFee = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await calculatePaymentFee(amount, methodCode);
        setFeeBreakdown(response.data);
      } catch (err) {
        console.error('[PaymentFeeDisplay] Error calculating fee:', err);
        setError(
          language === 'bn'
            ? 'ফি হিসাব করতে ব্যর্থ হয়েছে'
            : 'Failed to calculate fee'
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadFee();
  }, [amount, methodCode, language]);

  const formatCurrency = (value: number) => {
    return `${LOCAL_PAYMENT_CONSTANTS.DEFAULT_CURRENCY} ${value.toLocaleString('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  if (isLoading) {
    return (
      <div className={`payment-fee-display payment-fee-display--loading ${className}`}>
        <div className="payment-fee-display__loader">
          <div className="payment-fee-display__spinner" />
          <p className="payment-fee-display__loading-text">
            {language === 'bn' ? 'ফি হিসাব হচ্ছে...' : 'Calculating fee...'}
          </p>
        </div>
      </div>
    );
  }

  if (error || !feeBreakdown) {
    return (
      <div className={`payment-fee-display payment-fee-display--error ${className}`}>
        <div className="payment-fee-display__error">
          <svg
            className="payment-fee-display__error-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="payment-fee-display__error-text">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`payment-fee-display ${className}`}>
      <h2 className="payment-fee-display__title">
        {language === 'bn' ? 'পেমেন্ট ফি' : 'Payment Fee'}
      </h2>

      <div className="payment-fee-display__breakdown">
        <div className="payment-fee-display__row">
          <span className="payment-fee-display__label">
            {language === 'bn' ? 'পরিমাণ:' : 'Amount:'}
          </span>
          <span className="payment-fee-display__value">
            {formatCurrency(feeBreakdown.amount)}
          </span>
        </div>

        {feeBreakdown.processingFee > 0 && (
          <div className="payment-fee-display__row">
            <span className="payment-fee-display__label">
              {language === 'bn' ? 'প্রসেসিং ফি:' : 'Processing Fee:'}
            </span>
            <span className="payment-fee-display__value">
              {formatCurrency(feeBreakdown.processingFee)}
            </span>
          </div>
        )}

        {feeBreakdown.processingFeePercent > 0 && (
          <div className="payment-fee-display__row">
            <span className="payment-fee-display__label">
              {language === 'bn' ? 'শতাংশ ফি:' : 'Percentage Fee:'}
            </span>
            <span className="payment-fee-display__value">
              {formatCurrency(feeBreakdown.percentageFee)}{' '}
              <span className="payment-fee-display__percent">
                ({feeBreakdown.processingFeePercent}%)
              </span>
            </span>
          </div>
        )}

        <div className="payment-fee-display__divider" />

        <div className="payment-fee-display__row payment-fee-display__row--total-fee">
          <span className="payment-fee-display__label">
            {language === 'bn' ? 'মোট ফি:' : 'Total Fee:'}
          </span>
          <span className="payment-fee-display__value payment-fee-display__value--highlight">
            {formatCurrency(feeBreakdown.totalFee)}
          </span>
        </div>

        <div className="payment-fee-display__row payment-fee-display__row--grand-total">
          <span className="payment-fee-display__label">
            {language === 'bn' ? 'মোট পরিমাণ:' : 'Grand Total:'}
          </span>
          <span className="payment-fee-display__value payment-fee-display__value--grand-total">
            {formatCurrency(feeBreakdown.totalAmount)}
          </span>
        </div>
      </div>

      {feeBreakdown.totalFee > 0 && (
        <div className="payment-fee-display__note">
          <svg
            className="payment-fee-display__note-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="payment-fee-display__note-text">
            {language === 'bn'
              ? 'ফি পেমেন্ট পদ্ধতি অনুযায়ী পরিবর্তিত হতে পারে।'
              : 'Fee may vary depending on the payment method.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default PaymentFeeDisplay;
