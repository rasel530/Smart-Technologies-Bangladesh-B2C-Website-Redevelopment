/**
 * Payment Method Card Component
 * Phase 7 Milestone 2: Payment Gateway Integration
 * Displays individual payment method option with selection state
 */

'use client';

import React from 'react';
import { PaymentMethodOption } from '@/types/payment';
import styles from '@/styles/checkout/PaymentMethodSelection.module.css';

interface PaymentMethodCardProps {
  method: PaymentMethodOption;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
}

/**
 * Payment Method Card Component
 * Displays a payment method with icon, description, and selection state
 */
export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  method,
  isSelected,
  onSelect,
  disabled = false,
  loading = false,
  error,
}) => {
  const isUnavailable = !method.isAvailable || disabled;

  const handleClick = () => {
    if (!isUnavailable && !loading) {
      onSelect();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={`${styles.paymentMethodCard} ${
        isSelected ? styles.selected : ''
      } ${isUnavailable ? styles.disabled : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="radio"
      aria-checked={isSelected}
      aria-disabled={isUnavailable}
      tabIndex={isUnavailable ? -1 : 0}
      aria-label={`Select ${method.name} payment method`}
    >
      {/* Payment Method Icon */}
      <div className={styles.paymentMethodIconContainer}>
        {method.icon ? (
          <img
            src={method.icon}
            alt={`${method.name} logo`}
            className={styles.paymentMethodIcon}
          />
        ) : (
          <div className={styles.paymentMethodIconPlaceholder}>
            {getPaymentMethodIcon(method.method)}
          </div>
        )}
      </div>

      {/* Payment Method Name */}
      <h3 className={styles.paymentMethodName}>{method.name}</h3>

      {/* Payment Method Description */}
      <p className={styles.paymentMethodDescription}>{method.description}</p>

      {/* Payment Method Features */}
      {method.features && method.features.length > 0 && (
        <div className={styles.paymentMethodFeatures}>
          {method.features.map((feature, index) => (
            <span key={index} className={styles.paymentMethodFeature}>
              {feature}
            </span>
          ))}
        </div>
      )}

      {/* Processing Time */}
      {method.processingTime && (
        <div className={styles.paymentMethodProcessingTime}>
          <span className={styles.processingTimeLabel}>Processing Time:</span>{' '}
          <span className={styles.processingTimeValue}>{method.processingTime}</span>
        </div>
      )}

      {/* Fee Display */}
      {method.fee !== undefined && method.fee > 0 && (
        <div className={styles.paymentMethodFee}>
          <span className={styles.feeLabel}>Fee:</span>{' '}
          <span className={styles.feeValue}>৳{method.fee.toFixed(2)}</span>
        </div>
      )}

      {/* Selection Indicator */}
      <div className={styles.selectionIndicator}>
        <div className={`${styles.radioButton} ${isSelected ? styles.radioButtonSelected : ''}`}>
          {isSelected && <div className={styles.radioButtonInner} />}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner} />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className={styles.errorMessage} role="alert" aria-live="polite">
          {error}
        </div>
      )}

      {/* Unavailable Badge */}
      {isUnavailable && (
        <div className={styles.unavailableBadge}>
          Currently Unavailable
        </div>
      )}
    </div>
  );
};

/**
 * Get payment method icon based on method type
 * @param method - The payment method type
 * @returns SVG icon for the payment method
 */
const getPaymentMethodIcon = (method: string): React.ReactNode => {
  switch (method) {
    case 'CREDIT_CARD':
      return (
        <svg
          className={styles.paymentMethodIconSvg}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      );
    case 'BKASH':
      return (
        <svg
          className={styles.paymentMethodIconSvg}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      );
    case 'NAGAD':
      return (
        <svg
          className={styles.paymentMethodIconSvg}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      );
    case 'ROCKET':
      return (
        <svg
          className={styles.paymentMethodIconSvg}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    case 'CASH_ON_DELIVERY':
      return (
        <svg
          className={styles.paymentMethodIconSvg}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      );
    case 'BANK_TRANSFER':
      return (
        <svg
          className={styles.paymentMethodIconSvg}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      );
    default:
      return (
        <svg
          className={styles.paymentMethodIconSvg}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );
  }
};

export default PaymentMethodCard;
