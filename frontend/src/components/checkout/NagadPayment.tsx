/**
 * Nagad Payment Component
 * Phase 7 Milestone 2: Payment Gateway Integration
 * Handles Nagad mobile wallet payment interface
 */

import React, { useState, useEffect } from 'react';
import { PaymentGatewayProps } from '@/types/payment';
import { PaymentGatewayBase } from './PaymentGatewayBase';
import { useNagadPayment } from '@/hooks/usePaymentGateway';
import styles from '@/styles/checkout/NagadPayment.module.css';

/**
 * Nagad Payment Component
 */
export const NagadPayment: React.FC<PaymentGatewayProps> = ({
  orderId,
  amount,
  onPaymentSuccess,
  onPaymentError,
  onCancel,
  currency = 'BDT',
}) => {
  const { initializePayment, isLoading, error, success, transactionId, reset } = useNagadPayment();
  
  const [walletNumber, setWalletNumber] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
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
      setValidationError('Please enter a valid Nagad wallet number (01XXXXXXXXX)');
      return;
    }

    try {
      const result = await initializePayment({
        orderId,
        walletNumber,
        amount,
        returnUrl: window.location.href,
        cancelUrl: `${window.location.origin}/checkout/payment/cancel`,
      });

      if (result.success && result.nagadURL) {
        // Redirect to Nagad app
        window.location.href = result.nagadURL;
      }
    } catch (err) {
      console.error('Nagad payment error:', err);
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

  return (
    <PaymentGatewayBase
      title="Nagad Payment"
      description="Pay securely with your Nagad mobile wallet"
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
      <div className={styles.nagadContainer}>
        {/* Nagad Branding */}
        <div className={styles.nagadBranding}>
          <div className={styles.nagadLogo}>
            <span className={styles.nagadIcon}>N</span>
            <span className={styles.nagadText}>Nagad</span>
          </div>
          <p className={styles.nagadTagline}>Digital Financial Service</p>
        </div>

        {/* Payment Amount Display */}
        <div className={styles.amountDisplay}>
          <span className={styles.amountLabel}>Payment Amount</span>
          <span className={styles.amountValue}>{formatAmount(amount)}</span>
        </div>

        {/* Wallet Number Input */}
        <div className={styles.walletInputSection}>
          <label htmlFor="walletNumber" className={styles.label}>
            Nagad Wallet Number
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
            Enter your 11-digit Nagad wallet number starting with 01
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
              I confirm that I want to pay {formatAmount(amount)} using Nagad
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
                  By proceeding with this payment, you agree to Nagad's terms of
                  service
                </li>
                <li>
                  Ensure you have sufficient balance in your Nagad wallet
                </li>
                <li>
                  You will be redirected to the Nagad app to complete the payment
                </li>
                <li>
                  Payment confirmation will be sent to your registered mobile number
                </li>
                <li>
                  For any issues, contact Nagad customer care at 16116
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
            Your payment is secure and processed through Nagad's encrypted payment
            gateway
          </p>
        </div>

        {/* Nagad Support */}
        <div className={styles.supportSection}>
          <p className={styles.supportText}>
            Need help? Contact Nagad support:
          </p>
          <a href="tel:16116" className={styles.supportLink}>
            16116
          </a>
        </div>

        {/* Additional Information */}
        <div className={styles.infoSection}>
          <h3 className={styles.infoTitle}>Payment Information</h3>
          <ul className={styles.infoList}>
            <li className={styles.infoItem}>
              <span className={styles.infoLabel}>Order ID:</span>
              <span className={styles.infoValue}>{orderId}</span>
            </li>
            <li className={styles.infoItem}>
              <span className={styles.infoLabel}>Amount:</span>
              <span className={styles.infoValue}>{formatAmount(amount)}</span>
            </li>
            <li className={styles.infoItem}>
              <span className={styles.infoLabel}>Wallet:</span>
              <span className={styles.infoValue}>
                {walletNumber || 'Not entered'}
              </span>
            </li>
          </ul>
        </div>

        {/* Payment Steps */}
        <div className={styles.stepsSection}>
          <h3 className={styles.stepsTitle}>How to Pay</h3>
          <ol className={styles.stepsList}>
            <li className={styles.stepItem}>
              <span className={styles.stepNumber}>1</span>
              <span className={styles.stepText}>
                Enter your Nagad wallet number
              </span>
            </li>
            <li className={styles.stepItem}>
              <span className={styles.stepNumber}>2</span>
              <span className={styles.stepText}>
                Confirm the payment amount
              </span>
            </li>
            <li className={styles.stepItem}>
              <span className={styles.stepNumber}>3</span>
              <span className={styles.stepText}>
                You'll be redirected to Nagad app
              </span>
            </li>
            <li className={styles.stepItem}>
              <span className={styles.stepNumber}>4</span>
              <span className={styles.stepText}>
                Enter your PIN to complete payment
              </span>
            </li>
          </ol>
        </div>
      </div>
    </PaymentGatewayBase>
  );
};

export default NagadPayment;
