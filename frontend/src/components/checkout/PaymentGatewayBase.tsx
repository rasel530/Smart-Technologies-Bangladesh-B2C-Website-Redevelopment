/**
 * Payment Gateway Base Component
 * Phase 7 Milestone 2: Payment Gateway Integration
 * Common payment interface structure for all payment gateways
 */

import React from 'react';
import { PaymentGatewayProps } from '@/types/payment';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface PaymentGatewayBaseProps extends PaymentGatewayProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  showBackButton?: boolean;
  showCancelButton?: boolean;
  isLoading?: boolean;
  error?: string | null;
  success?: boolean;
  currency?: string;
}

/**
 * Payment Gateway Base Component
 * Provides common structure for all payment gateway interfaces
 */
export const PaymentGatewayBase: React.FC<PaymentGatewayBaseProps> = ({
  children,
  title,
  description,
  orderId,
  amount,
  onPaymentSuccess,
  onPaymentError,
  onCancel,
  showBackButton = true,
  showCancelButton = true,
  isLoading = false,
  error = null,
  success = false,
  currency = 'BDT',
}) => {
  const formatAmount = (value: number): string => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  return (
    <div className="payment-gateway-base">
      {/* Header */}
      <div className="payment-gateway-header">
        <div className="payment-gateway-title-section">
          {showBackButton && (
            <button
              type="button"
              className="payment-gateway-back-button"
              onClick={onCancel}
              aria-label="Go back to payment methods"
            >
              ← Back
            </button>
          )}
          <h1 className="payment-gateway-title">{title}</h1>
          {description && (
            <p className="payment-gateway-description">{description}</p>
          )}
        </div>
      </div>

      {/* Order Summary */}
      <div className="payment-gateway-order-summary">
        <div className="order-summary-header">
          <h2>Order Summary</h2>
        </div>
        <div className="order-summary-content">
          <div className="order-summary-row">
            <span className="order-summary-label">Order ID:</span>
            <span className="order-summary-value">{orderId}</span>
          </div>
          <div className="order-summary-row order-summary-total">
            <span className="order-summary-label">Payment Amount:</span>
            <span className="order-summary-value">{formatAmount(amount)}</span>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="payment-gateway-loading-overlay" role="status" aria-live="polite">
          <LoadingSpinner />
          <p className="payment-gateway-loading-text">Processing payment...</p>
        </div>
      )}

      {/* Success Message */}
      {success && !isLoading && (
        <div
          className="payment-gateway-success-message"
          role="alert"
          aria-live="polite"
        >
          <svg
            className="success-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <p>Payment successful! Redirecting...</p>
        </div>
      )}

      {/* Error Message */}
      {error && !isLoading && !success && (
        <div
          className="payment-gateway-error-message"
          role="alert"
          aria-live="assertive"
        >
          <svg
            className="error-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <p>{error}</p>
        </div>
      )}

      {/* Payment Content */}
      <div className="payment-gateway-content">{children}</div>

      {/* Cancel Button */}
      {showCancelButton && !isLoading && !success && (
        <div className="payment-gateway-footer">
          <button
            type="button"
            className="payment-gateway-cancel-button"
            onClick={onCancel}
            aria-label="Cancel payment"
          >
            Cancel Payment
          </button>
        </div>
      )}

      {/* Security Badge */}
      <div className="payment-gateway-security-badge">
        <svg
          className="security-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span>Secure Payment</span>
      </div>
    </div>
  );
};

export default PaymentGatewayBase;
