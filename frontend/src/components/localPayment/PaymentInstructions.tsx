/**
 * Payment Instructions Component
 *
 * Displays step-by-step payment instructions for a local payment method
 * in both English and Bengali.
 */

import React, { useState, useEffect } from 'react';
import { getPaymentInstructions } from '@/lib/api/localPayment';

interface PaymentInstructionsProps {
  methodCode: string;
  language?: 'en' | 'bn';
  className?: string;
}

interface InstructionStep {
  step: number;
  title: string;
  description: string;
}

const PaymentInstructions: React.FC<PaymentInstructionsProps> = ({
  methodCode,
  language = 'en',
  className = ''
}) => {
  const [instructions, setInstructions] = useState<InstructionStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInstructions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getPaymentInstructions(methodCode, language);
        setInstructions(response.data.instructions);
      } catch (err) {
        console.error('[PaymentInstructions] Error loading instructions:', err);
        setError(
          language === 'bn'
            ? 'নির্দেশনা লোড করতে ব্যর্থ হয়েছে'
            : 'Failed to load instructions'
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadInstructions();
  }, [methodCode, language]);

  if (isLoading) {
    return (
      <div className={`payment-instructions payment-instructions--loading ${className}`}>
        <div className="payment-instructions__loader">
          <div className="payment-instructions__spinner" />
          <p className="payment-instructions__loading-text">
            {language === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`payment-instructions payment-instructions--error ${className}`}>
        <div className="payment-instructions__error">
          <svg
            className="payment-instructions__error-icon"
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
          <p className="payment-instructions__error-text">{error}</p>
        </div>
      </div>
    );
  }

  if (instructions.length === 0) {
    return null;
  }

  return (
    <div className={`payment-instructions ${className}`}>
      <h2 className="payment-instructions__title">
        {language === 'bn' ? 'পেমেন্ট নির্দেশনা' : 'Payment Instructions'}
      </h2>
      <div className="payment-instructions__steps">
        {instructions.map((instruction) => (
          <div key={instruction.step} className="payment-instructions__step">
            <div className="payment-instructions__step-number">
              {instruction.step}
            </div>
            <div className="payment-instructions__step-content">
              <h3 className="payment-instructions__step-title">
                {instruction.title}
              </h3>
              <p className="payment-instructions__step-description">
                {instruction.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentInstructions;
