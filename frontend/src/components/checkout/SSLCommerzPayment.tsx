/**
 * SSLCommerz Card Payment Component
 * Phase 7 Milestone 2: Payment Gateway Integration
 * Handles SSLCommerz card payment interface
 */

import React, { useState, useEffect } from 'react';
import { PaymentGatewayProps, CardData, CardType } from '@/types/payment';
import { PaymentGatewayBase } from './PaymentGatewayBase';
import { useSSLCommerzPayment } from '@/hooks/usePaymentGateway';
import {
  cardValidation,
  validateCardData,
  getCardTypeInfo,
  getCardIconUrl,
} from '@/utils/cardValidation';
import styles from '@/styles/checkout/SSLCommerzPayment.module.css';

/**
 * SSLCommerz Payment Component
 */
export const SSLCommerzPayment: React.FC<PaymentGatewayProps> = ({
  orderId,
  amount,
  onPaymentSuccess,
  onPaymentError,
  onCancel,
  currency = 'BDT',
}) => {
  const { initiatePayment, isLoading, error, success, reset } = useSSLCommerzPayment();
  
  const [cardData, setCardData] = useState<CardData>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });
  
  const [cardType, setCardType] = useState<CardType>({
    type: 'unknown',
    icon: '💳',
    name: 'Unknown Card',
  });
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [showIframe, setShowIframe] = useState(false);
  const [iframeUrl, setIframeUrl] = useState('');

  // Detect card type when card number changes
  useEffect(() => {
    if (cardData.cardNumber.length >= 4) {
      const detectedType = cardValidation.detectCardType(cardData.cardNumber);
      setCardType(getCardTypeInfo(detectedType));
    } else {
      setCardType({
        type: 'unknown',
        icon: '💳',
        name: 'Unknown Card',
      });
    }
  }, [cardData.cardNumber]);

  // Validate form on card data change
  useEffect(() => {
    const validation = validateCardData(cardData);
    setIsFormValid(validation.isValid);
    
    const errors: Record<string, string> = {};
    validation.errors.forEach(err => {
      errors[err.field] = err.message;
    });
    setValidationErrors(errors);
  }, [cardData]);

  // Handle payment success
  useEffect(() => {
    if (success && !isLoading) {
      const timer = setTimeout(() => {
        onPaymentSuccess(cardType.type === 'unknown' ? 'N/A' : cardType.type);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, isLoading, cardType.type, onPaymentSuccess]);

  // Handle payment error
  useEffect(() => {
    if (error) {
      onPaymentError(error);
    }
  }, [error, onPaymentError]);

  const handleInputChange = (field: keyof CardData, value: string) => {
    let formattedValue = value;
    
    // Format card number with spaces
    if (field === 'cardNumber') {
      formattedValue = cardValidation.formatCardNumber(value);
    }
    
    // Format expiry date
    if (field === 'expiryDate') {
      formattedValue = cardValidation.formatExpiryDate(value);
    }
    
    setCardData(prev => ({
      ...prev,
      [field]: formattedValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateCardData(cardData);
    if (!validation.isValid) {
      const errors: Record<string, string> = {};
      validation.errors.forEach(err => {
        errors[err.field] = err.message;
      });
      setValidationErrors(errors);
      return;
    }
    
    try {
      const result = await initiatePayment(orderId, cardData);
      
      if (result.paymentUrl) {
        // Show SSLCommerz iframe
        setIframeUrl(result.paymentUrl);
        setShowIframe(true);
      }
    } catch (err) {
      console.error('SSLCommerz payment error:', err);
    }
  };

  const handleIframeClose = () => {
    setShowIframe(false);
    setIframeUrl('');
    reset();
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  if (showIframe) {
    return (
      <div className={styles.iframeContainer}>
        <div className={styles.iframeHeader}>
          <h2>Secure Payment</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleIframeClose}
            aria-label="Close payment window"
          >
            ✕
          </button>
        </div>
        <iframe
          src={iframeUrl}
          title="SSLCommerz Payment"
          className={styles.iframe}
          allow="payment"
          aria-label="SSLCommerz payment form"
        />
      </div>
    );
  }

  return (
    <PaymentGatewayBase
      title="Card Payment"
      description="Pay securely with your credit or debit card"
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
      <form onSubmit={handleSubmit} className={styles.cardForm}>
        {/* Card Type Display */}
        <div className={styles.cardTypeDisplay}>
          <span className={styles.cardIcon}>{cardType.icon}</span>
          <span className={styles.cardName}>{cardType.name}</span>
        </div>

        {/* Card Number Input */}
        <div className={styles.formGroup}>
          <label htmlFor="cardNumber" className={styles.label}>
            Card Number
          </label>
          <div className={styles.inputWithIcon}>
            <input
              type="text"
              id="cardNumber"
              name="cardNumber"
              value={cardData.cardNumber}
              onChange={(e) => handleInputChange('cardNumber', e.target.value)}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className={`${styles.input} ${
                validationErrors.cardNumber ? styles.inputError : ''
              }`}
              aria-invalid={!!validationErrors.cardNumber}
              aria-describedby="cardNumberError"
              autoComplete="cc-number"
            />
            {cardType.type !== 'unknown' && (
              <img
                src={getCardIconUrl(cardType.type)}
                alt={cardType.name}
                className={styles.cardTypeIcon}
              />
            )}
          </div>
          {validationErrors.cardNumber && (
            <p id="cardNumberError" className={styles.errorMessage} role="alert">
              {validationErrors.cardNumber}
            </p>
          )}
        </div>

        {/* Expiry Date and CVV */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="expiryDate" className={styles.label}>
              Expiry Date
            </label>
            <input
              type="text"
              id="expiryDate"
              name="expiryDate"
              value={cardData.expiryDate}
              onChange={(e) => handleInputChange('expiryDate', e.target.value)}
              placeholder="MM/YY"
              maxLength={5}
              className={`${styles.input} ${
                validationErrors.expiryDate ? styles.inputError : ''
              }`}
              aria-invalid={!!validationErrors.expiryDate}
              aria-describedby="expiryDateError"
              autoComplete="cc-exp"
            />
            {validationErrors.expiryDate && (
              <p id="expiryDateError" className={styles.errorMessage} role="alert">
                {validationErrors.expiryDate}
              </p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="cvv" className={styles.label}>
              CVV
            </label>
            <div className={styles.inputWithIcon}>
              <input
                type="password"
                id="cvv"
                name="cvv"
                value={cardData.cvv}
                onChange={(e) => handleInputChange('cvv', e.target.value)}
                placeholder={cardType.type === 'amex' ? '1234' : '123'}
                maxLength={cardType.type === 'amex' ? 4 : 3}
                className={`${styles.input} ${
                  validationErrors.cvv ? styles.inputError : ''
                }`}
                aria-invalid={!!validationErrors.cvv}
                aria-describedby="cvvError"
                autoComplete="cc-csc"
              />
              <button
                type="button"
                className={styles.cvvHelpButton}
                aria-label="What is CVV?"
                title="What is CVV?"
              >
                ?
              </button>
            </div>
            {validationErrors.cvv && (
              <p id="cvvError" className={styles.errorMessage} role="alert">
                {validationErrors.cvv}
              </p>
            )}
          </div>
        </div>

        {/* Cardholder Name */}
        <div className={styles.formGroup}>
          <label htmlFor="cardholderName" className={styles.label}>
            Cardholder Name
          </label>
          <input
            type="text"
            id="cardholderName"
            name="cardholderName"
            value={cardData.cardholderName}
            onChange={(e) => handleInputChange('cardholderName', e.target.value)}
            placeholder="John Doe"
            className={`${styles.input} ${
              validationErrors.cardholderName ? styles.inputError : ''
            }`}
            aria-invalid={!!validationErrors.cardholderName}
            aria-describedby="cardholderNameError"
            autoComplete="cc-name"
          />
          {validationErrors.cardholderName && (
            <p id="cardholderNameError" className={styles.errorMessage} role="alert">
              {validationErrors.cardholderName}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={styles.submitButton}
          disabled={!isFormValid || isLoading}
          aria-label="Pay with card"
        >
          {isLoading ? 'Processing...' : `Pay ${new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: currency,
          }).format(amount)}`}
        </button>

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
            Your card information is secure and encrypted. We never store your card details.
          </p>
        </div>
      </form>
    </PaymentGatewayBase>
  );
};

export default SSLCommerzPayment;
