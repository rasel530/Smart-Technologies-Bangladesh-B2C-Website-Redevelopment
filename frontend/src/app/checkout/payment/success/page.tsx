/**
 * Payment Success Page
 * Phase 7 Milestone 2: Payment Gateway Integration
 * Displayed after successful payment completion
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { paymentApi } from '@/services/paymentApi';
import styles from '@/styles/checkout/PaymentMethodSelection.module.css';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  // Support both snake_case and camelCase parameter names for compatibility
  const transactionId = searchParams.get('transaction_id') || searchParams.get('transactionId');
  const orderId = searchParams.get('order_id') || searchParams.get('orderId');

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    if (!transactionId) {
      setError('Transaction ID not found');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('[PaymentSuccess] Verifying payment:', transactionId);
      
      const response = await paymentApi.verifyPayment(transactionId);
      console.log('[PaymentSuccess] Payment verification response:', response);
      
      if (response.success) {
        setOrderDetails(response.data || response);
        // Clear payment state from localStorage
        localStorage.removeItem('payment_state');
      } else {
        setError(response.message || 'Payment verification failed');
      }
    } catch (err: any) {
      console.error('[PaymentSuccess] Error verifying payment:', err);
      setError(err.message || 'Failed to verify payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewOrder = () => {
    if (orderId) {
      router.push(`/orders/${orderId}`);
    } else {
      router.push('/orders');
    }
  };

  const handleContinueShopping = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className={styles.paymentMethodSelection}>
        <div className={styles.globalLoadingSpinner}>
          <div className={styles.loadingSpinner} />
          <p className={styles.globalLoadingText}>Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.paymentMethodSelection}>
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>⚠️</div>
          <h2 className={styles.emptyStateTitle}>Payment Verification Failed</h2>
          <p className={styles.emptyStateMessage}>{error}</p>
          <div className={styles.buttonContainer}>
            <button onClick={handleViewOrder} className={styles.continueButton}>
              View Orders
            </button>
            <button onClick={handleContinueShopping} className={styles.backButton}>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.paymentMethodSelection}>
      <div className={styles.emptyState} style={{ borderColor: '#4caf50', background: '#e8f5e9' }}>
        <div className={styles.emptyStateIcon}>✅</div>
        <h1 className={styles.title} style={{ color: '#2e7d32' }}>Payment Successful!</h1>
        <p className={styles.subtitle}>
          Thank you for your purchase. Your payment has been processed successfully.
        </p>

        {orderDetails && (
          <div className={styles.orderSummary} style={{ marginTop: '2rem', background: '#ffffff' }}>
            <h2 className={styles.orderSummaryTitle}>Order Details</h2>
            <div className={styles.orderSummaryRow}>
              <span className={styles.orderSummaryLabel}>Order ID:</span>
              <span className={styles.orderSummaryValue}>{orderDetails.orderId || orderId || 'N/A'}</span>
            </div>
            <div className={styles.orderSummaryRow}>
              <span className={styles.orderSummaryLabel}>Transaction ID:</span>
              <span className={styles.orderSummaryValue}>{transactionId}</span>
            </div>
            {orderDetails.amount && (
              <div className={styles.orderSummaryRow}>
                <span className={styles.orderSummaryLabel}>Amount:</span>
                <span className={styles.orderSummaryValue}>৳{orderDetails.amount.toFixed(2)}</span>
              </div>
            )}
            {orderDetails.paymentMethod && (
              <div className={styles.orderSummaryRow}>
                <span className={styles.orderSummaryLabel}>Payment Method:</span>
                <span className={styles.orderSummaryValue}>{orderDetails.paymentMethod}</span>
              </div>
            )}
          </div>
        )}

        <div className={styles.buttonContainer} style={{ marginTop: '2rem' }}>
          <button onClick={handleViewOrder} className={styles.continueButton}>
            View Order Details
          </button>
          <button onClick={handleContinueShopping} className={styles.backButton}>
            Continue Shopping
          </button>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center', color: '#666666', fontSize: '0.875rem' }}>
          <p>A confirmation email has been sent to your registered email address.</p>
          <p style={{ marginTop: '0.5rem' }}>
            If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}
