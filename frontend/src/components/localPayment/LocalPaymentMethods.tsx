/**
 * Local Payment Methods Component
 *
 * Displays all available local payment methods (bKash, Nagad, Rocket, SureCash)
 * and allows users to select one for payment.
 */

import React, { useState, useEffect } from 'react';
import { LocalPaymentMethod } from '@/types/localPayment';
import { getLocalPaymentMethods } from '@/lib/api/localPayment';
import PaymentMethodCard from './PaymentMethodCard';

interface LocalPaymentMethodsProps {
  amount?: number;
  selectedMethodCode?: string;
  onMethodSelect?: (method: LocalPaymentMethod) => void;
  language?: 'en' | 'bn';
  className?: string;
  showFee?: boolean;
}

const LocalPaymentMethods: React.FC<LocalPaymentMethodsProps> = ({
  amount,
  selectedMethodCode,
  onMethodSelect,
  language = 'en',
  className = '',
  showFee = false
}) => {
  const [methods, setMethods] = useState<LocalPaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMethods = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getLocalPaymentMethods();
        setMethods(response.data);
      } catch (err) {
        console.error('[LocalPaymentMethods] Error loading payment methods:', err);
        setError(
          language === 'bn'
            ? 'পেমেন্ট পদ্ধতি লোড করতে ব্যর্থ হয়েছে'
            : 'Failed to load payment methods'
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadMethods();
  }, [language]);

  const handleMethodSelect = (method: LocalPaymentMethod) => {
    if (onMethodSelect) {
      onMethodSelect(method);
    }
  };

  if (isLoading) {
    return (
      <div className={`local-payment-methods local-payment-methods--loading ${className}`}>
        <div className="local-payment-methods__loader">
          <div className="local-payment-methods__spinner" />
          <p className="local-payment-methods__loading-text">
            {language === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`local-payment-methods local-payment-methods--error ${className}`}>
        <div className="local-payment-methods__error">
          <svg
            className="local-payment-methods__error-icon"
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
          <p className="local-payment-methods__error-text">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="local-payment-methods__retry-button"
          >
            {language === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  if (methods.length === 0) {
    return (
      <div className={`local-payment-methods local-payment-methods--empty ${className}`}>
        <div className="local-payment-methods__empty">
          <svg
            className="local-payment-methods__empty-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
          <p className="local-payment-methods__empty-text">
            {language === 'bn'
              ? 'বর্তমানে কোনো পেমেন্ট পদ্ধতি উপলব্ধ নেই'
              : 'No payment methods currently available'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`local-payment-methods ${className}`}>
      <h2 className="local-payment-methods__title">
        {language === 'bn' ? 'স্থানীয় পেমেন্ট পদ্ধতি' : 'Local Payment Methods'}
      </h2>

      <div className="local-payment-methods__grid">
        {methods.map((method) => (
          <PaymentMethodCard
            key={method.id}
            method={method}
            amount={amount}
            isSelected={selectedMethodCode === method.code}
            onSelect={handleMethodSelect}
            language={language}
            showFee={showFee}
          />
        ))}
      </div>

      <div className="local-payment-methods__footer">
        <p className="local-payment-methods__footer-text">
          {language === 'bn'
            ? 'সব পেমেন্ট পদ্ধতি বাংলাদেশের নিয়ন্ত্রিত মোবাইল ফিনান্সিয়াল সার্ভিস দ্বারা সমর্থিত।'
            : 'All payment methods are powered by Bangladesh\'s regulated mobile financial services.'}
        </p>
        <div className="local-payment-methods__networks">
          <span className="local-payment-methods__network-label">
            {language === 'bn' ? 'সমর্থিত নেটওয়ার্ক:' : 'Supported networks:'}
          </span>
          <span className="local-payment-methods__network">GP</span>
          <span className="local-payment-methods__network">Robi</span>
          <span className="local-payment-methods__network">Banglalink</span>
          <span className="local-payment-methods__network">Teletalk</span>
        </div>
      </div>
    </div>
  );
};

export default LocalPaymentMethods;
