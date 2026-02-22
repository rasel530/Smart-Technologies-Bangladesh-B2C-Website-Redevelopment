/**
 * Payment Method Card Component
 *
 * Displays a local payment method (bKash, Nagad, Rocket, SureCash) with
 * logo, name, and optional fee information.
 */

import React, { useState, useEffect } from 'react';
import { LocalPaymentMethod, PaymentFeeResult } from '@/types/localPayment';
import { calculatePaymentFee } from '@/lib/api/localPayment';
import { LOCAL_PAYMENT_CONSTANTS } from '@/types/localPayment';

interface PaymentMethodCardProps {
  method: LocalPaymentMethod;
  amount?: number;
  isSelected?: boolean;
  onSelect?: (method: LocalPaymentMethod) => void;
  language?: 'en' | 'bn';
  className?: string;
  showFee?: boolean;
}

const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  method,
  amount,
  isSelected = false,
  onSelect,
  language = 'en',
  className = '',
  showFee = false
}) => {
  const [fee, setFee] = useState<PaymentFeeResult | null>(null);
  const [isLoadingFee, setIsLoadingFee] = useState(false);

  // Calculate fee when amount changes
  useEffect(() => {
    if (showFee && amount && amount > 0) {
      const loadFee = async () => {
        setIsLoadingFee(true);
        try {
          const response = await calculatePaymentFee(amount, method.code);
          setFee(response.data);
        } catch (error) {
          console.error('[PaymentMethodCard] Error calculating fee:', error);
        } finally {
          setIsLoadingFee(false);
        }
      };
      loadFee();
    }
  }, [amount, method.code, showFee]);

  const handleClick = () => {
    if (onSelect) {
      onSelect(method);
    }
  };

  const formatCurrency = (value: number) => {
    return `${LOCAL_PAYMENT_CONSTANTS.DEFAULT_CURRENCY} ${value.toLocaleString('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div
      className={`
        payment-method-card
        ${isSelected ? 'payment-method-card--selected' : ''}
        ${className}
      `}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="payment-method-card__header">
        {method.logoUrl && (
          <img
            src={method.logoUrl}
            alt={method.displayName}
            className="payment-method-card__logo"
          />
        )}
        <div className="payment-method-card__info">
          <h3 className="payment-method-card__name">{method.displayName}</h3>
          <p className="payment-method-card__description">{method.description}</p>
        </div>
      </div>

      <div className="payment-method-card__details">
        <div className="payment-method-card__limits">
          <span className="payment-method-card__limit">
            {language === 'bn' ? 'সর্বনিম্ন:' : 'Min:'} {formatCurrency(method.minAmount)}
          </span>
          <span className="payment-method-card__limit">
            {language === 'bn' ? 'সর্বোচ্চ:' : 'Max:'} {formatCurrency(method.maxAmount)}
          </span>
        </div>

        {showFee && fee && !isLoadingFee && (
          <div className="payment-method-card__fee">
            <span className="payment-method-card__fee-label">
              {language === 'bn' ? 'ফি:' : 'Fee:'}
            </span>
            <span className="payment-method-card__fee-amount">
              {formatCurrency(fee.totalFee)}
            </span>
            <span className="payment-method-card__fee-percent">
              ({fee.processingFeePercent}%)
            </span>
          </div>
        )}

        {showFee && isLoadingFee && (
          <div className="payment-method-card__fee">
            <span className="payment-method-card__fee-loading">
              {language === 'bn' ? 'ফি হিসাব হচ্ছে...' : 'Calculating fee...'}
            </span>
          </div>
        )}
      </div>

      <div className="payment-method-card__networks">
        {method.supportedNetworks.map((network) => (
          <span key={network} className="payment-method-card__network">
            {network}
          </span>
        ))}
      </div>

      {isSelected && (
        <div className="payment-method-card__selected-indicator">
          <svg
            className="payment-method-card__check-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodCard;
