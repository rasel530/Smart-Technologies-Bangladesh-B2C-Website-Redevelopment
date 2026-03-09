/**
 * Payment Method Selection Page
 * Phase 7 Milestone 2: Payment Gateway Integration
 * Main page for selecting payment method during checkout
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePayment } from '@/contexts/PaymentContext';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { PaymentMethodCard } from '@/components/checkout/PaymentMethodCard';
import { PaymentMethod } from '@/types/payment';
import styles from '@/styles/checkout/PaymentMethodSelection.module.css';

/**
 * Payment Method Selection Page Component
 */
export default function PaymentMethodSelectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    selectedMethod,
    setSelectedMethod,
    orderId,
    setOrderId,
    amount,
    setAmount,
    initiatePayment,
    isLoading,
    error,
    clearError,
  } = usePayment();

  const { methods, isLoading: isLoadingMethods, error: methodsError, refetch } = usePaymentMethods();
  const [localAmount, setLocalAmount] = useState<number>(0);
  const [orderIdParam, setOrderIdParam] = useState<string>('');

  // Get order details from URL params
  useEffect(() => {
    const orderIdFromUrl = searchParams.get('orderId');
    const amountFromUrl = searchParams.get('amount');

    if (orderIdFromUrl) {
      setOrderIdParam(orderIdFromUrl);
      setOrderId(orderIdFromUrl);
    }

    if (amountFromUrl) {
      const parsedAmount = parseFloat(amountFromUrl);
      if (!isNaN(parsedAmount)) {
        setLocalAmount(parsedAmount);
        setAmount(parsedAmount);
      }
    }
  }, [searchParams, setOrderId, setAmount]);

  // Redirect if no order ID
  useEffect(() => {
    if (!orderIdParam && !orderId) {
      console.warn('[PaymentMethodSelection] No order ID provided, redirecting to checkout');
      router.push('/checkout');
    }
  }, [orderIdParam, orderId, router]);

  /**
   * Handle payment method selection
   */
  const handleMethodSelect = (method: PaymentMethod) => {
    clearError();
    setSelectedMethod(method);
  };

  /**
   * Handle continue button click
   */
  const handleContinue = async () => {
    if (!selectedMethod) {
      return;
    }

    try {
      await initiatePayment();
    } catch (err) {
      console.error('[PaymentMethodSelection] Error initiating payment:', err);
    }
  };

  /**
   * Handle back button click
   */
  const handleBack = () => {
    router.push('/checkout');
  };

  /**
   * Handle retry when loading methods fails
   */
  const handleRetry = () => {
    refetch();
  };

  // Show loading state while fetching payment methods
  if (isLoadingMethods) {
    return (
      <div className={styles.paymentMethodSelection}>
        <div className={styles.globalLoadingSpinner}>
          <div className={styles.loadingSpinner} />
          <p className={styles.globalLoadingText}>Loading payment methods...</p>
        </div>
      </div>
    );
  }

  // Show error state if payment methods failed to load
  if (methodsError && methods.length === 0) {
    return (
      <div className={styles.paymentMethodSelection}>
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>⚠️</div>
          <h2 className={styles.emptyStateTitle}>Unable to Load Payment Methods</h2>
          <p className={styles.emptyStateMessage}>
            We couldn't load the available payment methods. Please try again.
          </p>
          <div className={styles.buttonContainer}>
            <button onClick={handleRetry} className={styles.retryButton}>
              Retry
            </button>
            <button onClick={handleBack} className={styles.backButton}>
              ← Back to Checkout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no payment methods available
  if (methods.length === 0) {
    return (
      <div className={styles.paymentMethodSelection}>
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>💳</div>
          <h2 className={styles.emptyStateTitle}>No Payment Methods Available</h2>
          <p className={styles.emptyStateMessage}>
            There are currently no payment methods available. Please contact support.
          </p>
          <div className={styles.buttonContainer}>
            <button onClick={handleBack} className={styles.backButton}>
              ← Back to Checkout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.paymentMethodSelection}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Select Payment Method</h1>
        <p className={styles.subtitle}>Choose your preferred payment method to complete your order</p>
      </header>

      {/* Order Summary */}
      {(amount > 0 || localAmount > 0) && (
        <div className={styles.orderSummary} role="region" aria-label="Order summary">
          <h2 className={styles.orderSummaryTitle}>Order Summary</h2>
          <div className={styles.orderSummaryRow}>
            <span className={styles.orderSummaryLabel}>Order ID:</span>
            <span className={styles.orderSummaryValue}>{orderId || orderIdParam || 'N/A'}</span>
          </div>
          <div className={styles.orderSummaryRow}>
            <span className={styles.orderSummaryLabel}>Subtotal:</span>
            <span className={styles.orderSummaryValue}>
              ৳{((amount || localAmount) * 0.95).toFixed(2)}
            </span>
          </div>
          <div className={styles.orderSummaryRow}>
            <span className={styles.orderSummaryLabel}>Shipping:</span>
            <span className={styles.orderSummaryValue}>৳{((amount || localAmount) * 0.05).toFixed(2)}</span>
          </div>
          <div className={styles.orderSummaryTotal}>
            <div className={styles.orderSummaryRow}>
              <span className={styles.orderSummaryLabel}>Total Amount:</span>
              <span className={styles.orderSummaryValue}>
                ৳{(amount || localAmount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods Section */}
      <section aria-labelledby="payment-methods-heading">
        <h2 id="payment-methods-heading" className={styles.sectionTitle}>
          Available Payment Methods
        </h2>
        <p className={styles.sectionSubtitle}>
          Select a payment method to proceed with your payment
        </p>

        {/* Error Message */}
        {error && (
          <div className={styles.errorMessage} role="alert" aria-live="polite">
            {error}
          </div>
        )}

        {/* Payment Methods Grid */}
        <div className={styles.paymentMethodGrid} role="radiogroup" aria-label="Payment methods">
          {methods.map((method) => (
            <PaymentMethodCard
              key={method.method}
              method={method}
              isSelected={selectedMethod === method.method}
              onSelect={() => handleMethodSelect(method.method)}
              disabled={!method.isAvailable}
            />
          ))}
        </div>
      </section>

      {/* Action Buttons */}
      <div className={styles.buttonContainer}>
        <button
          onClick={handleBack}
          className={styles.backButton}
          aria-label="Go back to checkout"
        >
          ← Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!selectedMethod || isLoading}
          className={styles.continueButton}
          aria-label={`Continue with ${selectedMethod} payment`}
        >
          {isLoading ? (
            <>
              <div className={styles.loadingSpinner} style={{ width: 20, height: 20, borderWidth: 2 }} />
              Processing...
            </>
          ) : (
            `Continue with ${selectedMethod ? methods.find(m => m.method === selectedMethod)?.name || 'Payment' : 'Payment'} →`
          )}
        </button>
      </div>

      {/* Security Notice */}
      <div style={{ marginTop: '2rem', textAlign: 'center', color: '#666666', fontSize: '0.875rem' }}>
        <p>🔒 Your payment information is secure and encrypted</p>
        <p style={{ marginTop: '0.5rem' }}>
          By proceeding, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
