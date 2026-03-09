/**
 * Payment Cancel Page
 * Phase 7 Milestone 2: Payment Gateway Integration
 * Displayed when user cancels payment or payment fails
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { paymentApi } from '@/services/paymentApi';
import styles from '@/styles/checkout/PaymentMethodSelection.module.css';

export default function PaymentCancelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  // Support both snake_case and camelCase parameter names for compatibility
  const transactionId = searchParams.get('transaction_id') || searchParams.get('transactionId');
  const orderId = searchParams.get('order_id') || searchParams.get('orderId');
  const cancelReason = searchParams.get('reason');

  useEffect(() => {
    // If there's a transaction ID, try to cancel the payment
    if (transactionId) {
      cancelPayment();
    } else {
      setIsLoading(false);
    }
  }, [transactionId]);

  const cancelPayment = async () => {
    if (!orderId) {
      setError('Order ID not found');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('[PaymentCancel] Cancelling payment for order:', orderId);
      
      const response = await paymentApi.cancelPayment(orderId);
      console.log('[PaymentCancel] Payment cancel response:', response);
      
      if (response.success) {
        setOrderDetails(response.data || response);
      } else {
        // Don't show error on cancel page, just log it
        console.warn('[PaymentCancel] Payment cancel warning:', response.message);
      }
    } catch (err: any) {
      console.error('[PaymentCancel] Error cancelling payment:', err);
      // Don't show error on cancel page
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryPayment = () => {
    if (orderId) {
      router.push(`/checkout/payment?orderId=${orderId}`);
    } else {
      router.push('/checkout/payment');
    }
  };

  const handleBackToCheckout = () => {
    router.push('/checkout');
  };

  const handleContinueShopping = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className={styles.paymentMethodSelection}>
        <div className={styles.globalLoadingSpinner}>
          <div className={styles.loadingSpinner} />
          <p className={styles.globalLoadingText}>Processing cancellation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.paymentMethodSelection}>
      <div className={styles.emptyState} style={{ borderColor: '#ff9800', background: '#fff3e0' }}>
        <div className={styles.emptyStateIcon}>❌</div>
        <h1 className={styles.title} style={{ color: '#e65100' }}>Payment Cancelled</h1>
        <p className={styles.subtitle}>
          {cancelReason 
            ? `Payment was cancelled: ${cancelReason}`
            : 'Your payment has been cancelled. No charges were made to your account.'}
        </p>

        {orderDetails && (
          <div className={styles.orderSummary} style={{ marginTop: '2rem', background: '#ffffff' }}>
            <h2 className={styles.orderSummaryTitle}>Order Information</h2>
            <div className={styles.orderSummaryRow}>
              <span className={styles.orderSummaryLabel}>Order ID:</span>
              <span className={styles.orderSummaryValue}>{orderDetails.orderId || orderId || 'N/A'}</span>
            </div>
            {orderDetails.amount && (
              <div className={styles.orderSummaryRow}>
                <span className={styles.orderSummaryLabel}>Amount:</span>
                <span className={styles.orderSummaryValue}>৳{orderDetails.amount.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: '2rem', marginBottom: '1.5rem', textAlign: 'center', color: '#666666', fontSize: '0.9375rem' }}>
          <p>Don't worry! Your order is still saved and you can try payment again.</p>
          <p style={{ marginTop: '0.5rem' }}>
            You can choose a different payment method or complete your purchase later.
          </p>
        </div>

        <div className={styles.buttonContainer}>
          <button onClick={handleRetryPayment} className={styles.continueButton}>
            Try Payment Again
          </button>
          <button onClick={handleBackToCheckout} className={styles.backButton}>
            Back to Checkout
          </button>
        </div>

        <div className={styles.buttonContainer} style={{ marginTop: '1rem' }}>
          <button onClick={handleContinueShopping} className={styles.backButton}>
            Continue Shopping
          </button>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center', color: '#666666', fontSize: '0.875rem' }}>
          <p>Need help? Contact our support team for assistance.</p>
        </div>
      </div>
    </div>
  );
}
