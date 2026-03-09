/**
 * bKash Payment Component
 * Phase 7 Milestone 2: Payment Gateway Integration
 * Handles bKash mobile wallet payment interface
 */

import React, { useState, useEffect } from 'react';
import { PaymentGatewayProps } from '@/types/payment';
import { PaymentGatewayBase } from './PaymentGatewayBase';
import { useBkashPayment } from '@/hooks/usePaymentGateway';
import styles from '@/styles/checkout/BkashPayment.module.css';

/**
 * bKash Payment Component
 */
export const BkashPayment: React.FC<PaymentGatewayProps> = ({
  orderId,
  amount,
  onPaymentSuccess,
  onPaymentError,
  onCancel,
  currency = 'BDT',
}) => {
  const { createPayment, isLoading, error, success, transactionId, reset } = useBkashPayment();
  
  const [walletNumber, setWalletNumber] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [validationError, setValidationError] = useState('');

  // Validate wallet number format
  const validateWalletNumber = (number: string): boolean => {
    const cleanedNumber = number.replace(/\D/g, '');
    return cleanedNumber.length === 11 && cleanedNumber.startsWith('01');
  };

  // Handle payment success
  useEffect(() => {
    if (success && !isLoading) {
      const timer = setTimeout(() => {
        onPaymentSuccess(transactionId || 'N/A');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, isLoading, transactionId, onPaymentSuccess]);

  // Handle payment error
  useEffect(() => {
    if (error) {
      onPaymentError(error);
    }
  }, [error, onPaymentError]);

  const handleWalletNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 11);
    setWalletNumber(value);
    setValidationError('');
  };

  const handleConfirm = async () => {
    if (!validateWalletNumber(walletNumber)) {
      setValidationError('Please enter a valid bKash wallet number (01XXXXXXXXX)');
      return;
    }

    try {
      const result = await createPayment({
        orderId,
        walletNumber,
        amount,
        returnUrl: window.location.href,
        cancelUrl: `${window.location.origin}/checkout/payment/cancel`,
      });

      if (result.success && result.bkashURL) {
        // Redirect to bKash app or show PIN modal
        window.location.href = result.bkashURL;
      }
    } catch (err) {
      console.error('bKash payment error:', err);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin.length !== 5) {
      setValidationError('Please enter a valid 5-digit PIN');
      return;
    }

    if (!transactionId) {
      setValidationError('Payment session expired. Please try again.');
      return;
    }

    try {
      await createPayment({
        orderId,
        walletNumber,
        amount,
        returnUrl: window.location.href,
        cancelUrl: `${window.location.origin}/checkout/payment/cancel`,
      });
    } catch (err) {
      console.error('bKash PIN submission error:', err);
    }
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  const formatAmount = (value: number): string => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  if (showPinModal) {
    return (
      <div className={styles.pinModal}>
        <div className={styles.pinModalContent}>
          <div className={styles.pinModalHeader}>
            <div className={styles.bkashLogo}>
              <span className={styles.bkashIcon}>b</span>
            </div>
            <h2>Enter bKash PIN</h2>
            <p className={styles.pinModalDescription}>
              Enter your 5-digit bKash PIN to complete the payment
            </p>
          </div>

          {error && (
            <div className={styles.errorMessage} role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handlePinSubmit} className={styles.pinForm}>
            <div className={styles.amountDisplay}>
              <span className={styles.amountLabel}>Amount</span>
              <span className={styles.amountValue}>{formatAmount(amount)}</span>
            </div>

            <div className={styles.walletDisplay}>
              <span className={styles.walletLabel}>Wallet Number</span>
              <span className={styles.walletValue}>{walletNumber}</span>
            </div>

            <div className={styles.pinInputContainer}>
              <label htmlFor="bkashPin" className={styles.pinLabel}>
                bKash PIN
              </label>
              <input
                type="password"
                id="bkashPin"
                name="bkashPin"
                value={pin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').substring(0, 5);
                  setPin(value);
                  setValidationError('');
                }}
                placeholder="*****"
                maxLength={5}
                className={`${styles.pinInput} ${
                  validationError ? styles.inputError : ''
                }`}
                aria-invalid={!!validationError}
                aria-describedby="pinError"
                autoFocus
              />
              {validationError && (
                <p id="pinError" className={styles.errorMessage} role="alert">
                  {validationError}
                </p>
              )}
            </div>

            <div className={styles.pinModalActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => {
                  setShowPinModal(false);
                  setPin('');
                  setValidationError('');
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.confirmButton}
                disabled={pin.length !== 5 || isLoading}
              >
                {isLoading ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </form>

          <div className={styles.securityNotice}>
            <svg
              className={styles.securityIcon}
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
            <p>Your payment is secure and encrypted</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PaymentGatewayBase
      title="bKash Payment"
      description="Pay securely with your bKash mobile wallet"
      orderId={orderId}
      amount={amount}
      onPaymentSuccess={onPaymentSuccess}
      onPaymentError={onPaymentError}
      onCancel={handleCancel}
      isLoading={isLoading}
      error={error}
      success={success}
      currency={currency}
    >
      <div className={styles.bkashContainer}>
        {/* bKash Branding */}
        <div className={styles.bkashBranding}>
          <div className={styles.bkashLogo}>
            <span className={styles.bkashIcon}>b</span>
            <span className={styles.bkashText}>bKash</span>
          </div>
          <p className={styles.bkashTagline}>Mobile Financial Service</p>
        </div>

        {/* Payment Amount Display */}
        <div className={styles.amountDisplay}>
          <span className={styles.amountLabel}>Payment Amount</span>
          <span className={styles.amountValue}>{formatAmount(amount)}</span>
        </div>

        {/* Wallet Number Input */}
        <div className={styles.walletInputSection}>
          <label htmlFor="walletNumber" className={styles.label}>
            bKash Wallet Number
          </label>
          <input
            type="tel"
            id="walletNumber"
            name="walletNumber"
            value={walletNumber}
            onChange={handleWalletNumberChange}
            placeholder="01XXXXXXXXX"
            maxLength={11}
            className={`${styles.input} ${
              validationError ? styles.inputError : ''
            }`}
            aria-invalid={!!validationError}
            aria-describedby="walletNumberError"
            autoFocus
          />
          {validationError && (
            <p id="walletNumberError" className={styles.errorMessage} role="alert">
              {validationError}
            </p>
          )}
          <p className={styles.inputHint}>
            Enter your 11-digit bKash wallet number starting with 01
          </p>
        </div>

        {/* Confirmation Checkbox */}
        <div className={styles.confirmationSection}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className={styles.checkbox}
            />
            <span className={styles.checkboxText}>
              I confirm that I want to pay {formatAmount(amount)} using bKash
            </span>
          </label>
        </div>

        {/* Terms and Conditions */}
        <div className={styles.termsSection}>
          <details className={styles.termsDetails}>
            <summary className={styles.termsSummary}>
              Terms and Conditions
            </summary>
            <div className={styles.termsContent}>
              <ul className={styles.termsList}>
                <li>
                  By proceeding with this payment, you agree to bKash's terms of
                  service
                </li>
                <li>
                  Ensure you have sufficient balance in your bKash wallet
                </li>
                <li>
                  You will be redirected to the bKash app to complete the payment
                </li>
                <li>
                  Payment confirmation will be sent to your registered mobile number
                </li>
                <li>
                  For any issues, contact bKash customer care at 16247
                </li>
              </ul>
            </div>
          </details>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <button
            type="button"
            className={styles.backButton}
            onClick={handleCancel}
            disabled={isLoading}
          >
            Back
          </button>
          <button
            type="button"
            className={styles.confirmButton}
            onClick={handleConfirm}
            disabled={!isConfirmed || !validateWalletNumber(walletNumber) || isLoading}
          >
            {isLoading ? 'Processing...' : 'Proceed to Pay'}
          </button>
        </div>

        {/* Security Notice */}
        <div className={styles.securityNotice}>
          <svg
            className={styles.securityIcon}
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
          <p>
            Your payment is secure and processed through bKash's encrypted payment
            gateway
          </p>
        </div>

        {/* bKash Support */}
        <div className={styles.supportSection}>
          <p className={styles.supportText}>
            Need help? Contact bKash support:
          </p>
          <a href="tel:16247" className={styles.supportLink}>
            16247
          </a>
        </div>
      </div>
    </PaymentGatewayBase>
  );
};

export default BkashPayment;
